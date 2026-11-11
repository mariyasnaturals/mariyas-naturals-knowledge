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
      await expect(film).toHaveAttribute('data-fit', 'contain');
      await expect(video).toHaveCSS('object-fit', 'contain');
      await expect(page.locator('.cinema-hero-copy')).toHaveCSS('opacity', '0');
      const finale = page.locator('#story-scene-8');
      await finale.evaluate((element) =>
        element.scrollIntoView({ block: 'start', behavior: 'instant' }),
      );
      await expect(page.locator('html')).toHaveClass(/cinema-past-hero/);
      await expect
        .poll(() =>
          finale
            .locator('img')
            .evaluateAll((images) =>
              images.every((image) => (image as HTMLImageElement).complete),
            ),
        )
        .toBe(true);
      const model = await finale.locator('.cinema-final-model').boundingBox();
      const product = await finale
        .locator('.cinema-product-reveal')
        .boundingBox();
      const overlap =
        Math.max(
          0,
          Math.min(model!.x + model!.width, product!.x + product!.width) -
            Math.max(model!.x, product!.x),
        ) *
        Math.max(
          0,
          Math.min(model!.y + model!.height, product!.y + product!.height) -
            Math.max(model!.y, product!.y),
        );
      expect(overlap).toBe(0);
      const visiblePortrait = await finale
        .locator('.cinema-final-model > img')
        .evaluate((image: HTMLImageElement) => {
          const { width, height } = image.getBoundingClientRect();
          if (getComputedStyle(image).objectFit === 'contain')
            return {
              left: 0,
              right: image.naturalWidth,
              top: 0,
              bottom: image.naturalHeight,
            };
          const scale = Math.max(
            width / image.naturalWidth,
            height / image.naturalHeight,
          );
          const left = (image.naturalWidth - width / scale) * 0.14;
          const top = (image.naturalHeight - height / scale) * 0.5;
          return {
            left,
            right: left + width / scale,
            top,
            bottom: top + height / scale,
          };
        });
      // Bounds of the face, held bottle and long hair in the supplied portrait.
      expect(visiblePortrait.left).toBeLessThan(150);
      expect(visiblePortrait.right).toBeGreaterThan(750);
      expect(visiblePortrait.top).toBeLessThan(20);
      expect(visiblePortrait.bottom).toBeGreaterThan(700);
      expect(product!.width).toBeGreaterThan(
        width < 760 ? width * 0.8 : width * 0.23,
      );
      await expect(finale.locator('.cinema-product-reveal img')).toHaveCSS(
        'object-fit',
        'contain',
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
        await finale
          .locator('.cinema-final-product')
          .evaluate((element) =>
            element.scrollIntoView({ block: 'start', behavior: 'instant' }),
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
