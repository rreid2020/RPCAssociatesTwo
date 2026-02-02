export * from './types/index.js';
export * from './constants/index.js';
export * from './utils/index.js';
export * from './db/index.js';
export * from './http/index.js';

// Explicitly re-export config functions and types to ensure they're available
export {
  getDatabaseConfig,
  getOpenAIConfig,
  getStorageConfig,
  getCrawlerConfig,
  getAppConfig,
  getClerkConfig,
  type DatabaseConfig,
  type OpenAIConfig,
  type StorageConfig,
  type CrawlerConfig,
  type AppConfig,
  type ClerkConfig,
} from './config/index.js';

// Re-export db schema and functions for convenience
export { sources, documents, chunks, embeddings, chatSessions, chatMessages, users, taxForms, taxFormSourceRefs, taxFormAliases } from './db/schema.js';
export { getDb, ensureDbValidated } from './db/client.js';// Re-export http functions
export { requestText, requestBytes } from './http/client.js';

// Re-export constants that are commonly used
export {
  CHUNK_SIZE,
  CHUNK_OVERLAP,
  DEFAULT_TOP_K,
  MAX_TOP_K,
  CRA_BASE_URL,
  CRA_FORMS_PUBLICATIONS_URL,
} from './constants/index.js';

