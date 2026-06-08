import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createPool } from '../api/server/db/pool.js'
import { getClerkBackendClient } from '../api/server/services/clerkAdminService.js'
import {
  acceptPendingWorkspaceInvites,
  getOnboardingStatusForUser,
  listWorkspacesForUser
} from '../api/server/services/accountingWorkspaceService.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../api/server/.env') })
dotenv.config({ path: path.join(__dirname, '../.env') })

const email = String(process.argv[2] || 'e2e-employee@axiomft.ca').trim().toLowerCase()
const pool = createPool()
const client = getClerkBackendClient()
const users = await client.users.getUserList({ emailAddress: [email], limit: 5 })
const user = users.data?.[0]

console.log('email', email)
console.log('clerkUser', user ? { id: user.id, email: user.emailAddresses?.[0]?.emailAddress } : null)

if (!user) {
  await pool.end()
  process.exit(1)
}

const { rows: pendingWorkspaceInvites } = await pool.query(
  `SELECT i.id, i.workspace_id, i.invite_email, i.status, i.expires_at, w.name
   FROM taxgpt.accounting_workspace_invites i
   JOIN taxgpt.accounting_workspaces w ON w.id = i.workspace_id
   WHERE lower(i.invite_email) = $1`,
  [email]
)
console.log('pendingWorkspaceInvites', pendingWorkspaceInvites)

let accepted = null
try {
  accepted = await acceptPendingWorkspaceInvites(pool, user.id, email)
  console.log('acceptedInvites', accepted)
} catch (error) {
  console.log('acceptPendingWorkspaceInvitesError', error instanceof Error ? error.message : error)
  const { acceptPendingOrganizationEmployeeInvites } = await import('../api/server/services/accountingWorkspaceService.js')
  const orgOnly = await acceptPendingOrganizationEmployeeInvites(pool, user.id, email)
  console.log('organizationOnlyAccepted', orgOnly)
}

const workspaces = await listWorkspacesForUser(pool, user.id)
const onboarding = await getOnboardingStatusForUser(pool, user.id)
console.log('onboardingAfterAccept', onboarding)
console.log('activeWorkspaces', workspaces.map((workspace) => ({
  id: workspace.id,
  name: workspace.name,
  role: workspace.role,
  status: workspace.status,
  is_personal: workspace.is_personal,
  onboarding_completed_at: workspace.profile_onboarding_completed_at
})))

const { rows: orgMembers } = await pool.query(
  `SELECT organization_id, clerk_user_id, role, status
   FROM taxgpt.accounting_organization_members
   WHERE clerk_user_id = $1 OR clerk_user_id = $2`,
  [user.id, `invite:${email}`]
)
console.log('orgMembers', orgMembers)

const { rows: wsMembers } = await pool.query(
  `SELECT wm.workspace_id, wm.role, wm.status, w.name, w.is_personal, p.onboarding_completed_at
   FROM taxgpt.accounting_workspace_members wm
   JOIN taxgpt.accounting_workspaces w ON w.id = wm.workspace_id
   LEFT JOIN taxgpt.accounting_workspace_profiles p ON p.workspace_id = w.id
   WHERE wm.clerk_user_id = $1`,
  [user.id]
)
console.log('allWorkspaceMemberships', wsMembers)

const { rows: firmWorkspaces } = await pool.query(
  `SELECT w.id, w.name, w.organization_id, p.onboarding_completed_at,
          om.clerk_user_id AS org_member_id, om.role AS org_role, om.status AS org_status
   FROM taxgpt.accounting_workspaces w
   LEFT JOIN taxgpt.accounting_workspace_profiles p ON p.workspace_id = w.id
   LEFT JOIN taxgpt.accounting_organization_members om
     ON om.organization_id = w.organization_id
    AND (om.clerk_user_id = $1 OR om.clerk_user_id = $2)
   WHERE w.is_personal = false
   ORDER BY p.onboarding_completed_at DESC NULLS LAST`,
  [user.id, `invite:${email}`]
)
console.log('firmWorkspaceLinks', firmWorkspaces)

const { rows: onboardedFirms } = await pool.query(
  `SELECT w.id, w.name, w.organization_id, w.is_personal, p.onboarding_completed_at, w.owner_user_id
   FROM taxgpt.accounting_workspaces w
   JOIN taxgpt.accounting_workspace_profiles p ON p.workspace_id = w.id
   WHERE p.onboarding_completed_at IS NOT NULL
   ORDER BY p.onboarding_completed_at DESC
   LIMIT 10`
)
console.log('onboardedFirms', onboardedFirms)

for (const orgId of [...new Set(orgMembers.map((row) => row.organization_id))]) {
  const { rows: orgWorkspaces } = await pool.query(
    `SELECT id, name, is_personal, organization_id
     FROM taxgpt.accounting_workspaces
     WHERE organization_id = $1::uuid`,
    [orgId]
  )
  console.log('orgWorkspaces', orgId, orgWorkspaces)
}

await pool.end()
