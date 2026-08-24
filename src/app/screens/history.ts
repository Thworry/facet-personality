import { escapeHtml } from '../html';
import type { FacetResult } from '../../types';
import type { LocaleCatalog } from '../../i18n/types';
import { renderLocaleSwitcher } from './locale-switcher';

function localDateLabel(timestamp: string, locale: string, copy: LocaleCatalog): string {
  if (timestamp === '') {
    return escapeHtml(copy.history.unknownDate);
  }
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return escapeHtml(copy.history.unknownDate);
  }
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function renderHistoryEntry(result: FacetResult, copy: LocaleCatalog, locale: string): string {
  const weather = copy.weather[result.weather.code];
  const mainTitle = result.clarity === 'free' ? copy.result.freeFacet : `${result.primary.code} · ${copy.archetypes[result.primary.code].name}`;
  const standoutCopy = (() => {
    if (result.standout.dimension === 'BALANCED') {
      return copy.result.balancedStandout;
    }
    const dimensionCopy = copy.dimensions[result.standout.dimension];
    return result.standout.direction === 'low' ? dimensionCopy.lowLabel : dimensionCopy.highLabel;
  })();

  return `
    <li>
      <article data-result-id="${escapeHtml(result.id)}">
        <time datetime="${escapeHtml(result.createdAt)}">${localDateLabel(result.createdAt, locale, copy)}</time>
        <h2>${escapeHtml(mainTitle)}</h2>
        <p>${escapeHtml(result.weather.code)} · ${escapeHtml(weather.name)} · ${escapeHtml(standoutCopy)}</p>
        <button class="button button--secondary" type="button" data-action="open-result" data-result-id="${escapeHtml(result.id)}">${escapeHtml(copy.history.openResult)}</button>
      </article>
    </li>
  `;
}

export function renderHistory(history: readonly FacetResult[], copy: LocaleCatalog): string {
  return `
    <div class="screen screen--history" data-screen="history">
      <header class="screen-header">
        <button class="text-action" type="button" data-action="back">${escapeHtml(copy.common.back)}</button>
        <span class="screen-code">${escapeHtml(copy.history.screenCode)}</span>
        ${renderLocaleSwitcher(copy.meta.locale, copy)}
      </header>
      <section aria-labelledby="screen-title">
        <p class="eyebrow">${escapeHtml(copy.history.eyebrow)}</p>
        <h1 id="screen-title" tabindex="-1">${escapeHtml(copy.history.title)}</h1>
        <p>${escapeHtml(copy.history.privacyLead)}</p>
      </section>

      ${history.length === 0 ? `
        <section class="empty-history" aria-labelledby="empty-title">
          <h2 id="empty-title">${escapeHtml(copy.history.emptyTitle)}</h2>
          <p>${escapeHtml(copy.history.emptyLead)}</p>
          <p>${escapeHtml(copy.history.emptyBody)}</p>
          <button class="button button--primary" type="button" data-action="retest-all">${escapeHtml(copy.history.start)}</button>
        </section>
      ` : `
        <ol class="history-list">
          ${history.slice(0, 3).map((result) => renderHistoryEntry(result, copy, copy.meta.locale).trim()).join('')}
        </ol>
      `}

      <section class="data-controls" aria-labelledby="data-title">
        <h2 id="data-title">${escapeHtml(copy.history.dataTitle)}</h2>
        <button class="button button--danger" type="button" data-action="request-clear">${escapeHtml(copy.history.clearAll)}</button>
        <p role="status" aria-live="polite" data-history-status></p>
      </section>

      <dialog id="clear-data-dialog" aria-labelledby="clear-dialog-title">
        <h2 id="clear-dialog-title">${escapeHtml(copy.history.clearDialogTitle)}</h2>
        <p>${escapeHtml(copy.history.clearDialogBody)}</p>
        <div class="dialog-actions">
          <button class="button button--danger" type="button" data-action="confirm-clear">${escapeHtml(copy.history.clearConfirm)}</button>
          <button class="button button--secondary" type="button" data-action="cancel-clear">${escapeHtml(copy.history.clearCancel)}</button>
        </div>
      </dialog>
    </div>
  `;
}
