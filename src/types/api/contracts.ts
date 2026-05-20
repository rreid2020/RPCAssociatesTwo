export interface PaginatedRequest {
  page?: number
  pageSize?: number
}

export interface PaginatedResponse<T> {
  rows: T[]
  page: number
  pageSize: number
  total: number
}

