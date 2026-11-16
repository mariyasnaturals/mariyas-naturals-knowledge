/**
 * The care assistant's client index — a slim projection of
 * `catalogue/care-knowledge.json`.
 *
 * It is imported lazily by `CareAssistant.astro`, so Vite emits it as its own
 * chunk and a visitor who never opens the assistant never downloads it. It is a
 * build-time module: nothing here is copied into `public/`.
 */
import knowledge from '../../catalogue/care-knowledge.json';

export interface CareProduct {
  id: string;
  slug: string;
  name: string;
  category: string;
  packSize: string | null;
  storeUrl: string;
  inStock: boolean;
  /** Store-enumerated prices, still in minor units. */
  prices: {
    currencyCode: string;
    minorUnit: number;
    price: number | null;
    regular: number | null;
    sale: number | null;
    onSale: boolean;
  };
  summary: string;
  details: string;
  keywords: readonly string[];
  mediaId: string | null;
}

interface Knowledge {
  verifiedOn: string;
  sourceOrigin: string;
  policy: readonly string[];
  products: readonly (CareProduct & { storeUrl: string })[];
}

const data = knowledge as unknown as Knowledge;

export const careProducts: readonly CareProduct[] = data.products.map(
  (product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category,
    packSize: product.packSize,
    storeUrl: product.storeUrl,
    inStock: product.inStock,
    prices: product.prices,
    summary: product.summary,
    details: product.details,
    keywords: product.keywords,
    mediaId: product.mediaId,
  }),
);

export const careVerifiedOn = data.verifiedOn;
export const careSourceOrigin = data.sourceOrigin;
export const carePolicy = data.policy;

/**
 * Derivative paths follow one convention, enforced by the media tests:
 * `/images/products/<slug>/<mediaId>-<width>.webp`. Resolving it here avoids
 * shipping the 90 KB media manifest to the browser.
 */
export const careImage = (product: CareProduct, width = 320) =>
  product.mediaId
    ? `/images/products/${product.slug}/${product.mediaId}-${width}.webp`
    : null;
