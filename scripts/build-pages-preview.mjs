/**
 * Build an interactive GitHub Pages preview of the current build.
 *
 * GitHub Pages serves this repository from the `preview/<sha7>` branch at the
 * project subpath https://mariyasnaturals.github.io/mariyas-naturals-knowledge/.
 * Because the site is built for a domain root, every root-relative reference
 * has to be moved under that subpath or the preview loads unstyled. This script
 * does exactly that, adds a visible "unapproved" banner, and refuses to emit an
 * artifact that still contains an unbased root-relative reference.
 *
 * The preview is not a release: canonicals stay on the intended origin, the
 * whole site stays noindex/nofollow, and nothing here is merged or deployed.
 *
 * Usage: node scripts/build-pages-preview.mjs
 */
import { execFileSync } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import assert from 'node:assert/strict';

const BASE = '/mariyas-naturals-knowledge/';
const REPOSITORY = 'mariyasnaturals/mariyas-naturals-knowledge';
const root = resolve(import.meta.dirname, '..');
const dist = join(root, 'dist');
const stage = join(root, 'pages-preview');

const sha = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: root,
  encoding: 'utf8',
}).trim();
const short = sha.slice(0, 7);

/* --------------------------------------------------------------- collect -- */

const TEXT = /\.(?:html|css|js|mjs|json|xml|txt|webmanifest|svg)$/i;
const walk = (folder) => {
  const files = [];
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    const path = join(folder, entry.name);
    if (entry.isDirectory()) files.push(...walk(path));
    else files.push(path);
  }
  return files;
};

rmSync(stage, { recursive: true, force: true });
mkdirSync(stage, { recursive: true });
cpSync(dist, stage, { recursive: true });

/* --------------------------------------------------------------- rewrite -- */

/**
 * Only root-relative references are moved. Absolute URLs (the intended
 * canonicals, hreflang alternates, Open Graph URLs and every mariyasnaturals.com
 * purchase link) are deliberately left untouched, as is protocol-relative `//`.
 */
const rewrite = (text) =>
  text
    // href="/x" src="/x" content="/x" data-desktop="/x" poster="/x" …
    .replace(/(\s(?:href|src|content|poster|data-[a-z-]+)=")\/(?!\/)/g, `$1${BASE}`)
    // srcset="/a 1x, /b 2x" (and every subsequent comma-separated candidate)
    .replace(
      /(\ssrcset=")([^"]*)"/g,
      (_, open, value) =>
        `${open}${value
          .split(',')
          .map((part) => {
            const trimmed = part.trim();
            return trimmed.startsWith('/') && !trimmed.startsWith('//')
              ? BASE.slice(0, -1) + trimmed
              : trimmed;
          })
          .join(', ')}"`,
    )
    // CSS url(/fonts/…) and JS string literals such as "/cinematic/…".
    // The base itself is excluded so a second pass can never stack prefixes.
    .replace(/url\(\/(?!\/|mariyas-naturals-knowledge\/)/g, `url(${BASE}`)
    .replace(/(["'`])\/(?!\/|mariyas-naturals-knowledge\/)/g, `$1${BASE}`);

const rewritten = [];
for (const file of walk(stage)) {
  if (!TEXT.test(file)) continue;
  const before = readFileSync(file, 'utf8');
  const after = rewrite(before);
  if (after !== before) {
    writeFileSync(file, after);
    rewritten.push(file.slice(stage.length + 1));
  }
}

/* ------------------------------------------------------------- guardrails -- */

// A reference is wrong only when it is root-relative *and* not already based.
const UNSAFE =
  /(?:\s(?:href|src|poster|content)="|url\(|(?<=["'`]))\/(?!\/|mariyas-naturals-knowledge\/)/;
const offenders = [];
for (const file of walk(stage)) {
  if (!/\.(?:html|css|js|mjs|webmanifest)$/i.test(file)) continue;
  const text = readFileSync(file, 'utf8');
  const relative = file.slice(stage.length + 1);
  for (const match of text.matchAll(new RegExp(UNSAFE, 'g'))) {
    const at = match.index ?? 0;
    const snippet = text.slice(Math.max(0, at - 40), at + 60).replace(/\s+/g, ' ');
    offenders.push(`${relative}: …${snippet}…`);
    if (offenders.length > 8) break;
  }
  if (offenders.length > 8) break;
}
assert.deepEqual(offenders, [], 'Unbased root-relative references remain');

// Nothing may become indexable, and no preview URL may enter the sitemap.
for (const page of ['index.html', 'en/index.html', 'kn/index.html']) {
  const html = readFileSync(join(stage, page), 'utf8');
  assert.match(html, /<meta name="robots" content="noindex, nofollow"/, page);
  assert.doesNotMatch(html, /github\.io/, `${page} must not self-canonicalise`);
  assert.match(
    html,
    /<link rel="canonical" href="https:\/\/www\.mariyasnaturals\.cloud\//,
    `${page} keeps the intended canonical`,
  );
}
assert.equal(
  readFileSync(join(stage, 'robots.txt'), 'utf8'),
  'User-agent: *\nDisallow: /\n',
  'Preview robots must deny every crawler',
);
assert.doesNotMatch(
  readFileSync(join(stage, 'sitemap-0.xml'), 'utf8'),
  /github\.io/,
  'Sitemap must not list the preview host',
);

/* --------------------------------------------------------- notice + flags -- */

// Jekyll would otherwise drop _astro/ and the site would render unstyled.
writeFileSync(join(stage, '.nojekyll'), '');

const notice = [
  'UNAPPROVED INTERACTIVE PREVIEW — NOT FOR RELEASE',
  '',
  `Source commit: ${sha}`,
  '',
  'Built by scripts/build-pages-preview.mjs from the verified static output.',
  '',
  'This branch contains only built preview output. It is not source, it is not',
  'reviewable as code, and it must not be merged anywhere.',
  '',
  'Purchasing happens on https://www.mariyasnaturals.com only; this preview has',
  'no cart, checkout or payment flow. The site is noindex/nofollow (robots.txt',
  'plus a meta tag) and canonicals stay on the intended .cloud origin.',
  '',
].join('\n');
writeFileSync(join(stage, 'PREVIEW_NOTICE.txt'), notice);

const banner =
  `<div role="note" style="position:fixed;left:0;right:0;bottom:0;z-index:2147483647;` +
  `padding:.45rem .75rem;background:#3a2410;color:#f0e2c8;` +
  `font:600 .72rem/1.35 system-ui,sans-serif;letter-spacing:.02em;` +
  `text-align:center;pointer-events:none">` +
  `UNAPPROVED PREVIEW · commit ${short} · not for release</div>`;

let banners = 0;
for (const file of walk(stage)) {
  if (!file.endsWith('.html')) continue;
  const html = readFileSync(file, 'utf8');
  if (html.includes('UNAPPROVED PREVIEW')) continue;
  assert.ok(html.includes('</body>'), `No body close in ${file}`);
  writeFileSync(file, html.replace('</body>', `${banner}</body>`));
  banners += 1;
}

/* ----------------------------------------------------------------- report -- */

const files = walk(stage);
const bytes = files.reduce((total, file) => total + statSync(file).size, 0);
console.log(
  `PASS pages preview: ${files.length} files, ${(bytes / 1048576).toFixed(1)} MB, ` +
    `${rewritten.length} rewritten, ${banners} banners, source ${sha}.`,
);
