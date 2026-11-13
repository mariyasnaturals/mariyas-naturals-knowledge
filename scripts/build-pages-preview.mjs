// Owner-review preview staging for GitHub Pages.
//
// The release build addresses everything from the site root ("/_astro/…",
// "/en/…"). A GitHub Pages *project* site is served from /<repo>/, so every
// root-absolute path would 404 and the page would render unstyled and unlinked.
// This writes a GitHub Pages copy of an already-built dist/ without touching
// dist/ or any release configuration:
//
//   1. `base: '/'` (Astro) has no effect on an existing build by default, so the
//      rewrite is done here, against the real output, and verified afterwards.
//   2. A `<base href="/<repo>/">` is injected too. It is a backstop for any path
//      this rewrite misses: a missed src/href would otherwise silently 404.
//   3. An unapproved-preview ribbon is added, and the built noindex/robots
//      policy is re-asserted rather than assumed.
//
// Usage: node scripts/build-pages-preview.mjs --repo <name> [--src dist]
import { readdir, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join, relative, extname, dirname } from 'node:path';

const args = process.argv.slice(2);
const argOf = (name, fallback) => {
  const i = args.indexOf(name);
  return i === -1 ? fallback : args[i + 1];
};
const repo = argOf('--repo');
const src = argOf('--src', 'dist');
const out = argOf('--out', 'pages-preview');
if (!repo) throw new Error('--repo <name> is required');

const base = `/${repo}/`;
// Only these are rewritten. External URLs, protocol-relative URLs, fragments,
// mailto: and already-based paths are left alone.
const TEXT = new Set([
  '.html',
  '.css',
  '.js',
  '.mjs',
  '.json',
  '.xml',
  '.txt',
  '.webmanifest',
]);

await rm(out, { recursive: true, force: true });

async function walk(dir) {
  const entries = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) entries.push(...(await walk(p)));
    else entries.push(p);
  }
  return entries;
}

// Only real site paths are rewritten, and only at a token boundary (a quote,
// `(`, `=`, comma or whitespace before the slash).
//
// A blanket `/" -> "/base/` rewrite is unsafe: it also rewrites JavaScript
// regex literals such as `(/\//`, which turns into an invalid regex with bogus
// flags and breaks the bundle at runtime. Restricting to the site's own
// top-level directories keeps regexes, `https://` and `//cdn` untouched.
const TOP = [
  '_astro',
  '_botanical-assets',
  'cinematic',
  'fonts',
  'images',
  'favicon\\.svg',
  'robots\\.txt',
  'en',
  'ml',
  'hi',
  'ta',
].join('|');
const ROOT_ABS = new RegExp(
  `(["'(=,\\s])\\/(?!\\/)(${TOP})(?=[/"')\\s,?]|$)`,
  'g',
);
// A link to the site root is the only path with no second segment.
const ROOT_SELF = /(["'(=,\s])\/(?=["')\s])/g;
const rewrite = (text) =>
  text.replace(ROOT_ABS, `$1${base}$2`).replace(ROOT_SELF, `$1${base}`);

const files = await walk(src);
const stats = { copied: 0, rewritten: 0, html: 0 };
const skipped = new Set();

for (const file of files) {
  const ext = extname(file).toLowerCase();
  const dest = join(out, relative(src, file));
  await mkdir(dirname(dest), { recursive: true });
  if (!TEXT.has(ext)) {
    await writeFile(dest, await readFile(file));
    stats.copied++;
    continue;
  }
  let text = await readFile(file, 'utf8');
  // Never rewrite the sitemap: it advertises the canonical release origin, and a
  // preview copy must not claim pages it does not own.
  if (/^sitemap.*\.xml$/.test(relative(src, file))) {
    skipped.add(relative(src, file));
    await writeFile(dest, text);
    stats.copied++;
    continue;
  }
  text = rewrite(text);

  if (ext === '.html') {
    stats.html++;
    // Backstop plus preview labelling. `noindex` does not make a public site
    // private; it only asks well-behaved crawlers to stay away.
    if (!text.includes('<base '))
      text = text.replace(/<head([^>]*)>/i, `<head$1><base href="${base}">`);
    const ribbon = `<div role="note" style="position:fixed;left:0;right:0;bottom:0;z-index:2147483647;padding:.45rem .75rem;background:#3a2410;color:#f0e2c8;font:600 .72rem/1.35 system-ui,sans-serif;letter-spacing:.02em;text-align:center;pointer-events:none">UNAPPROVED PREVIEW · commit ${argOf('--commit', 'local')} · not for release</div>`;
    text = text.replace(/<\/body>/i, `${ribbon}</body>`);
    // Re-assert the build's own policy instead of trusting it survived.
    if (!/name="robots"[^>]*noindex/i.test(text))
      text = text.replace(
        /<head([^>]*)>/i,
        `<head$1><meta name="robots" content="noindex, nofollow">`,
      );
  }
  await writeFile(dest, text);
  stats.rewritten++;
}

// A preview must never be indexed: Pages serves this file for the whole site.
await writeFile(join(out, 'robots.txt'), 'User-agent: *\nDisallow: /\n');

// GitHub Pages runs Jekyll by default, which drops every directory starting with
// an underscore. That would delete `_astro/` (all CSS/JS) and
// `_botanical-assets/` (all 43 reviewed layers, including the bottle), leaving a
// blank, unstyled page. `.nojekyll` disables Jekyll and serves the files as-is.
await writeFile(join(out, '.nojekyll'), '');

// A visitor who lands on the branch itself should not be able to mistake this
// for source. This file is never served by Pages (Pages serves the directory).
await writeFile(
  join(out, 'PREVIEW_NOTICE.txt'),
  [
    'UNAPPROVED INTERACTIVE PREVIEW - NOT FOR RELEASE',
    '',
    'Source commit: ' + argOf('--commit', 'local'),
    'Built by scripts/build-pages-preview.mjs from the verified static output.',
    '',
    'This branch contains only built preview output. It is not source, it is',
    'not reviewable as code, and it must not be merged anywhere.',
    '',
    'Purchasing is disabled. The site is noindex/nofollow (robots.txt and a meta',
    'tag), and .nojekyll is present because Jekyll would otherwise delete',
    '_astro/ and _botanical-assets/, leaving a blank page.',
  ].join('\n') + '\n',
);

const suspicious = [];
for (const file of await walk(out)) {
  if (extname(file).toLowerCase() !== '.html') continue;
  const text = await readFile(file, 'utf8');
  const m = [...text.matchAll(/(?:href|src)="\/(?!\/)([^"]*)"/g)].filter(
    ([, path]) => !path.startsWith(base.slice(1)),
  );
  if (m.length)
    suspicious.push({
      file: relative(out, file),
      found: m.slice(0, 3).map((match) => match[0]),
    });
}

console.log(
  JSON.stringify(
    {
      repo,
      base,
      files: files.length,
      rewritten: stats.rewritten,
      htmlPages: stats.html,
      skippedSitemap: [...skipped],
      unrewrittenRootPaths: suspicious,
      ribbon: true,
      robots: 'Disallow: /',
      nojekyll: true,
    },
    null,
    1,
  ),
);
// Fail closed: a root-absolute path left behind is a broken preview.
if (suspicious.length) process.exitCode = 1;
