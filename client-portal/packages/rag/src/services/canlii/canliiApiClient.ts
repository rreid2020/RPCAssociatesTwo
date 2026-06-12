import { logger } from '@shared/types'

/** Metadata-only endpoints. Full decision text must not be fetched via the CanLII API. */
const CANLII_API_BASE = 'https://api.canlii.org/v1'

export type CanliiCaseListItem = {
  databaseId: string
  caseId: string
  title: string
  citation: string
}

export type CanliiCaseMetadata = {
  databaseId: string
  caseId: string
  url: string
  title: string
  citation: string
  language: string
  decisionDate?: string
  docketNumber?: string
  keywords?: string
}

function resolveCaseId (caseId: { en?: string; fr?: string } | string): string {
  if (typeof caseId === 'string') return caseId
  return caseId.en || caseId.fr || ''
}

function getApiKey (): string {
  const key = String(process.env.CANLII_API_KEY || '').trim()
  if (!key) {
    throw new Error('CANLII_API_KEY is required for CanLII corpus discovery')
  }
  return key
}

function sleep (ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class CanliiApiClient {
  private readonly language: string
  private readonly requestDelayMs: number

  constructor (options: { language?: string; requestDelayMs?: number } = {}) {
    this.language = options.language || 'en'
    this.requestDelayMs = options.requestDelayMs ?? 250
  }

  private async request<T> (path: string, query: Record<string, string | number | undefined> = {}): Promise<T> {
    const url = new URL(`${CANLII_API_BASE}${path}`)
    url.searchParams.set('api_key', getApiKey())

    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value))
      }
    }

    logger.crawl('CanLII API request', { path, query })

    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(60_000)
    })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new Error(`CanLII API ${response.status} ${response.statusText}: ${body.substring(0, 300)}`)
    }

    await sleep(this.requestDelayMs)
    return response.json() as Promise<T>
  }

  async listCases (input: {
    databaseId: string
    offset: number
    resultCount: number
    decisionDateAfter?: string
    decisionDateBefore?: string
  }): Promise<CanliiCaseListItem[]> {
    const data = await this.request<{
      cases?: Array<{
        databaseId: string
        caseId: { en?: string; fr?: string } | string
        title: string
        citation: string
      }>
    }>(`/caseBrowse/${this.language}/${input.databaseId}/`, {
      offset: input.offset,
      resultCount: input.resultCount,
      decisionDateAfter: input.decisionDateAfter,
      decisionDateBefore: input.decisionDateBefore
    })

    return (data.cases || []).map((row) => ({
      databaseId: row.databaseId,
      caseId: resolveCaseId(row.caseId),
      title: row.title,
      citation: row.citation
    }))
  }

  async getCaseMetadata (databaseId: string, caseId: string): Promise<CanliiCaseMetadata> {
    const data = await this.request<CanliiCaseMetadata>(
      `/caseBrowse/${this.language}/${databaseId}/${caseId}/`
    )
    return data
  }
}
