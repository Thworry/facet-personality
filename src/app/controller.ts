import { buildFacetResult } from '../domain/result';
import { drawShareCard } from '../domain/share';
import {
  PROGRESS_KEY,
  appendHistory,
  clearAllLocalData,
  clearProgress,
  loadHistory,
  loadProgress,
  saveProgress,
} from '../domain/storage';
import type { AppAction, AppState, AnswerValue } from './state';
import {
  canCompleteQuiz,
  createInitialState,
  createQuestionOrder,
  reduceAppState,
  restoreAppState,
  toSavedProgress,
} from './state';
import { renderIntro } from './screens/intro';
import { renderLanding } from './screens/landing';
import { renderQuiz } from './screens/quiz';
import { renderAtlas } from './screens/atlas';
import { renderHistory } from './screens/history';
import { renderResult } from './screens/result';

export interface AppController {
  getState(): AppState;
  dispatch(action: AppAction): void;
  destroy(): void;
}

export interface ControllerOptions {
  storage?: Storage;
  answerDelayMs?: number;
}

function renderScreen(state: AppState, history: ReturnType<typeof loadHistory>, shareMessage: string): string {
  switch (state.route) {
    case 'landing':
      return renderLanding();
    case 'intro':
      return renderIntro();
    case 'quiz':
      return renderQuiz(state);
    case 'result':
      return state.result === null ? renderLanding() : renderResult(state.result, shareMessage);
    case 'atlas':
      return renderAtlas();
    case 'history':
      return renderHistory(history);
  }
}

function storageContainsProgress(storage: Storage): boolean {
  try {
    return storage.getItem(PROGRESS_KEY) !== null;
  } catch {
    return false;
  }
}

export function createAppController(
  root: HTMLElement,
  options: ControllerOptions = {},
): AppController {
  const storage = options.storage ?? window.localStorage;
  const answerDelayMs = options.answerDelayMs ?? 220;
  const savedProgress = loadProgress(storage);
  const hadUnreadableProgress = savedProgress === null && storageContainsProgress(storage);
  let state = savedProgress === null ? createInitialState() : restoreAppState(savedProgress);
  let advanceTimer: number | null = null;
  let shareMessage = '';

  function cancelAdvance(): void {
    if (advanceTimer !== null) {
      window.clearTimeout(advanceTimer);
      advanceTimer = null;
    }
  }

  function persist(): void {
    const progress = toSavedProgress(state);
    if (progress !== null) {
      saveProgress(progress, storage);
    }
  }

  function focusScreenHeading(): void {
    const heading = root.querySelector<HTMLElement>('#screen-title');
    heading?.focus({ preventScroll: true });
  }

  function render(moveFocus: boolean): void {
    root.innerHTML = renderScreen(state, loadHistory(storage), shareMessage);
    if (hadUnreadableProgress && state.route === 'landing') {
      const notice = document.createElement('p');
      notice.className = 'inline-notice';
      notice.setAttribute('role', 'status');
      notice.textContent = '检测到无法读取的本地进度。旧记录仍保留；开始新测试后会用新的有效进度替换。';
      root.querySelector('.landing-hero')?.append(notice);
    }
    if (moveFocus) {
      focusScreenHeading();
    }
  }

  function dispatch(action: AppAction, moveFocus = true): void {
    state = reduceAppState(state, action);
    persist();
    render(moveFocus);
  }

  function finishQuiz(): void {
    if (!canCompleteQuiz(state.answers)) {
      return;
    }
    try {
      const result = buildFacetResult(state.answers);
      appendHistory(result, storage);
      clearProgress(storage);
      shareMessage = '';
      dispatch({ type: 'SHOW_RESULT', result });
    } catch (error) {
      const message = error instanceof Error ? error.message : '结果生成失败';
      const status = root.querySelector<HTMLElement>('[data-quiz-status]');
      if (status !== null) {
        status.textContent = `${message}。请检查最后一题后再试。`;
      }
    }
  }

  function setShareStatus(message: string): void {
    shareMessage = message;
    const status = root.querySelector<HTMLElement>('[data-share-status]');
    if (status !== null) {
      status.textContent = message;
    }
  }

  function downloadShareCard(): void {
    if (state.route !== 'result' || state.result === null) {
      return;
    }
    const result = state.result;
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1440;
    const context = canvas.getContext('2d');
    if (context === null || typeof canvas.toBlob !== 'function') {
      setShareStatus('当前浏览器无法生成图片，请直接截取结果封面保存。');
      return;
    }

    try {
      drawShareCard(context, result, 1);
      canvas.toBlob((blob) => {
        if (blob === null) {
          setShareStatus('图片生成没有完成，请直接截取结果封面保存。');
          return;
        }
        try {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `FACET-${result.primary.code}.png`;
          link.hidden = true;
          document.body.append(link);
          link.click();
          link.remove();
          window.setTimeout(() => URL.revokeObjectURL(url), 0);
          setShareStatus('分享卡已在本地生成，逐题答案没有上传。');
        } catch {
          setShareStatus('图片已生成但下载未启动，请直接截取结果封面保存。');
        }
      }, 'image/png');
    } catch {
      setShareStatus('当前浏览器无法生成图片，请直接截取结果封面保存。');
    }
  }

  function showClearDialog(): void {
    const dialog = root.querySelector<HTMLDialogElement>('#clear-data-dialog');
    if (dialog === null) {
      return;
    }
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
  }

  function closeClearDialog(): void {
    const dialog = root.querySelector<HTMLDialogElement>('#clear-data-dialog');
    if (dialog === null) {
      return;
    }
    if (typeof dialog.close === 'function') {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }
  }

  function clearLocalArchive(): void {
    const success = clearAllLocalData(storage);
    if (!success) {
      const status = root.querySelector<HTMLElement>('[data-history-status]');
      if (status !== null) {
        status.textContent = '浏览器没有允许删除本地数据，请检查站点存储设置后重试。';
      }
      return;
    }
    shareMessage = '';
    const reset = reduceAppState(state, { type: 'RESET' });
    state = reduceAppState(reset, { type: 'SHOW_HISTORY' });
    render(true);
    const status = root.querySelector<HTMLElement>('[data-history-status]');
    if (status !== null) {
      status.textContent = 'FACET 的未完成进度和历史结果已清除。';
    }
  }

  function goNext(): void {
    cancelAdvance();
    if (state.route !== 'quiz') {
      return;
    }
    if (!state.chapterIntroVisible && state.index === state.order.length - 1) {
      finishQuiz();
      return;
    }
    dispatch({ type: 'NEXT' });
  }

  function answerCurrent(value: AnswerValue): void {
    if (state.route !== 'quiz' || state.chapterIntroVisible) {
      return;
    }
    const questionId = state.order[state.index];
    if (questionId === undefined) {
      return;
    }
    cancelAdvance();
    const expectedIndex = state.index;
    dispatch({ type: 'ANSWER', questionId, value }, false);
    root.querySelector<HTMLInputElement>(`#answer-${value}`)?.focus({ preventScroll: true });
    advanceTimer = window.setTimeout(() => {
      advanceTimer = null;
      if (state.route === 'quiz' && state.index === expectedIndex && state.answers[questionId] !== undefined) {
        goNext();
      }
    }, answerDelayMs);
  }

  function onClick(event: Event): void {
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-action]') : null;
    if (target === null) {
      return;
    }
    const action = target.dataset.action;
    switch (action) {
      case 'start':
        dispatch({ type: 'START' });
        break;
      case 'begin-quiz':
        dispatch({ type: 'BEGIN_QUIZ', order: createQuestionOrder() });
        break;
      case 'back':
        cancelAdvance();
        dispatch({ type: 'BACK' });
        break;
      case 'next':
        goNext();
        break;
      case 'show-atlas':
        cancelAdvance();
        dispatch({ type: 'SHOW_ATLAS' });
        break;
      case 'show-history':
        cancelAdvance();
        dispatch({ type: 'SHOW_HISTORY' });
        break;
      case 'open-result': {
        const resultId = target.dataset.resultId;
        const result = loadHistory(storage).find((entry) => entry.id === resultId);
        if (result !== undefined) {
          shareMessage = '';
          dispatch({ type: 'SHOW_RESULT', result });
        }
        break;
      }
      case 'share':
        downloadShareCard();
        break;
      case 'retest-all':
        cancelAdvance();
        clearProgress(storage);
        dispatch({ type: 'START' });
        break;
      case 'retest-weather':
        cancelAdvance();
        dispatch({ type: 'RETEST_WEATHER', order: createQuestionOrder() });
        break;
      case 'request-clear':
        showClearDialog();
        break;
      case 'cancel-clear':
        closeClearDialog();
        break;
      case 'confirm-clear':
        closeClearDialog();
        clearLocalArchive();
        break;
      case 'reset':
        cancelAdvance();
        clearProgress(storage);
        dispatch({ type: 'RESET' });
        break;
    }
  }

  function onChange(event: Event): void {
    if (!(event.target instanceof HTMLInputElement) || event.target.name !== 'answer') {
      return;
    }
    const value = Number(event.target.value);
    if (value >= 1 && value <= 5 && Number.isInteger(value)) {
      answerCurrent(value as AnswerValue);
    }
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (state.route !== 'quiz' || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    if (!state.chapterIntroVisible && /^[1-5]$/.test(event.key)) {
      event.preventDefault();
      answerCurrent(Number(event.key) as AnswerValue);
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      cancelAdvance();
      dispatch({ type: 'BACK' });
      return;
    }
    if (event.key === 'Enter' && !(event.target instanceof HTMLButtonElement)) {
      const questionId = state.order[state.index];
      if (state.chapterIntroVisible || (questionId !== undefined && state.answers[questionId] !== undefined)) {
        event.preventDefault();
        goNext();
      }
    }
  }

  root.addEventListener('click', onClick);
  root.addEventListener('change', onChange);
  root.addEventListener('keydown', onKeyDown);
  render(true);

  return {
    getState: () => state,
    dispatch,
    destroy: () => {
      cancelAdvance();
      root.removeEventListener('click', onClick);
      root.removeEventListener('change', onChange);
      root.removeEventListener('keydown', onKeyDown);
    },
  };
}
