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
  reasoning?: string[];
  actions?: Array<{ type: string; description: string }>;
}

interface ToolResult {
  tool: string;
  result: string;
  citations?: Citation[];
}

export class AgenticChatService {
  private openai: OpenAI;
  private retrievalService = new RetrievalService();
  private model: string;
  private maxIterations = 5;

  constructor() {
    const config = getOpenAIConfig();
    this.openai = new OpenAI({ apiKey: config.apiKey });
    // Use a model that supports function calling (gpt-4 or gpt-3.5-turbo with function calling)
    this.model = config.model.includes('gpt-4') ? config.model : 'gpt-4-turbo-preview';
  }

  // Define available tools/functions for the agent
  private getTools() {
    return [
      {
        type: 'function' as const,
        function: {
          name: 'search_tax_information',
          description: 'Search for specific tax information, regulations, or guidance from CRA sources. Use this when you need to find more detailed information about a topic.',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'The search query to find relevant tax information',
              },
              topK: {
                type: 'number',
                description: 'Number of results to retrieve (default: 5, max: 10)',
                default: 5,
              },
            },
            required: ['query'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'calculate_tax_amount',
          description: 'Calculate tax amounts, credits, or deductions based on provided information. Use this when the user asks for calculations.',
          parameters: {
            type: 'object',
            properties: {
              calculation_type: {
                type: 'string',
                enum: ['credit', 'deduction', 'tax_owed', 'refund', 'other'],
                description: 'Type of calculation needed',
              },
              description: {
                type: 'string',
                description: 'Description of what needs to be calculated',
              },
              parameters: {
                type: 'object',
                description: 'Key-value pairs of parameters needed for the calculation (e.g., income, expenses, etc.)',
              },
            },
            required: ['calculation_type', 'description'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'ask_clarifying_question',
          description: 'Ask the user a clarifying question when you need more information to provide an accurate answer. Use this when the question is ambiguous or missing required details.',
          parameters: {
            type: 'object',
            properties: {
              question: {
                type: 'string',
                description: 'The clarifying question to ask the user',
              },
              reason: {
                type: 'string',
                description: 'Why this information is needed',
              },
            },
            required: ['question', 'reason'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'break_down_complex_question',
          description: 'Break down a complex question into smaller sub-questions that need to be answered first. Use this for multi-part questions.',
          parameters: {
            type: 'object',
            properties: {
              sub_questions: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of sub-questions to answer',
              },
              approach: {
                type: 'string',
                description: 'Explanation of how you will approach answering the complex question',
              },
            },
            required: ['sub_questions', 'approach'],
          },
        },
      },
    ];
  }

  async handleMessage(request: ChatRequest): Promise<ChatResponse> {
    const db = getDb();
    const { text: sanitizedMessage } = redactPII(request.message);
    const cleanedMessage = sanitizeInput(sanitizedMessage);

    // Get or create session
    let sessionId = request.sessionId;
    if (!sessionId) {
      const [session] = await db
        .insert(chatSessions)
        .values({
          userId: request.userId,
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
    } as any);

    // Get conversation history for context
    const conversationHistory = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId!))
      .orderBy(chatMessages.createdAt);

    const messages = conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    // Agentic reasoning loop
    const reasoning: string[] = [];
    const actions: Array<{ type: string; description: string }> = [];
    let allCitations: Citation[] = [];
    let allChunks: Array<{ content: string; citation: Citation }> = [];
    let finalResponse = '';
    let iteration = 0;

    // Initial retrieval
    let retrievedChunks = await this.retrievalService.retrieve(cleanedMessage, {
      topK: 5,
      contextDocIds: request.contextDocIds,
    });
    allChunks.push(...retrievedChunks.map(c => ({ content: c.content, citation: c.citation })));

    const systemPrompt = this.buildSystemPrompt(request.sourceOnly);

    const messagesForLLM: Array<{ role: 'system' | 'user' | 'assistant' | 'tool'; content?: string; tool_call_id?: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history (last 10 messages)
    for (const msg of messages.slice(-10)) {
      messagesForLLM.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      });
    }

    while (iteration < this.maxIterations) {
      // Add user prompt for first iteration
      if (iteration === 0) {
        messagesForLLM.push({
          role: 'user',
          content: this.buildUserPrompt(cleanedMessage, retrievedChunks),
        });
      }

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: messagesForLLM,
        tools: this.getTools(),
        tool_choice: iteration === 0 ? 'auto' : 'none', // Allow tool use on first iteration
        temperature: 0.7,
      });

      const message = completion.choices[0]?.message;
      if (!message) {
        throw new Error('No response from OpenAI');
      }

      // Handle tool calls
      if (message.tool_calls && message.tool_calls.length > 0) {
        reasoning.push(`Iteration ${iteration + 1}: Agent decided to use ${message.tool_calls.length} tool(s)`);

        for (const toolCall of message.tool_calls) {
          const toolName = toolCall.function.name;
          const args = JSON.parse(toolCall.function.arguments);

          actions.push({
            type: toolName,
            description: `Called ${toolName} with: ${JSON.stringify(args)}`,
          });

          const result = await this.executeTool(toolName, args, request);
          toolResults.push(result);

          if (result.citations) {
            allCitations.push(...result.citations);
          }

          // Add tool result to messages
          messagesForLLM.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: result.result,
          } as any);
        }

        // Add assistant message with tool calls to conversation
        messagesForLLM.push(message as any);

        iteration++;
        continue; // Continue loop to process tool results
      }

      // No more tool calls, generate final response
      finalResponse = message.content || 'I apologize, but I could not generate a response.';
      break;
    }

    // Extract citations from final response
    const citations = this.extractCitations(finalResponse, allChunks);
    const uniqueCitations = Array.from(
      new Map(citations.map(c => [c.chunkId, c])).values()
    );

    // Detect high-risk topics
    const isHighRisk = detectHighRiskTopics(cleanedMessage);
    const riskLevel: RiskLevel = isHighRisk ? 'high' : 'low';

    // Store assistant message
    await db.insert(chatMessages).values({
      sessionId: sessionId!,
      role: 'assistant',
      content: finalResponse,
      citations: uniqueCitations.length > 0 ? uniqueCitations.map(c => ({
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
    } as any);

    // Get unique sources
    const sourcesMap = new Map<string, { id: string; title: string; url: string }>();
    for (const chunk of allChunks) {
      if (chunk.citation.sourceUrl) {
        sourcesMap.set(chunk.citation.sourceUrl, {
          id: chunk.citation.chunkId,
          title: chunk.citation.sourceTitle,
          url: chunk.citation.sourceUrl,
        });
      }
    }

    return {
      response: finalResponse,
      citations: uniqueCitations,
      sources: Array.from(sourcesMap.values()),
      riskLevel,
      sessionId: sessionId!,
      reasoning: reasoning.length > 0 ? reasoning : undefined,
      actions: actions.length > 0 ? actions : undefined,
    };
  }

  private async executeTool(
    toolName: string,
    args: Record<string, unknown>,
    request: ChatRequest
  ): Promise<ToolResult> {
    switch (toolName) {
      case 'search_tax_information': {
        const query = args.query as string;
        const topK = Math.min((args.topK as number) || 5, 10);
        
        logger.info('Agent tool: search_tax_information', { query, topK });
        
        const chunks = await this.retrievalService.retrieve(query, {
          topK,
          contextDocIds: request.contextDocIds,
        });

        const result = chunks
          .map(
            (chunk, idx) =>
              `[${idx + 1}] ${chunk.citation.sourceTitle}${chunk.citation.sectionHeading ? ` - ${chunk.citation.sectionHeading}` : ''}\n${chunk.content}`
          )
          .join('\n\n');

        return {
          tool: toolName,
          result: `Found ${chunks.length} relevant sources:\n\n${result}`,
          citations: chunks.map(c => c.citation),
        };
      }

      case 'calculate_tax_amount': {
        const calcType = args.calculation_type as string;
        const description = args.description as string;
        const params = args.parameters as Record<string, unknown> || {};

        logger.info('Agent tool: calculate_tax_amount', { calcType, description, params });

        // For now, return a structured response that the LLM can use
        // In a full implementation, you'd have actual calculation logic
        return {
          tool: toolName,
          result: `Calculation requested: ${description}\nType: ${calcType}\nParameters: ${JSON.stringify(params)}\n\nNote: I can help explain the calculation method based on CRA guidelines, but you should verify with a tax professional.`,
        };
      }

      case 'ask_clarifying_question': {
        const question = args.question as string;
        const reason = args.reason as string;

        logger.info('Agent tool: ask_clarifying_question', { question, reason });

        return {
          tool: toolName,
          result: `I need to ask: ${question}\nReason: ${reason}\n\nPlease provide this information so I can give you an accurate answer.`,
        };
      }

      case 'break_down_complex_question': {
        const subQuestions = args.sub_questions as string[];
        const approach = args.approach as string;

        logger.info('Agent tool: break_down_complex_question', { subQuestions, approach });

        return {
          tool: toolName,
          result: `Breaking down the question:\nApproach: ${approach}\n\nSub-questions to address:\n${subQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\nI will now address each of these systematically.`,
        };
      }

      default:
        return {
          tool: toolName,
          result: `Unknown tool: ${toolName}`,
        };
    }
  }

  private buildSystemPrompt(sourceOnly?: boolean): string {
    return `You are an intelligent, agentic Canadian tax assistant. You can reason through complex questions, use tools to gather information, and provide comprehensive answers.

CAPABILITIES:
- You can search for additional tax information when needed
- You can break down complex questions into smaller parts
- You can ask clarifying questions when information is missing
- You can perform multi-step reasoning to answer questions thoroughly

CRITICAL RULES:
1. Always cite your sources using numbered references [1], [2], etc.
2. Never fabricate citations - if you don't have sufficient information, use the search_tax_information tool
3. Base your answers ONLY on the provided source material or information you retrieve
4. If asked about topics not in the sources, use search_tax_information to try to find relevant information
5. For complex questions, use break_down_complex_question to structure your approach
6. If information is ambiguous, use ask_clarifying_question
7. Include a disclaimer that this is informational only, not legal or tax advice
${sourceOnly ? '8. SOURCE-ONLY MODE: Only use information from the provided sources. Do not use general knowledge.' : ''}

THINKING PROCESS:
- Analyze the question carefully
- Determine if you need more information (use search_tax_information)
- Break down complex questions into steps
- Provide comprehensive, well-cited answers

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

Initial Relevant Sources:
${sourcesText}

Please analyze this question and determine if you need to:
1. Search for more information (use search_tax_information)
2. Break it down into parts (use break_down_complex_question)
3. Ask for clarification (use ask_clarifying_question)
4. Answer directly if you have sufficient information

Provide a comprehensive, well-cited answer.`;
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
