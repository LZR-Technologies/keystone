'use client'

import { useState } from 'react'

import { EmptyState } from './ui/EmptyState'
import { ErrorState } from './ui/ErrorState'
import { LoadingSkeleton } from './ui/LoadingSkeleton'

import { useItems, useRenameItem } from '@/features/items/use-items'

/**
 * Worked example wiring the React Query registry end to end: useItems (query)
 * and useRenameItem (mutation with optimistic update, see use-items.ts) drive
 * a real UI. This is the reference other features copy -- never useState +
 * useEffect for server data (CLAUDE.md convention).
 */
export function ItemsPanel() {
  const { data: items, isPending, isError, refetch } = useItems()
  const renameItem = useRenameItem()
  // Local UI state only (which row is mid-edit) -- server data itself never
  // lives in useState, per the data-fetching convention.
  const [editingId, setEditingId] = useState<string | null>(null)

  if (isPending) return <LoadingSkeleton variant="list" count={2} />
  if (isError) return <ErrorState onRetry={() => void refetch()} />
  // Empty is one of the four states a screen must handle: a successful fetch that returns nothing
  // shows an intentional message, never a blank list (see .claude/rules/experience-quality.md).
  if (items.length === 0) return <EmptyState />

  return (
    <ul className="space-y-2" aria-label="Items">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3"
        >
          <span className="text-sm text-text-1">{item.name}</span>
          <button
            type="button"
            onClick={() => {
              setEditingId(item.id)
              renameItem.mutate(
                { id: item.id, name: `${item.name} (renamed)` },
                { onSettled: () => setEditingId(null) },
              )
            }}
            disabled={editingId === item.id}
            className="text-xs text-text-2 underline hover:text-text-1 disabled:opacity-50"
          >
            {editingId === item.id ? 'Saving...' : 'Rename'}
          </button>
        </li>
      ))}
    </ul>
  )
}
