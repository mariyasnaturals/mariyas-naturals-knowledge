import hashlib
import json
import os
from pathlib import Path
import re
import shlex
import subprocess

REPOSITORY = 'mariyasnaturals/mariyas-naturals-knowledge'
REPOSITORY_ID = 1451777898
BRANCH = 'feature/cinematic-homepage'
WORKFLOW = '.github/workflows/validate.yml'
WORKFLOW_ID = 412532750
ENVIRONMENT = 'cinematic-staging-auto'
ORIGIN = 'https://www.mariyasnaturals.cloud'
DOCUMENT_ROOT = '/home/mariyascloud/htdocs/www.mariyasnaturals.cloud'
HERO_ORIGIN = 'bf011e1cc395ee3d9b35ec752cbdea55a79f7de1'
MAX_ZIP = 64 * 1024 * 1024
MAX_TOTAL = 128 * 1024 * 1024


def digest(data):
    return hashlib.sha256(data).hexdigest()


def require(condition, reason):
    if not condition:
        raise ValueError(reason)


def valid_sha(value):
    return isinstance(value, str) and re.fullmatch('[a-f0-9]{40}', value) is not None


def safe_name(name):
    return isinstance(name, str) and len(name) < 512 and all(re.fullmatch('[A-Za-z0-9_][A-Za-z0-9_.-]*', p) for p in name.split('/'))


def git(repo, *args):
    return subprocess.check_output(['git', '-c', 'core.hooksPath=/dev/null', '-C', str(repo), *args], stderr=subprocess.PIPE)


# Reviewed botanical release media are hash-pinned like other public files.
BOTANICAL_ROOT = 'public/_botanical-assets/'


def is_ui_file(name):
    # Everything else is CI authority. New tests/scripts/dependencies cannot silently weaken it.
    return name == 'README.md' or name == 'src/data/staging-preview-note.json' or any(name.startswith(p) for p in ['src/components/', 'src/styles/', 'src/i18n/', 'src/pages/'])


def tree_policy(repo, sha):
    require(valid_sha(sha), 'Invalid source SHA')
    records = {}
    for row in git(repo, 'ls-tree', '-rz', sha).split(b'\0'):
        if not row:
            continue
        header, name = row.split(b'\t', 1)
        mode, kind, oid = header.decode().split()
        name = name.decode('utf-8')
        require(all(p not in ('','.','..') and re.fullmatch(r'[A-Za-z0-9_.\[\]-]+',p) for p in name.split('/')) and kind == 'blob' and mode in ('100644', '100755'), 'Source symlink/submodule/unsafe path')
        if not is_ui_file(name):
            records[name] = digest(git(repo, 'cat-file', 'blob', oid))
    return records


def make_trust(repo, sha):
    require(valid_sha(sha), 'Use an independently reviewed immutable commit')
    git(repo,'merge-base','--is-ancestor',HERO_ORIGIN,sha)
    gate = tree_policy(repo, sha)
    public = {name[7:]: {'sha256': value, 'bytes': int(git(repo, 'cat-file', '-s', sha+':'+name))} for name, value in gate.items() if name.startswith('public/')}
    # In this repository the reviewed botanical release set must be complete and pinned.
    if 'src/data/botanical-media.json' in gate:
        botanical = json.loads(git(repo, 'show', sha+':src/data/botanical-media.json'))
        served = {record['localAssetPath'][1:] for record in botanical['media']}
        require(len(served) == 43 and botanical.get('status') == 'owner-approved-reviewed-botanical-release-media', 'Incomplete reviewed botanical release')
        for path in served:
            require(path.startswith(BOTANICAL_ROOT.removeprefix('public/')) and path in public, 'Reviewed botanical media must be pinned in the gate')
        for path in gate:
            require(not path.startswith(BOTANICAL_ROOT) or path.removeprefix('public/') in served, 'Unregistered botanical file in the protected gate')
    require(WORKFLOW in gate and len(public) > 4, 'Incomplete trust source')
    cinematic = json.loads(git(repo, 'show', sha+':src/data/cinematic-assets.json'))
    originals = [*cinematic['videos'].values(), *cinematic['references'].values()]
    return {'original_media': originals, 'schema': 'ci-staging-trust/v1', 'reviewed_commit': sha, 'repository': REPOSITORY, 'repository_id': REPOSITORY_ID, 'branch': BRANCH, 'workflow_id': WORKFLOW_ID, 'workflow': WORKFLOW, 'gate_files': gate, 'public_files': public}


def verify_gate(repo, sha, policy):
    require(policy['schema'] == 'ci-staging-trust/v1' and policy['repository_id'] == REPOSITORY_ID and policy['branch'] == BRANCH, 'Unexpected installed authority')
    require(tree_policy(repo, sha) == policy['gate_files'], 'Protected CI/tool/test/media files changed: a reviewed trust upgrade is required')
    git(repo, 'merge-base', '--is-ancestor', policy['reviewed_commit'], sha)


def fetch_source(cache, owner):
    cache = Path(cache)
    env = {k:v for k,v in os.environ.items() if not k.startswith('GIT_')}
    env.update(GIT_CONFIG_NOSYSTEM='1', GIT_CONFIG_GLOBAL='/dev/null', GIT_TERMINAL_PROMPT='0')
    env['GIT_SSH_COMMAND'] = shlex.join(['ssh', '-i', owner['deploy_key'], '-o', 'IdentitiesOnly=yes', '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes', '-o', 'UserKnownHostsFile='+owner['known_hosts']])
    if not cache.exists():
        subprocess.run(['git','init','--bare',str(cache)], check=True, capture_output=True)
    subprocess.run(['git','-c','core.hooksPath=/dev/null','-c','protocol.file.allow=never','-c','protocol.ext.allow=never','--git-dir='+str(cache),'fetch','--no-tags','git@github.com:'+REPOSITORY+'.git','refs/heads/'+BRANCH+':refs/remotes/origin/'+BRANCH], env=env, check=True, capture_output=True)
    return git(cache, 'rev-parse', 'refs/remotes/origin/'+BRANCH).decode().strip()
