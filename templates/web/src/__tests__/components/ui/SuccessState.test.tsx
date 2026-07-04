import { fireEvent, render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

import { SuccessState } from '../../../components/ui/SuccessState'

// Three paths: default message with no hint/button, custom message + hint (the hint is
// conditional), and the optional action button — the component's whole contract.
describe('SuccessState', () => {
  it('renders the default message and no hint or button by default', () => {
    render(<SuccessState />)

    expect(screen.getByText('Done.')).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('renders a custom message and hint when provided', () => {
    render(<SuccessState message="Saved" hint="Your changes are live" />)

    expect(screen.getByText('Saved')).toBeTruthy()
    expect(screen.getByText('Your changes are live')).toBeTruthy()
  })

  it('renders an action button and calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<SuccessState action={{ label: 'Continue', onClick }} />)

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
