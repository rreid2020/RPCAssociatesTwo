import type { RiskLevel, SourceCategory, SourceType } from '../types';

export const RISK_LEVELS: RiskLevel[] = ['low', 'medium', 'high'];

export const SOURCE_TYPES: SourceType[] = ['html', 'pdf'];

export const SOURCE_CATEGORIES: SourceCategory[] = ['form', 'publication', 'guide', 'package', 'other'];

export const JURISDICTIONS = {
  CA_FED: 'CA-FED',
  // Future: provincial jurisdictions
} as const;

export const HIGH_RISK_KEYWORDS = [
  'gaar',
  'general anti-avoidance rule',
  'aggressive tax planning',
  'tax avoidance',
  'tax evasion',
  'residency',
  'deemed resident',
  'treaty shopping',
  'offshore',
  'tax haven',
  'transfer pricing',
  'thin capitalization',
];

export const PII_PATTERNS = {
  SIN: /\b\d{3}[-\s]?\d{3}[-\s]?\d{3}\b/g,
  EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  PHONE: /\b\d{3}[-\s]?\d{3}[-\s]?\d{4}\b/g,
} as const;

export const CHUNK_SIZE = 1000;
export const CHUNK_OVERLAP = 200;

export const DEFAULT_TOP_K = 5;
export const MAX_TOP_K = 20;

export const CRA_BASE_URL = 'https://www.canada.ca';
export const CRA_FORMS_PUBLICATIONS_URL =
  'https://www.canada.ca/en/revenue-agency/services/forms-publications.html';

