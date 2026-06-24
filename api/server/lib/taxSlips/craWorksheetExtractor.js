import pdfParse from 'pdf-parse'

const FETCH_HEADERS = {
  'User-Agent': 'RPCAssociates-TaxGPT/1.0 (worksheet field extraction)',
  Accept: 'text/html,application/pdf,*/*'
}

function uniqueByCode (items) {
  const seen = new Set()
  const out = []
  for (const item of items) {
    const code = String(item.code || '').trim()
    if (!code || seen.has(code)) continue
    seen.add(code)
    out.push(item)
  }
  return out
}

export function parseSlipBoxCodesFromHtml (html = '') {
  const fields = []
  const text = String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
  const patterns = [
    /[Bb]ox\s+(\d{1,3}[A-Z]?)\s*[-–—:]?\s*([^.<]{4,100})/g,
    /[Cc]ode\s+(\d{1,3}[A-Z]?)\s*[-–—:]?\s*([^.<]{4,100})/g
  ]
  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      fields.push({
        code: match[1],
        label: `Box ${match[1]} — ${String(match[2] || '').trim()}`,
        type: 'currency'
      })
    }
  }
  return uniqueByCode(fields)
}

export function parseSlipBoxCodesFromText (text = '') {
  const fields = []
  const normalized = String(text || '').replace(/\r/g, '\n')

  const patterns = [
    /[Bb]ox\s+(\d{1,3}[A-Z]?)\s*[-–—:]\s*([^\n]{3,120})/g,
    /[Cc]ase\s+(\d{1,3}[A-Z]?)\s*[-–—:]\s*([^\n]{3,120})/g,
    /[Bb]ox\s+(\d{1,3}[A-Z]?)\b/g,
    /\b([A-Z])\s*[-–—]\s*([A-Z][^\n]{4,80})/g
  ]

  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(normalized)) !== null) {
      const code = String(match[1] || '').trim()
      const label = String(match[2] || `Box ${code}`).trim().replace(/\s+/g, ' ')
      if (!code) continue
      fields.push({ code, label, type: /^[A-Z]$/.test(code) ? 'currency' : 'currency' })
    }
  }

  return uniqueByCode(fields)
}

export function parseFormLineFieldsFromText (text = '') {
  const fields = []
  const normalized = String(text || '').replace(/\r/g, '\n')
  const lines = normalized.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const leadingLine = trimmed.match(/^(\d{3,5}[A-Z]?)\s+(.{4,120})$/)
    if (leadingLine) {
      fields.push({
        code: leadingLine[1],
        label: leadingLine[2].replace(/\.+$/, '').trim(),
        type: 'currency'
      })
      continue
    }

    const inlineRefs = trimmed.match(/\b(\d{4,5}[A-Z]?)\b/g)
    if (inlineRefs && /line|amount|income|expense|total|deduction|credit/i.test(trimmed)) {
      for (const code of inlineRefs) {
        fields.push({
          code,
          label: trimmed.slice(0, 120),
          type: 'currency'
        })
      }
    }
  }

  const partMarkers = normalized.match(/\b([3-9][A-Z]|[1-9]\d?[A-Z]?)\b/g) || []
  for (const code of partMarkers) {
    if (/^[3-9][A-Z]$/.test(code)) {
      fields.push({ code, label: `Amount ${code}`, type: 'currency' })
    }
  }

  return uniqueByCode(fields).filter((f) => f.label.length >= 3)
}

export function resolveFillablePdfUrls (html = '', landingUrl = '') {
  const urls = new Set()
  const base = new URL(landingUrl)

  const hrefPattern = /href=["']([^"']+\.pdf[^"']*)["']/gi
  let match
  while ((match = hrefPattern.exec(html)) !== null) {
    const href = match[1]
    if (!/-fill-/i.test(href) && !/fillable/i.test(href)) continue
    try {
      urls.add(new URL(href, base).toString())
    } catch {}
  }

  const code = base.pathname.split('/').pop()?.replace(/\.html$/i, '') || ''
  if (code) {
    const year = new Date().getFullYear() % 100
    const candidates = [
      `${code}-fill-${year}e.pdf`,
      `${code}-fill-${year}.pdf`,
      `${code}-fill.pdf`
    ]
    for (const name of candidates) {
      try {
        urls.add(new URL(name, `${base.origin}${base.pathname.replace(/[^/]+$/, '')}`).toString())
      } catch {}
    }
  }

  return Array.from(urls)
}

export async function fetchText (url) {
  const response = await fetch(url, { headers: FETCH_HEADERS, redirect: 'follow' })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`)
  }
  const contentType = String(response.headers.get('content-type') || '').toLowerCase()
  const buffer = Buffer.from(await response.arrayBuffer())
  if (contentType.includes('pdf') || url.toLowerCase().endsWith('.pdf')) {
    const parsed = await pdfParse(buffer)
    return { kind: 'pdf', text: parsed.text || '', url }
  }
  return { kind: 'html', text: buffer.toString('utf8'), url }
}

export async function extractWorksheetFieldsFromLandingUrl (landingUrl, { worksheetKind = 'form' } = {}) {
  const landing = String(landingUrl || '').trim()
  if (!landing) {
    return { fields: [], sourceUrl: null, error: 'missing_landing_url' }
  }

  try {
    const landingDoc = await fetchText(landing)
    let pdfText = ''
    let sourceUrl = landing

    if (landingDoc.kind === 'pdf') {
      pdfText = landingDoc.text
      sourceUrl = landingDoc.url
    } else {
      const pdfUrls = resolveFillablePdfUrls(landingDoc.text, landing)
      for (const pdfUrl of pdfUrls) {
        try {
          const pdfDoc = await fetchText(pdfUrl)
          if (pdfDoc.text && pdfDoc.text.length > pdfText.length) {
            pdfText = pdfDoc.text
            sourceUrl = pdfUrl
          }
        } catch {
          // try next candidate
        }
      }
    }

    const fields = []
    if (worksheetKind === 'slip') {
      if (pdfText) fields.push(...parseSlipBoxCodesFromText(pdfText))
      if (landingDoc.kind === 'html') fields.push(...parseSlipBoxCodesFromHtml(landingDoc.text))
      const unique = uniqueByCode(fields)
      return {
        fields: unique,
        sourceUrl,
        error: unique.length ? null : (pdfText ? 'no_fields_parsed' : 'no_extractable_source')
      }
    }

    if (pdfText) fields.push(...parseFormLineFieldsFromText(pdfText))
    if (landingDoc.kind === 'html') {
      fields.push(...parseFormLineFieldsFromText(landingDoc.text.replace(/<[^>]+>/g, '\n')))
    }
    const unique = uniqueByCode(fields)
    return {
      fields: unique,
      sourceUrl,
      error: unique.length ? null : (pdfText ? 'no_fields_parsed' : 'no_extractable_source')
    }
  } catch (error) {
    return {
      fields: [],
      sourceUrl: null,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}
