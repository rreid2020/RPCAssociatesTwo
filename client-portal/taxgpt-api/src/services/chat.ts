import OpenAI from 'openai';
import { getDb, chatSessions, chatMessages } from '@shared/types';
import { eq } from 'drizzle-orm';
import { RetrievalService } from '@rag/core';
import { redactPII, sanitizeInput, detectHighRiskTopics, getOpenAIConfig, type Citation, type RiskLevel, logger } from '@shared/types';

interface ChatRequest {
  userId: string;
  sessionId?: string;
  message: string;
  contextDocIds?: string[];
  sourceOnly?: boolean;
}

interface ChatResponse {
  response: string;
  citations: Citation[];
  sources: Array<{ id: string; title: string; url: string }>;
  riskLevel: RiskLevel;
  sessionId: string;
}

export class ChatService {
  private openai: OpenAI;
  private retrievalService = new RetrievalService();
  private model: string;

  constructor() {
    const config = getOpenAIConfig();
    this.openai = new OpenAI({ apiKey: config.apiKey });
    this.model = config.model;
  }

  async handleMessage(request: ChatRequest): Promise<ChatResponse> {
    const db = getDb();

    // Redact PII from user message
    const { text: sanitizedMessage } = redactPII(request.message);
    const cleanedMessage = sanitizeInput(sanitizedMessage);

    // Get or create session
    let sessionId = request.sessionId;
    if (!sessionId) {
      const [session] = await db
        .insert(chatSessions)
        .values({
          userId: request.userId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)
        .returning();
      sessionId = session.id;
    } else {
      await db
        .update(chatSessions)
        .set({ updatedAt: new Date() })
        .where(eq(chatSessions.id, sessionId));
    }

    // Store user message
    await db.insert(chatMessages).values({
      sessionId: sessionId!,
      role: 'user',
      content: cleanedMessage,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // Retrieve relevant chunks
    let retrievedChunks = [];
    try {
      logger.info('Starting retrieval', { message: cleanedMessage.substring(0, 100) });
      retrievedChunks = await this.retrievalService.retrieve(cleanedMessage, {
        topK: 5,
        // jurisdictionTags: ['CA-FED'], // Removed: was too restrictive, preventing results
        contextDocIds: request.contextDocIds,
      });
      logger.info('Retrieval successful', { chunkCount: retrievedChunks.length });
    } catch (retrievalError) {
      const errorMsg = retrievalError instanceof Error ? retrievalError.message : String(retrievalError);
      const errorStack = retrievalError instanceof Error ? retrievalError.stack : undefined;
      logger.error('Retrieval failed', { 
        error: errorMsg,
        stack: errorStack,
        message: cleanedMessage.substring(0, 100),
        fullError: JSON.stringify(retrievalError, Object.getOwnPropertyNames(retrievalError))
      });
      console.error('Retrieval error details:', retrievalError);
      throw new Error(`Failed to retrieve relevant information: ${errorMsg}`);
    }

    // Detect high-risk topics
    const isHighRisk = detectHighRiskTopics(cleanedMessage);
    const riskLevel: RiskLevel = isHighRisk ? 'high' : 'low';

    // Build prompt with citations
    const systemPrompt = this.buildSystemPrompt(request.sourceOnly);
    const userPrompt = this.buildUserPrompt(cleanedMessage, retrievedChunks);

    // Call OpenAI
    const completion = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';

    // Extract citations from response (numbered references)
    const citations = this.extractCitations(response, retrievedChunks);

    // Store assistant message
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.insert(chatMessages).values({
      sessionId: sessionId!,
      role: 'assistant',
      content: response,
      citations: citations.length > 0 ? citations.map(c => ({
        id: c.id,
        chunkId: c.chunkId,
        sourceTitle: c.sourceTitle,
        sourceUrl: c.sourceUrl,
        sectionHeading: c.sectionHeading,
        pageNumber: c.pageNumber,
        retrievedAt: c.retrievedAt,
        similarityScore: c.similarityScore,
      })) as Array<Record<string, unknown>> : undefined,
      riskLevel,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // Get unique sources
    const sourcesMap = new Map<string, { id: string; title: string; url: string }>();
    for (const chunk of retrievedChunks) {
      if (chunk.citation.sourceUrl) {
        sourcesMap.set(chunk.citation.sourceUrl, {
          id: chunk.citation.chunkId,
          title: chunk.citation.sourceTitle,
          url: chunk.citation.sourceUrl,
        });
      }
    }

    return {
      response,
      citations,
      sources: Array.from(sourcesMap.values()),
      riskLevel,
      sessionId: sessionId!,
    };
  }

  private buildSystemPrompt(sourceOnly?: boolean): string {
    return `You are a helpful Canadian tax assistant. You provide information based on official CRA (Canada Revenue Agency) sources.

CRITICAL RULES:
1. Always cite your sources using numbered references [1], [2], etc.
2. Never fabricate citations - if you don't have sufficient information, say so clearly
3. Base your answers ONLY on the provided source material
4. If asked about topics not in the sources, politely decline and suggest consulting a tax professional
5. Include a disclaimer that this is informational only, not legal or tax advice
${sourceOnly ? '6. SOURCE-ONLY MODE: Only use information from the provided sources. Do not use general knowledge.' : ''}

Citation format: [1] Source Title - Section Heading (Page X if available)`;

  }

  private buildUserPrompt(message: string, chunks: Array<{ content: string; citation: Citation }>): string {
    const sourcesText = chunks
      .map(
        (chunk, idx) =>
          `[${idx + 1}] ${chunk.citation.sourceTitle}${chunk.citation.sectionHeading ? ` - ${chunk.citation.sectionHeading}` : ''}${chunk.citation.pageNumber ? ` (Page ${chunk.citation.pageNumber})` : ''}\n${chunk.content}`
      )
      .join('\n\n');

    return `User Question: ${message}

Relevant Sources:
${sourcesText}

Please answer the user's question based on the sources above. Include numbered citations [1], [2], etc. for each claim.`;
  }

  private extractCitations(
    response: string,
    chunks: Array<{ citation: Citation }>
  ): Citation[] {
    const citationPattern = /\[(\d+)\]/g;
    const matches = Array.from(response.matchAll(citationPattern));
    const citationIndices = new Set(matches.map((m) => parseInt(m[1], 10) - 1));

    return Array.from(citationIndices)
      .filter((idx) => idx >= 0 && idx < chunks.length)
      .map((idx) => chunks[idx].citation);
  }
}

