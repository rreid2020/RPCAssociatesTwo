import OpenAI from 'openai';
import { getOpenAIConfig } from '@shared/types/config';
import { logger } from '@shared/types';

export class EmbeddingService {
  private client: OpenAI;
  private model: string;

  constructor() {
    const config = getOpenAIConfig();
    
    // Validate API key
    if (!config.apiKey) {
      logger.embedError('OPENAI_API_KEY is required but not set');
      throw new Error('OPENAI_API_KEY is required');
    }

    // Validate model
    if (!config.embedModel) {
      logger.embedError('OPENAI_EMBED_MODEL is required but not set');
      throw new Error('OPENAI_EMBED_MODEL is required');
    }

    logger.embed('Initializing EmbeddingService', {
      model: config.embedModel,
      hasApiKey: !!config.apiKey,
    });

    this.client = new OpenAI({ apiKey: config.apiKey });
    this.model = config.embedModel;
  }

  getModel(): string {
    return this.model;
  }

  async embed(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: this.model,
      input: text,
    });

    return response.data[0].embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      logger.embedWarn('Empty text array provided to embedBatch');
      return [];
    }

    logger.embed('Starting batch embedding', {
      totalTexts: texts.length,
      model: this.model,
    });

    // OpenAI allows up to 2048 inputs per batch, but we'll batch in smaller chunks
    const batchSize = 100;
    const batches: string[][] = [];
    
    for (let i = 0; i < texts.length; i += batchSize) {
      batches.push(texts.slice(i, i + batchSize));
    }

    logger.embed('Split into batches', {
      totalBatches: batches.length,
      batchSize,
      totalTexts: texts.length,
    });

    const allEmbeddings: number[][] = [];

    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
      const batch = batches[batchIdx];
      
      try {
        logger.embed('Processing batch', {
          batchIndex: batchIdx + 1,
          totalBatches: batches.length,
          batchSize: batch.length,
        });

        const response = await this.client.embeddings.create({
          model: this.model,
          input: batch,
        });

        const batchEmbeddings = response.data.map((item) => item.embedding);
        allEmbeddings.push(...batchEmbeddings);

        logger.embed('Batch completed', {
          batchIndex: batchIdx + 1,
          embeddingsGenerated: batchEmbeddings.length,
          dimensions: batchEmbeddings[0]?.length || 0,
        });
      } catch (error) {
        logger.embedError('Batch embedding failed', {
          batchIndex: batchIdx + 1,
          batchSize: batch.length,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error; // Don't partially commit
      }
    }

    logger.embed('Batch embedding completed', {
      totalEmbeddings: allEmbeddings.length,
      expectedCount: texts.length,
      dimensions: allEmbeddings[0]?.length || 0,
    });

    if (allEmbeddings.length !== texts.length) {
      throw new Error(
        `Embedding count mismatch: expected ${texts.length}, got ${allEmbeddings.length}`
      );
    }

    return allEmbeddings;
  }
}

