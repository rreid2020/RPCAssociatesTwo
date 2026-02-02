import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth';
import { UploadService } from '../services/upload';
import { getDb, documents } from '@shared/types';
import { eq, and } from 'drizzle-orm';

export async function uploadRoutes(fastify: FastifyInstance) {
  const uploadService = new UploadService();

  fastify.post('/', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.user?.id;
    if (!userId) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const data = await request.file();
    if (!data) {
      return reply.code(400).send({ error: 'No file uploaded' });
    }

    if (data.mimetype !== 'application/pdf') {
      return reply.code(400).send({ error: 'Only PDF files are supported' });
    }

    try {
      const buffer = await data.toBuffer();
      const docId = await uploadService.uploadPdf(userId, buffer, data.filename || 'document.pdf');
      
      return { docId };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to upload document' });
    }
  });

  fastify.get('/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user?.id;
    
    if (!userId) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const db = getDb();
    const docs = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.userId, userId)))
      .limit(1)
      .execute();
    const doc = docs[0];

    if (!doc) {
      return reply.code(404).send({ error: 'Document not found' });
    }

    return doc;
  });
}

