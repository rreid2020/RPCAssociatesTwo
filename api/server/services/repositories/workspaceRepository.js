export async function fetchWorkspaceMembers (pool, workspaceId) {
  const { rows } = await pool.query(
    `SELECT workspace_id, clerk_user_id, role, status, clerk_org_membership_id, invited_by, created_at, updated_at
     FROM taxgpt.accounting_workspace_members
     WHERE workspace_id = $1::uuid
     ORDER BY created_at ASC`,
    [workspaceId]
  )
  return rows
}

export async function fetchWorkspaceInvites (pool, workspaceId) {
  const { rows } = await pool.query(
    `SELECT id, workspace_id, invite_email, invite_token, role, status, source, clerk_invitation_id, invited_by, accepted_by, expires_at, created_at, updated_at
     FROM taxgpt.accounting_workspace_invites
     WHERE workspace_id = $1::uuid
     ORDER BY created_at DESC`,
    [workspaceId]
  )
  return rows
}

export async function updateWorkspaceRecord (pool, workspaceId, { name, workspaceType }) {
  const { rows } = await pool.query(
    `UPDATE taxgpt.accounting_workspaces
     SET name = $1,
         workspace_type = $2,
         updated_at = now()
     WHERE id = $3::uuid
     RETURNING *`,
    [name, workspaceType, workspaceId]
  )
  return rows[0] || null
}

export async function deleteWorkspaceRecord (pool, workspaceId) {
  const { rowCount } = await pool.query(
    'DELETE FROM taxgpt.accounting_workspaces WHERE id = $1::uuid',
    [workspaceId]
  )
  return rowCount > 0
}

export async function fetchWorkspaceProfile (pool, workspaceId) {
  const { rows } = await pool.query(
    `SELECT workspace_id, organization_type, business_type, company_legal_name, company_operating_name, industry, website_url, tax_identifier,
            primary_contact_name, primary_contact_email, primary_contact_phone, address_line1, address_line2, city, province_state,
            postal_code, country_code, onboarding_completed_at, created_at, updated_at
     FROM taxgpt.accounting_workspace_profiles
     WHERE workspace_id = $1::uuid
     LIMIT 1`,
    [workspaceId]
  )
  return rows[0] || null
}

export async function upsertWorkspaceProfileRecord (pool, workspaceId, payload = {}) {
  const { rows } = await pool.query(
    `INSERT INTO taxgpt.accounting_workspace_profiles
     (workspace_id, organization_type, business_type, company_legal_name, company_operating_name, industry, website_url, tax_identifier,
      primary_contact_name, primary_contact_email, primary_contact_phone, address_line1, address_line2, city, province_state,
      postal_code, country_code, onboarding_completed_at, created_at, updated_at)
     VALUES (
      $1::uuid, $2, $3, $4, $5, $6, $7, $8,
      $9, $10, $11, $12, $13, $14, $15,
      $16, $17, $18::timestamp, now(), now()
     )
     ON CONFLICT (workspace_id) DO UPDATE SET
      organization_type = EXCLUDED.organization_type,
      business_type = EXCLUDED.business_type,
      company_legal_name = EXCLUDED.company_legal_name,
      company_operating_name = EXCLUDED.company_operating_name,
      industry = EXCLUDED.industry,
      website_url = EXCLUDED.website_url,
      tax_identifier = EXCLUDED.tax_identifier,
      primary_contact_name = EXCLUDED.primary_contact_name,
      primary_contact_email = EXCLUDED.primary_contact_email,
      primary_contact_phone = EXCLUDED.primary_contact_phone,
      address_line1 = EXCLUDED.address_line1,
      address_line2 = EXCLUDED.address_line2,
      city = EXCLUDED.city,
      province_state = EXCLUDED.province_state,
      postal_code = EXCLUDED.postal_code,
      country_code = EXCLUDED.country_code,
      onboarding_completed_at = COALESCE(EXCLUDED.onboarding_completed_at, taxgpt.accounting_workspace_profiles.onboarding_completed_at),
      updated_at = now()
     RETURNING workspace_id, organization_type, business_type, company_legal_name, company_operating_name, industry, website_url, tax_identifier,
               primary_contact_name, primary_contact_email, primary_contact_phone, address_line1, address_line2, city, province_state,
               postal_code, country_code, onboarding_completed_at, created_at, updated_at`,
    [
      workspaceId,
      payload.organizationType,
      payload.businessType,
      payload.companyLegalName,
      payload.companyOperatingName,
      payload.industry,
      payload.websiteUrl,
      payload.taxIdentifier,
      payload.primaryContactName,
      payload.primaryContactEmail,
      payload.primaryContactPhone,
      payload.addressLine1,
      payload.addressLine2,
      payload.city,
      payload.provinceState,
      payload.postalCode,
      payload.countryCode,
      payload.onboardingCompletedAt
    ]
  )
  return rows[0] || null
}

export async function upsertWorkspaceMember (pool, workspaceId, clerkUserId, role, invitedBy) {
  const { rows } = await pool.query(
    `INSERT INTO taxgpt.accounting_workspace_members
     (workspace_id, clerk_user_id, role, status, invited_by, created_at, updated_at)
     VALUES ($1::uuid, $2, $3, 'active', $4, now(), now())
     ON CONFLICT (workspace_id, clerk_user_id)
     DO UPDATE SET role = EXCLUDED.role, status = 'active', invited_by = EXCLUDED.invited_by, updated_at = now()
     RETURNING workspace_id, clerk_user_id, role, status, invited_by, created_at, updated_at`,
    [workspaceId, clerkUserId, role, invitedBy]
  )
  return rows[0] || null
}

export async function updateWorkspaceMemberRecord (pool, workspaceId, clerkUserId, role = null, status = null) {
  const { rows } = await pool.query(
    `UPDATE taxgpt.accounting_workspace_members
     SET role = COALESCE($1, role),
         status = COALESCE($2, status),
         updated_at = now()
     WHERE workspace_id = $3::uuid
       AND clerk_user_id = $4
     RETURNING workspace_id, clerk_user_id, role, status, invited_by, created_at, updated_at`,
    [role, status, workspaceId, clerkUserId]
  )
  return rows[0] || null
}

export async function revokePendingWorkspaceInvitesForEmail (pool, workspaceId, inviteEmail) {
  await pool.query(
    `UPDATE taxgpt.accounting_workspace_invites
     SET status = 'revoked',
         updated_at = now()
     WHERE workspace_id = $1::uuid
       AND lower(invite_email) = lower($2)
       AND status = 'pending'`,
    [workspaceId, inviteEmail]
  )
}

export async function fetchPendingWorkspaceInviteClerkIds (pool, workspaceId, inviteEmail) {
  const { rows } = await pool.query(
    `SELECT clerk_invitation_id
     FROM taxgpt.accounting_workspace_invites
     WHERE workspace_id = $1::uuid
       AND lower(invite_email) = lower($2)
       AND status = 'pending'
       AND clerk_invitation_id IS NOT NULL`,
    [workspaceId, inviteEmail]
  )
  return rows.map((row) => String(row.clerk_invitation_id || '').trim()).filter(Boolean)
}

export async function insertWorkspaceInviteRecord (pool, payload = {}) {
  const { rows } = await pool.query(
    `INSERT INTO taxgpt.accounting_workspace_invites
     (workspace_id, invite_email, invite_token, role, status, source, clerk_invitation_id, invited_by, expires_at, created_at, updated_at)
     VALUES ($1::uuid, $2, $3, $4, 'pending', 'clerk', $5, $6, $7::timestamp, now(), now())
     RETURNING id, workspace_id, invite_email, invite_token, role, status, source, clerk_invitation_id, invited_by, accepted_by, expires_at, created_at, updated_at`,
    [
      payload.workspaceId,
      payload.inviteEmail,
      payload.inviteToken,
      payload.role,
      payload.clerkInvitationId,
      payload.invitedBy,
      payload.expiresAt
    ]
  )
  return rows[0] || null
}

