import { portalFetch } from '../../lib/portalApi'
import { taxFetch } from '../../lib/taxIntelligenceApi'

export type TokenProvider = () => Promise<string | null>

export async function callPortalApi<T> (
  path: string,
  getToken: TokenProvider,
  init?: RequestInit
): Promise<T> {
  return await portalFetch<T>(path, getToken, init)
}

export async function callTaxApi<T> (
  path: string,
  getToken: TokenProvider,
  init?: RequestInit
): Promise<T> {
  return await taxFetch<T>(path, getToken, init)
}

