import { Router } from 'express'
import { getClerkUser } from '../middleware/portalAuth.js'
import { createTaxReturn, deleteTaxReturn, getTaxReturnById, listTaxReturns, updateTaxReturn } from '../services/tax-intelligence/taxReturn.service.js'
import { listDeductions, listIncomeEntries, upsertDeductions, upsertIncomeEntries } from '../services/tax-intelligence/income.service.js'
import { calculateReturnTotals, getSavedCalculation } from '../services/tax-intelligence/calculation.service.js'
import {
  listSourceDocuments,
  setDocumentSuggestionStatus,
  suggestDocumentsForReturn,
  tagDocumentMetadata
} from '../services/tax-intelligence/documentLink.service.js'
import { extractOcrTextFromDocument } from '../services/tax-intelligence/ocr.service.js'
import {
  extractStructuredDataFromText,
  markExtractionReviewed,
  persistDocumentExtraction
} from '../services/tax-intelligence/extraction.service.js'
import { createScenario, listScenarios } from '../services/tax-intelligence/scenario.service.js'
import { listAuditFlags, runAuditRules } from '../services/tax-intelligence/audit.service.js'
import { getAdvisorySummary } from '../services/tax-intelligence/aiAdvisory.service.js'
import { mapExtractedSlipToEntries, upsertDocumentMappedEntries } from '../services/tax-intelligence/slipMapping.service.js'

function parseUuid (v) {
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : null
}

export function createTaxIntelligenceRouter (pool) {
  const r = Router()

  r.get('/tax-returns', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    try {
      const returns = await listTaxReturns(pool, session.userId)
      res.json({ returns })
    } catch (e) {
      console.error('GET /tax-returns', e)
      res.status(500).json({ error: 'Could not load tax returns' })
    }
  })

  r.post('/tax-returns', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    try {
      const taxReturn = await createTaxReturn(pool, session.userId, req.body || {})
      res.status(201).json({ taxReturn })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not create tax return'
      res.status(400).json({ error: msg })
    }
  })

  r.get('/tax-returns/:id', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const id = parseUuid(req.params.id)
    if (!id) return res.status(400).json({ error: 'Invalid id' })
    try {
      const taxReturn = await getTaxReturnById(pool, session.userId, id)
      if (!taxReturn) return res.status(404).json({ error: 'Not found' })
      const [incomeEntries, deductions, calculation] = await Promise.all([
        listIncomeEntries(pool, session.userId, id),
        listDeductions(pool, session.userId, id),
        getSavedCalculation(pool, session.userId, id)
      ])
      res.json({ taxReturn, incomeEntries: incomeEntries || [], deductions: deductions || [], calculation })
    } catch (e) {
      console.error('GET /tax-returns/:id', e)
      res.status(500).json({ error: 'Could not load tax return' })
    }
  })

  r.patch('/tax-returns/:id', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const id = parseUuid(req.params.id)
    if (!id) return res.status(400).json({ error: 'Invalid id' })
    try {
      const taxReturn = await updateTaxReturn(pool, session.userId, id, req.body || {})
      if (!taxReturn) return res.status(404).json({ error: 'Not found' })
      res.json({ taxReturn })
    } catch (e) {
      console.error('PATCH /tax-returns/:id', e)
      res.status(500).json({ error: 'Could not update tax return' })
    }
  })

  r.delete('/tax-returns/:id', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const id = parseUuid(req.params.id)
    if (!id) return res.status(400).json({ error: 'Invalid id' })
    try {
      const deleted = await deleteTaxReturn(pool, session.userId, id)
      if (!deleted) return res.status(404).json({ error: 'Not found' })
      res.status(204).end()
    } catch (e) {
      console.error('DELETE /tax-returns/:id', e)
      res.status(500).json({ error: 'Could not delete tax return' })
    }
  })

  r.put('/tax-returns/:id/income', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const id = parseUuid(req.params.id)
    if (!id) return res.status(400).json({ error: 'Invalid id' })
    try {
      const entries = Array.isArray(req.body?.entries) ? req.body.entries : []
      const incomeEntries = await upsertIncomeEntries(pool, session.userId, id, entries)
      if (!incomeEntries) return res.status(404).json({ error: 'Not found' })
      res.json({ incomeEntries })
    } catch (e) {
      console.error('PUT /tax-returns/:id/income', e)
      res.status(500).json({ error: 'Could not save income entries' })
    }
  })

  r.put('/tax-returns/:id/deductions', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const id = parseUuid(req.params.id)
    if (!id) return res.status(400).json({ error: 'Invalid id' })
    try {
      const entries = Array.isArray(req.body?.entries) ? req.body.entries : []
      const deductions = await upsertDeductions(pool, session.userId, id, entries)
      if (!deductions) return res.status(404).json({ error: 'Not found' })
      res.json({ deductions })
    } catch (e) {
      console.error('PUT /tax-returns/:id/deductions', e)
      res.status(500).json({ error: 'Could not save deductions' })
    }
  })

  r.post('/tax-returns/:id/calculate', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const id = parseUuid(req.params.id)
    if (!id) return res.status(400).json({ error: 'Invalid id' })
    try {
      const calculation = await calculateReturnTotals(pool, session.userId, id)
      if (!calculation) return res.status(404).json({ error: 'Not found' })
      res.json({ calculation })
    } catch (e) {
      console.error('POST /tax-returns/:id/calculate', e)
      res.status(500).json({ error: 'Could not calculate tax return' })
    }
  })

  r.get('/tax-returns/:id/documents/suggestions', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const id = parseUuid(req.params.id)
    if (!id) return res.status(400).json({ error: 'Invalid id' })
    try {
      const suggestions = await suggestDocumentsForReturn(pool, session.userId, id)
      if (!suggestions) return res.status(404).json({ error: 'Not found' })
      res.json({ suggestions })
    } catch (e) {
      console.error('GET /tax-returns/:id/documents/suggestions', e)
      res.status(500).json({ error: 'Could not suggest documents' })
    }
  })

  r.get('/tax-returns/:id/advisory', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const id = parseUuid(req.params.id)
    if (!id) return res.status(400).json({ error: 'Invalid id' })
    try {
      const advisory = await getAdvisorySummary(pool, session.userId, id)
      res.json({ advisory })
    } catch (e) {
      console.error('GET /tax-returns/:id/advisory', e)
      res.status(500).json({ error: 'Could not load advisory' })
    }
  })

  r.get('/documents/for-tax', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    try {
      const documents = await listSourceDocuments(pool, session.userId)
      res.json({ documents })
    } catch (e) {
      console.error('GET /documents/for-tax', e)
      res.status(500).json({ error: 'Could not load documents' })
    }
  })

  r.patch('/documents/tax-metadata/:documentId', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const documentId = parseUuid(req.params.documentId)
    if (!documentId) return res.status(400).json({ error: 'Invalid document id' })
    try {
      const metadata = await tagDocumentMetadata(pool, session.userId, documentId, req.body || {})
      if (!metadata) return res.status(404).json({ error: 'Document not found' })
      res.json({ metadata })
    } catch (e) {
      console.error('PATCH /documents/tax-metadata/:documentId', e)
      res.status(500).json({ error: 'Could not save document metadata' })
    }
  })

  r.patch('/documents/tax-metadata/:documentId/suggestion', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const documentId = parseUuid(req.params.documentId)
    if (!documentId) return res.status(400).json({ error: 'Invalid document id' })
    try {
      const metadata = await setDocumentSuggestionStatus(pool, session.userId, documentId, req.body?.status)
      if (!metadata) return res.status(404).json({ error: 'Document metadata not found' })
      res.json({ metadata })
    } catch (e) {
      console.error('PATCH /documents/tax-metadata/:documentId/suggestion', e)
      res.status(500).json({ error: 'Could not update suggestion status' })
    }
  })

  r.post('/documents/extract', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const documentId = parseUuid(req.body?.documentId)
    const taxReturnId = parseUuid(req.body?.taxReturnId)
    if (!documentId) return res.status(400).json({ error: 'documentId is required' })
    try {
      const ocr = await extractOcrTextFromDocument(pool, session.userId, documentId)
      if (!ocr) return res.status(404).json({ error: 'Document not found' })
      const structured = await extractStructuredDataFromText(ocr.text)
      const extraction = await persistDocumentExtraction(pool, session.userId, {
        documentId,
        taxReturnId,
        ocrText: ocr.text,
        slipType: structured.slipType,
        extracted: structured.extracted,
        confidence: structured.confidence,
        reviewRequired: structured.reviewRequired
      })
      await tagDocumentMetadata(pool, session.userId, documentId, {
        taxReturnId,
        taxYear: req.body?.taxYear,
        documentType: structured.slipType,
        taxpayerName: req.body?.taxpayerName,
        suggestedMatch: true,
        suggestionStatus: structured.reviewRequired ? 'pending' : 'accepted',
        metadata: {
          extractionId: extraction?.id || null,
          confidence: structured.confidence
        }
      })
      const mappedEntries = mapExtractedSlipToEntries(structured.slipType, structured.extracted, {
        documentId,
        extractionId: extraction?.id || null,
        slipType: structured.slipType
      })
      if (taxReturnId) {
        await upsertDocumentMappedEntries(pool, session.userId, taxReturnId, documentId, mappedEntries)
      }
      res.json({
        extraction,
        reviewRequired: structured.reviewRequired,
        confidence: structured.confidence,
        mappedEntries
      })
    } catch (e) {
      console.error('POST /documents/extract', e)
      res.status(500).json({ error: 'Could not process document extraction' })
    }
  })

  r.post('/documents/extractions/:id/review', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const extractionId = parseUuid(req.params.id)
    if (!extractionId) return res.status(400).json({ error: 'Invalid extraction id' })
    try {
      const extraction = await markExtractionReviewed(pool, session.userId, extractionId)
      if (!extraction) return res.status(404).json({ error: 'Extraction not found' })
      res.json({ extraction })
    } catch (e) {
      console.error('POST /documents/extractions/:id/review', e)
      res.status(500).json({ error: 'Could not mark extraction as reviewed' })
    }
  })

  r.get('/scenarios', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const taxReturnId = parseUuid(req.query.taxReturnId)
    if (!taxReturnId) return res.status(400).json({ error: 'taxReturnId is required' })
    try {
      const scenarios = await listScenarios(pool, session.userId, taxReturnId)
      res.json({ scenarios })
    } catch (e) {
      console.error('GET /scenarios', e)
      res.status(500).json({ error: 'Could not load scenarios' })
    }
  })

  r.post('/scenarios', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const taxReturnId = parseUuid(req.body?.taxReturnId)
    if (!taxReturnId) return res.status(400).json({ error: 'taxReturnId is required' })
    try {
      const scenario = await createScenario(pool, session.userId, taxReturnId, req.body || {})
      res.status(201).json({ scenario })
    } catch (e) {
      console.error('POST /scenarios', e)
      res.status(500).json({ error: 'Could not create scenario' })
    }
  })

  r.get('/audit/flags', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    try {
      const flags = await listAuditFlags(pool, session.userId, parseUuid(req.query.taxReturnId))
      res.json({ flags })
    } catch (e) {
      console.error('GET /audit/flags', e)
      res.status(500).json({ error: 'Could not load audit flags' })
    }
  })

  r.post('/audit/run', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const taxReturnId = parseUuid(req.body?.taxReturnId)
    if (!taxReturnId) return res.status(400).json({ error: 'taxReturnId is required' })
    try {
      const flags = await runAuditRules(pool, session.userId, taxReturnId)
      if (!flags) return res.status(404).json({ error: 'Tax return not found' })
      res.json({ flags })
    } catch (e) {
      console.error('POST /audit/run', e)
      res.status(500).json({ error: 'Could not run audit engine' })
    }
  })

  return r
}
