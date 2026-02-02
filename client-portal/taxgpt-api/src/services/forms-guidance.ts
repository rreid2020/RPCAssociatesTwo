import OpenAI from 'openai';
import { getDb, taxForms, taxFormSourceRefs, documents, sources } from '@shared/types/db';
import { eq } from 'drizzle-orm';
import {
  redactPII,
  sanitizeInput,
  detectHighRiskTopics,
  getOpenAIConfig,
  type RiskLevel,
  logger,
} from '@shared/types';
import { RetrievalService } from '@rag/core';

type FormSource = {
  id: string;
  title: string;
  url: string;
  snippet?: string;
};

export class FormsGuidanceService {
  private openai: OpenAI;
  private model: string;
  private retrievalService = new RetrievalService();

  constructor() {
    const config = getOpenAIConfig();
    this.openai = new OpenAI({ apiKey: config.apiKey });
    this.model = config.model;
  }

  async answerQuestion(formCode: string, question: string) {
    const db = getDb();
    const normalizedCode = formCode.toUpperCase();

    const form = await db.query.taxForms.findFirst({
      where: (taxForms, { ilike }) => ilike(taxForms.formCode, normalizedCode),
    });

    if (!form) {
      throw new Error('Form not found');
    }

    const refs = await db
      .select({
        id: taxFormSourceRefs.id,
        sourceType: taxFormSourceRefs.sourceType,
        internalDocumentId: taxFormSourceRefs.internalDocumentId,
        externalUrl: taxFormSourceRefs.externalUrl,
        title: taxFormSourceRefs.title,
        snippet: taxFormSourceRefs.snippet,
        sourceUrl: sources.url,
        sourceTitle: sources.title,
      })
      .from(taxFormSourceRefs)
      .leftJoin(documents, eq(taxFormSourceRefs.internalDocumentId, documents.id))
      .leftJoin(sources, eq(documents.sourceId, sources.id))
      .where(eq(taxFormSourceRefs.taxFormId, form.id));

    const internalDocIds = refs
      .map((ref) => ref.internalDocumentId)
      .filter((id): id is string => !!id);

    const { text: redacted } = redactPII(question);
    const cleanedQuestion = sanitizeInput(redacted);

    const isHighRisk = form.riskLevel === 'high' || detectHighRiskTopics(cleanedQuestion);
    const riskLevel: RiskLevel = isHighRisk ? 'high' : 'low';

    const adviceRequested = this.isPersonalAdvice(cleanedQuestion);
    const guardrailIntro = this.buildGuardrailIntro(form.formCode, form.formName, riskLevel, adviceRequested);

    const sourcesList: FormSource[] = [];

    let retrievedChunks: Array<{ content: string; citation: { sourceTitle: string; sourceUrl: string; sectionHeading?: string; pageNumber?: number } }> = [];
    if (internalDocIds.length > 0) {
      try {
        retrievedChunks = await this.retrievalService.retrieve(cleanedQuestion, {
          topK: 5,
          contextDocIds: internalDocIds,
        });
      } catch (error) {
        logger.warn('Forms retrieval failed', { error });
      }
    }

    retrievedChunks.forEach((chunk, idx) => {
      sourcesList.push({
        id: `chunk-${idx}`,
        title: chunk.citation.sourceTitle,
        url: chunk.citation.sourceUrl || '',
        snippet: chunk.content,
      });
    });

    const externalRefs = refs
      .filter((ref) => ref.externalUrl)
      .map((ref) => ({
        id: ref.id,
        title: ref.title,
        url: ref.externalUrl || ref.sourceUrl || '',
        snippet: ref.snippet || undefined,
      }))
      .filter((ref) => ref.url && !sourcesList.some((existing) => existing.url === ref.url));

    sourcesList.push(...externalRefs);

    if (sourcesList.length === 0) {
      return {
        answer: `${guardrailIntro}\n\nI don't have any CRA references linked to this form yet. Please check back later or consult a CRA guide for ${form.formCode}.`,
        citations: [],
        riskLevel,
      };
    }

    if (process.env.FORMS_MOCK_LLM === 'true') {
      return {
        answer: `${guardrailIntro}\n\nMock response for ${form.formCode}.`,
        citations: sourcesList.slice(0, 2).map((source) => ({ title: source.title, url: source.url })),
        riskLevel,
      };
    }

    if (adviceRequested) {
      return {
        answer: `${guardrailIntro}\n\nHere is a general overview of ${form.formCode} based on CRA references. For personal advice, consult a tax professional.\n\n${this.buildFormSummary(form)}`,
        citations: sourcesList.slice(0, 3).map((source) => ({ title: source.title, url: source.url })),
        riskLevel,
      };
    }

    const systemPrompt = this.buildSystemPrompt(riskLevel);
    const userPrompt = this.buildUserPrompt(form, cleanedQuestion, sourcesList);

    const completion = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
    });

    const answer = completion.choices[0]?.message?.content || 'I could not generate a response.';
    const citations = this.extractCitations(answer, sourcesList);

    return {
      answer: `${guardrailIntro}\n\n${answer}`,
      citations,
      riskLevel,
    };
  }

  private buildSystemPrompt(riskLevel: RiskLevel): string {
    return `You are an educational CRA tax form assistant. Provide informational explanations about tax forms.\n\nRules:\n1) Do NOT give personalized tax advice or planning.\n2) Base answers only on the provided sources.\n3) Use citations like [1], [2] for factual claims.\n4) If unsure or sources are insufficient, say so.\n5) Keep responses concise and factual.\n${riskLevel === 'high' ? '6) High-risk form: emphasize compliance and penalties for incorrect filing.' : ''}`;
  }

  private buildUserPrompt(form: { formCode: string; formName: string; summary: string; whoMustFile: string; whenRequired: string; commonMistakes?: string | null }, question: string, sourcesList: FormSource[]): string {
    const sourcesText = sourcesList
      .map((source, idx) => `[${idx + 1}] ${source.title}\n${source.snippet || 'No snippet available.'}`)
      .join('\n\n');

    return `Form: ${form.formCode} — ${form.formName}\n\nSummary: ${form.summary}\nWho must file: ${form.whoMustFile}\nWhen required: ${form.whenRequired}\nCommon mistakes: ${form.commonMistakes || 'Not specified'}\n\nUser question: ${question}\n\nSources:\n${sourcesText}\n\nAnswer the question using only the sources. Include citations.`;
  }

  private buildGuardrailIntro(formCode: string, formName: string, riskLevel: RiskLevel, adviceRequested: boolean): string {
    const riskNote = riskLevel === 'high' ? 'This form has higher compliance risk; mistakes can lead to penalties.' : '';
    const adviceNote = adviceRequested
      ? 'I can provide educational guidance, but not personal tax advice.'
      : 'This is general educational information, not personal tax advice.';
    return `Tax Form Guidance — ${formCode} (${formName}). ${adviceNote} ${riskNote}`.trim();
  }

  private buildFormSummary(form: { summary: string; whoMustFile: string; whenRequired: string }) {
    return `What this form is for:\n${form.summary}\n\nWho should file:\n${form.whoMustFile}\n\nWhen it is required:\n${form.whenRequired}`;
  }

  private extractCitations(answer: string, sourcesList: FormSource[]) {
    const citationPattern = /\[(\d+)\]/g;
    const matches = Array.from(answer.matchAll(citationPattern));
    const indices = new Set(matches.map((m) => parseInt(m[1], 10) - 1));
    return Array.from(indices)
      .filter((idx) => idx >= 0 && idx < sourcesList.length)
      .map((idx) => ({
        title: sourcesList[idx].title,
        url: sourcesList[idx].url,
      }));
  }

  private isPersonalAdvice(question: string): boolean {
    const lower = question.toLowerCase();
    const patterns = [
      'should i',
      'can i claim',
      'how do i reduce',
      'how to reduce',
      'optimize',
      'maximize',
      'minimize tax',
      'my situation',
      'for me',
      'am i eligible',
    ];
    return patterns.some((pattern) => lower.includes(pattern));
  }
}
