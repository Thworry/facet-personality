import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

const ANSWER_LABELS = [
  '完全不像我',
  '不太像我',
  '一半一半',
  '比较像我',
  '非常像我',
] as const;

const PROGRESS_KEY = 'facet:v1:progress';
const HISTORY_KEY = 'facet:v1:history';

async function expectQuestion(page: Page, position: number): Promise<void> {
  await expect(page.locator('[data-screen="quiz"] .progress-copy')).toHaveText(`第 ${position} 题，共 32 题`);
}

async function beginQuiz(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.locator('[data-screen="landing"]')).toBeVisible();
  await page.locator('[data-action="start"]').click();
  await expect(page.getByRole('heading', { name: '按你真实的运行方式，不按理想版本。' })).toBeVisible();
  await page.locator('[data-action="begin-quiz"]').click();
  await expectQuestion(page, 1);
}

async function answerQuestion(page: Page, position: number, value = 3): Promise<void> {
  await expectQuestion(page, position);
  await page.keyboard.press(String(value));
  await page.keyboard.press('Enter');

  if (position === 24) {
    await expect(page.getByRole('heading', { name: '接下来只看最近两周。' })).toBeVisible();
    return;
  }

  if (position === 32) {
    await expect(page.locator('[data-screen="result"]')).toBeVisible();
    return;
  }

  await expectQuestion(page, position + 1);
}

async function completeQuiz(page: Page): Promise<void> {
  await beginQuiz(page);

  for (let position = 1; position <= 24; position += 1) {
    await answerQuestion(page, position);
  }

  await expect(page.getByText('天气会变，它不是人格判决。', { exact: false })).toBeVisible();
  await page.locator('[data-action="next"]').click();
  await expectQuestion(page, 25);

  for (let position = 25; position <= 32; position += 1) {
    await answerQuestion(page, position);
  }
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(hasOverflow).toBe(false);
}

test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.project.name === 'reduced-motion') {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  }
});

test('completes all 32 questions, explores the result, downloads a PNG, and opens history', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('FACET｜人格切面');
  await expect(page.getByRole('heading', { name: /你不是一个类型/ })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await completeQuiz(page);

  await expect(page.locator('.result-cover h1')).toBeVisible();
  await expect(page.getByRole('heading', { name: /^相邻切面：/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^当前天气：/ })).toBeVisible();
  await expect(page.locator('.result-disclaimer')).toContainText('娱乐与自我观察用途');
  await expect(page.locator('meter')).toHaveCount(8);
  await expectNoHorizontalOverflow(page);

  await page.locator('[data-action="show-atlas"]').click();
  await expect(page.getByRole('heading', { name: '人格切面图鉴' })).toBeVisible();
  await expect(page.locator('[data-archetype]')).toHaveCount(12);
  await page.locator('[data-action="back"]').first().click();
  await expect(page.locator('[data-screen="result"]')).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-action="share"]').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^FACET-[A-Z]+\.png$/);
  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  const pngBytes = await readFile(downloadPath!);
  expect(Array.from(pngBytes.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(pngBytes.byteLength).toBeGreaterThan(10_000);
  await expect(page.locator('[data-share-status]')).toContainText('分享卡已在本地生成');

  await page.locator('[data-action="show-history"]').click();
  await expect(page.getByRole('heading', { name: '本地历史' })).toBeVisible();
  await expect(page.locator('.history-list > li')).toHaveCount(1);
  await expect(page.locator('[data-history-status]')).toBeEmpty();
});

test('supports a keyboard-only path with Tab, number keys, Enter, and ArrowLeft', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#screen-title')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('[data-action="start"]')).toBeFocused();
  await page.keyboard.press('Enter');

  await page.keyboard.press('Tab');
  await expect(page.locator('[data-action="begin-quiz"]')).toBeFocused();
  await page.keyboard.press('Enter');
  await expectQuestion(page, 1);

  await page.keyboard.press('Tab');
  await expect(page.getByRole('radio', { name: ANSWER_LABELS[0] })).toBeFocused();
  await page.keyboard.press('1');
  await expectQuestion(page, 2);
  await page.keyboard.press('5');
  await expectQuestion(page, 3);

  await page.keyboard.press('ArrowLeft');
  await expectQuestion(page, 2);
  await expect(page.getByRole('radio', { name: ANSWER_LABELS[4] })).toBeChecked();
  await page.keyboard.press('Enter');
  await expectQuestion(page, 3);

  await page.keyboard.press('2');
  await expectQuestion(page, 4);
  await page.keyboard.press('3');
  await expectQuestion(page, 5);
  await page.keyboard.press('4');
  await expectQuestion(page, 6);
});

test('restores the sixth question after five answers and retains prior selections', async ({ page }) => {
  await beginQuiz(page);
  const answerValues = [1, 2, 3, 4, 5] as const;

  for (let position = 1; position <= answerValues.length; position += 1) {
    await answerQuestion(page, position, answerValues[position - 1]);
  }

  const storedProgress = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) ?? 'null'), PROGRESS_KEY);
  expect(storedProgress).toMatchObject({ route: 'quiz', index: 5 });
  expect(Object.keys(storedProgress.answers)).toHaveLength(5);

  await page.reload();
  await expectQuestion(page, 6);
  await page.keyboard.press('ArrowLeft');
  await expectQuestion(page, 5);
  await expect(page.getByRole('radio', { name: ANSWER_LABELS[4] })).toBeChecked();
  await page.keyboard.press('Enter');
  await expectQuestion(page, 6);
});

test('clears FACET progress and history without removing unrelated local data', async ({ page }) => {
  await page.addInitScript(({ progressKey, historyKey }) => {
    window.localStorage.setItem(progressKey, '{"unreadable":true}');
    window.localStorage.setItem(historyKey, '{"unreadable":true}');
    window.localStorage.setItem('facet:e2e:unrelated', 'keep');
  }, { progressKey: PROGRESS_KEY, historyKey: HISTORY_KEY });

  await page.goto('/');
  await expect(page.getByText('检测到无法读取的本地进度', { exact: false })).toBeVisible();
  await page.locator('[data-action="show-history"]').click();
  await page.locator('[data-action="request-clear"]').click();
  await expect(page.getByRole('dialog', { name: '确认清除？' })).toBeVisible();
  await page.locator('[data-action="confirm-clear"]').click();
  await expect(page.locator('[data-history-status]')).toContainText('已清除');

  const localData = await page.evaluate(({ progressKey, historyKey }) => ({
    progress: window.localStorage.getItem(progressKey),
    history: window.localStorage.getItem(historyKey),
    unrelated: window.localStorage.getItem('facet:e2e:unrelated'),
  }), { progressKey: PROGRESS_KEY, historyKey: HISTORY_KEY });

  expect(localData).toEqual({ progress: null, history: null, unrelated: 'keep' });
  await expect(page.getByRole('heading', { name: '档案里还没有结果' })).toBeVisible();
});

test('applies the motion preference declared by each browser project', async ({ page }, testInfo) => {
  await page.goto('/');
  const reducedMotion = await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  expect(reducedMotion).toBe(testInfo.project.name === 'reduced-motion');
});
