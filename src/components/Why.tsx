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
    <section id="why" className="py-xxl">
      <div className="max-w-[1200px] mx-auto px-md">
        <div className="text-center mb-xl max-w-[800px] mx-auto">
          <h2 className="mb-md">Why Hiring a Great Accountant Matters</h2>
          <p className="text-lg text-text-light">
            A great accountant is more than a bookkeeper or tax filer. They become a strategic partner who helps you understand where you stand today and what it will take to get where you want to go.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-xxl items-start">
          <div>
            <h3 className="mb-md">Beyond compliance: real support for your decisions</h3>
            <p className="mb-md">
              Clean, accurate financials give you a true picture of your business. With reliable numbers, you can see what is profitable, what is not, and where your cash is really going. That clarity supports better decisions around pricing, staffing, and investment.
            </p>
            <p className="mb-md">
              Offloading bookkeeping, reconciliations, and tax deadlines frees up your time to focus on sales, operations, and strategy. You are no longer buried in spreadsheets or chasing paperwork.
            </p>
            <p>
              Tax rules and reporting requirements change regularly. A strong accounting partner helps you stay compliant, reduce the risk of errors, and avoid avoidable penalties—while also focusing on proactive planning instead of last-minute clean-up.
            </p>
          </div>
          <div className="flex flex-col gap-lg">
            {reasons.map((reason) => (
              <div key={reason.number} className="flex gap-md">
                <div className="flex-shrink-0 w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center font-bold text-lg">
                  {reason.number}
                </div>
                <div>
                  <h4 className="text-lg mb-xs">{reason.title}</h4>
                  <p className="text-[0.9375rem] text-text-light mb-0">{reason.description}</p>
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

