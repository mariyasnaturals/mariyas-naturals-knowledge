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
      // The eight photographic scene frames were removed by the owner
      // correction; the page keeps one cinematic hero and hands straight to the
      // botanical journey, which must still carry the authentic product reveal.
      await expect(page.locator('[data-story-scene]')).toHaveCount(0);
      await expect(page.locator('.cinema-frame')).toHaveCount(0);
      await expect(page.locator('.cinema-hero')).toHaveCount(1);
      await page.locator('[data-botanical-journey]').scrollIntoViewIfNeeded();
      await expect(page.locator('[data-botanical-journey]')).toBeVisible();
      await expect(
        page.locator('.botanical-copy:has(.botanical-claim) .botanical-claim'),
      ).toContainText('60');
      await page.screenshot({
        path: `test-results/integrated-${mode}-final.png`,
      });
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

test('the botanical journey clears its decorative overlay for reduced motion', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/en/');
  const journey = page.locator('[data-botanical-journey]');
  await journey.scrollIntoViewIfNeeded();
  await expect(journey).toHaveAttribute('data-motion', 'scroll');
  // Reduced motion must drop the animated overlay and keep every stage readable.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(journey).toHaveAttribute('data-motion', 'reduced');
  await expect(page.locator('.botanical-step')).toHaveCount(8);
  await expect(page.locator('.botanical-claim')).toContainText(
    /60\s*Natural Ingredients/,
  );
});
