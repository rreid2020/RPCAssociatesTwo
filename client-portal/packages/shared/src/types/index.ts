export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Citation[];
  riskLevel?: RiskLevel;
  createdAt: Date;
}

export interface Citation {
  id: string;
  chunkId: string;
  sourceTitle: string;
  sourceUrl: string;
  sectionHeading?: string;
  pageNumber?: number;
  retrievedAt: Date;
  similarityScore?: number;
}

export interface Source {
  id: string;
  url: string;
  title: string;
  sourceType: SourceType;
  category: SourceCategory;
  jurisdictionTags: string[];
  discoveredAt: Date;
  lastCrawledAt?: Date;
  lastIngestedAt?: Date;
  ingestStatus: IngestStatus;
  contentHash?: string;
  priority: Priority;
  metadata?: Record<string, unknown>;
  // Folio-related fields
  normalizedUrl?: string;
  parentSourceId?: string;
  pageKind?: PageKind;
}

export interface Document {
  id: string;
  sourceId?: string;
  userId?: string;
  contentHash: string;
  retrievedAt: Date;
  metadata: DocumentMetadata;
}

export interface DocumentMetadata {
  title?: string;
  type?: 'html' | 'pdf' | 'text';
  pageCount?: number;
  url?: string;
  fileName?: string;
  fileSize?: number;
}

export interface ChunkMetadata {
  documentId: string;
  fileName?: string;
  [key: string]: unknown;
}

export interface Chunk {
  id: string;
  documentId: string;
  content: string;
  sectionHeading?: string;
  pageNumber?: number;
  chunkIndex: number;
  metadata?: Record<string, unknown>;
}

export interface Embedding {
  id: string;
  chunkId: string;
  embedding: number[];
  model: string;
  createdAt: Date;
}

export interface ChatSession {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaxForm {
  id: string;
  formCode: string;
  formName: string;
  jurisdiction: TaxFormJurisdiction;
  category: string;
  summary: string;
  whoMustFile: string;
  whenRequired: string;
  documentsThatFeedInto: string[];
  commonMistakes?: string | null;
  affects: Record<string, unknown>;
  relatedFormCodes: string[];
  taxYearsSupported: number[];
  riskLevel: RiskLevel;
  lastReviewedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaxFormSourceRef {
  id: string;
  taxFormId: string;
  sourceType: TaxFormSourceType;
  internalDocumentId?: string | null;
  externalUrl?: string | null;
  title: string;
  snippet?: string | null;
  authority: TaxFormAuthority;
  lastVerifiedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaxFormAlias {
  id: string;
  taxFormId: string;
  alias: string;
  createdAt: Date;
}

export type SourceType = 'html' | 'pdf' | 'cra_folio_directory' | 'cra_folio_content' | 'cra_ic_directory' | 'cra_ic_content';
export type SourceCategory = 'form' | 'publication' | 'guide' | 'package' | 'other' | 'folio' | 'circular';
export type IngestStatus = 'pending' | 'ingested' | 'failed' | 'skipped';
export type Priority = 'low' | 'medium' | 'high';
export type RiskLevel = 'low' | 'medium' | 'high';
export type PageKind = 'directory' | 'content' | 'unknown';
export type TaxFormJurisdiction = 'federal' | 'provincial';
export type TaxFormSourceType = 'internal_doc' | 'external_url';
export type TaxFormAuthority = 'cra' | 'canlii' | 'other';

export interface CrawlSummary {
  totalFound: number;
  newSources: number;
  updatedSources: number;
  skipped: number;
  errors: number;
}

export interface IngestSummary {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  errors: Array<{ sourceId: string; error: string }>;
}

