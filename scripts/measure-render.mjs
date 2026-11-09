// Reproducible local observations. These are not field Core Web Vitals.
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
const root = resolve('dist');
const output = resolve(
  process.env.REVIEW_OUTPUT_DIR || 'test-results/task03-review',
);
await mkdir(output, { recursive: true });
const server = createServer(async (request, response) => {
  try {
    let file = resolve(
      root,
      '.' +
        decodeURIComponent(new URL(request.url, 'http://localhost').pathname),
    );
    if (file !== root && !file.startsWith(root + '/'))
      throw new Error('Invalid path');
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    const mime = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css',
      '.js': 'text/javascript',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.woff2': 'font/woff2',
    };
    response.writeHead(200, {
      'Content-Type': mime[extname(file)] || 'application/octet-stream',
    });
    response.end(await readFile(file));
  } catch {
    response.writeHead(404);
    response.end();
  }
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
let browser;
try {
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  const observations = [];
  const scenarios = [];
  for (const width of [390, 1440]) {
    for (const motion of ['reduce', 'no-preference']) {
      for (let sample = 1; sample <= 3; sample++)
        scenarios.push({
          lang: 'en',
          width,
          motion,
          sample,
          profile: 'local-unthrottled',
        });
    }
    for (const lang of ['ml', 'hi', 'ta'])
      scenarios.push({
        lang,
        width,
        motion: 'no-preference',
        sample: 1,
        profile: 'local-unthrottled',
      });
  }
  for (let sample = 1; sample <= 3; sample++)
    scenarios.push({
      lang: 'en',
      width: 390,
      motion: 'no-preference',
      sample,
      profile: 'simulated-mobile',
    });
  for (const scenario of scenarios) {
    const { lang, width, motion, sample, profile } = scenario;
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: motion,
    });
    const page = await context.newPage();
    if (profile === 'simulated-mobile') {
      const client = await context.newCDPSession(page);
      await client.send('Network.enable');
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        latency: 150,
        downloadThroughput: 1_600_000 / 8,
        uploadThroughput: 750_000 / 8,
      });
      await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    }
    await page.addInitScript(() => {
      window.__renderMetrics = {
        lcpMs: null,
        lcpElement: null,
        cls: 0,
        shifts: [],
      };
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          window.__renderMetrics.lcpMs = e.startTime;
          window.__renderMetrics.lcpElement = e.element?.tagName || null;
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((list) => {
        for (const e of list.getEntries())
          if (!e.hadRecentInput) {
            window.__renderMetrics.cls += e.value;
            window.__renderMetrics.shifts.push({
              value: e.value,
              nodes: e.sources?.map(
                (s) => s.node?.className || s.node?.tagName,
              ),
            });
          }
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto(`http://127.0.0.1:${server.address().port}/${lang}/`);
    await page.evaluate(() => document.fonts.ready);
    await page.locator('.hero-product img').evaluate((el) => el.decode());
    await page.waitForTimeout(1000);
    const metrics = await page.evaluate(() => ({
      ...window.__renderMetrics,
      resourceTransferBytes: performance
        .getEntriesByType('resource')
        .reduce((sum, entry) => sum + entry.transferSize, 0),
      fontResources: performance
        .getEntriesByType('resource')
        .filter((entry) => entry.name.endsWith('.woff2'))
        .map((entry) => ({
          path: new URL(entry.name).pathname,
          bytes: entry.transferSize,
        })),
      heroImage: document
        .querySelector('.hero-product img')
        .currentSrc.split(location.origin)[1],
    }));
    observations.push({ ...scenario, ...metrics, inp: 'not measured' });
    if (
      sample === 1 &&
      profile === 'local-unthrottled' &&
      motion === 'reduce'
    ) {
      const viewport = width === 390 ? 'mobile' : 'desktop';
      await page.screenshot({ path: `${output}/${viewport}.png` });
      await page.evaluate(async () => {
        const images = Array.from(document.images);
        for (const img of images) img.loading = 'eager';
        await Promise.all(images.map((img) => img.decode().catch(() => {})));
      });
      await page.screenshot({
        path: `${output}/${viewport}-full.png`,
        fullPage: true,
      });
      console.log(
        JSON.stringify({
          width,
          stage: await page
            .locator('.story-product, .story-product img, .story-orbit')
            .evaluateAll((els) =>
              els.map((el) => ({
                class: el.className,
                rect: {
                  width: el.getBoundingClientRect().width,
                  height: el.getBoundingClientRect().height,
                },
                cssHeight: getComputedStyle(el).height,
              })),
            ),
        }),
      );
      await page.goto(
        `http://127.0.0.1:${server.address().port}/${lang}/products/mariyas-hair-oil/`,
      );
      await page.evaluate(() => document.fonts.ready);
      await page
        .locator('.product-detail-media > .product-visual img')
        .evaluate((el) => el.decode());
      await page.screenshot({ path: `${output}/product-${viewport}.png` });
    }
    if (lang !== 'en' && sample === 1)
      await page.screenshot({ path: `${output}/${lang}-${width}.png` });
    await context.close();
  }
  const report = {
    measuredOn: new Date().toISOString(),
    method:
      'Local production static files, fresh Chromium context per sample. Initial CLS observation ends 1s after fonts and hero image decode; no scrolling/interactions during measurement. English: 3 samples per viewport and motion setting. Other locales: 1 sample per viewport. Simulated mobile: 3 English samples, 150ms latency, 1.6Mbps down / 750kbps up, 4x CPU slowdown via CDP. Server sends uncompressed files. These are lab observations, not Lighthouse scores, field CWV or INP measurements. Authentic local images are integrated.',
    observations,
  };
  await writeFile(
    resolve(output, 'local-performance.json'),
    JSON.stringify(report, null, 2) + '\n',
  );
  const median = (values) =>
    [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
  for (const profile of ['local-unthrottled', 'simulated-mobile'])
    for (const width of [390, 1440])
      for (const motion of ['reduce', 'no-preference']) {
        const rows = observations.filter(
          (r) =>
            r.lang === 'en' &&
            r.profile === profile &&
            r.width === width &&
            r.motion === motion,
        );
        if (rows.length)
          console.log(
            JSON.stringify({
              profile,
              width,
              motion,
              samples: rows.length,
              medianLcpMs: median(rows.map((r) => r.lcpMs)),
              maxCls: Math.max(...rows.map((r) => r.cls)),
              bytes: rows[0].resourceTransferBytes,
            }),
          );
      }
} finally {
  await browser?.close();
  await new Promise((done) => server.close(done));
}
