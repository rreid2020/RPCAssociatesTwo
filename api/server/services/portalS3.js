import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'crypto'

const TTL = 300

function getS3 () {
  const endpoint = process.env.S3_ENDPOINT || process.env.DO_SPACES_ENDPOINT
  const bucket = process.env.S3_BUCKET || process.env.DO_SPACES_BUCKET
  const accessKey = process.env.S3_ACCESS_KEY || process.env.DO_SPACES_KEY
  const secretKey = process.env.S3_SECRET_KEY || process.env.DO_SPACES_SECRET
  const region = process.env.S3_REGION || process.env.DO_SPACES_REGION || 'us-east-1'
  if (!endpoint || !bucket || !accessKey || !secretKey) {
    return null
  }
  return {
    client: new S3Client({
      region,
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
    const host = (() => {
      try {
        return new URL(process.env.S3_ENDPOINT || process.env.DO_SPACES_ENDPOINT).host
      } catch {
        return 'configured'
      }
    })()
    console.log(`[portal files] Object storage: configured (bucket: ${s3.bucket}, endpoint: ${host})`)
  } else {
    console.warn(
      '[portal files] Object storage: NOT configured — set DO_SPACES_ENDPOINT, DO_SPACES_BUCKET, DO_SPACES_KEY, DO_SPACES_SECRET (or S3_*). ' +
        'POST /v1/files/presign-put returns 503; the bucket will not get a portal/ prefix until this is fixed.'
    )
  }
}
