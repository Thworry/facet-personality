import { getLegacyArchetypeCopy } from '../../data/archetypes';
import { BALANCED_STANDOUT, DIMENSION_COPY, WEATHER_COPY } from '../../data/copy';
import type { FacetResult, StandoutResult } from '../../types';
import { escapeHtml } from '../html';

function getLegacyStandoutLabel(standout: StandoutResult): string {
  if (standout.dimension === 'BALANCED') {
    return BALANCED_STANDOUT.label;
  }

  const copy = DIMENSION_COPY[standout.dimension];
  if (standout.direction === 'low') {
    return copy.lowLabel;
  }
  if (standout.direction === 'high') {
    return copy.highLabel;
  }
  throw new Error(`Invalid standout direction for ${standout.dimension}: ${standout.direction}`);
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '日期未知';
  }
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function renderHistory(history: readonly FacetResult[]): string {
  return `
    <div class="screen screen--history" data-screen="history">
      <header class="screen-header">
        <button class="text-action" type="button" data-action="back">← 返回</button>
        <span class="screen-code">FCT / LOCAL ARCHIVE</span>
      </header>
      <section aria-labelledby="screen-title">
        <p class="eyebrow">最多保留三次，仅在此浏览器</p>
        <h1 id="screen-title" tabindex="-1">本地历史</h1>
        <p>结果和进度没有上传。清除后无法从服务器找回，因为这里没有服务器账号。</p>
      </section>

      ${history.length === 0 ? `
        <section class="empty-history" aria-labelledby="empty-title">
          <h2 id="empty-title">档案里还没有结果</h2>
          <p>完成一次测试后，最近三次结果会按时间倒序出现在这里。</p>
          <button class="button button--primary" type="button" data-action="retest-all">开始一次测试</button>
        </section>
      ` : `
        <ol class="history-list">
          ${history.slice(0, 3).map((result) => {
            const weather = WEATHER_COPY[result.weather.code];
            const primaryCopy = getLegacyArchetypeCopy(result.primary.code);
            const standoutLabel = getLegacyStandoutLabel(result.standout);
            const title = result.clarity === 'free' ? 'FREE · 自由切面' : `${result.primary.code} · ${primaryCopy.name}`;
            return `
              <li>
                <article data-result-id="${escapeHtml(result.id)}">
                  <time datetime="${escapeHtml(result.createdAt)}">${escapeHtml(formatDate(result.createdAt))}</time>
                  <h2>${escapeHtml(title)}</h2>
                  <p>${result.weather.code} · ${escapeHtml(weather.name)} · ${escapeHtml(standoutLabel)}</p>
                  <button class="button button--secondary" type="button" data-action="open-result" data-result-id="${escapeHtml(result.id)}">打开这次结果</button>
                </article>
              </li>
            `;
          }).join('')}
        </ol>
      `}

      <section class="data-controls" aria-labelledby="data-title">
        <h2 id="data-title">本地数据</h2>
        <button class="button button--danger" type="button" data-action="request-clear">清除我的全部本地数据</button>
        <p role="status" aria-live="polite" data-history-status></p>
      </section>

      <dialog id="clear-data-dialog" aria-labelledby="clear-dialog-title">
        <h2 id="clear-dialog-title">确认清除？</h2>
        <p>这会立即删除未完成进度和最多三条历史结果，且无法恢复。</p>
        <div class="dialog-actions">
          <button class="button button--danger" type="button" data-action="confirm-clear">确认清除</button>
          <button class="button button--secondary" type="button" data-action="cancel-clear">暂不清除</button>
        </div>
      </dialog>
    </div>
  `;
}
