# Mariyas Naturals Knowledge

A lightweight, four-language educational website foundation, distinct from the official [commercial store](https://www.mariyasnaturals.com). This is the first design prototype, not the complete brand website. No commerce, customer database, fabricated product images, certifications or efficacy claims are included.

## Stack and architecture

Astro 7 (static output), strict TypeScript, Tailwind CSS 4 through the official `@tailwindcss/vite` plugin, and GSAP 3 with ScrollTrigger. npm and Node >=22.23.4 are required; this foundation was validated on Node 24.22.1. Exact versions are recorded in `package-lock.json`. Tailwind 4 uses CSS-first configuration in `src/styles/global.css`; a separate Tailwind config file is unnecessary.

- `src/pages/[lang]/index.astro`: generated `/en/`, `/ml/`, `/hi/`, `/ta/` homepages.
- `src/i18n/`: separate UTF-8 starter dictionaries, locale registry and English fallback.
- `src/components/`: header, footer, language switcher, hero, section headings, botanical previews, story scenes, product card and reusable SEO head.
- `src/layouts/BaseLayout.astro`: common HTML document and global styles.
- `src/config/`: validated build-time URL/indexing policy and exact store-link guard.
- `src/data/products.ts`: typed demonstration catalogue; unknown fields stay absent.
- `tests/` and `scripts/`: configuration, generated-output and browser/accessibility checks.
- `public/`: temporary typographic favicon. The text brand mark is not an approved logo.

The preliminary brand palette, spacing and font stacks are editable in `src/styles/global.css`. System fonts avoid network font requests. Indic-capable local fallbacks are declared; if target devices lack coverage, add licensed, subsetted WOFF2 fonts with `font-display: swap` and test their layout. Generic line-art botanicals are decorative illustrations, not assertions about ingredients.

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
npm run preview       # Inspect the built static output locally
```

Browser tests expect `/usr/bin/chromium` by default. Set `CHROMIUM_PATH` to another installed Chromium executable. Screenshots and runner results are ignored. Playwright owns its foreground preview server (`--ignore-lock` avoids Astro's agent auto-backgrounding). Never use the preview server as a production server.

## Languages and editorial content

The root is a language-choice page with an explicit English fallback link. There are no location, browser-language or automatic geographic redirects. Each page has its own `lang`, translated title/description, content and language links. To add a locale, add its dictionary and locale entry, then update sitemap locale configuration and tests. Future content pages should extend the language switcher and SEO alternates to map equivalent translated paths; the current mapping covers homepages only.

Malayalam, Hindi and Tamil are starter translations requiring native-speaker review before release. All prose requires editorial approval. The reported 60-year heritage is explicitly labelled as awaiting evidence. No ingredient names, manufacturing steps, ratings, certificates, prices or availability have been invented.

## Storytelling and products

`StorytellingSection` composes five `StoryScene` elements: heritage, ingredients, preparation, transformation and finished product. The small GSAP/ScrollTrigger demonstration moves visible scenes horizontally as they enter the viewport. No scroll pinning, opacity hiding, framework hydration or heavy 3D is used. Text remains present without JavaScript; reduced-motion users receive no animation. MatchMedia contexts revert on preference changes, page lifecycle cleanup and future Astro navigation swaps.

The demonstration product has no real SKU, photograph, availability or purchase URL. “Learn more” points to a real expandable information section. “Buy on Official Store” is rendered only after a verified exact product URL is provided; otherwise an explicit pending message appears. The separate general store CTA links only to the verified official store homepage. Product URL validation constrains links to HTTPS `www.mariyasnaturals.com`; editors must still verify the actual destination. Never derive or guess product links. Replace demo data after approval. Use Astro image optimization and responsive `srcset`/`sizes` when real assets arrive; preserve dimensions and lazy-load below the fold.

## SEO and indexing safety

Default builds use the development domain and `noindex, nofollow` on every HTML page. Generated `robots.txt` disallows crawling, and the development sitemap is not advertised in robots. Sitemap XML is still generated for QA. Robots directives are not access control; a crawler blocked by robots may not see page noindex, and an externally linked URL can still appear in search. Protect unfinished previews with HTTP Basic Authentication when appropriate (see deployment guide).

Configuration is explicit, independent of Astro dev/build mode:

| Variable         | Development default                 | Deliberate future launch        |
| ---------------- | ----------------------------------- | ------------------------------- |
| `SITE_URL`       | `https://www.mariyasnaturals.cloud` | `https://mariyasnaturals.in`    |
| `SITE_ENV`       | `development`                       | `production`                    |
| `ALLOW_INDEXING` | `false`                             | `true` only after launch review |

Indexable builds fail unless all production conditions match. The validated URL feeds canonical tags, Open Graph URLs, hreflang, x-default and sitemap. JSON-LD includes only Organization/WebSite names, supplied website URLs, languages and publisher references. No fabricated business details or product schema is emitted. No social share image is asserted before an approved asset exists. Titles and descriptions are locale-specific. English is x-default.

To validate a future production build without deploying:

```sh
SITE_URL=https://mariyasnaturals.in SITE_ENV=production ALLOW_INDEXING=true npm run build
EXPECT_SITE_URL=https://mariyasnaturals.in EXPECT_INDEXABLE=true npm run test:static
# Restore the safe development build afterwards:
npm run build
npm run test:static
```

## GitHub workflow

Develop on `feature/astro-foundation`, commit changes and open a PR targeting `main`. Do not push directly to main, force-push or merge as part of this task. CI validates installation, checking, formatting, unit tests, build and generated output. A separate reviewer should approve content, design and the final domain/indexing change.

## Static hosting and migration

See [deployment documentation](docs/deployment.md). Only the verified contents of `dist/` eventually go to the CloudPanel Static HTML site's document root. No Node server, adapter or database is needed at runtime. The precise document root must be confirmed before any deployment. This task does not connect to the VPS or modify CloudPanel, WordPress, DNS, TLS or live websites.

Future migration to `.in` requires approved content, exact store URLs, domain/canonical validation, redirects, multilingual editorial review, accessibility checks and a deliberate indexing decision. Core Web Vitals targets are LCP <=2.5s, INP <=200ms and CLS <=0.1; these are goals, not measured guarantees. Browser checks are useful smoke tests, not proof of full WCAG conformance.
