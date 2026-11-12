import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import {
  studies,
  groups,
  oilPalette,
} from '../src/components/botanical/motion.mjs';
import { verifyBotanicalAssets } from '../scripts/verify-botanical-assets.mjs';
test('thirty independent unnamed studies use six progressive groups and unique depth paths', () => {
  assert.equal(studies.length, 30);
  assert.equal(new Set(studies.map((s) => s.id)).size, 30);
  for (const group of groups)
    assert.equal(studies.filter((s) => s.group === group).length, 5);
  assert.ok(
    studies.every(
      (s) =>
        s.identity === null && s.role === 'unnamed-artistic-botanical-study',
    ),
  );
  assert.equal(
    new Set(studies.map((s) => `${s.x}:${s.y}:${s.rotate}`)).size,
    30,
  );
  for (const color of Object.values(oilPalette)) {
    const [r, g, b] = color
      .slice(1)
      .match(/../g)
      .map((x) => parseInt(x, 16));
    assert.ok(g >= r && g >= b && g < 100, 'Oil must stay black/dark green');
  }
});
test(
  'every generated layer has intact provenance, alpha and exact original product bytes',
  verifyBotanicalAssets,
);
test('approved hero, original media, release policy and deployment tools are byte-identical to the development base', () => {
  const base = 'c6cf669ff63856ed6fcb5cdaf2f9174534b1594a';
  const paths = [
    'src/components/StorytellingSection.astro',
    'src/scripts/cinematic-story.ts',
    'src/scripts/responsive-film.ts',
    'src/styles/cinematic.css',
    'src/data/cinematic-assets.json',
    'src/config/media-policy.mjs',
    'src/config/commerce.mjs',
    '.github/workflows/validate.yml',
    'ops/ci_staging/bundle.sha256',
    'ops/cinematic/owner-media-policy.json',
    'scripts/validate-media-policy.mjs',
  ];
  for (const path of paths)
    assert.ok(
      readFileSync(path).equals(
        execFileSync('git', ['show', `${base}:${path}`]),
      ),
      path,
    );
});
test('new journey uses scroll progress and semantic claim, with no autoplay/slideshow or synthetic product image', () => {
  const code = readFileSync('src/components/botanical/journey.ts', 'utf8');
  const component = readFileSync(
    'src/components/botanical/BotanicalJourney.astro',
    'utf8',
  );
  assert.match(code, /scrub: true/);
  assert.match(code, /prefers-reduced-motion/);
  assert.doesNotMatch(
    code,
    /setInterval|requestAnimationFrame|addEventListener\(['"](?:wheel|touchmove)|pin: true/,
  );
  assert.doesNotMatch(component, /<video/);
  assert.match(component, /authentic-product-cutout\.webp/);
  assert.match(component, /Natural Ingredients/);
  assert.match(component, /hair-care-oil-1l/);
});
