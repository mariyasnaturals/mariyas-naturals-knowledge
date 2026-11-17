# Evidence request — what unlocks the gated pages

Nothing in this list exists in the repository, and nothing has been invented to
fill the gap. Each item below corresponds to a record in
[`src/data/knowledge-gates.ts`](../../src/data/knowledge-gates.ts) or an empty array
in [`src/data/evidence.ts`](../../src/data/evidence.ts).

## 1. Hair Oil formulation — unlocks the ingredient count

**Claim:** `hair-oil-60-ingredients` · status `pending-verification`

Send one of:

- the formulation sheet, master formula or batch manufacturing record that lists
  the ingredients, so the count can be checked independently;
- if the sheet is confidential, a signed statement naming the count **and** the
  list of ingredients printed on the pack, so the two can be reconciled.

Also needed:

1. Which of the ingredients are named on the pack, and which are processing aids.
2. The exact public sentence you approve, in English and in the four translations
   (we will supply drafts).
3. Confirmation of how the `.com` description should read afterwards — the live
   listing has said "approximately 50 herbs". Two numbers cannot both be right.

## 2. Purity claims — unlocks "No added …"

**Claim:** `chemical-free-blanket` · status `not-approved`

Send:

- the laboratory report or manufacturer declaration naming the substance that is
  absent, with the test method, the sample and the date;
- the wording you want, in the precise form: "No added mineral oil", "No added
  synthetic fragrance", "No added parabens" … One substance per statement.

The blanket phrase will not be published even with a report, because it cannot be
made true: herbs, water and oils are chemicals too. A specific, testable statement
is stronger and defensible.

## 3. Certifications — unlocks `/[lang]/certifications/`

For each document:

| Field     | What we need                                                                            |
| --------- | --------------------------------------------------------------------------------------- |
| Document  | A legible scan or photograph of the whole page, including its number                    |
| Issuer    | The issuing authority, exactly as printed                                               |
| Kind      | Manufacturing licence · laboratory report · quality certification · government document |
| Scope     | What it covers, and which products or premises it applies to                            |
| Dates     | Issue date, and expiry date if it has one                                               |
| Redaction | Which personal details to mask (names, signatures, phone numbers, internal references)  |

The page will state the scope as narrowly as the document does. A manufacturing
licence is published as a manufacturing licence — never as a product approval and
never as a Ministry of Ayush endorsement.

## 4. Awards — unlocks `/[lang]/awards/`

For each award:

1. Title exactly as the issuing organisation writes it.
2. Issuing organisation, and the year.
3. Trophy, certificate or citation photograph (or a scan).
4. One or two sentences on what the award recognises.
5. Written permission to publish the photograph on the website.

Nominations, shortlists and participation certificates are recorded as such; they
are never described as wins.

## 5. Baby-care content review

The brief asks for an additional safety review before baby-care pages receive
expanded SEO content. That review has not happened, so the baby-care collection
keeps its current description and no new claims were written for it.

## 6. Measurement

For analytics and conversion tracking: a measurement ID, the consent approach, and
confirmation that a first-party (not third-party) collector is acceptable — the
browser suite enforces that no request leaves the site's own origin.

## How approval works

1. The document arrives and is filed under `catalogue/evidence/` (not yet created —
   nothing has been supplied).
2. The entry is added to `src/data/evidence.ts`, or the claim's wording is finalised
   in `src/data/knowledge-gates.ts`, with `status: 'published'`.
3. `src/data/evidence-publication.json` is flipped for that page.
4. `npm run build && npm run test:seo` — the page becomes indexable, enters the
   sitemap, and appears in the footer automatically.
5. The exact public wording is confirmed in the preview before release.
