/**
 * SEO / AEO / GEO content gates.
 *
 * These pin the rules that are easy to break by accident and expensive to get
 * wrong in public: an unverified claim must not be publishable, an unverified
 * award or certificate must not be indexable, the pillar must exist in all five
 * languages with its purchase links, and the assistant must never surface a
 * hidden listing.
 *
 * `scripts/validate-seo.mjs` checks the built HTML; this suite checks the data
 * and the copy before a build ever runs, so a mistake fails fast.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const root = new URL('../', import.meta.url).pathname;
const text = (path) => readFileSync(join(root, path), 'utf8');
const json = (path) => JSON.parse(text(path));
const LOCALES = ['en', 'ml', 'hi', 'ta', 'kn'];

const gates = text('src/data/knowledge-gates.ts');
const evidence = text('src/data/evidence.ts');
const pillar = text('src/data/pillar.ts');
const assistant = text('src/data/care-assistant.ts');
const search = text('src/data/care-search.mjs');
const publication = json('src/data/evidence-publication.json');

/** Pulls a locale's block out of a `Record<Locale, …>` literal. */
const localeBlocks = (source) => {
  const blocks = {};
  const parts = source.split(/^  (en|ml|hi|ta|kn): \{/m);
  for (let index = 1; index < parts.length; index += 2)
    blocks[parts[index]] = parts[index + 1];
  return blocks;
};

const claimBlock = (id) => {
  const start = gates.indexOf(`id: '${id}'`);
  assert.notEqual(start, -1, `claim ${id} is missing from the registry`);
  return gates.slice(start, gates.indexOf('\n  },', start));
};

test('the 60-ingredient claim is registered but not publishable', () => {
  const claim = claimBlock('hair-oil-60-ingredients');
  assert.match(claim, /status: 'pending-verification'/);
  assert.match(
    claim,
    /approximately 50 herbs/,
    'the .com conflict must stay documented',
  );
  assert.match(claim, /evidenceRequired/);
});

test('wording is only rendered for claims that are published', () => {
  const statuses = [...gates.matchAll(/status: '([a-z-]+)'/g)].map(
    (match) => match[1],
  );
  assert.ok(statuses.includes('pending-verification'));
  assert.ok(statuses.includes('not-approved'));

  // The registry may hold the sentence we *would* publish — that is what makes it
  // reviewable. What matters is that no page or component asks for it.
  const consumers = ['src/pages', 'src/components'];
  const used = [];
  const walk = (dir) => {
    for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(path);
      else if (/\.(astro|ts|mjs)$/.test(entry.name)) {
        const source = text(path);
        for (const match of source.matchAll(/claimText\('([a-z0-9-]+)'/g))
          used.push({ path, id: match[1] });
      }
    }
  };
  for (const dir of consumers) walk(dir);

  const publishedIds = new Set(
    [
      ...gates.matchAll(
        /id: '([a-z0-9-]+)',[\s\S]{0,900}?status: 'published'/g,
      ),
    ].map((match) => match[1]),
  );
  for (const consumer of used)
    assert.ok(
      publishedIds.has(consumer.id),
      `${consumer.path} renders the unpublished claim "${consumer.id}"`,
    );
});

test('the blanket chemical-free statement and superlatives are refused', () => {
  for (const id of [
    'chemical-free-blanket',
    'ayush-approval',
    'kerala-only-superlative',
    'hair-regrowth-guarantee',
  ]) {
    assert.match(
      claimBlock(id),
      /status: 'not-approved'/,
      `${id} must stay refused`,
    );
  }
});

test('the only published claim is the verified location', () => {
  const published = [
    ...gates.matchAll(/id: '([a-z0-9-]+)',[\s\S]{0,900}?status: 'published'/g),
  ].map((match) => match[1]);
  assert.deepEqual(published, ['kerala-manufacture-location']);
});

test('forbidden claim phrases are specific enough to be useful', () => {
  const list = [...gates.matchAll(/\[(['"])(.+?)\1,\s*'([a-z0-9-]+)'\]/g)].map(
    (match) => match[2],
  );
  for (const phrase of [
    'chemical-free',
    '60-ingredient',
    'ayush approved',
    'clinically proven',
  ])
    assert.ok(list.includes(phrase), `"${phrase}" should be gated`);
  // A reviewer's word is not a brand claim: the verbatim review must not trip it.
  const reviews = text('src/data/customer-reviews.ts');
  assert.match(reviews, /No chemicals very good experience i am happy/);
  assert.ok(!list.some((phrase) => phrase === 'chemicals'));
});

test('awards and certifications publish nothing until the evidence exists', () => {
  assert.equal(publication.awards, false);
  assert.equal(publication.certifications, false);
  assert.match(
    evidence,
    /export const awards: readonly AwardEntry\[\] = Object\.freeze\(\[\]\)/,
  );
  assert.match(
    evidence,
    /export const certifications: readonly CertificationEntry\[\] = Object\.freeze\(\[\]\)/,
  );
  assert.match(
    evidence,
    /awardsPublishable = awardsPublished && awards\.length > 0/,
  );
  assert.match(
    evidence,
    /certificationsPublishable =\s*certificationsPublished && certifications\.length > 0/,
  );
  // The distinction that has to survive review.
  assert.match(evidence, /not a Ministry of Ayush product approval/);
});

test('the evidence routes stay out of the sitemap while unpublished', () => {
  const config = text('astro.config.mjs');
  assert.match(config, /evidence-publication\.json/);
  assert.match(config, /evidence\.awards \? null : '\/awards\/'/);
  assert.match(
    config,
    /evidence\.certifications \? null : '\/certifications\/'/,
  );
});

test('the pillar exists in five languages with its purchase links and FAQ', () => {
  const blocks = localeBlocks(pillar);
  for (const locale of LOCALES) {
    const block = blocks[locale];
    assert.ok(block, `pillar copy missing for ${locale}`);
    assert.ok(block.includes('faq: ['), `FAQ missing for ${locale}`);
    assert.ok(
      block.includes('sizes: sizes({'),
      `pack sizes missing for ${locale}`,
    );
  }
  assert.match(pillar, /storeLinks\.hairOil200/);
  assert.match(pillar, /storeLinks\.hairOil500/);
  assert.match(pillar, /customerReviews\.map/);
});

test('pillar titles and descriptions fit the rendering budget', () => {
  const titles = [...pillar.matchAll(/^    title: '([^']+)',$/gm)].map(
    (match) => match[1],
  );
  const descriptions = [
    ...pillar.matchAll(/^    description:\n      '([^']+)',$/gm),
  ].map((match) => match[1]);
  assert.equal(titles.length, 5, 'every locale needs a title');
  assert.equal(descriptions.length, 5, 'every locale needs a description');
  for (const title of titles)
    assert.ok(
      title.length <= 46,
      `title "${title}" is ${title.length} characters (max 46 before the brand suffix)`,
    );
  for (const description of descriptions) {
    assert.ok(
      description.length >= 70,
      `description too short: ${description.length}`,
    );
    assert.ok(
      description.length <= 165,
      `description too long: ${description.length}`,
    );
  }
});

test('the homepage title stays inside the search-result budget everywhere', () => {
  for (const locale of LOCALES) {
    const dictionary = json(`src/i18n/${locale}.json`);
    assert.ok(
      dictionary.title.length <= 46,
      `${locale} title is ${dictionary.title.length} characters (max 46)`,
    );
    assert.ok(dictionary.description.length >= 70);
    assert.ok(dictionary.description.length <= 165);
  }
});

test('the assistant covers manufacturing and where-to-buy in five languages', () => {
  const blocks = localeBlocks(assistant);
  for (const locale of LOCALES) {
    const block = blocks[locale] ?? '';
    assert.ok(
      block.includes('manufacture:'),
      `manufacture answer missing for ${locale}`,
    );
    assert.ok(
      block.includes('shopping:'),
      `shopping answer missing for ${locale}`,
    );
  }
  assert.match(search, /manufacture: \[/);
  assert.match(search, /shopping: \[/);
  // It must not invent a facility licence or a country list.
  assert.match(
    assistant,
    /I do not hold a verified list of international destinations/,
  );
  assert.match(assistant, /I do not hold a facility licence/);
});

test('the assistant can only see public products', () => {
  const index = text('src/data/care-index.ts');
  assert.match(index, /products/);
  const visibility = json('src/data/product-visibility.json');
  assert.equal(visibility.hidden.length, 26);
  for (const entry of visibility.hidden)
    assert.ok(
      !index.includes(entry.slug),
      `care index must not carry ${entry.slug}`,
    );
});

test('evidence copy never promises a document we do not hold', () => {
  for (const phrase of ['ISO 9001', 'GMP', 'FSSAI', 'Ayush certified']) {
    assert.ok(
      !evidence.includes(phrase),
      `evidence copy must not name a specific certification it does not hold: ${phrase}`,
    );
  }
});

test('every claim that has wording carries it in all five languages', () => {
  /*
   * A claim with an English sentence and no translation is a gate with a hole:
   * the Malayalam or Kannada version of the same claim would never be matched by
   * the built-HTML scan in scripts/validate-seo.mjs, because that scan works from
   * the phrases this file defines. Claims whose `wording` is null are refused
   * outright and need no translation.
   */
  const blocks = gates.split(/\n\s{2}\{\n/).slice(1);
  const withWording = blocks.filter((block) => /wording:\s*\{/.test(block));
  assert.ok(withWording.length >= 2, 'expected at least two localised claims');
  for (const block of withWording) {
    const id = block.match(/id:\s*'([^']+)'/)?.[1] ?? 'unknown claim';
    for (const locale of LOCALES)
      assert.match(
        block,
        new RegExp(`\\b${locale}:\\s*['"\`][^'"\`]{3,}`),
        `claim ${id} has no ${locale} wording`,
      );
  }
});
