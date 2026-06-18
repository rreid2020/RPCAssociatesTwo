function parseMoney (text, labelRegex) {
  const m = text.match(labelRegex)
  if (!m) return null
  const capture = m[2] != null ? m[2] : m[1]
  const v = Number(String(capture).replace(/[$, ]/g, ''))
  return Number.isFinite(v) ? v : null
}

function patternToRegex (pattern) {
  return new RegExp(`${pattern}[:\\s$]*([0-9,.\\-]+)`, 'i')
}

export function detectSlipTypeFromText (text = '', slipCodes = []) {
  const normalized = String(text).toUpperCase()
  const ordered = [...slipCodes]
    .map((code) => String(code || '').toUpperCase())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)

  for (const code of ordered) {
    const escaped = code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    if (new RegExp(`\\b${escaped}\\b`).test(normalized)) return code
  }
  return 'UNKNOWN'
}

export function normalizeExtractedDataToBoxes (slipType, extractedData = {}, schema) {
  const boxes = {}
  const data = extractedData && typeof extractedData === 'object' ? extractedData : {}

  for (const [key, value] of Object.entries(data)) {
    if (value == null || value === '') continue
    if (/^\d+[A-Z]?$/i.test(String(key)) || /^[A-Z]$/.test(String(key))) {
      boxes[String(key).toUpperCase()] = Number(value)
    }
  }

  for (const box of schema?.boxes || []) {
    const hints = box.extractionHints && typeof box.extractionHints === 'object' ? box.extractionHints : {}
    const legacyKey = String(hints.legacyFieldKey || '')
    if (legacyKey && data[legacyKey] != null && boxes[box.code] == null) {
      boxes[box.code] = Number(data[legacyKey])
    }
  }

  return boxes
}

export function extractBoxesFromText (text = '', schema) {
  const boxes = {}
  if (!schema?.boxes?.length) return boxes

  for (const box of schema.boxes) {
    const hints = box.extractionHints && typeof box.extractionHints === 'object' ? box.extractionHints : {}
    const patterns = Array.isArray(hints.labelPatterns) ? hints.labelPatterns : []
    let value = null
    for (const pattern of patterns) {
      value = parseMoney(text, patternToRegex(pattern))
      if (value != null) break
    }
    if (value == null) {
      value = parseMoney(text, new RegExp(`box[_\\s-]*${box.code}[:\\s$]*([0-9,.\\-]+)`, 'i'))
    }
    if (value != null) boxes[box.code] = value
  }

  return boxes
}

export function confidenceFromBoxes (boxes = {}, slipType = 'UNKNOWN') {
  const values = Object.values(boxes)
  const filled = values.filter((v) => Number(v || 0) !== 0).length
  const total = values.length
  if (slipType === 'UNKNOWN' || total === 0) return 0.2
  return Math.min(0.98, 0.35 + (filled / total) * 0.6)
}

export async function extractStructuredDataFromSchema (text, schema, slipType) {
  const boxes = extractBoxesFromText(text, schema)
  const confidence = confidenceFromBoxes(boxes, slipType)
  return {
    slipType,
    boxes,
    extracted: boxes,
    confidence,
    reviewRequired: confidence < 0.75
  }
}
