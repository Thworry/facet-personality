import type { LocaleCatalog } from '../../i18n/types';
import { escapeHtml } from '../html';
import { renderLocaleSwitcher } from './locale-switcher';

export function renderLanding(copy: LocaleCatalog): string {
  const stations = Array.from({ length: 32 }, (_, index) => {
    const interval = index % 4 === 0 ? ' landing-station--interval' : '';
    return `<span class="landing-station${interval}"><span>${index + 1}</span></span>`;
  }).join('');

  return `
    <div class="screen screen--landing" data-screen="landing">
      <header class="site-header">
        <a class="brand" href="#main-content" aria-label="${escapeHtml(copy.landing.brandAriaLabel)}">${escapeHtml(copy.common.brandLabel)}</a>
        <nav aria-label="${escapeHtml(copy.landing.navigationLabel)}">
          <button class="text-action" type="button" data-action="show-history">${escapeHtml(copy.landing.history)}</button>
        </nav>
        ${renderLocaleSwitcher(copy.meta.locale, copy)}
      </header>

      <section class="landing-hero" aria-labelledby="screen-title">
        <p class="eyebrow">${escapeHtml(copy.landing.eyebrow)}</p>
        <h1 id="screen-title" tabindex="-1"><span>${escapeHtml(copy.landing.titleLines[0])}</span><span>${escapeHtml(copy.landing.titleLines[1])}</span><span>${escapeHtml(copy.landing.titleLines[2])}</span></h1>
        <p class="landing-deck">${escapeHtml(copy.landing.deckLead)} ${escapeHtml(copy.landing.deckBody)}</p>
        <div class="landing-actions">
          <button class="button button--primary" type="button" data-action="start">${escapeHtml(copy.landing.start)}</button>
          <button class="button button--secondary" type="button" data-action="show-atlas">${escapeHtml(copy.landing.atlas)}</button>
        </div>
      </section>

      <div class="landing-line" aria-hidden="true" data-stations="32">${stations}</div>

      <section class="facts" aria-label="${escapeHtml(copy.landing.factsLabel)}">
        ${copy.landing.facts.map((fact) => `<div><strong>${escapeHtml(fact.value)}</strong><span>${escapeHtml(fact.detail)}</span></div>`).join('')}
      </section>

      <aside class="boundary-note" aria-label="${escapeHtml(copy.landing.boundaryLabel)}">
        <strong>${escapeHtml(copy.landing.boundaryTitle)}</strong>
        <p>${escapeHtml(copy.landing.boundaryBody)}</p>
      </aside>
    </div>
  `;
}
