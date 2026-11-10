#!/usr/bin/python3
"""GitHub-hosted signing step. Never installed/executed by the VPS puller."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile


def prepare(bundle, output, source_sha, sequence, key):
    if not re.fullmatch('[a-f0-9]{40}', source_sha) or sequence < 1:
        raise ValueError('Invalid release identity')
    review = json.loads((bundle / 'review-manifest.json').read_text())
    if review['sourceSha'] != source_sha or review['origin'] != 'https://www.mariyasnaturals.cloud' or review['robots'] != 'noindex, nofollow' or review['purchasingEnabled'] is not False:
        raise ValueError('Review artifact does not match approved source/staging settings')
    archive_name = review['archive']
    if Path(archive_name).name != archive_name:
        raise ValueError('Unsafe review archive name')
    archive = bundle / archive_name
    if hashlib.sha256(archive.read_bytes()).hexdigest() != review['archiveSha256']:
        raise ValueError('Review archive hash mismatch')
    root = Path(__file__).resolve().parent.parent
    approved = {}
    for name in ['media-manifest', 'brand-media']:
        data = json.loads((root / 'src/data' / (name + '.json')).read_text())
        if data['sourcePolicy'] != 'current-approved-in-only':
            raise ValueError('Media source policy mismatch')
        for media in data['media']:
            for derivative in media['derivatives']:
                approved[derivative['localAssetPath'].lstrip('/')] = derivative['sha256']
    files = {x['path']: x for x in review['files']}
    if any(path not in files or files[path]['sha256'] != h for path, h in approved.items()):
        raise ValueError('Approved image inventory mismatch')
    if output.exists():
        raise ValueError('Use a fresh output directory')
    output.mkdir(mode=0o700)
    shutil.copyfile(archive, output / 'release.zip')
    manifest = {'schema': 1, 'site': review['origin'], 'branch': 'feature/authentic-media-typography', 'source_sha': source_sha, 'approved_ui_baseline': review['approvedUiBaseline'], 'sequence': sequence, 'robots': review['robots'], 'purchasing_enabled': False, 'media_policy': 'current-approved-in-only', 'checks': ['types', 'lint', 'unit', 'build', 'static', 'media-policy', 'browser'], 'archive_sha256': review['archiveSha256'], 'approved_images': approved, 'files': review['files']}
    (output / 'manifest.json').write_text(json.dumps(manifest, sort_keys=True, separators=(',', ':')) + '\n')
    subprocess.run(['openssl', 'pkeyutl', '-sign', '-inkey', str(key), '-rawin', '-in', str(output / 'manifest.json'), '-out', str(output / 'manifest.sig')], check=True, capture_output=True)
    print('Signed static release; manifest SHA256=' + hashlib.sha256((output / 'manifest.json').read_bytes()).hexdigest())


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--bundle', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--source-sha', required=True)
    parser.add_argument('--sequence', type=int, required=True)
    args = parser.parse_args()
    secret = os.environ.pop('STAGING_RELEASE_SIGNING_KEY', '')
    if not secret:
        raise SystemExit('Protected environment signing key is missing')
    with tempfile.TemporaryDirectory() as temporary:
        key = Path(temporary) / 'signing.pem'
        key.write_text(secret)
        key.chmod(0o600)
        prepare(args.bundle, args.output, args.source_sha, args.sequence, key)
