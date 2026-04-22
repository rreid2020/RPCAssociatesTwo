import { type ChangeEventHandler, FC, useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import SEO from '../../components/SEO'
import ClientPortalShell from '../../components/ClientPortalShell'
import { useFeatureAccess } from '../../lib/subscriptions/hooks'
import UpgradePrompt from '../../components/UpgradePrompt'
import { portalFetch } from '../../lib/portalApi'

type PortalFile = {
  id: string
  file_name: string
  mime: string | null
  size_bytes: number | null
  created_at: string
}

const FileRepository: FC = () => {
  const hasAccess = useFeatureAccess('fileRepository')
  const { getToken } = useAuth()
  const [files, setFiles] = useState<PortalFile[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const load = useCallback(async () => {
    if (!hasAccess) return
    setErr(null)
    setLoading(true)
    try {
      const { files: list } = await portalFetch<{ files: PortalFile[] }>('/v1/files', getToken)
      setFiles(list)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [getToken, hasAccess])

  useEffect(() => {
    void load()
  }, [load])

  const onUpload: ChangeEventHandler<HTMLInputElement> = async (ev) => {
    const file = ev.target.files?.[0]
    ev.target.value = ''
    if (!file) return
    setUploading(true)
    setErr(null)
    try {
      const pres = await portalFetch<{
        uploadUrl: string
        storageKey: string
        fileId: string
      }>('/v1/files/presign-put', getToken, {
        method: 'POST',
        body: JSON.stringify({ fileName: file.name, contentType: file.type || 'application/octet-stream' })
      })
      const put = await fetch(pres.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type || 'application/octet-stream' } })
      if (!put.ok) {
        throw new Error('Upload failed (storage). Check server bucket configuration.')
      }
      await portalFetch('/v1/files/complete', getToken, {
        method: 'POST',
        body: JSON.stringify({
          storageKey: pres.storageKey,
          fileName: file.name,
          mime: file.type || null,
          sizeBytes: file.size
        })
      })
      void load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const onDownload = async (id: string) => {
    setErr(null)
    try {
      const { url } = await portalFetch<{ url: string }>(`/v1/files/${id}/presign-get`, getToken)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Download failed')
    }
  }

  return (
    <>
      <SEO
        title="File Repository | Client Portal"
        description="Secure document sharing and organization in the RPC Associates Client Portal."
        canonical="/portal/files"
      />
      <ClientPortalShell>
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-primary-dark">File Repository</h1>
              {!hasAccess && (
                <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                  Premium
                </span>
              )}
            </div>
            {hasAccess && (
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input type="file" className="hidden" onChange={onUpload} disabled={uploading} />
                <span className="btn btn--primary text-sm py-2 px-4">
                  {uploading ? 'Uploading…' : 'Upload a file'}
                </span>
              </label>
            )}
          </div>

          {!hasAccess ? (
            <UpgradePrompt feature="File Repository" />
          ) : (
            <div className="bg-white p-6 rounded-lg border border-border shadow-sm">
              {err && <p className="text-sm text-red-700 mb-4" role="alert">{err}</p>}
              {loading && <p className="text-text-light">Loading&hellip;</p>}
              {!loading && files.length === 0 && !err && (
                <p className="text-text-light">No files yet. Use Upload to add a document. Files are private to your account and RPC.</p>
              )}
              {!loading && files.length > 0 && (
                <ul className="divide-y divide-border">
                  {files.map((f) => (
                    <li key={f.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-text">{f.file_name}</p>
                        <p className="text-sm text-text-light">
                          {new Date(f.created_at).toLocaleString()}
                          {f.size_bytes != null && ` — ${(f.size_bytes / 1024).toFixed(1)} KB`}
                        </p>
                      </div>
                      <button type="button" className="text-sm font-medium text-accent hover:underline" onClick={() => { void onDownload(f.id) }}>
                        Download
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </ClientPortalShell>
    </>
  )
}

export default FileRepository
