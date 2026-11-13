import { test, expect, devices } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const [width, height] of [
  [1440, 900],
  [390, 844],
  [360, 800],
]) {
  test(`${width}px: immersive hero, preserved framing and independent finale`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      ...(width < 760 ? devices['Pixel 7'] : {}),
      viewport: { width, height },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    const videoRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().endsWith('.mp4'))
        videoRequests.push(new URL(request.url()).pathname);
    });
    try {
      await page.goto('http://127.0.0.1:4321/en/');
      await page.evaluate(() => document.fonts.ready);
      await page.waitForLoadState('networkidle');
      expect(videoRequests).toEqual([]);
      const hero = page.locator('.cinema-hero');
      const film = page.locator('responsive-film');
      const video = page.locator('video');
      await expect(hero).toHaveCSS('height', `${height}px`);
      expect((await hero.boundingBox())!.y).toBe(0);
      expect((await film.boundingBox())!.width).toBe(width);
      await page.locator('.cinema-play').click();
      await expect
        .poll(() =>
          video.evaluate((video: HTMLVideoElement) => video.readyState),
        )
        .toBeGreaterThanOrEqual(2);
      await video.evaluate(async (video: HTMLVideoElement) => {
        video.pause();
        await new Promise<void>((resolve) => {
          video.addEventListener('seeked', () => resolve(), { once: true });
          video.currentTime = 1.25;
        });
      });
      await expect(film).toHaveAttribute('data-fit', 'cover');
      await expect(page.locator('.cinema-hero-copy')).toHaveCSS('opacity', '1');
      await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
      await page.screenshot({
        path: `test-results/immersive-${width}-hero.png`,
        scale: 'css',
      });
      await video.evaluate(async (video: HTMLVideoElement) => {
        await new Promise<void>((resolve) => {
          video.addEventListener('seeked', () => resolve(), { once: true });
          video.currentTime = 6.75;
        });
      });
      await expect(film).toHaveAttribute('data-fit', 'cover');
      await expect(video).toHaveCSS('object-fit', 'cover');
      await expect(page.locator('.cinema-hero-copy')).toHaveCSS('opacity', '1');
      // The duplicated finale scene was removed with the other post-hero
      // sections; the story now closes on the botanical product reveal, which
      // must keep the authentic photographic bottle and no layout overlap.
      await page
        .locator('[data-botanical-journey]')
        .evaluate((element) =>
          element.scrollIntoView({ block: 'start', behavior: 'instant' }),
        );
      // The journey carries a header-height scroll margin, so the last slice of
      // hero is still on screen here; the header only switches once it is gone.
      await expect(page.locator('html')).not.toHaveClass(/cinema-past-hero/);
      await page.evaluate(() => scrollBy({ top: 140, behavior: 'instant' }));
      await expect(page.locator('html')).toHaveClass(/cinema-past-hero/);
      // This context runs with reduced motion, where the journey swaps the
      // animated world for accessible stills in normal flow. Either way the
      // finale must show the authentic photographic bottle, so target whichever
      // product photograph is actually visible.
      await page.locator('#botanical-finale').scrollIntoViewIfNeeded();
      const product = page
        .locator(
          '[data-layer="product"] img:visible, #botanical-finale .botanical-static-layer:visible',
        )
        .first();
      await expect(product).toBeVisible();
      await expect(product).toHaveAttribute(
        'src',
        /authentic-product-cutout\.webp$/,
      );
      await expect
        .poll(() =>
          product.evaluate(
            (image: HTMLImageElement) =>
              image.complete && image.naturalHeight === 745,
          ),
        )
        .toBe(true);
      const caption = await page
        .locator('.botanical-copy:has(.botanical-claim)')
        .boundingBox();
      const bottle = await product.boundingBox();
      const overlap =
        Math.max(
          0,
          Math.min(caption!.x + caption!.width, bottle!.x + bottle!.width) -
            Math.max(caption!.x, bottle!.x),
        ) *
        Math.max(
          0,
          Math.min(caption!.y + caption!.height, bottle!.y + bottle!.height) -
            Math.max(caption!.y, bottle!.y),
        );
      expect(overlap).toBe(0);
      expect(bottle!.height).toBeGreaterThan(
        width < 760 ? 150 : Math.min(900, width) * 0.3,
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await expect(page.locator('.cinema')).not.toContainText(
        /GOOGLE FLOW|Original photography|16:9 DESKTOP|9:16 MOBILE/,
      );
      await page.screenshot({
        path: `test-results/immersive-${width}-final-portrait.png`,
        scale: 'css',
      });
      if (width < 760)
        await page
          .locator('[data-layer="product"]')
          .evaluate((element) =>
            element.scrollIntoView({ block: 'center', behavior: 'instant' }),
          );
      await page.screenshot({
        path: `test-results/immersive-${width}-final.png`,
        scale: 'css',
      });
      expect([...new Set(videoRequests)]).toEqual([
        width < 760
          ? '/cinematic/homepage-mobile.mp4'
          : '/cinematic/homepage-desktop.mp4',
      ]);
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
            .analyze()
        ).violations,
      ).toEqual([]);
    } finally {
      await context.close();
    }
  });
}
