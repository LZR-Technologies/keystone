'use client'

// One of the four intentional states a screen must handle (loading / error / empty / success).
// Empty is shown when a request succeeds but returns nothing — never left as a blank area, which
// reads as "broken". Colors come from the design tokens, so it inherits the project's own look.
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  message?: string
  hint?: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({
  message = 'Nothing here yet.',
  hint = 'Items you create will appear here.',
  action,
}: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 py-16 text-center"
      role="status"
    >
      <div className="rounded-full bg-elevated p-4">
        <Inbox className="h-8 w-8 text-text-3" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-text-1">{message}</p>
        <p className="text-xs text-text-2">{hint}</p>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-1 transition-colors duration-[180ms] hover:border-border-hi"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
