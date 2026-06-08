import type { ProblemDetail } from './types'

/**
 * Fetch wrapper com error handling RFC 9457
 * Handbook: Result Pattern para chamadas externas
 */
export async function apiFetch<T>(
  url: string,
  options?: RequestInit,
): Promise<{ success: true; data: T } | { success: false; error: ProblemDetail }> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const error = (await response.json()) as ProblemDetail
      return { success: false, error }
    }

    const data = (await response.json()) as T
    return { success: true, data }
  } catch {
    return {
      success: false,
      error: {
        type: 'https://api.lzr.com/errors/network',
        title: 'Network Error',
        status: 0,
        detail: 'Failed to connect to the server',
      },
    }
  }
}
