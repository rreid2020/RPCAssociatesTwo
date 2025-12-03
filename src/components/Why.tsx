import { FC } from 'react'

interface Reason {
  number: number
  title: string
  description: string
}

const Why: FC = () => {
  const reasons: Reason[] = [
    {
      number: 1,
      title: 'Better decisions, backed by real numbers',
      description: 'Reliable financials let you understand profitability by line of business, customer, or project and support smarter, faster decisions.'
    },
    {
      number: 2,
      title: 'Time back to run the business',
      description: 'Delegating routine accounting tasks means more time for client work, sales, operations, and strategic planning.'
    },
    {
      number: 3,
      title: 'Compliance and risk management',
      description: 'Stay on top of filing deadlines, regulatory changes, and documentation requirements, reducing the risk of errors and penalties.'
    },
    {
      number: 4,
      title: 'Proactive tax planning',
      description: 'Anyone can file a return. The value is in planning ahead—structuring your business and income to minimize tax, optimize deductions, and keep more of what you earn.'
    }
  ]

  return (
    <section id="why" className="section">
      <div className="container">
        <div className="section__header">
          <h2 className="section__title">Why Hiring a Great Accountant Matters</h2>
          <p className="section__subtitle">
            A great accountant is more than a bookkeeper or tax filer. They become a strategic partner who helps you understand where you stand today and what it will take to get where you want to go.
          </p>
        </div>
        <div className="why__container">
          <div className="why__content">
            <h3>Beyond compliance: real support for your decisions</h3>
            <p>
              Clean, accurate financials give you a true picture of your business. With reliable numbers, you can see what is profitable, what is not, and where your cash is really going. That clarity supports better decisions around pricing, staffing, and investment.
            </p>
            <p>
              Offloading bookkeeping, reconciliations, and tax deadlines frees up your time to focus on sales, operations, and strategy. You are no longer buried in spreadsheets or chasing paperwork.
            </p>
            <p>
              Tax rules and reporting requirements change regularly. A strong accounting partner helps you stay compliant, reduce the risk of errors, and avoid avoidable penalties—while also focusing on proactive planning instead of last-minute clean-up.
            </p>
          </div>
          <div className="why__reasons">
            {reasons.map((reason) => (
              <div key={reason.number} className="why__reason">
                <div className="why__reason-number">{reason.number}</div>
                <div className="why__reason-content">
                  <h4>{reason.title}</h4>
                  <p>{reason.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Why

