param(
    [Parameter(Mandatory = $true)]
    [string]$WorkspaceRoot
)

$ErrorActionPreference = "Stop"

function Write-Ok([string]$Message) {
    Write-Host "[OK]   $Message" -ForegroundColor Green
}

function Set-WorkspaceArtifact {
    param(
        [string]$Path,
        [string]$Content
    )

    Set-Content -LiteralPath $Path -Value $Content -Encoding utf8
    Write-Ok "Updated workspace artifact: $Path"
}

$workspaceRootResolved = [System.IO.Path]::GetFullPath($WorkspaceRoot)
if (-not (Test-Path -LiteralPath $workspaceRootResolved -PathType Container)) {
    throw "Workspace root not found: $workspaceRootResolved"
}

$governedProjectWrapper = @'
param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectName,

    [string]$ProjectRepo = "",

    [switch]$CheckLiveReadiness,

    [switch]$AllowOfflinePinnedCore
)

$ErrorActionPreference = "Stop"

function Write-Info([string]$Message) {
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

$workspaceRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$corePath = Join-Path $workspaceRoot ".Controlled-Vibe-Framework-CVF"
$bootstrapScript = Join-Path $corePath "scripts\new-cvf-workspace.ps1"
$doctorScript = Join-Path $corePath "scripts\check_cvf_workspace_agent_enforcement.ps1"
$gateScript = Join-Path $workspaceRoot "Run-CVF-NewProject-Enforcement.ps1"
$projectPath = Join-Path $workspaceRoot $ProjectName

foreach ($requiredPath in @($bootstrapScript, $doctorScript, $gateScript)) {
    if (-not (Test-Path -LiteralPath $requiredPath -PathType Leaf)) {
        throw "Required script not found: $requiredPath"
    }
}

Write-Info "Workspace root: $workspaceRoot"
Write-Info "Project name:   $ProjectName"

$bootstrapArgs = @(
    "-ExecutionPolicy", "Bypass",
    "-File", $bootstrapScript,
    "-WorkspaceRoot", $workspaceRoot,
    "-ProjectName", $ProjectName
)

if (-not [string]::IsNullOrWhiteSpace($ProjectRepo)) {
    $bootstrapArgs += "-ProjectRepo"
    $bootstrapArgs += $ProjectRepo
}

& powershell @bootstrapArgs
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

Write-Host ""
Write-Info "Running project doctor..."

$doctorArgs = @(
    "-ExecutionPolicy", "Bypass",
    "-File", $doctorScript,
    "-ProjectPath", $projectPath
)

if ($CheckLiveReadiness) {
    $doctorArgs += "-CheckLiveReadiness"
}

if ($AllowOfflinePinnedCore) {
    $doctorArgs += "-AllowOfflinePinnedCore"
}

& powershell @doctorArgs
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

Write-Host ""
Write-Info "Running workspace-wide new-project gate..."

$gateArgs = @(
    "-ExecutionPolicy", "Bypass",
    "-File", $gateScript
)

if ($CheckLiveReadiness) {
    $gateArgs += "-CheckLiveReadiness"
}

if ($AllowOfflinePinnedCore) {
    $gateArgs += "-AllowOfflinePinnedCore"
}

& powershell @gateArgs
exit $LASTEXITCODE
'@

$workspaceGateWrapper = @'
param(
    [switch]$CheckLiveReadiness,
    [switch]$AllowOfflinePinnedCore
)

$ErrorActionPreference = "Stop"

$workspaceRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$corePath = Join-Path $workspaceRoot ".Controlled-Vibe-Framework-CVF"
$gateScript = Join-Path $corePath "scripts\check_cvf_workspace_new_project_enforcement.ps1"

if (-not (Test-Path -LiteralPath $gateScript -PathType Leaf)) {
    throw "Workspace gate script not found: $gateScript"
}

$args = @(
    "-ExecutionPolicy", "Bypass",
    "-File", $gateScript,
    "-WorkspaceRoot", $workspaceRoot
)

if ($CheckLiveReadiness) {
    $args += "-CheckLiveReadiness"
}

if ($AllowOfflinePinnedCore) {
    $args += "-AllowOfflinePinnedCore"
}

& powershell @args
exit $LASTEXITCODE
'@

$userGuide = @"
# CVF Workspace User Guide

This workspace is the local user area for downstream projects that use the
public CVF core without mixing project code into the CVF core itself.

## 1. Workspace Layout

```text
CVF-Workspace/
  .Controlled-Vibe-Framework-CVF/
  <Project-A>/
  <Project-B>/
  WORKSPACE_RULES.md
  WORKSPACE_PROJECT_ENFORCEMENT_BASELINE.json
  New-CVF-Governed-Project.ps1
  Run-CVF-NewProject-Enforcement.ps1
  CVF_WORKSPACE_USER_GUIDE.md
```

Rules:

- The workspace root is not a git repo.
- Project code stays in sibling folders, not inside `.Controlled-Vibe-Framework-CVF/`.
- CVF core maintenance and workspace reconciliation run from the hidden core.

## 2. What The Hidden CVF Folder Is

`.Controlled-Vibe-Framework-CVF/` is a clone of the public repository:

`https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git`

Use it for:

- workspace bootstrap scripts
- workspace doctor / enforcement gate
- public-safe rules, guides, and continuation surfaces

Do not use it as the place to build the downstream app itself.

## 3. Fastest Safe Flow

For a brand-new governed project, use one command from the workspace root:

```powershell
powershell -ExecutionPolicy Bypass -File ".\New-CVF-Governed-Project.ps1" `
  -ProjectName "<project-name>"
```

If the project already has a remote repo:

```powershell
powershell -ExecutionPolicy Bypass -File ".\New-CVF-Governed-Project.ps1" `
  -ProjectName "<project-name>" `
  -ProjectRepo "<git-url>"
```

What this wrapper does:

- runs CVF bootstrap for the target project
- runs the project doctor
- runs the workspace-wide new-project enforcement gate

If this one command finishes with PASS, the new project is in the governed flow.

## 4. Daily Commands

Refresh the hidden public core:

```powershell
powershell -ExecutionPolicy Bypass -File ".Controlled-Vibe-Framework-CVF\scripts\update_cvf_workspace_public_core.ps1" `
  -WorkspaceRoot "$workspaceRootResolved" `
  -UpdateProjectManifests
```

Bootstrap a new project:

```powershell
powershell -ExecutionPolicy Bypass -File ".Controlled-Vibe-Framework-CVF\scripts\new-cvf-workspace.ps1" `
  -WorkspaceRoot "$workspaceRootResolved" `
  -ProjectName "<project-name>"
```

Run the doctor for one governed project:

```powershell
powershell -ExecutionPolicy Bypass -File ".Controlled-Vibe-Framework-CVF\scripts\check_cvf_workspace_agent_enforcement.ps1" `
  -ProjectPath "$workspaceRootResolved\<project-name>"
```

Run the workspace-wide new-project enforcement gate:

```powershell
powershell -ExecutionPolicy Bypass -File ".\Run-CVF-NewProject-Enforcement.ps1"
```

Optional secret-free readiness check:

```powershell
powershell -ExecutionPolicy Bypass -File ".\Run-CVF-NewProject-Enforcement.ps1" `
  -CheckLiveReadiness
```

## 5. Legacy Projects Vs New Projects

This workspace uses:

- `WORKSPACE_PROJECT_ENFORCEMENT_BASELINE.json` to grandfather old sibling repos
- the workspace gate to enforce rules for any new sibling repo not listed in the baseline

Meaning:

- old projects can remain as-is for now
- every new governed project must pass the doctor

## 6. What A Proper New Governed Project Must Have

After bootstrap, a governed project should contain at minimum:

- `.cvf/manifest.json`
- `.cvf/policy.json`
- `AGENTS.md`
- `docs/CVF_BOOTSTRAP_LOG_YYYYMMDD.md`
- `knowledge/README.md`

If these are missing, the project is not yet agent-enforcement-ready.

## 7. What The Workspace Inherits From CVF

This workspace inherits a public-safe operational subset of CVF:

- workspace isolation rules
- bootstrap contract
- doctor / enforcement gate
- downstream `AGENTS.md`
- `.cvf/manifest.json` and `.cvf/policy.json`
- public continuation and governance bootstrap surfaces

It does not claim private continuity surfaces, private operator memory, or
internal provenance state from this public checkout alone.

## 8. Practical Operating Rule

Use this decision rule:

- If you are maintaining CVF itself, work in the dedicated CVF repo.
- If you are building a downstream app with CVF rules, work inside the project folder under `CVF-Workspace`.
- If you add a new project, bootstrap it first, then run the enforcement gate.
"@

Set-WorkspaceArtifact -Path (Join-Path $workspaceRootResolved "New-CVF-Governed-Project.ps1") -Content $governedProjectWrapper
Set-WorkspaceArtifact -Path (Join-Path $workspaceRootResolved "Run-CVF-NewProject-Enforcement.ps1") -Content $workspaceGateWrapper
Set-WorkspaceArtifact -Path (Join-Path $workspaceRootResolved "CVF_WORKSPACE_USER_GUIDE.md") -Content $userGuide
