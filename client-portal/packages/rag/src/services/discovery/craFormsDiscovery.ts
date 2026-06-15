import * as cheerio from 'cheerio'
import { BrowserClient } from '@crawler/core'
import { getCrawlerConfig, type CrawlerConfig, logger } from '@shared/types'
import { sources, getDb } from '@shared/types/db'
import { eq } from 'drizzle-orm'
import {
  normalizeFormNumber,
  resolveFormRegistryStatus,
  upsertFormRegistryRows
} from '../../corpus/formRegistry'
import { UrlNormalizer } from './urlNormalizer'
import type { DiscoveryResult } from './types'

export class CraFormsDiscoveryService {
  private config: CrawlerConfig
  private db = getDb()

  constructor (config?: CrawlerConfig) {
    this.config = config || getCrawlerConfig()
  }

  private async fetchDiscoveryHtml (url: string): Promise<string> {
    const referer = 'https://www.canada.ca/en/revenue-agency/services/forms-publications.html'
    const browser = new BrowserClient(this.config)

    try {
      const browserResponse = await browser.fetch(url, { timeout: 45_000, retries: 1 })
      if (browserResponse.html.length >= 500) {
        logger.crawl('Browser fetch successful for forms discovery', {
          url,
          status: browserResponse.status,
          textLength: browserResponse.html.length
        })
        return browserResponse.html
      }
      throw new Error(`Browser fetch content too short (${browserResponse.html.length} bytes)`)
    } catch (error) {
      logger.crawlWarn('Browser fetch failed for forms discovery, trying HTTP fallback', {
        url,
        error: error instanceof Error ? error.message : String(error)
      })
    } finally {
      await browser.close().catch(() => undefined)
    }

    const { requestText } = await import('@shared/types')
    const response = await requestText(url, {
      headers: { Referer: referer },
      timeout: 30_000,
      retries: 2
    })
    return response.text
  }

  /**
   * Parse forms.html catalog table into taxgpt.form_registry.
   * Does not create per-form RAG sources — registry metadata only.
   */
  async discoverFromFormsDirectory (sourceId: string): Promise<DiscoveryResult & {
    registryInserted: number
    registryUpdated: number
  }> {
    const result: DiscoveryResult & {
      registryInserted: number
      registryUpdated: number
    } = {
      sourceId,
      pageKind: 'directory',
      discoveredLinks: [],
      newSourcesCreated: 0,
      skippedDuplicates: 0,
      errors: [],
      registryInserted: 0,
      registryUpdated: 0
    }

    let url = ''

    try {
      const source = await this.db
        .select()
        .from(sources)
        .where(eq(sources.id, sourceId))
        .limit(1)

      if (source.length === 0) {
        throw new Error(`Source not found: ${sourceId}`)
      }

      url = source[0].url
      logger.crawl('Starting CRA forms catalog discovery', { sourceId, url })

      const html = await this.fetchDiscoveryHtml(url)
      const $ = cheerio.load(html)
      const registryRows: Array<{
        formNumber: string
        title: string
        landingUrl: string
        normalizedLandingUrl: string
        lastUpdate?: string | null
      }> = []

      $('table tbody tr').each((_, row) => {
        const $row = $(row)
        const $cells = $row.find('td')
        if ($cells.length < 2) return

        const $numberCell = $cells.eq(0)
        const $numberLink = $numberCell.find('a')
        const formNumber = normalizeFormNumber($numberCell.text().trim())
        const numberHref = $numberLink.attr('href')
        const title = $cells.eq(1).text().trim().replace(/\s+/g, ' ')
        const lastUpdateRaw = $cells.length >= 3 ? $cells.eq(2).text().trim() : ''

        if (!formNumber || !numberHref || !title) return

        try {
          const absoluteUrl = new URL(numberHref, url).toString()
          const urlObj = new URL(absoluteUrl)
          if (urlObj.hostname !== 'www.canada.ca' && urlObj.hostname !== 'canada.ca') return

          registryRows.push({
            formNumber,
            title,
            landingUrl: absoluteUrl,
            normalizedLandingUrl: UrlNormalizer.normalize(absoluteUrl, url),
            lastUpdate: lastUpdateRaw || null
          })
        } catch {
          // invalid URL
        }
      })

      logger.crawl('Discovered forms from catalog table', {
        baseUrl: url,
        totalForms: registryRows.length
      })

      const upsertSummary = await upsertFormRegistryRows(
        registryRows.map((row) => ({
          formNumber: row.formNumber,
          title: row.title,
          landingUrl: row.landingUrl,
          normalizedLandingUrl: row.normalizedLandingUrl,
          lastUpdate: row.lastUpdate,
          status: resolveFormRegistryStatus(row.title),
          metadata: {
            corpusRole: 'form_registry',
            catalogSourceId: sourceId
          }
        }))
      )

      result.registryInserted = upsertSummary.inserted
      result.registryUpdated = upsertSummary.updated
      result.newSourcesCreated = upsertSummary.inserted
      result.skippedDuplicates = upsertSummary.updated
      result.discoveredLinks = registryRows.map((row) => ({
        url: row.landingUrl,
        title: row.title,
        normalizedUrl: row.normalizedLandingUrl
      }))

      logger.crawl('CRA forms catalog discovery completed', {
        sourceId,
        registryInserted: upsertSummary.inserted,
        registryUpdated: upsertSummary.updated,
        totalForms: registryRows.length
      })

      return result
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      logger.crawlError('CRA forms catalog discovery failed', {
        sourceId,
        url,
        error: errorMsg
      })
      throw error
    }
  }
}
