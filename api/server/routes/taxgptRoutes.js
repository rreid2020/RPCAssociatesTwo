import { Router } from 'express'
import { getClerkUser } from '../middleware/portalAuth.js'
import { assertWorkspaceEntitlement } from '../services/authz/entitlementPolicy.js'
import { getWorkspaceContext } from '../services/accountingWorkspaceService.js'
import {
  createConversationForUser,
  deleteConversationForUser,
  getConversationForUser,
  insertFeedbackForMessage,
  listConversationsForUser,
  listMessagesForConversation,
  updateConversationTitleForUser
} from '../services/repositories/taxgptRepository.js'
import {
  executeStreamingChat,
  formatSseEvent,
  getUsageSnapshot
} from '../services/taxgpt/taxgptChatService.js'

const FEEDBACK_TYPES = new Set(['thumbs_up', 'thumbs_down', 'not_helpful', 'incorrect', 'outdated'])

function parseUuid (value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

async function resolveWorkspaceScope (pool, req, session) {
  const requestedWorkspaceId = parseUuid(req.headers['x-accounting-workspace-id'] || req.query.workspaceId || req.body?.workspaceId)
  if (!requestedWorkspaceId) return null
  const workspace = await getWorkspaceContext(pool, session.userId, requestedWorkspaceId, {
    expectedClerkOrgId: session.orgId || null
  })
  await assertWorkspaceEntitlement({ pool, workspaceId: workspace.id, entitlementKey: 'taxgpt' })
  return workspace
}

function sendSseHeaders (res) {
  res.status(200)
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders?.()
}

export function createTaxgptRouter (pool) {
  const r = Router()

  r.get('/conversations', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    try {
      const workspace = await resolveWorkspaceScope(pool, req, session)
      const conversations = await listConversationsForUser(pool, session.userId, workspace?.id || null)
      res.json({ conversations })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load conversations'
      res.status(400).json({ error: message })
    }
  })

  r.post('/conversations', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    try {
      const workspace = await resolveWorkspaceScope(pool, req, session)
      const conversation = await createConversationForUser(pool, {
        userId: session.userId,
        workspaceId: workspace?.id || null,
        title: req.body?.title || ''
      })
      res.status(201).json({ conversation })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not create conversation'
      res.status(400).json({ error: message })
    }
  })

  r.patch('/conversations/:conversationId', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const conversationId = parseUuid(req.params.conversationId)
    if (!conversationId) return res.status(400).json({ error: 'Invalid conversation id' })
    try {
      const conversation = await updateConversationTitleForUser(pool, {
        conversationId,
        userId: session.userId,
        title: req.body?.title
      })
      if (!conversation) return res.status(404).json({ error: 'Conversation not found' })
      res.json({ conversation })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not update conversation'
      res.status(400).json({ error: message })
    }
  })

  r.delete('/conversations/:conversationId', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const conversationId = parseUuid(req.params.conversationId)
    if (!conversationId) return res.status(400).json({ error: 'Invalid conversation id' })
    try {
      const deleted = await deleteConversationForUser(pool, {
        conversationId,
        userId: session.userId
      })
      if (!deleted) return res.status(404).json({ error: 'Conversation not found' })
      res.status(204).end()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not delete conversation'
      res.status(400).json({ error: message })
    }
  })

  r.get('/messages', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const conversationId = parseUuid(req.query.conversationId)
    if (!conversationId) return res.status(400).json({ error: 'conversationId is required' })
    try {
      const conversation = await getConversationForUser(pool, { conversationId, userId: session.userId })
      if (!conversation) return res.status(404).json({ error: 'Conversation not found' })
      const messages = await listMessagesForConversation(pool, { conversationId, userId: session.userId })
      res.json({ messages })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load messages'
      res.status(400).json({ error: message })
    }
  })

  r.post('/chat', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const message = String(req.body?.message || '').trim()
    const conversationId = parseUuid(req.body?.conversationId)
    const regenerateMessageId = parseUuid(req.body?.regenerateMessageId)

    if (!message && !regenerateMessageId) {
      return res.status(400).json({ error: 'message is required' })
    }

    try {
      const workspace = await resolveWorkspaceScope(pool, req, session)
      sendSseHeaders(res)
      const sendEvent = (event, payload) => {
        res.write(formatSseEvent(event, payload))
      }

      await executeStreamingChat({
        pool,
        userId: session.userId,
        workspaceId: workspace?.id || null,
        message,
        conversationId,
        regenerateMessageId,
        sendEvent
      })

      res.write(formatSseEvent('complete', { ok: true }))
      res.end()
    } catch (error) {
      const code = error?.code === 'DAILY_LIMIT_REACHED' ? 402 : 500
      const payload = {
        error: error instanceof Error ? error.message : 'Chat request failed'
      }
      if (res.headersSent) {
        res.write(formatSseEvent('error', payload))
        res.end()
      } else {
        res.status(code).json(payload)
      }
    }
  })

  r.post('/feedback', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const messageId = parseUuid(req.body?.messageId)
    const feedbackType = String(req.body?.feedbackType || '').trim().toLowerCase()
    const comments = String(req.body?.comments || '').trim() || null
    if (!messageId) return res.status(400).json({ error: 'messageId is required' })
    if (!FEEDBACK_TYPES.has(feedbackType)) return res.status(400).json({ error: 'Invalid feedbackType' })
    try {
      const feedback = await insertFeedbackForMessage(pool, {
        userId: session.userId,
        messageId,
        feedbackType,
        comments
      })
      res.status(201).json({ feedback })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save feedback'
      res.status(400).json({ error: message })
    }
  })

  r.get('/usage', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    try {
      const usage = await getUsageSnapshot(pool, session.userId)
      res.json({ usage })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load usage'
      res.status(400).json({ error: message })
    }
  })

  return r
}
