# Reference intake — MN-LIVING-GALLERY-RITUAL-FINDER-002

**Status:** complete — **8 of 8 files located, downloaded, and visually inspected.**

Source: Google Drive (app `google_drive`, connector enabled). The brief described an
`Uploads` folder. **No folder named `Uploads` exists on the connected Drive**
(a `name = 'Uploads' and mimeType = folder` query returned 0 results, and a
root-level folder listing also returned 0 folders). The eight files instead sit
**directly at the root of the connected Drive**, all created
`2026-11-16T09:27:37–38Z` (≈14:57 IST, matching the brief's upload time).

No file was missing or inaccessible. Two files (`mobile home page`,
`desktop home page`) arrived with no file extension; both are valid PNGs and were
renamed on copy keeping their bytes intact (see MD5 below).

## Reference table

| #   | Original Drive filename                                                  | Local copy              | Type | Pixels          | Bytes     | MD5                                |
| --- | ------------------------------------------------------------------------ | ----------------------- | ---- | --------------- | --------- | ---------------------------------- |
| 1   | `mobile home page`                                                       | `mobile-home-page.png`  | PNG  | **887 × 1774**  | 2 032 741 | `41399c22c684351fd560d09d2a564702` |
| 2   | `desktop home page`                                                      | `desktop-home-page.png` | PNG  | **1672 × 941**  | 1 977 858 | `3e00177ed29bc144ebb05edd80f51474` |
| 3   | `Screenshot_20261116_144812_com_android_chrome_ChromeTabbedActivity.jpg` | same name               | JPEG | **1504 × 2508** | 404 979   | `dca7120accae9e14dab5afe48e372d5e` |
| 4   | `Screenshot_20261116_144818_com_android_chrome_ChromeTabbedActivity.jpg` | same name               | JPEG | **1504 × 2508** | 428 013   | `77315f0c17fad728e52f6b925e573629` |
| 5   | `Screenshot_20261116_144823_com_android_chrome_ChromeTabbedActivity.jpg` | same name               | JPEG | **1504 × 2508** | 404 492   | `ee836685f46bdd18933a8e24e8b599c6` |
| 6   | `Screenshot_20261116_144830_com_android_chrome_ChromeTabbedActivity.jpg` | same name               | JPEG | **1504 × 2508** | 477 302   | `0d4535500a43d1ed8345c26a030bba68` |
| 7   | `Screenshot_20261116_144838_com_android_chrome_ChromeTabbedActivity.jpg` | same name               | JPEG | **1504 × 2508** | 446 390   | `545dde174b95134bb479ce2be4c1f568` |
| 8   | `Screenshot_20261116_144842_com_android_chrome_ChromeTabbedActivity.jpg` | same name               | JPEG | **1504 × 2508** | 578 819   | `faaa3bb766e5b51479dc9c871e2b6591` |

All eight are sRGB. The six screenshots share one Pixel-class device capture of
1504 × 2508 (a 1080-px-wide CSS viewport at ~1.39 device pixel ratio, Android
Chrome with the tab strip visible).

## What each reference actually shows (visual inspection notes)

**1. `mobile home page` (887 × 1774) — mobile design direction.**
Mariyas header (wordmark + `EN` selector + round hamburger); full-bleed hero with a
model in a pink floral sari in a carved chair, centre play button, caption
"Approved hero video · unchanged"; "Discover Your Mariyas Ritual" section with a
gold hairline and small gold swash; two product cards showing side by side
(200 ml and 500 ml), each with an "Official .com product photo" caption and a
"Shop on Official Store →" button; a gold "COMB INCLUDED" badge on the 500 ml card;
3-dot pagination beneath; "Daily Care Spotlight" horizontal rail of three photo
cards with an arrow button and pagination; "Explore by Care" 2 × 2 grid of dark
emerald cards with gold line icons (Hair, Baby, Skin, Wellness) and botanical
photography bleeding in from the right; emerald "Google Reviews" block with three
skeleton review cards and "Live Google reviews pending connection", plus a
"View on Google ↗" outline button; compact footer strip (address, phone, Maps /
Instagram / Facebook placeholders); fixed bottom bar Home · Collections · Discover ·
Our Story plus a gold-stacked "Shop Products" pill and "BUY NOW / SAVE UP TO 20%"
tile.

**2. `desktop home page` (1672 × 941) — desktop design direction.**
Same system at desktop width: centred logo with a hairline divider, horizontal nav
(Products, Collections, Our Story, Google Reviews), `EN` pill and a filled emerald
"Shop Products" button. Hero is a short landscape band with the play control, not a
full-viewport film. Then: centred "Discover Your Mariyas Ritual" heading with gold
rules either side; **two feature cards, 2-up**, with the copy to the right of the
photo and a gold "COMB INCLUDED" rosette on the 500 ml card; 3-dot pagination;
a two-column band pairing "Daily Care Spotlight" (3 photo cards + arrow) with
"Explore by Care" (2 × 2 emerald tiles); the emerald Google Reviews block with three
skeleton cards; a single-line footer with logo, address, phone, and Maps/Instagram/
Facebook placeholders plus the gold "BUY NOW SAVE UP TO 20%" tile.

**3–8. Six `Screenshot_20261116_1448xx` captures — questionnaire pattern only.**
All six are the same third-party flow (`mcaffeine.com/pages/...`, "Personalized
Routine"), each showing a different step of one mobile quiz:

| Shot      | Step shown                                                                                                                                  | Pattern worth keeping                                             |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `…144812` | "Select your age" — 4 stacked rows, person glyph + range                                                                                    | one question per screen, big single-column targets                |
| `…144818` | "Tell us a little about yourself" — Him / Her / Prefer not to say                                                                           | plain third option for opting out                                 |
| `…144823` | "Select Skin Type" — 6 stacked rows, teal icon discs                                                                                        | "Not sure" as a first-class answer; long list stays single-column |
| `…144830` | "Select your Main Concern" — 2-column icon tile grid, 9 options                                                                             | multi-option concern grid with icon + label tiles                 |
| `…144838` | "Select the Vibes that feels right" — 2-column tiles, 6 options                                                                             | lifestyle/context question as tiles                               |
| `…144842` | Results — 3 product cards, each `STEP n` + category + frequency chips, price, tick box, "Learn More" expander, sticky total + "Add to Cart" | numbered routine with placement chips and per-item rationale      |

Structural cues (teal header bar with back chevron, a segmented progress bar under
the title, "Please select any one" helper, rounded outlined option rows, results as a
numbered routine) are the pattern to follow. **Nothing of mCaffeine's brand is
copied**: no teal palette, no logo, no wording, no artwork, no CSS.

## Consequences for implementation (recorded before any code changes)

1. **The reference homepage is the approved direction** and matches the design
   language already in the repo (emerald/ivory, gold hairlines, Cormorant-style
   editorial headings, rosette badge, dot pagination, emerald care tiles). The work
   is to make that one system consistent across every route — not to reproduce the
   homepage layout everywhere.
2. **The reference shows "Discover Your Mariyas Ritual" already on the homepage.**
   The current repo's homepage still says "04 / THE HAIR OIL EDITIONS —
   Find your Mariyas edition." That section has to change.
3. **The reference shows 3 spotlight cards on desktop** (Coconut Milk Shampoo, Baby
   Massage Oil, Chyavanaprash) and the brief asks for four (adding Baby Hair Oil).
   The desktop layout needs a 4-up-capable rail rather than a hard 3.
4. **The reference's bottom nav reads "Discover"**, and the brief asks for "My
   Ritual" in that slot. Phase 11 governs.
5. The reference screenshots are **design intent only**; no reference file is a
   production asset and none may be shipped as an image on the site.

## Live-store verification done during intake (affects Phases 4 and 5)

Fetched from `https://www.mariyasnaturals.com` on 2026-11-15/16. Recorded because it
changes what the brief asked for:

- **`https://www.mariyasnaturals.com/product/hair-oil-500ml-comb/` → HTTP 200 but a
  WordPress "Page not found" page.** That exact URL in the brief is **not a live
  product permalink** and must not be linked.
- Searching the live store for "comb" returns exactly 5 products: the four
  `mariyas-oil-treated-comb-*` variations (₹135 each, from ₹150) and
  `mariyas-oil-treated-comb-combo-pack` (₹0.00). **There is no 500 ml + comb combo
  product in the live catalogue.**
- The live 500 ml product is
  `https://www.mariyasnaturals.com/product/mariyas-herbal-hair-care-500-ml/`
  (₹1,470 → ₹1,350, 4 gallery images), and the comb is sold separately. So the
  badge must not claim the comb is free or included at no cost.
- Spotlight products all verified live with real photography and exact permalinks:
  `coconut-milk-shampoo-200-ml` (₹295 → ₹265, 4 images),
  `baby-massage-oil-200-ml` (₹660 → ₹490, 3 images),
  `baby-hair-oil-200-ml` (₹510, 2 images),
  `chyavanaprash` (₹1,050 → ₹950, 1 image).
