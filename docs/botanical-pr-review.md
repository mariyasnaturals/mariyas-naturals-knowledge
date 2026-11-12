# Botanical PR review and staging handoff

This review targets `feature/botanical-journey-review` → `feature/cinematic-homepage`. It adds no deployment authority. The existing `Validate foundation` workflow remains byte-identical; its unsigned preview packager now recognizes this additional exact same-repository PR pair. Arbitrary branches, forks, wrong bases and raw pushes from the botanical branch remain rejected. Existing cinematic review behavior is retained.

The separate `Botanical visual review` workflow checks out the exact PR head with read-only permissions. It verifies all registered asset hashes and photographic product pixels, builds/validates the unchanged default site, builds the isolated botanical preview, runs packaging negative tests and ten browser/accessibility tests, and records real desktop and emulated mobile forward/reverse scrolling. It uploads checksum-inventoried `UNAPPROVED-botanical-preview-<source SHA>-<attempt>` and `botanical-visual-evidence-<source SHA>-<attempt>` artifacts. These have no release signature, release identity, signing access, deployment environment or VPS credentials. Download them from that PR's Actions run; retention is seven days.

The existing foundation workflow additionally runs Astro, formatting, all root Node tests, five Python security suites, the ordinary production build/static/media checks and 43 existing browser tests. Both workflows must pass before review completion. New negative tests reject altered original video, altered photographic derivative, missing registered layers, unsafe symlinks/unexpected files, changed original hero, indexing, purchasing and unapproved destinations. Existing signed-release negative tests remain mandatory.

## Review evidence

[Browser storyboard](screenshots/botanical-review/storyboard.png), [desktop final](screenshots/botanical-review/1440-final-full-resolution.png), [390px final](screenshots/botanical-review/390-final-full-resolution.png), [360px final](screenshots/botanical-review/360-stage-8.png), [desktop recording](screenshots/botanical-review/desktop-preview.mp4) and [mobile recording](screenshots/botanical-review/mobile-preview.mp4) show the real implementation at `a2c7c8af228b7d1bee71bfe6e2556b854d3383ba`. Subsequent packaging-only changes do not alter those visuals. [Capture provenance](screenshots/botanical-review/capture-provenance.json) supplies hashes and measured native scroll progress. CI supplies fresh exact-head captures and an unsigned validation report.

The [asset manifest](../review/botanical/asset-manifest.json), [reference provenance](../review/botanical/reference-provenance.json) and [placement map](../review/botanical/placement-map.json) accompany the preview. See [implementation notes](botanical-journey.md) for exact asset resolutions, owner-confirmed claim provenance, artistic botanical identities and RGB-preserving product extraction.

To run the complete review locally, first run the normal validation/build commands, then:

```sh
npm run test:botanical-assets
npm run build:botanical-review
node --test tests/botanical-ci/*.test.mjs
npx playwright install chromium ffmpeg
CHROMIUM_PATH="$(node --input-type=module -e 'import {chromium} from "@playwright/test"; console.log(chromium.executablePath())')" npx playwright test --config playwright.botanical.config.ts
# On the clean, committed botanical review branch:
node scripts/package-botanical-pr-preview.mjs
npm run preview:botanical-review
```

The inner preview ZIP has a SHA-256 and per-file inventory, is namespaced `UNAPPROVED-PREVIEW/site/`, and carries mandatory unapproved markers. It is not `release.zip` and must never be offered to the VPS puller. The published artifact also contains an unsigned exact-source build-provenance manifest. CI is validation, not owner approval.

## Publication boundary

Owner visual approval is required before any merge or staging activation. This PR does **not** yet make merge-to-deploy sufficient: the botanical component remains review-only in the default build; new generated media, the photographic alpha derivative and the exact official-store CTA require separately reviewed registration in the established release policy. Installed automatic-staging gate fingerprints also cover the changed scripts/workflow and require the existing reviewed trust-version upgrade. No policy pin is advanced, signing tool changed, branch protection relaxed or installed tool replaced here.

After visual approval, complete that minimal reviewed promotion using the existing policy/trust procedures and rerun full CI. Merge only through the protected branch workflow once its requirements are met. Only its authenticated staging artifact may be applied by the configured outbound VPS poller. Verify the actual deployment receipt, exact merged source SHA and public `/en/` page (plus languages/media) before reporting deployment. No manual ZIP upload, replacement deployment path or assertion of success based on localhost is permitted.
