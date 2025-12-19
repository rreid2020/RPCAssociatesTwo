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
    rrspContributions: 0
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
    if (typeof value === 'string' && (field === 'employmentIncome' || field === 'selfEmploymentIncome' || field === 'otherIncome' || field === 'rrspContributions')) {
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
            <div className="section__header">
              <h1 className="section__title">Canadian Personal Income Tax Calculator</h1>
              <p className="section__subtitle">
                Estimate your personal income tax for planning purposes. This calculator provides an approximation based on basic income sources and RRSP contributions.
              </p>
            </div>

            <div className="tax-calculator">
              <form className="tax-calculator__form" onSubmit={handleCalculate}>
                <div className="tax-calculator__row">
                  <div className="contact__field">
                    <label htmlFor="taxYear" className="contact__label">Tax Year</label>
                    <select
                      id="taxYear"
                      className="contact__input"
                      value={inputs.taxYear}
                      onChange={(e) => handleInputChange('taxYear', parseInt(e.target.value))}
                    >
                      <option value={2025}>2025</option>
                    </select>
                  </div>

                  <div className="contact__field">
                    <label htmlFor="province" className="contact__label">Province/Territory</label>
                    <select
                      id="province"
                      className="contact__input"
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

                <div className="tax-calculator__row">
                  <div className="contact__field">
                    <label htmlFor="employmentIncome" className="contact__label">Employment Income</label>
                    <input
                      type="number"
                      id="employmentIncome"
                      className="contact__input"
                      min="0"
                      step="0.01"
                      value={inputs.employmentIncome || ''}
                      onChange={(e) => handleInputChange('employmentIncome', e.target.value)}
                    />
                  </div>

                  <div className="contact__field">
                    <label htmlFor="selfEmploymentIncome" className="contact__label">Self-Employment Income</label>
                    <input
                      type="number"
                      id="selfEmploymentIncome"
                      className="contact__input"
                      min="0"
                      step="0.01"
                      value={inputs.selfEmploymentIncome || ''}
                      onChange={(e) => handleInputChange('selfEmploymentIncome', e.target.value)}
                    />
                  </div>
                </div>

                <div className="tax-calculator__row">
                  <div className="contact__field">
                    <label htmlFor="otherIncome" className="contact__label">Other Income</label>
                    <input
                      type="number"
                      id="otherIncome"
                      className="contact__input"
                      min="0"
                      step="0.01"
                      value={inputs.otherIncome || ''}
                      onChange={(e) => handleInputChange('otherIncome', e.target.value)}
                    />
                  </div>

                  <div className="contact__field">
                    <label htmlFor="rrspContributions" className="contact__label">RRSP Contributions</label>
                    <input
                      type="number"
                      id="rrspContributions"
                      className="contact__input"
                      min="0"
                      step="0.01"
                      value={inputs.rrspContributions || ''}
                      onChange={(e) => handleInputChange('rrspContributions', e.target.value)}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn--primary tax-calculator__calculate-btn">
                  Calculate Tax
                </button>
              </form>

              {hasCalculated && results && (
                <div className="tax-calculator__results">
                  <h2 className="tax-calculator__results-title">Tax Estimate</h2>
                  
                  <div className="tax-calculator__result-section">
                    <div className="tax-calculator__result-row">
                      <span className="tax-calculator__result-label">Taxable Income:</span>
                      <span className="tax-calculator__result-value">{formatCurrency(results.taxableIncome)}</span>
                    </div>
                  </div>

                  <div className="tax-calculator__result-section">
                    <h3 className="tax-calculator__result-heading">Federal Tax</h3>
                    <div className="tax-calculator__result-row">
                      <span className="tax-calculator__result-label">Gross Tax:</span>
                      <span className="tax-calculator__result-value">{formatCurrency(results.federalTax.gross)}</span>
                    </div>
                    <div className="tax-calculator__result-row">
                      <span className="tax-calculator__result-label">Credits:</span>
                      <span className="tax-calculator__result-value">-{formatCurrency(results.federalTax.credits)}</span>
                    </div>
                    <div className="tax-calculator__result-row tax-calculator__result-row--total">
                      <span className="tax-calculator__result-label">Net Federal Tax:</span>
                      <span className="tax-calculator__result-value">{formatCurrency(results.federalTax.net)}</span>
                    </div>
                  </div>

                  <div className="tax-calculator__result-section">
                    <h3 className="tax-calculator__result-heading">Provincial/Territorial Tax</h3>
                    <div className="tax-calculator__result-row">
                      <span className="tax-calculator__result-label">Gross Tax:</span>
                      <span className="tax-calculator__result-value">{formatCurrency(results.provincialTax.gross)}</span>
                    </div>
                    <div className="tax-calculator__result-row">
                      <span className="tax-calculator__result-label">Credits:</span>
                      <span className="tax-calculator__result-value">{formatCurrency(results.provincialTax.credits)}</span>
                    </div>
                    <div className="tax-calculator__result-row tax-calculator__result-row--total">
                      <span className="tax-calculator__result-label">Net Provincial Tax:</span>
                      <span className="tax-calculator__result-value">{formatCurrency(results.provincialTax.net)}</span>
                    </div>
                  </div>

                  <div className="tax-calculator__result-section tax-calculator__result-section--summary">
                    <div className="tax-calculator__result-row tax-calculator__result-row--major">
                      <span className="tax-calculator__result-label">Total Estimated Tax:</span>
                      <span className="tax-calculator__result-value">{formatCurrency(results.totalTax)}</span>
                    </div>
                    <div className="tax-calculator__result-row">
                      <span className="tax-calculator__result-label">Average Tax Rate:</span>
                      <span className="tax-calculator__result-value">{results.averageTaxRate.toFixed(2)}%</span>
                    </div>
                    <div className="tax-calculator__result-row">
                      <span className="tax-calculator__result-label">Marginal Tax Rate:</span>
                      <span className="tax-calculator__result-value">{results.marginalTaxRate.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="tax-calculator__disclaimer">
                <h3 className="tax-calculator__disclaimer-title">Important Disclaimer</h3>
                <p className="tax-calculator__disclaimer-text">
                  <strong>Estimates only.</strong> This calculator provides approximate tax estimates for planning purposes only. It does not include all deductions, credits, or tax situations. This is not tax advice.
                </p>
                <p className="tax-calculator__disclaimer-text">
                  <strong>For planning purposes only—</strong>final tax depends on your complete tax return, including all income sources, deductions, credits, and your specific tax situation.
                </p>
                <div className="tax-calculator__disclaimer-details">
                  <div>
                    <strong>What's included:</strong>
                    <ul>
                      <li>Basic employment, self-employment, and other income</li>
                      <li>RRSP contribution deductions</li>
                      <li>Federal Basic Personal Amount (BPA) credit with phase-out</li>
                      <li>Progressive federal and provincial/territorial tax brackets</li>
                    </ul>
                  </div>
                  <div>
                    <strong>What's not included:</strong>
                    <ul>
                      <li>Provincial/territorial tax credits (excluded for reliability)</li>
                      <li>Dividend tax credits</li>
                      <li>Capital gains treatment</li>
                      <li>Other deductions and credits (CPP, EI, medical expenses, etc.)</li>
                      <li>Tax on split income, alternative minimum tax, and other special situations</li>
                    </ul>
                  </div>
                </div>
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
