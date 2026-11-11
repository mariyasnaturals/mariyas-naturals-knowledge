import { test, expect, devices, type Page } from '@playwright/test';
import { fileURLToPath } from 'node:url';

async function attachFilms(page: Page, mobile = true) {
  await page.route('**/cinematic/test-*.mp4', (route) =>
    route.fulfill({
      path: fileURLToPath(
        new URL(
          route.request().url().endsWith('test-mobile.mp4')
            ? '../fixtures/cinematic-portrait.mp4'
            : '../fixtures/cinematic-landscape.mp4',
          import.meta.url,
        ),
      ),
      contentType: 'video/mp4',
    }),
  );
  await page.evaluate((hasMobile) => {
    const current = document.querySelector<HTMLElement>('responsive-film')!;
    const film = current.cloneNode(true) as HTMLElement;
    film.dataset.desktop = '/cinematic/test-desktop.mp4';
    delete film.dataset.mobile;
    if (hasMobile) film.dataset.mobile = '/cinematic/test-mobile.mp4';
    current.replaceWith(film);
  }, mobile);
}

test('Android Chromium emulation supports portrait playback and touch controls', async ({
  browser,
}) => {
  const context = await browser.newContext({
    ...devices['Pixel 7'],
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  try {
    await page.goto('http://127.0.0.1:4321/en/');
    await page.locator('responsive-film').scrollIntoViewIfNeeded();
    await attachFilms(page);
    await page.locator('.cinema-play').tap();
    await expect
      .poll(() =>
        page
          .locator('video')
          .evaluate(
            (el: HTMLVideoElement) => !el.paused && el.videoWidth === 90,
          ),
      )
      .toBe(true);
    await expect(page.locator('video')).toHaveAttribute('playsinline');
    expect(
      await page.evaluate(() => matchMedia('(pointer: coarse)').matches),
    ).toBe(true);
    expect(
      await page.evaluate(() => navigator.userAgent.includes('Android')),
    ).toBe(true);
    await page.locator('.cinema-play').tap();
    await expect
      .poll(() =>
        page.locator('video').evaluate((el: HTMLVideoElement) => el.paused),
      )
      .toBe(true);
  } finally {
    await context.close();
  }
});

for (const width of [360, 759, 760, 1440]) {
  test(`${width}px: correct integrated-media ratio, ordered chapters and no missing media requests`, async ({
    page,
  }) => {
    const missing: string[] = [];
    page.on('response', (response) => {
      if (response.status() >= 400) missing.push(response.url());
    });
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/en/');
    await expect(page.locator('[data-story-scene]')).toHaveCount(8);
    await expect(page.locator('video')).toHaveAttribute(
      'src',
      width < 760
        ? '/cinematic/homepage-mobile.mp4'
        : '/cinematic/homepage-desktop.mp4',
    );
    await expect(page.locator('.cinema-play')).toBeVisible();
    const heroBox = await page.locator('.cinema-hero').boundingBox();
    expect(heroBox!.width).toBe(width);
    expect(heroBox!.height).toBe(900);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({ path: `test-results/cinematic-${width}.png` });
    await page.locator('[data-chapter-link]').last().click();
    await expect(page).toHaveURL(/#story-scene-8$/);
    await expect(page.locator('.cinema')).toHaveAttribute('data-chapter', '8');
    await page.locator('[data-chapter-link]').first().click();
    await expect(page.locator('.cinema')).toHaveAttribute('data-chapter', '1');
    expect(missing).toEqual([]);
  });
}

test('one orientation loads, playback pauses offscreen, user pause persists, and resize selects the other cut', async ({
  page,
}) => {
  const requested: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/cinematic/test-'))
      requested.push(request.url());
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/en/');
  await attachFilms(page);
  const video = page.locator('video');
  await expect(video).toHaveAttribute('src', '/cinematic/test-desktop.mp4');
  await expect
    .poll(() =>
      video.evaluate(
        (el: HTMLVideoElement) => !el.paused && el.videoWidth === 160,
      ),
    )
    .toBe(true);
  expect(requested.every((url) => url.endsWith('test-desktop.mp4'))).toBe(true);
  await page.locator('.cinema-play').click();
  await expect
    .poll(() => video.evaluate((el: HTMLVideoElement) => el.paused))
    .toBe(true);
  await page.locator('#story-scene-8').scrollIntoViewIfNeeded();
  await page.locator('responsive-film').scrollIntoViewIfNeeded();
  await expect
    .poll(() => video.evaluate((el: HTMLVideoElement) => el.paused))
    .toBe(true);
  await page.locator('.cinema-play').click();
  await expect
    .poll(() => video.evaluate((el: HTMLVideoElement) => !el.paused))
    .toBe(true);
  await page.locator('#story-scene-8').scrollIntoViewIfNeeded();
  await expect
    .poll(() => video.evaluate((el: HTMLVideoElement) => el.paused))
    .toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('responsive-film').scrollIntoViewIfNeeded();
  await expect(video).toHaveAttribute('src', '/cinematic/test-mobile.mp4');
  await expect
    .poll(() => video.evaluate((el: HTMLVideoElement) => el.videoWidth))
    .toBe(90);
});

test('reduced motion prevents autoplay and live preference changes pause playback', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/en/');
  await attachFilms(page);
  const video = page.locator('video');
  await expect(video).toHaveAttribute('preload', 'none');
  await expect
    .poll(() => video.evaluate((el: HTMLVideoElement) => el.paused))
    .toBe(true);
  await page.locator('.cinema-play').click();
  await expect
    .poll(() => video.evaluate((el: HTMLVideoElement) => !el.paused))
    .toBe(true);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('#story-scene-8 .cinema-scene-copy')).not.toHaveCSS(
    'transform',
    'none',
  );
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect
    .poll(() => video.evaluate((el: HTMLVideoElement) => el.paused))
    .toBe(true);
});

test('save-data prevents autoplay, and missing orientation never requests the other cut', async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'connection', {
      value: Object.assign(new EventTarget(), { saveData: true }),
    }),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en/');
  await attachFilms(page, false);
  await expect(page.locator('video')).not.toHaveAttribute('src');
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator('video')).toHaveAttribute(
    'src',
    '/cinematic/test-desktop.mp4',
  );
  await expect
    .poll(() =>
      page.locator('video').evaluate((el: HTMLVideoElement) => el.paused),
    )
    .toBe(true);
});

test('failed video keeps a readable fallback and chapter navigation', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/en/');
  await page.route('**/cinematic/broken.mp4', (route) =>
    route.fulfill({ status: 404, body: '' }),
  );
  await page.evaluate(() => {
    const current = document.querySelector<HTMLElement>('responsive-film')!;
    const film = current.cloneNode(true) as HTMLElement;
    film.dataset.desktop = '/cinematic/broken.mp4';
    current.replaceWith(film);
  });
  // Browsers may discover the 404 during load(), before any play interaction.
  await page.locator('video').evaluate((el: HTMLVideoElement) => {
    void el.play().catch(() => {});
  });
  await expect(page.locator('[data-film-status]')).toHaveText(
    'The film is unavailable. Explore the chapters below.',
  );
  await expect(page.locator('.cinema-play')).toBeHidden();
  await page.locator('[data-chapter-link]').last().click();
  await expect(page).toHaveURL(/#story-scene-8$/);
});
