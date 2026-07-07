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

$userGuide = @'
# CVF Workspace User Guide

This workspace is the local operator area for downstream projects that use CVF
rules without mixing application code into the CVF core.

## Purpose

- Keep the hidden CVF core separate from app projects.
- Bootstrap new governed projects in a repeatable way.
- Run the doctor and the workspace-level enforcement gate from one place.
- Keep a clear boundary between public-safe usage and local-only overlay usage.

## Workspace Layout

```text
CVF-Workspace/
  .Controlled-Vibe-Framework-CVF/
  <Project-A>/
  <Project-B>/
  WORKSPACE_RULES.md
  New-CVF-Governed-Project.ps1
  Run-CVF-NewProject-Enforcement.ps1
  Get-CVF-Workspace-OverlayProfiles.ps1
  Update-CVF-Workspace-Overlay.ps1
  CVF_WORKSPACE_OVERLAY_STATUS.json
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

Check overlay profiles:

```powershell
powershell -ExecutionPolicy Bypass -File ".\Get-CVF-Workspace-OverlayProfiles.ps1"
```

Apply a workspace overlay:

```powershell
powershell -ExecutionPolicy Bypass -File ".\Update-CVF-Workspace-Overlay.ps1" `
  -ProfileName "provenance-local" `
  -UpdateProjectManifests
```

## Overlay Levels

- `public-core`: public CVF core only
- `premium-workspace`: public-safe curated overlay
- `premium-extended-workspace`: curated overlay with optional operator and skill lanes
- `provenance-local`: local-only overlay with full continuity surfaces
- `provenance-extended-local`: local-only overlay with full continuity plus optional lanes

## Important Rules

- The workspace root is not a git repository.
- Downstream projects must stay as sibling folders.
- Do not place application code inside `.Controlled-Vibe-Framework-CVF/`.
- Use the hidden core only for CVF maintenance, bootstrap, and doctor flows.
- Public-safe updates and local-only provenance overlays are separate concerns.

## When To Use This Guide

Use this file when you need the shortest path to:

- bootstrap a new project
- verify a project with the doctor
- inspect available overlay profiles
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
- Phân biệt rõ phần public-safe và phần overlay local-only.

## Cấu trúc Workspace

```text
CVF-Workspace/
  .Controlled-Vibe-Framework-CVF/
  <Project-A>/
  <Project-B>/
  WORKSPACE_RULES.md
  New-CVF-Governed-Project.ps1
  Run-CVF-NewProject-Enforcement.ps1
  Get-CVF-Workspace-OverlayProfiles.ps1
  Update-CVF-Workspace-Overlay.ps1
  CVF_WORKSPACE_OVERLAY_STATUS.json
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

Xem danh sách overlay profile:

```powershell
powershell -ExecutionPolicy Bypass -File ".\Get-CVF-Workspace-OverlayProfiles.ps1"
```

Áp overlay lên hidden core:

```powershell
powershell -ExecutionPolicy Bypass -File ".\Update-CVF-Workspace-Overlay.ps1" `
  -ProfileName "provenance-local" `
  -UpdateProjectManifests
```

## Các Mức Overlay

- `public-core`: chỉ dùng public CVF core
- `premium-workspace`: overlay curated, an toàn cho public-safe usage
- `premium-extended-workspace`: overlay curated có thêm operator lane và skill lane
- `provenance-local`: overlay local-only, có full continuity surfaces
- `provenance-extended-local`: overlay local-only, có full continuity và lane mở rộng

## Quy Tắc Quan Trọng

- Workspace root không phải git repository.
- Project downstream phải là folder anh em, không nằm bên trong core.
- Không đặt code ứng dụng vào `.Controlled-Vibe-Framework-CVF/`.
- Dùng hidden core cho bootstrap, maintenance và doctor.
- Public-safe update và overlay provenance local là hai luồng khác nhau.

## Khi Nào Dùng File Này

Dùng file này khi cần:

- bootstrap project mới
- chạy doctor để kiểm tra project
- xem overlay profile đang có
- hiểu ranh giới của workspace local

## Tài Liệu Liên Quan

- `CVF_WORKSPACE_USER_GUIDE.md`
'@

Set-WorkspaceArtifact -Path (Join-Path $workspaceRootResolved "New-CVF-Governed-Project.ps1") -Content $governedProjectWrapper
Set-WorkspaceArtifact -Path (Join-Path $workspaceRootResolved "Run-CVF-NewProject-Enforcement.ps1") -Content $workspaceGateWrapper
Set-WorkspaceArtifact -Path (Join-Path $workspaceRootResolved "CVF_WORKSPACE_USER_GUIDE.md") -Content $userGuide
Set-WorkspaceArtifact -Path (Join-Path $workspaceRootResolved "CVF_WORKSPACE_HUONG_DAN_SU_DUNG.md") -Content $vietnameseGuide
