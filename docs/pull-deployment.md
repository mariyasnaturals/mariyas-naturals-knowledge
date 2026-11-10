# Owner-enabled GitHub Actions → VPS pull deployment

This is the current deployment architecture. It supersedes SSH-push, FTP and manual website-folder uploads. The repository had artifact-only Actions jobs, not an active VPS SSH-push job; none was enabled. No VPS connection/configuration, signing-secret setup, release publication, deployment, DNS change or merge is performed by this task.

## Architecture and trust boundary

1. Approved source lives on `feature/authentic-media-typography`. The manual **Publish approved staging static release** workflow accepts only that branch and its exact dispatch SHA; it never checks out an arbitrary input ref.
2. A GitHub-hosted Ubuntu runner installs locked dependencies, checks types/formatting/unit/pull-safety tests, builds for `.cloud`, runs static/source-policy/browser/accessibility checks, then packages compiled `dist/` contents. No source build occurs on the VPS.
3. A separate publication job waits for the owner-protected `staging-release` GitHub Environment. It requires its `STAGING_RELEASES_ENABLED=owner-approved` variable and an environment-only signing secret. With no owner setup it fails closed.
4. That job signs `manifest.json` using a release-only Ed25519 key and fast-forwards the dedicated `staging-release` branch. Each commit contains exactly `release.zip`, `manifest.json`, `manifest.sig`. No executable deployment script, source tree, credential or VPS SSH key is published there. The history versions releases; publication never force-pushes.
5. CloudPanel cron, as **mariyascloud**, makes an **outbound** GitHub fetch using a read-only deploy key and pinned GitHub host trust. It reads the three blobs without checkout, submodules or hooks. It never downloads/executes a deployment script from that branch.
6. The separately owner-installed `pull_deploy.py` checks the pinned signing public key, signature, archive/per-file hashes, allowed paths/types, staging metadata, approved local image inventory and language roots. It extracts into owner-only state outside all web roots. Dry-run reports planned changes without writing/backing up the website.
7. Apply is disabled unless the owner enables it. First apply additionally requires a local approval matching **both the exact manifest digest and the existing static-file inventory digest** from dry-run. Every apply makes and verifies a backup before changing static files. `.well-known` and all dotfiles/dot-directories are never traversed or modified.

All later releases still require GitHub Environment approval before they become visible to live cron. A source-branch push or PR validation does not publish a deployable release. No self-hosted runner, inbound VPS SSH, FTP or root key in GitHub is used.

## What is prepared, not enabled

- `.github/workflows/staging-release.yml`: manual validation/build/sign/publication workflow.
- `ops/pull_deploy.py`: standalone Python 3 + Git + OpenSSL puller, installed once from a reviewed commit via Web Console. Never auto-update this trusted script from a release.
- `ops/prepare_release.py`, `ops/publish_release.py`: run on GitHub-hosted runners only.
- `ops/pull-config.example.json`: disabled example; its document-root and key fingerprint placeholders deliberately cannot work unchanged.
- `tests/pull/test_pull.py`: local safety tests; existing PR CI runs them without publishing a release.
- `ops/dry_run_local.py`: local-only rehearsal with the actual compiled ZIP; temporary fixtures/test keys are destroyed. [Recorded rehearsal](pull-dry-run.json).

The earlier staging artifact workflow may still produce downloadable review bundles. It does not connect to hosting and is not a deployment trigger. The release publication workflow has only `workflow_dispatch`.

## Owner actions — Hostinger VPS Web Console only

These steps are instructions, not changes already made. Do not enable live cron until explicit first-deployment approval is given for the concrete dry-run plan.

### A. Review and prepare GitHub controls

1. Review the operations commit/scripts and this guide. GitHub normally needs a new workflow on the default branch before exposing **Run workflow**. Its installation on the default branch is a separate owner-reviewed merge/registration decision; do not merge merely as an automatic step of this task. Source remains pinned to the explicitly approved feature branch. Switching to main later requires a reviewed change to the workflow and puller's source-branch policy.
2. In repository **Settings → Environments**, create `staging-release`. Require an owner/reviewer approval for every publication, prevent self-review where supported, and prohibit administrator bypass. Restrict deployment branches to the exact `feature/authentic-media-typography` branch. Do not allow arbitrary branch/tag patterns. If your plan cannot enforce required reviewers for this private repository, stop; do not rely on the environment name as an approval control. Keep live cron disabled until an equivalent reviewed approval mechanism exists.
3. Protect the approved source branch/default branch against unreviewed writes. Protect the `staging-release` branch against deletion/force-push and unauthorized direct writes. Allow only the reviewed Actions publisher to update the release branch under your repository's ruleset capabilities. Do not grant Actions a blanket bypass on the source/default branches. The short-lived publication token has contents-write only in that job; GitHub cannot scope that permission to one branch, so repository rules and environment protection are part of the security boundary.
4. Add environment variable `STAGING_RELEASES_ENABLED` with value `owner-approved` only after those controls are configured. Do not put signing secrets in repository-wide variables or PR/build-job secrets.

### B. Verify the actual CloudPanel root before marking it

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

### C. Create a read-only GitHub deploy key on the VPS

As `mariyascloud` in Web Console:

```sh
ssh-keygen -t ed25519 -N '' -C 'mariyascloud-staging-readonly' -f "$HOME/.ssh/github-staging-readonly"
chmod 600 "$HOME/.ssh/github-staging-readonly"
cat "$HOME/.ssh/github-staging-readonly.pub"
```

Copy **only the .pub value** into repository **Settings → Deploy keys → Add deploy key**. Leave **Allow write access unchecked**. Keep the private deploy key on the VPS only; never put it in GitHub Actions, source control or chat. An unencrypted key is needed for unattended cron; it is limited to read access to this private repository and protected by owner-only filesystem permissions.

Pin GitHub's SSH host key before any unattended fetch. Obtain GitHub's current public host keys/fingerprints from its official HTTPS documentation/API in a trusted browser. If using `ssh-keyscan`, write to a candidate file first and compare `ssh-keygen -lf <candidate>` against GitHub's independently obtained official fingerprints. Only after matching, install the verified entry in `$HOME/.ssh/github-staging-known-hosts` and set mode 600. Do not use `StrictHostKeyChecking=no`, an unverified scan, or blindly accept an interactive prompt.

Test outbound repository read access from Web Console using the new key and that exact known-hosts file, with `IdentitiesOnly=yes`, `BatchMode=yes` and `StrictHostKeyChecking=yes`. An `ssh -T git@github.com` authentication success can exit with status 1 because GitHub provides no shell. A read-only `git ls-remote` is a better repository-access test. No inbound VPS SSH authentication or open inbound SSH port is needed. If outbound GitHub SSH is blocked, resolve that separately; do not weaken host checks. This implementation uses GitHub's standard SSH endpoint; adapting to its documented port-443 endpoint requires a reviewed trust/config change.

### D. Establish the release-signing trust root

The signing key is **not an SSH login key** and grants no VPS access. Prefer generating it on a trusted owner workstation with OpenSSL; copy its public PEM to the VPS through Web Console and put its private PEM directly into GitHub's protected Environment secret.

```sh
openssl genpkey -algorithm ED25519 -out release-signing-private.pem
openssl pkey -in release-signing-private.pem -pubout -out release-public.pem
sha256sum release-public.pem
```

In GitHub **Environment staging-release → Secrets**, add `STAGING_RELEASE_SIGNING_KEY` with the complete private PEM. Pin the public PEM as `$HOME/.config/mariyas-pull/release-public.pem` and record/verify its SHA-256 independently in config. Keep a protected offline recovery copy of the signer or plan an explicit key rotation. Do not store the private signer on the VPS.

If Web Console is the only available trusted setup device, the owner can generate a **temporary** release signer as `mariyascloud` in a private directory, transfer it directly to the protected Environment secret, retain the public PEM, then remove the private file from the VPS. Avoid exposing it in shared screenshots, logs or chat. Console history/clipboard/storage may retain sensitive data, so off-VPS generation is preferred; deleting a file is not a secure-erasure guarantee. No root SSH key is ever required in GitHub.

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

### G. Publish one approved validated release, then inspect dry-run

1. From GitHub's manual release workflow, choose the approved feature branch and paste its exact full tip SHA. The build checks it equals the workflow dispatch SHA. Do not choose an unapproved branch or blindly use a moving branch name as the approval record.
2. Wait for all validation/build/browser checks. Review source SHA, build results and artifact before approving the protected publication job. With missing controls/variable/signing key the job must remain blocked/fail. This task does not run that publication job.
3. After owner approval, Actions publishes the three signed data files to `staging-release`, not to the VPS. Cron's dry-run now verifies that release. Check its log in Web Console: exact source SHA, release commit, signature success, manifest digest, current static inventory digest, all writes/removals and the `.well-known`/dotfile preservation plan.
4. Confirm current .in-only imagery, .cloud noindex/nofollow and disabled commerce remain in the validated build. The existing approved UI-baseline guard intentionally requires a separate reviewed baseline update for later UI changes.

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
5. Only after the first apply and live review succeed, change the CloudPanel command to replace **--dry-run** with **--apply**. Keep the schedule/user/log unchanged. Each new deployable release still requires owner approval in GitHub before signing/publication. Remove/archive the used first-approval file outside public roots if desired; existing deployment state gates subsequent releases.

## Backup, rollback and interrupted transactions

- Before each live replacement/removal the puller archives every non-hidden static file into `state/backups/<id>/site.zip`, writes a hash/mode inventory and reads every archived file back to verify it. It confirms the live inventory has not changed during backup. Protected `.well-known`/dot paths are never read, overwritten or removed. Maintain their independent administrator backup.
- New assets are installed before HTML, with atomic per-file replacement and fixed non-executable file permissions. New served directories are 0755; private state is 0700. This is **not** an atomic whole-site switch: a brief mixed-version window is possible. No CloudPanel root/symlink/server-config change is needed. Do not concurrently edit the static root.
- Retired non-hidden files are removed only after a verified backup and the planned inventory. All backups stay outside public roots; no automatic retention deletion is implemented. Monitor free space/logs. Back up off-server as appropriate and prune only after verifying retained copies and that no pending transaction/desired rollback depends on them.
- For rollback, pause live cron and other writers, inspect the chosen backup ID, then run the installed script with `--rollback BACKUP_ID` first (dry-run). After separate rollback authorization use `--rollback BACKUP_ID --apply`. A new verified backup of the current static site is made before rollback. The high-water release sequence is retained, so cron cannot immediately redeploy the release you just rolled back. Publish a **new workflow run** with a larger sequence for a subsequent approved release; rerunning the same Actions run does not advance its sequence.
- A normal write failure attempts restoration from the verified pre-write backup. If the process is killed or restoration cannot complete, `pending.json` blocks all subsequent deployments. Pause cron, inspect the journal/backups/space/permissions in Web Console, then run `--recover` (dry-run) and, only after authorization, `--recover --apply`. Recovery uses only the backup named by the pending transaction and removes only reserved transaction temp files outside protected dot trees. Inspect the site and resolve the cause before resuming cron. If recovery fails, keep cron paused and use the independent administrator backup; do not remove the journal just to bypass the block.

## Security validation and remaining prerequisites

The local suite tests signature/archive/file tampering; signed wrong site/branch/robots/commerce/media policy; traversal, dotfile/.well-known injection, duplicate ZIP entries, server scripts and symlinks; first-apply approval drift; corrupt backup refusal; partial-write restore; interrupted recovery; rollback/replay behavior; lock exclusion; and wrong user/WordPress/public-state configuration. The actual compiled archive is also signed/verified and rehearsed entirely in temporary local directories. See [results](pull-validation.md) and [raw rehearsal](pull-dry-run.json).

Checksums alone do not establish approval: the pinned signature and owner-protected publication job establish the release trust boundary. A compromised repository administrator/approver/signing key or site-user account is outside this protection; approved malicious browser JavaScript could still harm visitors. Keep account access/MFA, branch/environment controls, script/config ownership and signing-key recovery under review. The key is read-only for GitHub access, not for local filesystem writes by the site user. No server execution privilege is granted to release payloads.

No real VPS network/authentication/root binding/cron behavior has been tested here. Owner verification of the CloudPanel root, outbound GitHub host trust/read-only key, protected environment, installed script checksum, dry-run log and explicit first-apply approval remain prerequisites. Nothing is deployed by merely pushing this operations commit.
