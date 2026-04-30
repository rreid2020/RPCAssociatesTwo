import { FC, useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import SEO from '../../../components/SEO'
import ClientPortalShell from '../../../components/ClientPortalShell'
import { taxFetch, type TaxReturnSummary } from '../../../lib/taxIntelligenceApi'
import { getTaxBasePath } from './path'

type ReadinessIssueSeverity = 'required' | 'recommended'

function sanitizeSin (value: string): string {
  return String(value || '').replace(/\D/g, '').slice(0, 9)
}

type InterviewStep = 1 | 2 | 3 | 4
type MaritalStatus = 'single' | 'married' | 'common_law' | 'separated' | 'divorced' | 'widowed'
type SpouseMode = 'summary' | 'full'
type DependentDraft = {
  id: string
  fullName: string
  relationship: string
  dateOfBirth: string
  disability: boolean
  createWorkspace: boolean
}

function computeSetupReadiness (r: TaxReturnSummary): { required: number; recommended: number } {
  const issues: Array<{ severity: ReadinessIssueSeverity }> = []
  const profile = r.taxpayer_profile || {}
  const spouse = profile.spouse || {}
  const maritalStatus = String(profile.maritalStatus || 'single')
  const spouseMode = String(profile.spouseReturnMode || 'summary') === 'full' ? 'full' : 'summary'
  const married = maritalStatus === 'married' || maritalStatus === 'common_law'
  const missing = (value: unknown) => !String(value || '').trim()

  if (missing(r.taxpayer_first_name)) issues.push({ severity: 'required' })
  if (missing(r.taxpayer_last_name)) issues.push({ severity: 'required' })
  if (!sanitizeSin(String(r.taxpayer_sin || ''))) issues.push({ severity: 'required' })
  if (missing(r.taxpayer_date_of_birth)) issues.push({ severity: 'required' })
  if (missing(profile.mailingAddressLine1)) issues.push({ severity: 'required' })
  if (missing(profile.mailingCity)) issues.push({ severity: 'required' })
  if (missing(profile.mailingProvinceCode)) issues.push({ severity: 'required' })
  if (missing(profile.mailingPostalCode)) issues.push({ severity: 'required' })
  if (missing(profile.residenceProvinceDec31)) issues.push({ severity: 'required' })

  if (profile.electionsCanadianCitizen == null) issues.push({ severity: 'recommended' })
  if (profile.electionsCanadianCitizen === true && profile.electionsAuthorize == null) issues.push({ severity: 'recommended' })
  if (profile.foreignPropertyOver100k == null) issues.push({ severity: 'recommended' })

  if (married) {
    if (spouseMode === 'full') {
      if (missing(spouse.firstName)) issues.push({ severity: 'required' })
      if (missing(spouse.lastName)) issues.push({ severity: 'required' })
      if (missing(spouse.dateOfBirth)) issues.push({ severity: 'required' })
      if (!sanitizeSin(String(spouse.fullSin || ''))) issues.push({ severity: 'required' })
    } else if (missing(spouse.fullName)) {
      issues.push({ severity: 'required' })
    }
  }

  return {
    required: issues.filter((it) => it.severity === 'required').length,
    recommended: issues.filter((it) => it.severity === 'recommended').length
  }
}

const TaxReturns: FC = () => {
  const { getToken } = useAuth()
  const location = useLocation()
  const basePath = useMemo(() => getTaxBasePath(location.pathname), [location.pathname])
  const [returns, setReturns] = useState<TaxReturnSummary[]>([])
  const [step, setStep] = useState<InterviewStep>(1)
  const [taxYear, setTaxYear] = useState(new Date().getFullYear())
  const [mainFirstName, setMainFirstName] = useState('')
  const [mainLastName, setMainLastName] = useState('')
  const [mainSin, setMainSin] = useState('')
  const [mainDateOfBirth, setMainDateOfBirth] = useState('')
  const [mainEmail, setMainEmail] = useState('')
  const [mainProvinceCode, setMainProvinceCode] = useState('ON')
  const [maritalStatus, setMaritalStatus] = useState<MaritalStatus>('single')
  const [spouseReturnMode, setSpouseReturnMode] = useState<SpouseMode>('summary')
  const [spouseFullName, setSpouseFullName] = useState('')
  const [spouseFirstName, setSpouseFirstName] = useState('')
  const [spouseLastName, setSpouseLastName] = useState('')
  const [spouseDateOfBirth, setSpouseDateOfBirth] = useState('')
  const [spouseSin, setSpouseSin] = useState('')
  const [dependents, setDependents] = useState<DependentDraft[]>([])
  const [becameResidentInYear, setBecameResidentInYear] = useState(false)
  const [becameResidentDate, setBecameResidentDate] = useState('')
  const [ceasedResidentInYear, setCeasedResidentInYear] = useState(false)
  const [ceasedResidentDate, setCeasedResidentDate] = useState('')
  const [maritalStatusChangedInYear, setMaritalStatusChangedInYear] = useState(false)
  const [maritalStatusChangeDate, setMaritalStatusChangeDate] = useState('')
  const [deceasedInYear, setDeceasedInYear] = useState(false)
  const [deceasedDate, setDeceasedDate] = useState('')
  const [electionsCanadianCitizen, setElectionsCanadianCitizen] = useState<boolean | null>(null)
  const [electionsAuthorize, setElectionsAuthorize] = useState<boolean | null>(null)
  const [foreignPropertyOver100k, setForeignPropertyOver100k] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [createdInfo, setCreatedInfo] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await taxFetch<{ returns: TaxReturnSummary[] }>('/tax-returns', getToken)
      setReturns(data.returns || [])
      setErr(null)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load tax returns')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isMarried = maritalStatus === 'married' || maritalStatus === 'common_law'

  const resetInterview = () => {
    setStep(1)
    setTaxYear(new Date().getFullYear())
    setMainFirstName('')
    setMainLastName('')
    setMainSin('')
    setMainDateOfBirth('')
    setMainEmail('')
    setMainProvinceCode('ON')
    setMaritalStatus('single')
    setSpouseReturnMode('summary')
    setSpouseFullName('')
    setSpouseFirstName('')
    setSpouseLastName('')
    setSpouseDateOfBirth('')
    setSpouseSin('')
    setDependents([])
    setBecameResidentInYear(false)
    setBecameResidentDate('')
    setCeasedResidentInYear(false)
    setCeasedResidentDate('')
    setMaritalStatusChangedInYear(false)
    setMaritalStatusChangeDate('')
    setDeceasedInYear(false)
    setDeceasedDate('')
    setElectionsCanadianCitizen(null)
    setElectionsAuthorize(null)
    setForeignPropertyOver100k(null)
  }

  const addDependent = () => {
    setDependents((prev) => ([
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        fullName: '',
        relationship: '',
        dateOfBirth: '',
        disability: false,
        createWorkspace: false
      }
    ]))
  }

  const updateDependent = (id: string, patch: Partial<DependentDraft>) => {
    setDependents((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)))
  }

  const removeDependent = (id: string) => {
    setDependents((prev) => prev.filter((d) => d.id !== id))
  }

  const validateCurrentStep = (): string | null => {
    if (step === 1) {
      if (!mainFirstName.trim()) return 'Main taxpayer first name is required.'
      if (!mainLastName.trim()) return 'Main taxpayer last name is required.'
      if (!taxYear || taxYear < 2000 || taxYear > 2100) return 'Tax year must be between 2000 and 2100.'
      return null
    }
    if (step === 2) {
      if (isMarried) {
        if (spouseReturnMode === 'summary' && !spouseFullName.trim()) {
          return 'Spouse full name is required for summary mode.'
        }
        if (spouseReturnMode === 'full') {
          if (!spouseFirstName.trim() || !spouseLastName.trim()) return 'Spouse first and last name are required for full return mode.'
        }
      }
      const missingDependentName = dependents.some((d) => !d.fullName.trim())
      if (missingDependentName) return 'Each dependent needs a full name.'
      return null
    }
    if (step === 3) {
      if (becameResidentInYear && !becameResidentDate) return 'Became resident date is required.'
      if (ceasedResidentInYear && !ceasedResidentDate) return 'Ceased resident date is required.'
      if (maritalStatusChangedInYear && !maritalStatusChangeDate) return 'Marital status change date is required.'
      if (deceasedInYear && !deceasedDate) return 'Date of death is required.'
      return null
    }
    return null
  }

  const onNext = () => {
    const issue = validateCurrentStep()
    if (issue) {
      setErr(issue)
      return
    }
    setErr(null)
    setStep((prev) => Math.min(4, (prev + 1) as InterviewStep) as InterviewStep)
  }

  const onBack = () => {
    setErr(null)
    setStep((prev) => Math.max(1, (prev - 1) as InterviewStep) as InterviewStep)
  }

  const onCreate = async () => {
    const issue = validateCurrentStep()
    if (issue) {
      setErr(issue)
      return
    }
    setSaving(true)
    setErr(null)
    setCreatedInfo(null)
    try {
      const payload = await taxFetch<{ taxReturn: TaxReturnSummary & { createdLinkedWorkspaces?: Array<{ id: string; role: string; taxpayerName: string }> } }>('/tax-returns', getToken, {
        method: 'POST',
        body: JSON.stringify({
          taxYear,
          taxpayerName: `${mainFirstName.trim()} ${mainLastName.trim()}`.trim(),
          firstName: mainFirstName.trim(),
          lastName: mainLastName.trim(),
          sin: sanitizeSin(mainSin),
          dateOfBirth: mainDateOfBirth || null,
          provinceCode: mainProvinceCode || 'ON',
          interview: {
            mainTaxpayer: {
              fullName: `${mainFirstName.trim()} ${mainLastName.trim()}`.trim(),
              firstName: mainFirstName.trim(),
              lastName: mainLastName.trim(),
              sin: sanitizeSin(mainSin),
              dateOfBirth: mainDateOfBirth || null,
              email: mainEmail.trim(),
              provinceCode: mainProvinceCode || 'ON',
              residenceProvinceDec31: mainProvinceCode || 'ON'
            },
            household: {
              maritalStatus,
              spouseReturnMode
            },
            spouse: isMarried
              ? {
                  fullName: spouseFullName.trim(),
                  firstName: spouseFirstName.trim(),
                  lastName: spouseLastName.trim(),
                  dateOfBirth: spouseDateOfBirth || null,
                  fullSin: sanitizeSin(spouseSin)
                }
              : {},
            dependents: dependents.map((d) => ({
              fullName: d.fullName.trim(),
              relationship: d.relationship.trim(),
              dateOfBirth: d.dateOfBirth || null,
              disability: d.disability,
              createWorkspace: d.createWorkspace
            })),
            cra: {
              becameResidentDate: becameResidentInYear ? becameResidentDate : null,
              ceasedResidentDate: ceasedResidentInYear ? ceasedResidentDate : null,
              maritalStatusChangeDate: maritalStatusChangedInYear ? maritalStatusChangeDate : null,
              deceasedDate: deceasedInYear ? deceasedDate : null,
              electionsCanadianCitizen,
              electionsAuthorize,
              foreignPropertyOver100k
            }
          }
        })
      })
      const linkedCount = payload.taxReturn?.createdLinkedWorkspaces?.length || 0
      if (linkedCount > 0) {
        setCreatedInfo(`Created primary return plus ${linkedCount} linked workspace${linkedCount > 1 ? 's' : ''}.`)
      } else {
        setCreatedInfo('Created primary return workspace.')
      }
      resetInterview()
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not create tax return')
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async (returnId: string, taxpayer: string, year: number) => {
    const confirmed = window.confirm(`Delete ${taxpayer} ${year} return?\n\nThis will permanently remove the return and all related tax data.`)
    if (!confirmed) return
    setDeletingId(returnId)
    setErr(null)
    try {
      await taxFetch(`/tax-returns/${returnId}`, getToken, { method: 'DELETE' })
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not delete tax return')
    } finally {
      setDeletingId(null)
    }
  }

  const workspaceRoleLabel = (r: TaxReturnSummary) => {
    const role = String(r.workspace_role || 'primary')
    if (role === 'spouse') return 'Spouse workspace'
    if (role === 'dependent') return 'Dependent workspace'
    return 'Primary workspace'
  }

  const grouped = useMemo(() => {
    const roots = returns.filter((r) => !r.parent_tax_return_id)
    const childrenByParent = new Map<string, TaxReturnSummary[]>()
    for (const item of returns) {
      if (!item.parent_tax_return_id) continue
      const current = childrenByParent.get(item.parent_tax_return_id) || []
      current.push(item)
      childrenByParent.set(item.parent_tax_return_id, current)
    }
    return { roots, childrenByParent }
  }, [returns])

  return (
    <>
      <SEO
        title="Tax Returns | Tax Intelligence | Client Portal"
        description="Manage T1 tax returns in the Tax Intelligence module."
        canonical="/app/tax-intelligence/returns"
      />
      <ClientPortalShell>
        <div className="space-y-6">
          <header>
            <h1 className="text-3xl font-bold text-primary-dark">Tax Returns</h1>
            <p className="text-sm text-text-light mt-1">
              Create and manage Canadian T1 return workspaces.
            </p>
          </header>

          <section className="bg-white p-4 rounded-lg border border-border shadow-sm">
            <h2 className="text-lg font-semibold text-primary-dark mb-1">Create return interview</h2>
            <p className="text-xs text-text-light mb-4">Step {step} of 4 — interview-driven setup for household workspaces.</p>

            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input className="border border-border rounded-md px-3 py-2 text-sm" placeholder="Main taxpayer first name" value={mainFirstName} onChange={(e) => setMainFirstName(e.target.value)} disabled={saving} />
                <input className="border border-border rounded-md px-3 py-2 text-sm" placeholder="Main taxpayer last name" value={mainLastName} onChange={(e) => setMainLastName(e.target.value)} disabled={saving} />
                <input className="border border-border rounded-md px-3 py-2 text-sm" placeholder="SIN (9 digits)" value={mainSin} onChange={(e) => setMainSin(e.target.value.replace(/\D/g, '').slice(0, 9))} disabled={saving} />
                <input className="border border-border rounded-md px-3 py-2 text-sm" type="date" value={mainDateOfBirth} onChange={(e) => setMainDateOfBirth(e.target.value)} disabled={saving} />
                <input className="border border-border rounded-md px-3 py-2 text-sm" type="email" placeholder="Email (optional)" value={mainEmail} onChange={(e) => setMainEmail(e.target.value)} disabled={saving} />
                <input className="border border-border rounded-md px-3 py-2 text-sm" placeholder="Province on Dec 31 (e.g. ON)" value={mainProvinceCode} onChange={(e) => setMainProvinceCode(e.target.value.toUpperCase().slice(0, 4))} disabled={saving} />
                <input className="border border-border rounded-md px-3 py-2 text-sm md:col-span-2" type="number" min={2000} max={2100} value={taxYear} onChange={(e) => setTaxYear(Number(e.target.value))} disabled={saving} />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select className="border border-border rounded-md px-3 py-2 text-sm" value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value as MaritalStatus)} disabled={saving}>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="common_law">Common-law</option>
                    <option value="separated">Separated</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                  </select>
                  {isMarried && (
                    <select className="border border-border rounded-md px-3 py-2 text-sm" value={spouseReturnMode} onChange={(e) => setSpouseReturnMode(e.target.value as SpouseMode)} disabled={saving}>
                      <option value="summary">Spouse summary only</option>
                      <option value="full">Create full spouse return workspace</option>
                    </select>
                  )}
                </div>

                {isMarried && spouseReturnMode === 'summary' && (
                  <input className="border border-border rounded-md px-3 py-2 text-sm w-full" placeholder="Spouse full name" value={spouseFullName} onChange={(e) => setSpouseFullName(e.target.value)} disabled={saving} />
                )}

                {isMarried && spouseReturnMode === 'full' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input className="border border-border rounded-md px-3 py-2 text-sm" placeholder="Spouse first name" value={spouseFirstName} onChange={(e) => setSpouseFirstName(e.target.value)} disabled={saving} />
                    <input className="border border-border rounded-md px-3 py-2 text-sm" placeholder="Spouse last name" value={spouseLastName} onChange={(e) => setSpouseLastName(e.target.value)} disabled={saving} />
                    <input className="border border-border rounded-md px-3 py-2 text-sm" type="date" value={spouseDateOfBirth} onChange={(e) => setSpouseDateOfBirth(e.target.value)} disabled={saving} />
                    <input className="border border-border rounded-md px-3 py-2 text-sm" placeholder="Spouse SIN (9 digits)" value={spouseSin} onChange={(e) => setSpouseSin(e.target.value.replace(/\D/g, '').slice(0, 9))} disabled={saving} />
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-primary-dark">Dependents</h3>
                    <button type="button" className="text-sm text-accent hover:underline" onClick={addDependent} disabled={saving}>Add dependent</button>
                  </div>
                  {dependents.length === 0 && (
                    <p className="text-xs text-text-light">No dependents added.</p>
                  )}
                  {dependents.map((d) => (
                    <div key={d.id} className="border border-border rounded-md p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input className="border border-border rounded-md px-3 py-2 text-sm" placeholder="Dependent full name" value={d.fullName} onChange={(e) => updateDependent(d.id, { fullName: e.target.value })} disabled={saving} />
                      <input className="border border-border rounded-md px-3 py-2 text-sm" placeholder="Relationship (child, parent, etc.)" value={d.relationship} onChange={(e) => updateDependent(d.id, { relationship: e.target.value })} disabled={saving} />
                      <input className="border border-border rounded-md px-3 py-2 text-sm" type="date" value={d.dateOfBirth} onChange={(e) => updateDependent(d.id, { dateOfBirth: e.target.value })} disabled={saving} />
                      <div className="flex items-center gap-4 text-sm">
                        <label className="inline-flex items-center gap-2"><input type="checkbox" checked={d.disability} onChange={(e) => updateDependent(d.id, { disability: e.target.checked })} disabled={saving} /> Disability amount eligible</label>
                        <label className="inline-flex items-center gap-2"><input type="checkbox" checked={d.createWorkspace} onChange={(e) => updateDependent(d.id, { createWorkspace: e.target.checked })} disabled={saving} /> Create return workspace</label>
                      </div>
                      <button type="button" className="text-sm text-red-700 hover:underline md:col-span-2 text-left" onClick={() => removeDependent(d.id)} disabled={saving}>Remove dependent</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3 text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" checked={becameResidentInYear} onChange={(e) => setBecameResidentInYear(e.target.checked)} disabled={saving} /> Became a resident of Canada during the year</label>
                {becameResidentInYear && <input className="border border-border rounded-md px-3 py-2 text-sm w-full md:w-64" type="date" value={becameResidentDate} onChange={(e) => setBecameResidentDate(e.target.value)} disabled={saving} />}
                <label className="flex items-center gap-2"><input type="checkbox" checked={ceasedResidentInYear} onChange={(e) => setCeasedResidentInYear(e.target.checked)} disabled={saving} /> Ceased to be a resident of Canada during the year</label>
                {ceasedResidentInYear && <input className="border border-border rounded-md px-3 py-2 text-sm w-full md:w-64" type="date" value={ceasedResidentDate} onChange={(e) => setCeasedResidentDate(e.target.value)} disabled={saving} />}
                <label className="flex items-center gap-2"><input type="checkbox" checked={maritalStatusChangedInYear} onChange={(e) => setMaritalStatusChangedInYear(e.target.checked)} disabled={saving} /> Marital status changed during the year</label>
                {maritalStatusChangedInYear && <input className="border border-border rounded-md px-3 py-2 text-sm w-full md:w-64" type="date" value={maritalStatusChangeDate} onChange={(e) => setMaritalStatusChangeDate(e.target.value)} disabled={saving} />}
                <label className="flex items-center gap-2"><input type="checkbox" checked={deceasedInYear} onChange={(e) => setDeceasedInYear(e.target.checked)} disabled={saving} /> Taxpayer is filing for a deceased individual</label>
                {deceasedInYear && <input className="border border-border rounded-md px-3 py-2 text-sm w-full md:w-64" type="date" value={deceasedDate} onChange={(e) => setDeceasedDate(e.target.value)} disabled={saving} />}
                <div className="pt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label className="flex flex-col gap-1">Canadian citizen?<select className="border border-border rounded-md px-3 py-2" value={electionsCanadianCitizen == null ? '' : electionsCanadianCitizen ? 'yes' : 'no'} onChange={(e) => setElectionsCanadianCitizen(e.target.value ? e.target.value === 'yes' : null)} disabled={saving}><option value="">Select</option><option value="yes">Yes</option><option value="no">No</option></select></label>
                  <label className="flex flex-col gap-1">Authorize CRA to share data?<select className="border border-border rounded-md px-3 py-2" value={electionsAuthorize == null ? '' : electionsAuthorize ? 'yes' : 'no'} onChange={(e) => setElectionsAuthorize(e.target.value ? e.target.value === 'yes' : null)} disabled={saving}><option value="">Select</option><option value="yes">Yes</option><option value="no">No</option></select></label>
                  <label className="flex flex-col gap-1">Foreign property over $100k?<select className="border border-border rounded-md px-3 py-2" value={foreignPropertyOver100k == null ? '' : foreignPropertyOver100k ? 'yes' : 'no'} onChange={(e) => setForeignPropertyOver100k(e.target.value ? e.target.value === 'yes' : null)} disabled={saving}><option value="">Select</option><option value="yes">Yes</option><option value="no">No</option></select></label>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="text-sm text-text space-y-2">
                <p><span className="font-semibold">Main taxpayer:</span> {mainFirstName.trim()} {mainLastName.trim()} · {taxYear}</p>
                <p><span className="font-semibold">Household:</span> {maritalStatus}{isMarried ? ` · spouse mode: ${spouseReturnMode}` : ''}</p>
                <p><span className="font-semibold">Dependents:</span> {dependents.length} total · {dependents.filter((d) => d.createWorkspace).length} workspace(s) requested</p>
                <p className="text-xs text-text-light">Creating this interview will generate the primary return and any linked spouse/dependent workspaces selected above.</p>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between gap-2">
              <button type="button" className="text-sm text-text-light hover:text-primary-dark disabled:opacity-50" onClick={onBack} disabled={saving || step === 1}>Back</button>
              <div className="flex items-center gap-2">
                {step < 4 && (
                  <button type="button" className="btn btn--primary text-sm px-4 py-2" disabled={saving} onClick={onNext}>
                    Continue
                  </button>
                )}
                {step === 4 && (
                  <button type="button" className="btn btn--primary text-sm px-4 py-2" disabled={saving} onClick={() => { void onCreate() }}>
                    {saving ? 'Creating…' : 'Create household workspaces'}
                  </button>
                )}
              </div>
            </div>
            {err && (
              <p className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{err}</p>
            )}
            {createdInfo && (
              <p className="mt-3 text-sm text-green-800 bg-green-50 border border-green-200 rounded-md px-3 py-2">{createdInfo}</p>
            )}
          </section>

          <section className="bg-white p-4 rounded-lg border border-border shadow-sm">
            <h2 className="text-lg font-semibold text-primary-dark mb-3">Existing returns</h2>
            {loading && <p className="text-sm text-text-light">Loading…</p>}
            {!loading && returns.length === 0 && (
              <p className="text-sm text-text-light">No returns yet. Create your first return above.</p>
            )}
            {!loading && returns.length > 0 && (
              <ul className="divide-y divide-border">
                {grouped.roots.map((r) => (
                  <li key={r.id} className="py-3 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-text">{r.taxpayer_name}</p>
                        <p className="text-xs text-text-light">
                          {r.tax_year} · {r.status} · {workspaceRoleLabel(r)} · updated {new Date(r.updated_at).toLocaleString()}
                        </p>
                        {String(r.workspace_role || 'primary') === 'primary' && (() => {
                          const readiness = computeSetupReadiness(r)
                          if (readiness.required === 0 && readiness.recommended === 0) {
                            return (
                              <Link
                                to={`${basePath}/returns/${r.id}?step=Setup&setupFocus=all`}
                                className="mt-1 inline-flex items-center text-[11px] text-green-800 border border-green-300 bg-green-50 rounded px-2 py-0.5 hover:bg-green-100"
                              >
                                Setup ready
                              </Link>
                            )
                          }
                          return (
                            <div className="mt-1 flex flex-wrap items-center gap-1">
                              {readiness.required > 0 && (
                                <Link
                                  to={`${basePath}/returns/${r.id}?step=Setup&setupFocus=required`}
                                  className="inline-flex items-center text-[11px] text-amber-900 border border-amber-300 bg-amber-50 rounded px-2 py-0.5 hover:bg-amber-100"
                                  title="Open builder setup and show required missing items"
                                >
                                  {readiness.required} required
                                </Link>
                              )}
                              {readiness.recommended > 0 && (
                                <Link
                                  to={`${basePath}/returns/${r.id}?step=Setup&setupFocus=all`}
                                  className="inline-flex items-center text-[11px] text-blue-900 border border-blue-300 bg-blue-50 rounded px-2 py-0.5 hover:bg-blue-100"
                                  title="Open builder setup and review all missing items"
                                >
                                  {readiness.recommended} review
                                </Link>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="text-sm font-medium text-red-700 hover:underline disabled:opacity-50"
                          disabled={deletingId === r.id}
                          onClick={() => { void onDelete(r.id, r.taxpayer_name, r.tax_year) }}
                        >
                          {deletingId === r.id ? 'Deleting…' : 'Delete'}
                        </button>
                        <Link
                          to={`${basePath}/returns/${r.id}`}
                          className="text-sm font-medium text-accent hover:underline"
                        >
                          Open builder
                        </Link>
                      </div>
                    </div>
                    {(grouped.childrenByParent.get(r.id) || []).length > 0 && (
                      <ul className="ml-4 border-l border-border pl-3 space-y-2">
                        {(grouped.childrenByParent.get(r.id) || []).map((child) => (
                          <li key={child.id} className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium text-text">{child.taxpayer_name}</p>
                              <p className="text-xs text-text-light">{child.tax_year} · {workspaceRoleLabel(child)}</p>
                            </div>
                            <Link
                              to={`${basePath}/returns/${child.id}`}
                              className="text-sm font-medium text-accent hover:underline"
                            >
                              Open
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
                {grouped.roots.length === 0 && returns.map((r) => (
                  <li key={r.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-text">{r.taxpayer_name}</p>
                      <p className="text-xs text-text-light">
                        {r.tax_year} · {r.status} · {workspaceRoleLabel(r)} · updated {new Date(r.updated_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="text-sm font-medium text-red-700 hover:underline disabled:opacity-50"
                        disabled={deletingId === r.id}
                        onClick={() => { void onDelete(r.id, r.taxpayer_name, r.tax_year) }}
                      >
                        {deletingId === r.id ? 'Deleting…' : 'Delete'}
                      </button>
                      <Link
                        to={`${basePath}/returns/${r.id}`}
                        className="text-sm font-medium text-accent hover:underline"
                      >
                        Open builder
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </ClientPortalShell>
    </>
  )
}

export default TaxReturns
