# Botanical journey — implementation and asset handoff

The additional Astro/GSAP journey follows the existing `#story` section (approved film and eight photographic chapters), before the existing care notes and catalogue. The hero component, footage, captions, model, typography, navigation, source-media manifest, protected media policy and deployment/signing/backup tools are unchanged.

Work is isolated on `feature/botanical-journey-review`, based on `c6cf669ff63856ed6fcb5cdaf2f9174534b1594a`. The journey is part of the ordinary `npm run build`; no separate review build exists any more.

## Run the journey locally

```sh
npm ci
npm run test:botanical-assets
npm run build
npm run preview
# Open http://127.0.0.1:4321/en/#botanical-journey
```

English, Malayalam, Hindi and Tamil are present. The normal build renders the actual section after the untouched existing story; it is not a planning document or a slideshow. Native scrolling drives one persistent environment, thirty separate botanical images, convergence, mortar/pestle motion, botanical fragments, receiving-glass fill, near-black green oil, copper-surface reflections, a separate pouring vessel, continuous oil stream, droplets and the authentic bottle. Scroll reversal reverses the same timeline; stopping leaves it at the current position. CSS sticky positioning is used without a ScrollTrigger pin, wheel handler or scroll hijacking.

The stage keeps captions in a readable overlay rather than allowing them to move behind the header. Responsive matchMedia contexts recreate normalized object paths on resize. Changing to reduced motion restores all eight semantic stages to normal document flow. Save-data and no-JavaScript presentations use static compositions with accessible headings and the final product/CTA. Inactive animated caption links are inert. Mobile displays no more than ten studies simultaneously; desktop no more than fifteen. All thirty are introduced progressively in six groups of five.

Assets are lazy until the new journey approaches the viewport, then the optimized active-stage layers are prefetched. Native `<picture>` selection loads the separately composed portrait or landscape background, not both. Masters and PNG interchange files are not requested by the animation; runtime layers use WebP. Existing hero source selection remains intact.

## Claim and identity decisions

The owner confirmed on 2026-11-12 that the product contains **60 Natural Ingredients**, with supporting government records/certificates available from the client. That exact English statement is prominently rendered as real HTML in the final composition in all four locales. This is owner confirmation, not an independent examination of a certificate; no extra certification, regrowth, hair-fall, exclusivity or health claim was added.

The thirty generated botanical studies are **unnamed artistic representations**, not a verified identification guide, exhaustive formulation or claim that the product contains only thirty ingredients. Identity/scientific-name metadata deliberately remain null. Preparation and extraction are explicitly described as an artistic interpretation; no particular Mariyas factory equipment/method is asserted.

The genuine 200 ml product photograph remains authoritative and byte-identical. A traced alpha matte extracts its existing bottle for the new reveal. All RGB channels in the crop are copied from the decoded original; no generative model, repaint, color adjustment, label reconstruction or product rotation is used. Independent validation compares more than 140,000 opaque cutout pixels directly with the original. The original full photograph, transparent PNG and lossless WebP are supplied. The SVG matte is editable for any subsequent edge refinement.

The official product landing page was actually fetched on 2026-11-12 with HTTP 200. Its canonical URL is `https://www.mariyasnaturals.com/product/hair-care-oil-1l/`; the page offers 200ML, 500ML and 1LTR. That record stays unchanged in `review/botanical/asset-manifest.json` as provenance. The rendered CTA links to this site's own reviewed product route, `/{lang}/products/mariyas-hair-oil-200-ml/`, so the release never leaves the verified origin; no cart, checkout or payment is implemented and global commerce stays disabled.

## Asset collection

`review/botanical/asset-manifest.json` records file hashes, dimensions, alpha, generation/source provenance, owner claim confirmation, RGB-preserving product derivation and pending visual-review state. `placement-map.json` records normalized independent coordinates, depth, group and timing metadata. `reference-provenance.json` records the five uploads' byte hashes/dimensions and the three video durations. Reels/screenshots are design references only; none replace the hero or become production media.

- Twelve named desktop/mobile WebP background plates, using one common continuous environment per viewport. These intentionally share the same plate bytes within each orientation; foreground layers create the stage differences.
- Thirty independent transparent PNG botanical studies and thirty optimized WebP variants, plus six native transparent atlases.
- Independent mortar, pestle, fragments, receiving glass, copper bowl, pouring jug, straight dark-oil stream, dark droplet and reflections, in PNG/WebP.
- Native landscape/portrait generated masters. Desktop production plates are 1600×900; portrait plates are 900×1600. Native background masters are 1672×941 and 941×1672: they are not represented as native 4K assets. No artificial upscaling is passed off as extra detail.
- Original product JPEG, transparent alpha-derived product PNG and lossless WebP, with editable SVG matte.
- Browser storyboard, all-eight-stage screenshots at 1440/390/360, and desktop/mobile forward/reverse demonstration recordings in `botanical-review-results/`.

Generation uses the image-generation tool only for environments and unnamed artistic materials/props. Product/model pixels are never generated. Object sheets are split at transparent gutters; production resizing/format conversion preserves transparency. All source masters remain separately editable.

To reproduce exports from supplied masters, use an isolated Python environment with Pillow/NumPy, then:

```sh
python3 scripts/export-botanical-review.py
node scripts/create-botanical-product-cutout.mjs
npm run test:botanical-assets
npm run build
```

The exporter rebuilds the generic assets; the second command restores the independently verified photographic alpha derivative and its provenance. Avoid running the exporter alone and assuming the product derivative is registered.

## Validation and recordings

```sh
npm run check
npm run lint
npm test
# Existing Python security suites and ordinary browser regression commands are unchanged.
npm run build
npm run test:static
npm run test:media-policy
npm run test:browser
npx playwright test --config playwright.botanical.config.ts
# With the local review server running:
node scripts/record-botanical-review.mjs
```

The recording script uses real browser scroll input (touch gestures under Pixel 7 emulation), forward/reverse progress, a pause check, actual original hero-frame capture and real rendered screenshots. Pixel emulation is not a physical Android-device measurement. In this environment the optional Playwright FFmpeg download host was blocked, so real `/usr/bin/ffmpeg` with libvpx was exposed in a workspace-only Playwright cache; no recording or media assertions were mocked. Other machines can use the official `npx playwright install ffmpeg`.

## Publication boundary

The default build renders the journey. Exactly 43 served media files are registered in `src/data/botanical-media.json` with owner visual approval, hashes, dimensions and alpha; `npm run test:media-policy` fails if the rendered set and the registered set ever differ. Normal builds keep noindex, disabled purchasing and the existing strict media validation.

Activation still goes through the established pipeline only: the trusted automatic-staging gate pins this release as a reviewed trust upgrade (`ops/ci_staging/trust.py` plus `bundle.sha256`), and the owner signs the artifact independently. Nothing here bypasses the CI gate, the signing path or the deployment policy.

## Targeted PR #4 refinement

The mobile final composition now keeps the original bottle above the localized text, followed by the exact feature claim and official-store CTA. Its existing 42%-viewport-height, contained aspect ratio, photographic pixels and scale reveal are preserved. Only mobile final-caption timing changes: the bottle completes its reveal before the claim, then the CTA. Reversing scroll hides them in the reverse order. Static/reduced-motion/no-JavaScript mobile layouts follow the same bottle-first reading order. Desktop final art direction is unchanged.

Stage five now shows prepared botanical material draining through a separately layered, photorealistic mesh/glass filter into the existing receiving glass, with a fine herbal-green stream. Stage seven retains the existing copper pouring vessel and original thicker dark-oil stream, with an explicit near-black green receiving-liquid reset. The filter is a new unbranded artistic-process prop, registered as a generated master plus PNG/WebP derivatives; all previous 110 asset records, including thirty independent botanical studies and the photographic product, retain their hashes. It is not a claim about actual Mariyas manufacturing equipment. No protected release policy is changed.

Fourteen botanical browser tests cover the two visual distinctions, timed mobile bottle/claim/CTA sequence, reverse restoration, all four localized final compositions, native touch scrolling, 360/390/1440 viewports, resizing and accessible static fallbacks. Refreshed PR recordings and screenshots supersede the initial a2c7c8a visual captures.
