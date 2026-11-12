import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { verifyBrassReview } from '../scripts/verify-brass-review.mjs';
const manifest = () =>
  JSON.parse(readFileSync('review/botanical/asset-manifest.json'));
test('brass family retains prior media, choreography and physical color/alpha constraints', async () => {
  await verifyBrassReview(manifest());
});
test('altered historical hash or new vessel-family identity is rejected', async () => {
  const bad = manifest();
  bad.assets.find((a) => a.file === 'assets/ingredient-01.webp').sha256 =
    '0'.repeat(64);
  await assert.rejects(verifyBrassReview(bad), /Preserved asset/);
  const wrong = manifest();
  wrong.vesselFamily.name = 'unapproved-substitute';
  await assert.rejects(verifyBrassReview(wrong));
});
