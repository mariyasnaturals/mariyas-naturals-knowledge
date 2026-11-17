# Five-language audit — EN, ML, HI, TA, KN

Built from `dist/` of the production-origin candidate
(`SITE_URL=https://mariyasnaturals.in SITE_ENV=production ALLOW_INDEXING=true`),
measured on 2026-11-17. Every number below is reproducible with the commands in
[`README.md`](README.md); every finding marks whether a machine checked it
(**M**) or a native speaker still has to read it (**H**).

> **Scope honesty.** Nothing in this document is a native-language review. The
> translations were not validated for grammar, idiom or search phrasing by a
> speaker of Malayalam, Hindi, Tamil or Kannada; the checks below are structural
> and mechanical. Treat the four non-English locales as _structurally correct,
> linguistically unreviewed_.

## 1. What is built, per locale

| Locale | Route root          | Pages | `<html lang>` | Charset | Self-canonical | 6 hreflang + x-default | Switcher → 5 equivalents |
| ------ | ------------------- | ----- | ------------- | ------- | -------------- | ---------------------- | ------------------------ |
| EN     | `/en/`              | 70    | ✓             | UTF-8   | ✓              | 351 / 351              | 351 / 351                |
| ML     | `/ml/`              | 70    | ✓             | UTF-8   | ✓              | 351 / 351              | 351 / 351                |
| HI     | `/hi/`              | 70    | ✓             | UTF-8   | ✓              | 351 / 351              | 351 / 351                |
| TA     | `/ta/`              | 70    | ✓             | UTF-8   | ✓              | 351 / 351              | 351 / 351                |
| KN     | `/kn/`              | 70    | ✓             | UTF-8   | ✓              | 351 / 351              | 351 / 351                |
| —      | `/` (language gate) | 1     | `en`          | UTF-8   | → `/en/`       | n/a (canonicalised)    | n/a                      |

70 pages per locale = home, hair-oil pillar, ritual, catalogue index, 5 collection
pages, 59 product pages, awards and certifications templates. 5 × 70 + 1 root =
351 (**M**).

Measured on the built HTML, not on the source: `lang` matches the route on
351/351 pages; every page declares `<meta charset="utf-8">`; canonical equals
origin + its own route everywhere except the root, which points at `/en/` (**M**).

## 2. Per-page-type matrix

Visible text is counted as whitespace tokens inside `<main>`; Indic scripts pack
more meaning per token, so compare within a column, not across.

| Page type              | Example URL (each locale)                   | Tokens EN/ML/HI/TA/KN       | Title in native script            | Description in native script | Images with alt |
| ---------------------- | ------------------------------------------- | --------------------------- | --------------------------------- | ---------------------------- | --------------- |
| Home                   | `/{lang}/`                                  | 599 / 460 / 597 / 479 / 475 | 5 / 5                             | 5 / 5                        | 346 / 346       |
| Hair-oil pillar        | `/{lang}/hair-oil/`                         | 802 / 521 / 798 / 548 / 533 | 5 / 5                             | 5 / 5                        | 346 / 346       |
| Collection             | `/{lang}/collections/hair-care/`            | 133 / 122 / 135 / 127 / 129 | 5 / 5                             | 5 / 5                        | 346 / 346       |
| Product detail         | `/{lang}/products/mariyas-hair-oil-200-ml/` | 110 / 90 / 114 / 97 / 101   | **0 / 5** (official name, see §4) | 5 / 5                        | 346 / 346       |
| Ritual finder          | `/{lang}/ritual/`                           | 145 / 87 / 155 / 99 / 97    | 5 / 5                             | 5 / 5                        | 346 / 346       |
| Awards (gated)         | `/{lang}/awards/`                           | template                    | 5 / 5                             | 5 / 5                        | —               |
| Certifications (gated) | `/{lang}/certifications/`                   | template                    | 5 / 5                             | 5 / 5                        | —               |

Examples of the copy as it ships (length in characters, HTML entities decoded):

| Locale | Title                                                                     | Description (truncated)                                                                                 |
| ------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| EN     | `Ayurvedic Hair Oil & Natural Care in Kerala \| Mariyas Naturals` (64)    | `Explore Mariyas Naturals Ayurvedic hair oil, baby care, skincare and herbal wellness in Kerala…` (159) |
| ML     | `കേരളത്തിലെ ആയുർവേദ ഹെയർ ഓയിലും പരിചരണവും \| Mariyas Naturals` (59)       | `മരിയാസ് നാച്വറൽസിന്റെ ഹെയർ ഓയിൽ, ശിശുപരിചരണം, ചർമ്മപരിചരണം…` (142)                                     |
| HI     | `केरल में आयुर्वेदिक हेयर ऑयल, प्राकृतिक देखभाल \| Mariyas Naturals` (65) | `मरियास नैचुरल्स के हेयर ऑयल, शिशु देखभाल, त्वचा देखभाल…` (126)                                         |
| TA     | `கேரள ஆயுர்வேத ஹேர் ஆயில், இயற்கைப் பராமரிப்பு \| Mariyas Naturals` (64)  | `மரியாஸ் நேச்சுரல்ஸின் ஹேர் ஆயில், குழந்தைப் பராமரிப்பு…` (162)                                         |
| KN     | `ಕೇರಳದಲ್ಲಿ ಆಯುರ್ವೇದ ಹೇರ್ ಆಯಿಲ್, ನೈಸರ್ಗಿಕ ಆರೈಕೆ \| Mariyas Naturals` (64)  | `ಮರಿಯಾಸ್ ನ್ಯಾಚುರಲ್ಸ್‌ನ ಆಯುರ್ವೇದ ಹೇರ್ ಆಯಿಲ್, ಶಿಶು ಆರೈಕೆ…` (152)                                          |

All 351 titles are ≤ 65 characters and all descriptions sit in 72–165, enforced
by `scripts/validate-seo.mjs` on every build (**M**).

## 3. Defects found and corrected in this pass

| #   | Defect                                                                                                                                                                                                                                                                                                                                                   | Evidence                                                                                                                                          | Fix                                                                                                                                                                                                                                                   |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Every collection page and product page named the wrong section.** The eyebrow read `MARIYAS NATURALS / THE HAIR CARE EDIT` on baby care, skin care, herbal powders and wellness pages — in all five locales — because one hard-coded label was reused on 325 pages. The Kannada pages additionally kept the English string.                            | `grep -c "HAIR CARE EDIT"` over `dist/`: 325 pages before, 0 after; text extracted from `/en/collections/wellness/`, `/kn/collections/skin-care/` | `EditorialLayout` accepts a per-page `eyebrow`; each route now passes its own localized category label (`t.categories[…`, `t.catalogue`). Verified: 25 distinct section labels, 295 product pages labelled with their own collection, 0 stale strings |
| 2   | **The brand name was transliterated three different ways inside one language.** Malayalam had `മരിയാസ്` and `മാരിയാസ്`; Hindi `मरियास`, `मारियास`, `मारियाज़`; Tamil `மரியாஸ்` / `மாரியாஸ்`; Kannada `ಮರಿಯಾಸ್` / `ಮಾರಿಯಾಸ್`. The minority spellings were concentrated in the files added by the SEO round (pillar, evidence, claim registry, assistant). | Per-locale variant counts over `src/` and `dist/` before and after (e.g. ml 88 minority occurrences in `dist`, hi 229, kn 228)                    | Normalised 37 occurrences in 6 files to the form the dictionaries already use site-wide. After rebuild: 0 minority occurrences in any locale                                                                                                          |
| 3   | **`Organization.sameAs` listed the store twice and no social profile.**                                                                                                                                                                                                                                                                                  | `dist/en/index.html` JSON-LD: `["https://www.mariyasnaturals.com","https://www.mariyasnaturals.com"]`                                             | `SEOHead` now emits a de-duplicated list: store, Instagram, Facebook — the profiles whose destinations are recorded in `src/data/site-contact.ts`. New validator gate fails on a duplicate, an empty list or a self-reference                         |
| 4   | **The audit reported “shortest meta description: 0”.** A stray `0` argument to `Math.min` made the minimum impossible to exceed. No page had a missing description; the true minimum is 72 characters (`/ta/collections/herbal-powders/`).                                                                                                               | `docs/seo/technical-seo-audit.md` before/after; a direct scan of all 351 files found 0 pages without a description                                | `shortest()` / `longest()` helpers that handle an empty list without poisoning the result                                                                                                                                                             |

New gates that lock these in (**M**):

- section labelling: eyebrow must equal the page's own collection label, and every
  product page must be reachable from a collection (fail-closed if not);
- `Organization`: name, url = origin, logo, non-empty de-duplicated absolute
  `sameAs`, no self-reference.

## 4. Findings that are not defects, but are open

| Finding                                                      | Numbers                                                                                                                                                                                    | Verdict                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Product titles stay in English on the four Indic locales** | 236 of 240 non-English product pages have titles with no native script; all 5 locales share the same product title (60 duplicate-title groups, 12 products × 5 besides the root/home pair) | Deliberate policy: the official pack name is published verbatim and never transliterated (`titleLang: 'en'`, and `name: {en, ml, hi, ta, kn}` all carry the store's own spelling). The `<h1>` carries `lang="en"` so the markup is honest. The localized category now appears in the eyebrow, and the description is localized. **Recommendation, needs owner sign-off:** add the localized category label to the title (e.g. `Amla Shampoo 200 ml — കേശപരിചരണം`), which fits the 65-character cap for 59/59 products in every locale but changes approved product-name presentation, so it was not done unilaterally |
| **Collection pages are thin**                                | 122–135 visible tokens; descriptions 77–103 characters (the longest/shortest description in the build are both collection pages)                                                           | Real but consequence-light: collections are listing pages whose products carry the detail. Expanding them would need approved per-category editorial copy — a content decision, not a bug                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Product descriptions are one generic sentence per locale** | `t.productDescription`, identical body text on 59 pages, prefixed with the product name so every description is unique                                                                     | Honest and deliberate (never paraphrase the store's listing copy). Thin, though: a per-product sentence would need the source data that `catalogue/catalogue-source.json` does not contain (it stores no description text)                                                                                                                                                                                                                                                                                                                                                                                            |
| **Facebook profile is unresolved**                           | Owner sent `facebook.com/share/1L7pFCXvWb/`; it returns HTTP 403 to anonymous fetches, as does the Page URL                                                                                | The site links the Page URL that the store's own schema declares; recorded with its provenance in `site-contact.ts`. Not presented as verified-by-fetch                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **Kannada, Tamil, Malayalam, Hindi copy**                    | 4 locales × 70 pages                                                                                                                                                                       | **H** — needs a native reviewer. Nothing here can substitute for that                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

## 5. What a native reviewer should check, in priority order

1. Home and hair-oil pillar in each language: does the copy read like something a
   shop owner would say, or like translated English? These are the pages that will
   rank.
2. The five FAQ answers on the pillar: the questions were written in English and
   translated; a native speaker would phrase the _questions_ differently (for
   example, Malayalam shoppers search for `മുടി കൊഴിച്ചിൽ` — hair fall — far more
   often than for a literal translation of “what is in it”).
3. Collection descriptions: five short paragraphs per language, currently the
   thinnest copy on the site.
4. The product-name policy in §4: keep verbatim English, or add a localized
   category qualifier. This is the single largest native-relevance decision left.

No search-volume figure, ranking claim or language-quality score appears anywhere
in this document, because none was measured.
