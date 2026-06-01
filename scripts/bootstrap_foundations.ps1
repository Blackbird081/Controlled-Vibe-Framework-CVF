#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Bootstrap all 4 CVF Foundation packages on a fresh clone.
.DESCRIPTION
    Installs dependencies in each foundation extension directory.

    When a local package-lock.json exists, the script uses `npm ci`.
    If a package does not ship a lockfile, the script falls back to
    `npm install`.

    This is a convenience wrapper. The canonical install policy remains
    "install per extension only when needed" as documented in
    docs/reference/CVF_NEW_MACHINE_SETUP_CHECKLIST.md.
.EXAMPLE
    .\scripts\bootstrap_foundations.ps1
#>

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot
$foundations = @(
    "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION",
    "EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION",
    "EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION",
    "EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION"
)

$failed = @()

foreach ($pkg in $foundations) {
    $fullPath = Join-Path $repoRoot $pkg
    $packageJsonPath = Join-Path $fullPath "package.json"
    $packageLockPath = Join-Path $fullPath "package-lock.json"

    if (-not (Test-Path -LiteralPath $packageJsonPath)) {
        Write-Host "SKIP: $pkg - no package.json found" -ForegroundColor Yellow
        continue
    }

    $installCommand = if (Test-Path -LiteralPath $packageLockPath) { "ci" } else { "install" }

    Write-Host ""
    Write-Host "=== Installing $pkg (npm $installCommand) ===" -ForegroundColor Cyan

    Push-Location $fullPath
    try {
        & npm $installCommand
        if ($LASTEXITCODE -ne 0) {
            throw "npm $installCommand failed"
        }
        Write-Host "OK: $pkg" -ForegroundColor Green
    }
    catch {
        Write-Host "FAIL: $pkg - $($_.Exception.Message)" -ForegroundColor Red
        $failed += $pkg
    }
    finally {
        Pop-Location
    }
}

Write-Host ""
if ($failed.Count -eq 0) {
    Write-Host "All 4 foundations bootstrapped successfully." -ForegroundColor Green
}
else {
    Write-Host "Failed packages: $($failed -join ', ')" -ForegroundColor Red
    exit 1
}
