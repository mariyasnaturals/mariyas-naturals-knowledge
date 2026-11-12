import assert from 'node:assert/strict';
import { readFileSync, readdirSync, lstatSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { verifyBrassReview } from './verify-brass-review.mjs';
export async function verifyBotanicalAssets() {
  const root = resolve('review/botanical');
  const m = JSON.parse(readFileSync(resolve(root, 'asset-manifest.json')));
  assert.equal(m.deploymentAllowed, false);
  assert.equal(m.claim.text, '60 Natural Ingredients');
  assert.equal(m.claim.status, 'owner-confirmed');
  for (const directory of ['assets', 'masters']) {
    const expected = m.assets
      .filter((a) => a.file.startsWith(directory + '/'))
      .map((a) => a.file.slice(directory.length + 1))
      .sort();
    const actual = readdirSync(resolve(root, directory)).sort();
    assert.deepEqual(actual, expected, 'Unregistered files in ' + directory);
    for (const file of actual)
      assert.ok(
        lstatSync(resolve(root, directory, file)).isFile() &&
          !lstatSync(resolve(root, directory, file)).isSymbolicLink(),
        'Unsafe asset type',
      );
  }
  const studies = m.assets.filter(
    (a) => a.role === 'unnamed-artistic-botanical-study',
  );
  assert.equal(studies.length, 30);
  assert.equal(new Set(studies.map((s) => s.sha256)).size, 30);
  for (const a of m.assets) {
    assert.match(a.file, /^(assets|masters)\/[a-zA-Z0-9-]+\.(png|jpg|webp)$/);
    const bytes = readFileSync(resolve(root, a.file));
    assert.equal(
      createHash('sha256').update(bytes).digest('hex'),
      a.sha256,
      a.file,
    );
    assert.equal(bytes.length, a.bytes);
    const metadata = await sharp(bytes).metadata();
    assert.equal(metadata.width, a.width);
    assert.equal(metadata.height, a.height);
    if (a.alpha) {
      assert.equal(metadata.hasAlpha, true, a.file);
      const stats = await sharp(bytes).stats();
      assert.equal(
        stats.channels[3].min,
        0,
        a.file + ' needs genuine transparent pixels',
      );
      assert.ok(stats.channels[3].max > 100);
    }
  }
  // Prove packaging RGB preservation independently of generation/export code.
  const crop = { left: 548, top: 238, width: 245, height: 745 };
  const originalCrop = await sharp('public/cinematic/original-product.jpg')
    .extract(crop)
    .removeAlpha()
    .raw()
    .toBuffer();
  const cutout = await sharp(
    resolve(root, 'assets/authentic-product-cutout.png'),
  )
    .ensureAlpha()
    .raw()
    .toBuffer();
  let opaquePixels = 0;
  for (let i = 0; i < crop.width * crop.height; i++) {
    if (cutout[i * 4 + 3] === 255) {
      opaquePixels++;
      for (let channel = 0; channel < 3; channel++)
        assert.equal(
          cutout[i * 4 + channel],
          originalCrop[i * 3 + channel],
          'Product packaging RGB changed',
        );
    }
  }
  assert.ok(
    opaquePixels > 100000,
    'Product mask must retain the full bottle interior',
  );
  const original = readFileSync('public/cinematic/original-product.jpg');
  assert.ok(
    original.equals(
      readFileSync(resolve(root, 'assets/authentic-product.jpg')),
    ),
  );
  if (m.vesselFamily) await verifyBrassReview(m);
  console.log(
    `PASS ${m.assets.length} asset hashes/dimensions, 30 independent alpha studies, exact original product and owner-confirmed claim`,
  );
  return m;
}
if (import.meta.url === new URL(process.argv[1] || '', 'file://').href)
  await verifyBotanicalAssets();
