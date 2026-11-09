// Explicit, opt-in acquisition. Builds use committed local derivatives only.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { basename, resolve } from 'node:path';
import sharp from 'sharp';
import { format } from 'prettier';
const run = promisify(execFile);
const root = resolve(import.meta.dirname, '..');
const cache = resolve(process.env.MEDIA_CACHE_DIR || '/tmp/mariyas-originals');
const snapshot = JSON.parse(
  await readFile(resolve(root, 'src/data/catalogue-source.json'), 'utf8'),
);
const download = process.argv.includes('--download');
const allowedHosts = new Set([
  'mariyasnaturals.in',
  'www.mariyasnaturals.in',
  'mariyasnaturals.com',
  'www.mariyasnaturals.com',
]);
await mkdir(cache, { recursive: true });
const com = snapshot.records.filter((r) => r.store === 'com');
const primary = snapshot.records.filter((r) => r.store === 'in');
const category = (name) => {
  if (/baby/i.test(name)) return 'baby-care';
  if (/kit|combo|pack with comb|\+ comb|anti dandruff pack/i.test(name))
    return 'combo';
  if (/powder|kanji/i.test(name)) return 'herbal-powders';
  if (/hair|shampoo|comb|thali|rosemary|thailam/i.test(name))
    return 'hair-care';
  if (/ghee|honey|chyavan/i.test(name)) return 'wellness';
  return 'skin-care';
};
const products = com.map((r) => ({
  productId: `mn-${r.id}`,
  slug:
    r.id === 19185
      ? 'mariyas-hair-oil'
      : `${r.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')}-${r.id}`,
  displayName: r.name,
  category: category(r.name),
  sources: [r, ...primary.filter((p) => p.sku === String(r.id))],
  variants: r.variations.map((v) => ({
    id: `mn-variant-${v.id}`,
    sourceProductId: v.id,
    label: v.attributes.map((a) => a.value).join(' / '),
    sources: primary.filter((p) => p.sku === String(v.id)),
    mediaIds: [],
  })),
  verificationStatus: 'source-verified',
  mediaIds: [],
  missing: [],
}));
for (const r of primary) {
  if (
    products.some(
      (p) =>
        p.sources.includes(r) || p.variants.some((v) => v.sources.includes(r)),
    )
  )
    continue;
  products.push({
    productId: `mn-in-${r.id}`,
    slug: `${r.slug}-${r.id}`,
    displayName: r.name,
    category: category(r.name),
    sources: [r],
    variants: [],
    verificationStatus: 'source-verified',
    mediaIds: [],
    missing: [],
  });
}
// Local route identities are minted once; a later store rename must not break them.
try {
  const previous = JSON.parse(
    await readFile(resolve(root, 'src/data/media-manifest.json'), 'utf8'),
  );
  for (const p of products)
    p.slug =
      previous.products.find((old) => old.productId === p.productId)?.slug ||
      p.slug;
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const records = [];
const byHash = new Map();
for (const source of snapshot.attachments) {
  const url = new URL(source.sourceUrl);
  if (
    url.protocol !== 'https:' ||
    !allowedHosts.has(url.hostname) ||
    url.username ||
    url.password
  )
    throw new Error(`Unapproved source host: ${url.hostname}`);
  const path = resolve(
    cache,
    source.store === 'in' ? String(source.id) : `com-${source.id}`,
  );
  if (download) {
    const { stdout } = await run('curl', [
      '--silent',
      '--show-error',
      '--max-time',
      '45',
      '--max-filesize',
      '12000000',
      '--output',
      path,
      '--write-out',
      '%{http_code} %{redirect_url}',
      source.sourceUrl,
    ]);
    // Never silently follow a redirect, including one to a new image CDN.
    if (stdout.trim() !== '200')
      throw new Error(
        `Acquisition stopped: ${source.sourceUrl}: ${stdout}. Review the destination before retrying.`,
      );
  }
  const bytes = await readFile(path);
  const hash = createHash('sha256').update(bytes).digest('hex');
  let record = byHash.get(hash);
  if (!record) {
    const owner = products.find(
      (p) =>
        p.sources.some(
          (r) =>
            r.store === source.store &&
            r.images.some((i) => i.id === source.id),
        ) ||
        p.variants.some((v) =>
          v.sources.some(
            (r) =>
              r.store === source.store &&
              r.images.some((i) => i.id === source.id),
          ),
        ),
    );
    if (!owner) throw new Error(`Unassociated image ${source.id}`);
    const metadata = await sharp(bytes).metadata();
    const id = `media-${source.store}-${source.id}`;
    const folder = `/images/products/${owner.slug}`;
    await mkdir(resolve(root, 'public' + folder), { recursive: true });
    const widths = [
      ...new Set(
        [320, 640, Math.min(960, metadata.width)].filter(
          (w) => w <= metadata.width,
        ),
      ),
    ].sort((a, b) => a - b);
    const derivatives = [];
    for (const width of widths) {
      const localAssetPath = `${folder}/${id}-${width}.webp`;
      const info = await sharp(bytes)
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 88, effort: 6 })
        .toFile(resolve(root, 'public' + localAssetPath));
      const derivativeBytes = await readFile(
        resolve(root, 'public' + localAssetPath),
      );
      derivatives.push({
        localAssetPath,
        width: info.width,
        height: info.height,
        bytes: info.size,
        sha256: createHash('sha256').update(derivativeBytes).digest('hex'),
      });
    }
    record = {
      id,
      originalFilename: basename(url.pathname),
      width: metadata.width,
      height: metadata.height,
      sourceBytes: bytes.length,
      sourceSha256: hash,
      sourceMediaUrl: source.sourceUrl,
      localAssetPath: derivatives.at(-1).localAssetPath,
      verificationStatus: 'source-verified',
      sources: [],
      associations: [],
      derivatives,
    };
    records.push(record);
    byHash.set(hash, record);
  }
  record.sources.push({ ...source, originalFilename: basename(url.pathname) });
  for (const p of products) {
    for (const r of p.sources.filter(
      (r) =>
        r.store === source.store && r.images.some((i) => i.id === source.id),
    )) {
      if (!p.mediaIds.includes(record.id)) p.mediaIds.push(record.id);
      record.associations.push({
        productId: p.productId,
        sourceStore: r.store,
        sourceProductId: r.id,
        role: r.images[0].id === source.id ? 'main' : 'gallery',
      });
    }
    for (const v of p.variants) {
      for (const r of v.sources.filter(
        (r) =>
          r.store === source.store && r.images.some((i) => i.id === source.id),
      )) {
        if (!v.mediaIds.includes(record.id)) v.mediaIds.push(record.id);
        record.associations.push({
          productId: p.productId,
          variantId: v.id,
          variantLabel: v.label,
          sourceStore: r.store,
          sourceProductId: r.id,
          role: r.images[0].id === source.id ? 'main' : 'gallery',
        });
      }
    }
  }
}
for (const p of products) {
  // Source order defines main versus gallery; attachment publication order does not.
  const ordered = p.sources
    .flatMap((r) =>
      r.images.map(
        (i) =>
          records.find((m) =>
            m.sources.some((s) => s.store === r.store && s.id === i.id),
          )?.id,
      ),
    )
    .filter(Boolean);
  p.mediaIds = [...new Set(ordered)];
  if (!p.mediaIds.length)
    p.missing.push('No product image attached in either public catalogue');
  for (const v of p.variants)
    if (!v.mediaIds.length)
      p.missing.push(
        `No separate verified image for ${v.label}; parent image must not imply this size`,
      );
  if (
    p.sources.some((r) => /no stock/i.test(r.name) && r.inStockAtVerification)
  )
    p.missing.push(
      'Source title says No Stock while API stock flag is true; availability not published',
    );
}
const manifest = {
  schemaVersion: 2,
  status: 'source-verified-local-media',
  verifiedOn: snapshot.verifiedOn,
  sourceWebsites: [
    'https://mariyasnaturals.in',
    'https://www.mariyasnaturals.com',
  ],
  catalogueVerified: true,
  scope:
    'Public catalogue snapshots only; source verification is not editorial, medical, certification or inventory approval.',
  products,
  media: records,
  coverage: {
    primaryStoreEntries: primary.length,
    secondaryStoreEntries: com.length,
    distinctProductFamilies: products.length,
    explicitSizeVariants: products.reduce((n, p) => n + p.variants.length, 0),
    productsWithMainImages: products.filter((p) => p.mediaIds.length).length,
    productsMissingMainImages: products.filter((p) => !p.mediaIds.length)
      .length,
    sourceAttachmentsDownloaded: snapshot.attachments.length,
    uniqueSourceImages: records.length,
    responsiveDerivatives: records.reduce(
      (n, r) => n + r.derivatives.length,
      0,
    ),
    localMediaBytes: records.reduce(
      (n, r) => n + r.derivatives.reduce((a, d) => a + d.bytes, 0),
      0,
    ),
  },
};
await writeFile(
  resolve(root, 'src/data/media-manifest.json'),
  await format(JSON.stringify(manifest), { parser: 'json' }),
);
console.log(JSON.stringify(manifest.coverage, null, 2));
