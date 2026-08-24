import { escapeHtml } from '../html';
import { renderLocaleSwitcher } from './locale-switcher';
import type { LocaleCatalog } from '../../i18n/types';

export function renderIntro(copy: LocaleCatalog): string {
  return `
    <div class="screen screen--intro" data-screen="intro">
      <header class="screen-header">
        <button class="text-action" type="button" data-action="back">${escapeHtml(copy.common.back)}</button>
        <span class="screen-code">${escapeHtml(copy.intro.screenCode)}</span>
        ${renderLocaleSwitcher(copy.meta.locale, copy)}
      </header>

      <section class="intro-copy" aria-labelledby="screen-title">
        <p class="eyebrow">${escapeHtml(copy.intro.eyebrow)}</p>
        <h1 id="screen-title" tabindex="-1">${escapeHtml(copy.intro.title)}</h1>
        <p>${escapeHtml(copy.intro.realityCheck)}</p>
        <p>${escapeHtml(copy.intro.guidance)}</p>
      </section>

      <section class="timeframes" aria-label="${escapeHtml(copy.intro.timeframesLabel)}">
        <article>
          <p class="section-number">${escapeHtml(copy.intro.core.code)}</p>
          <h2>${escapeHtml(copy.intro.core.title)}</h2>
          <p>${escapeHtml(copy.intro.core.body)}</p>
        </article>
        <article>
          <p class="section-number">${escapeHtml(copy.intro.recent.code)}</p>
          <h2>${escapeHtml(copy.intro.recent.title)}</h2>
          <p>${escapeHtml(copy.intro.recent.body)}</p>
        </article>
      </section>

      <section class="response-preview" aria-labelledby="response-title">
        <h2 id="response-title">${escapeHtml(copy.intro.scaleTitle)}</h2>
        <ol>
          ${copy.quiz.answerLabels.map((label, index) => `<li><span>${index + 1}</span>${escapeHtml(label)}</li>`).join('')}
        </ol>
        <p>${escapeHtml(copy.intro.keyboardHint)}</p>
      </section>

      <section class="consent-note">
        <p>${escapeHtml(copy.intro.consent)}</p>
        <button class="button button--primary" type="button" data-action="begin-quiz">${escapeHtml(copy.intro.begin)}</button>
      </section>
    </div>
  `;
}
