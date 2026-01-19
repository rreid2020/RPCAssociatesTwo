# Canadian Personal Income Tax Calculator

## Purpose

The Canadian Personal Income Tax Calculator is a planning tool that provides estimates of personal income tax for Canadian residents. It is designed to help users understand their approximate tax liability for planning purposes.

## Important Disclaimer

**This calculator provides estimates only.** It does not include all deductions, credits, or tax situations. This is not tax advice. Final tax depends on your complete tax return, including all income sources, deductions, credits, and your specific tax situation.

## Data Sources

The tax brackets and rates used in this calculator are sourced from the Canada Revenue Agency (CRA):

- **Federal Tax Rates and Brackets:**
  https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions-individuals/canadian-income-tax-rates-individuals-current-previous-years.html

- **Federal Basic Personal Amount (BPA):**
  https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-30000-basic-personal-amount.html

- **Provincial/Territorial Tax Rates:**
  Provincial and territorial tax brackets are also sourced from the CRA tax rates page linked above.

**Note:** Tax brackets and rates are indexed for inflation annually. The calculator should be updated each year with the latest CRA data.

## What's Included

The calculator includes:

- **Income Sources:**
  - Employment income
  - Self-employment income
  - Other income

- **Deductions:**
  - RRSP contributions

- **Tax Credits:**
  - Federal Basic Personal Amount (BPA) with phase-out calculation
    - Full amount applies for net income up to the phase-out start threshold
    - Phases out linearly between phase-out start and end thresholds
    - Minimum amount applies for net income above the phase-out end threshold

- **Tax Calculations:**
  - Progressive federal tax brackets
  - Progressive provincial/territorial tax brackets
  - Combined marginal and average tax rates

## What's Not Included

The calculator explicitly excludes:

- **Provincial/Territorial Tax Credits:**
  - Provincial credits are excluded in the MVP for reliability and to avoid misleading estimates
  - This is explicitly stated in the calculator UI

- **Other Deductions and Credits:**
  - CPP contributions
  - EI premiums
  - Medical expenses
  - Charitable donations
  - Tuition and education credits
  - Disability tax credit
  - And many other deductions/credits

- **Special Income Treatment:**
  - Dividend tax credits
  - Capital gains (50% inclusion rate)
  - Tax on split income (TOSI)
  - Alternative minimum tax (AMT)

- **Other Considerations:**
  - Net income vs. taxable income simplifications
  - Tax on investment income
  - Other special tax situations

## How to Update for a New Year

To add support for a new tax year (e.g., 2026):

1. **Create new tax data directory:**
   ```
   src/tax-data/2026/
   ```

2. **Create federal.json:**
   - Copy the structure from `src/tax-data/2025/federal.json`
   - Update the `year` field to the new year
   - Update `dataLastUpdated` to the date you're adding the data
   - Update `brackets` with the new federal tax brackets from CRA
   - Update `lowestRate` if it changes
   - Update `bpa` values (fullAmount, phaseOutStart, phaseOutEnd, minimumAmount) from CRA

3. **Create provinces.json:**
   - Copy the structure from `src/tax-data/2025/provinces.json`
   - Update all provincial/territorial brackets and rates from CRA
   - Update `lowestRate` for each province/territory if it changes

4. **Update TaxCalculator component:**
   - Import the new year's data files
   - Add the new year to the tax year dropdown
   - Update the calculation logic to use the appropriate data based on selected year

5. **Verify calculations:**
   - Run the dev self-checks (`src/lib/tax/selfCheck.ts`)
   - Test with known income scenarios
   - Compare results with CRA tax calculators or professional tax software

## Limitations

### 1. Provincial Credits Excluded

Provincial and territorial tax credits are explicitly excluded from the MVP. This is intentional to provide more reliable estimates, as provincial credits vary significantly and many users may not qualify for them.

### 2. Net Income Simplification

The calculator uses a simplified approach where:
- Taxable income = Total income - RRSP contributions
- Net income (used for BPA phase-out) = Taxable income

In reality, net income includes additional deductions (CPP, EI, etc.) that reduce net income before calculating taxable income. This simplification means the BPA phase-out may occur at slightly different income levels than in an actual tax return.

### 3. No Dividends or Capital Gains

The calculator does not handle:
- Dividend income (which has dividend tax credits)
- Capital gains (which have a 50% inclusion rate)

These income types require special tax treatment that is beyond the scope of the MVP.

### 4. Single-Year Focus

Currently, the calculator only supports 2025. Adding support for additional years requires creating new JSON data files as described in the "How to Update" section above.

## Technical Architecture

### File Structure

```
src/
├── lib/tax/
│   ├── types.ts                    # TypeScript interfaces
│   ├── calcTaxFromBrackets.ts      # Core bracket calculation
│   ├── calcFederalBPA.ts          # BPA credit calculation
│   ├── calcFederalTax.ts          # Federal tax calculation
│   ├── calcProvincialTax.ts       # Provincial tax calculation
│   ├── calcSummary.ts             # Main calculation function
│   └── selfCheck.ts               # Dev-only self-checks
├── tax-data/
│   └── 2025/
│       ├── federal.json           # Federal tax data
│       └── provinces.json         # Provincial tax data
└── pages/
    └── TaxCalculator.tsx          # Calculator page component
```

### Calculation Flow

1. User inputs income sources and RRSP contributions
2. Calculate taxable income: `totalIncome - rrspContributions`
3. Calculate federal tax:
   - Gross tax using progressive brackets
   - BPA credit (with phase-out if applicable)
   - Net federal tax = gross - credits
4. Calculate provincial tax:
   - Gross tax using progressive brackets
   - No credits (MVP)
   - Net provincial tax = gross
5. Calculate summary:
   - Total tax = federal net + provincial net
   - Average tax rate = total tax / taxable income
   - Marginal tax rate = federal marginal + provincial marginal

### Testing

The calculator includes dev-only self-checks (`src/lib/tax/selfCheck.ts`) that verify:
- Bracket boundary calculations
- BPA phase-out logic (full, mid-range, minimum)
- Monotonicity (increasing income doesn't decrease tax)

These run automatically in development mode.

## Maintenance

- **Annual Updates:** Update tax data files each year when CRA releases new brackets/rates
- **Data Verification:** Always verify data against official CRA sources before updating
- **Testing:** Run self-checks and manual testing after any updates
- **Documentation:** Update this file if calculation logic or limitations change


