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
    test.setTimeout(120_000);
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
      // The duplicated post-hero photographic sections are gone: the page has one
      // cinematic hero, and the journey begins on the very next scroll.
      await expect(page.locator('[data-story-scene]')).toHaveCount(0);
      await expect(page.locator('.cinema-hero')).toHaveCount(1);
      await expect(page.locator('.cinema-hero-action')).toHaveAttribute(
        'href',
        '#botanical-journey',
      );
      await expect(page.locator('.botanical-intro')).toHaveCount(0);
      const journey = page.locator('[data-botanical-journey]');
      await expect(journey).toHaveAttribute('data-motion', 'scroll');
      await expect(journey.locator('.botanical-study')).toHaveCount(30);
      // Natural scrolling: the journey is eight real scenes in document flow,
      // each with its own runway. Progress is page position, not a timeline.
      const scenes = await page.locator('[data-scene]').evaluateAll((els) =>
        els.map((el) => ({
          scene: el.dataset.scene as string,
          top: Math.round(el.getBoundingClientRect().top + scrollY),
          height: Math.round(el.getBoundingClientRect().height),
        })),
      );
      expect(scenes).toHaveLength(8);
      const seek = async (scene: string, frac = 0.5) => {
        const s = scenes.find((x) => x.scene === scene)!;
        await page.evaluate(
          (top) => scrollTo({ top, behavior: 'instant' }),
          Math.round(s.top + s.height * frac - height * 0.5),
        );
        await page.waitForTimeout(180);
      };

      if (width < 760) {
        await page.evaluate(
          (top) => scrollTo({ top, behavior: 'instant' }),
          scenes[0]!.top,
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
        // A swipe moves the page for real, not an internal animation clock.
        await expect
          .poll(() => page.evaluate(() => scrollY))
          .toBeGreaterThan(beforeY + 200);
      }

      // Walk every scene: the page scrolls, copy stays on screen and readable,
      // and no vessel is cropped by the frame edges.
      for (const scene of scenes) {
        await seek(scene.scene, 0.5);
        const copy = journey.locator(
          `[data-scene="${scene.scene}"] .botanical-copy`,
        );
        await expect(copy).toBeVisible();
        const box = await copy.boundingBox();
        expect(box!.y).toBeGreaterThan(60);
        expect(box!.y + box!.height).toBeLessThan(
          height - (width < 760 ? 60 : 10),
        );
        for (const vessel of await journey
          .locator(`[data-scene="${scene.scene}"] [data-vessel]`)
          .all()) {
          if (
            await vessel.evaluate(
              (el) => Number(getComputedStyle(el).opacity) > 0.8,
            )
          ) {
            const v = await vessel.boundingBox();
            // Horizontally a vessel must never spill past the frame. Vertically,
            // desktop keeps each vessel whole inside the viewport; portrait
            // composes the chapter's art as a full-bleed bed behind the held
            // bottle, so a vessel may extend past the fold but must still be
            // substantially on screen rather than parked off-frame.
            expect(v!.x).toBeGreaterThanOrEqual(-1);
            expect(v!.x + v!.width).toBeLessThanOrEqual(width + 1);
            expect(v!.y).toBeGreaterThan(-1);
            const visible =
              Math.min(v!.y + v!.height, height) - Math.max(v!.y, 0);
            expect(visible).toBeGreaterThan(v!.height * 0.4);
          }
        }
        await page.screenshot({
          path: `${output}/${width}-${scene.scene}.png`,
        });
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
      }

      await expect(journey.locator('.botanical-claim')).toHaveText(
        '60 Natural Ingredients',
      );
      // The reviewed route is on-site; purchasing and store guards stay disabled.
      await expect(journey.locator('.botanical-cta')).toHaveAttribute(
        'href',
        '/en/products/mariyas-hair-oil-200-ml/',
      );
      await expect(
        journey.locator(
          'a[href*="mariyasnaturals.com"]:not([data-source-reference])',
        ),
      ).toHaveCount(0);
      await expect(
        journey.locator(
          '[data-scene] img[src*="glass-receiving"],[data-scene] img[src*="copper-oil-vessel"],[data-scene] img[src*="extraction-filter"],[data-scene] img[src*="/pouring-vessel"]',
        ),
      ).toHaveCount(0);

      // Extraction: fine green liquid leaves the filter and enters the kinnam.
      await seek('extraction', 0.72);
      const extractStream = journey.locator('[data-layer="extract-stream"]');
      await expect(extractStream).toBeVisible();
      const streamOpacity = await extractStream.evaluate((el) =>
        Number(getComputedStyle(el).opacity),
      );
      expect(streamOpacity).toBeGreaterThan(0.9);
      const streamBox = await extractStream.boundingBox();
      const kinnamBox = await journey
        .locator('[data-scene="extraction"] .botanical-receiver')
        .boundingBox();
      // The stream must reach into the receiving vessel, not stop in mid air.
      expect(streamBox!.y + streamBox!.height).toBeGreaterThan(
        kinnamBox!.y + kinnamBox!.height * 0.12,
      );
      expect(streamBox!.y + streamBox!.height).toBeLessThan(
        kinnamBox!.y + kinnamBox!.height * 0.62,
      );

      // Oil: the liquid resolves to near-black forest green.
      await seek('oil', 1);
      const oil = await journey
        .locator('[data-scene="oil"] [data-layer="uruli-fill"]')
        .evaluate((el) => {
          const cs = getComputedStyle(el);
          const rgb = (v: string) =>
            (v.match(/\d+/g) || []).map(Number).slice(0, 3);
          return {
            body: rgb(cs.getPropertyValue('--liquid-body')),
            collection: Number.parseFloat(
              cs.getPropertyValue('--collection') || '0',
            ),
          };
        });
      // Near-black forest green: dark, green-dominant and well filled.
      const [r, g, bl] = oil.body as [number, number, number];
      expect(g).toBeGreaterThan(r);
      expect(g).toBeGreaterThan(bl);
      expect(Math.max(r, g, bl)).toBeLessThan(80);
      expect(oil.collection).toBeGreaterThan(0.7);

      // Transfer: the pouring vessel carries its own stream into the target.
      await seek('transfer', 0.7);
      await expect(journey.locator('[data-layer="pourer"]')).toBeVisible();

      // Reveal: the original bottle, then the claim and CTA at full opacity.
      await seek('reveal', 0.85);
      // Forward and reverse scrolling are symmetric: the same scroll offset
      // always produces the same composition, because scroll is the only clock.
      const styleAt = async (frac: number) => {
        await page.evaluate(
          (top) => scrollTo({ top, behavior: 'instant' }),
          Math.round(scenes[5]!.top + scenes[5]!.height * frac),
        );
        await page.waitForTimeout(200);
        return journey
          .locator('[data-scene="oil"] [data-layer="copper"]')
          .getAttribute('style');
      };
      const forwardState = await styleAt(0.5);
      await styleAt(0.9);
      expect(await styleAt(0.5)).toBe(forwardState);
      // A paused page holds its composition.
      await page.waitForTimeout(400);
      expect(await styleAt(0.5)).toBe(forwardState);

      await page.setViewportSize({ width: width < 760 ? 980 : 390, height });
      await page.waitForTimeout(150);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await expect(journey.locator('[data-scene] .botanical-copy')).toHaveCount(
        8,
      );
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect(journey).toHaveAttribute('data-motion', 'reduced');
      await expect(journey.locator('[data-botanical-step] h3')).toHaveCount(8);
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await expect(journey.locator('[data-scene] .botanical-copy')).toHaveCount(
        8,
      );
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
      await expect(page.locator('[data-scene]')).toHaveCount(8);
      await page.locator('#botanical-finale').scrollIntoViewIfNeeded();
      await expect(page.locator('.botanical-claim')).toBeVisible();
      // One authentic bottle, held in the sticky foreground, resolving above
      // the claim: the finale frames it rather than repeating it.
      const bottles = page.locator(
        '[data-bottle-layer] .botanical-product img',
      );
      await expect(bottles).toHaveCount(1);
      const bottle = await bottles.boundingBox();
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
    // With no JavaScript the journey is still eight readable scenes in flow, and
    // the finale's call to action is a plain link that needs no script.
    await page.locator('#botanical-finale').scrollIntoViewIfNeeded();
    await expect(
      page.locator('#botanical-finale .botanical-cta'),
    ).toBeVisible();
    await expect(
      page.locator('#botanical-finale .botanical-claim'),
    ).toBeVisible();
    await expect(page.locator('[data-scene]')).toHaveCount(8);
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
    // Settle the finale exactly on the viewport. Repeated, because lazy media
    // above it can still change the page height after the first scroll.
    for (let i = 0; i < 6; i++) {
      const dy = await page.evaluate(() => {
        const el = document.querySelector('[data-scene="reveal"]')!;
        return Math.round(el.getBoundingClientRect().top);
      });
      if (Math.abs(dy) < 2) break;
      await page.evaluate(
        (d) => scrollTo({ top: scrollY + d, behavior: 'instant' }),
        dy,
      );
      await page.waitForTimeout(250);
    }
    await page.waitForTimeout(250);
    // The product is the journey's held foreground layer, centred over the
    // finale; the copy resolves in the band beneath it.
    const product = await page
      .locator('[data-bottle-frame] [data-layer="product"]')
      .boundingBox();
    const copy = await page
      .locator('[data-scene="reveal"] .botanical-copy')
      .boundingBox();
    expect(product!.y + product!.height).toBeLessThan(copy!.y);
    expect(copy!.y + copy!.height).toBeLessThan(844 - 48);
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
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height });
    await page.goto('/en/');
    await page.locator('#botanical-journey').scrollIntoViewIfNeeded();
    const initial = await page.locator('.botanical-track').boundingBox();
    // The journey is a long real page, so decode what the view has loaded.
    await page
      .locator('[data-scene] img')
      .evaluateAll((imgs) =>
        Promise.all(
          imgs
            .filter((img) => (img as HTMLImageElement).complete)
            .map((img) =>
              (img as HTMLImageElement).decode().catch(() => undefined),
            ),
        ),
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
        .locator('[data-scene] [data-vessel]')
        .all()) {
        if (
          await vessel.evaluate(
            (el) => Number(getComputedStyle(el).opacity) > 0.8,
          )
        ) {
          // Scenes are in flow: bring the vessel into view after the rotation,
          // then assert it fits the (rotated) viewport.
          await vessel.scrollIntoViewIfNeeded();
          const v = await vessel.boundingBox();
          expect(v!.x).toBeGreaterThanOrEqual(-1);
          expect(v!.x + v!.width).toBeLessThanOrEqual(height + 1);
          expect(v!.width).toBeLessThanOrEqual(height + 1);
        }
      }
    }
  });

/* --------------------------------------------------------------------------
   Architecture: the journey is ordinary document flow plus one journey-bounded
   sticky foreground. The owner rejected both the pinned stage (the page froze)
   and the revision where the bottle travelled away with its own scene. So the
   page must keep moving, and the product must NOT move: it holds the centre of
   the viewport for every chapter. A `.pin-spacer` check alone proves nothing
   here — `position: sticky` pins without one — so these assert the real
   geometry.
   -------------------------------------------------------------------------- */
for (const [width, height] of [
  [390, 844],
  [1440, 900],
])
  test(`${width}: the page moves while the product holds the centre of the frame`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/en/');
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);

    // One deliberate entry frame: the product rises into its lock as the
    // journey opens. Let that finish, so everything sampled below is the
    // held state the owner inspects.
    await page.locator('[data-scene="origin"]').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);

    // Eight scenes, all in normal flow.
    await expect(page.locator('[data-scene]')).toHaveCount(8);
    const positions = await page
      .locator('[data-scene]')
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).position));
    expect(positions.every((p) => p === 'static' || p === 'relative')).toBe(
      true,
    );

    // The authentic bottle is the single product instance, and its foreground
    // layer is the only sticky element in the journey.
    await expect(
      page.locator('[data-botanical-journey] .botanical-product img'),
    ).toHaveCount(1);
    const layer = page.locator('[data-bottle-layer]');
    expect(await layer.evaluate((el) => getComputedStyle(el).position)).toBe(
      'sticky',
    );
    const stickyCount = await page
      .locator('[data-botanical-journey]')
      .evaluate(
        (root) =>
          [...root.querySelectorAll('*')].filter(
            (el) => getComputedStyle(el).position === 'sticky',
          ).length,
      );
    expect(stickyCount).toBe(1);
    // Nothing froze the page: GSAP never pinned.
    await expect(page.locator('.pin-spacer')).toHaveCount(0);

    // A scene in view still physically travels up the viewport as the page
    // scrolls — the journey is a real page, not a slideshow.
    const scene = page.locator('[data-scene="preparation"]');
    const start = await scene.evaluate(
      (el) => el.getBoundingClientRect().top + scrollY - innerHeight,
    );
    await page.evaluate((top) => scrollTo({ top, behavior: 'instant' }), start);
    await page.waitForTimeout(150);
    const before = (await scene.boundingBox())!.y;
    await page.evaluate(
      (top) => scrollTo({ top, behavior: 'instant' }),
      start + 420,
    );
    await page.waitForTimeout(150);
    const after = (await scene.boundingBox())!.y;
    expect(before - after).toBeGreaterThan(240);

    // The product, meanwhile, keeps the exact centre of the viewport for every
    // chapter — forward, paused, and in reverse.
    const centre = async () => {
      const box = await page.locator('[data-bottle-frame]').evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
      });
      return box;
    };
    const scenes = await page.locator('[data-scene]').evaluateAll((els) =>
      els.map((el) => ({
        scene: el.dataset.scene as string,
        top: Math.round(el.getBoundingClientRect().top + scrollY),
        height: Math.round(el.getBoundingClientRect().height),
      })),
    );
    const seek = async (scene: string, frac: number) => {
      const s = scenes.find((x) => x.scene === scene)!;
      await page.evaluate(
        (top) => scrollTo({ top, behavior: 'instant' }),
        Math.round(s.top + s.height * frac - height * 0.5),
      );
      await page.waitForTimeout(160);
    };

    const seen: { scene: string; cx: number; cy: number }[] = [];
    for (const s of scenes) {
      await seek(s.scene, 0.5);
      seen.push({ scene: s.scene, ...(await centre()) });
    }
    // Reverse pass: the product must hold the same centre coming back up.
    for (const s of [...scenes].reverse()) {
      await seek(s.scene, 0.5);
      seen.push({ scene: s.scene, ...(await centre()) });
    }
    for (const { scene, cx, cy } of seen) {
      // ±2px: the product is centred by layout, and the scroll choreography only
      // applies a small scale to it, never a translation.
      expect(Math.abs(cx - width / 2), `${scene} cx`).toBeLessThanOrEqual(2);
      expect(Math.abs(cy - height / 2), `${scene} cy`).toBeLessThanOrEqual(2);
    }

    // Scrolling continues naturally into the rest of the site.
    const next = page.locator('#products');
    await next.scrollIntoViewIfNeeded();
    await expect(next).toBeInViewport();
    await expect(page.locator('.pin-spacer')).toHaveCount(0);
  });

test('each scene enters from below and exits above, in document order', async ({
  page,
}) => {
  await page.goto('/en/');
  await page.evaluate(() => document.fonts.ready);
  const order = await page.locator('[data-scene]').evaluateAll((els) =>
    els.map((el) => ({
      scene: el.dataset.scene,
      top: Math.round(el.getBoundingClientRect().top + scrollY),
    })),
  );
  expect(order.map((o) => o.scene)).toEqual([
    'origin',
    'studies',
    'convergence',
    'preparation',
    'extraction',
    'oil',
    'transfer',
    'reveal',
  ]);
  // Strictly increasing tops: no scene is pulled over another, so nothing can
  // be held in place while its contents change.
  for (let i = 1; i < order.length; i++)
    expect(order[i]!.top).toBeGreaterThan(order[i - 1]!.top);
});
