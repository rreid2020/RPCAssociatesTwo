import { FC } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'

const CashFlowTemplate: FC = () => {
  const downloadUrl = '/downloads/excel-templates/RPC Cash Flow Statement.xlsx'
  const fileName = 'RPC Cash Flow Statement.xlsx'

  return (
    <>
      <SEO
        title="Cash Flow Statement Template (Excel) | Free Download - RPC Associates"
        description="Download our free Excel cash flow statement template for small businesses. Track cash inflows and outflows, monitor liquidity, and plan for major expenditures. Customizable template with operating, investing, and financing activities."
        canonical="/resources/cash-flow-statement-template"
        keywords={[
          'cash flow statement template',
          'excel cash flow template',
          'cash flow statement',
          'small business cash flow',
          'cash flow tracking',
          'financial statement template',
          'business cash management',
          'Ottawa accounting',
          'Canadian business templates',
          'free excel template',
          'cash flow forecasting',
          'liquidity management'
        ]}
      />
      <main>
        {/* Hero Section */}
        <section className="py-xxl bg-background">
          <div className="max-w-[1200px] mx-auto px-md">
            <div className="text-center mb-xl max-w-[800px] mx-auto">
              <span className="inline-block px-4 py-2 bg-primary text-white text-sm font-semibold uppercase tracking-wider rounded-full mb-md">
                Excel Template
              </span>
              <h1 className="text-3xl lg:text-4xl font-bold text-primary mb-md">
                Cash Flow Statement Template (Excel)
              </h1>
              <p className="text-lg text-text-light leading-relaxed mb-lg">
                A comprehensive Excel template designed to help small and owner-managed businesses track cash inflows and outflows, monitor liquidity, and make informed financial decisions.
              </p>
              <a
                href={downloadUrl}
                download={fileName}
                className="btn btn--primary inline-block"
              >
                Download Template
              </a>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-xxl bg-white">
          <div className="max-w-[900px] mx-auto px-md">
            <div className="prose prose-lg max-w-none">
              {/* Introduction */}
              <div className="mb-xl">
                <p className="text-lg text-text-light leading-relaxed mb-md">
                  A cash flow statement is a summary of where cash came from and how it was used over a specific period. 
                  When we refer to "cash" in this context, we mean funds in your operating bank accounts—not just physical currency.
                </p>
                <p className="text-lg text-text-light leading-relaxed mb-md">
                  The cash flow statement is most effective when reviewed alongside the <strong>income statement</strong> and <strong>balance sheet</strong>. 
                  Together, these three reports answer different financial questions:
                </p>
                <ul className="list-none pl-0 mb-md">
                  <li className="mb-sm pl-md relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold">
                    <strong>Income statement:</strong> How profitable was the business?
                  </li>
                  <li className="mb-sm pl-md relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold">
                    <strong>Balance sheet:</strong> What is the business's financial position at a point in time?
                  </li>
                  <li className="mb-sm pl-md relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold">
                    <strong>Cash flow statement:</strong> How liquid is the business, and when did cash move?
                  </li>
                </ul>
                <p className="text-lg text-text-light leading-relaxed">
                  Together, they provide a complete financial picture.
                </p>
              </div>

              {/* Why Cash Flow Matters */}
              <div className="mb-xl">
                <h2 className="text-2xl lg:text-3xl font-bold text-primary mb-md">
                  Why Cash Flow Matters
                </h2>
                <p className="text-lg text-text-light leading-relaxed mb-md font-semibold">
                  Profit does not equal cash.
                </p>
                <p className="text-lg text-text-light leading-relaxed mb-md">
                  A business can be profitable on paper but still face cash shortages due to timing differences. Common examples include:
                </p>
                <ul className="list-none pl-0 mb-md">
                  <li className="mb-sm pl-md relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold">
                    Delayed customer collections
                  </li>
                  <li className="mb-sm pl-md relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold">
                    Payroll and supplier payments occurring before revenue is received
                  </li>
                  <li className="mb-sm pl-md relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold">
                    Inventory purchases
                  </li>
                  <li className="mb-sm pl-md relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold">
                    Loan repayments
                  </li>
                  <li className="mb-sm pl-md relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold">
                    Income tax instalments
                  </li>
                </ul>
                <p className="text-lg text-text-light leading-relaxed">
                  A cash flow statement helps business owners and decision-makers to:
                </p>
                <ul className="list-none pl-0">
                  <li className="mb-sm pl-md relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold">
                    Monitor liquidity and short-term solvency
                  </li>
                  <li className="mb-sm pl-md relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold">
                    Identify operational cash pressure early
                  </li>
                  <li className="mb-sm pl-md relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold">
                    Plan for major expenditures and financing needs
                  </li>
                  <li className="mb-sm pl-md relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold">
                    Support discussions with lenders, investors, and advisors
                  </li>
                  <li className="mb-sm pl-md relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold">
                    Build realistic cash flow forecasts and budgets
                  </li>
                </ul>
              </div>

              {/* What This Template Is Designed to Do */}
              <div className="mb-xl">
                <h2 className="text-2xl lg:text-3xl font-bold text-primary mb-md">
                  What This Template Is Designed to Do
                </h2>
                <p className="text-lg text-text-light leading-relaxed mb-md">
                  This template is designed for small and owner-managed businesses, emphasizing clarity, practicality, and customizability. 
                  It can be adapted to match your chart of accounts and reporting needs for:
                </p>
                <ul className="list-none pl-0 mb-md">
                  <li className="mb-sm pl-md relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold">
                    Monitoring monthly cash flow
                  </li>
                  <li className="mb-sm pl-md relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold">
                    Comparing year-over-year cash performance
                  </li>
                  <li className="mb-sm pl-md relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold">
                    Preparing internal management reports
                  </li>
                  <li className="mb-sm pl-md relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold">
                    Supporting financing or planning discussions
                  </li>
                </ul>
                <h3 className="text-xl font-semibold text-primary mb-md">
                  Key Features
                </h3>
                <ul className="list-none pl-0">
                  <li className="mb-sm pl-md relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold">
                    Customizable line items and categories
                  </li>
                  <li className="mb-sm pl-md relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold">
                    Flexible structure to show detailed cash receipts and payments, or a simplified summary
                  </li>
                  <li className="mb-sm pl-md relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold">
                    Ability to present multiple periods for comparison or planning purposes
                  </li>
                </ul>
              </div>

              {/* The Three Core Sections */}
              <div className="mb-xl">
                <h2 className="text-2xl lg:text-3xl font-bold text-primary mb-md">
                  The Three Core Sections of a Cash Flow Statement
                </h2>
                <p className="text-lg text-text-light leading-relaxed mb-md">
                  Most cash flow statements are organized into three standard sections.
                </p>

                <div className="bg-background p-lg rounded-xl mb-md">
                  <h3 className="text-xl font-semibold text-primary mb-md">
                    1) Operating Activities
                  </h3>
                  <p className="text-text-light leading-relaxed mb-md">
                    Cash generated or used in day-to-day business operations, including:
                  </p>
                  <ul className="list-none pl-0 mb-md">
                    <li className="mb-sm pl-md relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold">
                      Cash received from customers
                    </li>
                    <li className="mb-sm pl-md relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold">
                      Payments to suppliers
                    </li>
                    <li className="mb-sm pl-md relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold">
                      Payroll and employee benefits
                    </li>
                    <li className="mb-sm pl-md relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold">
                      Rent, utilities, and other operating expenses
                    </li>
                  </ul>
                  <p className="text-text-light leading-relaxed m-0">
                    This section reflects the cash impact of core business activities and is closely tied to working capital management.
                  </p>
                </div>

                <div className="bg-background p-lg rounded-xl mb-md">
                  <h3 className="text-xl font-semibold text-primary mb-md">
                    2) Investing Activities
                  </h3>
                  <p className="text-text-light leading-relaxed mb-md">
                    Cash related to the acquisition or disposal of long-term assets, such as:
                  </p>
                  <ul className="list-none pl-0 mb-md">
                    <li className="mb-sm pl-md relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold">
                      Equipment and machinery purchases
                    </li>
                    <li className="mb-sm pl-md relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold">
                      Property and capital asset transactions
                    </li>
                    <li className="mb-sm pl-md relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold">
                      Certain investments or loans made by the business
                    </li>
                  </ul>
                  <p className="text-text-light leading-relaxed m-0">
                    These activities typically reflect longer-term strategic decisions.
                  </p>
                </div>

                <div className="bg-background p-lg rounded-xl mb-md">
                  <h3 className="text-xl font-semibold text-primary mb-md">
                    3) Financing Activities
                  </h3>
                  <p className="text-text-light leading-relaxed mb-md">
                    Cash flows associated with funding the business, including:
                  </p>
                  <ul className="list-none pl-0 mb-md">
                    <li className="mb-sm pl-md relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold">
                      Loan proceeds and repayments
                    </li>
                    <li className="mb-sm pl-md relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold">
                      Owner contributions or withdrawals
                    </li>
                    <li className="mb-sm pl-md relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold">
                      Equity transactions
                    </li>
                    <li className="mb-sm pl-md relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold">
                      Dividends or profit distributions (where applicable)
                    </li>
                  </ul>
                  <p className="text-text-light leading-relaxed m-0">
                    This section explains how the business is financed and how capital is returned to lenders or owners.
                  </p>
                </div>
              </div>

              {/* Practical Guidance */}
              <div className="mb-xl">
                <h2 className="text-2xl lg:text-3xl font-bold text-primary mb-md">
                  Practical Guidance for Using the Template
                </h2>
                <p className="text-lg text-text-light leading-relaxed">
                  Small businesses should build the cash flow statement directly from <strong>actual cash transactions</strong>, 
                  categorizing inflows and outflows into operating, investing, or financing activities. 
                  Businesses with well-maintained accounting records can also prepare statements using accounting data, 
                  but this requires accurate and consistent bookkeeping across the income statement and balance sheet.
                </p>
              </div>

              {/* Common Use Cases */}
              <div className="mb-xl">
                <h2 className="text-2xl lg:text-3xl font-bold text-primary mb-md">
                  Common Use Cases
                </h2>
                <ul className="list-none pl-0">
                  <li className="mb-sm pl-md relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold">
                    Monthly cash flow monitoring
                  </li>
                  <li className="mb-sm pl-md relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold">
                    Identifying seasonal cash patterns
                  </li>
                  <li className="mb-sm pl-md relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold">
                    Planning for tax payments and instalments
                  </li>
                  <li className="mb-sm pl-md relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold">
                    Evaluating hiring decisions or expansion plans
                  </li>
                  <li className="mb-sm pl-md relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold">
                    Preparing lender-ready financial information (when paired with a balance sheet and income statement)
                  </li>
                </ul>
              </div>

              {/* Important Note */}
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-lg rounded mb-xl">
                <h3 className="text-lg font-semibold text-primary mb-sm">
                  Important Note
                </h3>
                <p className="text-text-light leading-relaxed m-0">
                  This resource is for general informational purposes only and does not constitute accounting, tax, or financial advice. 
                  Professional guidance may be required depending on your specific circumstances and reporting needs.
                </p>
              </div>

              {/* Download CTA */}
              <div className="bg-primary text-white p-xl rounded-xl text-center">
                <h2 className="text-2xl lg:text-3xl font-bold mb-md">
                  Ready to Get Started?
                </h2>
                <p className="text-lg mb-lg opacity-90 max-w-2xl mx-auto">
                  Download our free Cash Flow Statement Template and start tracking your business's cash flow today.
                </p>
                <a
                  href={downloadUrl}
                  download={fileName}
                  className="btn bg-white text-primary hover:bg-gray-100 inline-block"
                >
                  Download Template
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Back to Resources */}
        <section className="py-lg bg-background">
          <div className="max-w-[900px] mx-auto px-md">
            <Link 
              to="/resources" 
              className="inline-block text-primary no-underline text-[0.9375rem] transition-all hover:underline"
            >
              ← Back to Resources
            </Link>
          </div>
        </section>
      </main>
    </>
  )
}

export default CashFlowTemplate
