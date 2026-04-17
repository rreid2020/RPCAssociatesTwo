import { useCallback, useMemo, useState } from 'react'
import type { ComparisonInputPayload, FilingType, ProvinceCode } from '../engine/types'
import { compareThisOrThat } from '../engine/donationEngine'

const defaultInputs: ComparisonInputPayload = {
  province: 'ON',
  filingType: 'single',
  taxpayerIncome: 85_000,
  spouseIncome: 0,
  contributionAmount: 1_200,
}

export function useDonationOptimizer() {
  const [inputs, setInputs] = useState<ComparisonInputPayload>(defaultInputs)

  const result = useMemo(() => compareThisOrThat(inputs), [inputs])

  const patchInputs = useCallback((patch: Partial<ComparisonInputPayload>) => {
    setInputs((prev) => {
      const next = { ...prev, ...patch }
      if (patch.filingType === 'single') {
        next.spouseIncome = 0
      }
      return next
    })
  }, [])

  const setProvince = useCallback((province: ProvinceCode) => patchInputs({ province }), [patchInputs])
  const setFilingType = useCallback((filingType: FilingType) => patchInputs({ filingType }), [patchInputs])

  return {
    inputs,
    patchInputs,
    setProvince,
    setFilingType,
    result,
  }
}
