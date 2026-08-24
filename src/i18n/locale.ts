import type { Locale } from './types';

export const LOCALE_KEY = 'facet:v1:locale';

export function isLocale(value: unknown): value is Locale {
  return value === 'zh-CN' || value === 'en';
}

export function detectLocale(storage: Storage, languages: readonly string[]): Locale {
  try {
    const storedLocale = storage.getItem(LOCALE_KEY);
    if (isLocale(storedLocale)) {
      return storedLocale;
    }
  } catch {
    // Storage availability must not prevent an in-memory language choice.
  }

  for (const language of languages) {
    const normalized = language.toLowerCase();
    if (normalized === 'zh' || normalized.startsWith('zh-')) {
      return 'zh-CN';
    }
    if (normalized === 'en' || normalized.startsWith('en-')) {
      return 'en';
    }
  }

  return 'en';
}

export function saveLocale(locale: Locale, storage: Storage): boolean {
  try {
    storage.setItem(LOCALE_KEY, locale);
    return true;
  } catch {
    return false;
  }
}
