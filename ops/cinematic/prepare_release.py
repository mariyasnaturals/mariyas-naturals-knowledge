#!/usr/bin/python3
"""Pinned, owner-installed OFFLINE candidate inspector and signer. Never run CI copies."""
import argparse
import contextlib
import json
import os
from pathlib import Path
import re
import shutil
import stat
import subprocess
import tempfile
import zipfile
import pull_deploy as pull

POLICY = Path(__file__).with_name('owner-media-policy.json')
CHECKS = ['types', 'lint', 'unit', 'build', 'static', 'media-policy', 'browser']
BASELINE = 'bbb867309e7267d92be751ff952acc7e1adfe123'


def refuse_ci():
    if os.environ.get('GITHUB_ACTIONS') or os.environ.get('CI'):
        raise ValueError('Owner tools cannot run in CI; use your independently installed local copy')


def policy_images():
    policy = json.loads(POLICY.read_text())
    if policy['sourcePolicy'] != 'current-approved-in-only':
        raise ValueError('Pinned owner media policy is invalid')
    return policy['approved_images']


@contextlib.contextmanager
def artifact_bundle(path):
    if path.is_dir():
        pull.no_symlinks(path / 'review-manifest.json')
        if (path / 'review-manifest.json').stat().st_size > 1024 * 1024:
            raise ValueError('Review manifest too large')
        yield path
        return
    # GitHub's outer artifact ZIP is DATA: extract just two bounded files under fixed safe names.
    pull.no_symlinks(path)
    if not path.is_file() or path.stat().st_size > pull.MAX_ZIP + 2 * 1024 * 1024:
        raise ValueError('Invalid/oversized artifact download')
    with zipfile.ZipFile(path) as z, tempfile.TemporaryDirectory() as temporary:
        members = z.infolist()
        if len(members) > 10 or len({m.filename for m in members}) != len(members) or any(not re.fullmatch(r'[A-Za-z0-9_][A-Za-z0-9_.-]*', m.filename) or stat.S_IFMT(m.external_attr >> 16) not in (0, stat.S_IFREG) or m.flag_bits & 1 for m in members):
            raise ValueError('Unsafe outer artifact ZIP')
        if z.getinfo('review-manifest.json').file_size > 1024 * 1024:
            raise ValueError('Review manifest too large')
        raw = z.read('review-manifest.json')
        name = json.loads(raw)['archive']
        if not re.fullmatch(r'[A-Za-z0-9_-]+\.zip', name) or z.getinfo(name).file_size > pull.MAX_ZIP:
            raise ValueError('Invalid archive name/size')
        folder = Path(temporary)
        (folder / 'review-manifest.json').write_bytes(raw)
        (folder / name).write_bytes(z.read(name))
        yield folder


def validate_candidate(directory):
    """Validate data only, without loading a signing key or executing artifact content."""
    for name in ['manifest.json', 'release.zip']:
        pull.no_symlinks(directory / name)
        if not (directory / name).is_file():
            raise ValueError('Missing regular candidate file')
    if (directory / 'manifest.json').stat().st_size > 1024 * 1024:
        raise ValueError('Manifest too large')
    raw = (directory / 'manifest.json').read_bytes()
    m = json.loads(raw)
    if (m.get('schema') != 1 or m.get('site') != pull.ORIGIN or m.get('branch') != pull.SOURCE_BRANCH or m.get('robots') != 'noindex, nofollow' or m.get('purchasing_enabled') is not False or m.get('media_policy') != 'current-approved-in-only' or m.get('checks') != CHECKS or m.get('approved_ui_baseline') != BASELINE):
        raise ValueError('Candidate policy mismatch')
    if not re.fullmatch('[a-f0-9]{40}', m.get('source_sha', '')) or type(m.get('sequence')) is not int or m['sequence'] < 1:
        raise ValueError('Invalid source/sequence')
    approval = m.get('approval', {})
    if approval.get('method') != 'offline-owner' or not re.fullmatch('[0-9]+', str(approval.get('workflow_run_id', ''))) or type(approval.get('workflow_run_attempt')) is not int or approval['workflow_run_attempt'] < 1:
        raise ValueError('Owner-selected workflow run identity is missing')
    archive = directory / 'release.zip'
    if archive.stat().st_size > pull.MAX_ZIP or pull.digest(archive.read_bytes()) != m['archive_sha256']:
        raise ValueError('Archive checksum/size mismatch')
    expected = {f['path']: f for f in m['files']}
    if not expected or len(expected) != len(m['files']) or any(not pull.valid_name(n) for n in expected):
        raise ValueError('Invalid/duplicate manifest paths')
    images = policy_images()
    if m['approved_images'] != images or any(n not in expected or expected[n]['sha256'] != h for n, h in images.items()):
        raise ValueError('Image inventory differs from independently installed owner policy')
    with zipfile.ZipFile(archive) as z:
        members = z.infolist()
        if len(members) != len(expected) or {x.filename for x in members} != set(expected) or sum(x.file_size for x in members) > pull.MAX_TOTAL:
            raise ValueError('Unsafe archive inventory/size')
        for member in members:
            if stat.S_IFMT(member.external_attr >> 16) not in (0, stat.S_IFREG) or member.is_dir() or member.flag_bits & 1:
                raise ValueError('Unsafe ZIP entry')
            data = z.read(member)
            record = expected[member.filename]
            if len(data) != record['bytes'] or pull.digest(data) != record['sha256']:
                raise ValueError('File checksum mismatch')
            if member.filename.startswith(('images/', 'cinematic/')) and images.get(member.filename) != pull.digest(data):
                raise ValueError('Unapproved image')
            if member.filename.endswith('.html'):
                page = pull.PageCheck()
                page.feed(data.decode('utf-8'))
                if page.robots != 'noindex, nofollow' or not page.canonical or not page.canonical.startswith(pull.ORIGIN + '/') or any(not p.startswith('/') or p[1:] not in images for p in page.images):
                    raise ValueError('Unsafe HTML metadata/images')
        if any(n not in expected for n in ['index.html', 'en/index.html', 'ml/index.html', 'hi/index.html', 'ta/index.html', 'robots.txt']) or z.read('robots.txt').decode() != 'User-agent: *\nDisallow: /\n':
            raise ValueError('Missing languages or staging robots policy')
    return m, pull.digest(raw)


def inspect(bundle, output, source_sha, sequence, run_id, attempt=1):
    if not re.fullmatch('[a-f0-9]{40}', source_sha):
        raise ValueError('Use the exact owner-reviewed source SHA')
    review = json.loads((bundle / 'review-manifest.json').read_text())
    if review['sourceSha'] != source_sha or review['origin'] != pull.ORIGIN or review['robots'] != 'noindex, nofollow' or review['purchasingEnabled'] is not False:
        raise ValueError('Review artifact does not match selected source/staging settings')
    name = review['archive']
    if not re.fullmatch(r'[A-Za-z0-9_-]+\.zip', name):
        raise ValueError('Unsafe review archive filename')
    archive = pull.no_symlinks(bundle / name)
    if not archive.is_file() or archive.stat().st_size > pull.MAX_ZIP or pull.digest(archive.read_bytes()) != review['archiveSha256']:
        raise ValueError('Review archive checksum/size mismatch')
    if output.exists():
        raise ValueError('Use a fresh candidate output directory')
    output.mkdir(mode=0o700)
    shutil.copyfile(archive, output / 'release.zip')
    manifest = {'schema': 1, 'site': review['origin'], 'branch': pull.SOURCE_BRANCH, 'source_sha': source_sha, 'approved_ui_baseline': review['approvedUiBaseline'], 'sequence': sequence, 'robots': review['robots'], 'purchasing_enabled': False, 'media_policy': 'current-approved-in-only', 'checks': CHECKS, 'archive_sha256': review['archiveSha256'], 'approved_images': policy_images(), 'files': review['files'], 'approval': {'method': 'offline-owner', 'workflow_run_id': str(run_id), 'workflow_run_attempt': attempt}}
    (output / 'manifest.json').write_text(json.dumps(manifest, sort_keys=True, separators=(',', ':')) + '\n')
    m, manifest_hash = validate_candidate(output)
    print(json.dumps({'source_sha': source_sha, 'workflow_run_id': run_id, 'workflow_run_attempt': attempt, 'sequence': sequence, 'archive_sha256': m['archive_sha256'], 'manifest_sha256': manifest_hash, 'files': len(m['files']), 'approved_images': len(m['approved_images']), 'status': 'UNSIGNED: review the exact run, source, build and manifest before approval'}, indent=2))
    return manifest_hash


def approve(directory, key, public_key, approved_manifest_hash):
    m, actual = validate_candidate(directory)
    if not re.fullmatch('[a-f0-9]{64}', approved_manifest_hash) or actual != approved_manifest_hash:
        raise ValueError('Explicit approval must match this exact manifest and archive')
    # All artifact bytes are validated BEFORE opening the owner's key. Sign only the reviewed digest.
    pull.regular_owned(key, private=True)
    pull.regular_owned(public_key)
    if directory == key or directory in key.parents or directory in public_key.parents:
        raise ValueError('Keep keys outside the candidate directory')
    if (directory / 'manifest.sig').exists():
        raise ValueError('Candidate is already signed; do not overwrite approval')
    with tempfile.TemporaryDirectory() as temporary:
        sig = Path(temporary) / 'manifest.sig'
        subprocess.run(['openssl', 'pkeyutl', '-sign', '-inkey', str(key), '-rawin', '-in', str(directory / 'manifest.json'), '-out', str(sig)], check=True)
        # Recheck data after the passphrase prompt before releasing any signature.
        if validate_candidate(directory)[1] != approved_manifest_hash:
            raise ValueError('Candidate changed during signing')
        result = subprocess.run(['openssl', 'pkeyutl', '-verify', '-pubin', '-inkey', str(public_key), '-rawin', '-in', str(directory / 'manifest.json'), '-sigfile', str(sig)], capture_output=True)
        if result.returncode:
            raise ValueError('Signature does not match the pinned owner public key')
        with open(directory / 'manifest.sig', 'xb') as output:
            output.write(sig.read_bytes())
    print('OWNER APPROVED exact manifest ' + actual + '; signed data only, not published')


def main():
    refuse_ci()
    os.umask(0o077)
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    p = commands.add_parser('inspect')
    p.add_argument('--bundle', type=Path, required=True)
    p.add_argument('--output', type=Path, required=True)
    p.add_argument('--source-sha', required=True)
    p.add_argument('--sequence', type=int, required=True)
    p.add_argument('--run-id', required=True)
    p.add_argument('--run-attempt', type=int, default=1)
    p = commands.add_parser('approve')
    p.add_argument('--candidate', type=Path, required=True)
    p.add_argument('--key-file', type=Path, required=True)
    p.add_argument('--public-key', type=Path, required=True)
    p.add_argument('--approve-manifest-sha256', required=True)
    args = parser.parse_args()
    if args.command == 'inspect':
        with artifact_bundle(args.bundle.absolute()) as bundle:
            inspect(bundle, args.output.resolve(), args.source_sha, args.sequence, args.run_id, args.run_attempt)
    else:
        approve(args.candidate.resolve(), args.key_file.absolute(), args.public_key.absolute(), args.approve_manifest_sha256)


if __name__ == '__main__':
    main()
