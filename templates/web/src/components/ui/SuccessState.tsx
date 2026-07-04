'use client'

// One of the four intentional states a screen must handle (loading / error / empty / success).
// Success confirms a completed action (a submitted form, a finished flow) instead of leaving the
// user unsure it worked. Colors come from the semantic `ok` design tokens.
import { CheckCircle2 } from 'lucide-react'

interface SuccessStateProps {
  message?: string
  hint?: string
  action?: { label: string; onClick: () => void }
}

export function SuccessState({ message = 'Done.', hint, action }: SuccessStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 py-16 text-center"
      role="status"
    >
      <div className="rounded-full bg-ok-bg p-4">
        <CheckCircle2 className="h-8 w-8 text-ok" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-text-1">{message}</p>
        {hint && <p className="text-xs text-text-2">{hint}</p>}
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
