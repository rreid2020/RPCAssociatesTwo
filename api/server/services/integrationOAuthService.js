import crypto from 'crypto'

const STATE_TTL_MS = 10 * 60 * 1000

function getStateSecret () {
  const secret = process.env.ENCRYPTION_KEY || process.env.CLERK_SECRET_KEY || ''
  if (!secret) throw new Error('ENCRYPTION_KEY or CLERK_SECRET_KEY is required for integration state signing')
  return secret
}

function base64UrlEncode (input) {
  return Buffer.from(input).toString('base64url')
}

function base64UrlDecode (input) {
  return Buffer.from(input, 'base64url').toString('utf8')
}

function signPayload (payload) {
  const secret = getStateSecret()
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url')
}

export function createSignedIntegrationState (payload) {
  const body = {
    ...payload,
    iat: Date.now(),
    exp: Date.now() + STATE_TTL_MS
  }
  const raw = JSON.stringify(body)
  const encoded = base64UrlEncode(raw)
  const sig = signPayload(encoded)
  return `${encoded}.${sig}`
}

export function verifySignedIntegrationState (stateToken) {
  const [encoded, providedSig] = String(stateToken || '').split('.')
  if (!encoded || !providedSig) throw new Error('Invalid integration state')
  const expectedSig = signPayload(encoded)
  if (providedSig !== expectedSig) throw new Error('Invalid integration state signature')
  const payload = JSON.parse(base64UrlDecode(encoded))
  if (!payload.exp || Date.now() > payload.exp) throw new Error('Integration state expired')
  return payload
}

function requireEnv (name) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

export function buildQboAuthUrl (stateToken) {
  const clientId = requireEnv('QBO_CLIENT_ID')
  const redirectUri = requireEnv('QBO_REDIRECT_URI')
  const environment = (process.env.QBO_ENVIRONMENT || 'sandbox').toLowerCase()
  const scope = 'com.intuit.quickbooks.accounting'
  const base = environment === 'production'
    ? 'https://appcenter.intuit.com/connect/oauth2'
    : 'https://appcenter.intuit.com/connect/oauth2'
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    scope,
    redirect_uri: redirectUri,
    state: stateToken
  })
  return `${base}?${params.toString()}`
}

export async function exchangeQboCodeForTokens (code) {
  const clientId = requireEnv('QBO_CLIENT_ID')
  const clientSecret = requireEnv('QBO_CLIENT_SECRET')
  const redirectUri = requireEnv('QBO_REDIRECT_URI')
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: String(code),
    redirect_uri: redirectUri
  })
  const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json'
    },
    body: body.toString()
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data?.error_description || data?.error || 'QBO token exchange failed')
  }
  return data
}

export function buildGoogleSheetsAuthUrl (stateToken) {
  const clientId = requireEnv('GOOGLE_CLIENT_ID')
  const redirectUri = requireEnv('GOOGLE_REDIRECT_URI')
  const scope = 'https://www.googleapis.com/auth/spreadsheets.readonly'
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope,
    access_type: 'offline',
    prompt: 'consent',
    state: stateToken
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export async function exchangeGoogleCodeForTokens (code) {
  const clientId = requireEnv('GOOGLE_CLIENT_ID')
  const clientSecret = requireEnv('GOOGLE_CLIENT_SECRET')
  const redirectUri = requireEnv('GOOGLE_REDIRECT_URI')
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: String(code),
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    }).toString()
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data?.error_description || data?.error || 'Google token exchange failed')
  }
  return data
}

