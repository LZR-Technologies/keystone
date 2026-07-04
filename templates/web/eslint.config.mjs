import { react } from '@repo/eslint-config'
import nextPlugin from '@next/eslint-plugin-next'
import jsxA11y from 'eslint-plugin-jsx-a11y'

export default [
  ...react,
  // Layer C — accessibility as a hard, static gate. jsx-a11y's recommended set catches the
  // structural accessibility mistakes at lint time: missing alt text, invalid ARIA, a label with no
  // control, a click handler with no keyboard path. Contrast and other checks that need a real
  // render are covered separately by the axe pass in the E2E suite (e2e/smoke/accessibility.spec.ts).
  jsxA11y.flatConfigs.recommended,
  {
    // Why: the shared @repo/eslint-config serves both the web and the api template,
    // so the Next-only plugin is registered here, at the web template's own config,
    // instead of polluting the shared package. Registering it removes Next's
    // build warning ("plugin not detected") and turns on Next's own checks
    // (no-img-element, no-sync-scripts, core web vitals) for generated web apps.
    name: 'next',
    plugins: { '@next/next': nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
  {
    ignores: [
      '.next/',
      'node_modules/',
      'coverage/',
      'out/',
      'test-results/',
      'playwright-report/',
    ],
  },
]
