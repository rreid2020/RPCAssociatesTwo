import type { RequiredFormItem, RequiredFormsResponse } from '../../../lib/taxIntelligenceApi'

function requiredFormStatusLabel (status: string): string {
  if (status === 'active') return 'Active'
  if (status === 'archived') return 'Archived'
  if (status === 'not_indexed') return 'Not in catalog'
  if (status === 'registry_unavailable') return 'Registry unavailable'
  return status
}

function requiredFormStatusClass (status: string): string {
  if (status === 'active') return 'bg-green-50 text-green-800 border-green-200'
  if (status === 'archived') return 'bg-amber-50 text-amber-800 border-amber-200'
  return 'bg-gray-50 text-gray-700 border-border'
}

const ARTIFACT_SECTIONS: Array<{ key: keyof NonNullable<RequiredFormsResponse['grouped']>; title: string }> = [
  { key: 'schedules', title: 'T1 schedules' },
  { key: 'forms', title: 'T1 forms' },
  { key: 'worksheets', title: 'Federal worksheets' },
  { key: 'other', title: 'Other required artifacts' }
]

function FormsTable ({
  forms,
  compact = false
}: {
  forms: RequiredFormItem[]
  compact?: boolean
}) {
  if (forms.length === 0) return null
  const textSize = compact ? 'text-xs' : 'text-sm'
  return (
    <div className="overflow-x-auto border border-border rounded-md">
      <table className={`min-w-full ${textSize}`}>
        <thead className="bg-background/70">
          <tr>
            <th className="text-left px-3 py-2 font-semibold text-primary-dark">Form</th>
            <th className="text-left px-3 py-2 font-semibold text-primary-dark">Title</th>
            <th className="text-left px-3 py-2 font-semibold text-primary-dark">Catalog</th>
            <th className="text-left px-3 py-2 font-semibold text-primary-dark">Why required</th>
          </tr>
        </thead>
        <tbody>
          {forms.map((form) => (
            <tr key={form.normalizedFormCode} className="border-t border-border align-top">
              <td className="px-3 py-2 font-medium text-text">{form.formCode}</td>
              <td className="px-3 py-2 text-text">{form.registry.title || '—'}</td>
              <td className="px-3 py-2">
                <span className={`inline-flex px-2 py-0.5 rounded border ${compact ? 'text-[11px]' : 'text-xs'} ${requiredFormStatusClass(form.registry.registryStatus)}`}>
                  {requiredFormStatusLabel(form.registry.registryStatus)}
                </span>
              </td>
              <td className="px-3 py-2 text-text-light">
                <ul className="list-disc pl-4 space-y-1">
                  {form.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

type RequiredFormsPanelProps = {
  requiredForms: RequiredFormsResponse | null
  loading: boolean
  compact?: boolean
}

export default function RequiredFormsPanel ({ requiredForms, loading, compact = false }: RequiredFormsPanelProps) {
  const textSize = compact ? 'text-xs' : 'text-sm'

  return (
    <div>
      <p className={`${textSize} text-text-light mt-1`}>
        Personal T1 return scope only — inferred from tax situation setup, slip mappings, income categories, and the CRA
        {' '}
        <a
          href={requiredForms?.crosswalkUrl || 'https://www.canada.ca/en/revenue-agency/services/forms-publications/tax-packages-years/general-income-tax-benefit-package/other-forms-publications.html'}
          target="_blank"
          rel="noreferrer"
          className="text-accent hover:underline"
        >
          other forms &amp; publications crosswalk
        </a>
        . Corporate T2, trust returns, and partnership admin filings are excluded.
      </p>
      {requiredForms?.provincialPackage && (
        <p className={`${textSize} text-text-light mt-2`}>
          Provincial package: <span className="font-medium text-text">{requiredForms.provincialPackage.name}</span>
          {' '}
          ({requiredForms.provincialPackage.packageCode})
          {requiredForms.packageIndexUrl && (
            <>
              {' · '}
              <a href={requiredForms.packageIndexUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                CRA T1 package index
              </a>
            </>
          )}
        </p>
      )}
      {loading && <p className={`${textSize} text-text-light mt-2`}>Analyzing required forms…</p>}
      {!loading && (requiredForms?.forms?.length || 0) === 0 && (
        <p className={`${textSize} text-text-light mt-2`}>No additional CRA forms inferred yet for this return.</p>
      )}
      {!loading && (requiredForms?.forms?.length || 0) > 0 && (
        <div className="mt-3 space-y-4">
          {requiredForms?.grouped
            ? ARTIFACT_SECTIONS.map(({ key, title }) => {
              const sectionForms = requiredForms.grouped?.[key] || []
              if (sectionForms.length === 0) return null
              return (
                <div key={key}>
                  <h4 className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-primary-dark mb-2`}>{title}</h4>
                  <FormsTable forms={sectionForms} compact={compact} />
                </div>
              )
            })
            : <FormsTable forms={requiredForms?.forms || []} compact={compact} />}
          {(requiredForms?.referenceGuides?.length || 0) > 0 && (
            <div>
              <h4 className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-primary-dark mb-2`}>Reference guides (not filed)</h4>
              <ul className={`${textSize} text-text-light list-disc pl-5 space-y-1`}>
                {requiredForms?.referenceGuides?.map((guide) => (
                  <li key={guide.formCode}>{guide.formCode} — lines {guide.lineRefs.join(', ')}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
