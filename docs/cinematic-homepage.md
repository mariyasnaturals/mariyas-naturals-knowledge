# Cinematic homepage development

Development branch: `feature/cinematic-homepage`, based on
`feature/authentic-media-typography` at `f958b4b`. No deployment is required.

The Astro homepage now opens with a responsive film slot and eight chapters:
botanicals → golden oil → authentic product → original model → application →
hair shine → long-hair sweep → final hero. Existing catalogue, product detail,
language navigation and commerce restrictions are retained.

## Components

- `StorytellingSection.astro` composes the homepage and localized chapter navigation.
- `cinematic/CinematicScene.astro` provides each scene's copy, original-image slot,
  fallback light study and final product link.
- `cinematic/ResponsiveFilm.astro` and `scripts/responsive-film.ts` select one MP4
  at the 760 px breakpoint. Desktop uses 16:9; mobile uses 9:16. Cuts play in real
  time and loop; scrolling animates the surrounding story, not video seeking.
- `scripts/cinematic-story.ts` scopes GSAP/ScrollTrigger to this homepage. Effects
  include botanical drift, golden light, reveal, portrait movement, application
  light, restrained shine, a lateral sweep and the final composition. Natural
  page scrolling and anchor links work without JavaScript.

Reduced motion disables GSAP and automatic playback. Save-data disables automatic
playback. Explicit play remains available. Videos pause offscreen or when the tab
is hidden; user pause survives scrolling and orientation changes. A missing or
failed cut keeps a readable placeholder. No alternative orientation downloads
when the selected cut is missing.

## Add original assets later

Phase 2 intake is implemented with `npm run cinematic:import`. The original
files have not been attached yet. Known filenames are recorded as expected
filenames, with every actual asset still pending and timing explicitly awaiting
footage review. No dimensions, hashes or ready status are guessed.

```sh
npm run cinematic:import -- --desktop /path/to/714482450_1794338494564178.mp4
npm run cinematic:import -- --mobile /path/to/496978374_1794339270167488.mp4
npm run cinematic:import -- --model /path/to/8573.png --product /path/to/original-product.jpg
```

The importer measures the supplied files, copies their bytes unchanged and
registers their hashes, dimensions, size and provenance. FFprobe must be installed
for video intake. Wrong orientation or duration is reported for review rather
than silently changing the video. All inputs are inspected before copying.
Google Flow video is recorded as `contentOrigin: "google-flow"` with
`identityAccuracy: "not-asserted"`; photographs are recorded separately as
`owner-photograph`. Supplied product/model originals take precedence over scene
stills in the reveal, portrait and final compositions. These exact references
are never replaced with AI video frames.

The Android browser check uses Chromium with the Pixel 7 device profile, touch
input and Android user agent. Its screenshot is labelled `pending-originals`;
it is a layout check rather than a review of footage or a physical device capture.

The source of truth is `src/data/cinematic-assets.json`. Every slot currently has
`status: "pending"` and `src: null`. Expected paths are intake guidance, never
rendered source URLs. No fabricated packaging, people or hair images are present.
The tiny neutral-color MP4s under `tests/fixtures` are test-only and never public.

1. Put the two finished owner videos in `public/cinematic/`, using the expected
   desktop/mobile filenames (or another local filename recorded in `src`).
2. Record each file's SHA-256, original filename, original dimensions, local
   `src`, `source: "owner-original"` and `status: "ready"`. Preserve original
   identity and packaging. Do not activate an asset before receiving the file.
3. Keep pending originals at `src: null`. A cut can be activated independently.
   Ready product/model references populate the reveal, portrait and final
   compositions. Other scene stills can be added separately using the same
   contract and truthful `alt` text in English, Malayalam, Hindi and Tamil.
4. Chapter timing fields are provisional editorial markers covering 0–15 seconds.
   Align their internal boundaries with the supplied film; scene order stays fixed.
5. The optional `hairMask` must be derived from the original shine still with
   matching dimensions and alignment. It confines the low-opacity highlight to
   actual hair. Without it, approved imagery is shown cleanly. Realistic hair
   motion remains in the original video; tune highlight timing against those
   assets before calling the result final.
6. Run the validation commands below. The existing `.in` catalogue media policy
   remains enforced; owner cinematic originals have a separate provenance path.

```sh
ASTRO_TELEMETRY_DISABLED=1 npm run check
npm run lint
npm test
ASTRO_TELEMETRY_DISABLED=1 npm run build
npm run test:static
npm run test:media-policy
ASTRO_TELEMETRY_DISABLED=1 npm run test:browser
```

Asset hashes are checked against local files by `test:media-policy`. Browser tests
cover 360, 759, 760 and 1440 px, actual MP4 decoding, orientation switching, manual
pause, reduced motion, save-data, failure fallback, chapter navigation and the
existing multilingual accessibility flows. Final artistic timing and likeness
review remain dependent on the owner originals.

## Validation on 2026-11-10

- Astro check: 59 files, zero errors, warnings or hints.
- Prettier, unit tests and the production build command passed locally.
- Static navigation and media-policy checks passed for all 377 generated pages.
- Complete Chromium suite: 32 tests passed, including multilingual accessibility,
  keyboard navigation, no-JavaScript browsing and the new cinematic controls.
- Desktop and mobile preview screenshots were visually reviewed.

These are local development checks. No deployment, remote merge or VPS action
was performed. Final footage, packaging, model likeness and hair-lighting review
are still pending the original files.

## Phase 2 intake validation on 2026-11-11

The byte-preserving importer and authoritative-reference composition selection
are implemented. Validation passed: 16 unit tests, 33 Chromium browser tests,
31 local pull-deployment simulation tests, six readiness tests, Astro checks
(62 files, no diagnostics), formatting, build, static navigation and media policy.
No real deployment or VPS was used by those simulations.

Desktop and Pixel 7 Android-emulation screenshots show the pending-media layout.
The desktop composition remains clear and balanced; the portrait slot fits the
mobile layout and touch playback/pause passed using neutral test fixtures.
These captures do not show the owner's footage or photographs and do not verify
product or model likeness. All original slots remain pending, and the eight
chapter boundaries remain provisional until the four original files arrive.
