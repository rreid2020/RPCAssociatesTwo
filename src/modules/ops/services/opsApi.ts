import type { TokenProvider } from '../../../services/api/client'
import { callPortalApi } from '../../../services/api/client'

export type OpsOverview = {
  generatedAt: string
  corpus: {
    sourceCount: number
    ingestedSourceCount: number
    pendingSourceCount: number
    skippedSourceCount: number
    failedSourceCount: number
    chunkCount: number
    embeddingCount: number
    retrievalReady: boolean
  }
  taxesHub: {
    total: number
    pending: number
    ingested: number
    skipped: number
    failed?: number
    unknown: number
    content: number
    hubSeedSources: number
  }
  formRegistry: {
    total: number
    active: number
    archived: number
  }
}

export type OpsCountRow = { key: string; count: number }

export type OpsCorpusAudit = {
  totals: OpsOverview['corpus']
  byIngestStatus: OpsCountRow[]
  byCategory: OpsCountRow[]
  byPageKind: OpsCountRow[]
  taxesHubByCorpusRole: OpsCountRow[]
}

export type OpsFormRegistryStats = {
  totals: OpsOverview['formRegistry']
  byFamily: OpsCountRow[]
  recent: Array<{
    formNumber: string
    title: string
    status: string
    landingUrl: string
  }>
  tableMissing?: boolean
}

export type OpsExternalLink = {
  id: string
  label: string
  description: string
  url: string
  category: string
}

export async function getOpsAccess (getToken: TokenProvider): Promise<{ isStaff: boolean }> {
  return await callPortalApi<{ isStaff: boolean }>('/v1/ops/me', getToken)
}

export async function getOpsOverview (getToken: TokenProvider): Promise<OpsOverview> {
  const data = await callPortalApi<{ overview: OpsOverview }>('/v1/ops/overview', getToken)
  return data.overview
}

export async function getOpsCorpusAudit (getToken: TokenProvider): Promise<OpsCorpusAudit> {
  const data = await callPortalApi<{ corpus: OpsCorpusAudit }>('/v1/ops/corpus', getToken)
  return data.corpus
}

export async function getOpsTaxesHubStats (getToken: TokenProvider): Promise<OpsOverview['taxesHub']> {
  const data = await callPortalApi<{ taxesHub: OpsOverview['taxesHub'] }>('/v1/ops/taxes-hub', getToken)
  return data.taxesHub
}

export async function getOpsFormRegistryStats (getToken: TokenProvider): Promise<OpsFormRegistryStats> {
  const data = await callPortalApi<{ formRegistry: OpsFormRegistryStats }>('/v1/ops/forms-registry', getToken)
  return data.formRegistry
}

export async function getOpsExternalLinks (getToken: TokenProvider): Promise<OpsExternalLink[]> {
  const data = await callPortalApi<{ links: OpsExternalLink[] }>('/v1/ops/links', getToken)
  return data.links
}
