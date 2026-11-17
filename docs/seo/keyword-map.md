# Keyword and content map — verified evidence vs hypothesis

There is **no search-volume, ranking or Search Console data in this repository**,
and none is invented here. What follows separates the three things that can be
stated honestly:

1. **Evidence** — facts about the site and the store that are checkable in the repo
   or on the live pages (page inventory, product names, review text, catalogue
   structure).
2. **Hypothesis** — where a page _should_ aim, derived from how this catalogue is
   actually described and what the reviews and store copy say. Written as a claim
   to be tested, not a promise.
3. **Decision needed** — the choices a native reviewer or the owner has to make.

## 1. Evidence

- 351 pages: 5 locales × (home, hair-oil pillar, ritual, catalogue index, 5
  collections, 59 products, awards, certifications) + the language gate at `/`.
- 59 visible products, 26 hidden (excluded from index and sitemap), and the
  withdrawn 1-litre pack, which returns 404 permanently.
- The product names shipped on `.in` are the store's own names — the same strings
  `.com` ranks with today. That makes every product page a direct continuation of an
  existing URL's topic, not a new invention.
- The three approved Google reviews use the language customers actually use:
  “reduce my hairfall”, “strengthen my hair”, “hair growth”, “no chemicals”, “must
  try this”. Two of the three mention hair-fall or growth — which the site
  deliberately does **not** echo as its own claim.
- The store's own copy talks about Bhringraj, Amla, Brahmi, Hibiscus, coconut oil,
  Kerala and Ayurvedic recipes. All of that is .com's wording; `.in` deliberately
  paraphrases none of it.

## 2. Hypothesis map — one row per cluster, target page already exists

| #   | Cluster (English)                                                    | Indic phrasing to validate with a native speaker                                   | Intent                   | Target page today                                                 | Notes / cannibalisation risk                                                                                                                                                              |
| --- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------ | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Mariyas Naturals, Mariyas hair oil, Mariyas herbal                   | `മരിയാസ് ഹെയർ ഓയിൽ`, `मरियास हेयर ऑयल`, `மரியாஸ் ஹேர் ஆயில்`, `ಮರಿಯಾಸ್ ಹೇರ್ ಆಯಿಲ್` | Branded, transactional   | `/en/hair-oil/` → `.com` product URLs; product pages for the rest | The only cluster with real evidence: reviews and the store use these names. Keep the brand suffix on every title (already enforced)                                                       |
| 2   | Herbal hair oil, Ayurvedic hair oil, hair oil for hair fall          | `മുടി കൊഴിച്ചിൽ എണ്ണ`, `बाल झड़ने के लिए तेल`                                      | Commercial investigation | Pillar + 2 hair-oil product pages + `collections/hair-care/`      | Pillar and the collection compete for the same words. Pillar takes the _question_ (“what is in it, how to use it”), collection takes the _listing_. Do not add the same paragraph to both |
| 3   | Ingredient questions: what is in hair oil, Bhringraj / Amla / Brahmi | `ഭൃംഗരാജ്`, `भृंगराज`, `கருவேலம்`…                                                 | Informational, AEO/GEO   | Pillar FAQ (5 answers, visible + `FAQPage`)                       | The single most AI-answerable surface. It currently answers without a count, on purpose. Do **not** add an ingredient count until §1 of `claim-discrepancies.md` is closed                |
| 4   | Coconut-oil hair oil, Kerala-made hair oil                           | `കേരള ഹെയർ ഓയിൽ`, `केरल हेयर ऑयल`                                                  | Local + attribute        | Home, pillar, hair-care collection                                | “Kerala” is already in all five titles. Resist adding it to every product title as well                                                                                                   |
| 5   | Baby care, baby massage oil                                          | `ശിശു തലയെണ്ണ`, `बेबी मसाज ऑयल`                                                    | Commercial, sensitive    | `collections/baby-care/` + baby product pages                     | **On hold.** The brief requires an extra safety review before baby-care pages get expanded SEO copy; none was written                                                                     |
| 6   | Shampoo, herbal shampoo, anti-dandruff                               | `ഷാംപൂ`, `शैम्पू`                                                                  | Commercial               | `collections/hair-care/` + shampoo product pages                  | 20 of the 59 products are shampoos — the largest single product group. The collection page is thin (122–135 tokens), so this is where extra _approved_ category copy would pay off first  |
| 7   | Herbal powders, henna, multani mitti                                 | `മുട്ടി`, `मुल्तानी मिट्टी`, `மருதாணி`                                             | Commercial               | `collections/herbal-powders/`                                     | 21 products. Same thin-copy caveat                                                                                                                                                        |
| 8   | Skin and body care, aloe gel, kumkumadi                              | `ആലോവേര ജെൽ`, `एलोवेरा जेल`                                                        | Commercial               | `collections/skin-care/`                                          | 23 products                                                                                                                                                                               |
| 9   | Where to buy / price / delivery                                      | `എവിടെ വാങ്ങാം`, `कहां से खरीदें`                                                  | Transactional            | Assistant + pillar CTA + product pages → `.com`                   | Answered by the care assistant from the catalogue; no price or shipping promise is made on `.in`                                                                                          |
| 10  | How to use hair oil, champi, hair oil routine                        | `തലയിൽ എണ്ണ തേക്കുന്നത് എങ്ങനെ`                                                    | Informational            | Pillar §_How to use it_ + ritual finder                           | Currently under-served: the pillar defers to the pack for directions, so a “how to use” page would repeat it. Better: extend the ritual finder                                            |

## 3. What is deliberately _not_ built

- **No city, state or “near me” pages.** A shop with one address that ships from
  Alappuzha does not become more findable by inventing 40 location pages, and it
  would be a doorway pattern.
- **No translated-English keyword insertion.** The Malayalam pages do not carry
  English search phrases in body copy; the only English on them is the official
  product name (marked `lang="en"`), the reviews, and the brand.
- **No volume or difficulty table.** Any number here would be fabricated.
- **No new product pages for hidden listings** (26 withheld pending photography)
  and no resurrection of the 1-litre pack.

## 4. Decisions needed

1. **Product titles**: verbatim English (status quo) or plus a localized category
   qualifier. See `five-language-audit.md` §4 — it fits the 65-character cap today
   for 59/59 products, but it changes how an official product name is presented.
2. **Per-category editorial copy** for the five collections, written for the
   language rather than translated, then approved.
3. **A native reviewer's question set** for the pillar FAQ — the current questions
   were authored in English and translated, and the phrasing of the _questions_
   matters more for AEO than the answers.
4. **Search Console access** for `mariyasnaturals.in` once it is deployed, so the
   next iteration can work from queries instead of hypotheses.
