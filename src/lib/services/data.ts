export interface Service {
  slug: string
  pill: string
  title: string
  intro: string
  bullets: string[]
  details: {
    title: string
    description: string
  }[]
  metaDescription: string
}

export const services: Service[] = [
  {
    slug: 'year-end-reporting',
    pill: 'Reporting',
    title: 'Year-End Financials & Reporting',
    intro:
      'Published fixed fee, a delivery date in the engagement letter, and a working paper file you keep.',
    bullets: [
      'Three published tiers: Compilation, Reporting, Assurance-Ready',
      'Guaranteed delivery window with fee credit if we miss it',
      'Working papers delivered with the statements',
      'CSRS 4200 compilation report and tax-preparer package',
    ],
    details: [
      {
        title: 'Published Fixed Fee',
        description:
          'Three tiers with published prices and defined deliverables. The fee is agreed in writing before we open the file and does not move because the bookkeeping was worse than expected.',
      },
      {
        title: 'Committed Delivery Date',
        description:
          '20, 25 or 35 business days by tier from written confirmation that records are complete. Late delivery within our control reduces the fee automatically.',
      },
      {
        title: 'Working Papers You Keep',
        description:
          'Schedules, reconciliations, adjusting entries and the year-end checklist are delivered with the statements in a portable format you can hand to anyone.',
      },
      {
        title: 'Commentary, Not Just Statements',
        description:
          'Comparatives, movement analysis and written commentary on what changed and why — plus an adjustment list with upstream causes so the same issues stop recurring.',
      },
    ],
    metaDescription:
      'Year-end adjustments, working papers and compiled financial statements for Canadian businesses and not-for-profits. Published fixed fee, a delivery date in the engagement letter, and a working paper file you keep.',
  },
  {
    slug: 'cash-flow-planning',
    pill: 'Cash Flow',
    title: 'Cash Flow Planning & Forecasting',
    intro: 'Anticipate cash needs, manage uncertainty, and protect the health of your business.',
    bullets: [
      'Cash flow analysis and forecasting',
      'Planning for major expenses and tax payments',
      'Payables and receivables review',
      'Scenario planning for growth decisions'
    ],
    details: [
      {
        title: 'Cash Flow Analysis and Forecasting',
        description: 'We analyze your historical cash flow patterns and create forward-looking forecasts to help you anticipate cash needs. These forecasts enable you to plan ahead, identify potential shortfalls, and make informed decisions about spending and investments.'
      },
      {
        title: 'Planning for Major Expenses and Tax Payments',
        description: 'We help you plan for significant expenses and tax payments by creating cash flow projections that account for these obligations. This planning ensures you have sufficient funds available when needed and helps avoid cash flow crises.'
      },
      {
        title: 'Payables and Receivables Review',
        description: 'Regular review of your accounts payable and receivable helps identify opportunities to improve cash flow. We analyze payment terms, aging reports, and collection strategies to optimize your working capital management.'
      },
      {
        title: 'Scenario Planning for Growth Decisions',
        description: 'When considering growth opportunities, we create scenario-based cash flow projections to help you understand the financial implications. These scenarios help you evaluate risks and make informed decisions about expansion, hiring, or major investments.'
      }
    ],
    metaDescription: 'Cash flow planning and forecasting services in Ottawa, Ontario. Cash flow analysis, forecasting, planning for major expenses and tax payments, payables and receivables review, and scenario planning for growth decisions. Expert financial advisory.'
  },
  {
    slug: 'fractional-controller',
    pill: 'Advisory',
    title: 'Fractional Controller & Business Advisory',
    intro:
      'Fixed-fee, fixed-scope fractional controller work that starts with a guaranteed Finance Function Review.',
    bullets: [
      'Published prices and written scope',
      'Finance Function Review before any retainer',
      'Month-end close, cash, KPIs, and controls',
      'Systems automation that reduces manual hours',
    ],
    details: [
      {
        title: 'Finance Function Review',
        description:
          'Every engagement starts with a three-week, fixed-fee review of your books, close, controls, and systems — with a costed remediation plan you own whether or not you retain us.'
      },
      {
        title: 'Fixed Scope Monthly Engagements',
        description:
          'Foundation, Core, and Advanced tiers with published monthly fees, defined deliverables, and out-of-scope work quoted before it starts.'
      },
      {
        title: 'Close, Reporting, and Cash Discipline',
        description:
          'Month-end oversight, reporting packs with commentary, rolling cash flow, budget and reforecast support, and lender or board reporting where needed.'
      },
      {
        title: 'Controls and Automation',
        description:
          'Risk and control assessment is part of the review. Reducing manual close hours through systems work is an explicit engagement objective.'
      }
    ],
    metaDescription:
      'Most fractional controller engagements fail the same four ways. Ours are fixed-fee, fixed-scope, and start with a guaranteed Finance Function Review. Ottawa-based, CPA-led.'
  },
  {
    slug: 'tech-solutions',
    pill: 'Tech & Automation',
    title: 'Accounting Systems & Tech Solutions',
    intro: 'Use technology to reduce manual work, tighten controls, and improve reporting.',
    bullets: [
      'Cloud accounting setup and optimization',
      'Workflow and approval process design',
      'Automation of recurring tasks and reporting',
      'Integration with other business tools and systems'
    ],
    details: [
      {
        title: 'Cloud Accounting Setup and Optimization',
        description: 'We help you select, set up, and optimize cloud accounting systems that fit your business needs. Our expertise ensures you get the most out of your accounting software, with proper chart of accounts, reporting structures, and user access controls.'
      },
      {
        title: 'Workflow and Approval Process Design',
        description: 'We design efficient workflows and approval processes that streamline your operations while maintaining proper internal controls. These processes reduce bottlenecks, improve accountability, and ensure transactions are properly authorized.'
      },
      {
        title: 'Automation of Recurring Tasks and Reporting',
        description: 'We identify opportunities to automate repetitive tasks and reporting, freeing up your time for higher-value activities. Automation reduces errors, improves consistency, and provides real-time visibility into your business performance.'
      },
      {
        title: 'Integration with Other Business Tools and Systems',
        description: 'We help integrate your accounting system with other business tools and systems, creating a seamless flow of information across your organization. These integrations eliminate manual data entry, reduce errors, and provide a unified view of your business operations.'
      }
    ],
    metaDescription: 'Accounting systems and tech solutions in Ottawa, Ontario. Cloud accounting setup and optimization, workflow and approval process design, automation of recurring tasks, and integration with business tools. Expert tech solutions for modern businesses.'
  },
  {
    slug: 'icfm-icfr',
    pill: 'Internal Controls',
    title: 'Internal Controls over Financial Management & Reporting (ICFM/ICFR)',
    intro:
      'Design, document, test, and remediate the controls that protect financial reporting—from your first risk & control matrix through SOX 404 readiness.',
    bullets: [
      'Risk & control matrix design',
      'Process documentation & control testing',
      'Deficiency identification & remediation',
      'SOX 404 readiness & ongoing monitoring'
    ],
    details: [
      {
        title: 'Risk & Control Matrix Design',
        description:
          'Identify key financial statement risks by process and map them to the controls that mitigate them, including control owner, type, frequency, and the assertions each control addresses.'
      },
      {
        title: 'Process Documentation & Narratives',
        description:
          'Auditor-ready process narratives that describe how each financial process works end to end, so control gaps and segregation-of-duties issues are visible before they become findings.'
      },
      {
        title: 'Control Testing & Walkthroughs',
        description:
          'Independent testing of control design and operating effectiveness, with defensible sample sizes, documented procedures, and clear conclusions your auditors can rely on.'
      },
      {
        title: 'Deficiency Remediation & SOX 404 Readiness',
        description:
          'Rate severity, identify root cause, and track remediation to closure. For IPO-bound or public issuers, scope the ICFR program and prepare management’s assessment of internal control effectiveness.'
      },
      {
        title: 'Ongoing Monitoring',
        description:
          'Build the quarterly and annual review cadence—reconciliation reviews, access recertifications, and testing—that keeps your control environment current as the business changes.'
      },
      {
        title: 'Industry-Tailored Frameworks',
        description:
          'Control frameworks tailored to financial services, manufacturing, SaaS & technology, and a cross-industry baseline covering Order-to-Cash, Procure-to-Pay, Payroll, Financial Close & Reporting, Fixed Assets, Treasury & Cash Management, and IT General Controls.'
      }
    ],
    metaDescription:
      'Internal control design, testing, and remediation for growing businesses — from first risk & control matrix to SOX 404 readiness. Ottawa-based, Canada-wide.'
  }
]

export const getServiceBySlug = (slug: string): Service | undefined => {
  return services.find(service => service.slug === slug)
}
