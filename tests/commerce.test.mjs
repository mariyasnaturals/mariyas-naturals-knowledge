import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolvePurchaseUrl,
  commerceConfig,
  commerceDestinations,
} from '../src/config/commerce.mjs';
const product = { id: 'fixture', commerceEnabled: true, verified: true };
const config = { baseUrl: 'https://www.mariyasnaturals.com', enabled: true };
const mapping = {
  fixture: {
    url: 'https://www.mariyasnaturals.com/product/verified-fixture/',
    verified: true,
  },
};
test('all commerce verification gates must be explicitly enabled', () => {
  assert.equal(commerceConfig.enabled, false);
  assert.deepEqual(commerceDestinations, {});
  assert.equal(resolvePurchaseUrl(product), undefined);
  assert.equal(resolvePurchaseUrl(product, config, {}), undefined);
  assert.equal(
    resolvePurchaseUrl({ ...product, verified: false }, config, mapping),
    undefined,
  );
  assert.equal(
    resolvePurchaseUrl({ ...product, commerceEnabled: false }, config, mapping),
    undefined,
  );
  assert.equal(
    resolvePurchaseUrl(product, config, {
      fixture: { ...mapping.fixture, verified: false },
    }),
    undefined,
  );
  assert.equal(
    resolvePurchaseUrl(product, config, mapping),
    mapping.fixture.url,
  );
});
test('untrusted or guessed commerce destinations cannot pass origin validation', () => {
  for (const url of [
    'https://mariyasnaturals.in/product/test/',
    '/product/test/',
    'http://www.mariyasnaturals.com/product/test/',
    'https://www.mariyasnaturals.com/',
    'https://user:pass@www.mariyasnaturals.com/product/test/',
    'https://www.mariyasnaturals.com:8443/product/test/',
  ]) {
    assert.throws(() =>
      resolvePurchaseUrl(product, config, { fixture: { url, verified: true } }),
    );
  }
});
