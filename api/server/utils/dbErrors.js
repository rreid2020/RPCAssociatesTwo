export function isDatabaseCapacityError (error) {
  const code = error?.code
  const message = error instanceof Error ? error.message : String(error ?? '')
  return code === '53300'
    || message.includes('remaining connection slots')
    || message.includes('too many connections')
    || message.includes('too many clients already')
}

export function databaseErrorStatus (error) {
  return isDatabaseCapacityError(error) ? 503 : 400
}
