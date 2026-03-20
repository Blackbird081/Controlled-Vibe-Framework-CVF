param(
    [switch]$LocalOnly
)

$ErrorActionPreference = "Stop"

$repoRoot = (git rev-parse --show-toplevel).Trim()
if (-not $repoRoot) {
    throw "Unable to resolve repository root."
}

$hooksPath = Join-Path $repoRoot ".githooks"
if (-not (Test-Path $hooksPath)) {
    throw "Hooks directory not found: $hooksPath"
}

git config core.hooksPath ".githooks"

if (-not $LocalOnly) {
    Write-Host "Configured Git hooks path to .githooks"
    Write-Host "Active hooks:"
    Get-ChildItem -Path $hooksPath -File | Select-Object -ExpandProperty Name | ForEach-Object {
        Write-Host " - $_"
    }
    Write-Host "Hook roles:"
    Write-Host " - pre-commit: governance hook chain wrapper (docs governance)"
    Write-Host " - pre-push: governance hook chain wrapper (docs + bug doc + test doc + baseline update)"
}
