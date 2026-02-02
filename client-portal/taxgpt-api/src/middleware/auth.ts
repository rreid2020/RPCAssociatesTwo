import type { FastifyRequest, FastifyReply } from 'fastify';
import { getClerkConfig } from '@shared/types/config';

// Check if Clerk is configured
function isClerkConfigured(): boolean {
  try {
    const config = getClerkConfig();
    return !!(config.publishableKey && config.secretKey);
  } catch {
    return false;
  }
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  // If Clerk is not configured, allow requests (for development)
  const clerkConfigured = isClerkConfigured();
  
  if (!clerkConfigured) {
    // Set a mock user for development
    (request as any).user = { id: 'dev-user-' + Date.now() };
    console.log('[requireAuth] Clerk not configured, allowing dev access');
    return;
  }
  
  // If Clerk is configured, require authentication
  if (!request.user) {
    console.log('[requireAuth] Clerk configured but no user found, rejecting');
    return reply.code(401).send({ error: 'Unauthorized' });
  }
  
  console.log('[requireAuth] User authenticated:', request.user?.id);
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  // In MVP, we'll check for a simple admin flag
  // In production, implement proper role-based access control
  const userId = request.user?.id;
  if (!userId) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  // For MVP, you can check admin status from user metadata or a separate admin table
  // For now, we'll allow all authenticated users (you should implement proper admin check)
  // const isAdmin = await checkAdminStatus(userId);
  // if (!isAdmin) {
  //   return reply.code(403).send({ error: 'Forbidden' });
  // }
}

