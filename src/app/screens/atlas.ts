import { ARCHETYPES } from '../../data/archetypes';
import { escapeHtml } from '../html';

export function renderAtlas(): string {
  const archetypes = [...ARCHETYPES].sort((left, right) => left.code.localeCompare(right.code));
  return `
    <div class="screen screen--atlas" data-screen="atlas">
      <header class="screen-header">
        <button class="text-action" type="button" data-action="back">← 返回</button>
        <span class="screen-code">FCT / ATLAS</span>
      </header>
      <section aria-labelledby="screen-title">
        <p class="eyebrow">十二种运行模板</p>
        <h1 id="screen-title" tabindex="-1">人格切面图鉴</h1>
        <p>这些是解释连续维度的参考坐标，不是等级、稀有度或固定身份。</p>
      </section>
      <ol class="atlas-index">
        ${archetypes.map((archetype, index) => `
          <li>
            <article data-archetype="${escapeHtml(archetype.code)}">
              <header>
                <span>${String(index + 1).padStart(2, '0')}</span>
                <p>${escapeHtml(archetype.code)} / ${archetype.pattern.join('')}</p>
                <h2>${escapeHtml(archetype.name)}</h2>
              </header>
              <p>${escapeHtml(archetype.hook)}</p>
              <dl>
                <div><dt>常带来的优势</dt><dd>${escapeHtml(archetype.strengths[0])}</dd></div>
                <div><dt>容易翻车</dt><dd>${escapeHtml(archetype.pitfalls[0])}</dd></div>
              </dl>
            </article>
          </li>
        `).join('')}
      </ol>
      <button class="button button--secondary" type="button" data-action="back">返回上一页</button>
    </div>
  `;
}
