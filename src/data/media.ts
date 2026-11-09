import productData from './media-manifest.json';
import brandData from './brand-media.json';
import type {
  ProductMediaManifest,
  ProductMediaRecord,
  ProductCategory,
} from './media-types';
import type { LocalizedText, ProductImage } from './products';
import { assertApprovedMedia } from '../config/media-policy.mjs';
const productManifest = productData as ProductMediaManifest;
const brandManifest = brandData as unknown as {
  sourcePolicy: 'current-approved-in-only';
  media: (ProductMediaRecord & { category: ProductCategory })[];
};
assertApprovedMedia(productManifest);
assertApprovedMedia(brandManifest);
const approved = new Map(
  [...productManifest.media, ...brandManifest.media].map((m) => [m.id, m]),
);
export function approvedImage(id: string, alt: LocalizedText): ProductImage {
  const media = approved.get(id);
  if (!media)
    throw new Error(`Image is not in the current approved .in manifest: ${id}`);
  const largest = media.derivatives.at(-1)!;
  return {
    id,
    src: largest.localAssetPath,
    width: largest.width,
    height: largest.height,
    alt,
    variants: media.derivatives.map((d) => ({
      src: d.localAssetPath,
      width: d.width,
    })),
  };
}
export function assertApprovedImage(image: ProductImage) {
  const media = approved.get(image.id);
  if (
    !media ||
    !media.derivatives.some((d) => d.localAssetPath === image.src) ||
    image.variants.some(
      (v) =>
        !media.derivatives.some(
          (d) => d.localAssetPath === v.src && d.width === v.width,
        ),
    )
  )
    throw new Error(
      'Rendering an image outside the approved .in manifest is forbidden',
    );
}
export const categoryArtwork = (
  category: ProductCategory,
  alt: LocalizedText,
) => {
  const media = brandManifest.media.find((m) => m.category === category);
  return media ? approvedImage(media.id, alt) : undefined;
};
