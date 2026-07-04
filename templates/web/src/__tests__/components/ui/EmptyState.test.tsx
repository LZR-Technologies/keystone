import { fireEvent, render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

import { EmptyState } from '../../../components/ui/EmptyState'

// Three paths: default content, custom message/hint, and the one real conditional
// (the optional action button) — the component's whole contract.
describe('EmptyState', () => {
  it('renders the default message and no action button when action is omitted', () => {
    render(<EmptyState />)

    expect(screen.getByText('Nothing here yet.')).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('renders a custom message and hint when provided', () => {
    render(<EmptyState message="No items" hint="Add one to begin" />)

    expect(screen.getByText('No items')).toBeTruthy()
    expect(screen.getByText('Add one to begin')).toBeTruthy()
  })

  it('renders an action button and calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<EmptyState action={{ label: 'Create item', onClick }} />)

    fireEvent.click(screen.getByRole('button', { name: 'Create item' }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
