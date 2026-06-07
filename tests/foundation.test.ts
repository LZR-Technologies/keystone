// Tests for the foundation scaffold: locale mapping and generated files.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { localeFor, foundationFiles } from '../src/scaffold/foundation.ts';
import type { ProductBriefing } from '../src/types.ts';

function product(language: string): ProductBriefing {
  return { name: 'demo', type: 'site', language, screen: 'both', look: 'later', sensitive: false };
}

test('localeFor: maps known languages to locale and currency', () => {
  assert.equal(localeFor('pt').locale, 'pt-BR');
  assert.equal(localeFor('pt').currency, 'BRL');
  assert.equal(localeFor('en').locale, 'en-US');
  assert.equal(localeFor('es').currency, 'EUR');
});

test('localeFor: unknown language falls back to English (never fails)', () => {
  assert.equal(localeFor('xx').locale, 'en-US');
});

test('foundationFiles: generates format and i18n in the project language', () => {
  const files = foundationFiles(product('pt'));
  assert.deepEqual(
    files.map((f) => f.path),
    ['src/lib/format.ts', 'src/lib/i18n.ts'],
  );

  const format = files.find((f) => f.path.endsWith('format.ts'));
  assert.ok(format);
  assert.match(format.content, /pt-BR/);
  assert.match(format.content, /BRL/);

  const i18n = files.find((f) => f.path.endsWith('i18n.ts'));
  assert.ok(i18n);
  assert.match(i18n.content, /Olá/);
});
