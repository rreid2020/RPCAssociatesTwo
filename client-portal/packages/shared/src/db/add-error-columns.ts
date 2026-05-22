import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';
import { getDatabaseConfig } from '../config';

// Load DATABASE_URL from api/server/.env (single canonical DB source)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../../../../../api/server/.env');
config({ path: envPath });

async function addErrorColumns() {
  const dbConfig = getDatabaseConfig();
  const sql = postgres(dbConfig.url, {
    ssl: 'require',
    max: 1,
  });
  
  console.log('Adding error tracking columns to sources table...');

  try {
    await sql.unsafe(`
      ALTER TABLE taxgpt.sources
      ADD COLUMN IF NOT EXISTS error_code INTEGER,
      ADD COLUMN IF NOT EXISTS error_message TEXT,
      ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMP;
    `);
    
    console.log('✅ Columns added successfully!');
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed:', error);
    await sql.end();
    process.exit(1);
  }
}

addErrorColumns();




