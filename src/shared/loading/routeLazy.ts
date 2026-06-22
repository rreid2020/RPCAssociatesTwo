import { ComponentType } from 'react'
import { lazyWithRetry } from './lazyWithRetry'

export function routeLazy<T extends ComponentType<any>> (
  importer: () => Promise<{ default: T }>
) {
  return lazyWithRetry(importer)
}
