import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  assertCinematicAssets,
  sceneOrder,
} from '../src/config/cinematic-assets.mjs';
const manifest = JSON.parse(
  readFileSync(new URL('../src/data/cinematic-assets.json', import.meta.url)),
);
test('eight chapters cover the 15-second film and pending media never requests a source', () => {
  assertCinematicAssets(manifest);
  assert.deepEqual(
    manifest.scenes.map((scene) => scene.id),
    sceneOrder,
  );
  assert.ok(
    [
      ...Object.values(manifest.videos),
      ...Object.values(manifest.references),
      ...manifest.scenes,
      manifest.hairMask,
    ]
      .filter((asset) => asset.status === 'pending')
      .every((asset) => asset.src === null),
  );
});
test('no pending request, external source, missing provenance or wrong orientation can activate', () => {
  const ready = () => {
    const copy = structuredClone(manifest);
    Object.assign(copy.videos.desktop, {
      status: 'ready',
      src: '/cinematic/homepage-desktop.mp4',
      width: 1920,
      height: 1080,
      originalFilename: 'owner-original.mp4',
      sha256: 'a'.repeat(64),
    });
    return copy;
  };
  assert.doesNotThrow(() => assertCinematicAssets(ready()));
  for (const change of [
    (m) => {
      m.videos.desktop.status = 'pending';
    },
    (m) => {
      m.videos.desktop.src = 'https://example.com/video.mp4';
    },
    (m) => {
      m.videos.desktop.src = '/cinematic/../../video.mp4';
    },
    (m) => {
      m.videos.desktop.sha256 = null;
    },
    (m) => {
      m.videos.desktop.source = 'generated';
    },
    (m) => {
      m.videos.desktop.width = 1080;
      m.videos.desktop.height = 1920;
    },
    (m) => {
      m.scenes.reverse();
    },
    (m) => {
      m.scenes[2].start = 4;
    },
  ]) {
    const copy = ready();
    change(copy);
    assert.throws(() => assertCinematicAssets(copy));
  }
});
test('all four languages have eight complete cinematic chapters and controls', () => {
  for (const lang of ['en', 'ml', 'hi', 'ta']) {
    const { cinematic } = JSON.parse(
      readFileSync(new URL(`../src/i18n/${lang}.json`, import.meta.url)),
    );
    assert.equal(cinematic.titles.length, 8);
    assert.equal(cinematic.notes.length, 8);
    assert.ok(
      [
        ...cinematic.titles,
        ...cinematic.notes,
        cinematic.play,
        cinematic.pause,
        cinematic.unavailable,
      ].every((s) => s.trim().length),
    );
  }
});
