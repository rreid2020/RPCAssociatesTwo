import * as cheerio from 'cheerio'
import { BrowserClient } from '@crawler/core'
import { getCrawlerConfig, type CrawlerConfig, logger } from '@shared/types'
import { sources, getDb } from '@shared/types/db'
import { eq } from 'drizzle-orm'
import type { PageKind, SourceCategory, SourceType } from '@shared/types'
import {
  classifyTaxesHubFamily,
  isTaxesHubInScopeUrl,
  shouldDiscoverSource,
  shouldSkipTaxesHubDiscoveryUrl
} from '../../corpus/sourcePolicy'
import { UrlNormalizer } from './urlNormalizer'
import type { DiscoveryResult, DiscoveredLink } from './types'

type DiscoveredHubLink = {
  url: string
  title: string
  normalizedUrl: string
}

export class CraTaxesHubDiscoveryService {
  private config: CrawlerConfig
  private db = getDb()

  constructor (config?: CrawlerConfig) {
    this.config = config || getCrawlerConfig()
  }

  private async fetchDiscoveryHtml (url: string): Promise<string> {
    const referer = 'https://www.canada.ca/en/services/taxes.html'
    const browser = new BrowserClient(this.config)

    try {
      const browserResponse = await browser.fetch(url, { timeout: 45_000, retries: 1 })
      if (browserResponse.html.length >= 500) {
        return browserResponse.html
      }
      throw new Error(`Browser fetch content too short (${browserResponse.html.length} bytes)`)
    } catch (error) {
      logger.crawlWarn('Browser fetch failed for taxes hub discovery, trying HTTP fallback', {
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

  classifyPageKind (html: string, url: string, linkCount: number): PageKind {
    const $ = cheerio.load(html)
    const mainText = $('main, article, [role="main"], .container').text().replace(/\s+/g, ' ').trim()
    const headingCount = $('main h2, article h2, main h3, article h3').length

    if (linkCount >= 12 && mainText.length < 3200) return 'directory'
    if (linkCount >= 6 && headingCount <= 2 && mainText.length < 2200) return 'directory'
    if (mainText.length >= 700) return 'content'
    if (linkCount >= 4) return 'directory'
    return 'content'
  }

  classifySource (url: string, title: string, pageKind: PageKind): {
    sourceType: SourceType
    category: SourceCategory
    pageKind: PageKind
  } {
    const family = classifyTaxesHubFamily(url)
    const resolvedPageKind = pageKind === 'unknown' ? 'content' : pageKind

    return {
      sourceType: resolvedPageKind === 'directory' ? 'html' : 'html',
      category: family === 'gst_hst' ? 'guide' : 'guide',
      pageKind: resolvedPageKind
    }
  }

  discoverLinks (html: string, baseUrl: string): DiscoveredHubLink[] {
    const $ = cheerio.load(html)
    const seen = new Set<string>()
    const links: DiscoveredHubLink[] = []

    $('a[href]').each((_, element) => {
      const href = $(element).attr('href')
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('javascript:')) {
        return
      }

      try {
        const absoluteUrl = new URL(href, baseUrl).toString()
        if (!isTaxesHubInScopeUrl(absoluteUrl) || shouldSkipTaxesHubDiscoveryUrl(absoluteUrl)) {
          return
        }

        const normalizedUrl = UrlNormalizer.normalize(absoluteUrl, baseUrl)
        if (seen.has(normalizedUrl)) return
        seen.add(normalizedUrl)

        const title = $(element).text().trim().replace(/\s+/g, ' ') ||
          $(element).attr('title')?.trim() ||
          ''

        links.push({
          url: absoluteUrl,
          title: title || absoluteUrl.split('/').pop()?.replace(/\.html$/, '') || 'Untitled',
          normalizedUrl
        })
      } catch {
        // invalid URL
      }
    })

    return links
  }

  async discoverFromSource (sourceId: string): Promise<DiscoveryResult> {
    const result: DiscoveryResult = {
      sourceId,
      pageKind: 'directory',
      discoveredLinks: [],
      newSourcesCreated: 0,
      skippedDuplicates: 0,
      errors: []
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
      logger.crawl('Starting taxes hub discovery', { sourceId, url })

      const html = await this.fetchDiscoveryHtml(url)
      const discoveredLinks = this.discoverLinks(html, url)
      const pageKind = this.classifyPageKind(html, url, discoveredLinks.length)

      result.pageKind = pageKind
      result.discoveredLinks = discoveredLinks.map((link) => ({
        url: link.url,
        title: link.title,
        normalizedUrl: link.normalizedUrl
      }))

      for (const link of discoveredLinks) {
        try {
          if (!shouldDiscoverSource(link.title)) {
            result.skippedDuplicates += 1
            continue
          }

          const existing = await this.db
            .select({ id: sources.id })
            .from(sources)
            .where(eq(sources.normalizedUrl, link.normalizedUrl))
            .limit(1)

          if (existing[0]?.id) {
            result.skippedDuplicates += 1
            continue
          }

          const classification = this.classifySource(link.url, link.title, 'unknown')

          await this.db.insert(sources).values({
            url: link.url,
            normalizedUrl: link.normalizedUrl,
            title: link.title,
            sourceType: classification.sourceType,
            category: classification.category,
            ingestStatus: 'pending',
            pageKind: 'unknown',
            priority: 'high',
            parentSourceId: sourceId,
            metadata: {
              corpusRole: 'taxes_hub',
              taxesHubFamily: classifyTaxesHubFamily(link.url)
            }
          })

          result.newSourcesCreated += 1
        } catch (error) {
          result.errors.push({
            url: link.url,
            error: error instanceof Error ? error.message : String(error)
          })
        }
      }

      const existingMeta = (source[0].metadata || {}) as Record<string, unknown>
      if (result.newSourcesCreated > 0 && pageKind === 'directory') {
        await this.db
          .update(sources)
          .set({
            ingestStatus: 'skipped',
            pageKind: 'directory',
            errorMessage: 'Taxes hub directory — child sources discovered'
          })
          .where(eq(sources.id, sourceId))
      } else if (result.newSourcesCreated === 0 && existingMeta.corpusSeed === 'canada_taxes_hub') {
        await this.db
          .update(sources)
          .set({
            ingestStatus: 'skipped',
            pageKind: 'directory',
            errorMessage: 'Taxes hub root — child sources discovered'
          })
          .where(eq(sources.id, sourceId))
      } else if (result.newSourcesCreated === 0) {
        // Promote leaf/duplicate-expanded pages so expand does not re-process them forever.
        // classifyPageKind often returns "content" while DB row is still "unknown".
        await this.db
          .update(sources)
          .set({
            ingestStatus: 'pending',
            pageKind: 'content',
            metadata: {
              ...existingMeta,
              taxesHubExpanded: true,
              classifiedPageKind: pageKind
            }
          })
          .where(eq(sources.id, sourceId))
      }

      logger.crawl('Taxes hub discovery completed', {
        sourceId,
        url,
        discovered: discoveredLinks.length,
        newSourcesCreated: result.newSourcesCreated,
        skippedDuplicates: result.skippedDuplicates
      })

      return result
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      logger.crawlError('Taxes hub discovery failed', { sourceId, url, error: errorMsg })
      throw error
    }
  }
}
