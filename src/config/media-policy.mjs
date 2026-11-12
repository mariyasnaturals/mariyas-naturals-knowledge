// The business-approved image source. Commerce configuration is separate.
export const currentStoreOrigin = 'https://mariyasnaturals.in';
export const mediaPolicy = 'current-approved-in-only';
// Exact reviewed botanical release set. Any other studied path is unapproved.
export const botanicalMediaRoot = '/_botanical-assets/';
export const botanicalMediaPolicy = 'reviewed-botanical-release-v1';
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
/**
 * The reviewed 200 ml bottle cutout is derived from the owner photograph that is
 * already published by this site; its catalogue reference stays a current .in page.
 */
export function assertApprovedBotanicalReference(value) {
  const url = new URL(value);
  if (
    url.origin !== currentStoreOrigin ||
    url.username ||
    url.password ||
    !url.pathname.startsWith('/product/')
  ) {
    throw new Error(`Unapproved botanical reference: ${url.hostname}`);
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
/**
 * Validate the separately reviewed botanical release manifest. Provenance stays
 * explicit: generated artistic studies are unnamed, the product cutout is the
 * owner photograph, and only registered local derivatives may be served.
 */
export function assertApprovedBotanicalMedia(manifest) {
  if (manifest.sourcePolicy !== mediaPolicy)
    throw new Error('Current-store media policy is required');
  if (manifest.status !== 'owner-approved-reviewed-botanical-release-media')
    throw new Error('Reviewed botanical release media is required');
  const ids = new Set();
  const local = new Set();
  let productCutouts = 0;
  for (const media of manifest.media) {
    if (!media.sources.length || ids.has(media.id))
      throw new Error('Missing or duplicate reviewed botanical provenance');
    ids.add(media.id);
    if (!Array.isArray(media.associations))
      throw new Error('Botanical associations must be explicit');
    const provenance = media.provenance || {};
    if (provenance.reviewStatus !== 'owner-visually-approved-2026-11-12')
      throw new Error('Botanical media require recorded owner visual approval');
    if (media.role === 'photographic-product-cutout') {
      productCutouts++;
      if (
        provenance.contentOrigin !== 'owner-photograph' ||
        provenance.derivation !== 'rgb-preserving-alpha-cutout' ||
        !/^[a-f0-9]{64}$/.test(provenance.originalSha256 || '') ||
        !/^[a-f0-9]{64}$/.test(provenance.matteSha256 || '') ||
        !provenance.rgbPolicy
      )
        throw new Error(
          'Photographic product media require original provenance',
        );
      assertApprovedBotanicalReference(media.sourceMediaUrl);
    } else {
      if (
        provenance.contentOrigin !== 'ai-generated-artistic' ||
        provenance.artisticRepresentation !== true ||
        !provenance.masterFile
      )
        throw new Error(
          'Generated botanical media require artistic provenance',
        );
      assertApprovedSource(media.sourceMediaUrl);
    }
    if (media.role === 'artistic-study') {
      if (
        provenance.identity !== null ||
        provenance.scientificName !== null ||
        provenance.identityVerified !== false
      )
        throw new Error('Botanical studies must stay unnamed artistic forms');
    }
    for (const source of media.sources) {
      if (source.store !== 'in')
        throw new Error('Only current .in media may render');
    }
    for (const derivative of media.derivatives) {
      if (
        !derivative.localAssetPath.startsWith(botanicalMediaRoot) ||
        derivative.localAssetPath.includes('..') ||
        ' /\\'.includes(derivative.localAssetPath.at(-1))
      )
        throw new Error('Reviewed botanical media must be local');
      if (!/^[a-f0-9]{64}$/.test(derivative.sha256) || !(derivative.bytes > 0))
        throw new Error('Reviewed botanical media require a hash and size');
      if (local.has(derivative.localAssetPath))
        throw new Error('Duplicate reviewed botanical derivative');
      local.add(derivative.localAssetPath);
    }
  }
  if (productCutouts !== 1)
    throw new Error('Exactly one photographed product reveal is approved');
  return local;
}
