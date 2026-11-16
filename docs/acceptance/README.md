# Acceptance screenshots — MN-STATIC-REDESIGN-SEO-001

Captured locally from the production build (`astro build` → `astro preview`) with
Chromium 131 at device-pixel-ratio 1, after forcing every lazy image to load.

`*-viewport.png` is a true single-screen frame and keeps the sticky header, the
mobile bottom bar and the floating shop button in their real positions.
The full-page `*.png` files pin those fixed elements so they are captured once.

| File                                           | What it shows                                                        |
| ---------------------------------------------- | -------------------------------------------------------------------- |
| `landing-desktop`                              | Language chooser, model on the right facing the text, five languages |
| `landing-mobile`                               | Mobile composition: photograph band above the copy, no overlap       |
| `home-desktop` / `home-mobile`                 | Standalone hero, showcase, browse groups, about, store CTA           |
| `home-kannada-*`                               | Kannada route with real translated UI                                |
| `hero-desktop-playing` / `hero-mobile-playing` | Hero films actually playing (see report for measured `currentTime`)  |
| `products-desktop`, `product-detail-desktop`   | Catalogue and detail page                                            |
| `mobile-320 … mobile-430`                      | No horizontal scroll, offer tile and shop button clear of each other |

Not captured: real iOS Safari, Android Chrome, or any physical device. Those
remain untested and are listed as limitations in the pull request.
