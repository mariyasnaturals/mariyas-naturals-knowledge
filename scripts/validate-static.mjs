import { readFileSync, existsSync, readdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import { load } from 'cheerio';

/**
 * Static-output contract for the discovery site.
 *
 * Checks the built HTML rather than the source: five complete locales, hreflang
 * plus x-default, canonical and noindex policy, structured data, sitemap,
 * robots, local assets with reserved layout space, working internal routes,
 * mobile-only chrome and outbound links that stay on the official storefront.
 */
const root = new URL('../dist/', import.meta.url);
const expectedOrigin =
  process.env.EXPECT_SITE_URL || 'https://www.mariyasnaturals.cloud';
const expectedRobots =
  process.env.EXPECT_INDEXABLE === 'true'
    ? 'index, follow'
    : 'noindex, nofollow';
const locales = ['en', 'ml', 'hi', 'ta', 'kn'];
const storeOrigin = 'https://www.mariyasnaturals.com';
const storePathPrefixes = ['/shop/', '/product/', '/product-category/'];
const titles = new Set();

const read = (path) => readFileSync(new URL(path, root), 'utf8');
const has = (path) => existsSync(new URL(path, root));

/**
 * Contact and social destinations that are allowed to appear as outbound links.
 * These are the owner-declared channels in `src/data/site-contact.ts`; they are
 * verified in the contact-data test, not against the storefront URL rules.
 */
const approvedOutboundOrigins = new Set([
  'https://wa.me',
  'https://www.instagram.com',
  'https://www.facebook.com',
]);

const isApprovedOutbound = (url) =>
  approvedOutboundOrigins.has(url.origin) ||
  (url.origin === 'https://wa.me' && url.username === '');

/** Every outbound store link must be an exact official storefront URL. */
function assertStoreLink(href, where) {
  const url = new URL(href);
  assert.equal(url.origin, storeOrigin, `Unofficial store origin: ${where}`);
  assert.equal(url.username, '', 'Store links carry no credentials');
  assert.ok(
    storePathPrefixes.some((prefix) => url.pathname.startsWith(prefix)),
    `Store link must target /shop/, /product/ or /product-category/: ${href}`,
  );
  assert.equal(url.search, '', 'No tracking parameters on store links');
}

for (const lang of locales) {
  const page = `${lang}/index.html`;
  assert.ok(has(page), `Missing locale page: ${lang}`);
  const $ = load(read(page));
  assert.equal($('html').attr('lang'), lang);
  assert.equal($('h1').length, 1, `${lang} needs exactly one h1`);
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
      `${lang} hreflang ${alternate}`,
    );
  assert.ok($('meta[name="description"]').attr('content').length > 30);
  assert.ok(
    $('meta[property="og:image"]')
      .attr('content')
      .startsWith(`${expectedOrigin}/`),
    'Absolute social image',
  );
  assert.equal($('meta[property="og:image:width"]').attr('content'), '1200');
  assert.equal($('meta[property="og:image:height"]').attr('content'), '630');
  assert.ok($('meta[name="twitter:card"]').attr('content'));
  assert.ok($('link[rel="manifest"]').attr('href'));
  titles.add($('title').text());

  const schema = $('script[type="application/ld+json"]')
    .toArray()
    .flatMap((node) => {
      const parsed = JSON.parse($(node).text());
      return Array.isArray(parsed['@graph']) ? parsed['@graph'] : [parsed];
    });
  const types = schema.map((node) => node['@type']);
  for (const type of ['Organization', 'WebSite', 'WebPage'])
    assert.ok(types.includes(type), `${lang} structured data needs ${type}`);
  assert.ok(
    !types.includes('Product'),
    'Product markup requires verified prices and is not published',
  );
  for (const node of schema)
    for (const [key, value] of Object.entries(node))
      if (['image', 'logo'].includes(key) && typeof value === 'string')
        assert.ok(
          value.startsWith(`${expectedOrigin}/`),
          'Absolute schema image',
        );

  // The scroll story, its scenes and its numbered navigation are gone.
  assert.equal(
    $('[data-story-scene]').length,
    0,
    'Storytelling must be removed',
  );
  assert.equal($('[data-cinematic-scene]').length, 0);
  assert.equal($('[data-botanical-journey]').length, 0);
  assert.equal($('.cinema-frame').length, 0);

  // The hero film survives, with a local poster and no autoplay dependency.
  const film = $('video').first();
  assert.equal(film.length, 1, `${lang} keeps exactly one hero film`);
  const poster = film.attr('poster');
  assert.ok(poster?.startsWith('/'), 'Hero needs a local poster');
  assert.ok(has(poster.slice(1)), 'Poster file exists');
  assert.ok(['none', 'metadata'].includes(film.attr('preload')));
  assert.ok(film.attr('playsinline') !== undefined);
  assert.ok(film.attr('muted') !== undefined);
  const mobile = film.attr('data-mobile');
  assert.ok(mobile?.startsWith('/'), 'Mobile hero variant');
  assert.ok(has(mobile.slice(1)));

  // Mobile chrome: one instance, four destinations, one offer tile.
  const chrome = $('[data-mobile-chrome]');
  assert.equal(chrome.length, 1, `${lang} has one mobile chrome`);
  const nav = chrome.find('[data-mobile-nav]');
  assert.equal(nav.find('a:not([data-offer-tile])').length, 4);
  const tile = nav.find('[data-offer-tile]');
  assert.equal(tile.length, 1, `${lang} offer tile`);
  assert.match(tile.attr('href'), /^https:\/\/www\.mariyasnaturals\.com\//);
  assert.equal(tile.find('[data-offer-a]').length, 1);
  assert.equal(tile.find('[data-offer-b]').length, 1);
  // The tile alternates a localised call to action with the exact, verified
  // discount wording the owner approved; the claim itself is never translated.
  assert.ok(tile.find('[data-offer-a]').text().trim().length > 0);
  if (lang === 'en')
    assert.equal(
      tile.find('[data-offer-a]').text().trim().toUpperCase(),
      'BUY NOW',
    );
  assert.equal(tile.find('[data-offer-b]').text().trim(), 'SAVE UP TO 20%');
  assert.equal(
    chrome.find('.shop-fab').attr('href'),
    `${storeOrigin}/shop/`,
    'Floating shop button points at the shop index, not a messenger',
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
        has(`${href.slice(1)}${href.endsWith('/') ? 'index.html' : ''}`),
        `Broken route ${href}`,
      );
    else if (!/^(?:mailto:|tel:)/.test(href)) {
      // Contact/social channels are not storefront links: check them against the
      // approved origin list instead of the /shop/, /product/ rules.
      if (isApprovedOutbound(new URL(href))) continue;
      assertStoreLink(href, `${lang}`);
    }
  }
  console.log(
    `PASS ${lang}: metadata, hreflang, structured data, hero, chrome and links`,
  );
}
assert.equal(titles.size, locales.length, 'Each locale needs its own title');

assert.ok(
  read('robots.txt').includes(
    expectedRobots.startsWith('noindex') ? 'Disallow: /' : 'Allow: /',
  ),
);
const sitemap = read('sitemap-0.xml');
for (const locale of locales)
  assert.ok(
    sitemap.includes(`${expectedOrigin}/${locale}/`),
    `sitemap ${locale}`,
  );
assert.ok(!sitemap.includes('/kn/kn/'), 'Sitemap has no duplicated segments');
assert.ok(
  readdirSync(new URL('_astro/', root)).length > 0,
  'Astro assets are emitted',
);
// The site root is a real homepage, not a language gateway: it renders the
// English page, canonicals to /en/ so the pair is not treated as duplicates, and
// still offers every language.
{
  const $ = load(read('index.html'));
  assert.equal(
    $('link[rel="canonical"]').attr('href'),
    `${expectedOrigin}/en/`,
    'The root canonicalises to the English homepage',
  );
  assert.equal(
    $('link[hreflang="x-default"]').attr('href'),
    `${expectedOrigin}/en/`,
    'x-default points at English',
  );
  for (const lang of locales)
    assert.ok(
      $(`link[rel="alternate"][hreflang="${lang}"]`).length === 1,
      `Root declares hreflang ${lang}`,
    );
  // A real homepage: hero, editions and the care explorer are all server-rendered.
  assert.equal($('video').length, 1, 'The root keeps exactly one hero film');
  assert.equal($('#ritual').length, 1, 'The editions section is present');
  assert.equal($('#care').length, 1, 'The care explorer is present');
  assert.ok($('h1').text().trim().length > 8, 'The root has a real headline');
  // No forced language redirect: the page is static and loads no redirect script.
  assert.ok(
    !/location\.(?:replace|assign)|location\.href\s*=/.test(read('index.html')),
    'The root never redirects the visitor by language',
  );
  assert.equal(
    $('meta[name="robots"]').attr('content'),
    expectedRobots,
    'The root follows the deployment robots policy',
  );
  assert.ok(
    $('link[rel="icon"]').length + $('link[rel="apple-touch-icon"]').length >=
      3,
    'Official icons are declared',
  );
  assert.ok($('link[rel="manifest"]').length === 1);
}
console.log('PASS site root: real homepage, canonical to /en/, five hreflangs');
console.log('PASS sitemap, robots and bundled assets');

/** Validate every generated HTML page, including route-local alternates. */
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
    assert.equal(
      $('meta[name="robots"]').attr('content'),
      expectedRobots,
      `${route} robots`,
    );
    // The site root renders the English homepage and canonicalises to it, so the
    // two URLs are one page rather than competing duplicates. Every other route
    // is its own canonical.
    assert.equal(
      $('link[rel="canonical"]').attr('href'),
      expectedOrigin + (route === '/' ? '/en/' : route),
      `${route} canonical`,
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
      assert.ok($(node).attr('alt'), 'Images need truthful alt text');
    }
    // Detail and listing routes carry the full alternate set and switcher links.
    if (route.includes('/products/') || route.includes('/collections/')) {
      const suffix = route.split('/').slice(2).join('/');
      for (const alternate of locales) {
        assert.equal(
          $(`link[hreflang="${alternate}"]`).attr('href'),
          `${expectedOrigin}/${alternate}/${suffix}`,
          `${route} hreflang ${alternate}`,
        );
        assert.ok(
          $(`header a[hreflang="${alternate}"][href="/${alternate}/${suffix}"]`)
            .length,
          `${route} switcher ${alternate}`,
        );
      }
    }
    // The substring selector also catches the contact address, so protocol links
    // are checked for shape rather than treated as storefront URLs.
    for (const node of $('a[href*="mariyasnaturals.com"]').toArray()) {
      const href = $(node).attr('href');
      if (/^mailto:/.test(href)) {
        assert.match(href, /^mailto:[^@\s]+@mariyasnaturals\.com$/);
        continue;
      }
      if (/^tel:/.test(href)) continue;
      assertStoreLink(href, route);
    }
    assert.equal(
      $(
        'form[action*="checkout"],form[action*="cart"],input[name="cardnumber"]',
      ).length,
      0,
      'No checkout flow is embedded on this origin',
    );
  }
}
validateTree(root);
console.log(
  'PASS all generated pages: local assets, navigation, alternates, chrome and outbound-only commerce',
);
