import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ChatService } from '../services/chat';
import { AgenticChatService } from '../services/agentic-chat';
import { requireAuth } from '../middleware/auth';

const chatRequestSchema = z.object({
  sessionId: z.string().uuid().nullable().optional(), // Allow null, undefined, or valid UUID
  message: z.string().min(1).max(10000),
  contextDocIds: z.array(z.string().uuid()).nullable().optional(), // Allow null or undefined
  sourceOnly: z.boolean().nullable().optional(), // Allow null or undefined
  agentic: z.boolean().nullable().optional(), // Enable agentic behavior
});

export async function chatRoutes(fastify: FastifyInstance) {
  const chatService = new ChatService();
  // Lazy load agentic service only when needed to avoid initialization errors
  let agenticChatService: AgenticChatService | null = null;
  
  const getAgenticService = () => {
    if (!agenticChatService) {
      try {
        agenticChatService = new AgenticChatService();
      } catch (error) {
        fastify.log.warn('Failed to initialize agentic service, falling back to standard:', error);
        return null;
      }
    }
    return agenticChatService;
  };
  
  // For development: always skip auth to allow testing
  // In production, Clerk authentication will be required
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const skipAuth = isDevelopment; // Always skip in development
  
  console.log('[chatRoutes] Development mode:', isDevelopment, 'Skipping auth:', skipAuth);

  // Register route without auth in development
  if (skipAuth) {
    fastify.post('/', async (request, reply) => {
      const userId = 'dev-user-' + Date.now();
      console.log('[chatRoutes] Handling request without auth, userId:', userId);

      const body = chatRequestSchema.parse(request.body);

      try {
        // Explicitly check for true - undefined/null/false should use standard service
        const useAgentic = body.agentic === true;
        let service = chatService; // Default to standard
        
        if (useAgentic) {
          const agenticService = getAgenticService();
          if (agenticService) {
            service = agenticService;
            console.log('[chatRoutes] Using agentic service');
          } else {
            console.log('[chatRoutes] Agentic service unavailable, falling back to standard');
          }
        } else {
          console.log('[chatRoutes] Using standard service (agentic flag:', body.agentic, ')');
        }
        
        const result = await service.handleMessage({
          userId,
          sessionId: body.sessionId,
          message: body.message,
          contextDocIds: body.contextDocIds,
          sourceOnly: body.sourceOnly,
        });

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        const errorName = error instanceof Error ? error.name : 'UnknownError';
        fastify.log.error('Chat error:', { error: errorMessage, name: errorName, stack: errorStack });
        console.error('=== CHAT ERROR DETAILS ===');
        console.error('Error:', error);
        console.error('Error name:', errorName);
        console.error('Error message:', errorMessage);
        console.error('Error stack:', errorStack);
        console.error('========================');
        return reply.code(500).send({ 
          error: 'Internal server error',
          message: errorMessage,
          // Only include stack in development
          ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
        });
      }
    });
  } else {
    // Register route with auth if Clerk is configured
    fastify.post('/', { preHandler: requireAuth }, async (request, reply) => {
      const userId = request.user?.id || 'dev-user';
      console.log('[chatRoutes] Handling request with auth, userId:', userId);

      const body = chatRequestSchema.parse(request.body);

      try {
        // Explicitly check for true - undefined/null/false should use standard service
        const useAgentic = body.agentic === true;
        let service = chatService; // Default to standard
        
        if (useAgentic) {
          const agenticService = getAgenticService();
          if (agenticService) {
            service = agenticService;
            console.log('[chatRoutes] Using agentic service');
          } else {
            console.log('[chatRoutes] Agentic service unavailable, falling back to standard');
          }
        } else {
          console.log('[chatRoutes] Using standard service (agentic flag:', body.agentic, ')');
        }
        
        const result = await service.handleMessage({
          userId,
          sessionId: body.sessionId,
          message: body.message,
          contextDocIds: body.contextDocIds,
          sourceOnly: body.sourceOnly,
        });

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        const errorName = error instanceof Error ? error.name : 'UnknownError';
        fastify.log.error('Chat error:', { error: errorMessage, name: errorName, stack: errorStack });
        console.error('=== CHAT ERROR DETAILS ===');
        console.error('Error:', error);
        console.error('Error name:', errorName);
        console.error('Error message:', errorMessage);
        console.error('Error stack:', errorStack);
        console.error('========================');
        return reply.code(500).send({ 
          error: 'Internal server error',
          message: errorMessage,
          // Only include stack in development
          ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
        });
      }
    });
  }
}

