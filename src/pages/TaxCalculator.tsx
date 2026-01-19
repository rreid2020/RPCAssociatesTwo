import { FC, useState, useEffect } from 'react'
import SEO from '../components/SEO'
import CalendlyButton from '../components/CalendlyButton'
import { TaxCalculatorInputs, TaxCalculatorResults } from '../lib/tax/types'
import { calcSummary } from '../lib/tax/calcSummary'
import federalData2025 from '../tax-data/2025/federal.json'
import provincesData2025 from '../tax-data/2025/provinces.json'
import { runSelfChecks } from '../lib/tax/selfCheck'

const TaxCalculator: FC = () => {
  const [inputs, setInputs] = useState<TaxCalculatorInputs>({
    taxYear: 2025,
    province: 'ON',
    employmentIncome: 0,
    selfEmploymentIncome: 0,
    otherIncome: 0,
    rrspContributions: 0,
    capitalGains: 0,
    eligibleDividends: 0,
    ineligibleDividends: 0,
    incomeTaxesPaid: 0
  })

  const [results, setResults] = useState<TaxCalculatorResults | null>(null)
  const [hasCalculated, setHasCalculated] = useState(false)

  // Run self-checks in dev mode
  useEffect(() => {
    runSelfChecks()
  }, [])

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const parseNumber = (value: string): number => {
    const parsed = parseFloat(value)
    if (isNaN(parsed) || parsed < 0) return 0
    return parsed
  }

  const handleInputChange = (field: keyof TaxCalculatorInputs, value: string | number) => {
    const numericFields = [
      'employmentIncome', 
      'selfEmploymentIncome', 
      'otherIncome', 
      'rrspContributions',
      'capitalGains',
      'eligibleDividends',
      'ineligibleDividends',
      'incomeTaxesPaid'
    ]
    
    if (typeof value === 'string' && numericFields.includes(field)) {
      setInputs(prev => ({
        ...prev,
        [field]: parseNumber(value)
      }))
    } else {
      setInputs(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Get tax data for selected year (currently only 2025 supported)
    const federalData = federalData2025 as any
    const provincesData = provincesData2025 as any
    
    if (!provincesData[inputs.province]) {
      alert('Invalid province selected')
      return
    }

    const provincialData = provincesData[inputs.province]
    
    try {
      const calculatedResults = calcSummary(inputs, federalData, provincialData)
      setResults(calculatedResults)
      setHasCalculated(true)
    } catch (error) {
      console.error('Calculation error:', error)
      alert('An error occurred during calculation. Please check your inputs.')
    }
  }


  const provinces = [
    { code: 'AB', name: 'Alberta' },
    { code: 'BC', name: 'British Columbia' },
    { code: 'MB', name: 'Manitoba' },
    { code: 'NB', name: 'New Brunswick' },
    { code: 'NL', name: 'Newfoundland and Labrador' },
    { code: 'NS', name: 'Nova Scotia' },
    { code: 'NT', name: 'Northwest Territories' },
    { code: 'NU', name: 'Nunavut' },
    { code: 'ON', name: 'Ontario' },
    { code: 'PE', name: 'Prince Edward Island' },
    { code: 'QC', name: 'Quebec' },
    { code: 'SK', name: 'Saskatchewan' },
    { code: 'YT', name: 'Yukon' }
  ]

  return (
    <>
      <SEO
        title="Canadian Personal Income Tax Calculator"
        description="Estimate your Canadian personal income tax with our free calculator. Calculate federal and provincial taxes for 2025 and other tax years."
        keywords="Canadian Income Tax, income tax calculator, Canadian tax calculator, tax planning, federal tax, provincial tax, tax brackets, tax rates, Canada tax, personal income tax, Ottawa tax calculator, Ontario tax calculator"
        canonical="/resources/canadian-personal-income-tax-calculator"
      />
      <main className="py-xxl min-h-[60vh]">
        <div className="max-w-[1200px] mx-auto px-md">
          <section className="py-xxl">
            <div className="text-center mb-xxl max-w-[800px] mx-auto">
              <h1 className="text-3xl lg:text-4xl font-bold text-primary mb-md">
                {inputs.taxYear} {provinces.find(p => p.code === inputs.province)?.name || 'Ontario'} Income Tax Calculator
              </h1>
              <p className="text-lg text-text-light leading-relaxed m-0">
                Plug in a few numbers and we'll give you visibility into your tax bracket, marginal tax rate, average tax rate, and an estimate of your taxes owed in {inputs.taxYear}.
              </p>
            </div>

            <div className="max-w-[1200px] mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-xxl items-start">
                <div className="bg-white p-lg rounded-xl">
                  <form className="flex flex-col gap-md" onSubmit={handleCalculate}>
                    <div className="mb-md">
                      <div className="flex flex-col gap-1">
                        <label htmlFor="province" className="font-semibold text-text text-sm mb-1">Choose province or territory</label>
                        <select
                          id="province"
                          className="px-3.5 py-3 border border-[#d0d0d0] rounded-lg font-sans text-base transition-all bg-white text-text w-full hover:border-[#999] focus:outline-2 focus:outline-primary focus:outline-offset-2 focus:border-primary"
                          value={inputs.province}
                          onChange={(e) => handleInputChange('province', e.target.value)}
                        >
                          {provinces.map(prov => (
                            <option key={prov.code} value={prov.code}>
                              {prov.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label htmlFor="employmentIncome" className="font-semibold text-text text-sm mb-1">Employment income</label>
                      <p className="text-sm text-text-light m-0 leading-snug mb-1">Employment income and taxable benefits.</p>
                      <input
                        type="number"
                        id="employmentIncome"
                        className="px-3.5 py-3 border border-[#d0d0d0] rounded-lg font-sans text-base transition-all bg-white text-text w-full hover:border-[#999] focus:outline-2 focus:outline-primary focus:outline-offset-2 focus:border-primary placeholder:text-[#999]"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        value={inputs.employmentIncome || ''}
                        onChange={(e) => handleInputChange('employmentIncome', e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label htmlFor="selfEmploymentIncome" className="font-semibold text-text text-sm mb-1">Self-employment income</label>
                      <p className="text-sm text-text-light m-0 leading-snug mb-1">Business, professional, commission, partnership, fishing, and farming income.</p>
                      <input
                        type="number"
                        id="selfEmploymentIncome"
                        className="px-3.5 py-3 border border-[#d0d0d0] rounded-lg font-sans text-base transition-all bg-white text-text w-full hover:border-[#999] focus:outline-2 focus:outline-primary focus:outline-offset-2 focus:border-primary placeholder:text-[#999]"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        value={inputs.selfEmploymentIncome || ''}
                        onChange={(e) => handleInputChange('selfEmploymentIncome', e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label htmlFor="rrspContributions" className="font-semibold text-text text-sm mb-1">RRSP and FHSA deductions</label>
                      <p className="text-sm text-text-light m-0 leading-snug mb-1">Keep in mind RRSP and FHSA contributions are subject to annual contribution and deduction limits.</p>
                      <input
                        type="number"
                        id="rrspContributions"
                        className="px-3.5 py-3 border border-[#d0d0d0] rounded-lg font-sans text-base transition-all bg-white text-text w-full hover:border-[#999] focus:outline-2 focus:outline-primary focus:outline-offset-2 focus:border-primary placeholder:text-[#999]"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        value={inputs.rrspContributions || ''}
                        onChange={(e) => handleInputChange('rrspContributions', e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label htmlFor="capitalGains" className="font-semibold text-text text-sm mb-1">Capital gains</label>
                      <p className="text-sm text-text-light m-0 leading-snug mb-1">Half of this amount is included in income.</p>
                      <input
                        type="number"
                        id="capitalGains"
                        className="px-3.5 py-3 border border-[#d0d0d0] rounded-lg font-sans text-base transition-all bg-white text-text w-full hover:border-[#999] focus:outline-2 focus:outline-primary focus:outline-offset-2 focus:border-primary placeholder:text-[#999]"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        value={inputs.capitalGains || ''}
                        onChange={(e) => handleInputChange('capitalGains', e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label htmlFor="eligibleDividends" className="font-semibold text-text text-sm mb-1">Eligible dividends</label>
                      <p className="text-sm text-text-light m-0 leading-snug mb-1">In general, these are dividends received from public Canadian companies. Enter the actual amount of dividends received.</p>
                      <input
                        type="number"
                        id="eligibleDividends"
                        className="px-3.5 py-3 border border-[#d0d0d0] rounded-lg font-sans text-base transition-all bg-white text-text w-full hover:border-[#999] focus:outline-2 focus:outline-primary focus:outline-offset-2 focus:border-primary placeholder:text-[#999]"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        value={inputs.eligibleDividends || ''}
                        onChange={(e) => handleInputChange('eligibleDividends', e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label htmlFor="ineligibleDividends" className="font-semibold text-text text-sm mb-1">Ineligible Dividends</label>
                      <p className="text-sm text-text-light m-0 leading-snug mb-1">In general, these are dividends received from private Canadian companies. Enter the actual amount of dividends received.</p>
                      <input
                        type="number"
                        id="ineligibleDividends"
                        className="px-3.5 py-3 border border-[#d0d0d0] rounded-lg font-sans text-base transition-all bg-white text-text w-full hover:border-[#999] focus:outline-2 focus:outline-primary focus:outline-offset-2 focus:border-primary placeholder:text-[#999]"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        value={inputs.ineligibleDividends || ''}
                        onChange={(e) => handleInputChange('ineligibleDividends', e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label htmlFor="otherIncome" className="font-semibold text-text text-sm mb-1">Other income</label>
                      <p className="text-sm text-text-light m-0 leading-snug mb-1">All other income (like rental income, interest, tips, EI, CPP, and OAS).</p>
                      <input
                        type="number"
                        id="otherIncome"
                        className="px-3.5 py-3 border border-[#d0d0d0] rounded-lg font-sans text-base transition-all bg-white text-text w-full hover:border-[#999] focus:outline-2 focus:outline-primary focus:outline-offset-2 focus:border-primary placeholder:text-[#999]"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        value={inputs.otherIncome || ''}
                        onChange={(e) => handleInputChange('otherIncome', e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label htmlFor="incomeTaxesPaid" className="font-semibold text-text text-sm mb-1">Income taxes paid</label>
                      <p className="text-sm text-text-light m-0 leading-snug mb-1">For example, taxes deducted from your paycheque. Don't include CPP/EI contributions.</p>
                      <input
                        type="number"
                        id="incomeTaxesPaid"
                        className="px-3.5 py-3 border border-[#d0d0d0] rounded-lg font-sans text-base transition-all bg-white text-text w-full hover:border-[#999] focus:outline-2 focus:outline-primary focus:outline-offset-2 focus:border-primary placeholder:text-[#999]"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        value={inputs.incomeTaxesPaid || ''}
                        onChange={(e) => handleInputChange('incomeTaxesPaid', e.target.value)}
                      />
                    </div>

                    <button type="submit" className="btn btn--primary w-full mt-md py-4 text-base font-semibold">
                      Calculate
                    </button>
                  </form>
                </div>

                <div className="bg-[#f8f8f8] p-lg rounded-xl lg:sticky lg:top-[calc(1.5rem+60px)]">
                  <h2 className="text-2xl font-bold text-primary mb-md lg:mb-lg">Your Results</h2>
                  
                  {hasCalculated && results ? (
                    <div className="flex flex-col gap-md bg-white p-md rounded-lg">
                      <div className="flex flex-col gap-1 pb-md border-b border-[#e5e5e5] last:border-b-0 last:pb-0">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-text text-sm">Total income</span>
                          <span className="text-xs text-text-light leading-snug">Total income entered.</span>
                        </div>
                        <div className="text-2xl font-bold text-primary mt-1">
                          {formatCurrency(
                            inputs.employmentIncome + 
                            inputs.selfEmploymentIncome + 
                            inputs.otherIncome + 
                            inputs.capitalGains + 
                            inputs.eligibleDividends + 
                            inputs.ineligibleDividends
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 pb-md border-b border-[#e5e5e5] last:border-b-0 last:pb-0">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-text text-sm">Total tax</span>
                        </div>
                        <div className="text-3xl lg:text-4xl font-bold text-primary mt-2">{formatCurrency(results.totalTax)}</div>
                        <div className="mt-2 pt-2 border-t border-[#e5e5e5] flex flex-col gap-1">
                          <div className="flex justify-between text-sm text-text-light">
                            <span>Federal Tax</span>
                            <span className="font-semibold text-text">{formatCurrency(results.federalTax.net)}</span>
                          </div>
                          <div className="flex justify-between text-sm text-text-light">
                            <span>Provincial/Territorial Tax</span>
                            <span className="font-semibold text-text">{formatCurrency(results.provincialTax.net)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 pb-md border-b border-[#e5e5e5] last:border-b-0 last:pb-0">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-text text-sm">After-tax income</span>
                          <span className="text-xs text-text-light leading-snug">Total income after tax.</span>
                        </div>
                        <div className="text-2xl font-bold text-primary mt-1">
                          {formatCurrency(
                            (inputs.employmentIncome + 
                            inputs.selfEmploymentIncome + 
                            inputs.otherIncome + 
                            inputs.capitalGains + 
                            inputs.eligibleDividends + 
                            inputs.ineligibleDividends) - results.totalTax
                          )}
                        </div>
                      </div>

                      {results.refundOrOwing !== 0 && (
                        <div className="flex flex-col gap-1 pb-md border-b border-[#e5e5e5] last:border-b-0 last:pb-0">
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold text-text text-sm">
                              {results.refundOrOwing > 0 ? 'Estimated refund' : 'Amount owing'}
                            </span>
                            <span className="text-xs text-text-light leading-snug">
                              {results.refundOrOwing > 0 
                                ? 'Tax refund after accounting for taxes already paid.'
                                : 'Additional tax payable after accounting for taxes already paid.'}
                            </span>
                          </div>
                          <div className={`text-2xl font-bold mt-1 ${results.refundOrOwing > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {results.refundOrOwing > 0 ? '+' : ''}{formatCurrency(Math.abs(results.refundOrOwing))}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col gap-1 pb-md border-b border-[#e5e5e5] last:border-b-0 last:pb-0">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-text text-sm">Average tax rate</span>
                          <span className="text-xs text-text-light leading-snug">Total tax divided by total income.</span>
                        </div>
                        <div className="text-2xl font-bold text-primary mt-1">{results.averageTaxRate.toFixed(2)}%</div>
                      </div>

                      <div className="flex flex-col gap-1 pb-md border-b border-[#e5e5e5] last:border-b-0 last:pb-0">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-text text-sm">Marginal tax rate</span>
                          <span className="text-xs text-text-light leading-snug">Incremental tax paid on incremental income.</span>
                        </div>
                        <div className="text-2xl font-bold text-primary mt-1">{results.marginalTaxRate.toFixed(2)}%</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-left text-text-light text-sm leading-relaxed bg-white p-lg rounded-lg">
                      <p className="m-0">Please enter your income, deductions, gains, dividends, and taxes paid to get a summary of your results.</p>
                    </div>
                  )}
                </div>
              </div>

              {hasCalculated && results && results.detailedBreakdown && (
                <div className="max-w-[1200px] mx-auto mt-xxl pt-xxl border-t border-border">
                  <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-md text-center">
                    Tax Return Summary - Detailed Breakdown
                  </h2>
                  <p className="text-base text-text-light mb-xl text-center">
                    Line-by-line breakdown for {inputs.taxYear} taxation year
                  </p>

                  <div className="bg-white p-lg rounded-xl shadow-sm mb-xl">
                    {/* Total Income Section */}
                    <div className="mb-lg">
                      <h3 className="text-xl font-semibold text-primary mb-md bg-[#e8f5e9] p-sm rounded">Total income</h3>
                      <div className="space-y-sm">
                        <div className="flex justify-between items-center py-xs border-b border-[#e5e5e5]">
                          <div className="flex-1">
                            <span className="text-text text-sm">Employment income (Line 10100)</span>
                          </div>
                          <div className="text-right font-semibold text-text">
                            {formatCurrency(results.detailedBreakdown.totalIncome.employmentIncome)}
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-xs border-b border-[#e5e5e5]">
                          <div className="flex-1">
                            <span className="text-text text-sm">Interest and other investment income (Line 12100)</span>
                          </div>
                          <div className="text-right font-semibold text-text">
                            {formatCurrency(results.detailedBreakdown.totalIncome.interestAndInvestmentIncome)}
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-xs border-b border-[#e5e5e5]">
                          <div className="flex-1">
                            <span className="text-text text-sm">Net business income (Line 13500)</span>
                          </div>
                          <div className="text-right font-semibold text-text">
                            {formatCurrency(results.detailedBreakdown.totalIncome.netBusinessIncome)}
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-xs border-b border-[#e5e5e5]">
                          <div className="flex-1">
                            <span className="text-text text-sm">Capital gains (50% taxable)</span>
                          </div>
                          <div className="text-right font-semibold text-text">
                            {formatCurrency(results.detailedBreakdown.totalIncome.capitalGains)}
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-xs border-b border-[#e5e5e5]">
                          <div className="flex-1">
                            <span className="text-text text-sm">Eligible dividends</span>
                          </div>
                          <div className="text-right font-semibold text-text">
                            {formatCurrency(results.detailedBreakdown.totalIncome.eligibleDividends)}
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-xs border-b border-[#e5e5e5]">
                          <div className="flex-1">
                            <span className="text-text text-sm">Ineligible dividends</span>
                          </div>
                          <div className="text-right font-semibold text-text">
                            {formatCurrency(results.detailedBreakdown.totalIncome.ineligibleDividends)}
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-md border-t-2 border-primary mt-sm">
                          <div className="flex-1">
                            <span className="text-text font-semibold">This is your total Income. (Line 15000)</span>
                          </div>
                          <div className="text-right font-bold text-primary text-lg">
                            {formatCurrency(results.detailedBreakdown.totalIncome.total)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Net Income Section */}
                    <div className="mb-lg">
                      <h3 className="text-xl font-semibold text-primary mb-md bg-[#e8f5e9] p-sm rounded">Net income</h3>
                      <div className="space-y-sm">
                        <div className="flex justify-between items-center py-xs border-b border-[#e5e5e5]">
                          <div className="flex-1">
                            <span className="text-text text-sm">RRSP deduction (Line 20800)</span>
                          </div>
                          <div className="text-right font-semibold text-text">
                            {formatCurrency(results.detailedBreakdown.netIncome.rrspDeduction)}
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-xs border-b border-[#e5e5e5]">
                          <div className="flex-1">
                            <span className="text-text text-sm">FHSA deduction (Line 20805)</span>
                          </div>
                          <div className="text-right font-semibold text-text">
                            {formatCurrency(results.detailedBreakdown.netIncome.fhsaDeduction)}
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-xs border-b border-[#e5e5e5]">
                          <div className="flex-1">
                            <span className="text-text text-sm">Sum of deductions (Line 23300)</span>
                          </div>
                          <div className="text-right font-semibold text-text">
                            {formatCurrency(results.detailedBreakdown.netIncome.totalDeductions)}
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-xs border-b border-[#e5e5e5]">
                          <div className="flex-1">
                            <span className="text-text text-sm">This is your net Income before adjustments. (Line 23400)</span>
                          </div>
                          <div className="text-right font-semibold text-text">
                            {formatCurrency(results.detailedBreakdown.netIncome.netIncomeBeforeAdjustments)}
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-md border-t-2 border-primary mt-sm">
                          <div className="flex-1">
                            <span className="text-text font-semibold">This is your net Income. (Line 23600)</span>
                          </div>
                          <div className="text-right font-bold text-primary text-lg">
                            {formatCurrency(results.detailedBreakdown.netIncome.netIncome)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Taxable Income Section */}
                    <div className="mb-lg">
                      <h3 className="text-xl font-semibold text-primary mb-md bg-[#e8f5e9] p-sm rounded">Taxable income</h3>
                      <div className="flex justify-between items-center py-md border-b-2 border-primary">
                        <div className="flex-1">
                          <span className="text-text font-semibold">This is your taxable Income. (Line 26000)</span>
                        </div>
                        <div className="text-right font-bold text-primary text-lg">
                          {formatCurrency(results.detailedBreakdown.taxableIncome)}
                        </div>
                      </div>
                    </div>

                    {/* Federal Non-Refundable Tax Credits Section */}
                    <div className="mb-lg">
                      <h3 className="text-xl font-semibold text-primary mb-md bg-[#e8f5e9] p-sm rounded">Federal non-refundable tax credits</h3>
                      <div className="space-y-sm">
                        <div className="flex justify-between items-center py-xs border-b border-[#e5e5e5]">
                          <div className="flex-1">
                            <span className="text-text text-sm">Basic personal amount (Line 30000)</span>
                          </div>
                          <div className="text-right font-semibold text-text">
                            {formatCurrency(results.detailedBreakdown.federalCredits.basicPersonalAmount)}
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-xs border-b border-[#e5e5e5]">
                          <div className="flex-1">
                            <span className="text-text text-sm">CPP or QPP contributions: through employment (Line 30800)</span>
                          </div>
                          <div className="text-right font-semibold text-text">
                            {formatCurrency(results.detailedBreakdown.federalCredits.cppContributions)}
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-xs border-b border-[#e5e5e5]">
                          <div className="flex-1">
                            <span className="text-text text-sm">Canada employment amount (Line 31260)</span>
                          </div>
                          <div className="text-right font-semibold text-text">
                            {formatCurrency(results.detailedBreakdown.federalCredits.canadaEmploymentAmount)}
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-xs border-b border-[#e5e5e5]">
                          <div className="flex-1">
                            <span className="text-text text-sm">Sum of credits (Line 33500)</span>
                          </div>
                          <div className="text-right font-semibold text-text">
                            {formatCurrency(results.detailedBreakdown.federalCredits.sumOfCredits)}
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-xs border-b border-[#e5e5e5]">
                          <div className="flex-1">
                            <span className="text-text text-sm">Multiply the amount on line 33500 by 15% (Line 33800)</span>
                          </div>
                          <div className="text-right font-semibold text-text">
                            {formatCurrency(results.detailedBreakdown.federalCredits.creditsAt15Percent)}
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-md border-t-2 border-primary mt-sm">
                          <div className="flex-1">
                            <span className="text-text font-semibold">Total federal non-refundable tax credits (Line 35000)</span>
                          </div>
                          <div className="text-right font-bold text-primary text-lg">
                            {formatCurrency(results.detailedBreakdown.federalCredits.totalFederalCredits)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Net Federal Tax Section */}
                    <div className="mb-lg">
                      <h3 className="text-xl font-semibold text-primary mb-md bg-[#e8f5e9] p-sm rounded">Net federal tax</h3>
                      <div className="space-y-sm">
                        <div className="flex justify-between items-center py-xs border-b border-[#e5e5e5]">
                          <div className="flex-1">
                            <span className="text-text text-sm">Tax on taxable income (C)</span>
                          </div>
                          <div className="text-right font-semibold text-text">
                            {formatCurrency(results.detailedBreakdown.federalTax.taxOnTaxableIncome)}
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-xs border-b border-[#e5e5e5]">
                          <div className="flex-1">
                            <span className="text-text text-sm">Basic federal tax (if negative, enter "0") (Line 42900)</span>
                          </div>
                          <div className="text-right font-semibold text-text">
                            {formatCurrency(results.detailedBreakdown.federalTax.basicFederalTax)}
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-xs border-b border-[#e5e5e5]">
                          <div className="flex-1">
                            <span className="text-text text-sm">Federal foreign tax credit (Line 40500)</span>
                          </div>
                          <div className="text-right font-semibold text-text">
                            {formatCurrency(results.detailedBreakdown.federalTax.federalForeignTaxCredit)}
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-md border-t-2 border-primary mt-sm">
                          <div className="flex-1">
                            <span className="text-text font-semibold">Federal tax (Line 40600)</span>
                          </div>
                          <div className="text-right font-bold text-primary text-lg">
                            {formatCurrency(results.detailedBreakdown.federalTax.netFederalTax)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Refund or Balance Owing Section */}
                    <div className="mb-lg">
                      <h3 className="text-xl font-semibold text-primary mb-md bg-[#e8f5e9] p-sm rounded">Refund or Balance owing</h3>
                      <div className="space-y-sm">
                        <div className="flex justify-between items-center py-xs border-b border-[#e5e5e5]">
                          <div className="flex-1">
                            <span className="text-text text-sm">Net federal tax (Line 42000)</span>
                          </div>
                          <div className="text-right font-semibold text-text">
                            {formatCurrency(results.detailedBreakdown.refundOrOwing.netFederalTax)}
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-xs border-b border-[#e5e5e5]">
                          <div className="flex-1">
                            <span className="text-text text-sm">CPP contributions payable on self-employment and other earnings (Line 42100)</span>
                          </div>
                          <div className="text-right font-semibold text-text">
                            {formatCurrency(results.detailedBreakdown.refundOrOwing.cppContributionsPayable)}
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-xs border-b border-[#e5e5e5]">
                          <div className="flex-1">
                            <span className="text-text text-sm">Provincial or territorial tax (Line 42800)</span>
                          </div>
                          <div className="text-right font-semibold text-text">
                            {formatCurrency(results.detailedBreakdown.refundOrOwing.provincialTax)}
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-xs border-b border-[#e5e5e5]">
                          <div className="flex-1">
                            <span className="text-text text-sm">This is your total payable. (Line 43500)</span>
                          </div>
                          <div className="text-right font-semibold text-text">
                            {formatCurrency(results.detailedBreakdown.refundOrOwing.totalPayable)}
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-xs border-b border-[#e5e5e5]">
                          <div className="flex-1">
                            <span className="text-text text-sm">Total income tax deducted (Line 43700)</span>
                          </div>
                          <div className="text-right font-semibold text-text">
                            {formatCurrency(results.detailedBreakdown.refundOrOwing.totalIncomeTaxDeducted)}
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-xs border-b border-[#e5e5e5]">
                          <div className="flex-1">
                            <span className="text-text text-sm">These are your total credits. (Line 48200)</span>
                          </div>
                          <div className="text-right font-semibold text-text">
                            {formatCurrency(results.detailedBreakdown.refundOrOwing.totalCredits)}
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-xs border-b border-[#e5e5e5]">
                          <div className="flex-1">
                            <span className="text-text text-sm">Line 43500 minus line 48200</span>
                          </div>
                          <div className="text-right font-semibold text-text">
                            {formatCurrency(results.detailedBreakdown.refundOrOwing.totalPayable - results.detailedBreakdown.refundOrOwing.totalCredits)}
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-xs border-b border-[#e5e5e5]">
                          <div className="flex-1">
                            <span className="text-text text-sm">Refund (Line 48400)</span>
                          </div>
                          <div className={`text-right font-semibold ${results.detailedBreakdown.refundOrOwing.refund > 0 ? 'text-green-600' : 'text-text'}`}>
                            {formatCurrency(results.detailedBreakdown.refundOrOwing.refund)}
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-md border-t-2 border-primary mt-sm">
                          <div className="flex-1">
                            <span className="text-text font-semibold">Balance owing (Line 48500)</span>
                          </div>
                          <div className={`text-right font-bold text-lg ${results.detailedBreakdown.refundOrOwing.balanceOwing > 0 ? 'text-red-600' : 'text-primary'}`}>
                            {formatCurrency(results.detailedBreakdown.refundOrOwing.balanceOwing)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Additional Information Section */}
                    <div>
                      <h3 className="text-xl font-semibold text-primary mb-md bg-[#e8f5e9] p-sm rounded">Additional information</h3>
                      <div className="space-y-sm">
                        <div className="flex justify-between items-center py-xs border-b border-[#e5e5e5]">
                          <div className="flex-1">
                            <span className="text-text text-sm">Marginal tax rate</span>
                          </div>
                          <div className="text-right font-semibold text-text">
                            {results.detailedBreakdown.additionalInfo.marginalTaxRate.toFixed(2)}%
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-xs border-b border-[#e5e5e5]">
                          <div className="flex-1">
                            <span className="text-text text-sm">Average tax rate (total income taxes paid + total income)</span>
                          </div>
                          <div className="text-right font-semibold text-text">
                            {results.detailedBreakdown.additionalInfo.averageTaxRate.toFixed(2)}%
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-xs border-b border-[#e5e5e5]">
                          <div className="flex-1">
                            <span className="text-text text-sm">Total RRSP deduction limit - 2025</span>
                          </div>
                          <div className="text-right font-semibold text-text">
                            {results.detailedBreakdown.additionalInfo.totalRRSPDeductionLimit > 0 
                              ? formatCurrency(results.detailedBreakdown.additionalInfo.totalRRSPDeductionLimit)
                              : 'N/A'}
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-xs border-b border-[#e5e5e5]">
                          <div className="flex-1">
                            <span className="text-text text-sm">Unused RRSP contributions</span>
                          </div>
                          <div className="text-right font-semibold text-text">
                            {results.detailedBreakdown.additionalInfo.unusedRRSPContributions > 0
                              ? formatCurrency(results.detailedBreakdown.additionalInfo.unusedRRSPContributions)
                              : 'N/A'}
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-xs">
                          <div className="flex-1">
                            <span className="text-text text-sm">Total instalments payable in 2025</span>
                          </div>
                          <div className="text-right font-semibold text-text">
                            {results.detailedBreakdown.additionalInfo.totalInstalmentsPayable > 0
                              ? formatCurrency(results.detailedBreakdown.additionalInfo.totalInstalmentsPayable)
                              : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {hasCalculated && results && results.detailedBreakdown && (
                <div className="max-w-[1200px] mx-auto mt-xxl pt-xxl border-t border-border">
                  <div className="bg-white p-lg rounded-xl shadow-sm">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-lg pb-md border-b-2 border-primary">
                      <h2 className="text-2xl lg:text-3xl font-bold text-primary">
                        Tax return Summary - Combined for {inputs.taxYear} taxation year
                      </h2>
                      <div className="flex items-center gap-sm">
                        <span className="text-text font-semibold">Taxpayer</span>
                        <div className="w-32 h-8 border border-[#d0d0d0] rounded bg-white"></div>
                      </div>
                    </div>

                    {/* Line 41700 */}
                    <div className="mb-lg">
                      <div className="flex justify-between items-center py-md border-b border-[#e5e5e5]">
                        <div className="flex-1">
                          <span className="text-text text-sm">Line 40600 minus line 41600 (if negative, enter "0")</span>
                        </div>
                        <div className="text-right">
                          <span className="text-text text-xs mr-sm">41700</span>
                          <span className="font-semibold text-text">
                            {formatCurrency(results.detailedBreakdown.federalTax.netFederalTax)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Refund or Balance owing Section */}
                    <div className="mb-lg">
                      <h3 className="text-xl font-semibold text-primary mb-md bg-[#e8f5e9] p-sm rounded">Refund or Balance owing</h3>
                      <div className="space-y-sm">
                        <div className="flex justify-between items-center py-xs border-b border-[#e5e5e5]">
                          <div className="flex-1">
                            <span className="text-text text-sm">Net federal tax:</span>
                            <span className="text-text text-xs ml-sm text-text-light">add lines 41700, 41500 and 41800.</span>
                          </div>
                          <div className="text-right">
                            <span className="text-text text-xs mr-sm">42000</span>
                            <span className="font-semibold text-text">
                              {formatCurrency(results.detailedBreakdown.refundOrOwing.netFederalTax)}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-xs border-b border-[#e5e5e5]">
                          <div className="flex-1">
                            <span className="text-text text-sm">CPP contributions payable on self-employment and other earnings:</span>
                          </div>
                          <div className="text-right">
                            <span className="text-text text-xs mr-sm">42100</span>
                            <span className="font-semibold text-text">
                              {formatCurrency(results.detailedBreakdown.refundOrOwing.cppContributionsPayable)}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-xs border-b border-[#e5e5e5]">
                          <div className="flex-1">
                            <span className="text-text text-sm">Provincial or territorial tax:</span>
                          </div>
                          <div className="text-right">
                            <span className="text-text text-xs mr-sm">42800</span>
                            <span className="font-semibold text-text">
                              {formatCurrency(results.detailedBreakdown.refundOrOwing.provincialTax)}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-xs border-b border-[#e5e5e5]">
                          <div className="flex-1">
                            <span className="text-text font-semibold">This is your total payable.</span>
                          </div>
                          <div className="text-right">
                            <span className="text-text text-xs mr-sm">43500</span>
                            <span className="font-bold text-primary text-lg">
                              {formatCurrency(results.detailedBreakdown.refundOrOwing.totalPayable)}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-xs border-b border-[#e5e5e5]">
                          <div className="flex-1">
                            <span className="text-text text-sm">Total income tax deducted:</span>
                          </div>
                          <div className="text-right">
                            <span className="text-text text-xs mr-sm">43700</span>
                            <span className="font-semibold text-text">
                              {formatCurrency(results.detailedBreakdown.refundOrOwing.totalIncomeTaxDeducted)}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-xs border-b border-[#e5e5e5]">
                          <div className="flex-1">
                            <span className="text-text font-semibold">These are your total credits.</span>
                          </div>
                          <div className="text-right">
                            <span className="text-text text-xs mr-sm">48200</span>
                            <span className="font-semibold text-text">
                              {formatCurrency(results.detailedBreakdown.refundOrOwing.totalCredits)}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-xs border-b border-[#e5e5e5]">
                          <div className="flex-1">
                            <span className="text-text text-sm">Line 43500 minus line 48200</span>
                          </div>
                          <div className="text-right font-semibold text-text">
                            {formatCurrency(results.detailedBreakdown.refundOrOwing.totalPayable - results.detailedBreakdown.refundOrOwing.totalCredits)}
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-xs border-b border-[#e5e5e5]">
                          <div className="flex-1">
                            <span className="text-text text-sm">Refund:</span>
                          </div>
                          <div className="text-right">
                            <span className="text-text text-xs mr-sm">48400</span>
                            <span className={`font-semibold ${results.detailedBreakdown.refundOrOwing.refund > 0 ? 'text-green-600' : 'text-text'}`}>
                              {formatCurrency(results.detailedBreakdown.refundOrOwing.refund)}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-md border-t-2 border-primary mt-sm">
                          <div className="flex-1">
                            <span className="text-text font-semibold">Balance owing:</span>
                          </div>
                          <div className="text-right">
                            <span className="text-text text-xs mr-sm">48500</span>
                            <span className={`font-bold text-lg ${results.detailedBreakdown.refundOrOwing.balanceOwing > 0 ? 'text-red-600' : 'text-primary'}`}>
                              {formatCurrency(results.detailedBreakdown.refundOrOwing.balanceOwing)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Additional information Section */}
                    <div>
                      <h3 className="text-xl font-semibold text-primary mb-md bg-[#e8f5e9] p-sm rounded">Additional information</h3>
                      <div className="space-y-sm">
                        <div className="flex justify-between items-center py-xs border-b border-[#e5e5e5]">
                          <div className="flex-1">
                            <span className="text-text text-sm">Marginal tax rate:</span>
                          </div>
                          <div className="text-right font-semibold text-text">
                            {results.detailedBreakdown.additionalInfo.marginalTaxRate.toFixed(2)}%
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-xs border-b border-[#e5e5e5]">
                          <div className="flex-1">
                            <span className="text-text text-sm">Average tax rate (total income taxes paid + total income):</span>
                          </div>
                          <div className="text-right font-semibold text-text">
                            {results.detailedBreakdown.additionalInfo.averageTaxRate.toFixed(2)}%
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-xs border-b border-[#e5e5e5]">
                          <div className="flex-1">
                            <span className="text-text text-sm">Canada child benefit:</span>
                          </div>
                          <div className="text-right">
                            <div className="w-24 h-6 border border-[#d0d0d0] rounded bg-white inline-block"></div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-xs border-b border-[#e5e5e5]">
                          <div className="flex-1">
                            <span className="text-text text-sm">Total RRSP deduction limit - 2025:</span>
                          </div>
                          <div className="text-right font-semibold text-text">
                            {results.detailedBreakdown.additionalInfo.totalRRSPDeductionLimit > 0 
                              ? formatCurrency(results.detailedBreakdown.additionalInfo.totalRRSPDeductionLimit)
                              : 'N/A'}
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-xs border-b border-[#e5e5e5]">
                          <div className="flex-1">
                            <span className="text-text text-sm">Unused RRSP contributions:</span>
                          </div>
                          <div className="text-right font-semibold text-text">
                            {results.detailedBreakdown.additionalInfo.unusedRRSPContributions > 0
                              ? formatCurrency(results.detailedBreakdown.additionalInfo.unusedRRSPContributions)
                              : 'N/A'}
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-xs">
                          <div className="flex-1">
                            <span className="text-text text-sm">Total instalments payable in 2025:</span>
                          </div>
                          <div className="text-right font-semibold text-text">
                            {results.detailedBreakdown.additionalInfo.totalInstalmentsPayable > 0
                              ? formatCurrency(results.detailedBreakdown.additionalInfo.totalInstalmentsPayable)
                              : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {hasCalculated && results && (
                <div className="max-w-[1200px] mx-auto mt-xxl pt-xxl border-t border-border">
                  <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-sm">
                    {provinces.find(p => p.code === inputs.province)?.name || 'Provincial'} Provincial and Federal tax brackets
                  </h2>
                  <p className="text-base text-text-light mb-xl">
                    Your taxable income places you in the following tax brackets.
                  </p>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
                    <div className="bg-white p-lg rounded-lg shadow-sm">
                      <h3 className="text-lg font-semibold text-primary mb-md">Canadian federal tax bracket</h3>
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="bg-background">
                            <th className="px-md py-sm text-left font-semibold text-text border-b-2 border-border">Canadian federal tax bracket</th>
                            <th className="px-md py-sm text-left font-semibold text-text border-b-2 border-border">Canadian federal tax rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {federalData2025.brackets.map((bracket, index) => {
                            const prevBracket = index > 0 ? federalData2025.brackets[index - 1] : null
                            const rangeStart = prevBracket && prevBracket.upTo ? prevBracket.upTo + 1 : 0
                            const rangeEnd = bracket.upTo
                            return (
                              <tr key={index} className="last:border-b-0">
                                <td className="px-md py-sm border-b border-border text-text">
                                  {rangeStart === 0 
                                    ? `$${rangeEnd?.toLocaleString('en-CA')} or less`
                                    : rangeEnd === null
                                    ? `More than $${rangeStart.toLocaleString('en-CA')}`
                                    : `$${rangeStart.toLocaleString('en-CA')} - $${rangeEnd.toLocaleString('en-CA')}`
                                  }
                                </td>
                                <td className="px-md py-sm border-b border-border text-text">{(bracket.rate * 100).toFixed(1)}%</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-white p-lg rounded-lg shadow-sm">
                      <h3 className="text-lg font-semibold text-primary mb-md">
                        {provinces.find(p => p.code === inputs.province)?.name || 'Provincial'} tax bracket
                      </h3>
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="bg-background">
                            <th className="px-md py-sm text-left font-semibold text-text border-b-2 border-border">{provinces.find(p => p.code === inputs.province)?.name || 'Provincial'} tax bracket</th>
                            <th className="px-md py-sm text-left font-semibold text-text border-b-2 border-border">{provinces.find(p => p.code === inputs.province)?.name || 'Provincial'} tax rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const provincesData = provincesData2025 as any
                            const provincialData = provincesData[inputs.province]
                            if (!provincialData) return null
                            return provincialData.brackets.map((bracket: any, index: number) => {
                              const prevBracket = index > 0 ? provincialData.brackets[index - 1] : null
                              const rangeStart = prevBracket && prevBracket.upTo ? prevBracket.upTo + 1 : 0
                              const rangeEnd = bracket.upTo
                              return (
                                <tr key={index} className="last:border-b-0">
                                  <td className="px-md py-sm border-b border-border text-text">
                                    {rangeStart === 0 
                                      ? `$${rangeEnd?.toLocaleString('en-CA')} or less`
                                      : rangeEnd === null
                                      ? `More than $${rangeStart.toLocaleString('en-CA')}`
                                      : `$${rangeStart.toLocaleString('en-CA')} - $${rangeEnd.toLocaleString('en-CA')}`
                                    }
                                  </td>
                                  <td className="px-md py-sm border-b border-border text-text">{(bracket.rate * 100).toFixed(1)}%</td>
                                </tr>
                              )
                            })
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              <div className="max-w-[1200px] mx-auto mt-xxl p-lg bg-background rounded-lg text-sm text-text-light leading-relaxed">
                <p className="text-text font-semibold text-base mb-sm">Disclaimer</p>
                <p className="mb-sm">
                  These calculations are approximate and include the following non-refundable tax credits: the basic personal tax amount. After-tax income is your total income net of federal tax and provincial/territorial tax. Rates are current as of January 2025.
                </p>
                <p className="mb-0">
                  <strong className="text-text font-semibold">Estimates only.</strong> This calculator provides approximate tax estimates for planning purposes only. It does not include all deductions, credits, or tax situations. This is not tax advice. Final tax depends on your complete tax return, including all income sources, deductions, credits, and your specific tax situation.
                </p>
              </div>

              <div className="max-w-[1200px] mx-auto mt-xxl text-center p-xl bg-white rounded-xl shadow-sm">
                <p className="text-lg text-text mb-lg">
                  Need help with your tax planning or filing? Our team can provide personalized advice.
                </p>
                <div className="flex gap-md justify-center flex-wrap">
                  <CalendlyButton />
                  <a href="tel:6138840208" className="btn btn--secondary">
                    Call: 613-884-0208
                  </a>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}

export default TaxCalculator
