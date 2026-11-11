// Build-job only: no signing credentials; use the exact already-tested dist bytes.
import { previewContext, previewInventory } from './package-pr-preview.mjs';
import { execFileSync } from 'node:child_process';
const root = process.cwd();
const context = previewContext(root);
if (context.event !== 'push')
  throw new Error('CI staging artifacts require a verified push context');
previewInventory(root, root + '/dist');
execFileSync(
  'python3',
  ['ops/ci_staging/cli.py', 'package', '--output', 'ci-staging-unsigned'],
  { stdio: 'inherit' },
);
