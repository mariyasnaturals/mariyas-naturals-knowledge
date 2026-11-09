import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
for (const lang of ['en', 'ml', 'hi', 'ta']) {
  test(`${lang}: mobile layout, navigation, animation and accessibility`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${lang}/`);
    await expect(page.locator('h1')).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.locator('.mobile-menu summary').click();
    await expect(page.locator('.mobile-menu nav')).toBeVisible();
    await page.locator('.mobile-menu a[href="#story"]').click();
    await page.locator('#products').scrollIntoViewIfNeeded();
    expect(
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
        .then((r) => r.violations),
    ).toEqual([]);
    expect(errors).toEqual([]);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.screenshot({
      path: `test-results/${lang}-mobile.png`,
      fullPage: true,
    });
  });
}
test('desktop, keyboard skip link and reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/en/');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
  await expect(page.locator('.desktop-nav')).toBeVisible();
  expect(
    await page
      .locator('[data-story-scene]')
      .first()
      .evaluate((el) => getComputedStyle(el).transform),
  ).toBe('none');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({
    path: 'test-results/en-desktop.png',
    fullPage: true,
  });
});
test('content and language navigation work without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/en/');
  await expect(page.locator('[data-story-scene]').first()).toBeVisible();
  await page.locator('header a[hreflang="ml"]').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ml');
  await context.close();
});

test('ScrollTrigger moves a scene into its resting position', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en/');
  const scene = page.locator('[data-story-scene]').last();
  const translation = () =>
    scene.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41);
  await expect.poll(translation).toBeGreaterThan(0);
  await scene.scrollIntoViewIfNeeded();
  await expect.poll(translation).toBe(0);
});

for (const width of [360, 768, 1440]) {
  test(`viewport ${width}: story skip, menu keyboard, localized product details`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/en/');
    await page.locator('.skip-story').click();
    await expect(page).toHaveURL(/#ingredients$/);
    if (width < 760) {
      await expect(page.locator('.mobile-bottom-nav')).toBeVisible();
      await page.locator('.mobile-menu summary').click();
      await page.keyboard.press('Escape');
      await expect(page.locator('.mobile-menu')).not.toHaveAttribute('open');
      await expect(page.locator('.mobile-menu summary')).toBeFocused();
    }
    await page.locator('.product-card a.button').click();
    await expect(page).toHaveURL(/\/en\/products\/hair-oil-example\/$/);
    await page.locator('header a[hreflang="ta"]').click();
    await expect(page).toHaveURL(/\/ta\/products\/hair-oil-example\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'ta');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
        .then((r) => r.violations),
    ).toEqual([]);
    await expect(page.locator('a[href*="mariyasnaturals.com"]')).toHaveCount(0);
  });
}

test('scroll progress advances and pinning is excluded on touch-sized screens', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en/');
  const progress = page.locator('.story-progress span');
  await page.locator('#story').scrollIntoViewIfNeeded();
  const before = await progress.evaluate(
    (el) => new DOMMatrix(getComputedStyle(el).transform).a,
  );
  await page.locator('#ingredients').scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      progress.evaluate(
        (el) => new DOMMatrix(getComputedStyle(el).transform).a,
      ),
    )
    .toBeGreaterThan(before);
  await expect(page.locator('.pin-spacer')).toHaveCount(0);
});

test('desktop pin is limited and resets for reduced motion', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/en/');
  await expect(page.locator('.pin-spacer')).toHaveCount(1);
  await page.locator('.story-stage').scrollIntoViewIfNeeded();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.pin-spacer')).toHaveCount(0);
  await expect(page.locator('.skip-story')).toBeVisible();
});
