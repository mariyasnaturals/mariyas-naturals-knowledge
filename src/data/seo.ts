import { absoluteUrl } from '../config/site';
import { productPath, type Product, type ProductImage } from './products';
import type { Locale } from '../i18n';
export const socialImage = (image: ProductImage | undefined, lang: Locale) =>
  image
    ? {
        src: image.src,
        width: image.width,
        height: image.height,
        alt: image.alt[lang],
      }
    : undefined;
export function collectionSchema(products: readonly Product[], lang: Locale) {
  return {
    '@type': 'CollectionPage',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: products.length,
      itemListElement: products.map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: product.name[lang],
        url: absoluteUrl(productPath(lang, product)),
      })),
    },
  };
}
export function productSchema(product: Product, lang: Locale) {
  return {
    '@type': 'ItemPage',
    isBasedOn: product.sources[0]!.url,
    mainEntity: {
      '@type': 'Product',
      name: product.name[lang],
      description: product.description[lang],
      url: absoluteUrl(productPath(lang, product)),
      sku: product.sku,
      brand: { '@type': 'Brand', name: 'Mariyas Naturals' },
      ...(product.images.main
        ? { image: absoluteUrl(product.images.main.src) }
        : {}),
    },
  };
}
