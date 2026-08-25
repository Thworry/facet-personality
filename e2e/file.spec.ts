import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { expect, test } from '@playwright/test';
import { CATALOGS } from '../src/i18n/catalog';

const DIST_PATH = fileURLToPath(new URL('../dist/index.html', import.meta.url));
const DIST_URL = pathToFileURL(DIST_PATH).href;
const LOCALE_KEY = 'facet:v1:locale';

test('self-contained bilingual journey works directly from file://', async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];
  const nonFileRequests: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });
  page.on('requestfailed', (request) => {
    failedRequests.push(request.url());
  });
  page.on('request', (request) => {
    if (new URL(request.url()).protocol !== 'file:') {
      nonFileRequests.push(request.url());
    }
  });

  await page.addInitScript(({ key, locale }) => {
    if (window.localStorage.getItem(key) === null) {
      window.localStorage.setItem(key, locale);
    }
  }, { key: LOCALE_KEY, locale: 'zh-CN' });
  await page.goto(DIST_URL);

  await expect(page.locator('[data-screen="landing"]')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page).toHaveTitle(CATALOGS['zh-CN'].meta.title);

  await page.locator('[data-action="set-locale"][data-locale="en"]').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page).toHaveTitle(CATALOGS.en.meta.title);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  await page.locator('[data-action="start"]').click();
  await expect(page.locator('[data-screen="intro"]')).toBeVisible();
  await page.getByRole('button', { name: CATALOGS.en.intro.begin }).click();
  await expect(page.locator('[data-screen="quiz"]')).toBeVisible();
  await expect(page.locator('.question-number')).toHaveText('01 / 32');
  await page.keyboard.press('3');
  await expect(page.locator('#answer-3')).toBeChecked();

  const markupAudit = await page.evaluate(() => {
    const externalAttributes = Array.from(document.querySelectorAll<HTMLElement>('[src], [href]'))
      .flatMap((element) => ['src', 'href'].map((attribute) => ({
        element: element.tagName.toLowerCase(),
        attribute,
        value: element.getAttribute(attribute),
      })))
      .filter(({ value }) => value !== null && value !== '' && !value.startsWith('#'));
    const cssText = Array.from(document.querySelectorAll('style'))
      .map((style) => style.textContent ?? '')
      .join('\n');

    return {
      externalAttributes,
      hasCssImport: /@import/i.test(cssText),
      hasCssUrl: /url\s*\(/i.test(cssText),
      inlineScripts: Array.from(document.scripts).every((script) => script.src === ''),
      inlineStyles: document.querySelectorAll('link[rel="stylesheet"]').length === 0,
    };
  });

  const builtHtml = await readFile(DIST_PATH, 'utf8');
  expect(markupAudit).toEqual({
    externalAttributes: [],
    hasCssImport: false,
    hasCssUrl: false,
    inlineScripts: true,
    inlineStyles: true,
  });
  expect(builtHtml).not.toMatch(/<script[^>]+src=/i);
  expect(builtHtml).not.toMatch(/<link[^>]+href=/i);
  expect(builtHtml).not.toMatch(/https?:\/\//i);
  expect(consoleErrors).toHaveLength(0);
  expect(pageErrors).toHaveLength(0);
  expect(failedRequests).toHaveLength(0);
  expect(nonFileRequests).toHaveLength(0);
});
