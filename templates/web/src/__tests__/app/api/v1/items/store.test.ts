import { describe, it, expect } from 'vitest'

import { listItems, renameItemById } from '../../../../../app/api/v1/items/store'

// The store is deliberately module-level mutable state (see its own file
// comment) -- so, unlike every other test in this suite, these tests are
// NOT independent: they share one in-memory array across the whole file.
// Ordered narratively (seed -> rename -> miss) instead of resetting state
// between tests, which would require exporting a reset hook this
// intentionally-minimal worked example does not need.
describe('items store', () => {
  it('listItems returns the seeded worked-example items', () => {
    const items = listItems()

    expect(items).toHaveLength(2)
    expect(items.map((item) => item.name)).toEqual(['First item', 'Second item'])
  })

  it('renameItemById updates the name and updatedAt of the matching item, leaving others untouched', () => {
    const before = listItems().find((item) => item.id === '11111111-1111-4111-8111-111111111111')
    const beforeUpdatedAt = before?.updatedAt

    const updated = renameItemById('11111111-1111-4111-8111-111111111111', 'Renamed item')

    expect(updated).toMatchObject({ name: 'Renamed item' })
    // updatedAt must move forward -- proves the rename path stamps a fresh
    // timestamp rather than only touching the name field.
    expect(updated?.updatedAt).not.toBe(beforeUpdatedAt)

    const second = listItems().find((item) => item.id === '22222222-2222-4222-8222-222222222222')
    expect(second?.name).toBe('Second item')
  })

  it('renameItemById returns null when no item matches the given id', () => {
    const result = renameItemById('does-not-exist', 'New name')
    expect(result).toBeNull()
  })
})
