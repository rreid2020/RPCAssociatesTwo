import { FC } from 'react'

const RiskBanner: FC = () => (
  <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded-r-lg">
    <p className="text-sm text-red-700">
      <strong>High-risk topic detected:</strong> This question may require professional review.
      Consult a qualified tax professional before making decisions.
    </p>
  </div>
)

export default RiskBanner
