import { FC, useState, useEffect } from 'react'
import SEO from '../components/SEO'
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

  const scrollToContact = () => {
    if (window.location.pathname !== '/') {
      window.location.href = '/#contact'
    } else {
      const element = document.getElementById('contact')
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
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
        canonical="/resources/canadian-personal-income-tax-calculator"
      />
      <main className="page-content">
        <div className="container">
          <section className="section">
            <div className="tax-calculator__page-header">
              <h1 className="tax-calculator__page-title">
                {inputs.taxYear} {provinces.find(p => p.code === inputs.province)?.name || 'Ontario'} Income Tax Calculator
              </h1>
              <p className="tax-calculator__page-subtitle">
                Plug in a few numbers and we'll give you visibility into your tax bracket, marginal tax rate, average tax rate, and an estimate of your taxes owed in {inputs.taxYear}.
              </p>
            </div>

            <div className="tax-calculator">
              <div className="tax-calculator__container">
                <div className="tax-calculator__inputs-section">
                  <form className="tax-calculator__form" onSubmit={handleCalculate}>
                    <div className="tax-calculator__form-header">
                      <div className="tax-calculator__field-group">
                        <label htmlFor="province" className="tax-calculator__field-label">Choose province or territory</label>
                        <select
                          id="province"
                          className="tax-calculator__select"
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

                    <div className="tax-calculator__field-group">
                      <label htmlFor="employmentIncome" className="tax-calculator__field-label">Employment income</label>
                      <p className="tax-calculator__field-description">Employment income and taxable benefits.</p>
                      <input
                        type="number"
                        id="employmentIncome"
                        className="tax-calculator__input"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        value={inputs.employmentIncome || ''}
                        onChange={(e) => handleInputChange('employmentIncome', e.target.value)}
                      />
                    </div>

                    <div className="tax-calculator__field-group">
                      <label htmlFor="selfEmploymentIncome" className="tax-calculator__field-label">Self-employment income</label>
                      <p className="tax-calculator__field-description">Business, professional, commission, partnership, fishing, and farming income.</p>
                      <input
                        type="number"
                        id="selfEmploymentIncome"
                        className="tax-calculator__input"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        value={inputs.selfEmploymentIncome || ''}
                        onChange={(e) => handleInputChange('selfEmploymentIncome', e.target.value)}
                      />
                    </div>

                    <div className="tax-calculator__field-group">
                      <label htmlFor="rrspContributions" className="tax-calculator__field-label">RRSP and FHSA deductions</label>
                      <p className="tax-calculator__field-description">Keep in mind RRSP and FHSA contributions are subject to annual contribution and deduction limits.</p>
                      <input
                        type="number"
                        id="rrspContributions"
                        className="tax-calculator__input"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        value={inputs.rrspContributions || ''}
                        onChange={(e) => handleInputChange('rrspContributions', e.target.value)}
                      />
                    </div>

                    <div className="tax-calculator__field-group">
                      <label htmlFor="capitalGains" className="tax-calculator__field-label">Capital gains</label>
                      <p className="tax-calculator__field-description">Half of this amount is included in income.</p>
                      <input
                        type="number"
                        id="capitalGains"
                        className="tax-calculator__input"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        value={inputs.capitalGains || ''}
                        onChange={(e) => handleInputChange('capitalGains', e.target.value)}
                      />
                    </div>

                    <div className="tax-calculator__field-group">
                      <label htmlFor="eligibleDividends" className="tax-calculator__field-label">Eligible dividends</label>
                      <p className="tax-calculator__field-description">In general, these are dividends received from public Canadian companies. Enter the actual amount of dividends received.</p>
                      <input
                        type="number"
                        id="eligibleDividends"
                        className="tax-calculator__input"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        value={inputs.eligibleDividends || ''}
                        onChange={(e) => handleInputChange('eligibleDividends', e.target.value)}
                      />
                    </div>

                    <div className="tax-calculator__field-group">
                      <label htmlFor="ineligibleDividends" className="tax-calculator__field-label">Ineligible Dividends</label>
                      <p className="tax-calculator__field-description">In general, these are dividends received from private Canadian companies. Enter the actual amount of dividends received.</p>
                      <input
                        type="number"
                        id="ineligibleDividends"
                        className="tax-calculator__input"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        value={inputs.ineligibleDividends || ''}
                        onChange={(e) => handleInputChange('ineligibleDividends', e.target.value)}
                      />
                    </div>

                    <div className="tax-calculator__field-group">
                      <label htmlFor="otherIncome" className="tax-calculator__field-label">Other income</label>
                      <p className="tax-calculator__field-description">All other income (like rental income, interest, tips, EI, CPP, and OAS).</p>
                      <input
                        type="number"
                        id="otherIncome"
                        className="tax-calculator__input"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        value={inputs.otherIncome || ''}
                        onChange={(e) => handleInputChange('otherIncome', e.target.value)}
                      />
                    </div>

                    <div className="tax-calculator__field-group">
                      <label htmlFor="incomeTaxesPaid" className="tax-calculator__field-label">Income taxes paid</label>
                      <p className="tax-calculator__field-description">For example, taxes deducted from your paycheque. Don't include CPP/EI contributions.</p>
                      <input
                        type="number"
                        id="incomeTaxesPaid"
                        className="tax-calculator__input"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        value={inputs.incomeTaxesPaid || ''}
                        onChange={(e) => handleInputChange('incomeTaxesPaid', e.target.value)}
                      />
                    </div>

                    <button type="submit" className="btn btn--primary tax-calculator__calculate-btn">
                      Calculate
                    </button>
                  </form>
                </div>

                <div className="tax-calculator__results-section">
                  <h2 className="tax-calculator__results-title">Your Results</h2>
                  
                  {hasCalculated && results ? (
                    <div className="tax-calculator__result-card">
                      <div className="tax-calculator__result-item">
                        <div className="tax-calculator__result-item-header">
                          <span className="tax-calculator__result-item-label">Total income</span>
                          <span className="tax-calculator__result-item-description">Total income entered.</span>
                        </div>
                        <div className="tax-calculator__result-item-value">
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

                      <div className="tax-calculator__result-item">
                        <div className="tax-calculator__result-item-header">
                          <span className="tax-calculator__result-item-label">Total tax</span>
                        </div>
                        <div className="tax-calculator__result-item-value tax-calculator__result-item-value--large">{formatCurrency(results.totalTax)}</div>
                        <div className="tax-calculator__result-item-breakdown">
                          <div className="tax-calculator__result-item-breakdown-item">
                            <span>Federal Tax</span>
                            <span>{formatCurrency(results.federalTax.net)}</span>
                          </div>
                          <div className="tax-calculator__result-item-breakdown-item">
                            <span>Provincial/Territorial Tax</span>
                            <span>{formatCurrency(results.provincialTax.net)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="tax-calculator__result-item">
                        <div className="tax-calculator__result-item-header">
                          <span className="tax-calculator__result-item-label">After-tax income</span>
                          <span className="tax-calculator__result-item-description">Total income after tax.</span>
                        </div>
                        <div className="tax-calculator__result-item-value">
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
                        <div className="tax-calculator__result-item">
                          <div className="tax-calculator__result-item-header">
                            <span className="tax-calculator__result-item-label">
                              {results.refundOrOwing > 0 ? 'Estimated refund' : 'Amount owing'}
                            </span>
                            <span className="tax-calculator__result-item-description">
                              {results.refundOrOwing > 0 
                                ? 'Tax refund after accounting for taxes already paid.'
                                : 'Additional tax payable after accounting for taxes already paid.'}
                            </span>
                          </div>
                          <div className={`tax-calculator__result-item-value ${results.refundOrOwing > 0 ? 'tax-calculator__result-item-value--refund' : 'tax-calculator__result-item-value--owing'}`}>
                            {results.refundOrOwing > 0 ? '+' : ''}{formatCurrency(Math.abs(results.refundOrOwing))}
                          </div>
                        </div>
                      )}

                      <div className="tax-calculator__result-item">
                        <div className="tax-calculator__result-item-header">
                          <span className="tax-calculator__result-item-label">Average tax rate</span>
                          <span className="tax-calculator__result-item-description">Total tax divided by total income.</span>
                        </div>
                        <div className="tax-calculator__result-item-value">{results.averageTaxRate.toFixed(2)}%</div>
                      </div>

                      <div className="tax-calculator__result-item">
                        <div className="tax-calculator__result-item-header">
                          <span className="tax-calculator__result-item-label">Marginal tax rate</span>
                          <span className="tax-calculator__result-item-description">Incremental tax paid on incremental income.</span>
                        </div>
                        <div className="tax-calculator__result-item-value">{results.marginalTaxRate.toFixed(2)}%</div>
                      </div>
                    </div>
                  ) : (
                    <div className="tax-calculator__placeholder">
                      <p>Please enter your income, deductions, gains, dividends, and taxes paid to get a summary of your results.</p>
                    </div>
                  )}
                </div>
              </div>

              {hasCalculated && results && (
                <div className="tax-calculator__brackets-section">
                  <h2 className="tax-calculator__brackets-title">
                    {provinces.find(p => p.code === inputs.province)?.name || 'Provincial'} Provincial and Federal tax brackets
                  </h2>
                  <p className="tax-calculator__brackets-subtitle">
                    Your taxable income places you in the following tax brackets.
                  </p>
                  
                  <div className="tax-calculator__brackets-tables">
                    <div className="tax-calculator__brackets-table-wrapper">
                      <h3 className="tax-calculator__brackets-table-title">Canadian federal tax bracket</h3>
                      <table className="tax-calculator__brackets-table">
                        <thead>
                          <tr>
                            <th>Canadian federal tax bracket</th>
                            <th>Canadian federal tax rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {federalData2025.brackets.map((bracket, index) => {
                            const prevBracket = index > 0 ? federalData2025.brackets[index - 1] : null
                            const rangeStart = prevBracket && prevBracket.upTo ? prevBracket.upTo + 1 : 0
                            const rangeEnd = bracket.upTo
                            return (
                              <tr key={index}>
                                <td>
                                  {rangeStart === 0 
                                    ? `$${rangeEnd?.toLocaleString('en-CA')} or less`
                                    : rangeEnd === null
                                    ? `More than $${rangeStart.toLocaleString('en-CA')}`
                                    : `$${rangeStart.toLocaleString('en-CA')} - $${rangeEnd.toLocaleString('en-CA')}`
                                  }
                                </td>
                                <td>{(bracket.rate * 100).toFixed(1)}%</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="tax-calculator__brackets-table-wrapper">
                      <h3 className="tax-calculator__brackets-table-title">
                        {provinces.find(p => p.code === inputs.province)?.name || 'Provincial'} tax bracket
                      </h3>
                      <table className="tax-calculator__brackets-table">
                        <thead>
                          <tr>
                            <th>{provinces.find(p => p.code === inputs.province)?.name || 'Provincial'} tax bracket</th>
                            <th>{provinces.find(p => p.code === inputs.province)?.name || 'Provincial'} tax rate</th>
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
                                <tr key={index}>
                                  <td>
                                    {rangeStart === 0 
                                      ? `$${rangeEnd?.toLocaleString('en-CA')} or less`
                                      : rangeEnd === null
                                      ? `More than $${rangeStart.toLocaleString('en-CA')}`
                                      : `$${rangeStart.toLocaleString('en-CA')} - $${rangeEnd.toLocaleString('en-CA')}`
                                    }
                                  </td>
                                  <td>{(bracket.rate * 100).toFixed(1)}%</td>
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

              <div className="tax-calculator__disclaimer">
                <p className="tax-calculator__disclaimer-text">
                  These calculations are approximate and include the following non-refundable tax credits: the basic personal tax amount. After-tax income is your total income net of federal tax and provincial/territorial tax. Rates are current as of January 2025.
                </p>
                <p className="tax-calculator__disclaimer-text">
                  <strong>Estimates only.</strong> This calculator provides approximate tax estimates for planning purposes only. It does not include all deductions, credits, or tax situations. This is not tax advice. Final tax depends on your complete tax return, including all income sources, deductions, credits, and your specific tax situation.
                </p>
              </div>

              <div className="tax-calculator__cta">
                <p className="tax-calculator__cta-text">
                  Need help with your tax planning or filing? Our team can provide personalized advice.
                </p>
                <div className="tax-calculator__cta-buttons">
                  <button className="btn btn--secondary" onClick={scrollToContact}>
                    Request a Call
                  </button>
                  <button className="btn btn--primary" onClick={scrollToContact}>
                    Book a Consultation
                  </button>
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
