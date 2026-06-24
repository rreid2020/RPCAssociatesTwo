/** True when a value is a CRA slip box or form line reference (not an internal field key). */
export function isCraWorksheetLineOrBoxRef (value: string | undefined): boolean {
  const ref = String(value || '').trim()
  if (!ref) return false
  if (/[_\s]/.test(ref)) return false
  if (/^[A-Z]$/i.test(ref)) return true
  if (/^[A-Za-z]{2,}/.test(ref) && !/^\d/.test(ref)) return false
  if (/^\d{1,3}[A-Z]{0,2}$/i.test(ref)) return true
  if (/^\d{4,5}$/.test(ref)) return true
  if (/^\d{1,2}[A-Z]$/i.test(ref)) return true
  return false
}

export function worksheetLineOrBoxBadge (
  boxCode?: string,
  lineRef?: string
): string | undefined {
  if (boxCode && isCraWorksheetLineOrBoxRef(boxCode)) return boxCode
  if (lineRef && isCraWorksheetLineOrBoxRef(lineRef)) return lineRef
  return undefined
}
