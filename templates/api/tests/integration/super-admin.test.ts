/**
 * Integration test: cross-tenant super-admin via db/migrations/0002_super_admin.sql.
 *
 * Layer 3 of the test pyramid (tests/README.md). Runs against a REAL Postgres
 * (PGlite) with the full migration set applied, as the non-owner app_user role
 * — the same reasons the tenant-isolation test does: a mock cannot exercise an
 * actual RLS policy, and the owner would bypass RLS and prove nothing.
 *
 * This proves the two halves of the super-admin contract:
 *   (a) a session that opts into super-admin (app.is_super_admin = 'true') sees
 *       rows from MORE THAN ONE tenant — the escape hatch works;
 *   (b) an ordinary session (no such flag) still sees only its own tenant — the
 *       escape hatch does not leak into normal sessions.
 * Together they show 0002 widens access for super-admins WITHOUT weakening the
 * isolation 0001 guarantees for everyone else.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { createHarness, type Harness } from './_migrations-harness.js'

// Two fixed tenants whose rows a super-admin must be able to see together, and
// which must stay invisible to each other for a normal session.
const TENANT_A = '11111111-1111-1111-1111-111111111111'
const TENANT_B = '22222222-2222-2222-2222-222222222222'

describe('super-admin (cross-tenant RLS) — in-process Postgres via PGlite', () => {
  let harness: Harness

  beforeAll(async () => {
    harness = await createHarness()
  })

  afterAll(async () => {
    await harness?.close()
  })

  beforeEach(async () => {
    await harness.reset()
  })

  /**
   * Seed one row per tenant. Each insert is scoped to its own tenant so the
   * write passes the policy's WITH CHECK (a normal session may only insert its
   * own tenant's rows). This runs as app_user, exactly as the application would.
   */
  async function seedOneRowPerTenant(): Promise<void> {
    await harness.setTenant(TENANT_A)
    await harness.query('insert into items (tenant_id, name) values ($1, $2)', [
      TENANT_A,
      'tenant-a-item',
    ])
    await harness.setTenant(TENANT_B)
    await harness.query('insert into items (tenant_id, name) values ($1, $2)', [
      TENANT_B,
      'tenant-b-item',
    ])
  }

  it('a super-admin session sees rows from more than one tenant', async () => {
    await seedOneRowPerTenant()

    // Opt into super-admin, and deliberately leave app.tenant_id cleared: the
    // tenant clause is now false (fail-closed), so the ONLY thing that can make
    // rows visible is the "or is_super_admin()" disjunct. This isolates what is
    // under test — cross-tenant visibility comes from the super-admin flag, not
    // from also happening to be scoped to one of the tenants.
    await harness.setTenant(null)
    await harness.setSuperAdmin(true)

    const result = await harness.query('select tenant_id from items')
    const tenants = new Set(result.rows.map((row) => row.tenant_id))

    // Both tenants' rows are visible in one query — the cross-tenant view a
    // support/admin session needs.
    expect(result.rows).toHaveLength(2)
    expect(tenants).toEqual(new Set([TENANT_A, TENANT_B]))
  })

  it('a normal session still sees only its own tenant', async () => {
    await seedOneRowPerTenant()

    // No super-admin flag (reset cleared it); scoped to tenant A only. The OR's
    // second arm is false, so this must behave exactly like plain isolation.
    await harness.setSuperAdmin(false)
    await harness.setTenant(TENANT_A)

    const result = await harness.query('select tenant_id from items')

    expect(result.rows).toHaveLength(1)
    expect(result.rows[0]).toMatchObject({ tenant_id: TENANT_A })
  })
})
