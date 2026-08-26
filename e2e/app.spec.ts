import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { CATALOGS } from '../src/i18n/catalog';
import type { FacetResult } from '../src/types';

type JourneyLocale = keyof typeof CATALOGS;

const PROGRESS_KEY = 'facet:v1:progress';
const LEGACY_HISTORY_KEY = 'facet:v1:history';
const HISTORY_KEY = 'facet:v2:history';
const LOCALE_KEY = 'facet:v1:locale';
const TOTAL_QUESTIONS = 32;
type ArchetypeCopyRecord = { readonly name: string; readonly hook: string };
type ProgressSnapshot = {
  route: 'landing' | 'quiz' | 'result' | 'atlas' | 'history';
  index?: number;
  answers?: Record<string, number>;
};

const JOURNEY: Record<JourneyLocale, { title: string }> = {
  'zh-CN': {
    title: 'FACET｜人格切面',
  },
  en: {
    title: 'FACET | Personality Facets',
  },
};

function copy(locale: JourneyLocale) {
  return CATALOGS[locale];
}

function getArchetypeName(locale: JourneyLocale, archetypeCode: string): string {
  return (copy(locale).archetypes as Record<string, ArchetypeCopyRecord>)[archetypeCode].name;
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(hasOverflow).toBe(false);
}

async function setLocale(page: Page, locale: JourneyLocale): Promise<void> {
  const currentLocale = await page.locator('html').getAttribute('lang');
  if (currentLocale === locale) {
    return;
  }
  await page.locator(`[data-action="set-locale"][data-locale="${locale}"]`).click();
  await expect(page.locator('html')).toHaveAttribute('lang', locale);
}

async function beginQuiz(page: Page, locale: JourneyLocale): Promise<void> {
  await page.goto('/');
  await expect(page.locator('[data-screen="landing"]')).toBeVisible();
  await setLocale(page, locale);
  await expect(page).toHaveTitle(JOURNEY[locale].title);
  await expect(page.locator('h1')).toContainText(copy(locale).landing.titleLines[0]);
  await page.locator('[data-action="start"]').click();
  await expect(page.locator('[data-screen="intro"]')).toBeVisible();
  await page.getByRole('button', { name: copy(locale).intro.begin }).click();
  await expect(page.locator('[data-screen="quiz"]')).toBeVisible();
  await expectQuestion(page, locale, 1);
}

async function expectQuestion(page: Page, locale: JourneyLocale, position: number): Promise<void> {
  await expect(page.locator('.progress-copy')).toHaveText(
    copy(locale).quiz.progressTemplate.replace('{current}', String(position)).replace('{total}', String(TOTAL_QUESTIONS)),
  );
  await expect(page.locator('.question-number')).toHaveText(`${String(position).padStart(2, '0')} / 32`);
}

async function readProgress(page: Page, key: string): Promise<ProgressSnapshot | null> {
  const raw = await page.evaluate((storageKey) => window.localStorage.getItem(storageKey), key);
  return raw === null ? null : JSON.parse(raw);
}

async function answerOne(page: Page, locale: JourneyLocale, position: number, value: number): Promise<void> {
  const isQuiz = await page.locator('[data-screen="quiz"]').isVisible();
  if (isQuiz) {
    await expectQuestion(page, locale, position);
  }
  await page.keyboard.press(String(value));
  await expect(page.locator(`#answer-${value}`)).toBeChecked();
  await page.keyboard.press('Enter');

  if (position === TOTAL_QUESTIONS) {
    await expect(page.locator('[data-screen="result"]')).toBeVisible();
    return;
  }
  if (position === 24) {
    await expect(page.locator('[data-screen="quiz"][data-chapter="weather"]')).toBeVisible();
    return;
  }
  await expect(page.locator('[data-screen="quiz"]')).toBeVisible();
  await expectQuestion(page, locale, position + 1);
}

async function answerPrefix(page: Page, locale: JourneyLocale, count: number, valueOffset = 0): Promise<void> {
  for (let index = 1; index <= count; index += 1) {
    const value = ((index + valueOffset) % 5) + 1;
    await answerOne(page, locale, index, value);
  }
}

async function completeQuiz(page: Page, locale: JourneyLocale): Promise<void> {
  await beginQuiz(page, locale);
  for (let position = 1; position <= 24; position += 1) {
    await answerOne(page, locale, position, ((position + 1) % 5) + 1);
  }
  await expect(page.locator('[data-screen="quiz"][data-chapter="weather"]')).toBeVisible();
  await page.keyboard.press('Enter');
  for (let position = 25; position <= TOTAL_QUESTIONS; position += 1) {
    await answerOne(page, locale, position, ((position + 1) % 5) + 1);
  }
}

async function latestHistory(page: Page): Promise<FacetResult | null> {
  const raw = await page.evaluate((key) => window.localStorage.getItem(key), HISTORY_KEY);
  const parsed = (raw === null ? { version: 2, results: [] } : JSON.parse(raw)) as {
    version: number;
    results: FacetResult[];
  };
  return parsed.results[0] ?? null;
}

async function expectUnreadableWarningHidden(page: Page, locale: JourneyLocale): Promise<void> {
  await expect(page.getByText(copy(locale).feedback.unreadableProgress, { exact: false })).not.toBeVisible();
}

async function expectUnreadableWarningVisible(page: Page, locale: JourneyLocale): Promise<void> {
  await expect(page.getByText(copy(locale).feedback.unreadableProgress)).toBeVisible();
}

async function verifyPng(page: Page): Promise<void> {
  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-action="share"]').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^FACET-[A-Z]+\.png$/);
  const path = await download.path();
  expect(path).not.toBeNull();
  const bytes = await readFile(path!);
  expect(Array.from(bytes.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(bytes.byteLength).toBeGreaterThan(10_000);
}

test.describe('Task 7 bilingual journeys', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    if (testInfo.project.name === 'reduced-motion') {
      await page.emulateMedia({ reducedMotion: 'reduce' });
    }
  });

  for (const locale of ['zh-CN', 'en'] as const) {
    test(`completes full flow in ${locale}`, async ({ page }) => {
      await completeQuiz(page, locale);
      await expect(page.locator('[data-screen="result"]')).toBeVisible();
      await expect(page.locator('.result-disclaimer')).toContainText(copy(locale).result.disclaimerTitle);
      await expect(page.locator('meter')).toHaveCount(8);
      await expectNoHorizontalOverflow(page);

      await page.locator('[data-action="show-atlas"]').click();
      await expect(page.locator('[data-screen="atlas"]')).toBeVisible();
      await expect(page.locator('[data-archetype]')).toHaveCount(12);
      await expectNoHorizontalOverflow(page);
      await page.locator('.screen[data-screen="atlas"] .button.button--secondary[data-action="back"]').click();

      await verifyPng(page);
      await expect(page.locator('[data-share-status]')).toContainText(copy(locale).feedback.shareSuccess);

      await page.locator('[data-action="show-history"]').click();
      await expect(page.locator('[data-screen="history"]')).toBeVisible();
      await expect(page.locator('[data-screen="history"] h1')).toContainText(copy(locale).history.title);
      await expect(page.locator('.history-list > li')).toHaveCount(1);
      await expect(page.locator('[data-history-status]')).toBeEmpty();
    });
  }

  test('retains order and answers when switching at question 6', async ({ page }) => {
    await beginQuiz(page, 'zh-CN');
    await answerPrefix(page, 'zh-CN', 5, 0);

    const beforeProgress = await readProgress(page, PROGRESS_KEY);
    expect(beforeProgress).not.toBeNull();

    expect(beforeProgress).toMatchObject({ route: 'quiz', index: 5 });
    const expectedAnswers = beforeProgress!.answers;
    expect(Object.keys(expectedAnswers ?? {})).toHaveLength(5);

    await setLocale(page, 'en');
    await expect(page.locator('[data-screen="quiz"]')).toBeVisible();
    await expectQuestion(page, 'en', 6);

    const afterProgress = await readProgress(page, PROGRESS_KEY);
    expect(afterProgress).toEqual(beforeProgress);

    await page.keyboard.press('ArrowLeft');
    await expectQuestion(page, 'en', 5);
    await expect(page.locator('.answer-option input:checked')).toHaveValue('1');
    await page.keyboard.press('Enter');
    await expectQuestion(page, 'en', 6);
  });

  test('retains result payload while flipping locale', async ({ page }) => {
    await completeQuiz(page, 'en');
    const resultEn = await latestHistory(page);
    expect(resultEn).not.toBeNull();
    const primaryCode = resultEn.primary.code as string;
    const primaryCodeNameZh = getArchetypeName('zh-CN', primaryCode);
    const primaryCodeNameEn = getArchetypeName('en', primaryCode);
    await expect(page.locator('[data-screen="result"]')).toContainText(primaryCodeNameEn);

    await setLocale(page, 'zh-CN');
    await expect(page.locator('[data-screen="result"]')).toContainText(primaryCodeNameZh);
    const resultZh = await latestHistory(page);
    expect(resultZh).toEqual(resultEn);
    await expect(page.locator('[data-screen="result"]')).toContainText(resultEn.primary.code);
  });

  test('switches locale in atlas without changing data shape', async ({ page }) => {
    await completeQuiz(page, 'zh-CN');
    await page.locator('[data-action="show-atlas"]').click();
    await expect(page.locator('[data-screen="atlas"]')).toBeVisible();

    const sampleCode = Object.keys(copy('zh-CN').archetypes)[0];
    await expect(page.locator('[data-screen="atlas"]')).toContainText(getArchetypeName('zh-CN', sampleCode));
    await setLocale(page, 'en');
    await expect(page.locator('[data-screen="atlas"]')).toContainText(getArchetypeName('en', sampleCode));

    const progressBefore = await page.evaluate((key) => window.localStorage.getItem(key), HISTORY_KEY);
    await expect(page.locator('[data-archetype]')).toHaveCount(12);
    const progressAfter = await page.evaluate((key) => window.localStorage.getItem(key), HISTORY_KEY);
    expect(progressAfter).toEqual(progressBefore);
  });

  test('restores locale, progress index and answers after reload', async ({ page }) => {
    await beginQuiz(page, 'en');
    await answerPrefix(page, 'en', 5, 1);
    const expectedProgress = await readProgress(page, PROGRESS_KEY);
    expect(expectedProgress).not.toBeNull();
    await setLocale(page, 'en');
    await page.reload();

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expectQuestion(page, 'en', 6);
    const progress = await readProgress(page, PROGRESS_KEY);
    expect(progress).toEqual(expectedProgress);
  });

  test('clears v1/v2 progress and preserves unrelated keys', async ({ page }) => {
    await page.addInitScript(({ progressKey, legacyHistoryKey, historyKey, localeKey }) => {
      Object.defineProperty(navigator, 'languages', { get: () => ['zh-CN'] });
      Object.defineProperty(navigator, 'language', { get: () => 'zh-CN' });
      window.localStorage.setItem(progressKey, '{"unreadable":true}');
      window.localStorage.setItem(legacyHistoryKey, '{"unreadable":true}');
      window.localStorage.setItem(historyKey, '{"version":2,"results":[]}');
      window.localStorage.setItem(localeKey, 'en');
      window.localStorage.setItem('facet:e2e:unrelated', 'keep');
    }, {
      progressKey: PROGRESS_KEY,
      legacyHistoryKey: LEGACY_HISTORY_KEY,
      historyKey: HISTORY_KEY,
      localeKey: LOCALE_KEY,
    });

    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expectUnreadableWarningVisible(page, 'en');
    await page.locator('[data-action="show-history"]').click();
    await page.locator('[data-action="request-clear"]').click();
    await page.locator('[data-action="confirm-clear"]').click();
    const clearedMessage = (await page.locator('html').getAttribute('lang')) === 'en'
      ? CATALOGS.en.feedback.dataCleared
      : CATALOGS['zh-CN'].feedback.dataCleared;
    await expect(page.locator('[data-history-status]')).toContainText(clearedMessage);

    const localData = await page.evaluate(({ progressKey, legacyHistoryKey, historyKey, localeKey }) => ({
      progress: window.localStorage.getItem(progressKey),
      legacyHistory: window.localStorage.getItem(legacyHistoryKey),
      history: window.localStorage.getItem(historyKey),
      locale: window.localStorage.getItem(localeKey),
      unrelated: window.localStorage.getItem('facet:e2e:unrelated'),
    }), {
      progressKey: PROGRESS_KEY,
      legacyHistoryKey: LEGACY_HISTORY_KEY,
      historyKey: HISTORY_KEY,
      localeKey: LOCALE_KEY,
    });
    expect(localData).toEqual({
      progress: null,
      legacyHistory: null,
      history: null,
      locale: null,
      unrelated: 'keep',
    });
    await page.locator('[data-action="back"]').click();
    await expect(page.locator('[data-screen="landing"]')).toBeVisible();
    await expectUnreadableWarningHidden(page, 'zh-CN');
  });

  test('keeps clear warning on failure', async ({ page }) => {
    await page.addInitScript((progressKey) => {
      window.localStorage.setItem(progressKey, '{"unreadable":true}');
      const removeItem = Storage.prototype.removeItem;
      Storage.prototype.removeItem = function blockedProgressRemoval(key: string): void {
        if (key === progressKey) {
          throw new DOMException('Blocked', 'SecurityError');
        }
        removeItem.call(this, key);
      };
    }, PROGRESS_KEY);

    await page.goto('/');
    await expectUnreadableWarningVisible(page, 'zh-CN');
    await page.locator('[data-action="show-history"]').click();
    await page.locator('[data-action="request-clear"]').click();
    await page.locator('[data-action="confirm-clear"]').click();
    await expect(page.locator('[data-history-status]')).toContainText(copy('zh-CN').feedback.storageDeleteFailure);
    await page.locator('[data-action="back"]').click();
    await expect(page.locator('[data-screen="landing"]')).toBeVisible();
    await expectUnreadableWarningVisible(page, 'zh-CN');
    await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), PROGRESS_KEY)).not.toBeNull();
  });

  test('keyboard-only flow, visible focus, native dialog, and reduced-motion', async ({ page }, testInfo) => {
    await page.goto('/');
    await expect(page.locator('#screen-title')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-action="start"]')).toBeFocused();
    await page.keyboard.press('Enter');

    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: copy('zh-CN').intro.begin })).toBeFocused();
    await page.keyboard.press('Enter');
    await expectQuestion(page, 'zh-CN', 1);

    await page.keyboard.press('Tab');
    await expect(page.getByRole('radio', { name: copy('zh-CN').quiz.answerLabels[0] })).toBeFocused();
    await page.keyboard.press('1');
    await expectQuestion(page, 'zh-CN', 2);
    await page.keyboard.press('2');
    await expectQuestion(page, 'zh-CN', 3);

    for (let step = 0; step < 6; step += 1) {
      await page.locator('[data-action="back"]').click();
      if (await page.locator('[data-screen="landing"]').isVisible()) {
        break;
      }
    }
    await expect(page.locator('[data-screen="landing"]')).toBeVisible();

    await page.locator('[data-action="show-history"]').click();
    await page.locator('[data-action="request-clear"]').click();
    const dialog = page.locator('#clear-data-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveJSProperty('open', true);
    await page.locator('[data-action="cancel-clear"]').click();
    await expect(dialog).toHaveJSProperty('open', false);

    const reducedMotion = await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    expect(reducedMotion).toBe(testInfo.project.name === 'reduced-motion');
  });

  test('has no console errors, request failures, or third-party requests', async ({ page }) => {
    const errors: string[] = [];
    const failures: string[] = [];
    const foreignRequests: string[] = [];
    const base = 'http://127.0.0.1:4173';
    const allowed = [`${base}`, 'http://localhost:4173'];

    page.on('console', (message) => {
      if (message.type() === 'error') {
        errors.push(message.text());
      }
    });
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    page.on('requestfailed', (request) => {
      failures.push(request.url());
    });
    page.on('request', (request) => {
      const url = request.url();
      if (!url.startsWith('blob:') && url.startsWith('http') && !allowed.some((prefix) => url.startsWith(prefix))) {
        foreignRequests.push(url);
      }
    });

    await completeQuiz(page, 'en');
    await page.locator('[data-action="show-atlas"]').click();
    await expect(page.locator('[data-screen="atlas"]')).toBeVisible();
    expect(errors).toHaveLength(0);
    expect(failures).toHaveLength(0);
    expect(foreignRequests).toHaveLength(0);
  });

  test('keeps no overflow on long English screens at key widths', async ({ page }) => {
    for (const viewportWidth of [360, 390, 768, 1280]) {
      await page.setViewportSize({ width: viewportWidth, height: 900 });
      await completeQuiz(page, 'en');
      await expectNoHorizontalOverflow(page);
      await page.locator('[data-action="show-atlas"]').click();
      await expect(page.locator('[data-screen="atlas"]')).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await page.locator('.screen[data-screen="atlas"] .button.button--secondary[data-action="back"]').click();
      await expect(page.locator('[data-screen="result"]')).toBeVisible();
    }
  });
});
