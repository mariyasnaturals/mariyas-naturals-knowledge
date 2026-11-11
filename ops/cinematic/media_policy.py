"""Validate the independently installed cinematic policy, not artifact-supplied trust."""
import json
from pathlib import Path
import re

BASELINE = 'bbb867309e7267d92be751ff952acc7e1adfe123'
BRANCH = 'feature/cinematic-homepage'
ORIGINALS = {
    '/cinematic/homepage-desktop.mp4': ('b86aa80d1ecc5c1dd262ed56c84e3f2f1f708cc562ada05fe26f328baaae0641', 1280, 720),
    '/cinematic/homepage-mobile.mp4': ('faf4c549cedeee848205047ff0062e28b2a7e578a81543b0ff27d1a135589c92', 720, 1280),
    '/cinematic/original-model.jpg': ('0bc3eea1d3aa07d313ca852fe79667ba90d616c4e54b7a49b4afc5711d384a46', 1280, 720),
    '/cinematic/original-product.jpg': ('be1689ee9c89b3fb4bccd07572f9c4a7c56fc8b3e2f6679bee700083dc579b65', 1280, 1108),
}


def validate(policy):
    def require(value):
        if not value:
            raise ValueError('Invalid independent cinematic media policy')
    require(policy['sourcePolicy'] == 'current-approved-in-only')
    require(policy['sourceBranch'] == BRANCH and policy['approvedUiBaseline'] == BASELINE)
    require(policy['cinematicSourcePolicy'] == 'owner-supplied-originals-and-hash-linked-derivatives')
    images = policy['approved_images']
    records = policy['cinematicProvenance']
    by_path = {}
    for r in records:
        require(r['status'] == 'ready' and re.fullmatch(r'/cinematic/[a-z0-9-]+\.(mp4|jpg|jpeg|png|webp)', r['src']))
        require(re.fullmatch('[a-f0-9]{64}', r['sha256']) and images.get(r['src'][1:]) == r['sha256'])
        require(type(r['width']) is int and type(r['height']) is int and min(r['width'], r['height']) > 0)
        require(r.get('originalFilename') and r.get('bytes', 0) > 0)
        previous = by_path.setdefault(r['src'], r)
        require(all(previous[k] == r[k] for k in ['sha256', 'width', 'height', 'source', 'originalFilename']))
    require({n for n in images if n.startswith('cinematic/')} == {n[1:] for n in by_path})
    require({n for n,r in by_path.items() if r['source'] == 'owner-original'} == set(ORIGINALS))
    for path, (digest, width, height) in ORIGINALS.items():
        r = by_path[path]
        require((r['sha256'], r['width'], r['height']) == (digest, width, height))
        if path.endswith('.mp4'):
            require(r['identityAccuracy'] == 'not-asserted' and r['videoDurationSeconds'] == 15)
        else:
            require(r['contentOrigin'] == 'owner-photograph')
    for r in records:
        if r['source'] == 'owner-original':
            continue
        parent = by_path.get(r.get('derivedFrom'))
        require(parent and parent['source'] == 'owner-original' and parent['sha256'] == r.get('sourceSha256'))
        if r['source'] == 'owner-video-frame':
            require(parent['src'].endswith('.mp4') and 0 <= r['frameTimeSeconds'] < 15)
        elif r['source'] == 'owner-photo-mask':
            require(parent['contentOrigin'] == 'owner-photograph' and (r['width'], r['height']) == (parent['width'], parent['height']))
        else:
            require(False)
    return images


def load(path=None):
    return validate(json.loads(Path(path or Path(__file__).with_name('owner-media-policy.json')).read_text()))


def check_inventory(files):
    policy = json.loads(Path(__file__).with_name('owner-media-policy.json').read_text())
    validate(policy)
    for record in policy['cinematicProvenance']:
        item = files.get(record['src'][1:])
        if not item or item['sha256'] != record['sha256'] or item['bytes'] != record['bytes']:
            raise ValueError('Cinematic inventory differs from pinned provenance')
