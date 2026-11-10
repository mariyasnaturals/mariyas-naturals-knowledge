const locales = ['en', 'ml', 'hi', 'ta'];
export const sceneOrder = [
  'botanicals',
  'golden-oil',
  'product-reveal',
  'original-model',
  'application',
  'hair-shine',
  'hair-sweep',
  'final-hero',
];

// Owner originals have their own provenance. Existing catalogue policy stays intact.
export function assertCinematicAssets(manifest) {
  if (
    manifest.schemaVersion !== 1 ||
    manifest.durationSeconds !== 15 ||
    manifest.breakpoint !== 760
  )
    throw new Error('Unexpected cinematic contract');
  if (
    JSON.stringify(manifest.scenes.map((scene) => scene.id)) !==
    JSON.stringify(sceneOrder)
  )
    throw new Error('The eight story chapters must keep their approved order');
  let end = 0;
  for (const scene of manifest.scenes) {
    if (scene.start !== end || scene.end <= scene.start)
      throw new Error('Invalid scene timing');
    end = scene.end;
  }
  if (end !== manifest.durationSeconds)
    throw new Error('Scene timings must cover the film');
  for (const [orientation, ratio] of [
    ['desktop', '16:9'],
    ['mobile', '9:16'],
  ]) {
    const video = manifest.videos[orientation];
    if (video.aspectRatio !== ratio || video.type !== 'video/mp4')
      throw new Error('Invalid video format');
    if (video.status === 'ready') {
      const [w, h] = ratio.split(':').map(Number);
      if (Math.abs(video.width / video.height - w / h) > 0.01)
        throw new Error('Wrong video orientation');
    }
  }
  const records = [
    ...Object.values(manifest.videos),
    ...Object.values(manifest.references),
    ...manifest.scenes,
    manifest.hairMask,
  ];
  for (const asset of records) {
    if (!['pending', 'ready'].includes(asset.status))
      throw new Error('Invalid asset status');
    if (asset.status === 'pending') {
      if (asset.src !== null)
        throw new Error('Pending assets must not request media');
      continue;
    }
    if (!/^\/cinematic\/[a-z0-9-]+\.(mp4|webp|png)$/.test(asset.src))
      throw new Error('Only local cinematic paths are allowed');
    if ((asset.type === 'video/mp4') !== asset.src.endsWith('.mp4'))
      throw new Error('Asset format mismatch');
    if (
      asset.source !== 'owner-original' ||
      !asset.originalFilename ||
      !/^[a-f0-9]{64}$/.test(asset.sha256)
    )
      throw new Error('Original asset provenance is required');
    if (
      !Number.isInteger(asset.width) ||
      !Number.isInteger(asset.height) ||
      asset.width <= 0 ||
      asset.height <= 0
    )
      throw new Error('Original dimensions are required');
    if (
      asset.type !== 'video/mp4' &&
      locales.some((lang) => !asset.alt?.[lang]?.trim())
    )
      throw new Error('Truthful localized alt text is required');
  }
}
