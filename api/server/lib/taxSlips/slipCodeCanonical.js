/**
 * Canonical CRA information slip codes. Some registry / legacy paths use
 * punctuation-free aliases (T4AP) for the same slip as the official code (T4A(P)).
 */

export const SLIP_CODE_ALIASES = Object.freeze({
  T4AP: 'T4A(P)',
  T4AOAS: 'T4A(OAS)',
  T4ARCA: 'T4A-RCA',
  'RL-1': 'RL1',
  'RL-2': 'RL2',
  'RL-3': 'RL3',
  'RL-5': 'RL5',
  'RL-6': 'RL6'
})

export const DEPRECATED_SLIP_FORM_NUMBERS = new Set(Object.keys(SLIP_CODE_ALIASES))

export function normalizeSlipCodeKey (value) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '')
}

export function canonicalSlipCode (value) {
  const normalized = normalizeSlipCodeKey(value)
  if (!normalized) return ''
  return SLIP_CODE_ALIASES[normalized] || normalized
}

export function isDeprecatedSlipAlias (value) {
  return DEPRECATED_SLIP_FORM_NUMBERS.has(normalizeSlipCodeKey(value))
}

export function dedupeCanonicalSlipCodes (codes = []) {
  const seen = new Set()
  const out = []
  for (const raw of codes) {
    const canonical = canonicalSlipCode(raw)
    if (!canonical || seen.has(canonical)) continue
    seen.add(canonical)
    out.push(canonical)
  }
  return out
}

export function attachSlipSchemaAliases (schemasByCode = {}) {
  const next = { ...schemasByCode }
  for (const [alias, canonical] of Object.entries(SLIP_CODE_ALIASES)) {
    const upperCanonical = canonicalSlipCode(canonical)
    const upperAlias = normalizeSlipCodeKey(alias)
    if (next[upperCanonical] && !next[upperAlias]) {
      next[upperAlias] = next[upperCanonical]
    }
  }
  return next
}
