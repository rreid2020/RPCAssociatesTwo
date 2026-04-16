import { DonationForm } from './DonationForm'
import { ResultsPanel } from './ResultsPanel'
import { ScenarioAnalysis } from './ScenarioAnalysis'
import { ScenarioComparison } from './ScenarioComparison'
import { useDonationOptimizer } from '../hooks/useDonationOptimizer'

/**
 * Canadian charitable + federal political donation credit optimizer (2025 parameters in engine).
 * Default export for: `import DonationOptimizer from "@/features/donation-optimizer/components/DonationOptimizer"`
 */
export default function DonationOptimizer() {
  const {
    inputs,
    patchInputs,
    result,
    charitableSensitivityDelta,
    setCharitableSensitivityDelta,
    sensitivityResult,
  } = useDonationOptimizer()

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 py-4 text-text">
      <DonationForm inputs={inputs} onChange={patchInputs} />

      <section className="rounded-lg border border-border bg-white p-4 shadow-sm md:p-6">
        <label className="block text-sm font-medium text-text" htmlFor="charSensitivity" title="Shift charitable donations for a quick marginal preview.">
          Charitable amount sensitivity ({charitableSensitivityDelta >= 0 ? '+' : ''}
          {charitableSensitivityDelta} CAD)
        </label>
        <input
          id="charSensitivity"
          type="range"
          min={-5000}
          max={5000}
          step={100}
          value={charitableSensitivityDelta}
          onChange={(e) => setCharitableSensitivityDelta(Number(e.target.value))}
          className="mt-3 w-full accent-accent"
        />
        <p className="mt-1 text-xs text-text-light">
          Does not change your form values; re-runs the optimizer on hypothetical charitable totals.
        </p>
      </section>

      <ResultsPanel inputs={inputs} result={result} sensitivityResult={sensitivityResult} />
      <ScenarioAnalysis result={result} />
      <ScenarioComparison result={result} />
    </div>
  )
}
