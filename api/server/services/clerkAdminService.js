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

export function mapClerkUserProfile (user) {
  if (!user?.id) return null
  const primaryId = user.primaryEmailAddressId || null
  const primary = Array.isArray(user.emailAddresses)
    ? user.emailAddresses.find((entry) => entry.id === primaryId) || user.emailAddresses[0] || null
    : null
  const email = primary?.emailAddress || null
  const firstName = String(user.firstName || '').trim()
  const lastName = String(user.lastName || '').trim()
  const fullName = [firstName, lastName].filter(Boolean).join(' ')
  const displayName = fullName || String(user.username || '').trim() || email || user.id
  const lastSignInAt = user.lastSignInAt ? new Date(user.lastSignInAt).toISOString() : null

  return {
    clerkUserId: user.id,
    displayName,
    email,
    imageUrl: user.imageUrl || null,
    lastSignInAt
  }
}

export async function getClerkUserProfilesByIds (userIds = []) {
  const ids = [...new Set(
    userIds
      .map((id) => String(id || '').trim())
      .filter((id) => id && !id.startsWith('invite:'))
  )]
  if (ids.length === 0) return new Map()

  const client = getClerkBackendClient()
  const profiles = new Map()
  const chunkSize = 100

  for (let index = 0; index < ids.length; index += chunkSize) {
    const chunk = ids.slice(index, index + chunkSize)
    const result = await client.users.getUserList({
      userId: chunk,
      limit: chunk.length
    })
    const users = Array.isArray(result?.data) ? result.data : []
    for (const user of users) {
      const profile = mapClerkUserProfile(user)
      if (profile) profiles.set(profile.clerkUserId, profile)
    }
  }

  return profiles
}

export async function searchClerkUserIds (query) {
  const normalized = String(query || '').trim()
  if (!normalized) return []

  if (normalized.includes('@')) {
    const userId = await resolveClerkUserIdByEmail(normalized)
    return userId ? [userId] : []
  }

  const client = getClerkBackendClient()
  const result = await client.users.getUserList({
    query: normalized,
    limit: 100
  })
  const users = Array.isArray(result?.data) ? result.data : []
  return users.map((user) => user.id).filter(Boolean)
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

export function isIgnorableClerkRemovalError (message) {
  return /not found|does not exist|could not be found|not a member|no membership/i.test(String(message || ''))
}

export async function removeClerkOrganizationMembership ({ organizationId, userId }) {
  if (!organizationId || !userId) return { removed: false, reason: 'missing_ids' }
  const client = getClerkBackendClient()
  if (!client.organizations?.deleteOrganizationMembership) {
    return { removed: false, reason: 'api_unavailable' }
  }
  try {
    await client.organizations.deleteOrganizationMembership({ organizationId, userId })
    return { removed: true }
  } catch (error) {
    const message = formatClerkError(error)
    if (isIgnorableClerkRemovalError(message)) {
      return { removed: false, reason: 'not_a_member' }
    }
    throw error
  }
}

export async function revokeClerkInvitationById ({ organizationId = null, invitationId = null }) {
  if (!invitationId) return { revoked: false, reason: 'missing_invitation_id' }
  const client = getClerkBackendClient()
  if (organizationId && client.organizations?.revokeOrganizationInvitation) {
    try {
      await client.organizations.revokeOrganizationInvitation({
        organizationId,
        invitationId
      })
      return { revoked: true, channel: 'organization' }
    } catch (error) {
      const message = formatClerkError(error)
      if (!isClerkNotFoundError(message)) {
        throw error
      }
    }
  }
  if (client.invitations?.revokeInvitation) {
    try {
      await client.invitations.revokeInvitation(invitationId)
      return { revoked: true, channel: 'platform' }
    } catch (error) {
      const message = formatClerkError(error)
      if (isIgnorableClerkRemovalError(message)) {
        return { revoked: false, reason: 'not_found' }
      }
      throw error
    }
  }
  return { revoked: false, reason: 'api_unavailable' }
}

export async function revokePendingClerkOrganizationInvitationsForEmail ({ organizationId, emailAddress }) {
  const normalizedEmail = String(emailAddress || '').trim().toLowerCase()
  if (!organizationId || !normalizedEmail) return { revoked: 0 }
  const client = getClerkBackendClient()
  if (!client.organizations?.getOrganizationInvitationList || !client.organizations?.revokeOrganizationInvitation) {
    return { revoked: 0 }
  }
  const list = await client.organizations.getOrganizationInvitationList({
    organizationId,
    status: ['pending'],
    limit: 100
  })
  const invitations = Array.isArray(list?.data) ? list.data : []
  let revoked = 0
  for (const invitation of invitations) {
    const email = String(invitation?.emailAddress || '').trim().toLowerCase()
    if (email !== normalizedEmail) continue
    await client.organizations.revokeOrganizationInvitation({
      organizationId,
      invitationId: invitation.id
    })
    revoked += 1
  }
  return { revoked }
}

export async function revokePendingClerkPlatformInvitationsForEmail (emailAddress) {
  const normalizedEmail = String(emailAddress || '').trim().toLowerCase()
  if (!normalizedEmail) return { revoked: 0 }
  const client = getClerkBackendClient()
  if (!client.invitations?.getInvitationList || !client.invitations?.revokeInvitation) {
    return { revoked: 0 }
  }
  const list = await client.invitations.getInvitationList({
    status: 'pending',
    limit: 100
  })
  const invitations = Array.isArray(list?.data) ? list.data : []
  let revoked = 0
  for (const invitation of invitations) {
    const email = String(invitation?.emailAddress || '').trim().toLowerCase()
    if (email !== normalizedEmail) continue
    await client.invitations.revokeInvitation(invitation.id)
    revoked += 1
  }
  return { revoked }
}

export async function revokeOrganizationEmployeeClerkAccess ({
  clerkOrgId = null,
  clerkUserId = null,
  inviteEmail = null,
  clerkInvitationIds = []
}) {
  const results = {
    membershipRemoved: false,
    invitationsRevoked: 0
  }
  const normalizedEmail = inviteEmail ? String(inviteEmail).trim().toLowerCase() : null
  const uniqueInvitationIds = [...new Set((clerkInvitationIds || []).map((entry) => String(entry || '').trim()).filter(Boolean))]

  if (normalizedEmail) {
    const orgRevoked = await revokePendingClerkOrganizationInvitationsForEmail({
      organizationId: clerkOrgId,
      emailAddress: normalizedEmail
    })
    const platformRevoked = await revokePendingClerkPlatformInvitationsForEmail(normalizedEmail)
    results.invitationsRevoked += Number(orgRevoked.revoked || 0) + Number(platformRevoked.revoked || 0)
  }

  for (const invitationId of uniqueInvitationIds) {
    const revoked = await revokeClerkInvitationById({
      organizationId: clerkOrgId,
      invitationId
    })
    if (revoked.revoked) results.invitationsRevoked += 1
  }

  if (clerkUserId && !String(clerkUserId).startsWith('invite:') && clerkOrgId) {
    const removed = await removeClerkOrganizationMembership({
      organizationId: clerkOrgId,
      userId: clerkUserId
    })
    results.membershipRemoved = Boolean(removed.removed)
  }

  return results
}
