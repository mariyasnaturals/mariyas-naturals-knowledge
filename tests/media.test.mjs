import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
const manifest = JSON.parse(
  readFileSync(new URL('../src/data/media-manifest.json', import.meta.url)),
);
const snapshot = JSON.parse(
  readFileSync(new URL('../src/data/catalogue-source.json', import.meta.url)),
);
const media = manifest.media;
test('catalogue coverage accounts for every source listing and explicit variant', () => {
  assert.equal(manifest.schemaVersion, 2);
  assert.equal(
    new Set(manifest.products.map((p) => p.productId)).size,
    manifest.products.length,
  );
  const sources = manifest.products.flatMap((p) => [
    ...p.sources,
    ...p.variants.flatMap((v) => v.sources),
  ]);
  assert.equal(sources.length, snapshot.records.length);
  assert.equal(
    new Set(sources.map((s) => `${s.store}-${s.id}`)).size,
    snapshot.records.length,
  );
  for (const store of ['in', 'com'])
    assert.equal(
      sources.filter((s) => s.store === store).length,
      snapshot.reportedTotals[store],
    );
  assert.equal(
    manifest.coverage.distinctProductFamilies,
    manifest.products.length,
  );
  assert.equal(
    manifest.coverage.productsMissingMainImages,
    manifest.products.filter((p) => !p.mediaIds.length).length,
  );
  assert.ok(
    manifest.products.every(
      (p) => p.verificationStatus === 'source-verified' && p.sources.length,
    ),
  );
  assert.deepEqual(
    manifest.products
      .find((p) => p.productId === 'mn-19185')
      .variants.map((v) => [v.label, v.mediaIds.length]),
    [
      ['200ML', 4],
      ['500ML', 4],
      ['1LTR', 0],
    ],
  );
});
test('responsive files decode, preserve aspect ratio, match hashes and have no hotlinks', async () => {
  assert.equal(new Set(media.map((m) => m.sourceSha256)).size, media.length);
  let count = 0,
    bytes = 0;
  for (const image of media) {
    assert.match(image.sourceSha256, /^[a-f0-9]{64}$/);
    assert.ok(image.width > 0 && image.height > 0 && image.associations.length);
    for (const source of image.sources)
      assert.ok(
        ['mariyasnaturals.in', 'www.mariyasnaturals.com'].includes(
          new URL(source.sourceUrl).hostname,
        ),
      );
    assert.equal(image.localAssetPath, image.derivatives.at(-1).localAssetPath);
    for (const derivative of image.derivatives) {
      assert.ok(
        derivative.localAssetPath.startsWith('/images/products/') &&
          !derivative.localAssetPath.includes('..'),
      );
      const path = new URL(
        '../public' + derivative.localAssetPath,
        import.meta.url,
      );
      assert.ok(existsSync(path));
      const buffer = readFileSync(path);
      assert.equal(
        createHash('sha256').update(buffer).digest('hex'),
        derivative.sha256,
      );
      assert.equal(buffer.length, derivative.bytes);
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
  assert.equal(count, manifest.coverage.responsiveDerivatives);
  assert.equal(bytes, manifest.coverage.localMediaBytes);
  assert.equal(
    media.reduce((n, m) => n + m.sources.length, 0),
    manifest.coverage.sourceAttachmentsDownloaded,
  );
});
test('every product association points to a real source attachment', () => {
  for (const p of manifest.products) {
    for (const id of [
      ...p.mediaIds,
      ...p.variants.flatMap((v) => v.mediaIds),
    ]) {
      const image = media.find((m) => m.id === id);
      assert.ok(image?.associations.some((a) => a.productId === p.productId));
    }
  }
});
