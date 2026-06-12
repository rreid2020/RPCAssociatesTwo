export function isDatabaseCapacityError (error) {
  const code = error?.code
  const message = error instanceof Error ? error.message : String(error ?? '')
  return code === '53300'
    || message.includes('remaining connection slots')
    || message.includes('too many connections')
    || message.includes('too many clients already')
}

export function isTransientDatabaseError (error) {
  const message = error instanceof Error ? error.message : String(error ?? '')
  const lower = message.toLowerCase()
  return isDatabaseCapacityError(error)
    || lower.includes('connection terminated')
    || lower.includes('connection timeout')
    || lower.includes('timeout exceeded')
}

export function databaseErrorStatus (error) {
  return isTransientDatabaseError(error) ? 503 : 400
}
