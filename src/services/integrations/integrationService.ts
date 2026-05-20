import { callPortalApi, type TokenProvider } from '../api/client'

export async function getIntegrationStatus (getToken: TokenProvider): Promise<any> {
  return await callPortalApi('/v1/accounting/integrations', getToken)
}

export async function getIntegrationConnectUrl (
  providerId: string,
  getToken: TokenProvider
): Promise<string> {
  const data = await callPortalApi<{ url: string }>(`/v1/accounting/integrations/${providerId}/connect-url`, getToken, {
    method: 'POST'
  })
  return data.url
}

