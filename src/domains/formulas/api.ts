import { portalFetch } from '../../lib/portalApi'

export type FormulaCellPayload = {
  cellKey: string
  formulaText: string
  evaluatedValue?: number | null
  valueType?: string
  calculationVersion?: number
  metadata?: Record<string, unknown>
}

export async function fetchFormulaCellsDomain (getToken: () => Promise<string | null>, workingPaperRowId: string) {
  return portalFetch<{ cells: any[] }>(`/v1/accounting/working-paper-rows/${workingPaperRowId}/formulas`, getToken)
}

export async function saveFormulaCellsDomain (getToken: () => Promise<string | null>, workingPaperRowId: string, cells: FormulaCellPayload[]) {
  return portalFetch<{ cells: any[] }>(`/v1/accounting/working-paper-rows/${workingPaperRowId}/formulas`, getToken, {
    method: 'PUT',
    body: JSON.stringify({ cells })
  })
}

