-- Phase 1: Engagement execution core (additive; legacy status/review_flow_status unchanged)

ALTER TABLE taxgpt.accounting_engagements
  ADD COLUMN IF NOT EXISTS execution_phase VARCHAR(32) NOT NULL DEFAULT 'planning',
  ADD COLUMN IF NOT EXISTS execution_locked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS execution_template_id UUID REFERENCES taxgpt.engagement_type_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS execution_completion_pct NUMERIC(5,2) NOT NULL DEFAULT 0;

UPDATE taxgpt.accounting_engagements
SET execution_phase = 'planning'
WHERE execution_phase IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'accounting_engagements_execution_phase_chk'
  ) THEN
    ALTER TABLE taxgpt.accounting_engagements
      ADD CONSTRAINT accounting_engagements_execution_phase_chk
      CHECK (execution_phase IN ('planning', 'fieldwork', 'review', 'partner_review', 'completed', 'locked'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS accounting_engagements_execution_phase_idx
  ON taxgpt.accounting_engagements(workspace_id, execution_phase);

-- Runtime engagement structure
CREATE TABLE IF NOT EXISTS taxgpt.engagement_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  template_section_id UUID REFERENCES taxgpt.engagement_template_sections(id) ON DELETE SET NULL,
  section_key VARCHAR(64) NOT NULL,
  section_label TEXT NOT NULL,
  section_type VARCHAR(32) NOT NULL DEFAULT 'working_paper',
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS engagement_sections_engagement_key_ux
  ON taxgpt.engagement_sections(engagement_id, section_key)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS taxgpt.engagement_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  section_id UUID REFERENCES taxgpt.engagement_sections(id) ON DELETE SET NULL,
  checklist_key VARCHAR(64) NOT NULL,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS engagement_checklists_engagement_key_ux
  ON taxgpt.engagement_checklists(engagement_id, checklist_key)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS taxgpt.engagement_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  checklist_id UUID NOT NULL REFERENCES taxgpt.engagement_checklists(id) ON DELETE CASCADE,
  item_key VARCHAR(64) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status VARCHAR(24) NOT NULL DEFAULT 'not_started',
  assigned_to TEXT,
  due_date DATE,
  notes TEXT,
  signed_off_by TEXT,
  signed_off_at TIMESTAMP,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS engagement_checklist_items_checklist_key_ux
  ON taxgpt.engagement_checklist_items(checklist_id, item_key)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS engagement_checklist_items_engagement_status_idx
  ON taxgpt.engagement_checklist_items(engagement_id, status)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS taxgpt.engagement_checklist_item_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  checklist_item_id UUID NOT NULL REFERENCES taxgpt.engagement_checklist_items(id) ON DELETE CASCADE,
  document_id UUID REFERENCES taxgpt.working_paper_documents(id) ON DELETE SET NULL,
  file_key TEXT,
  label TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS taxgpt.engagement_procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  section_id UUID REFERENCES taxgpt.engagement_sections(id) ON DELETE SET NULL,
  procedure_key VARCHAR(64) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  objective TEXT,
  expected_result TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'not_started',
  assigned_to TEXT,
  prepared_by TEXT,
  prepared_at TIMESTAMP,
  reviewed_by TEXT,
  reviewed_at TIMESTAMP,
  lead_sheet_id UUID REFERENCES taxgpt.lead_sheets(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS engagement_procedures_engagement_key_ux
  ON taxgpt.engagement_procedures(engagement_id, procedure_key)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS engagement_procedures_engagement_status_idx
  ON taxgpt.engagement_procedures(engagement_id, status)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS taxgpt.procedure_signoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  procedure_id UUID NOT NULL REFERENCES taxgpt.engagement_procedures(id) ON DELETE CASCADE,
  signoff_type VARCHAR(24) NOT NULL DEFAULT 'approval',
  signed_by TEXT NOT NULL,
  signed_at TIMESTAMP NOT NULL DEFAULT now(),
  role_at_signoff VARCHAR(32),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS taxgpt.procedure_evidence_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  procedure_id UUID NOT NULL REFERENCES taxgpt.engagement_procedures(id) ON DELETE CASCADE,
  document_id UUID REFERENCES taxgpt.working_paper_documents(id) ON DELETE SET NULL,
  evidence_link_id UUID REFERENCES taxgpt.evidence_links(id) ON DELETE SET NULL,
  label TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
);

-- Template blueprints (extend 0018)
CREATE TABLE IF NOT EXISTS taxgpt.engagement_template_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES taxgpt.engagement_type_templates(id) ON DELETE CASCADE,
  template_section_id UUID REFERENCES taxgpt.engagement_template_sections(id) ON DELETE SET NULL,
  checklist_key VARCHAR(64) NOT NULL,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS engagement_template_checklists_key_ux
  ON taxgpt.engagement_template_checklists(template_id, checklist_key)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS taxgpt.engagement_template_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES taxgpt.engagement_type_templates(id) ON DELETE CASCADE,
  template_checklist_id UUID NOT NULL REFERENCES taxgpt.engagement_template_checklists(id) ON DELETE CASCADE,
  item_key VARCHAR(64) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  default_role VARCHAR(32),
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS engagement_template_checklist_items_key_ux
  ON taxgpt.engagement_template_checklist_items(template_checklist_id, item_key)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS taxgpt.engagement_template_procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES taxgpt.engagement_type_templates(id) ON DELETE CASCADE,
  template_section_id UUID REFERENCES taxgpt.engagement_template_sections(id) ON DELETE SET NULL,
  procedure_key VARCHAR(64) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  objective TEXT,
  expected_result TEXT,
  required_signoff_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS engagement_template_procedures_key_ux
  ON taxgpt.engagement_template_procedures(template_id, procedure_key)
  WHERE deleted_at IS NULL;
