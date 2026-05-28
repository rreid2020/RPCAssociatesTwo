import { portalFetch } from '../../lib/portalApi'

export type EngagementWorkbookExport = {
  fileName: string
  mimeType: string
  base64Content: string
}

export async function exportEngagementWorkbookDomain (getToken: () => Promise<string | null>, engagementId: string) {
  return portalFetch<EngagementWorkbookExport>(`/v1/accounting/engagements/${engagementId}/export-workbook`, getToken)
}

export function downloadBase64File (payload: EngagementWorkbookExport) {
  const binary = window.atob(payload.base64Content)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index)
  }
  const blob = new Blob([bytes], { type: payload.mimeType })
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = payload.fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.URL.revokeObjectURL(url)
}

