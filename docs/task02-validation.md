# Task 02 validation and review

Validated on Node 24.22.1 / npm 11.9.0, extending foundation commit `a828aa9`. No dependency changes were necessary. This is local development evidence, not a deployed-site or complete-catalogue readiness claim.

| Executed command                                                                    | Actual result                                                                                                                                                 |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm --cache /tmp/mariyas-npm ci`                                                   | 320 packages installed from the unchanged lockfile                                                                                                            |
| `ASTRO_TELEMETRY_DISABLED=1 npm run check`                                          | 0 errors, warnings or hints                                                                                                                                   |
| `npm run lint`                                                                      | Formatting passed                                                                                                                                             |
| `npm test`                                                                          | 6 passed: indexing policy, commerce gates, media coverage                                                                                                     |
| `ASTRO_TELEMETRY_DISABLED=1 npm run build`                                          | 9 static pages plus robots and sitemap                                                                                                                        |
| `npm run test:static`                                                               | All 4 homepages and all generated pages passed route/fragment checks, metadata, local-image policy, disabled commerce and matching detail-language alternates |
| `ASTRO_TELEMETRY_DISABLED=1 npm run test:browser`                                   | 12 passed in Chromium                                                                                                                                         |
| `REVIEW_OUTPUT_DIR=/workspace/mariyas-review/after node scripts/measure-render.mjs` | Local render observations and screenshots collected                                                                                                           |

Browser coverage includes English/Malayalam/Hindi/Tamil mobile homepages; 360px Android-like, 390px iPhone-like, 768px tablet and 1440px desktop widths; keyboard skip links and menu Escape/focus restoration; localized product-detail navigation; JavaScript-disabled readable content and language switching; reduced motion; scroll-linked progress; desktop-only limited pinning and removal when the motion preference changes. Automated axe scans found zero violations in the tested homepage and detail states. This does not establish complete WCAG conformance or real-device touch performance.

## Render observations

Latest single local run, fresh Chromium context per viewport, no network/CPU throttling, reduced motion enabled, English homepage before scrolling. Actual product photography is not yet present. Initial CLS covers only the measurement window, not an entire user session.

| Viewport width | Observed LCP | Initial CLS | Resource transfer bytes |
| -------------- | -----------: | ----------: | ----------------------: |
| 390px          |       592 ms |           0 |                 138,129 |
| 1440px         |       368 ms |           0 |                 138,129 |

See [raw observation snapshot](local-performance.json). These values are not Lighthouse scores, field Core Web Vitals or guarantees of mobile network performance. INP was not measured because no representative interaction sample was collected. Revalidate with actual assets and realistic throttling before release.

## Visual review artifacts

Before screenshots are the retained full-page Task 01 renders from the validated foundation; after screenshots were captured from the Task 02 development build at the top of the page with reduced motion. Full-page screenshots can show fixed/sticky controls differently from a real scrolling viewport; the after viewport captures show their actual starting placement.

| Layout  | Before (full page)                            | After (viewport)                       | After (full page)                               |
| ------- | --------------------------------------------- | -------------------------------------- | ----------------------------------------------- |
| Desktop | [Before](screenshots/before-desktop-full.png) | [After](screenshots/after-desktop.png) | [Full page](screenshots/after-desktop-full.png) |
| Mobile  | [Before](screenshots/before-mobile-full.png)  | [After](screenshots/after-mobile.png)  | [Full page](screenshots/after-mobile-full.png)  |

## Limitations and external prerequisite

Both source website requests were denied by the development environment's outbound proxy before reaching the stores. **Zero products were source-discovered and zero authentic images were downloaded, optimized or integrated.** Actual catalogue size and missing gallery/combo/variant counts remain unknown. The user-supplied Mariyas Hair Oil reference remains an explicitly unverified demonstration record. See [coverage and the minimum approved export](product-assets.md).

Enable the stated source domains in cloud environment outbound settings, or supply an approved product/media export. No passwords or tokens are needed in chat. No inferred packaging, manufacturing steps, ingredient list, certification or product claim was introduced. Native-language review and genuine asset/variant verification remain required. Real-image responsive rendering and gallery behavior cannot be signed off while those assets are absent.

Development noindex/nofollow, robots denial and domain configuration remain unchanged. No production indexing, commerce enablement, infrastructure changes, deployment or merge occurred. Task 01 validation remains documented separately in `validation.md`.
