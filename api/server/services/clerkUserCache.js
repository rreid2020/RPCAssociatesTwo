const CACHE_TTL_MS = 5 * 60 * 1000
const cache = new Map()

function isFresh (entry) {
  return Boolean(entry && Date.now() - entry.cachedAt < CACHE_TTL_MS)
}

export function getCachedClerkUser (clerkUserId) {
  const key = String(clerkUserId || '').trim()
  if (!key) return null
  const entry = cache.get(key)
  return isFresh(entry) ? entry.user : null
}

export function setCachedClerkUser (clerkUserId, user) {
  const key = String(clerkUserId || '').trim()
  if (!key) return
  cache.set(key, { user, cachedAt: Date.now() })
}

export async function resolveClerkUser (client, clerkUserId) {
  const key = String(clerkUserId || '').trim()
  if (!key) return null
  const cached = getCachedClerkUser(key)
  if (cached) return cached
  const user = await client.users.getUser(key)
  setCachedClerkUser(key, user)
  return user
}

export async function mapWithConcurrency (items, concurrency, worker) {
  const list = Array.isArray(items) ? items : []
  if (list.length === 0) return []
  const limit = Math.max(1, Number(concurrency) || 1)
  const results = new Array(list.length)
  let nextIndex = 0

  async function runWorker () {
    while (nextIndex < list.length) {
      const currentIndex = nextIndex
      nextIndex += 1
      results[currentIndex] = await worker(list[currentIndex], currentIndex)
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, list.length) }, () => runWorker()))
  return results
}
