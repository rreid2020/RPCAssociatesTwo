import { Router } from 'express'
import { getClerkUser, isStaff } from '../middleware/portalAuth.js'
import {
  getCorpusAudit,
  getFormRegistryStats,
  getOpsExternalLinks,
  getOpsOverview,
  getTaxesHubStats
} from '../services/ops/opsService.js'
import {
  actionTaxgptFeedbackForOps,
  deleteTaxgptFeedbackForOps,
  getTaxgptFeedbackDetailForOps,
  getTaxgptFeedbackStats,
  listTaxgptFeedbackForOps,
  updateTaxgptFeedbackForOps
} from '../services/ops/taxgptFeedbackOpsService.js'

function requireStaff (session, res) {
  if (!isStaff(session.userId)) {
    res.status(403).json({ error: 'Forbidden' })
    return false
  }
  return true
}

export function createOpsRouter (pool) {
  const r = Router()

  r.get('/v1/ops/me', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    res.json({
      isStaff: isStaff(session.userId),
      userId: session.userId
    })
  })

  r.get('/v1/ops/overview', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    if (!requireStaff(session, res)) return
    try {
      res.json({ overview: await getOpsOverview(pool) })
    } catch (e) {
      res.status(500).json({ error: e instanceof Error ? e.message : 'Could not load ops overview' })
    }
  })

  r.get('/v1/ops/corpus', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    if (!requireStaff(session, res)) return
    try {
      res.json({ corpus: await getCorpusAudit(pool) })
    } catch (e) {
      res.status(500).json({ error: e instanceof Error ? e.message : 'Could not load corpus audit' })
    }
  })

  r.get('/v1/ops/taxes-hub', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    if (!requireStaff(session, res)) return
    try {
      res.json({ taxesHub: await getTaxesHubStats(pool) })
    } catch (e) {
      res.status(500).json({ error: e instanceof Error ? e.message : 'Could not load taxes hub stats' })
    }
  })

  r.get('/v1/ops/forms-registry', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    if (!requireStaff(session, res)) return
    try {
      res.json({ formRegistry: await getFormRegistryStats(pool) })
    } catch (e) {
      res.status(500).json({ error: e instanceof Error ? e.message : 'Could not load form registry stats' })
    }
  })

  r.get('/v1/ops/links', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    if (!requireStaff(session, res)) return
    res.json({ links: getOpsExternalLinks() })
  })

  r.get('/v1/ops/feedback/stats', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    if (!requireStaff(session, res)) return
    try {
      res.json({ stats: await getTaxgptFeedbackStats(pool) })
    } catch (e) {
      res.status(500).json({ error: e instanceof Error ? e.message : 'Could not load feedback stats' })
    }
  })

  r.get('/v1/ops/feedback', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    if (!requireStaff(session, res)) return
    try {
      const result = await listTaxgptFeedbackForOps(pool, {
        status: req.query?.status,
        category: req.query?.category,
        q: req.query?.q,
        limit: req.query?.limit,
        offset: req.query?.offset
      })
      res.json(result)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not load feedback'
      const status = message.includes('Invalid') ? 400 : 500
      res.status(status).json({ error: message })
    }
  })

  r.get('/v1/ops/feedback/:id', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    if (!requireStaff(session, res)) return
    try {
      const detail = await getTaxgptFeedbackDetailForOps(pool, req.params.id)
      if (!detail) {
        res.status(404).json({ error: 'Feedback not found' })
        return
      }
      res.json(detail)
    } catch (e) {
      res.status(500).json({ error: e instanceof Error ? e.message : 'Could not load feedback detail' })
    }
  })

  r.patch('/v1/ops/feedback/:id', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    if (!requireStaff(session, res)) return
    try {
      const feedback = await updateTaxgptFeedbackForOps(pool, req.params.id, session.userId, {
        status: req.body?.status,
        operatorNotes: req.body?.operatorNotes
      })
      res.json({ feedback })
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not update feedback'
      const status = message.includes('not found') ? 404
        : message.includes('Invalid') || message.includes('No valid') ? 400
          : 500
      res.status(status).json({ error: message })
    }
  })

  r.post('/v1/ops/feedback/:id/action', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    if (!requireStaff(session, res)) return
    try {
      const result = await actionTaxgptFeedbackForOps(pool, req.params.id, session.userId, {
        sourceUrls: req.body?.sourceUrls,
        status: req.body?.status,
        operatorNotes: req.body?.operatorNotes,
        operatorSummary: req.body?.operatorSummary,
        actionType: req.body?.actionType
      })
      res.json(result)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not action feedback'
      const status = message.includes('not found') ? 404
        : message.includes('Invalid') || message.includes('required') || message.includes('URL') ? 400
          : 500
      res.status(status).json({ error: message })
    }
  })

  r.delete('/v1/ops/feedback/:id', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    if (!requireStaff(session, res)) return
    try {
      const result = await deleteTaxgptFeedbackForOps(pool, req.params.id)
      res.json(result)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not delete feedback'
      const status = message.includes('not found') ? 404 : 500
      res.status(status).json({ error: message })
    }
  })

  return r
}
