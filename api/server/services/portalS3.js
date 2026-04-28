import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'crypto'

const TTL = 300

function readFirstEnv (...keys) {
  for (const k of keys) {
    const v = process.env[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return ''
}

function readSpacesEnv () {
  return {
    endpoint: readFirstEnv('S3_ENDPOINT', 'DO_SPACES_ENDPOINT', 'SPACES_ENDPOINT'),
    bucket: readFirstEnv('S3_BUCKET', 'DO_SPACES_BUCKET', 'SPACES_BUCKET'),
    accessKey: readFirstEnv(
      'S3_ACCESS_KEY',
      'DO_SPACES_KEY',
      'SPACES_KEY',
      'DO_SPACES_ACCESS_KEY',
      'DO_SPACES_ACCESS_KEY_ID',
      'AWS_ACCESS_KEY_ID'
    ),
    secretKey: readFirstEnv(
      'S3_SECRET_KEY',
      'DO_SPACES_SECRET',
      'SPACES_SECRET',
      'DO_SPACES_SECRET_KEY',
      'DO_SPACES_SECRET_ACCESS_KEY',
      'AWS_SECRET_ACCESS_KEY'
    ),
    region: readFirstEnv('S3_REGION', 'DO_SPACES_REGION', 'SPACES_REGION', 'AWS_REGION') || 'us-east-1'
  }
}

/**
 * For the UI: which env vars are missing (names only, no secrets). Helps when the API service
 * was never given DO_SPACES_* (common mix-up: set on the web app only).
 */
export function getObjectStorageConfigDiagnostics () {
  const e = readSpacesEnv()
  const missing = []
  if (!e.endpoint) missing.push('DO_SPACES_ENDPOINT (or S3_ENDPOINT/SPACES_ENDPOINT)')
  if (!e.bucket) missing.push('DO_SPACES_BUCKET (or S3_BUCKET/SPACES_BUCKET)')
  if (!e.accessKey) missing.push('DO_SPACES_KEY (or S3_ACCESS_KEY/SPACES_KEY/DO_SPACES_ACCESS_KEY_ID)')
  if (!e.secretKey) missing.push('DO_SPACES_SECRET (or S3_SECRET_KEY/SPACES_SECRET/DO_SPACES_SECRET_ACCESS_KEY)')
  return {
    objectStorageReady: missing.length === 0,
    objectStorageMissing: missing
  }
}

function getS3 () {
  const e = readSpacesEnv()
  const { endpoint, bucket, accessKey, secretKey, region } = e
  if (!endpoint || !bucket || !accessKey || !secretKey) {
    return null
  }
  return {
    client: new S3Client({
      region: e.region,
      endpoint,
      forcePathStyle: true,
      credentials: { accessKeyId: accessKey, secretAccessKey: secretKey }
    }),
    bucket
  }
}

export function buildPortalObjectKey (clerkUserId, fileName) {
  const id = randomUUID()
  const safe = String(fileName).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200)
  return { key: `portal/${clerkUserId}/${id}/${safe}`, fileId: id }
}

export async function presignPut (key, contentType) {
  const s3 = getS3()
  if (!s3) return null
  const cmd = new PutObjectCommand({ Bucket: s3.bucket, Key: key, ContentType: contentType })
  const url = await getSignedUrl(s3.client, cmd, { expiresIn: TTL })
  return { url }
}

/** True when env has Spaces/S3 credentials; used by the API to tell the UI if uploads are possible. */
export function isPortalObjectStorageConfigured () {
  return getS3() != null
}

export async function presignGet (key) {
  const s3 = getS3()
  if (!s3) return null
  const cmd = new GetObjectCommand({ Bucket: s3.bucket, Key: key })
  return getSignedUrl(s3.client, cmd, { expiresIn: TTL })
}

/** Best-effort delete; returns true if S3 is configured and delete was sent, false if storage unavailable. */
export async function deleteObject (key) {
  const s3 = getS3()
  if (!s3) return null
  await s3.client.send(new DeleteObjectCommand({ Bucket: s3.bucket, Key: key }))
  return true
}

/** Log once at API startup. No `portal/` prefix appears in the bucket until this is ON and a upload completes. */
export function logPortalObjectStorageConfig () {
  const s3 = getS3()
  if (s3) {
    const env = readSpacesEnv()
    const host = (() => {
      try {
        return new URL(env.endpoint).host
      } catch {
        return 'configured'
      }
    })()
    console.log(`[portal files] Object storage: configured (bucket: ${s3.bucket}, endpoint: ${host})`)
  } else {
    const { objectStorageMissing } = getObjectStorageConfigDiagnostics()
    console.warn(
      '[portal files] Object storage: NOT configured. Missing: ' +
        (objectStorageMissing.length ? objectStorageMissing.join(', ') : '(unknown)') +
        '. Set these on the **API** process (e.g. App Platform → api service → env), not the static site. Then redeploy the API.'
    )
  }
}
