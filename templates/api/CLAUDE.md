# Service (API) project — AI instructions

> Read automatically by the coding agent before any task. Keep it lean: stack,
> conventions, and where to look. Details live on demand in `docs/` and `.claude/`.

## Language

- Code, identifiers, comments, and commits in English.

## Agent harness (Layer B)

This project ships with a harness for the AI that builds it. Full map in
[docs/agent-harness.md](docs/agent-harness.md).

- **Spec workflow (B2):** every feature opens with `specs/<slug>/spec.md` — the request restated
  plus a **verifiable "done" target**, approved before any code. On completion the work is
  checked against that target point by point; a gap is declared, not hidden. When code and
  spec diverge, the spec wins.
- **Reviewers (B3):** `.claude/agents/` — spec reviewer, code reviewer, security auditor,
  each in its own isolated context.
- **Guardrails (B4):** `.claude/hooks/` blocks committing a secret and touching a protected
  branch. Hard blocks, not warnings.
- **Session continuity (B5):** say **"resume session"** (or "continue") to start a session and
  **"close session"** (or "wrap up") to end one. The agent reads the newest briefing, surveys
  the codebase, and on close writes the next briefing plus a dated entry in the coder's daily
  log. Rule-level, not a hook — a script cannot judge whether a hand-off summary is truthful.
- **Long-term memory (B6):** durable decisions (not in-flight state) live in `memory/`, one
  fact per file, indexed by `memory/MEMORY.md`. Saved the moment a decision happens, checked
  before creating a new file so facts are updated rather than duplicated.

## Stack

| Package    | Purpose                |
| ---------- | ---------------------- |
| fastify    | HTTP framework         |
| zod        | Validation             |
| pino       | Structured logging     |
| typescript | Language (strict mode) |
| vitest     | Tests                  |

Do not add a dependency without checking the stack does not already cover it.

## Structure (3-layer modules)

```
src/
├── modules/
│   └── <module>/
│       ├── <module>.controller.ts   # HTTP shape only (request/reply mapping)
│       ├── <module>.service.ts      # business logic (Result in, Result out)
│       ├── <module>.repository.ts   # data access boundary (the ONLY layer that sees the DB)
│       ├── <module>.routes.ts       # route registration
│       ├── index.ts                 # barrel (the module's public surface)
│       └── __tests__/
├── shared/          # utils, types, middleware
├── config/          # env validation, logger
├── app.ts           # builds the Fastify app — pure, testable via inject()
├── server.ts        # process bootstrap: listen, signals, graceful shutdown
└── index.ts         # entry point (one line: start the server)
db/
└── migrations/      # ordered SQL migrations (see db/migrations/README.md)
scripts/             # db-migrate.sh, setup-branch-protection.sh
tests/               # integration/e2e tests + testing doc (tests/README.md)
```

Layer rule: controller -> service -> repository, never skipping and never
backwards. HTTP types stop at the controller; SQL stops at the repository.

## Branches, issues, and PRs

Three branch levels:

- **main** — the official branch. Protected: changes arrive only through
  reviewed, CI-green pull requests (never a direct commit — git hooks and
  `scripts/setup-branch-protection.sh` both enforce it). Every merge deploys
  production.
- **develop** — the integration branch. Every merge deploys staging.
- **short-lived working branches** — where daily work happens
  (`feat/...`, `fix/...`), branched from develop and merged back via PR.

**One branch = one issue = one PR.** Every working branch exists to close
exactly one issue and produces exactly one PR (the PR template requires the
`Closes #` link). Scope creep goes to a new issue, not into the current branch.

Commits: `<type>(<scope>): <description>` — scope required, types restricted to
feat/fix/docs/refactor/test/chore/security (see `config/commitlint-config/`).

## Tests

Full doc: [tests/README.md](tests/README.md). The short version:

- **Four-layer pyramid:** many fast unit tests at the base, then
  business-rule tests, then integration tests against a REAL database
  (mocks lie about SQL and RLS), and a few end-to-end tests at the top.
- **The suite never stabilizes, it only grows** with the code. Every feature
  ships with its test in the same PR; every bug fix starts with a failing test.
- Coverage threshold: 100% (enforced by `pnpm run test:coverage`). Only the
  process bootstrap (`server.ts`, `index.ts`) is excluded, each with a
  justifying comment in `vitest.config.ts`; thresholds are never lowered.
- App-level tests use `buildApp()` + Fastify `inject()` — no ports, no network.

## Database conventions

Migrations are plain SQL in `db/migrations/`, strictly ordered, applied BEFORE
the code in every environment, never edited after being applied
(`db/migrations/README.md`). Every table follows the shape of
`0001_initial_schema.sql`:

- `id uuid primary key default gen_random_uuid()` — unguessable ids
- `tenant_id uuid not null` — the tenant column on every row (tenant isolation)
- `created_at` / `updated_at timestamptz not null default now()` — with a
  trigger keeping `updated_at` honest
- `deleted_at timestamptz` — soft delete: delete means hide, reads filter
  `deleted_at is null`
- **Row Level Security on**, with a tenant-isolation policy that fails closed:
  a session with no tenant sees ZERO rows, never everything
- **ALL database identifiers snake_case** (tables, columns, functions,
  indexes, policies). TypeScript stays camelCase; the repository layer is the
  ONE place that maps between the two (`tenant_id` <-> `tenantId`) — no
  snake_case leaks above the repository, no camelCase leaks into SQL.

## Conventions

- **Result pattern** — return `ok(data)` / `fail(error)`; never throw for a business error.
- **Validate every external input** (request body, params, env vars) with a Zod schema.
- **RFC 9457** (Problem Details) for error responses — all errors leave through
  the global error handler in `app.ts`.
- **Structured logging** via Pino (JSON, with a trace id and, where multi-tenant, a tenant id).
- **TypeScript strict**, zero `any` — use `unknown` plus a type guard.
- **Named exports** only; a barrel `index.ts` per module.
- **JSDoc** on public service methods.
- **Pagination** on every `getAll()` (`.limit()` or cursor-based) — never return an unbounded list.
- **Comment the "why"** — a decision, a trade-off, a business rule, a workaround. Never the obvious.
- New feature ships with its test.

## Security

- Never log secrets, tokens, or personal data.
- Secrets live in the environment, never in the repo.
- Treat all incoming data as untrusted; validate at the boundary.
- Check authorization before returning data. In a multi-tenant service, every query filters by
  the tenant, in the data layer — a request with no tenant is blocked, never "sees everything"
  (enforced twice: repository filter + RLS policy in the database).
- The error returned to the client carries no internal detail (path, version, stack).

## Deploy

Two environments, wired in `.github/workflows/deploy-staging.yml` (develop)
and `deploy-production.yml` (main): quality gates, then migrations, then code,
then a smoke test — in that order. Hosting is the owner's choice; one marked
step per workflow is the only thing to fill in. Full doc: [docs/deploy.md](docs/deploy.md).

## Zero tolerance for warnings and errors

Nothing ships with a lint error or warning, a type error, a failing test, or a broken build.
On finding one — even a pre-existing one — stop, fix it, confirm
`pnpm typecheck && pnpm lint && pnpm test && pnpm build` is clean, then resume the task.
