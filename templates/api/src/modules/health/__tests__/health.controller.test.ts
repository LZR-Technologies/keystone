import { describe, expect, it, vi } from 'vitest'

import { HTTP } from '../../../shared/constants/http.js'
import { AppError } from '../../../shared/types/error.js'

import type { FastifyReply, FastifyRequest } from 'fastify'

// Unit test on the controller in isolation: the service module is mocked so
// this test can force the failure branch (getHealthHandler throwing the
// AppError) without needing the real repository to actually break. The
// happy path is already covered end-to-end by src/__tests__/app.test.ts
// (GET /api/v1/health); this file exists specifically for the branch that
// app.test.ts cannot reach, because the real health service never fails.
vi.mock('../health.service.js', () => ({
  healthService: {
    getHealth: vi.fn(),
  },
}))

describe('getHealthHandler', () => {
  it('throws the service error instead of sending a response, when the service fails', async () => {
    // Import after the mock is registered so the controller wires up
    // against the mocked module instance.
    const { healthService } = await import('../health.service.js')
    const { getHealthHandler } = await import('../health.controller.js')

    const error = new AppError(
      HTTP.SERVICE_UNAVAILABLE,
      'https://api.example.com/errors/health-check',
      'Service Unavailable',
      'Health check failed',
    )
    vi.mocked(healthService.getHealth).mockReturnValue({ success: false, error })

    const reply = { send: vi.fn() } as unknown as FastifyReply

    // Decision: asserting the throw directly (not via Fastify inject) proves
    // the controller's own contract — "translate failure into a throw for
    // the global error handler to catch" — independent of routing or hooks.
    await expect(getHealthHandler({} as FastifyRequest, reply)).rejects.toBe(error)
    expect(reply.send).not.toHaveBeenCalled()
  })
})
