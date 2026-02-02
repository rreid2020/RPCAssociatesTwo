import type { Config } from 'drizzle-kit';
import { getDatabaseConfig } from './src/config';

const config = getDatabaseConfig();

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: config.url,
  },
} satisfies Config;

