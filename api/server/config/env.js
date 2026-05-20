function isTruthy (value) {
  return String(value || '').trim().toLowerCase() === 'true'
}

export function getServerEnvConfig () {
  return {
    port: Number(process.env.PORT || 3000),
    nodeEnv: process.env.NODE_ENV || 'development',
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasClerkSecret: Boolean(process.env.CLERK_SECRET_KEY),
    enableQboConnect: isTruthy(process.env.ENABLE_QBO_CONNECT),
    enableGoogleSheetsConnect: isTruthy(process.env.ENABLE_GOOGLE_SHEETS_CONNECT)
  }
}

export function logServerEnvSummary () {
  const env = getServerEnvConfig()
  console.log('[env-summary]', {
    nodeEnv: env.nodeEnv,
    hasDatabaseUrl: env.hasDatabaseUrl,
    hasClerkSecret: env.hasClerkSecret,
    enableQboConnect: env.enableQboConnect,
    enableGoogleSheetsConnect: env.enableGoogleSheetsConnect
  })
}

