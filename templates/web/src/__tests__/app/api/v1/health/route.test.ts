import { describe, it, expect } from 'vitest'

import { GET } from '../../../../../app/api/v1/health/route'

// Smoke-level route test: the handler has exactly one behavior (report ok +
// a timestamp), so this proves the response shape without needing a running
// server -- Next.js route handlers are plain async functions, callable
// directly in a unit test.
describe('GET /api/v1/health', () => {
  it('responds 200 with status ok and an ISO timestamp', async () => {
    const response = await GET()
    const body = (await response.json()) as { status: string; timestamp: string }

    expect(response.status).toBe(200)
    expect(body.status).toBe('ok')
    // Round-tripping through Date confirms it is a valid ISO instant, not
    // just a string that happens to look like one.
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp)
  })
})
