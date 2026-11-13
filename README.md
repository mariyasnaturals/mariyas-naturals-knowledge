# Botanical Journey — natural-scroll evidence

**Evidence-only branch. Contains no application code.**

| | |
| --- | --- |
| Reviewed commit | [`159f53c`](https://github.com/mariyasnaturals/mariyas-naturals-knowledge/commit/159f53ca7882e187a7fb113ec6657fcebdb6bd95) |
| Pull request | [#6](https://github.com/mariyasnaturals/mariyas-naturals-knowledge/pull/6) — draft, CI `static-site` passed |
| Captured from | the committed code, unmodified |
| Tooling | Playwright + Chromium 138, 1440×900 and 390×844 |

This branch exists only to host review files. It does not modify, and is not
merged into, `feature/cinematic-homepage`, PR #6, or any protected release
branch.

## Watch these first

| Recording | What it proves |
| --- | --- |
| [full-page-desktop.mp4](evidence/full-page-desktop.mp4) | The **entire** homepage scrolls, hero → journey → product information → footer |
| [full-page-mobile.mp4](evidence/full-page-mobile.mp4) | The same on a 390×844 phone |
| [process-mobile-fwd-pause-reverse.mp4](evidence/process-mobile-fwd-pause-reverse.mp4) | The production sequence forward, a paused hold on the finished bottle, then reversed |

If the viewport were pinned, the page content would sit still while only inner
objects changed. In these recordings the page visibly travels.

## The architecture, verified mechanically

| Check | Desktop | Mobile |
| --- | --- | --- |
| `.botanical-scene` computed position | `relative` × 8 | `relative` × 8 |
| Sticky or fixed elements inside the journey | **0** | **0** |
| `.pin-spacer` elements | **0** | **0** |
| Preparation scene top over 7 × 700px scroll steps | 3978 → −922 | 3742 → −1158 |

That last row is the decisive one: the scene moves the full scroll distance at
1:1. A held viewport would keep it constant.

## Scenes, in document order

1 origin · 2 studies · 3 convergence · 4 preparation · 5 extraction · 6 oil ·
7 transfer · 8 reveal

- [Mobile 1–9](evidence/) — 390×844, one frame per stage
- [Desktop 1–9](evidence/) — 1440×900, one frame per stage
- [finale-mobile.png](evidence/finale-mobile.png) ·
  [finale-desktop.png](evidence/finale-desktop.png) — the settled last frame

The finale shows the full-opacity "Discover Mariyas Hair Oil" call to action,
the exact original Mariyas bottle, and "60 Natural Ingredients".

## Caveat

The three owner reference videos were not available in the capture environment.
This is evidence against the owner's stated requirements, not a frame-by-frame
comparison with those references.

Nothing here has been deployed. PR #6 remains an unmerged draft pending owner
approval of the natural-scroll behaviour.
