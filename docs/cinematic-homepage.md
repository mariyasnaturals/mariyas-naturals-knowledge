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

The source of truth is `src/data/cinematic-assets.json`. Every slot currently has
`status: "pending"` and `src: null`. Expected paths are intake guidance, never
rendered source URLs. No fabricated packaging, people or hair images are present.
The tiny neutral-color MP4s under `tests/fixtures` are test-only and never public.

1. Put the two finished owner videos in `public/cinematic/`, using the expected
   desktop/mobile filenames (or another local filename recorded in `src`).
2. Record each file's SHA-256, original filename, original dimensions, local
   `src`, `source: "owner-original"` and `status: "ready"`. Preserve original
   identity and packaging. Do not activate an asset before receiving the file.
3. Keep pending originals at `src: null`. A cut can be activated independently;
   product/model references are intake records, not automatically substituted
   into the scenes. Scene stills can be added separately using the same contract
   and truthful `alt` text in English, Malayalam, Hindi and Tamil.
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
