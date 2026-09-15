import { FC } from 'react'

const reasons = [
  {
    title: 'Better decisions, backed by real numbers',
    description:
      'Reliable financials let you understand profitability by line of business, customer, or project and support smarter, faster decisions.',
  },
  {
    title: 'Time back to run the business',
    description:
      'Delegating routine accounting tasks means more time for client work, sales, operations, and strategic planning.',
  },
  {
    title: 'Compliance and risk management',
    description:
      'Stay on top of filing deadlines, regulatory changes, and documentation requirements, reducing the risk of errors and penalties.',
  },
  {
    title: 'Proactive tax planning',
    description:
      'Anyone can file a return. The value is in planning ahead — structuring your business and income to minimize tax, optimize deductions, and keep more of what you earn.',
  },
] as const

const Why: FC = () => {
  return (
    <div className="svc-landing">
      <section id="why" className="alt" style={{ borderTop: '1px solid var(--rule)' }}>
        <div className="wrap">
          <p className="eyebrow">Why it matters</p>
          <h2>Why hiring a great accountant matters</h2>
          <p className="intro">
            A great accountant is more than a bookkeeper or tax filer. They become a strategic partner
            who helps you understand where you stand today and what it will take to get where you want
            to go.
          </p>
          <div className="detail-grid">
            {reasons.map((reason) => (
              <article key={reason.title}>
                <h3>{reason.title}</h3>
                <p>{reason.description}</p>
              </article>
            ))}
          </div>
          <div className="panel panel-accent">
            <h3>Beyond compliance</h3>
            <p>
              Clean financials give you a true picture of the business. Offloading bookkeeping and
              deadlines frees time for sales and strategy. Tax rules change regularly — a strong
              partner helps you stay compliant while focusing on planning instead of last-minute
              clean-up.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Why
