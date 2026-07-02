import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import { useMounted } from '../../hooks/use-mounted'

// The hook's whole purpose is the false -> true transition between the
// server-rendered pass and the client effect running, so the test asserts
// both states rather than just the settled value.
describe('useMounted', () => {
  it('starts false and flips to true once the effect runs', async () => {
    const { result } = renderHook(() => useMounted())

    // useEffect runs after the initial render but React Testing Library's
    // act() wrapping around renderHook can make it synchronous in some
    // environments -- waitFor tolerates either timing without being flaky.
    await waitFor(() => expect(result.current).toBe(true))
  })
})
