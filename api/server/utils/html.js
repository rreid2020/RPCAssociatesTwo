/**
 * Escape text for use inside HTML email bodies (values from public forms).
 */
export function escapeHtml (value) {
  if (value == null) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Single-line string safe for email Subject (no newlines, trimmed length). */
export function singleLine (value, max = 200) {
  if (value == null) return ''
  return String(value).replace(/[\r\n]+/g, ' ').trim().slice(0, max)
}
