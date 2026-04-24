/**
 * Form endpoints return JSON. If a static host returns HTML (SPA fallback) or
 * the API is down, this surfaces a clear error instead of a false success.
 */
export async function parseFormApiJson<T extends Record<string, unknown> = Record<string, unknown>> (
  response: Response
): Promise<T> {
  const text = await response.text()
  try {
    return JSON.parse(text) as T
  } catch {
    const preview = text.replace(/\s+/g, ' ').trim().slice(0, 80)
    throw new Error(
      'Form could not be sent: the server did not return JSON. ' +
        (preview.startsWith('<!') || preview.startsWith('<html')
          ? 'The /api app may be missing in production — check that POST /api/contact is routed to the API service, not static hosting only.'
          : 'Check that the API is running and /api/health responds.')
    )
  }
}
