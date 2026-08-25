import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const PREVIEW_URL = process.env.FACET_PREVIEW_URL ?? 'http://127.0.0.1:4173';
const OUTPUT_DIRECTORY = fileURLToPath(new URL('../docs/assets/', import.meta.url));
const LOCALE_KEY = 'facet:v1:locale';
const PROGRESS_KEY = 'facet:v1:progress';
const ANSWER_SEQUENCE = [3, 4, 2, 5, 1];
const VIEWPORT = { width: 1280, height: 900 };
const README_PREVIEW = { x: 0, y: 0, width: 1280, height: 760 };

async function waitForQuestion(page, position) {
  const number = `${String(position).padStart(2, '0')} / 32`;
  await page.locator('[data-screen="quiz"] .question-number').filter({ hasText: number }).waitFor();
}

async function completeQuiz(page, locale) {
  await page.goto(PREVIEW_URL, { waitUntil: 'networkidle' });
  await page.evaluate(({ key, selectedLocale }) => {
    window.localStorage.clear();
    window.localStorage.setItem(key, selectedLocale);
  }, { key: LOCALE_KEY, selectedLocale: locale });
  await page.reload({ waitUntil: 'networkidle' });

  await page.locator('[data-screen="landing"]').waitFor();
  await page.locator('[data-action="start"]').click();
  await page.locator('[data-screen="intro"]').waitFor();
  await page.locator('[data-action="begin-quiz"]').click();
  const questionOrder = await page.evaluate((key) => {
    const rawProgress = window.localStorage.getItem(key);
    if (rawProgress === null) {
      throw new Error('FACET did not persist the preview question order');
    }
    const parsedProgress = JSON.parse(rawProgress);
    if (
      !Array.isArray(parsedProgress.order) ||
      parsedProgress.order.length !== 32 ||
      !parsedProgress.order.every((id) => Number.isInteger(id) && id >= 1 && id <= 32) ||
      new Set(parsedProgress.order).size !== 32
    ) {
      throw new Error('FACET persisted an invalid preview question order');
    }
    return parsedProgress.order;
  }, PROGRESS_KEY);

  for (let position = 1; position <= 32; position += 1) {
    await waitForQuestion(page, position);
    const questionId = questionOrder[position - 1];
    const answer = ANSWER_SEQUENCE[(questionId - 1) % ANSWER_SEQUENCE.length];
    await page.keyboard.press(String(answer));
    await page.locator(`#answer-${answer}:checked`).waitFor();
    await page.keyboard.press('Enter');

    if (position === 24) {
      await page.locator('[data-screen="quiz"][data-chapter="weather"]').waitFor();
      await page.keyboard.press('Enter');
    }
  }

  await page.locator('[data-screen="result"]').waitFor();
  await page.evaluate(() => window.scrollTo(0, 0));
}

async function capturePreview(browser, locale, filename) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    locale: locale === 'zh-CN' ? 'zh-CN' : 'en-US',
    colorScheme: 'light',
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();

  try {
    await completeQuiz(page, locale);
    await page.screenshot({
      path: fileURLToPath(new URL(filename, new URL('../docs/assets/', import.meta.url))),
      animations: 'disabled',
      clip: README_PREVIEW,
    });
  } finally {
    await context.close();
  }
}

await mkdir(OUTPUT_DIRECTORY, { recursive: true });
const browser = await chromium.launch();

try {
  await capturePreview(browser, 'zh-CN', 'preview-zh.png');
  await capturePreview(browser, 'en', 'preview-en.png');
} finally {
  await browser.close();
}
