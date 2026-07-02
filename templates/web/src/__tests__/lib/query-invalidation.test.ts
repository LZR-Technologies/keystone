import { QueryClient } from '@tanstack/react-query'
import { describe, it, expect, vi } from 'vitest'

import {
  invalidateAllItems,
  invalidateItem,
  invalidateItemLists,
} from '../../lib/query-invalidation'
import { queryKeys } from '../../lib/query-keys'

// These helpers are the ONLY sanctioned way to invalidate item caches (see
// the module comment) -- so the test asserts each one calls
// invalidateQueries with the exact key the registry defines, not an
// approximation of it. A real QueryClient (not a mock) is used because a
// mock invalidateQueries call could "pass" with the wrong key and still
// look green.
describe('query-invalidation', () => {
  function createClient() {
    return new QueryClient({ defaultOptions: { queries: { retry: false } } })
  }

  it('invalidateItemLists invalidates every list-shaped query', async () => {
    const queryClient = createClient()
    const spy = vi.spyOn(queryClient, 'invalidateQueries')

    await invalidateItemLists(queryClient)

    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.items.lists() })
  })

  it('invalidateItem invalidates both the item detail and every list, in parallel', async () => {
    const queryClient = createClient()
    const spy = vi.spyOn(queryClient, 'invalidateQueries')

    await invalidateItem(queryClient, 'item-1')

    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.items.detail('item-1') })
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.items.lists() })
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('invalidateAllItems wipes the entire items key tree', async () => {
    const queryClient = createClient()
    const spy = vi.spyOn(queryClient, 'invalidateQueries')

    await invalidateAllItems(queryClient)

    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.items.all })
  })
})
