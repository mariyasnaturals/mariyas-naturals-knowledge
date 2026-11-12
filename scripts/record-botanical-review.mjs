import { chromium, devices, expect } from '@playwright/test';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
const output = 'botanical-review-results';
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox'],
});
const evidence = [];
try {
  if (!process.argv.includes('--storyboard-only')) {
    for (const [width, height] of [
      [1440, 900],
      [390, 844],
    ]) {
      const context = await browser.newContext({
        ...(width < 760 ? devices['Pixel 7'] : {}),
        viewport: { width, height },
        recordVideo: { dir: `${output}/demos`, size: { width, height } },
      });
      const page = await context.newPage();
      const videoStarted = Date.now();
      const failures = [];
      page.on('pageerror', (e) => failures.push(e.message));
      try {
        await page.goto('http://127.0.0.1:4321/en/');
        await page.evaluate(() => document.fonts.ready);
        await page.locator('.cinema-play').click();
        const video = page.locator('video');
        await expect
          .poll(() =>
            video.evaluate(
              (v) => /** @type {HTMLVideoElement} */ (v).readyState,
            ),
          )
          .toBeGreaterThanOrEqual(2);
        await video.evaluate(async (element) => {
          const v = /** @type {HTMLVideoElement} */ (element);
          v.pause();
          await new Promise((resolve) => {
            v.addEventListener('seeked', resolve, { once: true });
            v.currentTime = 14.8;
          });
        });
        await page.screenshot({
          path: `${output}/${width}-frame-00-existing-hero.png`,
          scale: 'css',
        });
        await page.locator('#botanical-journey').scrollIntoViewIfNeeded();
        await page.waitForTimeout(1200);
        const metrics = await page
          .locator('.botanical-track')
          .evaluate((el) => ({
            top: el.getBoundingClientRect().top + scrollY,
            distance: el.getBoundingClientRect().height - innerHeight,
          }));
        await page.evaluate(
          (top) => scrollTo({ top, behavior: 'instant' }),
          metrics.top,
        );
        await page.waitForTimeout(400);
        const client = await context.newCDPSession(page);
        // Actual browser input drives native scrolling; the site contains no autoplay journey.
        const progress = async () =>
          Number(
            await page
              .locator('[data-botanical-journey]')
              .getAttribute('data-progress'),
          );
        const scroll = async (distance, speed) => {
          if (width >= 760) {
            await client.send('Input.synthesizeScrollGesture', {
              x: Math.round(width * 0.6),
              y: Math.round(height * 0.65),
              yDistance: -distance,
              speed,
              gestureSourceType: 'mouse',
              preventFling: true,
            });
            return;
          }
          const target = (await page.evaluate(() => scrollY)) + distance;
          for (let gesture = 0; gesture < 50; gesture++) {
            const beforeY = await page.evaluate(() => scrollY);
            const remaining = target - beforeY;
            if (Math.abs(remaining) < 25) return;
            const segment =
              Math.sign(remaining) *
              Math.min(Math.abs(remaining), height * 0.42);
            const startY = height * (segment > 0 ? 0.78 : 0.26);
            const steps = Math.max(8, Math.ceil(Math.abs(segment) / 20));
            const delay = Math.max(
              12,
              Math.round(((Math.abs(segment) / speed) * 1000) / steps),
            );
            await client.send('Input.dispatchTouchEvent', {
              type: 'touchStart',
              touchPoints: [{ x: Math.round(width * 0.6), y: startY }],
            });
            for (let i = 1; i <= steps; i++) {
              await client.send('Input.dispatchTouchEvent', {
                type: 'touchMove',
                touchPoints: [
                  {
                    x: Math.round(width * 0.6),
                    y: startY - (segment * i) / steps,
                  },
                ],
              });
              await page.waitForTimeout(delay);
            }
            await page.waitForTimeout(80);
            await client.send('Input.dispatchTouchEvent', {
              type: 'touchEnd',
              touchPoints: [],
            });
            await page.waitForTimeout(40);
            const afterY = await page.evaluate(() => scrollY);
            if (Math.abs(afterY - beforeY) < 2)
              throw new Error('Native touch gesture did not move the document');
          }
          throw new Error('Native touch target was not reached');
        };
        const forwardStart = (Date.now() - videoStarted) / 1000;
        if (width < 760) {
          // Native touch checkpoints make the approved bottle → feature → CTA order reviewable.
          const advanceTo = async (target) =>
            scroll(
              metrics.top +
                metrics.distance * target -
                (await page.evaluate(() => scrollY)),
              300,
            );
          await advanceTo(7.66 / 8.01);
          await page.waitForTimeout(1000);
          await page.screenshot({
            path: `${output}/${width}-bottle-first-full-resolution.png`,
          });
          await advanceTo(7.79 / 8.01);
          await page.waitForTimeout(1000);
          await page.screenshot({
            path: `${output}/${width}-claim-second-full-resolution.png`,
          });
          await advanceTo(0.995);
        } else await scroll(metrics.distance * 0.995, 300);
        await expect.poll(progress).toBeGreaterThan(0.985);
        const forwardProgress = await progress();
        await page.waitForTimeout(1800);
        await page.screenshot({
          path: `${output}/${width}-final-full-resolution.png`,
        });
        const before = await page
          .locator('[data-botanical-journey]')
          .getAttribute('data-progress');
        await page.waitForTimeout(1000);
        const paused =
          before ===
          (await page
            .locator('[data-botanical-journey]')
            .getAttribute('data-progress'));
        const reverseStart = (Date.now() - videoStarted) / 1000;
        await scroll(-metrics.distance * 0.985, 500);
        await expect.poll(progress).toBeLessThan(0.03);
        const reverseProgress = await progress();
        await page.waitForTimeout(600);
        const reverseEnd = (Date.now() - videoStarted) / 1000;
        await scroll(metrics.distance * 0.985, 500);
        await expect.poll(progress).toBeGreaterThan(0.98);
        const restoredProgress = await progress();
        await page.waitForTimeout(1200);
        expect(paused).toBe(true);
        expect(failures).toEqual([]);
        evidence.push({
          width,
          height,
          emulation:
            width < 760
              ? 'Pixel 7 Chromium touch; not physical Android'
              : 'Desktop Chromium',
          nativeInput: true,
          forwardProgress,
          reverseProgress,
          restoredProgress,
          paused,
          errors: failures,
          videoSegments: {
            forwardStart,
            forwardEnd: reverseStart,
            reverseStart,
            reverseEnd,
          },
        });
        console.log(
          `Recorded actual ${width}px forward/reverse scroll and pause`,
        );
      } finally {
        const recording = page.video();
        await context.close();
        if (recording)
          await recording.saveAs(`${output}/botanical-${width}.webm`);
      }
    }
  }
  const labels = [
    'Botanical Origin',
    'Botanical Studies',
    'Coming Together',
    'Artistic Preparation',
    'Botanical Extraction',
    'Black–Dark Green Oil',
    'The Final Pour',
    'Original Mariyas Reveal',
  ];
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1270 },
    deviceScaleFactor: 1,
  });
  await page.setContent(
    `<html><head><style>*{box-sizing:border-box}body{margin:0;background:#071a13;color:#f5f0e5;font-family:Georgia,serif;padding:52px}header{border-bottom:1px solid #c5a46a66;padding-bottom:30px;margin-bottom:34px;display:flex;justify-content:space-between;align-items:end}h1{font-size:45px;font-weight:400;margin:10px 0}p{color:#c5a46a;letter-spacing:.08em;font-family:Arial,sans-serif;font-size:13px}main{display:grid;grid-template-columns:repeat(4,1fr);gap:24px}article{border:1px solid #c5a46a55;border-radius:12px;overflow:hidden;background:#0c251a}img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover}h2{font-size:22px;font-weight:400;margin:18px 16px}footer{color:#c5a46a;font:14px/1.7 Arial;margin-top:34px}</style></head><body><header><div><p>MARIYAS NATURALS · CINEMATIC BOTANICAL STUDY</p><h1>From nature. With care.</h1></div><p>AFTER THE EXISTING HERO · EIGHT CONTINUOUS STAGES</p></header><main>${labels.map((label, i) => `<article><img src="data:image/png;base64,${readFileSync(`${output}/1440-stage-${i + 1}.png`).toString('base64')}"><h2>${String(i + 1).padStart(2, '0')} &nbsp;${label}</h2></article>`).join('')}</main><footer>Thirty independently animated artistic botanical studies · Owner-confirmed “60 Natural Ingredients” · Original photographic product pixels retained<br>One continuous environment, independent layers, reversible native scrolling. Preparation is an artistic concept, not a verified factory process.</footer></body></html>`,
  );
  await page
    .locator('img')
    .evaluateAll((imgs) => Promise.all(imgs.map((i) => i.decode())));
  await page.screenshot({ path: `${output}/storyboard.png`, fullPage: true });
  await page.close();
  const board = await browser.newPage({
    viewport: { width: 1440, height: 1900 },
    deviceScaleFactor: 1,
  });
  const encoded = (path) =>
    `data:image/png;base64,${readFileSync(path).toString('base64')}`;
  await board.setContent(
    `<html><head><style>body{margin:0;padding:38px;background:#071a13;color:#f5f0e5;font-family:Georgia}h1{font-weight:400;font-size:38px}main{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}article{background:#0c251a;border:1px solid #c5a46a66;border-radius:10px;overflow:hidden}img{width:100%;display:block}h2{font-size:18px;font-weight:400;margin:14px}p{color:#c5a46a;font-family:Arial;font-size:14px}</style></head><body><h1>Mariyas Naturals · Mobile browser storyboard</h1><p>Eight native-scroll stages · Kerala-inspired artistic brass preparation · Original product pixels retained</p><main>${labels.map((label, i) => `<article><img src="${encoded(`${output}/390-stage-${i + 1}.png`)}"><h2>${i + 1}. ${label}</h2></article>`).join('')}</main></body></html>`,
  );
  await board
    .locator('img')
    .evaluateAll((imgs) => Promise.all(imgs.map((img) => img.decode())));
  await board.screenshot({
    path: `${output}/storyboard-mobile.png`,
    fullPage: true,
  });
  for (const width of [1440, 390]) {
    await board.setViewportSize({
      width: width === 1440 ? 1440 : 1000,
      height: 1000,
    });
    await board.setContent(
      `<html><head><style>body{margin:0;padding:32px;background:#071a13;color:#f5f0e5;font-family:Georgia}h1,h2{font-weight:400}main{display:grid;grid-template-columns:1fr 1fr;gap:20px}img{width:100%;display:block}p{color:#c5a46a;font:14px Arial}</style></head><body><h1>Kerala brass upgrade · ${width}px browser comparison</h1><p>LEFT: 94cb61e before · RIGHT: current review · screenshots from the implemented website</p><main>${[4, 5, 6, 7].map((stage) => `<section><h2>Stage ${stage} · Before</h2><img src="${encoded(`docs/screenshots/brass-review/before/${width}-stage-${stage}.png`)}"></section><section><h2>Stage ${stage} · Brass review</h2><img src="${encoded(`${output}/${width}-stage-${stage}.png`)}"></section>`).join('')}</main></body></html>`,
    );
    await board
      .locator('img')
      .evaluateAll((imgs) => Promise.all(imgs.map((img) => img.decode())));
    await board.screenshot({
      path: `${output}/before-after-${width}.png`,
      fullPage: true,
    });
  }
  await board.close();
  if (evidence.length)
    writeFileSync(
      `${output}/browser-evidence.json`,
      JSON.stringify(evidence, null, 2) + '\n',
    );
} finally {
  await browser.close();
}
