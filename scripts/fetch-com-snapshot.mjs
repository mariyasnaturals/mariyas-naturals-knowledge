/**
 * Network-only acquisition of the official .com catalogue snapshot.
 *
 * This script is the ONLY place that talks to mariyasnaturals.com. It runs in
 * GitHub Actions (the build sandbox has no egress to the store) and writes:
 *
 *   <SNAPSHOT_DIR>/products.json   raw WooCommerce Store API product records
 *   <SNAPSHOT_DIR>/images.json     every product attachment, with associations
 *   <SNAPSHOT_DIR>/images/*        the untouched original binaries
 *   <SNAPSHOT_DIR>/snapshot.json   what was fetched, when, and from where
 *
 * It never writes into the repository and never derives or edits site data.
 * `scripts/sync-com-catalogue.mjs` turns the downloaded snapshot into the
 * approved local manifests and WebP derivatives.
 */
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';

const ORIGIN = (process.env.SOURCE_ORIGIN || 'https://www.mariyasnaturals.com').replace(/\/$/, '');
const OUT = resolve(process.env.SNAPSHOT_DIR || '/tmp/com-snapshot');
const MAX_IMAGES = Number(process.env.SNAPSHOT_MAX_IMAGES || 600);
const MAX_BYTES = 14_000_000;
const CONCURRENCY = 5;
const HEADERS = {
  'user-agent':
    'mariyas-catalogue-sync/1.0 (+https://www.mariyasnaturals.cloud; owner-authorised read of the public store API)',
  accept: 'application/json,image/webp,image/jpeg,image/png;q=0.9,*/*;q=0.5',
};

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

async function getJson(url, attempt = 1) {
  const response = await fetch(url, { headers: HEADERS, redirect: 'follow' });
  if (!response.ok) {
    if (attempt < 4) {
      await sleep(1200 * attempt);
      return getJson(url, attempt + 1);
    }
    throw new Error(`${url}: HTTP ${response.status}`);
  }
  return { body: await response.json(), headers: response.headers };
}

async function getBinary(url, attempt = 1) {
  const response = await fetch(url, { headers: HEADERS, redirect: 'follow' });
  if (!response.ok) {
    if (attempt < 4) {
      await sleep(1200 * attempt);
      return getBinary(url, attempt + 1);
    }
    throw new Error(`${url}: HTTP ${response.status}`);
  }
  if (new URL(response.url).origin !== ORIGIN)
    throw new Error(`Redirect left the approved origin: ${response.url}`);
  const type = response.headers.get('content-type') || '';
  if (!/^image\//.test(type))
    throw new Error(`${url}: unexpected content type ${type}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length || bytes.length > MAX_BYTES)
    throw new Error(`${url}: ${bytes.length} bytes is outside the accepted range`);
  return { bytes, type };
}

async function allProducts() {
  const records = [];
  const pages = [];
  for (let page = 1; page <= 10; page += 1) {
    const url = `${ORIGIN}/wp-json/wc/store/v1/products?per_page=100&page=${page}&orderby=id&order=asc`;
    const { body, headers } = await getJson(url);
    pages.push({ url, count: Array.isArray(body) ? body.length : 0, total: headers.get('x-wp-total') });
    if (!Array.isArray(body) || !body.length) break;
    records.push(...body);
    if (body.length < 100) break;
  }
  return { records, pages };
}

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const index = next++;
        results[index] = await worker(items[index], index);
      }
    }),
  );
  return results;
}

await mkdir(resolve(OUT, 'images'), { recursive: true });

const { records, pages } = await allProducts();
if (!records.length) throw new Error('The store API returned no products');
const unique = new Map();
for (const record of records) unique.set(record.id, record);
const products = [...unique.values()].sort((a, b) => a.id - b.id);

// Every attachment, keyed the way the store API publishes it: the media id
// plus the exact uploads URL. A single file can serve several products.
const attachments = new Map();
const reportedTotals = pages.at(-1)?.total ? Number(pages.at(-1).total) : null;
for (const product of products) {
  const images = Array.isArray(product.images) ? product.images : [];
  for (const [position, image] of images.entries()) {
    if (!image?.src || !image?.id)
      throw new Error(`Product ${product.id} publishes an image without an id`);
    const url = new URL(image.src);
    if (url.origin !== ORIGIN || !url.pathname.startsWith('/wp-content/uploads/'))
      throw new Error(`Unapproved product image host: ${image.src}`);
    const key = String(image.id);
    const current = attachments.get(key) || {
      attachmentId: image.id,
      sourceUrl: image.src,
      filename: decodeURIComponent(url.pathname.split('/').pop()),
      alt: image.alt || '',
      name: image.name || '',
      associations: [],
    };
    current.associations.push({
      sourceProductId: product.id,
      role: position === 0 ? 'main' : 'gallery',
      position,
    });
    attachments.set(key, current);
  }
}

const list = [...attachments.values()].sort((a, b) => a.attachmentId - b.attachmentId);
if (list.length > MAX_IMAGES)
  throw new Error(`${list.length} images exceeds the ${MAX_IMAGES} image budget`);

const downloads = await mapLimit(list, CONCURRENCY, async (attachment) => {
  const { bytes, type } = await getBinary(attachment.sourceUrl);
  const extension = extname(new URL(attachment.sourceUrl).pathname) || '.webp';
  const file = resolve(OUT, 'images', `${attachment.attachmentId}${extension}`);
  await writeFile(file, bytes);
  return {
    ...attachment,
    mediaType: type,
    bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    cachePath: file,
  };
});

const fetchedAt = new Date().toISOString();
await writeFile(resolve(OUT, 'products.json'), JSON.stringify(products, null, 2));
await writeFile(resolve(OUT, 'images.json'), JSON.stringify(downloads, null, 2));
await writeFile(
  resolve(OUT, 'snapshot.json'),
  JSON.stringify(
    {
      schemaVersion: 1,
      purpose: 'Owner-authorised read of the public .com store API for the .cloud discovery site.',
      origin: ORIGIN,
      fetchedAt,
      endpoints: {
        products: `${ORIGIN}/wp-json/wc/store/v1/products?per_page=100&page=*`,
      },
      pages,
      reportedTotalProducts: reportedTotals,
      productCount: products.length,
      attachmentCount: downloads.length,
      totalBytes: downloads.reduce((total, image) => total + image.bytes, 0),
      productsWithImages: products.filter((p) => (p.images || []).length).length,
      productsWithoutImages: products.filter((p) => !(p.images || []).length).map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
      })),
    },
    null,
    2,
  ),
);

console.log(
  JSON.stringify(
    {
      origin: ORIGIN,
      fetchedAt,
      products: products.length,
      reportedTotalProducts: reportedTotals,
      attachments: downloads.length,
      totalBytes: downloads.reduce((total, image) => total + image.bytes, 0),
      productsWithoutImages: products.filter((p) => !(p.images || []).length).length,
    },
    null,
    2,
  ),
);
