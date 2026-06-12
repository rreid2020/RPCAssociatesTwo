import * as cheerio from 'cheerio';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import pdfParse from 'pdf-parse';
import TurndownService from 'turndown';
import { sources, documents, chunks, embeddings, getDb, ensureDbValidated } from '@shared/types/db';
import { calculateContentHash, getCrawlerConfig, type IngestSummary, logger, requestText, requestBytes, type TextResult } from '@shared/types';
import { eq, and, count, sql } from 'drizzle-orm';
import { createStorageProvider } from '@storage/core';
import { EmbeddingService } from './embedding';
import { SectionAwareChunker } from './chunking';
import { CraFolioExtractor } from './services/extraction/craFolioExtractor';
import {
  buildCanliiMetadataIngestDocument,
  isCanliiMetadataOnlySource
} from './services/canlii/canliiMetadataIngest';
import { CraFolioChunker } from './services/chunking/craFolioChunker';
import {
  isArchivedOrCancelledTitle,
  isCatalogPublicationLandingUrl,
  isFrenchCraPublicationUrl,
  isPublicationIngestContentUrl,
  publicationUrlDepth
} from './corpus/sourcePolicy';

const turndownService = new TurndownService();
const MIN_TEXT_LENGTH = 0; // No minimum - ingest all content regardless of length

function detectContentType(url: string, contentType?: string | null): 'pdf' | 'html' {
  // Check Content-Type header first
  if (contentType) {
    if (contentType.includes('application/pdf')) {
      return 'pdf';
    }
    if (contentType.includes('text/html') || contentType.includes('application/xhtml')) {
      return 'html';
    }
  }

  // Fall back to URL extension
  const urlLower = url.toLowerCase();
  if (urlLower.endsWith('.pdf')) {
    return 'pdf';
  }

  // Default to HTML
  return 'html';
}

function getBaseContentKey(url: string): string | null {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    const filename = pathname.split('/').pop();
    if (!filename) return null;
    return filename.replace(/\.(pdf|html)$/i, '');
  } catch {
    return null;
  }
}

function extractHtmlContent(html: string, url: string): { text: string; title: string } {
  try {
    // Use Readability for main content extraction
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (article) {
      logger.extract('Extracted content using Readability', {
        url,
        textLength: article.textContent.length,
        title: article.title,
      });

      // Convert to markdown
      const $ = cheerio.load(article.content);
      const markdown = turndownService.turndown($.html() || '');
      
      return {
        text: markdown,
        title: article.title || '',
      };
    }
  } catch (error) {
    logger.extractWarn('Readability extraction failed, falling back to basic extraction', {
      url,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Fallback to basic extraction
  const $ = cheerio.load(html);
  $('script, style, nav, header, footer, aside').remove();
  const markdown = turndownService.turndown($('body').html() || '');
  const title = $('title').text() || '';

  logger.extract('Extracted content using basic method', {
    url,
    textLength: markdown.length,
    title,
  });

  return { text: markdown, title };
}

/**
 * Determine the appropriate referer header for a source URL
 * - For CRA URLs: Use CRA base URL as referer
 * - For folio URLs: Use parent source URL if available, otherwise CRA base URL
 * - For other URLs: No referer (undefined)
 */
async function determineReferer(
  sourceRecord: { url: string; sourceType: string; parentSourceId?: string | null }
): Promise<string | undefined> {
  const url = sourceRecord.url;
  
  // Check if it's a CRA domain
  const isCraDomain = url.includes('canada.ca');
  
  if (url.includes('canlii.org') || url.includes('canlii.ca')) {
    return 'https://www.canlii.org/';
  }

  if (!isCraDomain) {
    return undefined;
  }
  
  // For folio content pages, try to use parent source URL as referer
  if (sourceRecord.sourceType === 'cra_folio_content' && sourceRecord.parentSourceId) {
    const db = getDb();
    const parentSource = await db
      .select({ url: sources.url })
      .from(sources)
      .where(eq(sources.id, sourceRecord.parentSourceId))
      .limit(1);
    
    if (parentSource.length > 0 && parentSource[0].url) {
      return parentSource[0].url;
    }
  }
  
  // Default: Use CRA base URL for all CRA domains
  return 'https://www.canada.ca/en/revenue-agency/services/forms-publications.html';
}

function readHttpTimeoutMs (isCanliiSource: boolean): number {
  const configured = Number(process.env.HTTP_TIMEOUT_MS || '')
  if (Number.isFinite(configured) && configured > 0) {
    return configured
  }
  return isCanliiSource ? 90_000 : 90_000
}

function readHttpRetries (): number {
  const configured = Number(process.env.HTTP_RETRIES || '')
  if (Number.isFinite(configured) && configured >= 0) {
    return configured
  }
  return 2
}

async function fetchHtmlViaBrowser (
  url: string,
  timeout: number
): Promise<TextResult> {
  const { BrowserClient } = await import('@crawler/core')
  const browser = new BrowserClient(getCrawlerConfig())
  try {
    const browserResponse = await browser.fetch(url, {
      timeout: Math.max(timeout, 45_000),
      retries: 1
    })

    if (browserResponse.html.length < 200) {
      throw new Error(`Browser fetch content too short (${browserResponse.html.length} bytes)`)
    }

    return {
      status: browserResponse.status,
      statusText: browserResponse.statusText,
      headers: browserResponse.headers,
      contentType: 'text/html',
      text: browserResponse.html
    }
  } finally {
    await browser.close()
  }
}

async function fetchHtmlForIngest (
  url: string,
  referer: string | undefined,
  isCanliiSource: boolean
): Promise<TextResult> {
  const timeout = readHttpTimeoutMs(isCanliiSource)
  const retries = readHttpRetries()
  const useBrowserFirst = !isCanliiSource && url.includes('canada.ca')

  if (useBrowserFirst) {
    try {
      const result = await fetchHtmlViaBrowser(url, timeout)
      logger.ingest('Fetched HTML content via browser', {
        url,
        status: result.status,
        textLength: result.text.length
      })
      return result
    } catch (error) {
      logger.ingestWarn('Browser fetch failed for ingest, trying HTTP fallback', {
        url,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  try {
    const result = await requestText(url, {
      referer,
      timeout: useBrowserFirst ? 20_000 : timeout,
      retries: useBrowserFirst ? 0 : retries
    })
    if (result.text.length >= 200) {
      return result
    }
    throw new Error(`HTTP fetch returned short HTML (${result.text.length} bytes)`)
  } catch (error) {
    if (!useBrowserFirst) {
      throw new Error(`Failed to fetch HTML for ingest: ${url}`)
    }
    logger.ingestWarn('HTTP fallback failed for ingest', {
      url,
      error: error instanceof Error ? error.message : String(error)
    })
    throw new Error(`Failed to fetch HTML for ingest: ${url}`)
  }
}

export class IngestionService {
  private storage = createStorageProvider();
  private embeddingService = new EmbeddingService();
  private chunker = new SectionAwareChunker();

  async ingestSource(sourceId: string): Promise<void> {
    const db = getDb();
    const source = await db.select().from(sources).where(eq(sources.id, sourceId)).limit(1);

    if (source.length === 0) {
      throw new Error(`Source not found: ${sourceId}`);
    }

    const sourceRecord = source[0];

    logger.ingest('Starting ingestion', {
      sourceId,
      url: sourceRecord.url,
      title: sourceRecord.title,
      type: sourceRecord.sourceType,
    });

    try {
      // Check if this is a directory page that needs discovery first
      if (sourceRecord.sourceType === 'cra_folio_directory' || 
          sourceRecord.sourceType === 'cra_ic_directory' ||
          (sourceRecord.pageKind === 'directory' && sourceRecord.sourceType !== 'html')) {
        // Run discovery first - use appropriate discovery service
        let discoveryService;
        if (sourceRecord.sourceType === 'cra_ic_directory') {
          const { CraIcDiscoveryService } = await import('./services/discovery/craIcDiscovery');
          discoveryService = new CraIcDiscoveryService();
        } else {
          const { CraFolioDiscoveryService } = await import('./services/discovery/craFolioDiscovery');
          discoveryService = new CraFolioDiscoveryService();
        }
        
        try {
          const result = await discoveryService.discoverFromSource(sourceId);
          logger.ingest('Discovery completed', {
            sourceId,
            newSources: result.newSourcesCreated,
            pageKind: result.pageKind,
          });
          
          // If this is a directory page, mark as skipped and skip ingestion
          if (result.pageKind === 'directory') {
            await db
              .update(sources)
              .set({ ingestStatus: 'skipped' })
              .where(eq(sources.id, sourceId));
            logger.ingest('Directory page discovery completed, skipping ingestion', {
              sourceId,
              newSourcesCreated: result.newSourcesCreated,
            });
            return; // Directory pages don't get ingested
          }
        } finally {
          await discoveryService.close();
        }
      }

      const metadataOnlyCanlii = isCanliiMetadataOnlySource(sourceRecord)

      let text: string;
      let extractedTitle: string;
      let contentType: string | undefined;
      let contentLength: number;
      let statusCode: number | undefined;
      
      const metadata: Record<string, unknown> = {
        url: sourceRecord.url,
        title: sourceRecord.title,
        type: metadataOnlyCanlii ? 'canlii_metadata' : detectContentType(sourceRecord.url),
      };

      if (metadataOnlyCanlii) {
        logger.ingest('Ingesting CanLII metadata only (full text not permitted via API)', {
          sourceId,
          url: sourceRecord.url
        })
        const built = buildCanliiMetadataIngestDocument(sourceRecord)
        text = built.text
        extractedTitle = built.title
        contentLength = text.length
        Object.assign(metadata, built.metadata)
      } else {
      // Fetch content using unified HTTP client
      logger.ingest('Fetching content', { url: sourceRecord.url });
      
      // Detect content type from URL first
      const detectedType = detectContentType(sourceRecord.url);
      metadata.type = detectedType;

      if (detectedType === 'pdf') {
        const baseKey = getBaseContentKey(sourceRecord.url);
        if (baseKey) {
          const htmlCandidates = await db.execute(sql`
            SELECT id, url
            FROM taxgpt.sources
            WHERE source_type = 'html'
              AND page_kind = 'content'
              AND lower(url) LIKE ${`%${baseKey}.html`}
              ${sourceRecord.parentSourceId ? sql`AND parent_source_id = ${sourceRecord.parentSourceId}` : sql``}
            LIMIT 1
          `);

          const htmlRow = (htmlCandidates as unknown as Array<{ id: string; url: string }>)[0];
          if (htmlRow) {
            await db
              .update(sources)
              .set({ ingestStatus: 'skipped', errorMessage: 'Duplicate of HTML' })
              .where(eq(sources.id, sourceId));

            logger.ingest('Skipped PDF source because HTML version exists', {
              sourceId,
              url: sourceRecord.url,
              htmlUrl: htmlRow.url,
            });
            return;
          }
        }
      }
      
      // Determine referer header based on source type and parent
      const referer = await determineReferer(sourceRecord);
      
      if (detectedType === 'pdf') {
        // Use unified HTTP client for PDFs with proper headers
        logger.ingest('Fetching PDF content', {
          url: sourceRecord.url,
          sourceId,
          referer,
        });
        
        const result = await requestBytes(sourceRecord.url, {
          referer,
        });
        statusCode = result.status;
        contentType = result.contentType;
        contentLength = result.bytes.length;
        
        logger.ingest('Fetched PDF content', {
          url: sourceRecord.url,
          sourceId,
          status: statusCode,
          statusText: result.statusText,
          contentType,
          bytesLength: contentLength,
          headerCount: Object.keys(result.headers).length,
        });
        
        const pdfData = await pdfParse(Buffer.from(result.bytes));
        text = pdfData.text;
        extractedTitle = pdfData.info?.Title || sourceRecord.title;
        metadata.pageCount = pdfData.numpages;
        metadata.pdfInfo = pdfData.info;
        metadata.detectedContentType = contentType;
        
        logger.extract('PDF extracted', {
          url: sourceRecord.url,
          textLength: text.length,
          pageCount: pdfData.numpages,
          bytesLength: contentLength,
        });
      } else {
        // Use unified HTTP client for HTML with proper headers
        logger.ingest('Fetching HTML content', {
          url: sourceRecord.url,
          sourceId,
          referer,
        });
        
        const result = await fetchHtmlForIngest(sourceRecord.url, referer, false);
        statusCode = result.status;
        contentType = result.contentType;
        contentLength = result.text.length;
        
        logger.ingest('Fetched HTML content', {
          url: sourceRecord.url,
          sourceId,
          status: statusCode,
          statusText: result.statusText,
          contentType,
          textLength: contentLength,
          headerCount: Object.keys(result.headers).length,
        });
        
        // Update detected type based on actual content-type
        const actualDetectedType = detectContentType(sourceRecord.url, contentType);
        
        logger.extract('Extracting HTML content', { 
          url: sourceRecord.url,
          detectedType: actualDetectedType,
        });
        
        // Check if this is a publication index page that needs discovery
        // These are HTML pages that contain links to actual content pages (HTML or PDF)
        if (
          sourceRecord.sourceType === 'html' &&
          (sourceRecord.url.includes('/publications/') ||
            sourceRecord.url.includes('/payroll/') ||
            sourceRecord.url.includes('/forms-publications/'))
        ) {
          // Check if the page has links to content (indicating it's an index page)
          const $ = cheerio.load(result.text);
          const basePath = new URL(sourceRecord.url).pathname.toLowerCase().replace(/\.html$/, '');
          const baseDir = basePath.replace(/\/$/, '');
          let contentLinkCount = 0;
          let pdfLinkCount = 0;
          let htmlLinkCount = 0;
          
          // Extract publication pattern from URL (e.g., "16-5-1", "t4032bc")
          const publicationPattern = basePath.match(/([a-z0-9]+(?:-\d+)+)/i)?.[1] || '';
          
          $('a[href]').each((_, element) => {
            const href = $(element).attr('href');
            if (!href) return;
            
            try {
              const linkPath = new URL(href, sourceRecord.url).pathname.toLowerCase();
              
              // Skip same page, anchors, javascript, etc.
              if (linkPath === basePath || 
                  linkPath.includes('#') || 
                  linkPath.includes('javascript:') ||
                  linkPath.includes('mailto:')) {
                return;
              }
              
              // Count PDF links
              if (linkPath.endsWith('.pdf')) {
                pdfLinkCount++;
                contentLinkCount++;
              } 
              // Count HTML content links
              else if (linkPath.endsWith('.html')) {
                // Check if it's a content link (subdirectory, related name, etc.)
                const linkDir = linkPath.replace(/\.html$/, '').replace(/\/$/, '');
                const isSubdirectory = linkDir.startsWith(baseDir + '/');
                const linkHasPattern = publicationPattern && linkPath.includes(publicationPattern.toLowerCase());
                const isSameDirRelated = linkPath.startsWith(baseDir.substring(0, baseDir.lastIndexOf('/') + 1)) &&
                  publicationPattern && linkPath.split('/').pop()?.toLowerCase().includes(publicationPattern.toLowerCase().substring(0, 5));
                
                if (isSubdirectory || linkHasPattern || isSameDirRelated) {
                  htmlLinkCount++;
                  contentLinkCount++;
                }
              }
            } catch {
              // Invalid URL, skip
            }
          });
          
          // Depth-2+ URLs (e.g. …/19-3-1-1/stated-price-net-rebate.html) are final content.
          // Only shallow catalog landings (step 2) should trigger in-ingest discovery.
          const skipIngestDiscovery = isPublicationIngestContentUrl(sourceRecord.url)

          // Landing pages usually expose at least one HTML or PDF content link.
          if (!skipIngestDiscovery && contentLinkCount >= 1) {
            // Run discovery to find content pages linked from this index page
            const { CraPublicationsDiscoveryService } = await import('./services/discovery/craPublicationsDiscovery');
            const publicationsDiscovery = new CraPublicationsDiscoveryService();
            
            try {
              const discoveryResult = await publicationsDiscovery.discoverFromPublicationPage(sourceId);
              logger.ingest('Publication page discovery completed', {
                sourceId,
                newSources: discoveryResult.newSourcesCreated,
                url: sourceRecord.url,
                totalContentLinks: contentLinkCount,
                pdfLinks: pdfLinkCount,
                htmlLinks: htmlLinkCount,
              });
              
              // Mark this index page as skipped since we discovered the actual content pages
              await db
                .update(sources)
                .set({ ingestStatus: 'skipped', pageKind: 'directory' })
                .where(eq(sources.id, sourceId));
              
              logger.ingest('Skipped publication index page, discovered content pages', {
                sourceId,
                url: sourceRecord.url,
                discoveredCount: discoveryResult.newSourcesCreated,
              });
              
              return; // Skip ingestion of the index page itself
            } catch (discoveryError) {
              logger.ingestWarn('Publication page discovery failed, continuing with ingestion', {
                sourceId,
                url: sourceRecord.url,
                error: discoveryError instanceof Error ? discoveryError.message : String(discoveryError),
              });
              // Continue with normal ingestion if discovery fails
            }
          }
        }
        
        // Use folio-specific extractor for folio content pages
        // IC content pages use the same structure as folios, so use the folio extractor
        if (sourceRecord.sourceType === 'cra_folio_content' || sourceRecord.sourceType === 'cra_ic_content') {
          const folioExtractor = new CraFolioExtractor();
          const extracted = folioExtractor.extract(result.text, sourceRecord.url);
          text = extracted.text;
          extractedTitle = extracted.title || sourceRecord.title;
          Object.assign(metadata, extracted.metadata);
        } else {
          const extracted = extractHtmlContent(result.text, sourceRecord.url);
          text = extracted.text;
          extractedTitle = extracted.title || sourceRecord.title;
        }
      metadata.title = extractedTitle;
        metadata.detectedContentType = contentType;
        
        logger.extract('HTML extracted', {
          url: sourceRecord.url,
          textLength: text.length,
          title: extractedTitle,
          originalLength: contentLength,
        });
      }
      }

      // Skip archived/cancelled content (based on title)
      const archivedTitle = extractedTitle || sourceRecord.title;
      if (isArchivedOrCancelledTitle(archivedTitle)) {
        logger.ingestWarn('Archived/cancelled content detected, skipping', {
          sourceId,
          url: sourceRecord.url,
          title: archivedTitle,
        });

        await db
          .update(sources)
          .set({
            ingestStatus: 'skipped',
            errorMessage: 'Archived/Cancelled',
            lastAttemptAt: new Date(),
          })
          .where(eq(sources.id, sourceId));

        return;
      }

      // Validate minimum text length
      if (text.length < MIN_TEXT_LENGTH) {
        logger.ingestWarn('Text too short, skipping', {
          sourceId,
          url: sourceRecord.url,
          textLength: text.length,
          minLength: MIN_TEXT_LENGTH,
        });

        await db
          .update(sources)
          .set({
            ingestStatus: 'skipped',
          })
          .where(eq(sources.id, sourceId));

        return;
      }

      const contentHash = calculateContentHash(text);

      // Check if document already exists with same hash
      const existingDoc = await db
        .select()
        .from(documents)
        .where(and(eq(documents.sourceId, sourceId), eq(documents.contentHash, contentHash)))
        .limit(1)
        .execute();

      if (existingDoc.length > 0) {
        logger.ingest('Document unchanged, skipping', {
          sourceId,
          url: sourceRecord.url,
          contentHash,
        });

        await db
          .update(sources)
          .set({
            lastIngestedAt: new Date(),
            ingestStatus: 'ingested',
          })
          .where(eq(sources.id, sourceId));
        return;
      }

      // Create document
      logger.db('Creating document record', { sourceId, contentHash });
      const [document] = await db
        .insert(documents)
        .values({
          sourceId,
          contentHash,
          metadata,
        })
        .returning();

      if (!document) {
        throw new Error('Failed to create document record');
      }

      // Chunk content
      logger.chunk('Chunking content', {
        documentId: document.id,
        textLength: text.length,
      });

      // Use folio-specific chunker for folio content pages
      let chunked: Array<{ content: string; sectionHeading?: string; pageNumber?: number; chunkIndex: number; metadata?: Record<string, unknown> }>;
      if (sourceRecord.sourceType === 'cra_folio_content') {
        const folioChunker = new CraFolioChunker();
        chunked = folioChunker.chunk(text, {
          documentId: document.id,
          url: sourceRecord.url,
          title: extractedTitle,
          folioCode: metadata.folioCode as string | undefined,
        });
      } else {
        chunked = this.chunker.chunk(text, {
          documentId: document.id,
          url: sourceRecord.url,
          title: extractedTitle,
        });
      }

      // Fallback chunking if zero chunks
      if (chunked.length === 0) {
        logger.chunkWarn('Section-aware chunking produced zero chunks, using fallback', {
          documentId: document.id,
          textLength: text.length,
        });

        // Character-based fallback chunking
        const fallbackChunkSize = 3500;
        const fallbackOverlap = 400;
        chunked = [];

        for (let i = 0; i < text.length; i += fallbackChunkSize - fallbackOverlap) {
          const chunkContent = text.slice(i, i + fallbackChunkSize);
          if (chunkContent.trim().length > 0) {
            chunked.push({
              content: chunkContent,
              chunkIndex: chunked.length,
              metadata: {
                documentId: document.id,
                url: sourceRecord.url,
                title: extractedTitle,
                fallback: true,
              },
            });
          }
        }

        logger.chunk('Fallback chunking completed', {
          documentId: document.id,
          chunkCount: chunked.length,
        });
      }

      if (chunked.length === 0) {
        throw new Error('Chunking produced zero chunks, cannot proceed to embeddings');
      }

      logger.chunk('Chunking completed', {
        documentId: document.id,
        chunkCount: chunked.length,
        totalTextLength: text.length,
      });

      // Store chunks
      logger.db('Storing chunks', { documentId: document.id, chunkCount: chunked.length });
      const chunkRecords = await db
        .insert(chunks)
        .values(
          chunked.map((chunk) => ({
            documentId: document.id,
            content: chunk.content,
            sectionHeading: chunk.sectionHeading,
            pageNumber: chunk.pageNumber,
            chunkIndex: chunk.chunkIndex,
            metadata: chunk.metadata,
          }))
        )
        .returning();

      if (chunkRecords.length !== chunked.length) {
        throw new Error(`Failed to store all chunks: expected ${chunked.length}, got ${chunkRecords.length}`);
      }

      // Generate embeddings
      const texts = chunked.map((c) => c.content);
      logger.embed('Generating embeddings', {
        chunkCount: texts.length,
        model: this.embeddingService.getModel(),
      });

      const embeddingVectors = await this.embeddingService.embedBatch(texts);

      if (embeddingVectors.length !== texts.length) {
        throw new Error(
          `Embedding count mismatch: expected ${texts.length}, got ${embeddingVectors.length}`
        );
      }

      logger.embed('Embeddings generated', {
        count: embeddingVectors.length,
        dimensions: embeddingVectors[0]?.length || 0,
      });

      // Store embeddings
      logger.db('Storing embeddings', {
        chunkCount: chunkRecords.length,
        embeddingCount: embeddingVectors.length,
      });

      await db.insert(embeddings).values(
        chunkRecords.map((chunk, idx: number) => ({
          chunkId: chunk.id,
          embedding: embeddingVectors[idx],
          model: this.embeddingService.getModel(),
        }))
      );

      // Update source status
      await db
        .update(sources)
        .set({
          lastIngestedAt: new Date(),
          ingestStatus: 'ingested',
          contentHash,
        })
        .where(eq(sources.id, sourceId));

      // Validate DB writes
      await this.validateDbWrites(sourceId, document.id, chunkRecords.length, embeddingVectors.length);

      logger.ingest('Ingestion completed successfully', {
        sourceId,
        url: sourceRecord.url,
        documentId: document.id,
        chunkCount: chunkRecords.length,
        embeddingCount: embeddingVectors.length,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = errorMessage.match(/HTTP (\d+)/)?.[1] 
        ? parseInt(errorMessage.match(/HTTP (\d+)/)?.[1] || '0', 10)
        : null;

      // Treat missing resources as skipped so re-runs don't keep failing them
      if (errorCode === 404 || errorCode === 410) {
        logger.ingestWarn('Source not found, marking as skipped', {
          sourceId,
          url: sourceRecord.url,
          error: errorMessage,
          errorCode,
        });

        await db
          .update(sources)
          .set({
            ingestStatus: 'skipped',
            errorCode: errorCode || undefined,
            errorMessage: errorMessage.substring(0, 500),
            lastAttemptAt: new Date(),
          })
          .where(eq(sources.id, sourceId));

        return;
      }

      logger.ingestError('Ingestion failed', {
        sourceId,
        url: sourceRecord.url,
        error: errorMessage,
        errorCode,
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Mark as failed with error details
      await db
        .update(sources)
        .set({
          ingestStatus: 'failed',
          errorCode: errorCode || undefined,
          errorMessage: errorMessage.substring(0, 500), // Limit length
          lastAttemptAt: new Date(),
        })
        .where(eq(sources.id, sourceId));
      throw error;
    }
  }

  private async validateDbWrites(
    sourceId: string,
    documentId: string,
    expectedChunkCount: number,
    expectedEmbeddingCount: number
  ): Promise<void> {
    const db = getDb();

    // Verify source status
    const source = await db.select().from(sources).where(eq(sources.id, sourceId)).limit(1);
    if (source.length === 0 || source[0].ingestStatus !== 'ingested') {
      throw new Error(`Source ingest_status not updated correctly: ${source[0]?.ingestStatus || 'missing'}`);
    }

    // Verify document exists
    const doc = await db.select().from(documents).where(eq(documents.id, documentId)).limit(1);
    if (doc.length === 0) {
      throw new Error(`Document not found: ${documentId}`);
    }

    // Verify chunks count
    const chunkCountResult = await db
      .select({ count: count() })
      .from(chunks)
      .where(eq(chunks.documentId, documentId));
    const actualChunkCount = chunkCountResult[0]?.count || 0;

    if (actualChunkCount !== expectedChunkCount) {
      throw new Error(
        `Chunk count mismatch: expected ${expectedChunkCount}, found ${actualChunkCount}`
      );
    }

    if (actualChunkCount === 0) {
      throw new Error('No chunks found in database');
    }

    // Verify embeddings count
    const chunkIds = await db
      .select({ id: chunks.id })
      .from(chunks)
      .where(eq(chunks.documentId, documentId));

    let actualEmbeddingCount = 0;
    for (const chunk of chunkIds) {
      const embeddingCount = await db
        .select({ count: count() })
        .from(embeddings)
        .where(eq(embeddings.chunkId, chunk.id));
      actualEmbeddingCount += embeddingCount[0]?.count || 0;
    }

    if (actualEmbeddingCount !== expectedEmbeddingCount) {
      throw new Error(
        `Embedding count mismatch: expected ${expectedEmbeddingCount}, found ${actualEmbeddingCount}`
      );
    }

    if (actualEmbeddingCount !== actualChunkCount) {
      throw new Error(
        `Embedding count does not match chunk count: ${actualEmbeddingCount} != ${actualChunkCount}`
      );
    }

    logger.db('DB write validation passed', {
      sourceId,
      documentId,
      chunkCount: actualChunkCount,
      embeddingCount: actualEmbeddingCount,
    });
  }

  async ingestBatch(filters: {
    category?: string;
    type?: string;
    priority?: string;
    limit?: number;
  }): Promise<IngestSummary> {
    // Validate database setup before starting
    await ensureDbValidated();

    const db = getDb();
    const query = db.select().from(sources);

    logger.ingest('Starting batch ingestion', { filters });

    // Apply filters
    const allSources = await query;

    const priorityRank = { high: 0, medium: 1, low: 2 } as const;

    let filtered = allSources
      .filter((s: typeof allSources[0]) => {
        if (filters.category && s.category !== filters.category) return false;
        if (filters.type && s.sourceType !== filters.type) return false;
        if (filters.priority && s.priority !== filters.priority) return false;
        if (s.ingestStatus !== 'pending') return false;
        if (isArchivedOrCancelledTitle(s.title)) return false;
        if (s.pageKind === 'directory') return false;
        const metadata = (s.metadata || {}) as Record<string, unknown>;
        if (metadata.corpusRole === 'publication_landing') return false;
        // Catalog landing pages (step 2) must be expanded before ingest — not final content.
        if (isCatalogPublicationLandingUrl(s.url)) return false;
        return true;
      })
      .sort((a, b) => {
        const priorityDelta =
          (priorityRank[a.priority as keyof typeof priorityRank] ?? 2) -
          (priorityRank[b.priority as keyof typeof priorityRank] ?? 2);
        if (priorityDelta !== 0) return priorityDelta;
        const localeDelta =
          Number(isFrenchCraPublicationUrl(a.url)) - Number(isFrenchCraPublicationUrl(b.url));
        if (localeDelta !== 0) return localeDelta;
        const depthDelta = publicationUrlDepth(b.url) - publicationUrlDepth(a.url);
        if (depthDelta !== 0) return depthDelta;
        return String(a.title || '').localeCompare(String(b.title || ''));
      });

    if (filters.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    logger.ingest('Sources filtered for ingestion', {
      total: allSources.length,
      filtered: filtered.length,
      filters,
    });

    const summary: IngestSummary = {
      total: filtered.length,
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    };

    for (const source of filtered) {
      try {
        await this.ingestSource(source.id);
        const [updated] = await db
          .select({ ingestStatus: sources.ingestStatus })
          .from(sources)
          .where(eq(sources.id, source.id))
          .limit(1);
        if (updated?.ingestStatus === 'ingested') {
          summary.successful++;
        } else if (updated?.ingestStatus === 'skipped') {
          summary.skipped++;
        } else {
          summary.successful++;
        }
      } catch (error) {
        summary.failed++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        summary.errors.push({
          sourceId: source.id,
          error: errorMsg,
        });
        logger.ingestError('Source ingestion failed', {
          sourceId: source.id,
          url: source.url,
          error: errorMsg,
        });
      }
    }

    logger.ingest('Batch ingestion completed', {
      total: summary.total,
      successful: summary.successful,
      failed: summary.failed,
      skipped: summary.skipped,
      errorCount: summary.errors.length,
    });

    return summary;
  }
}
