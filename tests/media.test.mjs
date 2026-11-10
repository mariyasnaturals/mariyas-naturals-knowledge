import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import {
  assertApprovedSource,
  assertApprovedMedia,
} from '../src/config/media-policy.mjs';
const json = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const manifest = json('../src/data/media-manifest.json');
const brand = json('../src/data/brand-media.json');
const snapshot = json('../src/data/catalogue-source.json');
const retired = json('./fixtures/retired-media-hashes.json');
const media = [...manifest.media, ...brand.media];
test('only current .in listings and exact individual product images are active', () => {
  assert.equal(manifest.schemaVersion, 3);
  assertApprovedMedia(manifest);
  assertApprovedMedia(brand);
  assert.equal(
    new Set(manifest.products.map((p) => p.productId)).size,
    manifest.products.length,
  );
  const sources = manifest.products.flatMap((p) => p.sources);
  assert.equal(sources.length, snapshot.reportedTotals.in);
  assert.equal(new Set(sources.map((s) => s.id)).size, snapshot.records.length);
  assert.ok(
    sources.every(
      (s) =>
        s.store === 'in' &&
        new URL(s.url).origin === 'https://mariyasnaturals.in',
    ),
  );
  assert.equal(manifest.coverage.productsWithMainImages, 2);
  assert.equal(manifest.coverage.productsMissingMainImages, 84);
  for (const [sourceId, count] of [
    [3008, 4],
    [3009, 4],
    [3010, 0],
    [2865, 0],
  ])
    assert.equal(
      manifest.products.find((p) => p.sources[0].id === sourceId).mediaIds
        .length,
      count,
    );
  assert.equal(brand.media.length, 4);
  assert.ok(
    brand.media.every(
      (m) =>
        m.approvedUse === 'category-editorial-only' &&
        m.associations.length === 0,
    ),
    'Category artwork must not masquerade as a product image',
  );
});
test('all current derivatives decode without crop, retain hashes and exclude retired image bytes', async () => {
  const prohibited = new Set(retired.hashes);
  let bytes = 0,
    count = 0;
  for (const image of media) {
    assert.ok(!prohibited.has(image.sourceSha256));
    assert.equal(image.localAssetPath, image.derivatives.at(-1).localAssetPath);
    for (const source of image.sources) assertApprovedSource(source.sourceUrl);
    for (const derivative of image.derivatives) {
      assert.match(derivative.localAssetPath, /^\/images\/(products|brand)\//);
      const path = new URL(
        '../public' + derivative.localAssetPath,
        import.meta.url,
      );
      assert.ok(existsSync(path));
      const buffer = readFileSync(path);
      const hash = createHash('sha256').update(buffer).digest('hex');
      assert.equal(hash, derivative.sha256);
      assert.ok(
        !prohibited.has(hash),
        'Legacy image bytes cannot be reintroduced under a new filename',
      );
      const decoded = await sharp(buffer).metadata();
      assert.equal(decoded.width, derivative.width);
      assert.equal(decoded.height, derivative.height);
      assert.ok(
        Math.abs(decoded.width / decoded.height - image.width / image.height) <
          0.01,
        'No packaging crop or distortion',
      );
      bytes += buffer.length;
      count++;
    }
  }
  assert.equal(count, 36);
  assert.equal(
    manifest.media.reduce(
      (n, m) => n + m.derivatives.reduce((a, d) => a + d.bytes, 0),
      0,
    ),
    manifest.coverage.localMediaBytes,
  );
  assert.ok(bytes > 0);
});
test('the served image tree contains only approved derivatives', () => {
  const expected = new Set(
    media.flatMap((m) => m.derivatives.map((d) => d.localAssetPath)),
  );
  const actual = [];
  function walk(directory, prefix) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory())
        walk(new URL(entry.name + '/', directory), prefix + entry.name + '/');
      else actual.push(prefix + entry.name);
    }
  }
  walk(new URL('../public/images/', import.meta.url), '/images/');
  assert.deepEqual(
    actual.sort(),
    [...expected].sort(),
    'No dormant legacy image files may remain public',
  );
});
test('legacy origins, CDNs and falsified local provenance are rejected', () => {
  for (const url of [
    'https://www.mariyasnaturals.com/wp-content/uploads/test.webp',
    'https://mariyasnaturals.com/wp-content/uploads/test.webp',
    'https://i0.wp.com/mariyasnaturals.in/wp-content/uploads/test.webp',
    'http://mariyasnaturals.in/wp-content/uploads/test.webp',
    'https://mariyasnaturals.in.evil.example/wp-content/uploads/test.webp',
  ])
    assert.throws(() => assertApprovedSource(url));
  const bad = structuredClone(manifest);
  bad.media[0].sources[0].store = 'com';
  assert.throws(() => assertApprovedMedia(bad));
  const missing = structuredClone(manifest);
  missing.products[0].mediaIds = ['renamed-legacy-image'];
  assert.throws(() => assertApprovedMedia(missing));
  const swapped = structuredClone(manifest);
  const photographed = swapped.products.filter(
    (product) => product.mediaIds.length,
  );
  photographed[0].mediaIds = [photographed[1].mediaIds[0]];
  assert.throws(
    () => assertApprovedMedia(swapped),
    'A current 200 ml image cannot silently replace a 500 ml image',
  );
});
