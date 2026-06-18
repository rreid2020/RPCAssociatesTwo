import OpenAI from 'openai'
import pdfParse from 'pdf-parse'
import * as XLSX from 'xlsx'
import { getObjectBytes } from '../portalS3.js'

const IMAGE_MIME_PREFIXES = ['image/']
const TEXT_MIME_TYPES = new Set([
  'text/plain',
  'text/csv',
  'application/csv',
  'text/tab-separated-values'
])

function getOpenAIClient () {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null
  return new OpenAI({ apiKey })
}

function isImageMime (mime = '') {
  return IMAGE_MIME_PREFIXES.some((prefix) => String(mime).toLowerCase().startsWith(prefix))
}

function filenameSlipHint (fileName = '') {
  const upper = String(fileName).toUpperCase()
  const slipCodes = ['T4A-NR', 'T4A-RCA', 'T4FHSA', 'T4RSP', 'T4RIF', 'T4PS', 'T4A', 'T4E', 'T4', 'T5', 'T3', 'NR4', 'T1198', 'T1212', 'T5018', 'T5013', 'T5007']
  for (const code of slipCodes.sort((a, b) => b.length - a.length)) {
    if (upper.includes(code)) return code
  }
  return 'UNKNOWN'
}

function buildMetadataHints (doc) {
  return [
    `FILE_NAME: ${doc.file_name}`,
    `MIME: ${doc.mime || ''}`,
    `SIZE: ${doc.size_bytes || 0}`,
    `POSSIBLE_SLIP: ${filenameSlipHint(doc.file_name)}`
  ].join('\n')
}

async function extractTextFromPdf (bytes) {
  const parsed = await pdfParse(bytes)
  return String(parsed?.text || '').trim()
}

async function extractTextFromSpreadsheet (bytes) {
  const workbook = XLSX.read(bytes, { type: 'buffer' })
  const chunks = []
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) continue
    chunks.push(`SHEET: ${sheetName}`)
    chunks.push(XLSX.utils.sheet_to_csv(sheet))
  }
  return chunks.join('\n').trim()
}

async function extractTextFromImage (bytes, mime) {
  const client = getOpenAIClient()
  if (!client) return null
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const dataUrl = `data:${mime};base64,${bytes.toString('base64')}`
  const completion = await client.chat.completions.create({
    model,
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Extract all visible text from this Canadian tax slip or tax document image. Preserve box numbers, labels, and dollar amounts. Return plain text only.'
          },
          { type: 'image_url', image_url: { url: dataUrl } }
        ]
      }
    ]
  })
  return String(completion.choices?.[0]?.message?.content || '').trim()
}

async function extractTextFromObject (bytes, mime, fileName) {
  const normalizedMime = String(mime || '').toLowerCase()
  const lowerName = String(fileName || '').toLowerCase()

  if (normalizedMime === 'application/pdf' || lowerName.endsWith('.pdf')) {
    return { text: await extractTextFromPdf(bytes), method: 'pdf_parse' }
  }

  if (
    TEXT_MIME_TYPES.has(normalizedMime) ||
    lowerName.endsWith('.txt') ||
    lowerName.endsWith('.csv') ||
    lowerName.endsWith('.tsv')
  ) {
    return { text: bytes.toString('utf8').trim(), method: 'text_decode' }
  }

  if (
    normalizedMime.includes('spreadsheet') ||
    normalizedMime.includes('excel') ||
    lowerName.endsWith('.xlsx') ||
    lowerName.endsWith('.xls')
  ) {
    return { text: await extractTextFromSpreadsheet(bytes), method: 'xlsx_parse' }
  }

  if (isImageMime(normalizedMime) || /\.(png|jpe?g|webp|gif|bmp|tiff?)$/i.test(lowerName)) {
    const visionText = await extractTextFromImage(bytes, normalizedMime || 'image/jpeg')
    if (visionText) return { text: visionText, method: 'openai_vision' }
    return { text: '', method: 'image_no_vision_key' }
  }

  return { text: bytes.toString('utf8').trim(), method: 'binary_utf8_fallback' }
}

export async function extractOcrTextFromDocument (pool, clerkUserId, documentId) {
  const { rows } = await pool.query(
    `SELECT id, file_name, storage_key, mime, size_bytes
     FROM taxgpt.portal_client_files
     WHERE id = $1::uuid AND clerk_user_id = $2`,
    [documentId, clerkUserId]
  )
  const doc = rows[0]
  if (!doc) return null

  const hints = buildMetadataHints(doc)
  if (!doc.storage_key) {
    return {
      document: doc,
      text: hints,
      ocrMethod: 'filename_hints_only',
      ocrWarning: 'Document has no storage key; using filename hints only.'
    }
  }

  try {
    const object = await getObjectBytes(doc.storage_key)
    if (!object?.bytes?.length) {
      return {
        document: doc,
        text: hints,
        ocrMethod: 'storage_unavailable',
        ocrWarning: 'Could not read document bytes from storage.'
      }
    }

    const { text, method } = await extractTextFromObject(object.bytes, doc.mime || object.contentType, doc.file_name)
    const combined = [text, hints].filter(Boolean).join('\n\n')
    return {
      document: doc,
      text: combined,
      ocrMethod: method,
      ocrWarning: text ? null : 'No text could be extracted from the document body.'
    }
  } catch (error) {
    console.error('extractOcrTextFromDocument', error)
    return {
      document: doc,
      text: hints,
      ocrMethod: 'ocr_error_fallback',
      ocrWarning: error instanceof Error ? error.message : 'OCR failed; using filename hints only.'
    }
  }
}
