export interface PaginationParams {
  page?: number
  pageSize?: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export const DEFAULT_PAGE_SIZE = 25

export function toRange(params?: PaginationParams): {
  from: number
  to: number
  page: number
  pageSize: number
} {
  const page = params?.page ?? 1
  const pageSize = params?.pageSize ?? DEFAULT_PAGE_SIZE
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  return { from, to, page, pageSize }
}

export function toPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  return {
    data,
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  }
}
