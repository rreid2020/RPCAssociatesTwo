import { logAccountingAudit } from './workingPapersService.js'
import {
  parseDatasetFile,
  previewDatasetImport,
  validateDatasetType
} from './datasetImportService.js'
import { mapRowToSchema } from './spreadsheetImportService.js'
import {
  deleteDatasetRows,
  fetchDatasetById,
  fetchEngagementForDataset,
  insertDataset,
  insertDatasetImportBatch,
  insertDatasetRows,
  listDatasetRows,
  insertWorkspaceImportTemplate,
  listDatasetsForEngagement,
  listWorkspaceImportTemplates,
  softDeleteDataset,
  updateDatasetRecord
} from './repositories/engagementDatasetRepository.js'

function sanitizeText (value) {
  return String(value ?? '').replace(/[\u0000-\u001f]/g, '').trim()
}

export async function listEngagementDatasets (pool, engagementId, workspaceId) {
  const engagement = await fetchEngagementForDataset(pool, engagementId, workspaceId)
  if (!engagement) return null
  const datasets = await listDatasetsForEngagement(pool, engagementId, workspaceId)
  return { engagement, datasets }
}

export async function getEngagementDataset (pool, datasetId, workspaceId) {
  return fetchDatasetById(pool, datasetId, workspaceId)
}

export async function createEngagementDataset (pool, clerkUserId, actorId, engagementId, payload) {
  const engagement = await fetchEngagementForDataset(pool, engagementId, payload.workspaceId)
  if (!engagement) return null

  const name = sanitizeText(payload.name)
  if (!name) throw new Error('Dataset name is required.')

  const dataset = await insertDataset(pool, {
    workspaceId: payload.workspaceId,
    engagementId,
    name,
    description: sanitizeText(payload.description) || null,
    datasetType: validateDatasetType(payload.datasetType),
    status: 'draft',
    columnSchema: payload.columnSchema || [],
    actorId
  })

  await logAccountingAudit(pool, clerkUserId, actorId, 'engagement_dataset', dataset.id, 'created', null, dataset)
  return dataset
}

export async function updateEngagementDataset (pool, clerkUserId, actorId, datasetId, payload) {
  const before = await fetchDatasetById(pool, datasetId, payload.workspaceId)
  if (!before) return null

  const dataset = await updateDatasetRecord(pool, datasetId, payload.workspaceId, {
    name: payload.name ? sanitizeText(payload.name) : null,
    description: payload.description != null ? sanitizeText(payload.description) : null,
    datasetType: payload.datasetType ? validateDatasetType(payload.datasetType) : null,
    columnSchema: payload.columnSchema,
    headerRowIndex: payload.headerRowIndex,
    actorId
  })

  await logAccountingAudit(pool, clerkUserId, actorId, 'engagement_dataset', datasetId, 'updated', before, dataset)
  return dataset
}

export async function archiveEngagementDataset (pool, clerkUserId, actorId, datasetId, workspaceId) {
  const before = await fetchDatasetById(pool, datasetId, workspaceId)
  if (!before) return null
  const dataset = await softDeleteDataset(pool, datasetId, workspaceId, actorId)
  await logAccountingAudit(pool, clerkUserId, actorId, 'engagement_dataset', datasetId, 'archived', before, dataset)
  return dataset
}

export async function previewEngagementDatasetImport (pool, engagementId, payload) {
  const engagement = await fetchEngagementForDataset(pool, engagementId, payload.workspaceId)
  if (!engagement) return null

  const headerRowIndex = Number.isInteger(payload.headerRowNumber)
    ? Math.max(0, payload.headerRowNumber - 1)
    : Number.isInteger(payload.headerRowIndex)
      ? payload.headerRowIndex
      : null

  const parsed = parseDatasetFile({
    fileName: payload.fileName,
    base64Content: payload.base64Content,
    headerRowIndex
  })

  const preview = previewDatasetImport({
    rows: parsed.rows,
    columns: parsed.columns,
    grid: parsed.grid,
    headerRowIndex: parsed.headerRowIndex,
    columnSchema: payload.columnSchema || []
  })

  return {
    fileType: parsed.fileType,
    ...preview
  }
}

export async function importEngagementDatasetRows (pool, clerkUserId, actorId, datasetId, payload) {
  const dataset = await fetchDatasetById(pool, datasetId, payload.workspaceId)
  if (!dataset) return null

  const headerRowIndex = Number.isInteger(payload.headerRowNumber)
    ? Math.max(0, payload.headerRowNumber - 1)
    : Number.isInteger(payload.headerRowIndex)
      ? payload.headerRowIndex
      : dataset.header_row_index

  const parsed = parseDatasetFile({
    fileName: payload.fileName,
    base64Content: payload.base64Content,
    headerRowIndex
  })

  const columnSchema = Array.isArray(payload.columnSchema) && payload.columnSchema.length
    ? payload.columnSchema
    : dataset.column_schema

  const preview = previewDatasetImport({
    rows: parsed.rows,
    columns: parsed.columns,
    grid: parsed.grid,
    headerRowIndex: parsed.headerRowIndex,
    columnSchema
  })

  if (preview.needsMapping) {
    throw new Error('Dataset column mapping is incomplete. Preview and map columns before importing.')
  }

  await deleteDatasetRows(pool, datasetId, payload.workspaceId)

  const importRows = parsed.rows.map((row, index) => ({
    sourceRowNumber: parsed.headerRowIndex + index + 2,
    rowData: mapRowToSchema(row, columnSchema)
  }))

  await insertDatasetRows(pool, datasetId, payload.workspaceId, importRows)

  const importBatch = await insertDatasetImportBatch(pool, {
    datasetId,
    workspaceId: payload.workspaceId,
    engagementId: dataset.engagement_id,
    fileName: payload.fileName,
    fileType: parsed.fileType,
    headerRowIndex: parsed.headerRowIndex,
    columnSchema,
    columnMapping: Object.fromEntries(columnSchema.map((col) => [col.key, col.sourceColumn])),
    warningSummary: { count: preview.warnings.length, warnings: preview.warnings.slice(0, 50) },
    totalRows: importRows.length,
    importedRows: importRows.length,
    actorId
  })

  const updated = await updateDatasetRecord(pool, datasetId, payload.workspaceId, {
    status: 'imported',
    headerRowIndex: parsed.headerRowIndex,
    columnSchema,
    rowCount: importRows.length,
    sourceFileName: payload.fileName,
    latestImportBatchId: importBatch.id,
    actorId
  })

  await logAccountingAudit(pool, clerkUserId, actorId, 'engagement_dataset', datasetId, 'imported', dataset, {
    importBatchId: importBatch.id,
    rowCount: importRows.length
  })

  return {
    dataset: updated,
    importBatch,
    summary: {
      rowCount: importRows.length,
      warningCount: preview.warnings.length
    }
  }
}

export async function listWorkspaceDatasetTemplates (pool, workspaceId) {
  return listWorkspaceImportTemplates(pool, workspaceId)
}

export async function createWorkspaceDatasetTemplate (pool, clerkUserId, actorId, payload) {
  const name = sanitizeText(payload.name)
  if (!name) throw new Error('Template name is required.')
  const template = await insertWorkspaceImportTemplate(pool, {
    workspaceId: payload.workspaceId,
    name,
    datasetType: validateDatasetType(payload.datasetType),
    headerRowIndex: payload.headerRowIndex,
    columnSchema: payload.columnSchema || [],
    mappingHints: payload.mappingHints || {},
    actorId
  })
  await logAccountingAudit(pool, clerkUserId, actorId, 'dataset_import_template', template.id, 'created', null, template)
  return template
}

export async function getEngagementDatasetRows (pool, datasetId, workspaceId, query = {}) {
  const dataset = await fetchDatasetById(pool, datasetId, workspaceId)
  if (!dataset) return null
  const limit = Math.min(Math.max(Number(query.limit) || 100, 1), 500)
  const offset = Math.max(Number(query.offset) || 0, 0)
  const result = await listDatasetRows(pool, datasetId, workspaceId, { limit, offset })
  return { dataset, ...result }
}
