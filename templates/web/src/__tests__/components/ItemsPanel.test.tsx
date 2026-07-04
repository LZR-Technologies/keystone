import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { ItemsPanel } from '../../components/ItemsPanel'

import * as useItemsModule from '@/features/items/use-items'

import type { Item } from '@/features/items/api'
import type { UseQueryResult } from '@tanstack/react-query'

// The React Query wiring itself (loading/error states, optimistic update,
// rollback) is already proven end to end in use-items.test.tsx against the
// real hooks. This suite is about ItemsPanel's OWN decisions: which of the
// three render branches (pending / error / loaded-list) to take, and
// wiring the rename button's onClick + disabled state to the mutation --
// so the hooks are mocked here on purpose, at the module ItemsPanel
// actually imports.
vi.mock('@/features/items/use-items', async () => {
  const actual = await vi.importActual<typeof useItemsModule>('@/features/items/use-items')
  return { ...actual, useItems: vi.fn(), useRenameItem: vi.fn() }
})

const sampleItems: Item[] = [
  { id: '1', name: 'Alpha', updatedAt: '2026-01-01T00:00:00.000Z', deletedAt: null },
  { id: '2', name: 'Beta', updatedAt: '2026-01-02T00:00:00.000Z', deletedAt: null },
]

// Minimal fakes matching only the fields ItemsPanel actually reads off the
// query/mutation result -- casting the rest away keeps each test's fake
// data. Full-shape fakes were tried first and just repeated
// (irrelevant) React Query internals on every property in every test.
//
// The mutation fake is typed via ReturnType<typeof useRenameItem> instead of
// hand-assembling UseMutationResult's generics: those generics are derived
// from apiFetch's Result-wrapped return type, and re-deriving them by hand
// here previously drifted out of sync with use-items.ts and failed
// typecheck -- ReturnType tracks the real hook's type automatically.
function fakeQueryResult(overrides: Partial<UseQueryResult<Item[], Error>>) {
  return overrides as UseQueryResult<Item[], Error>
}

function fakeMutationResult(mutate: (...args: never[]) => void) {
  return { mutate } as unknown as ReturnType<typeof useItemsModule.useRenameItem>
}

/**
 * Asserts and narrows away the `| undefined` that TypeScript's
 * noUncheckedIndexedAccess adds to array indexing -- RTL's getAllByRole
 * already throws (failing the test) if the query matches nothing, so a
 * result array here is never actually empty; this only satisfies the type
 * checker without silently swallowing a real "not found" case with `!`.
 */
function first<T>(items: T[]): T {
  const item = items[0]
  if (item === undefined) throw new Error('Expected at least one match, found none.')
  return item
}

describe('ItemsPanel', () => {
  beforeEach(() => {
    vi.mocked(useItemsModule.useRenameItem).mockReturnValue(fakeMutationResult(vi.fn()))
  })

  it('renders the loading skeleton while the query is pending', () => {
    vi.mocked(useItemsModule.useItems).mockReturnValue(
      fakeQueryResult({ isPending: true, isError: false }),
    )

    render(<ItemsPanel />)

    // getByRole throws (failing the test) if no match exists, so a truthy
    // assertion is sufficient proof of presence here.
    expect(screen.getByRole('status', { name: 'Loading...' })).toBeTruthy()
  })

  it('renders the error state and retries via refetch when the query fails', () => {
    const refetch = vi.fn()
    vi.mocked(useItemsModule.useItems).mockReturnValue(
      fakeQueryResult({ isPending: false, isError: true, refetch }),
    )

    render(<ItemsPanel />)
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('renders the empty state when the query resolves with no items', () => {
    // Covers the empty-list branch (items.length === 0) in ItemsPanel -- the
    // one render path not otherwise exercised by this suite's pending/error/
    // loaded-list cases.
    vi.mocked(useItemsModule.useItems).mockReturnValue(
      fakeQueryResult({ isPending: false, isError: false, data: [] }),
    )

    render(<ItemsPanel />)

    expect(screen.getByText('Nothing here yet.')).toBeTruthy()
  })

  it('renders the item list once loaded', () => {
    vi.mocked(useItemsModule.useItems).mockReturnValue(
      fakeQueryResult({ isPending: false, isError: false, data: sampleItems }),
    )

    render(<ItemsPanel />)

    expect(screen.getByText('Alpha')).toBeTruthy()
    expect(screen.getByText('Beta')).toBeTruthy()
    expect(screen.getAllByRole('button', { name: 'Rename' })).toHaveLength(2)
  })

  it('clicking Rename calls the mutation and shows "Saving..." while that row is mid-edit', async () => {
    const mutate = vi.fn(
      (_vars: { id: string; name: string }, opts?: { onSettled?: () => void }) => {
        // onSettled is not invoked here on purpose -- this test asserts the
        // MID-FLIGHT state (button disabled, label "Saving..."), which only
        // exists between the click and the mutation settling.
        void opts
      },
    )
    vi.mocked(useItemsModule.useItems).mockReturnValue(
      fakeQueryResult({ isPending: false, isError: false, data: sampleItems }),
    )
    vi.mocked(useItemsModule.useRenameItem).mockReturnValue(fakeMutationResult(mutate))

    render(<ItemsPanel />)
    const firstButton = first(screen.getAllByRole('button', { name: 'Rename' }))
    fireEvent.click(firstButton)

    await waitFor(() =>
      expect(mutate).toHaveBeenCalledWith(
        { id: '1', name: 'Alpha (renamed)' },
        // vitest's expect.any() is typed as `any` by design — it is an assertion matcher,
        // not an untyped value flowing into logic, so the unsafe-* guard is not meaningful here.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        expect.objectContaining({ onSettled: expect.any(Function) }),
      ),
    )
    await waitFor(() => expect(screen.getByText('Saving...')).toBeTruthy())
    expect((firstButton as HTMLButtonElement).disabled).toBe(true)
  })

  it('onSettled clears the editing state back to "Rename"', async () => {
    let capturedOnSettled: (() => void) | undefined
    const mutate = vi.fn(
      (_vars: { id: string; name: string }, opts?: { onSettled?: () => void }) => {
        capturedOnSettled = opts?.onSettled
      },
    )
    vi.mocked(useItemsModule.useItems).mockReturnValue(
      fakeQueryResult({ isPending: false, isError: false, data: sampleItems }),
    )
    vi.mocked(useItemsModule.useRenameItem).mockReturnValue(fakeMutationResult(mutate))

    render(<ItemsPanel />)
    const firstButton = first(screen.getAllByRole('button', { name: 'Rename' }))
    fireEvent.click(firstButton)
    await waitFor(() => expect(screen.getByText('Saving...')).toBeTruthy())

    capturedOnSettled?.()

    await waitFor(() => expect(screen.getAllByText('Rename')[0]).toBeTruthy())
  })
})
