import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const manifest = JSON.parse(
  readFileSync(new URL('../src/data/media-manifest.json', import.meta.url)),
);
test('media coverage remains consistent with evidence and local files', () => {
  const media = manifest.products.flatMap((product) => product.media);
  for (const [key, value] of Object.entries(manifest.coverage)) {
    if (key === 'totalCatalogueSize' && value === null) continue;
    assert.ok(
      Number.isInteger(value) && value >= 0,
      `${key} must be an actual count`,
    );
  }
  assert.equal(
    new Set(manifest.products.map((p) => p.productId)).size,
    manifest.products.length,
  );
  assert.equal(new Set(media.map((m) => m.id)).size, media.length);
  assert.equal(
    manifest.coverage.imagesIntegrated,
    media.filter((m) => m.localAssetPath).length,
  );
  if (manifest.status === 'acquisition-blocked-by-environment-proxy') {
    assert.equal(manifest.catalogueVerified, false);
    assert.equal(manifest.coverage.totalCatalogueSize, null);
    assert.ok(
      manifest.products.every(
        (p) => p.verificationStatus !== 'source-verified',
      ),
    );
  }
  for (const image of media) {
    assert.ok(image.sourceMediaUrl || image.exportReference);
    assert.ok(image.originalFilename && image.sourceSha256);
    assert.ok(image.width > 0 && image.height > 0);
    assert.ok(
      image.localAssetPath.startsWith('/images/products/') &&
        !image.localAssetPath.includes('..'),
    );
    assert.ok(
      existsSync(new URL('../public' + image.localAssetPath, import.meta.url)),
    );
    for (const lang of ['en', 'ml', 'hi', 'ta']) assert.ok(image.alt[lang]);
  }
});
