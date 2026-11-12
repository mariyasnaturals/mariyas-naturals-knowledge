import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/botanical-browser',
  outputDir: 'botanical-review-results/playwright',
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4322',
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
      args: ['--no-sandbox'],
    },
  },
  webServer: {
    command: 'npm run preview:botanical-review',
    port: 4322,
    reuseExistingServer: process.env.BOTANICAL_REUSE_SERVER === 'true',
  },
});
