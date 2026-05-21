import { verifyToken } from '@clerk/backend'
import { getClerkPrimaryEmail } from '../services/clerkAdminService.js'

/**
 * @returns {Promise<{ userId: string, email: string | null, orgId: string | null, orgRole: string | null } | null>} null if response already sent
 */
export async function getClerkUser (req, res) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' })
    return null
  }
  const token = auth.slice(7)
  const secret = process.env.CLERK_SECRET_KEY
  if (!secret) {
    if (process.env.NODE_ENV === 'development') {
      return { userId: 'dev_clerk_user', email: 'dev@example.com', orgId: null, orgRole: null }
    }
    res.status(503).json({ error: 'Clerk not configured on server' })
    return null
  }
  try {
    const payload = await verifyToken(token, { secretKey: secret })
    const userId = payload.sub
    if (!userId) {
      res.status(401).json({ error: 'Invalid token' })
      return null
    }
    let email = typeof payload.email === 'string'
      ? payload.email
      : (typeof payload.email_address === 'string' ? payload.email_address : null)
    if (!email && userId) {
      try {
        email = await getClerkPrimaryEmail(userId)
      } catch (lookupError) {
        console.warn('Unable to resolve Clerk primary email for user:', userId, lookupError)
      }
    }
    const orgId = typeof payload.org_id === 'string' ? payload.org_id : null
    const orgRole = typeof payload.org_role === 'string' ? payload.org_role : null
    return { userId, email, orgId, orgRole }
  } catch (e) {
    console.error('verifyToken', e)
    res.status(401).json({ error: 'Invalid or expired token' })
    return null
  }
}

export function getStaffIds () {
  const raw = process.env.PORTAL_STAFF_CLERK_IDS || ''
  return new Set(raw.split(',').map((s) => s.trim()).filter(Boolean))
}

export function isStaff (userId) {
  const s = getStaffIds()
  return s.size > 0 && s.has(userId)
}
