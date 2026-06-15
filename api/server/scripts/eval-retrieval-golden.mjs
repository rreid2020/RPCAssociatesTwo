import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createPool } from '../db/pool.js'
import { retrieveTaxgptChunks } from '../services/taxgptRetrievalRepository.js'
import { resolveRequestedPublications } from '../services/taxgptPublicationResolver.js'
import { publicationCodeFromUrl, folioCodeFromUrl } from '../services/taxgptRetrievalFilters.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env') })

const GOLDEN_QUERIES = [
  {
    id: 'folio-s1-f1-c1',
    query: 'S1-F1-C1 Medical Expense Tax Credit',
    expectUrlIncludes: ['s1-f1-c1']
  },
  {
    id: 'guide-rc4110',
    query: 'Review CRA Guide RC4110, Employee or self-employed?',
    expectPublicationStatus: 'skipped',
    expectUrlIncludes: []
  },
  {
    id: 'guide-rc4065',
    query: 'CRA guide RC4065 medical expenses',
    expectUrlIncludes: ['rc4065']
  }
]

const pool = createPool()
let failures = 0

for (const test of GOLDEN_QUERIES) {
  const requested = await resolveRequestedPublications(pool, test.query)
  const chunks = await retrieveTaxgptChunks(pool, test.query, { topK: 5, minSimilarity: 0.25, language: 'en' })
  const urls = chunks.map((chunk) => chunk.citation.sourceUrl.toLowerCase())

  const publicationStatus = requested[0]?.status || null
  const urlHits = (test.expectUrlIncludes || []).filter((needle) =>
    urls.some((url) => url.includes(needle))
  )

  const publicationOk = !test.expectPublicationStatus || publicationStatus === test.expectPublicationStatus
  const urlOk = !test.expectUrlIncludes?.length || urlHits.length > 0

  const pass = publicationOk && urlOk
  if (!pass) failures += 1

  console.log(`${pass ? 'PASS' : 'FAIL'} ${test.id}`)
  console.log({
    publicationStatus,
    topTitles: chunks.slice(0, 3).map((chunk) => chunk.citation.sourceTitle),
    topCodes: chunks.slice(0, 3).map((chunk) => publicationCodeFromUrl(chunk.citation.sourceUrl) || folioCodeFromUrl(chunk.citation.sourceUrl))
  })
}

await pool.end()
process.exit(failures > 0 ? 1 : 0)
