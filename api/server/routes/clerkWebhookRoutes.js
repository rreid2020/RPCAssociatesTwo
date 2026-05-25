import { Router } from 'express'
import { syncClerkMembershipEvent } from '../services/clerkWebhookService.js'

function parseEvent (req) {
  if (Buffer.isBuffer(req.body)) {
    const raw = req.body.toString('utf8')
    return raw ? JSON.parse(raw) : {}
  }
  return req.body || {}
}

export function createClerkWebhookRouter (pool) {
  const router = Router()

  router.post('/clerk', async (req, res) => {
    try {
      const event = parseEvent(req)
      const eventType = String(event?.type || '').trim()
      const data = event?.data || {}

      if (!eventType) {
        return res.status(400).json({ error: 'Missing event type' })
      }

      if (eventType === 'organizationMembership.created' || eventType === 'organizationMembership.updated') {
        const result = await syncClerkMembershipEvent(pool, data, { deleted: false })
        return res.json({ ok: true, eventType, result })
      }

      if (eventType === 'organizationMembership.deleted') {
        const result = await syncClerkMembershipEvent(pool, data, { deleted: true })
        return res.json({ ok: true, eventType, result })
      }

      if (eventType === 'organizationInvitation.accepted') {
        const result = await syncClerkMembershipEvent(pool, data, { deleted: false })
        return res.json({ ok: true, eventType, result })
      }

      return res.json({ ok: true, eventType, ignored: true })
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid webhook payload' })
    }
  })

  return router
}
