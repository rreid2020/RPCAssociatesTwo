import {
  INTERVIEW_TOPICS_VERSION,
  listInterviewTopicCatalog,
  normalizeInterviewTopicIds,
  resolveInterviewTopicArtifacts
} from '../../lib/taxSlips/interviewTopics.registry.js'
import { getTaxReturnById, updateTaxReturn } from './taxReturn.service.js'

function readInterviewTopicsFromSetup (setupJson) {
  const setup = setupJson && typeof setupJson === 'object' ? setupJson : {}
  const block = setup.interviewTopics && typeof setup.interviewTopics === 'object'
    ? setup.interviewTopics
    : {}
  return {
    version: Number(block.version || INTERVIEW_TOPICS_VERSION),
    selectedTopicIds: normalizeInterviewTopicIds(block.selectedTopicIds),
    updatedAt: block.updatedAt ? String(block.updatedAt) : null
  }
}

export function getInterviewTopicsCatalog () {
  return listInterviewTopicCatalog()
}

export async function getReturnInterviewTopics (pool, clerkUserId, taxReturnId) {
  const taxReturn = await getTaxReturnById(pool, clerkUserId, taxReturnId)
  if (!taxReturn) return null

  const catalog = listInterviewTopicCatalog()
  const stored = readInterviewTopicsFromSetup(taxReturn.setup_json)
  const resolved = resolveInterviewTopicArtifacts(stored.selectedTopicIds)

  return {
    taxReturnId,
    taxpayerName: taxReturn.taxpayer_name,
    workspaceRole: taxReturn.workspace_role || 'primary',
    version: catalog.version,
    categories: catalog.categories,
    selectedTopicIds: stored.selectedTopicIds,
    resolvedSlipCodes: resolved.slipCodes,
    resolvedFormCodes: resolved.formCodes,
    resolvedTopics: resolved.topics,
    updatedAt: stored.updatedAt
  }
}

export async function saveReturnInterviewTopics (pool, clerkUserId, taxReturnId, payload = {}) {
  const taxReturn = await getTaxReturnById(pool, clerkUserId, taxReturnId)
  if (!taxReturn) return null

  const selectedTopicIds = normalizeInterviewTopicIds(payload.selectedTopicIds)
  const currentSetup = taxReturn.setup_json && typeof taxReturn.setup_json === 'object'
    ? taxReturn.setup_json
    : {}

  const nextSetup = {
    ...currentSetup,
    interviewTopics: {
      version: INTERVIEW_TOPICS_VERSION,
      selectedTopicIds,
      updatedAt: new Date().toISOString()
    }
  }

  const updated = await updateTaxReturn(pool, clerkUserId, taxReturnId, { setup: nextSetup })
  if (!updated) return null

  return getReturnInterviewTopics(pool, clerkUserId, taxReturnId)
}

export { resolveInterviewTopicArtifacts }
