import OpenAI from 'openai'
import { getTaxReturnById } from './taxReturn.service.js'
import { listIncomeEntries, listDeductions } from './income.service.js'
import { getSavedCalculation } from './calculation.service.js'
import { getReturnInterviewTopics } from './interviewTopics.service.js'

function getOpenAIClient () {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null
  return new OpenAI({ apiKey })
}

function fallbackIdeas ({ taxReturn, incomeEntries, deductions, calculation, interviewTopics }) {
  const ideas = []
  const topics = new Set(interviewTopics?.selectedTopicIds || [])
  const pensionSplit = calculation?.assumptions?.optimization?.pensionSplit

  if (pensionSplit?.recommendedSplit > 0) {
    ideas.push({
      id: 'pension-split',
      title: 'Pension income splitting',
      summary: `A pension split of $${Number(pensionSplit.recommendedSplit).toFixed(2)} from the ${pensionSplit.splitSourceRole || 'taxpayer'} may reduce household tax before credits.`,
      actions: [
        { label: 'Review spouse setup and pension income', reviewField: 'spouse' },
        { label: 'Learn more about pension income splitting (federal)', href: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/pension-income-splitting.html' }
      ]
    })
  }

  if (topics.has('child_care_expenses') || topics.has('dependents')) {
    ideas.push({
      id: 'child-care',
      title: 'Child care expenses',
      summary: 'If you paid for child care to earn income, attend school, or conduct research, you may be able to claim child care expenses on Form T778.',
      actions: [
        { label: 'Enter child care expenses', reviewField: 'deductions' },
        { label: 'Learn more about child care expenses (federal)', href: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/child-care-expenses-deduction.html' }
      ]
    })
  }

  const interestIncome = incomeEntries
    .filter((row) => String(row.category || '').includes('interest'))
    .reduce((sum, row) => sum + Number(row.amount || 0), 0)
  if (interestIncome > 0 || topics.has('investment_income')) {
    ideas.push({
      id: 'carrying-charges',
      title: 'Deduction of carrying charges and interest expenses',
      summary: 'You may claim carrying charges and interest expenses incurred to earn investment income, such as interest on money borrowed to purchase investments.',
      actions: [
        { label: 'Enter carrying charges and interest expenses', reviewField: 'deductions' },
        { label: 'Learn more about carrying charges and interest expenses', href: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-22100-carrying-charges-interest-expenses.html' }
      ]
    })
  }

  const rrspDeduction = deductions
    .filter((row) => String(row.category || '') === 'rrsp' && !row.is_credit)
    .reduce((sum, row) => sum + Number(row.amount || 0), 0)
  if (rrspDeduction <= 0 && incomeEntries.some((row) => Number(row.amount || 0) > 50000)) {
    ideas.push({
      id: 'rrsp-room',
      title: 'RRSP contribution opportunity',
      summary: 'No RRSP deduction is recorded yet. If you have unused contribution room, an RRSP contribution may reduce taxable income.',
      actions: [
        { label: 'Enter RRSP deduction', reviewField: 'deductions' },
        { label: 'Review income and slips', reviewField: 'income' }
      ]
    })
  }

  if (topics.has('medical_expenses')) {
    ideas.push({
      id: 'medical-expenses',
      title: 'Medical expense credit',
      summary: 'Medical expenses above the threshold may generate a non-refundable tax credit. Gather receipts for eligible medical costs.',
      actions: [
        { label: 'Enter medical expenses', reviewField: 'deductions' },
        { label: 'Learn more about medical expenses', href: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/lines-33099-33199-eligible-medical-expenses-you-claim-on-your-tax-return.html' }
      ]
    })
  }

  if (ideas.length === 0) {
    ideas.push({
      id: 'general-review',
      title: 'Review deduction and credit opportunities',
      summary: `Review interview topics, slips, and deductions for ${taxReturn?.taxpayer_name || 'this taxpayer'} to confirm all available federal credits are captured.`,
      actions: [
        { label: 'Open interview setup', reviewField: 'interview' },
        { label: 'Review deductions and credits', reviewField: 'deductions' }
      ]
    })
  }

  return ideas
}

async function generateAiIdeas ({ taxReturn, incomeEntries, deductions, calculation, interviewTopics }) {
  const client = getOpenAIClient()
  if (!client) return null

  const prompt = {
    taxYear: taxReturn.tax_year,
    taxpayerName: taxReturn.taxpayer_name,
    provinceCode: taxReturn.province_code,
    selectedInterviewTopics: interviewTopics?.selectedTopicIds || [],
    incomeCategories: [...new Set(incomeEntries.map((row) => row.category).filter(Boolean))],
    deductionCategories: [...new Set(deductions.map((row) => row.category).filter(Boolean))],
    calculation: {
      netIncome: calculation?.net_income ?? calculation?.netIncome,
      taxableIncome: calculation?.taxable_income ?? calculation?.taxableIncome,
      totalPayable: calculation?.total_payable ?? calculation?.totalPayable,
      refundOrBalance: calculation?.refund_or_balance ?? calculation?.refundOrBalance
    }
  }

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_TAX_ADVISORY_MODEL || 'gpt-4o-mini',
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'You are a Canadian personal T1 tax advisor. Return JSON with shape {"ideas":[{"id":"string","title":"string","summary":"string","actions":[{"label":"string","reviewField":"income|deductions|interview|spouse|review|identity|mailing|elections"}]}]}. Provide 2-5 practical, conservative tax-saving ideas tailored to the data. Do not invent dollar amounts not supported by the input. Use plain language.'
      },
      {
        role: 'user',
        content: JSON.stringify(prompt)
      }
    ]
  })

  const text = response.choices?.[0]?.message?.content || ''
  const parsed = JSON.parse(text)
  if (!Array.isArray(parsed.ideas)) return null
  return parsed.ideas
    .filter((idea) => idea && idea.title && idea.summary)
    .map((idea, index) => ({
      id: String(idea.id || `ai-idea-${index + 1}`),
      title: String(idea.title),
      summary: String(idea.summary),
      actions: Array.isArray(idea.actions)
        ? idea.actions
          .filter((action) => action?.label)
          .map((action) => ({
            label: String(action.label),
            reviewField: action.reviewField ? String(action.reviewField) : undefined,
            href: action.href ? String(action.href) : undefined
          }))
        : []
    }))
}

export async function getAdvisorySummary (pool, clerkUserId, taxReturnId) {
  const taxReturn = await getTaxReturnById(pool, clerkUserId, taxReturnId)
  if (!taxReturn) return null

  const [incomeEntries, deductions, calculation, interviewTopics] = await Promise.all([
    listIncomeEntries(pool, clerkUserId, taxReturnId),
    listDeductions(pool, clerkUserId, taxReturnId),
    getSavedCalculation(pool, clerkUserId, taxReturnId),
    getReturnInterviewTopics(pool, clerkUserId, taxReturnId).catch(() => null)
  ])

  const context = { taxReturn, incomeEntries, deductions, calculation, interviewTopics }
  let ideas = []
  let status = 'FALLBACK'

  try {
    const aiIdeas = await generateAiIdeas(context)
    if (aiIdeas?.length) {
      ideas = aiIdeas
      status = 'AI'
    }
  } catch (error) {
    console.error('AI tax-saving ideas generation failed', error)
  }

  if (!ideas.length) {
    ideas = fallbackIdeas(context)
    status = 'FALLBACK'
  }

  return {
    status,
    taxReturnId,
    taxYear: taxReturn.tax_year,
    taxpayerName: taxReturn.taxpayer_name,
    ideas,
    notes: status === 'AI'
      ? ['Ideas are AI-generated suggestions. Deterministic calculations and CRA rules remain authoritative.']
      : ['Ideas are generated from your return data and interview topics. Enable OPENAI_API_KEY for richer AI suggestions.']
  }
}

export async function getHouseholdAdvisorySummary (pool, clerkUserId, taxReturnId) {
  const advisory = await getAdvisorySummary(pool, clerkUserId, taxReturnId)
  if (!advisory) return null
  return advisory
}
