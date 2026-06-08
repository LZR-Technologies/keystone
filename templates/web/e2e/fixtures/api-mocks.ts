import type { Page } from '@playwright/test'

/**
 * Helpers de mock pra APIs externas — evita E2E batendo em serviços reais
 * (BrasilAPI, Resend, Hostinger, etc.) durante os testes.
 *
 * Uso típico em specs:
 *   import { mockBrasilAPI } from '../fixtures/api-mocks'
 *   test('cria empresa', async ({ page }) => {
 *     await mockBrasilAPI(page, { razao_social: 'ACME LTDA' })
 *     // ...
 *   })
 *
 * Não mocka Supabase — esse SIM bate no projeto dev real (vzolthievrzhtejwihfp)
 * pra validar RLS e schema. Pra isolar, configurar projeto dedicado de teste no futuro.
 */

interface BrasilAPIData {
  razao_social?: string
  nome_fantasia?: string
  email?: string
  telefone?: string
  logradouro?: string
  bairro?: string
  cep?: string
  municipio?: string
  uf?: string
}

/**
 * Intercepta chamadas pra BrasilAPI CNPJ — retorna payload mockado.
 * Útil pra specs que cadastram empresa sem depender de CNPJ real ativo.
 */
export async function mockBrasilAPI(page: Page, data: BrasilAPIData = {}): Promise<void> {
  await page.route('**/brasilapi.com.br/api/cnpj/v1/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        cnpj: '00000000000191',
        razao_social: 'ACME LTDA',
        nome_fantasia: 'ACME',
        situacao_cadastral: 2,
        data_situacao_cadastral: '2020-01-01',
        descricao_situacao_cadastral: 'ATIVA',
        ...data,
      }),
    })
  })
}

/**
 * Intercepta envios de e-mail (Resend). Útil pra specs de signup/recovery
 * sem disparar e-mails reais.
 */
export async function mockResend(page: Page, response: { id?: string } = {}): Promise<void> {
  await page.route('**/api.resend.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: response.id ?? 'mock-email-id', ...response }),
    })
  })
}

/**
 * Intercepta chamadas pra Hostinger (DNS, VPS). Mock genérico — adicionar
 * variantes conforme specs forem precisando.
 */
export async function mockHostinger(page: Page): Promise<void> {
  await page.route('**/developers.hostinger.com/api/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'ok' }),
    })
  })
}
