import { getWorkspaceContext } from '../accountingWorkspaceService.js'
import { blueprintForEngagementType } from './systemTemplateBlueprints.js'
import { normalizeEngagementTypeKey } from './engagementTypeMap.js'
import {
  assertEngagementExecutionAccess,
  getEngagementForExecution
} from './engagementExecutionRepository.js'

function isMissingRelationError (error) {
  return Boolean(error && typeof error === 'object' && error.code === '42P01')
}

async function upsertSystemTemplate (pool, actorUserId, workspace, blueprint) {
  const { rows: existing } = await pool.query(
    `SELECT id FROM taxgpt.engagement_type_templates
     WHERE template_key = $1
       AND COALESCE(organization_id::text, '') = COALESCE($2::text, '')
       AND COALESCE(workspace_id::text, '') = COALESCE($3::text, '')
       AND deleted_at IS NULL
     LIMIT 1`,
    [blueprint.templateKey, workspace.organization_id, workspace.id]
  )
  if (existing[0]?.id) return existing[0].id

  const { rows: inserted } = await pool.query(
    `INSERT INTO taxgpt.engagement_type_templates
     (organization_id, workspace_id, template_key, template_name, engagement_type, workflow_version, status, metadata, created_by, updated_by, created_at, updated_at)
     VALUES ($1::uuid, $2::uuid, $3, $4, $5, 1, 'active', '{"source":"system"}'::jsonb, $6, $6, now(), now())
     RETURNING id`,
    [
      workspace.organization_id,
      workspace.id,
      blueprint.templateKey,
      blueprint.templateName,
      blueprint.engagementType,
      actorUserId
    ]
  )
  const templateId = inserted[0]?.id
  if (!templateId) return null

  for (const [index, section] of blueprint.sections.entries()) {
    await pool.query(
      `INSERT INTO taxgpt.engagement_template_sections
       (organization_id, workspace_id, template_id, section_key, section_label, section_type, sort_order, metadata, created_by, updated_by, created_at, updated_at)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7, '{}'::jsonb, $8, $8, now(), now())
       ON CONFLICT DO NOTHING`,
      [
        workspace.organization_id,
        workspace.id,
        templateId,
        section.sectionKey,
        section.sectionLabel,
        section.sectionType,
        index + 1,
        actorUserId
      ]
    )
  }

  const templateSectionIdByKey = new Map()
  const { rows: sectionRows } = await pool.query(
    `SELECT id, section_key FROM taxgpt.engagement_template_sections
     WHERE template_id = $1::uuid AND deleted_at IS NULL`,
    [templateId]
  )
  for (const row of sectionRows) templateSectionIdByKey.set(row.section_key, row.id)

  for (const [clIndex, checklist] of (blueprint.checklists || []).entries()) {
    const templateSectionId = checklist.sectionKey
      ? templateSectionIdByKey.get(checklist.sectionKey) || null
      : null
    const { rows: clRows } = await pool.query(
      `INSERT INTO taxgpt.engagement_template_checklists
       (organization_id, workspace_id, template_id, template_section_id, checklist_key, title, sort_order, metadata, created_by, updated_by, created_at, updated_at)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6, $7, $8::jsonb, $9, $9, now(), now())
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [
        workspace.organization_id,
        workspace.id,
        templateId,
        templateSectionId,
        checklist.checklistKey,
        checklist.title,
        clIndex + 1,
        JSON.stringify({ sectionKey: checklist.sectionKey || null }),
        actorUserId
      ]
    )
    let templateChecklistId = clRows[0]?.id
    if (!templateChecklistId) {
      const { rows: found } = await pool.query(
        `SELECT id FROM taxgpt.engagement_template_checklists
         WHERE template_id = $1::uuid AND checklist_key = $2 AND deleted_at IS NULL LIMIT 1`,
        [templateId, checklist.checklistKey]
      )
      templateChecklistId = found[0]?.id
    }
    if (!templateChecklistId) continue

    for (const [itemIndex, item] of (checklist.items || []).entries()) {
      await pool.query(
        `INSERT INTO taxgpt.engagement_template_checklist_items
         (organization_id, workspace_id, template_id, template_checklist_id, item_key, title, description, sort_order, metadata, created_by, updated_by, created_at, updated_at)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6, $7, $8, '{}'::jsonb, $9, $9, now(), now())
         ON CONFLICT DO NOTHING`,
        [
          workspace.organization_id,
          workspace.id,
          templateId,
          templateChecklistId,
          item.itemKey,
          item.title,
          item.description || null,
          itemIndex + 1,
          actorUserId
        ]
      )
    }
  }

  for (const [procIndex, proc] of (blueprint.procedures || []).entries()) {
    await pool.query(
      `INSERT INTO taxgpt.engagement_template_procedures
       (organization_id, workspace_id, template_id, procedure_key, title, description, objective, expected_result, required_signoff_roles, sort_order, metadata, created_by, updated_by, created_at, updated_at)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7, $8, '["manager","reviewer"]'::jsonb, $9, '{}'::jsonb, $10, $10, now(), now())
       ON CONFLICT DO NOTHING`,
      [
        workspace.organization_id,
        workspace.id,
        templateId,
        proc.procedureKey,
        proc.title,
        proc.description || null,
        proc.objective || null,
        proc.expectedResult || null,
        procIndex + 1,
        actorUserId
      ]
    )
  }

  return templateId
}

export async function ensureSystemTemplatesForWorkspace (pool, actorUserId, workspaceId) {
  const workspace = await getWorkspaceContext(pool, actorUserId, workspaceId)
  const types = [
    'year_end_working_papers',
    'compilation_support',
    'review_support',
    'audit',
    'tax_support',
    'custom'
  ]
  const results = []
  for (const type of types) {
    try {
      const blueprint = blueprintForEngagementType(type)
      const id = await upsertSystemTemplate(pool, actorUserId, workspace, blueprint)
      results.push({ engagementType: type, templateId: id })
    } catch (error) {
      if (isMissingRelationError(error)) return results
      throw error
    }
  }
  return results
}

export async function resolveTemplateForEngagement (pool, actorUserId, workspace, engagementType) {
  const normalizedType = normalizeEngagementTypeKey(engagementType)
  const blueprint = blueprintForEngagementType(normalizedType)
  try {
    return await upsertSystemTemplate(pool, actorUserId, workspace, blueprint)
  } catch (error) {
    if (isMissingRelationError(error)) return null
    throw error
  }
}

export async function applyTemplateToEngagement (pool, actorUserId, engagementId, payload = {}) {
  const workspace = await getWorkspaceContext(pool, actorUserId, payload.workspaceId || null)
  await assertEngagementExecutionAccess(pool, workspace, actorUserId, 'execution.manage')

  const engagement = await getEngagementForExecution(pool, engagementId, workspace.id)
  if (!engagement) throw new Error('Engagement not found')

  const templateId = payload.templateId || await resolveTemplateForEngagement(
    pool,
    actorUserId,
    workspace,
    engagement.engagement_type
  )
  if (!templateId) return { applied: false, reason: 'template_tables_unavailable' }

  const { rows: existingSections } = await pool.query(
    `SELECT id FROM taxgpt.engagement_sections WHERE engagement_id = $1::uuid AND deleted_at IS NULL LIMIT 1`,
    [engagementId]
  )
  if (existingSections.length > 0 && !payload.force) {
    return { applied: false, reason: 'already_initialized', templateId }
  }

  const { rows: templateSections } = await pool.query(
    `SELECT * FROM taxgpt.engagement_template_sections
     WHERE template_id = $1::uuid AND deleted_at IS NULL ORDER BY sort_order ASC`,
    [templateId]
  )

  const sectionIdByKey = new Map()
  for (const section of templateSections) {
    const { rows } = await pool.query(
      `INSERT INTO taxgpt.engagement_sections
       (organization_id, workspace_id, engagement_id, template_section_id, section_key, section_label, section_type, sort_order, created_by, created_at, updated_at)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6, $7, $8, $9, now(), now())
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [
        engagement.organization_id,
        engagement.workspace_id,
        engagementId,
        section.id,
        section.section_key,
        section.section_label,
        section.section_type,
        section.sort_order,
        actorUserId
      ]
    )
    const sectionId = rows[0]?.id
    if (sectionId) sectionIdByKey.set(section.section_key, sectionId)
    else {
      const { rows: found } = await pool.query(
        `SELECT id, section_key FROM taxgpt.engagement_sections
         WHERE engagement_id = $1::uuid AND section_key = $2 AND deleted_at IS NULL LIMIT 1`,
        [engagementId, section.section_key]
      )
      if (found[0]) sectionIdByKey.set(found[0].section_key, found[0].id)
    }
  }

  const { rows: templateChecklists } = await pool.query(
    `SELECT * FROM taxgpt.engagement_template_checklists
     WHERE template_id = $1::uuid AND deleted_at IS NULL ORDER BY sort_order ASC`,
    [templateId]
  )

  for (const checklist of templateChecklists) {
    let sectionKey = null
    if (checklist.metadata && typeof checklist.metadata === 'object') {
      sectionKey = checklist.metadata.sectionKey || null
    } else if (typeof checklist.metadata === 'string') {
      try {
        sectionKey = JSON.parse(checklist.metadata)?.sectionKey || null
      } catch { /* ignore */ }
    }
    const resolvedSectionId = sectionKey ? sectionIdByKey.get(sectionKey) || null : null
    const { rows: clRows } = await pool.query(
      `INSERT INTO taxgpt.engagement_checklists
       (organization_id, workspace_id, engagement_id, section_id, checklist_key, title, sort_order, created_by, created_at, updated_at)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6, $7, $8, now(), now())
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [
        engagement.organization_id,
        engagement.workspace_id,
        engagementId,
        resolvedSectionId,
        checklist.checklist_key,
        checklist.title,
        checklist.sort_order,
        actorUserId
      ]
    )
    let checklistId = clRows[0]?.id
    if (!checklistId) {
      const { rows: found } = await pool.query(
        `SELECT id FROM taxgpt.engagement_checklists WHERE engagement_id = $1::uuid AND checklist_key = $2 AND deleted_at IS NULL LIMIT 1`,
        [engagementId, checklist.checklist_key]
      )
      checklistId = found[0]?.id
    }
    if (!checklistId) continue

    const { rows: templateItems } = await pool.query(
      `SELECT * FROM taxgpt.engagement_template_checklist_items
       WHERE template_checklist_id = $1::uuid AND deleted_at IS NULL ORDER BY sort_order ASC`,
      [checklist.id]
    )
    for (const item of templateItems) {
      await pool.query(
        `INSERT INTO taxgpt.engagement_checklist_items
         (organization_id, workspace_id, engagement_id, checklist_id, item_key, title, description, status, sort_order, created_by, created_at, updated_at)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6, $7, 'not_started', $8, $9, now(), now())
         ON CONFLICT DO NOTHING`,
        [
          engagement.organization_id,
          engagement.workspace_id,
          engagementId,
          checklistId,
          item.item_key,
          item.title,
          item.description,
          item.sort_order,
          actorUserId
        ]
      )
    }
  }

  const { rows: templateProcedures } = await pool.query(
    `SELECT * FROM taxgpt.engagement_template_procedures
     WHERE template_id = $1::uuid AND deleted_at IS NULL ORDER BY sort_order ASC`,
    [templateId]
  )

  for (const proc of templateProcedures) {
    await pool.query(
      `INSERT INTO taxgpt.engagement_procedures
       (organization_id, workspace_id, engagement_id, section_id, procedure_key, title, description, objective, expected_result, status, sort_order, created_by, created_at, updated_at)
       VALUES ($1::uuid, $2::uuid, $3::uuid, NULL, $4, $5, $6, $7, $8, 'not_started', $9, $10, now(), now())
       ON CONFLICT DO NOTHING`,
      [
        engagement.organization_id,
        engagement.workspace_id,
        engagementId,
        proc.procedure_key,
        proc.title,
        proc.description,
        proc.objective,
        proc.expected_result,
        proc.sort_order,
        actorUserId
      ]
    )
  }

  await pool.query(
    `UPDATE taxgpt.accounting_engagements
     SET execution_template_id = $1::uuid, execution_phase = 'planning', updated_at = now()
     WHERE id = $2::uuid`,
    [templateId, engagementId]
  )

  return { applied: true, templateId }
}

export async function listTemplates (pool, actorUserId, workspaceId) {
  const workspace = await getWorkspaceContext(pool, actorUserId, workspaceId)
  await assertEngagementExecutionAccess(pool, workspace, actorUserId, 'templates.manage')
  const { rows } = await pool.query(
    `SELECT id, template_key, template_name, engagement_type, status, workflow_version, created_at, updated_at
     FROM taxgpt.engagement_type_templates
     WHERE (workspace_id = $1::uuid OR (workspace_id IS NULL AND organization_id = $2::uuid))
       AND deleted_at IS NULL
     ORDER BY engagement_type ASC, template_name ASC`,
    [workspace.id, workspace.organization_id]
  )
  return rows
}
