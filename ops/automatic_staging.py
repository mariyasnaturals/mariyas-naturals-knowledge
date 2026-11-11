#!/usr/bin/env python3
"""Poll/apply independently signed .cloud releases; never build/sign or upload source."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import pwd
import re
import stat
import subprocess
import urllib.request

ORIGIN = 'https://www.mariyasnaturals.cloud'
ROOT = '/home/mariyascloud/htdocs/www.mariyasnaturals.cloud'
NAMES = {'pull_deploy.py', 'prepare_release.py', 'publish_release.py', 'media_policy.py', 'owner-media-policy.json'}


def private_file(path):
    path = Path(path)
    if any(p.is_symlink() for p in [path, *path.parents]):
        raise ValueError('Symlinked automation path')
    system_owner = Path('/').stat().st_uid  # Respect UID mapping in managed containers.
    for parent in path.parents:
        info = parent.stat()
        trusted_sticky_root = info.st_uid == system_owner and bool(info.st_mode & stat.S_ISVTX)
        if info.st_uid not in (system_owner, os.geteuid()) or (info.st_mode & 0o022 and not trusted_sticky_root):
            raise ValueError('Unsafe writable automation parent directory')
    info = path.stat()
    if not stat.S_ISREG(info.st_mode) or info.st_uid != os.geteuid() or info.st_mode & 0o077:
        raise ValueError('Expected private owner-controlled file')
    return path


def checked_settings(path):
    cfg = json.loads(private_file(path).read_text())
    if cfg.get('enabled') is not True:
        raise ValueError('Automatic signed-release deployment is disabled')
    pull_config = private_file(cfg['pull_config'])
    pull = json.loads(pull_config.read_text())
    if pull['site'] != ORIGIN or pull['document_root'] != ROOT or pull['enabled'] is not True:
        raise ValueError('Only owner-enabled .cloud staging is permitted')
    state = Path(pull['state_dir'])
    current = json.loads(private_file(state/'current.json').read_text())
    if not current.get('release_commit') or current.get('max_sequence', 0) < 1:
        raise ValueError('First deployment must be authorized and completed manually')
    if (state/'pending.json').exists():
        raise ValueError('Pending transaction requires owner recovery')
    folder = Path(cfg['profile'])
    inventory = private_file(folder/'owner-tools.sha256').read_bytes()
    if hashlib.sha256(inventory).hexdigest() != cfg['profile_checksums_sha256']:
        raise ValueError('Independently approved profile checksum inventory changed')
    records = [line.split() for line in inventory.decode().splitlines()]
    if len(records) != len(NAMES) or {name for digest, name in records} != NAMES:
        raise ValueError('Unexpected trusted tool inventory')
    for digest, name in records:
        if hashlib.sha256(private_file(folder/name).read_bytes()).hexdigest() != digest:
            raise ValueError('Installed trusted profile changed')
    return cfg, pull, current


def purge_cache(cfg):
    cloudflare = cfg.get('cloudflare')
    if not cloudflare:
        return
    zone = cloudflare['zone_id']
    if not re.fullmatch('[a-f0-9]{32}', zone):
        raise ValueError('Invalid Cloudflare zone ID')
    # Explicit .cloud URL list only; never purge the zone or other sites wholesale.
    urls = [ORIGIN+'/', ORIGIN+'/robots.txt', ORIGIN+'/sitemap-index.xml', ORIGIN+'/sitemap-0.xml']
    for page in Path(ROOT).rglob('*.html'):
        path = page.relative_to(ROOT).as_posix()
        if all(re.fullmatch('[A-Za-z0-9_-]+', part) for part in path.removesuffix('/index.html').split('/')) and path.endswith('/index.html'):
            urls.append(ORIGIN+'/'+path.removesuffix('index.html'))
    urls = sorted(set(urls))
    for offset in range(0, len(urls), 30):
        batch = urls[offset:offset+30]
        request = urllib.request.Request(
            f'https://api.cloudflare.com/client/v4/zones/{zone}/purge_cache',
            data=json.dumps({'files': batch}).encode(),
            headers={'Authorization': 'Bearer '+cloudflare['api_token'], 'Content-Type': 'application/json'},
            method='POST',
        )
        with urllib.request.urlopen(request, timeout=30) as response:
            result = json.load(response)
        if result.get('success') is not True:
            raise ValueError('Cloudflare purge failed')



def check_public_site():
    for lang in ['en', 'ml', 'hi', 'ta']:
        request = urllib.request.Request(ORIGIN+'/'+lang+'/', headers={'Cache-Control':'no-cache', 'Accept-Encoding':'identity'})
        with urllib.request.urlopen(request, timeout=30) as response:
            if response.geturl() != ORIGIN+'/'+lang+'/' or response.status != 200:
                raise ValueError('Unexpected staging response')
            data = response.read()
            expected = (Path(ROOT)/lang/'index.html').read_bytes()
            if hashlib.sha256(data).digest() != hashlib.sha256(expected).digest():
                raise ValueError('Public staging bytes do not match installed release')
            html = data.decode()
            if 'noindex, nofollow' not in html:
                raise ValueError('Public staging lost noindex policy')


def run(path):
    if pwd.getpwuid(os.geteuid()).pw_name != 'mariyascloud':
        raise ValueError('Run only as mariyascloud')
    cfg, pull, _ = checked_settings(path)
    # The existing puller alone performs signature, policy, sequence and backup/apply checks.
    subprocess.run(['python3', str(Path(cfg['profile'])/'pull_deploy.py'), '--config', cfg['pull_config'], '--apply'], check=True)
    after = json.loads(private_file(Path(pull['state_dir'])/'current.json').read_text())
    receipt = Path(pull['state_dir'])/'automatic-staging-success.json'
    previous = json.loads(private_file(receipt).read_text()) if receipt.exists() else {}
    if after.get('manifest_sha256') == previous.get('manifest_sha256'):
        print('NO CHANGE: signed staging release already checked')
        return
    purge_cache(cfg)
    check_public_site()
    if json.loads(private_file(Path(pull['state_dir'])/'current.json').read_text()) != after:
        raise ValueError('Release changed during public verification')
    # Write a success receipt only after purge/health checks; failures are retried next poll.
    temp = receipt.with_suffix('.pending')
    if temp.exists() or temp.is_symlink():
        raise ValueError('Existing automation receipt temporary file requires inspection')
    with temp.open('x') as out:
        json.dump({'source_sha':after['source_sha'], 'manifest_sha256':after['manifest_sha256']}, out)
    temp.chmod(0o600)
    temp.replace(receipt)
    print('VERIFIED signed staging release: '+after['source_sha'])


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config', required=True)
    args = parser.parse_args()
    try:
        run(args.config)
    except Exception:
        # Avoid leaking tokens, request headers or credential-bearing URLs to cron logs.
        raise SystemExit('Automatic staging failed; inspect local configuration, signed puller log and public health. No approval gate was bypassed.')
