# Product visibility

**Status: temporary, owner-approved on 2026-11-16. Not a deletion, not a
discontinuation, and not an availability statement.**

The discovery site publishes **59 of its 85 catalogue records**. The other
**26 are hidden pending genuine product photography**: the catalogue holds a
record for each of them, the official store sells them, and each one's name,
SKU, price, source URL and provenance are intact — they simply do not appear on
this website until the owner has a real photograph to show.

|                                             | Count           |
| ------------------------------------------- | --------------- |
| Catalogue records retained                  | 85              |
| Publicly visible                            | 59              |
| Hidden pending photography                  | 26              |
| Deleted                                     | 0               |
| Permanently withdrawn (different mechanism) | 1 — store #3010 |

## The single switch

`src/data/product-visibility.json` is the only place visibility is decided. It
lists the 26 store ids with their catalogue slugs, the approval date and the
recorded reason (`Owner-approved temporary exclusion pending genuine product
photography`). `src/data/product-visibility.ts` is the typed API over it —
`visibilityOf(storeProductId)`, `isPubliclyVisible(storeProductId)` and
`isPubliclyVisibleSlug(slug)`.

Nothing else may decide visibility: **not** whether a photograph exists, and not
what the store reports. That is deliberate. If visibility were derived from
media, the next catalogue synchronisation would silently republish a listing the
moment a photograph arrived. Because it is an explicit list, a synchronisation
can only ever _widen_ the underlying record set; publishing a listing again
always requires a human edit here, after the owner has approved the image.

## How the policy is applied

Everything the site builds reads the policy, so there is no surface to forget:

| Surface                       | Where the policy is applied                                                                                                                            |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Public product list           | `src/data/products.ts` — `products` is `catalogueProducts.filter(visibility === 'visible')` (59); `catalogueProducts` keeps all 85 for the audit trail |
| Product detail routes         | `src/pages/[lang]/products/[slug].astro` builds `getStaticPaths` from `products` → 59 pages per locale, 295 in total                                   |
| Catalogue, categories, counts | `src/pages/[lang]/products/index.astro`, `collections/[category].astro`, `src/data/collections.ts` (`activeCollectionKeys`)                            |
| Homepage displays             | `src/components/living/HomeSections.astro`, `CareExplorer.astro`, `src/components/SiteFooter.astro` — all read `products` / `activeCollectionKeys`     |
| Featured and browse cards     | `src/data/showcase.ts` — `showcaseItems` and `browseGroups` are filtered by store id                                                                   |
| Ritual Finder                 | `src/data/ritual.ts` — `ritualProducts` is the curated candidate list filtered through `isPubliclyVisible`                                             |
| Care Assistant                | `src/data/care-index.ts` — reads the generated `catalogue/care-knowledge-public.json` (59 records) and filters again at runtime                        |
| Assistant bundle              | `scripts/build-care-public.mjs` (runs as `prebuild`) writes the 59-record projection, so hidden records never enter a browser bundle                   |
| Sitemap and structured data   | `@astrojs/sitemap` emits only built routes; the collection and catalogue `ItemList` counts derive from `products`                                      |
| Navigation                    | footer and homepage collection links come from `activeCollectionKeys`; a category with nothing visible is not built and not linked                     |

`combo` currently holds 0 visible of its 2 products, so it has no route, no
navigation link and no count anywhere.

## What the site does _not_ do

- **No deletion.** All 85 records stay in `catalogue/catalogue-source.json`,
  `catalogue/media-manifest.json`, `catalogue/care-knowledge.json` and
  `src/data/product-identities.json`. Hiding removes a page, not a record.
- **No redirects.** Hidden products get no page at all — no 301, no 410, no
  soft-404 page. The routes are simply absent from the static build, so a
  request falls through to whatever the host returns for an unknown path.
- **No availability claim.** No page says a hidden product is out of stock,
  unavailable or discontinued, and nothing here touches WooCommerce, inventory,
  prices, availability or `mariyasnaturals.com`.
- **No placeholder.** The former "Product photograph pending" copy is no longer
  rendered anywhere, because every visible listing has a real photograph.

## Permanent withdrawal is a different mechanism

Store #3010 (the discontinued 1 litre hair oil) is **not** in this policy. It is
excluded at acquisition time in `src/data/store.ts` (`excludedProductIds:
[3010]`) and never enters the catalogue, so it can never be reactivated by a
visibility edit. Keep the two mechanisms separate: withdrawal is permanent and
lives in the sync; hiding is temporary and lives here.

## Regression tests

| Suite                                        | What it pins                                                                                                                                                                                                                                                                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/visibility.test.mjs`                  | Exactly 26 hidden ids, exactly the owner-approved list; all 85 records retained with SKU, price, stock-at-verification and provenance; the 59 visible all have local derivatives on disk; a new photograph cannot flip visibility; the Ritual Finder candidates contain no hidden id; category counts; #3010 still absent |
| `scripts/validate-static.mjs` (built output) | 59 product routes per locale and 5 collections; no hidden slug in the sitemap, any page, any link or any listing bundle; no pending-photo copy on any page                                                                                                                                                                |
| `tests/browser/catalogue.spec.ts`            | The catalogue renders exactly the visible count and no hidden product link, in all five locales at mobile and desktop widths, with zero axe violations                                                                                                                                                                    |

Run them with `npm test`, `npm run build && npm run test:static`, and
`npm run test:browser`.

## Reactivating a listing

Owner supplies a real photograph → import it from the approved source → verify
the SKU association → generate the local optimized images → update the media
manifest → owner approves the result → remove the entry from
`src/data/product-visibility.json` → rebuild and verify.

Concretely:

1. The owner supplies genuine photography for the listing (never a sibling
   product, never a store-copy placeholder).
2. Import it with the existing media pipeline and confirm the SKU association
   (`catalogue/media-manifest.json` keeps `sources[0].sku` for this).
3. Generate the responsive WebP derivatives and record their hashes.
4. Update `catalogue/media-manifest.json` so `mediaIds` is no longer empty, and
   confirm `npm run test:media-policy` passes.
5. Get explicit owner approval for the image.
6. Delete that listing's object from `src/data/product-visibility.json` (ids and
   slugs are both recorded, so the entry is unambiguous).
7. Run `npm run build:care-public && npm test && npm run build && npm run test:static`
   and check the product page, its category count and the Ritual Finder.

No WooCommerce change is needed: the store already publishes these products; only
this site's visibility changes.

## The 26 hidden listings

| Store id | Official name                         | Catalogue slug                              | Category       |
| -------- | ------------------------------------- | ------------------------------------------- | -------------- |
| 2865     | Mariyas Herbal Hair Care Oil          | `mariyas-hair-oil`                          | hair-care      |
| 2879     | Hair Pack & Wash Powder 100 g         | `hair-pack-wash-powder-100gm-19214`         | herbal-powders |
| 2880     | Lip Balm 10 g                         | `lip-balm-10gm-19216`                       | skin-care      |
| 2881     | Eyebrow Oil 10 ml                     | `eyebrow-oil-10ml-19219`                    | skin-care      |
| 2882     | Under Eye Dark Circle Oil 10 ml       | `under-eye-dark-circle-oil-10-ml-19222`     | skin-care      |
| 2886     | Rose Petals Face Pack 100 g           | `rose-petals-face-pack-100-g-2886`          | skin-care      |
| 2887     | Lotus Petals Face Pack 100 g          | `lotus-petals-face-pack-100-g-2887`         | skin-care      |
| 2894     | Kajal                                 | `kajal-19587`                               | skin-care      |
| 2927     | Saffron Fairness Oil                  | `saffron-fairness-oil-19597`                | skin-care      |
| 2928     | Mariyas Fairness Natural Soap         | `mariyas-fairness-natural-soap-19674`       | skin-care      |
| 2930     | Mariyas Oil Treated Comb – Dual       | `mariyas-oil-treated-comb-dual-21885`       | hair-care      |
| 2931     | Mariyas Oil Treated Comb – Wide       | `mariyas-oil-treated-comb-wide-21914`       | hair-care      |
| 2932     | Mariyas Oil Treated Comb – Fine       | `mariyas-oil-treated-comb-fine-21918`       | hair-care      |
| 2933     | Mariyas Oil Treated Comb – Combo Pack | `mariyas-oil-treated-comb-combo-pack-21919` | combo          |
| 2934     | Lotus Gel 100 g – No Stock            | `lotus-gel-100-g-no-stock-2934`             | skin-care      |
| 2935     | Hibiscus Gel 100 g                    | `hibiscus-gel-100gm-24246`                  | skin-care      |
| 2948     | Mariyas Hair & Skin Care Kit          | `mariyas-hair-skin-care-kit-77781`          | combo          |
| 2952     | Ashwagandha Powder 100 g              | `ashwagandha-powder-100g-79428`             | herbal-powders |
| 2988     | Pathimugham Powder 100 g              | `pathimugham-powder-100g-79434`             | herbal-powders |
| 2989     | Reetha Powder 100 g                   | `reetha-powder-100g-79435`                  | herbal-powders |
| 2991     | Shatavari Powder 100 g                | `shatavari-powder-100g-79437`               | herbal-powders |
| 2993     | Wild Turmeric Powder 100 g            | `wild-turmeric-powder-100g-79439`           | herbal-powders |
| 3003     | Kolarakku Powder 100 g                | `kolarakku-powder-100g-79449`               | herbal-powders |
| 3005     | Navara Powder 100 g                   | `navara-powder-100g-79451`                  | herbal-powders |
| 3007     | Karkidaka Kanji                       | `karkidaka-kanji-89315`                     | herbal-powders |
| 3012     | Ghee – Vechoor Cow 500 g              | `ghee-vechoor-cow-500gm-98121`              | wellness       |

Counts by category (hidden / visible): hair care 4 / 13, skin and body 10 / 22,
herbal powders 9 / 20, herbal wellness 1 / 2, baby care 0 / 2, kits and combos
2 / 0.
