export interface CatalogueSource {
  store: 'in';
  id: number;
  name: string;
  sku: string;
  slug: string;
  url: string;
  type: string;
  inStockAtVerification: boolean;
  categories: readonly { id: number; name: string; slug: string }[];
  attributes: readonly unknown[];
  variations: readonly {
    id: number;
    attributes: readonly { name: string; value: string }[];
  }[];
  images: readonly { id: number; catalogueUrl: string }[];
}
export type ProductCategory =
  | 'hair-care'
  | 'skin-care'
  | 'combo'
  | 'baby-care'
  | 'herbal-powders'
  | 'wellness';
export interface MediaDerivative {
  localAssetPath: string;
  width: number;
  height: number;
  bytes: number;
  sha256: string;
}
export interface ProductMediaRecord {
  id: string;
  originalFilename: string;
  sourceMediaUrl: string;
  sourceSha256: string;
  sourceBytes: number;
  localAssetPath: string;
  width: number;
  height: number;
  verificationStatus: 'source-verified';
  sources: readonly {
    store: 'in';
    id: number;
    sourceUrl: string;
    metadataUrl: string;
    originalFilename: string;
  }[];
  associations: readonly {
    productId: string;
    variantId?: string;
    variantLabel?: string;
    sourceStore: 'in';
    sourceProductId: number;
    role: 'main' | 'gallery';
  }[];
  derivatives: readonly MediaDerivative[];
}
export interface CatalogueProductRecord {
  productId: string;
  slug: string;
  displayName: string;
  category: ProductCategory;
  sources: readonly CatalogueSource[];
  variants: readonly {
    id: string;
    sourceProductId: number;
    label: string;
    sources: readonly CatalogueSource[];
    mediaIds: readonly string[];
  }[];
  verificationStatus: 'source-verified';
  mediaIds: readonly string[];
  missing: readonly string[];
}
export interface ProductMediaManifest {
  sourcePolicy: 'current-approved-in-only';
  schemaVersion: number;
  verifiedOn: string;
  products: readonly CatalogueProductRecord[];
  media: readonly ProductMediaRecord[];
}
