const DEFAULT_SECTION_BLUEPRINT = [
  { sectionKey: 'A', sectionLabel: 'Planning & Risk Assessment', sectionType: 'planning' },
  { sectionKey: 'B', sectionLabel: 'Trial Balance & Analytics', sectionType: 'trial_balance' },
  { sectionKey: 'C', sectionLabel: 'Lead Sheets', sectionType: 'leadsheets' },
  { sectionKey: 'D', sectionLabel: 'Adjustments & Journal Entries', sectionType: 'adjustments' },
  { sectionKey: 'E', sectionLabel: 'Review & Signoff', sectionType: 'review' }
]

const DEFAULT_WORKFLOW_BLUEPRINT = [
  { stateKey: 'not_started', stateLabel: 'Not Started', isInitial: true, isTerminal: false, allowedRoles: ['staff', 'manager', 'reviewer'] },
  { stateKey: 'in_progress', stateLabel: 'In Progress', isInitial: false, isTerminal: false, allowedRoles: ['staff', 'manager', 'reviewer'] },
  { stateKey: 'ready_for_review', stateLabel: 'Ready For Review', isInitial: false, isTerminal: false, allowedRoles: ['staff', 'manager'] },
  { stateKey: 'reviewed', stateLabel: 'Reviewed', isInitial: false, isTerminal: true, allowedRoles: ['manager', 'reviewer'] }
]

function isMissingRelationError (error) {
  return Boolean(error && typeof error === 'object' && error.code === '42P01')
}

export async function ensureEngagementTemplate (pool, actorId, payload) {
  const templateKey = `${String(payload.engagementType || 'general').toLowerCase()}-default`
  try {
    const { rows: existingRows } = await pool.query(
      `SELECT id
       FROM taxgpt.engagement_type_templates
       WHERE template_key = $1
         AND COALESCE(organization_id::text, '') = COALESCE($2::text, '')
         AND COALESCE(workspace_id::text, '') = COALESCE($3::text, '')
         AND deleted_at IS NULL
       LIMIT 1`,
      [templateKey, payload.organizationId || null, payload.workspaceId || null]
    )
    if (existingRows[0]?.id) return existingRows[0].id

    const { rows: templateRows } = await pool.query(
      `INSERT INTO taxgpt.engagement_type_templates
       (organization_id, workspace_id, template_key, template_name, engagement_type, workflow_version, status, metadata, created_by, updated_by, created_at, updated_at)
       VALUES ($1::uuid, $2::uuid, $3, $4, $5, 1, 'active', '{}'::jsonb, $6, $6, now(), now())
       RETURNING id`,
      [
        payload.organizationId || null,
        payload.workspaceId || null,
        templateKey,
        `${payload.engagementType || 'General'} Default Template`,
        payload.engagementType || 'General',
        actorId
      ]
    )
    const templateId = templateRows[0]?.id
    if (!templateId) return null

    for (const [index, section] of DEFAULT_SECTION_BLUEPRINT.entries()) {
      await pool.query(
        `INSERT INTO taxgpt.engagement_template_sections
         (organization_id, workspace_id, template_id, section_key, section_label, section_type, sort_order, metadata, created_by, updated_by, created_at, updated_at)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7, '{}'::jsonb, $8, $8, now(), now())`,
        [
          payload.organizationId || null,
          payload.workspaceId || null,
          templateId,
          section.sectionKey,
          section.sectionLabel,
          section.sectionType,
          index + 1,
          actorId
        ]
      )
    }

    for (const [index, workflow] of DEFAULT_WORKFLOW_BLUEPRINT.entries()) {
      await pool.query(
        `INSERT INTO taxgpt.engagement_template_workflows
         (organization_id, workspace_id, template_id, state_key, state_label, is_initial, is_terminal, allowed_roles, sort_order, created_by, updated_by, created_at, updated_at)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7, $8::jsonb, $9, $10, $10, now(), now())`,
        [
          payload.organizationId || null,
          payload.workspaceId || null,
          templateId,
          workflow.stateKey,
          workflow.stateLabel,
          workflow.isInitial,
          workflow.isTerminal,
          JSON.stringify(workflow.allowedRoles),
          index + 1,
          actorId
        ]
      )
    }

    return templateId
  } catch (error) {
    if (isMissingRelationError(error)) return null
    throw error
  }
}

export async function initializeEngagementFromTemplate (pool, actorId, engagement, templateId) {
  if (!engagement?.id || !templateId) return
  try {
    const { rows: sectionRows } = await pool.query(
      `SELECT section_key, section_label, sort_order
       FROM taxgpt.engagement_template_sections
       WHERE template_id = $1::uuid
         AND deleted_at IS NULL
       ORDER BY sort_order ASC`,
      [templateId]
    )

    for (const section of sectionRows) {
      await pool.query(
        `INSERT INTO taxgpt.working_papers
         (organization_id, workspace_id, engagement_id, paper_code, title, status, created_by, created_at, updated_at)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, 'not_started', $6, now(), now())
         ON CONFLICT (engagement_id, paper_code) DO NOTHING`,
        [
          engagement.organization_id || null,
          engagement.workspace_id || null,
          engagement.id,
          section.section_key,
          section.section_label,
          actorId
        ]
      )
    }

    await pool.query(
      `INSERT INTO taxgpt.workflow_transitions
       (organization_id, workspace_id, engagement_id, from_state, to_state, transition_reason, metadata, created_by, updated_by, created_at, updated_at)
       VALUES ($1::uuid, $2::uuid, $3::uuid, NULL, $4, 'template_initialization', jsonb_build_object('templateId', $5::uuid), $6, $6, now(), now())`,
      [
        engagement.organization_id || null,
        engagement.workspace_id || null,
        engagement.id,
        engagement.review_flow_status || 'not_started',
        templateId,
        actorId
      ]
    )
  } catch (error) {
    if (isMissingRelationError(error)) return
    throw error
  }
}

