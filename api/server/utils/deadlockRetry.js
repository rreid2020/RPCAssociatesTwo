export function isDeadlockError (error) {
  const message = String(error?.message || '').toLowerCase()
  return message.includes('deadlock detected')
}

export async function withDeadlockRetry (operation, retries = 3, waitMs = 50) {
  let attempt = 0
  while (true) {
    try {
      return await operation()
    } catch (error) {
      if (!isDeadlockError(error) || attempt >= retries) throw error
      attempt += 1
      await new Promise((resolve) => setTimeout(resolve, waitMs * attempt))
    }
  }
}
