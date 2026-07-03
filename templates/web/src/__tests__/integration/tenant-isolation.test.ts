// @vitest-environment node
//
// Overrides the project-wide jsdom environment (vitest.config.ts) for this
// file only. PGlite's WASM/filesystem bootstrap calls a raw Response's
// `.arrayBuffer()` during startup; jsdom's fetch/Response polyfill does not
// implement it, so `db.exec()` throws "r.arrayBuffer is not a function"
// under jsdom. Real Node has no such gap. This test has no DOM dependency
// (no rendering, no hooks), so plain Node is also the more accurate
// environment for what it actually exercises.

/**
 * Integration test: tenant isolation via Row Level Security.
 *
 * Layer 3 of the test pyramid (CLAUDE.md, e2e/README.md). Runs against a
 * REAL Postgres, not a mock: a mocked repository would happily "pass" a
 * query the real database rejects, and no mock exercises an actual RLS
 * policy -- mocks lie about SQL and about security. This test proves the
 * policy in db/migrations/0001_initial_schema.sql actually blocks
 * cross-tenant reads and writes at the database level, independent of
 * anything application code remembers to do.
 *
 * Engine: @electric-sql/pglite, a WASM build of real Postgres that runs
 * in-process (no daemon, no network socket, no DATABASE_URL). This is what
 * makes the test RUN BY DEFAULT instead of skipping: `pnpm test` on a laptop
 * or CI runner with no Postgres installed still exercises the real engine,
 * the real migration files, and the real RLS policy -- not an approximation
 * of one. Deploy-time migrations against the actual staging/production
 * database (DATABASE_URL, scripts/db-migrate.sh) are a separate concern this
 * test does not touch.
 *
 * The PGlite bootstrap (apply every migration in order, create the non-owner
 * role, drive the session GUCs) lives in the shared _migrations-harness so all
 * three database integration tests exercise the identical, complete schema --
 * including the optional super-admin and audit-log migrations -- rather than a
 * per-file approximation of it. This file still proves the SAME four isolation
 * properties as before: with no super-admin session in play, the added
 * `OR is_super_admin()` branch of the 0002 policy is always false, so isolation
 * behaves exactly as 0001 alone defined it.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { createMigrationsHarness, type MigrationsHarness } from './_migrations-harness'

// Two arbitrary but fixed tenant ids: fixed (not random per run) so a failed
// assertion always reproduces the same rows if inspected manually.
const TENANT_A = '11111111-1111-1111-1111-111111111111'
const TENANT_B = '22222222-2222-2222-2222-222222222222'

describe('tenant isolation (RLS)', () => {
  let harness: MigrationsHarness

  // 30s hook timeout (not the 10s default): PGlite is a WASM build of Postgres,
  // and its one-time cold boot is ~7s on its own; under Vitest's parallel file
  // runner (each integration file boots its own instance) that plus transform
  // overhead can exceed 10s. The boot is slow, not hung -- a generous ceiling
  // keeps the test honest instead of flaky.
  beforeAll(async () => {
    harness = await createMigrationsHarness()
  }, 30_000)

  afterAll(async () => {
    await harness.close()
  })

  /**
   * Run `fn` as the non-owner role with the session scoped to `tenantId` (or
   * unset, for the fail-closed case), then always drop back to the owner and
   * clear the session -- even when `fn` throws, which is exactly what the
   * rejected-write assertion below expects. Isolating each call this way keeps
   * one test's role/tenant from leaking into the next.
   */
  async function withTenant<T>(tenantId: string | null, fn: () => Promise<T>): Promise<T> {
    await harness.useAppRole()
    await harness.setTenant(tenantId)
    try {
      return await fn()
    } finally {
      await harness.reset()
    }
  }

  it('a session scoped to tenant A cannot read rows written by tenant B', async () => {
    await withTenant(TENANT_A, () =>
      harness.db.query('insert into items (tenant_id, name) values ($1, $2)', [
        TENANT_A,
        'tenant-a-item',
      ]),
    )
    await withTenant(TENANT_B, () =>
      harness.db.query('insert into items (tenant_id, name) values ($1, $2)', [
        TENANT_B,
        'tenant-b-item',
      ]),
    )

    // Still scoped to tenant B: a plain "select * from items" (no WHERE
    // tenant_id clause at all) must return ONLY tenant B's row. If the
    // policy were missing or misconfigured, this would return both rows.
    const result = await withTenant(TENANT_B, () =>
      harness.db.query<{ name: string; tenant_id: string }>('select name, tenant_id from items'),
    )

    expect(result.rows).toHaveLength(1)
    expect(result.rows[0]).toMatchObject({ name: 'tenant-b-item', tenant_id: TENANT_B })
  })

  it('a session with no tenant set sees zero rows, never everything', async () => {
    // No app.tenant_id set for this session at all -- simulates a request
    // that forgot to set the tenant. nullif(current_setting(...), '') must
    // resolve to NULL, and the policy's NULL comparison must match zero
    // rows: the fail-closed guarantee this migration exists to provide.
    const result = await withTenant(null, () => harness.db.query('select * from items'))

    expect(result.rows).toHaveLength(0)
  })

  it('a write attempted for another tenant is rejected by the WITH CHECK clause', async () => {
    // Attempts to insert a row tagged with TENANT_B while the session is
    // scoped to TENANT_A. The policy's WITH CHECK clause (not just USING)
    // is what blocks this -- USING alone would only filter reads.
    await expect(
      withTenant(TENANT_A, () =>
        harness.db.query('insert into items (tenant_id, name) values ($1, $2)', [
          TENANT_B,
          'cross-tenant-write-attempt',
        ]),
      ),
    ).rejects.toThrow(/row-level security/i)
  })

  it('the owning tenant reads exactly its own rows', async () => {
    // Closes the loop on the four properties: A's session sees neither zero
    // rows nor B's row, only the one row it is actually entitled to.
    const result = await withTenant(TENANT_A, () =>
      harness.db.query<{ name: string; tenant_id: string }>('select name, tenant_id from items'),
    )

    expect(result.rows).toHaveLength(1)
    expect(result.rows[0]).toMatchObject({ name: 'tenant-a-item', tenant_id: TENANT_A })
  })
})
