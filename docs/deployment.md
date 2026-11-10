# Static deployment architecture (instructions only)

> Deployment direction superseded: use [owner-enabled VPS pull deployment](pull-deployment.md). Earlier manual-upload instructions are historical review guidance; do not enable an SSH-push/FTP/manual-folder deployment path.
> Build machine → reviewed `dist/` artifact → CloudPanel Static HTML document root → HTTPS browser.

Hostinger VPS: Ubuntu 24.04 LTS, CloudPanel, site user `mariyascloud`. No server changes were made by this task. Do not connect to or modify the VPS without a separate deployment instruction. No WordPress installation or existing domain is part of this code task.

## Before a separately authorized deployment

1. Confirm the actual static site's document root in CloudPanel. Do not assume a path, and ensure it belongs to the intended development site rather than a WordPress or commercial site.
2. Run `npm ci`, checking, lint, tests, build and static-output validation with explicit domain/indexing environment settings. Review the generated HTML and `robots.txt`. Keep `.cloud` noindex.
3. Back up the intended destination under an approved release process. Transfer only the built `dist/` contents, including `_astro`, localized directories, sitemap and robots files. Do not upload source `.env`, Git metadata or `node_modules`.
4. Confirm `/en/`, `/ml/`, `/hi/`, `/ta/` resolve as directory indexes; do not use SPA rewrites for this SSG project. Verify correct MIME types for CSS/JS/SVG and UTF-8 HTML.
5. Verify links, canonical/hreflang, robots, certificate behavior and mobile rendering on the actual destination. A local preview does not prove deployment works. Keep a rollback artifact.

The `.cloud` build emits noindex metadata and restrictive robots, but a static project cannot set HTTP authentication or response headers. Optional HTTP Basic Authentication should be configured by an authorized administrator at the web server/control-panel layer, over HTTPS, with credentials stored outside the document root. Apply it to all preview content, assets and sitemap as appropriate. Do not commit password files. An `X-Robots-Tag: noindex, nofollow` header can add another deployment-level control. Header/auth setup may require server configuration outside this project and is not performed here.

Recommended server review: CSP (accounting for generated JSON-LD and bundled same-origin scripts/styles), `X-Content-Type-Options: nosniff`, `Referrer-Policy`, compression and cache policy. Cache fingerprinted `_astro` files immutably; keep HTML/robots short-lived so indexing changes propagate. Verify policy against the actual artifact rather than copying an untested CSP.

## Future `.in` launch

The future informational domain is `https://mariyasnaturals.in`; the separate store remains `https://www.mariyasnaturals.com`. Coordinate with the existing commercial migration before touching `.in`. Obtain separate authorization for infrastructure, redirects, DNS, TLS and deployment. Verify approved heritage evidence, ingredient documentation, translations, product images and exact product URLs first.

Set all three build variables described in README, inspect final production canonical/alternate URLs and sitemap, and confirm deployment-level robots/auth controls deliberately allow the release. Keep `.cloud` protected/non-indexable; decide its redirect or retirement plan separately. Submit the production sitemap only after the final site is public and verified.
