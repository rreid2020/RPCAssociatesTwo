export function createLineageRecord ({
  sourceType,
  sourceRef,
  ingestedBy,
  workspaceId,
  engagementId,
  transformationVersion,
  calculationVersion
}) {
  return {
    sourceType,
    sourceRef,
    ingestedAt: new Date().toISOString(),
    ingestedBy,
    workspaceId,
    engagementId,
    transformationVersion,
    calculationVersion
  }
}

