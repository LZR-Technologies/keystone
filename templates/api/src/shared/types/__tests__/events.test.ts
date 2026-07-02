import { describe, expect, it, vi } from 'vitest'

import { events } from '../events.js'

// Declaration merging is the documented way for a feature to register its
// events (see events.ts) — this test doubles as a living example of it.
// 'never.subscribed' is a second, distinct event name (never passed to
// `on()` anywhere in this file) purely so one test below can exercise the
// "nobody has ever subscribed to this event" branch — see that test for why
// 'test.fired' cannot be reused for it.
declare module '../events.js' {
  interface EventMap {
    'test.fired': { n: number }
    'never.subscribed': { n: number }
  }
}

describe('events', () => {
  it('delivers the payload to every subscribed handler', async () => {
    const first = vi.fn()
    const second = vi.fn()
    const offFirst = events.on('test.fired', first)
    const offSecond = events.on('test.fired', second)

    await events.emit('test.fired', { n: 1 })

    expect(first).toHaveBeenCalledWith({ n: 1 })
    expect(second).toHaveBeenCalledWith({ n: 1 })

    offFirst()
    offSecond()
  })

  it('stops delivering after unsubscribe', async () => {
    const handler = vi.fn()
    const off = events.on('test.fired', handler)
    off()

    await events.emit('test.fired', { n: 2 })

    expect(handler).not.toHaveBeenCalled()
  })

  it('does nothing when emitting an event nobody has ever subscribed to', async () => {
    // Must use 'never.subscribed', not 'test.fired': other tests in this file
    // call `on('test.fired', ...)` and then unsubscribe, which leaves an
    // empty-but-EXISTING Set in the bus's internal Map. An empty Set and a
    // missing Map entry are different internal states, and only the latter
    // (an event with zero calls to `on()`, ever) exercises the
    // `if (!handlers) return` branch in emit() — emitting into a truly empty
    // void, e.g. a feature that emits before any consumer has registered.
    await expect(events.emit('never.subscribed', { n: 3 })).resolves.toBeUndefined()
  })

  it('isolates a failing handler: the others still run', async () => {
    // The bus logs the failure via console.error by design (fire-and-forget
    // events must never take the emitter down); silence it for the test.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const failing = vi.fn(() => {
      throw new Error('handler exploded')
    })
    const healthy = vi.fn()
    const offFailing = events.on('test.fired', failing)
    const offHealthy = events.on('test.fired', healthy)

    await events.emit('test.fired', { n: 4 })

    expect(healthy).toHaveBeenCalledWith({ n: 4 })
    expect(consoleError).toHaveBeenCalled()

    offFailing()
    offHealthy()
    consoleError.mockRestore()
  })
})
