import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  outputDir: 'test-results/file',
  testMatch: /file\.spec\.ts$/,
  timeout: 60_000,
  expect: {
    timeout: 8_000,
  },
  reporter: [['list']],
  use: {
    locale: 'en-US',
    colorScheme: 'light',
    acceptDownloads: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'file-chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 1280, height: 900 },
      },
    },
  ],
});
