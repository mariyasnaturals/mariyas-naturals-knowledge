import { test, expect, devices } from '@playwright/test';

for (const [width, height] of [
  [1440, 900],
  [390, 844],
  [360, 800],
]) {
  test(`${width}: every film chapter has a full-bleed image and a unique readable overlay`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      ...(width < 760 ? devices['Pixel 7'] : {}),
      viewport: { width, height },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    try {
      await page.goto('/en/');
      await page.locator('.cinema-play').click();
      const video = page.locator('video');
      await expect
        .poll(() => video.evaluate((v: HTMLVideoElement) => v.readyState))
        .toBeGreaterThanOrEqual(2);
      const times = await page
        .locator('responsive-film')
        .evaluate(
          (el, mobile) =>
            JSON.parse(
              (el as HTMLElement).dataset[
                mobile ? 'timelineMobile' : 'timelineDesktop'
              ]!,
            ),
          width < 760,
        );
      const captions = new Set<string>();
      for (const [i, chapter] of times.entries()) {
        await video.evaluate(
          async (v: HTMLVideoElement, time) => {
            v.pause();
            await new Promise<void>((resolve) => {
              v.addEventListener('seeked', () => resolve(), { once: true });
              v.currentTime = time;
            });
          },
          (chapter.start + chapter.end) / 2,
        );
        await expect(page.locator('responsive-film')).toHaveAttribute(
          'data-current-chapter',
          chapter.id,
        );
        await expect(video).toHaveCSS('object-fit', 'cover');
        await expect(page.locator('.cinema-hero-copy')).toHaveCSS(
          'opacity',
          '1',
        );
        await expect(page.locator('#hero-title')).toBeVisible();
        captions.add((await page.locator('#hero-title').textContent())!);
        await expect(
          page.locator('.cinema-film-caption,.cinema-film-counter'),
        ).toHaveCount(0);
        await expect(page.locator('.cinema')).not.toContainText(
          /0[1-8]\s*\/\s*08/,
        );
        expect(await page.evaluate(() => scrollY)).toBe(0);
        await page.screenshot({
          path: `test-results/fullbleed-${width}-${i + 1}.png`,
          scale: 'css',
        });
      }
      expect(captions.size).toBe(8);
      for (const scene of await page.locator('[data-story-scene]').all()) {
        await scene.scrollIntoViewIfNeeded();
        const image = scene.locator('img').first();
        await expect(image).toHaveCSS('object-fit', 'cover');
        const figure = await image.boundingBox();
        expect(figure!.width).toBeGreaterThan(
          width < 760 ? width - 1 : width * 0.5,
        );
        await expect(scene.locator('h3')).toBeVisible();
        if (await scene.locator('.cinema-final-product').count()) {
          const geometry = await scene
            .locator('.cinema-product-reveal')
            .evaluate((el) => ({
              image: el.getBoundingClientRect().height,
              panel: el.parentElement!.getBoundingClientRect().height,
            }));
          expect(geometry.image).toBeGreaterThanOrEqual(geometry.panel - 1);
        }
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    } finally {
      await context.close();
    }
  });
}
