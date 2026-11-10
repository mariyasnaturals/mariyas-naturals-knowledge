# Phase 2 activation readiness

Status: **ready for owner read-only preflight and PR review; not authorized/ready for live deployment**. This audit reviews operations commit `da0c28877fa0b74b72b914984e62b19ddf91d2ed`. Website source, product images, Astro configuration, dependency lock, trusted owner tools and VPS puller remain byte-identical to that commit. No new homepage features or product images were added.

## Audit conclusions

- GitHub repository metadata reports **private**, default branch **main**. No visibility/settings/secrets were modified. Main currently contains only its initial README.
- The build workflow is manual-only, GitHub-hosted and contents-read. It builds unsigned candidates; there is no signing/publication job or production-credential input. Repository/Environment secrets were not inventoried: the owner must remove any previously configured signer/publication secret and rotate any signing key ever exposed to CI. No deployment credentials were registered here.
- Android approval is independent: separately installed pinned tools and image policy; an encrypted private Ed25519 key stays in private phone storage; exact-manifest signing is followed by separate explicit data-only HTTPS publication. The PAT and passphrase are prompted locally. A green CI run is not owner approval; source/workflow/run/artifact review remains necessary.
- VPS transport uses an outbound, pinned-host SSH connection to GitHub with a repository read-only deploy key. It does not use inbound VPS login, root keys, FTP, source builds or self-hosted runners. No SSH connection to the real VPS was attempted.
- Existing destination gates, first release AND current-inventory approval, verified backups, `.well-known`/dot-path preservation, lock/journal/recovery/rollback and sequence checks remain unchanged. Dry-run never writes the website. Independent full protected-file backups and physical Android/live-host verification are still owner prerequisites. Per-file writes are atomic; a brief mixed-version window remains possible. Backups/logs require monitoring; no automatic pruning is installed.
- The .in-only source policy passes across all 377 HTML pages: 12 approved originals, 36 local derivatives, 104 image elements; no active legacy .com imagery/hotlinks. .cloud noindex/nofollow and disabled purchasing remain intact.

No failing code/security blocker was reproduced in the local audit. This does not certify Android, GitHub credential configuration or the VPS. Repository writers without branch protection can disrupt release availability but cannot forge a fresh accepted owner signature; preserve sequence state and first-apply approval.

## Isolated registration PR — owner approval needed

[PR #2](https://github.com/mariyasnaturals/mariyas-naturals-knowledge/pull/2), `chore/register-staging-candidate` → `main`, commit **`04a1ae3388efbfcb0c15a97b84d61ed609f3dbb1`**. It adds exactly one file, `.github/workflows/staging-release.yml`, byte-identical to da0c288 (SHA-256 `2c6aa7b3311dc77cc7f1450e60fa4ed451cbfd50fcd69d86779ff5428542715f`). No main-branch tool/dependency/website files are needed: the manual dispatch selects the existing feature branch and that branch supplies all tests/build scripts/locked dependencies. Choosing main skips the job and produces no candidate.

GitHub normally exposes Run workflow only once the path is on the default branch. The owner must review the one-file diff and **separately authorize merging only PR #2** for registration. This task does not merge it. That decision permits future manual unsigned builds; it does not approve the full [implementation/readiness draft PR #1](https://github.com/mariyasnaturals/mariyas-naturals-knowledge/pull/1), device setup, key rotation, publication, cron or deployment. There is no push/PR publication trigger and no paid protection dependency. Branch filters are convenience guards, not the cryptographic approval boundary.

After registration, GitHub Actions → **Build staging candidate (owner signs separately)** → **Run workflow** → branch **feature/authentic-media-typography** → paste its exact reviewed full tip SHA. Review the actual successful run ID/attempt before downloading its unsigned artifact. No workflow was dispatched during Phase 2. Actual GitHub-hosted execution of the newly registered manual entry point remains to be verified after owner approval.

## Numbered owner checklist — separate stages, not blanket authorization

1. **Now: read-only hosting preflight.** In Hostinger Web Console switch to `mariyascloud`; independently check CloudPanel's .cloud Static HTML/domain/user/root binding. Run only step 1 of [the VPS guide](vps-first-activation.md), then stop for review. The expected root is `/home/mariyascloud/htdocs/www.mariyasnaturals.cloud`; do not alter it if reality differs.
2. Review PR #2's one-file diff; separately authorize workflow registration. No full website merge is required for registration.
3. After device-setup approval, follow [Android steps 1–4](android-owner-setup.md): packages/version checks, pinned/checksummed tools at da0c288, encrypted key, public export and verified external encrypted recovery. No prior Termux success is assumed.
4. After VPS-setup approval, follow VPS steps 2–6: full verified backup, new read-only deploy key, independently verified GitHub host key, checksummed puller, public-key pin and **disabled** config. Do not change existing website permissions. Stop on symlinks, unexpected ownership or uncertain root. Copy only the Android public key to Web Console.
5. After unsigned-build authorization and registration, run the candidate workflow, review its exact source/workflow/run and inspect the unsigned artifact on Android. Do not sign/publish in Phase 2.
6. Obtain separate approval for that concrete manifest before signing/publication. The VPS remains disabled and dry-run. Before a signed release exists, a missing-release-ref dry-run failure is expected, not permission to bypass validation.
7. After authorized publication, manually verify the VPS dry-run log and proposed writes/removals, signature, manifest and current inventory. Dry-run cron is only a future proposal; no cron was created here.
8. **Stop before any real write.** Separate explicit first-deployment approval must cover the release, inventory, verified backup and rollback. Automatic cron deployment remains unauthorized; this guide never enables it.

## Local results

| Validation                                                   | Result                                                                                                                                                                        |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Existing deployment/owner safety suite                       | 31 passed                                                                                                                                                                     |
| New copy-and-paste guide simulations                         | 6 passed; syntax, pinned hashes, unchanged read-only preflight/full backup, disabled config/public pin, drift refusal, encrypted recovery/export/restore and checksum refusal |
| Existing Node suite                                          | 9 passed                                                                                                                                                                      |
| Astro/TypeScript                                             | 52 files; zero errors/warnings/hints                                                                                                                                          |
| Prettier / whitespace                                        | Passed, including registered workflow with the source formatting configuration                                                                                                |
| Production static build                                      | 377 pages                                                                                                                                                                     |
| Static + image-source checks                                 | Passed; noindex/nofollow, four languages, disabled commerce and .in-only imagery                                                                                              |
| Chromium / accessibility / responsive / reduced-motion suite | 24 passed; initial local preview attempt failed on Astro telemetry's unavailable home config directory, then passed with ASTRO_TELEMETRY_DISABLED=1                           |
| Real compiled archive rehearsal                              | 435 files / 36 derivatives; disposable signatures; no-write dry-run; fixture backup/apply/rollback; protected .well-known retained                                            |
| Registration diff                                            | Exactly one workflow file; exact pinned bytes; manual/read-only/no publication                                                                                                |

New guide tests execute only in disposable fixtures, substituting target/home/user/terminal input and test passphrases. OpenSSL encryption, tar verification, checksums and file permissions run for real. They do not prove physical-device prompts, Android storage/export, CloudPanel binding, live site permissions, GitHub read-only key UI, PAT authorization, outbound SSH, cron or actual HTTP behavior. Those remain unresolved owner checks, not assumed successes. See [raw local rehearsal](pull-dry-run.json).

**Stopping point:** no merge, workflow dispatch, signed release publication, VPS login/configuration, website upload, key/credential registration, DNS/SSL/permission change or automatic cron deployment occurred. Phase 2 prepares reviewable files and PRs only. The first owner action is read-only; all later stages require explicit authorization.
