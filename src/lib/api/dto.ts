export interface ApiEnvelope<T> {
  data: T
  requestId?: string
}

export interface ApiErrorEnvelope {
  error: string
  requestId?: string
  details?: Record<string, unknown>
}

