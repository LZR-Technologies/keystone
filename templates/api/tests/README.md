# Testing in this project

## Where tests live

- **Unit and app-level tests** are colocated with the code they verify, in
  `src/**/__tests__/*.test.ts` — the test moves, dies, and grows with its
  subject.
- **Integration and end-to-end tests** (the ones that need external processes:
  a real database, a running stack) live here in `tests/`, kept out of `src/`
  because they are wired to infrastructure, not to a single module.

Both locations are picked up by `pnpm run test` (see `vitest.config.ts`).

## The four-layer test pyramid

```
        /  E2E  \          few - whole system, real HTTP, real database
       / integr. \         some - modules against a REAL database
      / bus. rule \        more - domain decisions, policies, edge cases
     /    unit     \       most - fast, isolated, milliseconds each
```

1. **Unit (the base — most tests).** One function or one layer, dependencies
   replaced by fakes, no I/O. Milliseconds each; these run on every save.
   Example: `src/modules/health/__tests__/health.service.test.ts` swaps the
   repository for an in-memory fake.
2. **Business-rule.** Still fast, but aimed at the decisions the domain makes:
   status mapping, error contracts, limits, tenant rules. Example: the
   error-contract tests in `src/shared/types/__tests__/error.test.ts`.
3. **Integration — against a REAL database.** Mocks lie: a mocked repository
   happily "passes" against a query the real Postgres would reject, and no
   mock exercises an RLS policy. Anything that owns SQL or a policy gets
   verified against a real database. Example: `tests/integration/tenant-isolation.test.ts`
   runs the real `0001_initial_schema.sql` migration and proves the RLS
   policy blocks cross-tenant reads and writes. By default this runs against
   `@electric-sql/pglite` — a WASM build of real Postgres started in-process,
   no daemon and no `DATABASE_URL` required — so `pnpm run test` exercises the
   actual RLS engine on every run, not a mock of it. An optional second suite
   in the same file runs the identical properties against a networked
   Postgres (migrated by `scripts/db-migrate.sh`) when `DATABASE_URL` is set,
   for CI parity with a production-like engine; it skips cleanly
   (`describe.skipIf`) otherwise.
4. **End-to-end (the top — few tests).** The whole service, boot to response.
   Expensive and slower, so they cover the critical paths only; everything
   else is already proven by the layers below. Example: `src/__tests__/app.test.ts`
   boots the real Fastify app via `buildApp()` and drives it end to end with
   `inject()` — no mocked layers, no sockets.

App-level tests via Fastify's `inject()` (`src/__tests__/app.test.ts`) sit
between 2 and 3: full HTTP lifecycle — routing, hooks, error handler — with
no sockets and no external processes.

## The philosophy: the suite never stabilizes, it only grows

There is no "done" state for the test suite and no such thing as a feature
shipped without its test:

- **Every feature ships with its test** — same branch, same PR, reviewed as
  one unit. A PR that adds behavior without adding tests is incomplete.
- **Every bug fix starts with a failing test** that reproduces the bug; the
  fix turns it green and the regression is locked out forever.
- **Tests are never deleted to make a run pass.** A red test is information:
  either the code is wrong (fix the code) or the requirement changed (change
  the test in the same PR as the requirement).
- Coverage is enforced at 100% (`vitest.config.ts`) with only the process
  bootstrap (`server.ts`, `index.ts`) excluded — each exclusion carries its
  own justifying comment in `vitest.config.ts`, and thresholds are never
  lowered to make a number look good.

## Commands

```bash
pnpm run test           # full suite, once
pnpm run test:watch     # watch mode while developing
pnpm run test:coverage  # suite + coverage report and 100% threshold check
```
