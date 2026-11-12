import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import { load } from 'cheerio';
const output = 'botanical-review-site';
for (const lang of ['en', 'ml', 'hi', 'ta']) {
  const $ = load(readFileSync(`${output}/${lang}/index.html`, 'utf8'));
  assert.equal(
    $('[data-story-scene]').length,
    8,
    'Approved hero must remain intact',
  );
  assert.equal($('[data-botanical-step]').length, 8);
  assert.equal($('.botanical-study').length, 30);
  assert.equal(
    $('.botanical-claim').text().replace(/\s+/g, ' ').trim(),
    '60 Natural Ingredients',
  );
  assert.equal($('meta[name="robots"]').attr('content'), 'noindex, nofollow');
  assert.equal(
    $('.botanical-cta').attr('href'),
    'https://www.mariyasnaturals.com/product/hair-care-oil-1l/',
  );
  assert.equal(
    $('form[action],a[href*="add-to-cart"],a[href*="checkout"]').length,
    0,
  );
  assert.ok(
    $('#story').nextAll('section').first().is('[data-botanical-journey]'),
    'New journey must follow, never replace, existing story',
  );
  for (const n of $('img[src^="/_botanical-assets/"]').toArray())
    assert.ok(existsSync(output + $(n).attr('src')));
  console.log(
    `PASS ${lang}: preserved hero, eight new stages, 30 layers, exact claim, noindex and verified product-page CTA`,
  );
}
