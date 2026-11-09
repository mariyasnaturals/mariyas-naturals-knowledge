// The business-approved image source. Commerce configuration is separate.
export const currentStoreOrigin = 'https://mariyasnaturals.in';
export const mediaPolicy = 'current-approved-in-only';
export function assertApprovedSource(value) {
  const url = new URL(value);
  if (
    url.origin !== currentStoreOrigin ||
    url.username ||
    url.password ||
    !url.pathname.startsWith('/wp-content/uploads/')
  ) {
    throw new Error(`Unapproved image source: ${url.hostname}`);
  }
  return url;
}
export function assertApprovedMedia(manifest) {
  if (manifest.sourcePolicy !== mediaPolicy)
    throw new Error('Current-store media policy is required');
  const ids = new Set();
  for (const media of manifest.media) {
    if (!media.sources.length || ids.has(media.id))
      throw new Error('Missing or duplicate approved media provenance');
    ids.add(media.id);
    assertApprovedSource(media.sourceMediaUrl);
    for (const source of media.sources) {
      if (source.store !== 'in')
        throw new Error('Only current .in media may render');
      assertApprovedSource(source.sourceUrl);
    }
    for (const derivative of media.derivatives) {
      if (
        !derivative.localAssetPath.startsWith('/images/') ||
        derivative.localAssetPath.includes('..')
      )
        throw new Error('Approved media must be local');
    }
  }
  for (const product of manifest.products || []) {
    for (const source of product.sources) {
      if (
        source.store !== 'in' ||
        new URL(source.url).origin !== currentStoreOrigin
      )
        throw new Error('Only current .in catalogue records may render');
    }
    for (const id of product.mediaIds) {
      if (!ids.has(id)) throw new Error(`Unapproved product image: ${id}`);
      const asset = manifest.media.find((media) => media.id === id);
      if (
        !asset.associations.some(
          (association) =>
            association.productId === product.productId &&
            product.sources.some(
              (source) =>
                source.id === association.sourceProductId &&
                source.images.some((image) =>
                  asset.sources.some((origin) => origin.id === image.id),
                ),
            ),
        )
      ) {
        throw new Error(`Image does not belong to this current product: ${id}`);
      }
    }
  }
}
