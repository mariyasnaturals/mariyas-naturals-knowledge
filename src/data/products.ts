import type { Locale } from '../i18n';
import { dictionaries } from '../i18n';
import { resolvePurchaseUrl } from '../config/commerce.mjs';
export type LocalizedText = Record<Locale, string>;
export interface ProductImage {
  id: string;
  src: string; // Local optimized derivative only, never a remote hotlink.
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
  category: 'hair-care' | 'skin-care' | 'combo';
  name: LocalizedText;
  description: LocalizedText;
  images: { main?: ProductImage; gallery: readonly ProductImage[] };
  ingredientsReference?: string;
  ageSuitability?: string;
  originalStoreReference?: string;
  commerceEnabled: boolean;
  verified: boolean;
  demonstration: boolean;
}
const localize = (
  key: 'productName' | 'productDescription',
): LocalizedText => ({
  en: dictionaries.en[key],
  ml: dictionaries.ml[key],
  hi: dictionaries.hi[key],
  ta: dictionaries.ta[key],
});
export const products: readonly Product[] = [
  {
    id: 'reference-mariyas-hair-oil',
    slug: 'hair-oil-example',
    category: 'hair-care',
    name: localize('productName'),
    description: localize('productDescription'),
    images: { gallery: [] },
    commerceEnabled: false,
    verified: false,
    demonstration: true,
  },
];
export const purchaseUrl = (product: Product): string | undefined =>
  resolvePurchaseUrl(product);
export const productPath = (lang: Locale, product: Product) =>
  `/${lang}/products/${product.slug}/`;
export const featuredProduct = products[0]!;
