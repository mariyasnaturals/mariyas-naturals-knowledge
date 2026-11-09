import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveSiteConfig } from '../src/config/resolve-site.mjs';

test('default and development builds cannot index', () => {
  assert.equal(resolveSiteConfig().indexable, false);
  assert.throws(() => resolveSiteConfig({ ALLOW_INDEXING: 'true' }));
  assert.throws(() =>
    resolveSiteConfig({ SITE_ENV: 'production', ALLOW_INDEXING: 'true' }),
  );
});
test('production indexing requires explicit approval and final domain', () => {
  assert.equal(
    resolveSiteConfig({
      SITE_URL: 'https://mariyasnaturals.in',
      SITE_ENV: 'production',
      ALLOW_INDEXING: 'true',
    }).indexable,
    true,
  );
  assert.equal(
    resolveSiteConfig({
      SITE_URL: 'https://mariyasnaturals.in',
      SITE_ENV: 'production',
    }).indexable,
    false,
  );
});
test('reject malformed or insecure canonical origins', () => {
  for (const SITE_URL of [
    'http://mariyasnaturals.in',
    'https://example.org/path',
    'https://user:password@example.org',
    'https://example.org/?q=1',
  ]) {
    assert.throws(() => resolveSiteConfig({ SITE_URL }));
  }
});
