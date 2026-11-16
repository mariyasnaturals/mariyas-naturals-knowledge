import type { Locale } from '../i18n';
import { dictionaries } from '../i18n';
import { resolvePurchaseUrl } from '../config/commerce.mjs';
import data from '../../catalogue/media-manifest.json';
import { approvedImage } from './media';
import { visibilityOf, type ProductVisibility } from './product-visibility';
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
  /** WooCommerce product id, the key the visibility policy is written against. */
  storeProductId: number;
  /** `hidden_pending_photo` records stay in the catalogue but are never routed. */
  visibility: ProductVisibility;
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
/**
 * Every record we hold: 85 listings, including the 26 the owner has asked us to
 * keep out of the public site for now. Nothing here is ever deleted; the list is
 * the audit trail and the source for a future reactivation.
 */
export const catalogueProducts: readonly Product[] = manifest.products.map(
  (record) => {
    const image = (id: string, variantAssociation?: string): ProductImage => {
      const name = variantAssociation
        ? `${record.displayName} · ${variantAssociation}`
        : record.displayName;
      return {
        ...approvedImage(id, {
          en: `${name} — official store product image`,
          ml: `${name} — ഔദ്യോഗിക സ്റ്റോറിലെ ഉൽപ്പന്ന ചിത്രം`,
          hi: `${name} — आधिकारिक स्टोर की उत्पाद छवि`,
          ta: `${name} — அதிகாரப்பூர்வ கடையின் தயாரிப்புப் படம்`,
          kn: `${name} — ಅಧಿಕೃತ ಅಂಗಡಿಯ ಉತ್ಪನ್ನ ಚಿತ್ರ`,
        }),
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
    const storeProductId = record.sources[0]!.id;
    return {
      id: record.productId,
      storeProductId,
      visibility: visibilityOf(storeProductId),
      slug: record.slug,
      category: record.category,
      sku: record.sources.find((source) => source.sku)?.sku,
      // Official names remain verbatim; the interface is localized separately.
      name: {
        en: record.displayName,
        ml: record.displayName,
        hi: record.displayName,
        ta: record.displayName,
        kn: record.displayName,
      },
      description: Object.fromEntries(
        Object.entries(dictionaries).map(([lang, t]) => [
          lang,
          t.productDescription,
        ]),
      ) as LocalizedText,
      images: {
        main: sourceImages[0],
        gallery: [
          ...sourceImages.slice(1),
          ...variants.flatMap((v) => v.images),
        ],
      },
      variants,
      sources: record.sources,
      missing: record.missing,
      verifiedOn: manifest.verifiedOn,
      commerceEnabled: false,
      verified: true,
      demonstration: false,
    };
  },
);
/**
 * The public catalogue: the records whose owner-approved visibility is
 * `visible` (59 of 85 today). Every public surface — routes, catalogue,
 * collections, counts, sitemap, structured data, the Ritual Finder and the care
 * assistant — reads from this array, so a hidden listing cannot leak through a
 * surface that forgot to filter.
 */
export const products: readonly Product[] = catalogueProducts.filter(
  (product) => product.visibility === 'visible',
);

export const purchaseUrl = (product: Product): string | undefined =>
  resolvePurchaseUrl(product);
export const productPath = (lang: Locale, product: Product) =>
  `/${lang}/products/${product.slug}/`;
export const featuredProduct = products.find((p) => p.sources[0]?.id === 3008)!;
export const companionProduct = products.find(
  (p) => p.sources[0]?.id === 3009,
)!;
export const featuredProducts = [featuredProduct, companionProduct];
// Explicit current-store listings; these links are discovery, never purchasing.
// The discontinued 1 litre pack (store #3010) is not an edition of the range.
export const hairOilEditions = products
  .filter((p) => [3008, 3009].includes(p.sources[0]?.id))
  .sort((a, b) => a.sources[0]!.id - b.sources[0]!.id);
