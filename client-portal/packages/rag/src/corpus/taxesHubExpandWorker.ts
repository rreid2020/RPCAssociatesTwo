import { pathToFileURL } from 'node:url'
import { ensureDbValidated } from '@shared/types'
import { CraTaxesHubDiscoveryService } from '../services/discovery/craTaxesHubDiscovery.js'

export const TAXES_HUB_EXPAND_RESULT_PREFIX = '__TAXES_HUB_EXPAND_RESULT__'

export type TaxesHubExpandWorkerResult = {
  ok: boolean
  newSourcesCreated?: number
  skippedDuplicates?: number
  discoveredLinks?: number
  error?: string
}

function readSourceId (argv: string[]): string | null {
  const match = argv.find((arg) => arg.startsWith('--source-id='))
  return match ? match.slice('--source-id='.length) : null
}

export async function runTaxesHubExpandWorker (
  sourceId: string,
  options: { fetchMode?: 'browser-first' | 'http-first' } = {}
): Promise<TaxesHubExpandWorkerResult> {
  await ensureDbValidated()
  const discovery = new CraTaxesHubDiscoveryService()
  const result = await discovery.discoverFromSource(sourceId, {
    fetchMode: options.fetchMode ?? 'browser-first'
  })
  return {
    ok: true,
    newSourcesCreated: result.newSourcesCreated,
    skippedDuplicates: result.skippedDuplicates,
    discoveredLinks: result.discoveredLinks.length
  }
}

function emitResult (payload: TaxesHubExpandWorkerResult): void {
  console.log(`${TAXES_HUB_EXPAND_RESULT_PREFIX}${JSON.stringify(payload)}`)
}

function readFetchMode (argv: string[]): 'browser-first' | 'http-first' {
  return argv.includes('--http-first') ? 'http-first' : 'browser-first'
}

async function main (): Promise<void> {
  const sourceId = readSourceId(process.argv)
  if (!sourceId) {
    emitResult({ ok: false, error: 'Missing --source-id=' })
    process.exit(2)
    return
  }

  try {
    const result = await runTaxesHubExpandWorker(sourceId, {
      fetchMode: readFetchMode(process.argv)
    })
    emitResult(result)
    process.exit(0)
  } catch (error) {
    emitResult({
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    })
    process.exit(1)
  }
}

const entry = process.argv[1]
if (entry && import.meta.url === pathToFileURL(entry).href) {
  void main()
}
