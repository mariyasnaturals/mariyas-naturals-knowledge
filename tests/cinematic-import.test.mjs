import test from 'node:test';
import assert from 'node:assert/strict';
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import {
  hashFile,
  importOriginals,
  inspectOriginal,
} from '../scripts/import-cinematic-media.mjs';
import { sceneVisuals } from '../src/data/cinematic-visuals.mjs';

const manifestFile = new URL(
  '../src/data/cinematic-assets.json',
  import.meta.url,
);
async function workspace(t) {
  const root = await mkdtemp(join(tmpdir(), 'mariyas-cinematic-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'src/data'), { recursive: true });
  await copyFile(manifestFile, join(root, 'src/data/cinematic-assets.json'));
  return root;
}

test('a supplied still is copied byte-for-byte, measured, hashed and registered without altering the source', async (t) => {
  const root = await workspace(t);
  const source = join(root, '8573.png');
  await sharp({
    create: { width: 90, height: 160, channels: 4, background: '#123b2d' },
  })
    .png()
    .toFile(source);
  const originalHash = await hashFile(source);
  const [record] = await importOriginals({ model: source }, { root });
  assert.equal(record.originalFilename, '8573.png');
  assert.equal(record.width, 90);
  assert.equal(record.height, 160);
  assert.equal(record.contentOrigin, 'owner-photograph');
  assert.equal(record.authoritativeFor, 'model');
  assert.equal(record.sha256, originalHash);
  assert.equal(await hashFile(record.destination), originalHash);
  assert.equal(await hashFile(source), originalHash);
  const manifest = JSON.parse(
    await readFile(join(root, 'src/data/cinematic-assets.json')),
  );
  assert.equal(manifest.references.model.status, 'ready');
  assert.equal(manifest.videos.desktop.status, 'pending');
});

test('invalid later input leaves the manifest and served assets untouched', async (t) => {
  const root = await workspace(t);
  const before = await readFile(
    join(root, 'src/data/cinematic-assets.json'),
    'utf8',
  );
  const source = join(root, 'product.jpg');
  await sharp({
    create: { width: 80, height: 80, channels: 3, background: '#123b2d' },
  })
    .jpeg()
    .toFile(source);
  await assert.rejects(
    importOriginals(
      { product: source, model: join(root, 'missing.png') },
      { root },
    ),
  );
  assert.equal(
    await readFile(join(root, 'src/data/cinematic-assets.json'), 'utf8'),
    before,
  );
  await assert.rejects(readdir(join(root, 'public')));
});

test('MP4 inspection rejects wrong duration, then imports a measured 15-second cut without encoding changes', async (t) => {
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });
    execFileSync('ffprobe', ['-version'], { stdio: 'ignore' });
  } catch {
    t.skip('FFmpeg/ffprobe are required for original-video inspection');
    return;
  }
  const root = await workspace(t);
  const fixture = new URL(
    './fixtures/cinematic-landscape.mp4',
    import.meta.url,
  );
  await assert.rejects(
    inspectOriginal(fixture.pathname, 'desktop'),
    /measured 2s/,
  );
  const source = join(root, '714482450_1794338494564178.mp4');
  execFileSync('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-stream_loop',
    '-1',
    '-i',
    fixture.pathname,
    '-t',
    '15',
    '-c',
    'copy',
    source,
  ]);
  await assert.rejects(
    inspectOriginal(source, 'mobile'),
    /wrong display aspect ratio/,
  );
  const [record] = await importOriginals({ desktop: source }, { root });
  assert.equal(record.status, 'ready');
  assert.equal(record.width, 160);
  assert.equal(record.height, 90);
  assert.ok(Math.abs(record.durationSeconds - 15) < 0.25);
  assert.equal(record.contentOrigin, 'google-flow');
  assert.equal(record.identityAccuracy, 'not-asserted');
  assert.equal(await hashFile(record.destination), await hashFile(source));
});

test('product and model compositions use only authoritative reference photographs', async () => {
  const manifest = JSON.parse(await readFile(manifestFile));
  manifest.scenes.forEach((scene) =>
    Object.assign(scene, {
      status: 'ready',
      src: '/cinematic/video-derived-frame.webp',
    }),
  );
  const scene = (id) => manifest.scenes.find((scene) => scene.id === id);
  assert.deepEqual(sceneVisuals(manifest, scene('product-reveal')), []);
  assert.deepEqual(sceneVisuals(manifest, scene('original-model')), []);
  Object.assign(manifest.references.product, {
    status: 'ready',
    src: '/cinematic/original-product.jpg',
  });
  Object.assign(manifest.references.model, {
    status: 'ready',
    src: '/cinematic/original-model.png',
  });
  assert.deepEqual(
    sceneVisuals(manifest, scene('product-reveal')).map((visual) => visual.id),
    ['reference-product'],
  );
  assert.deepEqual(
    sceneVisuals(manifest, scene('original-model')).map((visual) => visual.id),
    ['reference-model'],
  );
  assert.deepEqual(
    sceneVisuals(manifest, scene('final-hero')).map((visual) => visual.id),
    ['reference-model', 'reference-product'],
  );
});
