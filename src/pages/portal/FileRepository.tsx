import { type ChangeEventHandler, FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import SEO from '../../components/SEO'
import ClientPortalShell from '../../components/ClientPortalShell'
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

type FoldersListResponse = {
  homeFolder?: PortalFolder
  folders: PortalFolder[]
}

type FilesListResponse = {
  homeFolder?: PortalFolder
  files: PortalFile[]
}

type FlatFoldersResponse = {
  homeFolder: PortalFolder
  folders: PortalFolder[]
  /** False when the API is missing DO Spaces / S3 env; uploads return 503 until configured. */
  objectStorageReady?: boolean
  /** From API: human-readable names of env vars the API process is still missing. */
  objectStorageMissing?: string[]
}

function folderMap (rows: PortalFolder[]) {
  return new Map(rows.map((r) => [r.id, r] as const))
}

function pathLabel (folderId: string, m: ReturnType<typeof folderMap>): string {
  const parts: string[] = []
  let id: string | null = folderId
  for (let i = 0; i < 64 && id; i++) {
    const f = m.get(id)
    if (!f) break
    parts.unshift(f.name)
    id = f.parent_id
  }
  return parts.join(' / ')
}

const FileRepository: FC = () => {
  const { getToken } = useAuth()
  const [files, setFiles] = useState<PortalFile[]>([])
  const [folders, setFolders] = useState<PortalFolder[]>([])
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([{ id: 'root', name: 'My files' }])
  const [currentFolderId, setCurrentFolderId] = useState<'root' | string>('root')
  const [homeName, setHomeName] = useState('My files')
  const [homeId, setHomeId] = useState<string | null>(null)
  const [allFolders, setAllFolders] = useState<PortalFolder[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null)
  const [movingId, setMovingId] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [folderSubmitting, setFolderSubmitting] = useState(false)
  const [objectStorageReady, setObjectStorageReady] = useState(true)
  const [objectStorageMissing, setObjectStorageMissing] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const parentQuery = currentFolderId === 'root' ? 'root' : currentFolderId

  const fMap = useMemo(() => folderMap(allFolders), [allFolders])
  const homeRow = useMemo(
    () => (homeId ? fMap.get(homeId) ?? { id: homeId, name: homeName, parent_id: null, created_at: '' } : null),
    [fMap, homeId, homeName]
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const flatP = portalFetch<FlatFoldersResponse>('/v1/folders/flat', getToken)
      const [fr, fl, flat] = await Promise.all([
        portalFetch<FoldersListResponse>(`/v1/folders?parentId=${parentQuery}`, getToken),
        portalFetch<FilesListResponse>(`/v1/files?folderId=${parentQuery}`, getToken),
        flatP
      ])
      if (flat.homeFolder) {
        setHomeName(flat.homeFolder.name)
        setHomeId(flat.homeFolder.id)
      }
      setAllFolders(Array.isArray(flat.folders) ? flat.folders : [])
      setObjectStorageReady(flat.objectStorageReady !== false)
      setObjectStorageMissing(
        Array.isArray(flat.objectStorageMissing) ? flat.objectStorageMissing : []
      )
      if (fr.homeFolder) {
        setHomeName(fr.homeFolder.name)
        setHomeId(fr.homeFolder.id)
      }
      if (fl.homeFolder) {
        setHomeName(fl.homeFolder.name)
        setHomeId(fl.homeFolder.id)
      }
      setFolders(Array.isArray(fr.folders) ? fr.folders : [])
      setFiles(Array.isArray(fl.files) ? fl.files : [])
      setErr(null)
    } catch (e) {
      setSuccessMessage(null)
      setErr(
        e instanceof Error
          ? e.message
          : 'We couldn’t load your file library. Please try again in a moment.'
      )
    } finally {
      setLoading(false)
    }
  }, [getToken, parentQuery])

  useEffect(() => {
    void load()
  }, [load])

  const putOne = async (file: File, inFolder: 'root' | string): Promise<PortalFile> => {
    const completeViaApiFallback = async (): Promise<PortalFile> => {
      const bytes = new Uint8Array(await file.arrayBuffer())
      let binary = ''
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
      const dataBase64 = btoa(binary)
      const body: Record<string, unknown> = {
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        dataBase64
      }
      if (inFolder !== 'root') body.folderId = inFolder
      const { file: record } = await portalFetch<{ file: PortalFile }>('/v1/files/upload-via-api', getToken, {
        method: 'POST',
        body: JSON.stringify(body)
      })
      return record
    }

    if (import.meta.env.DEV) {
      console.info('[FileRepository] presign-put for', { name: file.name, size: file.size, type: file.type || '(empty—using octet-stream)' })
    }
    let pres: { uploadUrl: string; storageKey: string }
    try {
      pres = await portalFetch<{
        uploadUrl: string
        storageKey: string
      }>('/v1/files/presign-put', getToken, {
        method: 'POST',
        body: JSON.stringify({ fileName: file.name, contentType: file.type || 'application/octet-stream' })
      })
    } catch (e) {
      console.error('[FileRepository] /v1/files/presign-put failed', e)
      // If presign fails, try API-side upload fallback so users can still complete uploads.
      return await completeViaApiFallback()
    }
    if (import.meta.env.DEV) {
      console.info('[FileRepository] PUT to Spaces/S3 (browser → storage)…', pres.storageKey)
    }
    let put: Response
    try {
      put = await fetch(pres.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' }
      })
    } catch (e) {
      console.error('[FileRepository] fetch(PUT) to presigned URL failed', e)
      return await completeViaApiFallback()
    }
    if (!put.ok) {
      const detail = (await put.text().catch(() => '')).trim().slice(0, 400)
      console.error('[FileRepository] PUT to storage not OK', put.status, detail)
      return await completeViaApiFallback()
    }
    if (import.meta.env.DEV) {
      console.info('[FileRepository] Telling API /v1/files/complete to save DB row…')
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
    if (import.meta.env.DEV) {
      console.info('[FileRepository] File saved in library', { id: record.id, name: record.file_name })
    }
    return record
  }

  const onUpload: ChangeEventHandler<HTMLInputElement> = async (ev) => {
    const list = ev.target.files
    ev.target.value = ''
    if (!list?.length) return
    if (!objectStorageReady) {
      setErr('File storage is not configured on the server yet (no DigitalOcean Spaces / S3 keys). The API must have DO_SPACES_* set. See api/server/.env.example.')
      return
    }
    if (import.meta.env.DEV) {
      console.info(`[FileRepository] Starting upload: ${String(list.length)} file(s) → folder ${String(currentFolderId)}`)
    }
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
      console.error('[FileRepository] Upload flow failed', e)
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

  const onMove = async (file: PortalFile, nextFolder: string) => {
    if (!nextFolder) return
    if (!homeId) {
      setErr('Still loading your folders. Please try again.')
      return
    }
    const asUuid = (file.folder_id && String(file.folder_id)) || homeId
    if (nextFolder === 'root' && asUuid === homeId) return
    if (nextFolder !== 'root' && nextFolder === asUuid) return
    setErr(null)
    setSuccessMessage(null)
    setMovingId(file.id)
    try {
      await portalFetch<{ file: PortalFile }>(`/v1/files/${file.id}`, getToken, {
        method: 'PATCH',
        body: JSON.stringify({ folderId: nextFolder === 'root' ? 'root' : nextFolder })
      })
      setSuccessMessage('File moved.')
      void load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not move file')
    } finally {
      setMovingId(null)
    }
  }

  const onRename = async (f: PortalFile) => {
    const n = window.prompt('Rename file (only the name shown in your library changes)', f.file_name)
    if (n == null) return
    const trimmed = n.trim()
    if (!trimmed) {
      setErr('Name cannot be empty.')
      return
    }
    if (trimmed === f.file_name) return
    setErr(null)
    setSuccessMessage(null)
    setRenamingId(f.id)
    try {
      await portalFetch<{ file: PortalFile }>(`/v1/files/${f.id}`, getToken, {
        method: 'PATCH',
        body: JSON.stringify({ fileName: trimmed })
      })
      setSuccessMessage('File name updated.')
      void load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not rename file')
    } finally {
      setRenamingId(null)
    }
  }

  const moveOptions = useCallback(
    (file: PortalFile) => {
      if (!homeRow || !homeId) {
        return [] as { value: string; label: string }[]
      }
      const cur = file.folder_id || homeId
      const m = fMap
      const out: { value: string; label: string }[] = []
      if (cur !== homeId) {
        out.push({ value: 'root', label: homeRow.name })
      }
      for (const fold of allFolders) {
        if (fold.id === homeId) continue
        if (fold.id === cur) continue
        out.push({ value: fold.id, label: pathLabel(fold.id, m) })
      }
      return out.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }))
    },
    [allFolders, fMap, homeRow, homeId]
  )

  const openFolder = (f: PortalFolder) => {
    setCurrentFolderId(f.id)
    setBreadcrumbs((b) => [...b, { id: f.id, name: f.name }])
  }

  const goBreadcrumb = (index: number) => {
    const c = breadcrumbs[index]
    if (!c) return
    if (c.id === 'root') {
      setCurrentFolderId('root')
      setBreadcrumbs([{ id: 'root', name: homeName }])
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
        `Delete the folder “${f.name}” and everything inside? Files are moved to your main folder first; this only removes the folder.`
      )
    ) {
      return
    }
    setErr(null)
    setSuccessMessage(null)
    setDeletingFolderId(f.id)
    try {
      await portalFetch(`/v1/folders/${f.id}`, getToken, { method: 'DELETE' })
      const idx = breadcrumbs.findIndex((b) => b.id === f.id)
      if (idx >= 0) {
        const at = Math.max(0, idx - 1)
        const t = breadcrumbs[at]
        if (t?.id === 'root') {
          setCurrentFolderId('root')
          setBreadcrumbs([{ id: 'root', name: homeName }])
        } else if (t) {
          setCurrentFolderId(t.id)
          setBreadcrumbs(breadcrumbs.slice(0, idx))
        }
      }
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
        description="Secure document storage and organization in the Axiom Client Portal."
        canonical="/portal/files"
      />
      <ClientPortalShell>
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-primary-dark">File Repository</h1>
            </div>
            <div>
              <input
                id="portal-file-repo-input"
                ref={fileInputRef}
                type="file"
                className="sr-only"
                multiple
                onChange={onUpload}
                disabled={uploading || !objectStorageReady}
                tabIndex={-1}
              />
              <button
                type="button"
                className="btn btn--primary text-sm py-2 px-4"
                disabled={uploading || !objectStorageReady}
                onClick={() => {
                  if (!objectStorageReady) {
                    setErr('Configure DigitalOcean Spaces on the API (DO_SPACES_*). See the yellow notice on this page and api/server/.env.example.')
                    return
                  }
                  fileInputRef.current?.click()
                }}
                title={!objectStorageReady ? 'Object storage (DO Spaces) is not configured on the server' : 'Choose files to upload'}
              >
                {uploading ? 'Uploading…' : 'Upload file(s) here'}
              </button>
            </div>
          </div>
          <p className="text-text-light text-sm mb-4 max-w-2xl">
            Your <strong>My files</strong> folder is created for you when you use the client portal. Add subfolders, upload
            and rename files, move items between your folders, or download and remove them. Only you can see your
            content.
          </p>
          {!loading && !objectStorageReady && (
            <div
              className="mb-4 p-4 rounded-lg border-2 border-amber-500/80 bg-amber-50 text-amber-950 text-sm max-w-3xl"
              role="alert"
            >
              <p className="font-semibold">Uploads are turned off: object storage is not configured on the API</p>
              {objectStorageMissing.length > 0 && (
                <p className="mt-2 font-medium">
                  The API process reports that these are still empty or missing:{' '}
                  {objectStorageMissing.map((m, i) => (
                    <span key={m}>
                      {i > 0 ? ' · ' : null}
                      <code className="text-xs bg-white/80 px-1 rounded break-all">{m}</code>
                    </span>
                  ))}
                </p>
              )}
              <p className="mt-2">
                The server must have a DigitalOcean Space (S3) connection. Set on the <strong>API</strong> (not the Vite app):
                <code className="mx-1 text-xs bg-white/80 px-1 rounded">DO_SPACES_ENDPOINT</code>,
                <code className="mx-1 text-xs bg-white/80 px-1 rounded">DO_SPACES_BUCKET</code>,
                <code className="mx-1 text-xs bg-white/80 px-1 rounded">DO_SPACES_KEY</code>,
                <code className="mx-1 text-xs bg-white/80 px-1 rounded">DO_SPACES_SECRET</code>
                (see <code className="text-xs">api/server/.env.example</code>).
                Redeploy the API and confirm startup logs: <em>Object storage: configured</em>.
                For browser uploads, add <strong>CORS</strong> on the Space: allow your site origin, methods{' '}
                <code className="text-xs">PUT</code>, <code className="text-xs">GET</code>, <code className="text-xs">HEAD</code>.
              </p>
              <p className="mt-2 text-xs">
                <strong>Admins:</strong> use the step-by-step guide in the project:{' '}
                <code className="bg-white/80 px-1 rounded">api/server/PORTAL_FILE_STORAGE_SETUP.md</code>
              </p>
            </div>
          )}

          <div className="space-y-4">
            <nav
              className="text-sm text-text flex flex-wrap items-center gap-1"
              aria-label="Folder path"
            >
              {breadcrumbs.map((c, i) => {
                const isLast = i === breadcrumbs.length - 1
                const label = c.id === 'root' ? homeName : c.name
                return (
                  <span key={c.id === 'root' ? 'root' : c.id} className="inline-flex items-center gap-1">
                    {i > 0 && <span className="text-text-light" aria-hidden>/</span>}
                    {isLast
                      ? (
                      <span className="font-semibold text-primary-dark" aria-current="page">
                        {label}
                      </span>
                        )
                      : (
                      <button
                        type="button"
                        onClick={() => { goBreadcrumb(i) }}
                        className="text-accent font-medium hover:underline"
                      >
                        {label}
                      </button>
                        )}
                  </span>
                )
              })}
            </nav>

            <div className="bg-white p-6 rounded-lg border border-border shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <h2 className="text-lg font-semibold text-primary-dark">This folder</h2>
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
                    placeholder="New subfolder name"
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
                  Subfolders are created in the path shown above (under your main folder or another subfolder).
                </p>
              </div>

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

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-text mb-2">Subfolders</h3>
                {folders.length > 0
                  ? (
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
                    )
                  : !loading
                    ? (
                    <p className="text-sm text-text-light py-2">No subfolders here yet. Add one with Create folder above.</p>
                      )
                    : null}
              </div>

              <h3 className="text-sm font-semibold text-text mb-2">Files</h3>
              <div className="overflow-x-auto -mx-2 sm:mx-0">
                <table className="w-full min-w-[32rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-text-light text-xs font-semibold uppercase tracking-wide">
                      <th className="px-2 py-2 w-[32%] sm:w-[30%]">Name</th>
                      <th className="px-2 py-2 w-[12%] hidden sm:table-cell">Size</th>
                      <th className="px-2 py-2 w-[12%] hidden md:table-cell">Added</th>
                      <th className="px-2 py-2 w-[20%] hidden lg:table-cell">Move to</th>
                      <th className="px-2 py-2 w-[20%] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && files.length === 0 && folders.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-2 py-6 text-text-light">
                          Fetching&hellip;
                        </td>
                      </tr>
                    )}
                    {!loading && files.length === 0 && !err && (
                      <tr>
                        <td colSpan={5} className="px-2 py-6 text-text-light">
                          <p className="mb-1 font-medium text-text">No files in this folder</p>
                          <p>
                            Use <strong>Upload file(s) here</strong> to add files, or add a subfolder first.
                          </p>
                        </td>
                      </tr>
                    )}
                    {!loading && files.length === 0 && err && (
                      <tr>
                        <td colSpan={5} className="px-2 py-4 text-text-light text-sm">
                          The list could not be loaded. Fix the error, then use Retry, or re-open this page.
                        </td>
                      </tr>
                    )}
                    {files.map((f) => {
                      const opts = moveOptions(f)
                      return (
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
                          <td className="px-2 py-3 hidden lg:table-cell min-w-[10rem]">
                            {opts.length > 0
                              ? (
                              <span className="block">
                                <label className="sr-only" htmlFor={`move-${f.id}`}>
                                  Move file
                                </label>
                                <select
                                  id={`move-${f.id}`}
                                  className="w-full max-w-full text-xs sm:text-sm border border-border rounded-md px-2 py-1.5 bg-white"
                                  value=""
                                  disabled={movingId === f.id}
                                  onChange={(e) => {
                                    const v = e.target.value
                                    e.currentTarget.value = ''
                                    void onMove(f, v)
                                  }}
                                >
                                  <option value="" disabled>Move to…</option>
                                  {opts.map((o) => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                  ))}
                                </select>
                              </span>
                                )
                              : <span className="text-text-light text-xs">—</span>}
                          </td>
                          <td className="px-2 py-3 text-right">
                            <div className="lg:hidden mb-1">
                              {opts.length > 0 && (
                                <select
                                  className="w-full text-xs border border-border rounded-md px-2 py-1 mb-1"
                                  value=""
                                  disabled={movingId === f.id}
                                  onChange={(e) => {
                                    const v = e.target.value
                                    e.currentTarget.value = ''
                                    void onMove(f, v)
                                  }}
                                >
                                  <option value="" disabled>Move to…</option>
                                  {opts.map((o) => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                            <div className="flex flex-wrap justify-end gap-x-1">
                              <button
                                type="button"
                                className="text-sm font-medium text-accent hover:underline px-1 py-0.5"
                                onClick={() => { void onDownload(f.id) }}
                              >
                                Download
                              </button>
                              <span className="text-text-light" aria-hidden>·</span>
                              <button
                                type="button"
                                className="text-sm font-medium text-text-light hover:text-primary-dark px-1 py-0.5"
                                disabled={renamingId === f.id}
                                onClick={() => { void onRename(f) }}
                              >
                                Rename
                              </button>
                              <span className="text-text-light" aria-hidden>·</span>
                              <button
                                className="text-sm font-medium text-text-light hover:text-red-700 px-1 py-0.5"
                                disabled={deletingId === f.id}
                                onClick={() => { void onDelete(f.id) }}
                              >
                                {deletingId === f.id ? 'Removing…' : 'Remove'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </ClientPortalShell>
    </>
  )
}

export default FileRepository
