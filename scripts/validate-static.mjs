import { readFileSync, existsSync, readdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import { load } from 'cheerio';
const root = new URL('../dist/', import.meta.url);
const expectedOrigin =
  process.env.EXPECT_SITE_URL || 'https://www.mariyasnaturals.cloud';
const expectedRobots =
  process.env.EXPECT_INDEXABLE === 'true'
    ? 'index, follow'
    : 'noindex, nofollow';
const locales = ['en', 'ml', 'hi', 'ta'];
const titles = new Set();
for (const lang of locales) {
  const $ = load(readFileSync(new URL(`${lang}/index.html`, root), 'utf8'));
  assert.equal($('html').attr('lang'), lang);
  assert.equal($('h1').length, 1);
  assert.equal($('meta[name="robots"]').attr('content'), expectedRobots);
  assert.equal(
    $('link[rel="canonical"]').attr('href'),
    `${expectedOrigin}/${lang}/`,
  );
  assert.equal(
    $('link[hreflang="x-default"]').attr('href'),
    `${expectedOrigin}/en/`,
  );
  for (const alternate of locales)
    assert.equal(
      $(`link[hreflang="${alternate}"]`).attr('href'),
      `${expectedOrigin}/${alternate}/`,
    );
  assert.ok($('meta[name="description"]').attr('content').length > 30);
  titles.add($('title').text());
  JSON.parse($('script[type="application/ld+json"]').text());
  assert.equal($('[data-story-scene]').length, 5);
  for (const a of $('a[href]').toArray()) {
    const href = $(a).attr('href');
    if (href.startsWith('#'))
      assert.equal(
        $(`[id="${href.slice(1)}"]`).length,
        1,
        `Broken fragment ${href}`,
      );
    else if (href.startsWith('/'))
      assert.ok(
        existsSync(
          new URL(
            `${href.slice(1)}${href.endsWith('/') ? 'index.html' : ''}`,
            root,
          ),
        ),
        `Broken route ${href}`,
      );
    else assert.equal(new URL(href).origin, 'https://www.mariyasnaturals.com');
  }
  console.log(
    `PASS ${lang}: metadata, language links, navigation, story and structured data`,
  );
}
assert.equal(titles.size, 4);
assert.ok(
  readFileSync(new URL('robots.txt', root), 'utf8').includes(
    expectedRobots.startsWith('noindex') ? 'Disallow: /' : 'Allow: /',
  ),
);
const sitemap = readFileSync(new URL('sitemap-0.xml', root), 'utf8');
for (const locale of locales)
  assert.ok(sitemap.includes(`${expectedOrigin}/${locale}/`));
assert.ok(
  readdirSync(new URL('_astro/', root)).some((name) => name.endsWith('.js')),
);
console.log('PASS sitemap, robots and bundled animation script');
