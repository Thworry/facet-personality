import { expect, test } from '@playwright/test';
import { CATALOGS } from '../src/i18n/catalog';

const DEMO_PATH = '/facet-personality/';
const ALLOWED_ORIGIN = 'https://thworry.github.io';

test('@online smoke: bilingual journey on Pages', async ({ page }) => {
  const errors: string[] = [];
  const pageErrors: string[] = [];
  const requestFailures: string[] = [];
  const foreignRequests: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });
  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });
  page.on('requestfailed', (request) => {
    requestFailures.push(request.url());
  });
  page.on('request', (request) => {
    const url = request.url();
    const requestUrl = new URL(url);
    if (
      (requestUrl.protocol === 'https:' || requestUrl.protocol === 'http:') &&
      requestUrl.origin !== ALLOWED_ORIGIN
    ) {
      foreignRequests.push(url);
    }
  });

  await page.goto('./');
  await expect(page).toHaveURL(new RegExp(DEMO_PATH));

  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.locator('[data-action="set-locale"][data-locale="zh-CN"]').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await page.locator('[data-action="set-locale"][data-locale="en"]').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  await page.locator('[data-action="start"]').click();
  await expect(page.locator('[data-screen="intro"]')).toBeVisible();
  await page.getByRole('button', { name: CATALOGS.en.intro.begin }).click();

  await expect(page.locator('[data-screen="quiz"]')).toBeVisible();
  const firstChoice = page.locator('input#answer-3');
  await firstChoice.check();
  await page.keyboard.press('Enter');

  await expect(page.locator('[data-screen="quiz"] .question-number')).toContainText('02 / 32');
  const finalUrl = new URL(page.url());
  expect(finalUrl.origin).toBe(ALLOWED_ORIGIN);
  expect(finalUrl.pathname).toBe(DEMO_PATH);

  expect(errors).toHaveLength(0);
  expect(pageErrors).toHaveLength(0);
  expect(requestFailures).toHaveLength(0);
  expect(foreignRequests).toHaveLength(0);
});
