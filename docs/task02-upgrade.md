# Premium storytelling upgrade

This change extends the validated Task 01 Astro foundation. It does not rebuild the application or modify infrastructure.

## Components and content

- `HeroSection`: forest-green editorial hero, gold CTAs, botanical depth layers and an authentic-product image slot. The slot is explicitly pending while asset acquisition is blocked.
- `SiteHeader`: compact sticky header, native details-based hamburger, Escape/focus restoration, close-on-selection/outside click, and a visible four-language selector. Native disclosure navigation remains usable without JavaScript.
- `MobileNavigation`: four touch-friendly links (home, botanicals, knowledge, store status), safe-area padding and reserved page space. The store tab leads to migration status, never checkout.
- `StorytellingSection`: a scrubbed GSAP timeline moves decorative layers, abstract oil-themed light, product presentation and a progress line. Visible scenes retain readable HTML. Desktop pinning is limited to the smaller of 80vh or 650px, only on wide, tall, fine-pointer viewports. Mobile uses native scrolling with no pinning or interception of wheel/touch events. Skip Story jumps to the ingredient preview. Motion contexts clean up on navigation and page lifecycle changes; reduced motion removes animation and pinning.
- `ProductVisual` / `ProductCard`: reusable image and discovery presentation, local responsive assets when supplied, explicit missing-image treatment and internal localized detail links.
- `EditorialLayout` with `EditorialPage`: shared typed template for product education, botanical pages, hair-care articles, heritage and quality/certification content. It supports reviewed status and cited sources without inventing facts or structured-data claims. No thin placeholder article library is generated. Populate actual approved content before adding those routes. Source language availability must be mapped before generating alternates for partially translated future articles.
- `/{lang}/products/hair-oil-example/`: one clearly marked demonstration detail page in each language. All home and detail routes have their own canonical and corresponding language alternates, including English x-default.

Translations remain starter material requiring native-speaker review. Reported heritage remains qualified; ingredients and preparation remain pending verification. The primary and secondary store roles follow the new Task 02 brief; neither site's contents were changed.

## Commerce migration gates

`src/config/commerce.mjs` is the single product purchase mapping. It defaults to `enabled: false` and an empty `commerceDestinations` map. No final path is guessed from a temporary WordPress slug. Product names/IDs, assets, translation data and this destination map are separate.

After a separately approved commercial migration:

1. Verify exact final product URLs or stable permanent identifiers against the live commercial catalogue.
2. Map authoritative product IDs to complete verified destination URLs and set their mapping verification flags.
3. Verify the central `baseUrl`, product verification status and per-product `commerceEnabled` flags.
4. Deliberately enable global commerce, then test every rendered purchase link before release.

All four gates must pass; missing mappings remain pending. Destination validation requires exact HTTPS origin agreement and rejects credentials, homepages, guessed relative paths, other ports, query strings and fragments. There is no cart, payment, checkout or customer database. General store links from Task 01 are replaced by migration status so the older store is not presented as the new catalogue.

## SEO, deployment and validation

Task 01 indexing controls, domains, robots policy and sitemap configuration are unchanged. `.cloud` stays noindex/nofollow. Product-detail canonical and alternate URLs now follow equivalent detail routes. No Product schema, medical claim, ingredients, certification or date is fabricated. Organization/WebSite JSON-LD stays limited to supplied fields. Hosting remains static `dist/` output for a separately authorized CloudPanel deployment.

Run the original commands in README. New coverage adds commerce gates, media coverage honesty, all-page links/metadata, product detail language switching, 360/390/768/1440 widths, keyboard disclosure controls, scroll progress and desktop pin cleanup. Run `node scripts/measure-render.mjs` after building to collect local single-run LCP and initial CLS observations and screenshots under ignored `test-results/review/` (override with `REVIEW_OUTPUT_DIR`). These are not field Core Web Vitals, throttled mobile measurements or an INP assessment. Remeasure after authentic photography is integrated.

See [asset coverage and access requirements](product-assets.md) and [Task 02 validation results](task02-validation.md).
