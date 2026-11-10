// Packages only validated static output; never connects to a hosting server.
import { execFileSync } from 'node:child_process';
import {
  readFileSync,
  readdirSync,
  lstatSync,
  mkdirSync,
  writeFileSync,
  copyFileSync,
} from 'node:fs';
import { resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { load } from 'cheerio';
import {
  commerceConfig,
  commerceDestinations,
} from '../src/config/commerce.mjs';
const baseline = '71cca8d24e73a7c10fd7c0585e1404a362424bb4';
const origin = 'https://www.mariyasnaturals.cloud';
const root = resolve(import.meta.dirname, '..');
const git = (...args) =>
  execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const sourceSha = git('rev-parse', 'HEAD');
if (git('ls-files', '--others', '--exclude-standard', '--', 'src', 'public'))
  throw new Error('Untracked website files must be reviewed before packaging');
// Guard the approved implementation, including uncommitted UI/media changes.
if (
  git(
    'diff',
    baseline,
    '--',
    'src',
    'public',
    'astro.config.mjs',
    'package-lock.json',
  )
)
  throw new Error('Approved website differs from the review baseline');
if (commerceConfig.enabled || Object.keys(commerceDestinations).length)
  throw new Error('Commerce must remain disabled and unmapped');
execFileSync(process.execPath, ['scripts/validate-static.mjs'], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, EXPECT_SITE_URL: origin, EXPECT_INDEXABLE: 'false' },
});
execFileSync(process.execPath, ['scripts/validate-media-policy.mjs'], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, EXPECT_SITE_URL: origin },
});
const dist = resolve(root, 'dist');
const files = [];
function walk(directory) {
  for (const entry of readdirSync(directory)) {
    const path = resolve(directory, entry);
    const info = lstatSync(path);
    if (info.isSymbolicLink())
      throw new Error('Symlinks are not permitted in review output');
    if (info.isDirectory()) walk(path);
    else {
      const name = relative(dist, path);
      if (
        name.split('/').some((part) => part.startsWith('.')) ||
        /(?:^|\/)(?:node_modules|\.git)(?:\/|$)/.test(name)
      )
        throw new Error(`Unexpected output: ${name}`);
      const bytes = readFileSync(path);
      if (name.endsWith('.html')) {
        const $ = load(bytes.toString());
        if ($('meta[name=robots]').attr('content') !== 'noindex, nofollow')
          throw new Error('Unsafe indexing state');
        if (new URL($('link[rel=canonical]').attr('href')).origin !== origin)
          throw new Error('Wrong canonical origin');
      }
      files.push({
        path: name,
        bytes: info.size,
        sha256: createHash('sha256').update(bytes).digest('hex'),
      });
    }
  }
}
walk(dist);
files.sort((a, b) => a.path.localeCompare(b.path));
const output = resolve(root, 'review-artifacts');
mkdirSync(output, { recursive: true });
const archiveName = `mariyas-cloud-review-${sourceSha.slice(0, 12)}.zip`;
const archive = resolve(output, archiveName);
// Write a fresh ZIP with dist CONTENTS at its root, never an extra dist/ directory.
execFileSync('python3', [
  '-c',
  'import pathlib,sys,zipfile; root=pathlib.Path(sys.argv[1]); z=zipfile.ZipFile(sys.argv[2],"w",zipfile.ZIP_DEFLATED); [z.write(p,p.relative_to(root)) for p in sorted(root.rglob("*")) if p.is_file()]; z.close()',
  dist,
  archive,
]);
const checksum = createHash('sha256')
  .update(readFileSync(archive))
  .digest('hex');
writeFileSync(
  resolve(output, archiveName + '.sha256'),
  `${checksum}  ${archiveName}\n`,
);
writeFileSync(
  resolve(output, 'review-manifest.json'),
  JSON.stringify(
    {
      sourceSha,
      approvedUiBaseline: baseline,
      origin,
      environment: 'development',
      robots: 'noindex, nofollow',
      purchasingEnabled: false,
      archive: archiveName,
      archiveSha256: checksum,
      files,
    },
    null,
    2,
  ) + '\n',
);
copyFileSync(
  resolve(root, 'docs/staging-review.md'),
  resolve(output, 'READ-ME-FIRST.md'),
);
console.log(
  `Review bundle: ${archive}\nSHA-256: ${checksum}\nFiles: ${files.length}`,
);
