import { callPortalApi, type TokenProvider } from '../api/client'
import type { DocumentSummary } from '../../types/documents'

export async function listEngagementDocuments (
  engagementId: string,
  getToken: TokenProvider,
  leadSheetId?: string
): Promise<DocumentSummary[]> {
  const query = leadSheetId ? `?leadSheetId=${encodeURIComponent(leadSheetId)}` : ''
  const data = await callPortalApi<{ documents: any[] }>(`/v1/accounting/engagements/${engagementId}/documents${query}`, getToken)
  return (data.documents || []).map((row) => ({
    id: row.id,
    fileName: row.file_name,
    source: row.source,
    uploadedAt: row.uploaded_at
  }))
}

