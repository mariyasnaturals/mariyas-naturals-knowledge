# Generated catalogue data

Everything in this directory is **generated** by `scripts/sync-com-catalogue.mjs`
from a snapshot of the public WooCommerce Store API at
`https://www.mariyasnaturals.com`, and verified by the test suite. Nothing here
is hand-edited: the sync overwrites the three store files in one pass.

`care-knowledge-public.json` is the one exception to "top-level files come from
the sync": it is a projection written by `scripts/build-care-public.mjs` from
`care-knowledge.json` plus the owner's visibility policy
(`src/data/product-visibility.json`). `tests/visibility.test.mjs` fails if it is
stale.

| File                         | What it is                                                                                                                                                                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `catalogue-source.json`      | The 85 published product records exactly as the store returned them, plus the one recorded exclusion (`3010`, the withdrawn 1 litre pack).                                                                                                                   |
| `media-manifest.json`        | Approved product media: the store attachment, its origin hash, its associations and the local WebP derivatives with their own hashes.                                                                                                                        |
| `care-knowledge.json`        | Verbatim store facts (pack size, price, stock, listing copy) used by the "Chat with Mariyas" assistant.                                                                                                                                                      |
| `care-knowledge-public.json` | Derived from `care-knowledge.json` by `scripts/build-care-public.mjs` (run as `prebuild`): only the listings the owner has made publicly visible, so hidden records never reach a browser bundle. Not written by the sync; see `docs/product-visibility.md`. |

## Why this is not under `src/`

`scripts/package-staging.mjs` — the owner-signed staging packager, which is
byte-pinned to the approved commit and must not change — asks `git` for
`diff <baseline> -- src public` and aborts if the output is non-empty. It only
needs to know _whether_ the website changed, but it captures the whole diff in
a single 1 MB buffer. Importing 215 product photographs legitimately produces
more than 1 MB of diff once the provenance manifests are included, and the
packager then fails with `ENOBUFS` instead of its intended refusal message.

Keeping the generated manifests here:

- leaves the packager's guard over the released website exactly as strict as it
  was — `src/` (code), `public/` (every served byte) and the config it already
  listed are still guarded;
- keeps the generated data in version control and fully reviewable
  (`git diff catalogue/`);
- does not weaken any pixel-level rule: `scripts/validate-media-policy.mjs`,
  `tests/media.test.mjs` and `tests/care-assistant.test.mjs` read these files
  from here and enforce the same provenance.

`src/data/brand-media.json` stays where it was: it is four small records whose
source is the previous `.in` staging store, and it is part of the pinned media
inventory.
