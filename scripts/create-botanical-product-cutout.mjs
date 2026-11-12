// Explicitly non-generative product extraction: RGB bytes come only from the original photograph.
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const folder = 'review/botanical';
const original = readFileSync('public/cinematic/original-product.jpg');
const matte = readFileSync(`${folder}/product-matte.svg`);
const crop = { left: 548, top: 238, width: 245, height: 745 };
const rgb = await sharp(original).extract(crop).removeAlpha().raw().toBuffer();
const { data: mask } = await sharp(matte)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const rgba = Buffer.alloc(crop.width * crop.height * 4);
let opaque = 0;
for (let i = 0; i < crop.width * crop.height; i++) {
  rgba[i * 4] = rgb[i * 3];
  rgba[i * 4 + 1] = rgb[i * 3 + 1];
  rgba[i * 4 + 2] = rgb[i * 3 + 2];
  rgba[i * 4 + 3] = mask[i * 4 + 3];
  if (rgba[i * 4 + 3] === 255) opaque++;
}
await sharp(rgba, {
  raw: { width: crop.width, height: crop.height, channels: 4 },
})
  .png()
  .toFile(`${folder}/assets/authentic-product-cutout.png`);
await sharp(rgba, {
  raw: { width: crop.width, height: crop.height, channels: 4 },
})
  .webp({ lossless: true })
  .toFile(`${folder}/assets/authentic-product-cutout.webp`);
const hash = (b) => createHash('sha256').update(b).digest('hex');
const m = JSON.parse(readFileSync(`${folder}/asset-manifest.json`));
m.assets = m.assets.filter(
  (a) => !a.file.includes('authentic-product-cutout.'),
);
for (const ext of ['png', 'webp']) {
  const file = `assets/authentic-product-cutout.${ext}`;
  const bytes = readFileSync(`${folder}/${file}`);
  m.assets.push({
    file,
    sha256: hash(bytes),
    bytes: bytes.length,
    width: crop.width,
    height: crop.height,
    alpha: true,
    source: 'public/cinematic/original-product.jpg',
    role: 'pixel-preserving-owner-photo-alpha-cutout',
    reviewStatus: 'pending-edge-review',
    originalSha256: hash(original),
    matteSha256: hash(matte),
    crop,
    opaquePixels: opaque,
    rgbPolicy:
      'All RGB channels are copied directly from the decoded original crop. Only the alpha channel comes from the traced matte. No generative edits, color changes or relabeling.',
  });
}
m.productCutout = {
  status: 'pixel-preserving-alpha-extraction',
  mask: 'product-matte.svg',
  originalSha256: hash(original),
  review:
    'Bottle-edge review required; original photograph remains byte-identical and authoritative.',
};
writeFileSync(
  `${folder}/asset-manifest.json`,
  JSON.stringify(m, null, 2) + '\n',
);
console.log(
  `Product cutout: ${opaque} opaque pixels, original RGB copied exactly; alpha matte only.`,
);
