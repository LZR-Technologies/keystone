import { useEffect, useState } from 'react'

/**
 * Hook para verificar se o componente está montado (client-side)
 * Útil para evitar hydration mismatch com Server Components
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return mounted
}
