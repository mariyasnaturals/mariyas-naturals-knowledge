import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  cpSync,
  readFileSync,
  writeFileSync,
  rmSync,
  symlinkSync,
  existsSync,
} from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { botanicalReviewInventory } from '../../scripts/package-botanical-pr-preview.mjs';
import { writePreview } from '../../scripts/package-pr-preview.mjs';
const root = process.cwd();
test('botanical preview enforces exact registered media, originals, metadata, destinations and unsigned identity', async (t) => {
  const temp = mkdtempSync(resolve(tmpdir(), 'botanical-ci-'));
  t.after(() => rmSync(temp, { recursive: true, force: true }));
  const site = resolve(temp, 'site');
  cpSync(resolve(root, 'botanical-review-site'), site, { recursive: true });
  const manifest = JSON.parse(
    readFileSync('review/botanical/asset-manifest.json'),
  );
  const check = () => botanicalReviewInventory(root, site, manifest);
  const inventory = check();
  assert.ok(inventory.files.length > 500);
  const mutate = (name, fn, pattern) => {
    const path = resolve(site, name),
      before = readFileSync(path);
    try {
      writeFileSync(path, fn(before));
      assert.throws(check, pattern);
    } finally {
      writeFileSync(path, before);
    }
  };
  await t.test('tampered approved MP4 is rejected', () =>
    mutate(
      'cinematic/homepage-mobile.mp4',
      (b) => Buffer.concat([b, Buffer.from('tamper')]),
      /original\/public bytes/,
    ),
  );
  await t.test('tampered product derivative is rejected', () =>
    mutate(
      '_botanical-assets/authentic-product-cutout.webp',
      (b) => Buffer.concat([b, Buffer.from('tamper')]),
      /hash mismatch|strictly equal/,
    ),
  );
  await t.test('noindex and robots violations are rejected', () => {
    mutate(
      'en/index.html',
      (b) => b.toString().replace('noindex, nofollow', 'index, follow'),
      /noindex violation/,
    );
    mutate(
      'robots.txt',
      () => Buffer.from('User-agent: *\nAllow: /\n'),
      /robots violation/,
    );
  });
  await t.test(
    'unverified product links and checkout forms are rejected',
    () => {
      mutate(
        'en/index.html',
        (b) =>
          b
            .toString()
            .replace(
              'https://www.mariyasnaturals.com/product/hair-care-oil-1l/',
              'https://www.mariyasnaturals.com/product/not-reviewed/',
            ),
        /destination/,
      );
      mutate(
        'en/index.html',
        (b) =>
          b
            .toString()
            .replace('</main>', '<form action="/checkout/"></form></main>'),
        /purchasing violation/,
      );
    },
  );
  await t.test(
    'symlinks, missing assets and unknown files are rejected',
    () => {
      const link = resolve(site, 'linked.pem');
      symlinkSync(resolve(root, 'package.json'), link);
      assert.throws(check, /symlinks/);
      rmSync(link);
      writeFileSync(resolve(site, 'credential.pem'), 'unexpected');
      assert.throws(check, /Unexpected review file/);
      rmSync(resolve(site, 'credential.pem'));
      const asset = resolve(site, '_botanical-assets/ingredient-01.webp'),
        bytes = readFileSync(asset);
      rmSync(asset);
      assert.throws(check, /Missing registered/);
      writeFileSync(asset, bytes);
    },
  );
  await t.test(
    'changing the existing cinematic story or unapproved marker is rejected',
    () => {
      mutate(
        'en/index.html',
        (b) => b.toString().replace('id="story"', 'id="altered-story"'),
        /cinematic story changed/,
      );
      mutate(
        'UNAPPROVED-BOTANICAL-REVIEW.txt',
        () => Buffer.from('Approved release'),
        /unapproved marker/,
      );
    },
  );
  await t.test(
    'preview remains explicitly unsigned and never emits release files',
    () => {
      const output = resolve(temp, 'preview');
      const result = writePreview(
        site,
        output,
        { sha: 'a'.repeat(40) },
        inventory,
        'botanical',
      );
      assert.equal(result.approvalStatus, 'UNAPPROVED');
      assert.equal(result.deploymentAllowed, false);
      assert.match(result.archive.name, /^UNAPPROVED-botanical-/);
      assert.ok(
        !existsSync(resolve(output, 'manifest.sig')) &&
          !existsSync(resolve(output, 'release.zip')),
      );
      assert.throws(
        () =>
          writePreview(
            site,
            resolve(temp, 'invalid'),
            { sha: 'a'.repeat(40) },
            inventory,
            'signed-release',
          ),
        /Unknown review artifact/,
      );
    },
  );
});
test('review workflow cannot authenticate or deploy PR artifacts', () => {
  const text = readFileSync('.github/workflows/botanical-review.yml', 'utf8');
  assert.match(text, /contents: read/);
  assert.match(text, /github\.head_ref == 'feature\/botanical-journey-review'/);
  assert.doesNotMatch(
    text,
    /pull_request_target|secrets\.|STAGING_AUTOMATION_KEY|environment:|ops\/ci_staging\/cli.py sign|--apply|scp /,
  );
});
