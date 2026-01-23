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
    metaDescription: 'Professional core accounting and cloud bookkeeping services to keep your financials clean, current, and reliable. Transaction posting, bank reconciliations, and monthly financial statements.'
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
    metaDescription: 'Professional year-end financials and reporting services. Year-end adjustments, working papers, management-ready reports, and coordination with your tax preparer.'
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
    metaDescription: 'Tax planning and compliance support services. Strategic planning for self-employed and corporations, income and expense timing, and coordination with tax preparers.'
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
    metaDescription: 'Cash flow planning and forecasting services. Analysis, forecasting, planning for major expenses, and scenario planning for business growth decisions.'
  },
  {
    slug: 'fractional-controller',
    pill: 'Advisory',
    title: 'Fractional Controller & Business Advisory',
    intro: 'Senior-level financial insight without the cost of a full-time hire.',
    bullets: [
      'Budgeting and variance analysis',
      'KPI design and monitoring',
      'Support for pricing, hiring, and capital decisions',
      'Regular financial review meetings'
    ],
    details: [
      {
        title: 'Budgeting and Variance Analysis',
        description: 'We develop comprehensive budgets aligned with your business goals and regularly analyze variances to identify trends and opportunities. This process helps you stay on track financially and make adjustments as needed throughout the year.'
      },
      {
        title: 'KPI Design and Monitoring',
        description: 'We help identify and design key performance indicators (KPIs) that matter most to your business. We then monitor these metrics regularly, providing insights into performance trends and areas that need attention.'
      },
      {
        title: 'Support for Pricing, Hiring, and Capital Decisions',
        description: 'Make informed decisions about pricing strategies, hiring plans, and capital investments with our financial analysis and advisory support. We provide the data and insights you need to evaluate options and understand the financial impact of your decisions.'
      },
      {
        title: 'Regular Financial Review Meetings',
        description: 'Regular financial review meetings ensure you stay informed about your business\'s financial performance and have a forum to discuss questions, concerns, and opportunities. These meetings help you make timely decisions and stay ahead of potential issues.'
      }
    ],
    metaDescription: 'Fractional controller and business advisory services. Budgeting, KPI monitoring, strategic decision support, and regular financial reviews.'
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
    metaDescription: 'Accounting systems and tech solutions. Cloud accounting setup, workflow design, automation, and system integrations to streamline your operations.'
  }
]

export const getServiceBySlug = (slug: string): Service | undefined => {
  return services.find(service => service.slug === slug)
}
