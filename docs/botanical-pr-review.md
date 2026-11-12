# Botanical PR review and staging handoff

This review targets `feature/botanical-journey-review` → `feature/cinematic-homepage`. It adds no deployment authority. The existing `Validate foundation` workflow remains byte-identical; its unsigned preview packager now recognizes this additional exact same-repository PR pair. Arbitrary branches, forks, wrong bases and raw pushes from the botanical branch remain rejected. Existing cinematic review behavior is retained.

The reviewed journey now ships in the normal build, so there is no separate review workflow or unapproved preview artifact any more. The single `Validate foundation` workflow verifies all registered asset hashes and photographic product pixels, builds and validates the ordinary site, and runs the fourteen botanical browser/accessibility tests through `playwright.botanical.config.ts`. The former unsigned preview path was retired: a second, weaker copy of the same pages could only drift from the release that actually ships.

The foundation workflow runs Astro, formatting, all root Node tests, five Python security suites, the ordinary production build/static/media checks and the browser suites. New negative tests reject altered original video, altered photographic derivative, missing registered layers, unsafe symlinks/unexpected files, changed original hero, indexing, purchasing and unapproved destinations. Existing signed-release negative tests remain mandatory.

## Review evidence

[Browser storyboard](screenshots/botanical-review/storyboard.png), [desktop final](screenshots/botanical-review/1440-final-full-resolution.png), [390px final](screenshots/botanical-review/390-final-full-resolution.png), [360px final](screenshots/botanical-review/360-stage-8.png), [desktop recording](screenshots/botanical-review/desktop-preview.mp4) and [mobile recording](screenshots/botanical-review/mobile-preview.mp4) show the current refined implementation. The exact recorded application commit is identified in capture provenance; any later evidence-only commit retains those same visuals. [Capture provenance](screenshots/botanical-review/capture-provenance.json) supplies hashes and measured native scroll progress. CI supplies fresh exact-head captures and an unsigned validation report.

The [asset manifest](../review/botanical/asset-manifest.json), [reference provenance](../review/botanical/reference-provenance.json) and [placement map](../review/botanical/placement-map.json) accompany the preview. See [implementation notes](botanical-journey.md) for exact asset resolutions, owner-confirmed claim provenance, artistic botanical identities and RGB-preserving product extraction.

To run the same checks locally:

```sh
npm run check && npm run lint && npm test
npm run build && npm run test:static && npm run test:media-policy
npm run test:botanical-assets
npx playwright install chromium
npx playwright test --config playwright.botanical.config.ts
```

CI is validation, not owner approval.

## Publication boundary

The owner visually approved the release media on 2026-11-12; that approval is recorded per record in `src/data/botanical-media.json` and in `review/botanical/release-integration.json`. Merge is still not deploy: the installed automatic-staging gate fingerprints cover the changed trust module, workflow and media policy, so this release carries the reviewed trust-version upgrade (`ops/ci_staging/trust.py` plus `bundle.sha256`). No signing tool is changed, branch protection is not relaxed and no installed tool is replaced here.

After visual approval, complete that minimal reviewed promotion using the existing policy/trust procedures and rerun full CI. Merge only through the protected branch workflow once its requirements are met. Only its authenticated staging artifact may be applied by the configured outbound VPS poller. Verify the actual deployment receipt, exact merged source SHA and public `/en/` page (plus languages/media) before reporting deployment. No manual ZIP upload, replacement deployment path or assertion of success based on localhost is permitted.
