import type { Locale, LocaleCatalog } from '../../i18n/types';
import { escapeHtml } from '../html';

export function renderLocaleSwitcher(locale: Locale, copy: LocaleCatalog): string {
  const chinesePressed = locale === 'zh-CN';
  const englishPressed = locale === 'en';

  return `
    <div class="locale-switcher" role="group" aria-label="${escapeHtml(copy.localeSwitcher.label)}">
      <button class="locale-switcher__button" type="button" data-action="set-locale" data-locale="zh-CN" aria-pressed="${chinesePressed}">${escapeHtml(copy.localeSwitcher.chinese)}</button>
      <button class="locale-switcher__button" type="button" data-action="set-locale" data-locale="en" aria-pressed="${englishPressed}">${escapeHtml(copy.localeSwitcher.english)}</button>
      <p class="sr-only" aria-live="polite" aria-atomic="true" data-locale-status></p>
    </div>
  `;
}
