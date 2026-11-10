#!/usr/bin/python3
"""Owner-installed static-file puller. No repository source is checked out or executed."""
import argparse
import fcntl
import hashlib
import html.parser
import json
import os
import pathlib
import pwd
import re
import shutil
import stat
import subprocess
import sys
import tempfile
import time
import zipfile

ORIGIN = 'https://www.mariyasnaturals.cloud'
REPO = 'git@github.com:mariyasnaturals/mariyas-naturals-knowledge.git'
BRANCH = 'staging-release'
SOURCE_BRANCH = 'feature/authentic-media-typography'
MAX_ZIP = 64 * 1024 * 1024
MAX_TOTAL = 128 * 1024 * 1024
EXTENSIONS = {'.html', '.css', '.js', '.json', '.xml', '.txt', '.svg', '.webp', '.woff2'}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def read_json(path, default=None):
    return json.loads(path.read_text()) if path.exists() else default


def atomic_json(path, value):
    temp = path.with_suffix('.tmp')
    temp.write_text(json.dumps(value, indent=2) + '\n')
    temp.chmod(0o600)
    os.replace(temp, path)


def no_symlinks(path):
    path = pathlib.Path(path).absolute()
    for item in [path, *path.parents]:
        if item.is_symlink():
            raise ValueError('Symlink path refused: ' + str(item))
    return path


def regular_owned(path, private=False):
    no_symlinks(path)
    info = path.stat()
    if not stat.S_ISREG(info.st_mode) or info.st_uid != os.geteuid() or info.st_mode & 0o022:
        raise ValueError('Expected owner-controlled regular file: ' + str(path))
    if private and info.st_mode & 0o077:
        raise ValueError('Private file must have mode 0600: ' + str(path))


def config_load(path):
    if pwd.getpwuid(os.geteuid()).pw_name != 'mariyascloud':
        raise ValueError('Run only as mariyascloud; never root or a different site user')
    regular_owned(path, private=True)
    cfg = read_json(path)
    if cfg.get('site') != ORIGIN:
        raise ValueError('Only the .cloud staging site is supported')
    root = no_symlinks(cfg['document_root'])
    state = no_symlinks(cfg['state_dir'])
    if not root.is_absolute() or not root.is_dir() or root == pathlib.Path('/') or root.stat().st_uid != os.geteuid() or root.stat().st_mode & 0o022:
        raise ValueError('Verify an existing site-user-owned document root first')
    # State/backups/scripts/keys must not be anywhere in this served tree, or contain it.
    if state == root or state in root.parents or root in state.parents:
        raise ValueError('State directory must be separate from the document root')
    marker = root / '.mariyas-cloud-root'
    regular_owned(marker, private=True)
    if marker.read_text().strip() != ORIGIN:
        raise ValueError('Document-root confirmation marker does not match .cloud')
    for sentinel in ['wp-config.php', 'wp-admin', 'wp-content', '.git', 'node_modules']:
        if (root / sentinel).exists():
            raise ValueError('Not an isolated Static HTML root: ' + sentinel)
    for name in ['deploy_key', 'known_hosts', 'release_public_key']:
        p = no_symlinks(cfg[name])
        if root == p or root in p.parents:
            raise ValueError('Credential/trust files cannot be public')
        regular_owned(p, private=(name == 'deploy_key'))
    if digest(pathlib.Path(cfg['release_public_key']).read_bytes()) != cfg['release_public_key_sha256']:
        raise ValueError('Pinned release public-key fingerprint changed')
    if state.exists() and (state.stat().st_uid != os.geteuid() or state.stat().st_mode & 0o077):
        raise ValueError('State directory must be owner-only (0700)')
    cfg['_root'], cfg['_state'] = root, state
    return cfg


def static_inventory(root):
    """Do not traverse or modify .well-known or any dotfile/dot-directory."""
    files = {}
    def walk(folder):
        for item in sorted(folder.iterdir()):
            if item.name.startswith('.'):
                continue
            if item.is_symlink():
                raise ValueError('Unexpected symlink in static content: ' + str(item))
            info = item.stat()
            if info.st_uid != os.geteuid() or info.st_mode & 0o022:
                raise ValueError('Static content is not owner controlled: ' + str(item))
            if item.is_dir():
                walk(item)
            elif stat.S_ISREG(info.st_mode):
                if item.suffix.lower() in {'.php', '.py', '.sh', '.rb', '.pl', '.pem', '.key'}:
                    raise ValueError('Unexpected server-side/private file in static root')
                files[item.relative_to(root).as_posix()] = {'sha256': digest(item.read_bytes()), 'bytes': info.st_size, 'mode': stat.S_IMODE(info.st_mode)}
            else:
                raise ValueError('Special file refused')
    walk(root)
    return files


def inventory_hash(files):
    return digest(json.dumps(files, sort_keys=True).encode())


def valid_name(name):
    parts = name.split('/')
    return bool(parts) and all(re.fullmatch(r'[A-Za-z0-9_][A-Za-z0-9_.-]*', p) and p not in {'.', '..'} for p in parts) and pathlib.PurePosixPath(name).suffix in EXTENSIONS


class PageCheck(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.robots = None
        self.canonical = None
        self.images = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'meta' and attrs.get('name') == 'robots':
            self.robots = attrs.get('content')
        if tag == 'link' and attrs.get('rel') == 'canonical':
            self.canonical = attrs.get('href')
        if tag == 'img':
            self.images.append(attrs.get('src', ''))
            self.images.extend(x.strip().split()[0] for x in attrs.get('srcset', '').split(',') if x.strip())


def verify_release(directory, cfg):
    manifest_path = directory / 'manifest.json'
    raw = manifest_path.read_bytes()
    if len(raw) > 1024 * 1024:
        raise ValueError('Manifest too large')
    # Authenticate bytes before trusting any parsed metadata or extracting files.
    result = subprocess.run(['openssl', 'pkeyutl', '-verify', '-pubin', '-inkey', cfg['release_public_key'], '-rawin', '-in', str(manifest_path), '-sigfile', str(directory / 'manifest.sig')], capture_output=True)
    if result.returncode:
        raise ValueError('Release signature verification failed')
    m = json.loads(raw)
    if (m.get('schema') != 1 or m.get('site') != ORIGIN or m.get('branch') != SOURCE_BRANCH or m.get('robots') != 'noindex, nofollow' or m.get('purchasing_enabled') is not False or m.get('media_policy') != 'current-approved-in-only' or m.get('checks') != ['types', 'lint', 'unit', 'build', 'static', 'media-policy', 'browser']):
        raise ValueError('Release policy mismatch')
    if not re.fullmatch('[a-f0-9]{40}', m.get('source_sha', '')) or type(m.get('sequence')) is not int or m['sequence'] < 1:
        raise ValueError('Invalid release identity')
    archive = directory / 'release.zip'
    if archive.stat().st_size > MAX_ZIP or digest(archive.read_bytes()) != m['archive_sha256']:
        raise ValueError('Archive checksum/size mismatch')
    expected = {f['path']: f for f in m['files']}
    if len(expected) != len(m['files']) or not expected or any(not valid_name(n) for n in expected):
        raise ValueError('Invalid/duplicate manifest path')
    approved_images = m['approved_images']
    if not approved_images or any(not n.startswith('images/') or n not in expected or expected[n]['sha256'] != h for n, h in approved_images.items()):
        raise ValueError('Invalid approved image inventory')
    staged = directory / 'site'
    staged.mkdir(mode=0o700)
    with zipfile.ZipFile(archive) as z:
        if len(z.infolist()) != len(expected) or {x.filename for x in z.infolist()} != set(expected):
            raise ValueError('Archive file inventory mismatch')
        if sum(x.file_size for x in z.infolist()) > MAX_TOTAL:
            raise ValueError('Expanded release exceeds size limit')
        for member in z.infolist():
            mode = member.external_attr >> 16
            if not valid_name(member.filename) or stat.S_IFMT(mode) not in (0, stat.S_IFREG) or member.is_dir() or member.flag_bits & 1:
                raise ValueError('Unsafe ZIP entry')
            data = z.read(member)
            record = expected[member.filename]
            if len(data) != record['bytes'] or digest(data) != record['sha256']:
                raise ValueError('File checksum mismatch')
            if member.filename.startswith('images/') and approved_images.get(member.filename) != digest(data):
                raise ValueError('Unapproved image')
            if member.filename.endswith('.html'):
                page = PageCheck()
                page.feed(data.decode('utf-8'))
                if page.robots != 'noindex, nofollow' or not page.canonical or not page.canonical.startswith(ORIGIN + '/'):
                    raise ValueError('Unsafe page metadata')
                if any(not p.startswith('/') or p[1:] not in approved_images for p in page.images):
                    raise ValueError('Image outside approved local inventory')
            path = staged / member.filename
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
            path.chmod(0o644)
    for name in ['index.html', 'en/index.html', 'ml/index.html', 'hi/index.html', 'ta/index.html']:
        if name not in expected:
            raise ValueError('Missing language route')
    if 'Disallow: /' not in (staged / 'robots.txt').read_text():
        raise ValueError('Staging robots policy missing')
    return m, digest(raw), staged


def git_fetch(cfg, directory):
    import shlex
    cache = cfg['_state'] / 'repository.git'
    env = {k: v for k, v in os.environ.items() if not k.startswith('GIT_')}
    env['GIT_CONFIG_NOSYSTEM'] = '1'
    env['GIT_CONFIG_GLOBAL'] = '/dev/null'
    env['GIT_TERMINAL_PROMPT'] = '0'
    env['GIT_SSH_COMMAND'] = shlex.join(['ssh', '-i', cfg['deploy_key'], '-o', 'IdentitiesOnly=yes', '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes', '-o', 'UserKnownHostsFile=' + cfg['known_hosts']])
    def git(*args):
        command = ['git', '-c', 'core.hooksPath=/dev/null', '-c', 'core.fsmonitor=false', '-c', 'protocol.file.allow=never', '-c', 'protocol.ext.allow=never', '--git-dir=' + str(cache), *args]
        result = subprocess.run(command, env=env, capture_output=True)
        if result.returncode:
            raise ValueError('Git operation failed; inspect key/host trust/repository access in Web Console')
        return result.stdout
    if not cache.exists():
        result = subprocess.run(['git', 'init', '--bare', str(cache)], capture_output=True)
        if result.returncode:
            raise ValueError('Cannot initialize local read-only release cache')
        git('remote', 'add', 'origin', REPO)
    git('fetch', '--depth=1', 'origin', 'refs/heads/' + BRANCH + ':refs/remotes/origin/' + BRANCH)
    commit = git('rev-parse', 'refs/remotes/origin/' + BRANCH).decode().strip()
    tree = git('ls-tree', '--name-only', commit).decode().splitlines()
    if sorted(tree) != ['manifest.json', 'manifest.sig', 'release.zip']:
        raise ValueError('Release branch must contain exactly three data files')
    for name, limit in [('manifest.json', 1024 * 1024), ('manifest.sig', 1024), ('release.zip', MAX_ZIP)]:
        if int(git('cat-file', '-s', commit + ':' + name)) > limit:
            raise ValueError('Remote release file exceeds size limit')
        (directory / name).write_bytes(git('show', commit + ':' + name))
    return commit


def backup(root, state):
    files = static_inventory(root)
    if shutil.disk_usage(state).free < max(64 * 1024 * 1024, sum(x['bytes'] for x in files.values()) * 3):
        raise ValueError('Insufficient backup/staging free space')
    backup_id = str(time.time_ns())
    folder = state / 'backups' / backup_id
    folder.mkdir(parents=True, mode=0o700)
    with zipfile.ZipFile(folder / 'site.zip', 'w', zipfile.ZIP_DEFLATED) as z:
        for name, meta in files.items():
            data = (root / name).read_bytes()
            if digest(data) != meta['sha256']:
                raise ValueError('Site changed while backing up')
            z.writestr(name, data)
    atomic_json(folder / 'files.json', files)
    verify_backup(folder)
    if static_inventory(root) != files:
        raise ValueError('Site changed during backup; no write permitted')
    return backup_id, folder, files


def verify_backup(folder):
    no_symlinks(folder)
    regular_owned(folder / 'site.zip')
    regular_owned(folder / 'files.json')
    files = read_json(folder / 'files.json')
    with zipfile.ZipFile(folder / 'site.zip') as z:
        if len(z.infolist()) != len(files) or set(z.namelist()) != set(files):
            raise ValueError('Backup inventory mismatch')
        for name, meta in files.items():
            # Backups may contain existing non-release static filenames, but never hidden paths/traversal.
            if pathlib.PurePosixPath(name).is_absolute() or any(p.startswith('.') or p in ('', '..') for p in name.split('/')):
                raise ValueError('Unsafe backup path')
            if digest(z.read(name)) != meta['sha256']:
                raise ValueError('Backup verification failed')
    return files


def reconcile(root, desired, data_for):
    current = static_inventory(root)
    # Immutable assets before HTML; every destination is replaced atomically, not written in place.
    for name in sorted(desired, key=lambda n: (n.endswith('.html'), n)):
        path = root / name
        no_symlinks(path)
        missing = []
        parent = path.parent
        while not parent.exists():
            missing.append(parent)
            parent = parent.parent
        for parent in reversed(missing):
            parent.mkdir(mode=0o755)
            parent.chmod(0o755)  # umask 077 protects state, not newly served directories
        temp = path.with_name('.mariyas-write-' + path.name)
        if temp.exists() or temp.is_symlink():
            raise ValueError('Unexpected transaction temp file')
        data = data_for(name)
        if digest(data) != desired[name]['sha256']:
            raise ValueError('Transaction data changed')
        try:
            with open(temp, 'xb') as f:
                f.write(data)
                f.flush()
                os.fsync(f.fileno())
            temp.chmod(desired[name].get('mode', 0o644))
            os.replace(temp, path)
        finally:
            if temp.exists() and not temp.is_symlink():
                temp.unlink()
    for name in sorted(set(current) - set(desired)):
        path = no_symlinks(root / name)
        path.unlink()
    result = static_inventory(root)
    if {n: x['sha256'] for n, x in result.items()} != {n: x['sha256'] for n, x in desired.items()}:
        raise ValueError('Post-write verification failed')


def restore(root, folder):
    files = verify_backup(folder)
    with zipfile.ZipFile(folder / 'site.zip') as z:
        reconcile(root, files, z.read)


def apply_release(cfg, m, manifest_hash, staged, release_commit, apply=False):
    root, state = cfg['_root'], cfg['_state']
    if (state / 'pending.json').exists():
        raise ValueError('Incomplete transaction: inspect and run explicit --recover before polling again')
    previous = read_json(state / 'current.json', {'max_sequence': 0})
    if m['sequence'] <= previous['max_sequence']:
        print('NO CHANGE: release sequence already seen (rollback is not automatically undone)')
        return
    inventory = static_inventory(root)
    desired = {x['path']: x for x in m['files']}
    for name in desired:
        destination = no_symlinks(root / name)
        if destination.is_dir() or any(p.exists() and not p.is_dir() for p in destination.parents if p != root and root in p.parents):
            raise ValueError('File/directory collision requires owner review before any write')
    print(json.dumps({'mode': 'APPLY' if apply else 'DRY-RUN', 'release_commit': release_commit, 'source_sha': m['source_sha'], 'sequence': m['sequence'], 'manifest_sha256': manifest_hash, 'current_inventory_sha256': inventory_hash(inventory), 'would_write': sorted(desired), 'would_remove': sorted(set(inventory) - set(desired)), 'protected': ['.well-known', 'all dotfiles/directories']}, indent=2))
    if not apply:
        return
    if cfg.get('enabled') is not True:
        raise ValueError('Live apply is disabled in the owner config')
    if not previous.get('release_commit'):
        approval_path = state / 'initial-approval.json'
        regular_owned(approval_path, private=True)
        approval = read_json(approval_path)
        if approval != {'manifest_sha256': manifest_hash, 'inventory_sha256': inventory_hash(inventory)}:
            raise ValueError('First deployment requires approval of this exact release AND current site inventory')
    required_free = sum(x['bytes'] for x in desired.values()) * 2 + sum(x['bytes'] for x in inventory.values()) * 3 + 64 * 1024 * 1024
    if min(shutil.disk_usage(root).free, shutil.disk_usage(state).free) < required_free:
        raise ValueError('Insufficient space for release, verified backup and rollback reserve')
    backup_id, folder, _ = backup(root, state)
    atomic_json(state / 'pending.json', {'backup': backup_id, 'previous': previous})
    try:
        reconcile(root, desired, lambda n: (staged / n).read_bytes())
        atomic_json(state / 'current.json', {'release_commit': release_commit, 'source_sha': m['source_sha'], 'manifest_sha256': manifest_hash, 'max_sequence': m['sequence'], 'backup': backup_id})
    except Exception:
        restore(root, folder)
        atomic_json(state / 'current.json', previous)
        (state / 'pending.json').unlink()
        raise
    (state / 'pending.json').unlink()
    print('APPLIED; verified backup retained: ' + backup_id)


def cleanup_transaction_temps(root):
    # Only explicit recovery may remove reserved transaction remnants, never .well-known/dot trees.
    for item in root.iterdir():
        if item.name.startswith('.mariyas-write-'):
            regular_owned(item)
            item.unlink()
        elif not item.name.startswith('.'):
            no_symlinks(item)
            if item.is_dir():
                cleanup_transaction_temps(item)


def rollback(cfg, backup_id, apply=False, recover=False):
    if not re.fullmatch(r'[0-9]+', backup_id):
        raise ValueError('Invalid backup ID')
    state, root = cfg['_state'], cfg['_root']
    folder = state / 'backups' / backup_id
    verify_backup(folder)
    print(('RECOVER' if recover else 'ROLLBACK') + (' apply: ' if apply else ' dry-run: ') + backup_id)
    if not apply:
        return
    if cfg.get('enabled') is not True:
        raise ValueError('Live apply is disabled')
    pending = read_json(state / 'pending.json')
    if pending and not recover:
        raise ValueError('Recover the pending transaction first')
    if recover:
        if not pending or pending['backup'] != backup_id:
            raise ValueError('Recovery backup must match the pending transaction')
        cleanup_transaction_temps(root)
        restore(root, folder)
        atomic_json(state / 'current.json', pending['previous'])
        (state / 'pending.json').unlink()
    else:
        current = read_json(state / 'current.json', {'max_sequence': 0})
        new_backup, _, _ = backup(root, state)
        atomic_json(state / 'pending.json', {'backup': new_backup, 'previous': current})
        restore(root, folder)
        atomic_json(state / 'current.json', {**current, 'rolled_back_to': backup_id, 'backup': new_backup})
        (state / 'pending.json').unlink()


def main():
    os.umask(0o077)
    parser = argparse.ArgumentParser()
    parser.add_argument('--config', type=pathlib.Path, required=True)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--dry-run', action='store_true', help='Verify and print only; this is also the default')
    mode.add_argument('--apply', action='store_true', help='Explicit owner-enabled live action; absent means dry-run')
    parser.add_argument('--rollback', metavar='BACKUP_ID')
    parser.add_argument('--recover', action='store_true')
    args = parser.parse_args()
    cfg = config_load(args.config)
    state = cfg['_state']
    state.mkdir(parents=True, exist_ok=True, mode=0o700)
    with open(state / 'lock', 'a') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            print('Another pull transaction holds the lock; skipped')
            return
        if args.recover:
            pending = read_json(state / 'pending.json')
            if not pending:
                raise ValueError('No pending transaction')
            rollback(cfg, pending['backup'], args.apply, recover=True)
        elif args.rollback:
            rollback(cfg, args.rollback, args.apply)
        else:
            with tempfile.TemporaryDirectory(prefix='release-', dir=state) as work:
                directory = pathlib.Path(work)
                commit = git_fetch(cfg, directory)
                m, h, staged = verify_release(directory, cfg)
                apply_release(cfg, m, h, staged, commit, args.apply)


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print('REFUSED: ' + str(error), file=sys.stderr)
        sys.exit(1)
