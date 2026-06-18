# Keeps taxgpt:finish-taxes-hub running - restarts on crash or log staleness.
param(
  [int]$StaleMinutes = 25,
  [int]$RestartDelaySeconds = 30,
  [int]$PollSeconds = 120
)

$ErrorActionPreference = 'Continue'
$Root = Split-Path $PSScriptRoot -Parent
$LogDir = Join-Path $Root 'logs'
$WatchLog = Join-Path $LogDir 'taxes-hub-ingest-watch.log'
$PipelineLog = Join-Path $LogDir 'taxes-hub-ingest-pipeline.log'
$PipelineErr = Join-Path $LogDir 'taxes-hub-ingest-pipeline.err.log'

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Write-WatchLog([string]$Message) {
  $line = "$(Get-Date -Format o) $Message"
  Add-Content -Path $WatchLog -Value $line
  Write-Host $line
}

function Stop-TaxesHubProcesses() {
  Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like '*taxgpt-corpus*finish-taxes-hub*' } |
    ForEach-Object {
      Write-WatchLog "Stopping taxes-hub process PID $($_.ProcessId)"
      Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }
}

function Test-PipelineComplete() {
  if (-not (Test-Path $PipelineLog)) { return $false }
  $tail = Get-Content $PipelineLog -Tail 30 -ErrorAction SilentlyContinue
  return ($tail -join "`n") -match 'Taxes hub finish pipeline complete'
}

function Get-PipelineLogAgeMinutes() {
  if (-not (Test-Path $PipelineLog)) { return 0 }
  return ((Get-Date) - (Get-Item $PipelineLog).LastWriteTime).TotalMinutes
}

Stop-TaxesHubProcesses
$run = 0

while ($true) {
  $run += 1
  Write-WatchLog "=== Run #$run starting npm run taxgpt:finish-taxes-hub ==="

  if (Test-Path $PipelineLog) { Remove-Item $PipelineLog -Force -ErrorAction SilentlyContinue }
  if (Test-Path $PipelineErr) { Remove-Item $PipelineErr -Force -ErrorAction SilentlyContinue }

  $proc = Start-Process -FilePath 'npm.cmd' `
    -ArgumentList @('run', 'taxgpt:finish-taxes-hub') `
    -WorkingDirectory $Root `
    -NoNewWindow `
    -PassThru `
    -RedirectStandardOutput $PipelineLog `
    -RedirectStandardError $PipelineErr

  $staleKilled = $false

  while (-not $proc.HasExited) {
    Start-Sleep -Seconds $PollSeconds

    $age = Get-PipelineLogAgeMinutes
    if ($age -ge $StaleMinutes) {
      Write-WatchLog "No pipeline log activity for $([int]$age) min (threshold $StaleMinutes) - killing stale run"
      Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
      Stop-TaxesHubProcesses
      $staleKilled = $true
      break
    }
  }

  if (-not $proc.HasExited) {
    $proc.WaitForExit()
  }

  $exitCode = $proc.ExitCode
  Write-WatchLog "Run #$run exited with code $exitCode (staleKilled=$staleKilled)"

  if (Test-PipelineComplete) {
    Write-WatchLog 'Taxes hub finish pipeline complete - watcher stopping'
    break
  }

  Write-WatchLog "Restarting in $RestartDelaySeconds seconds..."
  Stop-TaxesHubProcesses
  Start-Sleep -Seconds $RestartDelaySeconds
}
