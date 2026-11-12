// Unsigned artistic-media review checks. This does not register a trusted release policy.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
export async function verifyBrassReview(manifest) {
  const prefix = 'review/botanical/';
  const report = JSON.parse(readFileSync(prefix + 'brass-review.json'));
  assert.equal(report.deploymentAllowed, false);
  assert.equal(manifest.vesselFamily.name, 'kerala-heritage-brass');
  for (const old of report.previousAssets) {
    const record = manifest.assets.find((a) => a.file === old.file);
    assert.ok(record, 'Historical original asset removed');
    for (const key of ['sha256', 'bytes', 'width', 'height'])
      assert.equal(
        record[key],
        old[key],
        'Preserved asset changed: ' + old.file,
      );
    assert.equal(digest(readFileSync(prefix + old.file)), old.sha256);
  }
  assert.equal(report.previousAssets.length, 113);
  for (const file of report.preservedFiles)
    assert.equal(digest(readFileSync(file.file)), file.sha256, file.file);
  const code = readFileSync('src/components/botanical/journey.ts', 'utf8');
  for (const block of report.preservedChoreography)
    assert.equal(
      digest(code.slice(code.indexOf(block.start), code.indexOf(block.end))),
      block.sha256,
      'Preserved scroll choreography changed',
    );
  for (const reference of report.references) {
    assert.match(reference.file, /^references\/1054[01]\.jpg$/);
    const bytes = readFileSync(prefix + reference.file);
    assert.equal(digest(bytes), reference.sha256);
    const m = await sharp(bytes).metadata();
    assert.equal(m.width, reference.width);
    assert.equal(m.height, reference.height);
  }
  const family = ['kinnam', 'uruli', 'pourer', 'filter'];
  assert.equal(report.newAssets.length, 12);
  for (const name of family) {
    const record = manifest.assets.find(
      (a) => a.file === `assets/brass-${name}.webp`,
    );
    assert.equal(record.family, 'kerala-heritage-brass');
    const { data, info } = await sharp(prefix + record.file)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const x = Math.round(info.width * 0.5),
      y = Math.round(
        info.height * (name === 'uruli' ? 0.8 : name === 'filter' ? 0.7 : 0.75),
      );
    assert.ok(
      data[(y * info.width + x) * 4 + 3] >= 249,
      'Brass geometry must be opaque',
    );
    assert.equal(data[3], 0, 'Object corner must be transparent');
    if (name === 'uruli') {
      const colors = [[], [], []];
      for (
        let py = Math.round(info.height * 0.24);
        py < info.height * 0.43;
        py += 3
      )
        for (
          let px = Math.round(info.width * 0.32);
          px < info.width * 0.68;
          px += 3
        )
          for (let c = 0; c < 3; c++)
            colors[c].push(data[(py * info.width + px) * 4 + c]);
      const median = colors.map(
        (values) => values.sort((a, b) => a - b)[Math.floor(values.length / 2)],
      );
      assert.ok(
        median[1] >= median[0] && median[1] >= median[2] && median[1] < 80,
        'Uruli oil must remain near-black green',
      );
    }
  }
  console.log(
    'PASS brass review: 113 historical assets, protected files/choreography, owner references, opaque geometry and near-black green oil',
  );
  return report;
}
