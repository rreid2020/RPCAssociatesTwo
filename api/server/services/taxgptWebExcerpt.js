const NAV_BOILERPLATE_PATTERNS = [
  /skip to main content/i,
  /skip to "about government"/i,
  /skip to &#34;about government&#34;/i,
  /language selection/i,
  /gouvernement du canada/i,
  /government of canada/i,
  /search canada\.ca/i,
  /search menu/i,
  /main menu/i,
  /accessibility statement/i,
  /jobs and the workplace/i,
  /immigration and citizenship/i,
  /travel and tourism/i,
  /business and industry/i,
  /benefits and taxes/i,
  /find information on/i,
  /birth, adoption, death, marriage and divorce/i,
  /british columbians and our governments/i,
  /employment, business and economic development/i
]

const LEGISLATION_URL_PATTERNS = [
  /canlii\.(org|ca)\/[^?#]*\/(laws|regu|stat|regulations)\b/i,
  /laws-lois\.justice\.gc\.ca/i,
  /\/statute|\/acts\//i,
  /e-laws\.gov\.on\.ca/i,
  /legisquebec\.gouv\.qc\.ca/i,
  /bclaws\.gov\.bc\.ca/i,
  /qp\.alberta\.ca/i,
  /publications\.saskatchewan\.ca/i,
  /laws_regs\.gov\.sk\.ca/i,
  /web2\.gov\.mb\.ca\/laws/i,
  /nslegislature\.ca/i,
  /laws\.gnb\.ca/i,
  /assembly\.nl\.ca\/legislation/i,
  /assembly\.pe\.ca/i,
  /legislation\.yukon\.ca/i,
  /justice\.gov\.nt\.ca/i
]

const CASE_LAW_URL_PATTERNS = [
  /canlii\.(org|ca)\/(en|fr)\/[a-z]{2}\/(scc|fca|fct|tcc|on|bc|ab|qc|mb|sk|ns|nb|nl|pe|yt|nt|nu)\//i,
  /decisions\.(fct-cf|fca-caf)\.gc\.ca/i,
  /taxcourt\.gc\.ca/i,
  /scc-csc\.lexum\.com/i,
  /ontariocourts\.ca/i,
  /bccourts\.ca/i,
  /albertacourts\.ca/i,
  /tribunaux\.qc\.ca/i
]

function normalizeWhitespace (text) {
  return String(text || '').replace(/\s+/g, ' ').trim()
}

export function decodeHtmlEntities (text) {
  return String(text || '')
    .replace(/&#(\d+);/g, (_, code) => {
      const value = Number(code)
      return Number.isFinite(value) ? String.fromCharCode(value) : ''
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const value = parseInt(hex, 16)
      return Number.isFinite(value) ? String.fromCharCode(value) : ''
    })
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&ldquo;/gi, '"')
    .replace(/&rdquo;/gi, '"')
    .replace(/&ccedil;/gi, 'ç')
    .replace(/&eacute;/gi, 'é')
}

export function isGovNavigationBoilerplate (text) {
  const normalized = decodeHtmlEntities(normalizeWhitespace(text))
  if (!normalized) return false

  let hits = 0
  for (const pattern of NAV_BOILERPLATE_PATTERNS) {
    if (pattern.test(normalized)) hits += 1
  }

  if (hits >= 3) return true
  if (/skip to main content/i.test(normalized) && /main menu/i.test(normalized)) return true
  if (/language selection/i.test(normalized) && /search menu/i.test(normalized)) return true
  if (/skip to main content/i.test(normalized) && /jobs and the workplace/i.test(normalized)) return true

  return false
}

export function cleanWebExcerpt (text, maxLength = 1200) {
  let cleaned = decodeHtmlEntities(normalizeWhitespace(text))
  if (!cleaned) return ''

  cleaned = cleaned.replace(
    /^(.{0,500}?(skip to main content|language selection|main menu|search menu|accessibility statement)[^.]{0,240}\.?)\s*/gi,
    ''
  )

  if (isGovNavigationBoilerplate(cleaned)) return ''
  if (cleaned.length <= maxLength) return cleaned
  return `${cleaned.slice(0, maxLength).trim()}…`
}

export function isLegislationStatuteUrl (url) {
  const value = String(url || '')
  return LEGISLATION_URL_PATTERNS.some((pattern) => pattern.test(value))
}

export function isCaseLawDecisionUrl (url, title = '') {
  const value = String(url || '')
  const normalizedTitle = String(title || '')
  if (CASE_LAW_URL_PATTERNS.some((pattern) => pattern.test(value))) return true
  if (/canlii\.(org|ca)/i.test(value) && !isLegislationStatuteUrl(value)) {
    return /\bv\.\s|re:\s/i.test(normalizedTitle)
  }
  return false
}

export function extractMainContentHtml (html) {
  const source = String(html || '')
  const mainMatch = source.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
  if (mainMatch?.[1] && mainMatch[1].length > 200) return mainMatch[1]
  const articleMatch = source.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
  if (articleMatch?.[1] && articleMatch[1].length > 200) return articleMatch[1]
  return source
}
