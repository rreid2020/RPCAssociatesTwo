import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getDb } from './client';

// Load DATABASE_URL from api/server/.env (single canonical DB source)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../../../../../api/server/.env');
console.log('Loading DATABASE_URL from:', envPath);
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

