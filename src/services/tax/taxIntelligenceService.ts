import { callTaxApi, type TokenProvider } from '../api/client'
import type { TaxReturnSummary } from '../../types/tax'

export async function listTaxReturns (getToken: TokenProvider): Promise<TaxReturnSummary[]> {
  const data = await callTaxApi<{ returns: any[] }>('/tax-intelligence/returns', getToken)
  return (data.returns || []).map((row) => ({
    id: row.id,
    taxYear: Number(row.tax_year || row.taxYear || 0),
    status: row.status || 'draft',
    taxpayerName: row.taxpayer_name || row.taxpayerName || undefined
  }))
}

