import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import {
  studies,
  groups,
  oilPalette,
  stages,
  rhythm,
  journeyTravel,
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
test('the eight stages form one continuous hand-off chain with no gaps', () => {
  assert.equal(stages.length, 8);
  // Every stage hands its material to the next; nothing is introduced twice and
  // nothing disappears without being consumed.
  for (let i = 1; i < stages.length; i++)
    assert.equal(stages[i].receives, stages[i - 1].hands, stages[i].name);
  // Material flows from the hero, through preparation and liquid, to the bottle.
  assert.equal(stages[0].receives, 'hero');
  assert.equal(stages.at(-1).hands, 'authentic Mariyas product');
  assert.ok(stages.some((s) => s.hands === 'green herbal extract'));
  assert.ok(stages.some((s) => s.hands === 'deep herbal oil'));
});

test('scenes are ordered document sections, not a camera moving through a world', () => {
  // The journey is plain document flow: every stage is its own scene with its own
  // scroll runway. There is no world box, no camera and no normalised progress
  // scale to keep in sync — the absence of those is the point of the correction.
  assert.deepEqual(
    stages.map((s) => s.scene),
    [
      'origin',
      'studies',
      'convergence',
      'preparation',
      'extraction',
      'oil',
      'transfer',
      'reveal',
    ],
  );
  // Each scene carries a real runway, so its animation plays while the page moves
  // rather than while the viewport is held still.
  for (const stage of stages) {
    assert.equal(typeof stage.travel, 'number');
    assert.ok(stage.travel >= 1.1 && stage.travel <= 1.6, stage.name);
    assert.ok(rhythm[stage.travel === rhythm.resolve ? 'resolve' : 'process']);
  }
  // Runways are modest: a long artificial runway is what creates dead green
  // space and the sense of a held frame.
  assert.ok(journeyTravel < 20, 'journey must not become a long held scroll');
  assert.ok(journeyTravel > 8, 'each scene needs room to play');
});

test(
  'every generated layer has intact provenance, alpha and exact original product bytes',
  verifyBotanicalAssets,
);
test('approved hero, original media and untouched security controls stay byte-identical', () => {
  const base = 'c6cf669ff63856ed6fcb5cdaf2f9174534b1594a';
  // The reviewed botanical release registers new media, so the policy files that
  // must stay byte-identical are the ones that secure originals, commerce and
  // the independent owner-signing path. Those are never rewritten for a UI change.
  const paths = [
    // StorytellingSection.astro and cinematic-story.ts are deliberately changed
    // by the owner correction (the duplicated post-hero sections were removed and
    // the ScrollTriggers guarded), so both are asserted by content below.
    'src/scripts/responsive-film.ts',
    'src/styles/cinematic.css',
    'src/data/cinematic-assets.json',
    'src/config/commerce.mjs',
    'ops/cinematic/owner-media-policy.json',
    'ops/cinematic/media_policy.py',
    'ops/cinematic/pull_deploy.py',
    'ops/automatic_staging.py',
    'public/cinematic/homepage-desktop.mp4',
    'public/cinematic/homepage-mobile.mp4',
    'public/cinematic/original-model.jpg',
    'public/cinematic/original-product.jpg',
  ];
  const original = (path) =>
    execFileSync('git', ['show', `${base}:${path}`], {
      maxBuffer: 64 * 1024 * 1024,
    });
  for (const path of paths)
    assert.ok(readFileSync(path).equals(original(path)), path);

  // The hero itself is preserved: one cinematic hero, the responsive film, the
  // original poster/captions, and no duplicated photographic scene sections.
  const story = readFileSync(
    'src/components/StorytellingSection.astro',
    'utf8',
  );
  assert.match(story, /<ResponsiveFilm/);
  assert.match(story, /class="cinema-hero"/);
  assert.doesNotMatch(story, /CinematicScene/);
  assert.doesNotMatch(story, /cinema-chapters/);
  assert.doesNotMatch(story, /data-story-scene/);
  assert.match(story, /href="#botanical-journey"/);

  // The story controller must still protect the hero, and must not create a
  // ScrollTrigger against a trigger element that no longer exists.
  const controller = readFileSync('src/scripts/cinematic-story.ts', 'utf8');
  assert.match(controller, /data-watch-scene/);
  assert.match(controller, /cinematic:seek/);
  assert.match(controller, /if \(scenesList && progressBar\)/);
  assert.match(controller, /if \(sceneCopy\)/);
});
test('the reviewed release registers exactly the 43 approved botanical media', async () => {
  const botanical = JSON.parse(
    readFileSync('src/data/botanical-media.json', 'utf8'),
  );
  const proposal = JSON.parse(
    readFileSync('review/botanical/brass-promotion-proposal.json', 'utf8'),
  );
  const { assertApprovedBotanicalMedia } =
    await import('../src/config/media-policy.mjs');
  const registered = assertApprovedBotanicalMedia(botanical);
  assert.equal(registered.size, 43);
  assert.equal(proposal.runtimeMedia.length, 43);
  for (const media of proposal.runtimeMedia)
    assert.ok(registered.has(media.servedPath), media.servedPath);
  const studies = botanical.media.filter((m) => m.role === 'artistic-study');
  assert.equal(studies.length, 30);
  assert.ok(
    studies.every(
      (m) =>
        m.provenance.identity === null &&
        m.provenance.identityVerified === false,
    ),
  );
  for (const lang of ['en', 'ml', 'hi', 'ta'])
    for (const media of botanical.media) assert.ok(media.alt[lang].trim());
  const integration = JSON.parse(
    readFileSync('review/botanical/release-integration.json', 'utf8'),
  );
  assert.equal(integration.approval.ownerVisualApproval, '2026-11-12');
  const cutout = botanical.media.filter(
    (m) => m.role === 'photographic-product-cutout',
  );
  assert.equal(cutout.length, 1);
  assert.equal(cutout[0].provenance.contentOrigin, 'owner-photograph');
  assert.equal(cutout[0].sourceMediaUrl.includes('mariyasnaturals.in'), true);
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
  assert.match(component, /data-botanical-media/);
  assert.match(component, /Natural Ingredients/);
  // The active site links its own reviewed product route; the external store
  // stays referenced only as the current .in catalogue source, never as a
  // purchasing destination, so commerce and store guards remain untouched.
  assert.match(component, /products\/\$\{featuredProduct\.slug\}/);
  assert.doesNotMatch(
    component,
    /href=\{?['"`]https:\/\/www\.mariyasnaturals\.com/,
  );
});
