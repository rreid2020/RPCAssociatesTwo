import { CHUNK_SIZE, CHUNK_OVERLAP, logger } from '@shared/types';
import type { ChunkMetadata } from '@shared/types';
import type { Chunk } from '../../chunking';
import { SectionAwareChunker } from '../../chunking';

export class CraFolioChunker {
  private chunkSize: number;
  private chunkOverlap: number;
  private fallbackChunker: SectionAwareChunker;

  constructor(chunkSize = CHUNK_SIZE, chunkOverlap = CHUNK_OVERLAP) {
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
    this.fallbackChunker = new SectionAwareChunker(chunkSize, chunkOverlap);
  }

  chunk(text: string, metadata: ChunkMetadata & { folioCode?: string }): Chunk[] {
    logger.chunk('Starting folio chunking', {
      textLength: text.length,
      folioCode: metadata.folioCode,
    });

    const chunks: Chunk[] = [];
    
    // Split by section numbers (e.g., "1.10", "1.11", "2.5")
    // Pattern matches: optional markdown heading, section number, and heading text
    const sectionPattern = /^(#{1,3}\s+)?(\d+\.\d+(?:\.\d+)?)\s+(.+)$/gm;
    const sections: Array<{ sectionNumber: string; heading: string; content: string; startIndex: number }> = [];
    
    let match: RegExpExecArray | null;
    const sectionMatches: Array<{ number: string; heading: string; index: number }> = [];
    
    while ((match = sectionPattern.exec(text)) !== null) {
      sectionMatches.push({
        number: match[2],
        heading: match[3]?.trim() || '',
        index: match.index,
      });
    }

    logger.chunk('Found folio sections', { sectionCount: sectionMatches.length });

    // Create sections
    if (sectionMatches.length === 0) {
      // Fallback to heading-based chunking
      logger.chunk('No section numbers found, falling back to heading-based chunking');
      return this.chunkByHeadings(text, metadata);
    }

    for (let i = 0; i < sectionMatches.length; i++) {
      const section = sectionMatches[i];
      const nextSection = sectionMatches[i + 1];
      const sectionStart = section.index;
      const sectionEnd = nextSection ? nextSection.index : text.length;
      const sectionContent = text.substring(sectionStart, sectionEnd);
      
      sections.push({
        sectionNumber: section.number,
        heading: section.heading,
        content: sectionContent,
        startIndex: sectionStart,
      });
    }

    // Chunk each section
    let globalChunkIndex = 0;
    for (const section of sections) {
      const sectionChunks = this.chunkText(section.content, {
        sectionHeading: `${section.sectionNumber} ${section.heading}`,
        sectionNumber: section.sectionNumber,
        folioCode: metadata.folioCode,
        ...metadata,
      }, globalChunkIndex);

      chunks.push(...sectionChunks);
      globalChunkIndex += sectionChunks.length;
    }

    logger.chunk('Folio chunking completed', {
      totalChunks: chunks.length,
      sections: sections.length,
    });

    return chunks;
  }

  private chunkByHeadings(text: string, metadata: ChunkMetadata & { folioCode?: string }): Chunk[] {
    // Fallback to standard heading-based chunking with folio metadata
    const chunks = this.fallbackChunker.chunk(text, metadata);
    
    // Add folio metadata to each chunk
    return chunks.map(chunk => ({
      ...chunk,
      metadata: {
        ...chunk.metadata,
        folioCode: metadata.folioCode,
      },
    }));
  }

  private chunkText(
    text: string,
    options: ChunkMetadata & { sectionHeading?: string; sectionNumber?: string; folioCode?: string },
    startIndex: number
  ): Chunk[] {
    const chunks: Chunk[] = [];
    const words = text.split(/\s+/);
    
    let currentChunk: string[] = [];
    let currentLength = 0;

    for (const word of words) {
      const wordLength = word.length + 1;

      if (currentLength + wordLength > this.chunkSize && currentChunk.length > 0) {
        chunks.push({
          content: currentChunk.join(' '),
          sectionHeading: options.sectionHeading,
          chunkIndex: startIndex + chunks.length,
          metadata: {
            ...options,
            sectionNumber: options.sectionNumber,
            folioCode: options.folioCode,
          },
        });

        const overlapWords = currentChunk.slice(-Math.floor(this.chunkOverlap / 10));
        currentChunk = [...overlapWords, word];
        currentLength = currentChunk.join(' ').length;
      } else {
        currentChunk.push(word);
        currentLength += wordLength;
      }
    }

    if (currentChunk.length > 0) {
      chunks.push({
        content: currentChunk.join(' '),
        sectionHeading: options.sectionHeading,
        chunkIndex: startIndex + chunks.length,
        metadata: {
          ...options,
          sectionNumber: options.sectionNumber,
          folioCode: options.folioCode,
        },
      });
    }

    return chunks;
  }
}
