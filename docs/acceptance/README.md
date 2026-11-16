# Acceptance screenshots — MN-STATIC-REDESIGN-SEO-001

Captured from the production build (`astro build` → `astro preview`) with
Chromium 131 at device-pixel-ratio 1, after forcing every lazy image to load.
The hero, offer-tile and floating-button frames are captured at DPR 2–3 so the
detail is legible.

`*-viewport.png` is a true single-screen frame and keeps the sticky header, the
mobile bottom bar and the floating shop button in their real positions.
The full-page `*.png` files pin those fixed elements so they are captured once.

| File                                         | What it shows                                                         |
| -------------------------------------------- | --------------------------------------------------------------------- |
| `landing-desktop`                            | Language chooser, model on the right facing the text, five languages  |
| `landing-mobile`                             | Mobile composition: photograph band above the copy, no overlap        |
| `home-desktop` / `home-mobile`               | Standalone hero, showcase, browse groups, about, store CTA            |
| `home-kannada-*`                             | Kannada route with real translated UI                                 |
| `hero-desktop-playing`                       | The new 16:9 landscape film mid-playback (measured `currentTime`)     |
| `hero-mobile-playing`                        | The approved portrait film mid-playback (unchanged bytes)             |
| `offer-tile-buy-now`                         | Animated offer tile on the `BUY NOW` frame                            |
| `offer-tile-save-20`                         | Same tile on the `SAVE UP TO 20%` frame                               |
| `shop-fab`                                   | Floating `Shop Products` pill, revealed after the hero action scrolls |
| `products-desktop`, `product-detail-desktop` | Catalogue and detail page                                             |
| `mobile-320 … mobile-430`                    | No horizontal scroll, offer tile and shop button clear of each other  |

Not captured: real iOS Safari, Android Chrome, or any physical device. Those
remain untested and are listed as limitations in the pull request.
