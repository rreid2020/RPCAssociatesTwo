import { Router } from 'express'
import { getClerkUser, isStaff } from '../middleware/portalAuth.js'
import { buildPortalObjectKey, deleteObject, getObjectStorageConfigDiagnostics, presignGet, presignPut, putObjectBytes } from '../services/portalS3.js'

const MAX_UPLOAD_BYTES = parseInt(process.env.PORTAL_MAX_UPLOAD_BYTES || String(100 * 1024 * 1024), 10)

const folderNameRe = /^[^/\\<>:|?"*]+$/u

const HOME_ROOT_NAME = 'My files'

/**
 * TaxGPT’s `taxgpt.users` table is a mirror of Clerk (optional; used by other features).
 * Portal data uses `clerk_user_id` text on portal_* tables and does not FK to `users.id`.
 * We upsert here so each active portal user has a row for reporting / admin tools.
 */
async function mirrorClerkUserToUsersTable (pool, clerkUserId) {
  try {
    await pool.query(
      `INSERT INTO taxgpt.users (id, clerk_user_id, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, now(), now())
       ON CONFLICT (clerk_user_id) DO UPDATE SET updated_at = now()`,
      [clerkUserId]
    )
  } catch (e) {
    if (e && e.code === '42P01') {
      return
    }
    if (e && e.code === '42703') {
      try {
        await pool.query(
          `INSERT INTO taxgpt.users (id, clerk_user_id, created_at)
           VALUES (gen_random_uuid(), $1, now())
           ON CONFLICT (clerk_user_id) DO NOTHING`,
          [clerkUserId]
        )
        return
      } catch (e2) {
        if (e2 && e2.code === '42P01') return
        console.warn('mirrorClerkUserToUsersTable (fallback):', e2)
        return
      }
    }
    console.warn('mirrorClerkUserToUsersTable:', e)
  }
}

/**
 * One top-level (parent_id null) “home” folder per user. Creates or consolidates, migrates
 * unfiled (folder_id null) into home. Returns the home row.
 */
export async function ensureUserHomeFolder (pool, userId) {
  const { rows: roots } = await pool.query(
    'SELECT * FROM taxgpt.portal_folders WHERE clerk_user_id = $1 AND parent_id IS NULL ORDER BY created_at ASC',
    [userId]
  )
  let home
  if (!roots.length) {
    try {
      const { rows: inserted } = await pool.query(
        `INSERT INTO taxgpt.portal_folders (clerk_user_id, parent_id, name, created_at)
         VALUES ($1, NULL, $2, now()) RETURNING *`,
        [userId, HOME_ROOT_NAME]
      )
      home = inserted[0]
    } catch (e) {
      // Concurrent first requests can race two INSERTs; the unique (sibling name) index rejects the loser.
      const msg = e && e.message != null ? String(e.message) : ''
      const isUnique = (e && e.code === '23505') || (msg.length > 0 && /unique|duplicate/i.test(msg))
      if (!isUnique) throw e
      const { rows: r2 } = await pool.query(
        'SELECT * FROM taxgpt.portal_folders WHERE clerk_user_id = $1 AND parent_id IS NULL ORDER BY created_at ASC',
        [userId]
      )
      if (!r2[0]) throw e
      home = r2[0]
    }
  } else {
    home = roots[0]
    if (roots.length > 1) {
      for (let i = 1; i < roots.length; i++) {
        try {
          await pool.query(
            'UPDATE taxgpt.portal_folders SET parent_id = $1::uuid WHERE id = $2::uuid AND clerk_user_id = $3',
            [home.id, roots[i].id, userId]
          )
        } catch (e) {
          console.error('reparent extra root folder', e)
        }
      }
    }
  }
  await pool.query(
    'UPDATE taxgpt.portal_client_files SET folder_id = $1::uuid WHERE clerk_user_id = $2 AND folder_id IS NULL',
    [home.id, userId]
  )
  await mirrorClerkUserToUsersTable(pool, userId)
  return home
}

export function createPortalRouter (pool) {
  const r = Router()

  r.get('/v1/dashboard', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const { userId } = session
    const now = new Date()
    const in90 = new Date(now)
    in90.setDate(in90.getDate() + 90)
    try {
      const [openC] = await pool.query(
        `SELECT count(*)::int AS c FROM taxgpt.portal_open_items
         WHERE clerk_user_id = $1 AND status = 'open'`,
        [userId]
      )
      const [dlC] = await pool.query(
        `SELECT count(*)::int AS c FROM taxgpt.portal_deadlines
         WHERE clerk_user_id = $1 AND due_at >= $2 AND due_at <= $3`,
        [userId, now, in90]
      )
      const [projC] = await pool.query(
        'SELECT count(*)::int AS c FROM taxgpt.portal_checklists WHERE clerk_user_id = $1',
        [userId]
      )
      const { rows: openItems } = await pool.query(
        `SELECT id, title, description, status, due_at, updated_at
         FROM taxgpt.portal_open_items WHERE clerk_user_id = $1
         ORDER BY updated_at DESC LIMIT 8`,
        [userId]
      )
      const { rows: deadlines } = await pool.query(
        `SELECT id, title, due_at, category FROM taxgpt.portal_deadlines
         WHERE clerk_user_id = $1 ORDER BY due_at ASC LIMIT 10`,
        [userId]
      )
      const { rows: recentActivity } = await pool.query(
        `SELECT id, kind, title, body, created_at FROM taxgpt.portal_activity
         WHERE clerk_user_id = $1 ORDER BY created_at DESC LIMIT 15`,
        [userId]
      )
      res.json({
        counts: {
          openItems: openC?.rows[0]?.c ?? 0,
          upcomingDeadlines: dlC?.rows[0]?.c ?? 0,
          activeProjects: projC?.rows[0]?.c ?? 0
        },
        openItems,
        deadlines,
        recentActivity
      })
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Dashboard load failed' })
    }
  })

  r.patch('/v1/open-items/:id', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const status = req.body?.status
    if (status !== 'open' && status !== 'done') {
      return res.status(400).json({ error: 'status must be open or done' })
    }
    const { id } = req.params
    const { rowCount } = await pool.query(
      `UPDATE taxgpt.portal_open_items SET status = $1, updated_at = now()
       WHERE id = $2::uuid AND clerk_user_id = $3`,
      [status, id, session.userId]
    )
    if (!rowCount) return res.status(404).json({ error: 'Not found' })
    res.json({ ok: true })
  })

  r.post('/v1/staff/open-items', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    if (!isStaff(session.userId)) return res.status(403).json({ error: 'Forbidden' })
    const { targetClerkUserId, title, description, dueAt } = req.body || {}
    if (!targetClerkUserId || !title) {
      return res.status(400).json({ error: 'targetClerkUserId and title required' })
    }
    const { rows } = await pool.query(
      `INSERT INTO taxgpt.portal_open_items
       (clerk_user_id, title, description, status, due_at, created_at, updated_at)
       VALUES ($1, $2, $3, 'open', $4, now(), now()) RETURNING *`,
      [targetClerkUserId, title, description || null, dueAt ? new Date(dueAt) : null]
    )
    await pool.query(
      `INSERT INTO taxgpt.portal_activity (clerk_user_id, kind, title, body, created_at)
       VALUES ($1, 'item', $2, $3, now())`,
      [targetClerkUserId, `New task: ${title}`, description || null]
    )
    res.json({ item: rows[0] })
  })

  r.post('/v1/staff/activity', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    if (!isStaff(session.userId)) return res.status(403).json({ error: 'Forbidden' })
    const { targetClerkUserId, kind, title, body } = req.body || {}
    if (!targetClerkUserId || !title) {
      return res.status(400).json({ error: 'targetClerkUserId and title required' })
    }
    const { rows } = await pool.query(
      `INSERT INTO taxgpt.portal_activity
       (clerk_user_id, kind, title, body, created_at)
       VALUES ($1, $2, $3, $4, now()) RETURNING *`,
      [targetClerkUserId, kind && String(kind).length ? String(kind) : 'note', title, body || null]
    )
    res.json({ activity: rows[0] })
  })

  r.post('/v1/staff/deadlines', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    if (!isStaff(session.userId)) return res.status(403).json({ error: 'Forbidden' })
    const { targetClerkUserId, title, dueAt, category } = req.body || {}
    if (!targetClerkUserId || !title || !dueAt) {
      return res.status(400).json({ error: 'targetClerkUserId, title, dueAt required' })
    }
    const { rows } = await pool.query(
      `INSERT INTO taxgpt.portal_deadlines (clerk_user_id, title, due_at, category, created_at)
       VALUES ($1, $2, $3, $4, now()) RETURNING *`,
      [targetClerkUserId, title, new Date(dueAt), category || null]
    )
    res.json({ deadline: rows[0] })
  })

  r.get('/v1/folders/flat', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    try {
      const home = await ensureUserHomeFolder(pool, session.userId)
      const { rows } = await pool.query(
        'SELECT id, parent_id, name, created_at FROM taxgpt.portal_folders WHERE clerk_user_id = $1 ORDER BY lower(btrim(name))',
        [session.userId]
      )
      const diag = getObjectStorageConfigDiagnostics()
      res.json({
        homeFolder: home,
        folders: rows,
        objectStorageReady: diag.objectStorageReady,
        objectStorageMissing: diag.objectStorageMissing
      })
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Could not list folders' })
    }
  })

  r.get('/v1/folders', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const parentParam = req.query.parentId
    if (!parentParam || parentParam === 'root') {
      try {
        const home = await ensureUserHomeFolder(pool, session.userId)
        const { rows } = await pool.query(
          'SELECT * FROM taxgpt.portal_folders WHERE clerk_user_id = $1 AND parent_id = $2::uuid ORDER BY lower(btrim(name))',
          [session.userId, home.id]
        )
        return res.json({ homeFolder: home, folders: rows })
      } catch (e) {
        console.error(e)
        return res.status(500).json({ error: 'Could not list folders' })
      }
    }
    const { rows: parent } = await pool.query(
      'SELECT id FROM taxgpt.portal_folders WHERE id = $1::uuid AND clerk_user_id = $2',
      [String(parentParam), session.userId]
    )
    if (!parent[0]) return res.status(404).json({ error: 'Parent folder not found' })
    const { rows } = await pool.query(
      'SELECT * FROM taxgpt.portal_folders WHERE clerk_user_id = $1 AND parent_id = $2::uuid ORDER BY lower(btrim(name))',
      [session.userId, parent[0].id]
    )
    return res.json({ folders: rows })
  })

  r.post('/v1/folders', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const name = (req.body?.name && String(req.body.name).trim()) || ''
    const { parentId } = req.body || {}
    if (name.length < 1) return res.status(400).json({ error: 'name required' })
    if (name.length > 199) return res.status(400).json({ error: 'name too long' })
    if (!folderNameRe.test(name)) {
      return res.status(400).json({ error: 'Folder name cannot include /, \\, or other reserved characters' })
    }
    const home = await ensureUserHomeFolder(pool, session.userId)
    let pId = home.id
    if (parentId && String(parentId) !== 'root') {
      const { rows: pr } = await pool.query(
        'SELECT id FROM taxgpt.portal_folders WHERE id = $1::uuid AND clerk_user_id = $2',
        [String(parentId), session.userId]
      )
      if (!pr[0]) return res.status(400).json({ error: 'Parent folder not found' })
      pId = pr[0].id
    }
    try {
      const { rows } = await pool.query(
        `INSERT INTO taxgpt.portal_folders (clerk_user_id, parent_id, name, created_at)
         VALUES ($1, $2, $3, now()) RETURNING *`,
        [session.userId, pId, name]
      )
      await pool.query(
        `INSERT INTO taxgpt.portal_activity (clerk_user_id, kind, title, created_at)
         VALUES ($1, 'folder', $2, now())`,
        [session.userId, `Created folder: ${name}`]
      )
      res.json({ folder: rows[0] })
    } catch (e) {
      const msg = e && e.message != null ? String(e.message) : ''
      const isUniqueViolation =
        (e && e.code === '23505') || (msg.length > 0 && /unique|duplicate/i.test(msg))
      if (isUniqueViolation) {
        return res.status(409).json({ error: 'A folder with that name already exists here' })
      }
      console.error('POST /v1/folders', e)
      res.status(500).json({ error: 'Could not create folder' })
    }
  })

  r.delete('/v1/folders/:id', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const home = await ensureUserHomeFolder(pool, session.userId)
    if (String(req.params.id) === String(home.id)) {
      return res.status(400).json({ error: 'The main “My files” folder cannot be deleted' })
    }
    const { rows: folder } = await pool.query(
      'SELECT id, name FROM taxgpt.portal_folders WHERE id = $1::uuid AND clerk_user_id = $2',
      [req.params.id, session.userId]
    )
    if (!folder[0]) return res.status(404).json({ error: 'Not found' })
    const { rows: inTree } = await pool.query(
      `WITH RECURSIVE t AS (
         SELECT id FROM taxgpt.portal_folders WHERE id = $1::uuid AND clerk_user_id = $2
         UNION ALL
         SELECT f.id FROM taxgpt.portal_folders f INNER JOIN t ON f.parent_id = t.id
         WHERE f.clerk_user_id = $2
       ) SELECT id FROM t`,
      [req.params.id, session.userId]
    )
    const treeIds = inTree.map((r) => r.id)
    if (treeIds.length) {
      await pool.query(
        `UPDATE taxgpt.portal_client_files
         SET folder_id = $1::uuid
         WHERE clerk_user_id = $2 AND folder_id = ANY($3::uuid[])`,
        [home.id, session.userId, treeIds]
      )
    }
    await pool.query('DELETE FROM taxgpt.portal_folders WHERE id = $1::uuid', [req.params.id])
    await pool.query(
      `INSERT INTO taxgpt.portal_activity (clerk_user_id, kind, title, created_at)
       VALUES ($1, 'folder', $2, now())`,
      [session.userId, `Removed folder: ${folder[0].name}`]
    )
    res.json({ ok: true })
  })

  r.post('/v1/files/presign-put', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const { fileName, contentType } = req.body || {}
    if (!fileName || !contentType) return res.status(400).json({ error: 'fileName, contentType required' })
    const { key, fileId } = buildPortalObjectKey(session.userId, fileName)
    const signed = await presignPut(key, contentType)
    if (!signed) {
      console.warn(
        '[portal files] presign-put: object storage not configured. Set DO_SPACES_ENDPOINT, DO_SPACES_BUCKET, DO_SPACES_KEY, DO_SPACES_SECRET on the API (see api/server/.env.example).'
      )
      return res.status(503).json({
        error: 'Object storage is not configured on the server. Add DigitalOcean Spaces (S3) env vars to the API.',
        code: 'STORAGE_NOT_CONFIGURED'
      })
    }
    res.json({ uploadUrl: signed.url, storageKey: key, fileId })
  })

  /**
   * Fallback upload route: browser sends file bytes to API as base64 JSON, API writes to Spaces,
   * then creates the DB row in one request. This avoids browser->Spaces CORS edge cases.
   */
  r.post('/v1/files/upload-via-api', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const { fileName, contentType, dataBase64, folderId } = req.body || {}
    if (!fileName || !dataBase64) {
      return res.status(400).json({ error: 'fileName and dataBase64 are required' })
    }
    let bytes
    try {
      bytes = Buffer.from(String(dataBase64), 'base64')
    } catch {
      return res.status(400).json({ error: 'Invalid base64 file data' })
    }
    if (!bytes || !bytes.length) {
      return res.status(400).json({ error: 'No file data received' })
    }
    if (bytes.length > MAX_UPLOAD_BYTES) {
      return res.status(400).json({ error: `File exceeds maximum size of ${MAX_UPLOAD_BYTES} bytes` })
    }
    const { key } = buildPortalObjectKey(session.userId, fileName)
    try {
      const uploaded = await putObjectBytes(key, contentType || 'application/octet-stream', bytes)
      if (!uploaded) {
        return res.status(503).json({ error: 'Storage not configured', code: 'STORAGE_NOT_CONFIGURED' })
      }
    } catch (e) {
      console.error('POST /v1/files/upload-via-api (storage)', e)
      return res.status(502).json({ error: 'Could not upload file to storage' })
    }

    const home = await ensureUserHomeFolder(pool, session.userId)
    let folderFid = home.id
    if (folderId && String(folderId) !== 'root' && String(folderId) !== String(home.id) && String(folderId).length) {
      const { rows: fr } = await pool.query(
        'SELECT id FROM taxgpt.portal_folders WHERE id = $1::uuid AND clerk_user_id = $2',
        [String(folderId), session.userId]
      )
      if (!fr[0]) return res.status(400).json({ error: 'Invalid folder' })
      folderFid = fr[0].id
    }

    const { rows } = await pool.query(
      `INSERT INTO taxgpt.portal_client_files
       (clerk_user_id, storage_key, file_name, mime, size_bytes, created_at, folder_id)
       VALUES ($1, $2, $3, $4, $5, now(), $6) RETURNING *`,
      [session.userId, key, fileName, contentType || null, bytes.length, folderFid]
    )
    await pool.query(
      `INSERT INTO taxgpt.portal_activity (clerk_user_id, kind, title, created_at)
       VALUES ($1, 'file', $2, now())`,
      [session.userId, `Uploaded: ${fileName}`]
    )
    res.json({ file: rows[0], usedApiUploadFallback: true })
  })

  r.post('/v1/files/complete', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const { storageKey, fileName, mime, sizeBytes, folderId } = req.body || {}
    if (!storageKey || !fileName) return res.status(400).json({ error: 'storageKey, fileName required' })
    if (!storageKey.startsWith(`portal/${session.userId}/`)) {
      return res.status(400).json({ error: 'Invalid key' })
    }
    if (sizeBytes != null && Number.isFinite(sizeBytes) && sizeBytes > MAX_UPLOAD_BYTES) {
      return res.status(400).json({ error: `File exceeds maximum size of ${MAX_UPLOAD_BYTES} bytes` })
    }
    const home = await ensureUserHomeFolder(pool, session.userId)
    let folderFid = home.id
    if (folderId && String(folderId) !== 'root' && String(folderId) !== String(home.id) && String(folderId).length) {
      const { rows: fr } = await pool.query(
        'SELECT id FROM taxgpt.portal_folders WHERE id = $1::uuid AND clerk_user_id = $2',
        [String(folderId), session.userId]
      )
      if (!fr[0]) return res.status(400).json({ error: 'Invalid folder' })
      folderFid = fr[0].id
    }
    const { rows } = await pool.query(
      `INSERT INTO taxgpt.portal_client_files
       (clerk_user_id, storage_key, file_name, mime, size_bytes, created_at, folder_id)
       VALUES ($1, $2, $3, $4, $5, now(), $6) RETURNING *`,
      [session.userId, storageKey, fileName, mime || null, sizeBytes ?? null, folderFid]
    )
    await pool.query(
      `INSERT INTO taxgpt.portal_activity (clerk_user_id, kind, title, created_at)
       VALUES ($1, 'file', $2, now())`,
      [session.userId, `Uploaded: ${fileName}`]
    )
    res.json({ file: rows[0] })
  })

  r.get('/v1/files', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const folderId = req.query.folderId
    if (folderId === undefined) {
      const { rows } = await pool.query(
        'SELECT * FROM taxgpt.portal_client_files WHERE clerk_user_id = $1 ORDER BY created_at DESC',
        [session.userId]
      )
      return res.json({ files: rows })
    }
    if (folderId === '' || folderId === 'root') {
      const home = await ensureUserHomeFolder(pool, session.userId)
      const { rows } = await pool.query(
        'SELECT * FROM taxgpt.portal_client_files WHERE clerk_user_id = $1 AND folder_id = $2::uuid ORDER BY created_at DESC',
        [session.userId, home.id]
      )
      return res.json({ homeFolder: home, files: rows })
    }
    const { rows: fold } = await pool.query(
      'SELECT * FROM taxgpt.portal_folders WHERE id = $1::uuid AND clerk_user_id = $2',
      [String(folderId), session.userId]
    )
    if (!fold[0]) return res.status(404).json({ error: 'Folder not found' })
    const { rows } = await pool.query(
      'SELECT * FROM taxgpt.portal_client_files WHERE clerk_user_id = $1 AND folder_id = $2::uuid ORDER BY created_at DESC',
      [session.userId, String(folderId)]
    )
    return res.json({ files: rows })
  })

  r.patch('/v1/files/:id', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const body = req.body || {}
    const hasFolder = Object.prototype.hasOwnProperty.call(body, 'folderId')
    const hasName = Object.prototype.hasOwnProperty.call(body, 'fileName')
    if (!hasFolder && !hasName) {
      return res.status(400).json({ error: 'Provide folderId and/or fileName' })
    }
    const { rows: existing } = await pool.query(
      'SELECT * FROM taxgpt.portal_client_files WHERE id = $1::uuid AND clerk_user_id = $2',
      [req.params.id, session.userId]
    )
    if (!existing[0]) return res.status(404).json({ error: 'Not found' })
    const home = hasFolder ? await ensureUserHomeFolder(pool, session.userId) : null
    let targetFolder = existing[0].folder_id
    if (hasFolder) {
      const { folderId } = body
      if (folderId == null || String(folderId) === 'root' || !String(folderId).length) {
        targetFolder = home.id
      } else {
        if (String(folderId) === String(home.id)) {
          targetFolder = home.id
        } else {
          const { rows } = await pool.query(
            'SELECT id FROM taxgpt.portal_folders WHERE id = $1::uuid AND clerk_user_id = $2',
            [String(folderId), session.userId]
          )
          if (!rows[0]) return res.status(400).json({ error: 'Invalid folder' })
          targetFolder = rows[0].id
        }
      }
    }
    let newName = existing[0].file_name
    if (hasName) {
      newName = String(body.fileName ?? '').trim()
      if (newName.length < 1) return res.status(400).json({ error: 'fileName must not be empty' })
      if (newName.length > 500) return res.status(400).json({ error: 'fileName too long' })
    }
    if (!hasFolder) {
      const { rowCount, rows: out } = await pool.query(
        `UPDATE taxgpt.portal_client_files SET file_name = $1
         WHERE id = $2::uuid AND clerk_user_id = $3 RETURNING *`,
        [newName, req.params.id, session.userId]
      )
      if (!rowCount) return res.status(404).json({ error: 'Not found' })
      return res.json({ file: out[0] })
    }
    if (!hasName) {
      const { rowCount, rows: out } = await pool.query(
        `UPDATE taxgpt.portal_client_files SET folder_id = $1::uuid
         WHERE id = $2::uuid AND clerk_user_id = $3 RETURNING *`,
        [targetFolder, req.params.id, session.userId]
      )
      if (!rowCount) return res.status(404).json({ error: 'Not found' })
      return res.json({ file: out[0] })
    }
    const { rowCount, rows: out } = await pool.query(
      `UPDATE taxgpt.portal_client_files SET folder_id = $1::uuid, file_name = $2
       WHERE id = $3::uuid AND clerk_user_id = $4 RETURNING *`,
      [targetFolder, newName, req.params.id, session.userId]
    )
    if (!rowCount) return res.status(404).json({ error: 'Not found' })
    res.json({ file: out[0] })
  })

  r.get('/v1/files/:id/presign-get', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const { rows } = await pool.query(
      'SELECT * FROM taxgpt.portal_client_files WHERE id = $1::uuid AND clerk_user_id = $2',
      [req.params.id, session.userId]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Not found' })
    const url = await presignGet(rows[0].storage_key)
    if (!url) return res.status(503).json({ error: 'Storage not configured' })
    res.json({ url })
  })

  r.delete('/v1/files/:id', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const { rows } = await pool.query(
      'SELECT * FROM taxgpt.portal_client_files WHERE id = $1::uuid AND clerk_user_id = $2',
      [req.params.id, session.userId]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Not found' })
    const { storage_key: storageKey, file_name: fileName } = rows[0]
    if (storageKey) {
      try {
        await deleteObject(storageKey)
      } catch (e) {
        console.error('portal S3 deleteObject', e)
        return res.status(502).json({ error: 'Could not delete file from storage' })
      }
    }
    await pool.query('DELETE FROM taxgpt.portal_client_files WHERE id = $1::uuid AND clerk_user_id = $2', [
      req.params.id,
      session.userId
    ])
    await pool.query(
      `INSERT INTO taxgpt.portal_activity (clerk_user_id, kind, title, created_at)
       VALUES ($1, 'file', $2, now())`,
      [session.userId, `Removed: ${fileName}`]
    )
    res.json({ ok: true })
  })

  r.get('/v1/checklists', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const { rows: lists } = await pool.query(
      'SELECT * FROM taxgpt.portal_checklists WHERE clerk_user_id = $1',
      [session.userId]
    )
    const out = []
    for (const c of lists) {
      const { rows: items } = await pool.query(
        'SELECT * FROM taxgpt.portal_checklist_items WHERE checklist_id = $1::uuid ORDER BY sort_order, id',
        [c.id]
      )
      out.push({ ...c, items })
    }
    res.json({ checklists: out })
  })

  r.post('/v1/checklists', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const { name, items } = req.body || {}
    if (!name) return res.status(400).json({ error: 'name required' })
    const { rows } = await pool.query(
      `INSERT INTO taxgpt.portal_checklists (clerk_user_id, name, created_at, updated_at)
       VALUES ($1, $2, now(), now()) RETURNING *`,
      [session.userId, name]
    )
    const list = rows[0]
    if (Array.isArray(items)) {
      for (let i = 0; i < items.length; i++) {
        await pool.query(
          `INSERT INTO taxgpt.portal_checklist_items (checklist_id, label, done, sort_order, updated_at)
           VALUES ($1::uuid, $2, false, $3, now())`,
          [list.id, String(items[i]), i]
        )
      }
    }
    res.json({ checklist: list })
  })

  r.patch('/v1/checklists/items/:itemId', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const done = req.body?.done
    if (typeof done !== 'boolean') return res.status(400).json({ error: 'done boolean required' })
    const { rows: items } = await pool.query('SELECT * FROM taxgpt.portal_checklist_items WHERE id = $1::uuid', [req.params.itemId])
    if (!items[0]) return res.status(404).json({ error: 'Not found' })
    const { rows: parents } = await pool.query('SELECT * FROM taxgpt.portal_checklists WHERE id = $1::uuid', [items[0].checklist_id])
    if (!parents[0] || parents[0].clerk_user_id !== session.userId) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    await pool.query(
      'UPDATE taxgpt.portal_checklist_items SET done = $1, updated_at = now() WHERE id = $2::uuid',
      [done, req.params.itemId]
    )
    res.json({ ok: true })
  })

  r.get('/v1/integrations', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const { rows } = await pool.query(
      'SELECT * FROM taxgpt.portal_integrations WHERE clerk_user_id = $1',
      [session.userId]
    )
    res.json({
      connections: rows,
      availableProviders: [
        { id: 'quickbooks', name: 'QuickBooks Online', status: 'not_connected' },
        { id: 'xero', name: 'Xero', status: 'not_connected' },
        { id: 'bank', name: 'Bank feed (read-only)', status: 'not_connected' }
      ]
    })
  })

  r.post('/v1/integrations/request', async (req, res) => {
    const session = await getClerkUser(req, res)
    if (!session) return
    const { provider, message } = req.body || {}
    if (!provider) return res.status(400).json({ error: 'provider required' })
    const { rows } = await pool.query(
      `INSERT INTO taxgpt.portal_integrations
       (clerk_user_id, provider, status, metadata, created_at, updated_at)
       VALUES ($1, $2, 'requested', $3, now(), now()) RETURNING *`,
      [session.userId, provider, JSON.stringify({ message: message || null })]
    )
    res.json({
      ok: true,
      note: 'Our team will follow up to complete this integration.',
      integration: rows[0]
    })
  })

  return r
}
