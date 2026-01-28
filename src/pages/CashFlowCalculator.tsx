import { FC, useState } from 'react'
import SEO from '../components/SEO'
import CalendlyButton from '../components/CalendlyButton'
import { Link } from 'react-router-dom'

interface CashFlowInputs {
  // Operating Activities
  cashFromCustomers: string
  paymentsToSuppliers: string
  payrollExpenses: string
  rentAndUtilities: string
  otherOperatingExpenses: string

  // Investing Activities
  equipmentPurchases: string
  assetSales: string
  otherInvestingActivities: string

  // Financing Activities
  loanProceeds: string
  loanRepayments: string
  ownerContributions: string
  ownerWithdrawals: string
  otherFinancingActivities: string

  // Beginning Cash Balance
  beginningCashBalance: string
}

interface CashFlowResults {
  operatingCashFlow: number
  investingCashFlow: number
  financingCashFlow: number
  netCashFlow: number
  endingCashBalance: number
}

const CashFlowCalculator: FC = () => {
  const [inputs, setInputs] = useState<CashFlowInputs>({
    // Operating Activities
    cashFromCustomers: '',
    paymentsToSuppliers: '',
    payrollExpenses: '',
    rentAndUtilities: '',
    otherOperatingExpenses: '',

    // Investing Activities
    equipmentPurchases: '',
    assetSales: '',
    otherInvestingActivities: '',

    // Financing Activities
    loanProceeds: '',
    loanRepayments: '',
    ownerContributions: '',
    ownerWithdrawals: '',
    otherFinancingActivities: '',

    // Beginning Cash Balance
    beginningCashBalance: '',
  })

  const [results, setResults] = useState<CashFlowResults | null>(null)
  const [hasCalculated, setHasCalculated] = useState(false)

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const parseNumber = (value: string): number => {
    const cleaned = value.replace(/[^0-9.-]/g, '')
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
  }

  const sanitizeNumericInput = (value: string): string => {
    // Allow digits, one decimal point, and a leading minus sign
    let cleaned = value.replace(/[^0-9.-]/g, '')
    const hasLeadingMinus = cleaned.startsWith('-')
    cleaned = cleaned.replace(/-/g, '')
    const parts = cleaned.split('.')
    const integerPart = parts[0] ?? ''
    const decimalPart = parts.length > 1 ? parts.slice(1).join('') : ''
    const normalized = decimalPart ? `${integerPart}.${decimalPart}` : integerPart
    return hasLeadingMinus ? `-${normalized}` : normalized
  }

  const handleInputChange = (field: keyof CashFlowInputs, value: string) => {
    const sanitized = sanitizeNumericInput(value)
    setInputs((prev) => ({ ...prev, [field]: sanitized }))
    setHasCalculated(false)
  }

  const calculateCashFlow = () => {
    const getValue = (field: keyof CashFlowInputs) => parseNumber(inputs[field])

    // Operating Activities
    const operatingCashFlow =
      getValue('cashFromCustomers') -
      getValue('paymentsToSuppliers') -
      getValue('payrollExpenses') -
      getValue('rentAndUtilities') -
      getValue('otherOperatingExpenses')

    // Investing Activities (purchases are negative, sales are positive)
    const investingCashFlow =
      getValue('assetSales') -
      getValue('equipmentPurchases') +
      getValue('otherInvestingActivities')

    // Financing Activities
    const financingCashFlow =
      getValue('loanProceeds') +
      getValue('ownerContributions') -
      getValue('loanRepayments') -
      getValue('ownerWithdrawals') +
      getValue('otherFinancingActivities')

    // Net Cash Flow
    const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow

    // Ending Cash Balance
    const endingCashBalance = getValue('beginningCashBalance') + netCashFlow

    setResults({
      operatingCashFlow,
      investingCashFlow,
      financingCashFlow,
      netCashFlow,
      endingCashBalance,
    })
    setHasCalculated(true)
  }

  const resetCalculator = () => {
    setInputs({
      cashFromCustomers: '',
      paymentsToSuppliers: '',
      payrollExpenses: '',
      rentAndUtilities: '',
      otherOperatingExpenses: '',
      equipmentPurchases: '',
      assetSales: '',
      otherInvestingActivities: '',
      loanProceeds: '',
      loanRepayments: '',
      ownerContributions: '',
      ownerWithdrawals: '',
      otherFinancingActivities: '',
      beginningCashBalance: '',
    })
    setResults(null)
    setHasCalculated(false)
  }

  const InputField = ({
    label,
    field,
    placeholder = '0.00',
    helpText,
  }: {
    label: string
    field: keyof CashFlowInputs
    placeholder?: string
    helpText?: string
  }) => (
    <div className="w-full">
      <label
        htmlFor={field}
        className="block text-sm font-medium text-text mb-1"
      >
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light">
          $
        </span>
        <input
          type="text"
          inputMode="decimal"
          id={field}
          value={inputs[field]}
          onChange={(e) => handleInputChange(field, e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full pl-8 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text bg-white"
        />
      </div>
      {helpText && (
        <p className="mt-1 text-xs text-text-light">{helpText}</p>
      )}
    </div>
  )

  return (
    <>
      <SEO
        title="Cash Flow Calculator | Free Business Cash Flow Tool - RPC Associates"
        description="Calculate your business cash flow with our free online calculator. Track operating, investing, and financing activities to understand your cash position and liquidity."
        canonical="/resources/cash-flow-calculator"
        keywords={[
          'cash flow calculator',
          'business cash flow',
          'cash flow statement',
          'operating cash flow',
          'investing cash flow',
          'financing cash flow',
          'liquidity calculator',
          'business financial calculator',
          'Ottawa accounting',
          'Canadian business tools',
        ]}
      />
      <main className="py-xxl min-h-[60vh]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <section className="mb-8 sm:mb-12">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-4">
                Cash Flow Calculator
              </h1>
              <p className="text-base sm:text-lg text-text-light leading-relaxed mb-6">
                Having adequate cash flow is essential to keep your business running. If you run out of available cash, you run the risk of not being able to meet your current obligations such as your payroll, accounts payable, and loan payments. Use this calculator to help you determine the cash flow generated by your business.
              </p>
            </div>
          </section>

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Input Section */}
            <div className="flex-1">
              <div className="bg-white rounded-xl shadow-sm border border-border p-4 sm:p-6 lg:p-8">
                <h2 className="text-xl sm:text-2xl font-bold text-primary mb-6">
                  Enter Your Cash Flow Information
                </h2>

                {/* Beginning Cash Balance */}
                <div className="mb-8 pb-8 border-b border-border">
                  <h3 className="text-lg font-semibold text-primary mb-4">
                    Beginning Cash Balance
                  </h3>
                  <InputField
                    label="Starting Cash Balance"
                    field="beginningCashBalance"
                    helpText="The cash balance at the beginning of the period"
                  />
                </div>

                {/* Operating Activities */}
                <div className="mb-8 pb-8 border-b border-border">
                  <h3 className="text-lg font-semibold text-primary mb-4">
                    Operating Activities
                  </h3>
                  <div className="space-y-4">
                    <InputField
                      label="Cash Received from Customers"
                      field="cashFromCustomers"
                      helpText="Total cash collected from sales"
                    />
                    <InputField
                      label="Payments to Suppliers"
                      field="paymentsToSuppliers"
                      helpText="Cash paid to vendors and suppliers"
                    />
                    <InputField
                      label="Payroll Expenses"
                      field="payrollExpenses"
                      helpText="Salaries, wages, and benefits paid"
                    />
                    <InputField
                      label="Rent and Utilities"
                      field="rentAndUtilities"
                      helpText="Office rent, utilities, and related expenses"
                    />
                    <InputField
                      label="Other Operating Expenses"
                      field="otherOperatingExpenses"
                      helpText="Other day-to-day business expenses"
                    />
                  </div>
                </div>

                {/* Investing Activities */}
                <div className="mb-8 pb-8 border-b border-border">
                  <h3 className="text-lg font-semibold text-primary mb-4">
                    Investing Activities
                  </h3>
                  <div className="space-y-4">
                    <InputField
                      label="Equipment Purchases"
                      field="equipmentPurchases"
                      helpText="Cash spent on equipment and capital assets"
                    />
                    <InputField
                      label="Asset Sales"
                      field="assetSales"
                      helpText="Cash received from selling assets"
                    />
                    <InputField
                      label="Other Investing Activities"
                      field="otherInvestingActivities"
                      helpText="Other investing-related cash flows"
                    />
                  </div>
                </div>

                {/* Financing Activities */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-primary mb-4">
                    Financing Activities
                  </h3>
                  <div className="space-y-4">
                    <InputField
                      label="Loan Proceeds"
                      field="loanProceeds"
                      helpText="Cash received from loans and borrowings"
                    />
                    <InputField
                      label="Loan Repayments"
                      field="loanRepayments"
                      helpText="Cash paid to repay loans"
                    />
                    <InputField
                      label="Owner Contributions"
                      field="ownerContributions"
                      helpText="Cash invested by owners"
                    />
                    <InputField
                      label="Owner Withdrawals"
                      field="ownerWithdrawals"
                      helpText="Cash withdrawn by owners"
                    />
                    <InputField
                      label="Other Financing Activities"
                      field="otherFinancingActivities"
                      helpText="Other financing-related cash flows"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                  <button
                    onClick={calculateCashFlow}
                    className="flex-1 btn btn--primary py-3 px-6 text-base font-semibold rounded-lg transition-all"
                  >
                    Calculate Cash Flow
                  </button>
                  <button
                    onClick={resetCalculator}
                    className="flex-1 sm:flex-initial btn btn--secondary py-3 px-6 text-base font-semibold rounded-lg transition-all"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Results Section */}
            <div className="flex-1 lg:max-w-md">
              <div className="bg-white rounded-xl shadow-sm border border-border p-4 sm:p-6 lg:p-8 sticky top-4">
                <h2 className="text-xl sm:text-2xl font-bold text-primary mb-6">
                  Cash Flow Results
                </h2>

                {!hasCalculated ? (
                  <div className="text-center py-12">
                    <p className="text-text-light mb-4">
                      Enter your cash flow information and click "Calculate Cash Flow" to see your results.
                    </p>
                  </div>
                ) : results ? (
                  <div className="space-y-6">
                    {/* Operating Cash Flow */}
                    <div className="bg-background p-4 rounded-lg border border-border">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-text-light">
                          Operating Cash Flow
                        </span>
                        <span
                          className={`text-lg font-bold ${
                            results.operatingCashFlow >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {formatCurrency(results.operatingCashFlow)}
                        </span>
                      </div>
                      <p className="text-xs text-text-light mt-1">
                        Cash from day-to-day business operations
                      </p>
                    </div>

                    {/* Investing Cash Flow */}
                    <div className="bg-background p-4 rounded-lg border border-border">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-text-light">
                          Investing Cash Flow
                        </span>
                        <span
                          className={`text-lg font-bold ${
                            results.investingCashFlow >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {formatCurrency(results.investingCashFlow)}
                        </span>
                      </div>
                      <p className="text-xs text-text-light mt-1">
                        Cash from buying/selling assets
                      </p>
                    </div>

                    {/* Financing Cash Flow */}
                    <div className="bg-background p-4 rounded-lg border border-border">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-text-light">
                          Financing Cash Flow
                        </span>
                        <span
                          className={`text-lg font-bold ${
                            results.financingCashFlow >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {formatCurrency(results.financingCashFlow)}
                        </span>
                      </div>
                      <p className="text-xs text-text-light mt-1">
                        Cash from loans and owner transactions
                      </p>
                    </div>

                    {/* Net Cash Flow */}
                    <div className="bg-primary/10 p-4 rounded-lg border-2 border-primary">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-base font-semibold text-primary">
                          Net Cash Flow
                        </span>
                        <span
                          className={`text-xl font-bold ${
                            results.netCashFlow >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {formatCurrency(results.netCashFlow)}
                        </span>
                      </div>
                      <p className="text-xs text-text-light mt-1">
                        Total change in cash for the period
                      </p>
                    </div>

                    {/* Ending Cash Balance */}
                    <div className="bg-background p-4 rounded-lg border border-border">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-text-light">
                          Beginning Cash Balance
                        </span>
                        <span className="text-base font-semibold text-text">
                          {formatCurrency(parseNumber(inputs.beginningCashBalance))}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-2 mt-3 pt-3 border-t border-border">
                        <span className="text-base font-semibold text-primary">
                          Ending Cash Balance
                        </span>
                        <span
                          className={`text-xl font-bold ${
                            results.endingCashBalance >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {formatCurrency(results.endingCashBalance)}
                        </span>
                      </div>
                      <p className="text-xs text-text-light mt-1">
                        Your cash position at the end of the period
                      </p>
                    </div>

                    {/* Warning if negative */}
                    {results.endingCashBalance < 0 && (
                      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg
                              className="h-5 w-5 text-red-400"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-red-700">
                              <strong>Warning:</strong> Your ending cash balance is negative. This indicates a cash flow problem that needs immediate attention.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Information Section */}
          <section className="mt-8 sm:mt-12">
            <div className="bg-background rounded-xl p-4 sm:p-6 lg:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-primary mb-4">
                Understanding Your Cash Flow
              </h2>
              <div className="prose prose-sm max-w-none text-text-light">
                <p className="mb-4">
                  Cash flow is the lifeblood of your business. This calculator helps you understand how cash moves through your business in three key areas:
                </p>
                <ul className="list-none pl-0 space-y-2 mb-4">
                  <li className="flex items-start">
                    <span className="text-primary mr-2 font-bold">•</span>
                    <span>
                      <strong>Operating Activities:</strong> Cash from your day-to-day business operations. Positive operating cash flow indicates your core business is generating cash.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2 font-bold">•</span>
                    <span>
                      <strong>Investing Activities:</strong> Cash used for or generated from long-term assets. Typically negative as businesses invest in growth.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2 font-bold">•</span>
                    <span>
                      <strong>Financing Activities:</strong> Cash from loans, owner contributions, or paid to lenders and owners. Shows how your business is financed.
                    </span>
                  </li>
                </ul>
                <p className="mb-0">
                  A positive net cash flow means you're generating more cash than you're spending. A negative net cash flow requires attention, especially if your ending cash balance is low or negative.
                </p>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="mt-8 sm:mt-12">
            <div className="bg-white rounded-xl shadow-sm border border-border p-6 sm:p-8 lg:p-10 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-4">
                Need Help with Cash Flow Management?
              </h2>
              <p className="text-base sm:text-lg text-text-light mb-6 max-w-2xl mx-auto">
                Our team of experienced accountants can help you improve your cash flow, create cash flow forecasts, and develop strategies to maintain healthy liquidity.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <CalendlyButton className="btn btn--primary" />
                <Link
                  to="/resources/cash-flow-statement-template"
                  className="btn btn--secondary"
                >
                  Download Cash Flow Template
                </Link>
              </div>
            </div>
          </section>

          {/* Back to Resources */}
          <section className="mt-6 sm:mt-8">
            <Link
              to="/resources"
              className="inline-flex items-center text-primary hover:text-primary-dark transition-colors text-sm sm:text-base"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Resources
            </Link>
          </section>
        </div>
      </main>
    </>
  )
}

export default CashFlowCalculator
