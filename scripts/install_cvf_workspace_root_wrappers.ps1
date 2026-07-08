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

$workspaceUpdateWrapper = @'
param(
    [switch]$RunGate,
    [switch]$AllowOfflinePinnedCore
)

$ErrorActionPreference = "Stop"

function Write-Info([string]$Message) {
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Ok([string]$Message) {
    Write-Host "[OK]   $Message" -ForegroundColor Green
}

function Invoke-CheckedCommand([string]$Label, [scriptblock]$Command) {
    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "$Label failed with exit code $LASTEXITCODE"
    }
}

$workspaceRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$corePath = Join-Path $workspaceRoot ".Controlled-Vibe-Framework-CVF"
$installerPath = Join-Path $corePath "scripts\install_cvf_workspace_root_wrappers.ps1"
$gatePath = Join-Path $workspaceRoot "Run-CVF-NewProject-Enforcement.ps1"
$allowedRemotes = @(
    "https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git",
    "git@github.com:Blackbird081/Controlled-Vibe-Framework-CVF.git"
)

if (-not (Test-Path -LiteralPath $corePath -PathType Container)) {
    throw "CVF public core not found: $corePath"
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw "git is required but was not found in PATH."
}

$remote = (git -C $corePath remote get-url origin).Trim()
if ($allowedRemotes -notcontains $remote) {
    throw "Unexpected CVF public core remote: $remote"
}

$pending = git -C $corePath status --porcelain
if ($pending) {
    throw "CVF public core has pending changes; refusing update: $corePath"
}

Write-Info "Fetching public CVF core..."
Invoke-CheckedCommand "git fetch" { git -C $corePath fetch origin --prune }

Write-Info "Fast-forwarding public CVF core..."
Invoke-CheckedCommand "git pull --ff-only" { git -C $corePath pull --ff-only origin main }

if (-not (Test-Path -LiteralPath $installerPath -PathType Leaf)) {
    throw "Workspace wrapper installer not found: $installerPath"
}

Write-Info "Refreshing workspace-root wrappers and guides..."
& powershell -ExecutionPolicy Bypass -File $installerPath -WorkspaceRoot $workspaceRoot
if ($LASTEXITCODE -ne 0) {
    throw "Workspace wrapper installer failed with exit code $LASTEXITCODE"
}

$head = (git -C $corePath rev-parse --short HEAD).Trim()
$originHead = (git -C $corePath rev-parse --short origin/main).Trim()
if ($head -ne $originHead) {
    throw "CVF public core is not current after update: HEAD=$head origin/main=$originHead"
}

Write-Ok "CVF workspace updated to public core commit $head."

if ($RunGate) {
    if (-not (Test-Path -LiteralPath $gatePath -PathType Leaf)) {
        throw "Workspace enforcement wrapper not found: $gatePath"
    }
    $gateArgs = @("-ExecutionPolicy", "Bypass", "-File", $gatePath)
    if ($AllowOfflinePinnedCore) {
        $gateArgs += "-AllowOfflinePinnedCore"
    }
    & powershell @gateArgs
    exit $LASTEXITCODE
}

exit 0
'@

$userGuide = @'
# CVF Workspace User Guide

This workspace is the local operator area for downstream projects that use CVF
rules without mixing application code into the CVF core.

## Purpose

- Keep the hidden CVF core separate from app projects.
- Bootstrap new governed projects in a repeatable way.
- Run the doctor and the workspace-level enforcement gate from one place.

## Workspace Layout

```text
CVF-Workspace/
  .Controlled-Vibe-Framework-CVF/
  <Project-A>/
  <Project-B>/
  WORKSPACE_RULES.md
  New-CVF-Governed-Project.ps1
  Run-CVF-NewProject-Enforcement.ps1
  Update-CVF-Workspace.ps1
  CVF_WORKSPACE_USER_GUIDE.md
  CVF_WORKSPACE_HUONG_DAN_SU_DUNG.md
```

## Common Commands

Create a new governed project:

```powershell
powershell -ExecutionPolicy Bypass -File ".\New-CVF-Governed-Project.ps1" `
  -ProjectName "<project-name>"
```

Create a new governed project from an existing repo:

```powershell
powershell -ExecutionPolicy Bypass -File ".\New-CVF-Governed-Project.ps1" `
  -ProjectName "<project-name>" `
  -ProjectRepo "<git-url>"
```

Run the workspace-wide enforcement gate:

```powershell
powershell -ExecutionPolicy Bypass -File ".\Run-CVF-NewProject-Enforcement.ps1"
```

Update the hidden public CVF core and refresh workspace-root wrappers:

```powershell
powershell -ExecutionPolicy Bypass -File ".\Update-CVF-Workspace.ps1" -RunGate
```

## Important Rules

- The workspace root is not a git repository.
- Downstream projects must stay as sibling folders.
- Do not place application code inside `.Controlled-Vibe-Framework-CVF/`.
- Use the hidden core only for CVF maintenance, bootstrap, and doctor flows.

## When To Use This Guide

Use this file when you need the shortest path to:

- bootstrap a new project
- verify a project with the doctor
- understand the local workspace boundary

## Vietnamese Guide

See the localized companion guide:

- `CVF_WORKSPACE_HUONG_DAN_SU_DUNG.md`
'@

$vietnameseGuide = @'
# Hướng Dẫn Sử Dụng CVF Workspace

Đây là vùng làm việc local cho các project downstream dùng CVF mà không đưa
code ứng dụng vào trong core CVF.

## Mục tiêu

- Giữ tách biệt giữa hidden CVF core và project sản phẩm.
- Tạo project mới theo chuẩn thống nhất.
- Chạy doctor và enforcement gate từ một nơi duy nhất.

## Cấu trúc Workspace

```text
CVF-Workspace/
  .Controlled-Vibe-Framework-CVF/
  <Project-A>/
  <Project-B>/
  WORKSPACE_RULES.md
  New-CVF-Governed-Project.ps1
  Run-CVF-NewProject-Enforcement.ps1
  Update-CVF-Workspace.ps1
  CVF_WORKSPACE_USER_GUIDE.md
  CVF_WORKSPACE_HUONG_DAN_SU_DUNG.md
```

## Lệnh Thường Dùng

Tạo project governed mới:

```powershell
powershell -ExecutionPolicy Bypass -File ".\New-CVF-Governed-Project.ps1" `
  -ProjectName "<project-name>"
```

Tạo project governed từ repo có sẵn:

```powershell
powershell -ExecutionPolicy Bypass -File ".\New-CVF-Governed-Project.ps1" `
  -ProjectName "<project-name>" `
  -ProjectRepo "<git-url>"
```

Chạy enforcement gate cho toàn workspace:

```powershell
powershell -ExecutionPolicy Bypass -File ".\Run-CVF-NewProject-Enforcement.ps1"
```

Cập nhật hidden public CVF core và làm mới wrapper ở workspace root:

```powershell
powershell -ExecutionPolicy Bypass -File ".\Update-CVF-Workspace.ps1" -RunGate
```

## Quy Tắc Quan Trọng

- Workspace root không phải git repository.
- Project downstream phải là folder anh em, không nằm bên trong core.
- Không đặt code ứng dụng vào `.Controlled-Vibe-Framework-CVF/`.
- Dùng hidden core cho bootstrap, maintenance và doctor.

## Khi Nào Dùng File Này

Dùng file này khi cần:

- bootstrap project mới
- chạy doctor để kiểm tra project
- hiểu ranh giới của workspace local

## Tài Liệu Liên Quan

- `CVF_WORKSPACE_USER_GUIDE.md`
'@

Set-WorkspaceArtifact -Path (Join-Path $workspaceRootResolved "New-CVF-Governed-Project.ps1") -Content $governedProjectWrapper
Set-WorkspaceArtifact -Path (Join-Path $workspaceRootResolved "Run-CVF-NewProject-Enforcement.ps1") -Content $workspaceGateWrapper
Set-WorkspaceArtifact -Path (Join-Path $workspaceRootResolved "Update-CVF-Workspace.ps1") -Content $workspaceUpdateWrapper
Set-WorkspaceArtifact -Path (Join-Path $workspaceRootResolved "CVF_WORKSPACE_USER_GUIDE.md") -Content $userGuide
Set-WorkspaceArtifact -Path (Join-Path $workspaceRootResolved "CVF_WORKSPACE_HUONG_DAN_SU_DUNG.md") -Content $vietnameseGuide

# This installer is the public-safe flow and never writes overlay tooling.
# Remove any overlay artifacts a prior full/provenance installer run left
# behind, so the workspace root does not end up documenting or exposing
# commands this flow does not support.
$orphanedOverlayArtifacts = @(
    "Get-CVF-Workspace-OverlayProfiles.ps1",
    "Update-CVF-Workspace-Overlay.ps1",
    "CVF_WORKSPACE_OVERLAY_STATUS.json"
)
foreach ($orphan in $orphanedOverlayArtifacts) {
    $orphanPath = Join-Path $workspaceRootResolved $orphan
    if (Test-Path -LiteralPath $orphanPath -PathType Leaf) {
        Remove-Item -LiteralPath $orphanPath -Force
        Write-Ok "Removed orphaned overlay artifact (not part of the public-safe flow): $orphanPath"
    }
}
