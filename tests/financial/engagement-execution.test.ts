import { describe, expect, it } from 'vitest'
import {
  canTransitionExecutionPhase,
  normalizeExecutionPhase,
  normalizeChecklistItemStatus,
  normalizeProcedureStatus
} from '../../api/server/services/engagementExecution/executionConstants.js'
import { normalizeEngagementTypeKey } from '../../api/server/services/engagementExecution/engagementTypeMap.js'
import { blueprintForEngagementType } from '../../api/server/services/engagementExecution/systemTemplateBlueprints.js'
import { hasPermission } from '../../api/server/services/authz/rolePermissions.js'

describe('engagement execution constants', () => {
  it('normalizes execution phase values', () => {
    expect(normalizeExecutionPhase('Planning')).toBe('planning')
    expect(normalizeExecutionPhase('partner_review')).toBe('partner_review')
  })

  it('rejects invalid execution phase', () => {
    expect(() => normalizeExecutionPhase('invalid')).toThrow()
  })

  it('allows staff planning to fieldwork transition', () => {
    expect(canTransitionExecutionPhase('planning', 'fieldwork', 'staff')).toBe(true)
  })

  it('blocks staff partner_review to completed', () => {
    expect(canTransitionExecutionPhase('partner_review', 'completed', 'staff')).toBe(false)
  })

  it('allows manager partner_review to completed', () => {
    expect(canTransitionExecutionPhase('partner_review', 'completed', 'manager')).toBe(true)
  })

  it('normalizes checklist and procedure statuses', () => {
    expect(normalizeChecklistItemStatus('In Progress')).toBe('in_progress')
    expect(normalizeProcedureStatus('pending_review')).toBe('pending_review')
  })
})

describe('engagement type mapping', () => {
  it('maps UI engagement types to storage keys without breaking legacy keys', () => {
    expect(normalizeEngagementTypeKey('review_engagement')).toBe('review_support')
    expect(normalizeEngagementTypeKey('year_end_working_papers')).toBe('year_end_working_papers')
    expect(normalizeEngagementTypeKey('compilation_support')).toBe('compilation_support')
  })
})

describe('execution RBAC', () => {
  it('grants execution.read to staff and denies client', () => {
    expect(hasPermission('staff', 'execution.read')).toBe(true)
    expect(hasPermission('client', 'execution.read')).toBe(false)
  })

  it('grants templates.manage to manager and firm_admin only via role map', () => {
    expect(hasPermission('manager', 'templates.manage')).toBe(true)
    expect(hasPermission('staff', 'templates.manage')).toBe(false)
    expect(hasPermission('firm_admin', 'templates.manage')).toBe(true)
  })
})

describe('system template blueprints', () => {
  it('provides blueprint for each supported engagement type', () => {
    const blueprint = blueprintForEngagementType('year_end_working_papers')
    expect(blueprint.sections.length).toBeGreaterThan(0)
    expect(blueprint.checklists.length).toBeGreaterThan(0)
    expect(blueprint.procedures.length).toBeGreaterThan(0)
  })
})
