# Immersive design correction — owner review

Continues locally from `e774740` on `feature/cinematic-homepage`.
No push, merge, publication, deployment or VPS change was made.

## Compare the three reference captures

The comparison uses the three captures saved with the preceding implementation.
The original reference images remain in the repository for direct review.

| Reference                                                                  | Previous design                                                   | Revised design                                                                                                                       |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| [Desktop opening](screenshots/cinematic-media/integrated-desktop-film.png) | Cream text column and a small rectangular film panel              | Edge-to-edge, viewport-height film; serif headline over the botanical world; protected text gradient; transparent compact navigation |
| [Desktop finale](screenshots/cinematic-media/integrated-desktop-final.png) | A product rectangle laid over the model photograph                | Two independent photographic panels: a substantial portrait and a dedicated product reveal; no image overlap                         |
| [Mobile finale](screenshots/cinematic-media/integrated-android-final.png)  | Long text block, blank cream space and a pasted product thumbnail | Image-first portrait followed naturally by a full-width product reveal, with compact copy and a floating touch-navigation dock       |

The actual model, held bottle and hair remain visible in the revised portrait
framing. There is no approved transparent product cut-out among the supplied
originals, so the product photograph has its own reveal. No model, bottle or
label was generated or redrawn.

## New browser screenshots

These are actual Chromium page captures at the exact requested CSS viewport
sizes, exported at CSS-pixel scale. Mobile uses an Android Pixel 7 browser profile
with touch input. This is device emulation, not physical Android hardware.

| Viewport   | First-screen film hero                                           | Final product composition                                                  | Final portrait scene                                                                      |
| ---------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1440 × 900 | [Hero](screenshots/immersive-correction/immersive-1440-hero.png) | [Finale](screenshots/immersive-correction/immersive-1440-final.png)        | [Portrait and reveal](screenshots/immersive-correction/immersive-1440-final-portrait.png) |
| 390 × 844  | [Hero](screenshots/immersive-correction/immersive-390-hero.png)  | [Product reveal](screenshots/immersive-correction/immersive-390-final.png) | [Portrait](screenshots/immersive-correction/immersive-390-final-portrait.png)             |
| 360 × 800  | [Hero](screenshots/immersive-correction/immersive-360-hero.png)  | [Product reveal](screenshots/immersive-correction/immersive-360-final.png) | [Portrait](screenshots/immersive-correction/immersive-360-final-portrait.png)             |

The opening captures pause the original film at 1.25 seconds so the viewport
comparison uses the same botanical moment. Reduced motion stabilizes the capture;
normal motion and automatic playback are separately covered by browser tests.
Mobile's final portrait and product reveal are consecutive scenes on natural
scroll, shown in separate viewport captures to keep the floating dock in its real
screen position. The product image is no longer a miniature overlay.

## Art direction and behavior

- The hero occupies the first viewport on desktop and mobile. Header navigation
  overlays the film and the mobile dock stays compact, with 44 px touch targets.
- Warm cream lettering and muted gold accents sit on deep green. Long paragraphs
  have become short chapter lines. Large photographic surfaces carry the story.
- Cover is permitted only for atmospheric botanical/oil shots with a bounded
  crop. All face, product, application, hair and final film chapters use contain.
  The original source frame is retained on extreme aspect ratios as well.
- During protected film shots the large headline recedes, letting the model,
  hands and packaging remain unobscured. The heading stays in the accessible
  document; its hidden action is removed from keyboard tab order. The headline
  returns with the botanical opening on the next loop.
- The final portrait uses a reviewed crop of empty background. Tests check that
  the face, held pack and long hair stay inside the visible source region. The
  separate product photograph always uses containment.
- The horizontal chapter rail, replay links and quiet playback control remain.
  Both original cut timelines and the story-moment mapping on resize are intact.
- GSAP entrance, botanical drift, oil transition, product reveal, hair light and
  lateral movement follow normal scrolling. There is no scroll pinning,
  intercepted wheel/touch input or forced video scrubbing.
- Reduced motion restores resting styles. Save-data and reduced motion disable
  automatic video playback; posters and original photographs remain useful.
- The source selector requests only the selected MP4. Two additional small oil
  and application stills come directly from the existing portrait cut, with
  frame time, source SHA-256 and derivative SHA-256 recorded in the manifest.
- English, Malayalam, Hindi and Tamil have compact native-script copy and
  script-appropriate heading size and line height.
- Customer-facing production labels and the homepage's development-preview
  footer message are removed. Source provenance remains in the manifest and
  audit tooling, rather than overlaying the creative presentation.

## Preserved source limitations

The four original files retain their pinned SHA-256 values. The supplied film's
AI likeness and label differences are unchanged and are not claimed to perfectly
reproduce the reference photographs. The small left-arrow mark baked into the
product photograph remains. The original mobile video is still about 7.6 MB;
only the selected cut loads, and playback preferences are respected.

## Validation

All checks passed on 2026-11-11:

| Check                       | Result                                    |
| --------------------------- | ----------------------------------------- |
| Complete Chromium suite     | 40 passed                                 |
| Node unit tests             | 22 passed; no skips                       |
| Local Python simulations    | 31 pull-deployment + six readiness passed |
| Astro check                 | 68 files; zero errors, warnings or hints  |
| Formatting                  | Passed                                    |
| Static build and navigation | 377 pages passed                          |
| Media authenticity policy   | All original and derivative hashes passed |

Coverage includes:

- Full existing browser suite plus the three requested design viewports.
- Automatic WCAG checks, source framing, no horizontal overflow and zero overlap
  between the portrait and product panels.
- All original-file hashes, decoded dimensions, derivative provenance, actual
  chapter timing and preservation of the corresponding moment on rotation.
- Reduced motion, save-data, pause/offscreen behavior, touch navigation and
  four-language catalogue and product journeys.
- Astro checks, formatting, static build/navigation/media checks and all Python
  pull-deployment/readiness simulations. Those simulations use local temporary
  directories and never access the real VPS.
