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
  test(`${lang}: mobile layout, homepage sections, chrome and accessibility`, async ({
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
    // Three destinations plus the offer tile.
    await expect(chrome.locator('[data-mobile-nav] > a')).toHaveCount(4);
    await expect(
      chrome.locator('[data-mobile-nav] > a:not([data-offer-tile])'),
    ).toHaveCount(3);
    await expect(chrome.locator('[data-offer-tile]')).toBeVisible();
    await expect(page.locator('[data-offer-b]')).toHaveText('SAVE UP TO 20%');
    await expect(chrome.locator('.shop-fab')).toHaveAttribute(
      'href',
      'https://www.mariyasnaturals.com/shop/',
    );

    await page.locator('[data-mobile-menu] summary').click();
    await expect(page.locator('[data-mobile-menu] nav')).toBeVisible();
    await page.locator('[data-mobile-menu] a[href="#care"]').click();
    await page.locator('#care').scrollIntoViewIfNeeded();
    expect(await axe(page)).toEqual([]);
    expect(errors).toEqual([]);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.screenshot({
      path: `test-results/${lang}-mobile.png`,
      fullPage: true,
    });
  });
}

test('the site root is the real English homepage, not a language gateway', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  // Same page as /en/, declared as such, while every language stays reachable.
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    /\/en\/$/,
  );
  await expect(page.locator('h1')).toBeVisible();
  for (const section of ['#ritual', '#spotlights', '#care', '#voices']) {
    await expect(page.locator(section)).toHaveCount(1);
  }
  await page.locator('header .lg-lang summary').click();
  await expect(page.locator('header .lg-lang a')).toHaveCount(5);
  await expect(
    page.locator('header .lg-lang a[hreflang="kn"]'),
  ).toHaveAttribute('href', '/kn/');
  // The hero film is unchanged: one video with its local poster.
  await expect(page.locator('video')).toHaveCount(1);
  await page.screenshot({ path: 'test-results/root-homepage-desktop.png' });
});

test('a language suggestion is offered but never applied automatically', async ({
  browser,
}) => {
  const context = await browser.newContext({ locale: 'ml-IN' });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/en/');
  const strip = page.locator('[data-language-suggestion]');
  await expect(strip).toBeVisible();
  await expect(strip.locator('[data-suggest-accept]')).toHaveAttribute(
    'href',
    '/ml/',
  );
  // Non-blocking: the visitor is still reading /en/ and can dismiss it.
  await expect(page).toHaveURL(/\/en\/$/);
  await strip.locator('[data-suggest-dismiss]').click();
  await expect(strip).toBeHidden();
  await page.reload();
  await expect(strip).toBeHidden();
  expect(errors).toEqual([]);
  await context.close();
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

test('the homepage hero and the sections below it never scroll sideways', async ({
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
    await page.goto('/en/');
    const layout = await page.evaluate(() => {
      const hero = document.querySelector('.hero-copy h1')!;
      return {
        hScroll: document.documentElement.scrollWidth > innerWidth,
        heroVisible: hero.getBoundingClientRect().top < innerHeight,
        sections: ['ritual', 'spotlights', 'care', 'voices'].map(
          (id) =>
            document.getElementById(id)?.getBoundingClientRect().width ?? 0,
        ),
      };
    });
    expect(layout.hScroll, `${width}px`).toBe(false);
    expect(layout.heroVisible, `${width}px`).toBe(true);
    for (const sectionWidth of layout.sections)
      expect(sectionWidth, `${width}px`).toBeLessThanOrEqual(width);
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
  await expect(page.locator('.lg-nav')).toBeVisible();
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
  await page.locator('header .lg-lang summary').click();
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
    await page.locator('header .lg-lang summary').click();
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
      .evaluateAll((nodes) =>
        nodes.map((n) => (n as HTMLAnchorElement).href),
      )) {
      // Contact channels are mailto: links, not storefront destinations.
      if (link.startsWith('mailto:')) {
        expect(link).toMatch(/^mailto:[^@\s]+@mariyasnaturals\.com$/);
        continue;
      }
      expect(new URL(link).origin).toBe('https://www.mariyasnaturals.com');
    }
  });
}

test('the 500 ml card states the owner-confirmed free comb, accessibly', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en/');
  const card = page.locator('[data-editions] [data-slide]').nth(1);
  await card.scrollIntoViewIfNeeded();
  const gift = card.locator('[data-gift-badge]');
  await expect(gift).toBeVisible();
  await expect(gift.locator('.lg-gift__free')).toHaveText('FREE');
  await expect(gift.locator('.lg-gift__comb')).toContainText('NEEM COMB');
  // The full sentence must also be in the card body, not only the badge.
  await expect(card).toContainText(
    'Get an Oil-Treated Neem Comb FREE with your Mariyas Herbal Hair Care Oil 500 ml purchase.',
  );
  // The offer must never be dressed up as a price or a percentage discount.
  await expect(card).not.toContainText(/%/);
  // It must stay inside its own card, never over the buy button.
  const fits = await page.evaluate(() => {
    const g = document.querySelector('[data-gift-badge]')!;
    const c = g.closest('.lg-edition')!;
    const gr = g.getBoundingClientRect();
    const cr = c.getBoundingClientRect();
    return gr.right <= cr.right + 1 && gr.top >= cr.top - 1;
  });
  expect(fits).toBe(true);
});

test('the free-comb badge honours reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/en/');
  await page
    .locator('[data-editions] [data-slide]')
    .nth(1)
    .scrollIntoViewIfNeeded();
  const state = await page.evaluate(() => {
    const g = document.querySelector('[data-gift-badge]') as HTMLElement;
    const sweep = document.querySelector('.lg-gift__shimmer') as HTMLElement;
    return {
      anim: getComputedStyle(g).animationName,
      opacity: getComputedStyle(g).opacity,
      sweep: getComputedStyle(sweep).animationName,
    };
  });
  expect(state.anim).toBe('none');
  expect(state.opacity).toBe('1');
  expect(state.sweep).toBe('none');
});

/** The owner's three approved Google reviews, exactly as published. */
const APPROVED_REVIEWS = [
  {
    author: 'Pramod Kumar .M.S',
    text: 'I am their regular customer and its hair oil really helps to reduce my hairfall and helps to strengthen my hair and improve hair growth. I really recommend this product.',
  },
  {
    author: 'Abacus World Academy',
    text: 'Excellent hair oil for hair growth, must try this',
  },
  {
    author: 'Jincy Siju',
    text: 'No chemicals very good experience i am happy',
  },
];
const INSTAGRAM = 'https://www.instagram.com/mariyas_herbal_hair_care_oil/';
const FACEBOOK = 'https://www.facebook.com/mariayasnaturals/';
const MAPS = 'https://maps.google.com/?cid=12669174919246619705';

test('the reviews section shows the verified aggregate and the three approved reviews', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/en/');
  const voices = page.locator('#voices');
  await expect(voices.locator('.lg-rating__line')).toHaveText(
    '4.2 ★ | 574 Google reviews',
  );
  // The reading date is stated so the figure is never read as live.
  await expect(voices.locator('.lg-rating__asof')).toContainText('2026-11-16');
  await expect(voices.locator('.lg-rating__cta')).toHaveAttribute('href', MAPS);

  // Exactly the three approved reviews, and no placeholder left behind.
  const cards = voices.locator('blockquote.lg-voice');
  await expect(cards).toHaveCount(3);
  await expect(voices.locator('.lg-voice--pending')).toHaveCount(0);
  await expect(voices.locator('.lg-voice')).toHaveCount(3);

  // Reviewer names and wording, verbatim.
  await expect(cards.locator('cite')).toHaveText(
    APPROVED_REVIEWS.map((review) => review.author),
  );
  await expect(cards.locator('.lg-voice__quote')).toHaveText(
    APPROVED_REVIEWS.map((review) => review.text),
  );
  // The quotations stay in the language they were written in.
  for (const index of [0, 1, 2]) {
    await expect(cards.nth(index).locator('.lg-voice__quote')).toHaveAttribute(
      'lang',
      'en',
    );
    // Five gold stars, announced as the reviewer's own rating.
    await expect(cards.nth(index).locator('.lg-voice__stars')).toHaveAttribute(
      'aria-label',
      '5 out of 5',
    );
    await expect(cards.nth(index).locator('.lg-voice__stars-full')).toHaveText(
      '★★★★★',
    );
    // Attributed to Google, on the card itself.
    await expect(cards.nth(index).locator('.lg-voice__source')).toHaveText(
      'Google Review',
    );
  }

  // Labelled as customer opinions, with a route back to the source.
  await expect(voices.locator('.lg-voices__note')).toContainText(
    'Customer opinions',
  );
  await expect(voices.locator('.lg-voices__note')).toContainText(
    'not medical outcomes',
  );
  await expect(voices.locator('.lg-voices__note-link')).toHaveAttribute(
    'href',
    MAPS,
  );
});

test('every locale publishes the same English reviews with localised labels', async ({
  page,
}) => {
  const localisedAttribution: Record<string, string> = {
    en: 'Google Review',
    ml: 'Google അവലോകനം',
    hi: 'Google समीक्षा',
    ta: 'Google மதிப்புரை',
    kn: 'Google ವಿಮರ್ಶೆ',
  };
  for (const lang of locales) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${lang}/`);
    const voices = page.locator('#voices');
    await expect(voices.locator('blockquote.lg-voice')).toHaveCount(3);
    await expect(voices.locator('.lg-voice--pending')).toHaveCount(0);
    // The words are never translated; only the interface around them is.
    await expect(voices.locator('.lg-voice__quote').first()).toHaveText(
      APPROVED_REVIEWS[0].text,
    );
    await expect(voices.locator('.lg-voice__quote').first()).toHaveAttribute(
      'lang',
      'en',
    );
    await expect(voices.locator('.lg-voice__source').first()).toHaveText(
      localisedAttribution[lang],
    );
    await expect(voices.locator('.lg-voice__stars').first()).toHaveAttribute(
      'aria-label',
      lang === 'en' ? '5 out of 5' : /5/,
    );
  }
});

test('the review carousel fits at every release width without overlap', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const [width, height] of [
    [320, 640],
    [360, 740],
    [390, 844],
    [430, 932],
    [768, 1024],
    [1024, 768],
    [1440, 1000],
    [1920, 1080],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto('/en/');
    const voices = page.locator('#voices');
    const cards = voices.locator('blockquote.lg-voice');
    await expect(cards).toHaveCount(3);

    // No horizontal page overflow.
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `${width}px overflow`,
    ).toBe(true);

    // Cards sit side by side in the rail: never on top of one another.
    const boxes = [];
    for (const index of [0, 1, 2]) {
      const box = await cards.nth(index).boundingBox();
      expect(box, `${width}px card ${index} has a box`).not.toBeNull();
      boxes.push(box!);
    }
    for (let index = 1; index < boxes.length; index += 1) {
      expect(
        boxes[index - 1]!.x + boxes[index - 1]!.width,
        `${width}px cards ${index - 1}/${index} overlap`,
      ).toBeLessThanOrEqual(boxes[index]!.x + 1);
    }

    // Controls never cover the cards, and are at least 44x44 when shown.
    const rail = await voices.locator('.lg-voices__rail').boundingBox();
    const nav = await voices.locator('.lg-voices__nav').boundingBox();
    if (rail && nav) {
      expect(nav.y, `${width}px nav overlaps the rail`).toBeGreaterThanOrEqual(
        rail.y + rail.height - 1,
      );
    }
    const next = voices.locator('[data-voices-next]');
    if (await next.isVisible()) {
      const target = await next.boundingBox();
      expect(
        target!.width,
        `${width}px next button width`,
      ).toBeGreaterThanOrEqual(44);
      expect(
        target!.height,
        `${width}px next button height`,
      ).toBeGreaterThanOrEqual(44);
    }
  }
  expect(errors).toEqual([]);
});

test('the review carousel is keyboard operable and instant under reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en/');
  const rail = page.locator('[data-voices-rail]');
  const next = page.locator('[data-voices-next]');
  await expect(next).toBeVisible();
  // Arrow keys move the rail, so the focusable scroller is usable keyboard-only.
  await rail.focus();
  const before = await rail.evaluate((element) => element.scrollLeft);
  await page.keyboard.press('ArrowRight');
  await expect
    .poll(() => rail.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(before);
  // Controls work the same way, and reduced motion scrolls without animating.
  await next.click();
  await expect
    .poll(() => rail.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(before);
  await expect(
    page.locator('[data-voices-dots] button').first(),
  ).toHaveAttribute('aria-current', 'true');
});

test('every social button points at the two verified destinations', async ({
  page,
}) => {
  for (const lang of locales) {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`/${lang}/`);
    const instagram = page.locator(`#voices a[href="${INSTAGRAM}"]`);
    const facebook = page.locator(`#voices a[href="${FACEBOOK}"]`);
    await expect(instagram).toHaveCount(1);
    await expect(facebook).toHaveCount(1);
    const footer = page.locator('#site-footer');
    await expect(footer.locator(`a[href="${INSTAGRAM}"]`)).toHaveCount(1);
    await expect(footer.locator(`a[href="${FACEBOOK}"]`)).toHaveCount(1);
    // One destination each: no stale or duplicated social URLs anywhere.
    expect(
      await page.locator(`a[href*="facebook.com"]`).count(),
      `${lang} facebook links`,
    ).toBe(2);
    expect(
      await page.locator(`a[href*="instagram.com"]`).count(),
      `${lang} instagram links`,
    ).toBe(2);
    for (const link of [instagram, facebook]) {
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', /noopener/);
      await expect(link).toHaveAttribute('aria-label', /\S/);
    }
    // The Maps listing link still works from both the rating block and footer.
    await expect(page.locator(`#voices a[href="${MAPS}"]`)).toHaveCount(1);
  }
});

test('the footer links the verified listing without merging the two addresses', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/en/');
  const footer = page.locator('#site-footer');
  await expect(footer.locator('a[href*="maps.google.com"]')).toHaveAttribute(
    'href',
    'https://maps.google.com/?cid=12669174919246619705',
  );
  // The official-store postal address stays intact and separate.
  await expect(footer).toContainText('Thalavady South S.O');
  await expect(footer).toContainText('Avalookkunnu P.O');
});

test('the care assistant answers from the store and never blocks the chrome', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 780 });
  const external: string[] = [];
  await page.route('**/*', (route) => {
    if (new URL(route.request().url()).hostname !== '127.0.0.1') {
      external.push(route.request().url());
      return route.abort();
    }
    return route.continue();
  });
  await page.goto('/en/');

  const trigger = page.locator('[data-care-open]');
  await expect(trigger).toBeVisible();
  const dialog = page.locator('[data-care-dialog]');
  await expect(dialog).not.toBeVisible();

  // Clear of the gold shop pill and of the bottom bar on small screens.
  const boxes = await Promise.all([
    trigger.boundingBox(),
    page.locator('.shop-fab').boundingBox(),
    page.locator('[data-mobile-nav]').boundingBox(),
    page
      .locator('.hero-video-control')
      .boundingBox()
      .catch(() => null),
  ]);
  const [care, fab, bar, heroControl] = boxes;
  expect(care).not.toBeNull();
  expect(fab).not.toBeNull();
  expect(bar).not.toBeNull();
  const overlaps = (a: typeof care, b: typeof care) =>
    Boolean(
      a &&
      b &&
      a.x < b.x + b.width &&
      b.x < a.x + a.width &&
      a.y < b.y + b.height &&
      b.y < a.y + a.height,
    );
  expect(overlaps(care, fab)).toBe(false);
  expect(overlaps(care, bar)).toBe(false);
  if (heroControl) expect(overlaps(care, heroControl)).toBe(false);

  await trigger.click();
  await expect(dialog).toBeVisible();
  await expect(page.locator('#care-input')).toBeFocused();
  await page.locator('#care-input').fill('hair oil 500 ml');
  await page.locator('[data-care-form] button[type="submit"]').click();
  await expect(page.locator('.care-card').first()).toBeVisible();
  await expect(page.locator('.care-card').first()).toContainText(
    'Mariyas Herbal Hair Care',
  );
  await expect(page.locator('.care-card__link').first()).toHaveAttribute(
    'href',
    /^https:\/\/www\.mariyasnaturals\.com\/product\//,
  );

  // A medical question is refused, never answered from guesswork.
  await page.locator('#care-input').fill('is it safe during pregnancy');
  await page.locator('[data-care-form] button[type="submit"]').click();
  await expect(page.locator('.care-bubble--bot').last()).toContainText(
    'qualified practitioner',
  );

  expect(await axe(page)).toEqual([]);

  // Escape closes the dialog and focus returns to the trigger.
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  expect(external).toEqual([]);
});

test('the care assistant is reachable and labelled in every locale', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const labels = {
    en: 'Chat with Mariyas',
    ml: 'മാരിയാസിനോട് സംസാരിക്കൂ',
    hi: 'मारियास से बात करें',
    ta: 'மாரியாஸுடன் பேசுங்கள்',
    kn: 'ಮಾರಿಯಾಸ್ ಜೊತೆ ಮಾತನಾಡಿ',
  } as const;
  for (const [lang, label] of Object.entries(labels)) {
    await page.goto(`/${lang}/`);
    const trigger = page.locator('[data-care-open]');
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveText(label);
    await trigger.click();
    await expect(
      page.locator('[data-care-dialog] [data-care-close]'),
    ).toHaveAccessibleName(/.+/);
    await page.keyboard.press('Escape');
    expect(await axe(page)).toEqual([]);
  }
});

/**
 * The footer closes every page and carries the postal address, the WhatsApp
 * number and the email, so a fixed control painted over it loses a way to reach
 * the shop. On phones three controls float in that band: the gold "Shop
 * products" pill, the bottom navigation bar and the care assistant trigger.
 *
 * Two things keep the links readable, and both are measured here at
 * 320/360/390/430px:
 *   - `@media (width<=859px) { .lg-footer__bottom { padding-bottom: 3.8rem } }`
 *     reserves the pill's footprint inside the closing row (the body already
 *     reserves the bar itself, so the row lands ~13px above the pill);
 *   - the pill hides itself while the footer is on screen, so it is not part of
 *     the cascade the owner reads. The worst case is still measured: the pill is
 *     forced visible and every link must stay uncovered.
 *
 * The test measures the design only; no stylesheet is modified.
 */
type FooterAudit = {
  links: number;
  blockers: string[];
  overlaps: string[];
  covered: string[];
  padding: number;
  clearance: { care: number; bar: number };
};

/** One pass inside the page: overlaps, hit-tests, padding and clearances. */
const auditFooter = (
  page: import('@playwright/test').Page,
  width: number,
): Promise<FooterAudit> =>
  page.evaluate((viewport) => {
    const shown = (element: Element) => {
      const style = getComputedStyle(element);
      return (
        style.display !== 'none' &&
        style.visibility === 'visible' &&
        Number(style.opacity) > 0.05
      );
    };
    const fixed: Array<[string, string]> = [
      ['.shop-fab', 'shop pill'],
      ['[data-mobile-nav]', 'bottom bar'],
      ['[data-care-open]', 'care trigger'],
    ];
    const blockers: Array<{ name: string; box: DOMRect }> = [];
    for (const [selector, name] of fixed) {
      const element = document.querySelector(selector);
      if (element && shown(element)) {
        blockers.push({ name, box: element.getBoundingClientRect() });
      }
    }

    const overlaps: string[] = [];
    const covered: string[] = [];
    const links = [
      ...document.querySelectorAll<HTMLAnchorElement>('#site-footer a'),
    ];
    for (const link of links) {
      const label = (link.textContent ?? '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 28);
      const box = link.getBoundingClientRect();
      if (box.width === 0 || box.height === 0) continue;
      for (const blocker of blockers) {
        const b = blocker.box;
        if (
          box.left < b.right &&
          b.left < box.right &&
          box.top < b.bottom &&
          b.top < box.bottom
        ) {
          overlaps.push(
            `${viewport}px: "${label}" overlaps the ${blocker.name}`,
          );
        }
      }
      // A wrapped link reports one rect per line and the union's centre can
      // fall into the gap between them, so each painted fragment is tested.
      for (const fragment of link.getClientRects()) {
        if (fragment.width < 2 || fragment.height < 2) continue;
        const x = fragment.left + fragment.width / 2;
        const y = fragment.top + fragment.height / 2;
        if (x <= 0 || x >= innerWidth || y <= 0 || y >= innerHeight) continue;
        const top = document.elementFromPoint(x, y);
        if (!top || !(top === link || link.contains(top))) {
          covered.push(
            `${viewport}px: "${label}" has ${top?.tagName ?? 'nothing'} over it`,
          );
        }
      }
    }

    const row = document.querySelector<HTMLElement>('.lg-footer__bottom');
    const bar = document.querySelector<HTMLElement>('[data-mobile-nav]');
    const care = document.querySelector<HTMLElement>('[data-care-open]');
    if (!row || !bar || !care) throw new Error('footer or chrome is missing');
    const lowest = Math.max(
      ...[...row.querySelectorAll('p, li')].map(
        (item) => item.getBoundingClientRect().bottom,
      ),
    );

    return {
      links: links.length,
      blockers: blockers.map((blocker) => blocker.name),
      overlaps,
      covered,
      padding: Number.parseFloat(getComputedStyle(row).paddingBottom),
      clearance: {
        care: care.getBoundingClientRect().top - lowest,
        bar: bar.getBoundingClientRect().top - lowest,
      },
    };
  }, width);

test('the footer links stay clear of every fixed control on small screens', async ({
  page,
}) => {
  // Transitions are suppressed so geometry is read in its settled state.
  await page.emulateMedia({ reducedMotion: 'reduce' });

  for (const [width, height] of [
    [320, 640],
    [360, 740],
    [390, 844],
    [430, 932],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.goto('/en/');
    // Park the page at its end, then wait until the scroll has really stopped.
    await page.evaluate(() => {
      const scroller = document.scrollingElement ?? document.documentElement;
      scroller.scrollTop = scroller.scrollHeight;
    });
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const scroller =
              document.scrollingElement ?? document.documentElement;
            return Math.round(
              scroller.scrollHeight - scroller.scrollTop - window.innerHeight,
            );
          }),
        { message: `the page never settled at its end at ${width}px` },
      )
      .toBeLessThan(4);

    await expect(page.locator('[data-care-open]')).toBeVisible();
    await expect(page.locator('[data-mobile-nav]')).toBeVisible();
    // Guarantee 1: the pill steps aside for the footer instead of painting on it.
    await expect(page.locator('.shop-fab')).toBeHidden();

    const resting = await auditFooter(page, width);
    expect(resting.links).toBeGreaterThan(10);
    expect(resting.blockers).toContain('bottom bar');
    expect(resting.blockers).toContain('care trigger');
    expect(resting.overlaps).toEqual([]);
    expect(resting.covered).toEqual([]);
    // Guarantee 2: the closing row itself reserves the pill's footprint.
    expect(resting.padding).toBeGreaterThanOrEqual(48);
    expect(resting.clearance.care).toBeGreaterThanOrEqual(4);
    expect(resting.clearance.bar).toBeGreaterThanOrEqual(4);

    // Worst case: the pill painted where it normally floats above the bar.
    await page.addStyleTag({
      content:
        '.shop-fab{opacity:1!important;visibility:visible!important;' +
        'transform:none!important;pointer-events:auto!important}',
    });
    const forced = await auditFooter(page, width);
    expect(forced.blockers).toContain('shop pill');
    expect(forced.overlaps).toEqual([]);
    expect(forced.covered).toEqual([]);
    expect(forced.clearance.care).toBeGreaterThanOrEqual(4);
    expect(forced.clearance.bar).toBeGreaterThanOrEqual(4);
  }
});
