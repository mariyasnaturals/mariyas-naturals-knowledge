# Re-running the official catalogue sync

The site never downloads anything at build time. Acquisition is a separate,
audited two-step job that a person runs deliberately.

## Why the steps are split

| Step       | Script                           | Network                                      | Writes                                                                                      |
| ---------- | -------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 1. Acquire | `scripts/fetch-com-snapshot.mjs` | Yes — public Store API + the upload binaries | Nothing in the repository; everything lands in `SNAPSHOT_DIR` (default `/tmp/com-snapshot`) |
| 2. Approve | `scripts/sync-com-catalogue.mjs` | No                                           | `catalogue/*.json`, `docs/official-store-sync.md`, `public/images/products/**`              |

Step 1 was run in a throw-away GitHub Actions job (`ubuntu-latest`, `contents:
read`) because the review sandbox has no egress to `mariyasnaturals.com`. That
job is **not** part of this repository's workflows: no workflow in this repo may
hold content-write authority, and `tests/pull/test_owner_approval.py` enforces
it.

## Running it

On any machine that can reach the store:

```sh
npm ci
node scripts/fetch-com-snapshot.mjs          # → /tmp/com-snapshot
npm run media:sync -- --snapshot /tmp/com-snapshot
```

Or point step 1 somewhere else with `SNAPSHOT_DIR=/path`.

Then review, exactly, what changed:

```sh
git status --short
git diff --stat
git diff catalogue/            # every provenance change is readable text
git diff -- public/images/products | head
npm test && npm run build && npm run test:static && npm run test:media-policy
```

## What the scripts guarantee

- **Origin only.** Every product record and every byte must come from
  `https://www.mariyasnaturals.com` under `/wp-content/uploads/`. A redirect off
  that origin aborts the run.
- **No invention.** Names, prices, stock flags, descriptions and pack sizes are
  copied from the Store API. Entities are decoded; HTML is stripped, not
  rewritten.
- **No substitution.** An attachment is only ever associated with the listings
  the store itself associates it with. A listing without a photograph is
  recorded as missing.
- **Derivatives only.** Originals are never served. WebP is generated at 320 /
  640 px for gallery frames and 320 / 640 / 960 px for main pack shots, never
  enlarged, aspect ratio preserved, each with its own SHA-256.
- **One record per decision.** `exclusions[]` in `catalogue/catalogue-source.json`
  names every listing that was deliberately withheld, with its reason (currently
  just `3010`, the withdrawn 1 litre pack).

## After a sync

1. Re-read `docs/official-store-sync.md` — it is regenerated with the counts,
   the exclusion reasons and the list of listings that still have no photograph.
2. If a pack was withdrawn, add a redirect/410 rule for its old route (see
   [withdrawn-1-litre-pack.md](withdrawn-1-litre-pack.md) for the pattern).
3. The owner-signed release tools in `ops/` pin the image inventory they were
   approved against. They are intentionally untouched by the sync; the owner
   must re-pin them before the next owner-signed release.
