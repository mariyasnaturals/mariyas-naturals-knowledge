import { test, expect, devices } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const output = 'botanical-review-results';
mkdirSync(output, { recursive: true });
for (const [width, height] of [
  [1440, 900],
  [390, 844],
  [360, 800],
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
