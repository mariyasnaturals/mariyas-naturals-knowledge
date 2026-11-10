# Mariyas Naturals Knowledge

A four-language, static Mariyas Naturals website with a premium editorial layout and current approved imagery from [mariyasnaturals.in](https://mariyasnaturals.in). The current rebrand supersedes the earlier dual-store image direction: no legacy .com visual is served or rendered. See the [rebrand report](docs/rebrand-report.md), [source policy](docs/product-assets.md) and [current catalogue](docs/rebrand-catalogue.md). Purchasing is disabled and .cloud remains a noindex staging environment.

## Stack and architecture

Astro 7 (static output), strict TypeScript, Tailwind CSS 4 through the official `@tailwindcss/vite` plugin, and GSAP 3 with ScrollTrigger. npm and Node >=22.23.4 are required; this foundation was validated on Node 24.22.1. Exact versions are recorded in `package-lock.json`. Tailwind 4 uses CSS-first configuration in `src/styles/global.css`; a separate Tailwind config file is unnecessary.

- `src/pages/[lang]/index.astro`: generated `/en/`, `/ml/`, `/hi/`, `/ta/` homepages.
- `src/i18n/`: separate UTF-8 starter dictionaries, locale registry and English fallback.
- `src/components/`: header, footer, language switcher, hero, section headings, botanical previews, story scenes, product card and reusable SEO head.
- `src/layouts/BaseLayout.astro`: common HTML document and global styles.
- `src/config/`: validated build-time URL/indexing policy and exact store-link guard.
- `src/data/products.ts`: typed, source-verified catalogue with stable IDs, explicit sizes, local responsive media and provenance. Unknown fields stay absent.
- `tests/` and `scripts/`: configuration, generated-output and browser/accessibility checks.
- `public/`: temporary typographic favicon. The text brand mark is not an approved logo.

The brand palette and spacing remain in `src/styles/global.css` and `premium.css`. `typography.css` selects Cormorant Garamond/Inter for English and Noto Serif/Sans pairs for Malayalam, Hindi and Tamil through `lang` attributes. Eight licensed WOFF2 subsets are self-hosted, use swap, and retain Indic shaping tables. Active-language fonts are preloaded; language disclosures defer unused script font requests. Generic botanical line art is decorative and does not assert an ingredient list.

## Local installation and commands

```sh
npm ci
cp .env.example .env
npm run dev
```

The existing checkout is already isolated in cloud tasks; use it directly rather than creating a worktree. In restricted cloud machines use a writable npm cache (`npm --cache /tmp/mariyas-npm ci`). If Astro cannot write telemetry settings, set `ASTRO_TELEMETRY_DISABLED=1` for Astro commands. Do not copy secret values into `.env.example`.

```sh
npm run check          # Astro + strict TypeScript diagnostics
npm run lint           # Prettier check for source and documentation
npm test               # Indexing and canonical-origin policy tests
npm run build          # Static HTML in dist/
npm run test:static    # Validate built language routes, links, metadata and sitemap
npm run test:browser   # Chromium, keyboard, reduced motion, JS-off and axe checks
npm run test:media-policy # Enforce current .in-only images throughout the static output
npm run preview       # Inspect the built static output locally
```

Browser tests expect `/usr/bin/chromium` by default. Set `CHROMIUM_PATH` to another installed Chromium executable. Screenshots and runner results are ignored. Playwright owns its foreground preview server (`--ignore-lock` avoids Astro's agent auto-backgrounding). Never use the preview server as a production server.

## Languages and editorial content

The root is a language-choice page with an explicit English fallback link. There are no location, browser-language or automatic geographic redirects. Each page has its own `lang`, translated title/description, content and language links. To add a locale, add its dictionary and locale entry, then update sitemap locale configuration and tests. Future content pages should extend the language switcher and SEO alternates to map equivalent translated paths; the current mapping covers homepages, catalogues, six collection routes and all matching current product detail pages.

Malayalam, Hindi and Tamil are starter translations requiring native-speaker review before release. All prose requires editorial approval. No numeric heritage claim is published without supporting evidence. No ingredient names, manufacturing steps, ratings, certificates, prices or availability have been invented.

## Storytelling and products

`HeroSection` uses the current .in 200 ml product image in a warm editorial composition, with edition discovery links. The mobile order puts the actual pack photograph ahead of the longer intro/actions. `StorytellingSection` retains five semantic HTML chapters, reworked around the current 200 ml and 500 ml editions. It uses restrained crossfades, a light halo and abstract oil drops. Pinning remains limited to wide, tall fine-pointer desktops and at most 650px; mobile retains native scrolling. Skip Story, no-JavaScript content and reduced-motion cleanup remain available.

`CampaignCard` and `CollectionHighlights` provide reusable cards and a feature banner for homepage, category and future promotional layouts. Only current .in category artwork is used. `/{lang}/collections/{category}/` supplies six localized static collections with truthful metadata and ItemList structure. No unverified “best,” purity, medical or certification claim is inserted to target a keyword.

The active catalogue contains 86 .in product listings. Two have four approved photographs each; the remaining 84 use clean placeholders. Current category artwork is never substituted for an individual product photo. Official product names remain in English; interface text and alt text are localized. Product ItemPage metadata includes actual names, source SKUs, brand and an approved image where available, without offers, ratings or availability assertions.

`src/config/media-policy.mjs` enforces exact current .in image provenance separately from `src/config/commerce.mjs`. The latter retains disabled global/per-product purchasing and an empty exact-URL map. Product discovery is local; source disclosures cite the current .in catalogue. No final purchase destination is guessed from a WordPress slug.

```sh
npm run fonts:prepare     # Reproduce committed licensed WOFF2 subsets from locked packages
npm run media:import      # Reprocess temporary source cache; no network by default
# Explicit audited acquisition only: npm run media:import -- --download
node scripts/measure-render.mjs  # Local lab observations + review screenshots
# Optional font audit: Python fontTools[woff] and uharfbuzz are required
python scripts/check-fonts.py
```

Raw image archives are outside Git; committed derivatives work without WordPress or the temporary cache. Builds never reacquire assets.

## SEO and indexing safety

Default builds use the development domain and `noindex, nofollow` on every HTML page. Generated `robots.txt` disallows crawling, and the development sitemap is not advertised in robots. Sitemap XML is still generated for QA. Robots directives are not access control; a crawler blocked by robots may not see page noindex, and an externally linked URL can still appear in search. Protect unfinished previews with HTTP Basic Authentication when appropriate (see deployment guide).

Configuration is explicit, independent of Astro dev/build mode:

| Variable         | Development default                 | Deliberate future launch        |
| ---------------- | ----------------------------------- | ------------------------------- |
| `SITE_URL`       | `https://www.mariyasnaturals.cloud` | `https://mariyasnaturals.in`    |
| `SITE_ENV`       | `development`                       | `production`                    |
| `ALLOW_INDEXING` | `false`                             | `true` only after launch review |

Indexable builds fail unless all production conditions match. The validated URL feeds canonical tags, Open Graph URLs, hreflang, x-default and sitemap. JSON-LD includes only Organization/WebSite names, supplied website URLs, languages and publisher references. No fabricated business details, offers, ratings or efficacy claims are emitted. Approved current images populate social metadata; missing product photos remain absent. Titles and descriptions are locale-specific. English is x-default.

To validate a future production build without deploying:

```sh
SITE_URL=https://mariyasnaturals.in SITE_ENV=production ALLOW_INDEXING=true npm run build
EXPECT_SITE_URL=https://mariyasnaturals.in EXPECT_INDEXABLE=true npm run test:static
# Restore the safe development build afterwards:
npm run build
npm run test:static
```

## GitHub workflow

Task 03 develops on `feature/authentic-media-typography`, based on `feature/premium-storytelling`; its draft PR targets that existing implementation branch. Do not push directly to main, force-push or merge as part of this task. CI validates installation, checking, formatting, unit tests, build and generated output. A separate reviewer should approve content, design and the final domain/indexing change.

## Static hosting and migration

See [deployment documentation](docs/deployment.md). Only the verified contents of `dist/` eventually go to the CloudPanel Static HTML site's document root. No Node server, adapter or database is needed at runtime. The precise document root must be confirmed before any deployment. This task does not connect to the VPS or modify CloudPanel, WordPress, DNS, TLS or live websites.

Future migration to `.in` requires approved content, exact store URLs, domain/canonical validation, redirects, multilingual editorial review, accessibility checks and a deliberate indexing decision. Core Web Vitals targets are LCP <=2.5s, INP <=200ms and CLS <=0.1; these are goals, not measured guarantees. Browser checks are useful smoke tests, not proof of full WCAG conformance.

## Owner-enabled pull deployment

The prepared [pull deployment architecture](docs/pull-deployment.md) uses GitHub-hosted validation/build, an owner-approved signed static release branch, and site-user CloudPanel cron with an outbound read-only GitHub deploy key. It defaults to dry-run and requires a verified backup and exact local approval before the first live apply. No inbound VPS SSH, FTP, source builds on the VPS or self-hosted runner is used. Preparation does not deploy or change VPS configuration. [Local security/rehearsal results](docs/pull-validation.md).
