import { defineConfig, devices } from '@playwright/test'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * Playwright config — LZR template web-next.
 *
 * Princípios LZR:
 *   - Suite ENXUTA: smoke + critical do produto, sem cobertura ampla.
 *   - Anti-flakiness: retries em CI, locator-based, timeouts generosos.
 *   - Storage state reuso: login feito 1x no globalSetup; specs herdam sessão.
 *   - Chromium-only no MVP (Firefox/WebKit quando necessário pra economizar CI).
 *
 * Como rodar:
 *   pnpm test:e2e         — headless, paralelo
 *   pnpm test:e2e:ui      — UI interativa (debug visual)
 *   pnpm test:e2e:debug   — modo headed + debugger
 *   pnpm test:e2e:install — instala Chromium (uma vez)
 *
 * Adapte:
 *   - globalSetup: copie e2e/fixtures/global-setup.ts.example → global-setup.ts
 *   - critical/login.spec: copie e2e/critical/login.spec.ts.example → login.spec.ts
 *   - Adicione critical/<sua-feature>.spec.ts pro fluxo crítico do seu produto
 */

// Carrega .env.local manualmente (Next carrega só no webServer; processo do Playwright não veria
// E2E_USER_EMAIL/E2E_USER_PASSWORD sem isso). Parser inline sem dep nova.
function loadEnvLocal() {
  const envPath = path.join(__dirname, '.env.local')
  if (!existsSync(envPath)) return
  const content = readFileSync(envPath, 'utf8')
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = value
  }
}
loadEnvLocal()

// Onde guardar a sessão autenticada reutilizada pelas specs.
const STORAGE_STATE_PATH = path.join(__dirname, 'e2e', '.auth', 'storage-state.json')

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'
const isCI = !!process.env.CI

// globalSetup só existe quando o consumidor adapta o .example.
// Detectar dinamicamente evita erro "Cannot find file" antes da adaptação.
const GLOBAL_SETUP_PATH = path.join(__dirname, 'e2e', 'fixtures', 'global-setup.ts')
const hasGlobalSetup = existsSync(GLOBAL_SETUP_PATH)

export default defineConfig({
  testDir: './e2e',
  // Apenas .spec.ts dentro de e2e/. Unit tests (vitest) ficam em src/.
  testMatch: /.*\.spec\.ts$/,

  // Timeouts generosos pra absorver cold start de Next + APIs externas.
  timeout: 30_000,
  expect: { timeout: 10_000 },

  // CI: paralelismo controlado pra não saturar runner; local: full speed.
  workers: isCI ? 2 : undefined,
  fullyParallel: true,

  // CI retry 2 vezes em flake; local 0 pra detectar testes não-determinísticos cedo.
  retries: isCI ? 2 : 0,

  // Falha o build se houver .only commitado (não vaza foco entre PRs).
  forbidOnly: isCI,

  reporter: isCI
    ? [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]]
    : [['list']],

  use: {
    baseURL: BASE_URL,
    // Captura trace só em retry — economiza tempo/espaço, mas debug é fácil quando precisa.
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },

  ...(hasGlobalSetup ? { globalSetup: './e2e/fixtures/global-setup.ts' } : {}),

  projects: [
    // Specs de smoke rodam SEM autenticação (testa redirect, página pública).
    {
      name: 'smoke',
      testMatch: /smoke\/.*\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], storageState: { cookies: [], origins: [] } },
    },
    // Specs críticas usam storage state autenticado (gerado pelo globalSetup quando existir).
    {
      name: 'critical',
      testMatch: /critical\/.*\.spec\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        ...(hasGlobalSetup ? { storageState: STORAGE_STATE_PATH } : {}),
      },
    },
  ],

  // Sobe o app automaticamente antes dos testes. CI usa build prod (mais rápido + realista);
  // local usa dev pra hot-reload entre runs.
  webServer: {
    command: isCI ? 'pnpm start' : 'pnpm dev',
    url: BASE_URL,
    reuseExistingServer: !isCI,
    timeout: 180_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
})
