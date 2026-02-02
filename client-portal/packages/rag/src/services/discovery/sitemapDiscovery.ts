import { requestText } from '@shared/types';
import { logger } from '@shared/types';
import * as cheerio from 'cheerio';

/**
 * Service for discovering folio URLs from sitemaps
 * This is an optional discovery method if sitemaps are available
 */
export class SitemapDiscoveryService {
  /**
   * Discover folio URLs from a sitemap
   * @param sitemapUrl - URL to the sitemap (XML format)
   * @returns Array of discovered folio URLs
   */
  async discoverFromSitemap(sitemapUrl: string): Promise<string[]> {
    logger.crawl('Fetching sitemap', { url: sitemapUrl });

    try {
      const result = await requestText(sitemapUrl);
      const xml = result.text;

      // Parse XML sitemap
      const $ = cheerio.load(xml, { xmlMode: true });
      const urls: string[] = [];

      // Extract URLs from sitemap
      $('url loc').each((_, element) => {
        const url = $(element).text().trim();
        if (url) {
          // Filter to folio URLs
          if (
            url.includes('/income-tax-folios') ||
            url.includes('/income-tax-folios-index') ||
            url.includes('/folio')
          ) {
            urls.push(url);
          }
        }
      });

      // Also check for sitemap index (nested sitemaps)
      $('sitemap loc').each((_, element) => {
        const nestedSitemapUrl = $(element).text().trim();
        if (nestedSitemapUrl) {
          logger.crawl('Found nested sitemap', { url: nestedSitemapUrl });
          // Could recursively fetch nested sitemaps, but for now just log
        }
      });

      logger.crawl('Discovered URLs from sitemap', {
        sitemapUrl,
        urlCount: urls.length,
      });

      return urls;
    } catch (error) {
      logger.crawlError('Failed to fetch sitemap', {
        sitemapUrl,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Discover from multiple sitemaps
   */
  async discoverFromSitemaps(sitemapUrls: string[]): Promise<string[]> {
    const allUrls = new Set<string>();

    for (const sitemapUrl of sitemapUrls) {
      try {
        const urls = await this.discoverFromSitemap(sitemapUrl);
        urls.forEach(url => allUrls.add(url));
      } catch (error) {
        logger.crawlError('Failed to process sitemap', {
          sitemapUrl,
          error: error instanceof Error ? error.message : String(error),
        });
        // Continue with other sitemaps
      }
    }

    return Array.from(allUrls);
  }
}
