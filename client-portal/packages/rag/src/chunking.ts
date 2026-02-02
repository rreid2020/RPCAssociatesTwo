import { CHUNK_SIZE, CHUNK_OVERLAP, type ChunkMetadata, logger } from '@shared/types';

export interface Chunk {
  content: string;
  sectionHeading?: string;
  pageNumber?: number;
  chunkIndex: number;
  metadata?: Record<string, unknown>;
}

export class SectionAwareChunker {
  private chunkSize: number;
  private chunkOverlap: number;

  constructor(chunkSize = CHUNK_SIZE, chunkOverlap = CHUNK_OVERLAP) {
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
  }

  chunk(text: string, metadata: ChunkMetadata): Chunk[] {
    logger.chunk('Starting chunking', {
      textLength: text.length,
      chunkSize: this.chunkSize,
      overlap: this.chunkOverlap,
    });

    const chunks: Chunk[] = [];
    
    // Split by headings first (H1, H2, H3)
    const headingPattern = /^(#{1,3})\s+(.+)$/gm;
    const sections: Array<{ heading?: string; content: string; startIndex: number }> = [];
    
    let match: RegExpExecArray | null;

    // Find all headings and their positions
    const headingMatches: Array<{ level: number; text: string; index: number }> = [];
    while ((match = headingPattern.exec(text)) !== null) {
      headingMatches.push({
        level: match[1].length,
        text: match[2].trim(),
        index: match.index,
      });
    }

    logger.chunk('Found headings', { headingCount: headingMatches.length });

    // Create sections based on headings
    if (headingMatches.length === 0) {
      // No headings, treat entire text as one section
      sections.push({ content: text, startIndex: 0 });
      logger.chunk('No headings found, treating as single section');
    } else {
      for (let i = 0; i < headingMatches.length; i++) {
        const heading = headingMatches[i];
        const nextHeading = headingMatches[i + 1];
        const sectionStart = heading.index;
        const sectionEnd = nextHeading ? nextHeading.index : text.length;
        const sectionContent = text.substring(sectionStart, sectionEnd);
        
        sections.push({
          heading: heading.text,
          content: sectionContent,
          startIndex: sectionStart,
        });
      }
      logger.chunk('Created sections from headings', { sectionCount: sections.length });
    }

    // Chunk each section
    let globalChunkIndex = 0;
    for (const section of sections) {
      const sectionChunks = this.chunkText(section.content, {
        sectionHeading: section.heading,
        metadata,
        startIndex: globalChunkIndex,
      });

      for (const chunk of sectionChunks) {
        chunks.push({
          ...chunk,
          chunkIndex: globalChunkIndex++,
        });
      }
    }

    logger.chunk('Chunking completed', {
      totalChunks: chunks.length,
      totalTextLength: text.length,
      averageChunkSize: chunks.length > 0 ? text.length / chunks.length : 0,
    });

    return chunks;
  }

  private chunkText(
    text: string,
    options: { sectionHeading?: string; metadata: ChunkMetadata; startIndex?: number }
  ): Omit<Chunk, 'chunkIndex'>[] {
    const chunks: Omit<Chunk, 'chunkIndex'>[] = [];
    const words = text.split(/\s+/);
    
    let currentChunk: string[] = [];
    let currentLength = 0;

    for (const word of words) {
      const wordLength = word.length + 1; // +1 for space

      if (currentLength + wordLength > this.chunkSize && currentChunk.length > 0) {
        // Save current chunk
        chunks.push({
          content: currentChunk.join(' '),
          sectionHeading: options.sectionHeading,
          metadata: { ...options.metadata } as Record<string, unknown>,
        });

        // Start new chunk with overlap
        const overlapWords = currentChunk.slice(-Math.floor(this.chunkOverlap / 10));
        currentChunk = [...overlapWords, word];
        currentLength = currentChunk.join(' ').length;
      } else {
        currentChunk.push(word);
        currentLength += wordLength;
      }
    }

    // Add remaining chunk
    if (currentChunk.length > 0) {
      chunks.push({
        content: currentChunk.join(' '),
        sectionHeading: options.sectionHeading,
        metadata: { ...options.metadata } as Record<string, unknown>,
      });
    }

    return chunks;
  }
}

