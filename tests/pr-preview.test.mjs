import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  cpSync,
  writeFileSync,
  readFileSync,
  rmSync,
  symlinkSync,
  appendFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import {
  previewContext,
  previewInventory,
  assertPreviewCommerce,
  writePreview,
  WARNING,
} from '../scripts/package-pr-preview.mjs';

const root = resolve(import.meta.dirname, '..');
const approved = 'f958b4b18ddf4dc91151720b4e6aea7e6226bee3';
const origin = 'https://www.mariyasnaturals.cloud';
const hash = (data) => createHash('sha256').update(data).digest('hex');
function temporary(t) {
  const path = mkdtempSync(resolve(tmpdir(), 'mariyas-preview-test-'));
  t.after(() => rmSync(path, { recursive: true, force: true }));
  return path;
}
function fixture(t) {
  const path = temporary(t);
  mkdirSync(resolve(path, 'src/data'), { recursive: true });
  for (const name of ['cinematic-assets', 'media-manifest', 'brand-media'])
    cpSync(
      resolve(root, `src/data/${name}.json`),
      resolve(path, `src/data/${name}.json`),
    );
  cpSync(resolve(root, 'public'), resolve(path, 'public'), { recursive: true });
  cpSync(resolve(path, 'public'), resolve(path, 'dist'), { recursive: true });
  for (const name of [
    'index.html',
    ...['en', 'ml', 'hi', 'ta'].map((lang) => lang + '/index.html'),
  ]) {
    const file = resolve(path, 'dist', name);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(
      file,
      `<html><head><meta name="robots" content="noindex, nofollow"><link rel="canonical" href="${origin}/${name.replace(/index\.html$/, '')}"></head><body>Fixture</body></html>`,
    );
  }
  writeFileSync(
    resolve(path, 'dist/robots.txt'),
    'User-agent: *\nDisallow: /\n',
  );
  for (const name of ['sitemap-index.xml', 'sitemap-0.xml'])
    writeFileSync(resolve(path, 'dist', name), '<xml/>');
  mkdirSync(resolve(path, 'dist/_astro'));
  writeFileSync(resolve(path, 'dist/_astro/fixture.js'), '// compiled fixture');
  return path;
}

test('approved staging packager still rejects the cinematic website; trusted tools are unchanged', () => {
  const result = spawnSync(process.execPath, ['scripts/package-staging.mjs'], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /Approved website differs from the review baseline/,
  );
  for (const file of [
    'scripts/package-staging.mjs',
    '.github/workflows/staging-release.yml',
    '.github/workflows/staging-review.yml',
    'ops/prepare_release.py',
    'ops/publish_release.py',
    'ops/pull_deploy.py',
    'ops/owner-media-policy.json',
    'ops/owner-tools.sha256',
  ]) {
    assert.ok(
      readFileSync(resolve(root, file)).equals(
        execFileSync('git', ['show', `${approved}:${file}`], { cwd: root }),
      ),
      `Trusted release path changed: ${file}`,
    );
  }
});

test('preview verifies archive bytes and cannot enter owner or VPS release paths even when renamed', (t) => {
  const path = fixture(t),
    dist = resolve(path, 'dist'),
    output = resolve(path, 'preview');
  const inventory = previewInventory(path, dist);
  const manifest = writePreview(
    dist,
    output,
    { sha: 'a'.repeat(40) },
    inventory,
  );
  assert.equal(manifest.warning, WARNING);
  assert.equal(manifest.approvalStatus, 'UNAPPROVED');
  assert.equal(manifest.deploymentAllowed, false);
  assert.equal(manifest.approvedUiBaseline, undefined);
  assert.equal(
    hash(readFileSync(resolve(output, manifest.archive.name))),
    manifest.archive.sha256,
  );
  assert.match(
    readFileSync(resolve(output, manifest.archive.name + '.sha256'), 'utf8'),
    new RegExp('^' + manifest.archive.sha256),
  );
  execFileSync(
    'python3',
    [
      '-c',
      `
import json,pathlib,shutil,sys,zipfile
sys.path.insert(0,sys.argv[1]+'/ops'); sys.path.insert(0,sys.argv[1]+'/tests/pull')
import prepare_release as owner, pull_deploy as pull
from test_pull import PullSafety
p=pathlib.Path(sys.argv[2]); m=json.loads((p/'preview-manifest.json').read_text())
with zipfile.ZipFile(p/m['archive']['name']) as z:
    assert all(n.startswith('UNAPPROVED-PREVIEW/') for n in z.namelist())
    assert not any(n in z.namelist() for n in ['index.html','manifest.json','manifest.sig','release.zip','review-manifest.json'])
try:
    owner.inspect(p,p/'not-a-candidate','a'*40,1,'42')
    raise AssertionError('Preview admitted by owner inspector')
except FileNotFoundError: pass
candidate=p/'renamed'; candidate.mkdir()
(candidate/'manifest.json').write_bytes((p/'preview-manifest.json').read_bytes())
shutil.copyfile(p/m['archive']['name'],candidate/'release.zip')
try:
    owner.approve(candidate,p/'missing-private-key',p/'missing-public-key','0'*64)
    raise AssertionError('Preview admitted before owner key access')
except ValueError as e: assert 'Candidate policy mismatch' in str(e)
f=PullSafety(); f.setUp()
try:
    before=f.snapshot()
    try:
        pull.verify_release(candidate,f.cfg)
        raise AssertionError('Unsigned preview accepted by VPS')
    except ValueError as e: assert 'signature' in str(e)
    f.sign(candidate) # Disposable fixture signature, never an owner key/release.
    try:
        pull.verify_release(candidate,f.cfg)
        raise AssertionError('Renamed preview schema accepted by VPS')
    except ValueError as e: assert 'Release policy mismatch' in str(e)
    assert f.snapshot()==before
finally: f.doCleanups()
`,
      root,
      output,
    ],
    { stdio: 'pipe' },
  );
});

test('modified compiled originals and modified source/manifest pairs are rejected', (t) => {
  const path = fixture(t),
    dist = resolve(path, 'dist');
  const video = 'cinematic/homepage-mobile.mp4';
  appendFileSync(resolve(dist, video), 'tamper');
  assert.throws(
    () => previewInventory(path, dist),
    /Compiled public\/media bytes differ/,
  );
  cpSync(resolve(path, 'public', video), resolve(dist, video));
  appendFileSync(resolve(path, 'public', video), 'tamper');
  const file = resolve(path, 'src/data/cinematic-assets.json');
  const m = JSON.parse(readFileSync(file));
  m.videos.mobile.sha256 = hash(readFileSync(resolve(path, 'public', video)));
  writeFileSync(file, JSON.stringify(m));
  assert.throws(() => previewInventory(path, dist), /original|supplied/i);
});

test('noindex, robots, purchasing and destination violations are refused', (t) => {
  const path = fixture(t),
    dist = resolve(path, 'dist'),
    page = resolve(dist, 'en/index.html');
  const original = readFileSync(page, 'utf8');
  writeFileSync(page, original.replace('noindex, nofollow', 'index, follow'));
  assert.throws(() => previewInventory(path, dist), /noindex/);
  writeFileSync(
    page,
    original.replace(
      '</body>',
      '<a href="https://www.mariyasnaturals.com/buy">Buy</a></body>',
    ),
  );
  assert.throws(() => previewInventory(path, dist), /purchasing/);
  writeFileSync(page, original);
  writeFileSync(resolve(dist, 'robots.txt'), 'User-agent: *\nAllow: /\n');
  assert.throws(() => previewInventory(path, dist), /robots/);
  assert.throws(() => assertPreviewCommerce({ enabled: true }, {}), /disabled/);
  assert.throws(
    () =>
      assertPreviewCommerce(
        { enabled: false },
        { product: { url: 'https://example.com' } },
      ),
    /empty/,
  );
});

test('symlinks, unsafe paths, unexpected files and changed archive inputs are refused', (t) => {
  const path = fixture(t),
    dist = resolve(path, 'dist');
  symlinkSync(resolve(path, 'public/favicon.svg'), resolve(dist, 'linked.svg'));
  assert.throws(() => previewInventory(path, dist), /Symlinks/);
  rmSync(resolve(dist, 'linked.svg'));
  writeFileSync(
    resolve(dist, 'credential.pem'),
    'private-looking unexpected file',
  );
  assert.throws(() => previewInventory(path, dist), /Unexpected compiled file/);
  rmSync(resolve(dist, 'credential.pem'));
  const inventory = previewInventory(path, dist);
  appendFileSync(resolve(dist, 'en/index.html'), 'changed after validation');
  assert.throws(
    () =>
      writePreview(
        dist,
        resolve(path, 'changed'),
        { sha: 'a'.repeat(40) },
        inventory,
      ),
    /Output changed during packaging/,
  );
  assert.throws(
    () =>
      writePreview(
        dist,
        resolve(path, 'unsafe'),
        { sha: 'a'.repeat(40) },
        { files: [{ path: '../outside' }] },
      ),
    /Unsafe archive path/,
  );
});

test('preview context rejects dirty, wrong-branch/repository, stale-head and fork builds', (t) => {
  const base = temporary(t),
    repo = resolve(base, 'repo');
  mkdirSync(repo);
  const git = (...args) =>
    execFileSync('git', args, {
      cwd: repo,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  git('init', '-b', 'feature/cinematic-homepage');
  git(
    'remote',
    'add',
    'origin',
    'https://github.com/mariyasnaturals/mariyas-naturals-knowledge.git',
  );
  writeFileSync(resolve(repo, 'file'), 'committed');
  git('add', '.');
  git(
    '-c',
    'user.name=Preview tests',
    '-c',
    'user.email=preview@example.invalid',
    'commit',
    '-m',
    'fixture',
  );
  const sha = git('rev-parse', 'HEAD');
  assert.equal(previewContext(repo, {}).sha, sha);
  appendFileSync(resolve(repo, 'file'), 'dirty');
  assert.throws(() => previewContext(repo, {}), /clean committed/);
  git('restore', 'file');
  git('branch', '-m', 'wrong');
  assert.throws(() => previewContext(repo, {}), /intended feature branch/);
  git('branch', '-m', 'feature/cinematic-homepage');
  git('remote', 'set-url', 'origin', 'https://github.com/other/repository.git');
  assert.throws(() => previewContext(repo, {}), /repository origin/);
  git(
    'remote',
    'set-url',
    'origin',
    'https://github.com/mariyasnaturals/mariyas-naturals-knowledge.git',
  );
  const name = 'mariyasnaturals/mariyas-naturals-knowledge';
  const event = {
    number: 3,
    repository: { full_name: name },
    pull_request: {
      head: {
        sha,
        ref: 'feature/cinematic-homepage',
        repo: { full_name: name },
      },
      base: {
        sha,
        ref: 'feature/authentic-media-typography',
        repo: { full_name: name },
      },
    },
  };
  const eventFile = resolve(base, 'event.json');
  const env = {
    GITHUB_ACTIONS: 'true',
    GITHUB_EVENT_NAME: 'pull_request',
    GITHUB_REPOSITORY: name,
    GITHUB_HEAD_REF: 'feature/cinematic-homepage',
    GITHUB_EVENT_PATH: eventFile,
    GITHUB_RUN_ID: '42',
    GITHUB_RUN_ATTEMPT: '1',
  };
  writeFileSync(eventFile, JSON.stringify(event));
  assert.equal(previewContext(repo, env).pullRequest, 3);
  event.pull_request.head.sha = '0'.repeat(40);
  writeFileSync(eventFile, JSON.stringify(event));
  assert.throws(() => previewContext(repo, env), /exact PR head/);
  event.pull_request.head.sha = sha;
  event.pull_request.head.repo.full_name = 'other/fork';
  writeFileSync(eventFile, JSON.stringify(event));
  assert.throws(() => previewContext(repo, env), /Fork context/);
});

test('the unchanged approved packager still builds a legitimate approved-baseline checkout', (t) => {
  const path = resolve(temporary(t), 'approved');
  execFileSync('git', ['clone', '--shared', '--no-checkout', root, path], {
    stdio: 'pipe',
  });
  execFileSync('git', ['checkout', '--detach', approved], {
    cwd: path,
    stdio: 'pipe',
  });
  symlinkSync(
    resolve(root, 'node_modules'),
    resolve(path, 'node_modules'),
    'dir',
  );
  const env = {
    ...process.env,
    ASTRO_TELEMETRY_DISABLED: '1',
    SITE_URL: origin,
    SITE_ENV: 'development',
    ALLOW_INDEXING: 'false',
    EXPECT_SITE_URL: origin,
    EXPECT_INDEXABLE: 'false',
  };
  execFileSync('npm', ['run', 'build'], { cwd: path, env, stdio: 'pipe' });
  execFileSync(process.execPath, ['scripts/package-staging.mjs'], {
    cwd: path,
    env,
    stdio: 'pipe',
  });
  const m = JSON.parse(
    readFileSync(resolve(path, 'review-artifacts/review-manifest.json')),
  );
  assert.equal(
    m.approvedUiBaseline,
    '71cca8d24e73a7c10fd7c0585e1404a362424bb4',
  );
  assert.equal(m.sourceSha, approved);
  assert.equal(
    hash(readFileSync(resolve(path, 'review-artifacts', m.archive))),
    m.archiveSha256,
  );
});
