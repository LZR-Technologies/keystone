/**
 * @lzr/eslint-config
 * Configuração ESLint compartilhada da LZR Technologies
 * Baseada no Engineering Handbook: https://code.lzrtechnologies.com
 */

import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import importPlugin from 'eslint-plugin-import'
import reactPlugin from 'eslint-plugin-react'
import globals from 'globals'

/** @type {import('eslint').Linter.Config[]} */
export const base = [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: true,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
    },
    rules: {
      // === TypeScript Strict (Handbook: Zero any) ===
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports' },
      ],
      '@typescript-eslint/no-non-null-assertion': 'error',

      // === Qualidade de código (Handbook) ===
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-empty-catch': 'off',
      'no-useless-catch': 'error',
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
      'no-var': 'error',

      // Why: a regra core no-unused-vars do ESLint vem via js.configs.recommended
      // e ignora `argsIgnorePattern: ^_` que o @typescript-eslint configura.
      // Como temos a regra TS-específica ativa (que respeita `^_`), desligamos
      // a core para evitar duplicação e false positives em código tipado.
      'no-unused-vars': 'off',
    },
  },
]

/** Configuração extra para projetos React/Next.js */
export const react = [
  ...base,
  {
    // Why: globals.browser cobre window, document, fetch etc. (client side).
    // globals.node cobre process, Buffer (server components / SSR).
    // Sem isso, qualquer uso desses globais vira no-undef.
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.{tsx,jsx}'],
    // Why: as regras `react/*` abaixo exigem o plugin registrado. Sem isso,
    // ESLint falha com "Could not find plugin 'react' in configuration".
    plugins: { react: reactPlugin },
    rules: {
      // Handbook: Server Components por padrão
      'react/jsx-no-target-blank': 'error',
      'react/self-closing-comp': 'error',
    },
  },
]

/** Configuração extra para projetos Node/API */
export const node = [
  ...base,
  {
    // Why: globals.node cobre process, Buffer, console etc. para que
    // server-side code não dispare no-undef.
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.ts'],
    rules: {
      // Handbook: No hardcoded values
      'no-magic-numbers': [
        'warn',
        {
          ignore: [0, 1, -1],
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
        },
      ],
    },
  },
]

export default base
