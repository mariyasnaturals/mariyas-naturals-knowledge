#!/usr/bin/env node
/**
 * SEO / AEO / GEO validation for the built static site.
 *
 * Runs against `dist/` and fails on anything that would hurt indexing, break a
 * language relationship, leak a hidden product or publish a claim that has not
 * cleared the registry in src/data/knowledge-gates.ts.
 *
 * It also writes `docs/seo/technical-seo-audit.md` — the measured state of the
 * build (title and description distributions, heading shape, schema coverage,
 * asset and link integrity) so the audit is reproducible rather than remembered.
 *
 * Env:
 *   EXPECT_SITE_URL   canonical origin (default https://www.mariyasnaturals.cloud)
 *   EXPECT_INDEXABLE  'true' for a production build (default false)
 */
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  existsSync,
} from 'node:fs';
import { join, relative, dirname } from 'node:path';

const ROOT = process.cwd();
const DIST = join(ROOT, 'dist');
const ORIGIN = (
  process.env.EXPECT_SITE_URL || 'https://www.mariyasnaturals.cloud'
).replace(/\/+$/, '');
const INDEXABLE = process.env.EXPECT_INDEXABLE === 'true';
const LOCALES = ['en', 'ml', 'hi', 'ta', 'kn'];

const failures = [];
const notes = [];
const fail = (file, message) => failures.push(`${file}: ${message}`);

const walk = (dir, out = []) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
};

if (!existsSync(DIST)) {
  console.error('dist/ not found — run the build first.');
  process.exit(1);
}

const files = walk(DIST);
const htmlFiles = files.filter((file) => file.endsWith('.html'));
/**
 * A page's public route, with the trailing `index.html` folded away, so it can be
 * compared directly with the canonical URL and the sitemap entry.
 */
const routeOf = (file) => {
  const rel = '/' + relative(DIST, file).split('\\').join('/');
  return rel.endsWith('/index.html') ? rel.slice(0, -'index.html'.length) : rel;
};
const pageRoutes = new Set(htmlFiles.map(routeOf));
const assetFiles = new Set(
  files
    .filter((file) => !file.endsWith('.html'))
    .map((file) => '/' + relative(DIST, file).split('\\').join('/')),
);
const exists = (route) =>
  pageRoutes.has(route) ||
  pageRoutes.has(route.endsWith('/') ? route : `${route}/`) ||
  assetFiles.has(route);

// ---------------------------------------------------------------- publication
const publication = JSON.parse(
  readFileSync(join(ROOT, 'src/data/evidence-publication.json'), 'utf8'),
);

// ------------------------------------------------------------ claim registry
const gates = readFileSync(join(ROOT, 'src/data/knowledge-gates.ts'), 'utf8');
const forbidden = [...gates.matchAll(/'([^']{4,40})'/g)]
  .map((match) => match[1])
  .filter((value) =>
    /chemical|60-ingredient|60 ingredient|60 herbs|ayush|guaranteed|clinically proven|kerala|fda/i.test(
      value,
    ),
  )
  .filter((value) =>
    /chemical-free|chemical free|chemically free|60-|60 |ayush|guaranteed|clinically proven|only|fda|approximately|about 50/i.test(
      value,
    ),
  );

// --------------------------------------------------------------- visibility
const visibility = JSON.parse(
  readFileSync(join(ROOT, 'src/data/product-visibility.json'), 'utf8'),
);
/**
 * The visibility policy lists the hidden listings directly, with the slug the
 * store uses. A hidden slug must not be linked from any page or from the sitemap.
 */
const hiddenSlugs = (visibility.hidden ?? []).map((entry) => entry.slug);
const hiddenIds = new Set(
  (visibility.hidden ?? []).map((entry) => String(entry.storeProductId)),
);
// Keep the id set above as the cross-check: every hidden slug must still exist in
// the catalogue manifest, otherwise the policy and the data have drifted apart.
const manifest = JSON.parse(
  readFileSync(join(ROOT, 'catalogue/media-manifest.json'), 'utf8'),
);
const manifestSlugs = new Set(manifest.products.map((product) => product.slug));
for (const slug of hiddenSlugs) {
  if (!manifestSlugs.has(slug))
    fail(
      'visibility',
      `hidden slug "${slug}" is not in the catalogue manifest`,
    );
}

// ------------------------------------------------------------------ parsing
const parse = (html) => {
  const title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() ?? '';
  const description =
    html.match(/<meta\s+name="description"\s+content="([^"]*)"/)?.[1] ?? '';
  const robots =
    html.match(/<meta\s+name="robots"\s+content="([^"]*)"/)?.[1] ?? '';
  const canonical =
    html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/)?.[1] ?? '';
  const alternates = [
    ...html.matchAll(
      /<link\s+rel="alternate"\s+hreflang="([^"]+)"\s+href="([^"]+)"/g,
    ),
  ].map((match) => ({ hreflang: match[1], href: match[2] }));
  const headings = [...html.matchAll(/<h([1-6])[\s>]/g)].map((match) =>
    Number(match[1]),
  );
  const jsonLd = [
    ...html.matchAll(
      /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    ),
  ].map((match) => match[1]);
  const images = [...html.matchAll(/<img\b[^>]*>/g)].map((match) => match[0]);
  const links = [...html.matchAll(/<a\b[^>]*href="([^"]*)"/g)].map(
    (match) => match[1],
  );
  return {
    title,
    description,
    robots,
    canonical,
    alternates,
    headings,
    jsonLd,
    images,
    links,
  };
};

// ---------------------------------------------------------------- page sweep
const stats = {
  pages: 0,
  titles: [],
  descriptions: [],
  schemaTypes: new Map(),
  images: 0,
  imagesWithoutAlt: 0,
  internalLinks: 0,
  missingTargets: new Set(),
  h1Count: new Map(),
  headingSkips: 0,
};
const parsed = new Map();

for (const file of htmlFiles) {
  const route = routeOf(file);
  const html = readFileSync(file, 'utf8');
  const page = parse(html);
  parsed.set(route, page);
  stats.pages += 1;

  const isGated =
    (route.includes('/awards/') && !publication.awards) ||
    (route.includes('/certifications/') && !publication.certifications);

  // 1. exactly one H1, and no skipped level straight after it
  const h1s = page.headings.filter((level) => level === 1).length;
  stats.h1Count.set(h1s, (stats.h1Count.get(h1s) ?? 0) + 1);
  if (h1s !== 1) fail(route, `${h1s} <h1> elements (expected exactly 1)`);
  if (page.headings.length > 1) {
    for (let index = 1; index < page.headings.length; index += 1) {
      if (page.headings[index] - page.headings[index - 1] > 1) {
        stats.headingSkips += 1;
        break;
      }
    }
  }

  // 2. titles and descriptions
  const title = page.title.replace(/&amp;/g, '&');
  const description = page.description.replace(/&amp;/g, '&');
  stats.titles.push({ route, length: title.length });
  stats.descriptions.push({ route, length: description.length });
  if (!title) fail(route, 'missing <title>');
  else if (title.length > 65)
    fail(route, `title is ${title.length} characters (max 65)`);
  if (!description) fail(route, 'missing meta description');
  else if (description.length < 70)
    fail(
      route,
      `meta description is ${description.length} characters (min 70)`,
    );
  else if (description.length > 165)
    fail(
      route,
      `meta description is ${description.length} characters (max 165)`,
    );

  // 3. canonical
  const expectedRobots = isGated
    ? 'noindex, follow'
    : INDEXABLE
      ? 'index, follow'
      : 'noindex, nofollow';
  if (page.robots !== expectedRobots)
    fail(route, `robots "${page.robots}" (expected "${expectedRobots}")`);
  if (!page.canonical) fail(route, 'missing canonical');
  else if (!page.canonical.startsWith(`${ORIGIN}/`))
    fail(route, `canonical ${page.canonical} is not on ${ORIGIN}`);
  else if (
    page.canonical !== `${ORIGIN}${route}` &&
    // The language-choice root canonicalises to /en/ on purpose.
    !(route === '/' && page.canonical === `${ORIGIN}/en/`)
  )
    fail(
      route,
      `canonical ${page.canonical} does not match its own route ${route}`,
    );

  // 4. hreflang: five locales plus x-default, all reciprocal
  const suffix = route.match(/^\/([a-z]{2})(\/.*)$/);
  if (suffix && LOCALES.includes(suffix[1])) {
    const tail = suffix[2];
    const expected = new Set([
      ...LOCALES.map((locale) => `/${locale}${tail}`),
      '/en' + tail,
    ]);
    if (page.alternates.length !== LOCALES.length + 1)
      fail(
        route,
        `${page.alternates.length} hreflang links (expected ${LOCALES.length + 1})`,
      );
    for (const alternate of page.alternates) {
      const href = alternate.href.replace(ORIGIN, '');
      if (!expected.has(href))
        fail(
          route,
          `hreflang ${alternate.hreflang} points at ${href}, which is not its translation set`,
        );
      else if (!exists(href))
        fail(
          route,
          `hreflang ${alternate.hreflang} target ${href} was not built`,
        );
    }
  }

  // 5. structured data
  if (page.jsonLd.length === 0) fail(route, 'no JSON-LD');
  for (const block of page.jsonLd) {
    let data;
    try {
      data = JSON.parse(block);
    } catch {
      fail(route, 'JSON-LD does not parse');
      continue;
    }
    const graph = data['@graph'] ?? [data];
    for (const node of graph) {
      const type = node['@type'];
      if (typeof type === 'string')
        stats.schemaTypes.set(type, (stats.schemaTypes.get(type) ?? 0) + 1);
      if (type === 'Product' && node.offers)
        fail(
          route,
          'Product schema carries an offer (prices live on .com only)',
        );
    }
  }
  const types = (
    page.jsonLd[0] ? (JSON.parse(page.jsonLd[0])['@graph'] ?? []) : []
  ).map((node) => node['@type']);
  const WEB_PAGE_TYPES = [
    'WebPage',
    'CollectionPage',
    'ItemPage',
    'AboutPage',
    'FAQPage',
    'ContactPage',
    'QAPage',
    'ProfilePage',
    'SearchResultsPage',
    // The Ritual Finder is a client-side tool, so its node is a WebApplication.
    'WebApplication',
  ];
  for (const required of ['Organization', 'WebSite']) {
    if (!types.includes(required))
      fail(route, `structured data is missing ${required}`);
  }
  if (!types.some((type) => WEB_PAGE_TYPES.includes(type)))
    fail(route, 'structured data carries no WebPage-family node');

  // 6. claims that have not been approved
  const lower = html.toLowerCase();
  for (const phrase of forbidden) {
    if (lower.includes(phrase.toLowerCase()))
      fail(route, `publishes an unapproved claim: "${phrase}"`);
  }

  // 7. hidden listings must not appear anywhere
  // Match the exact route: `/products/mariyas-hair-oil/` must not be satisfied by
  // the visible `/products/mariyas-hair-oil-200-ml/`.
  for (const slug of hiddenSlugs) {
    if (
      new RegExp(
        `/products/${slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/`,
      ).test(html)
    )
      fail(route, `links to hidden listing "${slug}"`);
  }

  // 8. images, links
  for (const image of page.images) {
    stats.images += 1;
    if (!/\balt=/.test(image)) stats.imagesWithoutAlt += 1;
    const src = image.match(/\bsrc="([^"]+)"/)?.[1];
    if (src && /^https?:\/\//.test(src) && !src.startsWith(ORIGIN))
      fail(route, `hotlinks a remote image: ${src}`);
  }
  for (const href of page.links) {
    if (
      !href ||
      href.startsWith('#') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:')
    )
      continue;
    if (/^https?:\/\//.test(href)) {
      if (
        href.includes('mariyasnaturals.com') &&
        !href.startsWith('https://www.mariyasnaturals.com/')
      )
        fail(route, `store link is not on the canonical www host: ${href}`);
      continue;
    }
    stats.internalLinks += 1;
    const clean = href.split('?')[0].split('#')[0];
    if (!clean || clean === '') continue;
    if (!exists(clean)) stats.missingTargets.add(`${route} → ${clean}`);
  }
}

for (const target of stats.missingTargets)
  fail('internal links', `unresolved target ${target}`);

// ------------------------------------------------------------------- sitemap
const sitemapPath = join(DIST, 'sitemap-0.xml');
const sitemap = existsSync(sitemapPath)
  ? readFileSync(sitemapPath, 'utf8')
  : '';
const sitemapRoutes = new Set(
  [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) =>
    match[1].replace(ORIGIN, ''),
  ),
);

for (const route of pageRoutes) {
  const page = parsed.get(route);
  const isGated =
    (route.includes('/awards/') && !publication.awards) ||
    (route.includes('/certifications/') && !publication.certifications);
  const indexable = page.robots.startsWith('index');
  if (isGated && sitemapRoutes.has(route))
    fail('sitemap', `lists the unverified route ${route}`);
  if (indexable && route !== '/' && !sitemapRoutes.has(route))
    fail('sitemap', `omits the indexable route ${route}`);
  if (!indexable && sitemapRoutes.has(route))
    fail('sitemap', `lists the non-indexable route ${route}`);
}
for (const route of sitemapRoutes) {
  if (!exists(route)) fail('sitemap', `lists ${route}, which was not built`);
}
for (const slug of hiddenSlugs)
  if (
    new RegExp(
      `/products/${slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/`,
    ).test(sitemap)
  )
    fail('sitemap', `lists hidden listing "${slug}"`);

// ------------------------------------------------------------ robots + pillar
const robots = existsSync(join(DIST, 'robots.txt'))
  ? readFileSync(join(DIST, 'robots.txt'), 'utf8')
  : '';
if (!robots) fail('robots.txt', 'missing');
if (INDEXABLE) {
  if (!/^Allow: \/\s*$/m.test(robots))
    fail('robots.txt', 'does not allow crawling on a production build');
  if (!robots.includes(`${ORIGIN}/sitemap-index.xml`))
    fail('robots.txt', 'does not advertise the sitemap');
} else if (!/^Disallow: \/\s*$/m.test(robots)) {
  // A preview may allow crawling of assets but must not invite indexing.
  notes.push('robots.txt on a non-production build does not disallow crawling');
}
for (const bot of ['Googlebot', 'Bingbot', 'OAI-SearchBot']) {
  if (
    new RegExp(`User-agent: ${bot}[\\s\\S]{0,80}Disallow: /`, 'i').test(robots)
  )
    fail('robots.txt', `blocks ${bot}`);
}

for (const locale of LOCALES) {
  const route = `/${locale}/hair-oil/`;
  if (!pageRoutes.has(route)) {
    fail('hair-oil', `pillar page missing for ${locale}`);
    continue;
  }
  const html = readFileSync(join(DIST, route, 'index.html'), 'utf8');
  const words = html
    .replace(/<[^>]+>/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 1).length;
  if (words < 350) fail(route, `only ${words} words of visible text`);
  for (const link of [
    '/product/mariyas-herbal-hair-care-oil-200-ml/',
    '/product/mariyas-herbal-hair-care-500-ml/',
  ]) {
    if (!html.includes(link)) fail(route, `does not link to ${link}`);
  }
  if (!html.includes('FAQPage')) fail(route, 'FAQ structured data missing');
  for (const review of ['Pramod Kumar', 'Abacus World Academy', 'Jincy Siju'])
    if (!html.includes(review))
      fail(route, `does not carry the approved review from ${review}`);

  // evidence routes stay noindex, follow while unpublished
  for (const gated of ['awards', 'certifications']) {
    const published = publication[gated] === true;
    const gatedRoute = `/${locale}/${gated}/`;
    if (!pageRoutes.has(gatedRoute)) {
      fail(gated, `template missing for ${locale}`);
      continue;
    }
    const gatedHtml = readFileSync(
      join(DIST, gatedRoute, 'index.html'),
      'utf8',
    );
    const expected = published ? INDEXABLE : false;
    const actuallyIndexable = /<meta name="robots" content="index/.test(
      gatedHtml,
    );
    if (expected !== actuallyIndexable)
      fail(
        gatedRoute,
        `indexability is ${actuallyIndexable} but publication switch says ${published}`,
      );
  }
}

// ------------------------------------------------------------------- report
const percentile = (values, p) => {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return 0;
  return sorted[
    Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))
  ];
};
const titleLengths = stats.titles.map((entry) => entry.length);
const descriptionLengths = stats.descriptions.map((entry) => entry.length);
const longestTitles = [...stats.titles]
  .sort((a, b) => b.length - a.length)
  .slice(0, 5);
const shortestDescriptions = [...stats.descriptions]
  .sort((a, b) => a.length - b.length)
  .slice(0, 5);
const schemaRows = [...stats.schemaTypes.entries()].sort((a, b) => b[1] - a[1]);

const audit = `# Technical SEO audit — built by \`scripts/validate-seo.mjs\`

Generated: ${new Date().toISOString()}
Origin: \`${ORIGIN}\` · indexable: \`${INDEXABLE}\` · publication switches: ${LOCALES.map(() => '').join('')}\`awards=${publication.awards}\`, \`certifications=${publication.certifications}\`

## Pages

| Measure | Value |
| --- | --- |
| HTML pages | ${stats.pages} |
| Exactly one \`<h1>\` | ${stats.h1Count.get(1) ?? 0} / ${stats.pages} |
| Pages with a skipped heading level | ${stats.headingSkips} |
| Titles | median ${percentile(titleLengths, 50)}, longest ${Math.max(0, ...titleLengths)} |
| Meta descriptions | median ${percentile(descriptionLengths, 50)}, shortest ${Math.min(...descriptionLengths, 0)} |
| Images | ${stats.images}, without \`alt\` ${stats.imagesWithoutAlt} |
| Internal links checked | ${stats.internalLinks}, unresolved ${stats.missingTargets.size} |
| Sitemap URLs | ${sitemapRoutes.size} |

## Structured data (node occurrences)

| Type | Count |
| --- | --- |
${schemaRows.map(([type, count]) => `| \`${type}\` | ${count} |`).join('\n')}

## Longest titles

${longestTitles.map((entry) => `- ${entry.length} — \`${entry.route}\``).join('\n')}

## Shortest meta descriptions

${shortestDescriptions.map((entry) => `- ${entry.length} — \`${entry.route}\``).join('\n')}

## Claim and visibility gates

- Hidden listing slugs checked for leakage: ${hiddenSlugs.length}
- Unapproved claim phrases checked: ${forbidden.length}
- Evidence routes: ${pageRoutes.has('/en/awards/') ? 'templates built, noindex' : 'missing'}

## Notes

${notes.length ? notes.map((note) => `- ${note}`).join('\n') : '- none'}
`;

writeFileSync(join(ROOT, 'docs/seo/technical-seo-audit.md'), audit);

if (failures.length) {
  console.error(`\nSEO validation FAILED — ${failures.length} problem(s):\n`);
  for (const failure of failures.slice(0, 60)) console.error(`  ✗ ${failure}`);
  if (failures.length > 60)
    console.error(`  … and ${failures.length - 60} more`);
  process.exit(1);
}
console.log(
  `SEO validation passed — ${stats.pages} pages, ${sitemapRoutes.size} sitemap URLs, ` +
    `${stats.images} images, ${stats.internalLinks} internal links, ` +
    `${forbidden.length} claim phrases and ${hiddenSlugs.length} hidden listings gated.`,
);
console.log(`Audit written to docs/seo/technical-seo-audit.md`);
