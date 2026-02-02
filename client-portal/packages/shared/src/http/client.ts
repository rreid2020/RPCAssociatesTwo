import { logger } from '../utils/logger';

export interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  retryBackoff?: number;
  referer?: string;
}

export interface RequestResult {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  contentType?: string;
}

export interface TextResult extends RequestResult {
  text: string;
}

export interface BytesResult extends RequestResult {
  bytes: Uint8Array;
}

// Centralized headers for all requests
// These match the crawler's HttpClient headers exactly
// Note: Accept header is modified for PDF requests in buildHeaders()
const DEFAULT_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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

// Excel Power Query-like headers (simpler, less automation-detection flags)
// Excel uses WinHTTP which has different TLS fingerprinting characteristics
const EXCEL_LIKE_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-CA,en-US,en;q=0.9,fr;q=0.8',
  'Accept-Encoding': 'gzip, deflate',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
};

// Simple rate limiter
class RateLimiter {
  private lastRequestTime = 0;
  private minInterval: number;

  constructor(requestsPerSecond: number) {
    this.minInterval = 1000 / requestsPerSecond;
  }

  async wait(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }
}

// Global rate limiter (1.5 requests per second by default)
const rateLimiter = new RateLimiter(
  parseFloat(process.env.HTTP_RPS || '1.5')
);

function isCraDomainUrl(url: string): boolean {
  try {
    const domain = new URL(url).hostname.toLowerCase();
    return domain === 'canada.ca' || domain === 'www.canada.ca';
  } catch {
    return false;
  }
}

// Helper to build headers with optional referer and PDF-specific headers
function buildHeaders(url: string, options: RequestOptions, useExcelLike: boolean = false): Record<string, string> {
  // Use Excel-like headers if requested (simpler, less bot-detection flags)
  const baseHeaders = useExcelLike ? EXCEL_LIKE_HEADERS : DEFAULT_HEADERS;
  const allHeaders = { ...baseHeaders, ...options.headers };
  
  // Add referer if provided
  if (options.referer) {
    allHeaders['Referer'] = options.referer;
  }
  
  // For PDF requests, update Accept header
  if (url.toLowerCase().endsWith('.pdf') || options.headers?.['Accept']?.includes('application/pdf')) {
    allHeaders['Accept'] = 'application/pdf,application/octet-stream,*/*;q=0.8';
  }
  
  return allHeaders;
}

async function fetchWithRetry(
  url: string,
  options: RequestOptions,
  fetchFn: (url: string, fetchOptions: RequestInit) => Promise<Response>,
  useExcelLike: boolean = false
): Promise<Response> {
  const {
    headers = {},
    timeout = 30000,
    retries = 3,
    retryBackoff = 1000,
  } = options;

  // Build headers (includes referer if provided)
  // Use Excel-like headers for CRA domains if browser client fails
  const allHeaders = buildHeaders(url, { ...options, headers }, useExcelLike);

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        const backoffMs = retryBackoff * Math.pow(2, attempt - 1);
        logger.crawlWarn(`Retrying HTTP request (attempt ${attempt + 1}/${retries + 1})`, {
          url,
          backoffMs,
          previousAttempt: attempt,
        });
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }

      // Rate limiting
      await rateLimiter.wait();

      // Log request initiation with header summary
      const headerSummary = {
        userAgent: allHeaders['User-Agent']?.substring(0, 50) + '...',
        accept: allHeaders['Accept']?.substring(0, 50) + '...',
        hasReferer: !!allHeaders['Referer'],
        headerCount: Object.keys(allHeaders).length,
        mode: useExcelLike ? 'excel-like' : 'standard',
      };
      logger.crawl('Fetching URL', { 
        url, 
        attempt: attempt + 1,
        totalAttempts: retries + 1,
        headers: headerSummary,
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      let response: Response;
      try {
        response = await fetchFn(url, {
          headers: allHeaders,
          signal: controller.signal,
          redirect: 'follow',
        });
      } finally {
        clearTimeout(timeoutId);
      }

      // Log response received
      const contentLength = response.headers.get('content-length');
      const responseContentType = response.headers.get('content-type');
      logger.crawl('Response received', {
        url,
        status: response.status,
        statusText: response.statusText,
        contentType: responseContentType,
        contentLength: contentLength ? parseInt(contentLength, 10) : undefined,
        headerCount: Array.from(response.headers.entries()).length,
      });

      // Handle retryable errors
      if (response.status === 429 || response.status === 503) {
        if (attempt < retries) {
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : retryBackoff * Math.pow(2, attempt);
          
          logger.crawlWarn('Rate limited or service unavailable, will retry', {
            url,
            status: response.status,
            retryAfter: waitTime,
            attempt: attempt + 1,
            maxAttempts: retries + 1,
          });
          
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }
      }

      // Handle server errors (retry)
      if (response.status >= 500 && attempt < retries) {
        logger.crawlWarn('Server error, will retry', {
          url,
          status: response.status,
          attempt: attempt + 1,
          maxAttempts: retries + 1,
        });
        continue;
      }

      logger.crawl('Fetch successful', {
        url,
        status: response.status,
        statusText: response.statusText,
        contentType: responseContentType,
        contentLength: contentLength ? parseInt(contentLength, 10) : undefined,
      });

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (error instanceof Error && error.name === 'AbortError') {
        logger.crawlError('Request timeout', { url, timeout });
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
    totalAttempts: retries + 1,
    error: lastError?.message,
    errorType: lastError?.constructor?.name,
  });

  throw lastError || new Error(`Failed to fetch ${url} after ${retries + 1} attempts`);
}

/**
 * Fetch text content from a URL with retry logic and rate limiting
 * Automatically routes CRA domains to browser client
 */
export async function requestText(
  url: string,
  options: RequestOptions = {}
): Promise<TextResult> {
  // For CRA domains, skip browser client and use Excel-like HTTP directly
  // Browser client is consistently blocked by Akamai WAF and wastes 30+ seconds per request
  // Excel-like HTTP works reliably and is much faster
  if (isCraDomainUrl(url)) {
    logger.crawl('Routing CRA domain to Excel-like HTTP client (skipping browser client)', { url });
    
    // Try Excel-like headers first (simpler, less bot-detection flags)
    // Excel Power Query uses WinHTTP which has different TLS characteristics
    try {
      const response = await fetchWithRetry(url, options, fetch, true);
      if (response.ok) {
        logger.crawl('Excel-like HTTP fetch successful', { url, status: response.status });
        const text = await response.text();
        const headers: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });
        return {
          status: response.status,
          statusText: response.statusText,
          headers,
          contentType: response.headers.get('content-type') || undefined,
          text,
        };
      } else {
        // Non-200 response, throw error
        const errorText = await response.text().catch(() => '');
        throw new Error(
          `HTTP ${response.status} ${response.statusText}: ${errorText.substring(0, 200)}`
        );
      }
    } catch (excelError) {
      logger.crawlError('Excel-like HTTP fetch failed, falling back to standard HTTP', {
        url,
        error: excelError instanceof Error ? excelError.message : String(excelError),
      });
      // Fall through to standard HTTP fetch
    }
  }
  
  // Standard HTTP fetch for non-CRA domains or if Excel-like fails
  const response = await fetchWithRetry(url, options, fetch, false);

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(
      `HTTP ${response.status} ${response.statusText}: ${errorText.substring(0, 200)}`
    );
  }

  const text = await response.text();
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  logger.crawl('Text content retrieved', {
    url,
    status: response.status,
    textLength: text.length,
    contentType: response.headers.get('content-type') || undefined,
  });

  return {
    status: response.status,
    statusText: response.statusText,
    headers,
    contentType: response.headers.get('content-type') || undefined,
    text,
  };
}

/**
 * Fetch binary content from a URL with retry logic and rate limiting
 * Note: Browser client is not used for binary content (PDFs, etc.)
 * as they can typically be fetched via standard HTTP
 */
export async function requestBytes(
  url: string,
  options: RequestOptions = {}
): Promise<BytesResult> {
  // For binary content (PDFs), use standard HTTP fetch
  // CRA PDFs are typically accessible via standard HTTP
  const response = await fetchWithRetry(url, options, fetch);

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(
      `HTTP ${response.status} ${response.statusText}: ${errorText.substring(0, 200)}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  logger.crawl('Binary content retrieved', {
    url,
    status: response.status,
    bytesLength: bytes.length,
    contentType: response.headers.get('content-type') || undefined,
  });

  return {
    status: response.status,
    statusText: response.statusText,
    headers,
    contentType: response.headers.get('content-type') || undefined,
    bytes,
  };
}

