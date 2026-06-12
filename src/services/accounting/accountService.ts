import { callPortalApi, type TokenProvider } from '../api/client'

export async function fetchAccount (getToken: TokenProvider) {
  return callPortalApi<{
    account: {
      businessType: string
      profileBusinessType: string | null
      role: string
      organizationId: string | null
      name: string
      isPersonal: boolean
      profileOnboardingCompletedAt: string | null
    }
    profile: Record<string, unknown> | null
  }>('/v1/accounting/account', getToken)
}

export async function createAccount (
  getToken: TokenProvider,
  payload: { name: string; workspaceType: 'business' | 'firm' | 'individual'; profile?: Record<string, unknown> }
) {
  return callPortalApi<{ account: Record<string, unknown>; profile: Record<string, unknown> | null }>(
    '/v1/accounting/account',
    getToken,
    {
      method: 'POST',
      body: JSON.stringify(payload)
    }
  )
}

export async function listAccountMembers (getToken: TokenProvider) {
  const data = await callPortalApi<{ members: unknown[] }>('/v1/accounting/members', getToken)
  return data.members || []
}
