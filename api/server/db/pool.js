import pg from 'pg'
const { Pool } = pg

function getRequiredDatabaseUrl () {
  const databaseUrl = String(process.env.DATABASE_URL || '').trim()
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required. DB_* fallback is no longer supported.')
  }
  return databaseUrl
}

function normalizeSslFromUrl (urlValue) {
  const parsed = new URL(urlValue)
  const mode = (parsed.searchParams.get('sslmode') || '').toLowerCase()
  return mode === 'require' || mode === 'verify-ca' || mode === 'verify-full'
}

function sanitizeConnectionString (urlValue) {
  const parsed = new URL(urlValue)
  parsed.searchParams.delete('sslmode')
  parsed.searchParams.delete('ssl')
  return parsed.toString()
}

function getConnectionConfig () {
  const databaseUrl = getRequiredDatabaseUrl()
  const useSsl = normalizeSslFromUrl(databaseUrl)

  const common = {
    ssl: useSsl
      ? {
          rejectUnauthorized: false, // Managed Postgres providers generally require TLS
          sslmode: 'require'
        }
      : false,
    max: Math.max(1, Math.min(50, Number(process.env.DATABASE_POOL_MAX) || 4)),
    min: 0,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
    allowExitOnIdle: true,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000
  }

  return {
    ...common,
    connectionString: sanitizeConnectionString(databaseUrl)
  }
}

export function getDatabaseConnectionSummary () {
  const databaseUrl = getRequiredDatabaseUrl()
  const parsed = new URL(databaseUrl)
  return {
    mode: 'DATABASE_URL',
    host: parsed.hostname,
    port: parsed.port || '5432',
    database: (parsed.pathname || '').replace(/^\//, ''),
    user: parsed.username || '(not set)',
    ssl: normalizeSslFromUrl(databaseUrl)
  }
}

export function createPool() {
  const config = getConnectionConfig()
  return new Pool(config)
}
