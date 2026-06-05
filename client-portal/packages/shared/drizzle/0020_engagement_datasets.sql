-- Phase B-D: Engagement datasets, analysis views, and import templates (additive)

CREATE TABLE IF NOT EXISTS taxgpt.engagement_datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  dataset_type VARCHAR(32) NOT NULL DEFAULT 'custom',
  status VARCHAR(24) NOT NULL DEFAULT 'draft',
  header_row_index INTEGER NOT NULL DEFAULT 0,
  column_schema JSONB NOT NULL DEFAULT '[]'::jsonb,
  row_count INTEGER NOT NULL DEFAULT 0,
  source_file_name TEXT,
  latest_import_batch_id UUID,
  created_by TEXT NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS engagement_datasets_workspace_engagement_idx
  ON taxgpt.engagement_datasets(workspace_id, engagement_id)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS taxgpt.engagement_dataset_import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES taxgpt.engagement_datasets(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type VARCHAR(16) NOT NULL,
  header_row_index INTEGER NOT NULL DEFAULT 0,
  column_schema JSONB NOT NULL DEFAULT '[]'::jsonb,
  column_mapping JSONB NOT NULL DEFAULT '{}'::jsonb,
  warning_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_rows INTEGER NOT NULL DEFAULT 0,
  imported_rows INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS engagement_dataset_import_batches_dataset_idx
  ON taxgpt.engagement_dataset_import_batches(dataset_id, created_at DESC);

CREATE TABLE IF NOT EXISTS taxgpt.engagement_dataset_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES taxgpt.engagement_datasets(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  source_row_number INTEGER NOT NULL,
  row_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS engagement_dataset_rows_dataset_idx
  ON taxgpt.engagement_dataset_rows(dataset_id, source_row_number);

-- Phase C: saved analysis views
CREATE TABLE IF NOT EXISTS taxgpt.engagement_dataset_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES taxgpt.engagement_datasets(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES taxgpt.accounting_engagements(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS engagement_dataset_views_dataset_idx
  ON taxgpt.engagement_dataset_views(dataset_id)
  WHERE deleted_at IS NULL;

-- Phase D: workspace import templates
CREATE TABLE IF NOT EXISTS taxgpt.workspace_dataset_import_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES taxgpt.accounting_workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dataset_type VARCHAR(32) NOT NULL DEFAULT 'custom',
  header_row_index INTEGER,
  column_schema JSONB NOT NULL DEFAULT '[]'::jsonb,
  mapping_hints JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS workspace_dataset_import_templates_workspace_idx
  ON taxgpt.workspace_dataset_import_templates(workspace_id)
  WHERE deleted_at IS NULL;
