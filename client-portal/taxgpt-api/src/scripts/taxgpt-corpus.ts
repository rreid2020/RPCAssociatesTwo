import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import {
  auditCorpus,
  discoverCanliiTaxCourtBatch,
  discoverFormsCatalog,
  discoverFolioDirectories,
  discoverFullPublicationsCorpus,
  discoverPublicationsCatalog,
  expandPublicationLandingPages,
  reconcileArchivedPendingSources,
  reconcileEmbeddingFailedSources,
  reconcileTaxReferenceContentSources,
  reconcileTimeoutFailedSources
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

function readOption (argv: string[], key: string, fallback: number) {
  const prefix = `--${key}=`
  const matches = argv.filter((arg) => arg.startsWith(prefix))
  const match = matches[matches.length - 1]
  return match ? Number(match.slice(prefix.length)) : fallback
}

function hasFlag (argv: string[], flag: string) {
  return argv.includes(flag)
}

function sleep (ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function runExpandIngestPipeline (argv: string[]) {
  const expandLimit = readOption(argv, 'expand-limit', readLimit(argv, 50))
  const folioLimit = readOption(argv, 'folio-limit', 5)
  const ingestLimit = readOption(argv, 'ingest-limit', 10)
  const maxConsecutiveErrors = readOption(argv, 'max-errors', 5)
  const retryDelayMs = readOption(argv, 'retry-delay-ms', 5000)
  const phase = argv.find((arg) => arg.startsWith('--phase='))?.split('=')[1] || 'all'
  const reconcileFirst = !hasFlag(argv, '--no-reconcile')

  const log = (message: string, payload?: unknown) => {
    const line = payload === undefined
      ? `[pipeline] ${new Date().toISOString()} ${message}`
      : `[pipeline] ${new Date().toISOString()} ${message} ${JSON.stringify(payload)}`
    console.log(line)
  }

  if (reconcileFirst) {
    log('Reconciling corpus before continuous run')
    const reconciled = {
      archived: await reconcileArchivedPendingSources(),
      taxReference: await reconcileTaxReferenceContentSources(),
      timeouts: await reconcileTimeoutFailedSources(),
      embeddings: await reconcileEmbeddingFailedSources()
    }
    log('Reconcile complete', reconciled)
  }

  const runExpand = phase === 'all' || phase === 'expand'
  const runFolios = phase === 'all' || phase === 'folios'
  const runCanlii = phase === 'all' || phase === 'canlii'
  const runIngest = phase === 'all' || phase === 'ingest'

  if (runIngest && !process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required for ingest')
  }

  if (runCanlii && process.env.CANLII_API_KEY) {
    const canliiDiscoverLimit = readOption(argv, 'canlii-discover-limit', 50)
    log('Starting CanLII discover phase', { canliiDiscoverLimit, maxConsecutiveErrors })
    let canliiBatch = 0
    let consecutiveErrors = 0
    let totalDiscovered = 0

    while (true) {
      canliiBatch += 1
      try {
        const result = await discoverCanliiTaxCourtBatch({ limit: canliiDiscoverLimit })
        consecutiveErrors = 0
        totalDiscovered += result.discovered
        log(`CanLII discover batch ${canliiBatch} complete`, result)

        if (result.complete) {
          log('CanLII discover phase complete', { canliiBatch, totalDiscovered })
          break
        }
      } catch (error) {
        consecutiveErrors += 1
        const message = error instanceof Error ? error.message : String(error)
        log(`CanLII discover batch ${canliiBatch} failed (${consecutiveErrors}/${maxConsecutiveErrors})`, { error: message })

        if (consecutiveErrors >= maxConsecutiveErrors) {
          throw new Error(`CanLII discover pipeline stopped after ${maxConsecutiveErrors} consecutive failures: ${message}`)
        }

        await sleep(retryDelayMs)
      }
    }
  } else if (runCanlii) {
    log('Skipping CanLII discovery — CANLII_API_KEY is not set')
  }

  log('Starting continuous corpus run (folios + expand + ingest until queue empty)', {
    folioLimit,
    expandLimit,
    ingestLimit,
    maxConsecutiveErrors,
    runFolios,
    runExpand,
    runIngest
  })

  const ingestionService = runIngest ? new IngestionService() : null
  let cycle = 0
  let folioConsecutiveErrors = 0
  let expandConsecutiveErrors = 0
  let ingestConsecutiveErrors = 0
  let totalFolioDiscovered = 0
  let totalExpanded = 0
  let totalIngested = 0
  let folioComplete = !runFolios
  let expandComplete = !runExpand
  let ingestComplete = !runIngest

  while (!folioComplete || !expandComplete || !ingestComplete) {
    cycle += 1
    log(`Cycle ${cycle} starting`, { folioComplete, expandComplete, ingestComplete })

    if (!folioComplete) {
      try {
        const result = await discoverFolioDirectories({ limit: folioLimit })
        folioConsecutiveErrors = 0
        totalFolioDiscovered += result.contentSourcesCreated
        log(`Cycle ${cycle} folio discover complete`, result)

        if (result.processed === 0) {
          folioComplete = true
          log('Folio discovery queue empty', { cycle, totalFolioDiscovered })
        }
      } catch (error) {
        folioConsecutiveErrors += 1
        const message = error instanceof Error ? error.message : String(error)
        log(`Cycle ${cycle} folio discover failed (${folioConsecutiveErrors}/${maxConsecutiveErrors})`, { error: message })

        if (folioConsecutiveErrors >= maxConsecutiveErrors) {
          throw new Error(`Folio discovery pipeline stopped after ${maxConsecutiveErrors} consecutive failures: ${message}`)
        }

        await sleep(retryDelayMs)
      }
    }

    if (!expandComplete) {
      try {
        const result = await expandPublicationLandingPages({ limit: expandLimit })
        expandConsecutiveErrors = 0
        totalExpanded += result.processed
        log(`Cycle ${cycle} expand complete`, result)

        if (result.processed === 0) {
          expandComplete = true
          log('Expand queue empty', { cycle, totalExpanded })
        }
      } catch (error) {
        expandConsecutiveErrors += 1
        const message = error instanceof Error ? error.message : String(error)
        log(`Cycle ${cycle} expand failed (${expandConsecutiveErrors}/${maxConsecutiveErrors})`, { error: message })

        if (expandConsecutiveErrors >= maxConsecutiveErrors) {
          throw new Error(`Expand pipeline stopped after ${maxConsecutiveErrors} consecutive failures: ${message}`)
        }

        await sleep(retryDelayMs)
      }
    }

    if (!ingestComplete && ingestionService) {
      try {
        const summary = await ingestionService.ingestBatch({ limit: ingestLimit })
        ingestConsecutiveErrors = 0
        totalIngested += summary.successful
        log(`Cycle ${cycle} ingest complete`, summary)

        if (summary.total === 0) {
          ingestComplete = true
          log('Ingest queue empty', { cycle, totalIngested })
        }
      } catch (error) {
        ingestConsecutiveErrors += 1
        const message = error instanceof Error ? error.message : String(error)
        log(`Cycle ${cycle} ingest failed (${ingestConsecutiveErrors}/${maxConsecutiveErrors})`, { error: message })

        if (ingestConsecutiveErrors >= maxConsecutiveErrors) {
          throw new Error(`Ingest pipeline stopped after ${maxConsecutiveErrors} consecutive failures: ${message}`)
        }

        await sleep(retryDelayMs)
      }
    }
  }

  const totals = (await auditCorpus()).totals
  log('Pipeline finished', { cycle, totalFolioDiscovered, totalExpanded, totalIngested, totals })
  console.log(JSON.stringify(totals, null, 2))
}

async function ingestBatch (argv: string[]) {
  const limit = readLimit(argv, 10)
  const ingestionService = new IngestionService()
  const summary = await ingestionService.ingestBatch({ limit })
  console.log(JSON.stringify(summary, null, 2))
}

/** One expand batch + one ingest batch, then exit — safe for DigitalOcean scheduled jobs. */
async function runScheduledBatch (argv: string[]) {
  const expandLimit = readOption(argv, 'expand-limit', 50)
  const folioLimit = readOption(argv, 'folio-limit', 3)
  const ingestLimit = readOption(argv, 'ingest-limit', 20)
  const log = (message: string, payload?: unknown) => {
    const line = payload === undefined
      ? `[batch] ${new Date().toISOString()} ${message}`
      : `[batch] ${new Date().toISOString()} ${message} ${JSON.stringify(payload)}`
    console.log(line)
  }

  log('Starting scheduled corpus batch', { folioLimit, expandLimit, ingestLimit })

  let folioResult = {
    processed: 0,
    discovered: 0,
    contentSourcesCreated: 0,
    skipped: 0,
    errors: 0
  }

  try {
    folioResult = await discoverFolioDirectories({ limit: folioLimit })
    log('Folio discover step complete', folioResult)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log('Folio discover step failed', { error: message })
    throw error
  }

  let expandResult = {
    processed: 0,
    expanded: 0,
    contentSourcesCreated: 0,
    skipped: 0,
    errors: 0
  }

  try {
    expandResult = await expandPublicationLandingPages({ limit: expandLimit })
    log('Expand step complete', expandResult)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log('Expand step failed', { error: message })
    throw error
  }

  let canliiDiscoverResult = {
    discovered: 0,
    skippedDuplicates: 0,
    errors: 0,
    offset: 0,
    complete: true
  }

  if (!process.env.CANLII_API_KEY) {
    log('Skipping CanLII discovery — CANLII_API_KEY is not set')
  } else {
    try {
      const canliiDiscoverLimit = readOption(argv, 'canlii-discover-limit', 50)
      canliiDiscoverResult = await discoverCanliiTaxCourtBatch({ limit: canliiDiscoverLimit })
      log('CanLII discover step complete', canliiDiscoverResult)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      log('CanLII discover step failed', { error: message })
      throw error
    }
  }

  let ingestResult = {
    total: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    errors: [] as Array<{ sourceId: string; error: string }>
  }

  if (!process.env.OPENAI_API_KEY) {
    log('Skipping ingest — OPENAI_API_KEY is not set')
  } else {
    try {
      const ingestionService = new IngestionService()
      ingestResult = await ingestionService.ingestBatch({ limit: ingestLimit })
      log('Ingest step complete', ingestResult)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      log('Ingest step failed', { error: message })
      throw error
    }
  }

  const totals = (await auditCorpus()).totals
  const summary = {
    folios: folioResult,
    expand: expandResult,
    canliiDiscover: canliiDiscoverResult,
    ingest: ingestResult,
    corpus: totals,
    folioComplete: folioResult.processed === 0,
    expandComplete: expandResult.processed === 0,
    canliiDiscoverComplete: canliiDiscoverResult.complete,
    ingestComplete: ingestResult.total === 0,
    retrievalReady: totals.retrievalReady
  }
  log('Scheduled batch finished', summary)
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
    case 'discover-forms':
      console.log(JSON.stringify(await discoverFormsCatalog(), null, 2))
      break
    case 'discover-folios':
      console.log(JSON.stringify(
        await discoverFolioDirectories({ limit: readLimit(argv, 10) }),
        null,
        2
      ))
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
      console.log(JSON.stringify({
        archived: await reconcileArchivedPendingSources(),
        taxReference: await reconcileTaxReferenceContentSources(),
        timeouts: await reconcileTimeoutFailedSources(),
        embeddings: await reconcileEmbeddingFailedSources()
      }, null, 2))
      break
    case 'discover-canlii':
      console.log(JSON.stringify(
        await discoverCanliiTaxCourtBatch({ limit: readLimit(argv, 50) }),
        null,
        2
      ))
      break
    case 'ingest':
      await ingestBatch(argv)
      break
    case 'run-pipeline':
      await runExpandIngestPipeline(argv)
      break
    case 'run-batch':
      await runScheduledBatch(argv)
      break
    default:
      console.error(
        'Usage: tsx src/scripts/taxgpt-corpus.ts <stats|audit|discover|discover-forms|discover-folios|expand|discover-all|discover-canlii|reconcile|ingest|run-pipeline|run-batch> [--limit=N] [--folio-limit=N] [--expand-limit=N] [--ingest-limit=N] [--canlii-discover-limit=N] [--phase=all|folios|expand|canlii|ingest] [--max-errors=N] [--no-reconcile]'
      )
      process.exit(1)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})

