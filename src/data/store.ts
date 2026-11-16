/**
 * Verified links into the official store. Read-only reference data.
 *
 * Every entry was read from the live WooCommerce Store API on 2026-11-16:
 *   https://www.mariyasnaturals.com/wp-json/wc/store/v1/products
 * Slugs are stored exactly as returned. They are never derived from a product
 * name, never guessed, and never edited by hand.
 *
 * Purchases happen on mariyasnaturals.com. Nothing here adds a cart, checkout or
 * payment flow to this website.
 */
export const STORE_ORIGIN = 'https://www.mariyasnaturals.com';

export const storeLinks = Object.freeze({
  shop: `${STORE_ORIGIN}/shop/`,
  hairOil200: `${STORE_ORIGIN}/product/mariyas-herbal-hair-care-oil-200-ml/`,
  hairOil500: `${STORE_ORIGIN}/product/mariyas-herbal-hair-care-500-ml/`,
  hairOilCombo: `${STORE_ORIGIN}/product/mariyas-herbal-hair-care-oil/`,
  hairCareCategory: `${STORE_ORIGIN}/product-category/hair-care/`,
});

/** Source and integrity note for the whole file. */
export const storeVerification = Object.freeze({
  verifiedOn: '2026-11-16',
  method: 'WooCommerce Store API v1, products endpoint, all 86 published items',
  productCount: 86,
  publishedProductCount: 85,
  excludedProductIds: [3010],
  exclusion:
    'Store #3010 (Mariyas Hair Oil – 1 ltr) is discontinued: priced at ₹0, no photograph, no longer sold. It is removed from every page, menu and size switcher.',
});

/**
 * The hair-oil offer is configuration, not a claim baked into markup. It was
 * verified against live sale pricing and must be re-verified before a release that
 * changes the message. When `verified` is false the tile falls back to
 * `fallbackMessage`, so an inactive promotion can never be advertised.
 */
export const hairOilOffer = Object.freeze({
  verified: true,
  verifiedOn: '2026-11-16',
  evidence: [
    'Mariyas Herbal Hair Care Oil – 200 ml: ₹680.00 regular, ₹540.00 sale (−20.6%, store badge −21%)',
    'Mariyas Herbal Hair Care – 500 ml: ₹1,470.00 regular, ₹1,350.00 sale (−8.2%)',
  ],
  /** Re-read the live store before publishing; the published bound must never
   * exceed the highest live discount actually observed. */
  maximumVerifiedDiscountPercent: 21,
  message: 'SAVE UP TO 20%',
  fallbackMessage: 'DISCOVER HAIR OIL',
  href: storeLinks.hairOil200,
});
