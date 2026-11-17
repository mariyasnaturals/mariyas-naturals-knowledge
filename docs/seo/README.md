# MARIYAS-SEO-AEO-GEO-001 — implementation status

Everything below is implemented and verified in the repository. Items marked
**gated** are deliberately not published: the code path exists, the switch exists,
and the page stays `noindex` and out of the sitemap until the owner supplies the
evidence and approves the exact wording.

Companion documents: [`five-language-audit.md`](five-language-audit.md) (locale
matrix, defects found and fixed), [`claim-discrepancies.md`](claim-discrepancies.md)
(what `.com` says versus what `.in` publishes), [`keyword-map.md`](keyword-map.md)
(hypotheses, explicitly not volumes), [`legacy-urls.md`](legacy-urls.md) (redirect
rules and the missing inventory), [`release-provenance.md`](release-provenance.md)
(revision and artifact hashes) and [`evidence-request.md`](evidence-request.md).

Reproduce the checks with:

```bash
SITE_URL=https://mariyasnaturals.in SITE_ENV=production ALLOW_INDEXING=true npm run build
EXPECT_SITE_URL=https://mariyasnaturals.in EXPECT_INDEXABLE=true \
  npm run test:static && npm run test:seo && npm run test:media-policy
npm test            # 59 data and copy assertions
npm run test:browser  # 52 Chromium + axe checks
```

`npm run test:seo` also regenerates [`technical-seo-audit.md`](technical-seo-audit.md),
so the numbers in that file are the build's own, not estimates.

## 1. Hair Oil pillar — `/[lang]/hair-oil/`

One page in five languages (351 pages total, up from 336). It carries the two
pack sizes with the exact `.com` product URLs, the three approved reviews with
their Google attribution, a visible FAQ mirrored in `FAQPage` structured data, and
original educational copy — what the oil is, what is in it, how to use it, where
it is made, and what it is not.

Deliberately absent:

- **no ingredient count.** The owner reports 60 ingredients; the `.com` listing has
  said "approximately 50 herbs". Both are recorded in
  [`src/data/knowledge-gates.ts`](../../src/data/knowledge-gates.ts) as
  `pending-verification`, together with the evidence needed. **Gated.**
- **no "chemical-free".** Registered as `not-approved`: a blanket statement of that
  kind is scientifically empty and unprovable. The registry names the precise
  replacement pattern ("No added &lt;verified substance&gt;"), which needs a report
  that names the substance. **Gated.**
- **no superlative** ("Kerala's only…"), **no regrowth or cure claim**, and no
  suggestion that a review is evidence of one. Refused outright, not softened.

## 2. Awards and certifications

`/[lang]/awards/` and `/[lang]/certifications/` exist as reviewed templates in five
languages: title, description, breadcrumb, hreflang, honest state ("this page is
being verified"), the evidence checklist, and the rules each entry must satisfy.

|                   |                                          |
| ----------------- | ---------------------------------------- |
| Entries published | 0 — `awards: []`, `certifications: []`   |
| Indexability      | `noindex, follow`                        |
| Sitemap           | excluded via `astro.config.mjs`          |
| Footer links      | rendered only when a page is publishable |
| Switch            | `src/data/evidence-publication.json`     |

The certifications page always explains the four document kinds and states that a
manufacturing licence is **not** a Ministry of Ayush product approval.

To publish one entry: add it to the registry with its issuer, scope, dates and
document, then flip the switch. The page, the sitemap, the validator and the
footer all read the same flag.

## 3. Technical SEO

Implemented and enforced by `scripts/validate-seo.mjs` (fails the build):

- canonical = origin + route on all 351 pages (root canonicalises to `/en/`);
- five hreflang alternates plus `x-default`, reciprocal, all targets built;
- one `<h1>` per page, no skipped heading level after it;
- title ≤ 65 characters, description 70–165 characters — measured, and the
  five homepage titles plus eight collection descriptions were corrected to fit;
- robots per deployment (`index, follow` on `.in`), evidence routes excepted;
- sitemap ↔ page parity in both directions, with gated routes excluded — 351 built
  pages against 340 sitemap URLs, the difference being exactly the language gate at
  `/` (which canonicalises to `/en/`) plus the ten unpublished evidence templates
  (`{en,ml,hi,ta,kn} × {awards, certifications}`); the validator names those eleven
  routes individually if the arithmetic ever changes;
- section labelling: the eyebrow on every collection and product page must equal the
  localized category the page actually belongs to, and every product page must be
  reachable from a collection, so a page can neither be mislabelled nor skip the
  check;
- `Organization`, `WebSite` and a WebPage-family node on every page, no `offers`
  in Product markup (prices stay on `.com`);
- `Organization` entity basics: name, the canonical origin, a logo, and a
  de-duplicated `sameAs` list that carries the store and the two social profiles the
  footer links to, never the site itself;
- every internal link resolves to a built file (10,440 checked);
- every image is local with an `alt` (1,738 checked);
- `robots.txt` on a production build is `User-agent: *` / `Allow: /` plus the
  sitemap line — permissive for every crawler, so Googlebot, Bingbot and
  OAI-SearchBot are all covered by the wildcard; on any non-indexable build it is
  `Disallow: /` instead. There is no per-bot stanza, and none is needed.

AEO/GEO specifics: the pillar's FAQ is real text in the HTML (not injected by
script), the answers are short and self-contained, product and pack-size facts are
stated identically on the page, in the schema and in the assistant, and every
commercial intent links to the exact `.com` product URL rather than duplicating
the listing copy. No `FAQPage` markup is added anywhere without a matching visible
FAQ.

## 4. Chat with Mariyas

Two new intents in five languages: **manufacturing** (Kerala, from the verified
postal address; explicitly refuses to quote a licence or a production figure) and
**shopping** (orders happen on `.com`; refuses to guess a list of international
destinations). Existing intents cover pack size, price, stock, usage, ingredients,
safety, shipping and contact. The knowledge base is built from the 59 public
products only; `tests/seo.test.mjs` asserts no hidden slug can reach it. Still
fully offline — no model, no API call, no new paid service.

## 5. Known gaps and what is needed to close them

| Gap                               | Blocked on                                                           |
| --------------------------------- | -------------------------------------------------------------------- |
| Ingredient count on the pillar    | Formulation sheet + approved wording (§1)                            |
| Any "no added …" purity statement | Laboratory report or declaration naming the substance                |
| Awards page content               | Award title, issuer, year, photo/citation, publication permission    |
| Certifications page content       | Legible document, issuer, scope, dates, redaction instruction        |
| Baby-care category content        | Additional safety review, per the brief                              |
| Keyword research per category     | Owner-approved priority list; no search-volume figures invented here |
| Legacy WordPress URL mapping      | The live `.in` sitemap/analytics export (see below)                  |
| Analytics and conversion tracking | A measurement ID and consent decision from the owner                 |

### Redirect mapping

The live `.in` host already serves the static site — and `/wp-sitemap.xml` answers
404, so the WordPress site is gone and its URL inventory can no longer be read from
the host. The deterministic part is generated anyway:
[`legacy-urls.md`](legacy-urls.md) documents the rules and
`scripts/build-legacy-redirects.mjs` emits 85 product, 13 category and 6 commerce
rules into `release/nginx/legacy-redirects.proposed.conf`. What is still missing is
the real inventory — Search Console → Pages, the host access log, or a saved
`wp-sitemap.xml` — so nothing is enabled, and the withdrawn 1-litre pack is reported
for manual `410` mapping instead of being guessed at.

### Analytics

No tracker is installed, and none is added here: a third-party script would break
the "zero requests leave the origin" guarantee the browser suite enforces. The
event surface is already visible in the markup for whoever wires a first-party
collector: every `.com` purchase link, every WhatsApp and mailto link, the
language switcher, the ritual finder and the assistant are identifiable by class
and `href`. Recommended plan, in order: a cookieless first-party collector, then
`.in → .com` click events, then language and country breakdowns, then AI-referral
segmentation (`chatgpt.com`, `perplexity.ai`, `copilot.microsoft.com` referrers).
