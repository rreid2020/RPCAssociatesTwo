import { readdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'

const DIST_ASSETS = resolve(process.cwd(), 'dist', 'assets')

/** Filenames that must never ship — they cause CDN/browser chunk drift across deploys. */
const FORBIDDEN_FIXED_NAMES = new Set([
  'main.js',
  'index.css',
  'AgGridTable.js'
])

/** Vite content-hashed bundles include a hyphen-suffixed hash before the extension. */
const HASHED_ASSET_PATTERN = /-[A-Za-z0-9_-]{6,}\.(js|css)$/

async function main () {
  let files = []
  try {
    files = await readdir(DIST_ASSETS)
  } catch {
    console.error('[verify-build-chunks] dist/assets not found. Run `npm run build` first.')
    process.exit(1)
  }

  const jsCssFiles = files.filter((name) => name.endsWith('.js') || name.endsWith('.css'))
  const violations = []

  for (const name of jsCssFiles) {
    if (FORBIDDEN_FIXED_NAMES.has(name)) {
      violations.push(`forbidden fixed asset name: ${name}`)
      continue
    }
    if (!HASHED_ASSET_PATTERN.test(name)) {
      violations.push(`asset missing content hash: ${name}`)
    }
  }

  if (violations.length > 0) {
    console.error('[verify-build-chunks] Build output violates chunk safety rules:')
    for (const item of violations) console.error(`  - ${item}`)
    process.exit(1)
  }

  console.log(`[verify-build-chunks] OK (${jsCssFiles.length} hashed JS/CSS assets)`)
}

await main()
