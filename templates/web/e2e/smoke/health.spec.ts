import { test, expect } from '@playwright/test'

/**
 * Smoke tests — validam que o app sobe e responde básico.
 * Não dependem de autenticação (project: smoke usa storageState vazio).
 *
 * Se este falha, NADA mais funciona — bloqueia merge cedo.
 *
 * Adicione AQUI específicos do seu produto conforme implementa rotas públicas:
 *   - /pricing renderiza? /about responde 200?
 *   - rota autenticada sem sessão redireciona pra landing?
 *   - landing tem CTA principal visível?
 *
 * Mantenha o smoke ENXUTO: 3-5 testes max. O fluxo crítico vai em e2e/critical/.
 */

test.describe('Health checks', () => {
  test('landing page (/) retorna 200 e renderiza', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.status()).toBeLessThan(400)
    // Body precisa ter conteúdo — guarda contra "página em branco" silenciosa
    await expect(page.locator('body')).not.toBeEmpty()
  })
})
