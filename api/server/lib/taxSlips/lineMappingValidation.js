function normalizeFormNumber (value) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '')
}

export function buildSchemasByCode (schemas = []) {
  const map = {}
  for (const schema of schemas) {
    const code = normalizeFormNumber(schema.formNumber)
    if (!code) continue
    map[code] = schema
  }
  return map
}

export function buildLineMappingIssues (incomeEntries = [], schemasByCode = {}) {
  const issues = []
  for (const entry of incomeEntries) {
    const meta = entry.metadata || {}
    const slipType = normalizeFormNumber(meta.slipType)
    const boxCode = String(meta.boxCode || '').trim().toUpperCase()
    const lineRef = String(meta.lineRef || '')
    const scheduleRef = String(meta.scheduleRef || '')
    if (!slipType || !lineRef) continue

    const def = schemasByCode[slipType]
    const boxDef = (def?.boxes || []).find((b) => String(b.code || '').toUpperCase() === boxCode)
    const expectedCategories = (boxDef?.targets || []).map((t) => t.category)
    const expectedLineRefs = (boxDef?.targets || []).map((t) => String(t.lineRef || '')).filter(Boolean)
    const expectedScheduleRefs = (boxDef?.targets || []).map((t) => String(t.scheduleRef || ''))

    let status = 'OK'
    let reason = 'Mapping matches configured CRA slip box target.'
    if (!def) {
      status = 'REVIEW'
      reason = 'Unknown slip type. Confirm mapping manually.'
    } else if (!boxDef) {
      status = 'REVIEW'
      reason = 'Box is not registered for this slip type.'
    } else if (expectedCategories.length > 0 && !expectedCategories.includes(entry.category)) {
      status = 'REVIEW'
      reason = `Category mismatch. Expected one of: ${expectedCategories.join(', ')}.`
    } else if (expectedLineRefs.length > 0 && !expectedLineRefs.includes(lineRef)) {
      status = 'REVIEW'
      reason = `Line mismatch. Expected one of: ${expectedLineRefs.map((x) => `Line ${x}`).join(', ')}.`
    } else if (scheduleRef && expectedScheduleRefs.length > 0 && !expectedScheduleRefs.includes(scheduleRef)) {
      status = 'REVIEW'
      reason = `Schedule mismatch. Expected one of: ${expectedScheduleRefs.filter(Boolean).join(', ')}.`
    } else if (Number(entry.amount || 0) <= 0) {
      status = 'REVIEW'
      reason = 'Amount should be greater than zero.'
    }

    if (status !== 'REVIEW') continue
    issues.push({
      source: boxCode ? `${slipType} box ${boxCode}` : slipType,
      mappedTo: scheduleRef ? `Line ${lineRef} (${scheduleRef})` : `Line ${lineRef}`,
      category: entry.category,
      amount: Number(entry.amount || 0),
      status,
      reason
    })
  }
  return issues
}
