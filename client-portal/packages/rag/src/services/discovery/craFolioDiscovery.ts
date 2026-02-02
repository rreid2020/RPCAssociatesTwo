import * as cheerio from 'cheerio';
import { BrowserClient } from '@crawler/core';
import { getCrawlerConfig, type CrawlerConfig } from '@shared/types';
import { sources, getDb } from '@shared/types/db';
import { logger } from '@shared/types';
import { eq, and, sql } from 'drizzle-orm';
import type { PageKind } from '@shared/types';
import { UrlNormalizer } from './urlNormalizer';
import { BlockDetector } from './blockDetector';
import type { DiscoveryResult, DiscoveredLink } from './types';

/**
 * Service for discovering CRA Income Tax Folio content pages from directory pages
 */
export class CraFolioDiscoveryService {
  private browserClient: BrowserClient;
  private config: CrawlerConfig;
  private db = getDb();
  private maxDiscoveryDepth: number;

  constructor(config?: CrawlerConfig, maxDepth: number = 3) {
    this.config = config || getCrawlerConfig();
    this.browserClient = new BrowserClient(this.config);
    this.maxDiscoveryDepth = maxDepth;
  }

  /**
   * Classify a page as directory, content, or unknown
   */
  classifyPageKind(html: string, url: string): PageKind {
    const $ = cheerio.load(html);
    
    // Check for directory page indicators
    const hasIncomeTaxFolioHeading = $('h1, h2, h3').text().toLowerCase().includes('income tax folio');
    const hasLinkList = $('ul li a, ol li a').length > 10; // Directory pages typically have many links
    const hasTOC = $('[class*="table-of-contents"], [id*="toc"], [class*="toc"]').length > 0;
    const hasFolioLinks = $('a[href*="/en/revenue-agency/services/tax/individuals/topics/about-canada-tax/income-tax-folios"]').length > 0;
    
    // Check for content page indicators
    const hasArticleBody = $('article, [role="main"], main, [class*="content"], [id*="content"]').length > 0;
    const hasSectionHeadings = $('h2, h3').filter((_, el) => {
      const text = $(el).text().trim();
      // Folio content pages often have section numbers like "1.10", "1.11", etc.
      return /^\d+\.\d+/.test(text) || /^Section \d+/.test(text);
    }).length > 0;
    const hasFolioDocumentStructure = $('[class*="folio"], [id*="folio"]').length > 0;
    
    // Directory page: has many links, TOC, or folio heading with link lists
    if ((hasLinkList && hasIncomeTaxFolioHeading) || hasTOC || (hasFolioLinks && hasLinkList)) {
      logger.crawl('Classified as directory page', { url });
      return 'directory';
    }
    
    // Content page: has article body with section headings or folio document structure
    if (hasArticleBody && (hasSectionHeadings || hasFolioDocumentStructure)) {
      logger.crawl('Classified as content page', { url });
      return 'content';
    }
    
    // Default to unknown if uncertain
    logger.crawl('Classified as unknown page kind', { url });
    return 'unknown';
  }

  /**
   * Discover folio links from HTML content
   * Filters to same domain and likely folio content pages
   */
  discoverFolioLinks(html: string, baseUrl: string): Array<{ url: string; title: string }> {
    const $ = cheerio.load(html);
    const baseUrlObj = new URL(baseUrl);
    const discoveredLinks: Array<{ url: string; title: string }> = [];
    
    // Find all links
    $('a[href]').each((_, element) => {
      const $link = $(element);
      const href = $link.attr('href');
      const title = $link.text().trim() || $link.attr('title') || '';
      
      if (!href) return;
      
      try {
        // Resolve relative URLs
        const absoluteUrl = new URL(href, baseUrl).toString();
        const urlObj = new URL(absoluteUrl);
        
        // Filter to same domain (canada.ca or www.canada.ca)
        const isSameDomain = 
          urlObj.hostname === baseUrlObj.hostname ||
          urlObj.hostname === 'canada.ca' ||
          urlObj.hostname === 'www.canada.ca';
        
        if (!isSameDomain) return;
        
        // Filter to likely folio content pages
        // Folio URLs can contain:
        // - /income-tax-folios (old structure)
        // - /income-tax-folios-index/ (new structure)
        // - /folio (general folio indicator)
        const isFolioUrl = 
          urlObj.pathname.includes('/income-tax-folios') ||
          urlObj.pathname.includes('/income-tax-folios-index') ||
          urlObj.pathname.includes('/folio');
        
        if (!isFolioUrl) return;
        
        // Skip index/directory pages (Level 1/2)
        // Level 1: ends with /income-tax-folios.html or /income-tax-folios/ or /income-tax-folios-index.html
        // Level 2: series/folio directory pages
        const isIndexPage = 
          urlObj.pathname.endsWith('/') ||
          urlObj.pathname.endsWith('/income-tax-folios.html') ||
          urlObj.pathname.endsWith('/income-tax-folios') ||
          urlObj.pathname.endsWith('/income-tax-folios-index.html') ||
          urlObj.pathname.match(/\/series-\d+\.html?$/i) ||
          urlObj.pathname.match(/\/income-tax-folios\/?$/) ||
          urlObj.pathname.match(/\/income-tax-folios-index\/?$/);
        
        // Level 3 content pages typically have:
        // - Folio codes in the URL path or filename like s3-f1-c1, S3-F1-C1, etc.
        // - Pattern: income-tax-folio-s1-f1-c1-...html
        // - Or in path segments
        const fullPath = urlObj.pathname + urlObj.search; // Include query params for pattern matching
        const hasFolioCodePattern = 
          /[sS]\d+-[fF]\d+(-[cC]\d+)?/.test(fullPath) ||  // Matches s1-f1-c1 in path or filename
          /income-tax-folio-[sS]\d+-[fF]\d+(-[cC]\d+)?/.test(fullPath) ||  // Matches "income-tax-folio-s1-f1-c1"
          /folio-[sS]\d+-[fF]\d+/.test(fullPath) ||
          /\/[sS]\d+\/[fF]\d+/.test(urlObj.pathname);
        
        // Or has a deep path structure indicating content (not just directory)
        // Content pages are typically deeper than directory pages
        const pathSegments = urlObj.pathname.split('/').filter(p => p && !p.match(/\.(html?|xml)$/i));
        const hasDeepPath = pathSegments.length >= 7; // Deep enough to be a content page
        const hasContentExtension = /\.(html?|xml)$/i.test(urlObj.pathname);
        
        // Level 3 content page: has folio code pattern OR (deep path AND content extension)
        const isContentPage = hasFolioCodePattern || (hasDeepPath && hasContentExtension);
        
        // Include all folio-related links (they'll be classified later)
        // - Content pages (Level 4): have folio codes
        // - Directory pages (Level 2/3): series or folio directory pages
        // We want to discover all of them, then recursively discover from directories
        if (!isIndexPage && title) {
          // Include if it's a content page OR if it looks like a series/folio directory page
          // Series/folio directory pages typically have patterns like:
          // - /series-1-individuals/ or /series-1-individuals.html
          // - /folio-1-health-medical/ or /folio-1-health-medical.html
          const isSeriesOrFolioDirectory = 
            urlObj.pathname.match(/\/series-\d+(-[^\/]+)?\/?$/i) !== null ||
            urlObj.pathname.match(/\/series-\d+(-[^\/]+)?\.html?$/i) !== null ||
            (urlObj.pathname.includes('/folio-') && pathSegments.length >= 6 && pathSegments.length < 8);
          
          if (isContentPage || isSeriesOrFolioDirectory) {
            discoveredLinks.push({ url: absoluteUrl, title });
            logger.crawl('Discovered folio link', {
              url: absoluteUrl,
              title,
              isContentPage,
              isSeriesOrFolioDirectory,
              hasFolioCode: hasFolioCodePattern,
              pathDepth: pathSegments.length,
            });
          }
        }
      } catch (error) {
        // Skip invalid URLs
        logger.crawlWarn('Invalid URL in folio discovery', { 
          href, 
          baseUrl,
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    });
    
    // Deduplicate by normalizing URLs
    const normalizedMap = UrlNormalizer.deduplicateUrls(
      discoveredLinks.map(link => link.url),
      baseUrl
    );
    
    // Return deduplicated links with titles
    const deduplicatedLinks: Array<{ url: string; title: string }> = [];
    for (const [normalizedUrl, originalUrl] of normalizedMap.entries()) {
      const link = discoveredLinks.find(l => l.url === originalUrl);
      if (link) {
        deduplicatedLinks.push({
          url: normalizedUrl,
          title: link.title,
        });
      }
    }
    
    logger.crawl('Discovered folio links', {
      baseUrl,
      totalLinks: discoveredLinks.length,
      deduplicatedLinks: deduplicatedLinks.length,
    });
    
    return deduplicatedLinks;
  }

  /**
   * Discover folio content pages from a source (directory page)
   * Fetches the page, classifies it, and creates new sources for discovered links
   * @param sourceId - The source ID to discover from
   * @param depth - Current discovery depth (for recursive discovery)
   */
  async discoverFromSource(sourceId: string, depth: number = 0): Promise<DiscoveryResult> {
    const result: DiscoveryResult = {
      sourceId,
      pageKind: 'unknown',
      discoveredLinks: [],
      newSourcesCreated: 0,
      skippedDuplicates: 0,
      errors: [],
    };

    try {
      // Fetch the source from database
      const source = await this.db
        .select()
        .from(sources)
        .where(eq(sources.id, sourceId))
        .limit(1);

      if (source.length === 0) {
        throw new Error(`Source not found: ${sourceId}`);
      }

      const sourceRecord = source[0];
      const url = sourceRecord.url;

      // If source is blocked, try fallback before giving up
      // Clear blocked status temporarily to allow retry with fallback
      if (sourceRecord.blockedAt) {
        logger.crawlWarn('Source is marked as blocked, attempting retry with fallback', {
          sourceId,
          blockType: sourceRecord.blockType,
        });
        // Clear blocked status to allow retry
        await this.db
          .update(sources)
          .set({
            blockedAt: null,
            blockType: null,
            blockReason: null,
            blockSignature: null,
          })
          .where(eq(sources.id, sourceId));
      }

      logger.crawl('Starting folio discovery', { sourceId, url, depth });
      
      // Prevent infinite recursion
      if (depth >= this.maxDiscoveryDepth) {
        logger.crawlWarn('Max discovery depth reached, skipping recursive discovery', {
          sourceId,
          depth,
          maxDepth: this.maxDiscoveryDepth,
        });
        return result;
      }

      // For discovery, skip browser client and go straight to Excel-like HTTP client
      // Browser client is too slow (30+ seconds of retries) and gets blocked anyway
      // Excel-like HTTP client works reliably for CRA pages
      logger.crawl('Fetching page for discovery (using Excel-like HTTP client)', { url });
      
      let html: string;
      try {
        // Import requestText dynamically to avoid circular dependency
        const { requestText } = await import('@shared/types');
        const result = await requestText(url, {
          referer: 'https://www.canada.ca/en/revenue-agency/services/forms-publications.html',
          timeout: 30000,
          retries: 2, // Fewer retries for faster failure
        });
        
        if (result.status === 200 && result.text.length > 500) {
          logger.crawl('Page fetched successfully for discovery', {
            url,
            status: result.status,
            textLength: result.text.length,
          });
          html = result.text;
        } else {
          throw new Error(`HTTP ${result.status}: Content too short (${result.text.length} bytes)`);
        }
      } catch (error) {
        logger.crawlError('Failed to fetch page for discovery', {
          url,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }

      // Classify page kind
      result.pageKind = this.classifyPageKind(html, url);

      // Update source with page kind
      await this.db
        .update(sources)
        .set({ pageKind: result.pageKind })
        .where(eq(sources.id, sourceId));

      // Discover links if this is a directory page OR if it's unknown but has folio links
      // Many folio directory pages are classified as "unknown" but still contain links to chapters
      const shouldDiscoverLinks = result.pageKind === 'directory' || 
        (result.pageKind === 'unknown' && url.includes('/income-tax-folios-index/'));
      
      if (shouldDiscoverLinks) {
        const discoveredLinks = this.discoverFolioLinks(html, url);
        result.discoveredLinks = discoveredLinks.map(link => ({
          url: link.url,
          title: link.title,
          normalizedUrl: link.url, // Already normalized by discoverFolioLinks
        }));

        // Create new sources for discovered links
        for (const link of discoveredLinks) {
          try {
            // Check if source already exists by normalized URL
            const existing = await this.db
              .select()
              .from(sources)
              .where(
                and(
                  eq(sources.normalizedUrl, link.url),
                  sql`${sources.normalizedUrl} IS NOT NULL`
                )
              )
              .limit(1);

            if (existing.length > 0) {
              result.skippedDuplicates++;
              logger.crawl('Skipping duplicate source', { 
                url: link.url, 
                existingId: existing[0].id 
              });
              continue;
            }

            // Also check by regular URL (for backward compatibility)
            const existingByUrl = await this.db
              .select()
              .from(sources)
              .where(eq(sources.url, link.url))
              .limit(1);

            if (existingByUrl.length > 0) {
              // Update existing source with normalized URL if missing
              if (!existingByUrl[0].normalizedUrl) {
                await this.db
                  .update(sources)
                  .set({ 
                    normalizedUrl: link.url,
                    parentSourceId: sourceId,
                    pageKind: 'content' as PageKind,
                  })
                  .where(eq(sources.id, existingByUrl[0].id));
              }
              result.skippedDuplicates++;
              continue;
            }

            // Classify the discovered link to determine if it's Level 2/3 (directory) or Level 4 (content)
            const urlObj = new URL(link.url);
            const fullPath = urlObj.pathname + urlObj.search;
            const pathSegments = urlObj.pathname.split('/').filter(p => p && !p.match(/\.(html?|xml)$/i));
            
            // Level 4 content pages (chapters) have folio codes like s3-f1-c1, S3-F1-C1
            // Check in both pathname and full path (filename may contain the code)
            const hasFolioCode = 
              /[sS]\d+-[fF]\d+(-[cC]\d+)?/.test(fullPath) ||  // Matches s1-f1-c1 anywhere
              /income-tax-folio-[sS]\d+-[fF]\d+(-[cC]\d+)?/.test(fullPath) ||  // Matches "income-tax-folio-s1-f1-c1"
              /\/[sS]\d+\/[fF]\d+/.test(urlObj.pathname) ||
              /folio-[sS]\d+-[fF]\d+/.test(fullPath);
            
            // Level 2 series pages typically:
            // - Have /series-X.html or /series-X-individuals/ pattern
            // - Are intermediate directories without folio codes
            // - Have path depth around 6-7 segments
            const isSeriesPage = 
              urlObj.pathname.match(/\/series-\d+(-[^\/]+)?\/?$/i) !== null ||
              urlObj.pathname.match(/\/series-\d+(-[^\/]+)?\.html?$/i) !== null ||
              (urlObj.pathname.includes('/income-tax-folios-index/') && 
               pathSegments.length >= 6 && 
               pathSegments.length <= 7 && 
               !hasFolioCode &&
               urlObj.pathname.match(/series-\d+/i) !== null);
            
            // Level 3 folio directory pages typically:
            // - Have /folio-X-.../ pattern
            // - Are intermediate directories without folio codes
            // - Have path depth around 7-8 segments
            const isFolioDirectoryPage = 
              urlObj.pathname.match(/\/folio-\d+(-[^\/]+)?\/?$/i) !== null ||
              urlObj.pathname.match(/\/folio-\d+(-[^\/]+)?\.html?$/i) !== null ||
              (urlObj.pathname.includes('/income-tax-folios-index/') && 
               pathSegments.length >= 7 && 
               pathSegments.length <= 8 && 
               !hasFolioCode &&
               urlObj.pathname.match(/folio-\d+/i) !== null);
            
            // Determine page kind and source type
            // Level 4: Has folio code = content page
            // Level 2/3: Series or folio directory = directory page (needs recursive discovery)
            // Default: If uncertain, treat as content (will be classified when fetched)
            const discoveredPageKind: PageKind = hasFolioCode ? 'content' : (isSeriesPage || isFolioDirectoryPage ? 'directory' : 'content');
            const discoveredSourceType = hasFolioCode ? 'cra_folio_content' : (isSeriesPage || isFolioDirectoryPage ? 'cra_folio_directory' : 'cra_folio_content');
            
            // Create new source
            const [newSource] = await this.db.insert(sources).values({
              url: link.url,
              normalizedUrl: link.url,
              title: link.title || 'Untitled Folio Page',
              sourceType: discoveredSourceType,
              category: 'folio',
              jurisdictionTags: ['CA-FED'],
              parentSourceId: sourceId,
              pageKind: discoveredPageKind,
              ingestStatus: discoveredPageKind === 'directory' ? 'pending' : 'pending', // Will be discovered/ingested later
              priority: 'medium',
            }).returning();

            result.newSourcesCreated++;
            logger.crawl('Created new source from discovery', {
              url: link.url,
              title: link.title,
              parentSourceId: sourceId,
              pageKind: discoveredPageKind,
              sourceType: discoveredSourceType,
            });
            
            // If this is a Level 2 series page (directory), recursively discover from it
            if (discoveredPageKind === 'directory' && newSource) {
              logger.crawl('Recursively discovering from series page', {
                sourceId: newSource.id,
                url: link.url,
              });
              
              try {
                const recursiveResult = await this.discoverFromSource(newSource.id, depth + 1);
                result.newSourcesCreated += recursiveResult.newSourcesCreated;
                result.skippedDuplicates += recursiveResult.skippedDuplicates;
                result.errors.push(...recursiveResult.errors);
                logger.crawl('Recursive discovery completed', {
                  parentSourceId: newSource.id,
                  newSources: recursiveResult.newSourcesCreated,
                  depth: depth + 1,
                });
              } catch (error) {
                logger.crawlError('Recursive discovery failed', {
                  sourceId: newSource.id,
                  error: error instanceof Error ? error.message : String(error),
                });
                result.errors.push({
                  url: link.url,
                  error: `Recursive discovery failed: ${error instanceof Error ? error.message : String(error)}`,
                });
              }
            }
          } catch (error) {
            result.errors.push({
              url: link.url,
              error: error instanceof Error ? error.message : String(error),
            });
            logger.crawlError('Failed to create source from discovered link', {
              url: link.url,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }

        // Mark directory source as discovered (update metadata or use a flag)
        // For now, we'll update the pageKind which already indicates it's been processed
        // In the future, we could add a 'discovered' status field
      }

      logger.crawl('Folio discovery completed', {
        sourceId,
        pageKind: result.pageKind,
        newSources: result.newSourcesCreated,
        skipped: result.skippedDuplicates,
        errors: result.errors.length,
      });

      return result;
    } catch (error) {
      // Get URL from source record if available
      let sourceUrl = 'unknown';
      try {
        const sourceCheck = await this.db
          .select({ url: sources.url })
          .from(sources)
          .where(eq(sources.id, sourceId))
          .limit(1);
        if (sourceCheck.length > 0) {
          sourceUrl = sourceCheck[0].url;
        }
      } catch {
        // Ignore if we can't fetch URL
      }
      
      // Check if this is a block error from browser client
      const blockType = (error as any)?.blockType;
      const blockSignature = (error as any)?.blockSignature;
      
      if (blockType) {
        // Mark source as blocked
        await this.db
          .update(sources)
          .set({
            blockedAt: new Date(),
            blockType,
            blockReason: blockSignature 
              ? BlockDetector.getBlockReason(blockType)
              : error instanceof Error ? error.message : String(error),
            blockSignature: blockSignature || {},
            ingestStatus: 'failed',
          })
          .where(eq(sources.id, sourceId));
        
        logger.crawlError('Source marked as blocked', {
          sourceId,
          blockType,
          reason: BlockDetector.getBlockReason(blockType),
        });
      } else if (error instanceof Error && error.message.includes('403')) {
        // Generic 403 without block signature - still mark as blocked
        await this.db
          .update(sources)
          .set({
            blockedAt: new Date(),
            blockType: 'generic_403',
            blockReason: error.message,
            ingestStatus: 'failed',
          })
          .where(eq(sources.id, sourceId));
        
        logger.crawlError('Discovery blocked by 403', {
          sourceId,
          url: sourceUrl,
          error: error.message,
        });
      }
      
      logger.crawlError('Folio discovery failed', {
        sourceId,
        url: sourceUrl,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Cleanup: close browser client (if initialized)
   */
  async close(): Promise<void> {
    try {
      // Browser client may not be initialized if we never used it
      // Check if it has a browser instance before trying to close
      if (this.browserClient && typeof this.browserClient.close === 'function') {
        await Promise.race([
          this.browserClient.close(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Browser close timeout')), 5000))
        ]).catch(() => {
          // Ignore timeout errors - browser might already be closed
          logger.crawlWarn('Browser client close timed out or failed, continuing', {});
        });
      }
    } catch (error) {
      // Ignore errors when closing - browser might not be initialized
      logger.crawlWarn('Error closing browser client, continuing', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}


