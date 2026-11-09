# Authentic Mariyas product media

Verified on 2026-11-09. Task 03 supersedes Task 02's blocked acquisition; the historical results remain in `task02-validation.md`.

The published Cloud network policy reported current observations and enforced access for `mariyasnaturals.in` and `mariyasnaturals.com`, including their `www` variants. Actual HTTPS GET results: `.in` 200, `.com` 301 to `https://www.mariyasnaturals.com/`, and `www.mariyasnaturals.com` 200. The sandbox could not connect to the inherited proxy; approved execution outside the command sandbox reached the same policy-enforcing Cloud proxy with TLS verification enabled.

Public WooCommerce Store API catalogues returned 86 primary records and 90 secondary records, each with `X-WP-TotalPages: 1`. The primary product sitemap also contains 86 products. No login, authenticated WooCommerce endpoint, WordPress mutation or private data was accessed.

The secondary catalogue advertises `i0.wp.com` image URLs. The user approved this exact CDN host, but it was not added to network configuration or requested: the public attachment metadata exposed original `source_url` values on the already authorized `www.mariyasnaturals.com` origin, and all originals returned 200 without redirects. No unknown image host was followed.

| Coverage                                    | Actual count |
| ------------------------------------------- | -----------: |
| Primary source product listings             |           86 |
| Secondary source product listings           |           90 |
| Consolidated product families               |           93 |
| Explicit Hair Oil size variants             |            3 |
| Product families with main images           |           90 |
| Product families missing main images        |            3 |
| Downloaded source attachments               |           98 |
| Distinct images after SHA-256 deduplication |           97 |
| Responsive local WebP files                 |          289 |
| Local derivative bytes                      |   10,373,678 |

The 93 families plus three primary size listings represent 96 distinct listings after 80 cross-store matches. Matching uses primary SKU = secondary product ID, with name review; both source records and their own SKUs are retained. This is an observed source relationship, not a claim that the two stores share a universal SKU system. Duplicate-looking listings with different source IDs are retained separately. Source verification establishes catalogue provenance, not medical efficacy, certification, inventory accuracy, or editorial approval.

Missing main images: Lotus Gel 100 g – No Stock (primary 2934), Lotus Petals Face Pack 100 g (2887), Rose Petals Face Pack 100 g (2886). The Lotus Gel title and API stock flag conflict; no live availability is published. No separate verified 1LTR Hair Oil image exists. The parent's shared photograph is not assigned as a 1LTR photograph. 200ML and 500ML each have four `.in` images and their explicit source associations. No gift hamper product was found in either public catalogue. Repeated identical gallery entries are deduplicated rather than presented as additional angles.

## Files and migration safety

- `src/data/catalogue-source.json`: trimmed public source snapshot; no prices, reviews, orders, customer data, medical descriptions or credentials.
- `src/data/media-manifest.json`: complete product/source IDs, store SKUs, source URLs, original filenames/dimensions/byte counts/SHA-256, product and variant associations, verification date/status, local paths and derivative dimensions/bytes/hashes.
- `src/data/media-types.ts` and `products.ts`: typed catalogue and localized image alt text. Official English product names remain unchanged and are tagged `lang="en"` in localized UI.
- `public/images/products/{local-product-slug}/`: only resized WebP derivatives at 320/640/up to 960px; no upscaling, crop, label edits, background removal or generated packaging. All source aspect ratios are retained.
- Raw originals remain under `/tmp/mariyas-originals`, outside Git. They are temporary working files, not a persistent archive. No build, page view or deployed image depends on that cache or on WordPress/CDN access.

`npm run media:import` regenerates derivatives from the temporary cache. `npm run media:import -- --download` explicitly reacquires the committed, reviewed source URLs before processing; it only accepts the four Mariyas origin hostnames and stops on every redirect. After a future origin move, review/update the acquisition snapshot separately; existing committed images continue to work. Neither builds nor CI run acquisition automatically. New or changed source data must be reviewed; filenames and attachment order alone are not sufficient evidence of variant identity.

Local route slugs are retained from the previous manifest on reimport. Internal `mn-*` / `mn-variant-*` identifiers are separate from both store slugs and source IDs. Future purchasing requires exact URLs mapped centrally by those identifiers in `src/config/commerce.mjs`. The global gate and every product gate remain false, and the destination map is empty. Provenance links inside the source disclosure are references, not Buy Now controls.

See [complete catalogue and omissions](task03-catalogue.md), [validation report](task03-report.md), and [font coverage](task03-glyph-coverage.json).
