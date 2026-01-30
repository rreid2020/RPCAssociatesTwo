import { FC, useMemo, useState } from 'react'
import SEO from '../components/SEO'
import CalendlyButton from '../components/CalendlyButton'
import { Link } from 'react-router-dom'

interface CashFlowInputs {
  // Operating Activities (Indirect Method)
  netIncome: string
  depreciation: string
  amortization: string
  goodwillImpairments: string
  deferredTaxes: string
  stockBasedCompensation: string
  otherNonCashAdjustments: string

  // Changes in Operating Assets and Liabilities
  accountsReceivableChange: string
  inventoryChange: string
  prepaidExpensesChange: string
  accountsPayableChange: string
  accruedLiabilitiesChange: string
  deferredRevenueChange: string
  otherLongTermLiabilitiesChange: string

  // Investing Activities
  netCapitalExpenditures: string
  otherLongTermAssetsChange: string
  netPurchasesShortTermInvestments: string
  additionsToIntangibles: string

  // Financing Activities
  dividendsPaid: string
  stockIssuancesRepurchases: string
  debtIssuancesRepayments: string

  // Other
  fxRateEffects: string

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
  inlineHint,
}: {
  label: string
  field: keyof CashFlowInputs
  value: string
  onChange: (field: keyof CashFlowInputs, value: string) => void
  onBlur: (field: keyof CashFlowInputs) => void
  onFocus: (field: keyof CashFlowInputs) => void
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

const CashFlowCalculator: FC = () => {
  const [inputs, setInputs] = useState<CashFlowInputs>({
    // Operating Activities (Indirect Method)
    netIncome: '',
    depreciation: '',
    amortization: '',
    goodwillImpairments: '',
    deferredTaxes: '',
    stockBasedCompensation: '',
    otherNonCashAdjustments: '',

    // Changes in Operating Assets and Liabilities
    accountsReceivableChange: '',
    inventoryChange: '',
    prepaidExpensesChange: '',
    accountsPayableChange: '',
    accruedLiabilitiesChange: '',
    deferredRevenueChange: '',
    otherLongTermLiabilitiesChange: '',

    // Investing Activities
    netCapitalExpenditures: '',
    otherLongTermAssetsChange: '',
    netPurchasesShortTermInvestments: '',
    additionsToIntangibles: '',

    // Financing Activities
    dividendsPaid: '',
    stockIssuancesRepurchases: '',
    debtIssuancesRepayments: '',

    // Other
    fxRateEffects: '',

    // Beginning Cash Balance
    beginningCashBalance: '',
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
  }

  const handleInputBlur = (field: keyof CashFlowInputs) => {
    setInputs((prev) => ({ ...prev, [field]: formatInputValue(prev[field]) }))
  }

  const handleInputFocus = (field: keyof CashFlowInputs) => {
    setInputs((prev) => ({ ...prev, [field]: normalizeInputValue(prev[field]) }))
  }

  const getValue = (field: keyof CashFlowInputs) => parseNumber(inputs[field])

  const computedResults = useMemo((): CashFlowResults => {
    const operatingCashFlow =
      getValue('netIncome') +
      getValue('depreciation') +
      getValue('amortization') +
      getValue('goodwillImpairments') +
      getValue('deferredTaxes') +
      getValue('stockBasedCompensation') +
      getValue('otherNonCashAdjustments') +
      getValue('accountsReceivableChange') +
      getValue('inventoryChange') +
      getValue('prepaidExpensesChange') +
      getValue('accountsPayableChange') +
      getValue('accruedLiabilitiesChange') +
      getValue('deferredRevenueChange') +
      getValue('otherLongTermLiabilitiesChange')

    const investingCashFlow =
      getValue('netCapitalExpenditures') +
      getValue('otherLongTermAssetsChange') +
      getValue('netPurchasesShortTermInvestments') +
      getValue('additionsToIntangibles')

    const financingCashFlow =
      getValue('dividendsPaid') +
      getValue('stockIssuancesRepurchases') +
      getValue('debtIssuancesRepayments')

    const netCashFlow =
      operatingCashFlow +
      investingCashFlow +
      financingCashFlow +
      getValue('fxRateEffects')
    const endingCashBalance = getValue('beginningCashBalance') + netCashFlow

    return {
      operatingCashFlow,
      investingCashFlow,
      financingCashFlow,
      netCashFlow,
      endingCashBalance,
    }
  }, [inputs])

  const resetCalculator = () => {
    setInputs({
      netIncome: '',
      depreciation: '',
      amortization: '',
      goodwillImpairments: '',
      deferredTaxes: '',
      stockBasedCompensation: '',
      otherNonCashAdjustments: '',
      accountsReceivableChange: '',
      inventoryChange: '',
      prepaidExpensesChange: '',
      accountsPayableChange: '',
      accruedLiabilitiesChange: '',
      deferredRevenueChange: '',
      otherLongTermLiabilitiesChange: '',
      netCapitalExpenditures: '',
      otherLongTermAssetsChange: '',
      netPurchasesShortTermInvestments: '',
      additionsToIntangibles: '',
      dividendsPaid: '',
      stockIssuancesRepurchases: '',
      debtIssuancesRepayments: '',
      fxRateEffects: '',
      beginningCashBalance: '',
    })
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
                Cash Flow Statement (Indirect Method)
              </h1>
              <p className="text-base sm:text-lg text-text-light leading-relaxed mb-6">
                Having adequate cash flow is essential to keep your business running. If you run out of available cash, you run the risk of not being able to meet your current obligations such as your payroll, accounts payable, and loan payments. Use this calculator to help you determine the cash flow generated by your business.
              </p>
            </div>
          </section>

          <div className="bg-white rounded-xl shadow-sm border border-border p-4 sm:p-6 lg:p-8">
            <div className="mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-primary">
                Cash Flow Statement
              </h2>
            </div>

            <div className="mb-2">
              <CashFlowInputField
                label="Net Income"
                field="netIncome"
                value={inputs.netIncome}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onFocus={handleInputFocus}
                helpText="Net income for the period"
              />
            </div>

            {/* Operating Activities (Indirect Method) */}
            <div className="mb-3">
              <div className="bg-border text-text font-semibold text-[11px] px-2.5 py-1 rounded mb-2">
                Cash Flows from Operating Activities (Indirect Method)
              </div>
              <div className="space-y-1">
                <CashFlowInputField
                  label="Depreciation"
                  field="depreciation"
                  value={inputs.depreciation}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                  helpText="Add back non-cash depreciation"
                />
                <CashFlowInputField
                  label="Amortization"
                  field="amortization"
                  value={inputs.amortization}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                  helpText="Add back non-cash amortization"
                />
                <CashFlowInputField
                  label="Goodwill/Intangible Impairments"
                  field="goodwillImpairments"
                  value={inputs.goodwillImpairments}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                  helpText="Non-cash impairment charges"
                />
                <CashFlowInputField
                  label="Deferred Taxes"
                  field="deferredTaxes"
                  value={inputs.deferredTaxes}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                  helpText="Deferred tax adjustments"
                />
                <CashFlowInputField
                  label="Stock-Based Compensation"
                  field="stockBasedCompensation"
                  value={inputs.stockBasedCompensation}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                  helpText="Non-cash compensation"
                />
                <CashFlowInputField
                  label="Other Non-Cash Items"
                  field="otherNonCashAdjustments"
                  value={inputs.otherNonCashAdjustments}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                  helpText="Other non-cash adjustments"
                />
              </div>
              <div className="mt-1 text-[11px] font-semibold text-text-light">
                Changes in Operating Assets and Liabilities:
              </div>
              <div className="space-y-1 mt-1">
                <CashFlowInputField
                  label="Accounts Receivable"
                  inlineHint="Increase (-), decrease (+)"
                  field="accountsReceivableChange"
                  value={inputs.accountsReceivableChange}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                />
                <CashFlowInputField
                  label="Inventory"
                  inlineHint="Increase (-), decrease (+)"
                  field="inventoryChange"
                  value={inputs.inventoryChange}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                />
                <CashFlowInputField
                  label="Prepaid Expenses & Other Assets"
                  inlineHint="Increase (-), decrease (+)"
                  field="prepaidExpensesChange"
                  value={inputs.prepaidExpensesChange}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                />
                <CashFlowInputField
                  label="Accounts Payable"
                  inlineHint="Increase (+), decrease (-)"
                  field="accountsPayableChange"
                  value={inputs.accountsPayableChange}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                />
                <CashFlowInputField
                  label="Accrued Liabilities"
                  inlineHint="Increase (+), decrease (-)"
                  field="accruedLiabilitiesChange"
                  value={inputs.accruedLiabilitiesChange}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                />
                <CashFlowInputField
                  label="Deferred Revenue"
                  inlineHint="Increase (+), decrease (-)"
                  field="deferredRevenueChange"
                  value={inputs.deferredRevenueChange}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                />
                <CashFlowInputField
                  label="Other Long-Term Liabilities"
                  inlineHint="Increase (+), decrease (-)"
                  field="otherLongTermLiabilitiesChange"
                  value={inputs.otherLongTermLiabilitiesChange}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                />
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-text mt-2 border-y-2 border-border py-1">
                <span>Net Cash Provided by Operating Activities</span>
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
                  label="Net Capital Expenditures"
                  inlineHint="Use negative for cash outflows"
                  field="netCapitalExpenditures"
                  value={inputs.netCapitalExpenditures}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                />
                <CashFlowInputField
                  label="Increase in Other Long-Term Assets"
                  inlineHint="Increase (-), decrease (+)"
                  field="otherLongTermAssetsChange"
                  value={inputs.otherLongTermAssetsChange}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                />
                <CashFlowInputField
                  label="Net Purchases of Short-Term Investments"
                  inlineHint="Use negative for purchases"
                  field="netPurchasesShortTermInvestments"
                  value={inputs.netPurchasesShortTermInvestments}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                />
                <CashFlowInputField
                  label="Additions to Intangibles"
                  inlineHint="Use negative for cash outflows"
                  field="additionsToIntangibles"
                  value={inputs.additionsToIntangibles}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                />
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-text mt-2 border-y-2 border-border py-1">
                <span>Net Cash Used in Investing Activities</span>
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
                  label="Dividends Paid"
                  inlineHint="Use negative for cash outflows"
                  field="dividendsPaid"
                  value={inputs.dividendsPaid}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                />
                <CashFlowInputField
                  label="Stock Issuances / Repurchases"
                  inlineHint="Issuance (+), repurchase (-)"
                  field="stockIssuancesRepurchases"
                  value={inputs.stockIssuancesRepurchases}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                />
                <CashFlowInputField
                  label="Debt Issuances / Repayments"
                  inlineHint="Issuance (+), repayment (-)"
                  field="debtIssuancesRepayments"
                  value={inputs.debtIssuancesRepayments}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                />
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-text mt-2 border-y-2 border-border py-1">
                <span>Net Cash Provided by Financing Activities</span>
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
              <div className="flex justify-between items-center text-sm font-semibold text-text mt-2 border-t border-border pt-2">
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

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <button
                onClick={resetCalculator}
                className="flex-1 sm:flex-initial btn btn--secondary py-2 px-5 text-sm font-semibold rounded-lg transition-all"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Information Section */}
          <section className="mt-8 sm:mt-12">
            <div className="bg-background rounded-xl p-4 sm:p-6 lg:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-primary mb-4">
                Steps to Prepare the Statement of Cash Flows (Indirect Method)
              </h2>
              <div className="prose prose-sm max-w-none text-text-light">
                <ol className="list-decimal pl-5 space-y-3 mb-6">
                  <li>
                    <strong>Calculate Net Cash from Operating Activities</strong>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Start with Net Income from the income statement.</li>
                      <li>Add back non-cash expenses (depreciation, amortization, depletion).</li>
                      <li>Adjust for gains or losses on asset sales.</li>
                      <li>Adjust for working capital changes.</li>
                      <li>
                        Assets: a decrease in current assets is added; an increase is subtracted.
                      </li>
                      <li>
                        Liabilities: an increase in current liabilities is added; a decrease is subtracted.
                      </li>
                    </ul>
                  </li>
                  <li>
                    <strong>Determine Net Cash from Investing Activities</strong>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Analyze changes in long-term asset accounts.</li>
                      <li>Cash spent to purchase assets is a subtraction.</li>
                      <li>Cash received from selling assets is an addition.</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Determine Net Cash from Financing Activities</strong>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Analyze changes in long-term debt and equity accounts.</li>
                      <li>Cash received from issuing stock or borrowing is an addition.</li>
                      <li>Cash paid for dividends or repaying debt is a subtraction.</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Calculate Net Change and Final Balance</strong>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Net Cash Flow: sum operating, investing, and financing cash flows.</li>
                      <li>Final Balance: add the net change to the beginning cash balance.</li>
                    </ul>
                  </li>
                </ol>
                <h3 className="text-base sm:text-lg font-semibold text-text mb-2">
                  Key Rules for Working Capital Changes
                </h3>
                <ul className="list-disc pl-5 space-y-1 mb-0">
                  <li>Current Assets Increase = Cash Decrease.</li>
                  <li>Current Assets Decrease = Cash Increase.</li>
                  <li>Current Liabilities Increase = Cash Increase.</li>
                  <li>Current Liabilities Decrease = Cash Decrease.</li>
                </ul>
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
