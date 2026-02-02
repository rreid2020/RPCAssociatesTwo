import * as cheerio from 'cheerio';
import { BrowserClient } from '@crawler/core';
import { getCrawlerConfig, type CrawlerConfig } from '@shared/types';
import { sources, getDb } from '@shared/types/db';
import { logger } from '@shared/types';
import { eq, and, sql } from 'drizzle-orm';
import type { PageKind } from '@shared/types';
import { UrlNormalizer } from './urlNormalizer';
import type { DiscoveryResult, DiscoveredLink } from './types';

/**
 * Service for discovering CRA Income Tax Information Circular (IC) content pages from directory pages
 */
export class CraIcDiscoveryService {
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
   * Classify a page as directory, content, or unknown for Information Circulars
   */
  classifyPageKind(html: string, url: string): PageKind {
    const $ = cheerio.load(html);
    
    // Check for directory page indicators (IC index pages)
    const hasIcHeading = $('h1, h2, h3').text().toLowerCase().includes('information circular');
    const hasIcList = $('a[href*="ic"], a[href*="IC"]').length > 5; // IC directory pages have many IC links
    const hasIcRangeLinks = $('a[href*="ic00"], a[href*="ic10"], a[href*="ic70"], a[href*="ic80"], a[href*="ic90"]').length > 0;
    const hasLinkList = $('ul li a, ol li a').length > 10;
    
    // Check for content page indicators (individual IC pages)
    const hasArticleBody = $('article, [role="main"], main, [class*="content"], [id*="content"]').length > 0;
    const hasIcNumber = /IC\d{2,3}/i.test($('h1, h2, h3').first().text());
    const hasIcDocumentStructure = $('[class*="circular"], [id*="circular"], [class*="ic-"]').length > 0;
    const hasSubstantialContent = $('p').length > 10; // IC content pages have many paragraphs
    
    // Directory page: has IC heading with many IC links or IC range links
    if ((hasIcHeading && (hasIcList || hasIcRangeLinks)) || (hasLinkList && hasIcHeading)) {
      logger.crawl('Classified as directory page', { url });
      return 'directory';
    }
    
    // Content page: has IC number in heading and substantial content
    if (hasIcNumber && hasArticleBody && (hasSubstantialContent || hasIcDocumentStructure)) {
      logger.crawl('Classified as content page', { url });
      return 'content';
    }
    
    // Default to unknown if uncertain
    logger.crawl('Classified as unknown page kind', { url });
    return 'unknown';
  }

  /**
   * Discover IC links from HTML content
   * Filters to same domain and likely IC content pages
   */
  discoverIcLinks(html: string, baseUrl: string): Array<{ url: string; title: string }> {
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
        
        // Filter to likely IC content pages or IC directory pages
        // IC URLs typically contain:
        // - /information-circulars/
        // - /publications/ic##-### (e.g., /publications/ic71-17.html)
        // - /ic (lowercase)
        // - /IC (uppercase)
        // - ic00, ic10, ic70, ic80, ic90 (IC ranges)
        const path = urlObj.pathname.toLowerCase();
        const titleLower = title.toLowerCase();
        
        // More comprehensive IC detection
        const isIcUrl = 
          path.includes('/information-circular') ||
          path.includes('/publications/ic') || // ICs in publications directory (e.g., /publications/ic71-17.html)
          path.includes('/ic') ||
          /ic\d{2,3}/i.test(path) ||
          /ic\d{2,3}/i.test(title) ||
          // Also check for IC patterns in the URL path (e.g., /ic70-6r12/ or /publications/ic71-17.html)
          /\/ic\d{2,3}-\d+[a-z]?\d*/i.test(path) ||
          /\/publications\/ic\d{2,3}-\d+[a-z]?\d*/i.test(path) ||
          // Check for IC in title with numbers
          /ic\s*\d{2,3}/i.test(title);
        
        if (!isIcUrl) return;
        
        // Skip common non-content links, but be more selective
        const skipPatterns = [
          '#',
          'javascript:',
          'mailto:',
          '/fr/', // French pages (we'll handle separately if needed)
          // Don't skip 'archive' or 'checklist' as they might be valid IC pages
        ];
        
        // Only skip if it's clearly not an IC page
        if (skipPatterns.some(pattern => href.toLowerCase().includes(pattern))) {
          return;
        }
        
        // Skip if it's a range directory page (we already have those)
        if (path.includes('current-income-tax-information-circulars') && 
            !/ic\d{2,3}-\d+[a-z]?\d*/i.test(path)) {
          // This is a range directory, not an individual IC
          // But we still want to include it if it's not already discovered
          // Actually, let's include it - the classification logic will handle it
        }
        
        discoveredLinks.push({ url: absoluteUrl, title });
      } catch (error) {
        // Invalid URL, skip
        return;
      }
    });
    
    // Deduplicate by URL
    const seen = new Set<string>();
    return discoveredLinks.filter(link => {
      if (seen.has(link.url)) return false;
      seen.add(link.url);
      return true;
    });
  }

  /**
   * Discover IC content pages from a source (directory page)
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

    let url: string = ''; // Declare url in outer scope for error handling

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
      url = sourceRecord.url;

      logger.crawl('Starting IC discovery', { sourceId, url, depth });
      
      // Prevent infinite recursion
      if (depth >= this.maxDiscoveryDepth) {
        logger.crawlWarn('Max discovery depth reached, skipping recursive discovery', {
          sourceId,
          depth,
          maxDepth: this.maxDiscoveryDepth,
        });
        return result;
      }

      // Fetch page using Excel-like HTTP client
      logger.crawl('Fetching page for discovery (using Excel-like HTTP client)', { url });
      
      let html: string;
      try {
        const { requestText } = await import('@shared/types');
        const response = await requestText(url, {
          referer: 'https://www.canada.ca/en/revenue-agency/services/forms-publications.html',
          timeout: 30000,
          retries: 2,
        });
        
        if (response.status === 200 && response.text.length > 500) {
          logger.crawl('Page fetched successfully for discovery', {
            url,
            status: response.status,
            textLength: response.text.length,
          });
          html = response.text;
        } else {
          throw new Error(`HTTP ${response.status}: Content too short (${response.text.length} bytes)`);
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

      // Discover links
      const links = this.discoverIcLinks(html, url);
      logger.crawl('Discovered IC links', {
        baseUrl: url,
        totalLinks: links.length,
      });

      result.discoveredLinks = links.map(link => ({
        ...link,
        normalizedUrl: UrlNormalizer.normalize(link.url, url),
      }));

      // Create sources for discovered links
      for (const link of result.discoveredLinks) {
        try {
          // Check if source already exists
          const existing = await this.db
            .select()
            .from(sources)
            .where(eq(sources.normalizedUrl, link.normalizedUrl))
            .limit(1);

          if (existing.length > 0) {
            logger.crawl('Skipping duplicate source', { url: link.url, existingId: existing[0].id });
            result.skippedDuplicates++;
            continue;
          }

          // Determine if this is a directory or content page
          const urlObj = new URL(link.url);
          const path = urlObj.pathname.toLowerCase();
          const titleLower = (link.title || '').toLowerCase();
          
          // IC range pages are directories - they have titles like "IC00 - IC09", "IC10 - IC19", etc.
          // Or URLs like "current-income-tax-information-circulars.html" (without specific IC numbers)
          const isDirectory = 
            /ic\d{2}\s*-\s*ic\d{2}/i.test(link.title) || // Title contains "IC00 - IC09" pattern
            /ic\d{2}-\d{2}/i.test(path) || // Path contains "ic00-ic09" pattern
            /ic-checklist/i.test(path) || // IC checklist
            (path.includes('/information-circular') && 
             !/ic\d{2,3}-[a-z0-9]/i.test(path) && 
             !/ic\d{2,3}-[a-z0-9]/i.test(link.title)); // IC index/range page but not specific IC
          
          // Individual IC pages have patterns like "ic70-1r1", "ic75-2r2" in path or title
          // Also check for /publications/ic##-### pattern:
          // - /publications/ic71-17.html (direct file)
          // - /publications/ic71-17/guidance-on-...html (subdirectory with slug)
          const isContent = 
            /ic\d{2,3}-\d+[a-z]?\d*/i.test(path) || // Path like "ic70-1r1" or "/publications/ic71-17/"
            /\/publications\/ic\d{2,3}-\d+[a-z]?\d*/i.test(path) || // Path like "/publications/ic71-17.html" or "/publications/ic71-17/..."
            /ic\d{2,3}-\d+[a-z]?\d*/i.test(link.title); // Title like "IC70-1R1"

          const sourceType = isDirectory ? 'cra_ic_directory' : (isContent ? 'cra_ic_content' : 'html');
          const pageKind: PageKind = isDirectory ? 'directory' : (isContent ? 'content' : 'unknown');

          // Create new source
          await this.db.insert(sources).values({
            url: link.url,
            normalizedUrl: link.normalizedUrl,
            title: link.title || 'Information Circular',
            sourceType,
            category: 'circular',
            jurisdictionTags: ['CA-FED'],
            pageKind,
            ingestStatus: isDirectory ? 'skipped' : 'pending', // Skip directories, ingest content
            priority: isContent ? 'high' : 'medium',
            parentSourceId: sourceId,
          });

          logger.crawl('Created new source from discovery', {
            url: link.url,
            title: link.title,
            parentSourceId: sourceId,
            pageKind,
            sourceType,
          });

          result.newSourcesCreated++;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          logger.crawlError('Error creating source from discovered link', {
            url: link.url,
            error: errorMsg,
          });
          result.errors.push({ url: link.url, error: errorMsg });
        }
      }

      // Mark source as directory if classified as such
      if (result.pageKind === 'directory') {
        await this.db
          .update(sources)
          .set({
            pageKind: 'directory',
            ingestStatus: 'skipped', // Don't ingest directory pages
          })
          .where(eq(sources.id, sourceId));
      }

      logger.crawl('IC discovery completed', {
        sourceId,
        pageKind: result.pageKind,
        newSources: result.newSourcesCreated,
        skipped: result.skippedDuplicates,
        errors: result.errors.length,
      });

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.crawlError('IC discovery failed', {
        sourceId,
        url,
        error: errorMsg,
      });
      throw error;
    }
  }

  async close(): Promise<void> {
    // Cleanup if needed
  }
}
