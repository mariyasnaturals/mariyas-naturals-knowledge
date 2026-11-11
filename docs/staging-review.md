# PR previews and approved staging candidates

These are separate packaging paths. Neither workflow deploys, signs or publishes a release.

| Purpose                                      | Command                      | Output                                                                                                  | Approval status                                                                      |
| -------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Cinematic PR review                          | `npm run package:pr-preview` | `pr-preview-artifacts/`, `preview-manifest.json`, `UNAPPROVED-cinematic-pr-preview-<full-head-sha>.zip` | **UNAPPROVED — NOT FOR DEPLOYMENT**                                                  |
| Existing approved-baseline staging candidate | `npm run package:staging`    | `review-artifacts/`, `review-manifest.json`, existing candidate ZIP                                     | Baseline-validated but unsigned; independent owner approval/signature still required |

## Obtain and inspect the cinematic preview

Open Draft PR #3's successful **Validate foundation** Actions run. Download `UNAPPROVED-cinematic-pr-preview-<full-head-sha>` from Artifacts (private repository access required; 30-day retention). The old baseline bundle is not the current PR preview.

The PR job checks out the exact head instead of a synthetic merge, uses contents-read permission and does not persist checkout credentials. Packaging requires the intended repository, cinematic head/authentic-media base, matching event/checkout SHA, base ancestry and a clean committed checkout. Forks and non-PR CI events are refused. Local previews require the same origin and `feature/cinematic-homepage` branch.

The packager makes a fresh Astro build with fixed .cloud staging settings, reruns static/media validation, and enforces noindex/nofollow, deny-all robots and disabled/unmapped commerce. It verifies received original-media hash/dimension pins, derivative provenance and every copied public byte. It rejects symlinks, special/unsafe paths, unexpected files, source dotenv files and dirty/untracked source. Every archive entry is read back and checked against the validated inventory; input changes during packaging fail closed.

1. Extract the outer download into a new private folder outside every served root. Read `README-UNAPPROVED.md` and `preview-manifest.json`.
2. Verify the inner ZIP using `sha256sum -c UNAPPROVED-cinematic-pr-preview-<sha>.zip.sha256` or equivalent. Compare its complete digest with the preview manifest too.
3. Review `approvalStatus: UNAPPROVED`, `deploymentAllowed: false`, source/tree SHA, repository/branch/PR/base, run ID/attempt, workflow reference, Node version, packager hash, original-media provenance and per-file inventory. Checksums establish integrity, not approval.
4. Extract the inner ZIP into a fresh private review folder. It contains `UNAPPROVED-PREVIEW/README-NOT-FOR-DEPLOYMENT.txt` and the nested website at `UNAPPROVED-PREVIEW/site/`. Website files deliberately are not at the ZIP root.
5. Review locally on loopback: `python3 -m http.server 8000 --bind 127.0.0.1 --directory UNAPPROVED-PREVIEW/site`. Open `http://127.0.0.1:8000/en/` and the other locales. Do not open through file://, publish this local server, upload to a VPS, or copy the preview onto staging.

No warning banner is added to the approved design. The distinct archive/wrapper/manifest and both notices label the review data. No `review-manifest.json`, approved-baseline claim, `manifest.json`, `manifest.sig` or `release.zip` is emitted. Renaming is not release conversion: the independent owner tools and VPS verifier reject preview format/policy, and signature/inventory authorization is still required.

## Local reproduction

Use a clean committed checkout, Node 24.22.1, Python 3, Git and FFmpeg/ffprobe, then `npm ci`. Run Astro, formatting, unit tests, both Python suites, production build, static/media validation and browser tests before `npm run package:pr-preview`.

```sh
export ASTRO_TELEMETRY_DISABLED=1
npm run check
npm run lint
npm test
python3 -m unittest discover -s tests/pull -v
python3 -m unittest discover -s tests/readiness -v
npm run build
npm run test:static
npm run test:media-policy
npm run test:browser
npm run package:pr-preview
```

The preview command builds again to prevent stale output. It refuses an existing `pr-preview-artifacts/` directory: use a fresh checkout or inspect and deliberately remove only your old local preview output before another run. Browser tests require Chromium or `CHROMIUM_PATH`; browser checks are local where the PR workflow does not include them.

## Strict approved-release controls remain unchanged

`scripts/package-staging.mjs` still pins `71cca8d24e73a7c10fd7c0585e1404a362424bb4` and rejects the cinematic source. The manual staging-review/release workflows still use that path. No bypass variable or HEAD-as-approval exists. The trusted tools at `da0c28877fa0b74b72b914984e62b19ddf91d2ed` remain unchanged: independent offline-capable owner inspector/signing, pinned source/media policy, exact archive/manifest digests, explicit signature/publication, read-only outbound VPS access, signed verification, replay protection, exact first-apply manifest plus site-inventory authorization, protected paths, verified backups/recovery and rollback. Green PR CI never grants release approval.

## Next phase: separate review and authorization

Before cinematic release approval, review a concrete operations change admitting the intended source branch and exact owner-reviewed UI baseline; provision FFmpeg/ffprobe in manual candidate workflows; explicitly admit the exact MP4/JPG/PNG/poster/mask inventory with hashes/provenance in the independent media policy and verifier; and independently re-pin compatible owner-device tools/policy and VPS verifier checksums. Do not broaden formats/paths without constraints, relabel branches, reuse a preview as a release, replace equality with HEAD or give CI signing keys/VPS credentials.

Manual workflow registration remains unmerged. CloudPanel binding/isolation, verified full private backup, mode-770 incompatibility and a web-server-compatible permission remedy, read-only deploy key/known-hosts, compatible pinned puller, public signing-key trust and disabled private config remain owner prerequisites. Later approvals must cover the exact unsigned source/run/archive/manifest, independent signing/publication, manual dry-run, first apply with exact site inventory, and backup/rollback readiness. Cron stays absent.

See [pull deployment](pull-deployment.md), [owner-controlled VPS preparation](vps-first-activation.md) and [Android owner tools](android-owner-setup.md). This document authorizes no VPS/CloudPanel changes, permission changes, PR merges, signed publication, cron or deployment.
