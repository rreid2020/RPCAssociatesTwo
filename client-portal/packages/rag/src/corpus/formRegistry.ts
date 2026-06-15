import { sql } from 'drizzle-orm'
import { ensureDbValidated, getDb } from '@shared/types'

export type FormRegistryStatus = 'active' | 'archived'
export type FormRegistryFamily =
  | 't1'
  | 'corporate'
  | 'rc'
  | 'gst'
  | 'non_resident'
  | 'trust'
  | 'uht'
  | 'other'

export type FormRegistryRowInput = {
  formNumber: string
  title: string
  landingUrl: string
  normalizedLandingUrl: string
  lastUpdate?: string | null
  status?: FormRegistryStatus
  formFamily?: FormRegistryFamily
  metadata?: Record<string, unknown>
}

let formRegistryReady = false

export function normalizeFormNumber (value: string): string {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '')
}

export function resolveFormRegistryStatus (title: string): FormRegistryStatus {
  if (/\b(archived|cancelled|canceled|annul[eé]e|archiv[eé]e)\b/i.test(title)) {
    return 'archived'
  }
  return 'active'
}

export function classifyFormFamily (formNumber: string): FormRegistryFamily {
  const normalized = normalizeFormNumber(formNumber)
  if (/^T1/.test(normalized) || /^SCH\d/.test(normalized)) return 't1'
  if (/^T2/.test(normalized)) return 'corporate'
  if (/^T3/.test(normalized)) return 'trust'
  if (/^RC/.test(normalized)) return 'rc'
  if (/^GST/.test(normalized) || /^B\d/.test(normalized)) return 'gst'
  if (/^NR/.test(normalized)) return 'non_resident'
  if (/^UHT/.test(normalized)) return 'uht'
  return 'other'
}

export async function ensureFormRegistryTable (): Promise<void> {
  if (formRegistryReady) return
  await ensureDbValidated()
  const db = getDb()

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS taxgpt.form_registry (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      form_number varchar(64) NOT NULL,
      title text NOT NULL,
      landing_url text NOT NULL,
      normalized_landing_url text NOT NULL,
      status varchar(32) NOT NULL DEFAULT 'active',
      form_family varchar(32) NOT NULL DEFAULT 'other',
      last_update date,
      catalog_discovered_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      metadata jsonb,
      CONSTRAINT taxgpt_form_registry_form_number_key UNIQUE (form_number)
    )
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS taxgpt_form_registry_status_idx
    ON taxgpt.form_registry (status, updated_at DESC)
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS taxgpt_form_registry_family_idx
    ON taxgpt.form_registry (form_family, form_number)
  `)

  formRegistryReady = true
}

export async function upsertFormRegistryRows (
  rows: FormRegistryRowInput[]
): Promise<{ inserted: number; updated: number }> {
  await ensureFormRegistryTable()
  const db = getDb()
  let inserted = 0
  let updated = 0

  for (const row of rows) {
    const formNumber = normalizeFormNumber(row.formNumber)
    if (!formNumber || !row.title || !row.landingUrl) continue

    const status = row.status || resolveFormRegistryStatus(row.title)
    const formFamily = row.formFamily || classifyFormFamily(formNumber)
    const lastUpdate = row.lastUpdate || null
    const parsedLastUpdate = lastUpdate && /^\d{4}-\d{2}-\d{2}$/.test(lastUpdate) ? lastUpdate : null

    const result = await db.execute(sql`
      INSERT INTO taxgpt.form_registry (
        form_number,
        title,
        landing_url,
        normalized_landing_url,
        status,
        form_family,
        last_update,
        metadata,
        catalog_discovered_at,
        updated_at
      )
      VALUES (
        ${formNumber},
        ${row.title},
        ${row.landingUrl},
        ${row.normalizedLandingUrl},
        ${status},
        ${formFamily},
        ${parsedLastUpdate}::date,
        ${JSON.stringify(row.metadata || {})}::jsonb,
        now(),
        now()
      )
      ON CONFLICT (form_number) DO UPDATE SET
        title = EXCLUDED.title,
        landing_url = EXCLUDED.landing_url,
        normalized_landing_url = EXCLUDED.normalized_landing_url,
        status = EXCLUDED.status,
        form_family = EXCLUDED.form_family,
        last_update = COALESCE(EXCLUDED.last_update, taxgpt.form_registry.last_update),
        metadata = EXCLUDED.metadata,
        updated_at = now()
      RETURNING (xmax = 0) AS inserted
    `)

    const resultRow = (result as unknown as Array<{ inserted: boolean }>)[0]
    if (resultRow?.inserted) inserted += 1
    else updated += 1
  }

  return { inserted, updated }
}

export async function getFormRegistryStats (): Promise<{
  total: number
  active: number
  archived: number
}> {
  await ensureFormRegistryTable()
  const db = getDb()
  const result = await db.execute(sql`
    SELECT
      count(*)::int AS total,
      count(*) FILTER (WHERE status = 'active')::int AS active,
      count(*) FILTER (WHERE status = 'archived')::int AS archived
    FROM taxgpt.form_registry
  `)
  const row = (result as unknown as Array<{ total: number; active: number; archived: number }>)[0]
  return {
    total: row?.total || 0,
    active: row?.active || 0,
    archived: row?.archived || 0
  }
}
