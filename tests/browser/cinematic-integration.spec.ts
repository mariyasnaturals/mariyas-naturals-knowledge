import { test, expect, devices, type Page } from '@playwright/test';
import assets from '../../src/data/cinematic-assets.json' with { type: 'json' };

async function pauseAt(page: Page, time: number) {
  await page
    .locator('video')
    .evaluate(async (video: HTMLVideoElement, seconds) => {
      video.pause();
      if (Math.abs(video.currentTime - seconds) < 0.001) return;
      await new Promise<void>((resolve) => {
        video.addEventListener('seeked', () => resolve(), { once: true });
        video.currentTime = seconds;
      });
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
    }, time);
}

for (const mode of ['desktop', 'android'] as const) {
  test(`${mode}: original footage, all chapter cues, authoritative photos and review screenshots`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      ...(mode === 'android'
        ? devices['Pixel 7']
        : { viewport: { width: 1440, height: 1000 } }),
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    const videoRequests: string[] = [];
    const errors: string[] = [];
    page.on('request', (request) => {
      if (request.url().endsWith('.mp4'))
        videoRequests.push(new URL(request.url()).pathname);
    });
    page.on('pageerror', (error) => errors.push(error.message));
    const videoRecord =
      mode === 'android' ? assets.videos.mobile : assets.videos.desktop;
    try {
      await page.goto('http://127.0.0.1:4321/en/');
      await page.evaluate(() => document.fonts.ready);
      await page.waitForLoadState('networkidle');
      expect(videoRequests).toEqual([]);
      await expect(page.locator('video')).toHaveAttribute(
        'src',
        videoRecord.src,
      );
      const play = page.locator('.cinema-play');
      if (mode === 'android') await play.tap();
      else await play.click();
      await expect
        .poll(() =>
          page
            .locator('video')
            .evaluate((video: HTMLVideoElement) => video.videoWidth),
        )
        .toBe(videoRecord.width);
      await expect(page.locator('video')).toBeVisible();
      for (const chapter of videoRecord.chapters) {
        await pauseAt(page, chapter.start + 0.05);
        await expect(page.locator('responsive-film')).toHaveAttribute(
          'data-current-chapter',
          chapter.id,
        );
      }
      await pauseAt(page, 6.75);
      await page
        .locator('responsive-film')
        .evaluate((element) =>
          element.scrollIntoView({ block: 'center', behavior: 'instant' }),
        );
      if (mode === 'android') {
        const controls = await play.boundingBox();
        const bottomNav = await page
          .locator('.mobile-bottom-nav')
          .boundingBox();
        expect(controls!.y + controls!.height).toBeLessThan(bottomNav!.y);
        const point = {
          x: controls!.x + controls!.width / 2,
          y: controls!.y + controls!.height / 2,
        };
        expect(
          await page.evaluate(
            ({ x, y }) =>
              document
                .elementFromPoint(x, y)
                ?.closest('button')
                ?.classList.contains('cinema-play'),
            point,
          ),
        ).toBe(true);
      }
      await page.screenshot({
        path: `test-results/integrated-${mode}-film.png`,
      });
      await expect(page.locator('.cinema-film-placeholder')).toBeHidden();
      await expect(
        page.locator('.cinema-frame[data-asset-state="ready"]'),
      ).toHaveCount(8);
      await expect(page.locator('.cinema-frame img')).toHaveCount(9);
      for (const [scene, reference] of [
        [3, 'product'],
        [4, 'model'],
      ] as const) {
        const frame = page.locator(`#story-scene-${scene} .cinema-frame`);
        const image = frame.locator('img');
        await frame.scrollIntoViewIfNeeded();
        await expect(image).toHaveAttribute(
          'src',
          assets.references[reference].src,
        );
        await expect
          .poll(() =>
            image.evaluate(
              (image: HTMLImageElement) =>
                image.complete && image.naturalWidth === 1280,
            ),
          )
          .toBe(true);
        await frame.screenshot({
          path: `test-results/integrated-${mode}-${reference}.png`,
        });
      }
      await page.locator('#story-scene-8').scrollIntoViewIfNeeded();
      await expect(page.locator('#story-scene-8 img')).toHaveCount(2);
      await page.screenshot({
        path: `test-results/integrated-${mode}-final.png`,
      });
      await page.locator('#story-scene-6 [data-watch-scene]').click();
      await expect(page).toHaveURL(/#cinema-film$/);
      await expect(page.locator('responsive-film')).toHaveAttribute(
        'data-current-chapter',
        'hair-shine',
      );
      expect([...new Set(videoRequests)]).toEqual([videoRecord.src]);
      expect(errors).toEqual([]);
      await expect(page.locator('.pin-spacer')).toHaveCount(0);
    } finally {
      await context.close();
    }
  });
}

test('resize maps a paused story moment between the actual desktop and mobile edits', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/en/');
  await page.locator('.cinema-play').click();
  await expect
    .poll(() =>
      page
        .locator('video')
        .evaluate((video: HTMLVideoElement) => video.readyState),
    )
    .toBeGreaterThanOrEqual(2);
  await pauseAt(page, 14.75);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.cinema-play').click();
  await expect
    .poll(() =>
      page
        .locator('video')
        .evaluate((video: HTMLVideoElement) => video.videoWidth),
    )
    .toBe(720);
  await expect(page.locator('responsive-film')).toHaveAttribute(
    'data-current-chapter',
    'final-hero',
  );
  const time = await page
    .locator('video')
    .evaluate((video: HTMLVideoElement) => {
      video.pause();
      return video.currentTime;
    });
  expect(time).toBeGreaterThanOrEqual(14.25);
  expect(time).toBeLessThan(14.8);
});

test('hair highlight stays masked to the original photograph and clears for reduced motion', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/en/');
  const scene = page.locator('#story-scene-6');
  await scene.scrollIntoViewIfNeeded();
  const highlight = scene.locator('.cinema-sweep');
  await expect
    .poll(() =>
      highlight.evaluate((element) =>
        Number(getComputedStyle(element).opacity),
      ),
    )
    .toBeGreaterThan(0.04);
  expect(
    await highlight.evaluate((element) =>
      Number(getComputedStyle(element).opacity),
    ),
  ).toBeLessThanOrEqual(0.17);
  await expect(scene.locator('img')).toHaveAttribute(
    'src',
    '/cinematic/original-model.jpg',
  );
  await expect(scene.locator('.cinema-hair-highlight')).toHaveCSS(
    'mask-image',
    /original-hair-mask\.png/,
  );
  await scene
    .locator('.cinema-frame')
    .screenshot({ path: 'test-results/integrated-desktop-hair-shine.png' });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(highlight).toHaveCSS('opacity', '0');
});
