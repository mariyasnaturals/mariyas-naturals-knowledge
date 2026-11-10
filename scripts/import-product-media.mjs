// Explicit acquisition of the current approved .in snapshot only. Never runs in builds.
import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { basename, resolve } from 'node:path';
import { format } from 'prettier';
import sharp from 'sharp';
import {
  assertApprovedSource,
  assertApprovedMedia,
  mediaPolicy,
  currentStoreOrigin,
} from '../src/config/media-policy.mjs';
const run = promisify(execFile);
const root = resolve(import.meta.dirname, '..');
const cache = resolve(process.env.MEDIA_CACHE_DIR || '/tmp/mariyas-originals');
const snapshot = JSON.parse(
  await readFile(resolve(root, 'src/data/catalogue-source.json'), 'utf8'),
);
const identities = JSON.parse(
  await readFile(resolve(root, 'src/data/product-identities.json'), 'utf8'),
);
const brandSources = JSON.parse(
  await readFile(resolve(root, 'src/data/brand-source.json'), 'utf8'),
);
const download = process.argv.includes('--download');
if (
  snapshot.sourcePolicy !== mediaPolicy ||
  snapshot.records.some((r) => r.store !== 'in')
)
  throw new Error('Only the current approved .in snapshot can be imported');
const category = (name) => {
  if (/baby/i.test(name)) return 'baby-care';
  if (/kit|combo|pack with comb|\+ comb/i.test(name)) return 'combo';
  if (/powder|kanji/i.test(name)) return 'herbal-powders';
  if (/hair|shampoo|comb|thali|rosemary|thailam/i.test(name))
    return 'hair-care';
  if (/ghee|honey|chyavan/i.test(name)) return 'wellness';
  return 'skin-care';
};
const products = snapshot.records.map((source) => {
  const identity = identities.find((p) => p.sourceProductId === source.id);
  if (!identity || new URL(source.url).origin !== currentStoreOrigin)
    throw new Error(`Missing current product identity ${source.id}`);
  return {
    productId: identity.id,
    slug: identity.slug,
    displayName: source.name,
    category: category(source.name),
    sources: [source],
    variants: [],
    verificationStatus: 'source-verified',
    mediaIds: source.images.map((i) => `media-in-${i.id}`),
    missing: source.images.length
      ? []
      : [
          'Approved .in product image not supplied; display a clean placeholder.',
        ],
  };
});
const allowedFiles = new Set();
await mkdir(cache, { recursive: true });
async function optimize(source, folder, id, associations) {
  if (source.store !== 'in') throw new Error('Legacy source rejected');
  const url = assertApprovedSource(source.sourceUrl);
  const cachePath = resolve(cache, String(source.attachmentId || source.id));
  if (download) {
    const { stdout } = await run('curl', [
      '--silent',
      '--show-error',
      '--max-time',
      '45',
      '--max-filesize',
      '12000000',
      '--output',
      cachePath,
      '--write-out',
      '%{http_code} %{redirect_url}',
      source.sourceUrl,
    ]);
    if (stdout.trim() !== '200')
      throw new Error(
        `Source acquisition stopped: ${source.sourceUrl}: ${stdout}. Redirects require review.`,
      );
  }
  const bytes = await readFile(cachePath);
  const metadata = await sharp(bytes).metadata();
  await mkdir(resolve(root, 'public' + folder), { recursive: true });
  const derivatives = [];
  const widths = [
    ...new Set(
      [320, 640, Math.min(960, metadata.width)].filter(
        (w) => w <= metadata.width,
      ),
    ),
  ].sort((a, b) => a - b);
  for (const width of widths) {
    const localAssetPath = `${folder}/${id}-${width}.webp`;
    const output = resolve(root, 'public' + localAssetPath);
    const info = await sharp(bytes)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 88, effort: 6 })
      .toFile(output);
    const buffer = await readFile(output);
    derivatives.push({
      localAssetPath,
      width: info.width,
      height: info.height,
      bytes: info.size,
      sha256: createHash('sha256').update(buffer).digest('hex'),
    });
    allowedFiles.add(output);
  }
  return {
    id,
    originalFilename: basename(url.pathname),
    width: metadata.width,
    height: metadata.height,
    sourceBytes: bytes.length,
    sourceSha256: createHash('sha256').update(bytes).digest('hex'),
    sourceMediaUrl: source.sourceUrl,
    localAssetPath: derivatives.at(-1).localAssetPath,
    verificationStatus: 'source-verified',
    sources: [{ ...source, originalFilename: basename(url.pathname) }],
    associations,
    derivatives,
  };
}
const media = [];
for (const source of snapshot.attachments) {
  const owner = products.find((p) =>
    p.mediaIds.includes(`media-in-${source.id}`),
  );
  if (!owner) throw new Error(`Unassociated current attachment ${source.id}`);
  const record = owner.sources[0];
  media.push(
    await optimize(
      source,
      `/images/products/${owner.slug}`,
      `media-in-${source.id}`,
      [
        {
          productId: owner.productId,
          sourceStore: 'in',
          sourceProductId: record.id,
          role: record.images[0].id === source.id ? 'main' : 'gallery',
        },
      ],
    ),
  );
}
const brandMedia = [];
for (const source of brandSources) {
  if (
    source.approvedUse !== 'category-editorial-only' ||
    new URL(source.observedOn).origin !== currentStoreOrigin
  )
    throw new Error('Category artwork needs current-store evidence');
  brandMedia.push({
    ...(await optimize(source, `/images/brand/${source.slug}`, source.id, [])),
    category: source.category,
    approvedUse: source.approvedUse,
  });
}
const manifest = {
  schemaVersion: 3,
  sourcePolicy: mediaPolicy,
  status: 'current-approved-in-local-media',
  verifiedOn: snapshot.verifiedOn,
  sourceWebsites: [currentStoreOrigin],
  catalogueVerified: true,
  scope:
    'Current .in catalogue only. Category artwork is never substituted for an individual product photograph.',
  products,
  media,
  coverage: {
    primaryStoreEntries: products.length,
    distinctProductFamilies: products.length,
    explicitSizeVariants: 0,
    productsWithMainImages: products.filter((p) => p.mediaIds.length).length,
    productsMissingMainImages: products.filter((p) => !p.mediaIds.length)
      .length,
    sourceAttachmentsDownloaded: media.length,
    uniqueSourceImages: media.length,
    responsiveDerivatives: media.reduce((n, m) => n + m.derivatives.length, 0),
    localMediaBytes: media.reduce(
      (n, m) => n + m.derivatives.reduce((a, d) => a + d.bytes, 0),
      0,
    ),
  },
};
const brandManifest = {
  schemaVersion: 3,
  sourcePolicy: mediaPolicy,
  verifiedOn: snapshot.verifiedOn,
  media: brandMedia,
};
assertApprovedMedia(manifest);
assertApprovedMedia(brandManifest);
// Prune retired files from the served image tree. Git history retains the audit trail.
async function prune(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true }).catch(
    (error) => {
      if (error.code === 'ENOENT') return [];
      throw error;
    },
  )) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      await prune(path);
      if (!(await readdir(path)).length) await rm(path, { recursive: true });
    } else if (!allowedFiles.has(path)) await rm(path);
  }
}
await prune(resolve(root, 'public/images'));
for (const [name, value] of [
  ['media-manifest', manifest],
  ['brand-media', brandManifest],
])
  await writeFile(
    resolve(root, `src/data/${name}.json`),
    await format(JSON.stringify(value), { parser: 'json' }),
  );
console.log(
  JSON.stringify(
    {
      ...manifest.coverage,
      approvedCategoryArtworks: brandMedia.length,
      totalApprovedImages: media.length + brandMedia.length,
      totalDerivatives: [...media, ...brandMedia].reduce(
        (n, m) => n + m.derivatives.length,
        0,
      ),
    },
    null,
    2,
  ),
);
