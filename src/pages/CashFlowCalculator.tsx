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

const CashFlowInputField = ({
  label,
  field,
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder = '0.00',
  helpText,
}: {
  label: string
  field: keyof CashFlowInputs
  value: string
  onChange: (field: keyof CashFlowInputs, value: string) => void
  onBlur: (field: keyof CashFlowInputs) => void
  onFocus: (field: keyof CashFlowInputs) => void
  placeholder?: string
  helpText?: string
}) => (
  <div className="w-full">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
      <div className="sm:flex-1">
        <label
          htmlFor={field}
          className="block text-sm font-medium text-text"
        >
          {label}
        </label>
        {helpText && (
          <p className="text-xs text-text-light">{helpText}</p>
        )}
      </div>
      <div className="relative sm:w-56">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light">
          $
        </span>
        <input
          type="text"
          inputMode="decimal"
          id={field}
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          onBlur={() => onBlur(field)}
          onFocus={() => onFocus(field)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full pl-8 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text bg-white"
        />
      </div>
    </div>
  </div>
)

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

  const formatInputValue = (value: string): string => {
    if (!value || value === '-' || value === '.' || value === '-.') {
      return value
    }
    const numeric = parseNumber(value)
    return numeric.toLocaleString('en-CA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const normalizeInputValue = (value: string): string => {
    return value.replace(/,/g, '')
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

  const handleInputBlur = (field: keyof CashFlowInputs) => {
    setInputs((prev) => ({ ...prev, [field]: formatInputValue(prev[field]) }))
  }

  const handleInputFocus = (field: keyof CashFlowInputs) => {
    setInputs((prev) => ({ ...prev, [field]: normalizeInputValue(prev[field]) }))
  }

  const getValue = (field: keyof CashFlowInputs) => parseNumber(inputs[field])

  const calculateCashFlow = () => {
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

          <div className="bg-white rounded-xl shadow-sm border border-border p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-primary">
                  Cash Flow Statement
                </h2>
                <p className="text-sm text-text-light">[Company Name]</p>
              </div>
              <div className="text-sm text-text-light sm:text-right">
                <p>For the Year Ending</p>
                <p className="font-semibold text-text">[MM/DD/YYYY]</p>
              </div>
            </div>

            {/* Beginning Cash Balance */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-text-light mb-2">
                <span>Cash at Beginning of Year</span>
                <span className="font-semibold text-text">
                  {formatCurrency(parseNumber(inputs.beginningCashBalance))}
                </span>
              </div>
              <CashFlowInputField
                label="Starting Cash Balance"
                field="beginningCashBalance"
                value={inputs.beginningCashBalance}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onFocus={handleInputFocus}
                helpText="The cash balance at the beginning of the period"
              />
            </div>

            {/* Operations */}
            <div className="mb-6">
              <div className="bg-primary/10 text-primary font-semibold text-sm px-3 py-2 rounded mb-4">
                Operations
              </div>
              <div className="space-y-3">
                <CashFlowInputField
                  label="Cash Received from Customers"
                  field="cashFromCustomers"
                  value={inputs.cashFromCustomers}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                  helpText="Total cash collected from sales"
                />
                <CashFlowInputField
                  label="Payments to Suppliers"
                  field="paymentsToSuppliers"
                  value={inputs.paymentsToSuppliers}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                  helpText="Cash paid to vendors and suppliers"
                />
                <CashFlowInputField
                  label="Payroll Expenses"
                  field="payrollExpenses"
                  value={inputs.payrollExpenses}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                  helpText="Salaries, wages, and benefits paid"
                />
                <CashFlowInputField
                  label="Rent and Utilities"
                  field="rentAndUtilities"
                  value={inputs.rentAndUtilities}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                  helpText="Office rent, utilities, and related expenses"
                />
                <CashFlowInputField
                  label="Other Operating Expenses"
                  field="otherOperatingExpenses"
                  value={inputs.otherOperatingExpenses}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                  helpText="Other day-to-day business expenses"
                />
              </div>
              {hasCalculated && results && (
                <div className="flex justify-between items-center text-sm font-semibold text-text mt-4 border-t border-border pt-3">
                  <span>Net Cash Flow from Operations</span>
                  <span className={results.operatingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(results.operatingCashFlow)}
                  </span>
                </div>
              )}
            </div>

            {/* Investing Activities */}
            <div className="mb-6">
              <div className="bg-primary/10 text-primary font-semibold text-sm px-3 py-2 rounded mb-4">
                Investing Activities
              </div>
              <div className="space-y-3">
                <CashFlowInputField
                  label="Asset Sales"
                  field="assetSales"
                  value={inputs.assetSales}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                  helpText="Cash received from selling assets"
                />
                <CashFlowInputField
                  label="Equipment Purchases"
                  field="equipmentPurchases"
                  value={inputs.equipmentPurchases}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                  helpText="Cash spent on equipment and capital assets"
                />
                <CashFlowInputField
                  label="Other Investing Activities"
                  field="otherInvestingActivities"
                  value={inputs.otherInvestingActivities}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                  helpText="Other investing-related cash flows"
                />
              </div>
              {hasCalculated && results && (
                <div className="flex justify-between items-center text-sm font-semibold text-text mt-4 border-t border-border pt-3">
                  <span>Net Cash Flow from Investing Activities</span>
                  <span className={results.investingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(results.investingCashFlow)}
                  </span>
                </div>
              )}
            </div>

            {/* Financing Activities */}
            <div className="mb-6">
              <div className="bg-primary/10 text-primary font-semibold text-sm px-3 py-2 rounded mb-4">
                Financing Activities
              </div>
              <div className="space-y-3">
                <CashFlowInputField
                  label="Loan Proceeds"
                  field="loanProceeds"
                  value={inputs.loanProceeds}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                  helpText="Cash received from loans and borrowings"
                />
                <CashFlowInputField
                  label="Loan Repayments"
                  field="loanRepayments"
                  value={inputs.loanRepayments}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                  helpText="Cash paid to repay loans"
                />
                <CashFlowInputField
                  label="Owner Contributions"
                  field="ownerContributions"
                  value={inputs.ownerContributions}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                  helpText="Cash invested by owners"
                />
                <CashFlowInputField
                  label="Owner Withdrawals"
                  field="ownerWithdrawals"
                  value={inputs.ownerWithdrawals}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                  helpText="Cash withdrawn by owners"
                />
                <CashFlowInputField
                  label="Other Financing Activities"
                  field="otherFinancingActivities"
                  value={inputs.otherFinancingActivities}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                  helpText="Other financing-related cash flows"
                />
              </div>
              {hasCalculated && results && (
                <div className="flex justify-between items-center text-sm font-semibold text-text mt-4 border-t border-border pt-3">
                  <span>Net Cash Flow from Financing Activities</span>
                  <span className={results.financingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(results.financingCashFlow)}
                  </span>
                </div>
              )}
            </div>

            {/* Totals */}
            {hasCalculated && results && (
              <div className="bg-background p-4 rounded-lg border border-border">
                <div className="flex justify-between items-center text-sm font-semibold text-primary">
                  <span>Net Increase in Cash</span>
                  <span className={results.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(results.netCashFlow)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-border text-sm font-semibold text-text">
                  <span>Cash at End of Year</span>
                  <span className={results.endingCashBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(results.endingCashBalance)}
                  </span>
                </div>
              </div>
            )}

            {hasCalculated && results && (
              <div className="bg-white p-4 rounded-lg border border-border mt-6">
                <h3 className="text-sm font-semibold text-primary mb-3">
                  Detailed Sources and Uses of Cash
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-text-light uppercase tracking-wider mb-2">
                      Sources of Cash
                    </p>
                    <div className="space-y-2">
                      {[
                        { label: 'Cash Received from Customers', value: getValue('cashFromCustomers') },
                        { label: 'Asset Sales', value: getValue('assetSales') },
                        { label: 'Loan Proceeds', value: getValue('loanProceeds') },
                        { label: 'Owner Contributions', value: getValue('ownerContributions') },
                        { label: 'Other Investing Activities', value: getValue('otherInvestingActivities') },
                        { label: 'Other Financing Activities', value: getValue('otherFinancingActivities') },
                      ]
                        .filter((item) => item.value > 0)
                        .map((item) => (
                          <div key={item.label} className="flex justify-between text-sm">
                            <span className="text-text-light">{item.label}</span>
                            <span className="font-medium text-green-600">
                              {formatCurrency(item.value)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-text-light uppercase tracking-wider mb-2">
                      Uses of Cash
                    </p>
                    <div className="space-y-2">
                      {[
                        { label: 'Payments to Suppliers', value: getValue('paymentsToSuppliers') },
                        { label: 'Payroll Expenses', value: getValue('payrollExpenses') },
                        { label: 'Rent and Utilities', value: getValue('rentAndUtilities') },
                        { label: 'Other Operating Expenses', value: getValue('otherOperatingExpenses') },
                        { label: 'Equipment Purchases', value: getValue('equipmentPurchases') },
                        { label: 'Loan Repayments', value: getValue('loanRepayments') },
                        { label: 'Owner Withdrawals', value: getValue('ownerWithdrawals') },
                        { label: 'Other Investing Activities', value: getValue('otherInvestingActivities') * -1 },
                        { label: 'Other Financing Activities', value: getValue('otherFinancingActivities') * -1 },
                      ]
                        .filter((item) => item.value > 0)
                        .map((item) => (
                          <div key={item.label} className="flex justify-between text-sm">
                            <span className="text-text-light">{item.label}</span>
                            <span className="font-medium text-red-600">
                              {formatCurrency(item.value)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {hasCalculated && results && results.endingCashBalance < 0 && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mt-6">
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
