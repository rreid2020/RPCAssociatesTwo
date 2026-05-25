import { pgTable, pgSchema, text, timestamp, jsonb, integer, uuid, varchar, customType, boolean, numeric, date } from 'drizzle-orm/pg-core';
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

/* —— Client portal (RPC marketing /portal) —— */

export const portalOpenItems = taxgptSchema.table('portal_open_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: text('clerk_user_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  status: varchar('status', { length: 20 }).notNull().default('open'),
  sortOrder: integer('sort_order').notNull().default(0),
  dueAt: timestamp('due_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const portalDeadlines = taxgptSchema.table('portal_deadlines', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: text('clerk_user_id').notNull(),
  title: text('title').notNull(),
  dueAt: timestamp('due_at').notNull(),
  category: varchar('category', { length: 64 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const portalActivity = taxgptSchema.table('portal_activity', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: text('clerk_user_id').notNull(),
  kind: varchar('kind', { length: 32 }).notNull(),
  title: text('title').notNull(),
  body: text('body'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const portalClientFiles = taxgptSchema.table('portal_client_files', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: text('clerk_user_id').notNull(),
  storageKey: text('storage_key').notNull(),
  fileName: text('file_name').notNull(),
  mime: text('mime'),
  sizeBytes: integer('size_bytes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const portalChecklists = taxgptSchema.table('portal_checklists', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: text('clerk_user_id').notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const portalChecklistItems = taxgptSchema.table('portal_checklist_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  checklistId: uuid('checklist_id')
    .notNull()
    .references(() => portalChecklists.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  done: boolean('done').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const portalIntegrations = taxgptSchema.table('portal_integrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: text('clerk_user_id').notNull(),
  provider: varchar('provider', { length: 64 }).notNull(),
  status: varchar('status', { length: 32 }).notNull().default('disconnected'),
  connectedAt: timestamp('connected_at'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const accountingClients = taxgptSchema.table('accounting_clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id'),
  clerkUserId: text('clerk_user_id').notNull(),
  name: text('name').notNull(),
  legalName: text('legal_name'),
  businessNumber: text('business_number'),
  fiscalYearEndMonth: integer('fiscal_year_end_month'),
  fiscalYearEndDay: integer('fiscal_year_end_day'),
  defaultCurrency: varchar('default_currency', { length: 3 }).notNull().default('CAD'),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const accountingEngagements = taxgptSchema.table('accounting_engagements', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id'),
  workspaceId: uuid('workspace_id'),
  clerkUserId: text('clerk_user_id').notNull(),
  clientId: uuid('client_id').notNull().references(() => accountingClients.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  engagementType: varchar('engagement_type', { length: 48 }).notNull(),
  fiscalYear: integer('fiscal_year').notNull(),
  periodStart: date('period_start').notNull(),
  periodEnd: date('period_end').notNull(),
  dueDate: date('due_date'),
  status: varchar('status', { length: 32 }).notNull().default('draft'),
  sourceType: varchar('source_type', { length: 32 }).notNull().default('manual'),
  reviewFlowStatus: varchar('review_flow_status', { length: 24 }).notNull().default('not_started'),
  deliverables: jsonb('deliverables').$type<string[]>().notNull().default([]),
  materialityAmount: numeric('materiality_amount', { precision: 14, scale: 2 }),
  reportingCurrency: varchar('reporting_currency', { length: 3 }).notNull().default('CAD'),
  createdBy: text('created_by').notNull(),
  assignedPreparerId: text('assigned_preparer_id'),
  assignedReviewerId: text('assigned_reviewer_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const sourceConnections = taxgptSchema.table('source_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id'),
  clerkUserId: text('clerk_user_id').notNull(),
  clientId: uuid('client_id').references(() => accountingClients.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 48 }).notNull(),
  providerRealmId: text('provider_realm_id'),
  connectionStatus: varchar('connection_status', { length: 32 }).notNull().default('pending'),
  accessTokenEncrypted: text('access_token_encrypted'),
  refreshTokenEncrypted: text('refresh_token_encrypted'),
  tokenExpiresAt: timestamp('token_expires_at'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const trialBalances = taxgptSchema.table('trial_balances', {
  id: uuid('id').primaryKey().defaultRandom(),
  engagementId: uuid('engagement_id').notNull().references(() => accountingEngagements.id, { onDelete: 'cascade' }),
  sourceConnectionId: uuid('source_connection_id').references(() => sourceConnections.id, { onDelete: 'set null' }),
  importBatchId: uuid('import_batch_id'),
  name: text('name').notNull(),
  periodStart: date('period_start').notNull(),
  periodEnd: date('period_end').notNull(),
  importedAt: timestamp('imported_at').notNull().defaultNow(),
  importedBy: text('imported_by').notNull(),
  status: varchar('status', { length: 24 }).notNull().default('draft'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const trialBalanceAccounts = taxgptSchema.table('trial_balance_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  trialBalanceId: uuid('trial_balance_id').notNull().references(() => trialBalances.id, { onDelete: 'cascade' }),
  sourceAccountId: text('source_account_id'),
  accountNumber: text('account_number'),
  accountName: text('account_name').notNull(),
  accountType: varchar('account_type', { length: 64 }).notNull(),
  normalBalance: varchar('normal_balance', { length: 8 }),
  currentPeriodBalance: numeric('current_period_balance', { precision: 14, scale: 2 }).notNull().default('0'),
  priorPeriodBalance: numeric('prior_period_balance', { precision: 14, scale: 2 }),
  varianceAmount: numeric('variance_amount', { precision: 14, scale: 2 }),
  variancePercent: numeric('variance_percent', { precision: 14, scale: 6 }),
  varianceLabel: varchar('variance_label', { length: 32 }),
  mappedGroupId: uuid('mapped_group_id'),
  leadSheetSection: varchar('lead_sheet_section', { length: 8 }),
  isMaterial: boolean('is_material').notNull().default(false),
  isUnusual: boolean('is_unusual').notNull().default(false),
  flags: jsonb('flags').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const accountMappingGroups = taxgptSchema.table('account_mapping_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id'),
  clerkUserId: text('clerk_user_id').notNull(),
  code: varchar('code', { length: 16 }).notNull(),
  name: text('name').notNull(),
  financialStatementArea: varchar('financial_statement_area', { length: 64 }).notNull(),
  defaultLeadSheetSection: varchar('default_lead_sheet_section', { length: 8 }),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const leadSheets = taxgptSchema.table('lead_sheets', {
  id: uuid('id').primaryKey().defaultRandom(),
  engagementId: uuid('engagement_id').notNull().references(() => accountingEngagements.id, { onDelete: 'cascade' }),
  sectionCode: varchar('section_code', { length: 8 }).notNull(),
  sectionName: text('section_name').notNull(),
  financialStatementArea: varchar('financial_statement_area', { length: 64 }).notNull(),
  status: varchar('status', { length: 24 }).notNull().default('not_started'),
  preparerId: text('preparer_id'),
  reviewerId: text('reviewer_id'),
  preparedAt: timestamp('prepared_at'),
  reviewedAt: timestamp('reviewed_at'),
  conclusionText: text('conclusion_text'),
  riskLevel: varchar('risk_level', { length: 16 }).notNull().default('medium'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const leadSheetAccounts = taxgptSchema.table('lead_sheet_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  leadSheetId: uuid('lead_sheet_id').notNull().references(() => leadSheets.id, { onDelete: 'cascade' }),
  trialBalanceAccountId: uuid('trial_balance_account_id').notNull().references(() => trialBalanceAccounts.id, { onDelete: 'cascade' }),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const trialBalanceImportBatches = taxgptSchema.table('trial_balance_import_batches', {
  id: uuid('id').primaryKey().defaultRandom(),
  engagementId: uuid('engagement_id').notNull().references(() => accountingEngagements.id, { onDelete: 'cascade' }),
  clerkUserId: text('clerk_user_id').notNull(),
  fileName: text('file_name').notNull(),
  fileType: varchar('file_type', { length: 16 }).notNull(),
  columnMapping: jsonb('column_mapping').$type<Record<string, string>>().notNull().default({}),
  warningSummary: jsonb('warning_summary').$type<Record<string, unknown>>().notNull().default({}),
  totalRows: integer('total_rows').notNull().default(0),
  importedRows: integer('imported_rows').notNull().default(0),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const workingPaperDocuments = taxgptSchema.table('working_paper_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  engagementId: uuid('engagement_id').notNull().references(() => accountingEngagements.id, { onDelete: 'cascade' }),
  leadSheetId: uuid('lead_sheet_id').references(() => leadSheets.id, { onDelete: 'set null' }),
  existingDocumentId: uuid('existing_document_id').references(() => portalClientFiles.id, { onDelete: 'set null' }),
  fileName: text('file_name').notNull(),
  fileType: varchar('file_type', { length: 64 }),
  storagePath: text('storage_path'),
  source: varchar('source', { length: 40 }).notNull(),
  description: text('description'),
  uploadedBy: text('uploaded_by').notNull(),
  uploadedAt: timestamp('uploaded_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const reviewNotes = taxgptSchema.table('review_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  engagementId: uuid('engagement_id').notNull().references(() => accountingEngagements.id, { onDelete: 'cascade' }),
  leadSheetId: uuid('lead_sheet_id').references(() => leadSheets.id, { onDelete: 'set null' }),
  trialBalanceAccountId: uuid('trial_balance_account_id').references(() => trialBalanceAccounts.id, { onDelete: 'set null' }),
  documentId: uuid('document_id').references(() => workingPaperDocuments.id, { onDelete: 'set null' }),
  noteText: text('note_text').notNull(),
  status: varchar('status', { length: 24 }).notNull().default('open'),
  priority: varchar('priority', { length: 16 }).notNull().default('medium'),
  createdBy: text('created_by').notNull(),
  assignedTo: text('assigned_to'),
  resolvedBy: text('resolved_by'),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const engagementTasks = taxgptSchema.table('engagement_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  engagementId: uuid('engagement_id').notNull().references(() => accountingEngagements.id, { onDelete: 'cascade' }),
  leadSheetId: uuid('lead_sheet_id').references(() => leadSheets.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description'),
  status: varchar('status', { length: 24 }).notNull().default('not_started'),
  assignedTo: text('assigned_to'),
  dueDate: date('due_date'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const adjustmentEntries = taxgptSchema.table('adjustment_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  engagementId: uuid('engagement_id').notNull().references(() => accountingEngagements.id, { onDelete: 'cascade' }),
  entryNumber: text('entry_number').notNull(),
  description: text('description').notNull(),
  status: varchar('status', { length: 24 }).notNull().default('draft'),
  source: varchar('source', { length: 24 }).notNull().default('manual'),
  createdBy: text('created_by').notNull(),
  approvedBy: text('approved_by'),
  postedAt: timestamp('posted_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const adjustmentEntryLines = taxgptSchema.table('adjustment_entry_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  adjustmentEntryId: uuid('adjustment_entry_id').notNull().references(() => adjustmentEntries.id, { onDelete: 'cascade' }),
  accountNumber: text('account_number'),
  accountName: text('account_name').notNull(),
  debitAmount: numeric('debit_amount', { precision: 14, scale: 2 }).notNull().default('0'),
  creditAmount: numeric('credit_amount', { precision: 14, scale: 2 }).notNull().default('0'),
  memo: text('memo'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const accountingAuditLog = taxgptSchema.table('accounting_audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id'),
  clerkUserId: text('clerk_user_id').notNull(),
  entityType: varchar('entity_type', { length: 64 }).notNull(),
  entityId: text('entity_id').notNull(),
  action: varchar('action', { length: 64 }).notNull(),
  actorId: text('actor_id').notNull(),
  beforeValue: jsonb('before_value').$type<Record<string, unknown>>(),
  afterValue: jsonb('after_value').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const accountingOrganizations = taxgptSchema.table('accounting_organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerUserId: text('owner_user_id').notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  organizationType: varchar('organization_type', { length: 16 }).notNull().default('business'),
  clerkOrgId: text('clerk_org_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const accountingOrganizationMembers = taxgptSchema.table('accounting_organization_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => accountingOrganizations.id, { onDelete: 'cascade' }),
  clerkUserId: text('clerk_user_id').notNull(),
  role: varchar('role', { length: 24 }).notNull().default('member'),
  status: varchar('status', { length: 24 }).notNull().default('active'),
  invitedBy: text('invited_by'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const accountingWorkspaces = taxgptSchema.table('accounting_workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => accountingOrganizations.id, { onDelete: 'set null' }),
  ownerUserId: text('owner_user_id').notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  clerkOrgId: text('clerk_org_id'),
  orgSyncStatus: varchar('org_sync_status', { length: 24 }).notNull().default('pending'),
  orgSyncedAt: timestamp('org_synced_at'),
  workspaceType: varchar('workspace_type', { length: 16 }).notNull().default('business'),
  isPersonal: boolean('is_personal').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const accountingWorkspaceMembers = taxgptSchema.table('accounting_workspace_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => accountingWorkspaces.id, { onDelete: 'cascade' }),
  clerkUserId: text('clerk_user_id').notNull(),
  role: varchar('role', { length: 24 }).notNull().default('preparer'),
  status: varchar('status', { length: 24 }).notNull().default('active'),
  clerkOrgMembershipId: text('clerk_org_membership_id'),
  invitedBy: text('invited_by'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const accountingWorkspaceInvites = taxgptSchema.table('accounting_workspace_invites', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => accountingWorkspaces.id, { onDelete: 'cascade' }),
  inviteEmail: text('invite_email'),
  inviteToken: text('invite_token').notNull(),
  role: varchar('role', { length: 24 }).notNull().default('preparer'),
  status: varchar('status', { length: 24 }).notNull().default('pending'),
  source: varchar('source', { length: 24 }).notNull().default('clerk'),
  clerkInvitationId: text('clerk_invitation_id'),
  invitedBy: text('invited_by').notNull(),
  acceptedBy: text('accepted_by'),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const accountingWorkspaceProfiles = taxgptSchema.table('accounting_workspace_profiles', {
  workspaceId: uuid('workspace_id').primaryKey().references(() => accountingWorkspaces.id, { onDelete: 'cascade' }),
  organizationType: varchar('organization_type', { length: 16 }).notNull().default('business'),
  businessType: text('business_type').default('corporation'),
  companyLegalName: text('company_legal_name').notNull(),
  companyOperatingName: text('company_operating_name'),
  industry: text('industry'),
  websiteUrl: text('website_url'),
  taxIdentifier: text('tax_identifier'),
  primaryContactName: text('primary_contact_name'),
  primaryContactEmail: text('primary_contact_email'),
  primaryContactPhone: text('primary_contact_phone'),
  addressLine1: text('address_line1'),
  addressLine2: text('address_line2'),
  city: text('city'),
  provinceState: text('province_state'),
  postalCode: text('postal_code'),
  countryCode: varchar('country_code', { length: 2 }).notNull().default('CA'),
  onboardingCompletedAt: timestamp('onboarding_completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const workspaceStripeCustomerMappings = taxgptSchema.table('workspace_stripe_customer_mappings', {
  workspaceId: uuid('workspace_id').primaryKey().references(() => accountingWorkspaces.id, { onDelete: 'cascade' }),
  clerkUserId: text('clerk_user_id').notNull(),
  stripeCustomerId: text('stripe_customer_id').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const subscriptionPlans = taxgptSchema.table('subscription_plans', {
  id: text('id').primaryKey(),
  displayName: text('display_name').notNull(),
  stripeProductId: text('stripe_product_id').notNull(),
  stripePriceMonthlyId: text('stripe_price_monthly_id').notNull(),
  stripePriceAnnualId: text('stripe_price_annual_id').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const workspaceSubscriptions = taxgptSchema.table('workspace_subscriptions', {
  workspaceId: uuid('workspace_id').primaryKey().references(() => accountingWorkspaces.id, { onDelete: 'cascade' }),
  planId: text('plan_id').notNull().default('FREE'),
  status: varchar('status', { length: 32 }).notNull().default('none'),
  interval: varchar('interval', { length: 16 }).notNull().default('monthly'),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  trialEndsAt: timestamp('trial_ends_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const workspaceEntitlements = taxgptSchema.table('workspace_entitlements', {
  workspaceId: uuid('workspace_id').primaryKey().references(() => accountingWorkspaces.id, { onDelete: 'cascade' }),
  canAccessWorkingPapers: boolean('can_access_working_papers').notNull().default(false),
  canAccessTaxgpt: boolean('can_access_taxgpt').notNull().default(true),
  canUseQboIntegration: boolean('can_use_qbo_integration').notNull().default(false),
  canUseGoogleSheetsIntegration: boolean('can_use_google_sheets_integration').notNull().default(false),
  canInviteUsers: boolean('can_invite_users').notNull().default(true),
  maxStorageMb: integer('max_storage_mb').notNull().default(512),
  maxUsers: integer('max_users').notNull().default(3),
  aiMonthlyCredits: integer('ai_monthly_credits').notNull().default(100),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const workspaceCustomRoles = taxgptSchema.table('workspace_custom_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => accountingWorkspaces.id, { onDelete: 'cascade' }),
  roleName: text('role_name').notNull(),
  sourceRole: text('source_role').notNull(),
  displayName: text('display_name').notNull(),
  isSystem: boolean('is_system').notNull().default(false),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const workspaceRolePermissions = taxgptSchema.table('workspace_role_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => accountingWorkspaces.id, { onDelete: 'cascade' }),
  roleName: text('role_name').notNull(),
  permissionKey: text('permission_key').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const workspaceMemberRoles = taxgptSchema.table('workspace_member_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => accountingWorkspaces.id, { onDelete: 'cascade' }),
  clerkUserId: text('clerk_user_id').notNull(),
  roleName: text('role_name').notNull(),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const workspaceEmployeeAssignments = taxgptSchema.table('workspace_employee_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => accountingOrganizations.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id').notNull().references(() => accountingWorkspaces.id, { onDelete: 'cascade' }),
  clerkUserId: text('clerk_user_id').notNull(),
  assignmentRole: varchar('assignment_role', { length: 24 }).notNull().default('member'),
  status: varchar('status', { length: 24 }).notNull().default('active'),
  assignedBy: text('assigned_by').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const engagementEmployeeAssignments = taxgptSchema.table('engagement_employee_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => accountingOrganizations.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id').notNull().references(() => accountingWorkspaces.id, { onDelete: 'cascade' }),
  engagementId: uuid('engagement_id').notNull().references(() => accountingEngagements.id, { onDelete: 'cascade' }),
  clerkUserId: text('clerk_user_id').notNull(),
  assignmentRole: varchar('assignment_role', { length: 24 }).notNull().default('member'),
  status: varchar('status', { length: 24 }).notNull().default('active'),
  assignedBy: text('assigned_by').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const workingPaperEmployeeAssignments = taxgptSchema.table('working_paper_employee_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => accountingOrganizations.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id').notNull().references(() => accountingWorkspaces.id, { onDelete: 'cascade' }),
  engagementId: uuid('engagement_id').notNull().references(() => accountingEngagements.id, { onDelete: 'cascade' }),
  leadSheetId: uuid('lead_sheet_id').notNull().references(() => leadSheets.id, { onDelete: 'cascade' }),
  clerkUserId: text('clerk_user_id').notNull(),
  assignmentRole: varchar('assignment_role', { length: 24 }).notNull().default('member'),
  status: varchar('status', { length: 24 }).notNull().default('active'),
  assignedBy: text('assigned_by').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

