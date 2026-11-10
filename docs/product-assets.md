# Current approved Mariyas .in media policy

The rebrand's business direction supersedes the earlier dual-store acquisition. **Only the current `https://mariyasnaturals.in` catalogue and approved current artwork may be used in active rendering.** No legacy `.com` packaging, banner or story image is an acceptable fallback.

## Actual current coverage

The public .in Store API returned 86 product listings. Eight product attachments are available: four for Herbal Hair Care Oil 200 ml (3008) and four for Herbal Hair Care 500 ml (3009). All eight were freshly downloaded from .in without redirects. 84 listings lack an attached approved individual product image and use clean placeholders, including 1 litre and the generic Hair Oil listing. No category photo is reassigned to one of these products.

Four additional current category artworks were verified on the .in homepage and downloaded from the same origin: Hair Care 3252, Skin Care 3272, Baby Care 3225, Herbal Wellness 3221. They are restricted to collection/editorial use. Pack sizes visible in category artwork do not establish sizes or variants for individual catalogue listings.

| Item                                                  |     Count |
| ----------------------------------------------------- | --------: |
| Current .in product listings                          |        86 |
| Listings with approved product photographs            |         2 |
| Listings using a missing-photo placeholder            |        84 |
| Approved product images                               |         8 |
| Approved collection/editorial images                  |         4 |
| Total approved images used                            |        12 |
| Local product WebP derivatives                        |        24 |
| Local category WebP derivatives                       |        12 |
| Total local derivatives                               |        36 |
| Local derivative bytes                                | 3,084,310 |
| Available approved images that failed import          |         0 |
| Retired .com source images removed from public assets |        89 |
| Retired .com derivative files removed                 |       265 |

## Enforcement and storage

- `src/config/media-policy.mjs` admits exact HTTPS .in upload URLs only. Legacy origins, CDNs, mixed-source provenance and unknown image IDs fail validation.
- `catalogue-source.json` contains only the current .in snapshot; `product-identities.json` preserves existing internal IDs/routes where a current listing already existed and mints identities for the three independent size listings. No legacy-only products are retained in the active catalogue.
- `media-manifest.json` records the eight product images and exact product associations. `brand-source.json`/`brand-media.json` record the four current category artworks, their homepage evidence and their editorial-only use restriction.
- Each image retains original filename/URL, source SHA-256, dimensions, bytes, verification status/date, source references and local derivative paths/dimensions/bytes/hashes.
- `ApprovedImage` renders only known local derivatives through an approved media lookup. Product and gallery visuals, campaign cards, category covers, social images and JSON-LD use those current assets.
- `public/images/products/` and `public/images/brand/` contain only the 36 approved derivatives. Old files are pruned rather than left available under unused URLs. Original files remain outside Git in a temporary cache.
- Resizing preserves source aspect ratio, packaging shape, colour and printed labels. No new product bottles, cutouts, backgrounds or replacement packaging were generated. All product and category imagery is displayed without a packaging crop.

`npm run media:import` processes the temporary cache; `npm run media:import -- --download` explicitly reacquires only the reviewed .in URLs. Both validate the policy and prune retired served files. No acquisition runs during a build or page view. A domain migration does not break committed images. Changing future image source approval requires an explicit policy change; commerce configuration does not alter image approval.

`npm run test:media-policy` scans all built HTML, src/srcset, CSS/JS image URLs, social metadata, structured images and the output image tree. Unit checks also compare local image hashes against a retired-image hash list, so renaming a known old image cannot silently restore it. CI runs the policy scan after build.

`docs/screenshots/rebrand/before-*` and historical Task 03 screenshots are review evidence outside `public/` and outside the site build. They are not active UI. Old source images remain only in Git history/temporary working storage; no history rewrite was performed.

Purchasing remains disabled centrally and per product, with an empty final destination map. Provenance links lead to the current .in catalogue only. The future commerce origin is independent of approved image sources.

See [current inventory](rebrand-catalogue.md) and [rebrand validation report](rebrand-report.md). Earlier Task 03 acquisition reports are historical and superseded by this policy.
