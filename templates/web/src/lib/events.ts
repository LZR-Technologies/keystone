/**
 * Event System — Green Copilot
 *
 * Sistema de eventos desacoplado para ações de negócio.
 * Preparado para integração futura com webhooks e ERPs.
 *
 * Uso:
 *   import { events } from '@/lib/events';
 *   events.emit('bid.status_changed', { bidId, oldStatus, newStatus });
 *   events.on('bid.status_changed', handler);
 */

// ============================================
// EVENT TYPES
// ============================================

export interface EventMap {
  // Bids
  'bid.created': { bidId: string; companyId: string; code: string }
  'bid.updated': { bidId: string; fields: string[] }
  'bid.status_changed': { bidId: string; oldStatus: string; newStatus: string }
  'bid.deleted': { bidId: string }

  // Contracts
  'contract.created': { contractId: string; companyId: string; code: string }
  'contract.updated': { contractId: string; fields: string[] }
  'contract.commitment_created': { contractId: string; commitmentId: string; noteNumber: string }
  'contract.note_added': { contractId: string; noteId: string }
  'contract.deleted': { contractId: string }

  // Activities
  'todo.created': { todoId: string; title: string }
  'todo.completed': { todoId: string }
  'todo.deleted': { todoId: string }
  'compromisso.created': { compromissoId: string; title: string; startDatetime: string }
  'compromisso.deleted': { compromissoId: string }
  'postit.created': { postitId: string }
  'postit.deleted': { postitId: string }

  // System
  'audit.logged': { entityType: string; entityId: string; action: string }
}

export type EventName = keyof EventMap
type EventHandler<T extends EventName> = (payload: EventMap[T]) => void | Promise<void>

// ============================================
// EVENT BUS
// ============================================

class EventBus {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handlers = new Map<string, Set<EventHandler<any>>>()

  on<T extends EventName>(event: T, handler: EventHandler<T>): () => void {
    let bucket = this.handlers.get(event)
    if (!bucket) {
      bucket = new Set()
      this.handlers.set(event, bucket)
    }
    bucket.add(handler)

    // Return unsubscribe function
    return () => {
      this.handlers.get(event)?.delete(handler)
    }
  }

  off<T extends EventName>(event: T, handler: EventHandler<T>): void {
    this.handlers.get(event)?.delete(handler)
  }

  async emit<T extends EventName>(event: T, payload: EventMap[T]): Promise<void> {
    const handlers = this.handlers.get(event)
    if (!handlers || handlers.size === 0) return

    const promises = Array.from(handlers).map(async (handler) => {
      try {
        await handler(payload)
      } catch (error) {
        console.error(`[events] Error in handler for "${event}":`, error)
      }
    })

    await Promise.allSettled(promises)
  }

  clear(): void {
    this.handlers.clear()
  }
}

// Singleton
export const events = new EventBus()
