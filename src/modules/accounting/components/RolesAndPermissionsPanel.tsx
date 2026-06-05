import { FC, FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { listAccountMembers } from '../../../services/accounting/accountService'
import {
  deleteOrganizationCustomRole,
  fetchOrganizationRbac,
  type OrganizationRbacSnapshot,
  type RbacCustomRole,
  updateOrganizationMemberRbac,
  upsertOrganizationCustomRole
} from '../../../services/accounting/rbacService'
import type { TokenProvider } from '../../../services/api/client'
import { usePermission } from '../../../platform/permissions/usePermission'

const SOURCE_ROLE_OPTIONS = ['admin', 'manager', 'reviewer', 'preparer', 'read_only', 'client']
const MEMBER_ROLE_OPTIONS = ['admin', 'manager', 'reviewer', 'preparer', 'read_only', 'client']

const PERMISSION_LABELS: Record<string, string> = {
  'workspace.read': 'View organization',
  'workspace.manage': 'Manage organization settings',
  'workspace.invite': 'Invite employees',
  'rbac.read': 'View roles and permissions',
  'rbac.manage': 'Manage roles and permissions',
  'billing.read': 'View billing',
  'billing.manage': 'Manage billing',
  'subscription.change': 'Change subscription',
  'documents.read': 'View documents',
  'documents.write': 'Edit documents',
  'documents.manage': 'Manage documents',
  'workflows.approve': 'Approve workflows',
  'workflows.manage': 'Manage workflows',
  'ai.use': 'Use AI features',
  'ai.admin': 'Administer AI features',
  'tax.review': 'Review tax items',
  'workingpapers.edit': 'Edit working papers',
  'engagement.read': 'View engagements',
  'engagement.manage': 'Manage engagements',
  'working_papers.read': 'View working papers',
  'working_papers.manage': 'Manage working papers',
  'review_notes.manage': 'Manage review notes',
  'signoff.perform': 'Perform signoff',
  'integrations.manage': 'Manage integrations',
  'execution.read': 'View execution',
  'execution.manage': 'Manage execution',
  'templates.manage': 'Manage templates'
}

type RolesAndPermissionsPanelProps = {
  getToken: TokenProvider
  onError?: (message: string) => void
  onNotice?: (message: string) => void
}

type MemberDraft = {
  role: string
  customRoles: string[]
}

function formatPermissionLabel (key: string): string {
  return PERMISSION_LABELS[key] || key.replace(/\./g, ' ')
}

function createEmptyRoleDraft () {
  return {
    roleName: '',
    displayName: '',
    sourceRole: 'preparer',
    permissions: [] as string[]
  }
}

const RolesAndPermissionsPanel: FC<RolesAndPermissionsPanelProps> = ({
  getToken,
  onError,
  onNotice
}) => {
  const canManageRbac = usePermission('rbac.manage')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [snapshot, setSnapshot] = useState<OrganizationRbacSnapshot | null>(null)
  const [memberLabels, setMemberLabels] = useState<Record<string, { name: string; email: string | null }>>({})
  const [roleDraft, setRoleDraft] = useState(createEmptyRoleDraft)
  const [editingRoleName, setEditingRoleName] = useState<string | null>(null)
  const [memberDrafts, setMemberDrafts] = useState<Record<string, MemberDraft>>({})

  const permissionOptions = useMemo(
    () => (snapshot?.catalog.permissions || []).map((entry) => entry.key),
    [snapshot]
  )

  const loadSnapshot = useCallback(async () => {
    setLoading(true)
    try {
      const [rbac, members] = await Promise.all([
        fetchOrganizationRbac(getToken),
        listAccountMembers(getToken)
      ])
      setSnapshot(rbac)
      const labels: Record<string, { name: string; email: string | null }> = {}
      for (const member of members as Array<Record<string, unknown>>) {
        const clerkUserId = String(member.clerk_user_id || '')
        if (!clerkUserId) continue
        labels[clerkUserId] = {
          name: String(member.display_name || member.email || clerkUserId),
          email: member.email ? String(member.email) : null
        }
      }
      setMemberLabels(labels)
      const drafts: Record<string, MemberDraft> = {}
      for (const member of rbac.members) {
        drafts[member.clerk_user_id] = {
          role: member.role,
          customRoles: [...member.custom_roles]
        }
      }
      setMemberDrafts(drafts)
      onError?.('')
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Could not load roles and permissions')
    } finally {
      setLoading(false)
    }
  }, [getToken, onError])

  useEffect(() => {
    void loadSnapshot()
  }, [loadSnapshot])

  const resetRoleForm = () => {
    setRoleDraft(createEmptyRoleDraft())
    setEditingRoleName(null)
  }

  const startEditRole = (role: RbacCustomRole) => {
    setEditingRoleName(role.role_name)
    setRoleDraft({
      roleName: role.role_name,
      displayName: role.display_name,
      sourceRole: role.source_role,
      permissions: [...role.permissions]
    })
  }

  const onSubmitRole = async (event: FormEvent) => {
    event.preventDefault()
    if (!canManageRbac) return
    const roleName = roleDraft.roleName.trim().toLowerCase()
    if (!roleName) {
      onError?.('Role name is required')
      return
    }
    setSaving(true)
    try {
      await upsertOrganizationCustomRole(getToken, roleName, {
        sourceRole: roleDraft.sourceRole,
        displayName: roleDraft.displayName.trim() || roleName,
        permissions: roleDraft.permissions
      })
      onNotice?.(editingRoleName ? 'Custom role updated' : 'Custom role created')
      resetRoleForm()
      await loadSnapshot()
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Could not save custom role')
    } finally {
      setSaving(false)
    }
  }

  const onDeleteRole = async (roleName: string) => {
    if (!canManageRbac) return
    if (!window.confirm(`Delete custom role "${roleName}"?`)) return
    setSaving(true)
    try {
      await deleteOrganizationCustomRole(getToken, roleName)
      onNotice?.('Custom role deleted')
      if (editingRoleName === roleName) resetRoleForm()
      await loadSnapshot()
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Could not delete custom role')
    } finally {
      setSaving(false)
    }
  }

  const onSaveMemberAccess = async (memberUserId: string) => {
    if (!canManageRbac) return
    const draft = memberDrafts[memberUserId]
    if (!draft) return
    setSaving(true)
    try {
      await updateOrganizationMemberRbac(getToken, memberUserId, {
        role: draft.role,
        customRoles: draft.customRoles
      })
      onNotice?.('Member access updated')
      await loadSnapshot()
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Could not update member access')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-text-light">Loading roles and permissions...</p>
  }

  if (!snapshot) {
    return <p className="text-sm text-text-light">Roles and permissions are unavailable.</p>
  }

  return (
    <div className="space-y-6">
      {!canManageRbac && (
        <p className="text-sm text-text-light">
          You can review role definitions. Only admins and managers with RBAC access can make changes.
        </p>
      )}

      <section className="rounded-lg border border-border bg-white p-5 sm:p-6 space-y-4">
        <div>
          <h4 className="font-semibold text-primary-dark">Built-in roles</h4>
          <p className="text-sm text-text-light mt-1">
            Default organization roles and the permissions they include.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-light">
                <th className="py-2 pr-4">Role</th>
                <th className="py-2">Permissions</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.catalog.systemRoles.map((role) => (
                <tr key={role.role} className="border-b border-border/70 align-top">
                  <td className="py-3 pr-4 font-medium text-primary-dark">{role.label}</td>
                  <td className="py-3 text-text-light">
                    {role.permissions.map(formatPermissionLabel).join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-white p-5 sm:p-6 space-y-4">
        <div>
          <h4 className="font-semibold text-primary-dark">Custom roles</h4>
          <p className="text-sm text-text-light mt-1">
            Create role templates with additional permissions layered on a built-in source role.
          </p>
        </div>

        {canManageRbac && (
          <form className="space-y-3 rounded-md border border-border/80 p-4" onSubmit={(event) => { void onSubmitRole(event) }}>
            <h5 className="text-sm font-semibold text-primary-dark">
              {editingRoleName ? `Edit role: ${editingRoleName}` : 'Create custom role'}
            </h5>
            <div className="grid gap-3 md:grid-cols-3">
              <input
                className="border border-border rounded-md px-3 py-2 text-sm"
                placeholder="Role key (e.g. senior_preparer)"
                value={roleDraft.roleName}
                disabled={Boolean(editingRoleName) || saving}
                onChange={(event) => setRoleDraft((prev) => ({ ...prev, roleName: event.target.value }))}
              />
              <input
                className="border border-border rounded-md px-3 py-2 text-sm"
                placeholder="Display name"
                value={roleDraft.displayName}
                disabled={saving}
                onChange={(event) => setRoleDraft((prev) => ({ ...prev, displayName: event.target.value }))}
              />
              <select
                className="border border-border rounded-md px-3 py-2 text-sm"
                value={roleDraft.sourceRole}
                disabled={saving}
                onChange={(event) => setRoleDraft((prev) => ({ ...prev, sourceRole: event.target.value }))}
              >
                {SOURCE_ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-56 overflow-y-auto border border-border/70 rounded-md p-3">
              {permissionOptions.map((permission) => (
                <label key={permission} className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={roleDraft.permissions.includes(permission)}
                    disabled={saving}
                    onChange={(event) => {
                      setRoleDraft((prev) => ({
                        ...prev,
                        permissions: event.target.checked
                          ? [...prev.permissions, permission]
                          : prev.permissions.filter((entry) => entry !== permission)
                      }))
                    }}
                  />
                  <span>{formatPermissionLabel(permission)}</span>
                </label>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="submit" className="btn btn--primary text-sm py-2 px-4" disabled={saving}>
                {editingRoleName ? 'Save role' : 'Create role'}
              </button>
              {editingRoleName && (
                <button type="button" className="btn btn--secondary text-sm py-2 px-4" disabled={saving} onClick={resetRoleForm}>
                  Cancel edit
                </button>
              )}
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-light">
                <th className="py-2">Role</th>
                <th className="py-2">Source role</th>
                <th className="py-2">Permissions</th>
                {canManageRbac && <th className="py-2">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {snapshot.customRoles.length === 0 ? (
                <tr>
                  <td className="py-3 text-text-light" colSpan={canManageRbac ? 4 : 3}>
                    No custom roles yet.
                  </td>
                </tr>
              ) : snapshot.customRoles.map((role) => (
                <tr key={role.role_name} className="border-b border-border/70 align-top">
                  <td className="py-3 font-medium text-primary-dark">{role.display_name || role.role_name}</td>
                  <td className="py-3">{role.source_role}</td>
                  <td className="py-3 text-text-light">
                    {role.permissions.length > 0
                      ? role.permissions.map(formatPermissionLabel).join(', ')
                      : 'Inherits source role only'}
                  </td>
                  {canManageRbac && (
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="text-xs text-primary-dark underline"
                          disabled={saving || role.is_system}
                          onClick={() => startEditRole(role)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-xs text-red-700 underline"
                          disabled={saving || role.is_system}
                          onClick={() => { void onDeleteRole(role.role_name) }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-white p-5 sm:p-6 space-y-4">
        <div>
          <h4 className="font-semibold text-primary-dark">Employee access</h4>
          <p className="text-sm text-text-light mt-1">
            Assign built-in roles and optional custom roles for each employee.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-light">
                <th className="py-2">Employee</th>
                <th className="py-2">Built-in role</th>
                <th className="py-2">Custom roles</th>
                <th className="py-2">Status</th>
                {canManageRbac && <th className="py-2">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {snapshot.members.length === 0 ? (
                <tr>
                  <td className="py-3 text-text-light" colSpan={canManageRbac ? 5 : 4}>
                    No employees found.
                  </td>
                </tr>
              ) : snapshot.members.map((member) => {
                const label = memberLabels[member.clerk_user_id]
                const draft = memberDrafts[member.clerk_user_id] || {
                  role: member.role,
                  customRoles: member.custom_roles
                }
                return (
                  <tr key={member.clerk_user_id} className="border-b border-border/70 align-top">
                    <td className="py-3">
                      <div className="font-medium text-primary-dark">{label?.name || member.clerk_user_id}</div>
                      {label?.email && <div className="text-xs text-text-light">{label.email}</div>}
                    </td>
                    <td className="py-3">
                      {canManageRbac ? (
                        <select
                          className="border border-border rounded-md px-2 py-1 text-sm"
                          value={draft.role}
                          disabled={saving || member.role === 'owner'}
                          onChange={(event) => {
                            setMemberDrafts((prev) => ({
                              ...prev,
                              [member.clerk_user_id]: {
                                ...draft,
                                role: event.target.value
                              }
                            }))
                          }}
                        >
                          {member.role === 'owner' && <option value="owner">owner</option>}
                          {MEMBER_ROLE_OPTIONS.map((role) => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      ) : member.role}
                    </td>
                    <td className="py-3">
                      {canManageRbac ? (
                        <select
                          multiple
                          className="border border-border rounded-md px-2 py-1 text-sm min-w-[12rem] min-h-[4.5rem]"
                          value={draft.customRoles}
                          disabled={saving}
                          onChange={(event) => {
                            const selected = Array.from(event.target.selectedOptions).map((option) => option.value)
                            setMemberDrafts((prev) => ({
                              ...prev,
                              [member.clerk_user_id]: {
                                ...draft,
                                customRoles: selected
                              }
                            }))
                          }}
                        >
                          {snapshot.customRoles.map((role) => (
                            <option key={role.role_name} value={role.role_name}>
                              {role.display_name || role.role_name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        draft.customRoles.length > 0 ? draft.customRoles.join(', ') : '—'
                      )}
                    </td>
                    <td className="py-3">{member.status}</td>
                    {canManageRbac && (
                      <td className="py-3">
                        <button
                          type="button"
                          className="text-xs text-primary-dark underline"
                          disabled={saving}
                          onClick={() => { void onSaveMemberAccess(member.clerk_user_id) }}
                        >
                          Save
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default RolesAndPermissionsPanel
