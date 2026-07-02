import { fireEvent, render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

import { ErrorState } from '../../../components/ui/ErrorState'

// Two render paths: with and without onRetry (the component's one real
// conditional). Also covers the default vs. custom message prop, since both
// are part of the component's actual contract, not incidental detail.
describe('ErrorState', () => {
  it('renders the default message and no retry button when onRetry is omitted', () => {
    render(<ErrorState />)

    // getByText throws (failing the test) if the node is absent, so a
    // truthy assertion is sufficient proof of presence here.
    expect(screen.getByText('An error occurred while loading the data.')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull()
  })

  it('renders a custom message when provided', () => {
    render(<ErrorState message="Custom failure message" />)
    expect(screen.getByText('Custom failure message')).toBeTruthy()
  })

  it('renders a retry button and calls onRetry when clicked', async () => {
    const onRetry = vi.fn()
    render(<ErrorState onRetry={onRetry} />)

    const button = screen.getByRole('button', { name: 'Try again' })
    fireEvent.click(button)

    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
