/**
 * Rasterize public/favicon.svg to PNGs in public/.
 * Run: node scripts/generate-favicons.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')
const buf = readFileSync(join(publicDir, 'favicon.svg'))

async function pngSize(size) {
  return await sharp(buf).resize(size, size, { fit: 'contain' }).png().toBuffer()
}

const out = {
  'favicon-32x32.png': 32,
  'favicon-96x96.png': 96,
  'apple-touch-icon.png': 180,
  'web-app-manifest-192x192.png': 192,
  'web-app-manifest-512x512.png': 512,
}

for (const [name, size] of Object.entries(out)) {
  writeFileSync(join(publicDir, name), await pngSize(size))
  console.log('wrote', name)
}
