/**
 * @repo/eslint-config
 * Shared ESLint configuration
 * Project conventions
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
      // === TypeScript Strict (Zero any) ===
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-non-null-assertion': 'error',

      // === Code quality ===
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-empty-catch': 'off',
      'no-useless-catch': 'error',
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
      'no-var': 'error',

      // Why: ESLint's core no-unused-vars rule comes from js.configs.recommended
      // and ignores the `argsIgnorePattern: ^_` that @typescript-eslint sets up.
      // Since the TS-specific rule (which respects `^_`) is active, we turn the
      // core one off to avoid duplication and false positives in typed code.
      'no-unused-vars': 'off',
    },
  },
]

/** Extra configuration for React/Next.js projects */
export const react = [
  ...base,
  {
    // Why: globals.browser covers window, document, fetch etc. (client side).
    // globals.node covers process, Buffer (server components / SSR).
    // Without this, any use of those globals triggers no-undef.
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.{tsx,jsx}'],
    // Why: the `react/*` rules below require the plugin to be registered. Without
    // this, ESLint fails with "Could not find plugin 'react' in configuration".
    plugins: { react: reactPlugin },
    rules: {
      // Server Components by default
      'react/jsx-no-target-blank': 'error',
      'react/self-closing-comp': 'error',
    },
  },
]

/** Extra configuration for Node/API projects */
export const node = [
  ...base,
  {
    // Why: globals.node covers process, Buffer, console etc. so that
    // server-side code does not trigger no-undef.
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.ts'],
    rules: {
      // No hardcoded values
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
