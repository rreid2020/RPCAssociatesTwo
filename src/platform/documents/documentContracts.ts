export type DocumentClassification = 'source' | 'working_paper' | 'support' | 'tax' | 'other'

export interface WorkspaceDocumentRecord {
  id: string
  workspaceId: string
  classification: DocumentClassification
  fileName: string
  createdAt: string
}

export interface DocumentExtractionRequest {
  workspaceId: string
  documentId: string
  extractionProfile: string
}
