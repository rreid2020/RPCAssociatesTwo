import puppeteer, { type Browser, type Page } from 'puppeteer';
import type { CrawlerConfig } from '../../shared/dist/index.js';
import { logger } from '../../shared/dist/utils/index.js';
import { BlockDetector, type BlockSignature } from './block-detector';
import { createHash } from 'crypto';

interface BrowserResponse {
  url: string;
  status: number;
  statusText: string;
  html: string;
  headers: Record<string, string>;
}

export class BrowserClient {
  private config: CrawlerConfig;
  private browser: Browser | null = null;
  private userAgent: string;

  constructor(config: CrawlerConfig) {
    this.config = config;
    this.userAgent = config.userAgent;
  }

  async initialize(): Promise<void> {
    if (this.browser) {
      return;
    }

    logger.crawl('Initializing headless browser');
    
    const launchArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-blink-features=AutomationControlled',
    ];

    // Add proxy if configured
    const proxyServer = process.env.CRAWLER_PROXY;
    if (proxyServer) {
      launchArgs.push(`--proxy-server=${proxyServer}`);
      logger.crawl('Using proxy server', { proxy: proxyServer });
    }

    this.browser = await puppeteer.launch({
      headless: 'new',
      args: launchArgs,
      // Try to use system Chrome if available, otherwise will download
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    });

    logger.crawl('Browser initialized');
  }

  async fetch(url: string, options: {
    timeout?: number;
    retries?: number;
    retryBackoff?: number;
  } = {}): Promise<BrowserResponse> {
    const {
      timeout = this.config.timeout,
      retries = this.config.retries,
      retryBackoff = this.config.retryBackoff,
    } = options;

    await this.initialize();

    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          const backoffMs = retryBackoff * Math.pow(2, attempt - 1);
          logger.crawlWarn(`Retrying browser fetch (attempt ${attempt + 1}/${retries + 1})`, {
            url,
            backoffMs,
          });
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        }

        logger.crawl('Fetching URL with browser', { url, attempt: attempt + 1 });

        const page = await this.browser.newPage();

        try {
          // Set a realistic viewport
          await page.setViewport({ width: 1920, height: 1080 });

          // Set user agent
          await page.setUserAgent(this.userAgent);

          // Remove webdriver flag and add stealth (using string to avoid TypeScript errors)
          await page.evaluateOnNewDocument(`
            // Remove webdriver flag
            Object.defineProperty(navigator, 'webdriver', {
              get: () => false,
            });
            
            // Add realistic plugins
            Object.defineProperty(navigator, 'plugins', {
              get: () => [1, 2, 3, 4, 5],
            });
            
            // Set languages
            Object.defineProperty(navigator, 'languages', {
              get: () => ['en-CA', 'en-US', 'en'],
            });
            
            // Add chrome object
            window.chrome = {
              runtime: {},
            };
            
            // Override permissions
            const originalQuery = window.navigator.permissions.query;
            window.navigator.permissions.query = (parameters) => (
              parameters.name === 'notifications' ?
                Promise.resolve({ state: Notification.permission }) :
                originalQuery(parameters)
            );
            
            // Add realistic platform
            Object.defineProperty(navigator, 'platform', {
              get: () => 'Win32',
            });
            
            // Add hardware concurrency
            Object.defineProperty(navigator, 'hardwareConcurrency', {
              get: () => 8,
            });
            
            // Add device memory
            Object.defineProperty(navigator, 'deviceMemory', {
              get: () => 8,
            });
          `);

          // Add extra headers to appear more browser-like
          await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-CA,en-US,en;q=0.9,fr;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
            'DNT': '1',
          });

          // Add random mouse movement to appear more human-like
          await page.mouse.move(Math.random() * 100, Math.random() * 100);
          
          // Navigate with timeout and wait for content
          const response = await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout,
          });

          // Wait a bit for any JavaScript to execute (longer wait for CRA)
          await page.waitForTimeout(3000 + Math.random() * 2000); // Random delay between 3-5 seconds

          if (!response) {
            throw new Error('No response from page');
          }

          const status = response.status();
          const statusText = response.statusText();

          // Wait longer for any dynamic content to load, especially for CRA pages
          // CRA pages may load content via JavaScript even with 403 status
          await page.waitForTimeout(5000);

          // Get the HTML content (even if status is 403, the page might have loaded)
          let html: string;
          try {
            html = await page.content();
          } catch (error) {
            // Page might have been closed, try to get content from response
            logger.crawlWarn('Could not get page content, page may have closed', {
              url,
              error: error instanceof Error ? error.message : String(error),
            });
            throw new Error('Page closed before content could be retrieved');
          }
          
          const headers = response.headers();

          // Check if we got actual content (not just an error page)
          // Lower threshold and check for common CRA page elements
          const hasErrorPage = 
            html.includes('Access Denied') || 
            html.includes('403 Forbidden') ||
            html.includes('Forbidden') ||
            html.includes('blocked') ||
            html.includes('bot') ||
            (html.length < 500 && html.includes('403'));
          
          const hasContent = html.length > 500 && !hasErrorPage;
          
          // Also check for common CRA page indicators
          const hasCraContent = 
            html.includes('canada.ca') ||
            html.includes('revenue-agency') ||
            html.includes('Income Tax') ||
            html.includes('folio') ||
            html.includes('main') ||
            html.includes('article') ||
            html.includes('Series');

          // For 403/401/429/503 responses, capture full probe artifacts
          if (status === 403 || status === 401 || status === 429 || status === 503) {
            // Capture full response details for classification
            const responseHeaders = Object.fromEntries(
              Object.entries(headers).map(([k, v]) => [k.toLowerCase(), String(v)])
            );
            
            // Calculate SHA-256 of body for recognizing same block pages
            const bodyHash = createHash('sha256').update(html).digest('hex');
            
            // Sanitize body preview (first 800 chars, remove sensitive data)
            const bodyPreview = html
              .substring(0, 800)
              .replace(/password[=:]\s*\S+/gi, 'password=***')
              .replace(/token[=:]\s*\S+/gi, 'token=***')
              .replace(/api[_-]?key[=:]\s*\S+/gi, 'api_key=***');
            
            const blockSignature: BlockSignature = {
              status,
              contentType: responseHeaders['content-type'] || 'unknown',
              contentLength: html.length,
              bodySignature: html.length <= 500 ? html : html.substring(0, 500),
              hasErrorKeywords: {
                accessDenied: html.includes('Access Denied'),
                forbidden: html.includes('Forbidden'),
                blocked: html.includes('blocked'),
                bot: html.includes('bot'),
                captcha: html.includes('captcha'),
                enableJs: html.includes('enable javascript') || html.includes('enable JS'),
              },
              wafHeaders: {
                'cf-ray': responseHeaders['cf-ray'],
                'x-akamai-request-id': responseHeaders['x-akamai-request-id'],
                'cf-request-id': responseHeaders['cf-request-id'],
                'x-amzn-requestid': responseHeaders['x-amzn-requestid'],
              },
            };
            
            // Log probe artifacts for diagnostic purposes
            logger.crawlError('PROBE ARTIFACTS - Blocked Request', {
              url,
              status,
              statusText,
              contentType: responseHeaders['content-type'] || 'unknown',
              server: responseHeaders['server'] || 'unknown',
              location: responseHeaders['location'] || null,
              contentLength: html.length,
              bodyPreview,
              bodyHash,
              headers: {
                'content-type': responseHeaders['content-type'],
                'server': responseHeaders['server'],
                'location': responseHeaders['location'],
                'set-cookie': responseHeaders['set-cookie'] ? 'present' : 'absent',
              },
            });
            
            // Classify the block type
            const blockType = BlockDetector.classify(blockSignature);
            
            logger.crawlError('Block Detected - Full Signature', {
              url,
              blockType,
              ...blockSignature,
              bodyHash,
            });
            
            // Hard block detector: If status in {401, 403, 429, 503} AND bodyBytes < 2048
            // Stop immediately (don't retry)
            if ((status === 401 || status === 403 || status === 429 || status === 503) && html.length < 2048) {
              logger.crawlError('Hard block detected - stopping immediately', {
                url,
                status,
                bodyLength: html.length,
                blockType,
                reason: BlockDetector.getBlockReason(blockType),
              });
              
              // Store block info in error for upstream handling
              const blockError = new Error(`Blocked: ${BlockDetector.getBlockReason(blockType)}`);
              (blockError as any).blockType = blockType;
              (blockError as any).blockSignature = { ...blockSignature, bodyHash };
              
              try {
                if (!page.isClosed()) {
                  await page.close();
                }
              } catch (closeError) {
                // Ignore if already closed
              }
              
              throw blockError;
            }
            
            // If it has CRA content and isn't clearly an error page, try to use it
            if (hasCraContent && !hasErrorPage && html.length > 300) {
              logger.crawlWarn('Got 403 but page has CRA content, proceeding', {
                url,
                htmlLength: html.length,
                hasCraContent,
              });
              try {
                if (!page.isClosed()) {
                  await page.close();
                }
              } catch (closeError) {
                // Ignore if already closed
              }
              return {
                url: response.url(),
                status: 200, // Treat as success since we have content
                statusText: 'OK',
                html,
                headers,
              };
            }
          }

          // If we have content (non-403), return it
          if (hasContent) {
            try {
              if (!page.isClosed()) {
                await page.close();
              }
            } catch (closeError) {
              // Ignore if already closed
            }
            return {
              url: response.url(),
              status: 200,
              statusText: 'OK',
              html,
              headers,
            };
          }

          // Check for errors if we don't have usable content
          if (status >= 400 && !hasContent) {
            const errorMsg = `HTTP ${status}: ${statusText}`;
            logger.crawlError('HTTP error from browser', {
              url,
              status,
              statusText,
              htmlLength: html.length,
              hasCraContent,
            });

            // For 403 errors, try to wait a bit longer - sometimes content loads after status code
            if (status === 403 && attempt < retries) {
              logger.crawlWarn('Got 403, waiting longer for content to potentially load', {
                url,
                attempt: attempt + 1,
              });
              await page.waitForTimeout(5000); // Wait 5 more seconds
              
              // Try to get content again
              try {
                const retryHtml = await page.content();
                const retryHasErrorPage = 
                  retryHtml.includes('Access Denied') || 
                  retryHtml.includes('403 Forbidden') ||
                  retryHtml.includes('Forbidden') ||
                  (retryHtml.length < 500 && retryHtml.includes('403'));
                const retryHasContent = retryHtml.length > 500 && !retryHasErrorPage;
                const retryHasCraContent = 
                  retryHtml.includes('canada.ca') ||
                  retryHtml.includes('revenue-agency') ||
                  retryHtml.includes('Income Tax') ||
                  retryHtml.includes('folio');
                
                if (retryHasContent || (retryHasCraContent && retryHtml.length > 500)) {
                  logger.crawlWarn('Got content on retry after 403', {
                    url,
                    htmlLength: retryHtml.length,
                  });
                  await page.close();
                  return {
                    url: response.url(),
                    status: 200,
                    statusText: 'OK',
                    html: retryHtml,
                    headers,
                  };
                }
              } catch (retryError) {
                // Content retrieval failed, continue to normal retry logic
                logger.crawlWarn('Failed to get content on retry', {
                  url,
                  error: retryError instanceof Error ? retryError.message : String(retryError),
                });
              }
              
              // Close page and retry
              try {
                if (!page.isClosed()) {
                  await page.close();
                }
              } catch (closeError) {
                // Ignore if already closed
              }
              continue;
            }

            if (status >= 500 && attempt < retries) {
              try {
                if (!page.isClosed()) {
                  await page.close();
                }
              } catch (closeError) {
                // Ignore if already closed
              }
              continue;
            }

            try {
              if (!page.isClosed()) {
                await page.close();
              }
            } catch (closeError) {
              // Ignore if already closed
            }
            throw new Error(errorMsg);
          }

          try {
            if (!page.isClosed()) {
              await page.close();
            }
          } catch (closeError) {
            // Ignore if already closed
          }

          logger.crawl('Browser fetch successful', {
            url,
            status,
            contentType: headers['content-type'],
          });

          return {
            url: response.url(),
            status,
            statusText,
            html,
            headers,
          };
        } catch (error) {
          // Try to close page, but don't fail if it's already closed
          try {
            if (page && !page.isClosed()) {
              await page.close();
            }
          } catch (closeError) {
            // Page might already be closed, ignore
            logger.crawlWarn('Page already closed or error closing page', {
              url,
              error: closeError instanceof Error ? closeError.message : String(closeError),
            });
          }
          throw error;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isPageClosed = errorMessage.includes('Connection closed') || 
                            errorMessage.includes('Target closed') ||
                            errorMessage.includes('page has been closed');
        const isNavigationTimeout = errorMessage.includes('Navigation timeout') ||
                                   errorMessage.includes('timeout');

        if (isPageClosed) {
          logger.crawlWarn('Page was closed (possibly by bot detection)', {
            url,
            attempt: attempt + 1,
            maxAttempts: retries + 1,
          });
          // Wait longer before retry if page was closed (might be bot detection)
          if (attempt < retries) {
            const backoffMs = retryBackoff * Math.pow(2, attempt) * 2; // Longer backoff for page closures
            logger.crawlWarn('Waiting before retry after page closure', {
              url,
              backoffMs,
            });
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
            continue;
          }
        }

        if (isNavigationTimeout) {
          logger.crawlError('Browser navigation timeout', { url, timeout });
          if (attempt < retries) {
            continue;
          }
        }

        if (attempt < retries) {
          continue;
        }
      }
    }

    logger.crawlError('All browser fetch attempts failed', {
      url,
      error: lastError?.message,
    });

    throw lastError || new Error(`Failed to fetch ${url} with browser after ${retries + 1} attempts`);
  }

  async close(): Promise<void> {
    if (this.browser) {
      logger.crawl('Closing browser');
      await this.browser.close();
      this.browser = null;
    }
  }
}

