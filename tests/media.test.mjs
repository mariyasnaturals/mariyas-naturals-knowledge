import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import {
  assertApprovedSource,
  assertApprovedMedia,
  mediaPolicy,
} from '../src/config/media-policy.mjs';

const json = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const manifest = json('../catalogue/media-manifest.json');
const brand = json('../src/data/brand-media.json');
const snapshot = json('../catalogue/catalogue-source.json');
const identities = json('../src/data/product-identities.json');
const retired = json('./fixtures/retired-media-hashes.json');
const media = [...manifest.media, ...brand.media];

test('the catalogue is the official .com store, with the discontinued pack removed', () => {
  assert.equal(manifest.schemaVersion, 4);
  assert.equal(manifest.sourcePolicy, mediaPolicy);
  assertApprovedMedia(manifest);
  assertApprovedMedia(brand);
  assert.equal(
    new Set(manifest.products.map((p) => p.productId)).size,
    manifest.products.length,
  );
  const sources = manifest.products.flatMap((p) => p.sources);
  assert.equal(sources.length, 85);
  assert.equal(new Set(sources.map((s) => s.id)).size, 85);
  assert.ok(
    sources.every(
      (s) =>
        s.store === 'com' &&
        new URL(s.url).origin === 'https://www.mariyasnaturals.com',
    ),
    'Every published record must come from the official .com catalogue',
  );
  // 3010 (1 litre) is discontinued and must not exist anywhere.
  assert.equal(
    snapshot.records.some((r) => r.id === 3010),
    false,
  );
  assert.equal(
    identities.some((i) => i.sourceProductId === 3010),
    false,
  );
  assert.equal(
    manifest.products.some((p) => p.sources[0].id === 3010),
    false,
  );
  assert.deepEqual(
    snapshot.exclusions.map((entry) => entry.id),
    [3010],
  );
  assert.ok(snapshot.exclusions[0].reason.length > 40);
  assert.equal(snapshot.records.length, 85);
  assert.equal(identities.length, 85);

  // Store names are published verbatim but decoded — no raw HTML entities.
  for (const product of manifest.products) {
    assert.doesNotMatch(product.displayName, /&#?\w+;/);
    assert.doesNotMatch(product.displayName, /<[^>]+>/);
  }
});

test('coverage records what the store actually publishes', () => {
  assert.equal(manifest.coverage.primaryStoreEntries, 85);
  assert.equal(manifest.coverage.productsWithMainImages, 59);
  assert.equal(manifest.coverage.productsMissingMainImages, 26);
  assert.equal(manifest.coverage.sourceAttachmentsDownloaded, 215);
  assert.equal(manifest.coverage.uniqueSourceImages, 215);
  assert.equal(manifest.coverage.responsiveDerivatives, 489);
  assert.equal(manifest.media.length, 215);

  const bySource = new Map(
    manifest.products.map((product) => [product.sources[0].id, product]),
  );
  assert.equal(bySource.get(3008).mediaIds.length, 4);
  assert.equal(bySource.get(3009).mediaIds.length, 4);
  assert.equal(bySource.get(2866).mediaIds.length, 3);
  assert.equal(bySource.get(3012).mediaIds.length, 0);
  // A listing with no photograph is honest about it rather than illustrated.
  assert.ok(bySource.get(3012).missing.length >= 1);

  assert.equal(brand.media.length, 4);
  assert.ok(
    brand.media.every(
      (m) =>
        m.approvedUse === 'category-editorial-only' &&
        m.associations.length === 0 &&
        m.sources.every((source) => source.store === 'in'),
    ),
    'Category artwork stays editorial and never masquerades as a product image',
  );
});

test('main pack shots carry three widths, gallery frames two', () => {
  const mainIds = new Set(
    manifest.products.flatMap((product) =>
      product.mediaIds.slice(0, 1).map((id) => id),
    ),
  );
  for (const image of manifest.media) {
    const widths = image.derivatives.map((d) => d.width);
    assert.deepEqual(
      widths,
      mainIds.has(image.id) ? [320, 640, 960] : [320, 640],
      `${image.id} has an unexpected derivative ladder`,
    );
    assert.equal(image.localAssetPath, image.derivatives.at(-1).localAssetPath);
    assert.match(
      image.localAssetPath,
      /^\/images\/products\/[a-z0-9-]+\/product-media-\d+-\d+\.webp$/,
    );
  }
});

test('all current derivatives decode without crop, retain hashes and exclude retired bytes', async () => {
  const prohibited = new Set(retired.hashes);
  let bytes = 0,
    count = 0;
  for (const image of media) {
    assert.ok(!prohibited.has(image.sourceSha256));
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
  assert.equal(count, 489 + 12);
  assert.equal(
    manifest.media.reduce(
      (n, m) => n + m.derivatives.reduce((a, d) => a + d.bytes, 0),
      0,
    ),
    manifest.coverage.localMediaBytes,
  );
  assert.ok(bytes > 20_000_000);
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
    'https://mariyasnaturals.com/wp-content/uploads/test.webp',
    'https://i0.wp.com/mariyasnaturals.com/wp-content/uploads/test.webp',
    'http://www.mariyasnaturals.com/wp-content/uploads/test.webp',
    'https://www.mariyasnaturals.com.evil.example/wp-content/uploads/test.webp',
    'https://cdn.example.com/wp-content/uploads/test.webp',
  ])
    assert.throws(() => assertApprovedSource(url));

  // The previous .in staging store stays readable for category artwork only.
  assert.ok(
    assertApprovedSource(
      'https://mariyasnaturals.in/wp-content/uploads/2026/11/Baby-care-category.webp',
    ),
  );

  const bad = structuredClone(manifest);
  bad.media[0].sources[0].store = 'cdn';
  assert.throws(() => assertApprovedMedia(bad));

  const missing = structuredClone(manifest);
  missing.products[0].mediaIds = ['renamed-legacy-image'];
  assert.throws(() => assertApprovedMedia(missing));

  const swapped = structuredClone(manifest);
  const photographed = swapped.products.filter((p) => p.mediaIds.length);
  photographed[0].mediaIds = [photographed[1].mediaIds[0]];
  assert.throws(
    () => assertApprovedMedia(swapped),
    'A 500 ml photograph cannot silently stand in for the 200 ml pack',
  );

  const wrongStore = structuredClone(manifest);
  wrongStore.products[0].sources[0].store = 'in';
  assert.throws(() => assertApprovedMedia(wrongStore));
});
