const PLAYBOOK_CATALOG = [
  {
    id: 'ccpc-salary-dividend',
    title: 'CCPC: salary vs dividend',
    prompt: 'How can a Canadian CCPC owner structure salary vs dividends to reduce overall tax?',
    sortOrder: 1
  },
  {
    id: 'lifetime-cge',
    title: 'Lifetime capital gains exemption',
    prompt: 'How does the lifetime capital gains exemption work for selling a qualified small business corporation share?',
    sortOrder: 2
  },
  {
    id: 'income-splitting',
    title: 'Income splitting',
    prompt: 'What are CRA-compliant income-splitting strategies for a family business?',
    sortOrder: 3
  },
  {
    id: 'incorporation-timing',
    title: 'When to incorporate',
    prompt: 'What are the tax implications and planning considerations when incorporating a sole proprietorship?',
    sortOrder: 4
  },
  {
    id: 'rrsp-tfsa-mix',
    title: 'RRSP vs TFSA mix',
    prompt: 'How should I think about RRSP versus TFSA contributions for tax planning?',
    sortOrder: 5
  },
  {
    id: 'rental-holdco',
    title: 'Rental / holdco structure',
    prompt: 'What are common tax structuring considerations for rental property or a holdco?',
    sortOrder: 6
  },
  {
    id: 'estate-succession',
    title: 'Estate / succession planning',
    prompt: 'What tax strategies should a Canadian business owner consider for succession or estate planning?',
    sortOrder: 7
  },
  {
    id: 'stock-options',
    title: 'Stock options / equity comp',
    prompt: 'How are stock options taxed in Canada and what planning considerations apply?',
    sortOrder: 8
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
