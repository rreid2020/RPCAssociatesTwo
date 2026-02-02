import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { getDatabaseConfig } from '../config';
import { logger } from '../utils/logger';
import * as schema from './schema';

let client: ReturnType<typeof postgres> | null = null;
let db: ReturnType<typeof drizzle> | null = null;
let pgvectorValidated = false;

const EXPECTED_VECTOR_DIMENSIONS = 1536; // text-embedding-3-small dimensions

async function validatePgvector(): Promise<void> {
  if (pgvectorValidated) {
    return;
  }

  if (!client) {
    throw new Error('Database client not initialized');
  }

  logger.db('Validating pgvector extension');

  try {
    // Check if pgvector extension exists
    const extensionResult = await client`
      SELECT EXISTS(
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
      ) as exists
    `;

    if (!extensionResult[0]?.exists) {
      logger.dbError('pgvector extension not found');
      throw new Error(
        'pgvector extension is not installed. Run: CREATE EXTENSION IF NOT EXISTS vector;'
      );
    }

    logger.db('pgvector extension found');

    // Validate vector column type and dimensions
    const columnResult = await client`
      SELECT 
        column_name,
        data_type,
        udt_name
      FROM information_schema.columns
      WHERE table_schema = 'taxgpt'
        AND table_name = 'embeddings'
        AND column_name = 'embedding'
    `;

    if (columnResult.length === 0) {
      logger.dbWarn('embeddings.embedding column not found (may not be created yet)');
      pgvectorValidated = true;
      return;
    }

    const column = columnResult[0];
    if (column.udt_name !== 'vector') {
      logger.dbError('embeddings.embedding column is not of type vector', {
        actualType: column.udt_name,
        expectedType: 'vector',
      });
      throw new Error(
        `embeddings.embedding column type mismatch: expected vector, got ${column.udt_name}`
      );
    }

    // Check vector dimensions by querying the actual column definition
    const dimensionResult = await client`
      SELECT 
        pg_catalog.format_type(a.atttypid, a.atttypmod) as type
      FROM pg_catalog.pg_attribute a
      JOIN pg_catalog.pg_class c ON a.attrelid = c.oid
      JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
      WHERE n.nspname = 'taxgpt'
        AND c.relname = 'embeddings'
        AND a.attname = 'embedding'
    `;

    if (dimensionResult.length > 0) {
      const typeStr = dimensionResult[0].type as string;
      const dimensionMatch = typeStr.match(/vector\((\d+)\)/);
      if (dimensionMatch) {
        const actualDimensions = parseInt(dimensionMatch[1], 10);
        if (actualDimensions !== EXPECTED_VECTOR_DIMENSIONS) {
          logger.dbError('Vector dimensions mismatch', {
            expected: EXPECTED_VECTOR_DIMENSIONS,
            actual: actualDimensions,
          });
          throw new Error(
            `Vector dimensions mismatch: expected ${EXPECTED_VECTOR_DIMENSIONS}, got ${actualDimensions}`
          );
        }
        logger.db('Vector dimensions validated', { dimensions: actualDimensions });
      }
    }

    pgvectorValidated = true;
    logger.db('pgvector validation passed');
  } catch (error) {
    logger.dbError('pgvector validation failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export function getDb() {
  if (!db) {
    const config = getDatabaseConfig();
    if (!client) {
      client = postgres(config.url, {
        max: 10,
        idle_timeout: 20,
        connect_timeout: 30,
        ssl: 'require',
        // Set search_path to use the taxgpt schema
        onnotice: () => {}, // Suppress notices
      });
      // Set search_path after connection
      client`SET search_path TO taxgpt, public`.execute();
    }
    db = drizzle(client, { schema });
  }
  return db;
}

export async function ensureDbValidated(): Promise<void> {
  if (!client) {
    const config = getDatabaseConfig();
    client = postgres(config.url, {
      max: 1,
      connect_timeout: 30,
      ssl: 'require',
      onnotice: () => {}, // Suppress notices
    });
    // Set search_path after connection
    await client`SET search_path TO taxgpt, public`.execute();
  }
  await validatePgvector();
}

export async function closeDb() {
  if (client) {
    await client.end();
    client = null;
    db = null;
    pgvectorValidated = false;
  }
}

export async function createTaxgptSchema(): Promise<void> {
  if (!client) {
    const config = getDatabaseConfig();
    client = postgres(config.url, {
      ssl: 'require',
      connect_timeout: 30,
      onnotice: () => {},
    });
  }
  
  await client`CREATE SCHEMA IF NOT EXISTS taxgpt`;
  await client`GRANT ALL ON SCHEMA taxgpt TO CURRENT_USER`;
  await client`GRANT USAGE ON SCHEMA taxgpt TO CURRENT_USER`;
  await client`CREATE EXTENSION IF NOT EXISTS vector`;
}

