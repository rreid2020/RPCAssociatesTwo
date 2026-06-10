import { FC } from 'react'

const DisclaimerBanner: FC = () => (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mt-4">
    <p className="text-sm text-yellow-800">
      <strong>Disclaimer:</strong> TaxGPT provides informational content only and does not constitute
      legal, tax, or financial advice. Consult a qualified tax professional for personalized guidance.
    </p>
  </div>
)

export default DisclaimerBanner
