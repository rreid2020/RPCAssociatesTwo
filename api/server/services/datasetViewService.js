import { logAccountingAudit } from './workingPapersService.js'
import {
  fetchDatasetById,
  fetchDatasetViewById,
  insertDatasetView,
  listDatasetRows,
  listDatasetViews,
  softDeleteDatasetView,
  updateDatasetViewRecord
} from './repositories/engagementDatasetRepository.js'

const FILTER_OPS = new Set(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains', 'starts_with', 'is_empty', 'not_empty'])
const AGG_FNS = new Set(['sum', 'count', 'avg', 'min', 'max'])
const MAX_VIEW_ROWS = 5000

function sanitizeText (value) {
  return String(value ?? '').replace(/[\u0000-\u001f]/g, '').trim()
}

function compareValues (left, op, right) {
  if (op === 'is_empty') return left == null || left === ''
  if (op === 'not_empty') return left != null && left !== ''
  if (op === 'contains') return String(left ?? '').toLowerCase().includes(String(right ?? '').toLowerCase())
  if (op === 'starts_with') return String(left ?? '').toLowerCase().startsWith(String(right ?? '').toLowerCase())
  if (op === 'eq') return left == right
  if (op === 'neq') return left != right
  const ln = Number(left)
  const rn = Number(right)
  if (op === 'gt') return ln > rn
  if (op === 'gte') return ln >= rn
  if (op === 'lt') return ln < rn
  if (op === 'lte') return ln <= rn
  return true
}

function applyFilters (rows, filters = []) {
  if (!filters.length) return rows
  return rows.filter((row) => filters.every((filter) => {
    if (!filter?.column || !FILTER_OPS.has(filter.op)) return true
    return compareValues(row.row_data?.[filter.column], filter.op, filter.value)
  }))
}

function applyCalculatedColumns (rows, calculatedColumns = []) {
  if (!calculatedColumns.length) return rows
  return rows.map((row) => {
    const next = { ...row.row_data }
    for (const calc of calculatedColumns) {
      if (!calc?.key || !calc?.formula) continue
      const formula = String(calc.formula)
      const percentMatch = formula.match(/^([a-zA-Z0-9_]+)\s*\/\s*([a-zA-Z0-9_]+)\s*\*\s*100$/)
      const diffMatch = formula.match(/^([a-zA-Z0-9_]+)\s*-\s*([a-zA-Z0-9_]+)$/)
      if (percentMatch) {
        const denom = Number(next[percentMatch[2]])
        next[calc.key] = denom ? (Number(next[percentMatch[1]]) / denom) * 100 : null
      } else if (diffMatch) {
        next[calc.key] = Number(next[diffMatch[1]]) - Number(next[diffMatch[2]])
      }
    }
    return { ...row, row_data: next }
  })
}

function applyGroupBy (rows, groupBy = [], aggregations = []) {
  if (!groupBy.length) return rows
  const groups = new Map()
  for (const row of rows) {
    const key = groupBy.map((col) => String(row.row_data?.[col] ?? '')).join('||')
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(row)
  }

  const result = []
  for (const [, groupRows] of groups) {
    const base = { row_data: {} }
    for (const col of groupBy) {
      base.row_data[col] = groupRows[0]?.row_data?.[col] ?? null
    }
    for (const agg of aggregations) {
      if (!agg?.column || !AGG_FNS.has(agg.fn)) continue
      const values = groupRows.map((row) => Number(row.row_data?.[agg.column])).filter((n) => Number.isFinite(n))
      const alias = agg.alias || `${agg.fn}_${agg.column}`
      if (agg.fn === 'count') base.row_data[alias] = groupRows.length
      else if (agg.fn === 'sum') base.row_data[alias] = values.reduce((sum, n) => sum + n, 0)
      else if (agg.fn === 'avg') base.row_data[alias] = values.length ? values.reduce((s, n) => s + n, 0) / values.length : null
      else if (agg.fn === 'min') base.row_data[alias] = values.length ? Math.min(...values) : null
      else if (agg.fn === 'max') base.row_data[alias] = values.length ? Math.max(...values) : null
    }
    result.push(base)
  }
  return result
}

export function mergeLeftJoinRows (localRows, foreignRows, { localColumn, foreignColumn, prefix = 'join_' }) {
  if (!localColumn || !foreignColumn) return localRows
  const index = new Map()
  for (const row of foreignRows) {
    const key = String(row.row_data?.[foreignColumn] ?? '')
    if (!index.has(key)) index.set(key, [])
    index.get(key).push(row.row_data)
  }

  const result = []
  for (const row of localRows) {
    const key = String(row.row_data?.[localColumn] ?? '')
    const matches = index.get(key)
    if (!matches?.length) {
      result.push(row)
      continue
    }
    for (const match of matches) {
      const merged = { ...row.row_data }
      for (const [columnKey, value] of Object.entries(match)) {
        merged[`${prefix}${columnKey}`] = value
      }
      result.push({ ...row, row_data: merged })
    }
  }
  return result
}

async function applyJoins (pool, rows, joins = [], workspaceId) {
  if (!joins.length) return rows
  const join = joins[0]
  if (!join?.targetDatasetId || !join.localColumn || !join.foreignColumn) return rows

  const targetDataset = await fetchDatasetById(pool, join.targetDatasetId, workspaceId)
  if (!targetDataset) return rows

  const { rows: foreignRows } = await listDatasetRows(pool, join.targetDatasetId, workspaceId, {
    limit: MAX_VIEW_ROWS,
    offset: 0
  })
  return mergeLeftJoinRows(rows, foreignRows, {
    localColumn: join.localColumn,
    foreignColumn: join.foreignColumn,
    prefix: join.prefix || 'join_'
  })
}

function applySort (rows, sort = []) {
  if (!sort.length) return rows
  const sorted = [...rows]
  sorted.sort((a, b) => {
    for (const entry of sort) {
      const av = a.row_data?.[entry.column]
      const bv = b.row_data?.[entry.column]
      if (av === bv) continue
      const dir = entry.dir === 'desc' ? -1 : 1
      if (av == null) return dir
      if (bv == null) return -dir
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      return String(av).localeCompare(String(bv)) * dir
    }
    return 0
  })
  return sorted
}

export async function listViewsForDataset (pool, datasetId, workspaceId) {
  const dataset = await fetchDatasetById(pool, datasetId, workspaceId)
  if (!dataset) return null
  const views = await listDatasetViews(pool, datasetId, workspaceId)
  return { dataset, views }
}

export async function createDatasetView (pool, clerkUserId, actorId, datasetId, payload) {
  const dataset = await fetchDatasetById(pool, datasetId, payload.workspaceId)
  if (!dataset) return null
  const name = sanitizeText(payload.name)
  if (!name) throw new Error('View name is required.')

  const view = await insertDatasetView(pool, {
    datasetId,
    workspaceId: payload.workspaceId,
    engagementId: dataset.engagement_id,
    name,
    description: sanitizeText(payload.description) || null,
    config: payload.config || {},
    actorId
  })

  await logAccountingAudit(pool, clerkUserId, actorId, 'engagement_dataset_view', view.id, 'created', null, view)
  return view
}

export async function updateDatasetView (pool, clerkUserId, actorId, viewId, payload) {
  const before = await fetchDatasetViewById(pool, viewId, payload.workspaceId)
  if (!before) return null
  const view = await updateDatasetViewRecord(pool, viewId, payload.workspaceId, {
    name: payload.name ? sanitizeText(payload.name) : null,
    description: payload.description != null ? sanitizeText(payload.description) : null,
    config: payload.config,
    actorId
  })
  await logAccountingAudit(pool, clerkUserId, actorId, 'engagement_dataset_view', viewId, 'updated', before, view)
  return view
}

export async function archiveDatasetView (pool, clerkUserId, actorId, viewId, workspaceId) {
  const before = await fetchDatasetViewById(pool, viewId, workspaceId)
  if (!before) return null
  const view = await softDeleteDatasetView(pool, viewId, workspaceId, actorId)
  await logAccountingAudit(pool, clerkUserId, actorId, 'engagement_dataset_view', viewId, 'archived', before, view)
  return view
}

export async function executeDatasetView (pool, viewId, workspaceId) {
  const view = await fetchDatasetViewById(pool, viewId, workspaceId)
  if (!view) return null

  const dataset = await fetchDatasetById(pool, view.dataset_id, workspaceId)
  if (!dataset) return null

  const { rows } = await listDatasetRows(pool, view.dataset_id, workspaceId, { limit: MAX_VIEW_ROWS, offset: 0 })
  const config = view.config || {}

  let working = rows
  working = applyFilters(working, config.filters || [])
  working = await applyJoins(pool, working, config.joins || [], workspaceId)
  working = applyCalculatedColumns(working, config.calculatedColumns || [])
  working = applyGroupBy(working, config.groupBy || [], config.aggregations || [])
  working = applySort(working, config.sort || [])

  const limit = Math.min(Number(config.limit) || 500, MAX_VIEW_ROWS)
  const resultRows = working.slice(0, limit).map((row) => ({
    sourceRowNumber: row.source_row_number,
    rowData: row.row_data
  }))

  return {
    view,
    dataset,
    rows: resultRows,
    summary: {
      inputRows: rows.length,
      outputRows: resultRows.length
    }
  }
}
