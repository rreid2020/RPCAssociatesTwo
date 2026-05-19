-- Enable this AFTER organization_id backfill is complete and app request context sets app.current_organization_id.
-- Example per-request setting:
--   SELECT set_config('app.current_organization_id', '<workspace-uuid>', true);

ALTER TABLE taxgpt.accounting_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxgpt.accounting_engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxgpt.source_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxgpt.account_mapping_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxgpt.accounting_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS accounting_clients_org_isolation ON taxgpt.accounting_clients;
CREATE POLICY accounting_clients_org_isolation ON taxgpt.accounting_clients
  USING (organization_id::text = current_setting('app.current_organization_id', true))
  WITH CHECK (organization_id::text = current_setting('app.current_organization_id', true));

DROP POLICY IF EXISTS accounting_engagements_org_isolation ON taxgpt.accounting_engagements;
CREATE POLICY accounting_engagements_org_isolation ON taxgpt.accounting_engagements
  USING (organization_id::text = current_setting('app.current_organization_id', true))
  WITH CHECK (organization_id::text = current_setting('app.current_organization_id', true));

DROP POLICY IF EXISTS source_connections_org_isolation ON taxgpt.source_connections;
CREATE POLICY source_connections_org_isolation ON taxgpt.source_connections
  USING (organization_id::text = current_setting('app.current_organization_id', true))
  WITH CHECK (organization_id::text = current_setting('app.current_organization_id', true));

DROP POLICY IF EXISTS account_mapping_groups_org_isolation ON taxgpt.account_mapping_groups;
CREATE POLICY account_mapping_groups_org_isolation ON taxgpt.account_mapping_groups
  USING (organization_id::text = current_setting('app.current_organization_id', true))
  WITH CHECK (organization_id::text = current_setting('app.current_organization_id', true));

DROP POLICY IF EXISTS accounting_audit_log_org_isolation ON taxgpt.accounting_audit_log;
CREATE POLICY accounting_audit_log_org_isolation ON taxgpt.accounting_audit_log
  USING (organization_id::text = current_setting('app.current_organization_id', true))
  WITH CHECK (organization_id::text = current_setting('app.current_organization_id', true));
