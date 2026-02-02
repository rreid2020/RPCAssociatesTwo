import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getDb } from './client';

// Load .env from project root
// Get the directory of this file, then go up to project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// From packages/shared/src/db/migrate.ts, go up 4 levels to project root
// packages/shared/src/db -> packages/shared/src -> packages/shared -> packages -> root
const rootPath = resolve(__dirname, '../../../..');
const envPath = resolve(rootPath, '.env');
console.log('Loading .env from:', envPath);
config({ path: envPath });

async function runMigrations() {
  const db = getDb();
  console.log('Running migrations...');
  // Migrations folder is relative to the shared package root
  const migrationsPath = resolve(__dirname, '../../drizzle');
  console.log('Migrations folder:', migrationsPath);
  await migrate(db, { migrationsFolder: migrationsPath });
  console.log('Migrations completed');
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

