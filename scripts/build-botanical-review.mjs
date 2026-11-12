import { execFileSync } from 'node:child_process';
import { cpSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { verifyBotanicalAssets } from './verify-botanical-assets.mjs';
if (process.env.SITE_ENV === 'production')
  throw new Error('Botanical review cannot build for production');
await verifyBotanicalAssets();
execFileSync(
  'npm',
  ['run', 'build', '--', '--outDir', 'botanical-review-site'],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      ASTRO_TELEMETRY_DISABLED: '1',
      BOTANICAL_JOURNEY_REVIEW: 'true',
      SITE_ENV: 'development',
      SITE_URL: 'https://www.mariyasnaturals.cloud',
      ALLOW_INDEXING: 'false',
    },
  },
);
cpSync('review/botanical/assets', 'botanical-review-site/_botanical-assets', {
  recursive: true,
});
writeFileSync(
  'botanical-review-site/UNAPPROVED-BOTANICAL-REVIEW.txt',
  'UNAPPROVED REVIEW — NOT FOR DEPLOYMENT\nNew generated media are not part of the installed release policy.\n',
);
execFileSync(process.execPath, ['scripts/validate-botanical-review.mjs'], {
  stdio: 'inherit',
});
console.log(
  `Review built at ${resolve('botanical-review-site')}. No release, signing or deployment performed.`,
);
