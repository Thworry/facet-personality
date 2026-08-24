import { ARCHETYPES } from '../../data/archetypes';
import { escapeHtml } from '../html';
import type { LocaleCatalog } from '../../i18n/types';
import { renderLocaleSwitcher } from './locale-switcher';

export function renderAtlas(copy: LocaleCatalog): string {
  const archetypes = [...ARCHETYPES].sort((left, right) => left.code.localeCompare(right.code));
  const entries = archetypes.map((archetype, index) => {
    const localized = copy.archetypes[archetype.code];

    return `
      <li>
        <article data-archetype="${escapeHtml(archetype.code)}">
          <header>
            <span>${String(index + 1).padStart(2, '0')}</span>
            <p>${escapeHtml(archetype.code)} · ${escapeHtml(localized.name)}</p>
            <h2>${escapeHtml(localized.name)}</h2>
          </header>
          <p>${escapeHtml(localized.hook)}</p>
          <dl>
            <div><dt>${escapeHtml(copy.atlas.strengths)}</dt><dd>${escapeHtml(localized.strengths[0] as string)}</dd></div>
            <div><dt>${escapeHtml(copy.atlas.pitfalls)}</dt><dd>${escapeHtml(localized.pitfalls[0] as string)}</dd></div>
          </dl>
        </article>
      </li>
    `;
  }).join('');

  return `
    <div class="screen screen--atlas" data-screen="atlas">
      <header class="screen-header">
        <button class="text-action" type="button" data-action="back">${escapeHtml(copy.common.back)}</button>
        <span class="screen-code">${escapeHtml(copy.atlas.screenCode)}</span>
        ${renderLocaleSwitcher(copy.meta.locale, copy)}
      </header>
      <section aria-labelledby="screen-title">
        <p class="eyebrow">${escapeHtml(copy.atlas.eyebrow)}</p>
        <h1 id="screen-title" tabindex="-1">${escapeHtml(copy.atlas.title)}</h1>
        <p>${escapeHtml(copy.atlas.lead)}</p>
      </section>
      <ol class="atlas-index">
        ${entries}
      </ol>
      <button class="button button--secondary" type="button" data-action="back">${escapeHtml(copy.atlas.return)}</button>
    </div>
  `;
}
