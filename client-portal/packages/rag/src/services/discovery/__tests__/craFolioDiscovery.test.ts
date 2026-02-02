/**
 * Unit tests for CraFolioDiscoveryService
 * 
 * These tests use HTML fixtures to test discovery without making live requests.
 */

import { CraFolioDiscoveryService } from '../craFolioDiscovery';

describe('CraFolioDiscoveryService', () => {
  let discoveryService: CraFolioDiscoveryService;

  beforeEach(() => {
    discoveryService = new CraFolioDiscoveryService();
  });

  describe('classifyPageKind', () => {
    it('should classify directory page with many links', () => {
      const html = `
        <html>
          <body>
            <h1>Income Tax Folios</h1>
            <ul>
              ${Array(20).fill('<li><a href="/folio1">Link</a></li>').join('')}
            </ul>
          </body>
        </html>
      `;

      const kind = discoveryService.classifyPageKind(html, 'https://example.com');
      expect(kind).toBe('directory');
    });

    it('should classify content page with article body and sections', () => {
      const html = `
        <html>
          <body>
            <main>
              <article>
                <h1>Folio Content</h1>
                <h2>1.10 Introduction</h2>
                <p>Content here</p>
                <h2>1.11 Definitions</h2>
                <p>More content</p>
              </article>
            </main>
          </body>
        </html>
      `;

      const kind = discoveryService.classifyPageKind(html, 'https://example.com');
      expect(kind).toBe('content');
    });

    it('should return unknown for ambiguous pages', () => {
      const html = '<html><body><p>Some content</p></body></html>';
      const kind = discoveryService.classifyPageKind(html, 'https://example.com');
      expect(kind).toBe('unknown');
    });
  });

  describe('discoverFolioLinks', () => {
    it('should discover folio links from directory page', () => {
      const html = `
        <html>
          <body>
            <a href="/en/revenue-agency/services/tax/individuals/topics/about-canada-tax/income-tax-folios/s1-f1-c1.html">
              Folio S1-F1-C1
            </a>
            <a href="/en/revenue-agency/services/tax/individuals/topics/about-canada-tax/income-tax-folios/s1-f2-c2.html">
              Folio S1-F2-C2
            </a>
            <a href="https://external.com">External Link</a>
          </body>
        </html>
      `;

      const links = discoveryService.discoverFolioLinks(
        html,
        'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-canada-tax/income-tax-folios.html'
      );

      expect(links.length).toBeGreaterThanOrEqual(2);
      expect(links[0].url).toContain('income-tax-folios');
      expect(links[0].title).toContain('Folio');
    });

    it('should filter out external links', () => {
      const html = `
        <html>
          <body>
            <a href="https://external.com/page">External</a>
            <a href="/en/revenue-agency/.../folio.html">Folio</a>
          </body>
        </html>
      `;

      const links = discoveryService.discoverFolioLinks(
        html,
        'https://www.canada.ca/en/revenue-agency/.../index.html'
      );

      expect(links.every(l => l.url.includes('canada.ca'))).toBe(true);
    });

    it('should normalize URLs', () => {
      const html = `
        <html>
          <body>
            <a href="/folio.html?utm_source=test">Folio</a>
          </body>
        </html>
      `;

      const links = discoveryService.discoverFolioLinks(
        html,
        'https://www.canada.ca/base/'
      );

      expect(links[0].url).not.toContain('utm_source');
    });
  });
});
