# Customer voices and social destinations

**Status: three owner-approved Google reviews are published on the homepage;
Facebook and Instagram each point at one verified destination.** Last updated
2026-11-16.

## The three published reviews

The owner supplied a screenshot of the Mariyas Naturals Google Business Profile
and approved displaying these three reviews. They live in
`src/data/customer-reviews.ts`, one record each, and nothing else on the site
holds review text.

| Reviewer             | Rating | Review (verbatim)                                                                                                                                                           |
| -------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pramod Kumar .M.S    | 5 ★    | "I am their regular customer and its hair oil really helps to reduce my hairfall and helps to strengthen my hair and improve hair growth. I really recommend this product." |
| Abacus World Academy | 5 ★    | "Excellent hair oil for hair growth, must try this"                                                                                                                         |
| Jincy Siju           | 5 ★    | "No chemicals very good experience i am happy"                                                                                                                              |

Rules that hold for every card, enforced by `tests/reviews-social.test.mjs` and
`scripts/validate-static.mjs`:

- **Verbatim text.** Spelling, punctuation and capitalisation are the reviewer's.
  Nothing is tidied, trimmed or extended, and no quote marks are added — the card
  is a `<blockquote>`, which is what marks it as a quotation.
- **Attribution.** The reviewer's name exactly as Google shows it, the star rating
  they gave, and a "Google Review" chip whose label is localised.
- **No invention.** No reviewer photographs, no review dates, no relative
  timestamps ("a week ago"), no helpfulness counts, no additional statements.
- **Opinion, not finding.** A note under the carousel says these are customer
  opinions quoted from Google Reviews, published with the owner's approval, that
  they describe individual experiences rather than medical outcomes, and that
  results vary. Nothing claims the reviews prove hair regrowth or treatment
  effectiveness, and the reviewer's "No chemicals" stays inside the quotation —
  it is never restated as a chemical-free brand claim.
- **No review markup.** There is no `Review` or `aggregateRating` structured data
  anywhere in the built output, so nothing here solicits a star snippet.
- **Nothing automatic.** No widget, no Google script, no API client, no scraper,
  no synchronisation. Transcription was manual from the owner's screenshot.

### The aggregate is separate, and unchanged

The rating block above the carousel keeps its reading from the listing: **4.2 ★
from 574 Google reviews, as shown on Google on 2026-11-16**, with the
"View reviews on Google" button pointing at
`https://maps.google.com/?cid=12669174919246619705`. It is deliberately not
derived from the three cards, is never presented as live, and was not updated in
this release because no newer figure has been independently confirmed.

### Compliance position (reported to the owner)

Google's own guidance for businesses (`about.google/brand-resource-center`,
"Customer reviews") states that user reviews belong to the person who wrote them
and that **consent from the reviewer is needed to use a review in marketing, such
as on a website**. That is a restriction on republishing reviews, independent of
the profile owner's approval.

The owner has approved publication, and this release publishes them with these
mitigations: verbatim text, full attribution, a link back to the source listing,
an explicit "customer opinion" label, no medical or brand-claim reuse, no review
structured data, and no automated collection. To be fully aligned with Google's
guidance, the owner should obtain each reviewer's consent (Google suggests
replying to the review to ask). If a reviewer declines, delete that record from
`src/data/customer-reviews.ts`: the card disappears from all five locales on the
next build.

This is an owner decision recorded here rather than a restriction that was
bypassed silently.

## Localisation

The quotations stay in the English they were written in on every locale, marked
`lang="en"` so screen readers pronounce them correctly. Only the interface around
them is localised — the section heading, the attribution chip
("Google Review"), the "5 out of 5" star label, the opinion note, the carousel
labels and the new-tab hint on the social buttons.

## Social destinations

| Network   | Destination                                               | How it was verified                                                                                                                                                                                                                                                                                                                                                                             |
| --------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Instagram | `https://www.instagram.com/mariyas_herbal_hair_care_oil/` | Owner supplied the same profile with a `?srtk=` share tracker; the clean canonical URL is used. Profile opened directly: MARIYAS HERBAL HAIRCARE OIL, bio links to mariyasnaturals.com.                                                                                                                                                                                                         |
| Facebook  | `https://www.facebook.com/mariayasnaturals/`              | Owner supplied `https://www.facebook.com/share/1L7pFCXvWb/`. Facebook returns HTTP 403 to anonymous fetches for both the share link and the Page, so the shortcode could not be resolved from here. The Page URL used is the one the official store declares in its own Organization `sameAs` data and whose public Page metadata identifies the same business ("Mariyas Naturals, Alappuzha"). |

Both are declared once in `src/data/site-contact.ts`, together with the owner's
original link and the resolution note. Every social button on the site — footer
and customer-voices section, all five locales — reads those two records, so the
destination cannot drift. Each renders with `target="_blank"`,
`rel="noopener noreferrer"` and an accessible label that includes the localised
"opens in a new tab" hint.

If the owner confirms that the Facebook share link points somewhere other than
`facebook.com/mariayasnaturals/`, change the single `href` in
`src/data/site-contact.ts`; nothing else needs editing.

## Tests

| Suite                           | Covers                                                                                                                                                                                                                                                                                                                             |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/reviews-social.test.mjs` | The three texts and names character for character; no invented dates, photos or counts; the opinion labels in five locales; no brand claim built from "No chemicals"; no Google API or scraper; one source for each social URL; 44 px targets and reduced-motion hooks                                                             |
| `scripts/validate-static.mjs`   | In every locale: exactly three review cards, zero placeholders, verbatim names and quotes, per-card attribution, the opinion note and its link back to the listing, the aggregate and its reading date, and two Facebook/Instagram buttons per page all on the verified destination; no `Review`/`aggregateRating` schema anywhere |
| `tests/browser/home.spec.ts`    | The three cards and their text in all five locales, the 44 × 44 controls, keyboard operation, reduced motion, no overlap and no horizontal overflow at 320, 360, 390, 430, 768, 1024, 1440 and 1920 px                                                                                                                             |
