# Mariyas .cloud staging review — owner-operated upload only

This bundle is for `https://www.mariyasnaturals.cloud`. It preserves approved UI/media baseline `71cca8d24e73a7c10fd7c0585e1404a362424bb4`, four languages, GSAP, self-hosted typography and the current .in-only catalogue. Purchasing is disabled, final commerce mapping is empty, every HTML page is noindex/nofollow, and robots denies crawling. No server upload or deployment is performed by these build workflows.

## Download and inspect

1. Open the repository's **Actions** tab. For the ready PR bundle, choose the successful **Validate foundation** run for the staging-preparation commit. Open its **Artifacts** section and download `mariyas-cloud-staging-review-<commit>`. Sign in with repository access; this is a private repository.
2. Extract the GitHub artifact download on your computer. It contains an inner `mariyas-cloud-review-<checkout-sha>.zip`, its `.sha256`, `review-manifest.json` and this guide. Artifacts expire after 30 days; keep a local review/rollback copy.
3. Verify the inner ZIP checksum with `sha256sum <filename>.zip` (Linux), `shasum -a 256 <filename>.zip` (macOS), or PowerShell `Get-FileHash <filename>.zip -Algorithm SHA256`. Compare the complete hash with the adjacent `.sha256` and manifest.
4. Extract the INNER ZIP into an empty local folder. Its root must contain `index.html`, `en/`, `ml/`, `hi/`, `ta/`, `_astro/`, `images/`, `fonts/`, `robots.txt` and sitemap files. It contains compiled dist contents directly, not an enclosing dist directory. Do not upload the outer GitHub artifact ZIP, manifest, checksum or this guide to the web root.

The manifest records the actual builder checkout SHA (a PR run may use GitHub's synthetic merge checkout), the approved UI baseline, archive hash and per-file hashes. Check the Actions run's head commit too. A manual run uses the selected branch's checkout. No build requires store image downloads.

## Manual workflow for later rebuilds

**Prepare staging review artifact** has only `workflow_dispatch`, read-only repository permissions and artifact upload steps; no hosting credentials or deployment steps exist. Once GitHub recognizes this workflow on the default branch, choose **Actions → Prepare staging review artifact → Run workflow**, select `feature/authentic-media-typography`, then run. Do not choose a different UI revision: packaging rejects changes to src/public/build configuration or the locked dependencies relative to the approved baseline.

GitHub generally requires the workflow file on the default branch before exposing its manual button. Do not merge just to obtain this preview. The existing PR validation workflow attaches the same artifact bundle without a merge. If the button is absent, use that successful PR run's artifact instead.

Local reproduction with Node 24.22.1, Python 3 and installed Chromium:

```sh
npm ci
export ASTRO_TELEMETRY_DISABLED=1
export SITE_URL=https://www.mariyasnaturals.cloud
export SITE_ENV=development
export ALLOW_INDEXING=false
npm run check
npm run lint
npm test
npm run build
npm run test:static
npm run test:media-policy
npm run test:browser
npm run package:staging
```

Outputs appear in ignored `review-artifacts/`. Use CHROMIUM_PATH if Chromium is elsewhere. No source or image import commands are needed. The manual Actions workflow installs its own test browser; the existing PR run performs static/source validation and packaging, with browser checks recorded separately in the preparation report.

## Verify the destination before any owner-authorized upload

These are instructions for the owner/administrator, not actions already performed.

1. In CloudPanel, open the site for **www.mariyasnaturals.cloud** and confirm its existing type is **Static HTML**. Verify the exact domain binding, site user, document root and HTTPS URL shown by the panel. Record the displayed absolute path. Do not assume a path from a site username or previous notes.
2. Inspect that exact directory in the existing file manager. Compare its current index/assets with what the .cloud URL serves. Confirm it is isolated from `.in`, `.com`, other sites, and any WordPress document root. If it contains WordPress files, a shared/symlinked root, uncertain routing or a different domain, stop and resolve the destination with the administrator. Do not alter those installations or repoint a domain as part of this upload.
3. If the site type, DNS, certificate, domain binding, access permissions or document root needs changing, obtain separate authorization. This package does not configure any of them. Use an already authorized file-manager/upload method; no SSH setup is required or supplied.
4. Record the current root contents, owner/permissions and current working .cloud page before replacement. Back up **the entire existing staging document-root contents**, including hidden files and existing configuration, to a dated archive outside every public web root. Download a second copy and verify that it opens and includes its index/assets. Keep any existing Basic Auth/header configuration intact; do not overwrite it with a source repository or assume noindex provides access control.

## Upload compiled files manually

Only after the owner separately authorizes uploading to the verified staging root:

1. Keep the verified backup and previous known-good release ready. If using the existing file manager's archive extraction, upload/extract the inner ZIP into a temporary staging directory outside the public root first and inspect its contents. Otherwise upload the locally extracted compiled files with the already configured authorized mechanism.
2. Replace only the intended .cloud site's static content with the extracted inner ZIP contents, keeping the same level as the site's existing index.html. Do not put them under `dist/` or a release-name subdirectory: asset URLs are rooted at `/`.
3. Remove retired staging static files only after comparing them with the verified backup and confirming they belong to that staging release. Do not mix old and new assets; keep server-managed hidden/configuration files unless the administrator explicitly approves otherwise. Never run a generic recursive deletion command against an assumed root.
4. Preserve the site's existing ownership/read permissions using the established upload mechanism. Do not upload .env, .git, node_modules, source, package metadata or review notes. No Node process or SPA fallback is required: Astro emits directory index pages.
5. Load `/en/`, `/ml/`, `/hi/`, `/ta/`, `/en/products/mariyas-hair-oil-200-ml/` and `/en/collections/baby-care/` on .cloud. Check directory indexes, CSS/JS/fonts/images and HTTPS. Confirm canonical/hreflang reference .cloud, page source has `noindex, nofollow`, `/robots.txt` says `Disallow: /`, and no Buy Now control is active. Do not change DNS/SSL/server routing to fix an uncertain result; seek separate administrator approval.

No live-domain readiness is implied by the local tests. If an existing CDN/browser cache serves older content, first clear the review browser's site cache and verify response/source assets; server/cache administration remains a separate owner action.

## Exact Android Chrome review steps

1. After the owner completes the upload above, connect the Android phone to normal Wi-Fi or mobile data. Open **Chrome → menu → New Incognito tab**. Enter **https://www.mariyasnaturals.cloud/en/** directly in the address bar. Do not open the ZIP or a downloaded index.html through file://; root asset paths and local-file browser restrictions prevent a representative review.
2. If existing staging authentication appears, use the administrator-provided credentials. If HTTPS is invalid, a download starts instead of a page, or old content appears, stop and check the upload/destination; do not bypass certificate warnings.
3. In portrait mode, verify the new cream hero and current 200 ml photograph. Scroll slowly and quickly with a finger through all five story chapters. Confirm native scrolling, chapter changes, Skip Story and the final current-pack reveal. Mobile deliberately does not use desktop scene pinning.
4. Open/close the hamburger and language picker, tap outside to dismiss, and use the bottom navigation. Swipe the collection cards and product cards horizontally. Open the 200 ml details, swipe its three gallery views and follow the 500 ml edition link. Check current .in packaging and clean placeholders rather than old images.
5. Switch to Malayalam, Hindi and Tamil from the header; verify readable glyphs, no clipped conjuncts or horizontal page overflow. On a product/collection page, switching language should retain the corresponding route. Use Android Back, then rotate landscape and return to portrait to inspect layout stability.
6. In **Android Settings → Accessibility**, enable **Remove animations** (wording varies by manufacturer), return to Chrome and reload. Where Android/Chrome exposes this as prefers-reduced-motion, motion should cease while all story text, links and imagery remain accessible. Disable the setting afterward if desired; do not use Chrome's Desktop site mode for the primary mobile review.
7. Repeat a short scroll/gallery/navigation pass over mobile data as well as Wi-Fi. Record phone model, Android/Chrome versions, orientation, network, language, URL, normal/reduced-motion setting and any issue/screen recording. Physical-phone observations, especially touch smoothness, are the purpose of this review; lab tests do not establish them.

## Roll back if the review upload is unsuccessful

1. Stop reviewing the new release and preserve its artifact/manifest for diagnosis.
2. Reconfirm the exact .cloud document root. Restore the previously verified full staging backup through the same authorized mechanism, including its matching static assets and any backed-up staging files that were replaced. Remove only identified new-release static files absent from that backup; do not leave a mixed release.
3. Preserve/restablish the recorded ownership and permissions without changing other sites or server configuration. Reload the known-good staging URLs in a fresh Incognito session and confirm the previous index/assets and HTTPS work.
4. Keep the failed artifact, backup and review notes outside public roots. No rollback action touches WordPress, production domains, DNS, SSL or other document roots.
