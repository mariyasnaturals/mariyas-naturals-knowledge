import { defineConfig } from '@playwright/test';
// The reviewed journey now ships in the normal static build, so these tests run
// against the same built output as every other browser regression.
export default defineConfig({
  testDir: './tests/botanical-browser',
  outputDir: 'botanical-review-results/playwright',
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4321',
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
      args: ['--no-sandbox'],
    },
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --ignore-lock',
    port: 4321,
    reuseExistingServer: false,
  },
});
