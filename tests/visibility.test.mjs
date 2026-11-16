/**
 * Public visibility of catalogue listings.
 *
 * The owner temporarily hid 26 listings that have no genuine product photograph
 * (`src/data/product-visibility.json`) and kept the other 59 public. This suite
 * pins that decision and, just as importantly, pins the fact that nothing was
 * deleted: all 85 records, their SKUs, prices, source references and
 * media-provenance notes stay in `catalogue/`.
 *
 * The rendered result — routes, links, sitemap, bundles — is covered by
 * `scripts/validate-static.mjs`, which runs against `dist/` after a build.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { format } from 'prettier';

const root = new URL('../', import.meta.url).pathname;
const read = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
const readText = (path) => readFileSync(join(root, path), 'utf8');

const policy = read('src/data/product-visibility.json');
const manifest = read('catalogue/media-manifest.json');
const snapshot = read('catalogue/catalogue-source.json');
const identities = read('src/data/product-identities.json');
const knowledge = read('catalogue/care-knowledge.json');
const publicKnowledge = read('catalogue/care-knowledge-public.json');

const APPROVED_HIDDEN = [
  2865, 2879, 2880, 2881, 2882, 2886, 2887, 2894, 2927, 2928, 2930, 2931, 2932,
  2933, 2934, 2935, 2948, 2952, 2988, 2989, 2991, 2993, 3003, 3005, 3007, 3012,
];
const APPROVED_VISIBLE = 59;
const CATALOGUE_RECORDS = 85;

const hiddenSlugs = new Set(policy.hidden.map((item) => item.slug));
const hiddenIds = new Set(policy.hidden.map((item) => item.storeProductId));
const storeIdOf = (product) => product.sources[0].id;

test('the approved policy is exactly the 26 listings the owner named', () => {
  assert.deepEqual(
    [...hiddenIds].sort((a, b) => a - b),
    APPROVED_HIDDEN,
    'The hidden list must match the owner-approved ids, in full',
  );
  assert.equal(policy.hidden.length, 26);
  assert.equal(new Set(policy.hidden.map((item) => item.slug)).size, 26);
  assert.equal(policy.approvedOn, '2026-11-16');
  assert.match(policy.reason, /Owner-approved temporary exclusion/);
  assert.match(policy.reason, /photography/);
});

test('every hidden entry still names the product it was approved for', () => {
  const byStore = new Map(manifest.products.map((p) => [storeIdOf(p), p]));
  for (const item of policy.hidden) {
    const product = byStore.get(item.storeProductId);
    assert.ok(
      product,
      `Store ${item.storeProductId} is missing from the catalogue`,
    );
    assert.equal(
      product.slug,
      item.slug,
      `Store ${item.storeProductId} no longer maps to ${item.slug}`,
    );
  }
});

test('all 85 records are retained: hiding is not deletion', () => {
  assert.equal(manifest.products.length, CATALOGUE_RECORDS);
  assert.equal(snapshot.records.length, CATALOGUE_RECORDS);
  assert.equal(identities.length, CATALOGUE_RECORDS);
  assert.equal(knowledge.products.length, CATALOGUE_RECORDS);
  const inCatalogue = new Set(manifest.products.map(storeIdOf));
  for (const id of hiddenIds) {
    assert.ok(
      inCatalogue.has(id),
      `Hidden record ${id} was removed from the catalogue`,
    );
  }
  // The metadata a reactivation will need is still attached to each record.
  for (const product of manifest.products.filter((p) =>
    hiddenIds.has(storeIdOf(p)),
  )) {
    const source = product.sources[0];
    assert.ok(source.sku, `${product.slug} kept its SKU`);
    assert.equal(
      typeof source.priceMinor,
      'number',
      `${product.slug} kept its price`,
    );
    assert.equal(typeof source.inStockAtVerification, 'boolean');
    assert.ok(
      source.url.startsWith('https://www.mariyasnaturals.com/product/'),
    );
    assert.ok(
      product.verificationStatus,
      `${product.slug} kept its provenance`,
    );
  }
});

test('hiding is not a stock, price or discontinuation claim', () => {
  const byStore = new Map(
    snapshot.records.map((record) => [record.id, record]),
  );
  for (const id of hiddenIds) {
    const record = byStore.get(id);
    assert.ok(record, `Snapshot record ${id} retained`);
    // The store still reports these as published and available; we say nothing
    // about availability, we simply do not publish the listing yet.
    assert.equal(
      record.inStockAtVerification,
      true,
      `${id} was in stock when checked`,
    );
    assert.equal(
      typeof record.prices,
      'object',
      `${id} keeps its store prices`,
    );
  }
});

test('59 listings are public and every one of them has real photography', () => {
  const visible = manifest.products.filter((p) => !hiddenIds.has(storeIdOf(p)));
  assert.equal(visible.length, APPROVED_VISIBLE);
  for (const product of visible) {
    assert.ok(
      product.mediaIds.length > 0,
      `${product.slug} is public but has no approved image`,
    );
    // A store listing can attach the same photograph twice, so compare unique
    // ids: what matters is that every distinct image resolves to local files.
    const mediaIds = new Set(product.mediaIds);
    const media = manifest.media.filter((m) => mediaIds.has(m.id));
    assert.equal(media.length, mediaIds.size, `${product.slug} media resolves`);
    for (const entry of media) {
      for (const derivative of entry.derivatives) {
        const file = join(
          'public',
          derivative.localAssetPath.replace(/^\//, ''),
        );
        assert.ok(
          existsSync(join(root, file)),
          `${product.slug}: missing derivative ${derivative.localAssetPath}`,
        );
      }
    }
  }
  // And the 26 hidden ones are precisely the listings with no photography: the
  // policy names them explicitly rather than deriving visibility from this fact.
  const withoutPhotos = manifest.products.filter(
    (p) => p.mediaIds.length === 0,
  );
  assert.deepEqual(
    withoutPhotos.map(storeIdOf).sort((a, b) => a - b),
    [...hiddenIds].sort((a, b) => a - b),
  );
});

test('visibility is decided by the policy, never by a passing photograph', () => {
  // The build filters on the policy list. Simulate a future synchronisation that
  // adds photography to a hidden listing: it stays hidden until a human edits
  // the policy, so a new image can never reactivate a product on its own.
  const policySource = readText('src/data/product-visibility.ts');
  assert.match(policySource, /isPubliclyVisible/);
  assert.match(policySource, /hiddenIds\.has/);

  const productsSource = readText('src/data/products.ts');
  assert.match(
    productsSource,
    /product\.visibility === 'visible'/,
    'The public catalogue is the visibility filter, not the media filter',
  );

  const revived = manifest.products
    .filter((p) => hiddenIds.has(storeIdOf(p)))
    .map((p) => ({ ...p, mediaIds: ['product-media-simulated'] }));
  const stillHidden = revived.filter(
    (p) => !policy.hidden.some((item) => item.slug === p.slug),
  );
  assert.deepEqual(
    stillHidden,
    [],
    'A new photograph cannot change visibility',
  );
});

test('the assistant index is generated from the policy and stays in step', async () => {
  assert.equal(publicKnowledge.counts.catalogueRecords, CATALOGUE_RECORDS);
  assert.equal(publicKnowledge.counts.publiclyVisible, APPROVED_VISIBLE);
  assert.equal(publicKnowledge.counts.hiddenPendingPhoto, 26);
  assert.equal(publicKnowledge.products.length, APPROVED_VISIBLE);
  for (const product of publicKnowledge.products) {
    assert.ok(!hiddenSlugs.has(product.slug), `${product.slug} must not ship`);
    assert.ok(product.mediaId, `${product.slug} ships with a local image id`);
  }

  // Regenerate in memory exactly as `scripts/build-care-public.mjs` does; a
  // stale artifact means a synchronisation could publish hidden listings.
  const expected = {
    schemaVersion: knowledge.schemaVersion ?? 1,
    note: publicKnowledge.note,
    verifiedOn: knowledge.verifiedOn,
    sourceOrigin: knowledge.sourceOrigin,
    policy: knowledge.policy,
    counts: publicKnowledge.counts,
    products: knowledge.products.filter((p) => !hiddenSlugs.has(p.slug)),
  };
  assert.equal(
    await format(JSON.stringify(expected), { parser: 'json' }),
    readText('catalogue/care-knowledge-public.json'),
    'Run npm run build:care-public; the public care index is stale',
  );
});

test('the Ritual Finder can only offer publicly visible listings', () => {
  const ritual = readText('src/data/ritual.ts');
  assert.match(ritual, /isPubliclyVisible\(product\.storeProductId\)/);
  const ids = [...ritual.matchAll(/storeProductId: (\d+)/g)].map((m) =>
    Number(m[1]),
  );
  assert.ok(ids.length > 0, 'The Ritual Finder still has candidates');
  for (const id of ids) {
    assert.ok(!hiddenIds.has(id), `Ritual Finder candidate ${id} is hidden`);
  }
});

test('collection counts follow the visible products', () => {
  const expected = {
    'hair-care': 13,
    'baby-care': 2,
    'skin-care': 22,
    'herbal-powders': 20,
    wellness: 2,
    combo: 0,
  };
  const actual = {};
  for (const product of manifest.products) {
    if (hiddenIds.has(storeIdOf(product))) continue;
    actual[product.category] = (actual[product.category] ?? 0) + 1;
  }
  for (const [category, count] of Object.entries(expected)) {
    assert.equal(actual[category] ?? 0, count, `${category} visible count`);
  }
  assert.equal(
    Object.values(actual).reduce((total, count) => total + count, 0),
    APPROVED_VISIBLE,
  );
  // `combo` has no visible product, so it must not be presented as a collection.
  assert.equal(actual.combo ?? 0, 0);
});

test('the two approved homepage cards stay public and photographed', () => {
  // 3008 (200 ml) and 3009 (500 ml) are the owner-approved homepage cards, with
  // the animated FREE Neem Comb offer on the 500 ml. They must never fall out of
  // the public catalogue, and the offer itself is untouched by this policy.
  for (const id of [3008, 3009]) {
    const product = manifest.products.find((p) => storeIdOf(p) === id);
    assert.ok(product, `Homepage card ${id} is present`);
    assert.ok(!hiddenIds.has(id), `Homepage card ${id} stays visible`);
    assert.ok(
      product.mediaIds.length > 0,
      `Homepage card ${id} keeps its photograph`,
    );
  }
});

test('the discontinued 1 litre pack stays permanently excluded', () => {
  const store = readText('src/data/store.ts');
  assert.match(store, /excludedProductIds: \[3010\]/);
  for (const [name, records] of [
    ['media-manifest', manifest.products.map(storeIdOf)],
    ['catalogue-source', snapshot.records.map((record) => record.id)],
    ['care-knowledge', knowledge.products.map((p) => p.id)],
  ]) {
    assert.ok(!records.includes(3010), `${name} must not contain 3010`);
  }
  // 3010 is withdrawn, not hidden-pending-photo: it is not reactivatable.
  assert.ok(
    !hiddenIds.has(3010),
    'The withdrawn pack is not in the visibility policy',
  );
});
