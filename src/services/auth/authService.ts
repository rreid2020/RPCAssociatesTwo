import { type TokenProvider } from '../api/client'
import { getTenantSessionScope } from '../../lib/auth'

export interface AuthServiceContext {
  tokenProvider: TokenProvider
  tenantScope: ReturnType<typeof getTenantSessionScope>
}

export function createAuthServiceContext (tokenProvider: TokenProvider): AuthServiceContext {
  return {
    tokenProvider,
    tenantScope: getTenantSessionScope()
  }
}

