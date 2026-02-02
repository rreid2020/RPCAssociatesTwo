import type { CrawlerConfig } from '../../shared/dist/index.js';
import { logger } from '../../shared/dist/utils/index.js';

interface FetchOptions {
  headers?: Record<string, string>;
  timeout?: number;
  maxRedirects?: number;
  retries?: number;
  retryBackoff?: number;
}

export class HttpClient {
  private config: CrawlerConfig;
  private defaultHeaders: Record<string, string>;

  constructor(config: CrawlerConfig) {
    this.config = config;
    this.defaultHeaders = {
      'User-Agent': config.userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-CA,en-US,en;q=0.9,fr;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0',
      'DNT': '1',
    };
  }

  async fetch(url: string, options: FetchOptions = {}): Promise<Response> {
    const {
      headers = {},
      timeout = this.config.timeout,
      maxRedirects = 5,
      retries = this.config.retries,
      retryBackoff = this.config.retryBackoff,
    } = options;

    const allHeaders = { ...this.defaultHeaders, ...headers };
    let lastError: Error | null = null;
    let redirectCount = 0;
    let currentUrl = url;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          const backoffMs = retryBackoff * Math.pow(2, attempt - 1);
          logger.crawlWarn(`Retrying fetch (attempt ${attempt + 1}/${retries + 1})`, {
            url: currentUrl,
            backoffMs,
          });
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        }

        logger.crawl('Fetching URL', { url: currentUrl, attempt: attempt + 1 });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        let response: Response;
        try {
          response = await fetch(currentUrl, {
            headers: allHeaders,
            signal: controller.signal,
            redirect: 'manual', // Handle redirects manually to log them
          });
        } finally {
          clearTimeout(timeoutId);
        }

        // Handle redirects
        if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
          if (redirectCount >= maxRedirects) {
            throw new Error(`Max redirects (${maxRedirects}) exceeded for ${url}`);
          }

          const location = response.headers.get('location')!;
          const redirectUrl = new URL(location, currentUrl).toString();
          
          logger.crawl('Following redirect', {
            from: currentUrl,
            to: redirectUrl,
            status: response.status,
            redirectCount: redirectCount + 1,
          });

          redirectCount++;
          currentUrl = redirectUrl;
          continue; // Retry with new URL
        }

        // Handle retryable errors
        if (response.status === 429 || response.status === 503) {
          if (attempt < retries) {
            const retryAfter = response.headers.get('Retry-After');
            const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : retryBackoff * Math.pow(2, attempt);
            
            logger.crawlWarn('Rate limited or service unavailable, will retry', {
              url: currentUrl,
              status: response.status,
              retryAfter: waitTime,
            });
            
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            continue;
          }
        }

        // Validate HTTP status
        if (response.status >= 400) {
          const errorMsg = `HTTP ${response.status}: ${response.statusText}`;
          logger.crawlError('HTTP error', {
            url: currentUrl,
            status: response.status,
            statusText: response.statusText,
          });
          
          if (response.status >= 500 && attempt < retries) {
            // Retry on server errors
            continue;
          }
          
          throw new Error(errorMsg);
        }

        logger.crawl('Fetch successful', {
          url: currentUrl,
          status: response.status,
          contentType: response.headers.get('content-type'),
        });

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (error instanceof Error && error.name === 'AbortError') {
          logger.crawlError('Request timeout', { url: currentUrl, timeout });
          if (attempt < retries) {
            continue;
          }
        }

        if (attempt < retries) {
          continue;
        }
      }
    }

    logger.crawlError('All retry attempts failed', {
      url,
      finalUrl: currentUrl,
      error: lastError?.message,
    });

    throw lastError || new Error(`Failed to fetch ${url} after ${retries + 1} attempts`);
  }
}

