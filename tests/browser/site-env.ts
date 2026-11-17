/**
 * The browser suite runs against three builds of the same site: the unsigned
 * staging candidate (`*.cloud`, never indexable), the GitHub Pages preview
 * (`*.github.io`, never indexable) and the production release
 * (`https://mariyasnaturals.in`, indexable). Only the deployment metadata
 * differs, so read it from the same environment contract the static validators
 * use in scripts/validate-static.mjs rather than pinning any one deployment.
 *
 * Defaults match the staging candidate, which is what CI builds.
 */
export const expectedOrigin = (
  process.env.EXPECT_SITE_URL || 'https://www.mariyasnaturals.cloud'
).replace(/\/+$/, '');

export const isIndexable = process.env.EXPECT_INDEXABLE === 'true';

/** Exactly the content the layout emits for the current deployment. */
export const expectedRobots = isIndexable
  ? 'index, follow'
  : 'noindex, nofollow';
