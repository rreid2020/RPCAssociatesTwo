import { useCallback, useMemo, useState } from 'react'
import type { FilingType, InputPayload, ProvinceCode } from '../engine/types'
import { optimizeDonations } from '../engine/optimizationEngine'

const defaultInputs: InputPayload = {
  province: 'ON',
  filingType: 'single',
  taxpayerIncome: 85_000,
  spouseIncome: 0,
  charitableDonations: 1_200,
  politicalDonations: 450,
  priorCharitableDonations: 0,
}

export function useDonationOptimizer() {
  const [inputs, setInputs] = useState<InputPayload>(defaultInputs)
  /** What-if offset applied only to the displayed charitable amount for sensitivity (does not change political). */
  const [charitableSensitivityDelta, setCharitableSensitivityDelta] = useState(0)

  const result = useMemo(() => optimizeDonations(inputs), [inputs])

  const sensitivityResult = useMemo(() => {
    if (charitableSensitivityDelta === 0) return null
    return optimizeDonations({
      ...inputs,
      charitableDonations: Math.max(0, round0(inputs.charitableDonations + charitableSensitivityDelta)),
    })
  }, [inputs, charitableSensitivityDelta])

  const patchInputs = useCallback((patch: Partial<InputPayload>) => {
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
    charitableSensitivityDelta,
    setCharitableSensitivityDelta,
    sensitivityResult,
  }
}

function round0(n: number): number {
  return Math.round(n)
}
