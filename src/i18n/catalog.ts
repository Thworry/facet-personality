/// <reference types="vite/client" />

import { en } from './locales/en';
import { zhCN } from './locales/zh-CN';
import type { Locale, LocaleCatalog } from './types';

export const CATALOGS = {
  'zh-CN': zhCN,
  en,
} as const satisfies Record<Locale, LocaleCatalog>;

export function getCatalog(locale: Locale): LocaleCatalog {
  const catalog = CATALOGS[locale];
  if (import.meta.env.DEV && catalog === undefined) {
    throw new Error(`Missing FACET locale catalog: ${locale}`);
  }
  return catalog;
}
