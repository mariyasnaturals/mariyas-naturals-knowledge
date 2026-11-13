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
  // Correction: the homepage has exactly one cinematic hero. The eight
  // post-hero photographic scenes and their chapter navigation are gone, and the
  // Discover control leads straight into the botanical journey.
  assert.equal($('[data-story-scene]').length, 0);
  assert.equal($('.cinema-scenes').length, 0);
  assert.equal($('.cinema-chapters').length, 0);
  assert.equal($('.cinema-hero').length, 1);
  assert.equal($('.cinema-hero-action').attr('href'), '#botanical-journey');
  assert.equal(
    $('[data-botanical-journey]').length,
    1,
    'The botanical journey must follow the hero',
  );
  assert.equal(
    $('#story').nextAll('section').first().is('[data-botanical-journey]'),
    true,
    'Nothing may sit between the hero and the botanical journey',
  );
  assert.equal(
    $('.botanical-intro').length,
    0,
    'The separate introductory panel must stay removed',
  );
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
    else {
      assert.ok($(a).is('[data-source-reference]'));
      assert.ok(['https://mariyasnaturals.in'].includes(new URL(href).origin));
    }
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

// Validate every generated HTML page, including new localized details and root.
function validateTree(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = new URL(
      entry.name + (entry.isDirectory() ? '/' : ''),
      directory,
    );
    if (entry.isDirectory()) {
      validateTree(path);
      continue;
    }
    if (!entry.name.endsWith('.html')) continue;
    const $ = load(readFileSync(path, 'utf8'));
    const relative = path.href
      .slice(root.href.length)
      .replace(/index\.html$/, '');
    const route = `/${relative}`;
    assert.equal($('meta[name="robots"]').attr('content'), expectedRobots);
    assert.equal(
      $('link[rel="canonical"]').attr('href'),
      expectedOrigin + route,
    );
    for (const node of $('a[href]').toArray()) {
      const href = $(node).attr('href');
      if (!href.startsWith('/') && !href.startsWith('#')) continue;
      const target = new URL(href, 'https://static.invalid' + route);
      const file = new URL(
        target.pathname.slice(1) +
          (target.pathname.endsWith('/') ? 'index.html' : ''),
        root,
      );
      assert.ok(existsSync(file), `Missing ${file.pathname}`);
      if (target.hash) {
        const document = load(readFileSync(file, 'utf8'));
        assert.equal(
          document(`[id="${target.hash.slice(1)}"]`).length,
          1,
          `Missing fragment ${href}`,
        );
      }
    }
    for (const node of $('img').toArray()) {
      const src = $(node).attr('src');
      assert.ok(
        src?.startsWith('/') && !src.startsWith('//'),
        'No image hotlinks',
      );
      assert.ok(existsSync(new URL(src.slice(1), root)), 'Local image exists');
      for (const candidate of ($(node).attr('srcset') || '')
        .split(',')
        .filter(Boolean)) {
        const imagePath = candidate.trim().split(/\s+/)[0];
        assert.ok(
          imagePath.startsWith('/') &&
            existsSync(new URL(imagePath.slice(1), root)),
          'Local responsive derivative exists',
        );
      }
      assert.ok(
        $(node).attr('width') && $(node).attr('height'),
        'Images reserve layout space',
      );
      assert.ok(
        $(node).attr('alt'),
        'Product images need truthful localized alt text',
      );
    }
    if (route.includes('/products/') || route.includes('/collections/')) {
      const suffix = route.split('/').slice(2).join('/');
      for (const alternate of locales) {
        assert.equal(
          $(`link[hreflang="${alternate}"]`).attr('href'),
          `${expectedOrigin}/${alternate}/${suffix}`,
        );
        assert.ok(
          $(`header a[hreflang="${alternate}"][href="/${alternate}/${suffix}"]`)
            .length,
        );
      }
    }
    assert.equal(
      $('a[href*="mariyasnaturals.com"]').length,
      0,
      'Commerce remains disabled during migration',
    );
  }
}
validateTree(root);
console.log(
  'PASS all generated pages: local assets, navigation, detailed alternates and disabled commerce',
);
