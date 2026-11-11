import test from 'node:test';
import assert from 'node:assert/strict';
import { filmCompositionFit } from '../src/data/cinematic-framing.mjs';
test('every chapter remains full bleed at desktop, mobile and ultrawide sizes', () => {
  for (const chapter of [
    'botanicals',
    'golden-oil',
    'product-reveal',
    'original-model',
    'application',
    'hair-shine',
    'hair-sweep',
    'final-hero',
  ])
    for (const [w, h] of [
      [1440, 900],
      [390, 844],
      [360, 800],
      [2560, 600],
    ])
      assert.equal(filmCompositionFit(w, h, chapter, w < 760), 'cover');
});
