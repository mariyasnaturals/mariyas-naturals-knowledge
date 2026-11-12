// PR review data only. Never used by owner signing or VPS deployment tooling.
import assert from 'node:assert/strict';
import {
  readFileSync,
  readdirSync,
  lstatSync,
  mkdirSync,
  writeFileSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import {
  previewContext,
  previewInventory,
  assertPreviewCommerce,
  writePreview,
} from './package-pr-preview.mjs';
import { verifyBotanicalAssets } from './verify-botanical-assets.mjs';
import {
  commerceConfig,
  commerceDestinations,
} from '../src/config/commerce.mjs';
const ORIGIN = 'https://www.mariyasnaturals.cloud';
const CTA = 'https://www.mariyasnaturals.com/product/hair-care-oil-1l/';
const hash = (data) => createHash('sha256').update(data).digest('hex');
export const NOTICE =
  'UNAPPROVED REVIEW — NOT FOR DEPLOYMENT\nNew generated media are not part of the installed release policy.\n';
function filesIn(directory) {
  const files = new Map();
  function walk(path) {
    assert.ok(
      lstatSync(path).isDirectory() && !lstatSync(path).isSymbolicLink(),
      'Unsafe review directory',
    );
    for (const name of readdirSync(path).sort()) {
      assert.match(name, /^[A-Za-z0-9_][A-Za-z0-9_.-]*$/, 'Unsafe review path');
      const file = resolve(path, name),
        stat = lstatSync(file);
      assert.ok(!stat.isSymbolicLink(), 'Review symlinks forbidden');
      if (stat.isDirectory()) walk(file);
      else {
        assert.ok(stat.isFile(), 'Special review files forbidden');
        files.set(relative(directory, file), readFileSync(file));
      }
    }
  }
  walk(directory);
  assert.ok(
    files.size < 5000 &&
      [...files.values()].reduce((n, b) => n + b.length, 0) < 128 * 1024 * 1024,
    'Review inventory exceeds bound',
  );
  return files;
}
export function botanicalReviewInventory(root, directory, manifest) {
  assertPreviewCommerce(commerceConfig, commerceDestinations);
  assert.equal(manifest.schema, 'botanical-review/v1');
  assert.equal(manifest.deploymentAllowed, false);
  assert.equal(manifest.claim.status, 'owner-confirmed');
  assert.equal(manifest.claim.text, '60 Natural Ingredients');
  assert.equal(manifest.officialProductPage.url, CTA);
  // Preserve the unchanged default media/commerce validation; review does not replace it.
  const baseline = previewInventory(root, resolve(root, 'dist'));
  const baseFiles = filesIn(resolve(root, 'dist')),
    publicFiles = filesIn(resolve(root, 'public'));
  const files = filesIn(directory);
  const botanical = new Map(
    manifest.assets
      .filter((a) => a.file.startsWith('assets/'))
      .map((a) => ['_botanical-assets/' + a.file.slice(7), a]),
  );
  assert.equal(
    botanical.size,
    manifest.assets.filter((a) => a.file.startsWith('assets/')).length,
    'Duplicate botanical inventory',
  );
  for (const [name, data] of publicFiles)
    assert.ok(
      files.get(name)?.equals(data),
      'Protected original/public bytes changed: ' + name,
    );
  for (const [name, record] of botanical) {
    const data = files.get(name);
    assert.ok(data, 'Missing registered botanical asset: ' + name);
    assert.equal(data.length, record.bytes);
    assert.equal(
      hash(data),
      record.sha256,
      'Botanical asset hash mismatch: ' + name,
    );
  }
  assert.equal(
    files.get('UNAPPROVED-BOTANICAL-REVIEW.txt')?.toString(),
    NOTICE,
    'Missing/altered unapproved marker',
  );
  assert.equal(
    files.get('robots.txt')?.toString(),
    'User-agent: *\nDisallow: /\n',
    'Review robots violation',
  );
  for (const [name, data] of files) {
    assert.ok(
      baseFiles.has(name) ||
        botanical.has(name) ||
        name === 'UNAPPROVED-BOTANICAL-REVIEW.txt' ||
        /^_astro\/[A-Za-z0-9_.-]+\.(css|js)$/.test(name),
      'Unexpected review file: ' + name,
    );
    if (!name.endsWith('.html')) continue;
    assert.ok(baseFiles.has(name), 'Unexpected HTML route');
    const $ = load(data.toString()),
      base = load(baseFiles.get(name).toString());
    assert.equal($('meta[name=robots]').length, 1);
    assert.equal(
      $('meta[name=robots]').attr('content'),
      'noindex, nofollow',
      'Review noindex violation',
    );
    assert.equal(
      $('link[rel=canonical]').attr('href'),
      ORIGIN + '/' + name.replace(/index\.html$/, ''),
      'Review canonical violation',
    );
    assert.equal(
      $('form[action],a[href*="add-to-cart"],a[href*="checkout"]').length,
      0,
      'Review purchasing violation',
    );
    const baseExternal = new Set(
      base('a[href]')
        .toArray()
        .map((n) => base(n).attr('href'))
        .filter((h) => !h.startsWith('/') && !h.startsWith('#')),
    );
    for (const node of $('a[href]').toArray()) {
      const href = $(node).attr('href');
      if (href.startsWith('/') || href.startsWith('#')) continue;
      assert.ok(
        baseExternal.has(href) ||
          (href === CTA && $(node).is('#botanical-finale .botanical-cta')),
        'Unverified review destination',
      );
    }
    for (const n of $('img[src],source[srcset],img[srcset]').toArray()) {
      const values = [
        $(n).attr('src'),
        ...($(n).attr('srcset') || '')
          .split(',')
          .map((v) => v.trim().split(/\s+/)[0]),
      ].filter(Boolean);
      for (const value of values) {
        const url = new URL(value, ORIGIN);
        assert.equal(url.origin, ORIGIN, 'Review image hotlink');
        assert.ok(
          publicFiles.has(url.pathname.slice(1)) ||
            botanical.has(url.pathname.slice(1)),
          'Unregistered rendered image',
        );
      }
    }
    if (/^(en|ml|hi|ta)\/index.html$/.test(name)) {
      assert.equal(
        $('#story').prop('outerHTML'),
        base('#story').prop('outerHTML'),
        'Approved cinematic story changed',
      );
      assert.equal($('[data-botanical-step]').length, 8);
      assert.equal($('.botanical-study').length, 30);
      assert.equal(
        $('.botanical-claim').text().replace(/\s+/g, ' ').trim(),
        '60 Natural Ingredients',
      );
      assert.equal($('.botanical-cta').length, 1);
      assert.equal($('.botanical-cta').attr('href'), CTA);
      assert.ok(
        $('#story').nextAll('section').first().is('[data-botanical-journey]'),
        'Journey placement changed',
      );
    } else assert.equal($('[data-botanical-journey]').length, 0);
  }
  for (const name of baseFiles.keys())
    if (!name.startsWith('_astro/'))
      assert.ok(files.has(name), 'Baseline route/asset missing');
  return {
    files: [...files]
      .map(([path, data]) => ({ path, bytes: data.length, sha256: hash(data) }))
      .sort((a, b) => a.path.localeCompare(b.path)),
    originalMedia: baseline.originalMedia,
  };
}
export async function packageBotanicalReview(root = process.cwd()) {
  const context = previewContext(root);
  assert.equal(context.branch, 'feature/botanical-journey-review');
  assert.ok(
    context.event === 'local-review' || context.event === 'pull_request',
    'Botanical bundle is PR/local-review only',
  );
  const m = await verifyBotanicalAssets();
  const inventory = botanicalReviewInventory(
    root,
    resolve(root, 'botanical-review-site'),
    m,
  );
  assert.deepEqual(
    previewContext(root),
    context,
    'Source changed during validation',
  );
  const result = writePreview(
    resolve(root, 'botanical-review-site'),
    resolve(root, 'botanical-review-results/preview'),
    context,
    inventory,
    'botanical',
  );
  assert.deepEqual(
    previewContext(root),
    context,
    'Source changed during packaging',
  );
  const report = {
    schema: 'botanical-pr-review/v1',
    approvalStatus: 'UNAPPROVED',
    deploymentAllowed: false,
    source: context,
    archiveSha256: result.archive.sha256,
    assetManifestSha256: hash(
      readFileSync(resolve(root, 'review/botanical/asset-manifest.json')),
    ),
    referenceProvenanceSha256: hash(
      readFileSync(resolve(root, 'review/botanical/reference-provenance.json')),
    ),
    botanicalStudies: 30,
    assetRecords: m.assets.length,
    originalMedia: inventory.originalMedia,
    mediaPolicyStatus:
      'Default release policy passed unchanged; botanical assets validated for unsigned review only. Installed source/media trust is not promoted.',
    publicationBlockers: [
      'Owner visual approval is pending.',
      'Botanical component is review-only; the default release build does not render it.',
      'New assets and the official-store reference require explicit reviewed release-policy registration.',
      'Installed VPS gate fingerprints must undergo the established reviewed trust upgrade; merging alone cannot authorize changed gate files.',
    ],
  };
  mkdirSync(resolve(root, 'botanical-review-results'), { recursive: true });
  writeFileSync(
    resolve(root, 'botanical-review-results/validation-report.json'),
    JSON.stringify(report, null, 2) + '\n',
  );
  console.log(
    'Verified exact-source UNAPPROVED botanical review: ' + context.sha,
  );
  return report;
}
if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
)
  await packageBotanicalReview();
