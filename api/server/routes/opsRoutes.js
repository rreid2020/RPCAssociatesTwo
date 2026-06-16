import { Router } from 'express'
import { getClerkUser, isStaff } from '../middleware/portalAuth.js'
import {
  getCorpusAudit,
  getFormRegistryStats,
  getOpsExternalLinks,
  getOpsOverview,
  getTaxesHubStats
} from '../services/ops/opsService.js'

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

  return r
}
