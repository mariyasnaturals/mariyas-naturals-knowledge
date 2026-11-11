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

export function cinematicRecords(manifest) {
  return [
    ...Object.values(manifest.videos),
    ...Object.values(manifest.videos).flatMap((video) =>
      video.poster ? [video.poster] : [],
    ),
    ...Object.values(manifest.references),
    ...manifest.scenes,
    manifest.hairMask,
  ];
}

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
    if (video.chapters) {
      let boundary = 0;
      for (const [index, chapter] of video.chapters.entries()) {
        if (
          chapter.id !== sceneOrder[index] ||
          chapter.start !== boundary ||
          !Number.isFinite(chapter.end) ||
          chapter.end <= chapter.start
        )
          throw new Error('Invalid orientation-specific chapter timing');
        boundary = chapter.end;
      }
      if (
        video.chapters.length !== sceneOrder.length ||
        boundary !== manifest.durationSeconds
      )
        throw new Error('Each video timeline must cover all eight chapters');
    }
  }
  const records = cinematicRecords(manifest);
  for (const [key, asset] of Object.entries(manifest.references)) {
    if (
      asset.status === 'ready' &&
      (asset.source !== 'owner-original' ||
        asset.contentOrigin !== 'owner-photograph' ||
        asset.authoritativeFor !== key)
    )
      throw new Error(
        'Product and model authority requires the supplied photographs',
      );
  }
  for (const asset of records) {
    if (!['pending', 'ready'].includes(asset.status))
      throw new Error('Invalid asset status');
    if (asset.status === 'pending') {
      if (asset.src !== null)
        throw new Error('Pending assets must not request media');
      continue;
    }
    if (!/^\/cinematic\/[a-z0-9-]+\.(mp4|webp|png|jpe?g)$/.test(asset.src))
      throw new Error('Only local cinematic paths are allowed');
    if ((asset.type === 'video/mp4') !== asset.src.endsWith('.mp4'))
      throw new Error('Asset format mismatch');
    if (
      !['owner-original', 'owner-video-frame', 'owner-photo-mask'].includes(
        asset.source,
      ) ||
      !asset.originalFilename ||
      !/^[a-f0-9]{64}$/.test(asset.sha256)
    )
      throw new Error('Original asset provenance is required');
    if (asset.source !== 'owner-original') {
      const parent = records.find(
        (record) =>
          record.status === 'ready' &&
          record.src === asset.derivedFrom &&
          record.sha256 === asset.sourceSha256 &&
          record.source === 'owner-original',
      );
      if (!parent)
        throw new Error(
          'A derivative must link to its exact supplied original',
        );
      if (
        asset.source === 'owner-video-frame' &&
        (parent.type !== 'video/mp4' ||
          !Number.isFinite(asset.frameTimeSeconds) ||
          asset.frameTimeSeconds < 0 ||
          asset.frameTimeSeconds >= manifest.durationSeconds)
      )
        throw new Error('Invalid video frame provenance');
      if (
        asset.source === 'owner-photo-mask' &&
        (parent.contentOrigin !== 'owner-photograph' ||
          asset.width !== parent.width ||
          asset.height !== parent.height)
      )
        throw new Error('A hair mask must align with its original photograph');
    }
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
