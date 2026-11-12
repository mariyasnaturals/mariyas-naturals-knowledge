# Kerala heritage brass — PR #4 review handoff

This is a targeted artistic vessel/material upgrade from `94cb61ed1344122629c7023a77fe4201abaef5b6` on `feature/botanical-journey-review`. It remains an unsigned visual review. No trusted source/media policy, installed tool, signing identity, branch protection or VPS state is changed.

## Visible changes

| Stage | Before                                          | Current review                                                                                    |
| ----- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1–2   | Botanical origin and thirty independent studies | Unchanged                                                                                         |
| 3     | Ingredient convergence into the stone mortar    | Unchanged                                                                                         |
| 4     | Stone preparation                               | Same mortar/pestle/fragments choreography with a small matching brass kinnam                      |
| 5     | Glass filter and glass receiver                 | Cotton-lined brass filter, fine green extraction thread and opaque brass kinnam                   |
| 6     | Copper oil bowl                                 | Handcrafted golden-brass uruli with near-black forest-green oil                                   |
| 7     | Copper jug and glass receiver                   | Rounded brass pouring vessel and brass kinnam, retaining the thicker black-green stream           |
| 8     | Original Mariyas product                        | Unchanged original RGB, label, aspect ratio and mobile 42%-height bottle → feature → CTA sequence |

The original eight-scene hero is unchanged. The entire existing story still precedes this additional section. Language copy, ingredient trajectories, six groups, native scrolling, stage timing, GSAP scrub and final product animation are preserved. Necessary outlet/stream coordinates now derive from native vessel aspect ratios and the visible receiver opening, only on initialization/resize. There is no per-frame layout polling or new animation engine.

Brass is opaque. Collection is shown only as a restrained liquid surface inside an elliptical aperture bounded by the bowl rim. The former see-through height animation is mapped to surface collection/reflection at the same timeline positions and durations. The body remains solid; liquid never appears through its sides. Stage five is lighter herbal green; stages six/seven retain nearly black green/olive oil. Warm brass is not a change to oil color.

The brass utensils are Kerala-inspired artistic props, not a claim about actual Mariyas manufacturing equipment. Owner photographs `10541.jpg` and `10540.jpg` establish material/silhouette direction only; their depicted plants are not asserted to be formulation ingredients.

## Assets and provenance

[Asset manifest](../review/botanical/asset-manifest.json) registers four new master/PNG/WebP chains, with hashes, dimensions, image-generation IDs, owner authorization and pending visual-approval status. [Brass audit](../review/botanical/brass-review.json) records both owner-reference hashes/dimensions, all 113 historical asset hashes, protected source/tool/workflow hashes and byte-preserved ingredient/product choreography blocks. All prior media remain intact; superseded glass/copper props are retained as historical source assets and are absent from rendered processing scenes.

| Prop                      | Runtime file               | Native production dimensions |
| ------------------------- | -------------------------- | ---------------------------- |
| Uruli                     | `assets/brass-uruli.webp`  | 1400 × 811                   |
| Kinnam / preparation bowl | `assets/brass-kinnam.webp` | 1393 × 877                   |
| Pouring vessel            | `assets/brass-pourer.webp` | 1107 × 1163                  |
| Cotton-lined brass filter | `assets/brass-filter.webp` | 1164 × 1024                  |

There are 125 asset records: the existing 113 plus twelve new brass master/PNG/WebP records. Images are not represented as native 4K. Runtime requests use optimized WebP; master/PNG sources remain editable. Outside-object pixels have actual zero alpha; central brass-body samples are opaque. Tests separately verify the oil's median color in a known interior region. Photo packaging pixels are verified by the existing independent RGB comparison.

To reproduce only these four prop exports, without re-exporting botanicals or product photography:

```sh
python3 scripts/export-brass-review.py
npx prettier --write review/botanical/asset-manifest.json
npm run test:botanical-assets
```

Exact exported PNG/WebP hashes were reproduced from their committed masters. The legacy full botanical exporter is not needed for this upgrade.

## Validation and evidence

The complete local run covers Astro, formatting, scoped TypeScript-aware ESLint, all Node tests, all five existing Python security suites, ordinary/review builds, static/media/hash validation, unsigned packaging negatives, 43 existing browser tests and 18 botanical browser tests. The existing lint command now also runs the explicitly requested ESLint gate; no GitHub workflow is edited or skipped. Actual results and exact source SHA are recorded in capture provenance and the PR's CI runs.

Botanical browser checks cover all eight stages at 1440×900, 360×800, 390×844, 414×896 and 768×1024, readable captions, vessel bounds, native touch, reversal, pause, product pixels/order, four languages, reduced motion, save-data, no JavaScript, automated accessibility, image-decoding layout stability and two orientation changes. Mobile is Chromium Pixel touch emulation, not a physical Android-device test.

The PR links desktop/mobile eight-stage storyboards, stages 4–7, all required viewports, final reveal, full native-scroll desktop/mobile videos, separate mobile forward/reverse clips and before/after comparisons. These are real browser captures; the generated vessel artwork is not passed off as a browser screenshot. [Changed-files inventory](../review/botanical/brass-changed-files.json) lists the complete auditable diff when evidence is committed.

## Separate release promotion — not performed

[Unsigned promotion proposal](../review/botanical/brass-promotion-proposal.json) lists the exact referenced botanical runtime WebP paths, hashes, dimensions and provenance and hashes the proposed source inputs. It is neither a signed manifest nor accepted deployment configuration. It is not permission to deploy.

After explicit owner visual approval:

1. Independently review the exact accepted source SHA and the proposal's runtime inventory, authentic photographic derivative, owner-confirmed feature claim and exact official-store URL. Register only reviewed paths/hashes and the necessary source-policy rules in the established approved media/source profile. Keep unused historical glass/copper props, native masters and interchange PNGs outside the eventual served release inventory. Preserve all approved original hero/media pins.
2. Review activation of the botanical component in the normal release build; currently only the separate review build renders it. Rerun the complete validation on that explicitly reviewed successor. Never copy the review ZIP to the VPS.
3. Follow [existing trust-version migration](automatic-staging.md#pause-rollback-and-trust-upgrades). The changed scripts/tests/dependencies and added media are frozen gate inputs, so the installed gate must continue rejecting them until an independently reviewed upgrade. Prepare a side-by-side policy/configuration with exact reviewed fingerprints, preserve the existing staging and owner identities, shared lock, signed-history separation, sequence/replay state, backups and rollback. Never regenerate trust automatically from HEAD or reset history. No trusted runtime implementation change is proposed here.
4. Only after those approvals, use protected-branch integration and the existing authenticated-artifact/outbound-poller pipeline for the actual deployment source. Verify authentication, the real deployment receipt/SHA, HTTPS, all four language routes, hero/new media, noindex, disabled commerce and rollback on `.cloud`. `.in` WordPress and the `.com` store are untouched.

Until all of these pass, deployment readiness is **BLOCKED**. No merge, live deployment, cron change, signed publication or public deployment-success claim is included in this review.
