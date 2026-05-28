CREATE TABLE IF NOT EXISTS taxgpt.engagement_type_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  template_key VARCHAR(64) NOT NULL,
  template_name TEXT NOT NULL,
  engagement_type VARCHAR(64) NOT NULL,
  workflow_version INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(24) NOT NULL DEFAULT 'active',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS engagement_type_templates_key_ux
  ON taxgpt.engagement_type_templates(organization_id, workspace_id, template_key)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS taxgpt.engagement_template_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES taxgpt.engagement_type_templates(id) ON DELETE CASCADE,
  parent_section_id UUID REFERENCES taxgpt.engagement_template_sections(id) ON DELETE SET NULL,
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

CREATE INDEX IF NOT EXISTS engagement_template_sections_template_idx
  ON taxgpt.engagement_template_sections(template_id, sort_order);

CREATE TABLE IF NOT EXISTS taxgpt.engagement_template_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES taxgpt.engagement_type_templates(id) ON DELETE CASCADE,
  state_key VARCHAR(48) NOT NULL,
  state_label TEXT NOT NULL,
  is_initial BOOLEAN NOT NULL DEFAULT false,
  is_terminal BOOLEAN NOT NULL DEFAULT false,
  allowed_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS engagement_template_workflows_state_ux
  ON taxgpt.engagement_template_workflows(template_id, state_key)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS taxgpt.workflow_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  from_state VARCHAR(48),
  to_state VARCHAR(48) NOT NULL,
  transition_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS workflow_transitions_engagement_idx
  ON taxgpt.workflow_transitions(engagement_id, created_at DESC);

CREATE TABLE IF NOT EXISTS taxgpt.formula_cells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  lead_sheet_id UUID REFERENCES taxgpt.lead_sheets(id) ON DELETE CASCADE,
  working_paper_row_id UUID REFERENCES taxgpt.working_paper_rows(id) ON DELETE CASCADE,
  cell_key VARCHAR(64) NOT NULL,
  formula_text TEXT NOT NULL,
  evaluated_value NUMERIC(18,4),
  value_type VARCHAR(24) NOT NULL DEFAULT 'number',
  calculation_version INTEGER NOT NULL DEFAULT 1,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS formula_cells_row_key_ux
  ON taxgpt.formula_cells(working_paper_row_id, cell_key)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS taxgpt.formula_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  formula_cell_id UUID NOT NULL REFERENCES taxgpt.formula_cells(id) ON DELETE CASCADE,
  dependency_key VARCHAR(128) NOT NULL,
  dependency_type VARCHAR(24) NOT NULL DEFAULT 'cell',
  created_by TEXT NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS formula_dependencies_cell_idx
  ON taxgpt.formula_dependencies(formula_cell_id, dependency_key)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS taxgpt.evidence_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  evidence_link_id UUID NOT NULL REFERENCES taxgpt.evidence_links(id) ON DELETE CASCADE,
  annotation_type VARCHAR(24) NOT NULL DEFAULT 'note',
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  page_number INTEGER,
  rect JSONB,
  created_by TEXT NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS evidence_annotations_link_idx
  ON taxgpt.evidence_annotations(evidence_link_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS taxgpt.engagement_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  snapshot_label TEXT NOT NULL,
  snapshot_type VARCHAR(24) NOT NULL DEFAULT 'manual',
  snapshot_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_state VARCHAR(48),
  created_by TEXT NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS engagement_snapshots_engagement_idx
  ON taxgpt.engagement_snapshots(engagement_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS taxgpt.import_export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES taxgpt.accounting_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  job_type VARCHAR(24) NOT NULL,
  file_format VARCHAR(24) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'queued',
  request_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_by TEXT NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS import_export_jobs_scope_idx
  ON taxgpt.import_export_jobs(workspace_id, engagement_id, status, created_at DESC)
  WHERE deleted_at IS NULL;

