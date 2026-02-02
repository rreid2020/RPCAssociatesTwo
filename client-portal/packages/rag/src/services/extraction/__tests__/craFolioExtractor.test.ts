/**
 * Unit tests for CraFolioExtractor
 * 
 * These tests use HTML fixtures to test extraction without making live requests.
 */

import { CraFolioExtractor } from '../craFolioExtractor';

describe('CraFolioExtractor', () => {
  let extractor: CraFolioExtractor;

  beforeEach(() => {
    extractor = new CraFolioExtractor();
  });

  describe('extractFolioCode', () => {
    it('should extract folio code from H1', () => {
      const html = '<h1>Income Tax Folio S1-F1-C1: Residency</h1>';
      const $ = require('cheerio').load(html);
      const code = (extractor as any).extractFolioCode($);
      expect(code).toBe('S1-F1-C1');
    });

    it('should return null if no folio code found', () => {
      const html = '<h1>Income Tax Folio: Residency</h1>';
      const $ = require('cheerio').load(html);
      const code = (extractor as any).extractFolioCode($);
      expect(code).toBeNull();
    });
  });

  describe('extractEffectiveDate', () => {
    it('should extract effective date in YYYY-MM-DD format', () => {
      const html = '<body>Effective date: 2024-01-01</body>';
      const $ = require('cheerio').load(html);
      const date = (extractor as any).extractEffectiveDate($);
      expect(date).toBe('2024-01-01');
    });

    it('should extract effective date in text format', () => {
      const html = '<body>Effective date: January 1, 2024</body>';
      const $ = require('cheerio').load(html);
      const date = (extractor as any).extractEffectiveDate($);
      expect(date).toBe('January 1, 2024');
    });

    it('should return null if no effective date found', () => {
      const html = '<body>Some content</body>';
      const $ = require('cheerio').load(html);
      const date = (extractor as any).extractEffectiveDate($);
      expect(date).toBeNull();
    });
  });

  describe('extract', () => {
    it('should extract content from main article', () => {
      const html = `
        <html>
          <head><title>Test Folio</title></head>
          <body>
            <main>
              <article>
                <h1>Income Tax Folio S1-F1-C1: Residency</h1>
                <p>This is the main content.</p>
              </article>
            </main>
          </body>
        </html>
      `;
      
      const result = extractor.extract(html, 'https://example.com');
      expect(result.text).toContain('This is the main content');
      expect(result.title).toBe('Test Folio');
      expect(result.metadata.folioCode).toBe('S1-F1-C1');
    });

    it('should remove navigation elements', () => {
      const html = `
        <html>
          <body>
            <nav>Navigation</nav>
            <main>
              <article>
                <h1>Title</h1>
                <p>Content</p>
              </article>
            </main>
            <footer>Footer</footer>
          </body>
        </html>
      `;
      
      const result = extractor.extract(html, 'https://example.com');
      expect(result.text).not.toContain('Navigation');
      expect(result.text).not.toContain('Footer');
      expect(result.text).toContain('Content');
    });

    it('should fallback to Readability if no main article found', () => {
      const html = `
        <html>
          <head><title>Test</title></head>
          <body>
            <div>
              <h1>Title</h1>
              <p>Some content here</p>
            </div>
          </body>
        </html>
      `;
      
      const result = extractor.extract(html, 'https://example.com');
      expect(result.text.length).toBeGreaterThan(0);
      expect(result.title).toBeTruthy();
    });
  });
});
