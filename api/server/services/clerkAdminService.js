import { randomBytes } from 'crypto'
import { createClerkClient } from '@clerk/backend'

export const MUST_CHANGE_PASSWORD_METADATA_KEY = 'must_change_password'

let cachedClient = null

function getConfiguredSecretKey () {
  const secretKey = String(process.env.CLERK_SECRET_KEY || '').trim()
  if (!secretKey) {
    throw new Error('CLERK_SECRET_KEY is required for Clerk admin operations')
  }
  return secretKey
}

export function getClerkBackendClient () {
  if (cachedClient) return cachedClient
  cachedClient = createClerkClient({ secretKey: getConfiguredSecretKey() })
  return cachedClient
}

export function formatClerkError (error) {
  const clerkErrors = error?.errors
  if (Array.isArray(clerkErrors) && clerkErrors.length > 0) {
    return clerkErrors
      .map((entry) => String(entry?.longMessage || entry?.message || '').trim())
      .filter(Boolean)
      .join(' ')
  }
  if (error instanceof Error && error.message) return error.message
  return String(error || 'Clerk request failed')
}

export async function resolveClerkUserIdByEmail (emailAddress) {
  const normalizedEmail = String(emailAddress || '').trim().toLowerCase()
  if (!normalizedEmail) return null
  const client = getClerkBackendClient()
  const result = await client.users.getUserList({ emailAddress: [normalizedEmail], limit: 10 })
  const users = Array.isArray(result?.data) ? result.data : []
  const exactMatch = users.find((user) => {
    const addresses = Array.isArray(user?.emailAddresses) ? user.emailAddresses : []
    return addresses.some((entry) => String(entry?.emailAddress || '').trim().toLowerCase() === normalizedEmail)
  })
  return exactMatch?.id || users[0]?.id || null
}

export async function getClerkPrimaryEmail (userId) {
  if (!userId) return null
  const client = getClerkBackendClient()
  const user = await client.users.getUser(userId)
  const primaryId = user?.primaryEmailAddressId || null
  const primary = Array.isArray(user?.emailAddresses)
    ? user.emailAddresses.find((entry) => entry.id === primaryId) || user.emailAddresses[0] || null
    : null
  return primary?.emailAddress || null
}

export async function createClerkEmailInvite ({ emailAddress, redirectUrl, publicMetadata = {} }) {
  const client = getClerkBackendClient()
  return await client.invitations.createInvitation({
    emailAddress,
    redirectUrl,
    publicMetadata
  })
}

export async function createClerkOrganization ({ name, slug, createdBy }) {
  const client = getClerkBackendClient()
  if (!client.organizations?.createOrganization) {
    throw new Error('Clerk organizations API is not available in this server runtime')
  }
  return await client.organizations.createOrganization({
    name,
    slug,
    createdBy
  })
}

export async function createClerkOrganizationInvitation ({ organizationId, emailAddress, role = 'org:member', inviterUserId = null, redirectUrl = null, publicMetadata = {} }) {
  const client = getClerkBackendClient()
  if (!client.organizations?.createOrganizationInvitation) {
    throw new Error('Clerk organization invitations API is not available in this server runtime')
  }
  const payload = {
    organizationId,
    emailAddress,
    role,
    publicMetadata
  }
  if (redirectUrl) payload.redirectUrl = redirectUrl
  if (inviterUserId) payload.inviterUserId = inviterUserId
  return await client.organizations.createOrganizationInvitation(payload)
}

export async function getClerkOrganizationMembership ({ organizationId, userId }) {
  const client = getClerkBackendClient()
  if (!client.organizations?.getOrganizationMembershipList) return null
  const membershipList = await client.organizations.getOrganizationMembershipList({
    organizationId,
    userId,
    limit: 1
  })
  const items = membershipList?.data || membershipList || []
  return items[0] || null
}

export function generateTemporaryPassword () {
  return `Ax-${randomBytes(12).toString('base64url')}!`
}

function buildMustChangePasswordMetadata (mustChangePassword, existingMetadata = {}) {
  const metadata = { ...existingMetadata }
  if (mustChangePassword) {
    metadata[MUST_CHANGE_PASSWORD_METADATA_KEY] = true
  } else {
    delete metadata[MUST_CHANGE_PASSWORD_METADATA_KEY]
  }
  return metadata
}

export async function createClerkUserWithPassword ({
  emailAddress,
  password,
  firstName = null,
  lastName = null,
  mustChangePassword = true
}) {
  const client = getClerkBackendClient()
  return await client.users.createUser({
    emailAddress: [emailAddress],
    password,
    firstName: firstName || undefined,
    lastName: lastName || undefined,
    skipPasswordChecks: true,
    publicMetadata: buildMustChangePasswordMetadata(mustChangePassword)
  })
}

export async function updateClerkUserPassword (userId, password, { mustChangePassword = true } = {}) {
  const client = getClerkBackendClient()
  const user = await client.users.getUser(userId)
  return await client.users.updateUser(userId, {
    password,
    skipPasswordChecks: true,
    publicMetadata: buildMustChangePasswordMetadata(mustChangePassword, user.publicMetadata || {})
  })
}

export async function ensureClerkOrganizationMembership ({
  organizationId,
  userId,
  role = 'org:member'
}) {
  const existing = await getClerkOrganizationMembership({ organizationId, userId })
  if (existing) return existing
  const client = getClerkBackendClient()
  if (!client.organizations?.createOrganizationMembership) {
    throw new Error('Clerk organization membership API is not available in this server runtime')
  }
  return await client.organizations.createOrganizationMembership({
    organizationId,
    userId,
    role
  })
}

export async function clearMustChangePasswordFlag (userId) {
  const client = getClerkBackendClient()
  const user = await client.users.getUser(userId)
  return await client.users.updateUser(userId, {
    publicMetadata: buildMustChangePasswordMetadata(false, user.publicMetadata || {})
  })
}
