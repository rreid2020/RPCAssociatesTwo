import pg from 'pg'
const { Pool } = pg

const POOL_MAX_CAP = 50

function getRequiredDatabaseUrl () {
  const databaseUrl = String(process.env.DATABASE_URL || '').trim()
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required. DB_* fallback is no longer supported.')
  }
  return databaseUrl
}

function parsePositiveInt (value, fallback) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.floor(parsed)
}

function isTruthyEnv (value) {
  const normalized = String(value || '').trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes'
}

function isProductionRuntime () {
  return String(process.env.NODE_ENV || '').trim().toLowerCase() === 'production'
}

function isPooledDatabaseUrl (databaseUrl) {
  try {
    const parsed = new URL(databaseUrl)
    return parsed.hostname.includes('pooler')
      || isTruthyEnv(parsed.searchParams.get('pgbouncer'))
  } catch {
    return false
  }
}

/**
 * Per-process pool sizing for multi-tenant SaaS scale.
 *
 * Production default assumes:
 * - DATABASE_URL points at a managed pooler (PgBouncer / DO connection pool) at scale
 * - Each API instance keeps a modest pool (12) and queries are mostly short-lived
 * - Total DB pressure ~= DATABASE_POOL_MAX x API instance count (set API_INSTANCE_COUNT in deploy)
 *
 * Override any time via DATABASE_POOL_MAX / DATABASE_POOL_MIN.
 * Use DATABASE_POOL_LOW_RESOURCE=true only on very small dev/staging databases.
 */
export function resolveDatabasePoolSizing () {
  if (process.env.DATABASE_POOL_MAX != null && String(process.env.DATABASE_POOL_MAX).trim() !== '') {
    const max = Math.min(POOL_MAX_CAP, parsePositiveInt(process.env.DATABASE_POOL_MAX, 12))
    const min = process.env.DATABASE_POOL_MIN != null
      ? Math.min(parsePositiveInt(process.env.DATABASE_POOL_MIN, 0), max)
      : Math.min(2, max)
    return { max, min, mode: 'explicit' }
  }

  if (isTruthyEnv(process.env.DATABASE_POOL_LOW_RESOURCE)) {
    return { max: 1, min: 1, mode: 'low_resource' }
  }

  if (isProductionRuntime()) {
    return { max: 12, min: 2, mode: 'production_default' }
  }

  return { max: 2, min: 0, mode: 'development_default' }
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
  const { max, min } = resolveDatabasePoolSizing()

  const common = {
    ssl: useSsl
      ? {
          rejectUnauthorized: false,
          sslmode: 'require'
        }
      : false,
    max,
    min,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    allowExitOnIdle: max > min,
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
    ssl: normalizeSslFromUrl(databaseUrl),
    usesPooler: isPooledDatabaseUrl(databaseUrl)
  }
}

export function getDatabasePoolSummary () {
  const sizing = resolveDatabasePoolSizing()
  const instanceCount = parsePositiveInt(process.env.API_INSTANCE_COUNT, 1)
  const connectionSummary = getDatabaseConnectionSummary()
  const estimatedOpenConnections = sizing.max * instanceCount

  return {
    ...sizing,
    instanceCount,
    estimatedOpenConnections,
    usesPooler: connectionSummary.usesPooler,
    guidance: connectionSummary.usesPooler
      ? 'Pooled DATABASE_URL detected. Size DATABASE_POOL_MAX per API instance; pooler multiplexes tenant traffic.'
      : isProductionRuntime()
        ? 'Production DATABASE_URL is direct Postgres. For hundreds+ of tenants, switch to your provider connection pool URL and set API_INSTANCE_COUNT.'
        : 'Development pool defaults are intentionally small.'
  }
}

export function createPool () {
  const config = getConnectionConfig()
  return new Pool(config)
}
