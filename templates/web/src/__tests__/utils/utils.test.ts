import { describe, it, expect } from 'vitest'

import { cn } from '../../utils/utils'

// Fast unit layer: pure function, no I/O. Covers both halves of what cn
// does -- conditional class inclusion (clsx) and conflict resolution
// (tailwind-merge) -- since either half breaking would silently produce
// wrong class strings across every component that calls cn.
describe('cn', () => {
  it('joins static class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('drops falsy conditional segments', () => {
    const showB = false
    expect(cn('a', showB && 'b', undefined, null, 'c')).toBe('a c')
  })

  it('resolves conflicting Tailwind utilities by keeping the last one', () => {
    // Without tailwind-merge this would be "p-2 p-4" (both classes present,
    // CSS cascade decides); twMerge collapses it to just "p-4".
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })
})
