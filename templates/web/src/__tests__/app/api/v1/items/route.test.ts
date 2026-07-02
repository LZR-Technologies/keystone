import { describe, it, expect } from 'vitest'

import { GET } from '../../../../../app/api/v1/items/route'

// Thin HTTP adapter over the store (store.test.ts covers the store's own
// logic in depth) -- this test only proves the route wires GET to
// listItems() and returns it as JSON, per the route.ts file comment.
describe('GET /api/v1/items', () => {
  it('responds 200 with the full item list as JSON', async () => {
    const response = await GET()
    const body = (await response.json()) as unknown[]

    expect(response.status).toBe(200)
    expect(Array.isArray(body)).toBe(true)
    expect(body.length).toBeGreaterThan(0)
  })
})
