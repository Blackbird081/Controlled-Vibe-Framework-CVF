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

$coreRoot = Split-Path -Parent $PSScriptRoot
$classificationGuideSource = Join-Path $coreRoot "docs\guides\CVF_WORKSPACE_CLASSIFICATION_AND_USAGE_GUIDE.md"
if (-not (Test-Path -LiteralPath $classificationGuideSource -PathType Leaf)) {
    throw "Workspace classification guide source not found: $classificationGuideSource"
}
$classificationGuide = Get-Content -LiteralPath $classificationGuideSource -Raw -Encoding utf8

$governedProjectWrapper = @'
param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectName,

    [string]$ProjectRepo = "",

    [switch]$KeepLegacyExemption,

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

if (-not $KeepLegacyExemption) {
    $gateArgs += "-PromoteProjectName"
    $gateArgs += $ProjectName
}

& powershell @gateArgs
exit $LASTEXITCODE
'@

$workspaceGateWrapper = @'
param(
    [string]$PromoteProjectName = "",
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

if (-not [string]::IsNullOrWhiteSpace($PromoteProjectName)) {
    $args += "-PromoteProjectName"
    $args += $PromoteProjectName
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

$workspaceProfileWrapper = @'
param(
    [ValidateSet("public-free", "paid-user-safe")]
    [string]$ProfileName = "public-free"
)

$ErrorActionPreference = "Stop"
$workspaceRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$corePath = Join-Path $workspaceRoot ".Controlled-Vibe-Framework-CVF"
$profileScript = Join-Path $corePath "scripts\sync_cvf_workspace_public_profile.ps1"

if (-not (Test-Path -LiteralPath $profileScript -PathType Leaf)) {
    throw "Public profile script not found: $profileScript"
}

& powershell -ExecutionPolicy Bypass -File $profileScript -WorkspaceRoot $workspaceRoot -ProfileName $ProfileName
exit $LASTEXITCODE
'@

$workspaceStatusWrapper = @'
param(
    [switch]$CheckRemote,
    [switch]$Json
)

$ErrorActionPreference = "Stop"
$workspaceRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$target = Join-Path $workspaceRoot ".Controlled-Vibe-Framework-CVF\scripts\get_cvf_workspace_status.ps1"
if (-not (Test-Path -LiteralPath $target -PathType Leaf)) {
    throw "Workspace status source not found: $target"
}
$arguments = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $target, "-WorkspaceRoot", $workspaceRoot)
if ($CheckRemote) { $arguments += "-CheckRemote" }
if ($Json) { $arguments += "-Json" }
& powershell @arguments
exit $LASTEXITCODE
'@

$workspaceRepairWrapper = @'
param([switch]$Json)

$ErrorActionPreference = "Stop"
$workspaceRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$target = Join-Path $workspaceRoot ".Controlled-Vibe-Framework-CVF\scripts\repair_cvf_workspace.ps1"
if (-not (Test-Path -LiteralPath $target -PathType Leaf)) {
    throw "Workspace repair source not found: $target"
}
$arguments = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $target, "-WorkspaceRoot", $workspaceRoot)
if ($Json) { $arguments += "-Json" }
& powershell @arguments
exit $LASTEXITCODE
'@

$workspaceManageWrapper = @'
param(
    [ValidateSet("Status", "Update", "Repair")]
    [string]$Action = "Status",
    [switch]$CheckRemote,
    [switch]$RunGate,
    [switch]$Json
)

$ErrorActionPreference = "Stop"
$workspaceRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$target = Join-Path $workspaceRoot ".Controlled-Vibe-Framework-CVF\scripts\manage_cvf_workspace.ps1"
if (-not (Test-Path -LiteralPath $target -PathType Leaf)) {
    throw "Workspace management source not found: $target"
}
$arguments = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $target, "-WorkspaceRoot", $workspaceRoot, "-Action", $Action)
if ($CheckRemote) { $arguments += "-CheckRemote" }
if ($RunGate) { $arguments += "-RunGate" }
if ($Json) { $arguments += "-Json" }
& powershell @arguments
exit $LASTEXITCODE
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

For paid or shared downstream workspaces, the expected safe profile is
`paid-user-safe`. If `Update-CVF-Workspace-RulePack.ps1` exists, select it
before project work:

```powershell
powershell -ExecutionPolicy Bypass -File ".\Update-CVF-Workspace-RulePack.ps1" `
  -ProfileName "paid-user-safe"
```

Then confirm `CVF_RULE_PACKS/ACTIVE_RULE_PACK.json` records
`paid-user-safe`. Do not use `-AllowProvenanceContinuity` for paid or shared
workspaces.

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

For an existing project that is already listed in the local legacy baseline,
rerun `New-CVF-Governed-Project.ps1` for that project. A passing project doctor
promotes that project out of the baseline unless `-KeepLegacyExemption` is
supplied.

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

For paid or shared downstream workspaces, use `paid-user-safe` as the default
profile. It adds curated authoring and boundary guidance without copying
private operator continuity state.

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
  Manage-CVF-Workspace.ps1
  Test-CVF-Workspace.ps1
  Repair-CVF-Workspace.ps1
  .agents/workflows/
  CVF_WORKSPACE_USER_GUIDE.md
  CVF_WORKSPACE_HUONG_DAN_SU_DUNG.md
```

## Common Commands

Check workspace health without changing files:

```powershell
powershell -ExecutionPolicy Bypass -File ".\Manage-CVF-Workspace.ps1" -Action Status -CheckRemote
```

Repair generated wrappers and the active public profile without updating the
hidden core:

```powershell
powershell -ExecutionPolicy Bypass -File ".\Manage-CVF-Workspace.ps1" -Action Repair
```

Update with the existing backup and rollback flow:

```powershell
powershell -ExecutionPolicy Bypass -File ".\Manage-CVF-Workspace.ps1" -Action Update -RunGate
```

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

Adopt an existing legacy-exempt project into current enforcement:

```powershell
powershell -ExecutionPolicy Bypass -File ".\New-CVF-Governed-Project.ps1" `
  -ProjectName "<existing-project>"
```

After the project doctor passes, the wrapper removes that project from
`WORKSPACE_PROJECT_ENFORCEMENT_BASELINE.json`. Use `-KeepLegacyExemption` only
when the project should remain grandfathered after refresh.

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

When a grandfathered project is intentionally adopted through
`New-CVF-Governed-Project.ps1`, a passing project doctor promotes that project
out of the legacy baseline. Use `-KeepLegacyExemption` only when the project
should keep its old local exemption after refresh.

If a downstream `.gitignore` hides `docs/CVF_BOOTSTRAP_LOG_*.md`, the doctor
prints a warning. The project remains usable, but the operator should decide
whether to track the bootstrap log or document the local exception.

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

Common profile choices:

- `public-free` - lightest public-core guidance set.
- `paid-user-safe` - curated authoring and boundary references for paid or shared downstream workspaces.
- `operator-local` - private operator-machine continuity profile; use only on the operator's own machine.

Switch profile when the rule-pack wrapper exists:

```powershell
powershell -ExecutionPolicy Bypass -File ".\Update-CVF-Workspace-RulePack.ps1" `
  -ProfileName "paid-user-safe"
```

After switching, verify:

```powershell
Get-Content ".\CVF_RULE_PACKS\ACTIVE_RULE_PACK.json"
powershell -ExecutionPolicy Bypass -File ".\Run-CVF-NewProject-Enforcement.ps1"
```

For a paid-user-safe workspace, do not pass `-AllowProvenanceContinuity`.

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
- `CVF_WORKSPACE_CLASSIFICATION_GUIDE.md` for profile, health, and project-state classification
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
  Manage-CVF-Workspace.ps1
  Test-CVF-Workspace.ps1
  Repair-CVF-Workspace.ps1
  .agents/workflows/
  CVF_WORKSPACE_USER_GUIDE.md
  CVF_WORKSPACE_HUONG_DAN_SU_DUNG.md
```

## Lệnh Thường Dùng

Kiểm tra trạng thái workspace mà không thay đổi file:

```powershell
powershell -ExecutionPolicy Bypass -File ".\Manage-CVF-Workspace.ps1" -Action Status -CheckRemote
```

Sửa lại wrapper và public profile đang active mà không update hidden core:

```powershell
powershell -ExecutionPolicy Bypass -File ".\Manage-CVF-Workspace.ps1" -Action Repair
```

Update bằng flow backup và rollback hiện có:

```powershell
powershell -ExecutionPolicy Bypass -File ".\Manage-CVF-Workspace.ps1" -Action Update -RunGate
```

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

Adopt một project cũ đang legacy-exempt vào enforcement hiện tại:

```powershell
powershell -ExecutionPolicy Bypass -File ".\New-CVF-Governed-Project.ps1" `
  -ProjectName "<existing-project>"
```

Sau khi project doctor pass, wrapper sẽ xóa project đó khỏi
`WORKSPACE_PROJECT_ENFORCEMENT_BASELINE.json`. Chỉ dùng `-KeepLegacyExemption`
khi project cần tiếp tục được grandfather sau refresh.

Cập nhật hidden public CVF core và làm mới wrapper ở workspace root:

```powershell
powershell -ExecutionPolicy Bypass -File ".\Update-CVF-Workspace.ps1" -RunGate
```

Với workspace paid hoặc team downstream, profile an toàn mặc định là
`paid-user-safe`. Nếu có `Update-CVF-Workspace-RulePack.ps1`, chọn profile này
trước khi làm việc với project:

```powershell
powershell -ExecutionPolicy Bypass -File ".\Update-CVF-Workspace-RulePack.ps1" `
  -ProfileName "paid-user-safe"
```

Sau đó kiểm tra `CVF_RULE_PACKS/ACTIVE_RULE_PACK.json` có ghi
`paid-user-safe`. Không dùng `-AllowProvenanceContinuity` cho workspace paid
hoặc team downstream.

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

Khi intentionally adopt một project đã grandfather bằng
`New-CVF-Governed-Project.ps1`, project doctor pass sẽ promote project đó ra
khỏi legacy baseline. Dùng `-KeepLegacyExemption` nếu vẫn muốn giữ exemption.

Nếu `.gitignore` của project downstream che `docs/CVF_BOOTSTRAP_LOG_*.md`,
doctor sẽ in cảnh báo. Project vẫn dùng được, nhưng operator nên quyết định
track bootstrap log hoặc ghi rõ ngoại lệ local.

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

Với workspace paid hoặc team downstream, dùng `paid-user-safe` làm profile mặc
định. Profile này thêm hướng dẫn authoring và boundary đã chọn lọc mà không
copy private operator continuity state.

Các profile thường dùng:

- `public-free` - bộ hướng dẫn nhẹ nhất cho public core.
- `paid-user-safe` - bộ authoring và boundary đã chọn lọc cho paid user hoặc team downstream.
- `operator-local` - profile continuity riêng cho máy operator; chỉ dùng trên máy riêng của operator.

Đổi profile khi đã có rule-pack wrapper:

```powershell
powershell -ExecutionPolicy Bypass -File ".\Update-CVF-Workspace-RulePack.ps1" `
  -ProfileName "paid-user-safe"
```

Sau khi đổi profile, kiểm tra:

```powershell
Get-Content ".\CVF_RULE_PACKS\ACTIVE_RULE_PACK.json"
powershell -ExecutionPolicy Bypass -File ".\Run-CVF-NewProject-Enforcement.ps1"
```

Với workspace paid-user-safe, không truyền `-AllowProvenanceContinuity`.

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
- `CVF_WORKSPACE_CLASSIFICATION_GUIDE.md`
'@

Set-WorkspaceArtifact -Path (Join-Path $workspaceRootResolved "New-CVF-Governed-Project.ps1") -Content $governedProjectWrapper
Set-WorkspaceArtifact -Path (Join-Path $workspaceRootResolved "Run-CVF-NewProject-Enforcement.ps1") -Content $workspaceGateWrapper
Set-WorkspaceArtifact -Path (Join-Path $workspaceRootResolved "Update-CVF-Workspace.ps1") -Content $workspaceUpdateWrapper
Set-WorkspaceArtifact -Path (Join-Path $workspaceRootResolved "Update-CVF-Workspace-Public-Profile.ps1") -Content $workspaceProfileWrapper
Set-WorkspaceArtifact -Path (Join-Path $workspaceRootResolved "Test-CVF-Workspace.ps1") -Content $workspaceStatusWrapper
Set-WorkspaceArtifact -Path (Join-Path $workspaceRootResolved "Repair-CVF-Workspace.ps1") -Content $workspaceRepairWrapper
Set-WorkspaceArtifact -Path (Join-Path $workspaceRootResolved "Manage-CVF-Workspace.ps1") -Content $workspaceManageWrapper
Set-WorkspaceArtifact -Path (Join-Path $workspaceRootResolved ".agents\workflows\cvf-onboard.md") -Content $agentOnboardWorkflow
Set-WorkspaceArtifact -Path (Join-Path $workspaceRootResolved ".agents\workflows\pre-commit-check.md") -Content $agentPreCommitWorkflow
Set-WorkspaceArtifactIfMissing -Path (Join-Path $workspaceRootResolved "WORKSPACE_PROJECT_ENFORCEMENT_BASELINE.json") -Content $workspaceProjectBaseline
Set-WorkspaceArtifact -Path (Join-Path $workspaceRootResolved "CVF_WORKSPACE_USER_GUIDE.md") -Content $userGuide
Set-WorkspaceArtifact -Path (Join-Path $workspaceRootResolved "CVF_WORKSPACE_HUONG_DAN_SU_DUNG.md") -Content $vietnameseGuide
Set-WorkspaceArtifact -Path (Join-Path $workspaceRootResolved "CVF_WORKSPACE_CLASSIFICATION_GUIDE.md") -Content $classificationGuide

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
