/** System template blueprints keyed by engagement type storage key. */

const BASE_SECTIONS = [
  { sectionKey: 'planning', sectionLabel: 'Planning', sectionType: 'planning' },
  { sectionKey: 'fieldwork', sectionLabel: 'Fieldwork', sectionType: 'fieldwork' },
  { sectionKey: 'reporting', sectionLabel: 'Reporting', sectionType: 'reporting' },
  { sectionKey: 'completion', sectionLabel: 'Completion', sectionType: 'completion' }
]

function checklist (sectionKey, checklistKey, title, items) {
  return { sectionKey, checklistKey, title, items }
}

function procedure (sectionKey, procedureKey, title, objective) {
  return { sectionKey, procedureKey, title, objective, expectedResult: 'Document conclusions and supporting workpapers.' }
}

function blueprint (templateName, engagementType, checklists, procedures) {
  return {
    templateKey: `${engagementType}-execution-v1`,
    templateName,
    engagementType,
    sections: BASE_SECTIONS,
    checklists,
    procedures
  }
}

const YEAR_END = blueprint('Year End Working Papers', 'year_end_working_papers', [
  checklist('planning', 'acceptance', 'Engagement acceptance', [
    { itemKey: 'client_acceptance', title: 'Confirm client acceptance and independence' },
    { itemKey: 'engagement_letter', title: 'Review signed engagement letter' }
  ]),
  checklist('fieldwork', 'tb_leads', 'Trial balance and lead sheets', [
    { itemKey: 'tb_import', title: 'Import and map trial balance' },
    { itemKey: 'lead_sheets', title: 'Complete required lead sheets' }
  ]),
  checklist('completion', 'wrap_up', 'Completion', [
    { itemKey: 'final_review', title: 'Final partner review' },
    { itemKey: 'deliverables', title: 'Issue deliverables to client' }
  ])
], [
  procedure('planning', 'materiality', 'Materiality assessment', 'Determine overall materiality and performance materiality.'),
  procedure('fieldwork', 'ar_aging', 'Review AR aging', 'Evaluate collectability and cutoff for accounts receivable.'),
  procedure('fieldwork', 'revenue_analytics', 'Revenue analytics', 'Perform analytical procedures on revenue streams.'),
  procedure('fieldwork', 'bank_rec', 'Bank reconciliation review', 'Verify bank reconciliations and unusual items.'),
  procedure('reporting', 'going_concern', 'Going concern assessment', 'Assess going concern indicators and disclosures.')
])

const COMPILATION = blueprint('Compilation Engagement', 'compilation_support', [
  checklist('planning', 'acceptance', 'Acceptance', [
    { itemKey: 'engagement_letter', title: 'Signed engagement letter on file' }
  ]),
  checklist('fieldwork', 'fs_prep', 'Financial statement preparation', [
    { itemKey: 'tb_mapped', title: 'Trial balance mapped to FS areas' },
    { itemKey: 'disclosures', title: 'Draft disclosures reviewed' }
  ]),
  checklist('completion', 'completion', 'Completion', [
    { itemKey: 'compilation_report', title: 'Compilation report approved' }
  ])
], [
  procedure('fieldwork', 'tb_review', 'Trial balance review', 'Review mapped trial balance for completeness.'),
  procedure('reporting', 'disclosure_review', 'Disclosure review', 'Review note disclosures for compilation engagement.')
])

const REVIEW = blueprint('Review Engagement', 'review_support', [
  checklist('planning', 'planning', 'Planning', [
    { itemKey: 'inquiry_plan', title: 'Plan inquiries and analytics' }
  ]),
  checklist('fieldwork', 'analytics', 'Analytics and inquiries', [
    { itemKey: 'analytics', title: 'Complete analytical review' },
    { itemKey: 'inquiries', title: 'Document management inquiries' }
  ]),
  checklist('completion', 'completion', 'Completion', [
    { itemKey: 'review_report', title: 'Review report approved' }
  ])
], [
  procedure('fieldwork', 'analytics_package', 'Analytical review package', 'Perform analytical procedures across major FS areas.'),
  procedure('fieldwork', 'inquiry_summary', 'Inquiry summary', 'Summarize inquiries of management.')
])

const AUDIT = blueprint('Audit Engagement', 'audit', [
  checklist('planning', 'acceptance', 'Acceptance and planning', [
    { itemKey: 'risk_assessment', title: 'Document risk assessment' }
  ]),
  checklist('fieldwork', 'fieldwork', 'Fieldwork', [
    { itemKey: 'controls', title: 'Internal control documentation' },
    { itemKey: 'substantive', title: 'Substantive procedures complete' }
  ]),
  checklist('completion', 'completion', 'Completion', [
    { itemKey: 'audit_report', title: 'Audit report and management letter' }
  ])
], [
  procedure('planning', 'risk_assessment', 'Risk assessment', 'Identify and respond to significant risks.'),
  procedure('fieldwork', 'substantive_testing', 'Substantive testing', 'Execute planned substantive procedures.')
])

const TAX = blueprint('Tax Engagement', 'tax_support', [
  checklist('planning', 'info', 'Client information', [
    { itemKey: 'source_docs', title: 'Source documents received' }
  ]),
  checklist('fieldwork', 'adjustments', 'Tax adjustments', [
    { itemKey: 'book_tax', title: 'Book-to-tax adjustments documented' }
  ]),
  checklist('completion', 'filing', 'Filing', [
    { itemKey: 'return_review', title: 'Return reviewed and approved' }
  ])
], [
  procedure('fieldwork', 'tax_adjustments', 'Tax adjustments review', 'Review proposed permanent and temporary differences.'),
  procedure('completion', 'filing_review', 'Filing review', 'Final review prior to filing.')
])

const OTHER = blueprint('Custom Engagement', 'custom', [
  checklist('planning', 'setup', 'Setup', [
    { itemKey: 'scope', title: 'Define engagement scope' }
  ]),
  checklist('completion', 'close', 'Close', [
    { itemKey: 'signoff', title: 'Final signoff complete' }
  ])
], [
  procedure('fieldwork', 'custom_work', 'Custom fieldwork', 'Perform agreed-upon procedures.')
])

export const SYSTEM_TEMPLATE_BLUEPRINTS = {
  year_end_working_papers: YEAR_END,
  compilation_support: COMPILATION,
  review_support: REVIEW,
  audit: AUDIT,
  tax_support: TAX,
  custom: OTHER
}

export function blueprintForEngagementType (engagementType) {
  const key = String(engagementType || 'custom').trim().toLowerCase()
  return SYSTEM_TEMPLATE_BLUEPRINTS[key] || OTHER
}
