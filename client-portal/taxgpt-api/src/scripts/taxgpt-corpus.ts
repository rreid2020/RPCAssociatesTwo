import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import {
  auditCorpus,
  discoverFullPublicationsCorpus,
  discoverPublicationsCatalog,
  expandPublicationLandingPages,
  reconcileArchivedPendingSources
} from '@rag/core'
import { IngestionService } from '@rag/core'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

for (const envPath of [
  resolve(__dirname, '../../../../.env'),
  resolve(__dirname, '../../../../api/server/.env'),
  resolve(__dirname, '../../../.env')
]) {
  config({ path: envPath })
}

if (!process.env.OPENAI_API_KEY && process.env.OPEN_API_KEY) {
  process.env.OPENAI_API_KEY = process.env.OPEN_API_KEY
}

function readLimit (argv: string[], fallback: number) {
  const limitArg = argv.find((arg) => arg.startsWith('--limit='))
  return limitArg ? Number(limitArg.split('=')[1]) : fallback
}

async function ingestBatch (argv: string[]) {
  const limit = readLimit(argv, 10)
  const ingestionService = new IngestionService()
  const summary = await ingestionService.ingestBatch({ limit })
  console.log(JSON.stringify(summary, null, 2))
}

async function main () {
  const [, , command, ...argv] = process.argv

  switch (command) {
    case 'stats':
      console.log(JSON.stringify((await auditCorpus()).totals, null, 2))
      break
    case 'audit':
      console.log(JSON.stringify(await auditCorpus(), null, 2))
      break
    case 'discover':
      console.log(JSON.stringify(await discoverPublicationsCatalog(), null, 2))
      break
    case 'expand':
      console.log(JSON.stringify(
        await expandPublicationLandingPages({ limit: readLimit(argv, 50) }),
        null,
        2
      ))
      break
    case 'discover-all':
      console.log(JSON.stringify(
        await discoverFullPublicationsCorpus({ expandLimit: readLimit(argv, 100) }),
        null,
        2
      ))
      break
    case 'reconcile':
      console.log(JSON.stringify(await reconcileArchivedPendingSources(), null, 2))
      break
    case 'ingest':
      await ingestBatch(argv)
      break
    default:
      console.error(
        'Usage: tsx src/scripts/taxgpt-corpus.ts <stats|audit|discover|expand|discover-all|reconcile|ingest> [--limit=N]'
      )
      process.exit(1)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
