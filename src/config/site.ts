export const site = __SITE_CONFIG__;
export const absoluteUrl = (path: string) => new URL(path, site.url).href;
export function verifiedStoreUrl(value?: string): string | undefined {
  if (!value) return undefined;
  const url = new URL(value);
  if (
    url.protocol !== 'https:' ||
    url.hostname !== 'www.mariyasnaturals.com' ||
    url.username ||
    url.password ||
    url.pathname === '/'
  ) {
    throw new Error(
      'Product purchase links must be verified HTTPS product URLs on www.mariyasnaturals.com.',
    );
  }
  return url.href;
}
