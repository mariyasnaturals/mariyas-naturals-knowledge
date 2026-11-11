// Read-only, real public staging verification. Never substitutes localhost evidence.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, devices, expect } from '@playwright/test';
const origin = 'https://www.mariyasnaturals.cloud';
const sha = process.argv[2];
assert.match(
  sha || '',
  /^[a-f0-9]{40}$/,
  'Supply the expected deployed source SHA',
);
const directory = 'ci-staging-bootstrap/live';
mkdirSync(directory, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox'],
});
const evidence = { source_sha: sha, origin, viewports: [] };
try {
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
    [360, 800],
  ]) {
    const context = await browser.newContext({
      ...(width < 760 ? devices['Pixel 7'] : {}),
      viewport: { width, height },
      recordVideo: { dir: directory, size: { width, height } },
    });
    try {
      const page = await context.newPage();
      const errors = [];
      const videos = new Set();
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('response', (r) => {
        if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
      });
      page.on('request', (r) => {
        if (r.url().includes('.mp4')) videos.add(new URL(r.url()).pathname);
      });
      const revision = await context.request.get(
        `${origin}/staging-revision.json?source=${sha}`,
      );
      assert.equal(revision.status(), 200);
      assert.equal((await revision.json()).source_sha, sha);
      const started = Date.now();
      await page.goto(`${origin}/en/`);
      await page.locator('.cinema-play').click();
      const video = page.locator('video');
      await expect
        .poll(() => video.evaluate((v) => v.currentTime))
        .toBeGreaterThan(0.1);
      const loadingMs = Date.now() - started;
      // Record actual playback, then inspect all eight synchronized captions.
      await page.waitForTimeout(15500);
      const times = await page
        .locator('responsive-film')
        .evaluate(
          (el, mobile) =>
            JSON.parse(
              el.dataset[mobile ? 'timelineMobile' : 'timelineDesktop'],
            ),
          width < 760,
        );
      const captions = new Set();
      for (const [i, chapter] of times.entries()) {
        await video.evaluate(
          async (v, time) => {
            v.pause();
            await new Promise((resolve) => {
              v.addEventListener('seeked', resolve, { once: true });
              v.currentTime = time;
            });
          },
          (chapter.start + chapter.end) / 2,
        );
        await expect(page.locator('responsive-film')).toHaveAttribute(
          'data-current-chapter',
          chapter.id,
        );
        await expect(page.locator('#hero-title')).toBeVisible();
        await expect(video).toHaveCSS('object-fit', 'cover');
        captions.add(await page.locator('#hero-title').textContent());
        await expect(
          page.locator('.cinema-film-caption,.cinema-film-counter'),
        ).toHaveCount(0);
        await page.screenshot({
          path: `${directory}/${width}-film-${i + 1}.png`,
        });
      }
      assert.equal(captions.size, 8);
      for (const scene of await page.locator('[data-story-scene]').all()) {
        await scene.scrollIntoViewIfNeeded();
        await expect(scene.locator('h3')).toBeVisible();
        await page.waitForTimeout(450);
      }
      await page.screenshot({ path: `${directory}/${width}-final.png` });
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      assert.deepEqual(
        [...videos],
        [
          width < 760
            ? '/cinematic/homepage-mobile.mp4'
            : '/cinematic/homepage-desktop.mp4',
        ],
      );
      await page.locator('#story-scene-6 [data-watch-scene]').click();
      await expect(page.locator('responsive-film')).toHaveAttribute(
        'data-current-chapter',
        'hair-shine',
      );
      assert.deepEqual(errors, []);
      evidence.viewports.push({
        width,
        height,
        loadingMs,
        captions: [...captions],
        videos: [...videos],
        errors,
      });
    } finally {
      await context.close();
    }
  }
  writeFileSync(
    `${directory}/evidence.json`,
    JSON.stringify(evidence, null, 2) + '\n',
  );
  console.log(
    `Verified actual public staging site: ${directory}/evidence.json`,
  );
} finally {
  await browser.close();
}
