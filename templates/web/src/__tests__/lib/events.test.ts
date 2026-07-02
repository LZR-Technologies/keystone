import { describe, it, expect, vi } from 'vitest'
import { events } from '../../lib/events'

// The event bus carries real logic (subscribe, emit, unsubscribe, error isolation),
// so it ships with its own test — the pattern a generated project follows for its code.
describe('event bus', () => {
  it('delivers an emitted event to a subscribed handler', async () => {
    const handler = vi.fn()
    events.on('item.created', handler)
    await events.emit('item.created', { itemId: 'a1' })
    expect(handler).toHaveBeenCalledWith({ itemId: 'a1' })
    events.clear()
  })

  it('stops delivering after unsubscribe', async () => {
    const handler = vi.fn()
    const off = events.on('item.created', handler)
    off()
    await events.emit('item.created', { itemId: 'a1' })
    expect(handler).not.toHaveBeenCalled()
    events.clear()
  })

  it('emitting an event with no handlers is a no-op', async () => {
    await expect(events.emit('item.deleted', { itemId: 'x' })).resolves.toBeUndefined()
  })

  it('an error in one handler does not stop the others', async () => {
    const bad = vi.fn(() => {
      throw new Error('boom')
    })
    const good = vi.fn()
    events.on('item.updated', bad)
    events.on('item.updated', good)
    await events.emit('item.updated', { itemId: 'a1', fields: ['name'] })
    expect(good).toHaveBeenCalled()
    events.clear()
  })

  it('off() unsubscribes a handler directly, as an alternative to the on() return value', async () => {
    const handler = vi.fn()
    events.on('item.created', handler)
    events.off('item.created', handler)
    await events.emit('item.created', { itemId: 'a1' })
    expect(handler).not.toHaveBeenCalled()
    events.clear()
  })

  it('off() on an event with no subscribers is a no-op, not a throw', () => {
    expect(() => events.off('item.deleted', vi.fn())).not.toThrow()
  })

  it('a handler that throws a non-Error value is still logged and isolated, via String() not .message', async () => {
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const bad = vi.fn(() => {
      // Deliberately not an Error -- exercises the String(error) fallback
      // branch in events.ts's catch block, not error.message.
      throw 'plain string rejection'
    })
    const good = vi.fn()
    events.on('item.updated', bad)
    events.on('item.updated', good)

    await events.emit('item.updated', { itemId: 'a1', fields: ['name'] })

    expect(good).toHaveBeenCalled()
    // instanceof Error is false for a thrown string, so the emitter must
    // fall back to String(error) rather than reading a non-existent
    // .message. The logger formats level+module+message+data into a single
    // string argument (see logger.ts), hence one string assertion here.
    expect(logSpy).toHaveBeenCalledTimes(1)
    const [line] = logSpy.mock.calls[0] as [string]
    expect(line).toContain('"error":"plain string rejection"')
    logSpy.mockRestore()
    events.clear()
  })
})
