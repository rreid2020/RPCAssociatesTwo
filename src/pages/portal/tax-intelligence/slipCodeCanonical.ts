/** Keep in sync with api/server/lib/taxSlips/slipCodeCanonical.js */
const SLIP_CODE_ALIASES: Record<string, string> = {
  T4AP: 'T4A(P)',
  T4AOAS: 'T4A(OAS)',
  T4ARCA: 'T4A-RCA',
  'RL-1': 'RL1',
  'RL-2': 'RL2',
  'RL-3': 'RL3',
  'RL-5': 'RL5',
  'RL-6': 'RL6'
}

export function normalizeSlipCodeKey (value: string): string {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '')
}

export function canonicalSlipCode (value: string): string {
  const normalized = normalizeSlipCodeKey(value)
  if (!normalized) return ''
  return SLIP_CODE_ALIASES[normalized] || normalized
}

export function dedupeCanonicalSlipCodes (codes: string[] = []): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of codes) {
    const canonical = canonicalSlipCode(raw)
    if (!canonical || seen.has(canonical)) continue
    seen.add(canonical)
    out.push(canonical)
  }
  return out
}
