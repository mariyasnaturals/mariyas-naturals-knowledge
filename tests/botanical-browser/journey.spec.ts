import { test, expect, devices } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const output = 'botanical-review-results';
mkdirSync(output, { recursive: true });
for (const [width, height] of [
  [1440, 900],
  [390, 844],
  [360, 800],
  [414, 896],
  [768, 1024],
]) {
  test(`${width}: continuous layers, forward/reverse/pause/resize, authentic final claim`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      ...(width < 760 ? devices['Pixel 7'] : {}),
      viewport: { width, height },
      recordVideo: { dir: `${output}/recordings`, size: { width, height } },
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('response', (r) => {
      if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
    });
    try {
      await page.goto('/en/');
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator('[data-story-scene]')).toHaveCount(8);
      const journey = page.locator('[data-botanical-journey]');
      await expect(journey).toHaveAttribute('data-motion', 'scroll');
      await expect(journey.locator('.botanical-study')).toHaveCount(30);
      const metrics = await page.locator('.botanical-track').evaluate((el) => ({
        top: el.getBoundingClientRect().top + scrollY,
        height: el.getBoundingClientRect().height - innerHeight,
      }));
      if (width < 760) {
        await page.evaluate(
          (top) => scrollTo({ top, behavior: 'instant' }),
          metrics.top,
        );
        const beforeY = await page.evaluate(() => scrollY);
        const client = await context.newCDPSession(page);
        await client.send('Input.dispatchTouchEvent', {
          type: 'touchStart',
          touchPoints: [{ x: width * 0.6, y: height * 0.77 }],
        });
        for (let i = 1; i <= 16; i++) {
          await client.send('Input.dispatchTouchEvent', {
            type: 'touchMove',
            touchPoints: [{ x: width * 0.6, y: height * 0.77 - i * 18 }],
          });
          await page.waitForTimeout(16);
        }
        await page.waitForTimeout(80);
        await client.send('Input.dispatchTouchEvent', {
          type: 'touchEnd',
          touchPoints: [],
        });
        await expect
          .poll(() => page.evaluate(() => scrollY))
          .toBeGreaterThan(beforeY + 200);
      }
      for (let i = 0; i < 8; i++) {
        const progress = i === 7 ? 0.985 : (i + 0.4) / 8;
        await page.evaluate(
          ({ top, height, progress }) =>
            scrollTo({ top: top + height * progress, behavior: 'instant' }),
          { ...metrics, progress },
        );
        await expect
          .poll(() => journey.getAttribute('data-progress'))
          .not.toBeNull();
        await expect
          .poll(() =>
            journey
              .locator('.botanical-environment img')
              .evaluate((el: HTMLImageElement) => el.naturalWidth),
          )
          .toBeGreaterThan(0);
        await page.waitForTimeout(180);
        for (const vessel of await journey
          .locator('.botanical-stage [data-vessel]')
          .all()) {
          if (
            await vessel.evaluate(
              (el) => Number(getComputedStyle(el).opacity) > 0.8,
            )
          ) {
            const v = await vessel.boundingBox();
            expect(v!.x).toBeGreaterThanOrEqual(0);
            expect(v!.x + v!.width).toBeLessThanOrEqual(width + 1);
            expect(v!.y).toBeGreaterThan(75);
            expect(v!.y + v!.height).toBeLessThan(
              height - (width < 760 ? 65 : 5),
            );
          }
        }
        await page.screenshot({
          path: `${output}/${width}-stage-${i + 1}.png`,
        });
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        const visible = await journey
          .locator('.botanical-study')
          .evaluateAll(
            (els) =>
              els.filter((el) => Number(getComputedStyle(el).opacity) > 0.15)
                .length,
          );
        expect(visible).toBeLessThanOrEqual(width < 760 ? 10 : 15);
        const caption = journey
          .locator('.botanical-caption-layer .botanical-copy')
          .nth(i);
        await expect(caption).toBeVisible();
        const box = await caption.boundingBox();
        expect(box!.y).toBeGreaterThan(75);
        expect(box!.y + box!.height).toBeLessThan(
          height - (width < 760 ? 65 : 20),
        );
      }
      await expect(journey.locator('.botanical-claim')).toHaveText(
        '60 Natural Ingredients',
      );
      await expect(journey.locator('.botanical-cta')).toHaveAttribute(
        'href',
        'https://www.mariyasnaturals.com/product/hair-care-oil-1l/',
      );
      const seekTime = async (time: number) => {
        await page.evaluate(
          ({ top, height, progress }) =>
            scrollTo({ top: top + height * progress, behavior: 'instant' }),
          { ...metrics, progress: time / 8.01 },
        );
        await page.waitForTimeout(150);
      };
      const opacity = (selector: string) =>
        journey
          .locator(selector)
          .evaluate((el) => Number(getComputedStyle(el).opacity));
      await expect(
        journey.locator(
          '.botanical-stage img[src*="glass-receiving"],.botanical-stage img[src*="copper-oil-vessel"],.botanical-stage img[src*="extraction-filter"],.botanical-stage img[src*="/pouring-vessel"]',
        ),
      ).toHaveCount(0);
      // Fine green extraction from a botanical filter is distinct from finished-oil transfer.
      await seekTime(4.55);
      expect(await opacity('[data-layer="extractor"]')).toBe(1);
      expect(await opacity('[data-layer="extract-stream"]')).toBe(1);
      expect(await opacity('[data-layer="pourer"]')).toBe(0);
      expect(await opacity('[data-layer="stream"]')).toBe(0);
      const extractionSurface = await journey
        .locator('[data-layer="fill"]')
        .evaluate((el) =>
          getComputedStyle(el).getPropertyValue('--liquid-surface'),
        );
      await seekTime(6.55);
      expect(await opacity('[data-layer="extractor"]')).toBe(0);
      expect(await opacity('[data-layer="pourer"]')).toBe(1);
      expect(await opacity('[data-layer="stream"]')).toBe(1);
      expect(
        await journey
          .locator('[data-layer="fill"]')
          .evaluate((el) =>
            getComputedStyle(el).getPropertyValue('--liquid-surface'),
          ),
      ).not.toBe(extractionSurface);
      await seekTime(4.55);
      expect(
        await journey
          .locator('[data-layer="fill"]')
          .evaluate((el) =>
            getComputedStyle(el).getPropertyValue('--liquid-surface'),
          ),
      ).toBe(extractionSurface);
      expect(await opacity('[data-layer="extractor"]')).toBe(1);
      expect(await opacity('[data-layer="pourer"]')).toBe(0);
      if (width < 760) {
        await seekTime(7.655);
        expect(await opacity('[data-layer="product"]')).toBe(1);
        expect(await opacity('.botanical-claim')).toBe(0);
        expect(await opacity('.botanical-cta')).toBe(0);
        await page.screenshot({ path: `${output}/${width}-bottle-first.png` });
        await seekTime(7.79);
        expect(await opacity('.botanical-claim')).toBeGreaterThan(0.6);
        expect(await opacity('.botanical-cta')).toBe(0);
        await page.screenshot({ path: `${output}/${width}-claim-second.png` });
      }
      await seekTime(7.94);
      if (width < 760) {
        const bottleBox = await journey
          .locator('[data-layer="product"]')
          .boundingBox();
        const claimBox = await journey
          .locator('.botanical-claim')
          .boundingBox();
        expect(bottleBox!.y + bottleBox!.height).toBeLessThan(claimBox!.y);
        expect(bottleBox!.height).toBeCloseTo(height * 0.42, 0);
        expect(await opacity('.botanical-cta')).toBe(1);
        await seekTime(7.79);
        expect(await opacity('.botanical-cta')).toBe(0);
        expect(await opacity('.botanical-claim')).toBeGreaterThan(0.6);
        await seekTime(7.655);
        expect(await opacity('.botanical-claim')).toBe(0);
        expect(await opacity('[data-layer="product"]')).toBe(1);
        await seekTime(7.94);
      }
      const product = journey.locator('[data-layer="product"] img');
      await expect(product).toHaveAttribute(
        'src',
        '/_botanical-assets/authentic-product-cutout.webp',
      );
      expect(
        await product.evaluate(
          (el: HTMLImageElement) => el.complete && el.naturalWidth === 245,
        ),
      ).toBe(true);
      await expect(journey.locator('[data-layer="product"]')).toHaveCSS(
        'opacity',
        '1',
      );
      const middle = async () => {
        await page.evaluate(
          ({ top, height }) =>
            scrollTo({ top: top + height * 0.65, behavior: 'instant' }),
          metrics,
        );
        await page.waitForTimeout(150);
        return journey.locator('[data-layer="copper"]').getAttribute('style');
      };
      const forward = await middle();
      await page.waitForTimeout(200);
      expect(
        await journey.locator('[data-layer="copper"]').getAttribute('style'),
      ).toBe(forward);
      await page.evaluate(
        ({ top, height }) =>
          scrollTo({ top: top + height * 0.95, behavior: 'instant' }),
        metrics,
      );
      await page.waitForTimeout(100);
      expect(await middle()).toBe(forward);
      await page.setViewportSize({ width: width < 760 ? 980 : 390, height });
      await page.waitForTimeout(150);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await expect(
        journey.locator('.botanical-caption-layer .botanical-copy'),
      ).toHaveCount(8);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect(journey).toHaveAttribute('data-motion', 'reduced');
      await expect(journey.locator('[data-botanical-step] h3')).toHaveCount(8);
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await expect(
        journey.locator('.botanical-caption-layer .botanical-copy'),
      ).toHaveCount(8);
      expect(errors).toEqual([]);
      await expect(page.locator('.pin-spacer')).toHaveCount(0);
    } finally {
      await context.close();
    }
  });
}
for (const lang of ['en', 'ml', 'hi', 'ta'])
  test(`${lang}: reduced motion retains all eight readable stages and final feature/CTA`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      reducedMotion: 'reduce',
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    try {
      await page.goto(`/${lang}/`);
      await expect(page.locator('[data-botanical-journey]')).toHaveAttribute(
        'data-motion',
        'reduced',
      );
      await expect(page.locator('[data-botanical-step]')).toHaveCount(8);
      await expect(page.locator('.botanical-stage')).toBeHidden();
      await page.locator('#botanical-finale').scrollIntoViewIfNeeded();
      await expect(page.locator('.botanical-claim')).toBeVisible();
      const bottle = await page
        .locator('#botanical-finale .botanical-static > img')
        .boundingBox();
      const claim = await page.locator('.botanical-claim').boundingBox();
      expect(bottle!.y + bottle!.height).toBeLessThan(claim!.y);
      await page.screenshot({ path: `${output}/${lang}-reduced-final.png` });
    } finally {
      await context.close();
    }
  });
test('without JavaScript, journey remains readable and skip/product links work', async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  try {
    await page.goto('/en/');
    await page.evaluate(() => document.fonts.ready);
    await page.locator('.botanical-skip').click();
    await expect(
      page.locator('#botanical-finale .botanical-cta'),
    ).toBeVisible();
    await expect(page.locator('.botanical-stage')).toBeHidden();
  } finally {
    await context.close();
  }
});

test('save-data uses the static accessible journey without scroll effects', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  await context.addInitScript(() =>
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: { saveData: true },
    }),
  );
  const page = await context.newPage();
  try {
    await page.goto('/en/');
    await expect(page.locator('[data-botanical-journey]')).toHaveAttribute(
      'data-motion',
      'reduced',
    );
    await expect(page.locator('[data-botanical-step] h3')).toHaveCount(8);
  } finally {
    await context.close();
  }
});

test('botanical journey passes automated accessibility checks', async ({
  browser,
}) => {
  const { default: AxeBuilder } = await import('@axe-core/playwright');
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  try {
    await page.goto('/en/');
    await page.locator('#botanical-finale').scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
    const result = await new AxeBuilder({ page })
      .include('#botanical-journey')
      .analyze();
    expect(result.violations).toEqual([]);
  } finally {
    await context.close();
  }
});

for (const lang of ['en', 'ml', 'hi', 'ta'])
  test(`${lang}: mobile final bottle precedes readable localized feature and CTA`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${lang}/`);
    await page.evaluate(() => document.fonts.ready);
    await page.locator('.botanical-track').evaluate((el) =>
      scrollTo({
        top:
          el.getBoundingClientRect().top +
          scrollY +
          (el.getBoundingClientRect().height - innerHeight) * 0.99,
        behavior: 'instant',
      }),
    );
    await page.waitForTimeout(200);
    const product = await page.locator('[data-layer="product"]').boundingBox();
    const copy = await page
      .locator('.botanical-caption-layer .botanical-copy')
      .last()
      .boundingBox();
    expect(product!.y + product!.height).toBeLessThan(copy!.y);
    expect(copy!.y + copy!.height).toBeLessThan(844 - 65);
    await expect(page.locator('.botanical-cta')).toHaveCSS('opacity', '1');
    await page.screenshot({ path: `${output}/${lang}-mobile-final.png` });
  });

for (const [width, height] of [
  [390, 844],
  [768, 1024],
])
  test(`${width}: brass geometry survives orientation changes and image decoding`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/en/');
    await page.locator('#botanical-journey').scrollIntoViewIfNeeded();
    const initial = await page.locator('.botanical-track').boundingBox();
    await page
      .locator('.botanical-stage img')
      .evaluateAll((imgs) =>
        Promise.all(imgs.map((img) => (img as HTMLImageElement).decode())),
      );
    expect(await page.locator('.botanical-track').boundingBox()).toEqual(
      initial,
    );
    await page.setViewportSize({ width: height, height: width });
    await page.waitForTimeout(200);
    for (const time of [4.55, 5.55, 6.55]) {
      await page.locator('.botanical-track').evaluate(
        (el, time) =>
          scrollTo({
            top:
              el.getBoundingClientRect().top +
              scrollY +
              ((el.getBoundingClientRect().height - innerHeight) * time) / 8.01,
            behavior: 'instant',
          }),
        time,
      );
      await page.waitForTimeout(120);
      for (const vessel of await page
        .locator('.botanical-stage [data-vessel]')
        .all()) {
        if (
          await vessel.evaluate(
            (el) => Number(getComputedStyle(el).opacity) > 0.8,
          )
        ) {
          const v = await vessel.boundingBox();
          expect(v!.x).toBeGreaterThanOrEqual(0);
          expect(v!.x + v!.width).toBeLessThanOrEqual(height + 1);
          expect(v!.y).toBeGreaterThan(75);
          expect(v!.y + v!.height).toBeLessThan(width - 5);
        }
      }
    }
  });
