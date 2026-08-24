import { getArchetypeDefinition, getLegacyArchetypeCopy } from '../../data/archetypes';
import { CORE_DIMENSIONS, DIMENSION_COPY, STATE_DIMENSIONS, WEATHER_COPY } from '../../data/copy';
import type {
  Archetype,
  ArchetypeDefinition,
  CoreDimension,
  FacetResult,
  Level,
} from '../../types';
import { escapeHtml } from '../html';

const LEVEL_VALUE: Readonly<Record<Level, number>> = { L: 25, M: 50, H: 75 };

const CLARITY_COPY = {
  dual: '双切面',
  leaning: '偏向第一切面',
  clear: '第一切面较清晰',
  free: '自由切面',
} as const;

function renderResultTitle(
  result: FacetResult,
  primaryCopy: Archetype,
  adjacentCopy: Archetype,
): string {
  if (result.clarity === 'free') {
    return `
      <h1 id="screen-title" tabindex="-1">自由切面</h1>
      <p class="facet-references">最近的两个参考：<strong>${escapeHtml(result.primary.code)} · ${escapeHtml(primaryCopy.name)}</strong> 与 <strong>${escapeHtml(result.adjacent.code)} · ${escapeHtml(adjacentCopy.name)}</strong></p>
    `;
  }
  if (result.clarity === 'dual') {
    return `
      <h1 id="screen-title" class="dual-facet-title" tabindex="-1">
        <span>${escapeHtml(result.primary.code)} · ${escapeHtml(primaryCopy.name)}</span>
        <span aria-hidden="true">×</span>
        <span>${escapeHtml(result.adjacent.code)} · ${escapeHtml(adjacentCopy.name)}</span>
      </h1>
    `;
  }
  return `<h1 id="screen-title" tabindex="-1"><span class="facet-code">${escapeHtml(result.primary.code)}</span><span class="facet-name">${escapeHtml(primaryCopy.name)}</span></h1>`;
}

function operatingExplanation(result: FacetResult): string {
  const launch = result.coreScores.F2 >= 50 ? '更容易在压力真正到来前先启动' : '更容易等期限、压力或回应把行动点亮';
  const control = result.coreScores.F3 >= 50 ? '先搭路线，再根据变化重排' : '先进入现场，再一边走一边改线';
  const social = result.coreScores.F4 >= 50 ? '互动通常能给你补充能量' : '独处通常更能让你恢复电量';
  const expression = result.coreScores.F6 >= 50 ? '重要分歧倾向及时说明' : '表达时会看对象、时机和留白';
  return `你${launch}；处理变化时倾向${control}。${social}，而且${expression}。这些是更常见的路线，不是每个场景都必须照此运行。`;
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

function renderMeter(code: CoreDimension | 'W1' | 'W2', value: number): string {
  const copy = DIMENSION_COPY[code];
  return `
    <div class="score-row" data-dimension="${code}">
      <div class="score-heading">
        <h3><span>${code}</span>${escapeHtml(copy.name)}</h3>
        <output aria-label="${escapeHtml(copy.name)}得分">${value}</output>
      </div>
      <meter min="0" max="100" value="${value}" aria-label="${escapeHtml(copy.name)}：${value} 分，0 分接近${escapeHtml(copy.lowLabel)}，100 分接近${escapeHtml(copy.highLabel)}">${value} / 100</meter>
      <div class="score-endpoints">
        <span><strong>${escapeHtml(copy.lowLabel)}</strong>${escapeHtml(copy.lowDescription)}</span>
        <span><strong>${escapeHtml(copy.highLabel)}</strong>${escapeHtml(copy.highDescription)}</span>
      </div>
    </div>
  `;
}

function adjacentDifference(
  primaryDefinition: ArchetypeDefinition,
  adjacentDefinition: ArchetypeDefinition,
): string {
  const differences = CORE_DIMENSIONS.filter(
    (_, index) => primaryDefinition.pattern[index] !== adjacentDefinition.pattern[index],
  );
  const named = differences.slice(0, 3).map((code) => DIMENSION_COPY[code].name);
  if (named.length === 0) {
    return '两个原型的距离非常接近，差异主要来自多个维度的小幅组合。';
  }
  return `它们主要在${named.join('、')}上采用不同路线。相邻切面不是备选答案，而是你在不同情境下可能更常显露的另一种组织方式。`;
}

export function renderResult(result: FacetResult, shareMessage = ''): string {
  const weather = WEATHER_COPY[result.weather.code];
  const primaryDefinition = getArchetypeDefinition(result.primary.code);
  const adjacentDefinition = getArchetypeDefinition(result.adjacent.code);
  const primaryCopy = getLegacyArchetypeCopy(result.primary.code);
  const adjacentCopy = getLegacyArchetypeCopy(result.adjacent.code);
  const contributors = strongestContributors(result, primaryDefinition);

  return `
    <article class="screen screen--result" data-screen="result" data-clarity="${result.clarity}">
      <header class="result-cover">
        <div class="result-cover__meta">
          <span>FACET / RESULT</span>
          <span>${escapeHtml(CLARITY_COPY[result.clarity])}</span>
        </div>
        ${renderResultTitle(result, primaryCopy, adjacentCopy)}
        <p class="result-weather-chip">${result.weather.code} · ${escapeHtml(weather.name)}${result.weather.isBoundary ? ' · 天气正在交界' : ''}</p>
      </header>

      <section class="result-hook" aria-labelledby="hook-title">
        <p class="section-number">01 / FIRST SIGNAL</p>
        <h2 id="hook-title">${escapeHtml(primaryCopy.hook)}</h2>
      </section>

      <section aria-labelledby="operation-title">
        <p class="section-number">02 / HOW YOU RUN</p>
        <h2 id="operation-title">你的日常运行说明</h2>
        <p>${escapeHtml(operatingExplanation(result))}</p>
      </section>

      <section class="score-lines" aria-labelledby="core-score-title">
        <p class="section-number">03 / SIX CORE LINES</p>
        <h2 id="core-score-title">六维线路图</h2>
        <p>分数表示你在这条连续轴上的位置，两端都不是优劣。线路图只是装饰，下面的数值和文字是完整解释。</p>
        <div class="score-line-graphic" aria-hidden="true"></div>
        ${CORE_DIMENSIONS.map((code) => renderMeter(code, result.coreScores[code])).join('')}
      </section>

      <section aria-labelledby="evidence-title">
        <p class="section-number">04 / WHY THIS FACET</p>
        <h2 id="evidence-title">为什么是它</h2>
        <ol class="contributor-list">
          ${contributors.map((code) => {
            const score = result.coreScores[code];
            const copy = DIMENSION_COPY[code];
            const direction = score >= 50 ? copy.highDescription : copy.lowDescription;
            return `<li><strong>${code} · ${escapeHtml(copy.name)} / ${score}</strong><span>${escapeHtml(direction)}</span></li>`;
          }).join('')}
        </ol>
      </section>

      <section aria-labelledby="adjacent-title">
        <p class="section-number">05 / ADJACENT FACET</p>
        <h2 id="adjacent-title">相邻切面：${escapeHtml(result.adjacent.code)} · ${escapeHtml(adjacentCopy.name)}</h2>
        <p>${escapeHtml(adjacentCopy.hook)}</p>
        <p>${escapeHtml(adjacentDifference(primaryDefinition, adjacentDefinition))}</p>
      </section>

      <section class="weather-report" aria-labelledby="weather-title">
        <p class="section-number">06 / LAST TWO WEEKS</p>
        <h2 id="weather-title">当前天气：${result.weather.code} · ${escapeHtml(weather.name)}</h2>
        <p>${escapeHtml(weather.explanation)}</p>
        ${result.weather.isBoundary ? '<p class="boundary-status">天气正在交界：有一个近期信号靠近分界线，49 和 50 不代表两种完全不同的状态。</p>' : ''}
        ${STATE_DIMENSIONS.map((code) => renderMeter(code, result.stateScores[code])).join('')}
      </section>

      <section class="strengths-and-pitfalls" aria-label="优势与容易翻车的地方">
        <div>
          <p class="section-number">07 / STRENGTHS</p>
          <h2>你常带来的优势</h2>
          <ul>${primaryCopy.strengths.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
        </div>
        <div>
          <p class="section-number">08 / WATCH OUT</p>
          <h2>容易翻车的地方</h2>
          <ul>${primaryCopy.pitfalls.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
        </div>
      </section>

      <section aria-labelledby="relationship-title">
        <p class="section-number">09 / WITH OTHERS</p>
        <h2 id="relationship-title">关系中的使用说明</h2>
        <p>${escapeHtml(primaryCopy.relationshipNeed)}</p>
      </section>

      <section class="weekly-action" aria-labelledby="action-title">
        <p class="section-number">10 / THIS WEEK</p>
        <h2 id="action-title">本周可以试一次</h2>
        <p>${escapeHtml(primaryCopy.action)}</p>
      </section>

      <section class="result-actions" aria-label="结果操作">
        <button class="button button--primary" type="button" data-action="share">生成本地分享卡</button>
        <button class="button button--secondary" type="button" data-action="show-history">查看本地历史</button>
        <button class="button button--secondary" type="button" data-action="show-atlas">查看十二原型</button>
        <button class="text-action" type="button" data-action="retest-weather">只重测最近两周</button>
        <button class="text-action" type="button" data-action="retest-all">重新完成全部 32 题</button>
        <p class="inline-notice" role="status" aria-live="polite" data-share-status>${escapeHtml(shareMessage)}</p>
      </section>

      <footer class="result-disclaimer">
        <strong>娱乐与自我观察用途</strong>
        <p>FACET 不是经过同行评议的心理量表，不用于诊断、招聘、职业选择或关系判决。当前天气只描述最近两周，也会随生活变化。</p>
      </footer>
    </article>
  `;
}
