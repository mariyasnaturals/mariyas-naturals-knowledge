#!/usr/bin/python3
"""Fast-forward compiled data to the dedicated branch, using a short-lived Actions token."""
import base64
import os
from pathlib import Path
import shutil
import subprocess
import tempfile


NAMES = ['manifest.json', 'manifest.sig', 'release.zip']

def main():
    source = Path('signed-release').resolve()
    if sorted(p.name for p in source.iterdir()) != NAMES:
        raise SystemExit('Only signed static release data can be published')
    token = os.environ.pop('GH_TOKEN', '')
    if not token:
        raise SystemExit('GitHub Actions publication token is missing')
    env = {k: v for k, v in os.environ.items() if not k.startswith('GIT_')}
    env.update({'GIT_TERMINAL_PROMPT': '0', 'GIT_CONFIG_NOSYSTEM': '1', 'GIT_CONFIG_GLOBAL': '/dev/null', 'GIT_CONFIG_COUNT': '1', 'GIT_CONFIG_KEY_0': 'http.https://github.com/.extraheader', 'GIT_CONFIG_VALUE_0': 'AUTHORIZATION: basic ' + base64.b64encode(('x-access-token:' + token).encode()).decode()})
    publish(source, env)


def publish(source, env, repository='https://github.com/mariyasnaturals/mariyas-naturals-knowledge.git'):
    with tempfile.TemporaryDirectory() as temporary:
        root = Path(temporary)
        def git(*args, allowed=(0,)):
            result = subprocess.run(['git', '-c', 'core.hooksPath=/dev/null', *args], cwd=root, env=env, capture_output=True)
            if result.returncode not in allowed:
                raise SystemExit('Release publication failed (no force-push attempted)')
            return result
        git('init')
        git('config', 'user.name', 'Mariyas validated releases')
        git('config', 'user.email', 'actions@users.noreply.github.com')
        git('remote', 'add', 'origin', repository)
        exists = git('ls-remote', '--exit-code', '--heads', 'origin', 'staging-release', allowed=(0, 2)).returncode == 0
        if exists:
            git('fetch', '--depth=1', 'origin', 'refs/heads/staging-release')
            git('checkout', '-b', 'staging-release', 'FETCH_HEAD')
            # Reject unexpected executables/source on the release branch instead of retaining them.
            tracked = git('ls-files').stdout.decode().splitlines()
            if any(name not in NAMES for name in tracked):
                raise SystemExit('Unexpected content in staging-release branch')
        else:
            git('checkout', '--orphan', 'staging-release')
        for name in NAMES:
            shutil.copyfile(source / name, root / name)
        git('add', '--', *NAMES)
        git('commit', '-m', 'Publish approved validated static staging release')
        git('push', 'origin', 'HEAD:refs/heads/staging-release')
        print('Published signed static data to staging-release; no VPS connection made')


if __name__ == '__main__':
    main()
