import { dedupeCanonicalSlipCodes } from '../lib/taxSlips/slipCodeCanonical.js'
import { listInterviewTopicCatalog } from '../lib/taxSlips/interviewTopics.registry.js'
import { COMPLETE_SLIP_DEFINITIONS } from '../lib/taxSlips/slipDefinitions.seed.js'

const catalog = listInterviewTopicCatalog()
const duplicateTopicSlips = []

for (const category of catalog.categories) {
  for (const topic of category.topics) {
    const raw = topic.slipCodes || []
    const deduped = dedupeCanonicalSlipCodes(raw)
    if (raw.length !== deduped.length) {
      duplicateTopicSlips.push({
        topicId: topic.id,
        raw,
        deduped
      })
    }
  }
}

const completeCodes = COMPLETE_SLIP_DEFINITIONS.map((d) => d.code)
const completeDupes = dedupeCanonicalSlipCodes(completeCodes)
if (completeCodes.length !== completeDupes.length) {
  console.error('Duplicate complete slip definitions remain:', completeCodes)
  process.exit(1)
}

if (duplicateTopicSlips.length > 0) {
  console.error('Interview topics still contain alias duplicates:', duplicateTopicSlips)
  process.exit(1)
}

console.log('Slip code audit passed:', {
  completeSlips: completeCodes.length,
  interviewCategories: catalog.categories.length
})
