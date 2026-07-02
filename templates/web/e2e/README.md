# E2E — Playwright (standard)

A ready-to-adopt Playwright foundation for any Next.js project. Covers setup, CI, anti-flakiness patterns, and reused authentication via storage state.

## Philosophy

**A lean, unpretentious suite.** Broad coverage is the job of unit tests (Vitest). Here we keep only:

- **Smoke** (`e2e/smoke/`) — the app boots, the landing renders, basic redirects. No authentication.
- **Critical** (`e2e/critical/`) — the main authenticated product flows. Reuses the session via `storageState`.

Add broad coverage only when a **complex** feature lands (a signing flow, a multi-step wizard). Do not try to cover 100% — that keeps the suite fast and flake-free.

## Structure

```
e2e/
├── README.md                              ← this file
├── fixtures/
│   ├── api-mocks.ts                       ← mock helpers for external APIs (data provider, email, hosting)
│   └── global-setup.ts.example            ← ADAPT: your project's login flow
├── smoke/
│   └── health.spec.ts                     ← landing /200 — add more as you implement
└── critical/
    └── login.spec.ts.example              ← ADAPT: your project's authenticated routes
```

## Adopting it in a new project

### 1. Already wired up

This template already includes `playwright.config.ts`, `.github/workflows/e2e.yml`, scripts in `package.json`, and an adjusted `.gitignore`. It works out of the box for smoke (landing /200).

### 2. Configure credentials (once you have auth)

Create `.env.local` at the root:

```bash
E2E_USER_EMAIL=test-user@example.com
E2E_USER_PASSWORD=<test user password>
# Optional:
# E2E_BASE_URL=http://localhost:3000
```

And configure GitHub Secrets for CI:

```bash
gh secret set E2E_USER_EMAIL --repo <owner>/<repo>
gh secret set E2E_USER_PASSWORD --repo <owner>/<repo>
```

### 3. Adapt global-setup

```bash
mv e2e/fixtures/global-setup.ts.example e2e/fixtures/global-setup.ts
```

Edit the file. The `[TODO]` markers show where to adjust:

- `page.goto(...)` — the login route
- The input selectors (use `getByLabel` if there is an `htmlFor`; `getByPlaceholder` if not)
- `page.waitForURL(...)` — your app's post-login URL pattern

> `playwright.config.ts` detects whether `global-setup.ts` exists and enables `globalSetup` automatically. Without it, only smoke runs.

### 4. Adapt login.spec

```bash
mv e2e/critical/login.spec.ts.example e2e/critical/login.spec.ts
```

Adjust the protected routes. If you do not have auth yet, keep it as `.example` (Playwright ignores it).

### 5. Add specs for your product's critical flow

Create `e2e/critical/<feature>.spec.ts` covering the most-used path. Example:

```ts
test('the list renders with items', async ({ page }) => {
  await page.goto('/items')
  await expect(page.locator('a[href*="/items/"]').first()).toBeVisible()
})
```

## How to run

```bash
# Headless, all projects
pnpm test:e2e

# Interactive UI for debugging (recommended for dev)
pnpm test:e2e:ui

# Headed mode + debugger
pnpm test:e2e:debug

# Install Chromium (once)
pnpm test:e2e:install

# Smoke only (no auth)
pnpm test:e2e --project=smoke

# Critical only (authenticated)
pnpm test:e2e --project=critical
```

## In CI

GitHub Actions runs automatically on PRs (`.github/workflows/e2e.yml`):

- Chromium cache (~2min saved per run)
- Prod build of the app (faster + more realistic than dev)
- HTML report as an artifact on failure
- Retries 2x on flake
- A failure blocks the merge (configure it as a **required check** in branch protection)

## Selectors — order of preference

1. `page.getByRole(...)` — semantic, accessible, robust
2. `page.getByLabel(...)` — if the input has a `<label htmlFor>` pointing to it
3. `page.getByText(...)` — for non-interactive elements (badges, headers)
4. `page.getByPlaceholder(...)` — fallback when the label is not semantic
5. `page.locator('[data-testid="..."]')` — last resort (couples to the HTML)

**Anti-pattern:** deep CSS locators (`.foo > .bar:nth-child(2)`) — they break on refactor.

## Anti-flakiness

- **Generous timeouts** — 30s test, 10s expect, 30s navigation
- **Trace on first retry** — easy debugging with no CI cost
- **Retries in CI** — absorbs real flake (network); local 0 to catch non-deterministic tests early
- **forbidOnly in CI** — no leaked `.only` between PRs
- **Reused storage state** — login once; specs inherit the session

## When something breaks

1. Reproduce locally: `pnpm test:e2e:ui` → select the spec → run it visually
2. In CI, download the `playwright-report-<run_id>` artifact for the HTML report
3. The trace has screenshots + DOM per step
4. If the test is genuinely broken by the change, update the selectors or assertions — do not `--no-verify` the commit
