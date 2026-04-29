function n (value) {
  const out = Number(value || 0)
  return Number.isFinite(out) ? out : 0
}

function pushIfPositive (arr, entry) {
  if (Number(entry.amount || 0) <= 0) return
  arr.push(entry)
}

export function mapExtractedSlipToEntries (slipType, extractedData, baseMeta = {}) {
  const entries = []
  const t = String(slipType || '').toUpperCase()
  const d = extractedData || {}

  if (t === 'T4') {
    pushIfPositive(entries, { kind: 'income', category: 'employment_income', description: 'T4 box 14 employment income', amount: n(d.employment_income), metadata: { ...baseMeta, boxCode: '14', lineRef: '10100' } })
    pushIfPositive(entries, { kind: 'income', category: 'tax_withheld', description: 'T4 box 22 tax withheld', amount: n(d.income_tax_deducted), metadata: { ...baseMeta, boxCode: '22', lineRef: '43700', asWithholding: true, incomeTaxDeducted: n(d.income_tax_deducted) } })
    pushIfPositive(entries, { kind: 'deduction', category: 'cpp_contributions', description: 'T4 box 16 CPP', amount: n(d.cpp_contributions), metadata: { ...baseMeta, boxCode: '16', lineRef: '30800' } })
    pushIfPositive(entries, { kind: 'deduction', category: 'ei_premiums', description: 'T4 box 18 EI premiums', amount: n(d.ei_contributions), metadata: { ...baseMeta, boxCode: '18', lineRef: '31200' } })
  } else if (t === 'T5') {
    pushIfPositive(entries, { kind: 'income', category: 'interest_income', description: 'T5 interest income', amount: n(d.interest_income), metadata: { ...baseMeta, lineRef: '12100' } })
    pushIfPositive(entries, { kind: 'income', category: 'eligible_dividends', description: 'T5 eligible dividends', amount: n(d.eligible_dividends), metadata: { ...baseMeta, lineRef: '12000' } })
    pushIfPositive(entries, { kind: 'income', category: 'dividend_income', description: 'T5 dividend income', amount: n(d.dividend_income), metadata: { ...baseMeta, lineRef: '12010' } })
  } else if (t === 'T3') {
    pushIfPositive(entries, { kind: 'income', category: 'trust_income', description: 'T3 trust income', amount: n(d.trust_income), metadata: { ...baseMeta, lineRef: '13000' } })
    pushIfPositive(entries, { kind: 'income', category: 'capital_gains', description: 'T3 capital gains', amount: n(d.capital_gains), metadata: { ...baseMeta, lineRef: '12700', scheduleRef: 'Schedule 3' } })
    pushIfPositive(entries, { kind: 'income', category: 'other_income', description: 'T3 other income', amount: n(d.other_income), metadata: { ...baseMeta, lineRef: '13000' } })
  } else if (t === 'T4A') {
    pushIfPositive(entries, { kind: 'income', category: 'pension_income', description: 'T4A pension income', amount: n(d.pension_income), metadata: { ...baseMeta, boxCode: '16', lineRef: '11500' } })
    pushIfPositive(entries, { kind: 'income', category: 'professional_fees', description: 'T4A fees for services', amount: n(d.fees_for_services), metadata: { ...baseMeta, boxCode: '48', lineRef: '13499', scheduleRef: 'T2125' } })
    pushIfPositive(entries, { kind: 'income', category: 'tax_withheld', description: 'T4A tax withheld', amount: n(d.income_tax_deducted), metadata: { ...baseMeta, boxCode: '22', lineRef: '43700', asWithholding: true, incomeTaxDeducted: n(d.income_tax_deducted) } })
  } else if (t === 'T4E') {
    pushIfPositive(entries, { kind: 'income', category: 'ei_benefits', description: 'T4E total benefits paid', amount: n(d.total_benefits_paid), metadata: { ...baseMeta, boxCode: '14', lineRef: '11900' } })
    pushIfPositive(entries, { kind: 'income', category: 'tax_withheld', description: 'T4E tax withheld', amount: n(d.income_tax_deducted), metadata: { ...baseMeta, boxCode: '15', lineRef: '43700', asWithholding: true, incomeTaxDeducted: n(d.income_tax_deducted) } })
  } else if (t === 'T4RSP') {
    pushIfPositive(entries, { kind: 'income', category: 'rrsp_income', description: 'T4RSP RRSP income', amount: n(d.rrsp_income), metadata: { ...baseMeta, boxCode: '34', lineRef: '12900' } })
    pushIfPositive(entries, { kind: 'income', category: 'tax_withheld', description: 'T4RSP tax withheld', amount: n(d.income_tax_deducted), metadata: { ...baseMeta, boxCode: '22', lineRef: '43700', asWithholding: true, incomeTaxDeducted: n(d.income_tax_deducted) } })
  } else if (t === 'T4RIF') {
    pushIfPositive(entries, { kind: 'income', category: 'rrif_income', description: 'T4RIF taxable amount', amount: n(d.taxable_amount), metadata: { ...baseMeta, boxCode: '16', lineRef: '11500' } })
    pushIfPositive(entries, { kind: 'income', category: 'tax_withheld', description: 'T4RIF tax withheld', amount: n(d.income_tax_deducted), metadata: { ...baseMeta, boxCode: '22', lineRef: '43700', asWithholding: true, incomeTaxDeducted: n(d.income_tax_deducted) } })
  } else if (t === 'T5007') {
    pushIfPositive(entries, { kind: 'income', category: 'social_assistance', description: 'T5007 social assistance', amount: n(d.social_assistance_payments), metadata: { ...baseMeta, boxCode: '10', lineRef: '14500' } })
    pushIfPositive(entries, { kind: 'income', category: 'workers_compensation', description: 'T5007 workers compensation', amount: n(d.workers_compensation_benefits), metadata: { ...baseMeta, boxCode: '11', lineRef: '14400' } })
  } else if (t === 'T5013') {
    pushIfPositive(entries, { kind: 'income', category: 'partnership_business_income', description: 'T5013 business income', amount: n(d.business_income), metadata: { ...baseMeta, lineRef: '13500', scheduleRef: 'T2125' } })
    pushIfPositive(entries, { kind: 'income', category: 'partnership_capital_gains', description: 'T5013 capital gains', amount: n(d.capital_gains), metadata: { ...baseMeta, lineRef: '12700', scheduleRef: 'Schedule 3' } })
  } else if (t === 'T5018') {
    pushIfPositive(entries, { kind: 'income', category: 'contract_payments', description: 'T5018 contract payments', amount: n(d.contract_payments), metadata: { ...baseMeta, boxCode: '22', lineRef: '13499', scheduleRef: 'T2125' } })
  } else if (t === 'T4PS') {
    pushIfPositive(entries, { kind: 'income', category: 'dpsp_allocation', description: 'T4PS amount allocated by trustee', amount: n(d.amount_allocated_by_trustee), metadata: { ...baseMeta, boxCode: '35', lineRef: '13000' } })
    pushIfPositive(entries, { kind: 'income', category: 'dpsp_payout', description: 'T4PS amount paid out', amount: n(d.amount_paid_out_of_plan), metadata: { ...baseMeta, boxCode: '36', lineRef: '13000' } })
  }

  return entries
}

export async function upsertDocumentMappedEntries (pool, clerkUserId, taxReturnId, documentId, entries = []) {
  await pool.query(
    `DELETE FROM taxgpt.income_entries
     WHERE clerk_user_id = $1
       AND tax_return_id = $2::uuid
       AND source_type = 'document_extraction'
       AND metadata->>'documentId' = $3`,
    [clerkUserId, taxReturnId, String(documentId)]
  )
  await pool.query(
    `DELETE FROM taxgpt.deductions
     WHERE clerk_user_id = $1
       AND tax_return_id = $2::uuid
       AND metadata->>'documentId' = $3`,
    [clerkUserId, taxReturnId, String(documentId)]
  )

  for (const entry of entries) {
    if (entry.kind === 'income') {
      await pool.query(
        `INSERT INTO taxgpt.income_entries
         (clerk_user_id, tax_return_id, source_type, category, description, amount, is_manual, metadata, updated_at)
         VALUES ($1, $2::uuid, 'document_extraction', $3, $4, $5, false, $6::jsonb, now())`,
        [clerkUserId, taxReturnId, entry.category, entry.description, n(entry.amount), JSON.stringify(entry.metadata || {})]
      )
    } else {
      await pool.query(
        `INSERT INTO taxgpt.deductions
         (clerk_user_id, tax_return_id, category, description, amount, is_credit, metadata, updated_at)
         VALUES ($1, $2::uuid, $3, $4, $5, false, $6::jsonb, now())`,
        [clerkUserId, taxReturnId, entry.category, entry.description, n(entry.amount), JSON.stringify(entry.metadata || {})]
      )
    }
  }
}
