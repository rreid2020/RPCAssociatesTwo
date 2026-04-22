import { verifyToken } from '@clerk/backend'

/**
 * @returns {Promise<{ userId: string } | null>} null if response already sent
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
      return { userId: 'dev_clerk_user' }
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
    return { userId }
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
