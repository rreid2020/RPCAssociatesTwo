import * as cheerio from 'cheerio';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';
import { logger } from '@shared/types';

export class CraFolioExtractor {
  private turndownService = new TurndownService();

  extract(html: string, url: string): { text: string; title: string; metadata: Record<string, unknown> } {
    const $ = cheerio.load(html);
    const metadata: Record<string, unknown> = {};
    
    // Extract folio-specific metadata
    const folioCode = this.extractFolioCode($, url);
    const effectiveDate = this.extractEffectiveDate($);
    const revisedDate = this.extractRevisedDate($);
    
    if (folioCode) metadata.folioCode = folioCode;
    if (effectiveDate) metadata.effectiveDate = effectiveDate;
    if (revisedDate) metadata.revisedDate = revisedDate;
    
    // Try to find main content area (Canada.ca specific selectors)
    const mainContent = $('main article, [role="main"] article, article, main [class*="content"]').first();
    
    if (mainContent.length > 0) {
      // Remove navigation, headers, footers
      mainContent.find('nav, header, footer, aside, [class*="breadcrumb"], [class*="menu"]').remove();
      
      const markdown = this.turndownService.turndown(mainContent.html() || '');
      const title = $('h1').first().text().trim() || $('title').text().trim();
      
      logger.extract('Extracted folio content', {
        url,
        textLength: markdown.length,
        title,
        folioCode,
      });
      
      return { text: markdown, title, metadata };
    }
    
    // Fallback to Readability
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    
    if (article) {
      const $article = cheerio.load(article.content);
      const markdown = this.turndownService.turndown($article.html() || '');
      return { text: markdown, title: article.title || '', metadata };
    }
    
    // Final fallback
    $('script, style, nav, header, footer, aside').remove();
    const markdown = this.turndownService.turndown($('body').html() || '');
    return { text: markdown, title: $('title').text().trim() || '', metadata };
  }

  private extractFolioCode($: cheerio.CheerioAPI, url: string): string | null {
    const h1Text = $('h1').first().text();
    const h1Match = h1Text.match(/(S\d+-F\d+-C\d+)/i);
    if (h1Match) return h1Match[1];

    const urlMatch = String(url || '').match(/folio-(s\d+-f\d+-c\d+)/i);
    return urlMatch ? urlMatch[1].toUpperCase().replace(/s(\d+)-f(\d+)-c(\d+)/i, 'S$1-F$2-C$3') : null;
  }

  private extractEffectiveDate($: cheerio.CheerioAPI): string | null {
    // Look for "Effective date:" or similar patterns
    const text = $('body').text();
    const match = text.match(/Effective\s+date[:\s]+(\d{4}-\d{2}-\d{2}|\w+\s+\d{1,2},?\s+\d{4})/i);
    return match ? match[1] : null;
  }

  private extractRevisedDate($: cheerio.CheerioAPI): string | null {
    const text = $('body').text();
    const match = text.match(/Revised[:\s]+(\d{4}-\d{2}-\d{2}|\w+\s+\d{1,2},?\s+\d{4})/i);
    return match ? match[1] : null;
  }
}
