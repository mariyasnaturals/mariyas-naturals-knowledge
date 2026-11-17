/** Types for the plain-JavaScript lookup used by the care assistant. */

export interface SearchableProduct {
  name: string;
  category: string;
  packSize: string | null;
  keywords: readonly string[];
  mediaId?: string | null;
}

export function normalise(value: unknown): string;
export function tokenise(value: unknown): string[];
export function detectIntents(query: string): string[];
export function searchProducts<T extends SearchableProduct>(
  products: readonly T[],
  query: string,
  limit?: number,
): T[];
export function formatMoney(
  minor: number | null | undefined,
  minorUnit?: number,
  currencyCode?: string,
): string | null;
