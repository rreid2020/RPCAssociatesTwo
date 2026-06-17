import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { platform } from 'node:os'
import { logger } from '@shared/types'
import {
  TAXES_HUB_EXPAND_RESULT_PREFIX,
  type TaxesHubExpandWorkerResult
} from './taxesHubExpandWorker.js'

export const TAXES_HUB_DISCOVER_SOURCE_TIMEOUT_MS = 90_000

function resolveRagPackageRoot (): string {
  return join(dirname(fileURLToPath(import.meta.url)), '..', '..')
}

export function resolveTaxesHubExpandWorkerScript (): string {
  return join(resolveRagPackageRoot(), 'src', 'corpus', 'taxesHubExpandWorker.ts')
}

function resolveTsxCli (): string | null {
  const ragPackageRoot = resolveRagPackageRoot()
  const candidates = [
    join(ragPackageRoot, '..', '..', 'node_modules', 'tsx', 'dist', 'cli.mjs'),
    join(process.cwd(), '..', 'node_modules', 'tsx', 'dist', 'cli.mjs'),
    join(process.cwd(), 'node_modules', 'tsx', 'dist', 'cli.mjs'),
    join(ragPackageRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs')
  ]

  return candidates.find((candidate) => existsSync(candidate)) ?? null
}

function resolveWorkerLaunch (
  sourceId: string,
  options: { httpFirst?: boolean } = {}
): { execPath: string; args: string[] } {
  const workerScript = resolveTaxesHubExpandWorkerScript()
  const tsxCli = resolveTsxCli()
  const args = [`--source-id=${sourceId}`]
  if (options.httpFirst) args.push('--http-first')

  if (tsxCli) {
    return {
      execPath: process.execPath,
      args: [tsxCli, workerScript, ...args]
    }
  }

  throw new Error('tsx CLI not found — cannot run isolated taxes hub expand worker')
}

export function parseTaxesHubExpandWorkerOutput (stdout: string): TaxesHubExpandWorkerResult | null {
  const line = stdout
    .split(/\r?\n/)
    .find((row) => row.includes(TAXES_HUB_EXPAND_RESULT_PREFIX))

  if (!line) return null

  const jsonStart = line.indexOf(TAXES_HUB_EXPAND_RESULT_PREFIX) + TAXES_HUB_EXPAND_RESULT_PREFIX.length

  try {
    return JSON.parse(line.slice(jsonStart)) as TaxesHubExpandWorkerResult
  } catch {
    return null
  }
}

async function killProcessTree (pid: number): Promise<void> {
  if (!Number.isFinite(pid) || pid <= 0) return

  await new Promise<void>((resolve) => {
    if (platform() === 'win32') {
      const killer = spawn('taskkill', ['/PID', String(pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true
      })
      killer.on('close', () => resolve())
      killer.on('error', () => resolve())
      return
    }

    try {
      process.kill(-pid, 'SIGKILL')
    } catch {
      try {
        process.kill(pid, 'SIGKILL')
      } catch {
        // Process already exited.
      }
    }
    resolve()
  })
}

export type TaxesHubExpandSubprocessResult = {
  newSourcesCreated: number
  skippedDuplicates: number
}

export async function runTaxesHubExpandInSubprocess (
  sourceId: string,
  options: {
    timeoutMs?: number
    url?: string
    httpFirst?: boolean
  } = {}
): Promise<TaxesHubExpandSubprocessResult> {
  const timeoutMs = options.timeoutMs ?? TAXES_HUB_DISCOVER_SOURCE_TIMEOUT_MS
  const label = options.url ?? sourceId
  const launch = resolveWorkerLaunch(sourceId, { httpFirst: options.httpFirst })

  return new Promise((resolve, reject) => {
    const child = spawn(launch.execPath, launch.args, {
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      detached: platform() !== 'win32'
    })

    let stdout = ''
    let stderr = ''
    let settled = false

    const finish = (handler: () => void) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      handler()
    }

    child.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk.toString()
    })
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })

    const timer = setTimeout(() => {
      const pid = child.pid
      logger.crawlWarn('Taxes hub expand subprocess timed out — killing process tree', {
        sourceId,
        url: label,
        pid,
        timeoutMs
      })
      void killProcessTree(pid ?? 0).finally(() => {
        finish(() => {
          reject(new Error(`Taxes hub discovery for ${label} timed out after ${timeoutMs}ms`))
        })
      })
    }, timeoutMs)

    child.on('error', (error) => {
      finish(() => {
        reject(error)
      })
    })

    child.on('close', (code) => {
      const parsed = parseTaxesHubExpandWorkerOutput(stdout)

      if (parsed?.ok) {
        finish(() => {
          resolve({
            newSourcesCreated: parsed.newSourcesCreated ?? 0,
            skippedDuplicates: parsed.skippedDuplicates ?? 0
          })
        })
        return
      }

      const errorMessage = parsed?.error ||
        stderr.trim() ||
        `Taxes hub expand subprocess exited with code ${code ?? 'unknown'}`

      finish(() => {
        reject(new Error(errorMessage))
      })
    })
  })
}
