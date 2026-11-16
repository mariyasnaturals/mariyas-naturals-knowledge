# Official store sync — 2026-11-16

Owner-authorised read of the public WooCommerce Store API at `https://www.mariyasnaturals.com`.
The acquisition job (`scripts/fetch-com-snapshot.mjs`) downloads the JSON and the
untouched original binaries; this report describes what the site now holds.

## Catalogue

| Fact                                        | Value     |
| ------------------------------------------- | --------- |
| Products read                               | 86        |
| Products published                          | 85        |
| Excluded                                    | 1 — #3010 |
| Products with an official photograph        | 59        |
| Products without one (labelled empty frame) | 26        |
| Distinct store attachments                  | 215       |
| Local WebP derivatives                      | 489       |
| Local derivative bytes                      | 26337590  |

## Exclusions

- **#3010** — Discontinued pack: the 1 litre hair-oil listing is priced at ₹0, carries no photograph and is no longer sold. The 200 ml and 500 ml packs remain.

## Derivative sizes

Main images are published at 320 / 640 / 960 px wide, gallery images at 320 / 640 px,
WebP quality 82, never enlarged, aspect ratio preserved (no crop). Each derivative
records its own SHA-256 in `src/data/media-manifest.json`.

## Listings without an official photograph

- Mariyas Herbal Hair Care Oil (`mariyas-hair-oil`)
- Hair Pack & Wash Powder 100 g (`hair-pack-wash-powder-100gm-19214`)
- Lip Balm 10 g (`lip-balm-10gm-19216`)
- Eyebrow Oil 10 ml (`eyebrow-oil-10ml-19219`)
- Under Eye Dark Circle Oil 10 ml (`under-eye-dark-circle-oil-10-ml-19222`)
- Rose Petals Face Pack 100 g (`rose-petals-face-pack-100-g-2886`)
- Lotus Petals Face Pack 100 g (`lotus-petals-face-pack-100-g-2887`)
- Kajal (`kajal-19587`)
- Saffron Fairness Oil (`saffron-fairness-oil-19597`)
- Mariyas Fairness Natural Soap (`mariyas-fairness-natural-soap-19674`)
- Mariyas Oil Treated Comb – Dual (`mariyas-oil-treated-comb-dual-21885`)
- Mariyas Oil Treated Comb – Wide (`mariyas-oil-treated-comb-wide-21914`)
- Mariyas Oil Treated Comb – Fine (`mariyas-oil-treated-comb-fine-21918`)
- Mariyas Oil Treated Comb – Combo Pack (`mariyas-oil-treated-comb-combo-pack-21919`)
- Lotus Gel 100 g – No Stock (`lotus-gel-100-g-no-stock-2934`)
- Hibiscus Gel 100 g (`hibiscus-gel-100gm-24246`)
- Mariyas Hair & Skin Care Kit (`mariyas-hair-skin-care-kit-77781`)
- Ashwagandha Powder 100 g (`ashwagandha-powder-100g-79428`)
- Pathimugham Powder 100 g (`pathimugham-powder-100g-79434`)
- Reetha Powder 100 g (`reetha-powder-100g-79435`)
- Shatavari Powder 100 g (`shatavari-powder-100g-79437`)
- Wild Turmeric Powder 100 g (`wild-turmeric-powder-100g-79439`)
- Kolarakku Powder 100 g (`kolarakku-powder-100g-79449`)
- Navara Powder 100 g (`navara-powder-100g-79451`)
- Karkidaka Kanji (`karkidaka-kanji-89315`)
- Ghee – Vechoor Cow 500 g (`ghee-vechoor-cow-500gm-98121`)

## Owner note

The owner-signed release tools in `ops/` pin the previous image inventory. They are
untouched by this sync and must be re-pinned by the owner before the next
owner-signed release; every other validation path reads
`src/data/media-manifest.json`.
