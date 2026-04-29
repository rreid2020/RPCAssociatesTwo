import { FC, useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import SEO from '../../../components/SEO'
import ClientPortalShell from '../../../components/ClientPortalShell'
import { taxFetch } from '../../../lib/taxIntelligenceApi'

const DocumentProcessing: FC = () => {
  const { getToken } = useAuth()
  const [documents, setDocuments] = useState<Array<{ id: string; file_name: string; document_type?: string; tax_year?: number }>>([])
  const [workingId, setWorkingId] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const load = async () => {
    try {
      const data = await taxFetch<{ documents: Array<{ id: string; file_name: string; document_type?: string; tax_year?: number }> }>('/documents/for-tax', getToken)
      setDocuments(data.documents || [])
      setErr(null)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load documents')
    }
  }

  useEffect(() => { void load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const runExtraction = async (documentId: string) => {
    setWorkingId(documentId)
    try {
      await taxFetch('/documents/extract', getToken, {
        method: 'POST',
        body: JSON.stringify({ documentId })
      })
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not process document')
    } finally {
      setWorkingId(null)
    }
  }

  return (
    <>
      <SEO title="Document Processing | Tax Intelligence" description="OCR and extraction review for tax documents." canonical="/app/tax-intelligence/documents" />
      <ClientPortalShell>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-primary-dark">Document Processing</h1>
          <p className="text-sm text-text-light">
            Use existing Documents as source of truth. Run OCR + extraction and review confidence output.
          </p>
          {err && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">{err}</p>}
          <div className="bg-white border border-border rounded-lg shadow-sm">
            <ul className="divide-y divide-border">
              {documents.map((doc) => (
                <li key={doc.id} className="p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-text">{doc.file_name}</p>
                    <p className="text-xs text-text-light">{doc.document_type || 'UNKNOWN'} {doc.tax_year ? `· ${doc.tax_year}` : ''}</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn--secondary text-sm px-3 py-2"
                    disabled={workingId === doc.id}
                    onClick={() => { void runExtraction(doc.id) }}
                  >
                    {workingId === doc.id ? 'Processing…' : 'Extract'}
                  </button>
                </li>
              ))}
              {documents.length === 0 && <li className="p-3 text-sm text-text-light">No documents available.</li>}
            </ul>
          </div>
        </div>
      </ClientPortalShell>
    </>
  )
}

export default DocumentProcessing
