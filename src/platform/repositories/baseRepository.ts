export interface RepositoryResult<T> {
  data: T
  fetchedAt: string
}

export function createRepositoryResult<T> (data: T): RepositoryResult<T> {
  return {
    data,
    fetchedAt: new Date().toISOString()
  }
}
