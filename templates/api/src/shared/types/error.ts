/**
 * Error Response — RFC 9457 (Problem Details)
 * Handbook: https://code.lzrtechnologies.com
 *
 * Exemplo:
 * {
 *   "type": "https://api.lzr.com/errors/validation",
 *   "title": "Validation Error",
 *   "status": 422,
 *   "detail": "Field 'cnpj' must have 14 digits.",
 *   "instance": "/api/v1/companies",
 *   "trace_id": "abc-123-def-456"
 * }
 */
export interface ProblemDetail {
  type: string
  title: string
  status: number
  detail: string
  instance?: string
  trace_id?: string
}

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly type: string,
    public readonly title: string,
    public readonly detail: string,
  ) {
    super(detail)
    this.name = 'AppError'
  }

  toProblemDetail(instance?: string, traceId?: string): ProblemDetail {
    return {
      type: this.type,
      title: this.title,
      status: this.status,
      detail: this.detail,
      instance,
      trace_id: traceId,
    }
  }
}

import { HTTP } from '../constants/http.js'

export class ValidationError extends AppError {
  constructor(detail: string) {
    super(HTTP.UNPROCESSABLE_ENTITY, 'https://api.lzr.com/errors/validation', 'Validation Error', detail)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(HTTP.NOT_FOUND, 'https://api.lzr.com/errors/not-found', 'Not Found', `${resource} not found`)
  }
}

export class UnauthorizedError extends AppError {
  constructor() {
    super(HTTP.UNAUTHORIZED, 'https://api.lzr.com/errors/unauthorized', 'Unauthorized', 'Authentication required')
  }
}

export class ForbiddenError extends AppError {
  constructor() {
    super(HTTP.FORBIDDEN, 'https://api.lzr.com/errors/forbidden', 'Forbidden', 'Insufficient permissions')
  }
}
