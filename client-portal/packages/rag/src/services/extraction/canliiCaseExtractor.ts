/** @deprecated CanLII API license prohibits full-text indexing. Use canliiMetadataIngest instead. */
import * as cheerio from 'cheerio'
import TurndownService from 'turndown'
import { logger } from '@shared/types'

const turndownService = new TurndownService()

export class CanliiCaseExtractor {
  extract (html: string, url: string): { text: string; title: string; metadata: Record<string, unknown> } {
    const $ = cheerio.load(html)

    const title =
      $('h1').first().text().trim() ||
      $('meta[property="og:title"]').attr('content')?.trim() ||
      $('title').text().trim() ||
      ''

    $('script, style, nav, header, footer, aside, .toolbar, .breadcrumb').remove()

    const contentSelectors = [
      '#document',
      '#documentContent',
      '.document',
      'article',
      'main'
    ]

    let contentHtml = ''
    for (const selector of contentSelectors) {
      const node = $(selector)
      if (node.length > 0) {
        contentHtml = node.html() || ''
        break
      }
    }

    if (!contentHtml) {
      contentHtml = $('body').html() || ''
    }

    const markdown = turndownService.turndown(contentHtml)

    logger.extract('Extracted CanLII case content', {
      url,
      title,
      textLength: markdown.length
    })

    return {
      text: markdown,
      title,
      metadata: {
        extractor: 'canlii_case'
      }
    }
  }
}
