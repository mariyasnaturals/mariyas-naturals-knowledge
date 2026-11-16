/**
 * Owner-approved public visibility for catalogue listings.
 *
 * The owner approved, on 2026-11-16, that the 26 listings whose official store
 * entry carries no product photograph are *temporarily* hidden from this
 * discovery site until genuine photography exists. This is a visibility change
 * only:
 *
 *   - every product record, SKU, price, source reference and media-provenance
 *     entry stays in catalogue/ and src/data/ (85 records, 0 deleted);
 *   - nothing here is an availability, stock or discontinuation claim;
 *   - the official store is untouched — this changes only what this site shows.
 *
 * Visibility is decided by this list and by nothing else. A future catalogue
 * synchronisation therefore cannot reactivate a listing merely because a new
 * photograph appeared: the entry has to be removed from `product-visibility.json`
 * by hand, after the owner has approved the image. See
 * docs/product-visibility.md for the whole procedure.
 *
 * The one *permanent* exclusion is different and lives in the withdrawal policy:
 * store #3010 (the discontinued 1 litre hair oil) is never fetched into the
 * catalogue at all (see src/data/store.ts and catalogue/README.md).
 */
import config from './product-visibility.json';

export type ProductVisibility = 'visible' | 'hidden_pending_photo';

export interface HiddenProduct {
  /** WooCommerce product id, as returned by the official Store API. */
  readonly storeProductId: number;
  /** Catalogue slug on this site; the product route is never generated. */
  readonly slug: string;
}

interface VisibilityConfig {
  approvedOn: string;
  reason: string;
  hidden: readonly HiddenProduct[];
}

const visibility = config as VisibilityConfig;

/** Recorded with every hidden entry, and asserted by the visibility tests. */
export const hiddenPendingPhotoReason = visibility.reason;

/** Date the owner approved this visibility list. */
export const visibilityApprovedOn = visibility.approvedOn;

/** The listings hidden pending genuine photography, in approved order. */
export const hiddenPendingPhoto: readonly HiddenProduct[] = visibility.hidden;

const hiddenIds = new Set(
  hiddenPendingPhoto.map((item) => item.storeProductId),
);
const hiddenSlugs = new Set(hiddenPendingPhoto.map((item) => item.slug));

/** The visibility of a listing, keyed by its WooCommerce product id. */
export function visibilityOf(storeProductId: number): ProductVisibility {
  return hiddenIds.has(storeProductId) ? 'hidden_pending_photo' : 'visible';
}

/** True when the listing may appear on any public surface. */
export function isPubliclyVisible(storeProductId: number): boolean {
  return !hiddenIds.has(storeProductId);
}

/** Slug form of the same question, for data keyed by catalogue slug. */
export function isPubliclyVisibleSlug(slug: string): boolean {
  return !hiddenSlugs.has(slug);
}
