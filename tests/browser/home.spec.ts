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
  // The duplicated photographic sections are gone; the single hero and the
  // botanical journey below it carry no ScrollTrigger pinning.
  await expect(page.locator('[data-story-scene]')).toHaveCount(0);
  expect(
    await page
      .locator('.cinema-hero')
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
  await expect(page.locator('.cinema-hero')).toBeVisible();
  await expect(page.locator('[data-botanical-journey]')).toBeVisible();
  await page.locator('header .language-menu summary').click();
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
  // The corrected journey is scroll-driven, reversible and pin-free: native
  // scroll drives the camera dolly (vertical on portrait, horizontal on desktop).
  const journey = page.locator('[data-botanical-journey]');
  const progress = () =>
    journey.evaluate((el) => Number(el.getAttribute('data-progress') ?? 0));
  await journey.scrollIntoViewIfNeeded();
  const start = await progress();
  await page.evaluate(() =>
    scrollBy({ top: innerHeight * 2, behavior: 'instant' }),
  );
  await expect.poll(progress).toBeGreaterThan(start);
  // Reversing must retrace the same path: the camera position at a given scroll
  // offset is identical whether it was reached going down or coming back up.
  const forward = await progress();
  await page.evaluate(() =>
    scrollBy({ top: -innerHeight, behavior: 'instant' }),
  );
  await expect.poll(progress).toBeLessThan(forward);
  await page.evaluate(() =>
    scrollBy({ top: innerHeight, behavior: 'instant' }),
  );
  await expect.poll(progress).toBeCloseTo(forward, 2);
  await expect(page.locator('.pin-spacer')).toHaveCount(0);
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
    await page.locator('.product-card a.button').first().click();
    await expect(page).toHaveURL(/\/en\/products\/mariyas-hair-oil-200-ml\/$/);
    await page.locator('header .language-menu summary').click();
    await page.locator('header a[hreflang="ta"]').click();
    await expect(page).toHaveURL(/\/ta\/products\/mariyas-hair-oil-200-ml\/$/);
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
    await expect(
      page.locator(
        'a[href*="mariyasnaturals.com"]:not([data-source-reference])',
      ),
    ).toHaveCount(0);
  });
}

test('mobile chapters advance without pinning or substitute imagery', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en/');
  await page.locator('#story').scrollIntoViewIfNeeded();
  // The hero carries its eight film chapters internally; there are no separate
  // scene frames any more, and nothing is pinned.
  await expect(page.locator('.cinema-hero')).toHaveCount(1);
  await expect(page.locator('.cinema-frame')).toHaveCount(0);
  await expect(page.locator('.cinema-chapters')).toHaveCount(0);
  await expect(page.locator('.pin-spacer')).toHaveCount(0);
});

test('desktop uses natural scrolling and resets animation for reduced motion', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/en/');
  await expect(page.locator('.pin-spacer')).toHaveCount(0);
  const journey = page.locator('[data-botanical-journey]');
  await journey.scrollIntoViewIfNeeded();
  await expect(journey).toHaveAttribute('data-motion', 'scroll');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.pin-spacer')).toHaveCount(0);
  await expect(page.locator('.story-experience')).not.toHaveAttribute(
    'data-chapter',
  );
  // Reduced motion restores the eight accessible stages to normal flow.
  await expect(journey).toHaveAttribute('data-motion', 'reduced');
  await expect(page.locator('[data-scene]')).toHaveCount(8);
});
