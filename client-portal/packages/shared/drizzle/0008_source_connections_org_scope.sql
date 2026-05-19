-- Make source connections organization-aware for multi-tenant provider auth

ALTER TABLE taxgpt.source_connections
  ADD COLUMN IF NOT EXISTS organization_id UUID;

ALTER TABLE taxgpt.source_connections
  ALTER COLUMN client_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS source_connections_org_idx
  ON taxgpt.source_connections(organization_id, provider);

CREATE UNIQUE INDEX IF NOT EXISTS source_connections_org_provider_ux
  ON taxgpt.source_connections(organization_id, provider)
  WHERE organization_id IS NOT NULL;
