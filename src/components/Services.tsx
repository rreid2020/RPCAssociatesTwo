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
    <section id="services" className="section">
      <div className="container">
        <div className="section__header">
          <h2 className="section__title">Services</h2>
          <p className="section__subtitle">
            Bringing together accounting, consulting, and technology so you have accurate numbers, practical advice, and modern systems working together.
          </p>
        </div>
        <div className="services__grid">
          {services.map((service, index) => (
            <div key={index} className="service-card">
              <span className="service-card__pill">{service.pill}</span>
              <h3 className="service-card__title">{service.title}</h3>
              <p className="service-card__intro">{service.intro}</p>
              <ul className="service-card__list">
                {service.bullets.map((bullet, bulletIndex) => (
                  <li key={bulletIndex} className="service-card__item">{bullet}</li>
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

