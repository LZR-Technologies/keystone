import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import { LoadingSkeleton } from '../../../components/ui/LoadingSkeleton'

// One test per `variant` branch (the component's actual decision surface),
// plus the default-props path -- every branch in the source file's variant
// switch and its two counted-array helpers (CardSkeleton x count,
// ListSkeleton x count) is reached by this set.
describe('LoadingSkeleton', () => {
  it('renders the page variant by default (no props)', () => {
    render(<LoadingSkeleton />)
    // getByRole throws (failing the test) if no match exists, so a truthy
    // assertion is sufficient proof of presence here.
    expect(screen.getByRole('status', { name: 'Loading...' })).toBeTruthy()
  })

  it('renders `count` card skeletons for the card variant', () => {
    const { container } = render(<LoadingSkeleton variant="card" count={3} />)
    // Each CardSkeleton renders 3 SkeletonBar divs; asserting the outer
    // grid's direct children count proves `count` drove the render, not a
    // hardcoded number.
    const grid = container.querySelector('.grid.gap-4')
    expect(grid?.children).toHaveLength(3)
  })

  it('renders `count` rows for the list variant', () => {
    const { container } = render(<LoadingSkeleton variant="list" count={4} />)
    const list = container.querySelector('.space-y-2')
    expect(list?.children).toHaveLength(4)
  })

  it('renders the kanban variant with 4 columns', () => {
    const { container } = render(<LoadingSkeleton variant="kanban" />)
    const board = container.querySelector('.flex.gap-4.overflow-hidden')
    expect(board?.children).toHaveLength(4)
  })

  it('applies the className prop to the outer wrapper', () => {
    const { container } = render(<LoadingSkeleton className="custom-class" />)
    expect(container.firstElementChild?.className.split(' ')).toContain('custom-class')
  })
})
