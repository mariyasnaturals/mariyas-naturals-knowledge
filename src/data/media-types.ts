import type { LocalizedText } from './products';
/** One entry per deduplicated source asset; variants preserve package identity. */
export interface ProductMediaRecord {
  id: string;
  productId: string;
  sku?: string;
  displayName: string;
  originalSourceWebsite: string;
  sourceMediaUrl?: string;
  exportReference?: string;
  originalFilename: string;
  localAssetPath: string;
  width: number;
  height: number;
  sourceSha256: string;
  variantAssociation?: string;
  category: string;
  verificationStatus: 'source-verified' | 'awaiting-review';
  alt: LocalizedText;
  derivatives: readonly {
    localAssetPath: string;
    width: number;
    height: number;
    bytes: number;
  }[];
}
