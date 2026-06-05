import { portalFetch } from '../../lib/portalApi'

export type DatasetColumnSchema = {
  key: string
  label: string
  dataType: 'text' | 'number' | 'currency' | 'date' | 'boolean'
  sourceColumn: string
}

export type EngagementDataset = {
  id: string
  name: string
  description?: string | null
  dataset_type: string
  status: string
  header_row_index: number
  column_schema: DatasetColumnSchema[]
  row_count: number
  source_file_name?: string | null
}

export type DatasetPreview = {
  columns: string[]
  columnSchema: DatasetColumnSchema[]
  needsMapping?: boolean
  headerRowIndex?: number
  filePreview?: Array<{ rowNumber: number; cells: string[] }>
  headerRowCandidates?: Array<{ rowNumber: number; label: string; usable: boolean }>
  previewRows: Array<{ sourceRowNumber: number; rowData: Record<string, unknown> }>
  summary: { totalRows: number; previewRows: number; warningCount: number }
  warnings: Array<{ type: string; message: string }>
}

export async function listEngagementDatasetsDomain (
  getToken: () => Promise<string | null>,
  engagementId: string
) {
  return portalFetch<{ datasets: EngagementDataset[] }>(
    `/v1/accounting/engagements/${engagementId}/datasets`,
    getToken
  )
}

export async function createEngagementDatasetDomain (
  getToken: () => Promise<string | null>,
  engagementId: string,
  payload: { name: string; description?: string; datasetType?: string }
) {
  return portalFetch<{ dataset: EngagementDataset }>(
    `/v1/accounting/engagements/${engagementId}/datasets`,
    getToken,
    { method: 'POST', body: JSON.stringify(payload) }
  )
}

export async function previewDatasetImportDomain (
  getToken: () => Promise<string | null>,
  engagementId: string,
  payload: Record<string, unknown>
) {
  return portalFetch<DatasetPreview>(
    `/v1/accounting/engagements/${engagementId}/datasets/preview`,
    getToken,
    { method: 'POST', body: JSON.stringify(payload) }
  )
}

export async function importDatasetRowsDomain (
  getToken: () => Promise<string | null>,
  engagementId: string,
  datasetId: string,
  payload: Record<string, unknown>
) {
  return portalFetch(
    `/v1/accounting/engagements/${engagementId}/datasets/${datasetId}/import`,
    getToken,
    { method: 'POST', body: JSON.stringify(payload) }
  )
}

export async function listDatasetRowsDomain (
  getToken: () => Promise<string | null>,
  engagementId: string,
  datasetId: string,
  query?: { limit?: number; offset?: number }
) {
  const params = new URLSearchParams()
  if (query?.limit) params.set('limit', String(query.limit))
  if (query?.offset) params.set('offset', String(query.offset))
  const suffix = params.toString() ? `?${params.toString()}` : ''
  return portalFetch<{ dataset: EngagementDataset; rows: Array<{ id: string; source_row_number: number; row_data: Record<string, unknown> }>; total: number }>(
    `/v1/accounting/engagements/${engagementId}/datasets/${datasetId}/rows${suffix}`,
    getToken
  )
}

export async function listDatasetViewsDomain (
  getToken: () => Promise<string | null>,
  engagementId: string,
  datasetId: string
) {
  return portalFetch<{ views: Array<{ id: string; name: string; config: Record<string, unknown> }> }>(
    `/v1/accounting/engagements/${engagementId}/datasets/${datasetId}/views`,
    getToken
  )
}

export async function createDatasetViewDomain (
  getToken: () => Promise<string | null>,
  engagementId: string,
  datasetId: string,
  payload: { name: string; description?: string; config?: Record<string, unknown> }
) {
  return portalFetch(
    `/v1/accounting/engagements/${engagementId}/datasets/${datasetId}/views`,
    getToken,
    { method: 'POST', body: JSON.stringify(payload) }
  )
}

export type DatasetImportTemplate = {
  id: string
  name: string
  dataset_type: string
  header_row_index?: number | null
  column_schema: DatasetColumnSchema[]
}

export async function listDatasetImportTemplatesDomain (
  getToken: () => Promise<string | null>
) {
  return portalFetch<{ templates: DatasetImportTemplate[] }>(
    '/v1/accounting/workspace/dataset-import-templates',
    getToken
  )
}

export async function createDatasetImportTemplateDomain (
  getToken: () => Promise<string | null>,
  payload: {
    name: string
    datasetType?: string
    headerRowIndex?: number
    columnSchema: DatasetColumnSchema[]
  }
) {
  return portalFetch<{ template: DatasetImportTemplate }>(
    '/v1/accounting/workspace/dataset-import-templates',
    getToken,
    { method: 'POST', body: JSON.stringify(payload) }
  )
}

export async function archiveDatasetViewDomain (
  getToken: () => Promise<string | null>,
  engagementId: string,
  datasetId: string,
  viewId: string
) {
  return portalFetch(
    `/v1/accounting/engagements/${engagementId}/datasets/${datasetId}/views/${viewId}`,
    getToken,
    { method: 'DELETE' }
  )
}

export async function executeDatasetViewDomain (
  getToken: () => Promise<string | null>,
  engagementId: string,
  datasetId: string,
  viewId: string
) {
  return portalFetch<{ rows: Array<{ sourceRowNumber: number; rowData: Record<string, unknown> }>; summary: { inputRows: number; outputRows: number } }>(
    `/v1/accounting/engagements/${engagementId}/datasets/${datasetId}/views/${viewId}/execute`,
    getToken,
    { method: 'POST', body: JSON.stringify({}) }
  )
}
