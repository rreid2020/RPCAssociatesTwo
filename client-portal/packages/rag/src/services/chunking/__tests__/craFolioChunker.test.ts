/**
 * Unit tests for CraFolioChunker
 */

import { CraFolioChunker } from '../craFolioChunker';

describe('CraFolioChunker', () => {
  let chunker: CraFolioChunker;

  beforeEach(() => {
    chunker = new CraFolioChunker(1000, 200); // Small chunk size for testing
  });

  describe('chunk', () => {
    it('should chunk by section numbers', () => {
      const text = `
# 1.10 Introduction
This is the introduction section.

# 1.11 Definitions
This section defines terms.

# 2.5 Application
This section explains application.
      `;

      const chunks = chunker.chunk(text, {
        documentId: 'test-doc',
        url: 'https://example.com',
        title: 'Test Folio',
        folioCode: 'S1-F1-C1',
      });

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].sectionHeading).toContain('1.10');
      expect(chunks[0].metadata?.sectionNumber).toBe('1.10');
      expect(chunks[0].metadata?.folioCode).toBe('S1-F1-C1');
    });

    it('should fallback to heading-based chunking if no section numbers', () => {
      const text = `
# Introduction
This is the introduction.

# Definitions
This defines terms.
      `;

      const chunks = chunker.chunk(text, {
        documentId: 'test-doc',
        url: 'https://example.com',
        title: 'Test Folio',
      });

      expect(chunks.length).toBeGreaterThan(0);
      // Should still have metadata even if no section numbers
      expect(chunks[0].metadata).toBeDefined();
    });

    it('should preserve section numbers in metadata', () => {
      const text = `
# 1.10 First Section
Content here.

# 1.11 Second Section
More content.
      `;

      const chunks = chunker.chunk(text, {
        documentId: 'test-doc',
        url: 'https://example.com',
        title: 'Test',
        folioCode: 'S1-F1-C1',
      });

      const sectionChunks = chunks.filter(c => c.metadata?.sectionNumber);
      expect(sectionChunks.length).toBeGreaterThan(0);
      expect(sectionChunks[0].metadata?.sectionNumber).toMatch(/^\d+\.\d+/);
    });
  });
});
