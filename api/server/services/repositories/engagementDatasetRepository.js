export async function fetchEngagementForDataset (pool, engagementId, workspaceId) {
  const { rows } = await pool.query(
    `SELECT id, workspace_id, name
     FROM taxgpt.accounting_engagements
     WHERE id = $1::uuid AND workspace_id = $2::uuid`,
    [engagementId, workspaceId]
  )
  return rows[0] || null
}

export async function listDatasetsForEngagement (pool, engagementId, workspaceId) {
  const { rows } = await pool.query(
    `SELECT *
     FROM taxgpt.engagement_datasets
     WHERE engagement_id = $1::uuid
       AND workspace_id = $2::uuid
       AND deleted_at IS NULL
     ORDER BY updated_at DESC, name ASC`,
    [engagementId, workspaceId]
  )
  return rows
}

export async function fetchDatasetById (pool, datasetId, workspaceId) {
  const { rows } = await pool.query(
    `SELECT *
     FROM taxgpt.engagement_datasets
     WHERE id = $1::uuid
       AND workspace_id = $2::uuid
       AND deleted_at IS NULL`,
    [datasetId, workspaceId]
  )
  return rows[0] || null
}

export async function insertDataset (pool, payload) {
  const { rows } = await pool.query(
    `INSERT INTO taxgpt.engagement_datasets
     (workspace_id, engagement_id, name, description, dataset_type, status, header_row_index, column_schema, row_count, source_file_name, created_by, updated_by, created_at, updated_at)
     VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11, $11, now(), now())
     RETURNING *`,
    [
      payload.workspaceId,
      payload.engagementId,
      payload.name,
      payload.description || null,
      payload.datasetType || 'custom',
      payload.status || 'draft',
      payload.headerRowIndex ?? 0,
      JSON.stringify(payload.columnSchema || []),
      payload.rowCount ?? 0,
      payload.sourceFileName || null,
      payload.actorId
    ]
  )
  return rows[0]
}

export async function updateDatasetRecord (pool, datasetId, workspaceId, payload) {
  const { rows } = await pool.query(
    `UPDATE taxgpt.engagement_datasets
     SET name = COALESCE($3, name),
         description = COALESCE($4, description),
         dataset_type = COALESCE($5, dataset_type),
         status = COALESCE($6, status),
         header_row_index = COALESCE($7, header_row_index),
         column_schema = COALESCE($8::jsonb, column_schema),
         row_count = COALESCE($9, row_count),
         source_file_name = COALESCE($10, source_file_name),
         latest_import_batch_id = COALESCE($11::uuid, latest_import_batch_id),
         updated_by = $12,
         updated_at = now()
     WHERE id = $1::uuid AND workspace_id = $2::uuid AND deleted_at IS NULL
     RETURNING *`,
    [
      datasetId,
      workspaceId,
      payload.name ?? null,
      payload.description ?? null,
      payload.datasetType ?? null,
      payload.status ?? null,
      payload.headerRowIndex ?? null,
      payload.columnSchema ? JSON.stringify(payload.columnSchema) : null,
      payload.rowCount ?? null,
      payload.sourceFileName ?? null,
      payload.latestImportBatchId ?? null,
      payload.actorId
    ]
  )
  return rows[0] || null
}

export async function softDeleteDataset (pool, datasetId, workspaceId, actorId) {
  const { rows } = await pool.query(
    `UPDATE taxgpt.engagement_datasets
     SET deleted_at = now(), updated_by = $3, updated_at = now(), status = 'archived'
     WHERE id = $1::uuid AND workspace_id = $2::uuid AND deleted_at IS NULL
     RETURNING *`,
    [datasetId, workspaceId, actorId]
  )
  return rows[0] || null
}

export async function deleteDatasetRows (pool, datasetId, workspaceId) {
  await pool.query(
    `DELETE FROM taxgpt.engagement_dataset_rows
     WHERE dataset_id = $1::uuid AND workspace_id = $2::uuid`,
    [datasetId, workspaceId]
  )
}

export async function insertDatasetRows (pool, datasetId, workspaceId, rows) {
  for (const row of rows) {
    await pool.query(
      `INSERT INTO taxgpt.engagement_dataset_rows
       (dataset_id, workspace_id, source_row_number, row_data, created_at)
       VALUES ($1::uuid, $2::uuid, $3, $4::jsonb, now())`,
      [datasetId, workspaceId, row.sourceRowNumber, JSON.stringify(row.rowData)]
    )
  }
}

export async function listDatasetRows (pool, datasetId, workspaceId, { limit = 100, offset = 0 } = {}) {
  const { rows } = await pool.query(
    `SELECT id, source_row_number, row_data, created_at
     FROM taxgpt.engagement_dataset_rows
     WHERE dataset_id = $1::uuid AND workspace_id = $2::uuid
     ORDER BY source_row_number ASC
     LIMIT $3 OFFSET $4`,
    [datasetId, workspaceId, limit, offset]
  )
  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM taxgpt.engagement_dataset_rows
     WHERE dataset_id = $1::uuid AND workspace_id = $2::uuid`,
    [datasetId, workspaceId]
  )
  return {
    rows,
    total: countResult.rows[0]?.total ?? 0
  }
}

export async function insertDatasetImportBatch (pool, payload) {
  const { rows } = await pool.query(
    `INSERT INTO taxgpt.engagement_dataset_import_batches
     (dataset_id, workspace_id, engagement_id, file_name, file_type, header_row_index, column_schema, column_mapping, warning_summary, total_rows, imported_rows, created_by, created_at)
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7::jsonb, $8::jsonb, $9::jsonb, $10, $11, $12, now())
     RETURNING *`,
    [
      payload.datasetId,
      payload.workspaceId,
      payload.engagementId,
      payload.fileName,
      payload.fileType,
      payload.headerRowIndex ?? 0,
      JSON.stringify(payload.columnSchema || []),
      JSON.stringify(payload.columnMapping || {}),
      JSON.stringify(payload.warningSummary || {}),
      payload.totalRows ?? 0,
      payload.importedRows ?? 0,
      payload.actorId
    ]
  )
  return rows[0]
}

export async function listDatasetViews (pool, datasetId, workspaceId) {
  const { rows } = await pool.query(
    `SELECT *
     FROM taxgpt.engagement_dataset_views
     WHERE dataset_id = $1::uuid AND workspace_id = $2::uuid AND deleted_at IS NULL
     ORDER BY updated_at DESC`,
    [datasetId, workspaceId]
  )
  return rows
}

export async function fetchDatasetViewById (pool, viewId, workspaceId) {
  const { rows } = await pool.query(
    `SELECT *
     FROM taxgpt.engagement_dataset_views
     WHERE id = $1::uuid AND workspace_id = $2::uuid AND deleted_at IS NULL`,
    [viewId, workspaceId]
  )
  return rows[0] || null
}

export async function insertDatasetView (pool, payload) {
  const { rows } = await pool.query(
    `INSERT INTO taxgpt.engagement_dataset_views
     (dataset_id, workspace_id, engagement_id, name, description, config, created_by, updated_by, created_at, updated_at)
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6::jsonb, $7, $7, now(), now())
     RETURNING *`,
    [
      payload.datasetId,
      payload.workspaceId,
      payload.engagementId,
      payload.name,
      payload.description || null,
      JSON.stringify(payload.config || {}),
      payload.actorId
    ]
  )
  return rows[0]
}

export async function updateDatasetViewRecord (pool, viewId, workspaceId, payload) {
  const { rows } = await pool.query(
    `UPDATE taxgpt.engagement_dataset_views
     SET name = COALESCE($3, name),
         description = COALESCE($4, description),
         config = COALESCE($5::jsonb, config),
         updated_by = $6,
         updated_at = now()
     WHERE id = $1::uuid AND workspace_id = $2::uuid AND deleted_at IS NULL
     RETURNING *`,
    [
      viewId,
      workspaceId,
      payload.name ?? null,
      payload.description ?? null,
      payload.config ? JSON.stringify(payload.config) : null,
      payload.actorId
    ]
  )
  return rows[0] || null
}

export async function softDeleteDatasetView (pool, viewId, workspaceId, actorId) {
  const { rows } = await pool.query(
    `UPDATE taxgpt.engagement_dataset_views
     SET deleted_at = now(), updated_by = $3, updated_at = now()
     WHERE id = $1::uuid AND workspace_id = $2::uuid AND deleted_at IS NULL
     RETURNING *`,
    [viewId, workspaceId, actorId]
  )
  return rows[0] || null
}

export async function listWorkspaceImportTemplates (pool, workspaceId) {
  const { rows } = await pool.query(
    `SELECT *
     FROM taxgpt.workspace_dataset_import_templates
     WHERE workspace_id = $1::uuid AND deleted_at IS NULL
     ORDER BY name ASC`,
    [workspaceId]
  )
  return rows
}

export async function insertWorkspaceImportTemplate (pool, payload) {
  const { rows } = await pool.query(
    `INSERT INTO taxgpt.workspace_dataset_import_templates
     (workspace_id, name, dataset_type, header_row_index, column_schema, mapping_hints, created_by, updated_by, created_at, updated_at)
     VALUES ($1::uuid, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $7, now(), now())
     RETURNING *`,
    [
      payload.workspaceId,
      payload.name,
      payload.datasetType || 'custom',
      payload.headerRowIndex ?? null,
      JSON.stringify(payload.columnSchema || []),
      JSON.stringify(payload.mappingHints || {}),
      payload.actorId
    ]
  )
  return rows[0]
}
