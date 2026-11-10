# Hostinger Ubuntu 24.04 / CloudPanel — owner-run preparation

**Instructions only. None of these commands has been run on the VPS.** Phase 2 authorizes read-only preflight only. Later setup blocks create private control files/backups and the root marker; run them only after separate setup authorization. Signing/publication/first deployment require later, distinct approval. Never execute a deployment as root. Do not change DNS, SSL, existing permissions or the .in/.com websites.

Expected site: `www.mariyasnaturals.cloud`; user: `mariyascloud`; expected root: `/home/mariyascloud/htdocs/www.mariyasnaturals.cloud`. This expectation is **not proof** of CloudPanel's actual binding.

## 1. FIRST owner action — read-only hosting preflight

In Android Chrome open Hostinger's VPS **Web Console/Browser Terminal**. If it starts as root, type `su - mariyascloud` to enter the existing site-user shell. If switching fails, stop. In CloudPanel's existing .cloud site, independently check **Static HTML**, site user **mariyascloud**, HTTPS/domain binding and the displayed document root. It must match the expected path and be isolated from WordPress/commercial sites. If different or uncertain, stop; do not rename, symlink, chmod or reconfigure anything.

As `mariyascloud`, run:

```sh
python3 - <<'PY'
from pathlib import Path
import os, pwd, shutil, stat
assert pwd.getpwuid(os.geteuid()).pw_name == 'mariyascloud', 'STOP: use mariyascloud, never root'
root = Path('/home/mariyascloud/htdocs/www.mariyasnaturals.cloud')
assert root.is_dir(), 'STOP: expected root is absent; verify CloudPanel'
assert not any(p.is_symlink() for p in [root, *root.parents]), 'STOP: symlinked path'
info = root.stat()
assert info.st_uid == os.geteuid() and not info.st_mode & 0o022, 'STOP: unexpected ownership/writable permissions; do not change them'
assert not any((root/p).exists() for p in ['wp-config.php', 'wp-admin', 'wp-content', '.git', 'node_modules']), 'STOP: root is not isolated static HTML'
print('User:', pwd.getpwuid(os.geteuid()).pw_name)
print('Expected root:', root)
print('Resolved root:', root.resolve())
print('Mode:', oct(stat.S_IMODE(info.st_mode)))
print('Free bytes:', shutil.disk_usage(root).free)
print('Top-level names:', sorted(p.name for p in root.iterdir()))
print('READ-ONLY ONLY. No files, permissions, keys or cron changed. STOP for review.')
PY
```

Stop here during Phase 2. A successful script cannot itself prove CloudPanel binding, SSL or that another domain does not share this root. The owner must check the UI. Do not paste file contents or secrets into chat.

## 2. Later authorized setup — prerequisites and full independent backup

All remaining setup requires separate approval. Remain `mariyascloud`. Check existing software; if missing/incompatible, stop and request separately authorized administrator provisioning. Do not use `sudo`, install a runner or change website permissions.

```sh
id -un
python3 --version
git --version
openssl version
command -v ssh
command -v ssh-keygen
command -v ssh-keyscan
```

Create a verified full backup **before any document-root modification**, including `.well-known` and all dot paths. Keep it outside every served directory. Pause other website writers during backup. This block reads the root, refuses links/special files, verifies every archived file plus inventory stability, and records a checksum. It never restores/extracts over the site. If permissions prevent reading protected files, stop; do not chmod them. Directory modes are retained in the tar archive; the puller's later transactional backups cover only non-hidden static files.

```sh
python3 - <<'PY'
from pathlib import Path
import hashlib, json, os, pwd, shutil, tarfile, time
assert pwd.getpwuid(os.geteuid()).pw_name == 'mariyascloud'
os.umask(0o077)
root = Path('/home/mariyascloud/htdocs/www.mariyasnaturals.cloud')
assert root.is_dir() and not any(p.is_symlink() for p in [root, *root.parents])
state = Path.home()/'.local/state/mariyas-pull'
assert root not in state.parents and state not in root.parents
assert not any(p.is_symlink() for p in [state, *state.parents])
state.mkdir(parents=True, exist_ok=True, mode=0o700)
assert state.stat().st_uid == os.geteuid() and not state.stat().st_mode & 0o077
folder = state/'operator-backups'
folder.mkdir(exist_ok=True, mode=0o700)
assert not folder.is_symlink() and folder.stat().st_uid == os.geteuid() and not folder.stat().st_mode & 0o077
def inventory():
    result = {}
    for p in root.rglob('*'):
        assert not p.is_symlink(), 'STOP: symlink requires separate review'
        if p.is_dir():
            continue
        assert p.is_file(), 'STOP: special file'
        data = p.read_bytes()
        result[p.relative_to(root).as_posix()] = {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
    return result
before = inventory()
assert shutil.disk_usage(state).free > sum(x['bytes'] for x in before.values())*2 + 64*1024*1024, 'Insufficient backup space'
archive = folder/('before-activation-'+str(time.time_ns())+'.tar.gz')
with tarfile.open(archive, 'x:gz') as t:
    t.add(root, arcname='site', recursive=True)
with tarfile.open(archive, 'r:gz') as t:
    members = t.getmembers()
    assert all(m.isfile() or m.isdir() for m in members)
    actual = {}
    for m in members:
        if m.isfile():
            assert m.name.startswith('site/')
            data = t.extractfile(m).read()
            actual[m.name[len('site/'):]] = {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
    assert actual == before, 'Archive does not match website'
assert inventory() == before, 'Website changed while backing up; stop'
record = {'document_root': str(root), 'archive': str(archive), 'sha256': hashlib.sha256(archive.read_bytes()).hexdigest(), 'files': before}
receipt = archive.with_suffix('.verified.json')
with receipt.open('x') as f:
    json.dump(record, f, indent=2)
print('VERIFIED backup:', archive)
print('Receipt:', receipt)
print('SHA-256:', record['sha256'])
print('Keep a separate off-server recovery copy; no website bytes changed')
PY
```

Retain the verified archive/receipt privately and arrange independent off-server recovery. Do not restore this full tar blindly: it contains protected configuration/ACME paths that the puller deliberately leaves alone. Full administrator restoration is a separately reviewed recovery operation.

## 3. Read-only GitHub deploy key — outbound only

Create a new site-user key only if it does not exist. No private SSH key goes to GitHub. This changes only newly created private site-user control files, not existing permissions.

```sh
(
set -eu
umask 077
test "$(id -un)" = mariyascloud
mkdir -p "$HOME/.ssh"
test "$(readlink -f "$HOME/.ssh")" = "$HOME/.ssh"
test ! -L "$HOME/.ssh/github-staging-readonly"
test ! -L "$HOME/.ssh/github-staging-readonly.pub"
test ! -e "$HOME/.ssh/github-staging-readonly"
test ! -e "$HOME/.ssh/github-staging-readonly.pub"
ssh-keygen -t ed25519 -N '' -C 'mariyascloud-staging-readonly' -f "$HOME/.ssh/github-staging-readonly"
cat "$HOME/.ssh/github-staging-readonly.pub"
)
```

In private repository **Settings → Deploy keys**, add only that `.pub` line. **Allow write access must remain unchecked**. Confirm the UI shows read-only. Do not test write access by pushing a branch. The unattended private key remains on this VPS; it authenticates outbound GitHub reads, not inbound VPS login.

## 4. Independently verify GitHub's host key

On Android Chrome, open [GitHub's official SSH fingerprints](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/githubs-ssh-key-fingerprints) over trusted HTTPS and locate the current **Ed25519 SHA256** fingerprint. Do not copy the fingerprint from a scan or untrusted instructions. The following block scans only as a candidate, then requires an exact match to the independently obtained fingerprint before installing trust. It refuses to overwrite an existing known-hosts file.

```sh
python3 - <<'PY'
from pathlib import Path
import os, pwd, re, subprocess, sys, tempfile
assert pwd.getpwuid(os.geteuid()).pw_name == 'mariyascloud'
sys.stdin = open('/dev/tty')
os.umask(0o077)
folder = Path.home()/'.ssh'
assert folder.is_dir() and not folder.is_symlink()
destination = folder/'github-staging-known-hosts'
assert not destination.exists() and not destination.is_symlink(), 'Existing trust file: review separately'
scan = subprocess.run(['ssh-keyscan', '-T', '10', '-t', 'ed25519', 'github.com'], capture_output=True, check=True).stdout
assert scan, 'Empty scan'
with tempfile.NamedTemporaryFile(dir=folder) as f:
    f.write(scan); f.flush()
    lines = subprocess.check_output(['ssh-keygen', '-l', '-E', 'sha256', '-f', f.name], text=True).splitlines()
    fingerprints = {line.split()[1] for line in lines}
    print('Scanned fingerprints:', sorted(fingerprints))
    official = input('Paste Ed25519 SHA256 fingerprint from GitHub official HTTPS documentation: ').strip()
    assert re.fullmatch(r'SHA256:[A-Za-z0-9+/]{43}', official)
    assert fingerprints == {official}, 'STOP: fingerprint mismatch; no trust installed'
with destination.open('xb') as f:
    f.write(scan)
print('Verified known-hosts installed:', destination)
PY
```

Test repository read access, never bypassing host checks:

```sh
(
set -eu
test "$(id -un)" = mariyascloud
export GIT_SSH_COMMAND="ssh -i $HOME/.ssh/github-staging-readonly -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=$HOME/.ssh/github-staging-known-hosts"
git -c core.hooksPath=/dev/null ls-remote git@github.com:mariyasnaturals/mariyas-naturals-knowledge.git HEAD
)
```

If outbound port 22/GitHub SSH is blocked, stop and report that specific failure. This design does not require inbound SSH and does not bypass outbound restrictions. An alternate documented endpoint would require separate review/configuration; do not weaken checking.

## 5. Install the unchanged pinned puller

This fetches a reviewed commit into private bare state and extracts only one script, with no source checkout/build. It refuses to overwrite an existing installed puller. Existing installations should instead verify the pinned hash and stop for review if it differs.

```sh
(
set -eu
umask 077
test "$(id -un)" = mariyascloud
OPS_SHA='da0c28877fa0b74b72b914984e62b19ddf91d2ed'
mkdir -p "$HOME/.local/bin" "$HOME/.config/mariyas-pull" "$HOME/.local/state/mariyas-pull"
test ! -e "$HOME/.local/bin/mariyas-pull.py"
test ! -e "$HOME/.local/bin/mariyas-pull.py.pending"
SETUP_CACHE="$HOME/.local/state/mariyas-pull/setup.git"
test ! -e "$SETUP_CACHE"
export GIT_SSH_COMMAND="ssh -i $HOME/.ssh/github-staging-readonly -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=$HOME/.ssh/github-staging-known-hosts"
git -c core.hooksPath=/dev/null init --bare "$SETUP_CACHE"
git -c core.hooksPath=/dev/null --git-dir="$SETUP_CACHE" fetch --depth=1 git@github.com:mariyasnaturals/mariyas-naturals-knowledge.git "$OPS_SHA"
git -c core.hooksPath=/dev/null --git-dir="$SETUP_CACHE" show "$OPS_SHA:ops/pull_deploy.py" > "$HOME/.local/bin/mariyas-pull.py.pending"
printf '%s  %s\n' '67fd3e74398d9b9a58ebc47d8d5ffcfa03c03d1ad9348665f76c46d1721b0bf3' "$HOME/.local/bin/mariyas-pull.py.pending" | sha256sum -c -
chmod 700 "$HOME/.local/bin/mariyas-pull.py.pending"
mv "$HOME/.local/bin/mariyas-pull.py.pending" "$HOME/.local/bin/mariyas-pull.py"
)
```

Only the newly created script's mode is set; never chmod/chown the current website or existing control files to make checks pass. All state/scripts/keys/logs must be outside every document root, not merely outside this .cloud root.

## 6. Public-key pin and disabled configuration

First obtain the **public** PEM and its SHA-256 directly from the owner's Android device. The private key/passphrase must not enter Web Console. This block verifies the full pre-activation backup again before creating the root marker. It refuses to replace existing trust/config/marker files. When prompted, use the backup receipt path printed in step 2 and the independently exported public PEM/hash. No purchasing/domain/store mapping is changed.

```sh
python3 - <<'PY'
from pathlib import Path
import hashlib, json, os, pwd, re, subprocess, sys, tempfile
assert pwd.getpwuid(os.geteuid()).pw_name == 'mariyascloud'
sys.stdin = open('/dev/tty')
os.umask(0o077)
root = Path('/home/mariyascloud/htdocs/www.mariyasnaturals.cloud')
assert root.is_dir() and not any(p.is_symlink() for p in [root, *root.parents])
assert root.stat().st_uid == os.geteuid() and not root.stat().st_mode & 0o022
assert input('After independently checking CloudPanel, type www.mariyasnaturals.cloud to confirm isolated Static HTML root: ') == 'www.mariyasnaturals.cloud'
receipt = Path(input('Full path to verified .json backup receipt from step 2: ').strip())
assert not receipt.is_symlink() and receipt.is_file()
record = json.loads(receipt.read_text())
assert record['document_root'] == str(root)
archive = Path(record['archive'])
assert not archive.is_symlink() and hashlib.sha256(archive.read_bytes()).hexdigest() == record['sha256']
import tarfile
with tarfile.open(archive, 'r:gz') as t:
    actual = {}
    for member in t.getmembers():
        assert member.isfile() or member.isdir()
        if member.isfile():
            assert member.name.startswith('site/')
            data = t.extractfile(member).read()
            actual[member.name[5:]] = {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
    assert actual == record['files'], 'Backup verification failed'
current = {}
for p in root.rglob('*'):
    assert not p.is_symlink() and (p.is_dir() or p.is_file())
    if p.is_file():
        data = p.read_bytes()
        current[p.relative_to(root).as_posix()] = {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
assert current == record['files'], 'Site changed: take/review a new backup first'
folder = Path.home()/'.config/mariyas-pull'
folder.mkdir(parents=True, exist_ok=True, mode=0o700)
assert not any(p.is_symlink() for p in [folder, *folder.parents])
public, config, marker = folder/'release-public.pem', folder/'config.json', root/'.mariyas-cloud-root'
assert all(not p.exists() and not p.is_symlink() for p in [public, config, marker]), 'Existing install: review; do not overwrite'
print('Paste PUBLIC PEM, ending with -----END PUBLIC KEY-----:')
lines = []
while True:
    line = input()
    lines.append(line)
    if line == '-----END PUBLIC KEY-----':
        break
    assert len(lines) < 10
pem = ('\n'.join(lines)+'\n').encode()
assert lines[0] == '-----BEGIN PUBLIC KEY-----' and b'PRIVATE' not in pem
expected = input('SHA-256 of this public PEM shown independently on Android: ').strip()
assert re.fullmatch('[a-f0-9]{64}', expected) and hashlib.sha256(pem).hexdigest() == expected
with tempfile.NamedTemporaryFile(dir=folder) as f:
    f.write(pem); f.flush()
    subprocess.run(['openssl', 'pkey', '-pubin', '-in', f.name, '-noout'], check=True)
with public.open('xb') as f:
    f.write(pem)
settings = {'site': 'https://www.mariyasnaturals.cloud', 'enabled': False, 'document_root': str(root), 'state_dir': str(Path.home()/'.local/state/mariyas-pull'), 'deploy_key': str(Path.home()/'.ssh/github-staging-readonly'), 'known_hosts': str(Path.home()/'.ssh/github-staging-known-hosts'), 'release_public_key': str(public), 'release_public_key_sha256': expected}
with config.open('x') as f:
    json.dump(settings, f, indent=2)
with marker.open('x') as f:
    f.write(settings['site']+'\n')
print('New private config/trust/marker installed; enabled=false; no static page changed')
PY
```

The marker is an owner assertion, not automatic proof of CloudPanel binding. If any setup step partially fails, stop and inspect; the instructions intentionally refuse automatic overwrite/retry. Permissions/trust/sentinels are checked again by the puller. Do not fix a refusal by changing existing ownership/permissions without separate authorization.

## 7. Manual dry-run, logs and future CloudPanel dry-run cron

No signed release is published in Phase 2. Before `staging-release` exists, a Git fetch/ref refusal is expected and does not modify website files. After a future separately approved signed publication, the same command prints its exact source/manifest/inventory, planned writes/removals and protected paths. It creates no deployment backup and writes no website bytes.

```sh
(
set -eu
umask 077
test "$(id -un)" = mariyascloud
python3 -c 'import json,pathlib; assert json.loads((pathlib.Path.home()/".config/mariyas-pull/config.json").read_text())["enabled"] is False'
/usr/bin/python3 "$HOME/.local/bin/mariyas-pull.py" --config "$HOME/.config/mariyas-pull/config.json" --dry-run
)
```

Only after separately authorized dry-run setup, precreate a private log without replacing an existing one:

```sh
(
set -eu
umask 077
test "$(id -un)" = mariyascloud
set -C
: > "$HOME/.local/state/mariyas-pull/pull.log"
)
```

In CloudPanel's existing .cloud site's **Cron Jobs**, verify the execution user is **mariyascloud**. Proposed schedule: `*/5 * * * *`. Proposed command:

```sh
/usr/bin/python3 /home/mariyascloud/.local/bin/mariyas-pull.py --config /home/mariyascloud/.config/mariyas-pull/config.json --dry-run >> /home/mariyascloud/.local/state/mariyas-pull/pull.log 2>&1
```

Do not install cron during Phase 2. This is a future dry-run poll only; never switch it to automatic `--apply` under this guide. Keep `enabled=false` until first-deployment authorization.

```sh
tail -n 80 /home/mariyascloud/.local/state/mariyas-pull/pull.log
```

Troubleshooting: wrong user/root/symlink/ownership → stop, verify binding, do not chmod; unknown host/key denied → compare official host fingerprint and read-only deploy-key UI; absent release ref → expected before owner publication; signature/media/hash mismatch → do not bypass, quarantine/review the candidate; missing backup/space/collision → preserve data and obtain a reviewed remedy; lock held → another run is active, do not delete its lock; `pending.json` → pause cron and review recovery before new writes. Do not share whole private logs or credentials in chat. Monitor log/backup disk use; no automatic deletion/rotation is configured here.

## 8. FUTURE first deployment approval — stop before this section now

After publication AND VPS dry-run have been separately approved, the owner must approve the exact manifest hash **and current site inventory hash** from the VPS log, planned removals, verified backup and rollback plan. Pause other writers and cron. Any inventory change invalidates that approval. Keep the independent backup and signing recovery backup. Only after explicit first-write authorization, the following guarded command creates the first approval/config change and performs **one** manual apply. It is not authorized by Phase 2 or by merging PR #2.

```sh
python3 - <<'PY'
from pathlib import Path
import json, os, pwd, re, subprocess, sys
assert pwd.getpwuid(os.geteuid()).pw_name == 'mariyascloud'
sys.stdin = open('/dev/tty')
os.umask(0o077)
hash_ = input('Exact approved manifest SHA-256 from VPS dry-run: ').strip()
inventory = input('Exact approved current inventory SHA-256 from VPS dry-run: ').strip()
assert all(re.fullmatch('[a-f0-9]{64}', s) for s in [hash_, inventory])
assert input('Only after separate authorization, type APPLY EXACT CLOUD BUILD ONCE: ') == 'APPLY EXACT CLOUD BUILD ONCE'
state = Path.home()/'.local/state/mariyas-pull'
assert not (state/'current.json').exists() and not (state/'pending.json').exists(), 'Existing/pending deployment: stop and review'
approval = state/'initial-approval.json'
assert not approval.exists() and not approval.is_symlink()
with approval.open('x') as f:
    json.dump({'manifest_sha256': hash_, 'inventory_sha256': inventory}, f)
config = Path.home()/'.config/mariyas-pull/config.json'
assert not config.is_symlink() and config.stat().st_uid == os.geteuid() and not config.stat().st_mode & 0o077
settings = json.loads(config.read_text())
assert settings['enabled'] is False and settings['site'] == 'https://www.mariyasnaturals.cloud'
settings['enabled'] = True
pending = config.with_suffix('.activation.tmp')
with pending.open('x') as f:
    json.dump(settings, f, indent=2)
os.replace(pending, config)
subprocess.run(['/usr/bin/python3', str(Path.home()/'.local/bin/mariyas-pull.py'), '--config', str(config), '--apply'], check=True)
print('Manual command completed. Verify live .cloud; keep cron paused or dry-run. No automatic deployment authorized.')
PY
```

Inspect `.cloud` HTTPS, `/en/`, `/ml/`, `/hi/`, `/ta/`, navigation/story, fonts/images, robots/noindex and disabled purchasing on actual Android Chrome. Leave cron paused or dry-run. Automatic application of subsequent signed releases needs separate authorization. Publication does not itself grant first-write permission.

## 9. Rollback and interruption — future explicit recovery approval

Pause cron/writers. Choose a verified backup ID from private `~/.local/state/mariyas-pull/backups/`. Default to inspection only. This command adds `--apply` only after explicit rollback authorization and confirmation; rollback first backs up the current static site. It preserves protected dot paths and the sequence high-water mark.

```sh
python3 - <<'PY'
from pathlib import Path
import pwd, subprocess, os, sys
assert pwd.getpwuid(os.geteuid()).pw_name == 'mariyascloud'
sys.stdin = open('/dev/tty')
backup = input('Verified backup ID to inspect: ').strip()
assert backup.isdigit()
command = ['/usr/bin/python3', str(Path.home()/'.local/bin/mariyas-pull.py'), '--config', str(Path.home()/'.config/mariyas-pull/config.json'), '--rollback', backup]
subprocess.run(command + ['--dry-run'], check=True)
answer = input('Enter to STOP; only after rollback approval type RESTORE VERIFIED BACKUP: ')
assert answer in ['', 'RESTORE VERIFIED BACKUP']
if answer:
    subprocess.run(command + ['--apply'], check=True)
PY
```

For `pending.json`, do not delete it to bypass the guard. Keep cron paused, inspect the named verified backup and use the installed command with `--recover --dry-run` first. Any `--recover --apply` requires separate recovery approval; it restores the pending backup and clears only the associated journal/reserved temp files. If recovery fails, keep the site paused for reviewed independent-backup recovery. No root deployment or WordPress changes are part of rollback.
