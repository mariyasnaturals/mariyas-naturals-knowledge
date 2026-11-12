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
      const failures = [];
      page.on('pageerror', (e) => failures.push(e.message));
      try {
        await page.goto('http://127.0.0.1:4322/en/');
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
        const scroll = async (distance, speed) =>
          client.send('Input.synthesizeScrollGesture', {
            x: Math.round(width * 0.6),
            y: Math.round(height * 0.65),
            yDistance: -distance,
            speed,
            gestureSourceType: width < 760 ? 'touch' : 'mouse',
            preventFling: true,
          });
        await scroll(metrics.distance * 0.985, 300);
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
        await scroll(-metrics.distance * 0.55, 500);
        await page.waitForTimeout(600);
        await scroll(metrics.distance * 0.55, 500);
        await page.waitForTimeout(1200);
        evidence.push({
          width,
          height,
          emulation:
            width < 760
              ? 'Pixel 7 Chromium touch; not physical Android'
              : 'Desktop Chromium',
          nativeInput: true,
          forward: true,
          reverse: true,
          paused,
          errors: failures,
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
  if (evidence.length)
    writeFileSync(
      `${output}/browser-evidence.json`,
      JSON.stringify(evidence, null, 2) + '\n',
    );
} finally {
  await browser.close();
}
