import { QUESTIONS } from '../../data/questions';
import type { AppState } from '../state';
import { escapeHtml } from '../html';
import type { LocaleCatalog } from '../../i18n/types';
import { renderLocaleSwitcher } from './locale-switcher';

function renderStations(currentIndex: number): string {
  return Array.from({ length: 32 }, (_, index) => {
    const status = index < currentIndex ? 'completed' : index === currentIndex ? 'current' : 'pending';
    const interval = index % 4 === 0 ? ' interval-start' : '';
    return `<span class="station station--${status}${interval}" data-status="${status}"><span>${index + 1}</span></span>`;
  }).join('');
}

function renderChapterInterstitial(state: AppState, copy: LocaleCatalog): string {
  return `
    <div class="screen screen--chapter" data-screen="quiz" data-chapter="weather">
      <header class="screen-header">
        <span class="screen-code">${escapeHtml(copy.chapter.screenCode)}</span>
        ${renderLocaleSwitcher(copy.meta.locale, copy)}
      </header>
      <section class="chapter-curtain" aria-labelledby="screen-title">
        <p class="eyebrow">${escapeHtml(copy.chapter.eyebrow)}</p>
        <h1 id="screen-title" tabindex="-1" aria-label="${escapeHtml(copy.chapter.titleAriaLabel)}"><span>${escapeHtml(copy.chapter.titleLines[0])}</span><span>${escapeHtml(copy.chapter.titleLines[1])}</span><span>${escapeHtml(copy.chapter.titleLines[2])}</span></h1>
        <p>${escapeHtml(copy.chapter.lead)}</p>
        <p>${escapeHtml(copy.chapter.body)}</p>
        <button class="button button--primary" type="button" data-action="next">${escapeHtml(copy.chapter.continue)}</button>
        <button class="text-action" type="button" data-action="back">${escapeHtml(copy.chapter.back)}</button>
      </section>
      <p class="sr-only" aria-live="polite">${escapeHtml(copy.chapter.liveAnnouncement)}</p>
      <div class="progress-line" aria-hidden="true">${renderStations(state.index)}</div>
    </div>
  `;
}

export function renderQuiz(state: AppState, copy: LocaleCatalog): string {
  if (state.chapterIntroVisible) {
    return renderChapterInterstitial(state, copy);
  }

  const questionId = state.order[state.index];
  const question = QUESTIONS.find((item) => item.id === questionId);
  if (question === undefined) {
    return `
      <section class="screen screen--error" aria-labelledby="screen-title">
        <h1 id="screen-title" tabindex="-1">${escapeHtml(copy.quiz.errorTitle)}</h1>
        <p role="alert">${escapeHtml(copy.quiz.errorBody)}</p>
        <button class="button button--primary" type="button" data-action="reset">${escapeHtml(copy.quiz.reset)}</button>
      </section>
    `;
  }

  const selected = state.answers[question.id];
  const isRecent = question.timeframe === 'two-weeks';
  const nextLabel = state.index === 31 ? copy.quiz.viewResult : copy.quiz.next;
  const timeframe = isRecent ? copy.quiz.recentTimeframe : copy.quiz.usualTimeframe;
  const questionText = copy.questions[question.id as keyof typeof copy.questions] ?? '';
  const questionProgressTemplate = copy.quiz.progressTemplate
    .replace('{current}', String(state.index + 1))
    .replace('{total}', '32');
  const questionAriaTemplate = copy.quiz.progressAriaTemplate
    .replace('{current}', String(state.index + 1))
    .replace('{total}', '32')
    .replace('{timeframe}', timeframe);
  const questionNum = copy.quiz.questionNumberTemplate
    .replace('{current}', String(state.index + 1).padStart(2, '0'))
    .replace('{total}', '32');

  return `
    <div class="screen screen--quiz" data-screen="quiz" data-chapter="${isRecent ? 'weather' : 'core'}">
      <header class="quiz-header">
        <p class="progress-copy" aria-live="polite">${escapeHtml(questionProgressTemplate)}</p>
        <p class="timeframe-label">${escapeHtml(timeframe)}</p>
        ${renderLocaleSwitcher(copy.meta.locale, copy)}
        <div class="progress-line" aria-hidden="true">${renderStations(state.index)}</div>
        <p class="sr-only">${escapeHtml(questionAriaTemplate)}</p>
      </header>

      <section class="question-panel" aria-labelledby="screen-title">
        <p class="question-number">${escapeHtml(questionNum)}</p>
        <h1 id="screen-title" tabindex="-1">${escapeHtml(questionText)}</h1>
        <fieldset class="answer-group">
          <legend>${escapeHtml(copy.quiz.legend)}</legend>
          ${copy.quiz.answerLabels.map((label, index) => {
            const value = (index + 1) as 1 | 2 | 3 | 4 | 5;
            const checked = selected === value;
            return `
              <div class="answer-option" data-selected="${checked}">
                <input id="answer-${value}" name="answer" type="radio" value="${value}"${checked ? ' checked' : ''}>
                <label for="answer-${value}">
                  <span class="answer-key" aria-hidden="true">${value}</span>
                  <span>${escapeHtml(label)}</span>
                  ${checked ? `<span class="sr-only">${escapeHtml(copy.quiz.selected)}</span>` : ''}
                </label>
              </div>
            `;
          }).join('')}
        </fieldset>
      </section>

      <nav class="quiz-navigation" aria-label="${escapeHtml(copy.quiz.navigationLabel)}">
        <button class="button button--secondary" type="button" data-action="back">${escapeHtml(copy.quiz.previous)}</button>
        <button class="button button--primary" type="button" data-action="next"${selected === undefined ? ' disabled aria-disabled="true"' : ''}>${escapeHtml(nextLabel)}</button>
      </nav>
      <p class="keyboard-hint">${escapeHtml(copy.quiz.keyboardHint)}</p>
    </div>
  `;
}
