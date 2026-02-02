import * as cheerio from 'cheerio';
import { getCrawlerConfig, type CrawlerConfig } from '@shared/types';
import { sources, getDb } from '@shared/types/db';
import { logger } from '@shared/types';
import { eq } from 'drizzle-orm';
import type { PageKind, SourceType, SourceCategory } from '@shared/types';
import { UrlNormalizer } from './urlNormalizer';
import type { DiscoveryResult, DiscoveredLink } from './types';

/**
 * Service for discovering CRA publications from the main publications directory
 * This is the single source of truth for all CRA publications (ICs, Folios, Guides, etc.)
 */
export class CraPublicationsDiscoveryService {
  private config: CrawlerConfig;
  private db = getDb();
  private maxDiscoveryDepth: number;

  constructor(config?: CrawlerConfig, maxDepth: number = 2) {
    this.config = config || getCrawlerConfig();
    this.maxDiscoveryDepth = maxDepth;
  }

  /**
   * Classify a publication based on its number and URL
   */
  classifyPublication(url: string, title: string, number?: string, html?: string): {
    sourceType: SourceType;
    category: SourceCategory;
    pageKind: PageKind;
  } {
    const urlLower = url.toLowerCase();
    const path = new URL(url).pathname.toLowerCase();
    const titleLower = title.toLowerCase();
    const num = number?.toUpperCase() || '';

    // Information Circulars (IC##-###)
    if (num.startsWith('IC') || /ic\d{2,3}/i.test(path) || /ic\d{2,3}/i.test(title)) {
      // Check if it's a directory/range page
      if (path.includes('current-income-tax-information-circulars') || 
          /ic\d{2}\s*-\s*ic\d{2}/i.test(title)) {
        return {
          sourceType: 'cra_ic_directory',
          category: 'circular',
          pageKind: 'directory',
        };
      }
      return {
        sourceType: 'cra_ic_content',
        category: 'circular',
        pageKind: 'content',
      };
    }

    // Income Tax Folios (S#-F#-C#)
    if (num.match(/^S\d-F\d-C\d/) || 
        /series-\d.*folio-\d/i.test(path) || 
        /income-tax-folio/i.test(path) ||
        /folio.*series/i.test(titleLower)) {
      // Check if it's a directory page
      if (path.includes('income-tax-folios-index') || 
          path.includes('series-') && !path.includes('folio-')) {
        return {
          sourceType: 'cra_folio_directory',
          category: 'folio',
          pageKind: 'directory',
        };
      }
      return {
        sourceType: 'cra_folio_content',
        category: 'folio',
        pageKind: 'content',
      };
    }

    // Other CRA publications (Guides, Forms, etc.)
    // These are typically in /publications/ directory
    if (path.includes('/publications/')) {
      // Check if this is an index page (e.g., 16-5-1.html) that links to content pages
      // Index pages typically:
      // 1. End with just the number and .html (e.g., /publications/16-5-1.html)
      // 2. Have links to subdirectories or related pages
      // 3. Are relatively short or contain mostly navigation links
      const isIndexPage = 
        /\/publications\/\d+-\d+(-\d+)?\.html$/i.test(path) && // Pattern like 16-5-1.html
        !path.includes('/') && // Not in a subdirectory
        (html ? this.isLikelyIndexPage(html, path) : false); // Check HTML content if provided

      if (isIndexPage) {
        return {
          sourceType: 'html',
          category: 'guide',
          pageKind: 'directory', // Treat as directory to trigger discovery
        };
      }

      return {
        sourceType: 'html',
        category: 'guide',
        pageKind: 'content',
      };
    }

    // Default classification
    return {
      sourceType: 'html',
      category: 'guide',
      pageKind: 'unknown',
    };
  }

  /**
   * Check if HTML content suggests this is an index page
   * Index pages typically have many links to related content pages
   */
  private isLikelyIndexPage(html: string, path: string): boolean {
    const $ = cheerio.load(html);
    const baseDir = path.replace(/\.html$/, '').replace(/\/$/, '');
    
    // Count links that point to subdirectories or related content
    let subdirectoryLinkCount = 0;
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (!href) return;
      
      try {
        const linkPath = new URL(href, `https://www.canada.ca${path}`).pathname.toLowerCase();
        // Check if link is in a subdirectory of this publication
        if (linkPath.startsWith(baseDir + '/') && linkPath !== path.toLowerCase()) {
          subdirectoryLinkCount++;
        }
      } catch {
        // Invalid URL, skip
      }
    });

    // If there are multiple links to subdirectories, it's likely an index page
    return subdirectoryLinkCount >= 2;
  }

  /**
   * Discover publications from the main publications directory page
   */
  async discoverFromPublicationsDirectory(sourceId: string): Promise<DiscoveryResult> {
    const result: DiscoveryResult = {
      sourceId,
      pageKind: 'directory',
      discoveredLinks: [],
      newSourcesCreated: 0,
      skippedDuplicates: 0,
      errors: [],
    };

    let url: string = '';

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

      logger.crawl('Starting publications discovery', { sourceId, url });

      // Fetch page using Excel-like HTTP client
      logger.crawl('Fetching publications directory page', { url });

      const { requestText } = await import('@shared/types');
      const response = await requestText(url, {
        referer: 'https://www.canada.ca/en/revenue-agency/services/forms-publications.html',
        timeout: 30000,
        retries: 2,
      });

      if (response.status !== 200 || response.text.length < 500) {
        throw new Error(`HTTP ${response.status}: Content too short (${response.text.length} bytes)`);
      }

      const html = response.text;
      logger.crawl('Page fetched successfully', {
        url,
        status: response.status,
        textLength: html.length,
      });

      // Parse the publications table
      const $ = cheerio.load(html);
      const discoveredLinks: Array<{ url: string; title: string; number?: string }> = [];

      // Find the publications table
      // The table has columns: Number, Title, Last update
      $('table tbody tr').each((_, row) => {
        const $row = $(row);
        const $cells = $row.find('td');
        
        if ($cells.length < 2) return;

        // Get publication number (first column)
        const $numberCell = $cells.eq(0);
        const $numberLink = $numberCell.find('a');
        const number = $numberCell.text().trim();
        const numberHref = $numberLink.attr('href');

        // Get title (second column)
        const $titleCell = $cells.eq(1);
        const title = $titleCell.text().trim();

        if (!numberHref || !title) return;

        try {
          // Resolve relative URLs
          const absoluteUrl = new URL(numberHref, url).toString();
          const urlObj = new URL(absoluteUrl);

          // Filter to same domain
          if (urlObj.hostname !== 'www.canada.ca' && urlObj.hostname !== 'canada.ca') {
            return;
          }

          discoveredLinks.push({
            url: absoluteUrl,
            title,
            number,
          });
        } catch (error) {
          // Invalid URL, skip
        }
      });

      logger.crawl('Discovered publications from table', {
        baseUrl: url,
        totalLinks: discoveredLinks.length,
      });

      // Normalize URLs and create sources
      for (const link of discoveredLinks) {
        try {
          const normalizedUrl = UrlNormalizer.normalize(link.url, url);

          // Check if source already exists
          const existing = await this.db
            .select()
            .from(sources)
            .where(eq(sources.normalizedUrl, normalizedUrl))
            .limit(1);

          if (existing.length > 0) {
            logger.crawl('Skipping duplicate source', { 
              url: link.url, 
              existingId: existing[0].id 
            });
            result.skippedDuplicates++;
            continue;
          }

          // For publications in /publications/ directory, fetch the page to check if it's an index page
          let classification;
          if (link.url.includes('/publications/') && /\/publications\/\d+-\d+(-\d+)?\.html$/i.test(link.url)) {
            // This might be an index page - we'll check during ingestion
            // For now, mark as 'unknown' pageKind so ingestion can determine if it's an index
            classification = this.classifyPublication(link.url, link.title, link.number);
            // If it matches the pattern, set to 'unknown' so ingestion can check
            if (classification.pageKind === 'content') {
              classification.pageKind = 'unknown';
            }
          } else {
            // Classify normally
            classification = this.classifyPublication(link.url, link.title, link.number);
          }

          // Create new source
          await this.db.insert(sources).values({
            url: link.url,
            normalizedUrl: normalizedUrl,
            title: link.title,
            sourceType: classification.sourceType,
            category: classification.category,
            jurisdictionTags: ['CA-FED'],
            pageKind: classification.pageKind,
            ingestStatus: classification.pageKind === 'directory' ? 'skipped' : 'pending',
            priority: classification.pageKind === 'content' ? 'high' : 'medium',
            parentSourceId: sourceId,
            metadata: link.number ? { publicationNumber: link.number } : undefined,
          });

          logger.crawl('Created new source from discovery', {
            url: link.url,
            title: link.title,
            number: link.number,
            parentSourceId: sourceId,
            sourceType: classification.sourceType,
            category: classification.category,
            pageKind: classification.pageKind,
          });

          result.discoveredLinks.push({
            url: link.url,
            title: link.title,
            normalizedUrl: normalizedUrl,
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

      logger.crawl('Publications discovery completed', {
        sourceId,
        newSources: result.newSourcesCreated,
        skipped: result.skippedDuplicates,
        errors: result.errors.length,
      });

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.crawlError('Publications discovery failed', {
        sourceId,
        url,
        error: errorMsg,
      });
      throw error;
    }
  }

  /**
   * Discover content links from an individual publication page (e.g., 16-5-1.html)
   * These pages often contain links to actual content pages in subdirectories
   */
  async discoverFromPublicationPage(sourceId: string): Promise<DiscoveryResult> {
    const result: DiscoveryResult = {
      sourceId,
      pageKind: 'directory',
      discoveredLinks: [],
      newSourcesCreated: 0,
      skippedDuplicates: 0,
      skippedPdfDuplicates: 0,
      errors: [],
    };

    let url: string = '';

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

      logger.crawl('Starting publication page discovery', { sourceId, url });

      // Fetch the publication page
      const { requestText } = await import('@shared/types');
      const response = await requestText(url, {
        referer: 'https://www.canada.ca/en/revenue-agency/services/forms-publications.html',
        timeout: 30000,
        retries: 2,
      });

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: Failed to fetch page`);
      }

      const html = response.text;
      const $ = cheerio.load(html);
      const baseUrlObj = new URL(url);
      const basePath = baseUrlObj.pathname.toLowerCase();
      const baseDir = basePath.replace(/\.html$/, '').replace(/\/$/, '');
      const discoveredLinks: Array<{ url: string; title: string; isPdf?: boolean }> = [];

      // Extract publication number pattern from the base URL (e.g., "16-5-1" or "t4032bc")
      const publicationPattern = basePath.match(/([a-z0-9]+(?:-\d+)+)/i)?.[1] || '';
      
      logger.crawl('Discovering links from publication page', {
        url,
        basePath,
        baseDir,
        publicationPattern,
      });

      // Look for all content links (HTML and PDF) from this publication page
      $('a[href]').each((_, element) => {
        const $link = $(element);
        const href = $link.attr('href');
        let title = $link.text().trim() || $link.attr('title') || '';
        
        if (!href) return;

        try {
          // Resolve relative URLs
          const absoluteUrl = new URL(href, url).toString();
          const urlObj = new URL(absoluteUrl);
          
          // Filter to same domain
          if (urlObj.hostname !== 'www.canada.ca' && urlObj.hostname !== 'canada.ca') {
            return;
          }

          const path = urlObj.pathname.toLowerCase();
          
          // Skip if it's the same page
          if (path === basePath || path === basePath.replace('.html', '')) {
            return;
          }

          // Skip navigation and external links
          if (path.includes('#') || path.includes('javascript:') || path.includes('mailto:')) {
            return;
          }

          // Check if this is a PDF link
          const isPdf = path.endsWith('.pdf') || href.toLowerCase().endsWith('.pdf');
          
          // Check if this is a content link related to this publication
          let isContentLink = false;
          
          if (isPdf) {
            // PDF links are always content (unless they're clearly navigation)
            // Check if PDF filename contains the publication pattern or is in related directory
            const pdfName = path.split('/').pop() || '';
            isContentLink = 
              pdfName.includes(publicationPattern.toLowerCase()) ||
              path.includes('/publications/') ||
              path.includes('/payroll/') ||
              path.includes('/forms-publications/');
          } else {
            // HTML links: check if they're in a subdirectory or related to this publication
            const linkDir = path.replace(/\.html$/, '').replace(/\/$/, '');
            
            // Check various patterns:
            // 1. Links in subdirectory of this publication (e.g., 16-5-1/voluntary-disclosures-program.html)
            const isSubdirectory = linkDir.startsWith(baseDir + '/');
            
            // 2. Links with same publication pattern in filename
            const linkHasPattern = publicationPattern && path.includes(publicationPattern.toLowerCase());
            
            // 3. Links in same directory with related naming (e.g., t4032bc-january-general-information.html)
            const isSameDirectory = path.startsWith(baseDir.substring(0, baseDir.lastIndexOf('/') + 1));
            const isRelatedName = publicationPattern && 
              path.split('/').pop()?.toLowerCase().includes(publicationPattern.toLowerCase().substring(0, 5));
            
            // 4. Links in publications directory that might be related
            const isPublicationsDir = path.includes('/publications/') && 
              !path.includes('/publications/publications/'); // Avoid nested publications
            
            isContentLink = isSubdirectory || linkHasPattern || (isSameDirectory && isRelatedName) || isPublicationsDir;
          }

          if (isContentLink) {
            // Extract a better title if available
            if (!title || title.length < 3) {
              // Try to get title from parent elements
              const $parent = $link.closest('li, div, p, td');
              const parentText = $parent.text().trim();
              
              // Try aria-label
              title = $link.attr('aria-label') || 
                     // Try parent text (first 200 chars)
                     (parentText.length > title.length ? parentText.substring(0, 200) : '') ||
                     // Try filename
                     path.split('/').pop()?.replace(/\.(html|pdf)$/i, '').replace(/-/g, ' ').replace(/_/g, ' ') || 
                     'Untitled';
            }

            // Clean up title
            title = title.trim().replace(/\s+/g, ' ').substring(0, 500);

            discoveredLinks.push({
              url: absoluteUrl,
              title: title || 'Untitled',
              isPdf,
            });
          }
        } catch (error) {
          // Invalid URL, skip
        }
      });

      const normalizeTitleKey = (value: string): string => {
        return value
          .toLowerCase()
          .replace(/\bpdf\b/g, '')
          .replace(/[^a-z0-9]+/g, '')
          .trim();
      };

      const getBaseNameKey = (linkUrl: string): string => {
        try {
          const pathname = new URL(linkUrl).pathname.toLowerCase();
          const filename = pathname.split('/').pop() || '';
          return filename.replace(/\.(pdf|html)$/i, '');
        } catch {
          return '';
        }
      };

      const dedupeMap = new Map<string, { url: string; title: string; isPdf?: boolean }>();
      let skippedPdfDuplicates = 0;
      let skippedSameTypeDuplicates = 0;

      for (const link of discoveredLinks) {
        const baseKey = getBaseNameKey(link.url);
        const titleKey = normalizeTitleKey(link.title);
        const contentKey = baseKey || titleKey;

        if (!contentKey) {
          dedupeMap.set(link.url, link);
          continue;
        }

        const existing = dedupeMap.get(contentKey);
        if (!existing) {
          dedupeMap.set(contentKey, link);
          continue;
        }

        if (existing.isPdf && !link.isPdf) {
          dedupeMap.set(contentKey, link);
          skippedPdfDuplicates += 1;
          continue;
        }

        if (!existing.isPdf && link.isPdf) {
          skippedPdfDuplicates += 1;
          continue;
        }

        skippedSameTypeDuplicates += 1;
      }

      const dedupedLinks = Array.from(dedupeMap.values());

      logger.crawl('Discovered links from publication page', {
        baseUrl: url,
        totalLinks: discoveredLinks.length,
        dedupedLinks: dedupedLinks.length,
        skippedPdfDuplicates,
        skippedSameTypeDuplicates,
      });
      result.skippedPdfDuplicates = skippedPdfDuplicates;

      // Normalize URLs and create sources
      for (const link of dedupedLinks) {
        try {
          const normalizedUrl = UrlNormalizer.normalize(link.url, url);

          // Check if source already exists
          const existing = await this.db
            .select()
            .from(sources)
            .where(eq(sources.normalizedUrl, normalizedUrl))
            .limit(1);

          if (existing.length > 0) {
            logger.crawl('Skipping duplicate source', { 
              url: link.url, 
              existingId: existing[0].id 
            });
            result.skippedDuplicates++;
            continue;
          }

          // Classify the publication
          // PDFs are always content pages
          if (link.isPdf) {
            const classification = {
              sourceType: 'pdf' as SourceType,
              category: 'guide' as SourceCategory,
              pageKind: 'content' as PageKind,
            };
            
            // Create new source for PDF
            await this.db.insert(sources).values({
              url: link.url,
              normalizedUrl: normalizedUrl,
              title: link.title,
              sourceType: classification.sourceType,
              category: classification.category,
              jurisdictionTags: ['CA-FED'],
              pageKind: classification.pageKind,
              ingestStatus: 'pending',
              priority: 'high',
              parentSourceId: sourceId,
            });

            logger.crawl('Created new PDF source from publication page discovery', {
              url: link.url,
              title: link.title,
              parentSourceId: sourceId,
            });

            result.discoveredLinks.push({
              url: link.url,
              title: link.title,
              normalizedUrl: normalizedUrl,
            });

            result.newSourcesCreated++;
            continue;
          }
          
          // For HTML links, classify normally
          const classification = this.classifyPublication(link.url, link.title);
          
          // Force to content page if it's in a subdirectory of the parent
          // Links in subdirectories (e.g., 16-5-1/voluntary-disclosures-program.html) are content pages
          const basePath = new URL(url).pathname.toLowerCase().replace(/\.html$/, '');
          const linkPath = new URL(link.url).pathname.toLowerCase();
          const isSubdirectory = linkPath.startsWith(basePath + '/');
          
          const finalPageKind = isSubdirectory ? 'content' : classification.pageKind;

          // Create new source
          await this.db.insert(sources).values({
            url: link.url,
            normalizedUrl: normalizedUrl,
            title: link.title,
            sourceType: classification.sourceType,
            category: classification.category,
            jurisdictionTags: ['CA-FED'],
            pageKind: finalPageKind,
            ingestStatus: finalPageKind === 'directory' ? 'skipped' : 'pending',
            priority: finalPageKind === 'content' ? 'high' : 'medium',
            parentSourceId: sourceId,
          });

          logger.crawl('Created new source from publication page discovery', {
            url: link.url,
            title: link.title,
            parentSourceId: sourceId,
            sourceType: classification.sourceType,
            category: classification.category,
            pageKind: finalPageKind,
          });

          result.discoveredLinks.push({
            url: link.url,
            title: link.title,
            normalizedUrl: normalizedUrl,
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

      logger.crawl('Publication page discovery completed', {
        sourceId,
        newSources: result.newSourcesCreated,
        skipped: result.skippedDuplicates,
        errors: result.errors.length,
      });

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.crawlError('Publication page discovery failed', {
        sourceId,
        url,
        error: errorMsg,
      });
      throw error;
    }
  }

  async close(): Promise<void> {
    // No resources to close
  }
}
