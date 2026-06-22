import { FC } from 'react'
import {
  CANADIAN_PROVINCE_OPTIONS,
  DEPENDENT_MARITAL_STATUS_OPTIONS,
  DEPENDENT_RELATIONSHIP_OPTIONS,
  dependentRequiresFullReturn,
  type DependentRecord,
  type DependentTaxReturnRequired,
  type DependentYesNo
} from './dependentModel'
import { CraQuestionRow, toggleToYesNo, yesNoToToggle, YesNoToggle } from './CraQuestionControls'

type DependentIdentificationFormProps = {
  value: DependentRecord
  taxYear: number
  disabled?: boolean
  onChange: (patch: Partial<DependentRecord>) => void
  onRemove?: () => void
  showWorkspaceActions?: boolean
  onCreateWorkspace?: () => void
  creatingWorkspace?: boolean
}

const DependentIdentificationForm: FC<DependentIdentificationFormProps> = ({
  value,
  taxYear,
  disabled = false,
  onChange,
  onRemove,
  showWorkspaceActions = false,
  onCreateWorkspace,
  creatingWorkspace = false
}) => {
  const requiresFullReturn = dependentRequiresFullReturn(value)

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-white">
      <div className="px-4 py-3 border-b border-border bg-background/50">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-primary-dark">Dependant identification</h4>
            <p className="text-xs text-text-light mt-1">
              Capture identification and year-end situation first. Full T1 profile questions are only required when the dependant had income or must file a return.
            </p>
          </div>
          {onRemove && (
            <button type="button" className="text-xs text-red-700 hover:underline shrink-0" onClick={onRemove} disabled={disabled}>
              Remove
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-3 border-b border-border bg-background/30">
        <p className="text-xs font-semibold text-primary-dark">Identification</p>
      </div>
      <div className="divide-y divide-border/70">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-4 py-3">
          <label className="text-sm text-text">
            <span className="block mb-1">First name <span className="text-red-600">*</span></span>
            <input
              className="border border-border rounded-md px-3 py-2 text-sm w-full"
              value={value.firstName}
              onChange={(e) => onChange({ firstName: e.target.value })}
              disabled={disabled}
            />
          </label>
          <label className="text-sm text-text">
            <span className="block mb-1">Last name <span className="text-red-600">*</span></span>
            <input
              className="border border-border rounded-md px-3 py-2 text-sm w-full"
              value={value.lastName}
              onChange={(e) => onChange({ lastName: e.target.value })}
              disabled={disabled}
            />
          </label>
        </div>
        <CraQuestionRow label="Relationship">
          <select
            className="border border-border rounded-md px-3 py-2 text-sm min-w-[10rem]"
            value={value.relationship}
            onChange={(e) => onChange({ relationship: e.target.value })}
            disabled={disabled}
          >
            <option value="">Select…</option>
            {DEPENDENT_RELATIONSHIP_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </CraQuestionRow>
        <CraQuestionRow label="Social insurance number (leave blank if dependant has no SIN)">
          <input
            className="border border-border rounded-md px-3 py-2 text-sm w-36"
            placeholder="000-000-000"
            value={value.sin}
            onChange={(e) => onChange({ sin: e.target.value.replace(/\D/g, '').slice(0, 9) })}
            disabled={disabled}
          />
        </CraQuestionRow>
        <CraQuestionRow label="Date of birth">
          <input
            type="date"
            className="border border-border rounded-md px-3 py-2 text-sm"
            value={value.dateOfBirth ? value.dateOfBirth.slice(0, 10) : ''}
            onChange={(e) => onChange({ dateOfBirth: e.target.value })}
            disabled={disabled}
          />
        </CraQuestionRow>
        <CraQuestionRow label="NETFILE access code (Canada Revenue Agency)">
          <input
            className="border border-border rounded-md px-3 py-2 text-sm w-28"
            value={value.netfileAccessCode}
            onChange={(e) => onChange({ netfileAccessCode: e.target.value })}
            disabled={disabled}
          />
        </CraQuestionRow>
      </div>

      <div className="px-4 py-3 border-y border-border bg-background/30">
        <p className="text-xs font-semibold text-primary-dark">Situation on December 31, {taxYear}</p>
        <p className="text-xs text-text-light mt-1">
          Use help text for emigrant or deceased dependant situations when applicable.
        </p>
      </div>
      <div className="divide-y divide-border/70">
        <CraQuestionRow label={`Province of residence on December 31, ${taxYear}`}>
          <select
            className="border border-border rounded-md px-3 py-2 text-sm min-w-[12rem]"
            value={value.residenceProvinceDec31}
            onChange={(e) => onChange({ residenceProvinceDec31: e.target.value })}
            disabled={disabled}
          >
            {CANADIAN_PROVINCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </CraQuestionRow>
        <CraQuestionRow label={`Marital status on December 31, ${taxYear}`}>
          <select
            className="border border-border rounded-md px-3 py-2 text-sm min-w-[12rem]"
            value={value.maritalStatus}
            onChange={(e) => onChange({ maritalStatus: e.target.value as DependentRecord['maritalStatus'] })}
            disabled={disabled}
          >
            {DEPENDENT_MARITAL_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </CraQuestionRow>
        <CraQuestionRow label={`Did this dependant have any income in ${taxYear}?`}>
          <YesNoToggle
            className=""
            value={yesNoToToggle(value.hadIncomeInYear)}
            allowUnset
            onChange={(next) => onChange({ hadIncomeInYear: toggleToYesNo(next) as DependentYesNo })}
            disabled={disabled}
          />
        </CraQuestionRow>
        <CraQuestionRow label="Does this taxpayer require a tax return?">
          <select
            className="border border-border rounded-md px-3 py-2 text-sm min-w-[12rem]"
            value={value.taxReturnRequired}
            onChange={(e) => onChange({ taxReturnRequired: e.target.value as DependentTaxReturnRequired })}
            disabled={disabled}
          >
            <option value="auto">Let platform decide</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </CraQuestionRow>
        <CraQuestionRow label="Eligible for disability amount">
          <YesNoToggle
            className=""
            value={value.disability}
            onChange={(next) => onChange({ disability: next === true })}
            disabled={disabled}
          />
        </CraQuestionRow>
      </div>

      <div className={`px-4 py-3 border-t border-border ${requiresFullReturn ? 'bg-amber-50' : 'bg-background/40'}`}>
        {requiresFullReturn ? (
          <div className="space-y-2">
            <p className="text-sm text-primary-dark font-medium">
              This dependant requires a full tax return workspace.
            </p>
            <p className="text-xs text-text-light">
              After household setup, complete the same identification, mailing, CRA, income, and deduction steps in the dependant&apos;s linked return workspace.
            </p>
            {showWorkspaceActions && onCreateWorkspace && (
              <button
                type="button"
                className="text-sm text-accent hover:underline disabled:opacity-50"
                disabled={disabled || creatingWorkspace}
                onClick={onCreateWorkspace}
              >
                {creatingWorkspace ? 'Creating return workspace…' : 'Create dependant return workspace'}
              </button>
            )}
          </div>
        ) : (
          <p className="text-xs text-text-light">
            Identification only for this dependant. No full return workspace is required unless income or filing obligation changes.
          </p>
        )}
      </div>
    </div>
  )
}

export default DependentIdentificationForm
