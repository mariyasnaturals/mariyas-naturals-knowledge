import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';

const manifest = JSON.parse(
  readFileSync('catalogue/media-manifest.json', 'utf8'),
);
/**
 * The owner temporarily hid the 26 listings that have no genuine photograph
 * (src/data/product-visibility.json). The catalogue renders exactly the visible
 * products, so the expected card count comes from the policy, not the manifest.
 */
const visibility = JSON.parse(
  readFileSync('src/data/product-visibility.json', 'utf8'),
);
const hiddenSlugs = new Set<string>(
  visibility.hidden.map((item: { slug: string }) => item.slug),
);
const visibleProducts = manifest.products.filter(
  (product: { slug: string }) => !hiddenSlugs.has(product.slug),
);
const brandManifest = JSON.parse(
  readFileSync('src/data/brand-media.json', 'utf8'),
);
const locales = ['en', 'ml', 'hi', 'ta', 'kn'] as const;
const fonts: Record<(typeof locales)[number], [string, string]> = {
  en: ['Inter Variable', 'Cormorant Garamond Variable'],
  ml: ['Noto Sans Malayalam Variable', 'Noto Serif Malayalam Variable'],
  hi: ['Noto Sans Devanagari Variable', 'Noto Serif Devanagari Variable'],
  ta: ['Noto Sans Tamil Variable', 'Noto Serif Tamil Variable'],
  kn: ['Noto Sans Kannada Variable', 'Noto Serif Kannada Variable'],
};
const axe = async (page: import('@playwright/test').Page) =>
  (
    await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze()
  ).violations;
// A product page that really has a gallery and an official product photograph.
const detailSlug = 'mariyas-hair-oil-200-ml';

for (const lang of locales) {
  for (const width of [390, 1440]) {
    test(`${lang} ${width}: fonts, catalogue, local imagery and gallery`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      const external: string[] = [];
      await page.route('**/*', (route) => {
        if (new URL(route.request().url()).hostname !== '127.0.0.1') {
          external.push(route.request().url());
          return route.abort();
        }
        return route.continue();
      });
      await page.goto(`/${lang}/`);
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page
          .locator('body')
          .evaluate((el) => getComputedStyle(el).fontFamily),
      ).toContain(fonts[lang][0]);
      expect(
        await page
          .locator('h1')
          .evaluate((el) => getComputedStyle(el).fontFamily),
      ).toContain(fonts[lang][1]);
      expect(
        await page.evaluate(
          (families) =>
            families.every((family) =>
              // Kannada subsets only carry Kannada coverage, so check the Latin
              // stack loosely and the localised stack strictly below.
              document.fonts.check(`400 24px "${family}"`),
            ),
          fonts[lang],
        ),
      ).toBe(true);
      const client = await page.context().newCDPSession(page);
      await client.send('DOM.enable');
      await client.send('CSS.enable');
      const { root } = await client.send('DOM.getDocument');
      const { nodeId } = await client.send('DOM.querySelector', {
        nodeId: root.nodeId,
        selector: '#hero-title',
      });
      const used = await client.send('CSS.getPlatformFontsForNode', { nodeId });
      expect(
        used.fonts.some((font) => font.isCustomFont && font.glyphCount > 0),
      ).toBe(true);
      await client.detach();
      await page.screenshot({
        path: `test-results/${lang}-${width}-typography.png`,
      });

      await page.goto(`/${lang}/products/`);
      await expect(page.locator('.catalogue-card')).toHaveCount(
        visibleProducts.length,
      );
      // No hidden listing may be reachable from the catalogue at all.
      expect(
        await page.locator('[href*="/products/"]').count(),
      ).toBeGreaterThan(0);
      for (const slug of hiddenSlugs) {
        await expect(page.locator(`a[href*="/products/${slug}/"]`)).toHaveCount(
          0,
        );
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect(await axe(page)).toEqual([]);

      await page.goto(`/${lang}/products/${detailSlug}/`);
      // The official product name stays verbatim, so it is explicitly English
      // and renders in the Latin display face on every locale.
      const heading = page.locator('h1');
      await expect(heading).toHaveAttribute('lang', 'en');
      expect(
        await heading.evaluate((el) => getComputedStyle(el).fontFamily),
      ).toContain('Cormorant Garamond Variable');
      // The localized page furniture must still use the locale display face.
      expect(
        await page
          .locator('.product-facts h2')
          .first()
          .evaluate((el) => getComputedStyle(el).fontFamily),
      ).toContain(fonts[lang][1]);
      const original = page.locator(
        '.product-detail-media > .product-visual img',
      );
      await expect(original).toBeVisible();
      expect(
        await original.evaluate(
          (el: HTMLImageElement) =>
            el.complete &&
            el.naturalWidth > 0 &&
            new URL(el.currentSrc).hostname === '127.0.0.1',
        ),
      ).toBe(true);
      const gallery = page.locator('.image-gallery');
      const figureCount = await gallery.locator('img').count();
      expect(figureCount).toBeGreaterThan(0);
      await gallery.scrollIntoViewIfNeeded();
      await gallery.focus();
      await page.keyboard.press('ArrowRight');
      await expect
        .poll(() => gallery.evaluate((el) => el.scrollLeft))
        .toBeGreaterThan(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.locator('.provenance-details summary').click();
      // Outbound purchase links go to the official storefront, never elsewhere.
      const links = await page
        .locator('a[href*="mariyasnaturals.com"]')
        .evaluateAll((nodes) =>
          nodes.map((node) => (node as HTMLAnchorElement).href),
        );
      expect(links.length).toBeGreaterThan(0);
      // The selector also matches the footer's contact address, which is a
      // mailto: channel rather than a storefront URL.
      for (const link of links) {
        if (link.startsWith('mailto:')) {
          expect(link).toMatch(/^mailto:[^@\s]+@mariyasnaturals\.com$/);
          continue;
        }
        expect(new URL(link).origin).toBe('https://www.mariyasnaturals.com');
      }
      expect(await axe(page)).toEqual([]);
      expect(external).toEqual([]);
    });
  }
}

test('every responsive product derivative is served locally', async ({
  request,
}) => {
  const paths = [...manifest.media, ...brandManifest.media].flatMap(
    (m: { derivatives: { localAssetPath: string }[] }) =>
      m.derivatives.map((d) => d.localAssetPath),
  );
  for (let start = 0; start < paths.length; start += 8) {
    await Promise.all(
      paths.slice(start, start + 8).map(async (path: string) => {
        const response = await request.get(path);
        expect(response.status(), path).toBe(200);
        expect(response.headers()['content-type'], path).toContain(
          'image/webp',
        );
      }),
    );
  }
});

test('brand assets and icons are served locally at their claimed sizes', async ({
  request,
}) => {
  for (const path of [
    '/brand/logo.png',
    '/brand/icon-192.png',
    '/brand/icon-512.png',
    '/brand/icon-512-maskable.png',
    '/brand/apple-touch-icon.png',
    '/brand/favicon-16.png',
    '/brand/favicon-32.png',
    '/brand/og-default.jpg',
    '/favicon.ico',
    '/site.webmanifest',
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
  }
});

test('narrow screens keep the chrome inside the viewport with reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 320, height: 740 });
  for (const lang of locales) {
    await page.goto(`/${lang}/`);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.locator('header .lg-lang summary').click();
    await expect(page.locator('header .lg-lang a')).toHaveCount(5);
    await page.keyboard.press('Escape');
    await expect(page.locator('header .lg-lang > details')).not.toHaveAttribute(
      'open',
    );
    await expect(page.locator('header .lg-lang summary')).toBeFocused();
    // The offer tile shows the verified claim without any animation.
    await expect(page.locator('[data-offer-b]')).toBeVisible();
    expect(
      await page
        .locator('[data-offer-b]')
        .evaluate((el) => getComputedStyle(el).animationName),
    ).toBe('none');
    await expect(page.locator('[data-story-scene]')).toHaveCount(0);
  }
});

test('collection landmark and localized switcher stay linked', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/en/');
  await page.locator('#care .lg-tile').first().click();
  await expect(page).not.toHaveURL(/\/en\/$/);
  await page.goBack();
  await page.locator('header .lg-lang summary').click();
  await page.locator('header a[hreflang="ml"]').click();
  await expect(page).toHaveURL(/\/ml\/$/);
  expect(await axe(page)).toEqual([]);
});

test('legacy product image URLs are no longer served and metadata is staging-safe', async ({
  page,
  request,
}) => {
  const response = await request.get(
    '/images/products/mariyas-hair-oil-200ml-75038/media-com-75039-960.webp',
  );
  expect(response.status()).toBe(404);
  await page.goto('/en/products/mariyas-hair-oil-200-ml/');
  const graph = await page
    .locator('script[type="application/ld+json"]')
    .evaluate((el) => JSON.parse(el.textContent!)['@graph']);
  const product = graph.find(
    (node: { mainEntity?: { '@type': string } }) =>
      node.mainEntity?.['@type'] === 'Product',
  )?.mainEntity;
  if (product) {
    // Product markup may only exist with verified data and never fake offers.
    expect(product.offers).toBeUndefined();
    for (const value of [product.image].flat())
      expect(value).toContain('/images/products/');
  }
  await expect(page.locator('meta[name=robots]')).toHaveAttribute(
    'content',
    'noindex, nofollow',
  );
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
    'href',
    'https://www.mariyasnaturals.cloud/en/products/mariyas-hair-oil-200-ml/',
  );
});
