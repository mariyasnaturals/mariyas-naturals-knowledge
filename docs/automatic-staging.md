# Automatic cinematic staging — separate CI authority

The owner has authorized **Option B**, unattended deployment to `https://www.mariyasnaturals.cloud` only. The implementation is prepared in `ops/ci_staging/`. It is **not active until the first authenticated apply, public verification and scheduler installation succeed on the actual VPS**. A green PR or an unsigned preview never activates it. The earlier `ops/automatic_staging.py` remains an independent-owner-signed-release poller; it is not this push-to-deploy mechanism.

Routine flow after activation: push `feature/cinematic-homepage` → full `Validate foundation` CI → dedicated staging authentication job → outbound site-user poll (within about one minute) → verified backup/apply → public HTTPS checks → GitHub Deployment success. Failure before apply leaves the website unchanged. Failed public checks trigger verified rollback; failed recovery retains an interlock and stops further applies. There is no Android signing or manual ZIP transfer for routine approved UI changes.

## Trust boundaries

- Repository `mariyasnaturals/mariyas-naturals-knowledge`, ID `1451777898`; push workflow `.github/workflows/validate.yml`, ID `412532750`; branch `feature/cinematic-homepage`. PR/fork/other-branch/failed/skipped runs cannot deploy. Only the current branch tip and descendants of the explicitly installed source policy qualify.
- An installed policy hashes every tracked file except routine UI paths (`src/components/`, `src/styles/`, `src/i18n/`, `src/pages/`), `README.md` and the staging proof note. Workflows, dependencies, tests, scripts, configuration, other data, original media and public files are frozen outside GitHub. Adding, removing or modifying any gate file pauses deployment until a separately reviewed policy/runtime migration. A branch edit cannot approve its own new gate. Do not regenerate installed trust from HEAD during polling.
- GitHub branch protection must enforce administrators and prohibit force pushes/deletion. Existing stricter rules are retained. An unavailable protection API or unsupported GitHub plan blocks activation; the tools do not silently substitute an unprotected branch. The environment allows only the named branch. VPS independently verifies live protection, CI run/event/repository/workflow/attempt, each required check, both jobs, API artifact digest, dedicated signature, source policy, exact file inventory and media hashes. The automation signature alone is insufficient.
- GitHub Environment `cinematic-staging-auto` contains **only a newly generated staging Ed25519 private key**, not the original owner key. The signing job has no npm install/build and handles bounded static data. It has read-only repository permissions. Official actions are pinned to immutable SHAs. Builds never receive this key.
- Artifacts are deterministic ZIP_STORED files, bounded to 64 MiB archive / 128 MiB expanded / fewer than 5,000 files. The three-file authenticated envelope is `manifest.json`, `manifest.sig`, `release.zip`, schema `ci-staging/v1`, authority `github-actions-staging`. It cannot enter the separate owner-release path. Exact source/run/attempt/sequence, all file digests and approved original dimensions/hashes/provenance are recorded. All pinned public/media files must be present. Symlinks, hidden paths, traversal, unknown types and extra files fail closed. Four languages, noindex/nofollow, blocked robots and disabled commerce remain mandatory.
- New private state is the existing owner state directory's `ci-staging/` child. Its sequences, backups and receipts are separate. Both mechanisms use the original `lock`; an original-state pending marker blocks legacy applies during a CI transaction. Owner `current.json`, maximum sequence and signed history are unchanged. Any later owner-history change pauses CI until reviewed re-adoption. Keep the original owner config disabled while CI owns staging.
- Deployment runs as `mariyascloud`; exact root `/home/mariyascloud/htdocs/www.mariyasnaturals.cloud` and the existing `.mariyas-cloud-root` marker are checked by the trusted core. No root routine, inbound SSH deployment, production `.in`, DNS/TLS/CloudPanel changes, credential overwrites, `.well-known` or dotfile writes. Per-file replacements are atomic; the full-site update is journaled and recoverable, not a claim of a single atomic directory swap.

## One-time GitHub setup (owner administration connection)

Use an already authenticated, repository-administrator `gh` session and a reviewed checkout of the implementation commit. Review `ops/ci_staging/bundle.sha256` and its digest in `docs/ci-staging-checksums.md` independently before running new trusted code. No secret is requested in chat.

```sh
git switch feature/cinematic-homepage
git pull --ff-only
python3 -I ops/ci_staging/github_setup.py --output ci-staging-bootstrap/identity
```

The helper installs minimum branch protection only if none exists, refuses to weaken existing rules, creates a branch-restricted environment, generates a **separate** key, sends it directly to the environment secret using `gh`, records its public fingerprint, and deletes its temporary private copy. It is idempotent for a matching local public-key receipt; it never rotates an existing unknown identity. Partial setup stops for inspection. Only transfer `staging-public.pem` to the VPS, not any private key.

| Location                    | Name                            | Purpose                                                                                                                        |
| --------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| GitHub Environment secret   | `STAGING_AUTOMATION_KEY`        | Dedicated unattended staging key, created by helper                                                                            |
| GitHub Environment variable | `STAGING_AUTOMATION_KEY_SHA256` | SHA-256 of dedicated public PEM                                                                                                |
| Repository variable         | `STAGING_AUTOMATION_ENABLED`    | Initially `false`; enables authentication job when set to `true`                                                               |
| Private VPS file            | fine-grained GitHub token       | Selected repository only: **Contents read, Actions read, Administration read, Deployments write**; expiration/renewal required |
| Optional private VPS file   | Cloudflare token                | **Cache Purge only**, selected `.cloud` zone only, if HTML caching is actually observed                                        |

No `STAGING_DEPLOY_HOST`, `STAGING_DEPLOY_USER`, `STAGING_DEPLOY_KEY`, owner key, Actions VPS credential or write-enabled SSH key is needed. The VPS token cannot change source, protection or secrets. `Administration read` is needed to verify branch protection, not to change it. The fine-grained token must be approved by the repository owner before use.

## One-time VPS installation and activation

Use the already authorized site-user administration connection; **do not redo the completed CloudPanel binding, backup, permissions, SSH trust or original owner-key setup**. Substitute the actual existing owner config path if different from the example. All commands below run as `mariyascloud`. Place the separate public PEM and scoped API token in private mode-0600 files outside the web root using secure terminal/file transfer. Do not put tokens in command arguments, Git or logs. The public PEM fingerprint must match the GitHub setup receipt independently.

From a reviewed checkout on this administration machine (or a temporary verified checkout outside the web root), pin the immutable implementation source and independently reviewed checksum inventory. `IMPLEMENTATION_SHA` is the exact published commit containing this document, not a moving branch name. The digest is supplied in `docs/ci-staging-checksums.md`.

```sh
IMPLEMENTATION_SHA=REVIEWED_40_CHARACTER_COMMIT
BUNDLE_SHA256=INDEPENDENTLY_REVIEWED_INVENTORY_SHA256
OWNER_CONFIG=/home/mariyascloud/.config/mariyas-pull/config.json
CONFIG=/home/mariyascloud/.config/mariyas-pull/ci-staging.json
python3 -I ops/ci_staging/bootstrap.py \
  --owner-config "$OWNER_CONFIG" --source-sha "$IMPLEMENTATION_SHA" \
  --bundle-sha256 "$BUNDLE_SHA256"
RUNTIME=/home/mariyascloud/.local/lib/mariyas-ci/$IMPLEMENTATION_SHA
python3 -I "$RUNTIME/ops/ci_staging/install.py" prepare \
  --config "$CONFIG" --owner-config "$OWNER_CONFIG" \
  --source-sha "$IMPLEMENTATION_SHA" \
  --public-key /home/mariyascloud/.config/mariyas-pull/staging-public.pem \
  --github-token-file /home/mariyascloud/.config/mariyas-pull/ci-github-token
python3 -I "$RUNTIME/ops/ci_staging/install.py" plan --config "$CONFIG"
```

`bootstrap.py` fetches through the existing read-only SSH identity, checks the independent inventory digest, verifies every installed file from that exact Git commit, and installs a **new versioned directory**. Matching reruns preserve it; mismatches never overwrite it. Existing owner tools and keys are untouched. `prepare` verifies that the first owner-authorized deployment exists, rejects owner key reuse (including differently formatted PEM), pins the separate runtime/media/source policy, and writes a **disabled** configuration. The activation plan binds the actual site inventory, original signed-history digest, new public-key/trust fingerprints and exact source SHA.

Review that plan once. From the GitHub administrator session enable signing, then re-run **all jobs** of the successful **push** run at this exact implementation SHA. This reuses the existing push workflow; Draft PR #2's manual candidate registration is not needed and no PR is merged.

```sh
gh variable set STAGING_AUTOMATION_ENABLED --repo mariyasnaturals/mariyas-naturals-knowledge --body true
gh run list --repo mariyasnaturals/mariyas-naturals-knowledge --workflow 412532750 --event push --commit "$IMPLEMENTATION_SHA"
gh run rerun PUSH_RUN_ID --repo mariyasnaturals/mariyas-naturals-knowledge
```

Wait for **both** `static-site` and `authenticate-staging` to succeed. Rerun attempt IDs are part of artifact names and signatures. An expired/missing artifact blocks deployment. On the VPS explicitly approve the exact plan digest printed above; rerun `plan` if branch/site state changed:

```sh
python3 -I "$RUNTIME/ops/ci_staging/install.py" activate \
  --config "$CONFIG" --approve-plan-sha256 REVIEWED_PLAN_SHA256
python3 -I "$RUNTIME/ops/ci_staging/runtime.py" --config "$CONFIG"
```

This is the one-time first automated apply. It takes a fresh verified static backup in addition to the already verified complete/private initial backup. Success requires actual public HTTPS byte comparisons for all four homepages, robots, both MP4 range responses, both original photos, scripts, CSS and fonts, plus `/staging-revision.json` at the exact SHA. Public transformed/minified/stale HTML fails deliberately. A private successful receipt is written only after health checks; GitHub Deployment success must also be reported. A transport failure in reporting leaves a retriable `verified-report-pending` receipt, not a claimed success.

Only after this succeeds enable the site-user minute poller; it verifies the current successful run, public revision and receipt again before installing one marked cron line. Existing unrelated cron entries are preserved and a private pre-change crontab is saved.

```sh
python3 -I "$RUNTIME/ops/ci_staging/schedule.py" enable --config "$CONFIG"
```

Monitor private `ci-staging/poll.log`, `receipt.json`, `failure.json` and GitHub Deployments (`cinematic-cloud`). Apply normal private log rotation and disk/backups retention outside web root. Do not delete backups needed for rollback or reset replay counters. No root service, automatic original-signed-release cron or production deployment is enabled.

## Cloudflare observation and visibility

The poller checks actual HTTPS `cf-ray`/`cf-cache-status`; it does not assume Cloudflare fronts this hostname. When HTML caching is observed, it refuses to apply without a scoped purge configuration. Prefer an explicit `.cloud` HTML cache bypass rule if available. Alternatively add this private configuration, preserving existing pins:

```json
{
  "cloudflare": {
    "zone_id": "THE_32_HEX_CLOUD_ZONE_ID",
    "api_token_file": "/home/mariyascloud/.config/mariyas-pull/cloud-cache-token"
  }
}
```

The token file must be mode 0600. Purges name only exact `.cloud` URLs in the release/inventory, including canonical HTML directory URLs, in bounded batches. There is no `purge_everything` and no `.in`/`.com` purge. No Cloudflare secret is needed in Actions. HTML caching that appears only after an apply still causes public-byte verification to fail and triggers rollback; configure consistent bypass before enabling routine automation.

## Prove the next push, failed CI and restoration

Run from the clean trusted feature checkout using an already authenticated GitHub session **only after the exact current source is live and its Deployment status is successful**:

```sh
python3 -I ops/ci_staging/verify_next_push.py --execute-authorized-staging-proof
node scripts/verify-live-staging.mjs "$(git rev-parse HEAD)"
```

The first command refuses to create any commits before live activation is verified. It adds a harmless staging-only revision note, normally pushes it, waits for actual push CI and its exact public revision, pushes invalid note JSON to prove failed CI cannot deploy (observing the unchanged public revision for more than two poll intervals), and removes the note through the same normal push path. The restoration is attempted even on failure. No force push/history rewrite, Android signing or VPS command is used for these three revisions. Evidence is saved in ignored `ci-staging-bootstrap/next-push-evidence.json`. If network/auth fails during restoration, inspect Git/Actions and finish the normal restoration push; no success is inferred.

The second command records actual public playback, seeks eight captions, scrolls through the chapters and hair-shine navigation, checks console/network errors and source selection, and saves desktop 1440/mobile 390/mobile 360 PNGs and browser recordings. Pixel emulation is not a physical Android-device test. Never substitute localhost output for public proof. All four original file hashes are checked in build/CI and before every apply; no model, bottle or label is generated or modified by automation.

## Pause, rollback and trust upgrades

Pause/remove only this scheduler; preserve original signed history:

```sh
python3 -I "$RUNTIME/ops/ci_staging/install.py" pause --config "$CONFIG"
python3 -I "$RUNTIME/ops/ci_staging/schedule.py" disable --config "$CONFIG"
```

Inspect the private `receipt.json` backup ID and current inventory. To calculate the exact inventory digest without touching the site:

```sh
python3 -I "$RUNTIME/ops/ci_staging/install.py" plan --config "$CONFIG"
```

With no pending transaction, explicitly approve the current inventory and selected verified CI backup:

```sh
python3 -I "$RUNTIME/ops/ci_staging/install.py" rollback --config "$CONFIG" \
  --backup REVIEWED_BACKUP_ID --approve-inventory-sha256 CURRENT_INVENTORY_SHA256
```

Rollback uses the shared lock/interlock, saves a recovery backup, preserves protected files and replay state, purges when required and verifies public bytes. The authority remains paused. If a transaction was interrupted, inspect both pending journals first. `recover --config ... --approve-marker-sha256 EXACT_PARENT_PENDING_FILE_SHA256` requires the exact CI interlock digest, verifies the original owner-history pin and restores the pre-transaction inventory through the core before clearing it. Do not use a legacy owner recovery command on a CI interlock. Failed/uncertain recovery leaves the interlock; investigate rather than deleting it.

For runtime/gate changes, pause and disable the old scheduler, retain its versioned files/config/backups, independently review the new commit and bundle hashes, and prepare a **new configuration path** pointing to the new side-by-side runtime/trust. Existing differing config/adoption files are intentionally not overwritten automatically. Review state/history/inventory and a migration plan before re-adoption; do not delete or reset sequences to make it work. A failed installation can be removed before activation without changing the existing website or owner installation. Re-enable a previous version only if its exact policy/source and saved activation state still qualify; otherwise keep polling paused and use the verified site backup. This first implementation never silently migrates an active policy.
