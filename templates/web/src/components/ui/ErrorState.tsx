'use client'

import { AlertCircle, RefreshCcw } from 'lucide-react'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({
  message = 'An error occurred while loading the data.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center" role="alert">
      <div className="rounded-full bg-err-bg p-4">
        <AlertCircle className="h-8 w-8 text-err" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-text-1">{message}</p>
        <p className="text-xs text-text-2">Check your connection and try again.</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-1 transition-colors duration-[180ms] hover:border-border-hi"
          aria-label="Try again"
        >
          <RefreshCcw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
      )}
    </div>
  )
}
