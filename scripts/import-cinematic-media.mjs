import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import {
  copyFile,
  mkdir,
  readFile,
  rename,
  stat,
  writeFile,
} from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { assertCinematicAssets } from '../src/config/cinematic-assets.mjs';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const slots = ['desktop', 'mobile', 'model', 'product'];
const alt = {
  model: {
    en: 'Original model reference supplied by the owner',
    ml: 'ഉടമ നൽകിയ യഥാർത്ഥ മോഡൽ ചിത്രം',
    hi: 'मालिक द्वारा दी गई मूल मॉडल की तस्वीर',
    ta: 'உரிமையாளர் வழங்கிய அசல் மாடல் படம்',
  },
  product: {
    en: 'Original Mariyas Naturals product photograph supplied by the owner',
    ml: 'ഉടമ നൽകിയ യഥാർത്ഥ മരിയാസ് നാച്ചുറൽസ് ഉൽപ്പന്ന ചിത്രം',
    hi: 'मालिक द्वारा दी गई मूल मरियास नैचुरल्स उत्पाद की तस्वीर',
    ta: 'உரிமையாளர் வழங்கிய அசல் மரியாஸ் நேச்சுரல்ஸ் தயாரிப்புப் படம்',
  },
};

export async function hashFile(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

export async function inspectOriginal(path, slot, expectedSeconds = 15) {
  if (!slots.includes(slot)) throw new Error(`Unknown cinematic slot: ${slot}`);
  const file = resolve(path);
  const info = await stat(file);
  if (!info.isFile() || info.size === 0)
    throw new Error('An actual nonempty media file is required');
  const video = slot === 'desktop' || slot === 'mobile';
  const extension = extname(file).toLowerCase();
  let dimensions;
  let detail;
  if (video) {
    if (extension !== '.mp4')
      throw new Error('Video originals must be MP4 files');
    const probe = JSON.parse(
      execFileSync(
        'ffprobe',
        ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file],
        { encoding: 'utf8', maxBuffer: 2 * 1024 * 1024 },
      ),
    );
    const stream = probe.streams.find(
      (stream) =>
        stream.codec_type === 'video' && !stream.disposition?.attached_pic,
    );
    if (!stream) throw new Error('No video stream found');
    const duration = Number(probe.format.duration);
    if (
      !Number.isFinite(duration) ||
      Math.abs(duration - expectedSeconds) > 0.25
    )
      throw new Error(
        `Expected ${expectedSeconds}s footage; measured ${duration}s. Review the source before changing its timeline.`,
      );
    const rotation = Number(
      stream.side_data_list?.find((data) => data.rotation !== undefined)
        ?.rotation ??
        stream.tags?.rotate ??
        0,
    );
    if (!Number.isFinite(rotation) || rotation % 90 !== 0)
      throw new Error('Unsupported display rotation');
    if (
      stream.sample_aspect_ratio &&
      !['1:1', 'N/A'].includes(stream.sample_aspect_ratio)
    )
      throw new Error('Review non-square video pixels before importing');
    dimensions =
      Math.abs(rotation % 180) === 90
        ? { width: stream.height, height: stream.width }
        : { width: stream.width, height: stream.height };
    const targetRatio = slot === 'desktop' ? 16 / 9 : 9 / 16;
    if (Math.abs(dimensions.width / dimensions.height - targetRatio) > 0.01)
      throw new Error(`The ${slot} file has the wrong display aspect ratio`);
    detail = {
      durationSeconds: duration,
      videoDurationSeconds: Number(stream.duration ?? duration),
      codec: stream.codec_name,
      encodedWidth: stream.width,
      encodedHeight: stream.height,
      rotation,
      contentOrigin: 'google-flow',
      identityAccuracy: 'not-asserted',
      hasAudio: probe.streams.some((stream) => stream.codec_type === 'audio'),
    };
  } else {
    const formats = {
      '.png': 'png',
      '.webp': 'webp',
      '.jpg': 'jpeg',
      '.jpeg': 'jpeg',
    };
    const metadata = await sharp(file).metadata();
    if (
      !formats[extension] ||
      metadata.format !== formats[extension] ||
      metadata.pages > 1
    )
      throw new Error('Supply an original static PNG, WebP or JPEG photograph');
    dimensions = metadata.autoOrient ?? {
      width: metadata.width,
      height: metadata.height,
    };
    detail = {
      contentOrigin: 'owner-photograph',
      authoritativeFor: slot,
      alt: alt[slot],
    };
  }
  return {
    status: 'ready',
    src: `/cinematic/${video ? 'homepage-' : 'original-'}${slot}${extension}`,
    source: 'owner-original',
    originalFilename: basename(file),
    sha256: await hashFile(file),
    bytes: info.size,
    ...dimensions,
    ...detail,
  };
}

// Validate every supplied file first. Copy original bytes without re-encoding.
export async function importOriginals(inputs, { root = projectRoot } = {}) {
  const supplied = Object.entries(inputs);
  if (!supplied.length || supplied.some(([slot]) => !slots.includes(slot)))
    throw new Error('Supply at least one supported original');
  const manifestPath = join(root, 'src/data/cinematic-assets.json');
  const manifestBefore = await readFile(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestBefore);
  const records = [];
  for (const [slot, file] of supplied) {
    const record = await inspectOriginal(file, slot, manifest.durationSeconds);
    const category =
      slot === 'desktop' || slot === 'mobile'
        ? manifest.videos
        : manifest.references;
    category[slot] = { ...category[slot], ...record };
    records.push({ file: resolve(file), record });
  }
  assertCinematicAssets(manifest);
  if ((await readFile(manifestPath, 'utf8')) !== manifestBefore)
    throw new Error(
      'Manifest changed during inspection; retry with the latest version',
    );
  const destinations = [];
  for (const { file, record } of records) {
    const destination = join(root, 'public', record.src);
    await mkdir(dirname(destination), { recursive: true });
    if (file !== destination) {
      const temporary = destination + '.importing';
      await copyFile(file, temporary);
      if ((await hashFile(temporary)) !== record.sha256)
        throw new Error('Original changed during import');
      await rename(temporary, destination);
    }
    destinations.push(destination);
  }
  if ((await readFile(manifestPath, 'utf8')) !== manifestBefore)
    throw new Error(
      'Manifest changed during import; retry with the latest version',
    );
  await writeFile(
    manifestPath + '.importing',
    JSON.stringify(manifest, null, 2) + '\n',
  );
  await rename(manifestPath + '.importing', manifestPath);
  return records.map(({ record }, index) => ({
    ...record,
    destination: destinations[index],
  }));
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const inputs = {};
    for (let i = 2; i < process.argv.length; i += 2) {
      const slot = process.argv[i].replace(/^--/, '');
      if (!slots.includes(slot) || !process.argv[i + 1] || inputs[slot])
        throw new Error(
          'Usage: npm run cinematic:import -- --desktop FILE --mobile FILE --model FILE --product FILE (one or more slots)',
        );
      inputs[slot] = process.argv[i + 1];
    }
    console.log(JSON.stringify(await importOriginals(inputs), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
