import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import { hashFile } from '../scripts/import-cinematic-media.mjs';
import {
  chapterAtTime,
  correspondingTime,
} from '../src/data/cinematic-timing.mjs';
import {
  assertCinematicAssets,
  cinematicRecords,
} from '../src/config/cinematic-assets.mjs';
const manifest = JSON.parse(
  await readFile(new URL('../src/data/cinematic-assets.json', import.meta.url)),
);
const file = (src) => new URL('../public' + src, import.meta.url).pathname;

test('all four received originals match their registered upload hashes and dimensions', async () => {
  for (const [record, hash, width, height] of [
    [
      manifest.videos.desktop,
      'b86aa80d1ecc5c1dd262ed56c84e3f2f1f708cc562ada05fe26f328baaae0641',
      1280,
      720,
    ],
    [
      manifest.videos.mobile,
      'faf4c549cedeee848205047ff0062e28b2a7e578a81543b0ff27d1a135589c92',
      720,
      1280,
    ],
    [
      manifest.references.model,
      '0bc3eea1d3aa07d313ca852fe79667ba90d616c4e54b7a49b4afc5711d384a46',
      1280,
      720,
    ],
    [
      manifest.references.product,
      'be1689ee9c89b3fb4bccd07572f9c4a7c56fc8b3e2f6679bee700083dc579b65',
      1280,
      1108,
    ],
  ]) {
    assert.equal(record.status, 'ready');
    assert.equal(await hashFile(file(record.src)), hash);
    assert.equal(record.sha256, hash);
    assert.equal(record.width, width);
    assert.equal(record.height, height);
    if (record.type !== 'video/mp4') {
      const image = await sharp(file(record.src)).metadata();
      assert.equal(image.width, width);
      assert.equal(image.height, height);
    }
  }
});

test('every active still and mask has an intact original or derivative provenance chain', async () => {
  assertCinematicAssets(manifest);
  for (const asset of cinematicRecords(manifest)) {
    assert.equal(asset.status, 'ready');
    assert.equal(await hashFile(file(asset.src)), asset.sha256);
  }
  const broken = structuredClone(manifest);
  broken.hairMask.sourceSha256 = '0'.repeat(64);
  assert.throws(() => assertCinematicAssets(broken), /exact supplied original/);
  broken.hairMask = manifest.hairMask;
  broken.videos.mobile.chapters[3].start = 5;
  assert.throws(() => assertCinematicAssets(broken), /chapter timing/);
});

test('video stream duration is 15 seconds while audio container tail is recorded separately', () => {
  for (const video of Object.values(manifest.videos)) {
    const probe = JSON.parse(
      execFileSync(
        'ffprobe',
        [
          '-v',
          'error',
          '-show_streams',
          '-show_format',
          '-of',
          'json',
          file(video.src),
        ],
        { encoding: 'utf8' },
      ),
    );
    const stream = probe.streams.find(
      (stream) => stream.codec_type === 'video',
    );
    assert.equal(Number(stream.duration), 15);
    assert.equal(Number(probe.format.duration), video.durationSeconds);
    assert.equal(video.videoDurationSeconds, 15);
    assert.equal(video.identityAccuracy, 'not-asserted');
  }
});

test('chapter timing selects real edit boundaries and resize preserves the matching story moment', () => {
  const desktop = manifest.videos.desktop.chapters;
  const mobile = manifest.videos.mobile.chapters;
  for (const chapters of [desktop, mobile]) {
    for (const [index, chapter] of chapters.entries()) {
      assert.equal(chapterAtTime(chapters, chapter.start), index);
      assert.equal(
        chapterAtTime(chapters, (chapter.start + chapter.end) / 2),
        index,
      );
    }
  }
  assert.equal(chapterAtTime(desktop, 0), 0);
  assert.equal(chapterAtTime(desktop, NaN), -1);
  assert.equal(chapterAtTime(desktop, 15.04), 7);
  assert.equal(correspondingTime(desktop, mobile, 14.75), 14.25);
});
