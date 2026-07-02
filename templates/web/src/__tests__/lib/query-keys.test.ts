import { describe, it, expect } from 'vitest'

import { queryKeys } from '../../lib/query-keys'

// The registry is pure data/functions -- fast unit layer. Every factory is
// exercised once: this is the "typo-proof, greppable" contract the registry
// exists to guarantee, so an accidental change to any key's shape (e.g.
// dropping the 'detail' segment) is caught here instead of surfacing as a
// silent cache-invalidation miss in production.
describe('queryKeys.items', () => {
  it('all is the root of the key tree', () => {
    expect(queryKeys.items.all).toEqual(['items'])
  })

  it('lists() extends all with the "list" segment', () => {
    expect(queryKeys.items.lists()).toEqual(['items', 'list'])
  })

  it('list(filters) extends lists() with the filters object', () => {
    expect(queryKeys.items.list({ search: 'a', page: 2 })).toEqual([
      'items',
      'list',
      { search: 'a', page: 2 },
    ])
  })

  it('details() extends all with the "detail" segment', () => {
    expect(queryKeys.items.details()).toEqual(['items', 'detail'])
  })

  it('detail(id) extends details() with the item id', () => {
    expect(queryKeys.items.detail('42')).toEqual(['items', 'detail', '42'])
  })
})
