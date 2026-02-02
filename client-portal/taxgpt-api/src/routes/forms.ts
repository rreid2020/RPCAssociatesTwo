import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { FormsGuidanceService } from '../services/forms-guidance';
import { mergeFormResults } from '../services/forms-search';
import { getDb, taxForms, taxFormSourceRefs, documents, sources } from '@shared/types/db';
import { and, eq, inArray } from 'drizzle-orm';

const listQuerySchema = z.object({
  q: z.string().trim().optional(),
  category: z.string().trim().optional(),
});

const askBodySchema = z.object({
  question: z.string().min(3).max(2000),
});

const formsEnabled = () => process.env.FORMS_MODULE_ENABLED !== 'false';

export async function formsRoutes(fastify: FastifyInstance) {
  const guidanceService = new FormsGuidanceService();

  fastify.get('/', async (request, reply) => {
    if (!formsEnabled()) {
      return reply.code(404).send({ error: 'Forms module disabled' });
    }

    const query = listQuerySchema.parse(request.query || {});
    const db = getDb();
    const q = query.q;
    const category = query.category;

    const baseConditions = [];
    if (category) {
      baseConditions.push(eq(taxForms.category, category));
    }

    const formsByCodeOrName = await db.query.taxForms.findMany({
      where: (forms, { ilike, or }) => {
        if (!q && baseConditions.length === 0) return undefined;
        const conditions = [...baseConditions];
        if (q) {
          conditions.push(or(ilike(forms.formCode, `%${q}%`), ilike(forms.formName, `%${q}%`)));
        }
        if (conditions.length === 1) return conditions[0];
        return and(...conditions);
      },
      orderBy: (forms, { asc }) => [asc(forms.formCode)],
      limit: 100,
    });

    let forms = formsByCodeOrName;

    if (q) {
      const aliasMatches = await db.query.taxFormAliases.findMany({
        where: (aliases, { ilike }) => ilike(aliases.alias, `%${q}%`),
        columns: { taxFormId: true },
      });

      const aliasIds = aliasMatches.map((match) => match.taxFormId);
      const existingIds = new Set(formsByCodeOrName.map((form) => form.id));
      const missingIds = aliasIds.filter((id) => !existingIds.has(id));
      if (missingIds.length > 0) {
        const aliasForms = await db.query.taxForms.findMany({
          where: (forms, { inArray }) =>
            baseConditions.length > 0
              ? and(inArray(forms.id, missingIds), ...baseConditions)
              : inArray(forms.id, missingIds),
        });
        forms = mergeFormResults(forms, aliasForms);
      }
    }

    const formIds = forms.map((form) => form.id);
    const refs = formIds.length
      ? await db
          .select({
            taxFormId: taxFormSourceRefs.taxFormId,
            sourceType: taxFormSourceRefs.sourceType,
          })
          .from(taxFormSourceRefs)
          .where(inArray(taxFormSourceRefs.taxFormId, formIds))
      : [];

    const internalMap = new Map<string, boolean>();
    refs.forEach((ref) => {
      if (ref.sourceType === 'internal_doc') {
        internalMap.set(ref.taxFormId, true);
      }
    });

    return forms.map((form) => ({
      formCode: form.formCode,
      formName: form.formName,
      category: form.category,
      summary: form.summary,
      riskLevel: form.riskLevel,
      lastReviewedAt: form.lastReviewedAt,
      hasInternalSources: internalMap.get(form.id) || false,
    }));
  });

  fastify.get('/:formCode', async (request, reply) => {
    if (!formsEnabled()) {
      return reply.code(404).send({ error: 'Forms module disabled' });
    }

    const formCode = (request.params as { formCode: string }).formCode;
    const db = getDb();
    const form = await db.query.taxForms.findFirst({
      where: (forms, { ilike }) => ilike(forms.formCode, formCode.toUpperCase()),
    });

    if (!form) {
      return reply.code(404).send({ error: 'Form not found' });
    }

    const refs = await db
      .select({
        id: taxFormSourceRefs.id,
        sourceType: taxFormSourceRefs.sourceType,
        internalDocumentId: taxFormSourceRefs.internalDocumentId,
        externalUrl: taxFormSourceRefs.externalUrl,
        title: taxFormSourceRefs.title,
        snippet: taxFormSourceRefs.snippet,
        authority: taxFormSourceRefs.authority,
        lastVerifiedAt: taxFormSourceRefs.lastVerifiedAt,
        sourceUrl: sources.url,
        sourceTitle: sources.title,
      })
      .from(taxFormSourceRefs)
      .leftJoin(documents, eq(taxFormSourceRefs.internalDocumentId, documents.id))
      .leftJoin(sources, eq(documents.sourceId, sources.id))
      .where(eq(taxFormSourceRefs.taxFormId, form.id));

    const mappedRefs = refs.map((ref) => ({
      id: ref.id,
      sourceType: ref.sourceType,
      title: ref.title || ref.sourceTitle,
      snippet: ref.snippet,
      authority: ref.authority,
      lastVerifiedAt: ref.lastVerifiedAt,
      url: ref.sourceType === 'internal_doc' ? ref.sourceUrl || ref.externalUrl : ref.externalUrl || ref.sourceUrl,
    }));

    return {
      form,
      sources: mappedRefs,
    };
  });

  fastify.post('/:formCode/ask', { preHandler: requireAuth }, async (request, reply) => {
    if (!formsEnabled()) {
      return reply.code(404).send({ error: 'Forms module disabled' });
    }

    const formCode = (request.params as { formCode: string }).formCode;
    const body = askBodySchema.parse(request.body);

    try {
      const result = await guidanceService.answerQuestion(formCode, body.question);
      return {
        answer: result.answer,
        citations: result.citations,
        riskLevel: result.riskLevel,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to answer question';
      fastify.log.error(error);
      return reply.code(500).send({ error: message });
    }
  });
}
