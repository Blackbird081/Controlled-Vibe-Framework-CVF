param()

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path -LiteralPath (Join-Path $repoRoot ".git") -PathType Container)) { throw "Run this script from a Git clone of CVF." }
$remote = (git -C $repoRoot remote get-url origin | Out-String).Trim()
$head = (git -C $repoRoot rev-parse HEAD | Out-String).Trim()
git -C $repoRoot fetch origin main --quiet
$remoteHead = (git -C $repoRoot rev-parse origin/main | Out-String).Trim()
Write-Host "CVF repository clone bootstrap" -ForegroundColor Cyan
Write-Host "Remote: $remote"
Write-Host "Local:  $head"
Write-Host "Remote main: $remoteHead"

$statePath = Join-Path $repoRoot "CVF_SESSION\ACTIVE_SESSION_STATE.json"
$frontDoor = Join-Path $repoRoot "CVF_SESSION_MEMORY.md"
$bootstrapReadModel = Join-Path $repoRoot "CVF_SESSION\ACTIVE_SESSION_BOOTSTRAP_READ_MODEL.json"
if ((Test-Path -LiteralPath $frontDoor -PathType Leaf) -and (Test-Path -LiteralPath $statePath -PathType Leaf)) {
    if (-not (Test-Path -LiteralPath $bootstrapReadModel -PathType Leaf)) { throw "Provenance bootstrap read model is missing: CVF_SESSION/ACTIVE_SESSION_BOOTSTRAP_READ_MODEL.json" }
    $state = Get-Content -LiteralPath $statePath -Raw -Encoding utf8 | ConvertFrom-Json
    if ([string]::IsNullOrWhiteSpace([string]$state.activeHandoff) -or [string]::IsNullOrWhiteSpace([string]$state.nextAllowedMove)) { throw "Provenance state does not resolve activeHandoff and nextAllowedMove." }
    $activeHandoffPath = Join-Path $repoRoot ([string]$state.activeHandoff)
    if (-not (Test-Path -LiteralPath $activeHandoffPath -PathType Leaf)) { throw "Active handoff named by provenance state is missing: $($state.activeHandoff)" }
    Write-Host "Repository class: PROVENANCE"
    Write-Host "Continuity front door: CVF_SESSION_MEMORY.md"
    Write-Host "Bootstrap read model: CVF_SESSION/ACTIVE_SESSION_BOOTSTRAP_READ_MODEL.json"
    Write-Host "Active state: CVF_SESSION/ACTIVE_SESSION_STATE.json"
    Write-Host "Active handoff: $($state.activeHandoff)"
    Write-Host "Next allowed move: $($state.nextAllowedMove)"
}
else {
    $publicHandoff = Join-Path $repoRoot "AGENT_HANDOFF.md"
    if (-not (Test-Path -LiteralPath $publicHandoff -PathType Leaf)) { throw "Public continuation pointer is missing: AGENT_HANDOFF.md" }
    Write-Host "Repository class: PUBLIC_CORE"
    Write-Host "Continuity pointer: AGENT_HANDOFF.md"
    Write-Host "Private provenance state is intentionally not present in public clones."
}
if ($head -ne $remoteHead) {
    Write-Host "CLONE_NOT_AT_ORIGIN_MAIN: update or reconcile before governed work." -ForegroundColor Yellow
    exit 2
}
Write-Host "CVF_REPOSITORY_CONTINUITY_READY" -ForegroundColor Green
