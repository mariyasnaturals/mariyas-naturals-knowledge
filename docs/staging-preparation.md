# Staging review preparation

The website implementation is unchanged from approved commit `71cca8d24e73a7c10fd7c0585e1404a362424bb4`. This preparation adds packaging, artifact workflows and owner-operated instructions only. No image import, UI/animation/typeface/catalogue change, merge or server action is included.

Build settings are explicit: SITE_URL=https://www.mariyasnaturals.cloud, SITE_ENV=development, ALLOW_INDEXING=false. The package command rechecks canonical origin, noindex/nofollow, source policy and disabled/unmapped commerce, and rejects changes to approved src/public/build configuration/locked dependencies. It produces a ZIP with dist contents at its root, SHA-256 checksum, per-file hash manifest and upload/review guide, outside the served content.

The manual **Prepare staging review artifact** workflow validates and packages on demand. Its UI availability depends on GitHub recognizing the workflow on the default branch; no merge is performed to enable it. The existing PR validation run also attaches the bundle, allowing a downloadable GitHub artifact now. Both workflows have read-only repository permission, upload build artifacts only, contain no hosting credentials and perform no deployment. Artifact retention is 30 days.

Validation for the prepared build: npm ci, Astro/TypeScript, Prettier, unit tests, production build, full static-page validation, current .in source-policy checks and the existing Chromium/browser/accessibility suite. Results and the successful artifact run/download URL are reported in the task handoff. Browser checks are local emulation, not an Android physical-device sign-off.

For exact document-root verification, backup, manual upload, rollback and Android Chrome review steps, use [the owner review guide](staging-review.md). No actual destination root has been remotely verified. If there is uncertainty about the .cloud root or its isolation from production/WordPress, stop the manual upload rather than guessing a path. Preview availability at the live .cloud URL starts only after a separately authorized owner upload.
