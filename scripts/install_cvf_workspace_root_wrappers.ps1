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

    $parent = Split-Path -Parent $Path
    if (-not [string]::IsNullOrWhiteSpace($parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }
    Set-Content -LiteralPath $Path -Value $Content -Encoding utf8
    Write-Ok "Updated workspace artifact: $Path"
}

function Set-WorkspaceArtifactIfMissing {
    param(
        [string]$Path,
        [string]$Content
    )

    if (Test-Path -LiteralPath $Path -PathType Leaf) {
        Write-Ok "Preserved existing workspace artifact: $Path"
        return
    }

    $parent = Split-Path -Parent $Path
    if (-not [string]::IsNullOrWhiteSpace($parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }
    Set-Content -LiteralPath $Path -Value $Content -Encoding utf8
    Write-Ok "Created workspace artifact: $Path"
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

$agentOnboardWorkflow = @'
---
description: Bootstrap or refresh a downstream project in CVF-Workspace using the current public-safe wrapper flow
---

# CVF Workspace Onboard Workflow

Use this workflow from the workspace root:

```powershell
D:\UNG DUNG AI\TOOL AI 2026\CVF-Workspace
```

This is a workspace-local agent workflow. It is not the private full CVF
repository, and it must not copy private-only CVF state into downstream
projects.

## Startup

Before changing a project or creating a new one, read:

1. `WORKSPACE_RULES.md`
2. `CVF_WORKSPACE_USER_GUIDE.md` or `CVF_WORKSPACE_HUONG_DAN_SU_DUNG.md`
3. `CVF_WORKSPACE_RULE_PACKS.md` when present
4. `CVF_RULE_PACKS/ACTIVE_RULE_PACK.json` when present
5. `CVF_WORKSPACE_MEMORY.md` and `AGENT_HANDOFF.md` when present

Use the hidden public core only as the framework source:

```text
.Controlled-Vibe-Framework-CVF/
```

Application code belongs in sibling project folders, never inside the hidden
public core.

## Refresh The Workspace Core

Run this when the hidden public core or root wrapper files may be stale:

```powershell
powershell -ExecutionPolicy Bypass -File ".\Update-CVF-Workspace.ps1" -RunGate
```

If the root update wrapper is missing, use the hidden-core reconciler:

```powershell
powershell -ExecutionPolicy Bypass -File ".Controlled-Vibe-Framework-CVF\scripts\update_cvf_workspace_public_core.ps1" `
  -WorkspaceRoot "D:\UNG DUNG AI\TOOL AI 2026\CVF-Workspace"
```

## Create A New Governed Project

From an empty/new project folder:

```powershell
powershell -ExecutionPolicy Bypass -File ".\New-CVF-Governed-Project.ps1" `
  -ProjectName "<project-name>"
```

From an existing git repository:

```powershell
powershell -ExecutionPolicy Bypass -File ".\New-CVF-Governed-Project.ps1" `
  -ProjectName "<project-name>" `
  -ProjectRepo "<git-url>"
```

After creation, run the workspace enforcement gate:

```powershell
powershell -ExecutionPolicy Bypass -File ".\Run-CVF-NewProject-Enforcement.ps1"
```

## Refresh Rule Packs

Rule packs are selected local guidance copied into the workspace by an
operator-approved source. They are useful for agent memory, handoff, boundary
discipline, and project startup, but they do not turn this workspace into the
private full CVF repository.

Use the refresh command recorded in:

```text
CVF_WORKSPACE_RULE_PACKS.md
```

The current active profile is recorded in:

```text
CVF_RULE_PACKS/ACTIVE_RULE_PACK.json
```

Existing root continuity files such as `CVF_WORKSPACE_MEMORY.md` and
`AGENT_HANDOFF.md` are preserved by the rule-pack sync. Agents may read and
update them as workspace-local continuity surfaces when the operator asks them
to do so.

## Boundary Rules

- Do not create or edit downstream application code under `.Controlled-Vibe-Framework-CVF/`.
- Do not copy private-only CVF state, private source mirrors, live-key files, or internal handoffs into downstream projects.
- Do not claim a project is CVF-governed only because the workspace root has rule packs. The project must have its own generated files, policy, or explicit onboarding evidence.
- Do not manually rewrite `WORKSPACE_RULES.md` to register a project. Use the wrapper and enforcement gate first.
- Keep project-local memory, task state, and handoff files inside the project when the project needs its own continuity.

## Legacy Note

The old `scripts/cvf-onboard.ps1` flow creates a heavier `.cvf/` structure and
is kept only as a legacy local tool. Prefer the root wrappers above for current
workspace productization.
'@

$agentPreCommitWorkflow = @'
---
description: Run the right pre-commit checks for a CVF-Workspace project without accidentally invoking full CVF repository governance
---

# CVF Workspace Pre-Commit Workflow

Run this before committing inside a downstream project in:

```text
D:\UNG DUNG AI\TOOL AI 2026\CVF-Workspace
```

This workflow is intentionally lighter than the private full CVF guard chain.
A normal workspace project should run its own tests and the workspace
enforcement gate. It should not run internal CVF checker suites unless the
change is inside the hidden public core.

## Step 1: Identify The Lane

From the folder you are about to commit, check where you are:

```powershell
git rev-parse --show-toplevel
git status --short
```

Use this routing:

- Downstream application project: run the project checks in Step 2 and the
  workspace gate in Step 3.
- Hidden public core `.Controlled-Vibe-Framework-CVF`: use that repository's
  own documented checks and hooks, then run Step 3 from the workspace root.
- Workspace root: do not commit from here. The root is a non-git container.

## Step 2: Run Project-Local Checks

Use the project's own package manager and test commands. Common examples:

```powershell
npm test
npm run lint
python -m pytest
```

Skip commands that do not exist for the project. Do not invent a heavy CVF gate
for a simple downstream app unless that app explicitly generated one.

## Step 3: Run Workspace Enforcement

Return to the workspace root:

```powershell
Set-Location "D:\UNG DUNG AI\TOOL AI 2026\CVF-Workspace"
```

Then run:

```powershell
powershell -ExecutionPolicy Bypass -File ".\Run-CVF-NewProject-Enforcement.ps1"
```

This verifies the workspace layout and public-core relationship. It does not
replace project-local tests.

## Step 4: Refresh First When Core Is Stale

If `.Controlled-Vibe-Framework-CVF/` looks stale or wrapper files are missing,
refresh before committing project changes:

```powershell
powershell -ExecutionPolicy Bypass -File ".\Update-CVF-Workspace.ps1" -RunGate
```

If optional rule packs are needed, use the refresh command recorded in:

```text
CVF_WORKSPACE_RULE_PACKS.md
```

## Step 5: Commit In The Project Repo

Commit only inside the downstream project repository:

```powershell
git add -A
git commit -m "<short project-scoped message>"
```

Keep commits project-scoped. Do not mix application changes, hidden public-core
updates, and workspace-rule-pack refreshes in the same commit.

## When To Use Full CVF Governance Checks

Use full `governance/compat` checks only when you are deliberately working
inside the CVF repository itself. For normal workspace projects, the useful CVF
inheritance is:

- workspace boundary discipline;
- local memory and handoff continuity;
- selected rule packs;
- project-local testing;
- explicit operator approval before adding heavier governance.
'@

$workspaceProjectBaseline = @'
{
  "schemaVersion": "1.0",
  "legacyProjects": []
}
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
  WORKSPACE_PROJECT_ENFORCEMENT_BASELINE.json
  New-CVF-Governed-Project.ps1
  Run-CVF-NewProject-Enforcement.ps1
  Update-CVF-Workspace.ps1
  .agents/workflows/
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

## Agent Workflows

The public-safe installer also maintains optional agent workflow notes under:

- `.agents/workflows/cvf-onboard.md`
- `.agents/workflows/pre-commit-check.md`

These files guide agents toward the wrapper flow, project-local tests,
workspace memory and handoff files, and rule-pack guidance when installed.
They do not authorize copying private-only CVF state into downstream projects.

## Enforcement Baseline

The installer creates `WORKSPACE_PROJECT_ENFORCEMENT_BASELINE.json` when it is
missing. Existing baselines are preserved so older projects stay grandfathered
only when the operator already recorded them.

## Optional Rule Packs

Some operator-local workspaces may also have curated CVF rule packs installed
under `CVF_RULE_PACKS/`.

If present, read:

- `CVF_WORKSPACE_RULE_PACKS.md`
- `CVF_RULE_PACKS/ACTIVE_RULE_PACK.json`
- `CVF_WORKSPACE_MEMORY.md`
- `AGENT_HANDOFF.md`

Rule packs are optional local guidance. They do not turn this workspace into a
private full CVF repository, and they should not replace project-level
`AGENTS.md`, manifests, policies, or handoffs.

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
  WORKSPACE_PROJECT_ENFORCEMENT_BASELINE.json
  New-CVF-Governed-Project.ps1
  Run-CVF-NewProject-Enforcement.ps1
  Update-CVF-Workspace.ps1
  .agents/workflows/
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

## Agent Workflow

Public-safe installer cũng duy trì các ghi chú workflow cho agent tại:

- `.agents/workflows/cvf-onboard.md`
- `.agents/workflows/pre-commit-check.md`

Các file này hướng agent dùng wrapper flow, test riêng của project, workspace
memory, handoff và rule pack khi có cài đặt. Chúng không cho phép copy private
CVF state vào project downstream.

## Enforcement Baseline

Installer tạo `WORKSPACE_PROJECT_ENFORCEMENT_BASELINE.json` khi file này chưa
có. Baseline hiện có được giữ nguyên để các project cũ chỉ được exempt khi
operator đã ghi nhận từ trước.

## Rule Pack Tùy Chọn

Một số workspace operator-local có thể được cài thêm rule pack đã chọn lọc
trong `CVF_RULE_PACKS/`.

Nếu có, đọc các file sau:

- `CVF_WORKSPACE_RULE_PACKS.md`
- `CVF_RULE_PACKS/ACTIVE_RULE_PACK.json`
- `CVF_WORKSPACE_MEMORY.md`
- `AGENT_HANDOFF.md`

Rule pack là hướng dẫn local tùy chọn. Nó không biến workspace này thành private
full CVF repository, và không thay thế `AGENTS.md`, manifest, policy hay
handoff riêng của từng project.

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
Set-WorkspaceArtifact -Path (Join-Path $workspaceRootResolved ".agents\workflows\cvf-onboard.md") -Content $agentOnboardWorkflow
Set-WorkspaceArtifact -Path (Join-Path $workspaceRootResolved ".agents\workflows\pre-commit-check.md") -Content $agentPreCommitWorkflow
Set-WorkspaceArtifactIfMissing -Path (Join-Path $workspaceRootResolved "WORKSPACE_PROJECT_ENFORCEMENT_BASELINE.json") -Content $workspaceProjectBaseline
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
