import { FC, useMemo, useState } from 'react'
import SEO from '../components/SEO'
import CalendlyButton from '../components/CalendlyButton'
import { Link } from 'react-router-dom'

interface DirectMethodInputs {
  // Operating Activities (Direct Method)
  cashReceiptsFromCustomers: string
  otherOperatingReceipts: string
  inventoryPurchases: string
  generalOperatingAdminExpenses: string
  wageExpenses: string
  interestPaid: string
  incomeTaxesPaid: string

  // Investing Activities
  saleOfPropertyEquipment: string
  collectionOfPrincipalOnLoans: string
  saleOfInvestmentSecurities: string
  purchaseOfPropertyEquipment: string
  makingLoansToOthers: string
  purchaseOfInvestmentSecurities: string

  // Financing Activities
  issuanceOfStock: string
  borrowing: string
  repurchaseOfStock: string
  repaymentOfLoans: string
  dividendsPaid: string

  // Other
  fxRateEffects: string
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
  inlineHint,
}: {
  label: string
  field: keyof DirectMethodInputs
  value: string
  onChange: (field: keyof DirectMethodInputs, value: string) => void
  onBlur: (field: keyof DirectMethodInputs) => void
  onFocus: (field: keyof DirectMethodInputs) => void
  placeholder?: string
  helpText?: string
  inlineHint?: string
}) => (
  <div className="w-full">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3">
      <div className="sm:flex-1">
        <label
          htmlFor={field}
          className="block text-xs sm:text-sm font-medium text-text"
        >
          <span>{label}</span>
          {inlineHint && (
            <span className="ml-2 text-[11px] text-text-light font-normal">
              {inlineHint}
            </span>
          )}
        </label>
        {helpText && (
          <p className="text-[11px] text-text-light">{helpText}</p>
        )}
      </div>
      <div className="relative sm:w-44">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-text-light text-xs">
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
          className="w-full pl-6 pr-2 py-1 border border-border rounded-none focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-text text-xs bg-white text-right tabular-nums"
        />
      </div>
    </div>
  </div>
)

const CashFlowStatementDirectMethod: FC = () => {
  const [inputs, setInputs] = useState<DirectMethodInputs>({
    // Operating Activities (Direct Method)
    cashReceiptsFromCustomers: '',
    otherOperatingReceipts: '',
    inventoryPurchases: '',
    generalOperatingAdminExpenses: '',
    wageExpenses: '',
    interestPaid: '',
    incomeTaxesPaid: '',

    // Investing Activities
    saleOfPropertyEquipment: '',
    collectionOfPrincipalOnLoans: '',
    saleOfInvestmentSecurities: '',
    purchaseOfPropertyEquipment: '',
    makingLoansToOthers: '',
    purchaseOfInvestmentSecurities: '',

    // Financing Activities
    issuanceOfStock: '',
    borrowing: '',
    repurchaseOfStock: '',
    repaymentOfLoans: '',
    dividendsPaid: '',

    // Other
    fxRateEffects: '',
  })

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
    let cleaned = value.replace(/[^0-9.-]/g, '')
    const hasLeadingMinus = cleaned.startsWith('-')
    cleaned = cleaned.replace(/-/g, '')
    const parts = cleaned.split('.')
    const integerPart = parts[0] ?? ''
    const decimalPart = parts.length > 1 ? parts.slice(1).join('') : ''
    const normalized = decimalPart ? `${integerPart}.${decimalPart}` : integerPart
    return hasLeadingMinus ? `-${normalized}` : normalized
  }

  const handleInputChange = (field: keyof DirectMethodInputs, value: string) => {
    const sanitized = sanitizeNumericInput(value)
    setInputs((prev) => ({ ...prev, [field]: sanitized }))
  }

  const handleInputBlur = (field: keyof DirectMethodInputs) => {
    setInputs((prev) => ({ ...prev, [field]: formatInputValue(prev[field]) }))
  }

  const handleInputFocus = (field: keyof DirectMethodInputs) => {
    setInputs((prev) => ({ ...prev, [field]: normalizeInputValue(prev[field]) }))
  }

  const getValue = (field: keyof DirectMethodInputs) => parseNumber(inputs[field])

  const computedResults = useMemo((): CashFlowResults => {
    const operatingCashFlow =
      getValue('cashReceiptsFromCustomers') +
      getValue('otherOperatingReceipts') -
      getValue('inventoryPurchases') -
      getValue('generalOperatingAdminExpenses') -
      getValue('wageExpenses') -
      getValue('interestPaid') -
      getValue('incomeTaxesPaid')

    const investingCashFlow =
      getValue('saleOfPropertyEquipment') +
      getValue('collectionOfPrincipalOnLoans') +
      getValue('saleOfInvestmentSecurities') -
      getValue('purchaseOfPropertyEquipment') -
      getValue('makingLoansToOthers') -
      getValue('purchaseOfInvestmentSecurities')

    const financingCashFlow =
      getValue('issuanceOfStock') +
      getValue('borrowing') -
      getValue('repurchaseOfStock') -
      getValue('repaymentOfLoans') -
      getValue('dividendsPaid')

    const netCashFlow =
      operatingCashFlow + investingCashFlow + financingCashFlow + getValue('fxRateEffects')

    return {
      operatingCashFlow,
      investingCashFlow,
      financingCashFlow,
      netCashFlow,
      endingCashBalance: netCashFlow,
    }
  }, [inputs])

  const resetCalculator = () => {
    setInputs({
      cashReceiptsFromCustomers: '',
      otherOperatingReceipts: '',
      inventoryPurchases: '',
      generalOperatingAdminExpenses: '',
      wageExpenses: '',
      interestPaid: '',
      incomeTaxesPaid: '',
      saleOfPropertyEquipment: '',
      collectionOfPrincipalOnLoans: '',
      saleOfInvestmentSecurities: '',
      purchaseOfPropertyEquipment: '',
      makingLoansToOthers: '',
      purchaseOfInvestmentSecurities: '',
      issuanceOfStock: '',
      borrowing: '',
      repurchaseOfStock: '',
      repaymentOfLoans: '',
      dividendsPaid: '',
      fxRateEffects: '',
    })
  }

  return (
    <>
      <SEO
        title="Cash Flow Statement (Direct Method) | RPC Associates"
        description="Build a direct method cash flow statement by entering cash receipts and cash payments across operating, investing, and financing activities."
        canonical="/resources/cash-flow-statement-direct-method"
        keywords={[
          'cash flow statement',
          'direct method',
          'cash flow calculator',
          'operating activities',
          'investing activities',
          'financing activities',
          'Ottawa',
        ]}
      />
      <main className="py-xxl min-h-[60vh]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <section className="mb-8 sm:mb-12">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-4">
                Cash Flow Statement (Direct Method)
              </h1>
              <p className="text-base sm:text-lg text-text-light leading-relaxed mb-6">
                Build a direct method cash flow statement by entering cash receipts and cash payments across operating, investing, and financing activities.
              </p>
            </div>
          </section>

          <div className="bg-white rounded-xl shadow-sm border border-border p-4 sm:p-6 lg:p-8">
            <div className="mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-primary">
                Cash Flow Statement
              </h2>
            </div>

            {/* Operating Activities */}
            <div className="mb-3">
              <div className="bg-border text-text font-semibold text-[11px] px-2.5 py-1 rounded mb-2">
                Cash Flows from Operating Activities (Direct Method)
              </div>
              <div className="space-y-1">
                <CashFlowInputField
                  label="Cash Receipts from Customers"
                  field="cashReceiptsFromCustomers"
                  value={inputs.cashReceiptsFromCustomers}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                />
                <CashFlowInputField
                  label="Other Operating Receipts"
                  field="otherOperatingReceipts"
                  value={inputs.otherOperatingReceipts}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                />
                <CashFlowInputField
                  label="Inventory Purchases"
                  field="inventoryPurchases"
                  value={inputs.inventoryPurchases}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                  inlineHint="Use negative for cash outflows"
                />
                <CashFlowInputField
                  label="General Operating and Administrative Expenses"
                  field="generalOperatingAdminExpenses"
                  value={inputs.generalOperatingAdminExpenses}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                  inlineHint="Use negative for cash outflows"
                />
                <CashFlowInputField
                  label="Wage Expenses"
                  field="wageExpenses"
                  value={inputs.wageExpenses}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                  inlineHint="Use negative for cash outflows"
                />
                <CashFlowInputField
                  label="Interest"
                  field="interestPaid"
                  value={inputs.interestPaid}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                  inlineHint="Use negative for cash outflows"
                />
                <CashFlowInputField
                  label="Income Taxes"
                  field="incomeTaxesPaid"
                  value={inputs.incomeTaxesPaid}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                  inlineHint="Use negative for cash outflows"
                />
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-text mt-2 border-y-2 border-border py-1">
                <span>Net Cash Flow from Operating Activities</span>
                <span className={computedResults.operatingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(computedResults.operatingCashFlow)}
                </span>
              </div>
            </div>

            {/* Investing Activities */}
            <div className="mb-3">
              <div className="bg-border text-text font-semibold text-[11px] px-2.5 py-1 rounded mb-2">
                Cash Flows from Investing Activities
              </div>
              <div className="space-y-1">
                <CashFlowInputField
                  label="Sale of Property and Equipment"
                  field="saleOfPropertyEquipment"
                  value={inputs.saleOfPropertyEquipment}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                />
                <CashFlowInputField
                  label="Collection of Principal on Loans"
                  field="collectionOfPrincipalOnLoans"
                  value={inputs.collectionOfPrincipalOnLoans}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                />
                <CashFlowInputField
                  label="Sale of Investment Securities"
                  field="saleOfInvestmentSecurities"
                  value={inputs.saleOfInvestmentSecurities}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                />
                <CashFlowInputField
                  label="Purchase of Property and Equipment"
                  field="purchaseOfPropertyEquipment"
                  value={inputs.purchaseOfPropertyEquipment}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                  inlineHint="Use negative for cash outflows"
                />
                <CashFlowInputField
                  label="Making Loans to Other Entities"
                  field="makingLoansToOthers"
                  value={inputs.makingLoansToOthers}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                  inlineHint="Use negative for cash outflows"
                />
                <CashFlowInputField
                  label="Purchase of Investment Securities"
                  field="purchaseOfInvestmentSecurities"
                  value={inputs.purchaseOfInvestmentSecurities}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                  inlineHint="Use negative for cash outflows"
                />
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-text mt-2 border-y-2 border-border py-1">
                <span>Net Cash Flow from Investing Activities</span>
                <span className={computedResults.investingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(computedResults.investingCashFlow)}
                </span>
              </div>
            </div>

            {/* Financing Activities */}
            <div className="mb-3">
              <div className="bg-border text-text font-semibold text-[11px] px-2.5 py-1 rounded mb-2">
                Cash Flows from Financing Activities
              </div>
              <div className="space-y-1">
                <CashFlowInputField
                  label="Issuance of Stock"
                  field="issuanceOfStock"
                  value={inputs.issuanceOfStock}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                />
                <CashFlowInputField
                  label="Borrowing"
                  field="borrowing"
                  value={inputs.borrowing}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                />
                <CashFlowInputField
                  label="Repurchase of Stock"
                  field="repurchaseOfStock"
                  value={inputs.repurchaseOfStock}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                  inlineHint="Use negative for cash outflows"
                />
                <CashFlowInputField
                  label="Repayment of Loans"
                  field="repaymentOfLoans"
                  value={inputs.repaymentOfLoans}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                  inlineHint="Use negative for cash outflows"
                />
                <CashFlowInputField
                  label="Dividends"
                  field="dividendsPaid"
                  value={inputs.dividendsPaid}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                  inlineHint="Use negative for cash outflows"
                />
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-text mt-2 border-y-2 border-border py-1">
                <span>Net Cash Flow from Financing Activities</span>
                <span className={computedResults.financingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(computedResults.financingCashFlow)}
                </span>
              </div>
            </div>

            {/* FX Rate Effects */}
            <div className="mb-3">
              <CashFlowInputField
                label="FX Rate Effects"
                field="fxRateEffects"
                value={inputs.fxRateEffects}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onFocus={handleInputFocus}
                helpText="Foreign exchange impact on cash"
              />
              <div className="flex justify-between items-center text-xs font-semibold text-text mt-2 border-t border-border pt-2">
                <span>FX Rate Effects</span>
                <span className={getValue('fxRateEffects') >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(getValue('fxRateEffects'))}
                </span>
              </div>
            </div>

            {/* Totals */}
            <div className="bg-background p-2 rounded-lg border border-border">
              <div className="flex justify-between items-center text-[11px] font-bold text-primary border-y-2 border-border py-1">
                <span>Net Increase in Cash</span>
                <span className={computedResults.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(computedResults.netCashFlow)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2 border-y-2 border-border py-1 text-[11px] font-bold text-text">
                <span>Cash at End of Year</span>
                <span className={computedResults.endingCashBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(computedResults.endingCashBalance)}
                </span>
              </div>
            </div>

            {computedResults.endingCashBalance < 0 && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded mt-3">
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

            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <button
                onClick={resetCalculator}
                className="flex-1 sm:flex-initial btn btn--secondary py-2 px-5 text-sm font-semibold rounded-lg transition-all"
              >
                Reset
              </button>
            </div>
          </div>

          <section className="mt-8 sm:mt-12">
            <div className="bg-background rounded-xl p-4 sm:p-6 lg:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-primary mb-4">
                Steps to Prepare the Statement of Cash Flows (Direct Method)
              </h2>
              <div className="prose prose-sm max-w-none text-text-light">
                <ol className="list-decimal pl-5 space-y-3 mb-6">
                  <li>
                    <strong>Gather Data:</strong> Collect the current period income statement,
                    comparative balance sheets (current and previous year), and additional
                    transaction details.
                  </li>
                  <li>
                    <strong>Calculate Operating Cash Flows (Direct Method):</strong>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>
                        <strong>Cash Collected from Customers:</strong> Sales Revenue plus Decrease in A/R
                        (or minus Increase in A/R).
                      </li>
                      <li>
                        <strong>Cash Paid to Suppliers:</strong> Cost of Goods Sold plus Increase in Inventory
                        (or minus Decrease) minus Increase in A/P (or plus Decrease).
                      </li>
                      <li>
                        <strong>Cash Paid for Operating Expenses:</strong> Operating Expenses plus Increase in
                        Prepaid Expenses minus Decrease in Accrued Liabilities.
                      </li>
                      <li>
                        <strong>Interest/Taxes:</strong> Record cash paid for interest and income taxes.
                      </li>
                    </ul>
                  </li>
                  <li>
                    <strong>Calculate Investing Activities:</strong> Include cash flows from buying/selling
                    long-term assets (PPE), investments, or loans.
                  </li>
                  <li>
                    <strong>Calculate Financing Activities:</strong> Include cash inflows from issuing stock/debt
                    and outflows from dividends or debt repayment.
                  </li>
                  <li>
                    <strong>Reconcile and Validate:</strong> Sum the net cash flows from operating, investing,
                    and financing. This total should match the net change in cash between the two balance
                    sheet periods.
                  </li>
                </ol>
                <p className="mb-0">
                  Use negative values for cash outflows such as purchases, payments, and dividends.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-8 sm:mt-12">
            <div className="bg-background rounded-xl p-4 sm:p-6 lg:p-8 text-sm text-text-light leading-relaxed">
              <p className="text-text font-semibold text-base mb-sm">Disclaimer</p>
              <p className="mb-0">
                <strong className="text-text font-semibold">Estimates only.</strong> This calculator provides approximate cash flow estimates for planning purposes only. It does not include all adjustments or accounting considerations and is not financial or accounting advice. Final results depend on complete and accurate financial statements and your specific circumstances.
              </p>
            </div>
          </section>

          <section className="mt-8 sm:mt-12">
            <div className="bg-white rounded-xl shadow-sm border border-border p-6 sm:p-8 lg:p-10 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-4">
                Need Help with Cash Flow Management?
              </h2>
              <p className="text-base sm:text-lg text-text-light mb-6 max-w-2xl mx-auto">
                Our team can help you build a reliable cash flow process and improve your financial reporting.
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

export default CashFlowStatementDirectMethod
