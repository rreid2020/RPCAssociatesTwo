import ExcelJS from 'exceljs'

function safeFileToken (value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'engagement'
}

export async function exportEngagementWorkbook (pool, scope, engagementId) {
  const { rows: engagementRows } = await pool.query(
    `SELECT id, name, period_start, period_end
     FROM taxgpt.accounting_engagements
     WHERE id = $1::uuid
       AND clerk_user_id = $2
       AND COALESCE(workspace_id::text, '') = COALESCE($3::text, '')
       AND COALESCE(organization_id::text, '') = COALESCE($4::text, '')
     LIMIT 1`,
    [engagementId, scope.workspaceUserId, scope.workspace.id, scope.workspace.organizationId]
  )
  const engagement = engagementRows[0]
  if (!engagement) return null

  const { rows: tbRows } = await pool.query(
    `SELECT account_number, account_name, account_type,
            current_period_balance, prior_period_balance, variance_amount, variance_percent
     FROM taxgpt.trial_balance_accounts
     WHERE engagement_id = $1::uuid
     ORDER BY sort_order ASC, account_number ASC NULLS LAST`,
    [engagementId]
  )

  const { rows: leadSheetRows } = await pool.query(
    `SELECT section_code, section_name, status, risk_level, open_note_count, document_count
     FROM taxgpt.lead_sheets
     WHERE engagement_id = $1::uuid
     ORDER BY section_code ASC`,
    [engagementId]
  )

  const { rows: adjustmentRows } = await pool.query(
    `SELECT id, entry_number, description, status, created_at
     FROM taxgpt.adjustment_entries
     WHERE engagement_id = $1::uuid
     ORDER BY created_at ASC`,
    [engagementId]
  )

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Axiom Financial'
  workbook.created = new Date()
  workbook.modified = new Date()

  const summarySheet = workbook.addWorksheet('Summary')
  summarySheet.addRow(['Engagement', engagement.name])
  summarySheet.addRow(['Period start', engagement.period_start ? new Date(engagement.period_start).toISOString().slice(0, 10) : ''])
  summarySheet.addRow(['Period end', engagement.period_end ? new Date(engagement.period_end).toISOString().slice(0, 10) : ''])
  summarySheet.addRow(['Trial balance rows', tbRows.length])
  summarySheet.addRow(['Lead sheets', leadSheetRows.length])
  summarySheet.addRow(['Adjustments', adjustmentRows.length])
  summarySheet.getColumn(1).width = 22
  summarySheet.getColumn(2).width = 48

  const tbSheet = workbook.addWorksheet('Trial Balance')
  tbSheet.addRow(['Account Number', 'Account Name', 'Type', 'Current', 'Prior', 'Variance', 'Variance %'])
  for (const row of tbRows) {
    tbSheet.addRow([
      row.account_number || '',
      row.account_name || '',
      row.account_type || '',
      Number(row.current_period_balance || 0),
      Number(row.prior_period_balance || 0),
      Number(row.variance_amount || 0),
      Number(row.variance_percent || 0)
    ])
  }
  const tbTotalRow = tbRows.length + 2
  tbSheet.getCell(`A${tbTotalRow}`).value = 'Totals'
  tbSheet.getCell(`D${tbTotalRow}`).value = { formula: `SUM(D2:D${tbTotalRow - 1})` }
  tbSheet.getCell(`E${tbTotalRow}`).value = { formula: `SUM(E2:E${tbTotalRow - 1})` }
  tbSheet.getCell(`F${tbTotalRow}`).value = { formula: `SUM(F2:F${tbTotalRow - 1})` }
  tbSheet.getRow(1).font = { bold: true }
  tbSheet.getRow(tbTotalRow).font = { bold: true }
  tbSheet.columns.forEach((column) => {
    column.width = 18
  })

  const leadsheetSheet = workbook.addWorksheet('Lead Sheets')
  leadsheetSheet.addRow(['Section Code', 'Section Name', 'Status', 'Risk', 'Open Notes', 'Documents'])
  for (const row of leadSheetRows) {
    leadsheetSheet.addRow([
      row.section_code || '',
      row.section_name || '',
      row.status || '',
      row.risk_level || '',
      Number(row.open_note_count || 0),
      Number(row.document_count || 0)
    ])
  }
  leadsheetSheet.getRow(1).font = { bold: true }
  leadsheetSheet.columns.forEach((column) => {
    column.width = 20
  })

  const adjustmentsSheet = workbook.addWorksheet('Adjustments')
  adjustmentsSheet.addRow(['Entry Number', 'Description', 'Status', 'Created At'])
  for (const row of adjustmentRows) {
    adjustmentsSheet.addRow([
      row.entry_number || '',
      row.description || '',
      row.status || '',
      row.created_at ? new Date(row.created_at).toISOString() : ''
    ])
  }
  adjustmentsSheet.getRow(1).font = { bold: true }
  adjustmentsSheet.columns.forEach((column) => {
    column.width = 24
  })

  const workbookBuffer = await workbook.xlsx.writeBuffer()
  const fileName = `${safeFileToken(engagement.name)}-working-papers.xlsx`
  return {
    fileName,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    base64Content: Buffer.from(workbookBuffer).toString('base64')
  }
}

