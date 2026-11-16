// The business-approved image source. Commerce configuration is separate.
//
// Product photography comes from the live official store (`.com`) through the
// audited acquisition job in `scripts/fetch-com-snapshot.mjs`; the four category
// artworks that were already published on the `.in` staging store stay readable
// as editorial artwork only. No CDN, no hotlink and no third host is approved.
export const storeOrigins = Object.freeze({
  official: 'https://www.mariyasnaturals.com',
  editorial: 'https://mariyasnaturals.in',
});

/** Where the catalogue and every product photograph must come from. */
export const currentStoreOrigin = storeOrigins.official;

/** Every approved upload host, official store first. */
export const approvedStoreOrigins = Object.freeze(Object.values(storeOrigins));

export const mediaPolicy = 'official-com-catalogue-with-editorial-artwork';

/**
 * Approved media may only be served from an approved upload host. A `.in`
 * source is accepted as editorial artwork; product photographs must use the
 * official `.com` store (`assertApprovedMedia` enforces that).
 */
export function assertApprovedSource(value, origins = approvedStoreOrigins) {
  const url = new URL(value);
  if (
    !origins.includes(url.origin) ||
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
    throw new Error('Official-store media policy is required');
  const ids = new Set();
  for (const media of manifest.media) {
    if (!media.sources.length || ids.has(media.id))
      throw new Error('Missing or duplicate approved media provenance');
    ids.add(media.id);
    assertApprovedSource(media.sourceMediaUrl);
    for (const source of media.sources) {
      if (!['com', 'in'].includes(source.store))
        throw new Error('Only an approved store may be recorded as the source');
      assertApprovedSource(source.sourceUrl);
      if (
        source.store === 'com' &&
        new URL(source.sourceUrl).origin !== currentStoreOrigin
      )
        throw new Error(
          'A .com media record must be served by the official store',
        );
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
        source.store !== 'com' ||
        new URL(source.url).origin !== currentStoreOrigin
      )
        throw new Error('Only official .com catalogue records may render');
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
