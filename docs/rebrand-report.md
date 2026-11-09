# Current .in visual rebrand and source correction

Branch: `feature/authentic-media-typography`. Before baseline: `40035f4a7f8c006922eb661f434d4e0b98053c75`. The handoff gives the corrective commit SHA. This updates the existing premium Astro implementation and its draft PR; nothing is deployed or merged.

## Source correction

The current business direction admits only approved images from `https://mariyasnaturals.in`. Both the catalogue snapshot and rendered product data now contain only .in listings. Legacy-only product records are removed. The image importer rejects legacy/CDN origins and redirects; the rendering helper accepts only images present in the approved manifests.

All 89 distinct legacy .com images and their 265 derivatives were removed from the public image tree. No legacy product, story, hero, banner or promotional image remains in active HTML, CSS/JS image references, social metadata or structured images. Known retired hashes are blocked even under renamed filenames. Current source files are local responsive derivatives and need no WordPress/CDN request at runtime.

The legacy packaging visible in the before screenshots and historical Task 03 documents is review evidence only. Those files are outside public/ and are never part of the website build. Git history was not rewritten.

## Exact approved-image and missing-image counts

| Coverage                                          |     Count |
| ------------------------------------------------- | --------: |
| Current .in product listings                      |        86 |
| Approved individual product images                |         8 |
| Approved current category/editorial artworks      |         4 |
| Total approved .in images used                    |        12 |
| Responsive WebP files                             |        36 |
| Total local image bytes                           | 3,084,310 |
| Product listings with approved individual photos  |         2 |
| Product listings using clean photo placeholders   |        84 |
| Available approved images that failed acquisition |         0 |

The .in Store API reports four images each for the 200 ml (source 3008) and 500 ml (3009) Hair Oils. All were freshly acquired from .in with HTTP 200 and no redirects. The other 84 listings have no attached individual photo, including 1 litre and the generic Hair Oil listing. Additional unprovided gallery counts are unknown. See the [complete current catalogue](rebrand-catalogue.md).

Four category artworks currently visible on the .in homepage were verified and acquired from that same origin: Hair Care 3252, Skin Care 3272, Baby Care 3225 and Herbal Wellness 3221. They are used only for category/editorial presentation. Their depicted pack sizes do not establish individual product variants; a category image never fills a missing product photo.

Original names, source IDs/SKUs, URLs, filenames, dimensions, source and derivative hashes, verification dates and associations remain recorded. Resizing preserves packaging proportions, colours and labels; no replacement bottle, cutout or generated product image was made. [Storage and enforcement details](product-assets.md).

## Rebrand changes

- A new warm editorial hero uses the current 200 ml pack photograph, forest imagery and brown/gold label accents. Mobile shows the product image before the longer description/actions; explicit 200 ml / 500 ml discovery links remain local.
- The five scroll chapters now introduce the current collection and its two photographed editions. Subtle pack crossfades, a light halo and restrained oil drops replace the older visual direction. Desktop pinning is still limited to eligible fine-pointer screens and at most 650px. Mobile scrolling stays native; Skip Story, reduced motion and no-JavaScript content remain available.
- Reusable `CampaignCard`/`CollectionHighlights` components provide category cards and a feature banner for homepage, post/story-style and future promotional layouts. Current artwork is displayed at its full aspect ratio without cropping packaging.
- Compact sticky header, four-language disclosures, keyboard/outside-click behavior, safe-area bottom navigation, touch feedback, swipeable collection/product cards and native keyboard-scrollable galleries remain intact.
- Cormorant Garamond/Inter and the three Noto Serif/Sans script pairs are unchanged. Updated four-language copy is rendered with the existing shaping, line-height and font-loading system.

## SEO, AI discoverability and commerce

The build has 377 static HTML pages: 344 product details, 24 category collection pages, four catalogue pages, four homepages and the language chooser. Existing canonical/hreflang/x-default/sitemap behavior is preserved, including all new collection routes. Every staging page remains noindex/nofollow; robots still denies crawling.

Category metadata and ItemList counts reflect the visible current catalogue. Product ItemPage/Product metadata uses actual names, source SKUs and approved images when available, with no offers, ratings, certification or availability claims. Current approved imagery also supplies social-share metadata. The organization points to the current .in website. Product/category descriptions and localized collection routes support relevant Kerala hair-care, baby-care, skincare and herbal wellness discovery. Comparative or absolute search phrases are not turned into unsupported claims; the [editorial queue](editorial-roadmap.md) retains review requirements.

The central future commerce origin is separate from image policy. Global/per-product purchasing stays disabled and the exact-destination map stays empty. No final external product URL was guessed or mapped. Source disclosures cite current .in records only.

## Validation results

| Check                        | Actual result                                                                                                                                                               |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Astro / TypeScript           | 51 files; zero errors, warnings or hints                                                                                                                                    |
| Format / lint                | Prettier passed                                                                                                                                                             |
| Production build             | Passed; 377 static pages                                                                                                                                                    |
| Unit tests                   | Nine passed; commerce, source policy, hashes/decoding and site configuration                                                                                                |
| Static validation            | All pages passed; canonical, languages, sitemap, schema counts, one H1, links, image dimensions/srcset and staging/commerce gates                                           |
| Browser tests                | 24 passed, including the existing suite adapted to current routes/gallery counts                                                                                            |
| Accessibility                | Zero final axe violations in 25 scanned homepage/catalogue/detail/collection states, using WCAG 2 A/AA, 2.1 AA and 2.2 AA tags                                              |
| Responsive/language coverage | 320, 360, 390, 768 and 1440px; English/Malayalam/Hindi/Tamil mobile and desktop checks, no tested page overflow                                                             |
| Images                       | All 36 local derivatives served HTTP 200; decode, dimensions, aspect ratios and hashes validated; the legacy test URL returned 404                                          |
| Source-policy output scan    | 377 HTML pages, 104 img elements, all 12 approved images; no unapproved served image file, hotlink, retired hash, CSS/JS, social or schema image                            |
| Runtime independence         | Catalogue flows passed with external requests blocked; no external requests                                                                                                 |
| Fonts/motion/HTML fallback   | No missing tested script characters or shaped conjunct glyphs; custom fonts confirmed; no-JS, reduced motion, pin cleanup, Skip Story and gallery keyboard scrolling passed |

The first accessibility pass found the active chapter number at 4.45:1 contrast after the palette change. Its colour was darkened; the final complete browser pass found zero violations. This was corrected in the implementation, not excluded from scanning. CI now runs the source-policy output check after building.

Commands: `npm run check`, `npm run lint`, `npm test`, `npm run build`, `npm run test:static`, `npm run test:media-policy`, `npm run test:browser`, `python scripts/check-fonts.py` (temporary FontTools/Brotli/HarfBuzz environment), and `node scripts/measure-render.mjs`. Font evidence: [glyph/shaping report](rebrand-glyph-coverage.json). Automated scans are not a complete WCAG audit or a native-speaker editorial review.

## Measured performance

| Local lab profile |  Width | Motion        | Samples | Median LCP | Maximum initial CLS |
| ----------------- | -----: | ------------- | ------: | ---------: | ------------------: |
| local-unthrottled |  390px | reduce        |       3 |     288 ms |            0.000000 |
| local-unthrottled |  390px | no-preference |       3 |     272 ms |            0.000000 |
| local-unthrottled | 1440px | reduce        |       3 |     256 ms |            0.000000 |
| local-unthrottled | 1440px | no-preference |       3 |     264 ms |            0.000000 |
| simulated-mobile  |  390px | no-preference |       3 |    2484 ms |            0.009627 |

Fresh Chromium contexts loaded local uncompressed production files. The simulated mobile profile uses 150ms latency, 1.6Mbps download, 750kbps upload and 4× CPU slowdown. Initial CLS ends one second after fonts/hero decode, before scrolling. This is a lab sample, not field Core Web Vitals, Lighthouse or an INP measurement. The current photograph is more detailed than the retired hero; no unsupported before/after speed claim is made. [Raw measurements](rebrand-performance.json).

## Before / after screenshots

Both English viewport pairs use 1440×900 desktop / 390×900 mobile with reduced motion. Before captures are retained from the exact prior implementation commit. After captures come from the rebranded production build. Full-page captures decode imagery first; fixed/sticky controls may appear differently from a scrolling viewport.

| Layout  | Before                                           | After                                          | Full after                                         |
| ------- | ------------------------------------------------ | ---------------------------------------------- | -------------------------------------------------- |
| Desktop | [Before](screenshots/rebrand/before-desktop.png) | [After](screenshots/rebrand/after-desktop.png) | [Full](screenshots/rebrand/after-desktop-full.png) |
| Mobile  | [Before](screenshots/rebrand/before-mobile.png)  | [After](screenshots/rebrand/after-mobile.png)  | [Full](screenshots/rebrand/after-mobile-full.png)  |

Detail captures: [desktop](screenshots/rebrand/after-product-desktop.png), [mobile](screenshots/rebrand/after-product-mobile.png). Language captures: [Malayalam](screenshots/rebrand/after-ml-mobile.png), [Hindi](screenshots/rebrand/after-hi-mobile.png), [Tamil](screenshots/rebrand/after-ta-mobile.png), plus desktop equivalents in the same directory.

## Remaining review and delivery boundary

84 current product listings still need approved individual photographs; clean placeholders are intentional. No available approved image failed import. Future copy/claims and translations still need brand/native-language editorial review. Final commerce URLs and purchasing activation remain pending the separate migration.

No CloudPanel, VPS, WordPress file/database, DNS, SSL, production, merge or deployment action was performed. The existing draft PR is updated for review only; the final handoff supplies its head commit and CI status.
