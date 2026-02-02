export interface DatabaseConfig {
  url: string;
}

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  embedModel: string;
}

export interface StorageConfig {
  driver: 'local' | 's3';
  local?: {
    path: string;
  };
  s3?: {
    endpoint: string;
    bucket: string;
    accessKey: string;
    secretKey: string;
    region: string;
  };
}

export interface CrawlerConfig {
  userAgent: string;
  requestsPerSecond: number;
  maxDepth: number;
  allowlistPrefixes: string[];
  timeout: number;
  retries: number;
  retryBackoff: number;
  proxy?: string;
}

export interface AppConfig {
  appUrl: string;
  apiUrl: string;
  nodeEnv: 'development' | 'production' | 'test';
}

export interface ClerkConfig {
  publishableKey: string;
  secretKey: string;
}

export function getDatabaseConfig(): DatabaseConfig {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is required');
  }
  return { url };
}

export function getOpenAIConfig(): OpenAIConfig {
  return {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    embedModel: process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small',
  };
}

export function getStorageConfig(): StorageConfig {
  const driver = (process.env.STORAGE_DRIVER || 'local') as 'local' | 's3';

  if (driver === 's3') {
    return {
      driver,
      s3: {
        endpoint: process.env.S3_ENDPOINT || '',
        bucket: process.env.S3_BUCKET || '',
        accessKey: process.env.S3_ACCESS_KEY || '',
        secretKey: process.env.S3_SECRET_KEY || '',
        region: process.env.S3_REGION || 'nyc3',
      },
    };
  }

  return {
    driver,
    local: {
      path: process.env.STORAGE_LOCAL_PATH || './storage/local',
    },
  };
}

export function getCrawlerConfig(): CrawlerConfig {
  return {
    userAgent: process.env.CRAWLER_USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    requestsPerSecond: parseFloat(process.env.CRAWLER_RPS || '1.5'),
    maxDepth: parseInt(process.env.CRAWLER_MAX_DEPTH || '1', 10),
        allowlistPrefixes: process.env.CRAWLER_ALLOWLIST_PREFIXES
          ? process.env.CRAWLER_ALLOWLIST_PREFIXES.split(',')
          : [
              'https://www.canada.ca/en/revenue-agency/services/forms-publications/publications',
              'https://www.canada.ca/en/revenue-agency/services/forms-publications/guides',
            ],
    timeout: 30000,
    retries: 3,
    retryBackoff: 1000,
    proxy: process.env.CRAWLER_PROXY,
  };
}

export function getAppConfig(): AppConfig {
  return {
    appUrl: process.env.APP_URL || 'http://localhost:5173',
    apiUrl: process.env.API_URL || 'http://localhost:3000',
    nodeEnv: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
  };
}

export function getClerkConfig(): ClerkConfig {
  return {
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY || '',
    secretKey: process.env.CLERK_SECRET_KEY || '',
  };
}

