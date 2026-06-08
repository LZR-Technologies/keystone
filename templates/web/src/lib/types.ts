/**
 * RFC 9457 — Problem Details
 */
export interface ProblemDetail {
  type: string
  title: string
  status: number
  detail: string
  instance?: string
  trace_id?: string
}
