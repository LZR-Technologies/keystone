// The foundation files every project is born with: a translation hub and
// locale-aware formatting. Generated in the project's starting language.
// See docs/fundacao.md (items 3 and 4).

import type { ProductBriefing } from '../types.ts';

export interface ScaffoldFile {
  /** Path relative to the project root. Subfolders are created as needed. */
  path: string;
  content: string;
}

/**
 * Map a starting language to a locale, a default currency and a greeting.
 * These drive the locale-aware formatting and the first translated message.
 * Unknown languages fall back to English so generation never fails.
 */
const LOCALE_BY_LANGUAGE: Record<string, { locale: string; currency: string; greeting: string }> = {
  pt: { locale: 'pt-BR', currency: 'BRL', greeting: 'Olá' },
  en: { locale: 'en-US', currency: 'USD', greeting: 'Hello' },
  es: { locale: 'es-ES', currency: 'EUR', greeting: 'Hola' },
};

export function localeFor(language: string): { locale: string; currency: string; greeting: string } {
  return LOCALE_BY_LANGUAGE[language] ?? LOCALE_BY_LANGUAGE.en;
}

function formatModule(locale: string, currency: string): string {
  // Uses the platform's Intl — no dependency, correct per country.
  return `// Locale-aware formatting. Born with the project so dates, money and numbers
// always render in the user's country format — no manual formatting. See docs/fundacao.md.

const LOCALE = '${locale}';
const DEFAULT_CURRENCY = '${currency}';

export function formatDate(value: Date): string {
  return new Intl.DateTimeFormat(LOCALE).format(value);
}

export function formatMoney(value: number, currency: string = DEFAULT_CURRENCY): string {
  return new Intl.NumberFormat(LOCALE, { style: 'currency', currency }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(LOCALE).format(value);
}
`;
}

function i18nModule(language: string, greeting: string): string {
  // Every user-facing string goes through here, never hard-coded — so the
  // project can grow to more languages without rework. See docs/fundacao.md.
  return `// Translation hub. User-facing strings live here, never hard-coded in screens,
// so the project can grow to more languages without rework. See docs/fundacao.md.

type Messages = Record<string, string>;

const messages: Record<string, Messages> = {
  '${language}': {
    welcome: '${greeting}',
  },
};

let current = '${language}';

export function setLanguage(language: string): void {
  current = language;
}

/** Translate a key into the current language; falls back to the key itself. */
export function t(key: string): string {
  return messages[current]?.[key] ?? key;
}
`;
}

/** The foundation files for a project, in its starting language. */
export function foundationFiles(product: ProductBriefing): ScaffoldFile[] {
  const { locale, currency, greeting } = localeFor(product.language);
  return [
    { path: 'src/lib/format.ts', content: formatModule(locale, currency) },
    { path: 'src/lib/i18n.ts', content: i18nModule(product.language, greeting) },
  ];
}
