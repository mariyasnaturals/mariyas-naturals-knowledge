# Cinematic trust-version upgrade and deployment handoff

The completed VPS setup is owner-verified. Do not repeat root, backup, SSH, permission or signing-key setup. Preserve the existing encrypted private key and installed public key. This migration changes tools/policy, not keys. Nothing below is an authorization to sign, publish or apply.

Legacy ops at da0c288 and the original staging packager remain unchanged. Install the complete new `ops/cinematic` profile as a new private version: never mix a new verifier with old owner policy. The source website baseline is explicitly bbb867309e7267d92be751ff952acc7e1adfe123, not HEAD. Candidate successors must retain that exact src/public/Astro/dependency-lock content. The owner separately selects the exact full source SHA during inspection and signing.

Review the profile diff and `ops/cinematic/owner-tools.sha256` independently. Obtain the exact profile commit SHA and the SHA-256 of that checksum file from the final handoff, compare them with your reviewed version, then set the following variables. Do not use a branch tip or copy trust pins from an unsigned candidate.

## One-time Android update command

Set `PROFILE_SOURCE` to the reviewed full commit SHA, `PROFILE_SUMS` to the independently reviewed checksum-file hash, and `PROFILE_MODE=android`. Run the common block below in Termux. It prompts through Git for existing repository HTTPS authentication; never put tokens into commands or chat. Existing encrypted keys remain in `$HOME/.local/share/mariyas-owner/keys`.

## One-time VPS update command

Set the same reviewed `PROFILE_SOURCE` and `PROFILE_SUMS`, and `PROFILE_MODE=vps`. Run the common block below as mariyascloud in the existing authorized Web Console. It reuses the existing disabled config, read-only deploy key and strict known-hosts path. It does not replace the installed puller/config, alter permission modes of existing files, create cron or write the website.

## Common versioned installation block

```sh
export PROFILE_SOURCE PROFILE_SUMS PROFILE_MODE
python3 - <<'INSTALL'
import hashlib,json,os,pathlib,pwd,re,shlex,subprocess,tempfile
os.umask(0o077)
sha=os.environ['PROFILE_SOURCE']; pin=os.environ['PROFILE_SUMS']; mode=os.environ['PROFILE_MODE']
assert re.fullmatch('[a-f0-9]{40}',sha) and re.fullmatch('[a-f0-9]{64}',pin)
assert mode in ('android','vps')
home=pathlib.Path.home(); env=os.environ.copy()
if mode=='vps':
    assert pwd.getpwuid(os.geteuid()).pw_name=='mariyascloud'
    config=home/'.config/mariyas-pull/config.json'
    assert config.is_file() and not config.is_symlink() and config.stat().st_uid==os.geteuid() and not config.stat().st_mode & 0o077
    cfg=json.loads(config.read_text()); assert cfg['enabled'] is False
    assert cfg['site']=='https://www.mariyasnaturals.cloud'
    assert cfg['document_root']=='/home/mariyascloud/htdocs/www.mariyasnaturals.cloud'
    assert hashlib.sha256(pathlib.Path(cfg['release_public_key']).read_bytes()).hexdigest()==cfg['release_public_key_sha256']
    env['GIT_SSH_COMMAND']=shlex.join(['ssh','-i',cfg['deploy_key'],'-o','IdentitiesOnly=yes','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','-o','UserKnownHostsFile='+cfg['known_hosts']])
    repository='git@github.com:mariyasnaturals/mariyas-naturals-knowledge.git'
    parent=home/'.local/share/mariyas-pull/versions'
else:
    repository='https://github.com/mariyasnaturals/mariyas-naturals-knowledge.git'
    parent=home/'.local/share/mariyas-owner/versions'
assert all(not x.is_symlink() for x in [parent,*parent.parents])
parent.mkdir(parents=True,exist_ok=True,mode=0o700)
assert parent.stat().st_uid==os.geteuid() and not parent.stat().st_mode & 0o077
destination=parent/sha
assert not destination.exists() and not destination.is_symlink(), 'Existing version: stop, do not overwrite'
with tempfile.TemporaryDirectory(dir=parent) as temporary:
    work=pathlib.Path(temporary); cache=work/'source.git'
    def git(*args):
        return subprocess.check_output(['git','-c','core.hooksPath=/dev/null','-c','credential.helper=',*args],env=env)
    git('init','--bare',str(cache))
    git('--git-dir='+str(cache),'fetch','--depth=1',repository,sha)
    def blob(name): return git('--git-dir='+str(cache),'show',sha+':ops/cinematic/'+name)
    sums=blob('owner-tools.sha256')
    assert hashlib.sha256(sums).hexdigest()==pin, 'Independent checksum inventory mismatch'
    names={'prepare_release.py','publish_release.py','pull_deploy.py','media_policy.py','owner-media-policy.json'}
    entries=[line.split() for line in sums.decode().splitlines()]
    assert len(entries)==len(names) and {n for h,n in entries}==names
    staged=work/'verified'; staged.mkdir(mode=0o700)
    for digest,name in entries:
        assert re.fullmatch('[a-f0-9]{64}',digest)
        data=blob(name); assert hashlib.sha256(data).hexdigest()==digest, 'Tool/policy mismatch: '+name
        with (staged/name).open('xb') as f: f.write(data)
    (staged/'owner-tools.sha256').write_bytes(sums)
    for f in staged.iterdir(): f.chmod(0o600)
    subprocess.run(['python3','-B','-c','import media_policy; media_policy.load(); print("Verified cinematic policy")'],cwd=staged,check=True)
    assert not destination.exists() and not destination.is_symlink()
    destination.mkdir(mode=0o700)  # Exclusive reservation; never replace an existing version.
    for source in staged.iterdir():
        with (destination/source.name).open('xb') as target: target.write(source.read_bytes())
        (destination/source.name).chmod(0o600)
print('Verified version installed beside existing tools:',destination)
print('No active tool/config/key changed. Keep old tools for rollback.')
INSTALL
```

If a fetch/checksum/import check fails, stop; no active installation was replaced. Retain the old tool/config/public-key fingerprints. Use the old command to abandon this migration before any apply. Never downgrade during a pending transaction, reset `max_sequence`, remove state or restore an old config over newer deployment state. After a future apply, use this verified new tool's rollback/recovery and retained verified backup, then review any downgrade separately.

## Unsigned cinematic candidate workflow

Draft PR #2 is the one-file registration of `.github/workflows/staging-release.yml` on README-only main. Review its exact diff; it remains unmerged. After separately approved registration, choose Actions → Build staging candidate (owner signs separately), select feature/cinematic-homepage and supply the exact reviewed full source SHA. The selected branch supplies the compatible workflow, not the historical main copy. The workflow requires requested SHA == dispatch SHA, uses contents-read only, tests media with FFmpeg and produces unsigned-staging-candidate-RUN-ATTEMPT. It cannot sign or publish. Review actual run ID/attempt/source/workflow and download its artifact; a green PR preview is not this candidate.

## Exact independent inspection, signing and publication

The following are owner-device actions after independent review, not commands for CI or VPS. Set SOURCE_SHA, RUN_ID, RUN_ATTEMPT to the actual reviewed candidate/run; use a fresh private CANDIDATE directory and the downloaded unsigned artifact BUNDLE. SEQUENCE must exceed the server's retained max_sequence, including after rollback; use 1 only if genuinely no release has ever been accepted. PROFILE_SOURCE identifies the reviewed tool version and may differ from the candidate source.

```sh
TOOLS="$HOME/.local/share/mariyas-owner/versions/$PROFILE_SOURCE"
KEYS="$HOME/.local/share/mariyas-owner/keys"
python3 "$TOOLS/prepare_release.py" inspect --bundle "$BUNDLE" --output "$CANDIDATE" --source-sha "$SOURCE_SHA" --sequence "$SEQUENCE" --run-id "$RUN_ID" --run-attempt "$RUN_ATTEMPT"
```

Inspect the emitted exact manifest SHA-256, source, run, sequence, archive/per-file/media hashes and all four language pages. Obtain separate owner approval for those exact bytes. Then set APPROVED_MANIFEST to that approved digest; the existing private encrypted key stays on the phone and OpenSSL prompts locally.

```sh
python3 "$TOOLS/prepare_release.py" approve --candidate "$CANDIDATE" --key-file "$KEYS/release-private.pem" --public-key "$KEYS/release-public.pem" --approve-manifest-sha256 "$APPROVED_MANIFEST"
python3 "$TOOLS/publish_release.py" --candidate "$CANDIDATE" --public-key "$KEYS/release-public.pem" --approve-manifest-sha256 "$APPROVED_MANIFEST"
```

The second command is publication dry-run. After separate signed-publication approval, repeat it with `--publish`. The repository-scoped GitHub credential is prompted locally, not saved or passed in an argument. Only manifest.json, manifest.sig and release.zip go to staging-release; no force-push or VPS connection. Do not sign/download tools from the candidate.

## Server dry-run

After approved signed-data publication, as mariyascloud, use the newly reviewed version explicitly; keep the existing public key/config unchanged and enabled=false.

```sh
TOOLS="$HOME/.local/share/mariyas-pull/versions/$PROFILE_SOURCE"
CONFIG="$HOME/.config/mariyas-pull/config.json"
python3 -c 'import json,pathlib; assert json.loads((pathlib.Path.home()/".config/mariyas-pull/config.json").read_text())["enabled"] is False'
python3 "$TOOLS/pull_deploy.py" --config "$CONFIG" --dry-run
```

Review exact signed manifest/archive/release/source, sequence, would_write/would_remove, protected paths, current_inventory_sha256, available space and retained verified backup/recovery readiness. A missing staging-release ref before publication is an expected refusal. Dry-run writes private fetch/state/lock data but no site files or deployment backup.

## First apply requirements — not authorized by this handoff

A separate specific approval must bind manifest_sha256 AND the exact current_inventory_sha256 from the verified dry-run. Before an eventual apply, config must be explicitly enabled and a private owned 0600 state/initial-approval.json must contain exactly those two values under keys manifest_sha256 and inventory_sha256; refuse to overwrite an existing approval. Any site or release change requires a new dry-run and approval. Preserve signed sequence state and verified rollback reserve. Only then may the owner-authorized command be `python3 "$TOOLS/pull_deploy.py" --config "$CONFIG" --apply`. No cron is enabled. After apply verify the real .cloud URL, media/range responses, all languages, noindex, disabled commerce and protected files.

Rollback preview: `python3 "$TOOLS/pull_deploy.py" --config "$CONFIG" --rollback "$BACKUP_ID" --dry-run`. Actual rollback or pending-transaction recovery requires separate approval and `--apply` (plus `--recover` for the recorded pending backup). Do not bypass journal or replay guards. The verifier uses cryptographic pins to bind original dimensions/provenance; it does not install FFmpeg on VPS or alter source media.
