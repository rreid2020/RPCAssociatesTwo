# Lineage, Reproducibility, and Provenance

## Objectives
- Preserve an explainable chain from source data to financial outputs.
- Ensure calculation outcomes are reproducible for audit and review.

## Data Lineage Requirements
- Record source system and source identifiers for imports (QBO, CSV/XLSX, manual edits).
- Record ingestion timestamp, actor, and workspace/engagement context.
- Track transformation steps (mapping, normalization, categorization).

## Reproducibility Requirements
- Version calculation logic and mapping rules.
- Persist deterministic input snapshots for critical calculations.
- Make reruns possible with same inputs and version metadata.

## Provenance Metadata Model
- `sourceType`
- `sourceRef`
- `ingestedAt`
- `ingestedBy`
- `transformationVersion`
- `calculationVersion`
- `workspaceId`
- `engagementId`

## Governance Controls
- Do not overwrite source provenance fields without compensation events.
- Validate provenance presence for governed operations before signoff.
- Include provenance references in review and audit surfaces.

