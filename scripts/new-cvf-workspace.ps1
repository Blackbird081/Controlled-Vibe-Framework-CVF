param(
    [Parameter(Mandatory = $true)]
    [string]$WorkspaceRoot,

    [Parameter(Mandatory = $true)]
    [string]$ProjectName,

    [string]$ProjectRepo = ""
)

$ErrorActionPreference = "Stop"

function Write-Info([string]$Message) {
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Ok([string]$Message) {
    Write-Host "[OK]   $Message" -ForegroundColor Green
}

function Write-Warn([string]$Message) {
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Ensure-Directory([string]$DirectoryPath) {
    if (-not (Test-Path -LiteralPath $DirectoryPath -PathType Container)) {
        New-Item -ItemType Directory -Path $DirectoryPath | Out-Null
        Write-Ok "Created directory: $DirectoryPath"
    }
}

function Write-ProjectFileIfMissing {
    param(
        [Parameter(Mandatory = $true)]
        [string]$FilePath,

        [Parameter(Mandatory = $true)]
        [string]$Content
    )

    if (Test-Path -LiteralPath $FilePath -PathType Leaf) {
        Write-Info "Preserved existing project artifact: $FilePath"
        return
    }

    $parent = Split-Path -Parent $FilePath
    if (-not [string]::IsNullOrWhiteSpace($parent)) {
        Ensure-Directory $parent
    }
    Set-Content -LiteralPath $FilePath -Value $Content -Encoding utf8
    Write-Ok "Created: $FilePath"
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw "git is required but was not found in PATH."
}

$workspaceRootResolved = [System.IO.Path]::GetFullPath($WorkspaceRoot)
$cvfCorePath = Join-Path $workspaceRootResolved ".Controlled-Vibe-Framework-CVF"
$projectPath = Join-Path $workspaceRootResolved $ProjectName
$workspaceFilePath = Join-Path $workspaceRootResolved "$ProjectName.code-workspace"
$workspaceRulesPath = Join-Path $workspaceRootResolved "WORKSPACE_RULES.md"
$requiredPublicCoreFiles = @(
    "AGENTS.md",
    "AGENT_HANDOFF.md",
    "docs\reference\CVF_WORKSPACE_RULES.md",
    "governance\toolkit\05_OPERATION\CVF_DOWNSTREAM_AGENTS_TEMPLATE.md",
    "scripts\check_cvf_workspace_agent_enforcement.ps1",
    "scripts\check_cvf_workspace_new_project_enforcement.ps1",
    "scripts\install_cvf_workspace_root_wrappers.ps1",
    "scripts\ingest_cvf_downstream_knowledge.ps1",
    "scripts\update_cvf_workspace_public_core.ps1",
    "scripts\write_cvf_workspace_web_evidence_bridge.ps1"
)

Write-Info "Workspace root: $workspaceRootResolved"
Ensure-Directory $workspaceRootResolved

if (-not (Test-Path -LiteralPath $cvfCorePath -PathType Container)) {
    Write-Info "Cloning CVF core into: $cvfCorePath"
    git clone https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git $cvfCorePath
    Write-Ok "CVF core cloned"
}
else {
    Write-Info "CVF core already exists: $cvfCorePath"
}

$missingCoreFiles = @($requiredPublicCoreFiles | Where-Object {
    -not (Test-Path -LiteralPath (Join-Path $cvfCorePath $_) -PathType Leaf)
})
if ($missingCoreFiles.Count -gt 0) {
    throw "CVF public core workspace kit is incomplete. Missing: $($missingCoreFiles -join ', '). Reconcile the hidden core with scripts/update_cvf_workspace_public_core.ps1 before bootstrapping a project."
}

$workspaceWrapperInstallerPath = Join-Path $cvfCorePath "scripts\install_cvf_workspace_root_wrappers.ps1"
& powershell -ExecutionPolicy Bypass -File $workspaceWrapperInstallerPath -WorkspaceRoot $workspaceRootResolved
if ($LASTEXITCODE -ne 0) {
    throw "Workspace wrapper installer failed with exit code $LASTEXITCODE : $workspaceWrapperInstallerPath"
}

if (-not (Test-Path -LiteralPath $workspaceRulesPath -PathType Leaf)) {
    $workspaceRulesContent = @'
# CVF Workspace Rules

This folder is a CVF workspace container. It is not a git repository.

## Required layout

````text
CVF-Workspace/
  .Controlled-Vibe-Framework-CVF/
  <Application-Project-1>/
  <Application-Project-2>/
  WORKSPACE_RULES.md
````

## Rules

- `.Controlled-Vibe-Framework-CVF/` is the CVF governance repository.
- Application projects must be sibling folders, not children of the CVF governance repository.
- Do not add downstream application code inside `.Controlled-Vibe-Framework-CVF/`.
- Run CVF core update commands from `.Controlled-Vibe-Framework-CVF/`.
- Reconcile stale or diverged hidden cores with `scripts/update_cvf_workspace_public_core.ps1`.
- Run application work from the application project root.
- Keep provider keys and secrets out of this file, `.cvf/`, generated `AGENTS.md`, and bootstrap logs.

## Reference

Canonical source: `.Controlled-Vibe-Framework-CVF/docs/reference/CVF_WORKSPACE_RULES.md`
'@
    Set-Content -Path $workspaceRulesPath -Value $workspaceRulesContent -Encoding utf8
    Write-Ok "Created: $workspaceRulesPath"
}
else {
    Write-Info "Workspace rules already exist: $workspaceRulesPath"
}

if (-not (Test-Path -LiteralPath $projectPath -PathType Container)) {
    if ([string]::IsNullOrWhiteSpace($ProjectRepo)) {
        Write-Info "Creating empty project folder: $projectPath"
        Ensure-Directory $projectPath
    }
    else {
        Write-Info "Cloning project repo into: $projectPath"
        git clone $ProjectRepo $projectPath
        Write-Ok "Project cloned"
    }
}
else {
    Write-Info "Project folder already exists: $projectPath"
}

$vscodeDir = Join-Path $projectPath ".vscode"
Ensure-Directory $vscodeDir

$settings = @{
    "terminal.integrated.cwd" = '${workspaceFolder}'
    "terminal.integrated.defaultProfile.windows" = "PowerShell"
}
$settingsJson = $settings | ConvertTo-Json -Depth 5
Set-Content -Path (Join-Path $vscodeDir "settings.json") -Value $settingsJson -Encoding utf8
Write-Ok "Updated: $vscodeDir\\settings.json"

$workspaceDef = @{
    folders = @(
        @{ path = $ProjectName }
    )
    settings = @{
        "terminal.integrated.cwd" = '${workspaceFolder}'
        "terminal.integrated.defaultProfile.windows" = "PowerShell"
    }
}
$workspaceJson = $workspaceDef | ConvertTo-Json -Depth 5
Set-Content -Path $workspaceFilePath -Value $workspaceJson -Encoding utf8
Write-Ok "Updated: $workspaceFilePath"

$docsDir = Join-Path $projectPath "docs"
Ensure-Directory $docsDir

$dateStamp = Get-Date -Format "yyyy-MM-dd"
$recordIdDate = Get-Date -Format "yyyyMMdd"
$bootstrapLogPath = Join-Path $docsDir "CVF_BOOTSTRAP_LOG_$recordIdDate.md"
$cvfHead = git -C $cvfCorePath rev-parse --short HEAD

# CP2: Generate .cvf/ enforcement manifest and policy
$cvfManifestDir = Join-Path $projectPath ".cvf"
Ensure-Directory $cvfManifestDir

$manifestObj = [ordered]@{
    cvfCorePath                  = $cvfCorePath
    cvfCoreCommit                = $cvfHead
    workspaceRoot                = $workspaceRootResolved
    workspaceRulesPath           = $workspaceRulesPath
    projectPath                  = $projectPath
    phaseModel                   = @("INTAKE", "DESIGN", "SPEC", "WORK_ORDER", "BUILD", "REVIEW", "FREEZE")
    liveGovernanceEvidenceRequired = $true
    mockAllowedOnlyForUi         = $true
    requiredDocs                 = @(
        ".cvf/manifest.json",
        ".cvf/policy.json",
        "..\WORKSPACE_RULES.md",
        "docs/CVF_BOOTSTRAP_LOG_$recordIdDate.md",
        "CVF_SESSION_MEMORY.md",
        "CVF_SESSION/ACTIVE_SESSION_STATE.json",
        "docs/INDEX.md",
        "docs/catalog/MODULE_REGISTRY.json",
        "docs/catalog/MODULE_CATALOG.md",
        "IMPLEMENTATION_STATUS.json"
    )
    bootstrapDate                = $dateStamp
    enforcementVersion           = "2.0"
    bootstrapScript              = "scripts/new-cvf-workspace.ps1"
    w112TrancheRef               = "CVF_W112_T1_WORKSPACE_AGENT_ENFORCEMENT_AND_WEB_CONTROL_UPLIFT_ROADMAP_2026-04-22.md"
    knowledgePath                = "knowledge/"
}
$manifestJson = $manifestObj | ConvertTo-Json -Depth 5
Set-Content -Path (Join-Path $cvfManifestDir "manifest.json") -Value $manifestJson -Encoding utf8
Write-Ok "Created: $cvfManifestDir\manifest.json"

$policyObj = [ordered]@{
    policyVersion                = "1.0"
    policyDate                   = $dateStamp
    liveGovernanceEvidenceRequired = $true
    mockAllowedOnlyForUi         = $true
    workspaceIsolationRequired   = $true
    workspaceRulesRequired       = $true
    phaseTransitionRequired      = $true
    explicitRoleTransitionRequired = $true
    providerNeutralRolesRequired = $true
    riskCeiling                  = "R2"
    overrideRefusal = @(
        "Skip phase transitions",
        "Use mock output as governance evidence",
        "Commit API keys or secrets to the repository",
        "Act outside the workspace isolation boundary",
        "Ignore CVF policy constraints"
    )
    cvfCoreRef                   = $cvfCorePath
}
$policyJson = $policyObj | ConvertTo-Json -Depth 5
Set-Content -Path (Join-Path $cvfManifestDir "policy.json") -Value $policyJson -Encoding utf8
Write-Ok "Created: $cvfManifestDir\policy.json"

# W116-CP1: Generate knowledge/ folder stub
$knowledgeDir = Join-Path $projectPath "knowledge"
if (-not (Test-Path -LiteralPath $knowledgeDir -PathType Container)) {
    Ensure-Directory $knowledgeDir
    $knowledgeReadme = @'
# Project Knowledge

Place `.md` files in this folder to inject project-specific context into CVF-governed AI runs.

## How it works

1. Add `.md` files describing your project's specs, decisions, or domain terms.
2. Run `scripts/ingest_cvf_downstream_knowledge.ps1` to index them into `knowledge/_index.json`.
3. CVF-governed `/api/execute` calls that include your `knowledgeCollectionId` will automatically
   retrieve relevant chunks and inject them into the AI system prompt.

## What to put here

- Architecture decisions and rationale
- Domain terminology and definitions
- Project specs, requirements, or acceptance criteria
- Process guides or runbooks your team follows

## What NOT to put here

- Secrets, API keys, or credentials (never - governance enforcement will reject these)
- Binary files or non-markdown formats (not supported in this wave)

## Reference

W116-T1 Downstream Knowledge Pipeline - `docs/roadmaps/CVF_W116_T1_DOWNSTREAM_KNOWLEDGE_PIPELINE_ROADMAP_2026-04-23.md`
'@
    $knowledgeReadmePath = Join-Path $knowledgeDir "README.md"
    Set-Content -LiteralPath $knowledgeReadmePath -Value $knowledgeReadme -Encoding utf8
    Write-Ok "Created: $knowledgeDir\README.md (project knowledge stub)"
}
else {
    Write-Ok "knowledge/ folder already exists: $knowledgeDir"
}

# CP1: Generate downstream AGENTS.md from template
$agentsTemplatePath = Join-Path $cvfCorePath "governance\toolkit\05_OPERATION\CVF_DOWNSTREAM_AGENTS_TEMPLATE.md"
$downstreamAgentsPath = Join-Path $projectPath "AGENTS.md"
$agentInstructionsStatus = "MISSING"

if (Test-Path -LiteralPath $agentsTemplatePath -PathType Leaf) {
    $templateContent = Get-Content -LiteralPath $agentsTemplatePath -Raw -Encoding utf8
    $agentContent = $templateContent
    $agentContent = $agentContent -replace '\{\{CVF_CORE_PATH\}\}', $cvfCorePath
    $agentContent = $agentContent -replace '\{\{CVF_CORE_COMMIT\}\}', $cvfHead
    $agentContent = $agentContent -replace '\{\{BOOTSTRAP_DATE\}\}', $dateStamp
    $agentContent = $agentContent -replace '\{\{PROJECT_NAME\}\}', $ProjectName

    if (Test-Path -LiteralPath $downstreamAgentsPath -PathType Leaf) {
        $existingContent = Get-Content -LiteralPath $downstreamAgentsPath -Raw -Encoding utf8
        $withoutCvfMergeBlocks = [regex]::Replace(
            $existingContent,
            '(?s)<!-- CVF_MERGE_BLOCK_START:.*?<!-- CVF_MERGE_BLOCK_END -->\s*',
            ''
        )
        $isCvfGeneratedAgents = (
            $withoutCvfMergeBlocks -match 'Generated by CVF workspace bootstrap' -and
            $withoutCvfMergeBlocks -match 'CVF Agent Instructions'
        )

        if ($isCvfGeneratedAgents) {
            Set-Content -LiteralPath $downstreamAgentsPath -Value $agentContent -Encoding utf8
            Write-Ok "Updated CVF-generated AGENTS.md in place: $downstreamAgentsPath"
        }
        else {
            Write-Warn "AGENTS.md already exists at: $downstreamAgentsPath"
            Write-Warn "Inserting one CVF merge block at top - review and merge manually."
            $mergeBlock = @"
<!-- CVF_MERGE_BLOCK_START: generated $dateStamp by new-cvf-workspace.ps1 -->
<!-- Review this block and merge with your existing AGENTS.md content. -->
$agentContent
<!-- CVF_MERGE_BLOCK_END -->

$withoutCvfMergeBlocks
"@
            Set-Content -LiteralPath $downstreamAgentsPath -Value $mergeBlock -Encoding utf8
            Write-Ok "Updated AGENTS.md with CVF merge block: $downstreamAgentsPath"
        }
    }
    else {
        Set-Content -LiteralPath $downstreamAgentsPath -Value $agentContent -Encoding utf8
        Write-Ok "Created: $downstreamAgentsPath"
    }
    $agentInstructionsStatus = "PRESENT"
}
else {
    Write-Warn "CVF agent template not found at: $agentsTemplatePath"
    Write-Warn "AGENTS.md was NOT generated. Run bootstrap from an up-to-date CVF core."
    $agentInstructionsStatus = "MISSING - template not found"
}

# Project continuity, authority, and discovery front doors.
# Existing project-owned files are never overwritten by this bootstrap.
$sessionDir = Join-Path $projectPath "CVF_SESSION"
$handoffDir = Join-Path $sessionDir "handoffs"
$catalogDir = Join-Path $docsDir "catalog"
foreach ($directory in @(
    $sessionDir,
    $handoffDir,
    $catalogDir,
    (Join-Path $docsDir "decisions"),
    (Join-Path $docsDir "roadmaps"),
    (Join-Path $docsDir "specs"),
    (Join-Path $docsDir "work_orders"),
    (Join-Path $docsDir "reviews")
)) {
    Ensure-Directory $directory
}

$initialHandoffRelative = "CVF_SESSION/handoffs/AGENT_HANDOFF_V1_$dateStamp.md"
$initialHandoffPath = Join-Path $projectPath ($initialHandoffRelative -replace '/', '\')

$sessionMemoryContent = @"
# Project Session Memory

Memory class: POINTER_RECORD

This is the project continuity front door. It is CVF-governed project state,
not provider-specific memory and not a chat transcript.

## Startup Order

1. Read `.cvf/manifest.json` and `.cvf/policy.json`.
2. Read `CVF_SESSION/ACTIVE_SESSION_STATE.json`.
3. Read the active handoff named by that state file.
4. Read `IMPLEMENTATION_STATUS.json` and `docs/INDEX.md`.
5. State current mode, active handoff, next allowed move, parked checkpoint,
   and active role before material work.

## Mandatory Continuity Rehydration

Repeat the startup order before material work at every new or resumed
chat/session, after context loss or compaction, at the start of every new
tranche or work order, and whenever responsibility or the active handoff
changes. Read current files again; do not rely on chat history,
provider-local memory, or a declaration from a previous session.

Emit a fresh `CVF Agent Declaration` before the first material action. At a
tranche transition, also record the acknowledgment in the active handoff
before BUILD. If continuity surfaces disagree, stop and report
`BLOCKED_CONTINUITY_DRIFT`.

Active state: `CVF_SESSION/ACTIVE_SESSION_STATE.json`

Initial active handoff: `$initialHandoffRelative`

Provider-local files may assist execution but are not project source authority.
"@
Write-ProjectFileIfMissing -FilePath (Join-Path $projectPath "CVF_SESSION_MEMORY.md") -Content $sessionMemoryContent

$activeState = [ordered]@{
    schemaVersion = "1.0"
    projectName = $ProjectName
    currentMode = "INTAKE"
    activePhase = "INTAKE"
    phaseModel = @("INTAKE", "DESIGN", "SPEC", "WORK_ORDER", "BUILD", "REVIEW", "FREEZE")
    activeHandoff = $initialHandoffRelative
    nextAllowedMove = "Complete INTAKE: record intent, context, constraints, risk, authority, and acceptance boundary."
    parkedOperatorCheckpoint = $null
    activeRole = "ORCHESTRATOR"
    roleRoute = "SINGLE_AGENT_MULTI_ROLE_ALLOWED"
    updatedAt = $dateStamp
}
Write-ProjectFileIfMissing -FilePath (Join-Path $sessionDir "ACTIVE_SESSION_STATE.json") -Content ($activeState | ConvertTo-Json -Depth 6)

$handoffContent = @"
# Agent Handoff V1

Status: ACTIVE

## Current State

- Project: $ProjectName
- Current mode: INTAKE
- Active phase: INTAKE
- Active role: ORCHESTRATOR
- Next allowed move: Complete INTAKE before DESIGN.
- Parked operator checkpoint: none

## Seven-Step Control Chain

`INTAKE -> DESIGN -> SPEC -> WORK_ORDER -> BUILD -> REVIEW -> FREEZE`

## Role Assignment

Roles are responsibilities, not provider names. One agent may hold several
roles only when each transition is recorded. Available roles are ORCHESTRATOR,
SPEC_AUTHOR, WORK_ORDER_AUTHOR, IMPLEMENTATION_WORKER, REVIEWER, REPAIR_WORKER,
CLOSER, COMMIT_STEWARD, and SESSION_SYNC_STEWARD. High-risk work requires an
independent reviewer.

## Completed

- Project governance bootstrap created the initial continuity surfaces.

## Open Work

- Capture the first governed request through INTAKE.

## Claim Boundary

This handoff records initial project state only. It does not claim that any
feature, test, release, deployment, or provider integration is complete.
"@
Write-ProjectFileIfMissing -FilePath $initialHandoffPath -Content $handoffContent

$implementationStatus = [ordered]@{
    schemaVersion = "1.0"
    projectName = $ProjectName
    overallStatus = "BOOTSTRAPPED"
    currentPhase = "INTAKE"
    completedCapabilities = @()
    activeWorkOrders = @()
    knownLimitations = @("Project implementation status has not yet been assessed.")
    evidence = @()
    updatedAt = $dateStamp
}
Write-ProjectFileIfMissing -FilePath (Join-Path $projectPath "IMPLEMENTATION_STATUS.json") -Content ($implementationStatus | ConvertTo-Json -Depth 6)

$moduleRegistry = [ordered]@{
    schemaVersion = "1.0"
    projectName = $ProjectName
    modules = @()
    updatedAt = $dateStamp
    claimBoundary = "Empty initial registry; add only source-verified modules."
}
Write-ProjectFileIfMissing -FilePath (Join-Path $catalogDir "MODULE_REGISTRY.json") -Content ($moduleRegistry | ConvertTo-Json -Depth 6)

$moduleCatalogContent = @"
# Module Catalog

Status: BOOTSTRAPPED_EMPTY

Machine-readable source: `docs/catalog/MODULE_REGISTRY.json`

No modules have been source-verified and registered yet. Do not infer runtime
capabilities from plans, handoffs, prompts, or provider-local memory.
"@
Write-ProjectFileIfMissing -FilePath (Join-Path $catalogDir "MODULE_CATALOG.md") -Content $moduleCatalogContent

$docsIndexContent = @"
# Project Documentation Index

## Start Here

- Session front door: `CVF_SESSION_MEMORY.md`
- Active state: `CVF_SESSION/ACTIVE_SESSION_STATE.json`
- Implementation truth: `IMPLEMENTATION_STATUS.json`
- Machine module registry: `docs/catalog/MODULE_REGISTRY.json`
- Human module catalog: `docs/catalog/MODULE_CATALOG.md`

## Governed Artifact Families

- Decisions: `docs/decisions/`
- Roadmaps: `docs/roadmaps/`
- Specifications: `docs/specs/`
- Work orders: `docs/work_orders/`
- Reviews and evidence: `docs/reviews/`

Plans describe intended work. `IMPLEMENTATION_STATUS.json`, source, tests, and
review evidence determine what is actually implemented.
"@
Write-ProjectFileIfMissing -FilePath (Join-Path $docsDir "INDEX.md") -Content $docsIndexContent

foreach ($family in @("decisions", "roadmaps", "specs", "work_orders", "reviews")) {
    $familyTitle = (Get-Culture).TextInfo.ToTitleCase($family.Replace('_', ' '))
    $familyContent = "# $familyTitle`r`n`r`nStore project-governed $family artifacts here. Link active artifacts from docs/INDEX.md.`r`n"
    Write-ProjectFileIfMissing -FilePath (Join-Path $docsDir "$family\README.md") -Content $familyContent
}

# Bootstrap Log
$logContent = @"
# CVF Project Bootstrap Log

## 1. Record Metadata
- Record ID: BOOTSTRAP-$recordIdDate-$ProjectName
- Date: $dateStamp
- Prepared By:
- Reviewed By:
- CVF Core Commit: $cvfHead

## 2. Workspace Topology
- Workspace Root: $workspaceRootResolved
- Workspace Rules: $workspaceRulesPath
- CVF Core Path: $cvfCorePath
- Project Path: $projectPath
- VS Code Workspace File: $workspaceFilePath

## 3. Isolation Validation
- [x] CVF core and downstream project are sibling folders
- [x] Workspace rules file exists at workspace root
- [x] IDE/terminal target is project workspace
- [x] terminal.integrated.cwd is `${workspaceFolder}`
- [ ] Team acknowledgment recorded

## 4. Bootstrap Actions
- [x] CVF core available
- [x] Project folder available
- [x] VS Code terminal defaults configured
- [x] Agent Instructions: $agentInstructionsStatus
- [x] .cvf/manifest.json: PRESENT (knowledgePath: knowledge/)
- [x] .cvf/policy.json: PRESENT
- [x] WORKSPACE_RULES.md: PRESENT
- [x] knowledge/ folder: PRESENT (add .md files and run ingest script to enable project-knowledge injection)
- [x] Seven-step phase model: INTAKE -> DESIGN -> SPEC -> WORK_ORDER -> BUILD -> REVIEW -> FREEZE
- [x] Project continuity front doors: PRESENT
- [x] Implementation status and docs index/catalog: PRESENT
- [ ] Runtime artifacts migrated (if needed)
- [ ] Toolchain baseline recorded (python, node, pnpm, optional uv)

## 5. Post-Bootstrap Checks
Run the workspace doctor to verify enforcement artifacts:
  powershell -ExecutionPolicy Bypass -File <cvf-core>\scripts\check_cvf_workspace_agent_enforcement.ps1 -ProjectPath "$projectPath"

Optional secret-free live readiness check:
  powershell -ExecutionPolicy Bypass -File <cvf-core>\scripts\check_cvf_workspace_agent_enforcement.ps1 -ProjectPath "$projectPath" -CheckLiveReadiness

Workspace-to-web evidence bridge receipt (run during REVIEW/FREEZE):
  powershell -ExecutionPolicy Bypass -File <cvf-core>\scripts\write_cvf_workspace_web_evidence_bridge.ps1 -ProjectPath "$projectPath" -CheckLiveReadiness -ReleaseGateResult "ATTACH_LATEST_CVF_CORE_GATE_RESULT"

- [ ] Workspace doctor: PASS
- [ ] Optional live readiness: PASS / MISSING KEY / NOT RUN
- [ ] Workspace-to-web evidence bridge receipt: PRESENT / NOT NEEDED
- [ ] API health check
- [ ] Frontend startup check
- [ ] Critical workflow smoke check

## 6. Approval
- Result: PASS / PASS WITH NOTE / FAIL
- Approved By:
- Approval Date:
"@

Set-Content -Path $bootstrapLogPath -Value $logContent -Encoding utf8
Write-Ok "Created: $bootstrapLogPath"

Write-Host ""
Write-Ok "Workspace bootstrap complete."
Write-Host "Open this workspace file in VS Code:" -ForegroundColor Yellow
Write-Host "  $workspaceFilePath"
Write-Host ""
Write-Host "Next step - run workspace doctor:" -ForegroundColor Yellow
Write-Host "  powershell -ExecutionPolicy Bypass -File `"$cvfCorePath\scripts\check_cvf_workspace_agent_enforcement.ps1`" -ProjectPath `"$projectPath`""
Write-Host "Optional secret-free live readiness check:" -ForegroundColor Yellow
Write-Host "  powershell -ExecutionPolicy Bypass -File `"$cvfCorePath\scripts\check_cvf_workspace_agent_enforcement.ps1`" -ProjectPath `"$projectPath`" -CheckLiveReadiness"
Write-Host "Workspace-to-web evidence bridge receipt (during REVIEW/FREEZE):" -ForegroundColor Yellow
Write-Host "  powershell -ExecutionPolicy Bypass -File `"$cvfCorePath\scripts\write_cvf_workspace_web_evidence_bridge.ps1`" -ProjectPath `"$projectPath`" -CheckLiveReadiness -ReleaseGateResult `"ATTACH_LATEST_CVF_CORE_GATE_RESULT`""
Write-Host ""
Write-Host "Isolation reminder:" -ForegroundColor Yellow
Write-Host "  Work in project root only: $projectPath"
Write-Host "  Do not run downstream project tasks in CVF core root: $cvfCorePath"
