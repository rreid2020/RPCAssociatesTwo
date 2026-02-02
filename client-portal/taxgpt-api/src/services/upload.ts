import { randomUUID } from 'crypto';
import pdfParse from 'pdf-parse';
import { getDb, documents, chunks, embeddings, calculateContentHash } from '@shared/types';
import { createStorageProvider } from '@storage/core';
import { SectionAwareChunker, EmbeddingService } from '@rag/core';

export class UploadService {
  private storage = createStorageProvider();
  private chunker = new SectionAwareChunker();
  private embeddingService = new EmbeddingService();

  async uploadPdf(userId: string, buffer: Buffer, fileName: string): Promise<string> {
    const db = getDb();

    // Parse PDF
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text;
    const contentHash = calculateContentHash(text);

    // Store file
    const fileKey = `user-docs/${userId}/${randomUUID()}.pdf`;
    await this.storage.upload(fileKey, buffer, 'application/pdf');

    // Create document
    const [document] = await db
      .insert(documents)
      .values({
        userId,
        contentHash,
        metadata: {
          fileName,
          type: 'pdf',
          pageCount: pdfData.numpages,
          fileSize: buffer.length,
        } as Record<string, unknown>,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
      .returning();

    // Chunk content
    const chunked = this.chunker.chunk(text, {
      documentId: document.id,
      fileName,
    });

    // Store chunks
    const chunkRecords = await db
      .insert(chunks)
      .values(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        chunked.map((chunk) => ({
          documentId: document.id,
          content: chunk.content,
          sectionHeading: chunk.sectionHeading,
          pageNumber: chunk.pageNumber,
          chunkIndex: chunk.chunkIndex,
          metadata: chunk.metadata,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        })) as any
      )
      .returning();

    // Generate embeddings
    const texts = chunked.map((c) => c.content);
    const embeddingVectors = await this.embeddingService.embedBatch(texts);

    // Store embeddings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.insert(embeddings).values(
      chunkRecords.map((chunk, idx) => ({
        chunkId: chunk.id,
        embedding: embeddingVectors[idx],
        model: this.embeddingService.getModel(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      })) as any
    );

    return document.id;
  }
}

