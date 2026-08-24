import { buildFacetResult } from '../domain/result';
import {
  PROGRESS_KEY,
  appendHistory,
  clearProgress,
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

export interface AppController {
  getState(): AppState;
  dispatch(action: AppAction): void;
  destroy(): void;
}

export interface ControllerOptions {
  storage?: Storage;
  answerDelayMs?: number;
}

function renderPlaceholder(title: string, backLabel: string): string {
  return `
    <section class="screen screen--placeholder" aria-labelledby="screen-title">
      <h1 id="screen-title" tabindex="-1">${title}</h1>
      <p>这段线路正在接入。</p>
      <button type="button" data-action="back">${backLabel}</button>
    </section>
  `;
}

function renderScreen(state: AppState): string {
  switch (state.route) {
    case 'landing':
      return renderLanding();
    case 'intro':
      return renderIntro();
    case 'quiz':
      return renderQuiz(state);
    case 'result':
      return renderPlaceholder('你的切面已经汇合', '返回首页');
    case 'atlas':
      return renderPlaceholder('十二种原型图鉴', '返回');
    case 'history':
      return renderPlaceholder('本地历史', '返回');
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
    root.innerHTML = renderScreen(state);
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
      dispatch({ type: 'SHOW_RESULT', result });
    } catch (error) {
      const message = error instanceof Error ? error.message : '结果生成失败';
      const status = root.querySelector<HTMLElement>('[data-quiz-status]');
      if (status !== null) {
        status.textContent = `${message}。请检查最后一题后再试。`;
      }
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
