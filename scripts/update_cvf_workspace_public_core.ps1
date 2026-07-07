param(
    [Parameter(Mandatory = $true)]
    [string]$WorkspaceRoot,

    [string]$OverlaySourcePath = "",

    [switch]$UpdateProjectManifests,

    [switch]$AllowPendingCoreBackup
)

$ErrorActionPreference = "Stop"
$publicRemote = "https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git"
$workspaceWrapperInstallerPath = Join-Path $PSScriptRoot "install_cvf_workspace_root_wrappers.ps1"
$requiredPublicCoreFiles = @(
    "AGENTS.md",
    "AGENT_HANDOFF.md",
    "AGENT_HANDOFF.md",
    "docs\reference\CVF_WORKSPACE_RULES.md",
    "governance\toolkit\05_OPERATION\CVF_DOWNSTREAM_AGENTS_TEMPLATE.md",
    "scripts\check_cvf_workspace_agent_enforcement.ps1",
    "scripts\ingest_cvf_downstream_knowledge.ps1",
    "scripts\new-cvf-workspace.ps1",
    "scripts\update_cvf_workspace_public_core.ps1",
    "scripts\write_cvf_workspace_web_evidence_bridge.ps1"
)
$overlayFiles = @(
    "README.md",
    "AGENTS.md",
    "AGENT_HANDOFF.md",
    "docs\GET_STARTED.md",
    "docs\reference\CVF_WORKSPACE_RULES.md",
    "docs\reference\CVF_W114_PUBLIC_EVIDENCE_PACKET_2026-04-23.md",
    "governance\toolkit\05_OPERATION\CVF_DOWNSTREAM_AGENTS_TEMPLATE.md",
    "governance\toolkit\05_OPERATION\CVF_PUBLIC_CORE_AGENTS.md",
    "scripts\bootstrap_foundations.ps1",
    "scripts\bootstrap_foundations.sh",
    "scripts\check_cvf_workspace_agent_enforcement.ps1",
    "scripts\ingest_cvf_downstream_knowledge.ps1",
    "scripts\install_cvf_hooks.ps1",
    "scripts\new-cvf-workspace.ps1",
    "scripts\update_cvf_workspace_public_core.ps1",
    "scripts\w114_cp7_multi_sample_downstream_proof.ps1",
    "scripts\write_cvf_workspace_web_evidence_bridge.ps1"
)
$overlayManifestFile = "_cvf_overlay_export_manifest.json"

function Write-Info([string]$Message) { Write-Host "[INFO] $Message" -ForegroundColor Cyan }
function Write-Ok([string]$Message) { Write-Host "[OK]   $Message" -ForegroundColor Green }
function Write-Warn([string]$Message) { Write-Host "[WARN] $Message" -ForegroundColor Yellow }

function Assert-PathInsideWorkspace([string]$Path, [string]$Workspace) {
    $resolved = [System.IO.Path]::GetFullPath($Path)
    $workspacePrefix = [System.IO.Path]::GetFullPath($Workspace).TrimEnd("\") + "\"
    if (-not $resolved.StartsWith($workspacePrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing filesystem move outside workspace root: $resolved"
    }
    return $resolved
}

function Get-OverlayRelativePaths([string]$SourceRoot) {
    $manifestPath = Join-Path $SourceRoot $overlayManifestFile
    if (Test-Path -LiteralPath $manifestPath -PathType Leaf) {
        $manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding utf8 | ConvertFrom-Json
        if (-not $manifest.files) {
            throw "Overlay manifest does not contain a files array: $manifestPath"
        }
        return @($manifest.files | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Sort-Object -Unique)
    }

    return $overlayFiles
}

function Copy-OverlayFiles([string]$SourceRoot, [string]$TargetRoot) {
    $relativePaths = Get-OverlayRelativePaths -SourceRoot $SourceRoot
    foreach ($relativePath in $relativePaths) {
        $source = Join-Path $SourceRoot $relativePath
        if (-not (Test-Path -LiteralPath $source -PathType Leaf)) {
            continue
        }
        $target = Join-Path $TargetRoot $relativePath
        $targetDir = Split-Path -Parent $target
        if (-not (Test-Path -LiteralPath $targetDir -PathType Container)) {
            New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
        }
        Copy-Item -LiteralPath $source -Destination $target -Force
        Write-Info "Overlay: $relativePath"
    }
}

function Write-LocalWorkspaceRules([string]$Workspace, [string]$CorePath) {
    $projects = Get-ChildItem -LiteralPath $Workspace -Directory -Force |
        Where-Object { $_.Name -notin @(".Controlled-Vibe-Framework-CVF", ".agents", "scripts", "_cvf-core-backups") } |
        Sort-Object Name |
        ForEach-Object { "  $($_.Name)/" }
    $projectList = if ($projects.Count -gt 0) { $projects -join "`r`n" } else { "  <Application-Project>/" }
    $rulesPath = Join-Path $Workspace "WORKSPACE_RULES.md"
    $content = @"
# CVF Workspace Rules

> Local generated workspace copy.
>
> Canonical source: `.Controlled-Vibe-Framework-CVF/docs/reference/CVF_WORKSPACE_RULES.md`.

## Purpose

This root is a non-git container for the public CVF core clone and sibling
downstream projects. Application work belongs in each project folder.

## Required Layout

~~~text
CVF-Workspace/
  .Controlled-Vibe-Framework-CVF/
  <Application-Project>/
  WORKSPACE_RULES.md
~~~

## Public Core

- Path: $CorePath
- Remote: $publicRemote
- Keep downstream application source outside `.Controlled-Vibe-Framework-CVF/`.
- Run framework maintenance and workspace reconciliation from the public core.

Reconcile the hidden core with the latest public remote:

~~~powershell
powershell -ExecutionPolicy Bypass -File ".Controlled-Vibe-Framework-CVF\scripts\update_cvf_workspace_public_core.ps1" ``
  -WorkspaceRoot "$Workspace"
~~~

## Current Sibling Projects

~~~text
$projectList
~~~

## Boundary

Workspace doctor PASS proves local enforcement artifacts and public-core
freshness checks. It does not replace live provider-backed governance proof.
"@
    Set-Content -LiteralPath $rulesPath -Value $content -Encoding utf8
    Write-Ok "Refreshed workspace rules: $rulesPath"
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw "git is required but was not found in PATH."
}

$workspaceResolved = [System.IO.Path]::GetFullPath($WorkspaceRoot)
if (-not (Test-Path -LiteralPath $workspaceResolved -PathType Container)) {
    throw "Workspace root not found: $workspaceResolved"
}

$corePath = Assert-PathInsideWorkspace -Path (Join-Path $workspaceResolved ".Controlled-Vibe-Framework-CVF") -Workspace $workspaceResolved
$backupRoot = Assert-PathInsideWorkspace -Path (Join-Path $workspaceResolved "_cvf-core-backups") -Workspace $workspaceResolved
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupPath = Assert-PathInsideWorkspace -Path (Join-Path $backupRoot ".Controlled-Vibe-Framework-CVF-$timestamp") -Workspace $workspaceResolved

Write-Info "Workspace root: $workspaceResolved"
Write-Info "Public remote:  $publicRemote"

if (Test-Path -LiteralPath $corePath -PathType Container) {
    $pending = git -C $corePath status --porcelain 2>$null
    if ($pending) {
        if (-not $AllowPendingCoreBackup) {
            throw "Existing hidden core has pending changes. Review them before migration, or rerun with -AllowPendingCoreBackup to preserve them in a backup: $corePath"
        }
        Write-Warn "Existing hidden core has pending changes; preserving them in backup before replacement."
    }
    if (-not (Test-Path -LiteralPath $backupRoot -PathType Container)) {
        New-Item -ItemType Directory -Path $backupRoot | Out-Null
    }
    Write-Info "Backing up hidden core to: $backupPath"
    Move-Item -LiteralPath $corePath -Destination $backupPath
    Write-Ok "Existing hidden core backed up"
}

try {
    Write-Info "Cloning latest public core..."
    git clone $publicRemote $corePath
    if ($LASTEXITCODE -ne 0) {
        throw "git clone failed with exit code $LASTEXITCODE"
    }

    if (-not [string]::IsNullOrWhiteSpace($OverlaySourcePath)) {
        $overlayResolved = [System.IO.Path]::GetFullPath($OverlaySourcePath)
        if (-not (Test-Path -LiteralPath $overlayResolved -PathType Container)) {
            throw "Overlay source not found: $overlayResolved"
        }
        Write-Warn "Applying reviewed local overlay: $overlayResolved"
        Copy-OverlayFiles -SourceRoot $overlayResolved -TargetRoot $corePath
    }

    $missing = @($requiredPublicCoreFiles | Where-Object {
        -not (Test-Path -LiteralPath (Join-Path $corePath $_) -PathType Leaf)
    })
    if ($missing.Count -gt 0) {
        throw "Fresh public core is missing required workspace kit files: $($missing -join ', ')"
    }

    $coreCommit = (git -C $corePath rev-parse --short HEAD).Trim()
    Write-Ok "Public core ready at commit: $coreCommit"

    if ($UpdateProjectManifests) {
        Get-ChildItem -LiteralPath $workspaceResolved -Directory -Force |
            Where-Object { $_.FullName -ne $corePath -and $_.FullName -ne $backupRoot } |
            ForEach-Object {
                $manifestPath = Join-Path $_.FullName ".cvf\manifest.json"
                if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) {
                    return
                }
                $manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding utf8 | ConvertFrom-Json
                if ($manifest.cvfCorePath -ne $corePath) {
                    Write-Warn "Skipping manifest with a different core path: $manifestPath"
                    return
                }
                $manifest.cvfCoreCommit = $coreCommit
                $manifest | Add-Member -NotePropertyName cvfPublicRemote -NotePropertyValue $publicRemote -Force
                $manifest | Add-Member -NotePropertyName publicCoreFreshnessRequired -NotePropertyValue $true -Force
                $manifest | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $manifestPath -Encoding utf8
                Write-Ok "Updated manifest pin: $manifestPath"
            }
    }

    Write-LocalWorkspaceRules -Workspace $workspaceResolved -CorePath $corePath

    if (Test-Path -LiteralPath $workspaceWrapperInstallerPath -PathType Leaf) {
        & powershell -ExecutionPolicy Bypass -File $workspaceWrapperInstallerPath -WorkspaceRoot $workspaceResolved
        if ($LASTEXITCODE -ne 0) {
            exit $LASTEXITCODE
        }
    }
    else {
        Write-Warn "Workspace wrapper installer not found: $workspaceWrapperInstallerPath"
    }
}
catch {
    if (Test-Path -LiteralPath $backupPath -PathType Container) {
        if (Test-Path -LiteralPath $corePath -PathType Container) {
            $failedPath = Assert-PathInsideWorkspace -Path (Join-Path $backupRoot ".Controlled-Vibe-Framework-CVF-failed-$timestamp") -Workspace $workspaceResolved
            Write-Warn "Preserving failed replacement clone at: $failedPath"
            Move-Item -LiteralPath $corePath -Destination $failedPath
        }
        Write-Warn "Restoring backed-up hidden core after migration failure"
        Move-Item -LiteralPath $backupPath -Destination $corePath
    }
    throw
}

Write-Host ""
Write-Ok "Workspace public-core reconciliation complete."
Write-Host "Run the workspace doctor for each bootstrapped project:" -ForegroundColor Yellow
Write-Host "  powershell -ExecutionPolicy Bypass -File `"$corePath\scripts\check_cvf_workspace_agent_enforcement.ps1`" -ProjectPath `"<project-path>`""
