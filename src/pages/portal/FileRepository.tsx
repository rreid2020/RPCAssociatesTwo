import { type ChangeEventHandler, FC, useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import SEO from '../../components/SEO'
import ClientPortalShell from '../../components/ClientPortalShell'
import { useFeatureAccess } from '../../lib/subscriptions/hooks'
import UpgradePrompt from '../../components/UpgradePrompt'
import { portalFetch } from '../../lib/portalApi'
import { formatBytes } from '../../lib/utils/formatBytes'

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
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!hasAccess) return
    setErr(null)
    setLoading(true)
    try {
      const { files: list } = await portalFetch<{ files: PortalFile[] }>('/v1/files', getToken)
      setFiles(list)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load file list. Check the portal API and network (see error above).')
    } finally {
      setLoading(false)
    }
  }, [getToken, hasAccess])

  useEffect(() => {
    void load()
  }, [load])

  const putOne = async (file: File): Promise<PortalFile> => {
    const pres = await portalFetch<{
      uploadUrl: string
      storageKey: string
    }>('/v1/files/presign-put', getToken, {
      method: 'POST',
      body: JSON.stringify({ fileName: file.name, contentType: file.type || 'application/octet-stream' })
    })
    const put = await fetch(pres.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type || 'application/octet-stream' }
    })
    if (!put.ok) {
      throw new Error('Upload failed (storage). On production, set DO_SPACES_* (or S3_*) on the API and ensure the bucket allows PUT from the browser (CORS).')
    }
    const { file: record } = await portalFetch<{ file: PortalFile }>('/v1/files/complete', getToken, {
      method: 'POST',
      body: JSON.stringify({
        storageKey: pres.storageKey,
        fileName: file.name,
        mime: file.type || null,
        sizeBytes: file.size
      })
    })
    return record
  }

  const onUpload: ChangeEventHandler<HTMLInputElement> = async (ev) => {
    const list = ev.target.files
    ev.target.value = ''
    if (!list?.length) return
    setUploading(true)
    setErr(null)
    setSuccessMessage(null)
    try {
      const added: PortalFile[] = []
      for (const file of list) {
        added.push(await putOne(file))
      }
      setFiles((prev) => {
        const ids = new Set(added.map((a) => a.id))
        const rest = prev.filter((p) => !ids.has(p.id))
        return [...added, ...rest]
      })
      setSuccessMessage(
        added.length === 1
          ? `“${added[0].file_name}” is saved.`
          : `${added.length} files saved.`
      )
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

  const onDelete = async (id: string) => {
    if (!window.confirm('Remove this file? This cannot be undone.')) return
    setErr(null)
    setSuccessMessage(null)
    setDeletingId(id)
    try {
      await portalFetch<{ ok: boolean }>(`/v1/files/${id}`, getToken, { method: 'DELETE' })
      void load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not remove file')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <SEO
        title="File Repository | Client Portal"
        description="Secure document sharing and organization in the Axiom Client Portal."
        canonical="/portal/files"
      />
      <ClientPortalShell>
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-primary-dark">File Repository</h1>
              {!hasAccess && (
                <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                  Premium
                </span>
              )}
            </div>
            {hasAccess && (
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input type="file" className="hidden" multiple onChange={onUpload} disabled={uploading} />
                <span className="btn btn--primary text-sm py-2 px-4">
                  {uploading ? 'Uploading…' : 'Upload file(s)'}
                </span>
              </label>
            )}
          </div>
          {hasAccess && (
            <p className="text-text-light text-sm mb-6 max-w-2xl">
              Uploads are stored privately for your account. You can download or remove files here anytime.
            </p>
          )}

          {!hasAccess ? (
            <UpgradePrompt feature="File Repository" />
          ) : (
            <div className="bg-white p-6 rounded-lg border border-border shadow-sm">
              {err && (
                <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md p-3 mb-4" role="alert">
                  {err}
                </p>
              )}
              {successMessage && !err && (
                <p className="text-sm text-primary-dark bg-primary-dark/5 border border-border rounded-md p-3 mb-4" role="status">
                  {successMessage}
                </p>
              )}
              {loading && <p className="text-text-light">Loading&hellip;</p>}
              {!loading && files.length === 0 && !err && (
                <p className="text-text-light">No files yet. Use Upload to add a document. Files are private to your account and Axiom.</p>
              )}
              {!loading && files.length > 0 && (
                <ul className="divide-y divide-border">
                  {files.map((f) => (
                    <li
                      key={f.id}
                      className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-text break-words">{f.file_name}</p>
                        <p className="text-sm text-text-light mt-0.5">
                          {new Date(f.created_at).toLocaleString()} · {formatBytes(f.size_bytes)}
                          {f.mime && ` · ${f.mime}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          className="text-sm font-medium text-accent hover:underline px-2 py-1"
                          onClick={() => { void onDownload(f.id) }}
                        >
                          Download
                        </button>
                        <button
                          type="button"
                          className="text-sm font-medium text-text-light hover:text-red-700 px-2 py-1"
                          disabled={deletingId === f.id}
                          onClick={() => { void onDelete(f.id) }}
                        >
                          {deletingId === f.id ? 'Removing…' : 'Remove'}
                        </button>
                      </div>
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
