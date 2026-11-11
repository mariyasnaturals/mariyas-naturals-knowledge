import test from 'node:test';
import assert from 'node:assert/strict';
import { filmCompositionFit } from '../src/data/cinematic-framing.mjs';
test('faces, hands and product chapters always retain the whole video frame', () => {
  for (const chapter of [
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
      assert.equal(filmCompositionFit(w, h, chapter, w < 760), 'contain');
});
test('atmospheric cover is bounded and unusually shaped viewports remain uncropped', () => {
  assert.equal(filmCompositionFit(1440, 900, 'botanicals', false), 'cover');
  assert.equal(filmCompositionFit(390, 844, 'golden-oil', true), 'cover');
  assert.equal(filmCompositionFit(2560, 600, 'botanicals', false), 'contain');
  assert.equal(filmCompositionFit(0, 0, 'botanicals', false), 'contain');
});
