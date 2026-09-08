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
    slug: 'core-accounting',
    pill: 'Core Accounting',
    title: 'Core Accounting & Cloud Bookkeeping',
    intro: 'Keep your financials clean, current, and reliable with streamlined day-to-day support.',
    bullets: [
      'Transaction posting and bank reconciliations',
      'Accounts payable and receivable tracking',
      'Monthly financial statements',
      'HST/GST returns and basic compliance support'
    ],
    details: [
      {
        title: 'Transaction Posting and Bank Reconciliations',
        description: 'We handle the day-to-day posting of your business transactions, ensuring accuracy and completeness. Our team performs regular bank reconciliations to verify that your records match your bank statements, catching discrepancies early and maintaining the integrity of your financial data.'
      },
      {
        title: 'Accounts Payable and Receivable Tracking',
        description: 'Stay on top of what you owe and what\'s owed to you with comprehensive accounts payable and receivable management. We track invoices, payment due dates, and follow up on outstanding receivables to help maintain healthy cash flow.'
      },
      {
        title: 'Monthly Financial Statements',
        description: 'Receive clear, timely monthly financial statements that give you a real-time view of your business performance. These statements include income statements, balance sheets, and cash flow reports tailored to your business needs.'
      },
      {
        title: 'HST/GST Returns and Basic Compliance Support',
        description: 'We prepare and file your HST/GST returns on time, ensuring compliance with CRA requirements. Our team also provides guidance on basic compliance matters to help you avoid penalties and stay current with your tax obligations.'
      }
    ],
    metaDescription: 'Professional core accounting and cloud bookkeeping services in Ottawa, Canada. Keep your financials clean, current, and reliable with transaction posting, bank reconciliations, monthly financial statements, and HST/GST returns. Expert CPA services for growing businesses.'
  },
  {
    slug: 'year-end-reporting',
    pill: 'Reporting',
    title: 'Year-End Financials & Reporting',
    intro: 'Clear, organized year-end information to support tax filings, lenders, and management.',
    bullets: [
      'Year-end adjustments and reconciliations',
      'Working papers and supporting schedules',
      'Management-ready financial reports',
      'Liaison with your external tax preparer'
    ],
    details: [
      {
        title: 'Year-End Adjustments and Reconciliations',
        description: 'We perform comprehensive year-end adjustments to ensure your financial statements accurately reflect your business\'s financial position. This includes depreciation calculations, accruals, prepaid expenses, and other necessary adjustments to align with accounting standards.'
      },
      {
        title: 'Working Papers and Supporting Schedules',
        description: 'We maintain detailed working papers and supporting schedules that document all adjustments and provide a clear audit trail. These documents are essential for tax preparation, audits, and understanding the basis for your financial statements.'
      },
      {
        title: 'Management-Ready Financial Reports',
        description: 'Receive professional, management-ready financial reports that present your year-end results in a clear, actionable format. These reports are designed to help you understand your business performance and make informed decisions.'
      },
      {
        title: 'Liaison with Your External Tax Preparer',
        description: 'We work directly with your external tax preparer to ensure they have all the information and documentation needed for your tax filings. This coordination saves you time and helps ensure accuracy in your tax returns.'
      }
    ],
    metaDescription: 'Professional year-end financials and reporting services in Ottawa, Ontario. Year-end adjustments, working papers, management-ready financial reports, and coordination with your tax preparer. Expert accounting services for Canadian businesses.'
  },
  {
    slug: 'tax-planning',
    pill: 'Tax',
    title: 'Tax Planning & Compliance Support',
    intro: 'Move from reactive filing to proactive planning and structure your affairs more efficiently.',
    bullets: [
      'Basic planning for self-employed and corporations',
      'Timing of income and expenses',
      'Support for documentation and filings',
      'Coordination with your tax preparer as needed'
    ],
    details: [
      {
        title: 'Basic Planning for Self-Employed and Corporations',
        description: 'We provide strategic tax planning advice tailored to your business structure, whether you\'re self-employed or operating as a corporation. Our planning helps you minimize tax liability while remaining compliant with CRA requirements.'
      },
      {
        title: 'Timing of Income and Expenses',
        description: 'Strategic timing of income recognition and expense deductions can significantly impact your tax liability. We help you understand when to recognize income and when to make purchases to optimize your tax position within the bounds of tax law.'
      },
      {
        title: 'Support for Documentation and Filings',
        description: 'We assist with gathering and organizing the documentation needed for your tax filings, ensuring nothing is missed. Our support helps streamline the filing process and reduces the risk of errors or omissions.'
      },
      {
        title: 'Coordination with Your Tax Preparer as Needed',
        description: 'We work alongside your tax preparer to provide them with accurate financial information and answer questions about your business operations. This collaboration ensures your tax returns are complete and accurate.'
      }
    ],
    metaDescription: 'Tax planning and compliance support services in Ottawa, Canada. Strategic tax planning for self-employed individuals and corporations, income and expense timing, documentation support, and coordination with tax preparers. Expert CPA tax services.'
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
