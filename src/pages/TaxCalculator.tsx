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
    dateOfBirth: '',
    maritalStatus: 'single',
    numberOfDependents: 0,
    employmentIncome: 0,
    selfEmploymentIncome: 0,
    interestAndInvestmentIncome: 0,
    otherIncome: 0,
    rrspContributions: 0,
    fhsaContributions: 0,
    capitalGains: 0,
    eligibleDividends: 0,
    ineligibleDividends: 0,
    cppContributions: 0,
    donations: 0,
    incomeTaxesPaid: 0,
    carryingCharges: 0,
    interestExpenses: 0,
    otherExpenses: 0,
    oasPension: 0,
    netFederalSupplements: 0,
    politicalContributions: 0,
    medicalExpenses: 0
  })

  const [results, setResults] = useState<TaxCalculatorResults | null>(null)
  const [hasCalculated, setHasCalculated] = useState(false)
  const [inputValues, setInputValues] = useState<{ [key: string]: string }>({})

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
    // Remove currency symbols, commas, and spaces, but keep decimal point
    const cleaned = value.replace(/[$,\s]/g, '').replace(/[^\d.-]/g, '')
    // Handle multiple decimal points - keep only the first one
    const parts = cleaned.split('.')
    const cleanedValue = parts.length > 2 
      ? parts[0] + '.' + parts.slice(1).join('')
      : cleaned
    const parsed = parseFloat(cleanedValue)
    if (isNaN(parsed) || parsed < 0) return 0
    return parsed
  }

  const formatCurrencyInput = (amount: number): string => {
    if (amount === 0) return ''
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const getInputValue = (field: string, numericValue: number): string => {
    // If user is currently typing in this field, use the raw value
    if (inputValues[field] !== undefined) {
      return inputValues[field]
    }
    // Otherwise, format the numeric value
    return formatCurrencyInput(numericValue)
  }

  const handleInputFocus = (field: string, numericValue: number) => {
    // When focusing, show the raw numeric value (or empty if 0)
    const rawValue = numericValue === 0 ? '' : numericValue.toString()
    setInputValues(prev => ({ ...prev, [field]: rawValue }))
  }

  const handleInputBlur = (field: keyof TaxCalculatorInputs, value: string) => {
    const num = parseNumber(value)
    setInputs(prev => ({ ...prev, [field]: num }))
    // Clear the raw input value so it formats on next render
    setInputValues(prev => {
      const newValues = { ...prev }
      delete newValues[field]
      return newValues
    })
  }

  const handleInputChange = (field: keyof TaxCalculatorInputs, value: string | number) => {
    const numericFields = [
      'employmentIncome', 
      'selfEmploymentIncome',
      'interestAndInvestmentIncome',
      'otherIncome', 
      'rrspContributions',
      'fhsaContributions',
      'capitalGains',
      'eligibleDividends',
      'ineligibleDividends',
      'cppContributions',
      'donations',
      'incomeTaxesPaid',
      'numberOfDependents',
      'carryingCharges',
      'interestExpenses',
      'otherExpenses',
      'oasPension',
      'netFederalSupplements',
      'politicalContributions',
      'medicalExpenses'
    ]
    
    if (typeof value === 'string' && numericFields.includes(field)) {
      // Store the raw input value while typing
      setInputValues(prev => ({ ...prev, [field]: value }))
      // Also update the numeric value for calculations
      const num = parseNumber(value)
      setInputs(prev => ({
        ...prev,
        [field]: num
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
      console.log('Calculated results:', calculatedResults)
      console.log('Detailed breakdown:', calculatedResults.detailedBreakdown)
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
                <div className="bg-[#f8f8f8] p-lg rounded-xl lg:sticky lg:top-[calc(1.5rem+60px)]">
                  <h2 className="text-2xl font-bold text-primary mb-md lg:mb-lg">Your Inputs</h2>
                  <form className="flex flex-col gap-md" onSubmit={handleCalculate}>
                    <div className="bg-white p-md rounded-lg">
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

                      <div className="mb-md">
                        <h3 className="text-sm font-semibold text-primary mb-xs bg-[#e8f5e9] px-2 py-1 rounded text-xs">Personal Information</h3>
                        <div className="space-y-md">
                          <div className="flex flex-col gap-1">
                            <label htmlFor="dateOfBirth" className="font-semibold text-text text-xs mb-1">Date of Birth</label>
                            <input
                              type="date"
                              id="dateOfBirth"
                              className="px-3 py-2 border border-[#d0d0d0] rounded-lg font-sans text-sm transition-all bg-white text-text w-full hover:border-[#999] focus:outline-2 focus:outline-primary focus:outline-offset-2 focus:border-primary"
                              value={inputs.dateOfBirth}
                              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label htmlFor="maritalStatus" className="font-semibold text-text text-xs mb-1">Marital Status</label>
                            <select
                              id="maritalStatus"
                              className="px-3 py-2 border border-[#d0d0d0] rounded-lg font-sans text-sm transition-all bg-white text-text w-full hover:border-[#999] focus:outline-2 focus:outline-primary focus:outline-offset-2 focus:border-primary"
                              value={inputs.maritalStatus}
                              onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
                            >
                              <option value="single">Single</option>
                              <option value="married">Married</option>
                              <option value="common-law">Common-law</option>
                              <option value="divorced">Divorced</option>
                              <option value="widowed">Widowed</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-1">
                            <label htmlFor="numberOfDependents" className="font-semibold text-text text-xs mb-1">Number of Dependents (18 years or younger)</label>
                            <input
                              type="number"
                              id="numberOfDependents"
                              className="px-3 py-2 border border-[#d0d0d0] rounded-lg font-sans text-sm transition-all bg-white text-text w-full hover:border-[#999] focus:outline-2 focus:outline-primary focus:outline-offset-2 focus:border-primary"
                              min="0"
                              value={inputs.numberOfDependents}
                              onChange={(e) => handleInputChange('numberOfDependents', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mb-md">
                        <h3 className="text-sm font-semibold text-primary mb-xs bg-[#e8f5e9] px-2 py-1 rounded text-xs">Income</h3>
                        <div className="space-y-md">
                          <div className="flex flex-col gap-1">
                            <label htmlFor="employmentIncome" className="font-semibold text-text text-xs mb-1">Employment income (Line 10100)</label>
                            <p className="text-xs text-text-light m-0 leading-snug mb-1">Employment income and taxable benefits.</p>
                            <input
                              type="text"
                              id="employmentIncome"
                              className="px-3 py-2 border border-[#d0d0d0] rounded-lg font-sans text-sm transition-all bg-white text-text w-full hover:border-[#999] focus:outline-2 focus:outline-primary focus:outline-offset-2 focus:border-primary placeholder:text-[#999]"
                              placeholder="$0.00"
                              value={getInputValue('employmentIncome', inputs.employmentIncome)}
                              onChange={(e) => handleInputChange('employmentIncome', e.target.value)}
                              onFocus={() => handleInputFocus('employmentIncome', inputs.employmentIncome)}
                              onBlur={(e) => handleInputBlur('employmentIncome', e.target.value)}
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label htmlFor="interestAndInvestmentIncome" className="font-semibold text-text text-xs mb-1">Interest and investment income (Line 12100)</label>
                            <p className="text-xs text-text-light m-0 leading-snug mb-1">Interest, dividends from foreign sources, and other investment income.</p>
                            <input
                              type="text"
                              id="interestAndInvestmentIncome"
                              className="px-3 py-2 border border-[#d0d0d0] rounded-lg font-sans text-sm transition-all bg-white text-text w-full hover:border-[#999] focus:outline-2 focus:outline-primary focus:outline-offset-2 focus:border-primary placeholder:text-[#999]"
                              placeholder="$0.00"
                              value={getInputValue('interestAndInvestmentIncome', inputs.interestAndInvestmentIncome)}
                              onChange={(e) => handleInputChange('interestAndInvestmentIncome', e.target.value)}
                              onFocus={() => handleInputFocus('interestAndInvestmentIncome', inputs.interestAndInvestmentIncome)}
                              onBlur={(e) => handleInputBlur('interestAndInvestmentIncome', e.target.value)}
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label htmlFor="selfEmploymentIncome" className="font-semibold text-text text-xs mb-1">Net business income (Line 13500)</label>
                            <p className="text-xs text-text-light m-0 leading-snug mb-1">Business, professional, commission, partnership, fishing, and farming income.</p>
                            <input
                              type="text"
                              id="selfEmploymentIncome"
                              className="px-3 py-2 border border-[#d0d0d0] rounded-lg font-sans text-sm transition-all bg-white text-text w-full hover:border-[#999] focus:outline-2 focus:outline-primary focus:outline-offset-2 focus:border-primary placeholder:text-[#999]"
                              placeholder="$0.00"
                              value={getInputValue('selfEmploymentIncome', inputs.selfEmploymentIncome)}
                              onChange={(e) => handleInputChange('selfEmploymentIncome', e.target.value)}
                              onFocus={() => handleInputFocus('selfEmploymentIncome', inputs.selfEmploymentIncome)}
                              onBlur={(e) => handleInputBlur('selfEmploymentIncome', e.target.value)}
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label htmlFor="capitalGains" className="font-semibold text-text text-xs mb-1">Capital gains</label>
                            <p className="text-xs text-text-light m-0 leading-snug mb-1">Half of this amount is included in income.</p>
                            <input
                              type="text"
                              id="capitalGains"
                              className="px-3 py-2 border border-[#d0d0d0] rounded-lg font-sans text-sm transition-all bg-white text-text w-full hover:border-[#999] focus:outline-2 focus:outline-primary focus:outline-offset-2 focus:border-primary placeholder:text-[#999]"
                              placeholder="$0.00"
                              value={getInputValue('capitalGains', inputs.capitalGains)}
                              onChange={(e) => handleInputChange('capitalGains', e.target.value)}
                              onFocus={() => handleInputFocus('capitalGains', inputs.capitalGains)}
                              onBlur={(e) => handleInputBlur('capitalGains', e.target.value)}
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label htmlFor="eligibleDividends" className="font-semibold text-text text-xs mb-1">Eligible dividends</label>
                            <p className="text-xs text-text-light m-0 leading-snug mb-1">Dividends from public Canadian companies. Enter the actual amount received.</p>
                            <input
                              type="text"
                              id="eligibleDividends"
                              className="px-3 py-2 border border-[#d0d0d0] rounded-lg font-sans text-sm transition-all bg-white text-text w-full hover:border-[#999] focus:outline-2 focus:outline-primary focus:outline-offset-2 focus:border-primary placeholder:text-[#999]"
                              placeholder="$0.00"
                              value={getInputValue('eligibleDividends', inputs.eligibleDividends)}
                              onChange={(e) => handleInputChange('eligibleDividends', e.target.value)}
                              onFocus={() => handleInputFocus('eligibleDividends', inputs.eligibleDividends)}
                              onBlur={(e) => handleInputBlur('eligibleDividends', e.target.value)}
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label htmlFor="ineligibleDividends" className="font-semibold text-text text-xs mb-1">Ineligible dividends</label>
                            <p className="text-xs text-text-light m-0 leading-snug mb-1">Dividends from private Canadian companies. Enter the actual amount received.</p>
                            <input
                              type="text"
                              id="ineligibleDividends"
                              className="px-3 py-2 border border-[#d0d0d0] rounded-lg font-sans text-sm transition-all bg-white text-text w-full hover:border-[#999] focus:outline-2 focus:outline-primary focus:outline-offset-2 focus:border-primary placeholder:text-[#999]"
                              placeholder="$0.00"
                              value={getInputValue('ineligibleDividends', inputs.ineligibleDividends)}
                              onChange={(e) => handleInputChange('ineligibleDividends', e.target.value)}
                              onFocus={() => handleInputFocus('ineligibleDividends', inputs.ineligibleDividends)}
                              onBlur={(e) => handleInputBlur('ineligibleDividends', e.target.value)}
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label htmlFor="otherIncome" className="font-semibold text-text text-xs mb-1">Other income</label>
                            <p className="text-xs text-text-light m-0 leading-snug mb-1">Rental income, tips, EI, CPP, OAS, and other income sources.</p>
                            <input
                              type="text"
                              id="otherIncome"
                              className="px-3 py-2 border border-[#d0d0d0] rounded-lg font-sans text-sm transition-all bg-white text-text w-full hover:border-[#999] focus:outline-2 focus:outline-primary focus:outline-offset-2 focus:border-primary placeholder:text-[#999]"
                              placeholder="$0.00"
                              value={getInputValue('otherIncome', inputs.otherIncome)}
                              onChange={(e) => handleInputChange('otherIncome', e.target.value)}
                              onFocus={() => handleInputFocus('otherIncome', inputs.otherIncome)}
                              onBlur={(e) => handleInputBlur('otherIncome', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mb-md">
                        <h3 className="text-sm font-semibold text-primary mb-xs bg-[#e8f5e9] px-2 py-1 rounded text-xs">Deductions</h3>
                        <div className="space-y-md">
                          <div className="flex flex-col gap-1">
                            <label htmlFor="rrspContributions" className="font-semibold text-text text-xs mb-1">RRSP deduction (Line 20800)</label>
                            <p className="text-xs text-text-light m-0 leading-snug mb-1">RRSP contributions subject to annual limits.</p>
                            <input
                              type="text"
                              id="rrspContributions"
                              className="px-3 py-2 border border-[#d0d0d0] rounded-lg font-sans text-sm transition-all bg-white text-text w-full hover:border-[#999] focus:outline-2 focus:outline-primary focus:outline-offset-2 focus:border-primary placeholder:text-[#999]"
                              placeholder="$0.00"
                              value={getInputValue('rrspContributions', inputs.rrspContributions)}
                              onChange={(e) => handleInputChange('rrspContributions', e.target.value)}
                              onFocus={() => handleInputFocus('rrspContributions', inputs.rrspContributions)}
                              onBlur={(e) => handleInputBlur('rrspContributions', e.target.value)}
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label htmlFor="fhsaContributions" className="font-semibold text-text text-xs mb-1">FHSA deduction (Line 20805)</label>
                            <p className="text-xs text-text-light m-0 leading-snug mb-1">First Home Savings Account contributions.</p>
                            <input
                              type="text"
                              id="fhsaContributions"
                              className="px-3 py-2 border border-[#d0d0d0] rounded-lg font-sans text-sm transition-all bg-white text-text w-full hover:border-[#999] focus:outline-2 focus:outline-primary focus:outline-offset-2 focus:border-primary placeholder:text-[#999]"
                              placeholder="$0.00"
                              value={getInputValue('fhsaContributions', inputs.fhsaContributions)}
                              onChange={(e) => handleInputChange('fhsaContributions', e.target.value)}
                              onFocus={() => handleInputFocus('fhsaContributions', inputs.fhsaContributions)}
                              onBlur={(e) => handleInputBlur('fhsaContributions', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mb-md">
                        <h3 className="text-sm font-semibold text-primary mb-xs bg-[#e8f5e9] px-2 py-1 rounded text-xs">Tax Credits</h3>
                        <div className="space-y-md">
                          <div className="flex flex-col gap-1">
                            <label htmlFor="cppContributions" className="font-semibold text-text text-xs mb-1">CPP contributions (Line 30800)</label>
                            <p className="text-xs text-text-light m-0 leading-snug mb-1">CPP or QPP contributions through employment.</p>
                            <input
                              type="text"
                              id="cppContributions"
                              className="px-3 py-2 border border-[#d0d0d0] rounded-lg font-sans text-sm transition-all bg-white text-text w-full hover:border-[#999] focus:outline-2 focus:outline-primary focus:outline-offset-2 focus:border-primary placeholder:text-[#999]"
                              placeholder="$0.00"
                              value={getInputValue('cppContributions', inputs.cppContributions)}
                              onChange={(e) => handleInputChange('cppContributions', e.target.value)}
                              onFocus={() => handleInputFocus('cppContributions', inputs.cppContributions)}
                              onBlur={(e) => handleInputBlur('cppContributions', e.target.value)}
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label htmlFor="donations" className="font-semibold text-text text-xs mb-1">Donations and gifts (Schedule 9)</label>
                            <p className="text-xs text-text-light m-0 leading-snug mb-1">Charitable donations and gifts.</p>
                            <input
                              type="text"
                              id="donations"
                              className="px-3 py-2 border border-[#d0d0d0] rounded-lg font-sans text-sm transition-all bg-white text-text w-full hover:border-[#999] focus:outline-2 focus:outline-primary focus:outline-offset-2 focus:border-primary placeholder:text-[#999]"
                              placeholder="$0.00"
                              value={getInputValue('donations', inputs.donations)}
                              onChange={(e) => handleInputChange('donations', e.target.value)}
                              onFocus={() => handleInputFocus('donations', inputs.donations)}
                              onBlur={(e) => handleInputBlur('donations', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mb-md">
                        <h3 className="text-sm font-semibold text-primary mb-xs bg-[#e8f5e9] px-2 py-1 rounded text-xs">Deductions (Worksheet)</h3>
                        <div className="space-y-md">
                          <div className="flex flex-col gap-1">
                            <label htmlFor="carryingCharges" className="font-semibold text-text text-xs mb-1">Carrying charges (Line 22100)</label>
                            <p className="text-xs text-text-light m-0 leading-snug mb-1">Investment-related expenses like safety deposit box, accounting fees.</p>
                            <input
                              type="text"
                              id="carryingCharges"
                              className="px-3 py-2 border border-[#d0d0d0] rounded-lg font-sans text-sm transition-all bg-white text-text w-full hover:border-[#999] focus:outline-2 focus:outline-primary focus:outline-offset-2 focus:border-primary placeholder:text-[#999]"
                              placeholder="$0.00"
                              value={getInputValue('carryingCharges', inputs.carryingCharges || 0)}
                              onChange={(e) => handleInputChange('carryingCharges', e.target.value)}
                              onFocus={() => handleInputFocus('carryingCharges', inputs.carryingCharges || 0)}
                              onBlur={(e) => handleInputBlur('carryingCharges', e.target.value)}
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label htmlFor="interestExpenses" className="font-semibold text-text text-xs mb-1">Interest expenses (Line 22100)</label>
                            <p className="text-xs text-text-light m-0 leading-snug mb-1">Interest paid on money borrowed to earn investment income.</p>
                            <input
                              type="text"
                              id="interestExpenses"
                              className="px-3 py-2 border border-[#d0d0d0] rounded-lg font-sans text-sm transition-all bg-white text-text w-full hover:border-[#999] focus:outline-2 focus:outline-primary focus:outline-offset-2 focus:border-primary placeholder:text-[#999]"
                              placeholder="$0.00"
                              value={getInputValue('interestExpenses', inputs.interestExpenses || 0)}
                              onChange={(e) => handleInputChange('interestExpenses', e.target.value)}
                              onFocus={() => handleInputFocus('interestExpenses', inputs.interestExpenses || 0)}
                              onBlur={(e) => handleInputBlur('interestExpenses', e.target.value)}
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label htmlFor="otherExpenses" className="font-semibold text-text text-xs mb-1">Other expenses (Line 22100)</label>
                            <p className="text-xs text-text-light m-0 leading-snug mb-1">Other investment-related expenses.</p>
                            <input
                              type="text"
                              id="otherExpenses"
                              className="px-3 py-2 border border-[#d0d0d0] rounded-lg font-sans text-sm transition-all bg-white text-text w-full hover:border-[#999] focus:outline-2 focus:outline-primary focus:outline-offset-2 focus:border-primary placeholder:text-[#999]"
                              placeholder="$0.00"
                              value={getInputValue('otherExpenses', inputs.otherExpenses || 0)}
                              onChange={(e) => handleInputChange('otherExpenses', e.target.value)}
                              onFocus={() => handleInputFocus('otherExpenses', inputs.otherExpenses || 0)}
                              onBlur={(e) => handleInputBlur('otherExpenses', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mb-md">
                        <h3 className="text-sm font-semibold text-primary mb-xs bg-[#e8f5e9] px-2 py-1 rounded text-xs">Social Benefits</h3>
                        <div className="space-y-md">
                          <div className="flex flex-col gap-1">
                            <label htmlFor="oasPension" className="font-semibold text-text text-xs mb-1">OAS pension (Line 11300)</label>
                            <p className="text-xs text-text-light m-0 leading-snug mb-1">Old Age Security pension amount.</p>
                            <input
                              type="text"
                              id="oasPension"
                              className="px-3 py-2 border border-[#d0d0d0] rounded-lg font-sans text-sm transition-all bg-white text-text w-full hover:border-[#999] focus:outline-2 focus:outline-primary focus:outline-offset-2 focus:border-primary placeholder:text-[#999]"
                              placeholder="$0.00"
                              value={getInputValue('oasPension', inputs.oasPension || 0)}
                              onChange={(e) => handleInputChange('oasPension', e.target.value)}
                              onFocus={() => handleInputFocus('oasPension', inputs.oasPension || 0)}
                              onBlur={(e) => handleInputBlur('oasPension', e.target.value)}
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label htmlFor="netFederalSupplements" className="font-semibold text-text text-xs mb-1">Net federal supplements (Line 14600)</label>
                            <p className="text-xs text-text-light m-0 leading-snug mb-1">Guaranteed Income Supplement and Allowance amounts.</p>
                            <input
                              type="text"
                              id="netFederalSupplements"
                              className="px-3 py-2 border border-[#d0d0d0] rounded-lg font-sans text-sm transition-all bg-white text-text w-full hover:border-[#999] focus:outline-2 focus:outline-primary focus:outline-offset-2 focus:border-primary placeholder:text-[#999]"
                              placeholder="$0.00"
                              value={getInputValue('netFederalSupplements', inputs.netFederalSupplements || 0)}
                              onChange={(e) => handleInputChange('netFederalSupplements', e.target.value)}
                              onFocus={() => handleInputFocus('netFederalSupplements', inputs.netFederalSupplements || 0)}
                              onBlur={(e) => handleInputBlur('netFederalSupplements', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mb-md">
                        <h3 className="text-sm font-semibold text-primary mb-xs bg-[#e8f5e9] px-2 py-1 rounded text-xs">Tax Credits (Worksheet)</h3>
                        <div className="space-y-md">
                          <div className="flex flex-col gap-1">
                            <label htmlFor="politicalContributions" className="font-semibold text-text text-xs mb-1">Political contributions (Line 40900)</label>
                            <p className="text-xs text-text-light m-0 leading-snug mb-1">Contributions to registered federal political parties.</p>
                            <input
                              type="text"
                              id="politicalContributions"
                              className="px-3 py-2 border border-[#d0d0d0] rounded-lg font-sans text-sm transition-all bg-white text-text w-full hover:border-[#999] focus:outline-2 focus:outline-primary focus:outline-offset-2 focus:border-primary placeholder:text-[#999]"
                              placeholder="$0.00"
                              value={getInputValue('politicalContributions', inputs.politicalContributions || 0)}
                              onChange={(e) => handleInputChange('politicalContributions', e.target.value)}
                              onFocus={() => handleInputFocus('politicalContributions', inputs.politicalContributions || 0)}
                              onBlur={(e) => handleInputBlur('politicalContributions', e.target.value)}
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label htmlFor="medicalExpenses" className="font-semibold text-text text-xs mb-1">Medical expenses (Line 21500)</label>
                            <p className="text-xs text-text-light m-0 leading-snug mb-1">Eligible medical expenses for refundable supplement calculation.</p>
                            <input
                              type="text"
                              id="medicalExpenses"
                              className="px-3 py-2 border border-[#d0d0d0] rounded-lg font-sans text-sm transition-all bg-white text-text w-full hover:border-[#999] focus:outline-2 focus:outline-primary focus:outline-offset-2 focus:border-primary placeholder:text-[#999]"
                              placeholder="$0.00"
                              value={getInputValue('medicalExpenses', inputs.medicalExpenses || 0)}
                              onChange={(e) => handleInputChange('medicalExpenses', e.target.value)}
                              onFocus={() => handleInputFocus('medicalExpenses', inputs.medicalExpenses || 0)}
                              onBlur={(e) => handleInputBlur('medicalExpenses', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mb-md">
                        <h3 className="text-sm font-semibold text-primary mb-xs bg-[#e8f5e9] px-2 py-1 rounded text-xs">Taxes Paid</h3>
                        <div className="flex flex-col gap-1">
                          <label htmlFor="incomeTaxesPaid" className="font-semibold text-text text-xs mb-1">Income taxes paid (Line 43700)</label>
                          <p className="text-xs text-text-light m-0 leading-snug mb-1">Taxes deducted from paycheque. Don't include CPP/EI contributions.</p>
                            <input
                              type="text"
                              id="incomeTaxesPaid"
                              className="px-3 py-2 border border-[#d0d0d0] rounded-lg font-sans text-sm transition-all bg-white text-text w-full hover:border-[#999] focus:outline-2 focus:outline-primary focus:outline-offset-2 focus:border-primary placeholder:text-[#999]"
                              placeholder="$0.00"
                              value={getInputValue('incomeTaxesPaid', inputs.incomeTaxesPaid)}
                              onChange={(e) => handleInputChange('incomeTaxesPaid', e.target.value)}
                              onFocus={() => handleInputFocus('incomeTaxesPaid', inputs.incomeTaxesPaid)}
                              onBlur={(e) => handleInputBlur('incomeTaxesPaid', e.target.value)}
                            />
                        </div>
                      </div>

                      <button type="submit" className="btn btn--primary w-full mt-md py-3 text-base font-semibold">
                        Calculate
                      </button>
                    </div>
                  </form>
                </div>

                <div className="bg-[#f8f8f8] p-lg rounded-xl lg:sticky lg:top-[calc(1.5rem+60px)]">
                  <h2 className="text-2xl font-bold text-primary mb-md lg:mb-lg">Your Results</h2>
                  
                  {hasCalculated && results && results.detailedBreakdown ? (
                    <div className="bg-white p-md rounded-lg max-h-[calc(100vh-200px)] overflow-y-auto">
                      {/* Taxpayer Information Section */}
                      <div className="mb-md pb-md border-b-2 border-primary">
                        <h3 className="text-sm font-semibold text-primary mb-xs bg-[#e8f5e9] px-2 py-1 rounded text-xs">Taxpayer Information</h3>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                            <span className="text-text">Date of birth</span>
                            <span className="font-semibold text-text">{inputs.dateOfBirth || 'Not provided'}</span>
                          </div>
                          <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                            <span className="text-text">Province of residence</span>
                            <span className="font-semibold text-text">{provinces.find(p => p.code === inputs.province)?.name || inputs.province}</span>
                          </div>
                          <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                            <span className="text-text">Marital status</span>
                            <span className="font-semibold text-text">{inputs.maritalStatus.charAt(0).toUpperCase() + inputs.maritalStatus.slice(1).replace('-', ' ')}</span>
                          </div>
                          <div className="flex justify-between items-center py-0.5">
                            <span className="text-text">Dependents (18 or under)</span>
                            <span className="font-semibold text-text">{inputs.numberOfDependents}</span>
                          </div>
                        </div>
                      </div>

                      {/* Total Income Section */}
                      <div className="mb-md">
                        <h3 className="text-sm font-semibold text-primary mb-xs bg-[#e8f5e9] px-2 py-1 rounded text-xs">Total income</h3>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                            <span className="text-text">Employment (10100)</span>
                            <span className="font-semibold text-text">{formatCurrency(results.detailedBreakdown.totalIncome.employmentIncome)}</span>
                          </div>
                          <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                            <span className="text-text">Interest/Investment (12100)</span>
                            <span className="font-semibold text-text">{formatCurrency(results.detailedBreakdown.totalIncome.interestAndInvestmentIncome)}</span>
                          </div>
                          <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                            <span className="text-text">Business (13500)</span>
                            <span className="font-semibold text-text">{formatCurrency(results.detailedBreakdown.totalIncome.netBusinessIncome)}</span>
                          </div>
                          <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                            <span className="text-text">Capital gains</span>
                            <span className="font-semibold text-text">{formatCurrency(results.detailedBreakdown.totalIncome.capitalGains)}</span>
                          </div>
                          <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                            <span className="text-text">Eligible dividends</span>
                            <span className="font-semibold text-text">{formatCurrency(results.detailedBreakdown.totalIncome.eligibleDividends)}</span>
                          </div>
                          <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                            <span className="text-text">Ineligible dividends</span>
                            <span className="font-semibold text-text">{formatCurrency(results.detailedBreakdown.totalIncome.ineligibleDividends)}</span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-t border-primary mt-1">
                            <span className="text-text font-semibold">Total Income (15000)</span>
                            <span className="font-bold text-primary">{formatCurrency(results.detailedBreakdown.totalIncome.total)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Net Income Section */}
                      <div className="mb-md">
                        <h3 className="text-sm font-semibold text-primary mb-xs bg-[#e8f5e9] px-2 py-1 rounded text-xs">Net income</h3>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                            <span className="text-text">RRSP deduction (20800)</span>
                            <span className="font-semibold text-text">{formatCurrency(results.detailedBreakdown.netIncome.rrspDeduction)}</span>
                          </div>
                          <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                            <span className="text-text">FHSA deduction (20805)</span>
                            <span className="font-semibold text-text">{formatCurrency(results.detailedBreakdown.netIncome.fhsaDeduction)}</span>
                          </div>
                          {results.detailedBreakdown.netIncome.carryingChargesDeduction > 0 && (
                            <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                              <span className="text-text">Carrying charges (22100)</span>
                              <span className="font-semibold text-text">{formatCurrency(results.detailedBreakdown.netIncome.carryingChargesDeduction)}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                            <span className="text-text">Total deductions (23300)</span>
                            <span className="font-semibold text-text">{formatCurrency(results.detailedBreakdown.netIncome.totalDeductions)}</span>
                          </div>
                          <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                            <span className="text-text">Net income before adjustments (23400)</span>
                            <span className="font-semibold text-text">{formatCurrency(results.detailedBreakdown.netIncome.netIncomeBeforeAdjustments)}</span>
                          </div>
                          {results.detailedBreakdown.netIncome.socialBenefitsRepayment > 0 && (
                            <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                              <span className="text-text">Social benefits repayment (23500)</span>
                              <span className="font-semibold text-text">{formatCurrency(results.detailedBreakdown.netIncome.socialBenefitsRepayment)}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center py-1 border-t border-primary mt-1">
                            <span className="text-text font-semibold">Net Income (23600)</span>
                            <span className="font-bold text-primary">{formatCurrency(results.detailedBreakdown.netIncome.netIncome)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Taxable Income */}
                      <div className="mb-md">
                        <h3 className="text-sm font-semibold text-primary mb-xs bg-[#e8f5e9] px-2 py-1 rounded text-xs">Taxable income</h3>
                        <div className="flex justify-between items-center py-1 border-b border-primary">
                          <span className="text-text font-semibold text-xs">Taxable Income (26000)</span>
                          <span className="font-bold text-primary">{formatCurrency(results.detailedBreakdown.taxableIncome)}</span>
                        </div>
                      </div>

                      {/* Federal Credits */}
                      <div className="mb-md">
                        <h3 className="text-sm font-semibold text-primary mb-xs bg-[#e8f5e9] px-2 py-1 rounded text-xs">Federal credits</h3>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                            <span className="text-text">Basic personal (30000)</span>
                            <span className="font-semibold text-text">{formatCurrency(results.detailedBreakdown.federalCredits.basicPersonalAmount)}</span>
                          </div>
                          <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                            <span className="text-text">CPP contributions (30800)</span>
                            <span className="font-semibold text-text">{formatCurrency(results.detailedBreakdown.federalCredits.cppContributions)}</span>
                          </div>
                          <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                            <span className="text-text">Canada employment (31260)</span>
                            <span className="font-semibold text-text">{formatCurrency(results.detailedBreakdown.federalCredits.canadaEmploymentAmount)}</span>
                          </div>
                          {results.detailedBreakdown.federalCredits.donationsCredit > 0 && (
                            <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                              <span className="text-text">Donations (34900)</span>
                              <span className="font-semibold text-text">{formatCurrency(results.detailedBreakdown.federalCredits.donationsCredit)}</span>
                            </div>
                          )}
                          {results.detailedBreakdown.federalCredits.dividendTaxCredit > 0 && (
                            <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                              <span className="text-text">Dividend tax credit (40425)</span>
                              <span className="font-semibold text-text">{formatCurrency(results.detailedBreakdown.federalCredits.dividendTaxCredit)}</span>
                            </div>
                          )}
                          {results.detailedBreakdown.federalCredits.politicalContributionCredit > 0 && (
                            <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                              <span className="text-text">Political contribution credit (41000)</span>
                              <span className="font-semibold text-text">{formatCurrency(results.detailedBreakdown.federalCredits.politicalContributionCredit)}</span>
                            </div>
                          )}
                          {results.detailedBreakdown.federalCredits.medicalExpenseSupplement > 0 && (
                            <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                              <span className="text-text">Medical expense supplement (45200)</span>
                              <span className="font-semibold text-text">{formatCurrency(results.detailedBreakdown.federalCredits.medicalExpenseSupplement)}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center py-1 border-t border-primary mt-1">
                            <span className="text-text font-semibold">Total credits (35000)</span>
                            <span className="font-bold text-primary">{formatCurrency(results.detailedBreakdown.federalCredits.totalFederalCredits)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Federal Tax */}
                      <div className="mb-md">
                        <h3 className="text-sm font-semibold text-primary mb-xs bg-[#e8f5e9] px-2 py-1 rounded text-xs">Net federal tax</h3>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                            <span className="text-text">Tax on taxable income (Line C)</span>
                            <span className="font-semibold text-text">{formatCurrency(results.detailedBreakdown.federalTax.taxOnTaxableIncome)}</span>
                          </div>
                          <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                            <span className="text-text">Add lines (C) and 40424 (40400)</span>
                            <span className="font-semibold text-text">{formatCurrency(results.detailedBreakdown.federalTax.taxOnTaxableIncome)}</span>
                          </div>
                          <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                            <span className="text-text">Enter amount from line 35000 (35000)</span>
                            <span className="font-semibold text-text">{formatCurrency(results.detailedBreakdown.federalCredits.totalFederalCredits)}</span>
                          </div>
                          <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                            <span className="text-text">Add lines 35000 to 40427 (35000)</span>
                            <span className="font-semibold text-text">{formatCurrency(results.detailedBreakdown.federalCredits.totalFederalCredits)}</span>
                          </div>
                          <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                            <span className="text-text font-semibold">Basic federal tax (42900)</span>
                            <span className="font-semibold text-text">{formatCurrency(results.detailedBreakdown.federalTax.basicFederalTax)}</span>
                          </div>
                          <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                            <span className="text-text">Federal foreign tax credit (40500)</span>
                            <span className="font-semibold text-text">{formatCurrency(results.detailedBreakdown.federalTax.federalForeignTaxCredit)}</span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-t border-primary mt-1">
                            <span className="text-text font-semibold">Federal tax (40600)</span>
                            <span className="font-bold text-primary">{formatCurrency(results.detailedBreakdown.federalTax.netFederalTax)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Provincial Tax */}
                      <div className="mb-md">
                        <h3 className="text-sm font-semibold text-primary mb-xs bg-[#e8f5e9] px-2 py-1 rounded text-xs">Provincial tax</h3>
                        <div className="flex justify-between items-center py-1 border-b border-primary">
                          <span className="text-text font-semibold text-xs">Provincial tax (42800)</span>
                          <span className="font-bold text-primary">{formatCurrency(results.detailedBreakdown.provincialTax.net)}</span>
                        </div>
                      </div>

                      {/* Refund or Balance Owing */}
                      <div className="mb-md">
                        <h3 className="text-sm font-semibold text-primary mb-xs bg-[#e8f5e9] px-2 py-1 rounded text-xs">Refund or Balance owing</h3>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                            <span className="text-text">Net federal tax (42000)</span>
                            <span className="font-semibold text-text">{formatCurrency(results.detailedBreakdown.refundOrOwing.netFederalTax)}</span>
                          </div>
                          <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                            <span className="text-text">CPP payable (42100)</span>
                            <span className="font-semibold text-text">{formatCurrency(results.detailedBreakdown.refundOrOwing.cppContributionsPayable)}</span>
                          </div>
                          <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                            <span className="text-text">Provincial tax (42800)</span>
                            <span className="font-semibold text-text">{formatCurrency(results.detailedBreakdown.refundOrOwing.provincialTax)}</span>
                          </div>
                          <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                            <span className="text-text font-semibold">Total payable (43500)</span>
                            <span className="font-bold text-primary">{formatCurrency(results.detailedBreakdown.refundOrOwing.totalPayable)}</span>
                          </div>
                          <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                            <span className="text-text">Tax deducted (43700)</span>
                            <span className="font-semibold text-text">{formatCurrency(results.detailedBreakdown.refundOrOwing.totalIncomeTaxDeducted)}</span>
                          </div>
                          <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                            <span className="text-text">Total credits (48200)</span>
                            <span className="font-semibold text-text">{formatCurrency(results.detailedBreakdown.refundOrOwing.totalCredits)}</span>
                          </div>
                          <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                            <span className="text-text">Refund (48400)</span>
                            <span className={`font-semibold ${results.detailedBreakdown.refundOrOwing.refund > 0 ? 'text-green-600' : 'text-text'}`}>
                              {formatCurrency(results.detailedBreakdown.refundOrOwing.refund)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-t-2 border-primary mt-1">
                            <span className="text-text font-semibold">Balance owing (48500)</span>
                            <span className={`font-bold text-base ${results.detailedBreakdown.refundOrOwing.balanceOwing > 0 ? 'text-red-600' : 'text-primary'}`}>
                              {formatCurrency(results.detailedBreakdown.refundOrOwing.balanceOwing)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Additional Information */}
                      <div>
                        <h3 className="text-sm font-semibold text-primary mb-xs bg-[#e8f5e9] px-2 py-1 rounded text-xs">Additional information</h3>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                            <span className="text-text">Marginal tax rate</span>
                            <span className="font-semibold text-text">{results.detailedBreakdown.additionalInfo.marginalTaxRate.toFixed(2)}%</span>
                          </div>
                          <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                            <span className="text-text">Average tax rate</span>
                            <span className="font-semibold text-text">{results.detailedBreakdown.additionalInfo.averageTaxRate.toFixed(2)}%</span>
                          </div>
                          {results.detailedBreakdown.additionalInfo.totalRRSPDeductionLimit > 0 && (
                            <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                              <span className="text-text">RRSP limit 2025</span>
                              <span className="font-semibold text-text">{formatCurrency(results.detailedBreakdown.additionalInfo.totalRRSPDeductionLimit)}</span>
                            </div>
                          )}
                          {results.detailedBreakdown.additionalInfo.unusedRRSPContributions > 0 && (
                            <div className="flex justify-between items-center py-0.5">
                              <span className="text-text">Unused RRSP</span>
                              <span className="font-semibold text-text">{formatCurrency(results.detailedBreakdown.additionalInfo.unusedRRSPContributions)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : hasCalculated && results ? (
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

              {/* Detailed breakdown now shown in right column above */}

              {/* Federal Tax Worksheet */}
              {hasCalculated && results && results.detailedBreakdown && (
                <div className="max-w-[1200px] mx-auto mt-xxl pt-xxl border-t border-border">
                  <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-md text-center">
                    Federal Tax Worksheet (T1-2024)
                  </h2>
                  <p className="text-center text-text-light mb-xl">
                    Use this worksheet to calculate the amounts to enter on your return.
                  </p>
                  
                  <div className="bg-white p-lg rounded-xl shadow-sm mb-xl">
                    <h3 className="text-2xl font-semibold text-primary mb-md">Lines 12000 and 12010 – Taxable amount of dividends</h3>
                    <div className="space-y-md">
                      <div className="bg-[#f8f8f8] p-md rounded-lg">
                        <h4 className="text-sm font-semibold text-primary mb-xs">Taxable amount of dividends (other than eligible)</h4>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                            <span className="text-text">Actual amount of ineligible dividends received</span>
                            <span className="font-semibold text-text">{formatCurrency(inputs.ineligibleDividends)}</span>
                          </div>
                          <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                            <span className="text-text">Applicable rate</span>
                            <span className="font-semibold text-text">× 115%</span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-t border-primary mt-1">
                            <span className="text-text font-semibold">Line 12010</span>
                            <span className="font-bold text-primary">{formatCurrency(inputs.ineligibleDividends * 1.15)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-[#f8f8f8] p-md rounded-lg">
                        <h4 className="text-sm font-semibold text-primary mb-xs">Taxable amount of dividends (eligible and other than eligible)</h4>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                            <span className="text-text">Actual amount of eligible dividends received</span>
                            <span className="font-semibold text-text">{formatCurrency(inputs.eligibleDividends)}</span>
                          </div>
                          <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                            <span className="text-text">Applicable rate</span>
                            <span className="font-semibold text-text">× 138%</span>
                          </div>
                          <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                            <span className="text-text">Eligible dividends grossed up</span>
                            <span className="font-semibold text-text">{formatCurrency(inputs.eligibleDividends * 1.38)}</span>
                          </div>
                          <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                            <span className="text-text">Line 12010 (from above)</span>
                            <span className="font-semibold text-text">{formatCurrency(inputs.ineligibleDividends * 1.15)}</span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-t border-primary mt-1">
                            <span className="text-text font-semibold">Line 12000</span>
                            <span className="font-bold text-primary">{formatCurrency((inputs.eligibleDividends * 1.38) + (inputs.ineligibleDividends * 1.15))}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-lg rounded-xl shadow-sm mb-xl">
                    <h3 className="text-2xl font-semibold text-primary mb-md">Line 22100 – Carrying charges, interest expenses, and other expenses</h3>
                    <div className="bg-[#f8f8f8] p-md rounded-lg">
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                          <span className="text-text">Total carrying charges</span>
                          <span className="font-semibold text-text">{formatCurrency(inputs.carryingCharges || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                          <span className="text-text">Total interest expenses</span>
                          <span className="font-semibold text-text">{formatCurrency(inputs.interestExpenses || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                          <span className="text-text">Total other expenses</span>
                          <span className="font-semibold text-text">{formatCurrency(inputs.otherExpenses || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-t border-primary mt-1">
                          <span className="text-text font-semibold">Line 22100</span>
                          <span className="font-bold text-primary">{formatCurrency((inputs.carryingCharges || 0) + (inputs.interestExpenses || 0) + (inputs.otherExpenses || 0))}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-lg rounded-xl shadow-sm mb-xl">
                    <h3 className="text-2xl font-semibold text-primary mb-md">Line 40425 – Federal dividend tax credit</h3>
                    <div className="bg-[#f8f8f8] p-md rounded-lg">
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                          <span className="text-text">Amount from line 12010</span>
                          <span className="font-semibold text-text">{formatCurrency(inputs.ineligibleDividends)}</span>
                        </div>
                        <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                          <span className="text-text">× 9.0301%</span>
                          <span className="font-semibold text-text">{formatCurrency(inputs.ineligibleDividends * 0.090301)}</span>
                        </div>
                        <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                          <span className="text-text">Amount from line 12000 minus line 12010</span>
                          <span className="font-semibold text-text">{formatCurrency(inputs.eligibleDividends)}</span>
                        </div>
                        <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                          <span className="text-text">× 15.0198%</span>
                          <span className="font-semibold text-text">{formatCurrency(inputs.eligibleDividends * 0.150198)}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-t border-primary mt-1">
                          <span className="text-text font-semibold">Line 40425</span>
                          <span className="font-bold text-primary">{formatCurrency((inputs.ineligibleDividends * 0.090301) + (inputs.eligibleDividends * 0.150198))}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {(inputs.politicalContributions || 0) > 0 && (
                    <div className="bg-white p-lg rounded-xl shadow-sm mb-xl">
                      <h3 className="text-2xl font-semibold text-primary mb-md">Line 41000 – Federal political contribution tax credit</h3>
                      <div className="bg-[#f8f8f8] p-md rounded-lg">
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                            <span className="text-text">Total federal political contributions from line 40900</span>
                            <span className="font-semibold text-text">{formatCurrency(inputs.politicalContributions || 0)}</span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-t border-primary mt-1">
                            <span className="text-text font-semibold">Line 41000</span>
                            <span className="font-bold text-primary">{formatCurrency(results.detailedBreakdown.federalCredits.politicalContributionCredit)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {(inputs.oasPension || 0) > 0 && results.detailedBreakdown.netIncome.socialBenefitsRepayment > 0 && (
                    <div className="bg-white p-lg rounded-xl shadow-sm mb-xl">
                      <h3 className="text-2xl font-semibold text-primary mb-md">Line 23500 – Social benefits repayment</h3>
                      <div className="bg-[#f8f8f8] p-md rounded-lg">
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                            <span className="text-text">OAS pension from line 11300</span>
                            <span className="font-semibold text-text">{formatCurrency(inputs.oasPension || 0)}</span>
                          </div>
                          <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                            <span className="text-text">Net federal supplements from line 14600</span>
                            <span className="font-semibold text-text">{formatCurrency(inputs.netFederalSupplements || 0)}</span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-t border-primary mt-1">
                            <span className="text-text font-semibold">Line 23500</span>
                            <span className="font-bold text-primary">{formatCurrency(results.detailedBreakdown.netIncome.socialBenefitsRepayment)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {(inputs.medicalExpenses || 0) > 0 && results.detailedBreakdown.federalCredits.medicalExpenseSupplement > 0 && (
                    <div className="bg-white p-lg rounded-xl shadow-sm mb-xl">
                      <h3 className="text-2xl font-semibold text-primary mb-md">Line 45200 – Refundable medical expense supplement</h3>
                      <div className="bg-[#f8f8f8] p-md rounded-lg">
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between items-center py-0.5 border-b border-[#e5e5e5]">
                            <span className="text-text">Amount from line 21500</span>
                            <span className="font-semibold text-text">{formatCurrency(inputs.medicalExpenses || 0)}</span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-t border-primary mt-1">
                            <span className="text-text font-semibold">Line 45200</span>
                            <span className="font-bold text-primary">{formatCurrency(results.detailedBreakdown.federalCredits.medicalExpenseSupplement)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {hasCalculated && results && results.detailedBreakdown && (
                <div className="max-w-[1200px] mx-auto mt-xxl pt-xxl border-t border-border">
                  <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-md text-center">
                    Marginal Tax Calculation Tables
                  </h2>
                  
                  {/* Federal Tax Calculation Table */}
                  <div className="bg-white p-lg rounded-xl shadow-sm mb-xl">
                    <h3 className="text-2xl font-semibold text-primary mb-md">Part A - Federal tax on taxable income</h3>
                    <p className="text-sm text-text-light mb-md">Use the amount from line 26000 to complete the appropriate column below.</p>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-xs" style={{ tableLayout: 'fixed' }}>
                        <colgroup>
                          <col style={{ width: '35%' }} />
                          <col style={{ width: '13%' }} />
                          <col style={{ width: '13%' }} />
                          <col style={{ width: '13%' }} />
                          <col style={{ width: '13%' }} />
                          <col style={{ width: '13%' }} />
                          <col style={{ width: '3%' }} />
                        </colgroup>
                        <thead>
                          <tr className="bg-[#e8f5e9]">
                            <th className="px-2 py-2 text-left font-semibold text-text border border-[#d0d0d0]"></th>
                            {federalData2025.brackets.map((bracket, index) => {
                              const prevBracket = index > 0 ? federalData2025.brackets[index - 1] : null
                              // For display, use the previous bracket's upTo value (not +1) to match tax form format
                              const rangeStartDisplay = prevBracket && prevBracket.upTo ? prevBracket.upTo : 0
                              const rangeEnd = bracket.upTo
                              const taxableIncome = results.detailedBreakdown?.taxableIncome || 0
                              const isActive = taxableIncome > (prevBracket?.upTo || 0) && 
                                             (bracket.upTo === null || taxableIncome <= bracket.upTo)
                              
                              return (
                                <th 
                                  key={index} 
                                  className={`px-2 py-2 text-left font-semibold text-text border border-[#d0d0d0] ${
                                    isActive ? 'bg-[#fff9c4]' : ''
                                  }`}
                                >
                                  {index === 0 ? (
                                    <>
                                      <div>Line 26000 is</div>
                                      <div className="font-normal">${(rangeEnd || 0).toLocaleString('en-CA')} or less</div>
                                    </>
                                  ) : bracket.upTo === null ? (
                                    <>
                                      <div>Line 26000 is more</div>
                                      <div className="font-normal">than ${rangeStartDisplay.toLocaleString('en-CA')}</div>
                                    </>
                                  ) : (
                                    <>
                                      <div>Line 26000 is more than</div>
                                      <div className="font-normal">${rangeStartDisplay.toLocaleString('en-CA')} but not more than ${(rangeEnd || 0).toLocaleString('en-CA')}</div>
                                    </>
                                  )}
                                </th>
                              )
                            })}
                            <th className="px-2 py-2 text-right font-semibold text-text border border-[#d0d0d0]"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Line 75: Amount from line 26000 */}
                          <tr>
                            <td className="px-2 py-2 text-text border border-[#d0d0d0] font-semibold">
                              <div className="text-xs text-text-light font-normal">Amount from line 26000</div>
                            </td>
                            {federalData2025.brackets.map((bracket, index) => {
                              const prevBracket = index > 0 ? federalData2025.brackets[index - 1] : null
                              const taxableIncome = results.detailedBreakdown?.taxableIncome || 0
                              const isActive = taxableIncome > (prevBracket?.upTo || 0) && 
                                             (bracket.upTo === null || taxableIncome <= bracket.upTo)
                              return (
                                <td 
                                  key={index} 
                                  className={`px-2 py-2 text-right border border-[#d0d0d0] ${
                                    isActive ? 'bg-[#fff9c4] font-semibold' : ''
                                  }`}
                                >
                                  {isActive ? formatCurrency(taxableIncome) : ''}
                                </td>
                              )
                            })}
                            <td className="px-2 py-2 text-right border border-[#d0d0d0] font-semibold">75</td>
                          </tr>
                          
                          {/* Line 76: Threshold */}
                          <tr>
                            <td className="px-2 py-2 text-text border border-[#d0d0d0] font-semibold">
                              <div className="text-xs text-text-light font-normal">Line 75 minus line 76 (cannot be negative)</div>
                            </td>
                            {federalData2025.brackets.map((bracket, index) => {
                              const prevBracket = index > 0 ? federalData2025.brackets[index - 1] : null
                              const threshold = prevBracket?.upTo || 0
                              const taxableIncome = results.detailedBreakdown?.taxableIncome || 0
                              const isActive = taxableIncome > (prevBracket?.upTo || 0) && 
                                             (bracket.upTo === null || taxableIncome <= bracket.upTo)
                              return (
                                <td 
                                  key={index} 
                                  className={`px-2 py-2 text-right border border-[#d0d0d0] ${
                                    isActive ? 'bg-[#fff9c4]' : ''
                                  }`}
                                >
                                  {formatCurrency(threshold)}
                                </td>
                              )
                            })}
                            <td className="px-2 py-2 text-right border border-[#d0d0d0] font-semibold">76</td>
                          </tr>
                          
                          {/* Line 77: Line 75 minus line 76 */}
                          <tr>
                            <td className="px-2 py-2 text-text border border-[#d0d0d0] font-semibold">
                            </td>
                            {federalData2025.brackets.map((bracket, index) => {
                              const prevBracket = index > 0 ? federalData2025.brackets[index - 1] : null
                              const threshold = prevBracket?.upTo || 0
                              const taxableIncome = results.detailedBreakdown?.taxableIncome || 0
                              const isActive = taxableIncome > (prevBracket?.upTo || 0) && 
                                             (bracket.upTo === null || taxableIncome <= bracket.upTo)
                              const line77Value = isActive ? Math.max(0, taxableIncome - threshold) : 0
                              return (
                                <td 
                                  key={index} 
                                  className={`px-2 py-2 text-right border border-[#d0d0d0] ${
                                    isActive ? 'bg-[#fff9c4] font-semibold' : ''
                                  }`}
                                >
                                  {isActive ? formatCurrency(line77Value) : ''}
                                </td>
                              )
                            })}
                            <td className="px-2 py-2 text-right border border-[#d0d0d0] font-semibold">77</td>
                          </tr>
                          
                          {/* Line 78: Percentage rate */}
                          <tr>
                            <td className="px-2 py-2 text-text border border-[#d0d0d0] font-semibold">
                              <div className="text-xs text-text-light font-normal">Line 77 multiplied by the percentage from line 78</div>
                            </td>
                            {federalData2025.brackets.map((bracket, index) => {
                              const prevBracket = index > 0 ? federalData2025.brackets[index - 1] : null
                              const taxableIncome = results.detailedBreakdown?.taxableIncome || 0
                              const isActive = taxableIncome > (prevBracket?.upTo || 0) && 
                                             (bracket.upTo === null || taxableIncome <= bracket.upTo)
                              return (
                                <td 
                                  key={index} 
                                  className={`px-2 py-2 text-right border border-[#d0d0d0] ${
                                    isActive ? 'bg-[#fff9c4]' : ''
                                  }`}
                                >
                                  x {(bracket.rate * 100).toFixed(1)}%
                                </td>
                              )
                            })}
                            <td className="px-2 py-2 text-right border border-[#d0d0d0] font-semibold">78</td>
                          </tr>
                          
                          {/* Line 79: Line 77 multiplied by percentage */}
                          <tr>
                            <td className="px-2 py-2 text-text border border-[#d0d0d0] font-semibold">
                            </td>
                            {federalData2025.brackets.map((bracket, index) => {
                              const prevBracket = index > 0 ? federalData2025.brackets[index - 1] : null
                              const threshold = prevBracket?.upTo || 0
                              const taxableIncome = results.detailedBreakdown?.taxableIncome || 0
                              const isActive = taxableIncome > (prevBracket?.upTo || 0) && 
                                             (bracket.upTo === null || taxableIncome <= bracket.upTo)
                              const line77Value = isActive ? Math.max(0, taxableIncome - threshold) : 0
                              const line79Value = isActive ? line77Value * bracket.rate : 0
                              return (
                                <td 
                                  key={index} 
                                  className={`px-2 py-2 text-right border border-[#d0d0d0] ${
                                    isActive ? 'bg-[#fff9c4] font-semibold' : ''
                                  }`}
                                >
                                  {isActive ? formatCurrency(line79Value) : ''}
                                </td>
                              )
                            })}
                            <td className="px-2 py-2 text-right border border-[#d0d0d0] font-semibold">79</td>
                          </tr>
                          
                          {/* Line 80: Base tax amount */}
                          <tr>
                            <td className="px-2 py-2 text-text border border-[#d0d0d0] font-semibold">
                              <div className="text-xs text-text-light font-normal">Line 79 plus line 80</div>
                            </td>
                            {federalData2025.brackets.map((bracket, index) => {
                              const prevBracket = index > 0 ? federalData2025.brackets[index - 1] : null
                              const taxableIncome = results.detailedBreakdown?.taxableIncome || 0
                              const isActive = taxableIncome > (prevBracket?.upTo || 0) && 
                                             (bracket.upTo === null || taxableIncome <= bracket.upTo)
                              // Calculate cumulative tax from previous brackets (each bracket filled completely)
                              let baseTax = 0
                              for (let i = 0; i < index; i++) {
                                const prevB = i > 0 ? federalData2025.brackets[i - 1] : null
                                const prevThreshold = prevB?.upTo || 0
                                const currentBracket = federalData2025.brackets[i]
                                if (currentBracket.upTo !== null) {
                                  const bracketSize = currentBracket.upTo - prevThreshold
                                  baseTax += bracketSize * currentBracket.rate
                                }
                              }
                              return (
                                <td 
                                  key={index} 
                                  className={`px-2 py-2 text-right border border-[#d0d0d0] ${
                                    isActive ? 'bg-[#fff9c4]' : ''
                                  }`}
                                >
                                  {formatCurrency(Math.round(baseTax * 100) / 100)}
                                </td>
                              )
                            })}
                            <td className="px-2 py-2 text-right border border-[#d0d0d0] font-semibold">80</td>
                          </tr>
                          
                          {/* Line 81: Federal tax on taxable income */}
                          <tr className="bg-[#e8f5e9]">
                            <td className="px-2 py-2 text-text border border-[#d0d0d0] font-bold">
                              <div className="text-xs text-text-light font-bold">Line 79 plus line 80</div>
                              <div className="text-xs text-text-light font-normal mt-0.5">Federal tax on taxable income</div>
                            </td>
                            {federalData2025.brackets.map((bracket, index) => {
                              const prevBracket = index > 0 ? federalData2025.brackets[index - 1] : null
                              const threshold = prevBracket?.upTo || 0
                              const taxableIncome = results.detailedBreakdown?.taxableIncome || 0
                              const isActive = taxableIncome > (prevBracket?.upTo || 0) && 
                                             (bracket.upTo === null || taxableIncome <= bracket.upTo)
                              const line77Value = isActive ? Math.max(0, taxableIncome - threshold) : 0
                              const line79Value = isActive ? line77Value * bracket.rate : 0
                              // Calculate base tax (cumulative tax from all previous brackets filled completely)
                              let baseTax = 0
                              for (let i = 0; i < index; i++) {
                                const prevB = i > 0 ? federalData2025.brackets[i - 1] : null
                                const prevThreshold = prevB?.upTo || 0
                                const currentBracket = federalData2025.brackets[i]
                                if (currentBracket.upTo !== null) {
                                  const bracketSize = currentBracket.upTo - prevThreshold
                                  baseTax += bracketSize * currentBracket.rate
                                }
                              }
                              // Line 81 = Line 79 + Line 80 (show for ALL columns)
                              const line81Value = line79Value + baseTax
                              return (
                                <td 
                                  key={index} 
                                  className={`px-2 py-2 text-right border border-[#d0d0d0] font-bold ${
                                    isActive ? 'bg-[#fff9c4]' : ''
                                  }`}
                                >
                                  {formatCurrency(Math.round(line81Value * 100) / 100)}
                                </td>
                              )
                            })}
                            <td className="px-2 py-2 text-right border border-[#d0d0d0] font-bold">81</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-text-light mt-md italic">Enter the amount from line 81 on line 124 and continue at line 82.</p>
                  </div>

                  {/* Provincial Tax Calculation Table */}
                  {(() => {
                    const provincesData = provincesData2025 as any
                    const provincialData = provincesData[inputs.province]
                    if (!provincialData) return null
                    
                    return (
                      <div className="bg-white p-lg rounded-xl shadow-sm">
                        <h3 className="text-2xl font-semibold text-primary mb-md">Part A - {provinces.find(p => p.code === inputs.province)?.name || 'Provincial'} tax on taxable income</h3>
                        
                        {/* Line 1: Taxable income from line 26000 */}
                        <div className="flex justify-between items-center py-2 border-b border-[#d0d0d0] mb-md">
                          <span className="text-sm text-text-light">Enter your <strong>taxable income</strong> from line 26000 of your return.</span>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-text">{formatCurrency(results.detailedBreakdown?.taxableIncome || 0)}</span>
                            <span className="font-semibold text-text">1</span>
                          </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse text-xs" style={{ tableLayout: 'fixed' }}>
                            <colgroup>
                              <col style={{ width: '35%' }} />
                              <col style={{ width: '13%' }} />
                              <col style={{ width: '13%' }} />
                              <col style={{ width: '13%' }} />
                              <col style={{ width: '13%' }} />
                              <col style={{ width: '13%' }} />
                              <col style={{ width: '3%' }} />
                            </colgroup>
                            <thead>
                              <tr className="bg-[#e8f5e9]">
                                <th className="px-2 py-2 text-left font-semibold text-text border border-[#d0d0d0]"></th>
                                {provincialData.brackets.map((bracket: any, index: number) => {
                                  const prevBracket = index > 0 ? provincialData.brackets[index - 1] : null
                                  // For display, use the previous bracket's upTo value (not +1) to match tax form format
                                  const rangeStartDisplay = prevBracket && prevBracket.upTo ? prevBracket.upTo : 0
                                  const rangeEnd = bracket.upTo
                                  const taxableIncome = results.detailedBreakdown?.taxableIncome || 0
                                  const isActive = taxableIncome > (prevBracket?.upTo || 0) && 
                                                 (bracket.upTo === null || taxableIncome <= bracket.upTo)
                                  
                                  return (
                                    <th 
                                      key={index} 
                                      className={`px-2 py-2 text-left font-semibold text-text border border-[#d0d0d0] ${
                                        isActive ? 'bg-[#fff9c4]' : ''
                                      }`}
                                    >
                                      {index === 0 ? (
                                        <>
                                          <div>Line 1 is</div>
                                          <div className="font-normal">${(rangeEnd || 0).toLocaleString('en-CA')} or less</div>
                                        </>
                                      ) : bracket.upTo === null ? (
                                        <>
                                          <div>Line 1 is more</div>
                                          <div className="font-normal">than ${rangeStartDisplay.toLocaleString('en-CA')}</div>
                                        </>
                                      ) : (
                                        <>
                                          <div>Line 1 is more than</div>
                                          <div className="font-normal">${rangeStartDisplay.toLocaleString('en-CA')} but not more than ${(rangeEnd || 0).toLocaleString('en-CA')}</div>
                                        </>
                                      )}
                                    </th>
                                  )
                                })}
                                <th className="px-2 py-2 text-right font-semibold text-text border border-[#d0d0d0]"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {/* Line 2: Amount from line 1 */}
                              <tr>
                                <td className="px-2 py-2 text-text border border-[#d0d0d0] font-semibold">
                                  <div className="text-xs text-text-light font-normal">Amount from line 1</div>
                                </td>
                                {provincialData.brackets.map((bracket: any, index: number) => {
                                  const prevBracket = index > 0 ? provincialData.brackets[index - 1] : null
                                  const taxableIncome = results.detailedBreakdown?.taxableIncome || 0
                                  const isActive = taxableIncome > (prevBracket?.upTo || 0) && 
                                                 (bracket.upTo === null || taxableIncome <= bracket.upTo)
                                  return (
                                    <td 
                                      key={index} 
                                      className={`px-2 py-2 text-right border border-[#d0d0d0] ${
                                        isActive ? 'bg-[#fff9c4] font-semibold' : ''
                                      }`}
                                    >
                                      {isActive ? formatCurrency(taxableIncome) : ''}
                                    </td>
                                  )
                                })}
                                <td className="px-2 py-2 text-right border border-[#d0d0d0] font-semibold">2</td>
                              </tr>
                              
                              {/* Line 3: Threshold - fixed amounts to subtract, show for ALL columns */}
                              <tr>
                                <td className="px-2 py-2 text-text border border-[#d0d0d0] font-semibold">
                                  <div className="text-xs text-text-light font-normal">Line 2 minus line 3 (cannot be negative)</div>
                                </td>
                                {provincialData.brackets.map((bracket: any, index: number) => {
                                  const prevBracket = index > 0 ? provincialData.brackets[index - 1] : null
                                  const threshold = prevBracket?.upTo || 0
                                  const taxableIncome = results.detailedBreakdown?.taxableIncome || 0
                                  const isActive = taxableIncome > (prevBracket?.upTo || 0) && 
                                                 (bracket.upTo === null || taxableIncome <= bracket.upTo)
                                  return (
                                    <td 
                                      key={index} 
                                      className={`px-2 py-2 text-right border border-[#d0d0d0] ${
                                        isActive ? 'bg-[#fff9c4]' : ''
                                      }`}
                                    >
                                      {formatCurrency(threshold)}
                                    </td>
                                  )
                                })}
                                <td className="px-2 py-2 text-right border border-[#d0d0d0] font-semibold">3</td>
                              </tr>
                              
                              {/* Line 4: Line 2 minus line 3 */}
                              <tr>
                                <td className="px-2 py-2 text-text border border-[#d0d0d0] font-semibold">
                                </td>
                                {provincialData.brackets.map((bracket: any, index: number) => {
                                  const prevBracket = index > 0 ? provincialData.brackets[index - 1] : null
                                  const threshold = prevBracket?.upTo || 0
                                  const taxableIncome = results.detailedBreakdown?.taxableIncome || 0
                                  const isActive = taxableIncome > (prevBracket?.upTo || 0) && 
                                                 (bracket.upTo === null || taxableIncome <= bracket.upTo)
                                  const line4Value = isActive ? Math.max(0, taxableIncome - threshold) : 0
                                  return (
                                    <td 
                                      key={index} 
                                      className={`px-2 py-2 text-right border border-[#d0d0d0] ${
                                        isActive ? 'bg-[#fff9c4] font-semibold' : ''
                                      }`}
                                    >
                                      {isActive ? formatCurrency(line4Value) : ''}
                                    </td>
                                  )
                                })}
                                <td className="px-2 py-2 text-right border border-[#d0d0d0] font-semibold">4</td>
                              </tr>
                              
                              {/* Line 5: Percentage rate - show for ALL columns */}
                              <tr>
                                <td className="px-2 py-2 text-text border border-[#d0d0d0] font-semibold">
                                  <div className="text-xs text-text-light font-normal">Line 4 multiplied by the percentage from line 5</div>
                                </td>
                                {provincialData.brackets.map((bracket: any, index: number) => {
                                  const prevBracket = index > 0 ? provincialData.brackets[index - 1] : null
                                  const taxableIncome = results.detailedBreakdown?.taxableIncome || 0
                                  const isActive = taxableIncome > (prevBracket?.upTo || 0) && 
                                                 (bracket.upTo === null || taxableIncome <= bracket.upTo)
                                  return (
                                    <td 
                                      key={index} 
                                      className={`px-2 py-2 text-right border border-[#d0d0d0] ${
                                        isActive ? 'bg-[#fff9c4]' : ''
                                      }`}
                                    >
                                      x {(bracket.rate * 100).toFixed(2)}%
                                    </td>
                                  )
                                })}
                                <td className="px-2 py-2 text-right border border-[#d0d0d0] font-semibold">5</td>
                              </tr>
                              
                              {/* Line 6: Line 4 multiplied by percentage */}
                              <tr>
                                <td className="px-2 py-2 text-text border border-[#d0d0d0] font-semibold">
                                </td>
                                {provincialData.brackets.map((bracket: any, index: number) => {
                                  const prevBracket = index > 0 ? provincialData.brackets[index - 1] : null
                                  const threshold = prevBracket?.upTo || 0
                                  const taxableIncome = results.detailedBreakdown?.taxableIncome || 0
                                  const isActive = taxableIncome > (prevBracket?.upTo || 0) && 
                                                 (bracket.upTo === null || taxableIncome <= bracket.upTo)
                                  const line4Value = isActive ? Math.max(0, taxableIncome - threshold) : 0
                                  const line6Value = isActive ? line4Value * bracket.rate : 0
                                  return (
                                    <td 
                                      key={index} 
                                      className={`px-2 py-2 text-right border border-[#d0d0d0] ${
                                        isActive ? 'bg-[#fff9c4] font-semibold' : ''
                                      }`}
                                    >
                                      {isActive ? formatCurrency(line6Value) : ''}
                                    </td>
                                  )
                                })}
                                <td className="px-2 py-2 text-right border border-[#d0d0d0] font-semibold">6</td>
                              </tr>
                              
                              {/* Line 7: Base tax amount */}
                              <tr>
                                <td className="px-2 py-2 text-text border border-[#d0d0d0] font-semibold">
                                  <div className="text-xs text-text-light font-normal">Line 6 plus line 7</div>
                                </td>
                                {provincialData.brackets.map((bracket: any, index: number) => {
                                  const prevBracket = index > 0 ? provincialData.brackets[index - 1] : null
                                  const taxableIncome = results.detailedBreakdown?.taxableIncome || 0
                                  const isActive = taxableIncome > (prevBracket?.upTo || 0) && 
                                                 (bracket.upTo === null || taxableIncome <= bracket.upTo)
                                  // Use static base tax amounts if available, otherwise calculate
                                  let baseTax = 0
                                  if ((provincialData as any).baseTax && Array.isArray((provincialData as any).baseTax)) {
                                    baseTax = (provincialData as any).baseTax[index] || 0
                                  } else {
                                    // Calculate cumulative tax from previous brackets (each bracket filled completely)
                                    for (let i = 0; i < index; i++) {
                                      const prevB = i > 0 ? provincialData.brackets[i - 1] : null
                                      const prevThreshold = prevB?.upTo || 0
                                      const currentBracket = provincialData.brackets[i]
                                      if (currentBracket.upTo !== null) {
                                        const bracketSize = currentBracket.upTo - prevThreshold
                                        baseTax += bracketSize * currentBracket.rate
                                      }
                                    }
                                  }
                                  return (
                                    <td 
                                      key={index} 
                                      className={`px-2 py-2 text-right border border-[#d0d0d0] ${
                                        isActive ? 'bg-[#fff9c4]' : ''
                                      }`}
                                    >
                                      {formatCurrency(Math.round(baseTax * 100) / 100)}
                                    </td>
                                  )
                                })}
                                <td className="px-2 py-2 text-right border border-[#d0d0d0] font-semibold">7</td>
                              </tr>
                              
                              {/* Line 8: Provincial tax on taxable income (Line 6 + Line 7) */}
                              <tr className="bg-[#e8f5e9]">
                                <td className="px-2 py-2 text-text border border-[#d0d0d0] font-bold">
                                  <div className="text-xs text-text-light font-bold">Ontario tax on taxable income</div>
                                </td>
                                {provincialData.brackets.map((bracket: any, index: number) => {
                                  const prevBracket = index > 0 ? provincialData.brackets[index - 1] : null
                                  const threshold = prevBracket?.upTo || 0
                                  const taxableIncome = results.detailedBreakdown?.taxableIncome || 0
                                  const isActive = taxableIncome > (prevBracket?.upTo || 0) && 
                                                 (bracket.upTo === null || taxableIncome <= bracket.upTo)
                                  const line4Value = isActive ? Math.max(0, taxableIncome - threshold) : 0
                                  const line6Value = isActive ? line4Value * bracket.rate : 0
                                  // Use static base tax amounts if available (Line 7), otherwise calculate
                                  let baseTax = 0
                                  if ((provincialData as any).baseTax && Array.isArray((provincialData as any).baseTax)) {
                                    baseTax = (provincialData as any).baseTax[index] || 0
                                  } else {
                                    // Calculate cumulative tax from all previous brackets filled completely
                                    for (let i = 0; i < index; i++) {
                                      const prevB = i > 0 ? provincialData.brackets[i - 1] : null
                                      const prevThreshold = prevB?.upTo || 0
                                      const currentBracket = provincialData.brackets[i]
                                      if (currentBracket.upTo !== null) {
                                        const bracketSize = currentBracket.upTo - prevThreshold
                                        baseTax += bracketSize * currentBracket.rate
                                      }
                                    }
                                  }
                                  // Line 8 = Line 6 + Line 7 (show for ALL columns)
                                  const line8Value = line6Value + baseTax
                                  return (
                                    <td 
                                      key={index} 
                                      className={`px-2 py-2 text-right border border-[#d0d0d0] font-bold ${
                                        isActive ? 'bg-[#fff9c4]' : ''
                                      }`}
                                    >
                                      {formatCurrency(Math.round(line8Value * 100) / 100)}
                                    </td>
                                  )
                                })}
                                <td className="px-2 py-2 text-right border border-[#d0d0d0] font-bold">8</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <p className="text-xs text-text-light mt-md italic">Enter the amount from line 8 on line 51 and continue at line 9.</p>
                      </div>
                    )
                  })()}
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
