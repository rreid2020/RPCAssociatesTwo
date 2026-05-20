import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const requiredArchitecturePaths = [
  'src/router/index.tsx',
  'src/modules',
  'src/shared/index.ts',
  'src/services/index.ts',
  'src/lib/permissions/index.ts',
  'docs/architecture/07-target-architecture.md'
]

const missing = requiredArchitecturePaths.filter((rel) => !fs.existsSync(path.resolve(root, rel)))

if (missing.length > 0) {
  console.error('Architecture boundary check failed. Missing paths:')
  for (const file of missing) console.error(`- ${file}`)
  process.exit(1)
}

console.log('Architecture boundary checks passed.')

