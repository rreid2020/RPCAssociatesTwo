import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const requiredFiles = [
  'public/robots.txt',
  'public/sitemap.xml',
  'src/components/SEO.tsx',
  'scripts/generate-sitemap.mjs'
]

const missing = requiredFiles.filter((rel) => !fs.existsSync(path.resolve(root, rel)))

if (missing.length > 0) {
  console.error('SEO governance check failed. Missing required files:')
  for (const file of missing) console.error(`- ${file}`)
  process.exit(1)
}

const robots = fs.readFileSync(path.resolve(root, 'public/robots.txt'), 'utf8')
if (!robots.includes('Sitemap:')) {
  console.error('SEO governance check failed: public/robots.txt must include a Sitemap directive.')
  process.exit(1)
}

console.log('SEO governance checks passed.')

