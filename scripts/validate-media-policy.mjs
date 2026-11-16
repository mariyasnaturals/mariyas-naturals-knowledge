import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { load } from 'cheerio';
import assert from 'node:assert/strict';
import { assertApprovedMedia } from '../src/config/media-policy.mjs';

/**
 * Source policy for the discovery build.
 *
 * Every published image must fall into exactly one registered class:
 *   1. a catalogue product derivative from the current approved .in manifest,
 *   2. a brand-editorial derivative from the same current-source policy,
 *   3. a brand asset derived here from an owner-supplied original, recorded with
 *      its own hash in `src/data/brand-assets.json`.
 *
 * Hotlinking, retired bytes, legacy-store paths and unregistered social images
 * fail the build. Commerce links are permitted and are checked separately.
 */
const json = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const sha256 = (value) => createHash('sha256').update(value).digest('hex');

const manifests = [
  json('../src/data/media-manifest.json'),
  json('../src/data/brand-media.json'),
];
manifests.forEach(assertApprovedMedia);

const brand = json('../src/data/brand-assets.json');
const expectedOrigin =
  process.env.EXPECT_SITE_URL || 'https://www.mariyasnaturals.cloud';

/* ---------------------------------------------------- brand asset registry -- */

const brandAssets = new Set();
const record = (path) => {
  brandAssets.add(path);
  return path;
};
for (const variant of brand.landing.landscape) record(variant.webp);
for (const variant of brand.landing.mobile) record(variant.webp);
record(brand.landing.landscapeJpeg);
record(brand.logo.full);
for (const icon of brand.logo.icons) record(icon.path);
record(brand.hero.desktop.poster);
record(brand.hero.mobile.poster);
record(brand.social.ogDefault.path);
record(brand.social.ogLogo.path);

const onDisk = (path) => {
  try {
    return statSync(new URL(`../public${path}`, import.meta.url)).size;
  } catch {
    return -1;
  }
};
for (const path of brandAssets)
  assert.ok(onDisk(path) > 0, `Registered brand asset is missing: ${path}`);

/** These are generated from the owner originals; require exact rendered sizes. */
const assertPngSize = (path, width, height) => {
  const bytes = readFileSync(new URL(`../public${path}`, import.meta.url));
  assert.equal(bytes.readUInt32BE(16), width, `${path} width`);
  assert.equal(bytes.readUInt32BE(20), height, `${path} height`);
};
assertPngSize('/brand/apple-touch-icon.png', 180, 180);
assertPngSize('/brand/icon-192.png', 192, 192);
assertPngSize('/brand/icon-512.png', 512, 512);
assertPngSize('/brand/icon-512-maskable.png', 512, 512);
assert.equal(
  readFileSync(new URL('../public/favicon.ico', import.meta.url))
    .subarray(0, 4)
    .toString('hex'),
  '00000100',
  'favicon.ico is a real ICO container',
);

/** The social card must exist at the size the metadata claims. */
const ogBytes = readFileSync(
  new URL(`../public${brand.social.ogDefault.path}`, import.meta.url),
);
const ogJpeg = (() => {
  // Walk the JPEG segment list to read the frame header.
  let offset = 2;
  while (offset < ogBytes.length) {
    if (ogBytes[offset] !== 0xff) break;
    const marker = ogBytes[offset + 1];
    const length = ogBytes.readUInt16BE(offset + 2);
    if (
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8
    ) {
      return {
        height: ogBytes.readUInt16BE(offset + 5),
        width: ogBytes.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + length;
  }
  return undefined;
})();
assert.deepEqual(ogJpeg, { width: 1200, height: 630 });
assert.equal(brand.social.ogDefault.width, 1200);
assert.equal(brand.social.ogDefault.height, 630);

/* --------------------------------------------------------------- allowlist -- */

const media = manifests.flatMap((manifest) => manifest.media);
const byId = new Map(media.map((item) => [item.id, item]));
const approved = new Set([
  ...media.flatMap((item) => item.derivatives.map((d) => d.localAssetPath)),
  ...brandAssets,
]);
const retired = new Set(
  json('../tests/fixtures/retired-media-hashes.json').hashes,
);

/* ------------------------------------------------------------------- walker -- */

const used = new Set();
let htmlCount = 0;
let imageCount = 0;

function checkImage(value) {
  const url = new URL(value, expectedOrigin);
  assert.ok(approved.has(url.pathname), `Unapproved image reference: ${value}`);
  assert.equal(url.origin, expectedOrigin, 'Image hotlinks are not permitted');
}

function schemaImages(value, key = '') {
  if (!value || typeof value !== 'object') {
    if (
      typeof value === 'string' &&
      ['image', 'logo', 'thumbnailUrl', 'contentUrl'].includes(key)
    )
      checkImage(value);
    return;
  }
  if (Array.isArray(value)) for (const item of value) schemaImages(item, key);
  else
    for (const [name, item] of Object.entries(value)) schemaImages(item, name);
}

function walk(directory, prefix = '') {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = new URL(
      entry.name + (entry.isDirectory() ? '/' : ''),
      directory,
    );
    const relative = prefix + entry.name;
    if (entry.isDirectory()) {
      walk(path, relative + '/');
      continue;
    }
    if (
      relative.startsWith('images/') ||
      relative.startsWith('hero/') ||
      relative.startsWith('brand/')
    ) {
      assert.ok(
        approved.has('/' + relative),
        `Retired/untracked image remains in dist: ${relative}`,
      );
      assert.ok(
        !retired.has(sha256(readFileSync(path))),
        'Retired legacy bytes in output',
      );
    }
    if (/\.(css|js)$/.test(entry.name)) {
      const text = readFileSync(path, 'utf8');
      assert.ok(
        !/media-com-|https?:\/\/[^\s"')]*(?:mariyasnaturals\.com|\.wp\.com)[^\s"')]*\.(?:webp|png|jpe?g|svg)/i.test(
          text,
        ),
        'Legacy or hotlinked image reference in CSS/JS',
      );
      for (const match of text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g))
        if (
          !/\.(?:woff2?|ttf)(?:\?|$)/.test(match[1]) &&
          !match[1].startsWith('data:')
        )
          checkImage(match[1]);
    }
    if (!entry.name.endsWith('.html')) continue;
    htmlCount++;
    const text = readFileSync(path, 'utf8');
    assert.ok(
      !text.includes('media-com-'),
      'Legacy local image path in active HTML',
    );
    const $ = load(text);
    for (const node of $('img').toArray()) {
      imageCount++;
      checkImage($(node).attr('src'));
      const id = $(node).attr('data-media-id');
      if (id) {
        const item = byId.get(id);
        assert.ok(item, `Missing current-source provenance for ${id}`);
        used.add(id);
        const candidates = [
          $(node).attr('src'),
          ...($(node).attr('srcset') || '')
            .split(',')
            .filter(Boolean)
            .map((x) => x.trim().split(/\s+/)[0]),
        ];
        for (const value of candidates) {
          checkImage(value);
          assert.ok(item.derivatives.some((d) => d.localAssetPath === value));
        }
      }
      const srcset = $(node).parent('picture').find('source[srcset]');
      for (const source of srcset.toArray())
        for (const candidate of ($(source).attr('srcset') || '').split(','))
          if (candidate.trim()) checkImage(candidate.trim().split(/\s+/)[0]);
    }
    for (const node of $(
      'meta[property="og:image"],meta[name="twitter:image"]',
    ).toArray())
      checkImage($(node).attr('content'));
    for (const node of $('[poster]').toArray())
      checkImage($(node).attr('poster'));
    for (const node of $(
      'link[rel="icon"],link[rel="apple-touch-icon"]',
    ).toArray())
      if ($(node).attr('href') !== '/favicon.ico')
        checkImage($(node).attr('href'));
    for (const script of $('script[type="application/ld+json"]').toArray())
      schemaImages(JSON.parse($(script).text()));
  }
}
walk(new URL('../dist/', import.meta.url));

assert.equal(
  used.size,
  media.length,
  'All reported approved images must actually be used',
);
console.log(
  `PASS source policy: ${htmlCount} HTML pages, ${imageCount} image elements, ${used.size} approved .in images, ${brandAssets.size} derived brand assets; no legacy files, retired hashes, hotlinks, CSS/JS, social or schema images.`,
);
