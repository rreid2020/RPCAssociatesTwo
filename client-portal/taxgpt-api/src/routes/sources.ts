import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { Crawler } from '@crawler/core';
import { IngestionService } from '@rag/core';
import { getDb, sources } from '@shared/types';
import { eq, and } from 'drizzle-orm';

const ingestRequestSchema = z.object({
  category: z.enum(['form', 'publication', 'guide', 'package', 'other']).optional(),
  type: z.enum(['html', 'pdf']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  limit: z.number().int().positive().max(100).optional(),
});

const updateSourceSchema = z.object({
  ingestStatus: z.enum(['pending', 'ingested', 'failed', 'skipped']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  jurisdictionTags: z.array(z.string()).optional(),
});

export async function sourceRoutes(fastify: FastifyInstance) {
  fastify.post('/crawl', { preHandler: [requireAuth, requireAdmin] }, async (request, reply) => {
    try {
      const crawler = new Crawler();
      const summary = await crawler.crawlCraCatalogue();
      return summary;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Crawl failed' });
    }
  });

  fastify.post('/ingest', { preHandler: [requireAuth, requireAdmin] }, async (request, reply) => {
    const body = ingestRequestSchema.parse(request.body || {});
    
    try {
      const ingestionService = new IngestionService();
      const summary = await ingestionService.ingestBatch({
        category: body.category,
        type: body.type,
        priority: body.priority,
        limit: body.limit,
      });
      return summary;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Ingestion failed' });
    }
  });

  fastify.get('/', { preHandler: requireAuth }, async (request) => {
    const query = request.query as {
      status?: string;
      type?: string;
      category?: string;
      jurisdiction?: string;
    };

    const db = getDb();
    const conditions = [];
    if (query.status) {
      conditions.push(eq(sources.ingestStatus, query.status as 'pending' | 'ingested' | 'failed' | 'skipped'));
    }
    if (query.type) {
      conditions.push(eq(sources.sourceType, query.type as 'html' | 'pdf'));
    }
    if (query.category) {
      conditions.push(eq(sources.category, query.category as 'form' | 'publication' | 'guide' | 'package' | 'other'));
    }

    let queryBuilder = db.select().from(sources);
    if (conditions.length > 0) {
      // Type assertion needed due to Drizzle's query builder typing limitations
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryBuilder = queryBuilder.where(and(...conditions)) as any;
    }

    const results = await queryBuilder.limit(100).execute();
    return results;
  });

  fastify.patch('/:id', { preHandler: [requireAuth, requireAdmin] }, async (request) => {
    const { id } = request.params as { id: string };
    const body = updateSourceSchema.parse(request.body);

    const db = getDb();
    await db.update(sources).set(body).where(eq(sources.id, id));

    return { success: true };
  });
}

