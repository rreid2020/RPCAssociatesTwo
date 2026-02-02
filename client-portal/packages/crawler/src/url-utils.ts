import { URL } from 'url';
import { logger } from '../../shared/dist/utils/index.js';

// Tracking query parameters to remove
const TRACKING_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'ref',
  'fbclid',
  'gclid',
  'msclkid',
  'twclid',
  'li_fat_id',
  'mc_cid',
  'mc_eid',
  '_ga',
  '_gid',
  'source',
  'campaign',
];

export function normalizeUrl(url: string, baseUrl?: string): string {
  try {
    // Ignore non-HTTP(S) links
    if (url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('javascript:')) {
      logger.crawl('Ignoring non-HTTP link', { url, type: url.split(':')[0] });
      throw new Error(`Invalid URL type: ${url.split(':')[0]}`);
    }

    const base = baseUrl ? new URL(baseUrl) : undefined;
    const normalized = new URL(url, base);
    
    // Remove fragment
    normalized.hash = '';
    
    // Remove tracking query parameters
    const removedParams: string[] = [];
    for (const param of TRACKING_PARAMS) {
      if (normalized.searchParams.has(param)) {
        normalized.searchParams.delete(param);
        removedParams.push(param);
      }
    }
    
    if (removedParams.length > 0) {
      logger.crawl('Removed tracking parameters', { url: normalized.toString(), params: removedParams });
    }
    
    // Normalize path (remove trailing slash except for root)
    if (normalized.pathname !== '/' && normalized.pathname.endsWith('/')) {
      normalized.pathname = normalized.pathname.slice(0, -1);
    }
    
    // Sort query parameters for consistency
    normalized.searchParams.sort();
    
    const normalizedStr = normalized.toString();
    logger.crawl('URL normalized', { original: url, normalized: normalizedStr });
    
    return normalizedStr;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid URL type')) {
      throw error;
    }
    logger.crawlError('URL normalization failed', { url, error: error instanceof Error ? error.message : String(error) });
    throw new Error(`Invalid URL: ${url}`);
  }
}

export function isAllowedUrl(url: string, allowlistPrefixes: string[]): boolean {
  return allowlistPrefixes.some((prefix) => url.startsWith(prefix));
}

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

export function isSameDomain(url1: string, url2: string): boolean {
  return extractDomain(url1) === extractDomain(url2);
}

/**
 * Check if a URL belongs to a CRA domain (canada.ca or www.canada.ca)
 */
export function isCraDomain(url: string): boolean {
  try {
    const domain = extractDomain(url).toLowerCase();
    return domain === 'canada.ca' || domain === 'www.canada.ca';
  } catch {
    return false;
  }
}

/**
 * Canonicalize CRA-specific URL patterns
 * - Ensures consistent trailing slash behavior for CRA URLs
 * - Handles CRA-specific query parameters
 * - Normalizes www vs non-www variants
 */
export function canonicalizeCraUrl(url: string): string {
  try {
    const normalized = new URL(url);
    
    // Normalize hostname: prefer www.canada.ca over canada.ca for consistency
    if (normalized.hostname === 'canada.ca') {
      normalized.hostname = 'www.canada.ca';
    }
    
    // For CRA URLs, preserve trailing slash on directory-like paths
    // but remove it from content pages (those with specific file-like patterns)
    const pathname = normalized.pathname;
    const isContentPage = pathname.match(/\/[^/]+\.(html|htm|pdf)$/i) || 
                         pathname.match(/\/[^/]+\/[^/]+$/); // Likely content page
    
    if (!isContentPage && pathname !== '/' && !pathname.endsWith('/')) {
      // Directory-like paths should have trailing slash
      normalized.pathname = pathname + '/';
    } else if (isContentPage && pathname.endsWith('/')) {
      // Content pages should not have trailing slash
      normalized.pathname = pathname.slice(0, -1);
    }
    
    // Remove fragment
    normalized.hash = '';
    
    // Remove tracking query parameters (already handled by normalizeUrl, but ensure consistency)
    const TRACKING_PARAMS = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'ref', 'fbclid', 'gclid', 'msclkid', 'twclid', 'li_fat_id',
      'mc_cid', 'mc_eid', '_ga', '_gid', 'source', 'campaign',
    ];
    
    for (const param of TRACKING_PARAMS) {
      normalized.searchParams.delete(param);
    }
    
    // Sort query parameters for consistency
    normalized.searchParams.sort();
    
    return normalized.toString();
  } catch (error) {
    logger.crawlError('CRA URL canonicalization failed', { 
      url, 
      error: error instanceof Error ? error.message : String(error) 
    });
    // Fallback to standard normalization
    return normalizeUrl(url);
  }
}

