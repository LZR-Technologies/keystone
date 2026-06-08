/**
 * Result Pattern — Green Copilot
 *
 * Tipo para retornos de operações que podem falhar,
 * sem usar throw/catch para fluxo de controle.
 *
 * Uso:
 *   import { Result, ok, err } from '@/types/result';
 *
 *   async function createBid(data: BidInsert): Promise<Result<Bid, string>> {
 *     try {
 *       const bid = await bidService.create(data);
 *       return ok(bid);
 *     } catch (e) {
 *       return err('Falha ao criar licitação');
 *     }
 *   }
 *
 *   const result = await createBid(data);
 *   if (result.ok) {
 *     console.log(result.value);
 *   } else {
 *     console.error(result.error);
 *   }
 */

// ============================================
// RESULT TYPE
// ============================================

export type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E }

// ============================================
// CONSTRUCTORS
// ============================================

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value }
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error }
}

// ============================================
// HELPERS
// ============================================

/** Wrap an async operation that may throw into a Result */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  mapError?: (e: unknown) => string,
): Promise<Result<T, string>> {
  try {
    const value = await fn()
    return ok(value)
  } catch (e) {
    const message = mapError ? mapError(e) : e instanceof Error ? e.message : 'Erro desconhecido'
    return err(message)
  }
}

/** Unwrap a Result, throwing if it's an error */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.ok) return result.value
  throw new Error(String(result.error))
}

/** Map the value of a successful Result */
export function mapResult<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  if (result.ok) return ok(fn(result.value))
  return result
}
