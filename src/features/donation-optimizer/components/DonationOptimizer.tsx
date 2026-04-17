import { DonationForm } from './DonationForm'
import { ResultsPanel } from './ResultsPanel'
import { useDonationOptimizer } from '../hooks/useDonationOptimizer'

/**
 * Canadian charitable vs federal political “this or that” credit comparison (2025 parameters in engine).
 * Default export for: `import DonationOptimizer from "@/features/donation-optimizer/components/DonationOptimizer"`
 */
export default function DonationOptimizer() {
  const { inputs, patchInputs, result } = useDonationOptimizer()

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 py-4 text-text">
      <DonationForm inputs={inputs} onChange={patchInputs} />
      <ResultsPanel inputs={inputs} result={result} />
    </div>
  )
}
