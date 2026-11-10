# Owner-signed releases for a private GitHub Free repository

For first activation use the [Phase 2 readiness checklist](activation-readiness.md), [beginner Android guide](android-owner-setup.md) and [exact Web Console guide](vps-first-activation.md). These guides pin tools to da0c288 and stop at read-only preflight; no setup or deployment is authorized by documentation alone.

This replaces the approval mechanism from `abeb99f`. The private repository stays private. No paid Environment Required Reviewers, private branch protection, Actions signing secret or independently protected workflow is assumed. No VPS configuration, release publication, deployment or merge is performed by this task.

## Why approval moved outside GitHub Actions

A manual workflow button, environment name, repository variable or secret is not an independent approval boundary when repository writers can edit workflows and protection is unavailable. A signing key in GitHub could then be used by an edited workflow. An automatically running external signer that trusts a branch name, green CI or unsigned approval flag has the same problem.

The simplest supported solution is **owner-controlled local signing and publication**. Actions builds an unsigned candidate with read-only repository permissions. The owner checks the exact source/workflow/run/artifact, signs its exact manifest with an encrypted Ed25519 key in private Android Termux storage, and explicitly publishes the three signed data files to GitHub from a separately installed trusted tool. Termux does not SSH into the VPS. The VPS continues its outbound read-only pull and pinned-signature verification unchanged.

Signing can happen in airplane mode after downloading/reviewing the candidate. This is an offline-capable approval, not a claim that an ordinary Android phone is air-gapped. If Termux or another trusted local signing device is unavailable, retain build-only artifacts and dry-run hosting; Web Console alone is not an offline signing device. A separate independently administered signing service could replace this step, but is more complex and is not prepared here.

## Architecture and safeguards

1. The manual **Build staging candidate (owner signs separately)** workflow accepts the exact candidate tip SHA on `feature/authentic-media-typography`. GitHub-hosted runners validate/build static Astro, including browser/accessibility and source-policy checks. Workflows contain no signing/publication job, signing secret or contents-write permission.
2. The owner independently reviews the source and build workflow at that SHA, the successful run and its immutable run ID/attempt, plus the downloaded candidate. Build checks reported inside the artifact are assertions, not independently authenticated proof; the owner must check the real GitHub run and what its workflow executed. A green badge alone is insufficient.
3. Pinned owner tools, installed separately from a reviewed operations commit, inspect the artifact as data. They enforce local image hashes from the separately installed `owner-media-policy.json`; no tool, policy or script from the build artifact is executed. The candidate manifest binds source SHA, archive/per-file hashes, policy, run ID/attempt and an owner-selected increasing sequence.
4. The owner explicitly approves that exact manifest digest and unlocks the local encrypted signing key. Before publication, the separate publisher rechecks the signature, data and approved digest, snapshots the verified bytes and requires `--publish`. Its default is dry-run with no GitHub connection. An owner PAT is prompted only for actual publication and is never stored by the tool.
5. Only `release.zip`, `manifest.json` and `manifest.sig` go to `staging-release`, using normal fast-forward publication. No source checkout on the owner publisher or VPS; no scripts/credentials in the release branch. Unsigned/malformed/changed releases cannot pass the unchanged VPS verifier. First apply still requires local approval matching the release digest AND current site inventory; verified backups, rollback, replay protection, locking and `.well-known`/dot-path preservation remain intact.

Without branch protection, repository writers may still delete/replace release data or create arbitrary workflow runs. They cannot create a new accepted release without the off-GitHub owner key. They can cause denial of service, and a valid older release can be replayed to a fresh installation that has no prior sequence state. The existing exact first-apply approval and retained high-water sequence address that case. Do not treat the release branch itself as the trust root. Do not reset deployment state or bypass signature failures.

## Minimum one-time owner setup

### A. GitHub — no paid protection dependency

1. Keep repository visibility **private**. Set default Actions workflow permissions to read-only where available; remove any existing repository/Environment signing secrets and publication PATs. Retire `STAGING_RELEASES_ENABLED` and the old Environment gate. If a signing key was ever placed in GitHub/CI or its exposure is uncertain, consider it exposed: generate a new local key and separately approve installing its public key on the VPS. Do not reuse that key. These are owner instructions; no settings/secrets were changed by this task.
2. Review/register the build-only workflow on the default branch when separately authorized. GitHub's manual Run workflow UI normally requires default-branch registration. Do not merge as an automatic setup action. Select the candidate feature branch and exact SHA when running it. GitHub Free private Actions minutes/storage limits still apply.
3. Create an expiring **fine-grained PAT**, restricted to this repository, with **Contents read/write** (Metadata read is implicit). No Actions/Workflows/Administration permissions are required by the publisher. Do not put this token in Actions, source, public directories, command arguments or shell history. Paste it only into Git's or the trusted publisher's hidden password prompt. GitHub cannot restrict this token to one branch; keep it owner-controlled and revoke it if lost. The VPS uses a different, read-only deploy key.

### B. Android Termux — independent owner tooling and signer

Install Termux from its maintained official distribution. Locally install `python`, `git` and `openssl-tool` using Termux's package manager. No SSH login to the VPS is involved. Grant Downloads access with `termux-setup-storage` if needed. Keep tools, candidate state and keys in Termux's private home, never Android Downloads/shared storage or a repository checkout that CI/source updates can overwrite.

```sh
umask 077
mkdir -p "$HOME/.local/share/mariyas-owner/tools" "$HOME/.local/share/mariyas-owner/keys"
chmod 700 "$HOME/.local/share/mariyas-owner" "$HOME/.local/share/mariyas-owner/tools" "$HOME/.local/share/mariyas-owner/keys"
```

Install these five files from the **exact reviewed operations commit in the handoff**, into the private `tools` directory: `prepare_release.py`, `publish_release.py`, `pull_deploy.py`, `owner-media-policy.json`, and `owner-tools.sha256`. Never install tools from a candidate artifact, a moving branch, a workflow output or an unreviewed update. Review the pinned code/checksums independently. One method uses Git HTTPS authentication in Termux, not VPS SSH:

```sh
(
set -eu
OPS_SHA='REPLACE_WITH_EXACT_REVIEWED_OPERATIONS_COMMIT_FROM_HANDOFF'
OWNER_DIR="$HOME/.local/share/mariyas-owner"
git -c credential.helper= clone --bare https://github.com/mariyasnaturals/mariyas-naturals-knowledge.git "$OWNER_DIR/setup.git"
for file in prepare_release.py publish_release.py pull_deploy.py owner-media-policy.json owner-tools.sha256; do
  git --git-dir="$OWNER_DIR/setup.git" show "$OPS_SHA:ops/$file" > "$OWNER_DIR/tools/$file"
done
cd "$OWNER_DIR/tools"
sha256sum -c owner-tools.sha256
chmod 600 ./*
)
```

The bare setup clone contains source objects but is never checked out or executed. Git prompts for the owner's username and PAT; do not embed credentials in the URL. The files are frozen owner tools, not auto-updated. Future tooling/image-policy changes require a new owner review and explicit reinstall. File hashes confirm the selected reviewed snapshot; a checksum downloaded from an untrusted revision does not establish trust by itself.

Generate an encrypted signing key **on Android**, with a strong passphrase entered at the OpenSSL prompt:

```sh
umask 077
openssl genpkey -algorithm ED25519 -aes-256-cbc -out "$HOME/.local/share/mariyas-owner/keys/release-private.pem"
openssl pkey -in "$HOME/.local/share/mariyas-owner/keys/release-private.pem" -pubout -out "$HOME/.local/share/mariyas-owner/keys/release-public.pem"
sha256sum "$HOME/.local/share/mariyas-owner/keys/release-public.pem"
```

Keep an encrypted recovery copy separately. Never copy the private key/passphrase into GitHub, Web Console, the VPS, chat, screenshots or shared storage. Through Hostinger Web Console, copy **only the public PEM** to the puller's private `release-public.pem` path and pin/independently compare its SHA-256 in config. If the VPS already pins a genuinely offline owner key, it can be retained. Key rotation is a separate authorized setup action; nothing is rotated here.

### C. Verify the actual CloudPanel root before marking it

1. Use Hostinger's dashboard **VPS → Manage → Browser terminal/Web Console**. No Termux/external SSH login is needed. If the console starts as root, switch to the existing site user with `su - mariyascloud`. Confirm `id -un` prints exactly `mariyascloud`. Do not run the puller as root; it refuses other users.
2. In CloudPanel, inspect the existing **www.mariyasnaturals.cloud** site. Confirm **Static HTML**, its actual site user, HTTPS binding and exact document root. Record the displayed path; no path is assumed here. Confirm it is isolated from `.in`, `.com`, WordPress and any shared/symlinked root. If DNS/SSL/binding/site type/permissions need changing or the root is uncertain, stop and obtain separate authorization. This task does not configure them.
3. Inspect the directory in the Web Console as the site user. It must contain only expected static website files, with no WordPress/source/credential tree or symlinks in managed content. Take an independent owner backup of the entire staging site, including protected configuration and `.well-known`, outside **every** public root. Verify that backup opens. The puller's own verified transactional backups cover non-hidden static files only: protected dot paths are never changed or backed up by it.
4. Set a shell variable to the exact path you personally verified. This example is intentionally a placeholder:

```sh
DOCROOT='/REPLACE_WITH_VERIFIED_CLOUDPANEL_STATIC_ROOT'
# Only after checking this is the isolated .cloud site, confirm the target:
printf '%s\n' 'https://www.mariyasnaturals.cloud' > "$DOCROOT/.mariyas-cloud-root"
chmod 600 "$DOCROOT/.mariyas-cloud-root"
mkdir -p "$HOME/.local/bin" "$HOME/.config/mariyas-pull" "$HOME/.local/state/mariyas-pull" "$HOME/.ssh"
chmod 700 "$HOME/.config/mariyas-pull" "$HOME/.local/state/mariyas-pull" "$HOME/.ssh"
```

The marker is an operator assertion, not automatic proof of CloudPanel binding. Never create it on an unverified path. Do not change a document root or make a symlink to accommodate this tool.

### D. Create a read-only GitHub deploy key on the VPS

As `mariyascloud` in Web Console:

```sh
ssh-keygen -t ed25519 -N '' -C 'mariyascloud-staging-readonly' -f "$HOME/.ssh/github-staging-readonly"
chmod 600 "$HOME/.ssh/github-staging-readonly"
cat "$HOME/.ssh/github-staging-readonly.pub"
```

Copy **only the .pub value** into repository **Settings → Deploy keys → Add deploy key**. Leave **Allow write access unchecked**. Keep the private deploy key on the VPS only; never put it in GitHub Actions, source control or chat. An unencrypted key is needed for unattended cron; it is limited to read access to this private repository and protected by owner-only filesystem permissions.

Pin GitHub's SSH host key before any unattended fetch. Obtain GitHub's current public host keys/fingerprints from its official HTTPS documentation/API in a trusted browser. If using `ssh-keyscan`, write to a candidate file first and compare `ssh-keygen -lf <candidate>` against GitHub's independently obtained official fingerprints. Only after matching, install the verified entry in `$HOME/.ssh/github-staging-known-hosts` and set mode 600. Do not use `StrictHostKeyChecking=no`, an unverified scan, or blindly accept an interactive prompt.

Test outbound repository read access from Web Console using the new key and that exact known-hosts file, with `IdentitiesOnly=yes`, `BatchMode=yes` and `StrictHostKeyChecking=yes`. An `ssh -T git@github.com` authentication success can exit with status 1 because GitHub provides no shell. A read-only `git ls-remote` is a better repository-access test. No inbound VPS SSH authentication or open inbound SSH port is needed. If outbound GitHub SSH is blocked, resolve that separately; do not weaken host checks. This implementation uses GitHub's standard SSH endpoint; adapting to its documented port-443 endpoint requires a reviewed trust/config change.

### E. Install the reviewed puller and disabled config

1. Inspect/copy `ops/pull_deploy.py` from the exact operations commit reported in the handoff. Install that reviewed text through Web Console into `$HOME/.local/bin/mariyas-pull.py` with mode 700. This is a one-time control-script installation, not a website-folder upload or a source build. Do not clone/run arbitrary source branches on the VPS, and do not fetch this script from the release branch each cron run.

   To install without a folder upload, use the read-only key in Web Console to fetch the reviewed operations commit into a private bare setup cache, then extract **only** the script blob. Replace the SHA placeholder with the exact reviewed operations commit from the handoff, not a branch name:

```sh
(
set -eu
OPS_SHA='REPLACE_WITH_REVIEWED_FULL_OPERATIONS_COMMIT_SHA'
SETUP_CACHE="$HOME/.local/state/mariyas-pull/setup.git"
export GIT_SSH_COMMAND="ssh -i $HOME/.ssh/github-staging-readonly -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=$HOME/.ssh/github-staging-known-hosts"
git -c core.hooksPath=/dev/null init --bare "$SETUP_CACHE"
git -c core.hooksPath=/dev/null --git-dir="$SETUP_CACHE" fetch --depth=1 git@github.com:mariyasnaturals/mariyas-naturals-knowledge.git "$OPS_SHA"
git -c core.hooksPath=/dev/null --git-dir="$SETUP_CACHE" show "$OPS_SHA:ops/pull_deploy.py" > "$HOME/.local/bin/mariyas-pull.py.pending"
printf '%s  %s\n' '67fd3e74398d9b9a58ebc47d8d5ffcfa03c03d1ad9348665f76c46d1721b0bf3' "$HOME/.local/bin/mariyas-pull.py.pending" | sha256sum -c -
chmod 700 "$HOME/.local/bin/mariyas-pull.py.pending"
mv "$HOME/.local/bin/mariyas-pull.py.pending" "$HOME/.local/bin/mariyas-pull.py"
unset GIT_SSH_COMMAND
)
```

The subshell stops if a fetch/show/checksum command fails, before installing anything. The pinned checksum belongs to this task's reviewed puller; future script upgrades require a new review and checksum. There is no source checkout or source build here. Use the same exact reviewed commit to read the example config, then fill its local verified paths through Web Console. Do not run installer scripts from a moving/unapproved branch.

2. Verify Python 3, Git and OpenSSL already exist. If missing, stop and ask the authorized administrator to provision them separately; do not install packages, runners or alter system config as an unreviewed step.
3. Copy `ops/pull-config.example.json` to `$HOME/.config/mariyas-pull/config.json`, mode 600. Replace the document-root placeholder with the verified CloudPanel path and the public-key hash placeholder with the verified PEM hash. Confirm every state/key/script/config/log path is outside all public roots. Leave **enabled: false**.
4. Precreate a private cron log:

```sh
touch "$HOME/.local/state/mariyas-pull/pull.log"
chmod 600 "$HOME/.local/state/mariyas-pull/pull.log"
/usr/bin/python3 "$HOME/.local/bin/mariyas-pull.py" --config "$HOME/.config/mariyas-pull/config.json"
```

Before the release branch exists, a refused/missing Git ref is expected and changes no website files. No live `--apply` invocation is authorized yet.

### F. CloudPanel cron — dry-run first

In the existing .cloud site's **Cron Jobs** UI, verify the execution user is **mariyascloud**. Schedule every five minutes (`*/5 * * * *`). Command (verify the existing user's home path first):

```sh
/usr/bin/python3 /home/mariyascloud/.local/bin/mariyas-pull.py --config /home/mariyascloud/.config/mariyas-pull/config.json --dry-run >> /home/mariyascloud/.local/state/mariyas-pull/pull.log 2>&1
```

There is deliberately **no --apply**; `--dry-run` is explicit and also the default. Dry-run fetches/verifies/stages in private temporary state, prints the exact source/release commit, signed manifest hash, current inventory hash, planned writes/removals and protected paths, then removes the temporary staging extraction. It never changes website bytes, creates deployment backups or marks a release as deployed. It may update its private Git cache/lock/log. Overlapping runs skip under a nonblocking lock.

Do not use root cron or a self-hosted GitHub runner. If CloudPanel cannot schedule under the existing site user, stop and resolve that separately rather than changing user/permissions blindly.

### G. Every release — unavoidable explicit owner approval

1. In Android Chrome, review the exact source commit **and its build workflow/dependency changes**, then run the build-only workflow on that exact SHA. Verify the real run succeeded and ran all required checks, not just a similarly named job. Record its run ID and attempt. Download `unsigned-staging-candidate-RUN_ID-ATTEMPT` to Android Downloads. No deployment happens from the workflow or download.
2. Use only the independently installed owner tool. It reads the outer artifact ZIP safely as data; do not execute or install anything from that ZIP. Choose an owner sequence greater than every release already signed/deployed (record it in an owner ledger; do not derive approval from an editable workflow's run number). Inspect:

```sh
python "$HOME/.local/share/mariyas-owner/tools/prepare_release.py" inspect \
  --bundle "$HOME/storage/downloads/REPLACE_WITH_DOWNLOADED_ARTIFACT.zip" \
  --output "$HOME/.local/share/mariyas-owner/candidate-REPLACE_SEQUENCE" \
  --source-sha REPLACE_FULL_REVIEWED_SOURCE_SHA \
  --run-id REPLACE_RUN_ID --run-attempt 1 --sequence REPLACE_SEQUENCE
```

3. Compare the printed source SHA/run ID/attempt to GitHub. Review the exact candidate manifest, archive SHA-256, inventory, noindex/commerce/media policy and build results. The local validator does not prove arbitrary browser JS is harmless or CI truthful; source/workflow/artifact review is the owner's decision. If unclear, do not sign. A source push, green CI, manual workflow dispatch or unsigned artifact is never approval. Do not blindly copy a hash from chat/a PR/workflow instructions.
4. Optionally disconnect the phone from the network. Approve the exact locally inspected **manifest** digest (not the archive digest), unlocking the signing key only at the OpenSSL prompt:

```sh
python "$HOME/.local/share/mariyas-owner/tools/prepare_release.py" approve \
  --candidate "$HOME/.local/share/mariyas-owner/candidate-REPLACE_SEQUENCE" \
  --key-file "$HOME/.local/share/mariyas-owner/keys/release-private.pem" \
  --public-key "$HOME/.local/share/mariyas-owner/keys/release-public.pem" \
  --approve-manifest-sha256 REPLACE_EXACT_REVIEWED_MANIFEST_HASH
```

5. Reconnect. Verify publication in dry-run first; it requests no token and makes no network call. Add `--publish` to this **same command** only when ready to publish that exact approved build. The token is entered into a hidden prompt, never an argument/environment secret. Only the three signed data files go to GitHub; no website folder is uploaded to the VPS.

```sh
python "$HOME/.local/share/mariyas-owner/tools/publish_release.py" \
  --candidate "$HOME/.local/share/mariyas-owner/candidate-REPLACE_SEQUENCE" \
  --public-key "$HOME/.local/share/mariyas-owner/keys/release-public.pem" \
  --approve-manifest-sha256 REPLACE_EXACT_REVIEWED_MANIFEST_HASH
```

6. Cron remains dry-run until first deployment is separately approved. Inspect its Web Console log for the signed source, manifest digest, site inventory digest, writes/removals and protected paths. The signing/publication commands above are instructions for future owner use; none was run against GitHub during this task.

### H. First real deployment — separate explicit approval required

**Do not perform this activation during the preparation task.** After the owner explicitly approves the exact dry-run release, current-root inventory, backup/rollback plan and initial write:

1. Pause any other website writers/manual uploads and keep the independent staging backup. If the root inventory changes after approval, rerun/review dry-run and obtain an updated approval; do not reuse old digests.
2. As `mariyascloud`, create `$HOME/.local/state/mariyas-pull/initial-approval.json`, mode 600, containing exactly the two reviewed digests (not source SHA):

```json
{
  "manifest_sha256": "EXACT_SHA256_PRINTED_BY_DRY_RUN",
  "inventory_sha256": "EXACT_CURRENT_INVENTORY_SHA256_PRINTED_BY_DRY_RUN"
}
```

3. Set `enabled` to true in the private config only after that approval. Run the installed command once with **--apply** from Web Console. It will still refuse if digests changed, backup verification fails, space is insufficient, paths conflict, WordPress/source/symlinks are detected, another run holds the lock or a prior transaction is pending.
4. Verify the .cloud site on HTTPS/Android Chrome, all four language routes, JS/CSS/fonts/images, robots/noindex, current packs, navigation/story and disabled purchasing. Local file hashes do not prove CloudPanel binding, MIME types, certificate behavior or physical-device touch smoothness. No production domain is part of this check.
5. After the first apply and live review, keep cron paused or in **--dry-run**. Switching to automatic **--apply** requires separate explicit owner authorization; it is outside Phase 2. Each new deployable release still requires the owner's local inspection, exact-manifest signing and explicit publication; no GitHub approval feature is needed. Remove/archive the used first-approval file outside public roots if desired; existing deployment state gates subsequent releases.

## Backup, rollback and interrupted transactions

- Before each live replacement/removal the puller archives every non-hidden static file into `state/backups/<id>/site.zip`, writes a hash/mode inventory and reads every archived file back to verify it. It confirms the live inventory has not changed during backup. Protected `.well-known`/dot paths are never read, overwritten or removed. Maintain their independent administrator backup.
- New assets are installed before HTML, with atomic per-file replacement and fixed non-executable file permissions. New served directories are 0755; private state is 0700. This is **not** an atomic whole-site switch: a brief mixed-version window is possible. No CloudPanel root/symlink/server-config change is needed. Do not concurrently edit the static root.
- Retired non-hidden files are removed only after a verified backup and the planned inventory. All backups stay outside public roots; no automatic retention deletion is implemented. Monitor free space/logs. Back up off-server as appropriate and prune only after verifying retained copies and that no pending transaction/desired rollback depends on them.
- For rollback, pause live cron and other writers, inspect the chosen backup ID, then run the installed script with `--rollback BACKUP_ID` first (dry-run). After separate rollback authorization use `--rollback BACKUP_ID --apply`. A new verified backup of the current static site is made before rollback. The high-water release sequence is retained, so cron cannot immediately redeploy the release you just rolled back. For a subsequent approved release, inspect/sign/publish with a new, larger **owner-selected sequence**, recorded in the owner ledger. Re-running a workflow does not itself advance the signed sequence or grant approval.
- A normal write failure attempts restoration from the verified pre-write backup. If the process is killed or restoration cannot complete, `pending.json` blocks all subsequent deployments. Pause cron, inspect the journal/backups/space/permissions in Web Console, then run `--recover` (dry-run) and, only after authorization, `--recover --apply`. Recovery uses only the backup named by the pending transaction and removes only reserved transaction temp files outside protected dot trees. Inspect the site and resolve the cause before resuming cron. If recovery fails, keep cron paused and use the independent administrator backup; do not remove the journal just to bypass the block.

## Security validation and remaining prerequisites

The local suite also tests unsigned candidate handling, exact owner approval, key/signature mismatch, CI refusal, publication dry-run and artifact traversal. Existing pull safeguards still test signature/archive/file tampering; signed wrong site/branch/robots/commerce/media policy; traversal, dotfile/.well-known injection, duplicate ZIP entries, server scripts and symlinks; first-apply approval drift; corrupt backup refusal; partial-write restore; interrupted recovery; rollback/replay behavior; lock exclusion; and wrong user/WordPress/public-state configuration. The actual compiled archive is also signed/verified and rehearsed entirely in temporary local directories. See [results](pull-validation.md) and [raw rehearsal](pull-dry-run.json).

Checksums alone do not establish approval: the owner's off-GitHub signing key and the VPS's pinned public key establish the trust boundary. Editable workflows cannot access that private key. A compromised owner phone/tool installation, signing key or VPS site-user account is outside this protection. Repository writers can disrupt availability without paid branch protection, but cannot forge an accepted release. Owner review can still approve harmful client JS; signatures are not a code audit. Keep Android lock/encryption, account MFA, token expiry, offline recovery and pinned tool reviews under control.

No actual VPS authentication/root binding/cron behavior or Android/OpenSSL interaction has been tested here. Owner verification of root, outbound host trust/read-only key, signing public-key pin, installed tool checksums, VPS dry-run and separate first-apply approval remain prerequisites. The VPS script is byte-identical to `abeb99f`; an existing installation needs no script change for these schema-compatible owner signatures. If it was never installed, follow setup E/F above. No real key, secret or VPS setting was created/changed during this task.
