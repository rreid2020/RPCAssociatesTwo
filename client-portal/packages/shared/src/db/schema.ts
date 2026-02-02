import { pgTable, pgSchema, text, timestamp, jsonb, integer, uuid, varchar, customType } from 'drizzle-orm/pg-core';
import type { SourceType, SourceCategory, IngestStatus, Priority, RiskLevel } from '../types';

// Create a dedicated schema for this application
export const taxgptSchema = pgSchema('taxgpt');

// Define vector type for pgvector
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(1536)';
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string): number[] {
    return JSON.parse(value);
  },
});

export const sources = taxgptSchema.table('sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  url: text('url').notNull().unique(),
  title: text('title').notNull(),
  sourceType: varchar('source_type', { length: 25 }).$type<SourceType>().notNull(),
  category: varchar('category', { length: 20 }).$type<SourceCategory>().notNull(),
  jurisdictionTags: jsonb('jurisdiction_tags').$type<string[]>().notNull().default([]),
  discoveredAt: timestamp('discovered_at').notNull().defaultNow(),
  lastCrawledAt: timestamp('last_crawled_at'),
  lastIngestedAt: timestamp('last_ingested_at'),
  ingestStatus: varchar('ingest_status', { length: 20 })
    .$type<IngestStatus>()
    .notNull()
    .default('pending'),
  contentHash: text('content_hash'),
  priority: varchar('priority', { length: 10 }).$type<Priority>().notNull().default('medium'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  errorCode: integer('error_code'),
  errorMessage: text('error_message'),
  lastAttemptAt: timestamp('last_attempt_at'),
  // Folio-related fields
  normalizedUrl: text('normalized_url'),
  parentSourceId: uuid('parent_source_id'),
  pageKind: varchar('page_kind', { length: 20 }).$type<'directory' | 'content' | 'unknown'>(),
  // Block tracking fields
  blockedAt: timestamp('blocked_at'),
  blockType: varchar('block_type', { length: 50 }),
  blockReason: text('block_reason'),
  blockSignature: jsonb('block_signature').$type<Record<string, unknown>>(),
});

export const documents = taxgptSchema.table('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceId: uuid('source_id').references(() => sources.id),
  userId: text('user_id'), // Clerk user ID
  contentHash: text('content_hash').notNull(),
  retrievedAt: timestamp('retrieved_at').notNull().defaultNow(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
});

export const chunks = taxgptSchema.table('chunks', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id')
    .notNull()
    .references(() => documents.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  sectionHeading: text('section_heading'),
  pageNumber: integer('page_number'),
  chunkIndex: integer('chunk_index').notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
});

export const embeddings = taxgptSchema.table('embeddings', {
  id: uuid('id').primaryKey().defaultRandom(),
  chunkId: uuid('chunk_id')
    .notNull()
    .unique()
    .references(() => chunks.id, { onDelete: 'cascade' }),
  embedding: vector('embedding', { dimensions: 1536 }), // text-embedding-3-small dimensions
  model: text('model').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const chatSessions = taxgptSchema.table('chat_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(), // Clerk user ID
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const chatMessages = taxgptSchema.table('chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => chatSessions.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 20 }).notNull(), // 'user' | 'assistant' | 'system'
  content: text('content').notNull(),
  citations: jsonb('citations').$type<Array<Record<string, unknown>>>(),
  riskLevel: varchar('risk_level', { length: 10 }).$type<RiskLevel>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const users = taxgptSchema.table('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: text('clerk_user_id').notNull().unique(),
  userType: varchar('user_type', { length: 20 }), // 'business' | 'individual'
  employeeCount: varchar('employee_count', { length: 10 }), // '1-10' | '11-50' | '51-250' | '251+'
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const taxForms = taxgptSchema.table('tax_forms', {
  id: uuid('id').primaryKey().defaultRandom(),
  formCode: varchar('form_code', { length: 30 }).notNull().unique(),
  formName: text('form_name').notNull(),
  jurisdiction: varchar('jurisdiction', { length: 20 }).$type<'federal' | 'provincial'>().notNull().default('federal'),
  category: text('category').notNull(),
  summary: text('summary').notNull(),
  whoMustFile: text('who_must_file').notNull(),
  whenRequired: text('when_required').notNull(),
  documentsThatFeedInto: jsonb('documents_that_feed_into').$type<string[]>().notNull().default([]),
  commonMistakes: text('common_mistakes'),
  affects: jsonb('affects').$type<Record<string, unknown>>().notNull().default({}),
  relatedFormCodes: jsonb('related_form_codes').$type<string[]>().notNull().default([]),
  taxYearsSupported: jsonb('tax_years_supported').$type<number[]>().notNull().default([]),
  riskLevel: varchar('risk_level', { length: 10 }).$type<RiskLevel>().notNull().default('low'),
  lastReviewedAt: timestamp('last_reviewed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const taxFormSourceRefs = taxgptSchema.table('tax_form_source_refs', {
  id: uuid('id').primaryKey().defaultRandom(),
  taxFormId: uuid('tax_form_id')
    .notNull()
    .references(() => taxForms.id, { onDelete: 'cascade' }),
  sourceType: varchar('source_type', { length: 20 })
    .$type<'internal_doc' | 'external_url'>()
    .notNull(),
  internalDocumentId: uuid('internal_document_id').references(() => documents.id),
  externalUrl: text('external_url'),
  title: text('title').notNull(),
  snippet: text('snippet'),
  authority: varchar('authority', { length: 20 })
    .$type<'cra' | 'canlii' | 'other'>()
    .notNull()
    .default('cra'),
  lastVerifiedAt: timestamp('last_verified_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const taxFormAliases = taxgptSchema.table('tax_form_aliases', {
  id: uuid('id').primaryKey().defaultRandom(),
  taxFormId: uuid('tax_form_id')
    .notNull()
    .references(() => taxForms.id, { onDelete: 'cascade' }),
  alias: text('alias').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

