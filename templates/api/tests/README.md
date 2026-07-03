# Testing in this project

## Where tests live

- **Unit and app-level tests** are colocated with the code they verify, in
  `src/**/__tests__/*.test.ts` — the test moves, dies, and grows with its
  subject.
- **Integration tests** (the ones wired to infrastructure: a real database)
  live here in `tests/`, kept out of `src/` because they belong to the system,
  not to a single module. A future socket-level E2E suite (a running stack)
  would live here too — it is not built yet (see the pyramid below).

Both locations are picked up by `pnpm run test` (see `vitest.config.ts`).

## The test pyramid

```
        /  E2E  \          real HTTP over a socket - DESIGNED, not yet built
       / app-lvl \         whole app via inject() - full HTTP lifecycle, no socket
      / integr.   \        some - modules against a REAL database
     / bus. rule   \       more - domain decisions, policies, edge cases
    /    unit       \      most - fast, isolated, milliseconds each
```

The layers that carry tests today are unit, business-rule, integration, and
app-level. The socket-level E2E layer at the apex is described below as the
intended top of the pyramid but is deliberately **not built into this mold** —
see layer 4.

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
4. **App-level (the whole app, no socket).** The whole service, boot to
   response, with no layer mocked — but driven in-process, not over a network.
   Example: `src/__tests__/app.test.ts` boots the real Fastify app via
   `buildApp()` and exercises the full HTTP lifecycle — routing, hooks, error
   handler — with Fastify's `inject()`. No sockets, no external processes, so
   these stay fast while still proving the app end to end at the code level.
   These sit just above integration: broader than a single module, but not the
   full network path.
5. **End-to-end over a real socket (DESIGNED, not built here).** The layer that
   would boot the service, bind a port, and drive it with a real HTTP client
   across an actual socket — the one thing `inject()` does not cover (the
   network transport itself). This mold does **not** ship such a suite: for a
   template with a single health route, the app-level `inject()` tests already
   prove the HTTP path, and standing up a socket-bound server per test earns
   little. It is documented here as the intended apex so a project that grows
   real network-facing behavior knows where that test belongs — not claimed as
   already present.

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
