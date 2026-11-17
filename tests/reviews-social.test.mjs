/**
 * The three published Google reviews, and the two social destinations.
 *
 * These are content facts, not layout: the browser suite checks that the cards
 * render and fit, and this suite pins the text character for character, the
 * attribution, the absence of anything invented, and the single source of truth
 * for the Facebook and Instagram links.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const root = new URL('../', import.meta.url).pathname;
const text = (path) => readFileSync(join(root, path), 'utf8');

/**
 * The owner's screenshot, transcribed. Any edit to a review must change this
 * list first — that is the point of pinning it twice.
 */
const APPROVED = [
  {
    id: 'pramod-kumar-ms',
    author: 'Pramod Kumar .M.S',
    rating: 5,
    text: 'I am their regular customer and its hair oil really helps to reduce my hairfall and helps to strengthen my hair and improve hair growth. I really recommend this product.',
  },
  {
    id: 'abacus-world-academy',
    author: 'Abacus World Academy',
    rating: 5,
    text: 'Excellent hair oil for hair growth, must try this',
  },
  {
    id: 'jincy-siju',
    author: 'Jincy Siju',
    rating: 5,
    text: 'No chemicals very good experience i am happy',
  },
];

const contact = text('src/data/site-contact.ts');
const component = text('src/components/living/VoicesSection.astro');

test('exactly the three owner-approved reviews are published, verbatim', () => {
  const source = text('src/data/customer-reviews.ts');
  for (const review of APPROVED) {
    assert.ok(
      source.includes(review.author),
      `Missing reviewer: ${review.author}`,
    );
    assert.ok(
      source.includes(review.text),
      `Review text was altered: ${review.id}`,
    );
  }
  // Three records, and no more: count the id lines rather than trusting a comment.
  assert.equal((source.match(/^ {4}id: '/gm) ?? []).length, APPROVED.length);
});

test('no invented reviewer data: no dates, photos, counts or extra claims', () => {
  const source = text('src/data/customer-reviews.ts');
  const record = source.slice(source.indexOf('export const customerReviews'));
  for (const banned of [
    'avatar',
    'photo',
    'image',
    'date:',
    'daysAgo',
    'helpful',
    'verified purchase',
  ]) {
    assert.ok(
      !record.includes(banned),
      `A review record must not carry "${banned}"`,
    );
  }
  // The only star rating anywhere is the reviewers' own 5: no invented 4s.
  assert.equal((record.match(/rating: 5/g) ?? []).length, APPROVED.length);
});

test('the provenance names the source, the approver and the consent position', () => {
  const source = text('src/data/customer-reviews.ts');
  assert.match(source, /ownerApprovedOn: '2026-11-16'/);
  assert.match(source, /profileUrl: googleBusiness\.href/);
  assert.match(source, /verbatim/i);
  assert.match(source, /consent/i);
  assert.match(source, /no widget, API client, scraper/i);
  // The aggregate is a dated reading of the listing, never derived from reviews.
  assert.match(source, /aggregateReviewedOn: googleBusiness\.ratingReviewedOn/);
});

test('the aggregate rating and its reading date are unchanged', () => {
  const googleBusiness = {
    rating: Number(/rating: ([\d.]+),/.exec(contact)?.[1]),
    reviewCount: Number(/reviewCount: (\d+),/.exec(contact)?.[1]),
    ratingReviewedOn: /ratingReviewedOn: '([\d-]+)'/.exec(contact)?.[1],
  };
  assert.equal(googleBusiness.rating, 4.2);
  assert.equal(googleBusiness.reviewCount, 574);
  assert.equal(googleBusiness.ratingReviewedOn, '2026-11-16');
});

test('the reviews are labelled as opinions, in all five locales', () => {
  const copy = text('src/data/living-copy.ts');
  const note = copy.slice(copy.indexOf('  sourceNote: {'));
  const block = note.slice(0, note.indexOf('} as Localized'));
  for (const lang of ['en:', 'ml:', 'hi:', 'ta:', 'kn:']) {
    assert.ok(block.includes(lang), `sourceNote missing for ${lang}`);
  }
  assert.match(block, /Customer opinions/);
  assert.match(block, /owner's approval/);
  assert.match(block, /not medical outcomes/);
  // The attribution chip is localised too, and the label stays tied to Google.
  const chip = copy.slice(copy.indexOf('  googleReview: {'));
  for (const lang of ['en:', 'ml:', 'hi:', 'ta:', 'kn:']) {
    assert.ok(
      chip.slice(0, chip.indexOf('} as Localized')).includes(lang),
      `googleReview missing for ${lang}`,
    );
  }
});

test('no brand or medical claim is built out of a review', () => {
  // The reviewer's "No chemicals" stays inside the quotation: it appears once,
  // in the review record, and nowhere as site copy.
  const files = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) walk(path);
      else if (/\.(ts|astro|json|css)$/.test(entry)) files.push(path);
    }
  };
  walk(join(root, 'src'));
  const hits = files.filter((file) =>
    /chemical[- ]free|no chemicals/i.test(readFileSync(file, 'utf8')),
  );
  // `knowledge-gates.ts` is the one place allowed to write the phrase, because it
  // is where the phrase is refused: it records the claim, its status and the
  // evidence that would be needed. The assertion below keeps that exception honest.
  assert.deepEqual(
    hits.map((file) => file.slice(root.length)).sort(),
    ['src/data/customer-reviews.ts', 'src/data/knowledge-gates.ts'].sort(),
    'A review opinion must not be restated as a brand claim',
  );
  const gates = text('src/data/knowledge-gates.ts');
  const refused = gates.slice(gates.indexOf("id: 'chemical-free-blanket'"));
  assert.match(
    refused.slice(0, 600),
    /status: 'not-approved'/,
    'the registry may only hold the phrase in order to refuse it',
  );
});

test('no Google API, widget or scraper is used to obtain reviews', () => {
  for (const path of [
    'src/data/customer-reviews.ts',
    'src/components/living/VoicesSection.astro',
  ]) {
    const source = text(path);
    for (const banned of [
      'maps.googleapis',
      'places.googleapis',
      'googleapis.com',
      'gstatic',
      'fetch(',
    ]) {
      assert.ok(!source.includes(banned), `${path} must not call ${banned}`);
    }
  }
});

test('the two social destinations are the verified ones, from one source', () => {
  const instagram = 'https://www.instagram.com/mariyas_herbal_hair_care_oil/';
  const facebook = 'https://www.facebook.com/mariayasnaturals/';
  assert.ok(contact.includes(`href: '${instagram}'`));
  assert.ok(contact.includes(`href: '${facebook}'`));
  // The owner's Instagram link carried a share tracker; the clean form is used.
  assert.ok(contact.includes('srtk='), 'owner link retained for traceability');
  assert.ok(!/href: 'https:\/\/www\.instagram\.com\/[^']*srtk=/.test(contact));
  // Every social surface reads site-contact, so no component hardcodes a URL.
  for (const path of [
    'src/components/SiteFooter.astro',
    'src/components/living/VoicesSection.astro',
  ]) {
    const source = text(path);
    assert.ok(!source.includes('facebook.com'), `${path} hardcodes Facebook`);
    assert.ok(!source.includes('instagram.com'), `${path} hardcodes Instagram`);
    assert.match(source, /social\.(facebook|instagram)\.href/);
  }
});

test('published social buttons carry target, rel and an accessible label', () => {
  for (const path of [
    'src/components/SiteFooter.astro',
    'src/components/living/VoicesSection.astro',
  ]) {
    const source = text(path);
    assert.match(source, /rel="noopener noreferrer"/);
    assert.match(source, /target="_blank"/);
    assert.match(source, /aria-label=/);
  }
  // The new-tab hint is localised for all five languages.
  const copy = text('src/data/living-copy.ts');
  assert.equal((copy.match(/^ {4}newTab: '/gm) ?? []).length, 5);
});

test('the carousel keeps a 44px touch target and honours reduced motion', () => {
  const css = text('src/styles/living-gallery.css');
  const nav = css.slice(css.indexOf('.lg-voices__nav .lg-rail-btn'));
  assert.match(nav.slice(0, 400), /width: 44px/);
  assert.match(nav.slice(0, 400), /height: 44px/);
  const dots = css.slice(css.indexOf('.lg-dots button {'));
  assert.match(dots.slice(0, 200), /width: 44px/);
  // The voices carousel overrides the shared dot size; that override must also
  // be a 44px target, or the winning rule would shrink it back.
  const voicesDots = css.slice(
    css.indexOf('.lg-voices__nav .lg-dots button {'),
  );
  assert.match(voicesDots.slice(0, 220), /width: 44px/);
  assert.match(voicesDots.slice(0, 220), /height: 44px/);
  assert.match(component, /prefers-reduced-motion/);
  assert.match(component, /ArrowRight/);
  assert.match(component, /ArrowLeft/);
});

test('the review section keeps its structure for every locale', () => {
  // English quotations are never translated: the same strings are rendered on
  // every locale, with only the surrounding labels localised.
  assert.match(component, /lang="en"/);
  assert.match(component, /customerReviews\.slice\(0, 3\)/);
  assert.ok(
    !component.includes('review.quote'),
    'the old empty-quote path is gone',
  );
});
