/**
 * Derive the served brand assets from the owner-supplied originals.
 *
 * Inputs (never modified, never committed):
 *   google_drive/file_0000000001108211b11b1f7880d1df22.png  approved model photograph
 *   google_drive/logo                                        official logo (JPEG)
 *   google_drive/mariyas_hero.mp4                            approved portrait hero film
 *
 * Outputs (committed):
 *   public/hero/*                 language-landing background derivatives
 *   public/brand/*                favicon, touch icon and app icons
 *   public/cinematic/hero-mobile* mobile hero film and its poster frame
 *   src/data/brand-assets.json    provenance for every generated file
 *
 * The model photograph is mirrored once, as approved, so she faces the text.
 * No generative step touches her face, body, sari or hairstyle: every output is
 * a plain crop/scale of the original pixels.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');
const drive = resolve(process.env.DRIVE_DIR || join(root, 'google_drive'));
const ffmpeg = process.env.FFMPEG || 'ffmpeg';

const modelMaster = join(drive, 'file_0000000001108211b11b1f7880d1df22.png');
const logoMaster = join(drive, 'logo');
const heroMaster = join(drive, 'mariyas_hero.mp4');
// Owner re-supplied the landscape cut on 2026-11-16 and approved this exact
// master for desktop. It is a different edit from the portrait hero.
const desktopMaster = join(drive, 'landscape_video.mp4');

const BRAND_GREEN = '#063D2A';
const sha256 = async (path) =>
  createHash('sha256')
    .update(await readFile(path))
    .digest('hex');

const outputs = { schemaVersion: 1, generatedBy: 'npm run brand:assets' };

/* ---------------------------------------------------------------- landing -- */

const LANDING_WIDTHS = [720, 1080, 1440, 1920, 2400];
const heroDir = join(root, 'public/hero');
await mkdir(heroDir, { recursive: true });

// One mirror of the approved master. Every derivative is cut from this buffer.
const mirrored = await sharp(modelMaster).flop().toBuffer();
const masterMeta = await sharp(mirrored).metadata();

const landingFiles = [];
for (const width of LANDING_WIDTHS) {
  const name = `model-landscape-${width}`;
  await sharp(mirrored)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 86, effort: 6 })
    .toFile(join(heroDir, `${name}.webp`));
  landingFiles.push({
    width,
    webp: `/hero/${name}.webp`,
    height: Math.round((masterMeta.height / masterMeta.width) * width),
  });
}
// A single JPEG fallback keeps very old browsers covered without a second ladder.
await sharp(mirrored)
  .resize({ width: 1440 })
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(join(heroDir, 'model-landscape-1440.jpg'));

/**
 * A dedicated mobile cut. A 2.4:1 studio photograph cannot fill a 9:16 phone
 * screen without destroying the composition, so the phone layout stacks the text
 * above a 4:3 window instead. The window is centred between the model and the
 * plant and keeps her whole face, sari, chair and the table in frame; only the
 * empty studio wall on the left is trimmed.
 */
const MOBILE_WIDTHS = [430, 700, 1073];
const mobileFiles = [];
const mobileCropWidth = Math.round(masterMeta.height * 1.5);
const mobileWindow = {
  width: mobileCropWidth,
  height: masterMeta.height,
  left: Math.max(
    0,
    Math.min(
      masterMeta.width - mobileCropWidth,
      Math.round(masterMeta.width * 0.66) - Math.round(mobileCropWidth / 2),
    ),
  ),
  top: 0,
};
for (const out of MOBILE_WIDTHS) {
  const actual = Math.min(out, mobileWindow.width);
  const name = `model-mobile-3x2-${actual}`;
  await sharp(mirrored)
    .extract(mobileWindow)
    .resize({ width: actual })
    .sharpen({ sigma: 0.6 })
    .webp({ quality: 86, effort: 6 })
    .toFile(join(heroDir, `${name}.webp`));
  mobileFiles.push({
    width: actual,
    webp: `/hero/${name}.webp`,
    height: Math.round((mobileWindow.height / mobileWindow.width) * actual),
    crop: mobileWindow,
  });
}

outputs.landing = {
  master: 'file_0000000001108211b11b1f7880d1df22.png',
  masterSha256: await sha256(modelMaster),
  transformation: 'horizontal mirror only; no retouching, no regeneration',
  intrinsic: { width: masterMeta.width, height: masterMeta.height },
  landscape: landingFiles,
  landscapeJpeg: '/hero/model-landscape-1440.jpg',
  mobile: mobileFiles,
};

/* ------------------------------------------------------------------- logo -- */

/**
 * The supplied logo is a JPEG on a white field. Only the white pixels connected to
 * the outer edge become transparent, so every interior highlight of the artwork is
 * preserved and nothing about the mark itself is redrawn.
 */
const logoRaw = await sharp(logoMaster)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const logoWidth = logoRaw.info.width;
const logoHeight = logoRaw.info.height;
const pixels = Uint8Array.from(logoRaw.data);
const isField = (index) =>
  pixels[index] > 226 && pixels[index + 1] > 226 && pixels[index + 2] > 226;
const seen = new Uint8Array(logoWidth * logoHeight);
const stack = [];
for (let x = 0; x < logoWidth; x += 1)
  stack.push(x, (logoHeight - 1) * logoWidth + x);
for (let y = 0; y < logoHeight; y += 1)
  stack.push(y * logoWidth, y * logoWidth + logoWidth - 1);
while (stack.length) {
  const position = stack.pop();
  if (seen[position]) continue;
  seen[position] = 1;
  const rgba = position * 4;
  if (!isField(rgba)) continue;
  pixels[rgba + 3] = 0;
  const x = position % logoWidth;
  const y = (position - x) / logoWidth;
  if (x > 0) stack.push(position - 1);
  if (x < logoWidth - 1) stack.push(position + 1);
  if (y > 0) stack.push(position - logoWidth);
  if (y < logoHeight - 1) stack.push(position + logoWidth);
}
/**
 * The supplied JPEG carries a stray thin horizontal rule above the mark. A rule is
 * a near-full-width opaque run that disappears immediately above and below, which
 * a circle never does as its width changes gradually. Only such runs are cleared,
 * so the artwork itself is untouched.
 */
const opaque = (position) => pixels[position * 4 + 3] > 8;
const rowRun = (y) => {
  let best = 0;
  let run = 0;
  for (let x = 0; x < logoWidth; x += 1) {
    if (opaque(y * logoWidth + x)) {
      run += 1;
      if (run > best) best = run;
    } else run = 0;
  }
  return best;
};
const columnRun = (x) => {
  let best = 0;
  let run = 0;
  for (let y = 0; y < logoHeight; y += 1) {
    if (opaque(y * logoWidth + x)) {
      run += 1;
      if (run > best) best = run;
    } else run = 0;
  }
  return best;
};
const rowRuns = Array.from({ length: logoHeight }, (_, y) => rowRun(y));
const columnRuns = Array.from({ length: logoWidth }, (_, x) => columnRun(x));
const limitX = logoWidth * 0.55;
const limitY = logoHeight * 0.55;
const ruleRows = [];
const ruleColumns = [];
for (let y = 0; y < logoHeight; y += 1) {
  if (rowRuns[y] < limitX) continue;
  const above = y > 0 ? rowRuns[y - 1] : 0;
  const below = y < logoHeight - 1 ? rowRuns[y + 1] : 0;
  if (above < limitX && below < limitX) ruleRows.push(y);
}
for (let x = 0; x < logoWidth; x += 1) {
  if (columnRuns[x] < limitY) continue;
  const left = x > 0 ? columnRuns[x - 1] : 0;
  const right = x < logoWidth - 1 ? columnRuns[x + 1] : 0;
  if (left < limitY && right < limitY) ruleColumns.push(x);
}
for (const y of ruleRows)
  for (let x = 0; x < logoWidth; x += 1)
    pixels[(y * logoWidth + x) * 4 + 3] = 0;
for (const x of ruleColumns)
  for (let y = 0; y < logoHeight; y += 1)
    pixels[(y * logoWidth + x) * 4 + 3] = 0;

const keyed = await sharp(Buffer.from(pixels.buffer), {
  raw: { width: logoWidth, height: logoHeight, channels: 4 },
})
  .png()
  .toBuffer();
const cleared = await sharp(keyed).trim({ threshold: 1 }).toBuffer();
const clearedMeta = await sharp(cleared).metadata();
const side = Math.max(clearedMeta.width, clearedMeta.height);
const margin = Math.round(side * 0.04);
const square = await sharp(cleared)
  .resize(side, side, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .extend({
    top: margin,
    bottom: margin,
    left: margin,
    right: margin,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer();

const brandDir = join(root, 'public/brand');
await mkdir(brandDir, { recursive: true });

// The served mark is capped at 512 px; the icons below are cut from the full
// buffer so small sizes are never upscaled from a shrunken copy.
const logoFull = await sharp(square)
  .resize(512, 512)
  .png({ compressionLevel: 9 })
  .toFile(join(brandDir, 'logo.png'));

const icons = [];
const buildSolid = async (size, name, inset = 0, sharpen = false) => {
  const inner = Math.round(size * (1 - inset * 2));
  const pad = Math.round((size - inner) / 2);
  const mark = await sharp(square).resize(inner, inner).toBuffer();
  const prepared = sharpen
    ? await sharp(mark).sharpen({ sigma: 0.9 }).toBuffer()
    : mark;
  await sharp({
    create: { width: size, height: size, channels: 4, background: BRAND_GREEN },
  })
    .composite([{ input: prepared, left: pad, top: pad }])
    .png({ compressionLevel: 9 })
    .toFile(join(brandDir, name));
  icons.push({ size, path: `/brand/${name}` });
};

await buildSolid(192, 'icon-192.png', 0.08);
await buildSolid(512, 'icon-512.png', 0.08);
// Maskable icons keep the whole mark inside the 80% safe circle.
await buildSolid(512, 'icon-512-maskable.png', 0.14);
// Apple touch icons must be opaque and must not carry transparency.
await buildSolid(180, 'apple-touch-icon.png', 0.1);
await buildSolid(32, 'favicon-32.png', 0.04, true);
await buildSolid(16, 'favicon-16.png', 0.02, true);

// Multi-resolution .ico assembled by hand: ICONDIR + ICONDIRENTRY + PNG payloads.
const icoSizes = [16, 32, 48];
const icoPngs = [];
for (const size of icoSizes) {
  const inner = Math.round(size * 0.94);
  const mark = await sharp(square).resize(inner, inner).toBuffer();
  const pad = Math.round(size * 0.03);
  icoPngs.push(
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: BRAND_GREEN,
      },
    })
      .composite([{ input: mark, left: pad, top: pad }])
      .png()
      .toBuffer(),
  );
}
const dirHeader = Buffer.alloc(6);
dirHeader.writeUInt16LE(0, 0);
dirHeader.writeUInt16LE(1, 2);
dirHeader.writeUInt16LE(icoSizes.length, 4);
const entries = [];
let offset = 6 + 16 * icoSizes.length;
for (const [index, size] of icoSizes.entries()) {
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0);
  entry.writeUInt8(size >= 256 ? 0 : size, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(icoPngs[index].length, 8);
  entry.writeUInt32LE(offset, 12);
  offset += icoPngs[index].length;
  entries.push(entry);
}
await writeFile(
  join(root, 'public/favicon.ico'),
  Buffer.concat([dirHeader, ...entries, ...icoPngs]),
);

outputs.logo = {
  master: 'logo',
  masterSha256: await sha256(logoMaster),
  transformation:
    'white field trimmed, flattened onto brand green; the mark itself is unaltered',
  artifactsRemoved: { rows: ruleRows.length, columns: ruleColumns.length },
  full: '/brand/logo.png',
  fullSize: logoFull.width,
  icons,
  ico: '/favicon.ico',
};

/* ------------------------------------------------------------- hero film -- */

const cinematic = join(root, 'public/cinematic');
await mkdir(cinematic, { recursive: true });

const run = (args) =>
  execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', ...args], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

// Portrait cut: strip the unused audio track, keep the source resolution, and put
// the index at the front so the first frame arrives before the whole file does.
run([
  '-y',
  '-i',
  heroMaster,
  '-an',
  '-c:v',
  'libx264',
  '-profile:v',
  'high',
  '-preset',
  'slow',
  '-crf',
  '25',
  '-pix_fmt',
  'yuv420p',
  '-vf',
  'scale=720:1280:flags=lanczos',
  '-movflags',
  '+faststart',
  '-r',
  '24',
  join(cinematic, 'hero-mobile.mp4'),
]);
run([
  '-y',
  '-ss',
  '11.2',
  '-i',
  heroMaster,
  '-frames:v',
  '1',
  '-vf',
  'scale=720:-1',
  '-q:v',
  '4',
  join(cinematic, 'hero-mobile-poster.jpg'),
]);

// Landscape cut: keep the owner's native 1280x720 framing exactly (16:9, no
// crop, no stretch), drop the unused audio track, and move the index to the
// front so the first frame paints before the whole file arrives.
run([
  '-y',
  '-i',
  desktopMaster,
  '-an',
  '-c:v',
  'libx264',
  '-profile:v',
  'high',
  '-preset',
  'slow',
  '-crf',
  '23',
  '-pix_fmt',
  'yuv420p',
  '-vf',
  'scale=1280:720:flags=lanczos',
  '-movflags',
  '+faststart',
  '-r',
  '24',
  join(cinematic, 'homepage-desktop.mp4'),
]);
run([
  '-y',
  '-i',
  desktopMaster,
  '-frames:v',
  '1',
  '-vf',
  'scale=1280:720:flags=lanczos',
  '-q:v',
  '3',
  join(cinematic, 'poster-desktop.jpg'),
]);

// This repo's toolchain may provide only the ffmpeg binary, so read the stream
// facts out of `ffmpeg -i` rather than depending on a separate ffprobe.
const probeVideo = (file) => {
  let text = '';
  try {
    execFileSync(ffmpeg, ['-hide_banner', '-i', file], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    text = `${error.stderr ?? ''}`;
  }
  const duration = text.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  const stream = text.match(/Video:\s*([\w-]+)[^\n]*?,\s*(\d{2,5})x(\d{2,5})/);
  if (!duration || !stream)
    throw new Error(`Unable to read video metadata from ${file}`);
  return {
    codec: stream[1],
    width: Number(stream[2]),
    height: Number(stream[3]),
    durationSeconds: Number(
      (
        Number(duration[1]) * 3600 +
        Number(duration[2]) * 60 +
        Number(duration[3])
      ).toFixed(2),
    ),
  };
};

const mobileFacts = probeVideo(join(cinematic, 'hero-mobile.mp4'));
const desktopFacts = probeVideo(join(cinematic, 'homepage-desktop.mp4'));
outputs.hero = {
  desktop: {
    src: '/cinematic/homepage-desktop.mp4',
    poster: '/cinematic/poster-desktop.jpg',
    status: 'active',
    master: 'landscape_video.mp4',
    masterSha256: await sha256(desktopMaster),
    transformation:
      'audio removed, H.264 fast-start re-encode at the owner’s native 1280x720; no crop, no stretch',
    note: 'Owner-supplied landscape cut, approved 2026-11-16. Supersedes the earlier 16:9 edit.',
    encoded: {
      width: desktopFacts.width,
      height: desktopFacts.height,
      codec: desktopFacts.codec,
      durationSeconds: desktopFacts.durationSeconds,
      bytes: (await stat(join(cinematic, 'homepage-desktop.mp4'))).size,
    },
  },
  mobile: {
    src: '/cinematic/hero-mobile.mp4',
    poster: '/cinematic/hero-mobile-poster.jpg',
    status: 'active',
    master: 'mariyas_hero.mp4',
    masterSha256: await sha256(heroMaster),
    transformation:
      'audio removed, H.264 fast-start re-encode at source dimensions; no crop, no stretch',
    encoded: {
      width: mobileFacts.width,
      height: mobileFacts.height,
      codec: mobileFacts.codec,
      durationSeconds: mobileFacts.durationSeconds,
      bytes: (await stat(join(cinematic, 'hero-mobile.mp4'))).size,
    },
  },
};

await writeFile(
  join(root, 'src/data/brand-assets.json'),
  `${JSON.stringify(outputs, null, 2)}\n`,
);
console.log(
  `Derived ${landingFiles.length + mobileFiles.length} landing images, ${icons.length + 1} icons and the mobile hero film.`,
);
