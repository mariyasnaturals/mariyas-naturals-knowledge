# The withdrawn 1 litre hair-oil pack (store #3010)

## Why it was removed

On 2026-11-16 the official store still listed a fourth hair-oil SKU:

| Field | Value |
| --- | --- |
| Store id | `3010` |
| Name | `Mariyas Hair Oil – 1 ltr` |
| Slug | `mariyas-hair-oil-1-ltr` |
| SKU | `89554` |
| Price | `0` |
| Photograph | none |
| Status | discontinued — no longer sold |

A zero-priced listing with no photograph cannot be presented as part of the
range, so it is excluded from the site in one place — `EXCLUSIONS` in
`scripts/sync-com-catalogue.mjs` — and recorded, with its reason, in
`catalogue/catalogue-source.json` (`exclusions[]`) and in the generated
`docs/official-store-sync.md`.

## What changed on the site

- `src/data/product-identities.json`, `catalogue/catalogue-source.json`,
  `catalogue/media-manifest.json`: no record, no identity, no image.
- `src/data/products.ts`: `hairOilEditions` lists only 200 ml and 500 ml.
- `src/data/store.ts`: `storeLinks.hairOil1l` is gone; the file records the
  exclusion and the published count (85).
- `src/data/showcase.ts` and `src/components/ShowcaseSection.astro`: the
  one-litre showcase card and its five translated descriptions are removed.
- `src/pages/[lang]/products/[slug].astro`: the size switcher offers 200 ml and
  500 ml only.
- `src/i18n/{en,ml,hi,ta,kn}.json`: `aboutA3` now says "200 ml and 500 ml"
  instead of "200 ml, 500 ml and 1 litre".

## The URL that used to exist

`/[lang]/products/mariyas-hair-oil-1-ltr/` was built by earlier revisions. This
repository is a static build, so the host must answer for that path once the
withdrawn page is deployed. The recommended answer is a **410 Gone**, because
the pack is withdrawn rather than moved; a 301 to the 500 ml pack is acceptable
if the owner prefers to keep the traffic.

```nginx
# Retired pack: gone, not moved. Static host configuration for the .cloud origin.
location ~ "^/(en|ml|hi|ta|kn)/products/mariyas-hair-oil-1-ltr/?$" {
    return 410;
}
location = /products/mariyas-hair-oil-1-ltr/ {
    return 410;
}
```

Do **not** redirect the URL to `/shop/`: a search engine that follows a 301 to
an unrelated page treats it as a soft 404. A 410 is the honest signal.

## Nothing outside this repository was touched

The listing itself still exists in WooCommerce and remains the owner's decision:
pricing it, photographing it, or deleting it. This change only stops the
discovery site from advertising a pack that is not for sale.
