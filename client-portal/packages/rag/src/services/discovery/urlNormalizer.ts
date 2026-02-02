import { normalizeUrl, canonicalizeCraUrl, isCraDomain as checkCraDomain } from '@crawler/core';
import { logger } from '@shared/types';

/**
 * Centralized URL normalization for discovery service
 * Handles both standard URLs and CRA-specific URLs
 */
export class UrlNormalizer {
  /**
   * Normalize a URL for deduplication and storage
   * Uses CRA-specific canonicalization for CRA domains
   */
  static normalize(url: string, baseUrl?: string): string {
    try {
      if (checkCraDomain(url)) {
        const normalized = canonicalizeCraUrl(url);
        logger.crawl('Normalized CRA URL', { original: url, normalized });
        return normalized;
      }
      
      return normalizeUrl(url, baseUrl);
    } catch (error) {
      logger.crawlError('URL normalization failed', {
        url,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Check if a URL is a CRA domain
   */
  static isCraDomain(url: string): boolean {
    return checkCraDomain(url);
  }

  /**
   * Deduplicate URLs by normalizing them and comparing
   * Returns a map of normalized URL -> original URL
   */
  static deduplicateUrls(urls: string[], baseUrl?: string): Map<string, string> {
    const normalizedMap = new Map<string, string>();
    
    for (const url of urls) {
      try {
        const normalized = this.normalize(url, baseUrl);
        
        // If we already have this normalized URL, skip it
        if (!normalizedMap.has(normalized)) {
          normalizedMap.set(normalized, url);
        } else {
          logger.crawl('Skipping duplicate URL after normalization', {
            original: url,
            normalized,
            existing: normalizedMap.get(normalized),
          });
        }
      } catch (error) {
        logger.crawlError('Failed to normalize URL during deduplication', {
          url,
          error: error instanceof Error ? error.message : String(error),
        });
        // Skip invalid URLs
      }
    }
    
    return normalizedMap;
  }
}

