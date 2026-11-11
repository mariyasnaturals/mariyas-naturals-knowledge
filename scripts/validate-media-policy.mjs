import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { load } from 'cheerio';
import assert from 'node:assert/strict';
import { assertApprovedMedia } from '../src/config/media-policy.mjs';
import { assertCinematicAssets } from '../src/config/cinematic-assets.mjs';
const json = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const cinematic = json('../src/data/cinematic-assets.json');
assertCinematicAssets(cinematic);
const originals = [
  ...Object.values(cinematic.videos),
  ...Object.values(cinematic.references),
  ...cinematic.scenes,
  cinematic.hairMask,
].filter((asset) => asset.status === 'ready');
for (const asset of originals) {
  const bytes = readFileSync(new URL('../public' + asset.src, import.meta.url));
  assert.equal(
    createHash('sha256').update(bytes).digest('hex'),
    asset.sha256,
    'Original asset hash must match provenance',
  );
}
const originalImages = originals.filter((asset) => !asset.src.endsWith('.mp4'));
const expectedOrigin =
  process.env.EXPECT_SITE_URL || 'https://www.mariyasnaturals.cloud';
const manifests = [
  json('../src/data/media-manifest.json'),
  json('../src/data/brand-media.json'),
];
manifests.forEach(assertApprovedMedia);
const retired = new Set(
  json('../tests/fixtures/retired-media-hashes.json').hashes,
);
const media = manifests.flatMap((m) => m.media);
const byId = new Map(media.map((m) => [m.id, m]));
const approved = new Set([
  ...media.flatMap((m) => m.derivatives.map((d) => d.localAssetPath)),
  ...originalImages.map((asset) => asset.src),
]);
const used = new Set();
let htmlCount = 0,
  imageCount = 0;
function checkImage(value) {
  const url = new URL(value, expectedOrigin);
  assert.ok(approved.has(url.pathname), `Unapproved image reference: ${value}`);
  assert.equal(url.origin, expectedOrigin, 'Image hotlinks are not permitted');
}
function schemaImages(value, key = '') {
  if (!value || typeof value !== 'object') {
    if (
      typeof value === 'string' &&
      ['image', 'thumbnailUrl', 'contentUrl'].includes(key)
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
    if (relative.startsWith('images/')) {
      assert.ok(
        approved.has('/' + relative),
        `Retired/untracked image remains in dist: ${relative}`,
      );
      assert.ok(
        !retired.has(
          createHash('sha256').update(readFileSync(path)).digest('hex'),
        ),
        'Retired legacy bytes in output',
      );
    }
    if (/\.(css|js)$/.test(entry.name)) {
      const text = readFileSync(path, 'utf8');
      assert.ok(
        !/media-com-|https?:\/\/[^\s"')]*(?:mariyasnaturals\.com|\.wp\.com)[^\s"')]*\.(?:webp|png|jpe?g|svg)/i.test(
          text,
        ),
        'Legacy image reference in CSS/JS',
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
      if ($(node).attr('data-cinematic-asset')) {
        const id = $(node).attr('data-cinematic-asset');
        const asset = id.startsWith('reference-')
          ? cinematic.references[id.slice('reference-'.length)]
          : cinematic.scenes.find((scene) => scene.id === id);
        assert.ok(
          asset?.status === 'ready' && asset.src === $(node).attr('src'),
          'Only recorded owner originals may render',
        );
        checkImage($(node).attr('src'));
        continue;
      }
      const id = $(node).attr('data-media-id');
      const record = byId.get(id);
      assert.ok(
        record,
        `Missing current-source provenance for image: ${$(node).attr('src')}`,
      );
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
        assert.ok(record.derivatives.some((d) => d.localAssetPath === value));
      }
    }
    for (const node of $(
      'meta[property="og:image"],meta[name="twitter:image"]',
    ).toArray())
      checkImage($(node).attr('content'));
    for (const node of $('[poster]').toArray())
      checkImage($(node).attr('poster'));
    assert.equal(
      $('a[href*="mariyasnaturals.com"]').length,
      0,
      'No legacy-store links in active UI',
    );
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
  `PASS source policy: ${htmlCount} HTML pages, ${imageCount} image elements, ${used.size} approved .in images, ${approved.size} local derivatives; no legacy files, hashes, hotlinks, CSS/JS, social or schema images.`,
);
