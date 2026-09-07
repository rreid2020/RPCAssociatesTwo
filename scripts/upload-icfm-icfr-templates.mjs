/**
 * Upload ICFM/ICFR process Excel templates to DigitalOcean Spaces.
 *
 * Requires env (from api/server/.env or shell):
 *   DO_SPACES_ENDPOINT  e.g. https://tor1.digitaloceanspaces.com
 *   DO_SPACES_BUCKET    e.g. rpc-associates-space
 *   DO_SPACES_KEY
 *   DO_SPACES_SECRET
 *   DO_SPACES_REGION    e.g. us-east-1
 *
 * Usage (from repo root):
 *   node --env-file=api/server/.env scripts/upload-icfm-icfr-templates.mjs
 *
 * After a successful upload, set USE_ICFM_ICFR_SPACES_URLS = true in
 * src/lib/resources/icfmIcfrTemplates.ts to serve Spaces URLs.
 */
import { createReadStream, existsSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'

const require = createRequire(resolve(process.cwd(), 'api/server/package.json'))
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')

const LOCAL_DIR = resolve(process.cwd(), 'public/downloads/excel-templates/icfm-icfr')
const KEY_PREFIX = 'public/resources/excel-templates/icfm-icfr'

const endpoint = process.env.DO_SPACES_ENDPOINT
const bucket = process.env.DO_SPACES_BUCKET
const accessKeyId = process.env.DO_SPACES_KEY
const secretAccessKey = process.env.DO_SPACES_SECRET
const region = process.env.DO_SPACES_REGION || 'us-east-1'

async function main () {
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    console.error('Missing DO_SPACES_ENDPOINT, DO_SPACES_BUCKET, DO_SPACES_KEY, or DO_SPACES_SECRET.')
    console.error('Add them to api/server/.env and re-run:')
    console.error('  node --env-file=api/server/.env scripts/upload-icfm-icfr-templates.mjs')
    process.exit(1)
  }

  if (!existsSync(LOCAL_DIR)) {
    console.error(`Local template directory not found: ${LOCAL_DIR}`)
    process.exit(1)
  }

  const files = readdirSync(LOCAL_DIR).filter((name) => name.toLowerCase().endsWith('.xlsx'))
  if (files.length === 0) {
    console.error(`No .xlsx files in ${LOCAL_DIR}`)
    process.exit(1)
  }

  const client = new S3Client({
    endpoint,
    region,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: false
  })

  console.log(`Uploading ${files.length} file(s) to s3://${bucket}/${KEY_PREFIX}/`)

  for (const fileName of files) {
    const key = `${KEY_PREFIX}/${fileName}`
    const body = createReadStream(join(LOCAL_DIR, fileName))
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ACL: 'public-read',
        ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        CacheControl: 'public, max-age=86400'
      })
    )
    console.log(`  OK ${key}`)
  }

  console.log('\nDone. Public URLs (tor1 example):')
  for (const fileName of files) {
    console.log(`  https://rpc-associates-space.tor1.digitaloceanspaces.com/${KEY_PREFIX}/${fileName}`)
  }
  console.log('\nThen set USE_ICFM_ICFR_SPACES_URLS = true in src/lib/resources/icfmIcfrTemplates.ts')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
