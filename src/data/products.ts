import type { Locale } from '../i18n';
import { dictionaries } from '../i18n';
import { resolvePurchaseUrl } from '../config/commerce.mjs';
import data from './media-manifest.json';
import type {
  CatalogueSource,
  ProductCategory,
  ProductMediaManifest,
} from './media-types';
export type LocalizedText = Record<Locale, string>;
export interface ProductImage {
  id: string;
  src: string;
  width: number;
  height: number;
  alt: LocalizedText;
  variants: readonly { src: string; width: number }[];
  variantAssociation?: string;
}
export interface Product {
  id: string;
  sku?: string;
  slug: string;
  category: ProductCategory;
  name: LocalizedText;
  description: LocalizedText;
  sources: readonly CatalogueSource[];
  variants: readonly {
    id: string;
    label: string;
    sourceProductId: number;
    images: readonly ProductImage[];
  }[];
  images: { main?: ProductImage; gallery: readonly ProductImage[] };
  missing: readonly string[];
  verifiedOn: string;
  commerceEnabled: boolean;
  verified: boolean;
  demonstration: boolean;
}
const manifest = data as ProductMediaManifest;
export const products: readonly Product[] = manifest.products.map((record) => {
  const image = (id: string, variantAssociation?: string): ProductImage => {
    const media = manifest.media.find((m) => m.id === id);
    if (!media) throw new Error(`Missing media record: ${id}`);
    const largest = media.derivatives.at(-1)!;
    const name = variantAssociation
      ? `${record.displayName} · ${variantAssociation}`
      : record.displayName;
    return {
      id,
      src: largest.localAssetPath,
      width: largest.width,
      height: largest.height,
      alt: {
        en: `${name} — official store product image`,
        ml: `${name} — ഔദ്യോഗിക സ്റ്റോറിലെ ഉൽപ്പന്ന ചിത്രം`,
        hi: `${name} — आधिकारिक स्टोर की उत्पाद छवि`,
        ta: `${name} — அதிகாரப்பூர்வ கடையின் தயாரிப்புப் படம்`,
      },
      variants: media.derivatives.map((d) => ({
        src: d.localAssetPath,
        width: d.width,
      })),
      variantAssociation,
    };
  };
  const variants = record.variants.map((v) => ({
    id: v.id,
    sourceProductId: v.sourceProductId,
    label: v.label,
    images: v.mediaIds.map((id) => image(id, v.label)),
  }));
  const sourceImages = record.mediaIds.map((id) => image(id));
  return {
    id: record.productId,
    slug: record.slug,
    category: record.category,
    sku:
      record.sources.find((s) => s.store === 'in')?.sku ||
      record.sources.find((s) => s.sku)?.sku,
    // Official names remain verbatim; the interface is localized separately.
    name: {
      en: record.displayName,
      ml: record.displayName,
      hi: record.displayName,
      ta: record.displayName,
    },
    description: Object.fromEntries(
      Object.entries(dictionaries).map(([lang, t]) => [
        lang,
        t.productDescription,
      ]),
    ) as LocalizedText,
    images: {
      main: sourceImages[0],
      gallery: [...sourceImages.slice(1), ...variants.flatMap((v) => v.images)],
    },
    variants,
    sources: record.sources,
    missing: record.missing,
    verifiedOn: manifest.verifiedOn,
    commerceEnabled: false,
    verified: true,
    demonstration: false,
  };
});
export const purchaseUrl = (product: Product): string | undefined =>
  resolvePurchaseUrl(product);
export const productPath = (lang: Locale, product: Product) =>
  `/${lang}/products/${product.slug}/`;
export const featuredProduct = products.find((p) => p.id === 'mn-19185')!;
export const featuredProducts = [
  'mn-19185',
  'mn-19214',
  'mn-79430',
  'mn-19189',
  'mn-77781',
  'mn-76995',
].map((id) => products.find((p) => p.id === id)!);
