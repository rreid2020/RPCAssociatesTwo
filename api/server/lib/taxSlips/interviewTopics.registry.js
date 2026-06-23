export const INTERVIEW_TOPICS_VERSION = 3

/**
 * Tax situation interview topics — drives per-taxpayer workspace setup.
 * Each topic maps to slips (data entry) and/or forms & schedules (output).
 */
export const INTERVIEW_TOPIC_CATEGORIES = [
  {
    id: 'specific_situations',
    title: 'Specific situations',
    summary: 'Residency, deceased filers, representatives, and CRA Auto-fill.',
    icon: 'SS',
    topics: [
      {
        id: 'no_changes_prior_year',
        label: 'No changes to report since prior year',
        description: 'Situation is unchanged from the previous tax return.',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Setup'
      },
      {
        id: 'cra_autofill',
        label: 'CRA Auto-fill my return',
        description: 'Import slips and amounts from CRA My Account (when connected).',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Setup'
      },
      {
        id: 'immigrant_emigrant',
        label: 'Immigrant, emigrant, or non-resident taxpayer',
        description: 'Part-year residency, entry or departure dates, and world income.',
        slipCodes: [],
        formCodes: ['T2209', 'T1248'],
        linkedStep: 'Setup'
      },
      {
        id: 'bankrupt_taxpayer',
        label: 'Tax return for a bankrupt person',
        description: 'Bankruptcy date and pre- or post-bankruptcy income reporting.',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Setup'
      },
      {
        id: 'climate_action_incentive',
        label: 'Climate action incentive payment',
        description: 'CAIP eligibility and household fuel charge rebate.',
        slipCodes: [],
        formCodes: ['Schedule 14'],
        linkedStep: 'Review'
      },
      {
        id: 'deceased_taxpayer',
        label: 'Filing for a deceased person',
        description: 'Date of death and final return considerations.',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Setup'
      },
      {
        id: 'legal_representative',
        label: 'Legal representative or executor',
        description: 'Representative filing authority and related disclosures.',
        slipCodes: [],
        formCodes: ['T1013'],
        linkedStep: 'Setup'
      }
    ]
  },
  {
    id: 'other_income',
    title: 'Other income',
    summary: 'Labour adjustments, grants, death benefits, lump-sum payments, and line 13000 income.',
    icon: 'OI',
    topics: [
      {
        id: 'other_income_labour_adjustment',
        label: 'Labour adjustment benefits',
        description: 'Provincial or federal labour adjustment benefits not reported on a T-slip.',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Income'
      },
      {
        id: 'other_income_grants_training',
        label: 'Grants or training allowance',
        description: 'Taxable grants, training allowances, and similar support payments.',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Income'
      },
      {
        id: 'other_income_spouse_death_benefit',
        label: 'Death benefit received from employer upon death of your spouse',
        description: 'Employer-paid death benefits related to a deceased spouse.',
        slipCodes: ['T4A'],
        formCodes: [],
        linkedStep: 'Income'
      },
      {
        id: 'other_income_t1198',
        label: 'T1198 — Qualifying retroactive lump-sum payment',
        description: 'Retroactive employment or pension income taxed in the current year.',
        slipCodes: [],
        formCodes: ['T1198'],
        linkedStep: 'Income'
      },
      {
        id: 'other_income_line_13000',
        label: 'Other taxable income (federal line 13000)',
        description: 'Miscellaneous taxable income not reported elsewhere.',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Income'
      }
    ]
  },
  {
    id: 'other_t_slips',
    title: 'Information from other T-slips',
    summary: 'Additional federal slips not covered in employment or pension sections.',
    icon: 'TS',
    topics: [
      {
        id: 'other_t_slips_rc210',
        label: 'RC210 — Canada Workers Benefit advance payments statement (line 41500)',
        description: 'Advance Canada Workers Benefit payments received during the year.',
        slipCodes: ['RC210'],
        formCodes: [],
        linkedStep: 'Income'
      }
    ]
  },
  {
    id: 'employment',
    title: 'Employment and other benefits',
    summary: 'Employment income, EI, social assistance, and related slips.',
    icon: 'EB',
    topics: [
      {
        id: 'employment_income_bundle',
        label: 'Employment income and related benefits (T4, T4A, T4E, etc.)',
        description: 'Salary, wages, taxable benefits, EI, and related employment slips.',
        slipCodes: ['T4', 'T4A', 'T4E', 'T4EQ'],
        formCodes: [],
        linkedStep: 'Income'
      },
      {
        id: 'employment_t4',
        label: 'T4 — employment income',
        description: 'Salary, wages, CPP/EI, tax withheld, and taxable benefits.',
        slipCodes: ['T4'],
        formCodes: [],
        linkedStep: 'Income'
      },
      {
        id: 'employment_t4e',
        label: 'T4E — employment insurance benefits',
        description: 'EI benefits and repayments.',
        slipCodes: ['T4E', 'T4EQ'],
        formCodes: [],
        linkedStep: 'Income'
      },
      {
        id: 'employment_rl1',
        label: 'RL-1 — Quebec employment income',
        description: 'Quebec Revenu Québec employment slip (federal linkage via T4 where applicable).',
        slipCodes: ['RL1'],
        formCodes: [],
        linkedStep: 'Income'
      },
      {
        id: 'employment_rl6',
        label: 'RL-6 — Quebec self-employment and other income',
        description: 'Quebec RL-6 slip for certain employment-related amounts.',
        slipCodes: ['RL6'],
        formCodes: [],
        linkedStep: 'Income'
      },
      {
        id: 'retiring_allowance',
        label: 'Retiring allowance and death benefits (T4A, RL-2)',
        description: 'Retiring allowances, death benefits, and related pension slip boxes.',
        slipCodes: ['T4A', 'RL2'],
        formCodes: [],
        linkedStep: 'Income'
      },
      {
        id: 'social_assistance_t5007',
        label: 'T5007 / RL-5 — social assistance or workers compensation',
        description: 'Social assistance, workers compensation, and related benefits.',
        slipCodes: ['T5007', 'RL5'],
        formCodes: [],
        linkedStep: 'Income'
      },
      {
        id: 'employment_expenses',
        label: 'Employment expenses (T777, T2200, TL2)',
        description: 'Motor vehicle, supplies, and other deductible employment expenses.',
        slipCodes: [],
        formCodes: ['T777', 'T2200', 'TL2'],
        linkedStep: 'Deductions'
      },
      {
        id: 'gst_hst_rebate_employment',
        label: 'GST/HST rebate for employment or partnership expenses',
        description: 'Rebate of GST/HST paid on employment or partnership expenses.',
        slipCodes: [],
        formCodes: ['GST370'],
        linkedStep: 'Review'
      }
    ]
  },
  {
    id: 'pension',
    title: 'Pension and other income',
    summary: 'Retirement, annuity, CPP, OAS, RRSP, and RRIF income.',
    icon: 'PI',
    topics: [
      {
        id: 'pension_income_bundle',
        label: 'Pension income, other income and split income (CPP, OAS, T4A, T4A(P), T4A(RCA), T4RIF, T4RSP, etc.)',
        description: 'Retirement, annuity, CPP, OAS, RRSP, and RRIF income slips.',
        slipCodes: ['T4A', 'T4AP', 'T4A(P)', 'T4AOAS', 'T4A(OAS)', 'T4RIF', 'T4RSP', 'T4A-RCA', 'T737-RCA', 'RL2'],
        formCodes: ['T1032'],
        linkedStep: 'Income'
      },
      {
        id: 'pension_t4a',
        label: 'T4A — pension, retirement, annuity, and other income',
        description: 'Pensions, lump sums, scholarships, fees for services, and other T4A boxes.',
        slipCodes: ['T4A'],
        formCodes: [],
        linkedStep: 'Income'
      },
      {
        id: 'pension_t4ap',
        label: 'T4A(P) — Canada Pension Plan benefits',
        description: 'CPP retirement, survivor, disability, and related benefits.',
        slipCodes: ['T4AP', 'T4A(P)'],
        formCodes: [],
        linkedStep: 'Income'
      },
      {
        id: 'pension_t4aoas',
        label: 'T4A(OAS) — Old Age Security',
        description: 'OAS pension, supplements, recovery, and tax withheld.',
        slipCodes: ['T4AOAS', 'T4A(OAS)', 'NR4OAS'],
        formCodes: [],
        linkedStep: 'Income'
      },
      {
        id: 'pension_t4rif',
        label: 'T4RIF — registered retirement income fund',
        description: 'RRIF withdrawals and tax withheld.',
        slipCodes: ['T4RIF'],
        formCodes: [],
        linkedStep: 'Income'
      },
      {
        id: 'pension_t4rsp',
        label: 'T4RSP — RRSP income',
        description: 'RRSP withdrawals, HBP, LLP, and other RRSP income.',
        slipCodes: ['T4RSP'],
        formCodes: [],
        linkedStep: 'Income'
      },
      {
        id: 'pension_rl2',
        label: 'RL-2 — Quebec retirement and annuity income',
        description: 'Quebec RL-2 retirement income slip.',
        slipCodes: ['RL2'],
        formCodes: [],
        linkedStep: 'Income'
      },
      {
        id: 'pension_rca',
        label: 'T4A-RCA / T737-RCA — retirement compensation arrangement',
        description: 'RCA distributions and custodian contributions.',
        slipCodes: ['T4A-RCA', 'T737-RCA'],
        formCodes: [],
        linkedStep: 'Income'
      }
    ]
  },
  {
    id: 'rental',
    title: 'Rental income',
    summary: 'Rental property income and expenses.',
    icon: 'RI',
    topics: [
      {
        id: 'rental_income',
        label: 'Rental income and expenses (T776)',
        description: 'Rental statements of income and expenses.',
        slipCodes: [],
        formCodes: ['T776'],
        linkedStep: 'Income'
      }
    ]
  },
  {
    id: 'investment',
    title: 'Investment income and expenses',
    summary: 'Interest, dividends, trusts, partnerships, and capital transactions.',
    icon: 'IN',
    topics: [
      {
        id: 'investment_income_bundle',
        label: 'Interest, investment income and carrying charges (T3, T5, T4PS, T5008, T5013, etc.)',
        description: 'Interest, dividends, trust allocations, and securities transactions.',
        slipCodes: ['T3', 'T5', 'T4PS', 'T5008', 'T5013', 'RL3'],
        formCodes: ['5000-D1'],
        linkedStep: 'Income'
      },
      {
        id: 'investment_t3',
        label: 'T3 — trust income',
        description: 'Trust allocations of income, dividends, and capital gains.',
        slipCodes: ['T3'],
        formCodes: [],
        linkedStep: 'Income'
      },
      {
        id: 'investment_t5',
        label: 'T5 — investment income',
        description: 'Interest, dividends, and other investment income.',
        slipCodes: ['T5'],
        formCodes: [],
        linkedStep: 'Income'
      },
      {
        id: 'investment_partnership_shelters',
        label: 'Partnership income, tax shelters, and other investment income',
        description: 'Partnership allocations, tax shelter reporting, and related investment income.',
        slipCodes: ['T5013', 'T5003'],
        formCodes: ['T5003'],
        linkedStep: 'Income'
      },
      {
        id: 'investment_t5008',
        label: 'T5008 — securities transactions',
        description: 'Proceeds and cost base for securities dispositions.',
        slipCodes: ['T5008'],
        formCodes: ['Schedule 3'],
        linkedStep: 'Income'
      },
      {
        id: 'investment_capital_gains',
        label: 'Capital gains or losses (Schedule 3)',
        description: 'Principal residence, other real estate, and capital property dispositions.',
        slipCodes: [],
        formCodes: ['Schedule 3'],
        linkedStep: 'Income'
      },
      {
        id: 'investment_foreign_property',
        label: 'Foreign property over $100,000 (T1135)',
        description: 'Foreign income verification statement for specified foreign property.',
        slipCodes: [],
        formCodes: ['T1135'],
        linkedStep: 'Review'
      },
      {
        id: 'investment_renewable_energy',
        label: 'Tax credit for renewable energy and conservation expenses',
        description: 'Eligible renewable energy and conservation property expenses.',
        slipCodes: [],
        formCodes: ['T2038(IND)'],
        linkedStep: 'Review'
      },
      {
        id: 'investment_rl3',
        label: 'RL-3 — Quebec investment income',
        description: 'Quebec investment income slip.',
        slipCodes: ['RL3'],
        formCodes: [],
        linkedStep: 'Income'
      }
    ]
  },
  {
    id: 'self_employment',
    title: 'Self-employment',
    summary: 'Business, professional, farming, fishing, and commission income.',
    icon: 'SE',
    topics: [
      {
        id: 'self_employment_bundle',
        label: 'Self-employment and business income',
        description: 'Business, professional, commission, farming, and fishing income.',
        slipCodes: ['T4A', 'T5018', 'AGR-1', 'RL6'],
        formCodes: ['T2125', 'T2042', 'T2121'],
        linkedStep: 'Income'
      },
      {
        id: 'digital_news_subscription',
        label: 'Tax credit for qualifying digital news subscription',
        description: 'Digital news subscription expenses for the digital news tax credit.',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Deductions'
      },
      {
        id: 'tax_shelter_credits',
        label: 'Tax shelter and tax credits',
        description: 'Tax shelter investments and related credit claims.',
        slipCodes: ['T5003'],
        formCodes: ['T5003'],
        linkedStep: 'Review'
      },
      {
        id: 'self_employment_business',
        label: 'T2125 — Business income',
        description: 'Self-employment business income and expenses.',
        slipCodes: ['T4A', 'T5018'],
        formCodes: ['T2125'],
        linkedStep: 'Income'
      },
      {
        id: 'self_employment_t2125p',
        label: 'T2125P — Professional income',
        description: 'Professional self-employment income and expenses.',
        slipCodes: ['T4A'],
        formCodes: ['T2125'],
        linkedStep: 'Income'
      },
      {
        id: 'self_employment_t2125c',
        label: 'T2125C — Commission income',
        description: 'Commission-based self-employment income.',
        slipCodes: ['T4A', 'T5018'],
        formCodes: ['T2125'],
        linkedStep: 'Income'
      },
      {
        id: 'self_employment_farming_cash',
        label: 'T2042C — Farming income (cash basis)',
        description: 'Farm income and expenses reported on a cash basis.',
        slipCodes: ['AGR-1'],
        formCodes: ['T2042'],
        linkedStep: 'Income'
      },
      {
        id: 'self_employment_farming',
        label: 'T2042 — Farming income (accrual basis)',
        description: 'Farm income and expenses reported on an accrual basis.',
        slipCodes: ['AGR-1'],
        formCodes: ['T2042'],
        linkedStep: 'Income'
      },
      {
        id: 'self_employment_agristability_cash',
        label: 'T1163C — AgriStability/AgriInvest farming income (cash basis)',
        description: 'AgriStability and AgriInvest program amounts (cash basis).',
        slipCodes: ['AGR-1'],
        formCodes: ['T1163'],
        linkedStep: 'Income'
      },
      {
        id: 'self_employment_agristability',
        label: 'T1163 — AgriStability/AgriInvest farming income (accrual basis)',
        description: 'AgriStability and AgriInvest program amounts (accrual basis).',
        slipCodes: ['AGR-1'],
        formCodes: ['T1163'],
        linkedStep: 'Income'
      },
      {
        id: 'self_employment_farming_main_source',
        label: 'Was farming the main source of income?',
        description: 'Determines restricted farm loss rules and related calculations.',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Income'
      },
      {
        id: 'self_employment_fishing',
        label: 'T2121 — Fishing income',
        description: 'Fishing income and expenses.',
        slipCodes: [],
        formCodes: ['T2121'],
        linkedStep: 'Income'
      },
      {
        id: 'self_employment_schedule_13',
        label: 'Schedule 13 — EI premiums on self-employment and other eligible earnings',
        description: 'Optional employment insurance participation for self-employed persons.',
        slipCodes: [],
        formCodes: ['Schedule 13'],
        linkedStep: 'Review'
      },
      {
        id: 'self_employment_non_resident',
        label: 'T4A-NR / NR4 — non-resident fees or income',
        description: 'Amounts paid to non-residents or received as a non-resident.',
        slipCodes: ['T4A-NR', 'NR4'],
        formCodes: [],
        linkedStep: 'Income'
      }
    ]
  },
  {
    id: 'student',
    title: 'Student',
    summary: 'Tuition, education amounts, loans, and training credits.',
    icon: 'ST',
    topics: [
      {
        id: 'student_t2202',
        label: 'T2202 — Tuition and enrolment certificate (line 32300)',
        description: 'Eligible tuition fees and full-time or part-time months.',
        slipCodes: ['T2202'],
        formCodes: [],
        linkedStep: 'Deductions'
      },
      {
        id: 'student_loans',
        label: 'Interest paid on your student loans (line 31900)',
        description: 'Interest paid on qualifying student loans.',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Deductions'
      },
      {
        id: 'student_tuition_transfer_child',
        label: 'Tuition amount transferred from a child (line 32400)',
        description: 'Unused tuition transferred from a dependant whose return is filed separately.',
        slipCodes: [],
        formCodes: ['Schedule 11'],
        linkedStep: 'Deductions'
      },
      {
        id: 'student_part_time_scholarship',
        label: 'Part-time program details for scholarship income (line 13010)',
        description: 'Scholarship, fellowship, and bursary income requiring part-time enrolment details.',
        slipCodes: ['T4A'],
        formCodes: [],
        linkedStep: 'Income'
      },
      {
        id: 'student_training_credit',
        label: 'Canada training credit (CTC)',
        description: 'Training credit limit and eligible fees.',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Deductions'
      }
    ]
  },
  {
    id: 'deductions',
    title: 'Medical, disability and caregiver',
    summary: 'Medical expenses, disability amounts, caregiver claims, and home accessibility.',
    icon: 'CD',
    topics: [
      {
        id: 'deduction_medical_expenses',
        label: 'Medical expenses',
        description: 'Eligible medical and dental expenses for you and dependants.',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Deductions'
      },
      {
        id: 'deduction_medical_sharing',
        label: 'Sharing of medical expenses',
        description: 'Medical expenses shared between spouses or other claimants.',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Deductions'
      },
      {
        id: 'deduction_medical_last_date',
        label: 'Last date of medical expenses',
        description: '12-month period end date for medical expense claims.',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Deductions'
      },
      {
        id: 'deduction_medical_bundle',
        label: 'Medical expenses, disability, caregiver (summary)',
        description: 'Combined medical and disability-related expenses for you and dependants.',
        slipCodes: [],
        formCodes: ['T2201'],
        linkedStep: 'Deductions'
      },
      {
        id: 'deduction_infirmity_disability_self',
        label: 'Infirmity and disability amounts for yourself (line 31600)',
        description: 'Disability amount claim for the taxpayer.',
        slipCodes: [],
        formCodes: ['T2201'],
        linkedStep: 'Deductions'
      },
      {
        id: 'deduction_disability',
        label: 'Disability amount (T2201)',
        description: 'Disability tax credit certificate and related claims.',
        slipCodes: [],
        formCodes: ['T2201'],
        linkedStep: 'Deductions'
      },
      {
        id: 'deduction_disability_supports',
        label: 'Disability supports deduction (line 21500)',
        description: 'Attendant care and other supports needed to earn income.',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Deductions'
      },
      {
        id: 'deduction_home_accessibility',
        label: 'Home accessibility expenses (line 31285)',
        description: 'Renovations to improve access or reduce risk of harm in the home.',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Deductions'
      },
      {
        id: 'deduction_donations',
        label: 'Donations and political contributions',
        description: 'Donations and gifts to registered charities and political contributions.',
        slipCodes: [],
        formCodes: ['Schedule 9'],
        linkedStep: 'Deductions'
      }
    ]
  },
  {
    id: 'retirement_plans',
    title: 'HBP, LLP, FHSA and other plans',
    summary: 'RRSP, FHSA, home buyers plan, lifelong learning plan, and other retirement contributions.',
    icon: 'RP',
    topics: [
      {
        id: 'deduction_hbp',
        label: 'HBP — Participation in an RRSP Home Buyers\' Plan',
        description: 'RRSP withdrawals and repayments under the Home Buyers\' Plan.',
        slipCodes: ['T4RSP'],
        formCodes: ['Schedule 7'],
        linkedStep: 'Deductions'
      },
      {
        id: 'deduction_llp',
        label: 'LLP — Participation in a Lifelong Learning Plan',
        description: 'RRSP withdrawals and repayments under the Lifelong Learning Plan.',
        slipCodes: ['T4RSP'],
        formCodes: ['Schedule 7'],
        linkedStep: 'Deductions'
      },
      {
        id: 'deduction_fhsa',
        label: 'FHSA information and limit',
        description: 'First Home Savings Account contributions, transfers, and taxable withdrawals.',
        slipCodes: ['T4FHSA'],
        formCodes: ['Schedule 15'],
        linkedStep: 'Deductions'
      },
      {
        id: 'deduction_rrsp_bundle',
        label: 'RRSP, PRPP, and SPP contributions',
        description: 'Registered retirement savings and pension plan contributions.',
        slipCodes: ['T4RSP'],
        formCodes: ['Schedule 7'],
        linkedStep: 'Deductions'
      },
      {
        id: 'deduction_rpp_not_on_t4',
        label: 'Contributions to a registered pension plan (not on a T4 slip)',
        description: 'RPP contributions not reported on employment slips.',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Deductions'
      },
      {
        id: 'deduction_rc267',
        label: 'RC267 — Contributions to a US employer-sponsored retirement plan',
        description: 'Cross-border retirement plan contributions for US plans.',
        slipCodes: [],
        formCodes: ['RC267'],
        linkedStep: 'Deductions'
      },
      {
        id: 'deduction_rc268',
        label: 'RC268 — Contributions to a US retirement plan by a commuter from Canada',
        description: 'US retirement plan contributions for Canadian commuters.',
        slipCodes: [],
        formCodes: ['RC268'],
        linkedStep: 'Deductions'
      },
      {
        id: 'deduction_rc269',
        label: 'RC269 — Contributions to a FERPP or SSA other than US',
        description: 'Foreign employer-sponsored retirement plan contributions.',
        slipCodes: [],
        formCodes: ['RC269'],
        linkedStep: 'Deductions'
      },
      {
        id: 'deduction_t5006',
        label: 'T5006 — Registered labour-sponsored venture capital corporation',
        description: 'Labour-sponsored fund tax credits and RLSP/LSVCC reporting.',
        slipCodes: ['T5006'],
        formCodes: [],
        linkedStep: 'Deductions'
      },
      {
        id: 'deduction_saskatchewan_pension_plan',
        label: 'Contributions to the Saskatchewan Pension Plan',
        description: 'Saskatchewan Pension Plan contributions.',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Deductions'
      },
      {
        id: 'deduction_t10_par',
        label: 'T10 — Pension adjustment reversal (PAR)',
        description: 'Pension adjustment reversal affecting RRSP room.',
        slipCodes: [],
        formCodes: ['T10'],
        linkedStep: 'Deductions'
      }
    ]
  },
  {
    id: 'family',
    title: 'Parents and children',
    summary: 'Dependants, child benefits, support payments, and adoption.',
    icon: 'PC',
    topics: [
      {
        id: 'family_support_payments',
        label: 'Spousal or child support payments',
        description: 'Support paid or received during the year.',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Deductions'
      },
      {
        id: 'family_uccb',
        label: 'RC62 — Universal Child Care Benefit',
        description: 'UCCB amounts and repayments.',
        slipCodes: ['RC62'],
        formCodes: [],
        linkedStep: 'Income'
      },
      {
        id: 'family_childcare',
        label: 'Child care expenses',
        description: 'Child care costs for eligible dependants.',
        slipCodes: [],
        formCodes: ['T778'],
        linkedStep: 'Deductions'
      },
      {
        id: 'family_adoption',
        label: 'Adoption expenses',
        description: 'Eligible adoption-related expenses.',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Deductions'
      }
    ]
  },
  {
    id: 'instalments',
    title: 'Instalments and tax transfer',
    summary: 'Tax instalments paid and transfers to a spouse.',
    icon: 'IT',
    topics: [
      {
        id: 'instalments_paid',
        label: 'Tax instalments paid',
        description: 'Instalment payments made during the year.',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Deductions'
      },
      {
        id: 'instalments_transfer',
        label: 'Transfer to spouse or common-law partner',
        description: 'Pension income, age amount, or disability amount transfers.',
        slipCodes: [],
        formCodes: ['Schedule 2'],
        linkedStep: 'Deductions'
      }
    ]
  },
  {
    id: 'other',
    title: 'Other deductions and credits',
    summary: 'Northern residents, home buyers amount, miscellaneous deductions, and provincial credits.',
    icon: 'OT',
    topics: [
      {
        id: 'other_line_23200',
        label: 'Federal line 23200 — Other deductions',
        description: 'Deductions not claimed elsewhere on the return.',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Deductions'
      },
      {
        id: 'other_line_25500_northern',
        label: 'Federal line 25500 — T2222 Northern residents deduction',
        description: 'Deduction for living in a prescribed northern zone.',
        slipCodes: [],
        formCodes: ['T2222'],
        linkedStep: 'Deductions'
      },
      {
        id: 'other_line_25600_additional',
        label: 'Federal line 25600 — Additional deductions',
        description: 'Additional deductions such as legal fees and other allowable amounts.',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Deductions'
      },
      {
        id: 'other_clergy_religious_order',
        label: 'Federal lines 23100, 25600 — Member of the clergy or religious order',
        description: 'Clergy residence deduction and related religious order amounts.',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Deductions'
      },
      {
        id: 'other_home_buyers_amount',
        label: 'Federal line 31270 — Home buyers\' amount',
        description: 'First-time home buyers\' tax credit for a qualifying home purchase.',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Deductions'
      },
      {
        id: 'other_schedule_12_multigen',
        label: 'Federal line 45355 — Schedule 12 multigenerational home renovation tax credit',
        description: 'Renovation credit for secondary suites for seniors or persons with disabilities.',
        slipCodes: [],
        formCodes: ['Schedule 12'],
        linkedStep: 'Deductions'
      },
      {
        id: 'other_educator_school_supply',
        label: 'Federal line 46900 — Eligible educator school supply tax credit',
        description: 'Teaching supplies purchased by eligible educators.',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Deductions'
      },
      {
        id: 'other_on479_transit',
        label: 'ON479 line 63100 — Ontario seniors\' public transit tax credit',
        description: 'Ontario public transit expenses for seniors (Ontario residents).',
        slipCodes: [],
        formCodes: ['ON479'],
        linkedStep: 'Deductions'
      },
      {
        id: 'other_moving',
        label: 'Moving expenses',
        description: 'Eligible moving expenses for work or study relocation.',
        slipCodes: [],
        formCodes: ['T1-M'],
        linkedStep: 'Deductions'
      },
      {
        id: 'other_deductions_credits',
        label: 'Other deductions and credits (summary)',
        description: 'Northern residents deduction, home buyers amount, and other miscellaneous claims.',
        slipCodes: [],
        formCodes: ['T2222'],
        linkedStep: 'Deductions'
      },
      {
        id: 'adjustment_request',
        label: 'Adjustment request for a filed tax return',
        description: 'Request to change a return that has already been filed.',
        slipCodes: [],
        formCodes: ['T1-ADJ'],
        linkedStep: 'Review'
      },
      {
        id: 'other_repayment',
        label: 'Repayment of income (T1198, T4E repayments)',
        description: 'Retroactive lump-sum payments and benefit repayments.',
        slipCodes: ['T1198', 'T4E'],
        formCodes: ['T1198'],
        linkedStep: 'Income'
      },
      {
        id: 'other_dpsp',
        label: 'T4PS — deferred profit sharing plan',
        description: 'DPSP allocations and payouts.',
        slipCodes: ['T4PS'],
        formCodes: [],
        linkedStep: 'Income'
      },
      {
        id: 'other_security_options',
        label: 'T1212 — security options benefits',
        description: 'Deferred security option benefits and deductions.',
        slipCodes: ['T1212'],
        formCodes: ['T1212'],
        linkedStep: 'Income'
      },
      {
        id: 'other_refund_discount',
        label: 'RC71 — refund discounting fee',
        description: 'Tax refund discounter fees.',
        slipCodes: ['RC71'],
        formCodes: [],
        linkedStep: 'Deductions'
      }
    ]
  },
  {
    id: 'carryforward',
    title: 'Prior year information',
    summary: 'Loss carryforwards, AMT credits, and prior-year comparative information.',
    icon: 'CF',
    topics: [
      {
        id: 'carryforward_prior_year_instalment',
        label: 'Prior year information (used for instalments)',
        description: 'Prior-year tax balances used to calculate instalment payments.',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Review'
      },
      {
        id: 'carryforward_prior_year_comparative',
        label: 'Line-by-line prior year comparative information',
        description: 'Comparative summary against the prior-year return.',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Review'
      },
      {
        id: 'carryforward_losses',
        label: 'Non-capital or net capital losses from prior years',
        description: 'Loss carryforwards applied on the current return.',
        slipCodes: [],
        formCodes: ['Schedule 3'],
        linkedStep: 'Review'
      },
      {
        id: 'carryforward_amt',
        label: 'Alternative minimum tax carryforwards',
        description: 'AMT credit and carryforward amounts from prior years.',
        slipCodes: [],
        formCodes: ['T691'],
        linkedStep: 'Review'
      },
      {
        id: 'carryforward_prior_year',
        label: 'Prior year information and adjustments (summary)',
        description: 'Prior-year slips, reassessments, and balance adjustments.',
        slipCodes: [],
        formCodes: [],
        linkedStep: 'Review'
      }
    ]
  }
]

const TOPIC_BY_ID = new Map()
for (const category of INTERVIEW_TOPIC_CATEGORIES) {
  for (const topic of category.topics) {
    TOPIC_BY_ID.set(topic.id, { ...topic, categoryId: category.id, categoryTitle: category.title })
  }
}

export function listInterviewTopicCatalog () {
  return {
    version: INTERVIEW_TOPICS_VERSION,
    categories: INTERVIEW_TOPIC_CATEGORIES.map((category) => ({
      id: category.id,
      title: category.title,
      summary: category.summary,
      icon: category.icon,
      topics: category.topics.map((topic) => ({
        id: topic.id,
        categoryId: category.id,
        label: topic.label,
        description: topic.description,
        slipCodes: topic.slipCodes,
        formCodes: topic.formCodes,
        linkedStep: topic.linkedStep
      }))
    }))
  }
}

export function normalizeInterviewTopicIds (value) {
  if (!Array.isArray(value)) return []
  const seen = new Set()
  const out = []
  for (const raw of value) {
    const id = String(raw || '').trim()
    if (!id || !TOPIC_BY_ID.has(id) || seen.has(id)) continue
    seen.add(id)
    out.push(id)
  }
  return out
}

export function resolveInterviewTopicArtifacts (selectedTopicIds) {
  const ids = normalizeInterviewTopicIds(selectedTopicIds)
  const slipCodes = new Set()
  const formCodes = new Set()
  const topics = []

  for (const id of ids) {
    const topic = TOPIC_BY_ID.get(id)
    if (!topic) continue
    topics.push({
      id: topic.id,
      label: topic.label,
      categoryId: topic.categoryId,
      categoryTitle: topic.categoryTitle
    })
    for (const code of topic.slipCodes || []) slipCodes.add(String(code).toUpperCase())
    for (const code of topic.formCodes || []) formCodes.add(String(code).trim())
  }

  return {
    selectedTopicIds: ids,
    topics,
    slipCodes: Array.from(slipCodes).sort(),
    formCodes: Array.from(formCodes).sort((a, b) => a.localeCompare(b))
  }
}
