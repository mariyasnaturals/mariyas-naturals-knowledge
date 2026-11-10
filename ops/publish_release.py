#!/usr/bin/python3
"""Owner-installed publisher: reverify exact approval, then explicitly push signed DATA only."""
import argparse
import base64
import getpass
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import prepare_release as owner
import pull_deploy as pull

NAMES = ['manifest.json', 'manifest.sig', 'release.zip']
REPOSITORY = 'https://github.com/mariyasnaturals/mariyas-naturals-knowledge.git'


def verify_publication(source, public_key, approved_hash):
    if sorted(p.name for p in source.iterdir()) != NAMES:
        raise ValueError('Only signed static release data can be published')
    for name in NAMES:
        pull.regular_owned(source / name)
    pull.regular_owned(public_key)
    _, actual = owner.validate_candidate(source)
    if actual != approved_hash:
        raise ValueError('Explicit publication approval does not match the manifest')
    result = subprocess.run(['openssl', 'pkeyutl', '-verify', '-pubin', '-inkey', str(public_key), '-rawin', '-in', str(source / 'manifest.json'), '-sigfile', str(source / 'manifest.sig')], capture_output=True)
    if result.returncode:
        raise ValueError('Owner signature verification failed')


def main():
    owner.refuse_ci()
    os.umask(0o077)
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--candidate', type=Path, required=True)
    parser.add_argument('--public-key', type=Path, required=True)
    parser.add_argument('--approve-manifest-sha256', required=True)
    parser.add_argument('--publish', action='store_true', help='Absent means verification/dry-run only')
    args = parser.parse_args()
    source = args.candidate.resolve()
    verify_publication(source, args.public_key.absolute(), args.approve_manifest_sha256)
    print('Verified owner-approved manifest: ' + args.approve_manifest_sha256)
    if not args.publish:
        print('DRY-RUN: no GitHub connection or release publication')
        return
    # Publish an immutable private snapshot of the exact verified bytes, never a moving artifact path.
    with tempfile.TemporaryDirectory() as temporary:
        snapshot = Path(temporary)
        for name in NAMES:
            shutil.copyfile(source / name, snapshot / name)
        verify_publication(snapshot, args.public_key.absolute(), args.approve_manifest_sha256)
        token = getpass.getpass('Owner GitHub fine-grained PAT (selected repo Contents read/write, not saved): ')
        if not token:
            raise ValueError('Missing owner publication credential')
        env = {k: v for k, v in os.environ.items() if not k.startswith('GIT_')}
        env.update({'GIT_TERMINAL_PROMPT': '0', 'GIT_CONFIG_NOSYSTEM': '1', 'GIT_CONFIG_GLOBAL': '/dev/null', 'GIT_CONFIG_COUNT': '1', 'GIT_CONFIG_KEY_0': 'http.https://github.com/.extraheader', 'GIT_CONFIG_VALUE_0': 'AUTHORIZATION: basic ' + base64.b64encode(('x-access-token:' + token).encode()).decode()})
        publish(snapshot, env)


def publish(source, env, repository=REPOSITORY):
    """Transport only; main authenticates/snapshots data before this function. Local Git tests use fixtures."""
    with tempfile.TemporaryDirectory() as temporary:
        root = Path(temporary)
        def git(*args, allowed=(0,)):
            result = subprocess.run(['git', '-c', 'core.hooksPath=/dev/null', *args], cwd=root, env=env, capture_output=True)
            if result.returncode not in allowed:
                raise ValueError('Release publication failed (no force-push attempted)')
            return result
        git('init')
        git('config', 'user.name', 'Mariyas owner-approved releases')
        git('config', 'user.email', 'owner@users.noreply.github.com')
        git('remote', 'add', 'origin', repository)
        exists = git('ls-remote', '--exit-code', '--heads', 'origin', 'staging-release', allowed=(0, 2)).returncode == 0
        if exists:
            git('fetch', '--depth=1', 'origin', 'refs/heads/staging-release')
            # No checkout: repository writers cannot feed symlinks, filters or source to the owner tool.
            tracked = git('ls-tree', '-r', '--name-only', 'FETCH_HEAD').stdout.decode().splitlines()
            if sorted(tracked) != NAMES:
                raise ValueError('Unexpected content in staging-release; owner review required')
            git('symbolic-ref', 'HEAD', 'refs/heads/staging-release')
            git('update-ref', 'refs/heads/staging-release', 'FETCH_HEAD')
            git('read-tree', 'FETCH_HEAD')
        else:
            git('symbolic-ref', 'HEAD', 'refs/heads/staging-release')
        for name in NAMES:
            shutil.copyfile(source / name, root / name)
        git('add', '--', *NAMES)
        git('commit', '-m', 'Publish offline owner-approved signed static release')
        git('push', 'origin', 'HEAD:refs/heads/staging-release')
        print('Published signed static data to staging-release; no VPS connection made')


if __name__ == '__main__':
    main()
