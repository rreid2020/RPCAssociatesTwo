import crypto from 'crypto'

function getEncryptionKeyBuffer () {
  const raw = process.env.ENCRYPTION_KEY || ''
  if (!raw) return null
  const key = raw.length === 64 && /^[0-9a-f]+$/i.test(raw)
    ? Buffer.from(raw, 'hex')
    : Buffer.from(raw, 'utf8')
  if (key.length >= 32) return key.subarray(0, 32)
  return Buffer.concat([key, Buffer.alloc(32 - key.length)])
}

export function encryptionReady () {
  return Boolean(getEncryptionKeyBuffer())
}

export function encryptSecret (value) {
  if (!value) return null
  const key = getEncryptionKeyBuffer()
  if (!key) throw new Error('ENCRYPTION_KEY is required for secure token storage')
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return Buffer.concat([iv, authTag, encrypted]).toString('base64')
}

export function decryptSecret (value) {
  if (!value) return null
  const key = getEncryptionKeyBuffer()
  if (!key) throw new Error('ENCRYPTION_KEY is required for secure token storage')
  const data = Buffer.from(String(value), 'base64')
  const iv = data.subarray(0, 12)
  const authTag = data.subarray(12, 28)
  const encrypted = data.subarray(28)
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}

