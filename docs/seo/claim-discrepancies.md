# Claim discrepancies — what the two domains say, and what is still unresolved

Read on 2026-11-17 from the live `.com` product page
`https://www.mariyasnaturals.com/product/mariyas-herbal-hair-care-oil/` and from
the built `.in` candidate. Nothing below changes `.com`: it is the transactional
store and is out of scope by standing instruction.

The `.in` rule is simple and enforced by `scripts/validate-seo.mjs`: a claim is
published only when a record in
[`src/data/knowledge-gates.ts`](../../src/data/knowledge-gates.ts) has status
`published`, and the validator fails the build if a gated phrase reaches `dist/`.

## 1. The ingredient count — one page, two numbers, live today

| Where on `.com`                      | Text                                                                       |
| ------------------------------------ | -------------------------------------------------------------------------- |
| Hero bullet                          | `~60 Ayurvedic herbs incl. Bhringraj, Amla, Brahmi & Hibiscus…`            |
| “About Mariyas Herbal Hair Care Oil” | `hand-crafted in Kerala from around 50 carefully selected medicinal herbs` |
| “Key Herbal Ingredients”             | `Around 50 medicinal Ayurvedic herbs, slow-infused in pure coconut oil`    |

So the discrepancy is not between the owner's brief and the old website; it is
**inside a single live product page**: one bullet says ~60, two paragraphs say
around 50. The owner now says 60 ingredients and has supporting documents.

`.in` publishes **no count at all** — not 60, not 50. `/en/hair-oil/` says the
count is being checked against the formulation record, and the FAQ answers the
question without a number. Record: `hair-oil-60-ingredients`,
status `pending-verification`.

**Unresolved until:** the formulation sheet (or a statement of count + the pack's
ingredient list) arrives, the count and the list agree, and one approved sentence
exists. Then `.com` still has to be corrected separately — two numbers cannot both
be right, and search engines will keep seeing whichever one is not fixed.

## 2. Purity language

| `.com` says                                                                                                                            | `.in` says                                                                                                                                                                                    | Why                                                                                                                                                                                               |
| -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `100% natural`, `toxin-free`, `no chemicals`, `free from parabens, sulphates, mineral oils, synthetic colours or artificial fragrance` | Nothing of the kind. The pillar explains that a blanket “chemical-free” statement cannot be made true (herbs, water and oils are chemicals) and that a specific, tested exclusion is stronger | `chemical-free-blanket` is registered `not-approved`. A testable statement like “No added mineral oil” needs a laboratory report or declaration naming the substance, its method, sample and date |
| `ISO and GMP certified`                                                                                                                | Absent. The certifications page explains the four document kinds and states that a manufacturing licence is **not** a Ministry of Ayush product approval                                      | Not one certificate, issuer, number or date has been supplied. The page is gated (`noindex, follow`, out of the sitemap)                                                                          |

Verified mechanically: the strings `100% natural`, `toxin-free`, `chemical-free`,
`ISO` (as a content string), `GMP`, `cruelty-free`, `worldwide` and `Kerala's only`
occur **0 times** in the 351 built pages. The single “no chemicals” occurrence per
locale is inside a verbatim, attributed customer review (“No chemicals very good
experience i am happy”), which is quoted, labelled as a Google review and framed
as an opinion rather than evidence.

## 3. Efficacy and safety wording

| `.com` says                                                                                                                                                                                                                         | `.in` says                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Promotes healthy hair growth and strengthens roots`, `Helps prevent hair fall and thinning`, `Improves scalp circulation`, `Most customers notice a difference within 4-6 weeks`, `Safe for men, women and children above 5 years` | No growth, prevention, circulation or timeline claim. The pillar states plainly that this is a cosmetic oil, not a treatment, and that a review is an opinion. For children, pregnancy, allergy or a scalp condition it directs the reader to the pack cautions and a qualified practitioner |

This is a policy difference, not an evidence gap: nothing supplied so far supports
a hair-growth or timing claim, and the `.in` wording is the conservative one. If
the owner ever wants efficacy claims on `.in`, the standard is a study or a
regulatory authorisation that names the product, not a customer review.

## 4. Other `.com` observations (recorded, not acted on)

- The hair-oil page is filed under **Category: Accessories** on `.com`, while its
  bullets describe a hair oil. `.in` classifies it as hair care, from
  `catalogue/catalogue-source.json`.
- The “Shelf Life & Storage” block renders the literal placeholder
  `Best before {{SHELF_LIFE}}` — an unreplaced template variable in production.
  `.in` publishes no shelf-life statement.
- `.com` ships `shipped worldwide, including the UK and UAE`. `.in` makes no
  shipping promise and links to the store's own delivery information.

## 5. Owner checklist (the same list as `evidence-request.md`, ordered by impact)

1. **Formulation sheet or count statement + pack ingredient list** → unlocks the
   only number the site is actively asked about, and closes the 60-vs-50 split.
2. **One laboratory report or declaration per excluded substance**, with method,
   sample and date → unlocks a specific “No added …” sentence.
3. **Every certificate as a legible scan with issuer, number, scope and dates** →
   unlocks the certifications page; states scope exactly as the document does.
4. **Award title, issuer, year, artwork and permission to publish** → unlocks the
   awards page.
5. **A decision on `.com`'s own wording** (count, ISO/GMP, “100% natural”) →
   not something this repository can make, but it decides how the two domains read
   side by side in search results.

Until 1–4 exist, no count, purity, certification or award statement appears on the
site, and the two evidence routes stay `noindex, follow` and out of the sitemap.
