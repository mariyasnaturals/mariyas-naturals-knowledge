# Browser and accessibility verification

Run in GitHub Actions on `ubuntu-latest` with Chromium (Playwright 1.65) against
the built site, because the review sandbox has no browser binary.

| Result            | Value                    |
| ----------------- | ------------------------ |
| Tests             | 44                       |
| Passed            | 44                       |
| Failed            | 0                        |
| Run status        | `exit=0`                 |
| Summary generated | 2026-11-16T15:44:16.760Z |

The suite is `tests/browser/home.spec.ts` + `tests/browser/catalogue.spec.ts`
(`npm run test:browser`). It covers, in Chromium at 320–1440 px:

- axe WCAG 2.2 AA on every route in all five locales, with the care assistant
  panel open;
- the three-tab mobile bar plus the offer tile, with no horizontal scroll and no
  element sitting on another;
- the care assistant trigger's geometry against `.shop-fab`,
  `[data-mobile-nav]` and `.hero-video-control`, its dialog, Escape-to-close,
  focus restoration and a refused medical question;
- the 85-card catalogue, its local WebP derivatives and the official-store
  product page galleries;
- zero requests leaving `127.0.0.1` — no CDN, no `.com` image hotlink.

## Deployment metadata comes from the environment

The suite runs unchanged against the staging candidate, the GitHub Pages preview
and the production release. Anything deployment-specific — indexability and the
canonical origin — is read from the same contract the static validators use, in
`tests/browser/site-env.ts`:

| Build                | `EXPECT_SITE_URL`                           | `EXPECT_INDEXABLE` |
| -------------------- | ------------------------------------------- | ------------------ |
| staging (CI default) | unset → `https://www.mariyasnaturals.cloud` | unset → `false`    |
| GitHub Pages preview | preview origin (`*.github.io`)              | `false`            |
| production `.in`     | `https://mariyasnaturals.in`                | `true`             |

So a production run expects `index, follow` and the `.in` canonical, and a
staging run expects `noindex, nofollow` and the `.cloud` canonical — no
assertion ever pins one deployment's metadata as if it were a production
requirement. Verified on the release artifact:

```
EXPECT_SITE_URL=https://mariyasnaturals.in EXPECT_INDEXABLE=true npm run test:browser
→ 50 passed (1.1m)
```

The acquisition and browser jobs were temporary: no workflow in this repository
holds content-write authority. See
[catalogue-acquisition.md](catalogue-acquisition.md) for how to re-run either
step outside CI.
