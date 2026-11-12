// UNAPPROVED preview data only. Never imported by the trusted release tooling.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  readFileSync,
  readdirSync,
  lstatSync,
  mkdirSync,
  writeFileSync,
  existsSync,
} from 'node:fs';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { load } from 'cheerio';
import {
  commerceConfig,
  commerceDestinations,
} from '../src/config/commerce.mjs';
import { assertApprovedMedia } from '../src/config/media-policy.mjs';
import {
  assertCinematicAssets,
  cinematicRecords,
} from '../src/config/cinematic-assets.mjs';

export const WARNING = 'UNAPPROVED — NOT FOR DEPLOYMENT';
const ORIGIN = 'https://www.mariyasnaturals.cloud';
const REPOSITORY = 'mariyasnaturals/mariyas-naturals-knowledge';
const BRANCH = 'feature/cinematic-homepage';
const BASE = 'feature/authentic-media-typography';
const REVIEW_PAIRS = new Map([
  [BRANCH, BASE],
  ['feature/botanical-journey-review', BRANCH],
]);
const sha256 = (data) => createHash('sha256').update(data).digest('hex');
const json = (path) => JSON.parse(readFileSync(path, 'utf8'));
const git = (root, ...args) =>
  execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const validSha = (sha) => /^[a-f0-9]{40}$/.test(sha || '');
// Received-file pins for preview integrity; these do NOT approve a release.
const ORIGINALS = {
  '/cinematic/homepage-desktop.mp4': [
    'b86aa80d1ecc5c1dd262ed56c84e3f2f1f708cc562ada05fe26f328baaae0641',
    1280,
    720,
  ],
  '/cinematic/homepage-mobile.mp4': [
    'faf4c549cedeee848205047ff0062e28b2a7e578a81543b0ff27d1a135589c92',
    720,
    1280,
  ],
  '/cinematic/original-model.jpg': [
    '0bc3eea1d3aa07d313ca852fe79667ba90d616c4e54b7a49b4afc5711d384a46',
    1280,
    720,
  ],
  '/cinematic/original-product.jpg': [
    'be1689ee9c89b3fb4bccd07572f9c4a7c56fc8b3e2f6679bee700083dc579b65',
    1280,
    1108,
  ],
};

export function previewContext(root, env = process.env) {
  const sha = git(root, 'rev-parse', 'HEAD');
  assert.ok(validSha(sha), 'Invalid checkout SHA');
  assert.equal(
    git(root, 'status', '--porcelain', '--untracked-files=all'),
    '',
    'Preview requires a clean committed checkout',
  );
  assert.ok(
    !git(root, 'ls-files', '--stage')
      .split('\n')
      .some((line) => line.startsWith('120000 ')),
    'Source symlinks are forbidden',
  );
  assert.ok(
    !readdirSync(root).some(
      (name) => /^\.env(?:\.|$)/.test(name) && name !== '.env.example',
    ),
    'Local dotenv files are forbidden in reproducible previews',
  );
  assert.ok(
    [
      `https://github.com/${REPOSITORY}.git`,
      `https://github.com/${REPOSITORY}`,
      `git@github.com:${REPOSITORY}.git`,
    ].includes(git(root, 'remote', 'get-url', 'origin')),
    'Unexpected repository origin',
  );
  const context = {
    repository: REPOSITORY,
    branch: BRANCH,
    sha,
    treeSha: git(root, 'rev-parse', 'HEAD^{tree}'),
    event: 'local-review',
  };
  if (env.GITHUB_ACTIONS === 'true') {
    if (env.GITHUB_EVENT_NAME === 'push') {
      const event = json(env.GITHUB_EVENT_PATH);
      assert.equal(env.GITHUB_REPOSITORY, REPOSITORY);
      assert.equal(event.repository.full_name, REPOSITORY);
      assert.equal(event.ref, `refs/heads/${BRANCH}`);
      assert.equal(env.GITHUB_REF, event.ref);
      assert.equal(event.after, sha, 'Push checkout must match its event SHA');
      assert.equal(env.GITHUB_SHA, sha);
      assert.ok(
        /^\d+$/.test(env.GITHUB_RUN_ID || '') &&
          /^\d+$/.test(env.GITHUB_RUN_ATTEMPT || ''),
      );
      return {
        ...context,
        event: 'push',
        runId: env.GITHUB_RUN_ID,
        runAttempt: env.GITHUB_RUN_ATTEMPT,
        workflow: env.GITHUB_WORKFLOW_REF,
      };
    }
    assert.equal(
      env.GITHUB_EVENT_NAME,
      'pull_request',
      'Only PR events may create CI previews',
    );
    assert.equal(
      env.GITHUB_REPOSITORY,
      REPOSITORY,
      'Unexpected workflow repository',
    );
    const event = json(env.GITHUB_EVENT_PATH);
    const pr = event.pull_request;
    assert.equal(event.repository.full_name, REPOSITORY);
    assert.equal(
      pr.head.repo.full_name,
      REPOSITORY,
      'Fork context is not admitted',
    );
    assert.equal(pr.base.repo.full_name, REPOSITORY);
    assert.ok(REVIEW_PAIRS.has(pr.head.ref), 'Unexpected PR review branch');
    assert.equal(env.GITHUB_HEAD_REF, pr.head.ref);
    assert.equal(
      pr.base.ref,
      REVIEW_PAIRS.get(pr.head.ref),
      'Unexpected PR review base',
    );
    assert.equal(
      pr.head.sha,
      sha,
      'Checkout must be the exact PR head, not a merge or stale commit',
    );
    assert.ok(
      validSha(pr.base.sha) &&
        Number.isSafeInteger(event.number) &&
        event.number > 0,
    );
    git(root, 'merge-base', '--is-ancestor', pr.base.sha, sha);
    assert.ok(
      /^\d+$/.test(env.GITHUB_RUN_ID || '') &&
        /^\d+$/.test(env.GITHUB_RUN_ATTEMPT || ''),
    );
    Object.assign(context, {
      event: 'pull_request',
      pullRequest: event.number,
      branch: pr.head.ref,
      baseBranch: pr.base.ref,
      baseSha: pr.base.sha,
      triggerSha: env.GITHUB_SHA,
      runId: env.GITHUB_RUN_ID,
      runAttempt: env.GITHUB_RUN_ATTEMPT,
      workflow: env.GITHUB_WORKFLOW_REF,
    });
  } else {
    assert.equal(
      REVIEW_PAIRS.has(git(root, 'branch', '--show-current')),
      true,
      'Local preview requires the intended feature branch',
    );
    context.branch = git(root, 'branch', '--show-current');
  }
  return context;
}

function tree(directory) {
  assert.ok(
    lstatSync(directory).isDirectory() &&
      !lstatSync(directory).isSymbolicLink(),
    'Expected a regular directory',
  );
  const files = new Map();
  function walk(folder) {
    for (const name of readdirSync(folder).sort()) {
      assert.ok(
        /^[A-Za-z0-9_][A-Za-z0-9_.-]*$/.test(name),
        `Unsafe preview path: ${name}`,
      );
      const path = resolve(folder, name),
        info = lstatSync(path);
      assert.ok(
        !info.isSymbolicLink(),
        'Symlinks are forbidden in preview inputs/output',
      );
      if (info.isDirectory()) walk(path);
      else {
        assert.ok(info.isFile(), 'Special files are forbidden');
        files.set(relative(directory, path), readFileSync(path));
      }
    }
  }
  walk(directory);
  assert.ok(
    files.size < 5000 &&
      [...files.values()].reduce((n, b) => n + b.length, 0) < 128 * 1024 * 1024,
    'Preview size limit exceeded',
  );
  return files;
}

function approvedPublic(root) {
  const cinematic = json(resolve(root, 'src/data/cinematic-assets.json'));
  assertCinematicAssets(cinematic);
  const records = cinematicRecords(cinematic);
  const originals = [
    ...Object.values(cinematic.videos),
    ...Object.values(cinematic.references),
  ];
  for (const [src, [hash, width, height]] of Object.entries(ORIGINALS)) {
    const asset = originals.find((record) => record.src === src);
    assert.ok(
      asset?.status === 'ready' && asset.source === 'owner-original',
      'Original media must be ready',
    );
    assert.deepEqual(
      [asset.sha256, asset.width, asset.height],
      [hash, width, height],
      'Received original media pins changed',
    );
  }
  const expected = new Map(
    records
      .filter((a) => a.status === 'ready')
      .map((a) => [a.src.slice(1), a.sha256]),
  );
  for (const name of ['media-manifest', 'brand-media']) {
    const manifest = json(resolve(root, `src/data/${name}.json`));
    assertApprovedMedia(manifest);
    for (const asset of manifest.media.flatMap((m) => m.derivatives))
      expected.set(asset.localAssetPath.slice(1), asset.sha256);
  }
  const files = tree(resolve(root, 'public'));
  for (const [path, data] of files) {
    if (expected.has(path))
      assert.equal(
        sha256(data),
        expected.get(path),
        `Media hash mismatch: ${path}`,
      );
    else
      assert.ok(
        path === 'favicon.svg' ||
          /^fonts\/[a-z0-9-]+\.woff2$/.test(path) ||
          /^fonts\/licenses\/[a-z0-9-]+\.txt$/.test(path),
        `Unexpected public file: ${path}`,
      );
  }
  for (const path of expected.keys())
    assert.ok(files.has(path), `Missing recorded media: ${path}`);
  return {
    files,
    originalMedia: originals.map(
      ({
        src,
        sha256,
        width,
        height,
        bytes,
        source,
        originalFilename,
        contentOrigin,
        identityAccuracy,
      }) => ({
        src,
        sha256,
        width,
        height,
        bytes,
        source,
        originalFilename,
        contentOrigin,
        identityAccuracy,
      }),
    ),
  };
}

export function assertPreviewCommerce(config, destinations) {
  assert.equal(config.enabled, false, 'Purchasing must be disabled');
  assert.equal(
    Object.keys(destinations).length,
    0,
    'Commerce destinations must be empty',
  );
}

export function previewInventory(
  root,
  directory,
  config = commerceConfig,
  destinations = commerceDestinations,
) {
  assertPreviewCommerce(config, destinations);
  const publicAssets = approvedPublic(root),
    files = tree(directory);
  for (const [path, data] of publicAssets.files)
    assert.ok(
      files.has(path) && files.get(path).equals(data),
      `Compiled public/media bytes differ: ${path}`,
    );
  for (const [path, data] of files) {
    assert.ok(
      publicAssets.files.has(path) ||
        /^(?:index\.html|robots\.txt|sitemap-(?:index|0)\.xml)$/.test(path) ||
        /^(?:en|ml|hi|ta)\/(?:[a-z0-9-]+\/)*index\.html$/.test(path) ||
        /^_astro\/[A-Za-z0-9_.-]+\.(?:css|js)$/.test(path),
      `Unexpected compiled file: ${path}`,
    );
    if (path.endsWith('.html')) {
      const $ = load(data.toString('utf8'));
      assert.equal(
        $('meta[name=robots]').attr('content'),
        'noindex, nofollow',
        'Preview must be noindex/nofollow',
      );
      assert.equal(
        $('link[rel=canonical]').attr('href'),
        ORIGIN + '/' + path.replace(/index\.html$/, ''),
        'Wrong staging canonical',
      );
      assert.equal(
        $('a[href*="mariyasnaturals.com"]').length,
        0,
        'Rendered purchasing destinations are forbidden',
      );
    }
  }
  assert.equal(
    files.get('robots.txt')?.toString(),
    'User-agent: *\nDisallow: /\n',
    'Staging robots policy is required',
  );
  for (const path of [
    'index.html',
    'en/index.html',
    'ml/index.html',
    'hi/index.html',
    'ta/index.html',
    'sitemap-index.xml',
    'sitemap-0.xml',
  ])
    assert.ok(files.has(path), `Missing static output: ${path}`);
  assert.ok(
    [...files.keys()].some((path) => /^_astro\/.*\.js$/.test(path)),
    'Missing Astro runtime',
  );
  return {
    files: [...files]
      .map(([path, data]) => ({
        path,
        bytes: data.length,
        sha256: sha256(data),
      }))
      .sort((a, b) => a.path.localeCompare(b.path)),
    originalMedia: publicAssets.originalMedia,
  };
}

export function writePreview(
  directory,
  output,
  source,
  inventory,
  reviewKind = 'cinematic',
) {
  assert.ok(
    ['cinematic', 'botanical'].includes(reviewKind),
    'Unknown review artifact type',
  );
  assert.ok(validSha(source.sha), 'Invalid preview source SHA');
  assert.equal(
    new Set(inventory.files.map((f) => f.path)).size,
    inventory.files.length,
    'Duplicate preview paths',
  );
  for (const file of inventory.files)
    assert.ok(
      file.path
        .split('/')
        .every((part) => /^[A-Za-z0-9_][A-Za-z0-9_.-]*$/.test(part)),
      'Unsafe archive path',
    );
  const archive = `UNAPPROVED-${reviewKind}-pr-preview-${source.sha}.zip`;
  mkdirSync(output); // Refuse an existing output directory, including symlinks/stale bundles.
  const notice = `${WARNING}\n\nLocal review only. Serve UNAPPROVED-PREVIEW/site/ on loopback.\nNot a release candidate, owner approval, signed manifest or deployment package.\nNever upload to a VPS or rename this bundle into release tooling.\n`;
  const result = JSON.parse(
    execFileSync(
      'python3',
      [
        '-c',
        `
import hashlib,json,pathlib,stat,sys,zipfile
request=json.load(sys.stdin); root=pathlib.Path(sys.argv[1]); archive=pathlib.Path(sys.argv[2]); prefix='UNAPPROVED-PREVIEW/'
expected={prefix+'README-NOT-FOR-DEPLOYMENT.txt':request['notice'].encode()}
for record in request['files']:
    p=root/record['path']
    assert all(not x.is_symlink() for x in [p,*p.parents])
    data=p.read_bytes()
    assert len(data)==record['bytes'] and hashlib.sha256(data).hexdigest()==record['sha256'], 'Output changed during packaging'
    expected[prefix+'site/'+record['path']]=data
with zipfile.ZipFile(archive,'x',zipfile.ZIP_DEFLATED) as z:
    for name,data in expected.items():
        entry=zipfile.ZipInfo(name); entry.external_attr=(stat.S_IFREG|0o644)<<16; entry.compress_type=zipfile.ZIP_DEFLATED
        z.writestr(entry,data)
assert archive.stat().st_size < 64*1024*1024
with zipfile.ZipFile(archive) as z:
    assert len(z.infolist())==len(expected) and set(z.namelist())==set(expected) and z.testzip() is None
    for name,data in expected.items():
        assert z.read(name)==data, 'Archive round-trip verification failed'
print(json.dumps({'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'bytes':archive.stat().st_size}))
`,
        directory,
        resolve(output, archive),
      ],
      {
        input: JSON.stringify({ files: inventory.files, notice }),
        encoding: 'utf8',
        stdio: 'pipe',
      },
    ),
  );
  assert.equal(sha256(readFileSync(resolve(output, archive))), result.sha256);
  const manifest = {
    schema: 'mariyas-unapproved-pr-preview/v1',
    artifactKind: 'unapproved-pr-preview',
    approvalStatus: 'UNAPPROVED',
    deploymentAllowed: false,
    warning: WARNING,
    source,
    build: {
      createdAt: new Date().toISOString(),
      node: process.version,
      stagingOrigin: ORIGIN,
      robots: 'noindex, nofollow',
      purchasingEnabled: false,
      commerceDestinations: {},
      packagerSha256: sha256(readFileSync(fileURLToPath(import.meta.url))),
      validation: [
        'fresh-astro-build',
        'static',
        'media-policy',
        'original-media-pins',
        'archive-round-trip',
      ],
    },
    archive: {
      name: archive,
      ...result,
      sitePrefix: 'UNAPPROVED-PREVIEW/site/',
    },
    files: inventory.files,
    originalMedia: inventory.originalMedia,
  };
  writeFileSync(
    resolve(output, 'preview-manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n',
    { flag: 'wx' },
  );
  writeFileSync(
    resolve(output, archive + '.sha256'),
    `${result.sha256}  ${archive}\n`,
    { flag: 'wx' },
  );
  writeFileSync(resolve(output, 'README-UNAPPROVED.md'), notice, {
    flag: 'wx',
  });
  return manifest;
}

export function packagePreview(root) {
  const context = previewContext(root);
  assertPreviewCommerce(commerceConfig, commerceDestinations);
  approvedPublic(root);
  const dist = resolve(root, 'dist');
  if (existsSync(dist)) tree(dist); // Refuse linked/special paths before Astro cleans output.
  const env = {
    ...process.env,
    ASTRO_TELEMETRY_DISABLED: '1',
    SITE_URL: ORIGIN,
    SITE_ENV: 'development',
    ALLOW_INDEXING: 'false',
    EXPECT_SITE_URL: ORIGIN,
    EXPECT_INDEXABLE: 'false',
  };
  const run = (command, args) =>
    execFileSync(command, args, { cwd: root, env, stdio: 'inherit' });
  run('npm', ['run', 'build']); // A fresh build ties the archive to this clean checkout.
  const inventory = previewInventory(root, dist);
  run(process.execPath, ['scripts/validate-static.mjs']);
  run(process.execPath, ['scripts/validate-media-policy.mjs']);
  assert.deepEqual(
    previewContext(root),
    context,
    'Source/context changed during build',
  );
  const manifest = writePreview(
    dist,
    resolve(root, 'pr-preview-artifacts'),
    context,
    inventory,
  );
  console.log(
    `${WARNING}\nSource: ${context.sha}\nArchive: ${manifest.archive.name}\nSHA-256: ${manifest.archive.sha256}`,
  );
  return manifest;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  packagePreview(resolve(import.meta.dirname, '..'));
