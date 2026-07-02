# Web project — AI instructions

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
- **Session continuity (B5):** an agent session forgets everything when it ends, so hand-off
  runs on two explicit commands — **"resume session"** (or "continue") to start, **"close
  session"** (or "wrap up") to end. Resume reads long-term memory and the newest briefing,
  surveys the real codebase, then opens a timed daily-log entry. Close writes the next
  briefing, stamps the daily log, and saves durable decisions to memory. Full sequence in
  `.claude/rules/session-lifecycle.md`.
- **Long-term memory (B6):** durable facts (decisions, preferences, project state) live one
  per file under `memory/`, indexed by `memory/MEMORY.md`. Briefings carry in-flight state
  for one hand-off and are deleted after being read; memory carries what stays true beyond
  that. Discipline in `.claude/rules/long-term-memory.md`.

## Stack

| Package               | Purpose                |
| --------------------- | ---------------------- |
| next                  | Framework (App Router) |
| react                 | UI                     |
| typescript            | Language (strict mode) |
| tailwindcss           | Styling                |
| @tanstack/react-query | Server state           |
| react-hook-form + zod | Forms + validation     |
| vitest                | Unit tests             |
| @playwright/test      | End-to-end tests       |

Do not add a dependency without checking the stack does not already cover it.

## Structure

```
src/
├── app/            # App Router (routes, layouts)
├── components/ui/  # Reusable UI components
├── features/       # Domain logic per feature (pure business rules + UI)
├── hooks/          # Custom hooks
├── lib/            # Utilities, fetch, logger, query registry
├── types/          # Shared types
└── styles/         # Global CSS and design tokens
db/migrations/      # Ordered SQL migrations (NNNN_description.sql)
scripts/            # db-migrate.sh, setup-branch-protection.sh
docs/               # deploy.md and project docs
```

## Branching and delivery

Three branch levels, each mapped to an environment:

| Level      | Branch                                  | Environment               | Moves by              |
| ---------- | --------------------------------------- | ------------------------- | --------------------- |
| Work       | `feat/<issue-slug>`, `fix/<issue-slug>` | local                     | commits               |
| Staging    | `develop`                               | staging deploy on push    | PR from a work branch |
| Production | `main`                                  | production deploy on push | PR from `develop`     |

- **One branch = one issue = one PR.** Every piece of work starts as an issue,
  lives on its own branch, and lands through exactly one PR that declares
  `Closes #<issue>`. Traceable forward and revertible alone.
- Direct commits/pushes to `main`/`master`/`production` are blocked locally by
  the husky hooks and server-side by `scripts/setup-branch-protection.sh`.
- Deploy pipeline (gates -> migrate -> deploy -> smoke): see `docs/deploy.md`.

## Test pyramid — the suite only grows

Four layers, most tests at the bottom:

1. **Fast unit** — utilities and isolated pieces. Model to imitate:
   `src/lib/events.ts` and its test `src/__tests__/lib/events.test.ts`.
2. **Business rule** — domain decisions as PURE functions: no mocks, no I/O,
   time injected as data. Model to imitate: `src/features/items/archive-policy.ts`
   and its test `src/__tests__/features/items/archive-policy.test.ts`.
3. **Integration** — data access against a **real database** (mocks lie:
   they encode beliefs, not behavior). Runs the real migration files against
   `@electric-sql/pglite`, an in-process WASM Postgres -- no daemon, no
   `DATABASE_URL`, so this layer runs by default instead of skipping, on a
   laptop or any CI runner. Deploy-time migrations against the actual
   staging/production database (`scripts/db-migrate.sh`) are a separate,
   later step. Model to imitate:
   `src/__tests__/integration/tenant-isolation.test.ts`, which proves the
   row-level-security policy in `db/migrations/0001_initial_schema.sql`
   actually blocks cross-tenant reads and writes.
4. **E2E** — few, only critical journeys (`e2e/`, see its README).

**The suite never stabilizes, it only grows.** Every feature ships with its
test; every bug fix ships with the test that would have caught it. Never
delete a test to get green.

## React Query discipline

Three central registries in `src/lib/` are the ONLY entry points for query
concerns — never inline any of this at a call site:

- `query-keys.ts` — every query key is declared here (typed key factories).
- `query-config.ts` — staleTime/gcTime presets per data volatility class;
  feeds the QueryClient in `app/providers.tsx`.
- `query-invalidation.ts` — mutations invalidate through these helpers;
  optimistic updates follow the rollback pattern documented there.

## Database conventions

- Migrations live in `db/migrations/` as `NNNN_short_description.sql` —
  ordered, append-only, applied by `scripts/db-migrate.sh` (tracked in
  `schema_migrations`). **Migration before code**: schema deploys before the
  code that needs it; old code must keep working (additive first).
- Every business table: `uuid` PK (`gen_random_uuid()`), `tenant_id` owner
  tag, `created_at`/`updated_at` (trigger-maintained), `deleted_at` soft
  delete, ROW LEVEL SECURITY with a tenant-isolation policy.
- **snake_case in the database, camelCase in TypeScript.** The mapping happens
  once, at the data-access layer — and that boundary is commented where it
  happens, so nobody hunts for where names change shape.

## Code conventions

- **TypeScript strict**, zero `any` — use `unknown` plus a type guard when needed.
- **Named exports** in components; a default export only where the framework requires one
  (`page.tsx`, `layout.tsx`, `route.ts`).
- **Server Components by default** — add `'use client'` only for real interactivity
  (state, effects, event handlers).
- **Data fetching with React Query** — never `useState` + `useEffect` for server data.
  `useState` is for UI state only (drafts, filters, `isEditing`).
- **Back navigation uses `router.back()`**, never a hardcoded route; `router.push()` is for
  moving forward to a new page.
- **Design tokens, not hardcoded colors** — no raw hex/rgb/hsl and no generic Tailwind color
  classes (`text-gray-*`); use the project's token classes so light/dark adapt on their own.
- **Comment the "why"** — a decision, a trade-off, a business rule, a workaround. Never the
  obvious.

## Security

- Never log secrets, tokens, or personal data.
- Secrets live in the environment, never in the repo.
- Validate every external input with a schema at the boundary; treat all incoming data as
  untrusted.
- Security headers are configured in `next.config.ts`.

## Zero tolerance for warnings and errors

Nothing ships with a lint error or warning, a type error, a failing test, or a broken build.
On finding one — even a pre-existing one — stop, fix it, confirm
`pnpm typecheck && pnpm lint && pnpm test && pnpm build` is clean, then resume the task.
