// @ts-check
// Never construct product URLs from temporary WordPress slugs.
export const commerceConfig = Object.freeze({
  baseUrl: 'https://www.mariyasnaturals.com',
  enabled: false,
});
/** @type {Readonly<Record<string, { url: string; verified: boolean }>>} */
export const commerceDestinations = Object.freeze({});
/**
 * @param {{id: string; commerceEnabled: boolean; verified: boolean}} product
 * @param {{baseUrl: string; enabled: boolean}} config
 * @param {Readonly<Record<string, {url: string; verified: boolean}>>} mappings
 * @returns {string | undefined}
 */
export function resolvePurchaseUrl(
  product,
  config = commerceConfig,
  mappings = commerceDestinations,
) {
  const destination = mappings[product.id];
  if (
    !config.enabled ||
    !product.commerceEnabled ||
    !product.verified ||
    !destination?.verified
  )
    return undefined;
  const base = new URL(config.baseUrl);
  const url = new URL(destination.url);
  if (
    base.protocol !== 'https:' ||
    base.username ||
    base.password ||
    base.pathname !== '/' ||
    base.search ||
    base.hash ||
    url.protocol !== 'https:' ||
    url.origin !== base.origin ||
    url.username ||
    url.password ||
    url.pathname === '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      'Commerce destination must be an exact verified HTTPS product URL on the configured origin.',
    );
  }
  return url.href;
}
