import { describe, it, expect, vi } from 'vitest'

import { fetchItems, renameItem } from '../../../features/items/api'

import * as fetchModule from '@/lib/fetch'

// apiFetch's own behavior (success/error/network-failure Result shapes) is
// covered by lib/fetch.test.ts. This test is only about the URL/method/body
// wiring THIS module is responsible for -- so apiFetch is mocked here on
// purpose, the same boundary use-items.test.tsx draws around this module.
vi.mock('@/lib/fetch', async () => {
  const actual = await vi.importActual<typeof fetchModule>('@/lib/fetch')
  return { ...actual, apiFetch: vi.fn() }
})

describe('items api', () => {
  it('fetchItems calls the items list endpoint with no options', async () => {
    vi.mocked(fetchModule.apiFetch).mockResolvedValue({ success: true, data: [] })

    await fetchItems()

    expect(fetchModule.apiFetch).toHaveBeenCalledWith('/api/v1/items')
  })

  it('renameItem PATCHes the item endpoint with the new name as JSON', async () => {
    vi.mocked(fetchModule.apiFetch).mockResolvedValue({
      success: true,
      data: { id: '1', name: 'New name', updatedAt: '2026-01-01T00:00:00.000Z', deletedAt: null },
    })

    await renameItem('1', 'New name')

    expect(fetchModule.apiFetch).toHaveBeenCalledWith('/api/v1/items/1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'New name' }),
    })
  })
})
