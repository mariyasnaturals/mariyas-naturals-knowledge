// Local single-run render observations; these are not field Core Web Vitals.
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
const root = resolve('dist');
const output = resolve(process.env.REVIEW_OUTPUT_DIR || 'test-results/review');
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
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  const observations = [];
  for (const width of [390, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.__renderMetrics = { lcpMs: null, cls: 0 };
      new PerformanceObserver((list) => {
        for (const e of list.getEntries())
          window.__renderMetrics.lcpMs = e.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((list) => {
        for (const e of list.getEntries())
          if (!e.hadRecentInput) window.__renderMetrics.cls += e.value;
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto(`http://127.0.0.1:${server.address().port}/en/`);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => window.__renderMetrics.lcpMs !== null);
    const metrics = await page.evaluate(() => ({
      ...window.__renderMetrics,
      resourceTransferBytes: performance
        .getEntriesByType('resource')
        .reduce((sum, entry) => sum + entry.transferSize, 0),
    }));
    observations.push({
      width,
      ...metrics,
      inp: 'not measured; no representative interaction sample',
    });

    await page.screenshot({
      path: `${output}/${width === 390 ? 'mobile' : 'desktop'}.png`,
    });
    await page.screenshot({
      path: `${output}/${width === 390 ? 'mobile' : 'desktop'}-full.png`,
      fullPage: true,
    });
    await context.close();
  }
  const report = {
    method:
      'Single unthrottled local static-server run per viewport; fresh Chromium context, reduced motion, English homepage, before scrolling. CLS sum covers only initial render. No authentic product image is loaded. Not a Lighthouse score or field CWV result.',
    observations,
  };
  await writeFile(
    resolve(output, 'local-performance.json'),
    JSON.stringify(report, null, 2) + '\n',
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
