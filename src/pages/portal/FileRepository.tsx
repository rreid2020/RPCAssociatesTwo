import { type ChangeEventHandler, FC, useCallback, useEffect, useRef, useState } from 'react'
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
  folder_id: string | null
}

type PortalFolder = {
  id: string
  name: string
  parent_id: string | null
  created_at: string
}

type Crumb = { id: 'root' | string; name: string }

/** Bumped when UI changes; if you do not see Create folder, the CDN/site is not serving a fresh `npm run build`. */
const FILE_REPO_UI_ID = 'folders-v1'

function folderApiProbablyMissing (e: unknown): boolean {
  const m = (e instanceof Error && e.message) || String(e)
  if (!m) return false
  return /not found|404|not found\./i.test(m) || m.toLowerCase().includes('endpoint not found') || m.includes('API endpoint not found')
}

const FileRepository: FC = () => {
  const hasAccess = useFeatureAccess('fileRepository')
  const { getToken } = useAuth()
  const [files, setFiles] = useState<PortalFile[]>([])
  const [folders, setFolders] = useState<PortalFolder[]>([])
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([{ id: 'root', name: 'All files' }])
  const [currentFolderId, setCurrentFolderId] = useState<'root' | string>('root')
  /** Set when the API has no /v1/folders route (old deploy) — we list all files and hide folder tools. */
  const [legacyListMode, setLegacyListMode] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [folderSubmitting, setFolderSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const parentQuery = currentFolderId === 'root' ? 'root' : currentFolderId

  const load = useCallback(async () => {
    if (!hasAccess) return
    setLoading(true)
    try {
      let useLegacy = false
      let folderList: PortalFolder[] = []
      try {
        const fr = await portalFetch<{ folders: PortalFolder[] }>(`/v1/folders?parentId=${parentQuery}`, getToken)
        folderList = fr.folders
        setLegacyListMode(false)
      } catch (e) {
        if (folderApiProbablyMissing(e)) {
          useLegacy = true
          setLegacyListMode(true)
          setBreadcrumbs([{ id: 'root', name: 'All files' }])
          setCurrentFolderId('root')
        } else {
          throw e
        }
      }
      if (!useLegacy) {
        setFolders(folderList)
      } else {
        setFolders([])
      }
      const filesUrl = useLegacy ? '/v1/files' : `/v1/files?folderId=${parentQuery}`
      const fl = await portalFetch<{ files: PortalFile[] }>(filesUrl, getToken)
      setFiles(fl.files)
      setErr(null)
    } catch (e) {
      setSuccessMessage(null)
      setErr(
        e instanceof Error
          ? e.message
          : 'Failed to load file list. Check the portal API and network (see error above).'
      )
    } finally {
      setLoading(false)
    }
  }, [getToken, hasAccess, parentQuery])

  useEffect(() => {
    void load()
  }, [load])

  const putOne = async (file: File, inFolder: 'root' | string): Promise<PortalFile> => {
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
    const body: Record<string, unknown> = {
      storageKey: pres.storageKey,
      fileName: file.name,
      mime: file.type || null,
      sizeBytes: file.size
    }
    if (inFolder !== 'root') {
      body.folderId = inFolder
    }
    const { file: record } = await portalFetch<{ file: PortalFile }>('/v1/files/complete', getToken, {
      method: 'POST',
      body: JSON.stringify(body)
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
    const targetFolder = currentFolderId
    try {
      const added: PortalFile[] = []
      for (const file of list) {
        added.push(await putOne(file, targetFolder))
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

  const openFolder = (f: PortalFolder) => {
    setCurrentFolderId(f.id)
    setBreadcrumbs((b) => [...b, { id: f.id, name: f.name }])
  }

  const goBreadcrumb = (index: number) => {
    const c = breadcrumbs[index]
    if (!c) return
    if (c.id === 'root') {
      setCurrentFolderId('root')
      setBreadcrumbs([breadcrumbs[0]])
      return
    }
    setCurrentFolderId(c.id)
    setBreadcrumbs(breadcrumbs.slice(0, index + 1))
  }

  const onCreateFolder = async () => {
    const n = newFolderName.trim()
    if (!n) {
      setErr('Enter a folder name.')
      return
    }
    setErr(null)
    setFolderSubmitting(true)
    try {
      await portalFetch<{ folder: PortalFolder }>('/v1/folders', getToken, {
        method: 'POST',
        body: JSON.stringify({ name: n, parentId: currentFolderId === 'root' ? 'root' : currentFolderId })
      })
      setNewFolderName('')
      setSuccessMessage(`Folder “${n}” created.`)
      void load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not create folder')
    } finally {
      setFolderSubmitting(false)
    }
  }

  const onDeleteFolder = async (f: PortalFolder) => {
    if (
      !window.confirm(
        `Delete the folder “${f.name}”? Subfolders are removed. Files in deleted folders are moved to All files (unfiled) at the top level.`
      )
    ) {
      return
    }
    setErr(null)
    setSuccessMessage(null)
    setDeletingFolderId(f.id)
    try {
      await portalFetch(`/v1/folders/${f.id}`, getToken, { method: 'DELETE' })
      void load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not delete folder')
    } finally {
      setDeletingFolderId(null)
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
              <>
                <input
                  id="portal-file-repo-input"
                  ref={fileInputRef}
                  type="file"
                  className="sr-only"
                  multiple
                  onChange={onUpload}
                  disabled={uploading}
                  tabIndex={-1}
                />
                <button
                  type="button"
                  className="btn btn--primary text-sm py-2 px-4"
                  disabled={uploading}
                  onClick={() => { fileInputRef.current?.click() }}
                >
                  {uploading ? 'Uploading…' : 'Upload file(s) here'}
                </button>
              </>
            )}
          </div>
          {hasAccess && (
            <p className="text-text-light text-sm mb-4 max-w-2xl">
              {legacyListMode
                ? (
                  'Listing all of your files (folder API is not on this server yet). Uploads still save metadata in the database and bytes in object storage when the API is configured. Deploy the latest api from main to enable full folder tools.'
                )
                : (
                  'Organize with folders, upload into the current folder, and use Download or Remove for each file. Folders and file metadata are stored in your account database; file contents live in Axiom’s private object storage.'
                )}
            </p>
          )}

          {!hasAccess ? (
            <UpgradePrompt feature="File Repository" />
          ) : (
            <div className="space-y-4" data-file-repo-ui={FILE_REPO_UI_ID}>
              <div className="rounded-md border border-amber-200 bg-amber-50/95 text-amber-950 text-sm p-3">
                <p>
                  <strong>Seeing only an empty &ldquo;Your files&rdquo; table with no &ldquo;Create folder&rdquo; row?</strong>{' '}
                  That is an <strong>old</strong> JavaScript bundle. Redeploy the site from the latest <code className="text-xs bg-amber-100/90 px-1.5 py-0.5 rounded">main</code> (run <code className="text-xs bg-amber-100/90 px-1.5 py-0.5 rounded">npm run build</code>), then hard-refresh. No <code className="text-xs bg-amber-100/90 px-1.5 py-0.5 rounded">portal/</code> in Spaces until an upload returns 200 for presign, PUT, and <code className="text-xs bg-amber-100/90 px-1.5 py-0.5 rounded">/complete</code> (needs <code className="text-xs bg-amber-100/90 px-1.5 py-0.5 rounded">DO_SPACES_*</code> on the API and DB).
                </p>
                <p className="text-xs mt-2 text-amber-900/90">
                  This page build id: <code className="text-xs font-mono bg-amber-100/90 px-1 rounded">{FILE_REPO_UI_ID}</code> — you should also see {''}
                  <strong>All files / This folder / Create folder</strong> in the layout below.
                </p>
              </div>
              {legacyListMode && (
                <p className="text-sm text-text border border-border bg-background rounded-md px-3 py-2">
                  <strong>Basic file list</strong> — the API did not return folder routes (deploy <code className="text-xs px-1 bg-background">api/server</code> from the same repo, then <code className="text-xs px-1 bg-background">npm run db:ensure-portal</code>).
                </p>
              )}
              {!legacyListMode && (
              <nav
                className="text-sm text-text flex flex-wrap items-center gap-1"
                aria-label="Folder path"
              >
                {breadcrumbs.map((c, i) => {
                  const isLast = i === breadcrumbs.length - 1
                  return (
                    <span key={c.id === 'root' ? 'root' : c.id} className="inline-flex items-center gap-1">
                      {i > 0 && <span className="text-text-light" aria-hidden>/</span>}
                      {isLast
                        ? (
                        <span className="font-semibold text-primary-dark" aria-current="page">
                          {c.name}
                        </span>
                          )
                        : (
                        <button
                          type="button"
                          onClick={() => { goBreadcrumb(i) }}
                          className="text-accent font-medium hover:underline"
                        >
                          {c.name}
                        </button>
                          )}
                    </span>
                  )
                })}
              </nav>
              )}

              <div className="bg-white p-6 rounded-lg border border-border shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <h2 className="text-lg font-semibold text-primary-dark">
                    {legacyListMode ? 'All your files' : 'This folder'}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end" aria-live="polite">
                    {loading && <span className="text-sm text-text-light">Loading&hellip;</span>}
                    {!loading && err && (
                      <button
                        type="button"
                        className="text-sm font-medium text-accent hover:underline"
                        onClick={() => { void load() }}
                      >
                        Retry
                      </button>
                    )}
                  </div>
                </div>

                {hasAccess && !legacyListMode && (
                  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 mb-6 p-3 rounded-md border border-dashed border-border bg-background/80">
                    <div className="flex flex-1 min-w-[12rem] gap-2">
                      <label htmlFor="new-folder-name" className="sr-only">
                        New folder name
                      </label>
                      <input
                        id="new-folder-name"
                        type="text"
                        value={newFolderName}
                        onChange={(e) => { setNewFolderName(e.target.value) }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { void onCreateFolder() }
                        }}
                        placeholder="New folder name"
                        className="flex-1 min-w-0 px-3 py-2 border border-border rounded-md text-sm"
                        disabled={folderSubmitting}
                      />
                      <button
                        type="button"
                        className="btn btn--secondary text-sm py-2 px-3"
                        disabled={folderSubmitting || !newFolderName.trim()}
                        onClick={() => { void onCreateFolder() }}
                      >
                        {folderSubmitting ? 'Creating…' : 'Create folder'}
                      </button>
                    </div>
                    <p className="text-xs text-text-light w-full sm:w-auto self-center sm:pl-2">
                      Files you upload are placed in the folder shown in the path above.
                    </p>
                  </div>
                )}

                {uploading && (
                  <div
                    className="text-sm text-text border border-border bg-background rounded-md px-3 py-2 mb-4"
                    role="status"
                  >
                    Uploading and saving your file(s). This can take a moment for larger files.
                  </div>
                )}

                {err && (
                  <p
                    className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md p-3 mb-4"
                    role="alert"
                  >
                    {err}
                  </p>
                )}
                {successMessage && !err && (
                  <p
                    className="text-sm text-primary-dark bg-primary-dark/5 border border-border rounded-md p-3 mb-4"
                    role="status"
                  >
                    {successMessage}
                  </p>
                )}

                {!legacyListMode && folders.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-text mb-2">Folders</h3>
                    <ul className="border border-border rounded-md divide-y divide-border">
                      {folders.map((f) => (
                        <li
                          key={f.id}
                          className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-text-light shrink-0" aria-hidden>
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 7a2 2 0 012-2h5l2 2h7a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
                                />
                              </svg>
                            </span>
                            <span className="font-medium text-text truncate">{f.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              className="text-sm font-medium text-accent hover:underline"
                              onClick={() => { openFolder(f) }}
                            >
                              Open
                            </button>
                            <button
                              type="button"
                              className="text-sm font-medium text-text-light hover:text-red-700"
                              disabled={deletingFolderId === f.id}
                              onClick={() => { void onDeleteFolder(f) }}
                            >
                              {deletingFolderId === f.id ? 'Removing…' : 'Delete'}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <h3 className="text-sm font-semibold text-text mb-2">Files</h3>
                <div className="overflow-x-auto -mx-2 sm:mx-0">
                  <table className="w-full min-w-[32rem] text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-text-light text-xs font-semibold uppercase tracking-wide">
                        <th className="px-2 py-2 w-[40%] sm:w-[36%]">Name</th>
                        <th className="px-2 py-2 w-[20%] hidden sm:table-cell">Size</th>
                        <th className="px-2 py-2 w-[18%] hidden md:table-cell">Added</th>
                        <th className="px-2 py-2 w-[24%] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading && files.length === 0 && folders.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-2 py-6 text-text-light">
                            Fetching&hellip;
                          </td>
                        </tr>
                      )}
                      {!loading && files.length === 0 && !err && (
                        <tr>
                          <td colSpan={4} className="px-2 py-6 text-text-light">
                            <p className="mb-1 font-medium text-text">No files in this folder</p>
                            <p>
                              Use <strong>Upload file(s) here</strong> to add files to this location, or create a
                              subfolder above.
                            </p>
                          </td>
                        </tr>
                      )}
                      {!loading && files.length === 0 && err && (
                        <tr>
                          <td colSpan={4} className="px-2 py-4 text-text-light text-sm">
                            The list could not be loaded. Fix the error, then use Retry, or re-open this page.
                          </td>
                        </tr>
                      )}
                      {files.map((f) => (
                        <tr key={f.id} className="border-b border-border last:border-0 align-top">
                          <td className="px-2 py-3">
                            <p className="font-medium text-text break-words">{f.file_name}</p>
                            <p className="text-xs text-text-light mt-1 sm:hidden">
                              {formatBytes(f.size_bytes)} · {new Date(f.created_at).toLocaleDateString()}
                            </p>
                          </td>
                          <td className="px-2 py-3 text-text hidden sm:table-cell">
                            {formatBytes(f.size_bytes)}
                            {f.mime && <span className="block text-xs text-text-light mt-0.5">{f.mime}</span>}
                          </td>
                          <td className="px-2 py-3 text-text-light hidden md:table-cell whitespace-nowrap">
                            {new Date(f.created_at).toLocaleString()}
                          </td>
                          <td className="px-2 py-3 text-right">
                            <button
                              type="button"
                              className="text-sm font-medium text-accent hover:underline px-1 py-0.5"
                              onClick={() => { void onDownload(f.id) }}
                            >
                              Download
                            </button>
                            <span className="text-text-light mx-1" aria-hidden>·</span>
                            <button
                              type="button"
                              className="text-sm font-medium text-text-light hover:text-red-700 px-1 py-0.5"
                              disabled={deletingId === f.id}
                              onClick={() => { void onDelete(f.id) }}
                            >
                              {deletingId === f.id ? 'Removing…' : 'Remove'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </ClientPortalShell>
    </>
  )
}

export default FileRepository
