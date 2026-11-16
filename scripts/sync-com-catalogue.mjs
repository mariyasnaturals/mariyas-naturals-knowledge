/**
 * Builds the approved local catalogue from the downloaded official-store
 * snapshot. Runs offline against `SNAPSHOT_DIR` (see `fetch-com-snapshot.mjs`).
 *
 *   node scripts/sync-com-catalogue.mjs --snapshot /tmp/com-snapshot
 *
 * It produces, and is the only writer of:
 *   catalogue/catalogue-source.json   the verified .com product records
 *   src/data/product-identities.json  stable local ids and slugs
 *   catalogue/media-manifest.json     approved product media + derivatives
 *   catalogue/media-index.json        URL-free id → derivative index for the client
 *   src/data/brand-media.json         category artwork, policy-stamped
 *   catalogue/care-knowledge.json     verbatim store facts for the care assistant
 *   public/images/products/<slug>/…   WebP derivatives at 320 / 640 / 960
 *   docs/official-store-sync.md       the audit report for this sync
 *
 * Nothing here invents a claim: every field is copied from the store API, and a
 * product without a photograph is recorded as missing rather than illustrated
 * with a different product's packaging.
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { format } from 'prettier';
import sharp from 'sharp';
import {
  assertApprovedMedia,
  currentStoreOrigin,
  mediaPolicy,
} from '../src/config/media-policy.mjs';

const root = resolve(import.meta.dirname, '..');
const argument = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
};
const snapshotDir = resolve(
  argument('snapshot', process.env.SNAPSHOT_DIR || '/tmp/com-snapshot'),
);
const today = new Date().toISOString().slice(0, 10);

/**
 * Products that must never reach the site. Each entry is an owner-visible fact,
 * not a heuristic: the reason is published in the audit report.
 */
const exclusions = new Map([
  [
    3010,
    'Discontinued pack: the 1 litre hair-oil listing is priced at ₹0, carries no photograph and is no longer sold. The 200 ml and 500 ml packs remain.',
  ],
]);

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const writeJson = async (path, value) =>
  writeFile(path, await format(JSON.stringify(value), { parser: 'json' }));

const rawProducts = await readJson(resolve(snapshotDir, 'products.json'));
const images = await readJson(resolve(snapshotDir, 'images.json'));
if (!Array.isArray(rawProducts) || !rawProducts.length)
  throw new Error('The snapshot contains no products');

const products = rawProducts.filter((product) => !exclusions.has(product.id));
for (const product of products) {
  const url = new URL(product.permalink);
  if (url.origin !== currentStoreOrigin)
    throw new Error(
      `Catalogue entry outside the official store: ${product.permalink}`,
    );
}

// ---------------------------------------------------------------- identities
const previousIdentities = await readJson(
  resolve(root, 'src/data/product-identities.json'),
);
const slugify = (value) =>
  value
    .normalize('NFKD')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[^\x20-\x7e]/g, '')
    .toLowerCase()
    .replace(/(\d)\s*(kg|gm|g|ml|l|ltr)\b/g, '$1$2')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
const identities = [];
for (const product of products) {
  const previous = previousIdentities.find(
    (identity) => identity.sourceProductId === product.id,
  );
  const sku = String(product.sku || '').trim();
  const id =
    previous && (!sku || previous.id === `mn-${sku}`)
      ? previous.id
      : sku
        ? `mn-${sku}`
        : previous?.id;
  if (!id)
    throw new Error(
      `Product ${product.id} has no SKU and no previous identity`,
    );
  const slug =
    previous && previous.slug
      ? previous.slug
      : `${slugify(decodeEntities(product.name))}-${sku || product.id}`;
  identities.push({ sourceProductId: product.id, id, slug, sku });
}
if (new Set(identities.map((i) => i.slug)).size !== identities.length)
  throw new Error('Duplicate product slugs');
if (new Set(identities.map((i) => i.id)).size !== identities.length)
  throw new Error('Duplicate product ids');

// ------------------------------------------------------------------ category
const categoryOf = (name) => {
  if (/baby/i.test(name)) return 'baby-care';
  if (/kit|combo|pack with comb|\+ comb/i.test(name)) return 'combo';
  if (/powder|kanji/i.test(name)) return 'herbal-powders';
  if (/hair|shampoo|comb|thali|rosemary|thailam/i.test(name))
    return 'hair-care';
  if (/ghee|honey|chyavan/i.test(name)) return 'wellness';
  return 'skin-care';
};

// ------------------------------------------------------------------- pricing
const money = (product) => {
  const prices = product.prices || {};
  const text = (value) => {
    if (value === undefined || value === null || value === '') return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  };
  return {
    currencyCode: prices.currency_code || 'INR',
    minorUnit: Number(prices.currency_minor_unit ?? 2),
    price: text(prices.price),
    regular: text(prices.regular_price),
    sale: text(prices.sale_price),
    onSale: Boolean(product.on_sale),
  };
};

// ------------------------------------------------------------------ pack size
const packSize = (name) => {
  const match = name.match(
    /(\d+(?:\.\d+)?)\s*(ml|l|ltr|litre|litres|g|gm|kg)\b/i,
  );
  return match ? match[0].replace(/\s+/g, ' ') : null;
};

// --------------------------------------------------------------- text cleanup
const entities = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&rsquo;': '’',
  '&lsquo;': '‘',
  '&ldquo;': '“',
  '&rdquo;': '”',
  '&ndash;': '–',
  '&mdash;': '—',
  '&hellip;': '…',
  '&middot;': '·',
  '&bull;': '•',
  '&trade;': '™',
  '&reg;': '®',
  '&copy;': '©',
  '&deg;': '°',
  '&times;': '×',
  '&frac12;': '½',
  '&frac14;': '¼',
  '&plus;': '+',
  '&percnt;': '%',
  '&dollar;': '$',
  '&equals;': '=',
  '&comma;': ',',
};
const named = (entity) => {
  const key = entity.toLowerCase();
  if (entities[key]) return entities[key];
  const numeric = key.match(/^&#(x?)([0-9a-f]+);$/);
  if (numeric) {
    const code = Number.parseInt(numeric[2], numeric[1] ? 16 : 10);
    return Number.isFinite(code) ? String.fromCodePoint(code) : ' ';
  }
  return null;
};
/** Decode the entities the store's own API publishes, without touching words. */
const decodeEntities = (value) =>
  String(value ?? '').replace(
    /&[a-z#0-9]+;/gi,
    // An entity the store publishes but we do not name is punctuation, not a
    // word: dropping it keeps the sentence readable and the JSON clean.
    (entity) => named(entity) ?? ' ',
  );
const plainText = (html, limit) => {
  if (!html) return '';
  const text = decodeEntities(
    String(html)
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/[ \t\u00a0]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
  return limit && text.length > limit
    ? `${text.slice(0, limit).trim()}…`
    : text;
};

// --------------------------------------------------------------------- media
const identityBySource = new Map(
  identities.map((identity) => [identity.sourceProductId, identity]),
);
const productById = new Map(products.map((product) => [product.id, product]));
const mainAttachments = new Set();
for (const image of images)
  for (const association of image.associations)
    if (association.role === 'main') mainAttachments.add(image.attachmentId);
/** Main pack shots carry a 960 px variant; gallery frames stop at 640 px. */
const widthsFor = (attachmentId) =>
  mainAttachments.has(attachmentId) ? [320, 640, 960] : [320, 640];

const allowedFiles = new Set();
const cacheDir = resolve(
  process.env.MEDIA_CACHE_DIR || '/tmp/mariyas-originals',
);
await mkdir(cacheDir, { recursive: true });
const media = [];
for (const image of images) {
  const product = productById.get(image.associations[0].sourceProductId);
  const identity = identityBySource.get(image.associations[0].sourceProductId);
  if (!product || !identity) {
    // The photograph belongs only to an excluded listing.
    continue;
  }
  const bytes = await readFile(image.cachePath).catch(async () => {
    const local = resolve(cacheDir, basename(image.cachePath));
    return readFile(local);
  });
  const metadata = await sharp(bytes).metadata();
  const id = `product-media-${image.attachmentId}`;
  const folder = `/images/products/${identity.slug}`;
  await mkdir(resolve(root, 'public' + folder), { recursive: true });
  const derivatives = [];
  for (const width of widthsFor(image.attachmentId)) {
    if (width > metadata.width) continue;
    const localAssetPath = `${folder}/${id}-${width}.webp`;
    const output = resolve(root, 'public' + localAssetPath);
    const info = await sharp(bytes)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82, effort: 5 })
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
  if (!derivatives.length)
    throw new Error(`Attachment ${image.attachmentId} produced no derivative`);
  media.push({
    id,
    originalFilename: image.filename,
    width: metadata.width,
    height: metadata.height,
    sourceBytes: image.bytes,
    sourceSha256: image.sha256,
    sourceMediaUrl: image.sourceUrl,
    localAssetPath: derivatives.at(-1).localAssetPath,
    verificationStatus: 'source-verified',
    sources: [
      {
        store: 'com',
        id: image.attachmentId,
        sourceUrl: image.sourceUrl,
        metadataUrl: `${currentStoreOrigin}/wp-json/wp/v2/media/${image.attachmentId}`,
        originalFilename: image.filename,
      },
    ],
    associations: image.associations
      .filter((association) => productById.has(association.sourceProductId))
      .map((association) => ({
        productId: identityBySource.get(association.sourceProductId).id,
        sourceStore: 'com',
        sourceProductId: association.sourceProductId,
        role: association.role,
      })),
    derivatives,
  });
}

const mediaByAttachment = new Map(
  media.map((record) => [record.sources[0].id, record]),
);

// ------------------------------------------------------------------ catalogue
const catalogueProducts = products.map((product) => {
  const identity = identityBySource.get(product.id);
  // Gallery order follows the store listing's own image order.
  const mediaIds = (product.images || [])
    .map((image) => mediaByAttachment.get(image.id)?.id)
    .filter(Boolean);
  return {
    productId: identity.id,
    slug: identity.slug,
    displayName: decodeEntities(product.name),
    category: categoryOf(product.name),
    sources: [
      {
        store: 'com',
        id: product.id,
        name: decodeEntities(product.name),
        sku: String(product.sku || ''),
        slug: product.slug,
        url: product.permalink,
        priceMinor: money(product).price,
        currencyCode: money(product).currencyCode,
        currencyMinorUnit: money(product).minorUnit,
        inStockAtVerification: Boolean(product.is_in_stock),
        categories: (product.categories || []).map((category) => ({
          id: category.id,
          name: decodeEntities(category.name),
          slug: category.slug,
        })),
        attributes: product.attributes || [],
        variations: product.variations || [],
        images: (product.images || []).map((image) => ({
          id: image.id,
          catalogueUrl: image.src,
          alt: image.alt || '',
        })),
      },
    ],
    variants: [],
    verificationStatus: 'source-verified',
    mediaIds,
    missing: mediaIds.length
      ? []
      : [
          'The official store publishes no product photograph for this listing; the site shows a labelled empty frame instead of another product’s packaging.',
        ],
  };
});

const verifiedOn = today;
const catalogueSource = {
  schemaVersion: 4,
  sourcePolicy: mediaPolicy,
  verifiedOn,
  store: 'com',
  endpoints: {
    com: `${currentStoreOrigin}/wp-json/wc/store/v1/products?per_page=100`,
  },
  reportedTotals: { com: products.length + exclusions.size },
  exclusions: [...exclusions].map(([id, reason]) => ({ id, reason })),
  records: products.map((product) => ({
    store: 'com',
    id: product.id,
    name: decodeEntities(product.name),
    sku: String(product.sku || ''),
    slug: product.slug,
    url: product.permalink,
    type: product.type,
    prices: money(product),
    inStockAtVerification: Boolean(product.is_in_stock),
    categories: (product.categories || []).map((category) => ({
      id: category.id,
      name: decodeEntities(category.name),
      slug: category.slug,
    })),
    attributes: product.attributes || [],
    variations: product.variations || [],
    images: (product.images || []).map((image) => ({
      id: image.id,
      catalogueUrl: image.src,
    })),
  })),
  attachments: images
    .filter((image) => mediaByAttachment.has(image.attachmentId))
    .map((image) => ({
      store: 'com',
      id: image.attachmentId,
      sourceUrl: image.sourceUrl,
      metadataUrl: `${currentStoreOrigin}/wp-json/wp/v2/media/${image.attachmentId}`,
    })),
};

const manifest = {
  schemaVersion: 4,
  sourcePolicy: mediaPolicy,
  status: 'official-com-catalogue-with-local-derivatives',
  verifiedOn,
  sourceWebsites: [currentStoreOrigin],
  catalogueVerified: true,
  scope:
    'Official .com catalogue only. Every product photograph is the exact store attachment for that listing; a listing without a photograph shows a labelled empty frame.',
  products: catalogueProducts,
  media,
  coverage: {
    primaryStoreEntries: catalogueProducts.length,
    distinctProductFamilies: catalogueProducts.length,
    explicitSizeVariants: 0,
    productsWithMainImages: catalogueProducts.filter((p) => p.mediaIds.length)
      .length,
    productsMissingMainImages: catalogueProducts.filter(
      (p) => !p.mediaIds.length,
    ).length,
    sourceAttachmentsDownloaded: media.length,
    uniqueSourceImages: media.length,
    responsiveDerivatives: media.reduce((n, m) => n + m.derivatives.length, 0),
    localMediaBytes: media.reduce(
      (n, m) => n + m.derivatives.reduce((a, d) => a + d.bytes, 0),
      0,
    ),
  },
};
assertApprovedMedia(manifest);

// -------------------------------------------------------------- brand artwork
const brandManifest = await readJson(
  resolve(root, 'src/data/brand-media.json'),
);
brandManifest.sourcePolicy = mediaPolicy;
assertApprovedMedia({
  sourcePolicy: mediaPolicy,
  media: brandManifest.media,
  products: [],
});

// -------------------------------------------------------------- care facts
const careKnowledge = {
  schemaVersion: 1,
  sourcePolicy: mediaPolicy,
  verifiedOn,
  sourceOrigin: currentStoreOrigin,
  readFrom: `${currentStoreOrigin}/wp-json/wc/store/v1/products`,
  policy: [
    'Every answer comes from the official store listing for that product. Nothing is diagnosed, prescribed or estimated.',
    'Prices, stock and pack sizes are a snapshot taken on the verification date; the store listing is always the authority.',
    'For a medical condition, pregnancy, an infant or a known allergy, the answer points to a qualified practitioner instead of guessing.',
  ],
  house: {
    name: 'Mariyas Naturals',
    storeUrl: `${currentStoreOrigin}/shop/`,
    categories: [...new Set(catalogueProducts.map((p) => p.category))].sort(),
  },
  products: catalogueProducts.map((record) => {
    const product = productById.get(record.sources[0].id);
    const prices = money(product);
    return {
      id: record.productId,
      slug: record.slug,
      name: record.displayName,
      category: record.category,
      packSize: packSize(record.displayName),
      storeUrl: record.sources[0].url,
      inStock: Boolean(product.is_in_stock),
      prices,
      mediaId: record.mediaIds[0] ?? null,
      categories: record.sources[0].categories.map((c) => c.name),
      attributes: record.sources[0].attributes
        .map((attribute) => ({
          name: decodeEntities(attribute.name),
          terms: (attribute.terms || []).map((term) =>
            decodeEntities(term.name),
          ),
        }))
        .filter((attribute) => attribute.terms.length),
      summary: plainText(product.short_description, 320),
      details: plainText(product.description, 1600),
      keywords: [
        ...new Set(
          [
            record.displayName,
            record.category,
            record.sources[0].sku,
            packSize(record.displayName),
            ...record.sources[0].categories.map((c) => c.name),
            ...record.sources[0].attributes.flatMap((attribute) => [
              attribute.name,
              ...(attribute.terms || []).map((term) => term.name),
            ]),
          ]
            .filter(Boolean)
            .map((value) => String(value).toLowerCase()),
        ),
      ],
    };
  }),
};

// --------------------------------------------------------------------- write
await writeJson(
  resolve(root, 'catalogue/catalogue-source.json'),
  catalogueSource,
);
await writeJson(
  resolve(root, 'src/data/product-identities.json'),
  identities.map(({ sku, ...identity }) => identity),
);
await writeJson(resolve(root, 'catalogue/media-manifest.json'), manifest);
// A URL-free index for client components: id → local derivative, width, height.
await writeJson(
  resolve(root, 'catalogue/media-index.json'),
  media.map(({ id, localAssetPath, width, height }) => ({
    id,
    path: localAssetPath,
    width,
    height,
  })),
);
await writeJson(resolve(root, 'src/data/brand-media.json'), brandManifest);
await writeJson(resolve(root, 'catalogue/care-knowledge.json'), careKnowledge);

async function prune(directory) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(
    () => [],
  );
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      await prune(path);
      if (!(await readdir(path)).length) await rm(path, { recursive: true });
    } else if (!allowedFiles.has(path)) await rm(path);
  }
}
await prune(resolve(root, 'public/images/products'));

const missing = catalogueProducts.filter((product) => !product.mediaIds.length);
const report = `# Official store sync — ${verifiedOn}

Owner-authorised read of the public WooCommerce Store API at \`${currentStoreOrigin}\`.
The acquisition job (\`scripts/fetch-com-snapshot.mjs\`) downloads the JSON and the
untouched original binaries; this report describes what the site now holds.

## Catalogue

| Fact | Value |
| --- | --- |
| Products read | ${products.length + exclusions.size} |
| Products published | ${catalogueProducts.length} |
| Excluded | ${exclusions.size} — ${[...exclusions].map(([id]) => `#${id}`).join(', ') || 'none'} |
| Products with an official photograph | ${manifest.coverage.productsWithMainImages} |
| Products without one (labelled empty frame) | ${missing.length} |
| Distinct store attachments | ${media.length} |
| Local WebP derivatives | ${manifest.coverage.responsiveDerivatives} |
| Local derivative bytes | ${manifest.coverage.localMediaBytes} |

## Exclusions

${[...exclusions].map(([id, reason]) => `- **#${id}** — ${reason}`).join('\n') || '- none'}

## Derivative sizes

Main images are published at 320 / 640 / 960 px wide, gallery images at 320 / 640 px,
WebP quality 82, never enlarged, aspect ratio preserved (no crop). Each derivative
records its own SHA-256 in \`catalogue/media-manifest.json\`.

## Listings without an official photograph

${missing.map((product) => `- ${product.displayName} (\`${product.slug}\`)`).join('\n') || '- none'}

## Owner note

The owner-signed release tools in \`ops/\` pin the previous image inventory. They are
untouched by this sync and must be re-pinned by the owner before the next
owner-signed release; every other validation path reads
\`catalogue/media-manifest.json\`.
`;
await writeFile(resolve(root, 'docs/official-store-sync.md'), report);

console.log(
  JSON.stringify(
    {
      productsPublished: catalogueProducts.length,
      excluded: [...exclusions.keys()],
      productsWithImages: manifest.coverage.productsWithMainImages,
      productsWithoutImages: missing.length,
      attachments: media.length,
      derivatives: manifest.coverage.responsiveDerivatives,
      localMediaBytes: manifest.coverage.localMediaBytes,
    },
    null,
    2,
  ),
);
