import robotsParser from 'robots-parser';
import type { CrawlerConfig } from '../../shared/dist/index.js';
import { logger } from '../../shared/dist/utils/index.js';

export class RobotsChecker {
  private cache = new Map<string, ReturnType<typeof robotsParser>>();
  private config: CrawlerConfig;
  private fetchTimeouts = new Map<string, NodeJS.Timeout>();

  constructor(config: CrawlerConfig) {
    this.config = config;
  }

  async isAllowed(url: string): Promise<boolean> {
    try {
      const urlObj = new URL(url);
      const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;
      
      let robots = this.cache.get(robotsUrl);
      
      if (!robots) {
        logger.crawl('Fetching robots.txt', { robotsUrl, domain: urlObj.host });
        
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            controller.abort();
            logger.crawlWarn('robots.txt fetch timeout', { robotsUrl, timeout: this.config.timeout });
          }, this.config.timeout);

          const response = await fetch(robotsUrl, {
            headers: {
              'User-Agent': this.config.userAgent,
            },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
          
          if (response.ok) {
            const text = await response.text();
            const parsed = robotsParser(robotsUrl, text);
            this.cache.set(robotsUrl, parsed);
            robots = parsed;
            logger.crawl('robots.txt fetched and parsed', { robotsUrl, rulesCount: text.split('\n').length });
          } else {
            // If robots.txt doesn't exist or can't be fetched, fall back to allowlist-only
            logger.crawlWarn('robots.txt not available, falling back to allowlist-only', {
              robotsUrl,
              status: response.status,
            });
            return true; // Fail open - rely on allowlist
          }
        } catch (error) {
          // On error, fall back to allowlist-only (fail open)
          logger.crawlWarn('robots.txt fetch failed, falling back to allowlist-only', {
            robotsUrl,
            error: error instanceof Error ? error.message : String(error),
          });
          return true; // Fail open - rely on allowlist
        }
      }
      
      if (!robots) {
        return true; // No robots.txt, allow by default
      }

      const isAllowed = robots.isAllowed(url, this.config.userAgent) ?? true;
      
      if (!isAllowed) {
        logger.crawl('URL disallowed by robots.txt', { url, userAgent: this.config.userAgent });
      }
      
      return isAllowed;
    } catch (error) {
      // On error, allow by default (fail open) but log it
      logger.crawlWarn('Robots check error, allowing by default', {
        url,
        error: error instanceof Error ? error.message : String(error),
      });
      return true; // Fail open - rely on allowlist
    }
  }
}

