/**
 * Project the care-assistant knowledge down to the publicly visible listings.
 *
 * `catalogue/care-knowledge.json` keeps every record we hold (85 today),
 * including the 26 the owner has hidden pending genuine photography. The
 * assistant runs in the browser, so shipping that file would put hidden
 * listings into a public asset even though the UI filtered them out at runtime.
 *
 * This script applies the owner's visibility policy
 * (`src/data/product-visibility.json`) at build time and writes
 * `catalogue/care-knowledge-public.json`, which is what the browser loads.
 *
 * It is derived, never authoritative: the visibility policy decides what is
 * public, and `tests/visibility.test.mjs` fails if the generated file is stale,
 * so a synchronisation that adds records cannot silently publish them.
 *
 * Usage: node scripts/build-care-public.mjs   (runs as `prebuild`)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { format } from 'prettier';

const root = resolve(import.meta.dirname, '..');
const read = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));

const knowledge = read('catalogue/care-knowledge.json');
const visibility = read('src/data/product-visibility.json');

const hiddenSlugs = new Set(visibility.hidden.map((item) => item.slug));
const hiddenIds = new Set(visibility.hidden.map((item) => item.storeProductId));

const published = knowledge.products.filter(
  (product) => !hiddenSlugs.has(product.slug),
);
const withheld = knowledge.products.filter((product) =>
  hiddenSlugs.has(product.slug),
);

// A visibility entry that matches nothing is a stale policy; fail loudly rather
// than quietly publishing a stale catalogue.
const unmatched = visibility.hidden.filter(
  (item) => !knowledge.products.some((product) => product.slug === item.slug),
);
if (unmatched.length > 0) {
  throw new Error(
    `Visibility policy names listings that are not in the catalogue: ${unmatched
      .map((item) => `${item.storeProductId}/${item.slug}`)
      .join(', ')}`,
  );
}
if (withheld.length !== hiddenIds.size) {
  throw new Error(
    `Expected ${hiddenIds.size} hidden listings in the catalogue, found ${withheld.length}`,
  );
}

const output = {
  schemaVersion: knowledge.schemaVersion ?? 1,
  note:
    'Derived from catalogue/care-knowledge.json by scripts/build-care-public.mjs. ' +
    'Only listings the owner has made publicly visible; the full record set stays ' +
    'in care-knowledge.json. Do not edit by hand.',
  verifiedOn: knowledge.verifiedOn,
  sourceOrigin: knowledge.sourceOrigin,
  policy: knowledge.policy,
  counts: {
    catalogueRecords: knowledge.products.length,
    publiclyVisible: published.length,
    hiddenPendingPhoto: withheld.length,
  },
  products: published,
};

const text = await format(JSON.stringify(output), { parser: 'json' });
writeFileSync(join(root, 'catalogue/care-knowledge-public.json'), text);
console.log(
  `PASS care public index: ${published.length} visible of ${knowledge.products.length} records, ` +
    `${withheld.length} hidden pending photography.`,
);
