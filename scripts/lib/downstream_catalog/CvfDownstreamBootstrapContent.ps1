# CVF Downstream Bootstrap Content Helpers
#
# Core-side only. Not copied into downstream projects. Extracted from
# new-cvf-workspace.ps1 to keep the entrypoint script below the 600-line
# project guard. Depends on CvfDownstreamCatalogLib.ps1 being dot-sourced
# in the caller's scope before Install-CvfDownstreamCatalogKit is invoked.

function Get-CvfSessionMemoryContent {
    param([Parameter(Mandatory = $true)][string]$InitialHandoffRelative)

    return @"
# Project Session Memory

Memory class: POINTER_RECORD

This is the project continuity front door. It is CVF-governed project state,
not provider-specific memory and not a chat transcript.

## Startup Order

1. Read ``.cvf/manifest.json`` and ``.cvf/policy.json``.
2. Read ``CVF_SESSION/ACTIVE_SESSION_STATE.json``.
3. Read the active handoff named by that state file.
4. Read ``IMPLEMENTATION_STATUS.json`` and ``docs/INDEX.md``.
5. State current mode, active handoff, next allowed move, parked checkpoint,
   and active role before material work.

## Mandatory Continuity Rehydration

Repeat the startup order before material work at every new or resumed
chat/session, after context loss or compaction, at the start of every new
tranche or work order, and whenever responsibility or the active handoff
changes. Read current files again; do not rely on chat history,
provider-local memory, or a declaration from a previous session.

Emit a fresh ``CVF Agent Declaration`` before the first material action. At a
tranche transition, also record the acknowledgment in the active handoff
before BUILD. If continuity surfaces disagree, stop and report
``BLOCKED_CONTINUITY_DRIFT``.

Active state: ``CVF_SESSION/ACTIVE_SESSION_STATE.json``

Initial active handoff: ``$InitialHandoffRelative``

Provider-local files may assist execution but are not project source authority.
"@
}

function Get-CvfInitialHandoffContent {
    param([Parameter(Mandatory = $true)][string]$ProjectName)

    return @"
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

``INTAKE -> DESIGN -> SPEC -> WORK_ORDER -> BUILD -> REVIEW -> FREEZE``

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
}

function Get-CvfActiveStateObject {
    param(
        [Parameter(Mandatory = $true)][string]$ProjectName,
        [Parameter(Mandatory = $true)][string]$InitialHandoffRelative,
        [Parameter(Mandatory = $true)][string]$DateStamp
    )
    return [ordered]@{
        schemaVersion            = "1.0"
        projectName              = $ProjectName
        currentMode              = "INTAKE"
        activePhase              = "INTAKE"
        phaseModel               = @("INTAKE", "DESIGN", "SPEC", "WORK_ORDER", "BUILD", "REVIEW", "FREEZE")
        activeHandoff            = $InitialHandoffRelative
        nextAllowedMove          = "Complete INTAKE: record intent, context, constraints, risk, authority, and acceptance boundary."
        parkedOperatorCheckpoint = $null
        activeRole               = "ORCHESTRATOR"
        roleRoute                = "SINGLE_AGENT_MULTI_ROLE_ALLOWED"
        updatedAt                = $DateStamp
    }
}

function Get-CvfImplementationStatusObject {
    param(
        [Parameter(Mandatory = $true)][string]$ProjectName,
        [Parameter(Mandatory = $true)][string]$DateStamp
    )
    return [ordered]@{
        schemaVersion         = "1.0"
        projectName           = $ProjectName
        overallStatus         = "BOOTSTRAPPED"
        currentPhase          = "INTAKE"
        completedCapabilities = @()
        activeWorkOrders      = @()
        knownLimitations      = @("Project implementation status has not yet been assessed.")
        evidence              = @()
        updatedAt             = $DateStamp
    }
}

function Get-CvfBootstrapLogContent {
    param(
        [Parameter(Mandatory = $true)][string]$RecordIdDate,
        [Parameter(Mandatory = $true)][string]$ProjectName,
        [Parameter(Mandatory = $true)][string]$DateStamp,
        [Parameter(Mandatory = $true)][string]$CvfHead,
        [Parameter(Mandatory = $true)][string]$AgentInstructionsStatus,
        [Parameter(Mandatory = $true)][string]$CatalogKitStatus
    )

    # AC-06: the bootstrap log is fully regenerated every run, so its content
    # must stay idempotent across repeated runs of an already-governed
    # project. FRESH_INSTALLED (run 1) and ALREADY_GOVERNED_REGENERATED
    # (run 2+) are both healthy steady states and MUST render identically -
    # only the two exceptional states get distinct, still-stable labels.
    $catalogKitCheckbox = if ($CatalogKitStatus -in @("FRESH_INSTALLED", "ALREADY_GOVERNED_REGENERATED")) { "x" } else { " " }
    $catalogKitLabel = switch ($CatalogKitStatus) {
        "FRESH_INSTALLED" { "PRESENT" }
        "ALREADY_GOVERNED_REGENERATED" { "PRESENT" }
        "DAMAGED_GOVERNED_SKIPPED" { "DAMAGED_GOVERNED_KIT" }
        "MIGRATION_REQUIRED_SKIPPED" { "MIGRATION_REQUIRED" }
        default { $CatalogKitStatus }
    }
    $catalogKitNote = switch ($CatalogKitStatus) {
        "MIGRATION_REQUIRED_SKIPPED" { "`r`n- [ ] MIGRATION_REQUIRED: pre-existing legacy/mixed catalog content was detected; the governed kit was not installed. Review and adopt deliberately." }
        "DAMAGED_GOVERNED_SKIPPED" { "`r`n- [ ] DAMAGED_GOVERNED_KIT: docs/catalog/ARTIFACT_REGISTRY.json exists but is invalid; generated views were not regenerated. Run the catalog manager -Check and repair the registry." }
        default { "" }
    }

    return @"
# CVF Project Bootstrap Log

## 1. Record Metadata
- Record ID: BOOTSTRAP-$RecordIdDate-$ProjectName
- Date: $DateStamp
- Prepared By:
- Reviewed By:
- CVF Core Commit: $CvfHead

## 2. Workspace Topology
- Workspace Layout: SIBLING_HIDDEN_CORE
- Workspace Rules: ../WORKSPACE_RULES.md
- CVF Core: ../.Controlled-Vibe-Framework-CVF
- Project Path: .
- Local absolute paths: ``.cvf/local-binding.json`` (git-ignored, generated per machine)
- VS Code workspace file: generated locally at workspace root and not required for continuity

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
- [x] Agent Instructions: $AgentInstructionsStatus
- [x] .cvf/manifest.json: PRESENT (knowledgePath: knowledge/)
- [x] .cvf/policy.json: PRESENT
- [x] WORKSPACE_RULES.md: PRESENT
- [x] knowledge/ folder: PRESENT (add .md files and run ingest script to enable project-knowledge injection)
- [x] Seven-step phase model: INTAKE -> DESIGN -> SPEC -> WORK_ORDER -> BUILD -> REVIEW -> FREEZE
- [x] Project continuity front doors: PRESENT
- [x] Implementation status and docs index/catalog: PRESENT
- [$catalogKitCheckbox] Governed downstream catalog kit (Artifact Registry, Module Registry, schemas, catalog manager): $catalogKitLabel$catalogKitNote
- [ ] Runtime artifacts migrated (if needed)
- [ ] Toolchain baseline recorded (python, node, pnpm, optional uv)

## 5. Post-Bootstrap Checks
Run the workspace doctor to verify enforcement artifacts:
  powershell -ExecutionPolicy Bypass -File <cvf-core>\scripts\check_cvf_workspace_agent_enforcement.ps1 -ProjectPath "<this-project-path>"

Optional secret-free live readiness check:
  powershell -ExecutionPolicy Bypass -File <cvf-core>\scripts\check_cvf_workspace_agent_enforcement.ps1 -ProjectPath "<this-project-path>" -CheckLiveReadiness

Governed downstream catalog check (also run by the doctor when the kit is present):
  powershell -ExecutionPolicy Bypass -File "<this-project-path>\scripts\manage_cvf_downstream_catalog.ps1" -Check

Workspace-to-web evidence bridge receipt (run during REVIEW/FREEZE):
  powershell -ExecutionPolicy Bypass -File <cvf-core>\scripts\write_cvf_workspace_web_evidence_bridge.ps1 -ProjectPath "<this-project-path>" -CheckLiveReadiness -ReleaseGateResult "ATTACH_LATEST_CVF_CORE_GATE_RESULT"

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
}

function Install-CvfDownstreamCatalogKit {
    # BSL-R1: classify catalog state BEFORE any catalog-kit write. Fresh
    # projects get the full kit; an already-governed project is validated and
    # (only if valid) has its generated views regenerated; a damaged governed
    # kit is reported without touching the generated views; a legacy/mixed
    # project (pre-existing catalog-ish content with no governed source of
    # truth) receives NO catalog/view mutation at all - the caller must
    # resolve migration deliberately. Returns a status string for the
    # bootstrap log.
    param(
        [Parameter(Mandatory = $true)][string]$ProjectPath,
        [Parameter(Mandatory = $true)][string]$CvfCorePath,
        [Parameter(Mandatory = $true)][string]$ProjectName,
        [Parameter(Mandatory = $true)][string]$DateStamp,
        [Parameter(Mandatory = $true)][string]$InitialHandoffRelative
    )

    $catalogState = Get-CvfCatalogState -ProjectPath $ProjectPath

    if ($catalogState -eq "LEGACY_OR_MIXED") {
        Write-Host "[WARN] Governed downstream catalog kit was NOT installed: pre-existing legacy/mixed catalog content detected." -ForegroundColor Yellow
        Write-Host "[WARN] MIGRATION_REQUIRED: no catalog schema, tool, registry or view file was created or modified. Review the existing docs/INDEX.md, docs/catalog/MODULE_CATALOG.md and docs/catalog/MODULE_REGISTRY.json, then adopt the governed kit deliberately." -ForegroundColor Yellow
        return "MIGRATION_REQUIRED_SKIPPED"
    }

    $coreCatalogLibDir = Join-Path $CvfCorePath "scripts\lib\downstream_catalog"
    $projectCatalogLibDir = Join-Path $ProjectPath "scripts\lib\downstream_catalog"
    $projectSchemasDir = Join-Path $ProjectPath "docs\catalog\schemas"
    New-Item -ItemType Directory -Path $projectCatalogLibDir -Force | Out-Null
    New-Item -ItemType Directory -Path $projectSchemasDir -Force | Out-Null

    $copyIfMissing = @(
        @{ Src = (Join-Path $coreCatalogLibDir "schemas\ARTIFACT_REGISTRY.schema.json"); Dst = (Join-Path $projectSchemasDir "ARTIFACT_REGISTRY.schema.json") }
        @{ Src = (Join-Path $coreCatalogLibDir "schemas\MODULE_REGISTRY.schema.json"); Dst = (Join-Path $projectSchemasDir "MODULE_REGISTRY.schema.json") }
        @{ Src = (Join-Path $coreCatalogLibDir "CvfDownstreamCatalogLib.ps1"); Dst = (Join-Path $projectCatalogLibDir "CvfDownstreamCatalogLib.ps1") }
        @{ Src = (Join-Path $coreCatalogLibDir "manage_cvf_downstream_catalog.ps1"); Dst = (Join-Path $ProjectPath "scripts\manage_cvf_downstream_catalog.ps1") }
    )
    foreach ($pair in $copyIfMissing) {
        if (-not (Test-Path -LiteralPath $pair.Dst -PathType Leaf)) {
            Copy-Item -LiteralPath $pair.Src -Destination $pair.Dst
            Write-Host "[OK]   Created: $($pair.Dst)" -ForegroundColor Green
        }
        else {
            Write-Host "[INFO] Preserved existing project artifact: $($pair.Dst)" -ForegroundColor Cyan
        }
    }

    $artifactRegistryPath = Join-Path $ProjectPath "docs\catalog\ARTIFACT_REGISTRY.json"
    $moduleRegistryPath = Join-Path $ProjectPath "docs\catalog\MODULE_REGISTRY.json"
    if ($catalogState -eq "FRESH") {
        $artifactRegistry = New-CvfArtifactRegistryObject -ProjectName $ProjectName -DateStamp $DateStamp -InitialHandoffRelative $InitialHandoffRelative
        Set-Content -LiteralPath $artifactRegistryPath -Value ($artifactRegistry | ConvertTo-Json -Depth 6) -Encoding utf8
        Write-Host "[OK]   Created: $artifactRegistryPath" -ForegroundColor Green
        $moduleRegistry = New-CvfModuleRegistryObject -ProjectName $ProjectName -DateStamp $DateStamp
        Set-Content -LiteralPath $moduleRegistryPath -Value ($moduleRegistry | ConvertTo-Json -Depth 6) -Encoding utf8
        Write-Host "[OK]   Created: $moduleRegistryPath" -ForegroundColor Green
    }
    else {
        Write-Host "[INFO] Preserved existing project artifact: $artifactRegistryPath" -ForegroundColor Cyan
        Write-Host "[INFO] Preserved existing project artifact: $moduleRegistryPath" -ForegroundColor Cyan
    }

    if ($catalogState -eq "DAMAGED_GOVERNED") {
        Write-Host "[FAIL] Governed downstream catalog is present but structurally damaged (fails the closed-schema shape check)." -ForegroundColor Red
        Write-Host "[FAIL] Generated views were NOT regenerated. Run the catalog manager -Check for detail, then repair docs/catalog/ARTIFACT_REGISTRY.json before -Write." -ForegroundColor Red
        return "DAMAGED_GOVERNED_SKIPPED"
    }

    $managerPath = Join-Path $ProjectPath "scripts\manage_cvf_downstream_catalog.ps1"
    # Capture (not leak) the nested process's stdout: an unassigned native
    # invocation's output becomes part of THIS function's own return value,
    # which would corrupt the "return $status" string below into an array.
    # A freshly Copy-Item'd .ps1 can be briefly locked by AV/indexing right
    # after creation, making the very first -Write attempt on a FRESH
    # install fail transiently even though the registries are fine; retry
    # a couple of times before concluding the kit is actually damaged.
    $managerExitCode = 1
    for ($attempt = 1; $attempt -le 5; $attempt++) {
        $managerWriteOutput = & powershell -ExecutionPolicy Bypass -File $managerPath -Write -ProjectPath $ProjectPath
        $managerExitCode = $LASTEXITCODE
        if ($managerExitCode -eq 0) { break }
        Start-Sleep -Milliseconds 1000
    }
    Write-Host ($managerWriteOutput | Out-String)
    if ($managerExitCode -ne 0) {
        Write-Host "[FAIL] Governed downstream catalog manager rejected the current registries; generated views were NOT changed." -ForegroundColor Red
        return "DAMAGED_GOVERNED_SKIPPED"
    }
    Write-Host "[OK]   Governed downstream catalog kit installed and generated views rendered." -ForegroundColor Green
    if ($catalogState -eq "FRESH") { return "FRESH_INSTALLED" }
    return "ALREADY_GOVERNED_REGENERATED"
}
