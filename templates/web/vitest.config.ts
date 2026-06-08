import { defineConfig, configDefaults } from 'vitest/config'

/**
 * Vitest config mínimo — escopo é só excluir e2e/ do discovery.
 *
 * Playwright E2E vive em e2e/ e roda separado (pnpm test:e2e). Sem essa
 * exclusão, Vitest tenta interpretar specs com test.describe do Playwright
 * (incompatíveis) e quebra o `pnpm test`.
 *
 * Cada projeto que adotar o template pode adicionar environment ('jsdom'),
 * globals, coverage, etc. — instale jsdom como devDep antes.
 */
export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
})
