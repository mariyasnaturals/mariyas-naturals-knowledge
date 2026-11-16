import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import {
  detectIntents,
  searchProducts,
  formatMoney,
  normalise,
} from '../src/data/care-search.mjs';

const json = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const knowledge = json('../catalogue/care-knowledge.json');
const manifest = json('../catalogue/media-manifest.json');
const catalogue = json('../catalogue/catalogue-source.json');

/** Mirrors `src/data/care-index.ts` so the test sees exactly the shipped shape. */
const products = knowledge.products.map((product) => ({
  id: product.id,
  slug: product.slug,
  name: product.name,
  category: product.category,
  packSize: product.packSize,
  storeUrl: product.storeUrl,
  inStock: product.inStock,
  prices: product.prices,
  summary: product.summary,
  details: product.details,
  keywords: product.keywords,
  mediaId: product.mediaId,
}));
const careImage = (product, width = 320) =>
  product.mediaId
    ? `/images/products/${product.slug}/${product.mediaId}-${width}.webp`
    : null;

test('every care answer quotes the official store, never an invented fact', () => {
  assert.equal(knowledge.schemaVersion, 1);
  assert.equal(knowledge.sourceOrigin, 'https://www.mariyasnaturals.com');
  assert.equal(knowledge.verifiedOn, catalogue.verifiedOn);
  assert.equal(products.length, 85);
  assert.ok(knowledge.policy.length >= 3);

  const records = new Map(catalogue.records.map((record) => [record.id, record]));
  for (const product of products) {
    assert.ok(product.name && product.slug && product.storeUrl);
    assert.equal(new URL(product.storeUrl).origin, 'https://www.mariyasnaturals.com');
    assert.match(product.storeUrl, /^https:\/\/www\.mariyasnaturals\.com\/product\//);
    // No HTML or undecoded entities leak into an answer.
    for (const text of [product.name, product.summary, product.details])
      assert.doesNotMatch(text, /<[^>]+>|&#?\w+;/);

    const store = records.get(
      catalogue.records.find((record) => record.url === product.storeUrl)?.id,
    );
    assert.ok(store, `${product.slug} must exist in the catalogue snapshot`);
    assert.equal(product.prices.price, store.prices.price);
    assert.equal(product.prices.regular, store.prices.regular);
    assert.equal(product.prices.currencyCode, 'INR');
    assert.equal(product.inStock, store.inStockAtVerification);
  }
});

test('a media id always resolves to a real local derivative of that product', () => {
  const media = new Map(manifest.media.map((record) => [record.id, record]));
  let withImages = 0;
  for (const product of products) {
    if (!product.mediaId) continue;
    withImages += 1;
    const record = media.get(product.mediaId);
    assert.ok(record, `${product.mediaId} is not in the media manifest`);
    const path = careImage(product);
    assert.ok(path);
    assert.ok(
      record.derivatives.some((d) => d.localAssetPath === path),
      `${path} is not an approved derivative`,
    );
    assert.ok(
      existsSync(new URL('../public' + path, import.meta.url)),
      `${path} is not on disk`,
    );
    assert.ok(
      record.associations.some(
        (association) => association.productId === product.id,
      ),
      'the photograph must belong to this listing',
    );
  }
  assert.equal(withImages, manifest.coverage.productsWithMainImages);
  assert.equal(withImages, 59);
});

test('product lookup finds the right listing in English and in Indic scripts', () => {
  const names = (query) => searchProducts(products, query).map((p) => p.name);

  assert.equal(names('hair oil 500 ml')[0], 'Mariyas Herbal Hair Care – 500 ml');
  assert.ok(names('hair oil').length > 0);
  assert.ok(names('hair oil 500').some((name) => name.includes('500 ml')));
  assert.equal(names('chyavanaprash')[0], 'Chyavanaprash');
  assert.equal(names('baby massage')[0], 'Baby Massage Oil 200 ml');
  assert.ok(names('shampoo').length > 0);
  // A query typed in an Indic script finds the English store listing.
  assert.equal(names('मालिश')[0], 'Baby Massage Oil 200 ml');
  assert.equal(names('മസാജ്')[0], 'Baby Massage Oil 200 ml');
  assert.match(names('शैम्पू')[0], /Shampoo/);
  assert.match(names('ഷാംപൂ')[0], /Shampoo/);
  assert.deepEqual(names('zzzz not a product'), []);
  assert.deepEqual(searchProducts(products, '   '), []);
});

test('intents separate a product question from a medical one', () => {
  assert.ok(detectIntents('is it safe during pregnancy').includes('safety'));
  assert.ok(detectIntents('can I use this on my newborn').includes('safety'));
  assert.ok(detectIntents('my baby has a rash, is this ok?').includes('safety'));
  assert.ok(detectIntents('how much is the hair oil').includes('price'));
  assert.ok(detectIntents('do you deliver to Kottayam').includes('shipping'));
  assert.ok(detectIntents('how do I use the hair oil').includes('use'));
  assert.ok(detectIntents('what ingredients are in it').includes('ingredients'));
  assert.ok(detectIntents('whatsapp number').includes('contact'));
  // A product name must not be mistaken for a safety question.
  const plain = detectIntents('baby hair oil');
  assert.equal(plain.includes('safety'), false);
  assert.equal(detectIntents('hair oil price').includes('safety'), false);
  assert.equal(normalise('  Hair  OIL '), 'hair oil');
});

test('prices render from store minor units without inventing a value', () => {
  assert.equal(formatMoney(54000, 2, 'INR'), '₹540');
  assert.equal(formatMoney(135000, 2, 'INR'), '₹1,350');
  assert.equal(formatMoney(null, 2, 'INR'), null);
  assert.equal(formatMoney(undefined, 2, 'INR'), null);
});

test('the assistant speaks all five locales with complete templates', () => {
  const source = readFileSync(
    new URL('../src/data/care-assistant.ts', import.meta.url),
    'utf8',
  );
  for (const locale of ['en', 'ml', 'hi', 'ta', 'kn']) {
    assert.match(source, new RegExp(`\\b${locale}: \\{`), `${locale} copy`);
  }
  for (const key of [
    'greet',
    'price',
    'noPrice',
    'inStock',
    'outOfStock',
    'size',
    'use',
    'noUse',
    'ingredients',
    'safety',
    'shipping',
    'contact',
    'notFound',
    'seeListing',
  ])
    assert.ok(
      (source.match(new RegExp(`${key}:`, 'g')) || []).length >= 5,
      `${key} needs a string in every locale`,
    );
  // Placeholders the component substitutes must exist in their templates.
  assert.match(source, /price: 'The official listing price is \{price\}/);
  assert.match(source, /size: 'Pack size: \{size\}/);
  assert.match(source, /use: 'What the official listing says: \{details\}/);
  assert.ok(knowledge.products.some((product) => product.packSize));
});
