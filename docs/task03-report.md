# Task 03 implementation and validation report

Built on `feature/premium-storytelling` (`bbdc05fa6819addcf717bdca33cfc691741fc52a`), using branch `feature/authentic-media-typography`. The final commit SHA and draft PR URL are provided in the task handoff. No merge, deployment, commercial-store mutation or infrastructure change is part of this work.

## 1. Verified outbound access

Published policy revision 1 reported current observations and `network_policy.state: enforced` for the selected environment. HTTPS results were `.in` 200, `.com` 301 to `www.mariyasnaturals.com`, and `www.mariyasnaturals.com` 200. Initial sandbox proxy reachability failed; approved execution through the same inherited Cloud proxy succeeded. TLS verification remained enabled. Catalogue image references revealed `i0.wp.com`; user approval was obtained, but no CDN request or configuration addition was needed because public attachment metadata provided working authorized-origin originals.

## 2. Discovered products

86 primary and 90 secondary public product records, each one complete API page. The primary product sitemap independently contains 86 entries. After retaining 80 cross-store matches and grouping three explicit sizes under their source parent, the local catalogue has 93 product families and three Hair Oil size variants (200ML, 500ML, 1LTR).

Collections: 16 hair-care families, 29 powders, two baby-care products, 32 skin/body-care families, 11 kits/combos, three other catalogue products. Names, IDs, source SKUs and explicit sizes are preserved. No gift hamper listing was found. See the [complete inventory](task03-catalogue.md) for every product, source ID and omission.

## 3. Authentic images and local storage

98 source attachments were successfully downloaded; exact-byte deduplication leaves 97 distinct images and 289 local responsive WebP files (10,373,678 bytes). 90 families have a main image. The original `.com` Hair Oil photograph is used in the hero and final reveal. Packaging is preserved through proportional resizing only; no AI substitute bottle, crop, recolouring or label edit was introduced.

The source snapshot, typed catalogue and media manifest retain original URLs/filenames, store product IDs/SKUs, metadata references, original dimensions, source SHA-256, derivative paths/dimensions/bytes/hashes, source verification date/status, and product/variant associations. Official names remain in English with an explicit language attribute; UI and alt text are localized. Originals are temporary working files outside Git. Builds and deployed pages need only committed local assets; a store domain migration cannot break their images. See [provenance and import workflow](product-assets.md).

## 4. Missing media and source conflicts

- Lotus Gel 100 g – No Stock: primary ID 2934, no attached image; its title conflicts with the API stock flag.
- Lotus Petals Face Pack 100 g: primary ID 2887, no attached image.
- Rose Petals Face Pack 100 g: primary ID 2886, no attached image.
- Hair Oil 1LTR: listed explicitly, but no separate verified image. A 200ML/shared parent image is never relabelled as 1LTR.
- Repeated source gallery references are deduplicated; additional product angles cannot be inferred.

## 5. Animation

Five semantic HTML scenes retain the heritage → botanical study → preparation context → visual transformation → original Hair Oil sequence. Added chapter anchors/current-step indication, 0.45s scroll scrubbing, restrained botanical parallax, three abstract oil drops, soft light changes and a gentle product fade/translation. Desktop pinning requires a wide/tall fine-pointer viewport, permits motion, and lasts at most `min(80vh, 650px)`. Mobile uses native scrolling, a compact chapter strip and its own final photograph. Skip Story, reduced-motion cleanup and readable no-JavaScript content remain available. Botanical art does not assert an ingredient list; preparation and heritage prose adds no undocumented facts or benefits.

## 6. Mobile UI

A compact 72px sticky header, native hamburger/language disclosures, four languages, Escape/focus restoration and outside/selection closing. Native swipe rails and galleries, keyboard-scrollable galleries, static responsive product pages, touch-sized controls, subtle button feedback, a collection tab in bottom navigation, safe-area spacing and viewport-fit support. Decorative arrows/chevrons use SVG/CSS rather than font glyphs. No scroll interception, SPA conversion or client-rendered product catalogue.

## 7. Typography and language verification

| Language  | Headings              | Body                 |
| --------- | --------------------- | -------------------- |
| English   | Cormorant Garamond    | Inter                |
| Malayalam | Noto Serif Malayalam  | Noto Sans Malayalam  |
| Hindi     | Noto Serif Devanagari | Noto Sans Devanagari |
| Tamil     | Noto Serif Tamil      | Noto Sans Tamil      |

Eight self-hosted variable WOFF2 script subsets total 584,156 bytes across all languages, with OFL licenses retained. Active script fonts are preloaded, use `font-display: swap`, retain GSUB/GPOS shaping, and have script-specific line heights and normal letter spacing. Closed language menus defer inactive script downloads. The measured English homepage fetched only the two Latin font files; localized homepages fetched their script pair and the Latin fonts needed for the brand and official names.

FontTools checked all current dictionary script characters plus representative samples: 57 Malayalam, 54 Devanagari, 38 Tamil codepoints in each script's Sans and Serif font. Zero missing characters. HarfBuzz shaped conjunct samples with zero missing glyphs. Chromium confirmed custom-font rendering, font loading and intended heading/body families on mobile/desktop; product-heading font specificity has its own regression assertion. Native-speaker copy review remains outstanding. See [glyph/shaping evidence](task03-glyph-coverage.json).

## 8. Commerce and SEO

Purchasing remains disabled globally and per product; the exact-destination map is empty. Stable internal IDs are independent of source slugs. No final commerce URL is constructed. Source links are confined to provenance disclosures and marked as references. No live WordPress files or databases were changed.

381 static HTML pages retain canonical URLs, corresponding localized alternates/x-default, sitemap output, Organization/WebSite JSON-LD, semantic headings, image dimensions/alt text and accessible navigation. Every built page remains `noindex, nofollow` on `.cloud`, with robots denial. No unsupported Product/medical/certification schema or numeric heritage claim was added. The existing editorial model and [reviewed topic queue](editorial-roadmap.md) prepare future Kerala/Ayurvedic educational content without generating unreviewed article pages.

## 9. Actual validation

| Check                                                             | Result                                                                                                                              |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Locked npm installation and additional locked font/Sharp packages | Passed                                                                                                                              |
| Astro / TypeScript                                                | 41 files; zero errors, warnings or hints                                                                                            |
| Lint                                                              | Prettier check passed                                                                                                               |
| Production build                                                  | 381 pages; static output                                                                                                            |
| Node tests                                                        | Three test files passed: commerce, media integrity, site configuration                                                              |
| Static checks                                                     | Every generated page, local image/srcset paths, links/fragments, canonicals, language alternates and disabled purchase links passed |
| Playwright Chromium                                               | 22 tests passed on final implementation                                                                                             |
| Accessibility                                                     | Zero axe violations in 23 scanned homepage/catalogue/detail states (WCAG 2 A/AA, 2.1 AA, 2.2 AA tags)                               |
| Mobile/layout                                                     | 320, 360, 390, 768 and 1440px coverage, including all four locales; no tested horizontal page overflow                              |
| Motion / HTML fallback                                            | Reduced motion, pin removal, Skip Story, chapter progress, JS-disabled navigation/content passed                                    |
| Media loading                                                     | All 289 derivatives returned local HTTP 200; decoded dimensions, hashes, aspect ratios and associations checked                     |
| Domain independence                                               | Catalogue flows passed with external requests blocked; zero remote requests                                                         |
| Font audit                                                        | No missing tested script characters or shaped glyphs; custom web fonts confirmed in Chromium                                        |

Commands used: `npm ci`, `npm install` for locked Fontsource/Sharp packages, `npm run check`, `npm run lint`, `npm test`, `npm run build`, `npm run test:static`, `npm run test:browser`, font preparation/audit and the local render measurement script. Astro telemetry was disabled for this restricted environment. Local server/browser commands required approved execution outside the sandbox because loopback listening returned EPERM inside it. Automated checks do not establish complete WCAG conformance, native-language editorial quality, physical-device gesture quality or field performance.

## 10. Measured performance and screenshots

| Profile           |  Width | Motion        | Samples | Median LCP | Maximum initial CLS | Initial resource bytes |
| ----------------- | -----: | ------------- | ------: | ---------: | ------------------: | ---------------------: |
| local-unthrottled |  390px | reduce        |       3 |     136 ms |            0.000000 |                251,910 |
| local-unthrottled |  390px | no-preference |       3 |     144 ms |            0.000000 |                251,910 |
| local-unthrottled | 1440px | reduce        |       3 |     192 ms |            0.000000 |                281,494 |
| local-unthrottled | 1440px | no-preference |       3 |     216 ms |            0.000000 |                281,494 |
| simulated-mobile  |  390px | no-preference |       3 |    1364 ms |            0.000000 |                251,910 |

Other locale initial render observations (single sample per viewport):

| Language |  Width |    LCP | Initial CLS |
| -------- | -----: | -----: | ----------: |
| ml       |  390px | 296 ms |    0.000061 |
| hi       |  390px | 292 ms |    0.002048 |
| ta       |  390px | 332 ms |    0.000063 |
| ml       | 1440px | 324 ms |    0.000012 |
| hi       | 1440px | 252 ms |    0.001364 |
| ta       | 1440px | 304 ms |    0.000012 |

The measurement uses fresh Chromium contexts and local uncompressed production files. English results have three samples per setting; other locale results have one sample per viewport. The simulated profile uses 150ms latency, 1.6Mbps download, 750kbps upload and 4× CPU slowdown. Initial CLS is observed until one second after font and hero decoding, before scrolling. No field Core Web Vitals, Lighthouse score or INP is claimed. Task 02's placeholder run used a different sample count; these results are a reassessment with real images, not a controlled before/after speed claim.

See [raw lab measurements](task03-performance.json). Screenshots are from the final local production build; English captures use reduced motion for deterministic inspection. Full-page captures eagerly decode images before capture; fixed/sticky controls can appear differently from an actual scrolling viewport.

| Layout  | Homepage                                   | Full homepage                               | Hair Oil detail                                  |
| ------- | ------------------------------------------ | ------------------------------------------- | ------------------------------------------------ |
| Desktop | [Viewport](screenshots/task03-desktop.png) | [Full](screenshots/task03-desktop-full.png) | [Detail](screenshots/task03-product-desktop.png) |
| Mobile  | [Viewport](screenshots/task03-mobile.png)  | [Full](screenshots/task03-mobile-full.png)  | [Detail](screenshots/task03-product-mobile.png)  |

Language captures: [Malayalam mobile](screenshots/task03-ml-mobile.png), [Hindi mobile](screenshots/task03-hi-mobile.png), [Tamil mobile](screenshots/task03-ta-mobile.png), and their [desktop Malayalam](screenshots/task03-ml-desktop.png), [Hindi](screenshots/task03-hi-desktop.png), [Tamil](screenshots/task03-ta-desktop.png) equivalents.

## 11. Remaining work and handoff

The three missing product images, separate 1LTR photo, additional genuine gallery angles, source stock conflict, native-speaker/editorial review, and documentary evidence for future historical/manufacturing/ingredient content require brand input. Gift hampers cannot be added without a genuine listing. Exact commercial destination mapping and purchasing activation await the separate store migration. Deployment and merge require separate approval and were not performed.

A draft PR targets `feature/premium-storytelling`. The repository workflow only validates; no deployment command or production/infrastructure action was initiated. GitHub connector permissions were confirmed; CLI API authentication was unavailable, so PR creation uses the connected GitHub tool. The final handoff gives the exact branch, commit SHA and PR URL.
