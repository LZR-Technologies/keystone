# E2E — Playwright (padrão LZR)

Fundação Playwright pronta pra adotar em qualquer projeto LZR Next.js. Cobre setup, CI, padrões anti-flakiness, autenticação reusada via storage state.

## Filosofia

**Suite enxuta, não pretensiosa.** Cobertura ampla é responsabilidade de testes unitários (Vitest). Aqui ficam só:

- **Smoke** (`e2e/smoke/`) — app sobe, landing renderiza, redirects básicos. Sem autenticação.
- **Critical** (`e2e/critical/`) — fluxos principais do produto autenticado. Reusa sessão via `storageState`.

Cobertura ampla só quando uma feature **complexa** entra (signing flow, multi-step wizard). Não tentar cobrir 100% — mantém suite rodando rápido e sem flaky.

## Estrutura

```
e2e/
├── README.md                              ← este arquivo
├── fixtures/
│   ├── api-mocks.ts                       ← helpers de mock de APIs externas (BrasilAPI, Resend, Hostinger)
│   └── global-setup.ts.example            ← ADAPTAR: login flow do seu projeto
├── smoke/
│   └── health.spec.ts                     ← landing /200 — adicione mais conforme implementa
└── critical/
    └── login.spec.ts.example              ← ADAPTAR: rotas autenticadas do seu projeto
```

## Adoção em projeto novo

### 1. Já vem montado

Este template já inclui `playwright.config.ts`, `.github/workflows/e2e.yml`, scripts no `package.json`, `.gitignore` ajustado. Funciona out-of-the-box pro smoke (landing /200).

### 2. Configurar credenciais (quando tiver auth)

Crie `.env.local` na raiz:

```bash
E2E_USER_EMAIL=user-teste@example.com
E2E_USER_PASSWORD=<senha do user de teste>
# Opcional:
# E2E_BASE_URL=http://localhost:3000
```

E configure GitHub Secrets pra CI:
```bash
gh secret set E2E_USER_EMAIL --repo <owner>/<repo>
gh secret set E2E_USER_PASSWORD --repo <owner>/<repo>
```

### 3. Adaptar global-setup

```bash
mv e2e/fixtures/global-setup.ts.example e2e/fixtures/global-setup.ts
```

Edite o arquivo. Os marcadores `[TODO]` indicam onde ajustar:
- `page.goto(...)` — rota do login
- Seletores dos inputs (use `getByLabel` se tem `htmlFor`; `getByPlaceholder` se não)
- `page.waitForURL(...)` — padrão de URL pós-login do seu app

> O `playwright.config.ts` detecta se o `global-setup.ts` existe e ativa `globalSetup` automaticamente. Sem ele, só smoke roda.

### 4. Adaptar login.spec

```bash
mv e2e/critical/login.spec.ts.example e2e/critical/login.spec.ts
```

Ajuste as rotas protegidas. Se ainda não tem auth, mantenha como `.example` (Playwright ignora).

### 5. Adicionar specs do fluxo crítico do seu produto

Crie `e2e/critical/<feature>.spec.ts` cobrindo o caminho mais usado. Exemplo (Green Copilot):

```ts
test('lista renderiza com items', async ({ page }) => {
  await page.goto('/items')
  await expect(page.locator('a[href*="/items/"]').first()).toBeVisible()
})
```

## Como rodar

```bash
# Headless, todos os projects
pnpm test:e2e

# UI interativa pra debug (recomendado pra dev)
pnpm test:e2e:ui

# Modo headed + debugger
pnpm test:e2e:debug

# Instala Chromium (uma vez)
pnpm test:e2e:install

# Só smoke (sem auth)
pnpm test:e2e --project=smoke

# Só critical (autenticado)
pnpm test:e2e --project=critical
```

## Em CI

GitHub Actions roda automaticamente em PRs (`.github/workflows/e2e.yml`):
- Cache do Chromium (~2min economizado por run)
- Build prod do app (mais rápido + realista que dev)
- HTML report como artifact em falha
- Retry 2x em flake
- Falha bloqueia merge (configure como **required check** no branch protection)

## Seletores — ordem de preferência

1. `page.getByRole(...)` — semântico, acessível, robusto
2. `page.getByLabel(...)` — se input tem `<label htmlFor>` apontando pra ele
3. `page.getByText(...)` — pra elementos não-interativos (badges, headers)
4. `page.getByPlaceholder(...)` — fallback quando label não está semântico
5. `page.locator('[data-testid="..."]')` — último recurso (acopla a HTML)

**Anti-pattern:** locators CSS profundos (`.foo > .bar:nth-child(2)`) — quebram em refactor.

## Anti-flakiness

- **Timeouts generosos** — 30s test, 10s expect, 30s navigation
- **Trace on first retry** — debug fácil sem custo em CI
- **Retries em CI** — absorve flake real (network); local 0 pra pegar testes não-determinísticos cedo
- **forbidOnly em CI** — não vaza `.only` entre PRs
- **Storage state reusado** — login 1x; specs herdam sessão

## Quando algo quebrar

1. Reproduzir local: `pnpm test:e2e:ui` → seleciona o spec → rode visual
2. Em CI, baixar `playwright-report-<run_id>` artifact pro HTML report
3. Trace tem screenshots + DOM por step
4. Se o teste é genuinamente quebrado pela mudança, atualize seletores ou assertions — não `--no-verify` o commit
