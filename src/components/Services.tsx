import { FC } from 'react'

interface Service {
  pill: string
  title: string
  intro: string
  bullets: string[]
}

const Services: FC = () => {
  const services: Service[] = [
    {
      pill: 'Core Accounting',
      title: 'Core Accounting & Cloud Bookkeeping',
      intro: 'Keep your financials clean, current, and reliable with streamlined day-to-day support.',
      bullets: [
        'Transaction posting and bank reconciliations',
        'Accounts payable and receivable tracking',
        'Monthly financial statements',
        'HST/GST returns and basic compliance support'
      ]
    },
    {
      pill: 'Reporting',
      title: 'Year-End Financials & Reporting',
      intro: 'Clear, organized year-end information to support tax filings, lenders, and management.',
      bullets: [
        'Year-end adjustments and reconciliations',
        'Working papers and supporting schedules',
        'Management-ready financial reports',
        'Liaison with your external tax preparer'
      ]
    },
    {
      pill: 'Tax',
      title: 'Tax Planning & Compliance Support',
      intro: 'Move from reactive filing to proactive planning and structure your affairs more efficiently.',
      bullets: [
        'Basic planning for self-employed and corporations',
        'Timing of income and expenses',
        'Support for documentation and filings',
        'Coordination with your tax preparer as needed'
      ]
    },
    {
      pill: 'Cash Flow',
      title: 'Cash Flow Planning & Forecasting',
      intro: 'Anticipate cash needs, manage uncertainty, and protect the health of your business.',
      bullets: [
        'Cash flow analysis and forecasting',
        'Planning for major expenses and tax payments',
        'Payables and receivables review',
        'Scenario planning for growth decisions'
      ]
    },
    {
      pill: 'Advisory',
      title: 'Fractional Controller & Business Advisory',
      intro: 'Senior-level financial insight without the cost of a full-time hire.',
      bullets: [
        'Budgeting and variance analysis',
        'KPI design and monitoring',
        'Support for pricing, hiring, and capital decisions',
        'Regular financial review meetings'
      ]
    },
    {
      pill: 'Tech & Automation',
      title: 'Accounting Systems & Tech Solutions',
      intro: 'Use technology to reduce manual work, tighten controls, and improve reporting.',
      bullets: [
        'Cloud accounting setup and optimization',
        'Workflow and approval process design',
        'Automation of recurring tasks and reporting',
        'Integration with other business tools and systems'
      ]
    }
  ]

  return (
    <section id="services" className="py-xxl">
      <div className="max-w-[1200px] mx-auto px-md">
        <div className="text-center mb-xl max-w-[800px] mx-auto">
          <h2 className="mb-md">Services</h2>
          <p className="text-lg text-text-light">
            Bringing together accounting, consulting, and technology so you have accurate numbers, practical advice, and modern systems working together.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
          {services.map((service, index) => (
            <div key={index} className="bg-white p-lg rounded-xl shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
              <span className="inline-block px-3 py-1 bg-primary text-white text-xs font-semibold uppercase tracking-wider rounded-full mb-md">{service.pill}</span>
              <h3 className="text-xl mb-sm">{service.title}</h3>
              <p className="text-text-light mb-md text-[0.9375rem]">{service.intro}</p>
              <ul className="list-none">
                {service.bullets.map((bullet, bulletIndex) => (
                  <li key={bulletIndex} className="pl-md mb-xs relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold text-[0.9375rem]">{bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Services

