export type DependentTaxReturnRequired = 'auto' | 'yes' | 'no'
export type DependentYesNo = 'yes' | 'no'
export type DependentMaritalStatus = 'single' | 'married' | 'common_law' | 'separated' | 'divorced' | 'widowed'

export type DependentRecord = {
  id?: string
  firstName: string
  lastName: string
  relationship: string
  sin: string
  dateOfBirth: string
  netfileAccessCode: string
  residenceProvinceDec31: string
  maritalStatus: DependentMaritalStatus
  hadIncomeInYear: DependentYesNo
  taxReturnRequired: DependentTaxReturnRequired
  disability: boolean
}

export const DEPENDENT_RELATIONSHIP_OPTIONS = [
  'Child',
  'Parent',
  'Grandchild',
  'Sibling',
  'Other'
] as const

export const DEPENDENT_MARITAL_STATUS_OPTIONS: Array<{ value: DependentMaritalStatus; label: string }> = [
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'common_law', label: 'Common-law' },
  { value: 'separated', label: 'Separated' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' }
]

export function isOntarioProvinceCode (value: string): boolean {
  return String(value || '').trim().toUpperCase() === 'ON'
}

export const CANADIAN_PROVINCE_OPTIONS = [
  { value: 'AB', label: 'Alberta' },
  { value: 'BC', label: 'British Columbia' },
  { value: 'MB', label: 'Manitoba' },
  { value: 'NB', label: 'New Brunswick' },
  { value: 'NL', label: 'Newfoundland and Labrador' },
  { value: 'NS', label: 'Nova Scotia' },
  { value: 'NT', label: 'Northwest Territories' },
  { value: 'NU', label: 'Nunavut' },
  { value: 'ON', label: 'Ontario' },
  { value: 'PE', label: 'Prince Edward Island' },
  { value: 'QC', label: 'Quebec' },
  { value: 'SK', label: 'Saskatchewan' },
  { value: 'YT', label: 'Yukon' }
] as const

export function dependentFullName (dep: Pick<DependentRecord, 'firstName' | 'lastName'>): string {
  return `${String(dep.firstName || '').trim()} ${String(dep.lastName || '').trim()}`.trim()
}

export function dependentRequiresFullReturn (
  dep: Pick<DependentRecord, 'hadIncomeInYear' | 'taxReturnRequired'>
): boolean {
  if (dep.taxReturnRequired === 'yes') return true
  if (dep.taxReturnRequired === 'no') return false
  return dep.hadIncomeInYear === 'yes'
}

export function createEmptyDependent (defaults?: Partial<DependentRecord>): DependentRecord {
  return {
    firstName: '',
    lastName: '',
    relationship: '',
    sin: '',
    dateOfBirth: '',
    netfileAccessCode: '',
    residenceProvinceDec31: 'ON',
    maritalStatus: 'single',
    hadIncomeInYear: 'no',
    taxReturnRequired: 'auto',
    disability: false,
    ...defaults
  }
}

export function dependentFromLegacy (value: Record<string, unknown>): DependentRecord {
  const fullName = String(value.fullName || '').trim()
  const parts = fullName.split(/\s+/).filter(Boolean)
  const firstName = String(value.firstName || parts[0] || '').trim()
  const lastName = String(value.lastName || parts.slice(1).join(' ') || '').trim()
  const hadIncomeRaw = value.hadIncomeInYear
  const hadIncomeInYear: DependentYesNo = hadIncomeRaw === true || hadIncomeRaw === 'yes'
    ? 'yes'
    : 'no'
  const taxReturnRequiredRaw = String(value.taxReturnRequired || 'auto').toLowerCase()
  const taxReturnRequired: DependentTaxReturnRequired = taxReturnRequiredRaw === 'yes' || taxReturnRequiredRaw === 'no'
    ? taxReturnRequiredRaw
    : 'auto'

  return createEmptyDependent({
    id: value.id ? String(value.id) : undefined,
    firstName,
    lastName,
    relationship: String(value.relationship || '').trim(),
    sin: String(value.sin || '').replace(/\D/g, '').slice(0, 9),
    dateOfBirth: value.dateOfBirth ? String(value.dateOfBirth).slice(0, 10) : '',
    netfileAccessCode: String(value.netfileAccessCode || '').trim(),
    residenceProvinceDec31: String(value.residenceProvinceDec31 || 'ON').trim().toUpperCase().slice(0, 4),
    maritalStatus: (String(value.maritalStatus || 'single') as DependentMaritalStatus),
    hadIncomeInYear,
    taxReturnRequired,
    disability: Boolean(value.disability)
  })
}

export function serializeDependent (dep: DependentRecord) {
  const fullName = dependentFullName(dep)
  return {
    fullName,
    firstName: dep.firstName.trim(),
    lastName: dep.lastName.trim(),
    relationship: dep.relationship.trim(),
    sin: dep.sin.replace(/\D/g, '').slice(0, 9),
    dateOfBirth: dep.dateOfBirth || null,
    netfileAccessCode: dep.netfileAccessCode.trim(),
    residenceProvinceDec31: dep.residenceProvinceDec31.trim(),
    maritalStatus: dep.maritalStatus,
    hadIncomeInYear: dep.hadIncomeInYear === 'yes',
    taxReturnRequired: dep.taxReturnRequired,
    disability: dep.disability,
    createWorkspace: dependentRequiresFullReturn(dep)
  }
}

export function validateDependentIdentification (dep: DependentRecord, taxYear: number): string | null {
  if (!dep.firstName.trim()) return 'Each dependant needs a first name.'
  if (!dep.lastName.trim()) return 'Each dependant needs a last name.'
  if (!dep.relationship.trim()) return 'Each dependant needs a relationship.'
  if (!dep.dateOfBirth) return 'Each dependant needs a date of birth.'
  if (!dep.residenceProvinceDec31.trim()) return `Each dependant needs a province of residence on December 31, ${taxYear}.`
  if (!dep.maritalStatus) return `Each dependant needs a marital status on December 31, ${taxYear}.`
  if (!dep.taxReturnRequired) return 'Indicate whether each dependant requires a tax return.'
  return null
}
