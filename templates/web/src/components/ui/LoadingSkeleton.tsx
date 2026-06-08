'use client'

import { cn } from '@/utils/utils'

interface LoadingSkeletonProps {
  variant?: 'card' | 'list' | 'kanban' | 'page'
  count?: number
  className?: string
}

function SkeletonBar({ className }: { className?: string }) {
  return <div className={cn('bg-elevated animate-pulse rounded', className)} aria-hidden="true" />
}

function CardSkeleton() {
  return (
    <div className="border-border bg-surface space-y-3 rounded-lg border p-4">
      <SkeletonBar className="h-4 w-3/4" />
      <SkeletonBar className="h-3 w-1/2" />
      <SkeletonBar className="h-3 w-full" />
    </div>
  )
}

function ListSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="border-border bg-surface flex items-center gap-3 rounded-lg border p-3"
        >
          <SkeletonBar className="h-5 w-5 rounded" />
          <SkeletonBar className="h-4 flex-1" />
          <SkeletonBar className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}

function KanbanSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: 4 }).map((_, col) => (
        <div key={col} className="min-w-[280px] space-y-3">
          <SkeletonBar className="h-6 w-32" />
          {Array.from({ length: 3 - col }).map((_, card) => (
            <CardSkeleton key={card} />
          ))}
        </div>
      ))}
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <SkeletonBar className="h-8 w-48" />
      <div className="grid grid-cols-3 gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <ListSkeleton count={5} />
    </div>
  )
}

export function LoadingSkeleton({ variant = 'page', count = 5, className }: LoadingSkeletonProps) {
  return (
    <div className={cn('w-full', className)} role="status" aria-label="Carregando...">
      {variant === 'card' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: count }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}
      {variant === 'list' && <ListSkeleton count={count} />}
      {variant === 'kanban' && <KanbanSkeleton />}
      {variant === 'page' && <PageSkeleton />}
    </div>
  )
}
