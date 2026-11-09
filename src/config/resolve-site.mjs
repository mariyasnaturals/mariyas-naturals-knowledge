export function resolveSiteConfig(env = {}) {
  const url = new URL(env.SITE_URL || 'https://www.mariyasnaturals.cloud');
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      'SITE_URL must be an HTTPS origin without credentials, path, query or fragment.',
    );
  }
  const indexable = env.ALLOW_INDEXING === 'true';
  if (
    indexable &&
    (env.SITE_ENV !== 'production' || url.hostname !== 'mariyasnaturals.in')
  ) {
    throw new Error(
      'Indexing requires SITE_ENV=production and SITE_URL=https://mariyasnaturals.in.',
    );
  }
  return {
    url: url.origin,
    indexable,
    storeUrl: 'https://www.mariyasnaturals.com',
  };
}
