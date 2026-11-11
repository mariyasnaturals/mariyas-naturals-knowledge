# Immersive cinematic homepage

Development branch: `feature/cinematic-homepage`. Original media integration was
completed at `e774740`; the immersive design correction builds on that commit.
See the [visual comparison and current captures](cinematic-design-correction.md).
The supplied media is integrated locally. Nothing has been merged, pushed,
deployed or published, and the VPS is untouched.

The eight chapters are botanicals, golden oil, product reveal, model presentation,
application, hair shine, hair sweep and final hero. English, Malayalam, Hindi and
Tamil retain their localized navigation, copy, controls and alt text.

## Original media and provenance

The existing byte-preserving importer was executed on all four uploads. Their
registered hashes match both the received files and the served copies. No
transcoding, retouching, packaging reconstruction or model replacement was done.

| Supplied filename                  | Role                             | Dimensions  |     Bytes | SHA-256                                                            |
| ---------------------------------- | -------------------------------- | ----------- | --------: | ------------------------------------------------------------------ |
| `714482450_1794338494564178-1.mp4` | Desktop, 16:9                    | 1280 × 720  | 7,849,962 | `b86aa80d1ecc5c1dd262ed56c84e3f2f1f708cc562ada05fe26f328baaae0641` |
| `496978374_1794339270167488-1.mp4` | Mobile, 9:16                     | 720 × 1280  | 7,594,716 | `faf4c549cedeee848205047ff0062e28b2a7e578a81543b0ff27d1a135589c92` |
| `9468.jpg`                         | Authoritative model photograph   | 1280 × 720  |    64,291 | `0bc3eea1d3aa07d313ca852fe79667ba90d616c4e54b7a49b4afc5711d384a46` |
| `9456.jpg`                         | Authoritative product photograph | 1280 × 1108 |   219,940 | `be1689ee9c89b3fb4bccd07572f9c4a7c56fc8b3e2f6679bee700083dc579b65` |

Both H.264 videos contain exactly 15 seconds of picture. The container duration is
15.04 seconds because of the AAC audio tail. Original audio streams remain in the
files; the cinematic player uses muted playback.

`src/data/cinematic-assets.json` is the source of truth. All original, scene,
poster and mask records are ready. Google Flow video records use
`identityAccuracy: "not-asserted"`; original photographs are authoritative for
identity and packaging in the still compositions. Derived film stills are
traced in the manifest to their source video's exact SHA-256 and
capture time. The separate feathered alpha mask traces only the lower hair sweep
in `9468.jpg`; it does not change the photograph's bytes.

## Reviewed chapter timing

Both cuts were inspected using contact sheets and frames around their transitions.
The boundaries follow the visible edits and preserve the source crossfades. The
cuts differ, so the player uses a separate timeline for each orientation.

| Chapter               | Desktop seconds | Mobile seconds |
| --------------------- | --------------- | -------------- |
| Botanical ingredients | 0–2.916667      | 0–3            |
| Golden oil            | 2.916667–4.125  | 3–4            |
| Product reveal        | 4.125–6.125     | 4–6.125        |
| Model presentation    | 6.125–7.5       | 6.125–7.5      |
| Application           | 7.5–9           | 7.5–9          |
| Hair shine            | 9–12            | 9–12.125       |
| Hair sweep            | 12–14.5         | 12.125–13.5    |
| Final hero            | 14.5–15         | 13.5–15        |

Playback captions follow `timeupdate` and seeking. “Watch this moment” links seek
to the appropriate chapter in the selected cut and use normal anchor scrolling.
Switching orientation maps the position within the same story chapter to the
other edit. Normal page scrolling remains independent of video playback; no
scroll pinning or continuous video seeking is used.

## Presentation and loading

- The 760 px breakpoint selects one original MP4. The other orientation is not
  requested. The film fills the first viewport. Atmospheric shots may use safe
  cover; protected model, hand, hair and product chapters retain the entire frame.
- Lightweight, orientation-specific botanical posters show real footage before
  playback. `preload="none"` defers video data until visibility or explicit intent.
- Reduced motion and save-data disable automatic playback. Explicit playback and
  pause remain available. Videos pause offscreen and when the tab is hidden.
- GSAP adds restrained botanical drift, golden-light movement, product reveal,
  portrait movement and a masked, low-opacity hair highlight. Reduced motion
  removes these effects and restores their resting styles.
- The finale presents the two original photographs in independent panels, with
  a large portrait and a dedicated product reveal. Mobile follows the portrait
  with the product reveal on natural scroll. No thumbnail is pasted on the model.
- Original catalogue routes, local fonts, commerce restrictions and `.in` media
  policy remain in place. Cinematic originals and derivatives are separately
  audited by their provenance and file hashes.

## Visual review

Current owner-review captures at 1440, 390 and 360 px, with before/after
comparisons, are in [the design correction report](cinematic-design-correction.md).
The captures linked below record the earlier integration baseline.

Review captures show actual integrated media, not placeholders. Android captures
use Chromium's Pixel 7 profile with an Android user agent, mobile viewport, DPR
and touch input. They are browser emulation, not physical Android hardware.

- [Desktop film](screenshots/cinematic-media/integrated-desktop-film.png)
- [Android film](screenshots/cinematic-media/integrated-android-film.png)
- [Desktop final composition](screenshots/cinematic-media/integrated-desktop-final.png)
- [Android final composition](screenshots/cinematic-media/integrated-android-final.png)
- [Original product on Android](screenshots/cinematic-media/integrated-android-product.png)
- [Original portrait on Android](screenshots/cinematic-media/integrated-android-model.png)
- [Masked hair highlight](screenshots/cinematic-media/integrated-desktop-hair-shine.png)

Remaining source limitations:

1. The Google Flow films are creative interpretations. Their model likeness,
   generated hands and label details should not be treated as exact reproductions
   of the original photographs. Their content is preserved unchanged.
2. A small left-arrow mark is baked into `9456.jpg`. It remains visible because
   the supplied product photograph is used without retouching or cropping.
3. The desktop film's final front-facing pose lasts about half a second; mobile's
   lasts about 1.5 seconds. The original still finale provides the longer viewing
   moment without extending or modifying either video.
4. The unchanged mobile MP4 is about 7.6 MB. Selecting only one cut, deferring its
   download and respecting data-saving preferences limits unnecessary transfers;
   no smaller re-encoded derivative replaces the original.

## Validation

Verified on 2026-11-11: all checks passed.

| Check                             | Result                                         |
| --------------------------------- | ---------------------------------------------- |
| Astro check                       | 68 files; zero errors, warnings or hints       |
| Formatting                        | Passed                                         |
| Node unit tests                   | 22 passed; no skips                            |
| Full Chromium browser suite       | 40 passed                                      |
| Local pull-deployment simulations | 31 passed; no VPS access                       |
| Readiness simulations             | Six passed                                     |
| Build and static checks           | 377 pages passed                               |
| Media policy                      | All original and derivative file hashes passed |

```sh
ASTRO_TELEMETRY_DISABLED=1 npm run check
npm run lint
npm test
ASTRO_TELEMETRY_DISABLED=1 npm run build
npm run test:static
npm run test:media-policy
ASTRO_TELEMETRY_DISABLED=1 npm run test:browser
python3 -m unittest discover -s tests/pull -v
python3 -m unittest discover -s tests/readiness -v
```

The original-file regression tests pin all four received SHA-256 hashes, check
actual dimensions and stream durations, and verify derivative provenance. Browser
checks exercise the real MP4s, every chapter boundary, orientation mapping,
original still compositions, Android touch controls, loading preferences,
masked shine, natural scrolling and the existing multilingual accessibility flows.

## Replacing an original later

Use `npm run cinematic:import -- --desktop FILE --mobile FILE --model FILE
--product FILE`, supplying one or more slots. Review derived stills, masks and
chapter timing whenever a source changes: provenance validation deliberately
rejects stale derivatives. FFprobe is required for video inspection. Run the
validation commands before presenting the result for deployment review.
