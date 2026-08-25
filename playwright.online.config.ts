import { defineConfig } from '@playwright/test';

const rawBaseURL = process.env.PLAYWRIGHT_BASE_URL;
if (rawBaseURL === undefined) {
  throw new Error('PLAYWRIGHT_BASE_URL is required for online config');
}
const baseURL = rawBaseURL.endsWith('/') ? rawBaseURL : `${rawBaseURL}/`;

export default defineConfig({
  testDir: './e2e',
  outputDir: 'test-results',
  testMatch: /online\.spec\.ts$/,
  timeout: 60_000,
  expect: {
    timeout: 8_000,
  },
  reporter: [['list']],
  use: {
    baseURL,
    locale: 'en-US',
    colorScheme: 'light',
    acceptDownloads: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'online-chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 1280, height: 900 },
      },
    },
  ],
});
