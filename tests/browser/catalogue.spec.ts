import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
const manifest = JSON.parse(
  readFileSync('src/data/media-manifest.json', 'utf8'),
);
const fonts = {
  en: ['Inter Variable', 'Cormorant Garamond Variable'],
  ml: ['Noto Sans Malayalam Variable', 'Noto Serif Malayalam Variable'],
  hi: ['Noto Sans Devanagari Variable', 'Noto Serif Devanagari Variable'],
  ta: ['Noto Sans Tamil Variable', 'Noto Serif Tamil Variable'],
};
for (const lang of ['en', 'ml', 'hi', 'ta'] as const) {
  for (const width of [390, 1440]) {
    test(`${lang} ${width}: fonts, collection, original images and gallery`, async ({
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
              document.fonts.check(`400 24px "${family}"`),
            ),
          fonts[lang],
        ),
      ).toBe(true);
      // Inspect the actual platform font used for the heading, beyond CSS intent.
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
        manifest.products.length,
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
            .analyze()
        ).violations,
      ).toEqual([]);
      await page.goto(`/${lang}/products/mariyas-hair-oil/`);
      expect(
        await page
          .locator('h1')
          .evaluate((el) => getComputedStyle(el).fontFamily),
      ).toContain('Cormorant Garamond Variable');
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
      await expect(page.locator('.image-gallery img')).toHaveCount(8);
      await page.locator('.image-gallery').scrollIntoViewIfNeeded();
      await page.locator('.image-gallery').focus();
      await page.keyboard.press('ArrowRight');
      await expect
        .poll(() =>
          page.locator('.image-gallery').evaluate((el) => el.scrollLeft),
        )
        .toBeGreaterThan(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.locator('.provenance-details summary').click();
      await expect(page.locator('[data-source-reference]')).toHaveCount(2);
      await expect(
        page.locator(
          'a[href*="mariyasnaturals.com"]:not([data-source-reference])',
        ),
      ).toHaveCount(0);
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
            .analyze()
        ).violations,
      ).toEqual([]);
      expect(external).toEqual([]);
    });
  }
}
test('every responsive product derivative is served locally', async ({
  request,
}) => {
  const paths = manifest.media.flatMap(
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
test('touch navigation supports narrow screens and reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 320, height: 740 });
  for (const lang of ['en', 'ml', 'hi', 'ta']) {
    await page.goto(`/${lang}/`);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.locator('header .language-menu summary').click();
    await expect(page.locator('header .language-menu a')).toHaveCount(4);
    await page.keyboard.press('Escape');
    await expect(page.locator('header .language-menu')).not.toHaveAttribute(
      'open',
    );
    await expect(page.locator('header .language-menu summary')).toBeFocused();
    await page.locator('#story-scene-5').scrollIntoViewIfNeeded();
    await expect(page.locator('.scene-reveal img')).toBeVisible();
    await expect(page.locator('.pin-spacer')).toHaveCount(0);
    expect(
      await page
        .locator('[data-story-scene]')
        .last()
        .evaluate((el) => getComputedStyle(el).transform),
    ).toBe('none');
  }
});
