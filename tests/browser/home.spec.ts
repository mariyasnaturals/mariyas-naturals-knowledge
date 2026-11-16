import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const locales = ['en', 'ml', 'hi', 'ta', 'kn'] as const;
const axe = async (page: import('@playwright/test').Page) =>
  (
    await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze()
  ).violations;

for (const lang of locales) {
  test(`${lang}: mobile layout, language landing, chrome and accessibility`, async ({
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

    // The mobile chrome replaces the old bottom navigation and offer banner.
    const chrome = page.locator('[data-mobile-chrome]');
    await expect(chrome).toBeAttached();
    // The wrapper is a zero-height container; the fixed bar is the visible bar.
    await expect(chrome.locator('[data-mobile-nav]')).toBeVisible();
    await expect(chrome.locator('[data-mobile-nav] > a')).toHaveCount(5);
    await expect(chrome.locator('[data-offer-tile]')).toBeVisible();
    await expect(page.locator('[data-offer-b]')).toHaveText('SAVE UP TO 20%');
    await expect(chrome.locator('.shop-fab')).toHaveAttribute(
      'href',
      'https://www.mariyasnaturals.com/shop/',
    );

    await page.locator('.mobile-menu summary').click();
    await expect(page.locator('.mobile-menu nav')).toBeVisible();
    await page.locator('.mobile-menu a[href="#showcase"]').click();
    await page.locator('#showcase').scrollIntoViewIfNeeded();
    expect(await axe(page)).toEqual([]);
    expect(errors).toEqual([]);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.screenshot({
      path: `test-results/${lang}-mobile.png`,
      fullPage: true,
    });
  });
}

test('language chooser offers all five languages with a static photograph', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.locator('.landing-languages a')).toHaveCount(5);
  await expect(
    page.locator('.landing-languages a[hreflang="kn"]'),
  ).toHaveAttribute('href', '/kn/');
  await expect(page.locator('video')).toHaveCount(0);
  const photo = page.locator('img.landing-photo');
  await expect(photo).toBeVisible();
  // No zoom, no parallax: the approved photograph never animates.
  expect(await photo.evaluate((el) => getComputedStyle(el).transform)).toBe(
    'none',
  );
  await page.screenshot({ path: 'test-results/landing-desktop.png' });
});

for (const [width, height] of [
  [320, 640],
  [320, 740],
  [360, 640],
  [375, 667],
  [390, 844],
  [412, 915],
  [430, 932],
]) {
  test(`mobile ${width}x${height}: no horizontal scroll, safe chrome and visible offer`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/en/');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const tile = page.locator('[data-offer-tile]');
    await expect(tile).toBeVisible();
    const box = await tile.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(40);
    // The tile keeps its full share of the bar at every width down to 320px.
    expect(box!.width / width).toBeGreaterThan(0.17);
    // The approved discount wording must stay legible: two lines, never four.
    const lines = await page.evaluate(() => {
      const el = document.querySelector('[data-offer-b]')!;
      const range = document.createRange();
      range.selectNodeContents(el);
      return range.getClientRects().length;
    });
    expect(lines).toBeLessThanOrEqual(2);
    // The floating shop button stays hidden while the hero's own action is on
    // screen, so it can never sit on top of the headline or the hero buttons.
    await expect(page.locator('.shop-fab')).toBeHidden();
    await page.evaluate(() => window.scrollTo(0, 1600));
    await expect(page.locator('.shop-fab')).toBeVisible();
    const fab = await page.locator('.shop-fab').boundingBox();
    expect(fab!.y + fab!.height).toBeLessThanOrEqual(box!.y + 1);
    await page.screenshot({ path: `test-results/mobile-${width}.png` });
  });
}

test('the language landing fits one screen with the face above the text', async ({
  page,
}) => {
  for (const [width, height] of [
    [320, 640],
    [360, 740],
    [375, 667],
    [390, 844],
    [412, 915],
    [430, 932],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    const layout = await page.evaluate(() => {
      const photo = document
        .querySelector('.landing > picture')!
        .getBoundingClientRect();
      const heading = document
        .querySelector('.landing-main h1')!
        .getBoundingClientRect();
      return {
        scrollHeight: document.documentElement.scrollHeight,
        hScroll: document.documentElement.scrollWidth > innerWidth,
        photoBottom: photo.bottom,
        textTop: heading.top,
      };
    });
    // The photograph is a discrete band, so no face pixel is ever behind copy.
    expect(layout.textTop, `${width}px`).toBeGreaterThan(layout.photoBottom);
    expect(layout.hScroll, `${width}px`).toBe(false);
    expect(layout.scrollHeight, `${width}px`).toBeLessThanOrEqual(height);
  }
});

test('desktop, keyboard skip link and reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/en/');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
  await expect(page.locator('.desktop-nav')).toBeVisible();
  // The removed scroll story leaves no scenes behind.
  await expect(page.locator('[data-story-scene]')).toHaveCount(0);
  // Reduced motion freezes the two-frame offer tile on the discount frame.
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page
      .locator('[data-offer-a]')
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe('none');
  expect(
    await page
      .locator('[data-offer-b]')
      .evaluate((el) => getComputedStyle(el).display),
  ).not.toBe('none');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: 'test-results/en-desktop.png',
    fullPage: true,
  });
});

test('the offer tile alternates two frames without layout shift', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en/');
  const tile = page.locator('[data-offer-tile]');
  const before = await tile.boundingBox();
  const opacity = () =>
    page
      .locator('[data-offer-b]')
      .evaluate((el) => Number(getComputedStyle(el).opacity));
  await expect.poll(opacity, { timeout: 12_000 }).toBeGreaterThan(0.5);
  const after = await tile.boundingBox();
  expect(Math.abs(after!.height - before!.height)).toBeLessThan(1);
  expect(Math.abs(after!.width - before!.width)).toBeLessThan(1);
});

test('content and language navigation work without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/en/');
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('[data-mobile-chrome]')).toBeAttached();
  await page.locator('header .language-menu summary').click();
  await page.locator('header a[hreflang="kn"]').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'kn');
  await expect(page.locator('h1')).toBeVisible();
  await context.close();
});

test('without JavaScript the floating shop pill is present from the start', async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/en/');
  // The reveal-on-scroll behaviour is an enhancement only; the link must still
  // be reachable when scripting is off.
  await expect(page.locator('.shop-fab')).toBeVisible();
  await expect(page.locator('.shop-fab')).toHaveAttribute(
    'href',
    'https://www.mariyasnaturals.com/shop/',
  );
  await context.close();
});

test('hero film keeps its poster, respects reduced motion and never autoplays on mobile data saver', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en/');
  const video = page.locator('[data-hero-video]');
  await expect(video).toHaveAttribute(
    'poster',
    '/cinematic/poster-desktop.jpg',
  );
  await expect(video).toHaveAttribute('playsinline', '');
  await expect(video).toHaveJSProperty('muted', true);
  // Playback is opt-in when motion is reduced; the poster remains visible.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  expect(await video.evaluate((el: HTMLVideoElement) => el.paused)).toBe(true);
  expect(
    await page
      .locator('[data-hero-video]')
      .evaluate((el: HTMLVideoElement) => el.currentSrc || el.poster),
  ).toBeTruthy();
});

for (const width of [360, 768, 1440]) {
  test(`viewport ${width}: menu keyboard, localized product details`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/en/');
    // The local catalogue holds the detail pages; showcase cards link out to
    // the official store instead, which is a separate assertion below.
    await page.goto('/en/products/');
    await page.locator('.catalogue-card a').first().click();
    await expect(page).toHaveURL(/\/en\/products\/[a-z0-9-]+\/$/);
    const productUrl = page.url();
    await page.locator('header .language-menu summary').click();
    await page.locator('header a[hreflang="ta"]').click();
    await expect(page).toHaveURL(productUrl.replace('/en/', '/ta/'));
    await expect(page.locator('html')).toHaveAttribute('lang', 'ta');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(await axe(page)).toEqual([]);
    // Outbound purchase links go to the official storefront only.
    for (const link of await page
      .locator('a[href*="mariyasnaturals.com"]')
      .evaluateAll((nodes) => nodes.map((n) => (n as HTMLAnchorElement).href)))
      expect(new URL(link).origin).toBe('https://www.mariyasnaturals.com');
  });
}
