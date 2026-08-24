import { QUESTIONS } from '../../data/questions';
import type { AppState } from '../state';
import { escapeHtml } from '../html';

export const ANSWER_LABELS = [
  '完全不像我',
  '不太像我',
  '一半一半',
  '比较像我',
  '非常像我',
] as const;

function renderStations(currentIndex: number): string {
  return Array.from({ length: 32 }, (_, index) => {
    const status = index < currentIndex ? 'completed' : index === currentIndex ? 'current' : 'pending';
    const interval = index % 4 === 0 ? ' interval-start' : '';
    return `<span class="station station--${status}${interval}" data-status="${status}"><span>${index + 1}</span></span>`;
  }).join('');
}

function renderChapterInterstitial(state: AppState): string {
  return `
    <div class="screen screen--chapter" data-screen="quiz" data-chapter="weather">
      <header class="screen-header">
        <span class="screen-code">24 / 32 · LINE CHANGE</span>
      </header>
      <section class="chapter-curtain" aria-labelledby="screen-title">
        <p class="eyebrow">线路换乘</p>
        <h1 id="screen-title" tabindex="-1">接下来只看最近两周。</h1>
        <p>前面读的是你通常怎么运行；最后 8 题只观察最近的负荷与恢复。天气会变，它不是人格判决。</p>
        <button class="button button--primary" type="button" data-action="next">继续最近两周</button>
        <button class="text-action" type="button" data-action="back">返回上一题</button>
      </section>
      <p class="sr-only" aria-live="polite">已完成 24 题，即将进入最近两周章节</p>
      <div class="progress-line" aria-hidden="true">${renderStations(state.index)}</div>
    </div>
  `;
}

export function renderQuiz(state: AppState): string {
  if (state.chapterIntroVisible) {
    return renderChapterInterstitial(state);
  }

  const questionId = state.order[state.index];
  const question = QUESTIONS.find((item) => item.id === questionId);
  if (question === undefined) {
    return `
      <section class="screen screen--error" aria-labelledby="screen-title">
        <h1 id="screen-title" tabindex="-1">这段线路没有读取成功</h1>
        <p role="alert">本地进度可能损坏。你可以返回首页重新开始。</p>
        <button class="button button--primary" type="button" data-action="reset">返回首页</button>
      </section>
    `;
  }

  const selected = state.answers[question.id];
  const isRecent = question.timeframe === 'two-weeks';
  const nextLabel = state.index === 31 ? '查看我的切面' : '下一题';
  const timeframe = isRecent ? '最近两周' : '大多数情况下';

  return `
    <div class="screen screen--quiz" data-screen="quiz" data-chapter="${isRecent ? 'weather' : 'core'}">
      <header class="quiz-header">
        <p class="progress-copy" aria-live="polite">第 ${state.index + 1} 题，共 32 题</p>
        <p class="timeframe-label">${timeframe}</p>
        <div class="progress-line" aria-hidden="true">${renderStations(state.index)}</div>
        <p class="sr-only">进度：第 ${state.index + 1} 题，共 32 题；当前为${timeframe}章节。</p>
      </header>

      <section class="question-panel" aria-labelledby="screen-title">
        <p class="question-number">${String(state.index + 1).padStart(2, '0')} / 32</p>
        <h1 id="screen-title" tabindex="-1">${escapeHtml(question.prompt)}</h1>
        <fieldset class="answer-group">
          <legend>这句话有多像你？</legend>
          ${ANSWER_LABELS.map((label, index) => {
            const value = (index + 1) as 1 | 2 | 3 | 4 | 5;
            const checked = selected === value;
            return `
              <div class="answer-option" data-selected="${checked}">
                <input id="answer-${value}" name="answer" type="radio" value="${value}"${checked ? ' checked' : ''}>
                <label for="answer-${value}">
                  <span class="answer-key" aria-hidden="true">${value}</span>
                  <span>${label}</span>
                  ${checked ? '<span class="sr-only">已选</span>' : ''}
                </label>
              </div>
            `;
          }).join('')}
        </fieldset>
      </section>

      <nav class="quiz-navigation" aria-label="题目导航">
        <button class="button button--secondary" type="button" data-action="back">上一题</button>
        <button class="button button--primary" type="button" data-action="next"${selected === undefined ? ' disabled aria-disabled="true"' : ''}>${nextLabel}</button>
      </nav>
      <p class="keyboard-hint">快捷键：1–5 选择 · Enter 下一题 · ← 上一题</p>
    </div>
  `;
}
