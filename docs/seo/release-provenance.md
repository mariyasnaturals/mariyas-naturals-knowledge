# Release provenance — four revisions, one digest, then one change

Everything below was produced by rebuilding each revision from a clean checkout in
this repository, with the same command and the same environment, and hashing the
output. No digest here is copied from a previous report.

## Method

```bash
export NODE_OPTIONS="--import data:text/javascript,process.versions.webcontainer='1'"
for sha in 172d31a e1a2e05 2541428 655b692; do
  git checkout -q "$sha" && rm -rf dist
  SITE_URL=https://mariyasnaturals.in SITE_ENV=production ALLOW_INDEXING=true \
    npm run build
  find dist -type f | sort | xargs -d '\n' sha256sum \
    | sed 's| dist/| |' | sort -k2 | sha256sum
done
```

The digest is SHA-256 over the sorted `sha256  path` list of every file in `dist/`,
so it changes if any byte of any built file changes.

## Results

| Revision  | What it is                                    | Built files | `dist/` digest                                                     |
| --------- | --------------------------------------------- | ----------- | ------------------------------------------------------------------ |
| `172d31a` | SEO/AEO/GEO round: pillar, evidence templates | 909         | `ed9a3b914bad263c921f6dc56cccf4007016b02bf8966365337579ad5adc6919` |
| `e1a2e05` | + test, lint and sitemap-parity fixes         | 909         | `ed9a3b914bad263c921f6dc56cccf4007016b02bf8966365337579ad5adc6919` |
| `2541428` | + regenerated audit document                  | 909         | `ed9a3b914bad263c921f6dc56cccf4007016b02bf8966365337579ad5adc6919` |
| `655b692` | five-language corrections (this round)        | 909         | `8daf117d5c20f6a5e79ed6bc18c61ec002a4831b5a8602e52b25bf7c7d51e338` |

Interpretation, which the digests confirm rather than assume:

- **172d31a, e1a2e05 and 2541428 are the same website.** Those three commits touch
  only `scripts/validate-seo.mjs`, `tests/`, `.prettierignore` and a generated
  Markdown audit — none of which is an input to a page. The earlier release archive
  `mariyas-in-seo-preview-e1a2e05.zip` was therefore a rebuild of `172d31a`, not a
  different site.
- **655b692 is a different website**, because it changes page content: the section
  eyebrow on 325 pages, the brand transliteration in four languages, the assistant
  labels, and `Organization.sameAs`. A new archive was required; producing one from
  the older bytes would have shipped the defects.

## Artifact identity

| Artifact                                | SHA-256                                                            |
| --------------------------------------- | ------------------------------------------------------------------ |
| `mariyas-in-seo-preview-655b692.zip`    | `3c578336fdb30535e9d92249c08f551c9dd8af6dc0eabcaa98bf6e8dd83e251b` |
| `mariyas-in-seo-preview-655b692.tar.gz` | `19b3895e3cb9d60e0aec8f4352d44cca22665e6a17246824beccda2b075f087a` |
| extracted payload (909 site files)      | `8daf117d5c20f6a5e79ed6bc18c61ec002a4831b5a8602e52b25bf7c7d51e338` |

Checked after packaging: `sha256sum -c SHA256SUMS` passes inside both archives,
both archives extract to identical bytes, `RELEASE.json` reports
`origin: https://mariyasnaturals.in`, `env: production`, `indexable: true`,
`commit: 655b692…`, and the extracted payload digest equals a fresh build of
`655b692` — so the archive is provably the build of the commit it claims.

The GitHub Pages preview branch `preview/bb9529b` at `fe66e12` carries the same
`655b692` build as a _staging_ origin (`https://www.mariyasnaturals.cloud`,
`noindex, nofollow`, banner `UNAPPROVED PREVIEW · commit 655b692`), which is a
different build of the same source by design: different origin, different robots.
