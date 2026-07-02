import { describe, it, expect, vi, afterEach } from 'vitest'

import { apiFetch } from '../../lib/fetch'

// apiFetch is the ONLY place that turns a raw fetch() call into the Result
// pattern used everywhere else in the app -- every branch here (success,
// RFC 9457 error body, network failure) is load-bearing for every caller.
describe('apiFetch', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns a success Result with the parsed body on a 2xx response', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ id: '1', name: 'Item' }),
    } as Response
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(mockResponse)),
    )

    const result = await apiFetch<{ id: string; name: string }>('/api/v1/items/1')

    expect(result).toEqual({ success: true, data: { id: '1', name: 'Item' } })
  })

  it('merges caller headers with the default Content-Type', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response),
    )
    vi.stubGlobal('fetch', fetchMock)

    await apiFetch('/api/v1/items', { headers: { Authorization: 'Bearer t' } })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/items',
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer t' },
      }),
    )
  })

  it('returns a failure Result with the RFC 9457 Problem Detail body on a non-2xx response', async () => {
    const problem = {
      type: 'https://api.example.com/errors/404',
      title: 'Not Found',
      status: 404,
      detail: 'No item with id "x".',
    }
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: false, json: () => Promise.resolve(problem) } as Response)),
    )

    const result = await apiFetch('/api/v1/items/x')

    expect(result).toEqual({ success: false, error: problem })
  })

  it('returns a network-error Result when fetch itself throws', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
    )

    const result = await apiFetch('/api/v1/items')

    expect(result).toEqual({
      success: false,
      error: {
        type: 'https://api.example.com/errors/network',
        title: 'Network Error',
        status: 0,
        detail: 'Failed to connect to the server',
      },
    })
  })
})
