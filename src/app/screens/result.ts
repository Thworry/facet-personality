import { getArchetypeDefinition } from '../../data/archetypes';
import type {
  ArchetypeDefinition,
  CoreDimension,
  FacetResult,
  Level,
} from '../../types';
import { CORE_DIMENSIONS, STATE_DIMENSIONS } from '../../types';
import { escapeHtml } from '../html';
import type { LocaleCatalog } from '../../i18n/types';
import { renderLocaleSwitcher } from './locale-switcher';

const LEVEL_VALUE: Readonly<Record<Level, number>> = { L: 25, M: 50, H: 75 };

function renderResultTitle(
  result: FacetResult,
  copy: LocaleCatalog,
  clarityLabel: string,
  primaryName: string,
  adjacentName: string,
): string {
  if (result.clarity === 'free') {
    return `
      <h1 id="screen-title" tabindex="-1">${escapeHtml(clarityLabel)}</h1>
      <p class="facet-references">${escapeHtml(copy.result.recentReferences)}</p>
      <p>${escapeHtml(copy.result.recentReferencesTemplate)
        .replace('{primary}', `${result.primary.code} · ${primaryName}`)
        .replace('{adjacent}', `${result.adjacent.code} · ${adjacentName}`)}</p>
    `;
  }
  if (result.clarity === 'dual') {
    return `
      <h1 id="screen-title" class="dual-facet-title" tabindex="-1">
        <span>${result.primary.code} · ${escapeHtml(primaryName)}</span>
        <span aria-hidden="true">×</span>
        <span>${result.adjacent.code} · ${escapeHtml(adjacentName)}</span>
      </h1>
      <p>${escapeHtml(clarityLabel)}</p>
    `;
  }
  return `<h1 id="screen-title" tabindex="-1"><span class="facet-code">${result.primary.code}</span><span class="facet-name">${escapeHtml(primaryName)}</span></h1><p>${escapeHtml(clarityLabel)}</p>`;
}

function operatingExplanation(result: FacetResult, copy: LocaleCatalog): string {
  const launch = result.coreScores.F2 >= 50 ? copy.result.operating.startEarly : copy.result.operating.startUnderPressure;
  const control = result.coreScores.F3 >= 50 ? copy.result.operating.planFirst : copy.result.operating.improviseFirst;
  const social = result.coreScores.F4 >= 50 ? copy.result.operating.rechargeTogether : copy.result.operating.rechargeAlone;
  const expression = result.coreScores.F6 >= 50 ? copy.result.operating.expressDirectly : copy.result.operating.expressInLayers;
  return copy.result.operating.template
    .replace('{launch}', launch)
    .replace('{control}', control)
    .replace('{social}', social)
    .replace('{expression}', expression);
}

function strongestContributors(
  result: FacetResult,
  primaryDefinition: ArchetypeDefinition,
): CoreDimension[] {
  return [...CORE_DIMENSIONS]
    .sort((left, right) => {
      const leftAxis = CORE_DIMENSIONS.indexOf(left);
      const rightAxis = CORE_DIMENSIONS.indexOf(right);
      const leftContribution = Math.abs(
        result.coreScores[left] - LEVEL_VALUE[primaryDefinition.pattern[leftAxis]!],
      );
      const rightContribution = Math.abs(
        result.coreScores[right] - LEVEL_VALUE[primaryDefinition.pattern[rightAxis]!],
      );
      return leftContribution - rightContribution || Math.abs(result.coreScores[right] - 50) - Math.abs(result.coreScores[left] - 50);
    })
    .slice(0, 3);
}

function renderMeter(code: CoreDimension | 'W1' | 'W2', value: number, copy: LocaleCatalog): string {
  const dimension = copy.dimensions[code];
  return `
    <div class="score-row" data-dimension="${code}">
      <div class="score-heading">
        <h3><span>${code}</span>${escapeHtml(dimension.name)}</h3>
        <output aria-label="${escapeHtml(copy.result.scoreLabelTemplate.replace('{name}', dimension.name).replace('{score}', String(value)))}">${value}</output>
      </div>
      <meter min="0" max="100" value="${value}" aria-label="${escapeHtml(copy.result.scoreScaleAriaTemplate
        .replace('{name}', dimension.name)
        .replace('{score}', String(value))
        .replace('{low}', dimension.lowLabel)
        .replace('{high}', dimension.highLabel))}">${escapeHtml(copy.result.scoreOutOf100.replace('{score}', String(value)))}</meter>
      <div class="score-endpoints">
        <span><strong>${escapeHtml(dimension.lowLabel)}</strong>${escapeHtml(dimension.lowDescription)}</span>
        <span><strong>${escapeHtml(dimension.highLabel)}</strong>${escapeHtml(dimension.highDescription)}</span>
      </div>
    </div>
  `;
}

function adjacentDifference(
  primaryDefinition: ArchetypeDefinition,
  adjacentDefinition: ArchetypeDefinition,
  copy: LocaleCatalog,
): string {
  const differences = CORE_DIMENSIONS.filter(
    (_, index) => primaryDefinition.pattern[index] !== adjacentDefinition.pattern[index],
  );
  if (differences.length === 0) {
    return copy.result.adjacent.closeAcrossSeveralDimensions;
  }
  const names = differences.slice(0, 3).map((code) => copy.dimensions[code].name);
  return copy.result.adjacent.differentRoutesTemplate
    .replace('{dimensions}', names.join('、'));
}

export function renderResult(result: FacetResult, copy: LocaleCatalog, shareMessage = ''): string {
  const weather = copy.weather[result.weather.code];
  const primaryDefinition = getArchetypeDefinition(result.primary.code);
  const adjacentDefinition = getArchetypeDefinition(result.adjacent.code);
  const primaryCopy = copy.archetypes[result.primary.code];
  const adjacentCopy = copy.archetypes[result.adjacent.code];
  const contributors = strongestContributors(result, primaryDefinition);
  const clarityLabel = copy.clarity[result.clarity];

  return `
    <article class="screen screen--result" data-screen="result" data-clarity="${result.clarity}">
      <header class="result-cover">
        <div class="result-cover__meta">
          <span>${escapeHtml(copy.result.screenCode)}</span>
          <span>${escapeHtml(clarityLabel)}</span>
        </div>
        ${renderResultTitle(result, copy, clarityLabel, primaryCopy.name, adjacentCopy.name)}
        <p class="result-weather-chip">${result.weather.code} · ${escapeHtml(weather.name)}${result.weather.isBoundary ? ` · ${escapeHtml(copy.result.weatherBoundaryLabel)}` : ''}</p>
      </header>
      ${renderLocaleSwitcher(copy.meta.locale, copy)}

      <section class="result-hook" aria-labelledby="hook-title">
        <p class="section-number">${escapeHtml(copy.result.sectionProfile)}</p>
        <h2 id="hook-title">${escapeHtml(copy.result.profileTitle)}</h2>
        <p>${escapeHtml(primaryCopy.hook)}</p>
      </section>

      <section aria-labelledby="operation-title">
        <p class="section-number">${escapeHtml(copy.result.sectionOperating)}</p>
        <h2 id="operation-title">${escapeHtml(copy.result.operatingTitle)}</h2>
        <p>${escapeHtml(copy.result.operatingNotes)}</p>
        <p>${escapeHtml(operatingExplanation(result, copy))}</p>
      </section>

      <section class="score-lines" aria-labelledby="core-score-title">
        <p class="section-number">${escapeHtml(copy.result.sectionScores)}</p>
        <h2 id="core-score-title">${escapeHtml(copy.result.scoresTitle)}</h2>
        <p>${escapeHtml(copy.result.scoresLead)}</p>
        <div class="score-line-graphic" aria-hidden="true"></div>
        ${CORE_DIMENSIONS.map((code) => renderMeter(code, result.coreScores[code], copy)).join('')}
      </section>

      <section aria-labelledby="evidence-title">
        <p class="section-number">${escapeHtml(copy.result.sectionEvidence)}</p>
        <h2 id="evidence-title">${escapeHtml(copy.result.evidenceTitle)}</h2>
        <ol class="contributor-list">
          ${contributors.map((code) => {
            const score = result.coreScores[code];
            const dimension = copy.dimensions[code];
            const direction = score >= 50 ? dimension.highDescription : dimension.lowDescription;
            return `<li><strong>${code} · ${escapeHtml(dimension.name)} / ${score}</strong><span>${escapeHtml(direction)}</span></li>`;
          }).join('')}
        </ol>
      </section>

      <section aria-labelledby="adjacent-title">
        <p class="section-number">${escapeHtml(copy.result.sectionAdjacent)}</p>
        <h2 id="adjacent-title">${escapeHtml(copy.result.adjacentTitle)}：${escapeHtml(result.adjacent.code)} · ${escapeHtml(adjacentCopy.name)}</h2>
        <p>${escapeHtml(adjacentCopy.hook)}</p>
        <p>${escapeHtml(adjacentDifference(primaryDefinition, adjacentDefinition, copy))}</p>
      </section>

      <section class="weather-report" aria-labelledby="weather-title">
        <p class="section-number">${escapeHtml(copy.result.sectionRecent)}</p>
        <h2 id="weather-title">${escapeHtml(copy.result.weatherTitle)}：${result.weather.code} · ${escapeHtml(weather.name)}</h2>
        <p>${escapeHtml(weather.explanation)}</p>
        ${result.weather.isBoundary ? `<p class="boundary-status">${escapeHtml(copy.result.weatherBoundary)}</p>` : ''}
        ${STATE_DIMENSIONS.map((code) => renderMeter(code, result.stateScores[code], copy)).join('')}
      </section>

      <section class="strengths-and-pitfalls" aria-label="${escapeHtml(copy.result.strengthsAndPitfallsLabel)}">
        <div>
          <p class="section-number">${escapeHtml(copy.result.sectionStrengths)}</p>
          <h2>${escapeHtml(copy.result.strengthsTitle)}</h2>
          <ul>${primaryCopy.strengths.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
        </div>
        <div>
          <p class="section-number">${escapeHtml(copy.result.sectionPitfalls)}</p>
          <h2>${escapeHtml(copy.result.pitfallsTitle)}</h2>
          <ul>${primaryCopy.pitfalls.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
        </div>
      </section>

      <section aria-labelledby="relationship-title">
        <p class="section-number">${escapeHtml(copy.result.sectionRelationships)}</p>
        <h2 id="relationship-title">${escapeHtml(copy.result.relationshipsTitle)}</h2>
        <p>${escapeHtml(primaryCopy.relationshipNeed)}</p>
      </section>

      <section class="weekly-action" aria-labelledby="action-title">
        <p class="section-number">${escapeHtml(copy.result.sectionAction)}</p>
        <h2 id="action-title">${escapeHtml(copy.result.actionTitle)}</h2>
        <p>${escapeHtml(primaryCopy.action)}</p>
      </section>

      <section class="result-actions" aria-label="${escapeHtml(copy.result.actionsLabel)}">
        <button class="button button--primary" type="button" data-action="share">${escapeHtml(copy.result.share)}</button>
        <button class="button button--secondary" type="button" data-action="show-history">${escapeHtml(copy.result.history)}</button>
        <button class="button button--secondary" type="button" data-action="show-atlas">${escapeHtml(copy.result.atlas)}</button>
        <button class="text-action" type="button" data-action="retest-weather">${escapeHtml(copy.result.retestRecent)}</button>
        <button class="text-action" type="button" data-action="retest-all">${escapeHtml(copy.result.retestAll)}</button>
        <p class="inline-notice" role="status" aria-live="polite" data-share-status>${escapeHtml(shareMessage)}</p>
      </section>

      <footer class="result-disclaimer">
        <strong>${escapeHtml(copy.result.disclaimerTitle)}</strong>
        <p>${escapeHtml(copy.result.disclaimer)}</p>
      </footer>
    </article>
  `;
}
