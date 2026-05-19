import pg from 'pg'
const { Pool } = pg

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
  const databaseUrl = process.env.DATABASE_URL
  const sslEnabledByEnv = process.env.DB_SSL === 'true'
  const sslEnabledByUrl = databaseUrl ? normalizeSslFromUrl(databaseUrl) : false
  const useSsl = sslEnabledByEnv || sslEnabledByUrl

  const common = {
    ssl: useSsl
      ? {
          rejectUnauthorized: false, // Managed Postgres providers generally require TLS
          sslmode: 'require'
        }
      : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 30000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000
  }

  if (databaseUrl) {
    return {
      ...common,
      connectionString: sanitizeConnectionString(databaseUrl)
    }
  }

  return {
    ...common,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  }
}

export function getDatabaseConnectionSummary () {
  const databaseUrl = process.env.DATABASE_URL
  if (databaseUrl) {
    const parsed = new URL(databaseUrl)
    return {
      mode: 'DATABASE_URL',
      host: parsed.hostname,
      port: parsed.port || '5432',
      database: (parsed.pathname || '').replace(/^\//, ''),
      user: parsed.username || '(not set)',
      ssl: process.env.DB_SSL === 'true' || normalizeSslFromUrl(databaseUrl)
    }
  }
  return {
    mode: 'DB_*',
    host: process.env.DB_HOST || '(not set)',
    port: process.env.DB_PORT || '5432',
    database: process.env.DB_NAME || '(not set)',
    user: process.env.DB_USER || '(not set)',
    ssl: process.env.DB_SSL === 'true'
  }
}

export function createPool() {
  const config = getConnectionConfig()
  return new Pool(config)
}
