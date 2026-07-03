// @vitest-environment node
//
// Runs in plain Node, not jsdom: PGlite's WASM bootstrap needs a real
// Response.arrayBuffer() that jsdom's polyfill lacks (see the fuller note in
// tenant-isolation.test.ts). This test has no DOM dependency anyway.

/**
 * Integration test: the cross-tenant super-admin (db/migrations/0002_super_admin.sql).
 *
 * Layer 3, real Postgres via PGlite through the shared harness (every migration
 * applied in order, non-owner role enforced). It proves the two halves of what
 * 0002 promises:
 *   (a) a super-admin session (app.is_super_admin = 'true') sees rows from MORE
 *       THAN ONE tenant -- the escape hatch actually opens; and
 *   (b) a normal session (flag unset) still sees ONLY its own tenant -- adding
 *       super-admin did not weaken the default isolation from 0001.
 *
 * Both run under the non-owner role, so it is the POLICY being tested, not an
 * owner bypass.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { createMigrationsHarness, type MigrationsHarness } from './_migrations-harness'

const TENANT_A = '11111111-1111-1111-1111-111111111111'
const TENANT_B = '22222222-2222-2222-2222-222222222222'

describe('super-admin (cross-tenant RLS)', () => {
  let harness: MigrationsHarness

  // 30s hook timeout (not the 10s default): PGlite's WASM cold boot is ~7s and,
  // under Vitest's parallel file runner, can exceed the default with transform
  // overhead. Slow, not hung -- see the fuller note in tenant-isolation.test.ts.
  beforeAll(async () => {
    harness = await createMigrationsHarness()

    // Seed one row per tenant. Each insert runs in that tenant's own normal
    // session (app role, tenant set, super-admin off), which is the only way the
    // WITH CHECK clause allows a row tagged with that tenant to be written --
    // proving the seed itself respects isolation before super-admin is tested.
    for (const tenant of [TENANT_A, TENANT_B]) {
      await harness.useAppRole()
      await harness.setTenant(tenant)
      await harness.db.query('insert into items (tenant_id, name) values ($1, $2)', [
        tenant,
        `item-for-${tenant}`,
      ])
      await harness.reset()
    }
  }, 30_000)

  afterAll(async () => {
    await harness.close()
  })

  it('a super-admin session sees rows across more than one tenant', async () => {
    // Elevated session: app role (so the policy applies -- not an owner bypass),
    // super-admin flag on, and NO tenant scoped. Under 0001 alone this would see
    // zero rows (no tenant set = fail closed); the is_super_admin() branch of the
    // 0002 policy is what lets it read every tenant's rows instead.
    await harness.useAppRole()
    await harness.setSuperAdmin(true)
    try {
      const result = await harness.db.query<{ tenant_id: string }>('select tenant_id from items')

      // Sees both tenants' rows: proves cross-tenant visibility, not just "more
      // than zero". The distinct set must contain BOTH ids.
      const tenants = new Set(result.rows.map((row) => row.tenant_id))
      expect(tenants).toEqual(new Set([TENANT_A, TENANT_B]))
    } finally {
      await harness.reset()
    }
  })

  it('a normal session still sees only its own tenant', async () => {
    // Same data, but an ordinary session scoped to tenant A with super-admin
    // OFF. It must see exactly A's one row -- confirming 0002 did not turn every
    // session into a super-admin by accident (the fail-closed default holds).
    await harness.useAppRole()
    await harness.setTenant(TENANT_A)
    try {
      const result = await harness.db.query<{ tenant_id: string }>('select tenant_id from items')

      expect(result.rows).toHaveLength(1)
      expect(result.rows[0]).toMatchObject({ tenant_id: TENANT_A })
    } finally {
      await harness.reset()
    }
  })
})
