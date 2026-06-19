import { calculateReturnTotals } from './calculation.service.js'
import { listAuditFlags, runAuditRules } from './audit.service.js'
import { listDeductions, listIncomeEntries } from './income.service.js'
import { getTaxReturnById } from './taxReturn.service.js'
import { buildFederalSummaryForReturn } from '../../lib/taxSlips/t1LineSummary.js'
import { buildLineMappingIssues, buildSchemasByCode } from '../../lib/taxSlips/lineMappingValidation.js'
import { listSlipSchemasWithBoxes } from './slipSchema.repository.js'

function round2 (n) {
  return Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100
}

function resolveHouseholdRootId (taxReturn) {
  return taxReturn.parent_tax_return_id || taxReturn.setup_json?.workflow?.parentTaxReturnId || taxReturn.id
}

async function listHouseholdReturns (pool, clerkUserId, taxReturnId) {
  const current = await getTaxReturnById(pool, clerkUserId, taxReturnId)
  if (!current) return { rootId: null, members: [] }
  const rootId = resolveHouseholdRootId(current)
  const { rows } = await pool.query(
    `SELECT tr.id,
            tr.tax_year,
            tr.status,
            tr.parent_tax_return_id,
            tr.workspace_role,
            tr.setup_json,
            tp.full_name AS taxpayer_name
     FROM taxgpt.tax_returns tr
     INNER JOIN taxgpt.taxpayers tp ON tp.id = tr.taxpayer_id
     WHERE tr.clerk_user_id = $1`,
    [clerkUserId]
  )
  const members = rows
    .filter((row) => {
      const parent = row.parent_tax_return_id || row.setup_json?.workflow?.parentTaxReturnId || row.id
      return String(parent) === String(rootId) || String(row.id) === String(rootId)
    })
    .map((row) => ({
      id: row.id,
      taxYear: row.tax_year,
      status: row.status,
      taxpayerName: row.taxpayer_name,
      workspaceRole: row.workspace_role || row.setup_json?.workflow?.workspaceRole || 'primary'
    }))
    .sort((a, b) => {
      const aPrimary = String(a.workspaceRole).toLowerCase() === 'primary' ? 0 : 1
      const bPrimary = String(b.workspaceRole).toLowerCase() === 'primary' ? 0 : 1
      if (aPrimary !== bPrimary) return aPrimary - bPrimary
      return String(a.taxpayerName).localeCompare(String(b.taxpayerName))
    })
  return { rootId, members, taxYear: current.tax_year }
}

function balanceFromCalculation (calculation) {
  const refundOrBalance = Number(calculation?.refund_or_balance ?? calculation?.refundOrBalance ?? 0)
  const federalTax = Number(calculation?.total_payable ?? calculation?.totalPayable ?? 0)
  const taxesWithheld = Number(calculation?.taxes_withheld ?? calculation?.taxesWithheld ?? 0)
  const amountDue = refundOrBalance < 0 ? round2(Math.abs(refundOrBalance)) : 0
  const refund = refundOrBalance > 0 ? round2(refundOrBalance) : 0
  return {
    federalTax: round2(federalTax),
    taxesWithheld: round2(taxesWithheld),
    amountDue,
    refund,
    netBalance: round2(refund - amountDue)
  }
}

function buildDiagnosticMessages ({ taxReturn, incomeEntries, deductions, calculation, auditFlags, lineMappingIssues = [] }) {
  const messages = []
  const profile = taxReturn.taxpayer_profile || {}
  const taxYear = Number(taxReturn.tax_year || new Date().getFullYear())

  if (!String(taxReturn.taxpayer_first_name || profile.firstName || profile.first_name || '').trim()) {
    messages.push({
      severity: 'warning',
      title: 'Taxpayer first name is missing',
      detail: 'Enter the taxpayer first name on the Identification page before filing.',
      reviewField: 'firstName'
    })
  }
  if (!String(taxReturn.taxpayer_sin || profile.sin || '').trim()) {
    messages.push({
      severity: 'warning',
      title: 'Taxpayer SIN is missing',
      detail: 'A valid SIN is required for NETFILE and CRA processing.',
      reviewField: 'sin'
    })
  }
  if (profile.first_time_filer == null && profile.firstTimeFiler == null) {
    messages.push({
      severity: 'warning',
      title: 'First-time filer question unanswered',
      detail: 'Answer the CRA first-time filer question on CRA questions.',
      reviewField: 'firstTimeFiler'
    })
  }
  if (profile.cra_email_notifications_consent == null && profile.craEmailNotificationsConsent == null) {
    messages.push({
      severity: 'info',
      title: 'Email address for CRA notifications',
      detail: 'If you provide an email address, CRA may use it for online mail and benefit notices. Review your consent choices on CRA questions.',
      reviewField: 'craEmailNotificationsConsent'
    })
  }
  if ((incomeEntries || []).length === 0) {
    messages.push({
      severity: 'warning',
      title: 'No income entries recorded',
      detail: 'Add slips or income rows on Income & CRA slips before filing.',
      reviewField: 'income'
    })
  }
  const taxYearMismatch = (incomeEntries || []).some((row) => {
    const slipYear = Number(row.metadata?.taxYear || 0)
    return slipYear > 0 && slipYear > taxYear
  })
  if (taxYearMismatch) {
    messages.push({
      severity: 'warning',
      title: 'Value exceeds maximum tax year',
      detail: `One or more slip tax years are later than the return year (${taxYear}). Review slip tax years on Income & CRA slips.`,
      reviewField: 'income'
    })
  }
  if (Number(calculation?.taxable_income ?? calculation?.taxableIncome ?? 0) <= 0 && (incomeEntries || []).length > 0) {
    messages.push({
      severity: 'info',
      title: 'Taxable income is zero or negative',
      detail: 'Review deductions and income mapping if this result is unexpected.',
      reviewField: 'review'
    })
  }

  for (const flag of auditFlags || []) {
    messages.push({
      severity: String(flag.severity || 'warning').toLowerCase() === 'high' ? 'warning' : 'info',
      title: flag.title,
      detail: flag.detail || '',
      reviewField: 'review'
    })
  }

  for (const issue of lineMappingIssues) {
    if (issue.status !== 'REVIEW') continue
    messages.push({
      severity: 'warning',
      title: `Slip mapping review: ${issue.source}`,
      detail: issue.reason,
      reviewField: 'income'
    })
  }

  return messages
}

function buildFederalSummaryColumns (memberSnapshots) {
  const lineMap = new Map()
  for (const member of memberSnapshots) {
    for (const section of member.federalSummary.sections || []) {
      for (const line of [...(section.lines || []), section.subtotal].filter(Boolean)) {
        const key = `${section.id}:${line.lineRef}:${line.label}`
        if (!lineMap.has(key)) {
          lineMap.set(key, {
            sectionId: section.id,
            sectionTitle: section.title,
            lineRef: line.lineRef,
            label: line.label,
            amounts: {}
          })
        }
        lineMap.get(key).amounts[member.id] = line.amount
      }
    }
  }

  const sectionOrder = ['total_income', 'net_income', 'taxable_income', 'federal_tax', 'credits', 'tax_and_balance']
  const grouped = new Map()
  for (const row of lineMap.values()) {
    if (!grouped.has(row.sectionId)) grouped.set(row.sectionId, { id: row.sectionId, title: row.sectionTitle, lines: [] })
    grouped.get(row.sectionId).lines.push(row)
  }

  return sectionOrder
    .filter((id) => grouped.has(id))
    .map((id) => {
      const section = grouped.get(id)
      section.lines.sort((a, b) => Number(a.lineRef) - Number(b.lineRef))
      return section
    })
}

export async function runHouseholdReview (pool, clerkUserId, taxReturnId) {
  const household = await listHouseholdReturns(pool, clerkUserId, taxReturnId)
  if (!household.members.length) return null

  const slipSchemas = await listSlipSchemasWithBoxes(pool)
  const schemasByCode = buildSchemasByCode(slipSchemas)

  const memberSnapshots = []
  for (const member of household.members) {
    const [taxReturn, incomeEntries, deductions, calculation, auditFlags] = await Promise.all([
      getTaxReturnById(pool, clerkUserId, member.id),
      listIncomeEntries(pool, clerkUserId, member.id),
      listDeductions(pool, clerkUserId, member.id),
      calculateReturnTotals(pool, clerkUserId, member.id),
      runAuditRules(pool, clerkUserId, member.id).catch(() => listAuditFlags(pool, clerkUserId, member.id))
    ])

    const lineMappingIssues = buildLineMappingIssues(incomeEntries, schemasByCode)
    const federalSummary = buildFederalSummaryForReturn({ incomeEntries, deductions, calculation })
    const balance = balanceFromCalculation(calculation)
    const messages = buildDiagnosticMessages({
      taxReturn,
      incomeEntries,
      deductions,
      calculation,
      auditFlags: Array.isArray(auditFlags) ? auditFlags : [],
      lineMappingIssues
    })

    memberSnapshots.push({
      ...member,
      calculation,
      balance,
      federalSummary,
      messages,
      incomeEntryCount: incomeEntries.length,
      deductionEntryCount: deductions.length
    })
  }

  const totalAmountDue = round2(memberSnapshots.reduce((sum, m) => sum + m.balance.amountDue, 0))
  const totalRefunds = round2(memberSnapshots.reduce((sum, m) => sum + m.balance.refund, 0))
  const householdNetOwing = round2(totalAmountDue - totalRefunds)

  return {
    generatedAt: new Date().toISOString(),
    taxYear: household.taxYear,
    householdRootId: household.rootId,
    members: memberSnapshots.map((m) => ({
      id: m.id,
      taxpayerName: m.taxpayerName,
      workspaceRole: m.workspaceRole,
      status: m.status,
      balance: m.balance,
      federalSummary: m.federalSummary,
      messages: m.messages
    })),
    balanceOverview: {
      totalAmountDue,
      totalRefunds,
      householdNetOwing,
      headline: householdNetOwing > 0
        ? `The total amount owed is: $${householdNetOwing.toFixed(2)}`
        : (totalRefunds > 0
            ? `The household refund total is: $${totalRefunds.toFixed(2)}`
            : 'No federal balance owing or refund is estimated for this household.')
    },
    federalSummaryColumns: buildFederalSummaryColumns(memberSnapshots),
    messages: memberSnapshots.flatMap((m) => m.messages.map((msg) => ({
      ...msg,
      taxpayerName: m.taxpayerName,
      taxReturnId: m.id
    })))
  }
}
