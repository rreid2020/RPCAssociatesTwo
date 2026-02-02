import * as cheerio from 'cheerio';
import { sources, getDb } from '../../shared/dist/db/index.js';
import { getCrawlerConfig, type CrawlerConfig } from '../../shared/dist/config/index.js';
import { logger } from '../../shared/dist/utils/index.js';
import { CRA_FORMS_PUBLICATIONS_URL, type CrawlSummary } from '../../shared/dist/index.js';
import { eq } from 'drizzle-orm';
import 'dotenv/config';
import { RateLimiter } from './rate-limiter';
import { RobotsChecker } from './robots-checker';
import { normalizeUrl, isAllowedUrl } from './url-utils';
import { HttpClient } from './http-client';
import { BrowserClient } from './browser-client';

export class Crawler {
  private rateLimiter: RateLimiter;
  private robotsChecker: RobotsChecker;
  private httpClient: HttpClient;
  private browserClient: BrowserClient;
  private config: CrawlerConfig;
  private visitedUrls = new Set<string>();
  private discoveredUrls = new Set<string>();

  constructor(config?: CrawlerConfig) {
    this.config = config || getCrawlerConfig();
    this.rateLimiter = new RateLimiter(this.config.requestsPerSecond);
    this.robotsChecker = new RobotsChecker(this.config);
    this.httpClient = new HttpClient(this.config);
    this.browserClient = new BrowserClient(this.config);
  }

  async crawlCraCatalogue(seedUrl?: string): Promise<CrawlSummary> {
    const url = seedUrl || CRA_FORMS_PUBLICATIONS_URL;
    const summary: CrawlSummary = {
      totalFound: 0,
      newSources: 0,
      updatedSources: 0,
      skipped: 0,
      errors: 0,
    };

    this.visitedUrls.clear();
    this.discoveredUrls.clear();

    logger.crawl('Starting CRA catalogue crawl', {
      seedUrl: url,
      maxDepth: this.config.maxDepth,
      allowlistPrefixes: this.config.allowlistPrefixes,
    });

    try {
      await this.crawlPage(url, 0, summary);
    } catch (error) {
      logger.crawlError('Crawl failed', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      summary.errors++;
    }

    logger.crawl('Crawl completed', {
      totalFound: summary.totalFound,
      newSources: summary.newSources,
      updatedSources: summary.updatedSources,
      skipped: summary.skipped,
      errors: summary.errors,
    });

    return summary;
  }

  private async crawlPage(url: string, depth: number, summary: CrawlSummary): Promise<void> {
    let normalizedUrl: string;
    try {
      normalizedUrl = normalizeUrl(url);
    } catch (error) {
      logger.crawl('URL normalization failed, skipping', { url, error: error instanceof Error ? error.message : String(error) });
      summary.skipped++;
      return;
    }

    // Check depth
    if (depth > this.config.maxDepth) {
      logger.crawl('URL skipped: max depth exceeded', { url: normalizedUrl, depth, maxDepth: this.config.maxDepth });
      summary.skipped++;
      return;
    }

    // Check if already visited
    if (this.visitedUrls.has(normalizedUrl)) {
      logger.crawl('URL skipped: already visited', { url: normalizedUrl });
      summary.skipped++;
      return;
    }

    // Check robots.txt
    const isRobotsAllowed = await this.robotsChecker.isAllowed(normalizedUrl);
    if (!isRobotsAllowed) {
      logger.crawl('URL skipped: disallowed by robots.txt', { url: normalizedUrl });
      summary.skipped++;
      return;
    }

    // Check allowlist
    if (!isAllowedUrl(normalizedUrl, this.config.allowlistPrefixes)) {
      logger.crawl('URL skipped: not in allowlist', {
        url: normalizedUrl,
        allowlistPrefixes: this.config.allowlistPrefixes,
      });
      summary.skipped++;
      return;
    }

    this.visitedUrls.add(normalizedUrl);
    logger.crawl('Crawling page', { url: normalizedUrl, depth });

    try {
      const html = await this.rateLimiter.execute(async () => {
        try {
          // Try browser client first (for JavaScript-heavy sites)
          const browserResponse = await this.browserClient.fetch(normalizedUrl);
          return browserResponse.html;
        } catch (browserError) {
          // Fallback to regular HTTP client if browser fails
          logger.crawlWarn('Browser fetch failed, falling back to HTTP client', {
            url: normalizedUrl,
            error: browserError instanceof Error ? browserError.message : String(browserError),
          });
          const response = await this.httpClient.fetch(normalizedUrl);
          return await response.text();
        }
      });

      logger.crawl('Page fetched successfully', {
        url: normalizedUrl,
        htmlLength: html.length,
      });

      const $ = cheerio.load(html);
      const pageTitle = $('title').text() || normalizedUrl;

      // Extract PDF links
      const pdfLinks: Array<{ url: string; title: string }> = [];
      $('a[href$=".pdf"]').each((_, el) => {
        const href = $(el).attr('href');
        const title = $(el).text().trim() || $(el).attr('title') || '';
        if (href) {
          try {
            const fullUrl = normalizeUrl(href, normalizedUrl);
            pdfLinks.push({ url: fullUrl, title });
          } catch (error) {
            logger.crawlWarn('Failed to normalize PDF link', {
              href,
              baseUrl: normalizedUrl,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
      });

      logger.crawl('Extracted PDF links', { url: normalizedUrl, pdfCount: pdfLinks.length });

      // Extract content page links (first level only)
      const contentLinks: Array<{ url: string; title: string }> = [];
      if (depth < this.config.maxDepth) {
        $('a[href]').each((_, el) => {
          const href = $(el).attr('href');
          const title = $(el).text().trim() || $(el).attr('title') || '';
          if (href && !href.endsWith('.pdf')) {
            try {
              const fullUrl = normalizeUrl(href, normalizedUrl);
              if (
                isAllowedUrl(fullUrl, this.config.allowlistPrefixes) &&
                !this.discoveredUrls.has(fullUrl)
              ) {
                contentLinks.push({ url: fullUrl, title });
                this.discoveredUrls.add(fullUrl);
              }
            } catch (error) {
              // Silently skip invalid URLs
            }
          }
        });
      }

      logger.crawl('Extracted content links', {
        url: normalizedUrl,
        contentLinkCount: contentLinks.length,
      });

      // Upsert PDF sources
      for (const pdf of pdfLinks) {
        try {
          await this.upsertSource(
            {
              url: pdf.url,
              title: pdf.title || pageTitle,
              sourceType: 'pdf',
              category: this.inferCategory(pdf.url, pdf.title),
            },
            summary
          );
          summary.totalFound++;
        } catch (error) {
          logger.crawlError('Failed to upsert PDF source', {
            url: pdf.url,
            error: error instanceof Error ? error.message : String(error),
          });
          summary.errors++;
        }
      }

      // Recursively crawl content pages
      for (const link of contentLinks) {
        await this.crawlPage(link.url, depth + 1, summary);
      }
    } catch (error) {
      logger.crawlError('Error crawling page', {
        url: normalizedUrl,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      summary.errors++;
    }
  }

  private async upsertSource(
    source: {
      url: string;
      title: string;
      sourceType: 'html' | 'pdf';
      category: 'form' | 'publication' | 'guide' | 'package' | 'other';
    },
    summary: CrawlSummary
  ): Promise<void> {
    const db = getDb();
    let normalizedUrl: string;
    
    try {
      normalizedUrl = normalizeUrl(source.url);
    } catch (error) {
      logger.crawlError('Failed to normalize source URL', {
        url: source.url,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }

    logger.crawl('Upserting source', {
      url: normalizedUrl,
      title: source.title,
      type: source.sourceType,
      category: source.category,
    });

    const existing = await db.select().from(sources).where(eq(sources.url, normalizedUrl)).limit(1);

    if (existing.length > 0) {
      await db
        .update(sources)
        .set({
          title: source.title,
          lastCrawledAt: new Date(),
        })
        .where(eq(sources.url, normalizedUrl));
      summary.updatedSources++;
      logger.crawl('Source updated', { url: normalizedUrl });
    } else {
      await db.insert(sources).values({
        url: normalizedUrl,
        title: source.title,
        sourceType: source.sourceType,
        category: source.category,
        jurisdictionTags: ['CA-FED'],
        priority: 'medium',
        ingestStatus: 'pending',
      });
      summary.newSources++;
      logger.crawl('Source created', { url: normalizedUrl });
    }
  }

  private inferCategory(
    url: string,
    title: string
  ): 'form' | 'publication' | 'guide' | 'package' | 'other' {
    const lowerUrl = url.toLowerCase();
    const lowerTitle = title.toLowerCase();

    // Skip forms - we focus on guidance documents
    if (lowerUrl.includes('/forms/') || (lowerUrl.includes('/form') && !lowerUrl.includes('/publications/'))) {
      return 'form'; // Will be filtered out by allowlist or skipped
    }
    
    if (lowerUrl.includes('/guide') || lowerTitle.includes('guide')) {
      return 'guide';
    }
    if (lowerUrl.includes('/package') || lowerTitle.includes('package')) {
      return 'package';
    }
    if (lowerUrl.includes('/publication') || lowerTitle.includes('publication')) {
      return 'publication';
    }

    return 'other';
  }

  async close(): Promise<void> {
    await this.browserClient.close();
  }
}

