# Android owner setup — pinned to da0c288

This guide prepares the owner device. It does not authorize signing, publication or deployment. Follow one step at a time after that step is approved. Stop on any error. Never send private keys, passphrases or GitHub tokens to chat. Termux is used locally and for GitHub HTTPS, never for inbound VPS SSH.

Operations commit: **`da0c28877fa0b74b72b914984e62b19ddf91d2ed`**. All five installed files below come from this exact reviewed commit. Website/build source SHAs may advance independently; do not change the installed tools or policy automatically.

## 1. Install and check Termux

Use a maintained official Termux distribution, such as [F-Droid](https://f-droid.org/packages/com.termux/). Open Termux. These commands change only your phone's Termux packages:

```sh
pkg update && pkg install python git openssl-tool
```

Then check versions. Python 3.10+ and OpenSSL 3+ are the guide's supported minimums; Ubuntu 24.04's Python 3.12/OpenSSL 3 are compatible. The audit ran Python 3.12.14, Git 2.52.0 and OpenSSL 3.5.7 locally; that is not a claim about your phone.

```sh
python --version
git --version
openssl version
python - <<'PY'
import subprocess, sys
assert sys.version_info >= (3, 10), 'Update Termux Python before continuing'
assert int(subprocess.check_output(['openssl', 'version'], text=True).split()[1].split('.')[0]) >= 3, 'OpenSSL 3+ required'
print('Version preflight passed; no keys created')
PY
```

Run `termux-setup-storage` and approve Android's request if you want access to downloaded candidate ZIPs. Only those **unsigned** downloads may live in shared Downloads. Tools, signing keys and candidate state stay in Termux's private home.

## 2. Prepare GitHub access and install the reviewed tools

In Android Chrome, create an expiring **fine-grained personal access token** for `mariyasnaturals/mariyas-naturals-knowledge` only, with **Contents: read and write**. Metadata read is implicit. The publisher needs no Actions, Workflows or Administration permission. Repository-scoped does not mean branch-scoped. Keep it in your password manager; do not add it to Actions or paste it into a command. Git will ask for your GitHub username and the token as its password. Nothing here requires a VPS password/key.

Review the pinned tools on GitHub first. This block fetches repository objects without checking out or running source. It creates a **fresh** private owner directory and stops rather than overwrite an existing installation. The fixed checksums below are independent of an artifact/workflow output.

```sh
(
set -eu
umask 077
OPS_SHA='da0c28877fa0b74b72b914984e62b19ddf91d2ed'
OWNER_DIR="$HOME/.local/share/mariyas-owner"
test ! -e "$OWNER_DIR" || { echo 'Existing owner directory: stop and review it; nothing overwritten'; exit 1; }
mkdir -p "$OWNER_DIR/tools" "$OWNER_DIR/keys"
git -c credential.helper= clone --bare https://github.com/mariyasnaturals/mariyas-naturals-knowledge.git "$OWNER_DIR/setup.git"
for file in prepare_release.py publish_release.py pull_deploy.py owner-media-policy.json owner-tools.sha256; do
  git --git-dir="$OWNER_DIR/setup.git" show "$OPS_SHA:ops/$file" > "$OWNER_DIR/tools/$file"
done
cd "$OWNER_DIR/tools"
sha256sum -c owner-tools.sha256
sha256sum -c - <<'SUMS'
192449a52a5e92fd08bf37440fd1ac65fc95d14a4a56fff2decff3f9271260d6  prepare_release.py
bebc888fd21811bdaacef223b2a25ce60b282bf44fdcd34fed347f59b21f7a36  publish_release.py
67fd3e74398d9b9a58ebc47d8d5ffcfa03c03d1ad9348665f76c46d1721b0bf3  pull_deploy.py
760e2510c600266c85eb8e6f51f1eb7c6b1ac6d16c335644782c49102258e426  owner-media-policy.json
SUMS
chmod 600 ./*
python prepare_release.py --help
python publish_release.py --help
)
```

Expect four `OK` lines for each checksum check, followed by command help. If authentication, fetch, checksum or Python import fails, stop. Do not weaken checks or re-run installation over an existing directory. Review a partial installation before removing/retrying it. Do not download tools from candidate artifacts, run PR instructions blindly, or auto-update these trusted files from a branch.

## 3. Generate the encrypted owner key

After tool setup is approved, this block refuses to overwrite any key. OpenSSL asks for a strong new passphrase twice, then asks for it again while exporting the public key. No passphrase belongs in a command or environment variable.

```sh
(
set -eu
umask 077
KEY_DIR="$HOME/.local/share/mariyas-owner/keys"
test -d "$KEY_DIR"
test ! -e "$KEY_DIR/release-private.pem"
test ! -e "$KEY_DIR/release-public.pem"
openssl genpkey -algorithm ED25519 -aes-256-cbc -out "$KEY_DIR/release-private.pem"
openssl pkey -in "$KEY_DIR/release-private.pem" -pubout -out "$KEY_DIR/release-public.pem"
chmod 600 "$KEY_DIR/release-private.pem" "$KEY_DIR/release-public.pem"
sha256sum "$KEY_DIR/release-public.pem"
cat "$KEY_DIR/release-public.pem"
)
```

Only the `-----BEGIN PUBLIC KEY-----` block and its SHA-256 may be copied to Hostinger Web Console later. Never copy the private PEM/passphrase to the VPS, GitHub, shared storage or chat. If any previous key was stored in GitHub/CI, retire it and use this new local key; public-key rotation on the VPS requires separate approval.

## 4. Make and verify an encrypted recovery backup

Uninstalling Termux or losing app data loses its private storage. The command below makes a **second encrypted container** around the already encrypted private PEM, public PEM and operations/checksum record. Only that encrypted `.enc` container is written to Downloads. The private PEM itself never leaves private storage. OpenSSL prompts for a separate strong recovery-container password; keep it and the signing passphrase separately from the container.

```sh
python - <<'PY'
from pathlib import Path
import hashlib, io, os, subprocess, tarfile, tempfile
os.umask(0o077)
base = Path.home()/'.local/share/mariyas-owner'
out = Path.home()/'storage/downloads/mariyas-owner-recovery.enc'
assert out.parent.is_dir(), 'Run termux-setup-storage first'
assert not out.exists() and not out.is_symlink(), 'Existing backup: stop; never overwrite it'
with tempfile.TemporaryDirectory(dir=base) as work:
    archive = Path(work)/'recovery.tar'
    with tarfile.open(archive, 'x') as t:
        for name in ['keys/release-private.pem', 'keys/release-public.pem', 'tools/owner-tools.sha256']:
            t.add(base/name, arcname=name, recursive=False)
        data = b'da0c28877fa0b74b72b914984e62b19ddf91d2ed\n'
        item = tarfile.TarInfo('operations-sha.txt'); item.size = len(data); item.mode = 0o600
        t.addfile(item, io.BytesIO(data))
    subprocess.run(['openssl', 'enc', '-aes-256-cbc', '-salt', '-pbkdf2', '-iter', '600000', '-in', str(archive), '-out', str(out)], check=True)
print('Encrypted container:', out)
print('Record this SHA-256 separately in your password manager:', hashlib.sha256(out.read_bytes()).hexdigest())
PY
```

Copy **only the encrypted container** to a trusted encrypted vault or offline/removable recovery location. Record its exact SHA-256 separately in your password manager; OpenSSL `enc` does not authenticate the container, so the separately trusted checksum must be checked before any decryption. Avoid chat/photo backups. A copy on the same phone is not recovery.

Retrieve a copy from that external location back to Downloads. Verify actual recovery with the block below: it checks the independently retained container hash, decrypts only into a temporary private directory, accepts exactly four regular files, and verifies the recovered private key against your original public key. Both OpenSSL password prompts are local. It never replaces the live key, extracts paths from a tar or displays the private PEM.

```sh
python - <<'PY'
from pathlib import Path
import hashlib, os, re, subprocess, sys, tarfile, tempfile
sys.stdin = open('/dev/tty')
os.umask(0o077)
base = Path.home()/'.local/share/mariyas-owner'
container = Path(input('Full path to encrypted container retrieved from external backup: ').strip()).expanduser()
expected = input('Original container SHA-256 saved separately in your password manager: ').strip()
assert container.is_file() and re.fullmatch('[a-f0-9]{64}', expected)
assert hashlib.sha256(container.read_bytes()).hexdigest() == expected, 'STOP: changed/untrusted container'
with tempfile.TemporaryDirectory(dir=base) as work:
    archive, key, public = [Path(work)/name for name in ['recovery.tar', 'restored-private.pem', 'restored-public.pem']]
    subprocess.run(['openssl', 'enc', '-d', '-aes-256-cbc', '-pbkdf2', '-iter', '600000', '-in', str(container), '-out', str(archive)], check=True)
    with tarfile.open(archive, 'r:') as t:
        members = t.getmembers()
        assert len(members) == 4 and all(m.isfile() and m.size < 16384 for m in members)
        assert {m.name for m in members} == {'keys/release-private.pem', 'keys/release-public.pem', 'tools/owner-tools.sha256', 'operations-sha.txt'}
        assert t.extractfile('operations-sha.txt').read().decode().strip() == 'da0c28877fa0b74b72b914984e62b19ddf91d2ed'
        key.write_bytes(t.extractfile('keys/release-private.pem').read())
        original_public = t.extractfile('keys/release-public.pem').read()
    subprocess.run(['openssl', 'pkey', '-in', str(key), '-pubout', '-out', str(public)], check=True)
    assert public.read_bytes() == original_public == (base/'keys/release-public.pem').read_bytes()
print('External recovery copy verified. Keep it and the separately stored passwords/checksum safe.')
PY
```

The private temporary directory is removed when the command exits; deletion is not a secure-erasure guarantee. Only after external retrieval and recovery succeed should you consider removing redundant encrypted copies from Downloads. Do not proceed to signing without a verified recovery copy.

## 5. Inspect a future unsigned candidate — no signing or publication

This step is for after the registration PR is separately approved/merged. In GitHub Actions choose **Build staging candidate (owner signs separately)**, select **feature/authentic-media-typography**, and enter that branch's exact full source SHA. Choosing `main` intentionally skips the build; it does not produce a candidate. Inspect the actual source/workflow/dependencies at that SHA and verify all checks in the real run succeeded, including browser tests. Record the run ID and attempt; download `unsigned-staging-candidate-RUN_ID-ATTEMPT` in Chrome. Do not run anything inside it.

The following prompts accept only a local download, a 40-character source SHA, numeric run/attempt and a new owner sequence. Choose a sequence greater than every previously signed/deployed sequence and record it privately. First deployment with no prior state may use `1`; otherwise inspect the existing ledger/VPS state first. This is a data inspection, not approval:

```sh
python - <<'PY'
from pathlib import Path
import re, subprocess, sys
sys.stdin = open('/dev/tty')
home = Path.home()
artifact = Path(input('Full path to downloaded unsigned artifact ZIP: ').strip()).expanduser()
sha = input('Reviewed full source SHA: ').strip()
run = input('GitHub run ID: ').strip()
attempt = input('Run attempt number: ').strip()
sequence = input('New owner sequence: ').strip()
assert artifact.is_file() and artifact.suffix == '.zip', 'Select the actual ZIP download'
assert re.fullmatch('[a-f0-9]{40}', sha), 'Full lowercase source SHA required'
assert all(x.isdigit() and int(x) > 0 for x in [run, attempt, sequence]), 'Positive numbers required'
base = home / '.local/share/mariyas-owner'
out = base / ('candidate-' + sequence)
subprocess.run(['python', str(base/'tools/prepare_release.py'), 'inspect', '--bundle', str(artifact), '--output', str(out), '--source-sha', sha, '--run-id', run, '--run-attempt', attempt, '--sequence', sequence], check=True)
print('Unsigned candidate:', out)
print('STOP: inspect the manifest and real run before any signature')
PY
```

The printed manifest hash binds the ZIP, all files, source, run ID/attempt, sequence and staging policy. Compare all identities to GitHub. A green badge alone, an unsigned artifact or an automated message is not approval. No-JS/static checks and the image policy are enforced, but the owner must still review source/workflow/build trust; validation cannot prove arbitrary browser JavaScript harmless.

## 6. Future signing and HTTPS publication — NOT authorized in Phase 2

**Stop before this section during readiness preparation.** After separate owner approval of the concrete build, these prompts let you select that exact candidate and hash. Offline signing is possible after download (airplane mode); this does not make an ordinary phone an air-gapped device.

```sh
python - <<'PY'
from pathlib import Path
import re, subprocess, sys
sys.stdin = open('/dev/tty')
base = Path.home()/'.local/share/mariyas-owner'
seq = input('Approved owner sequence: ').strip()
hash_ = input('Exact manifest SHA-256 you reviewed: ').strip()
assert seq.isdigit() and int(seq) > 0
assert re.fullmatch('[a-f0-9]{64}', hash_), 'Exact lowercase manifest hash required'
assert input('Type SIGN THIS EXACT BUILD to approve: ') == 'SIGN THIS EXACT BUILD'
subprocess.run(['python', str(base/'tools/prepare_release.py'), 'approve', '--candidate', str(base/('candidate-'+seq)), '--key-file', str(base/'keys/release-private.pem'), '--public-key', str(base/'keys/release-public.pem'), '--approve-manifest-sha256', hash_], check=True)
PY
```

OpenSSL asks for the key passphrase locally. Reconnect for publication. The next block defaults to **dry-run**, requests no PAT and makes no network connection. Only typing `PUBLISH THIS EXACT BUILD` adds `--publish`. Actual publication then prompts invisibly for the expiring owner PAT. Nothing is transferred to the VPS by this tool; GitHub receives only the three signed data files, and the VPS must still be in dry-run until its own first-apply authorization.

```sh
python - <<'PY'
from pathlib import Path
import re, subprocess, sys
sys.stdin = open('/dev/tty')
base = Path.home()/'.local/share/mariyas-owner'
seq = input('Owner sequence: ').strip()
hash_ = input('Exact signed manifest SHA-256: ').strip()
assert seq.isdigit() and int(seq) > 0
assert re.fullmatch('[a-f0-9]{64}', hash_)
command = ['python', str(base/'tools/publish_release.py'), '--candidate', str(base/('candidate-'+seq)), '--public-key', str(base/'keys/release-public.pem'), '--approve-manifest-sha256', hash_]
answer = input('Enter for DRY-RUN; type PUBLISH THIS EXACT BUILD only after publication approval: ')
assert answer in ['', 'PUBLISH THIS EXACT BUILD']
if answer:
    command.append('--publish')
subprocess.run(command, check=True)
PY
```

No inbound VPS SSH, FTP or manual website-folder upload is used. Stop after any refusal; do not force-push, bypass verification or reuse a lower sequence.
