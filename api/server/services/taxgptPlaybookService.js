/**
 * Curated strategy playbooks aligned with high-volume Canadian tax planning search intent.
 * Ordered by typical search popularity; usage events can reorder over time.
 */
const PLAYBOOK_CATALOG = [
  {
    id: 'rrsp-tfsa-mix',
    title: 'RRSP vs TFSA',
    prompt: 'How should I decide between RRSP and TFSA contributions for Canadian tax planning?',
    sortOrder: 1
  },
  {
    id: 'fhsa-first-home',
    title: 'FHSA for first home',
    prompt: 'How does the First Home Savings Account (FHSA) work for tax planning compared with RRSP and TFSA?',
    sortOrder: 2
  },
  {
    id: 'ccpc-salary-dividend',
    title: 'CCPC: salary vs dividend',
    prompt: 'How can a Canadian CCPC owner structure salary vs dividends to reduce overall tax?',
    sortOrder: 3
  },
  {
    id: 'income-splitting',
    title: 'Income splitting',
    prompt: 'What are CRA-compliant income-splitting strategies for a Canadian family or small business?',
    sortOrder: 4
  },
  {
    id: 'home-office-deduction',
    title: 'Home office deduction',
    prompt: 'What tax strategies and deductions apply when working from home in Canada?',
    sortOrder: 5
  },
  {
    id: 'incorporation-timing',
    title: 'When to incorporate',
    prompt: 'What are the tax implications and planning considerations when incorporating a sole proprietorship in Canada?',
    sortOrder: 6
  },
  {
    id: 'rental-property-tax',
    title: 'Rental property taxes',
    prompt: 'What tax strategies and deductions should a Canadian rental property owner consider?',
    sortOrder: 7
  },
  {
    id: 'tax-loss-selling',
    title: 'Tax-loss selling',
    prompt: 'How does tax-loss selling work in Canada and what capital gains planning strategies should I know?',
    sortOrder: 8
  },
  {
    id: 'self-employed-tax-savings',
    title: 'Self-employed tax savings',
    prompt: 'What are the most effective legal tax strategies for self-employed Canadians to reduce taxes?',
    sortOrder: 9
  },
  {
    id: 'lifetime-cge',
    title: 'Lifetime capital gains exemption',
    prompt: 'How does the lifetime capital gains exemption work when selling shares of a qualified small business corporation?',
    sortOrder: 10
  }
]

const PLAYBOOK_BY_ID = new Map(PLAYBOOK_CATALOG.map((item) => [item.id, item]))

export function getTaxgptPlaybookCatalog () {
  return PLAYBOOK_CATALOG.map((item) => ({ ...item }))
}

export function getTaxgptPlaybookById (playbookId) {
  return PLAYBOOK_BY_ID.get(String(playbookId || '').trim()) || null
}

export async function ensureStrategyPlaybookEventsTable (pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS taxgpt.strategy_playbook_events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      playbook_id text NOT NULL,
      user_id text NOT NULL,
      workspace_id uuid NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `)
  await pool.query(`
    CREATE INDEX IF NOT EXISTS strategy_playbook_events_playbook_id_idx
    ON taxgpt.strategy_playbook_events (playbook_id, created_at DESC)
  `)
}

/**
 * @param {import('pg').Pool} pool
 */
export async function listTaxgptPlaybooks (pool) {
  await ensureStrategyPlaybookEventsTable(pool)

  const { rows } = await pool.query(`
    SELECT playbook_id, count(*)::int AS usage_count
    FROM taxgpt.strategy_playbook_events
    GROUP BY playbook_id
  `)

  const usageById = new Map(rows.map((row) => [row.playbook_id, Number(row.usage_count || 0)]))

  return PLAYBOOK_CATALOG
    .map((item) => ({
      id: item.id,
      title: item.title,
      prompt: item.prompt,
      usageCount: usageById.get(item.id) || 0
    }))
    .sort((left, right) => {
      if (right.usageCount !== left.usageCount) return right.usageCount - left.usageCount
      return left.sortOrder - right.sortOrder
    })
    .slice(0, 10)
}

/**
 * @param {import('pg').Pool} pool
 * @param {string} userId
 * @param {string} playbookId
 * @param {string | null | undefined} workspaceId
 */
export async function recordTaxgptPlaybookSelection (pool, userId, playbookId, workspaceId = null) {
  const playbook = getTaxgptPlaybookById(playbookId)
  if (!playbook) {
    throw new Error('Playbook not found')
  }

  await ensureStrategyPlaybookEventsTable(pool)
  await pool.query(
    `INSERT INTO taxgpt.strategy_playbook_events (playbook_id, user_id, workspace_id, created_at)
     VALUES ($1, $2, $3::uuid, now())`,
    [playbook.id, userId, workspaceId || null]
  )

  return { ok: true, playbookId: playbook.id }
}
