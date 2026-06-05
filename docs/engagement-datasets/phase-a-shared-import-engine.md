# Phase A — Shared Import Engine

## Goal

Extract format-agnostic spreadsheet parsing from `trialBalanceSmartImportService.js` into `spreadsheetImportService.js`. Trial balance keeps identical public API via re-exports.

## Modules

| Module | Responsibility |
|--------|----------------|
| `spreadsheetImportService.js` | CSV/XLSX grid parse, header detection, file preview, column stats, positional mapping, generic sanitize |
| `trialBalanceSmartImportService.js` | TB field aliases, TB heuristic/AI mapping, `normalizeMappedRow` for accounts |
| `trialBalanceImportService.js` | TB persistence (unchanged contract) |
| `datasetImportService.js` (Phase B) | Custom column schema, dataset row persistence |

## Extraction list

Move to `spreadsheetImportService.js`:

- `parseCsvToGrid`, `gridToTable`, `buildFilePreview`, `buildHeaderRowCandidates`
- `detectGridStructure`, `detectBestGridStructure`, `detectHeaderRowIndex`
- `columnStats`, `pickBestColumn`, `isIdentityColumn`, `isAmountColumn`, `isNamedIdentityColumn`
- `inferPositionalMapping`, `sanitizeMapping` (generic)
- `mappingIsUsable(mapping, rules)` with configurable required fields
- `buildSuggestedMapping(columns, aliasMap)`
- Utilities: `sanitizeText`, `parseNumber`, `isNumericCell`, `uniqueColumnLabels`

Keep in TB adapter:

- `MAPPING_TARGETS`, TB `COLUMN_ALIASES`
- `inferHeuristicMapping` (TB-specific column naming)
- `normalizeMappedRow`, `inferAiMapping`, `resolveSmartMapping`
- Re-export all spreadsheet symbols for backward compatibility

## Tests

- Existing `trial-balance-smart-import.test.ts` must pass without import path changes
- Add `spreadsheet-import.test.ts` for generic grid detection

## Exit criteria

- [ ] Zero changes to trial balance API request/response shapes
- [ ] All existing smart-import tests green
- [ ] Dataset service can import from `spreadsheetImportService` directly
