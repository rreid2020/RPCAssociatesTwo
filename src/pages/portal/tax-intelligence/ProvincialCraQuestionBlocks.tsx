import { FC } from 'react'
import {
  CraQuestionRow,
  YesNoToggle,
  yesNoToToggle,
  toggleToYesNo,
  type YesNo
} from './CraQuestionControls'
import {
  getOrganDonorQuestion,
  getProvincialElectionsConfig
} from './craProvinceQuestions.registry'

export const ProvincialCraQuestionBlocks: FC<{
  provinceCode: string
  organDonorConsent: YesNo
  onOrganDonorConsentChange: (value: YesNo) => void
  provincialElectionsCanadianCitizen: YesNo
  onProvincialElectionsCanadianCitizenChange: (value: YesNo) => void
  provincialElectionsAuthorize: YesNo
  onProvincialElectionsAuthorizeChange: (value: YesNo) => void
  disabled?: boolean
}> = ({
  provinceCode,
  organDonorConsent,
  onOrganDonorConsentChange,
  provincialElectionsCanadianCitizen,
  onProvincialElectionsCanadianCitizenChange,
  provincialElectionsAuthorize,
  onProvincialElectionsAuthorizeChange,
  disabled = false
}) => {
  const organDonor = getOrganDonorQuestion(provinceCode)
  const provincialElections = getProvincialElectionsConfig(provinceCode)

  return (
    <>
      {organDonor && (
        <CraQuestionRow label={organDonor.label}>
          <YesNoToggle
            className=""
            value={yesNoToToggle(organDonorConsent)}
            onChange={(value) => onOrganDonorConsentChange(toggleToYesNo(value))}
            disabled={disabled}
          />
        </CraQuestionRow>
      )}
      {provincialElections?.requiresCanadianCitizen && (
        <CraQuestionRow label={provincialElections.citizenLabel}>
          <YesNoToggle
            className=""
            value={yesNoToToggle(provincialElectionsCanadianCitizen)}
            onChange={(value) => {
              onProvincialElectionsCanadianCitizenChange(toggleToYesNo(value))
              if (!value) onProvincialElectionsAuthorizeChange('no')
            }}
            disabled={disabled}
          />
        </CraQuestionRow>
      )}
      {provincialElections && (
        (!provincialElections.requiresCanadianCitizen || provincialElectionsCanadianCitizen === 'yes') && (
          <CraQuestionRow label={provincialElections.authorizeLabel}>
            <YesNoToggle
              className=""
              value={yesNoToToggle(provincialElectionsAuthorize)}
              onChange={(value) => onProvincialElectionsAuthorizeChange(toggleToYesNo(value))}
              disabled={disabled}
            />
          </CraQuestionRow>
        )
      )}
    </>
  )
}
