// Why: o EventMap começa vazio no template; cada feature deve estendê-lo
// via declaration merging (interface EventMap { 'bid.created': BidCreatedPayload })
// para registrar seus eventos.
export interface EventMap {
  // Exemplo (descomente em features reais):
  // 'health.checked': { timestamp: number }
}

export type EventName = keyof EventMap

type EventHandler<T extends EventName> = (payload: EventMap[T]) => void | Promise<void>

// Why: armazenamos handlers como `EventHandler<EventName>` (não `any`) na Map
// e fazemos cast nos pontos de leitura, porque a Map perde a relação entre key
// e payload type. O contrato público (`on`/`emit`) preserva a inferência por evento.
class EventBus {
  private handlers = new Map<EventName, Set<EventHandler<EventName>>>()

  on<T extends EventName>(event: T, handler: EventHandler<T>): () => void {
    let bucket = this.handlers.get(event)
    if (!bucket) {
      bucket = new Set()
      this.handlers.set(event, bucket)
    }
    bucket.add(handler as EventHandler<EventName>)
    return () => {
      this.handlers.get(event)?.delete(handler as EventHandler<EventName>)
    }
  }

  async emit<T extends EventName>(event: T, payload: EventMap[T]): Promise<void> {
    const handlers = this.handlers.get(event)
    if (!handlers) return
    await Promise.allSettled(
      Array.from(handlers).map(async (h) => {
        try {
          await (h as EventHandler<T>)(payload)
        } catch (e) {
          console.error('[events] handler failed', { event, error: e })
        }
      }),
    )
  }
}

export const events = new EventBus()
