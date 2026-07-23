param(
    [Parameter(Mandatory = $true)]
    [string]$WorkspaceRoot,

    [Parameter(Mandatory = $true)]
    [string]$ProjectName,

    [string]$ProjectRepo = ""
)

$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "lib\downstream_catalog\CvfDownstreamCatalogLib.ps1")
. (Join-Path $PSScriptRoot "lib\downstream_catalog\CvfDownstreamBootstrapContent.ps1")

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

function Ensure-ProjectGitIgnoreLine {
    param([string]$ProjectRoot, [string]$Line)
    $ignorePath = Join-Path $ProjectRoot ".gitignore"
    $existing = if (Test-Path -LiteralPath $ignorePath -PathType Leaf) {
        Get-Content -LiteralPath $ignorePath -Encoding utf8
    }
    else { @() }
    if ($existing -notcontains $Line) {
        Add-Content -LiteralPath $ignorePath -Value $Line -Encoding utf8
        Write-Ok "Updated: $ignorePath ($Line)"
    }
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
    "scripts\initialize_cvf_project_clone.ps1",
    "scripts\initialize_cvf_repository_clone.ps1",
    "scripts\update_cvf_workspace_public_core.ps1",
    "scripts\write_cvf_workspace_web_evidence_bridge.ps1",
    "scripts\lib\downstream_catalog\CvfDownstreamCatalogLib.ps1",
    "scripts\lib\downstream_catalog\CvfDownstreamBootstrapContent.ps1",
    "scripts\lib\downstream_catalog\CvfWorkspaceDoctorLiveReadiness.ps1",
    "scripts\lib\downstream_catalog\manage_cvf_downstream_catalog.ps1",
    "scripts\lib\downstream_catalog\schemas\ARTIFACT_REGISTRY.schema.json",
    "scripts\lib\downstream_catalog\schemas\MODULE_REGISTRY.schema.json",
    "governance\toolkit\05_OPERATION\downstream_catalog\CVF_DOWNSTREAM_CATALOG_GUARD.md"
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
$cvfHead = (git -C $cvfCorePath rev-parse HEAD | Out-String).Trim()

# CP2: Generate .cvf/ enforcement manifest and policy
$cvfManifestDir = Join-Path $projectPath ".cvf"
Ensure-Directory $cvfManifestDir

# BSL-R3: decide up front (read-only classification; nothing catalog-related
# is written between here and Install-CvfDownstreamCatalogKit below) whether
# this manifest may reference governed-catalog requiredDocs. A legacy/mixed
# project never gets the catalog kit installed, so requiring those paths
# here would make the doctor's "required docs exist" check fail forever.
$earlyCatalogState = Get-CvfCatalogState -ProjectPath $projectPath
$catalogRequiredDocs = if ($earlyCatalogState -ne "LEGACY_OR_MIXED") {
    @(
        "docs/catalog/ARTIFACT_REGISTRY.json",
        "docs/catalog/schemas/ARTIFACT_REGISTRY.schema.json",
        "docs/catalog/schemas/MODULE_REGISTRY.schema.json",
        "scripts/manage_cvf_downstream_catalog.ps1",
        "scripts/lib/downstream_catalog/CvfDownstreamCatalogLib.ps1"
    )
}
else { @() }

$manifestObj = [ordered]@{
    schemaVersion                = "2.0"
    cvfCoreRepository            = "https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git"
    cvfCoreCommit                = $cvfHead
    workspaceLayout              = "SIBLING_HIDDEN_CORE"
    cvfCoreRelativePath          = "../.Controlled-Vibe-Framework-CVF"
    workspaceRulesRelativePath   = "../WORKSPACE_RULES.md"
    projectRelativePath          = "."
    phaseModel                   = @("INTAKE", "DESIGN", "SPEC", "WORK_ORDER", "BUILD", "REVIEW", "FREEZE")
    liveGovernanceEvidenceRequired = $true
    mockAllowedOnlyForUi         = $true
    requiredDocs                 = @(
        ".cvf/manifest.json",
        ".cvf/policy.json",
        "scripts/initialize_cvf_clone.ps1",
        "..\WORKSPACE_RULES.md",
        "docs/CVF_BOOTSTRAP_LOG_$recordIdDate.md",
        "CVF_SESSION_MEMORY.md",
        "CVF_SESSION/ACTIVE_SESSION_STATE.json",
        "docs/INDEX.md",
        "docs/catalog/MODULE_REGISTRY.json",
        "docs/catalog/MODULE_CATALOG.md",
        "IMPLEMENTATION_STATUS.json"
    ) + $catalogRequiredDocs
    bootstrapDate                = $dateStamp
    enforcementVersion           = "3.1-governed-catalog"
    bootstrapScript              = "scripts/new-cvf-workspace.ps1"
    w112TrancheRef               = "CVF_W112_T1_WORKSPACE_AGENT_ENFORCEMENT_AND_WEB_CONTROL_UPLIFT_ROADMAP_2026-04-22.md"
    knowledgePath                = "knowledge/"
}
if ($earlyCatalogState -ne "LEGACY_OR_MIXED") {
    # BSL-R3: explicit governed-catalog marker, present only when this
    # manifest actually references a governed (or governable) catalog kit -
    # never added for a legacy/mixed project the kit intentionally skipped.
    $manifestObj.catalogKitVersion = $Script:CvfCatalogKitVersion
}
$manifestJson = $manifestObj | ConvertTo-Json -Depth 5
Set-Content -Path (Join-Path $cvfManifestDir "manifest.json") -Value $manifestJson -Encoding utf8
Write-Ok "Created: $cvfManifestDir\manifest.json"
Ensure-ProjectGitIgnoreLine -ProjectRoot $projectPath -Line ".cvf/local-binding.json"

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
    cvfCoreRef                   = "../.Controlled-Vibe-Framework-CVF"
}
$policyJson = $policyObj | ConvertTo-Json -Depth 5
Set-Content -Path (Join-Path $cvfManifestDir "policy.json") -Value $policyJson -Encoding utf8
Write-Ok "Created: $cvfManifestDir\policy.json"

$projectScriptsDir = Join-Path $projectPath "scripts"
Ensure-Directory $projectScriptsDir
$portableInitializerSource = Join-Path $cvfCorePath "scripts\initialize_cvf_project_clone.ps1"
$portableInitializerTarget = Join-Path $projectScriptsDir "initialize_cvf_clone.ps1"
Write-ProjectFileIfMissing -FilePath $portableInitializerTarget -Content (Get-Content -LiteralPath $portableInitializerSource -Raw -Encoding utf8)

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
    $agentContent = $agentContent -replace '\{\{CVF_CORE_PATH\}\}', '../.Controlled-Vibe-Framework-CVF (resolve through .cvf/manifest.json or .cvf/local-binding.json)'
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

Write-ProjectFileIfMissing -FilePath (Join-Path $projectPath "CVF_SESSION_MEMORY.md") -Content (Get-CvfSessionMemoryContent -InitialHandoffRelative $initialHandoffRelative)

$activeState = Get-CvfActiveStateObject -ProjectName $ProjectName -InitialHandoffRelative $initialHandoffRelative -DateStamp $dateStamp
Write-ProjectFileIfMissing -FilePath (Join-Path $sessionDir "ACTIVE_SESSION_STATE.json") -Content ($activeState | ConvertTo-Json -Depth 6)

Write-ProjectFileIfMissing -FilePath $initialHandoffPath -Content (Get-CvfInitialHandoffContent -ProjectName $ProjectName)

$implementationStatus = Get-CvfImplementationStatusObject -ProjectName $ProjectName -DateStamp $dateStamp
Write-ProjectFileIfMissing -FilePath (Join-Path $projectPath "IMPLEMENTATION_STATUS.json") -Content ($implementationStatus | ConvertTo-Json -Depth 6)

foreach ($family in @("decisions", "roadmaps", "specs", "work_orders", "reviews")) {
    $familyTitle = (Get-Culture).TextInfo.ToTitleCase($family.Replace('_', ' '))
    $familyContent = "# $familyTitle`r`n`r`nStore project-governed $family artifacts here. Link active artifacts from docs/INDEX.md.`r`n"
    Write-ProjectFileIfMissing -FilePath (Join-Path $docsDir "$family\README.md") -Content $familyContent
}

# Governed downstream catalog kit: Artifact Registry, Module Registry, schemas,
# executable catalog manager, and deterministic Index/Module Catalog views.
$catalogKitStatus = Install-CvfDownstreamCatalogKit -ProjectPath $projectPath -CvfCorePath $cvfCorePath `
    -ProjectName $ProjectName -DateStamp $dateStamp -InitialHandoffRelative $initialHandoffRelative

# Bootstrap Log
$logContent = Get-CvfBootstrapLogContent -RecordIdDate $recordIdDate -ProjectName $ProjectName -DateStamp $dateStamp `
    -CvfHead $cvfHead -AgentInstructionsStatus $agentInstructionsStatus -CatalogKitStatus $catalogKitStatus
Set-Content -Path $bootstrapLogPath -Value $logContent -Encoding utf8
Write-Ok "Created: $bootstrapLogPath"

# BSL-R8: a fresh or already-governed bootstrap must not claim success when
# the catalog installation itself failed. The log above is still written so
# the failure is on record, but the script must stop here with a non-zero
# exit and must never reach the "Workspace bootstrap complete." line below.
if ($catalogKitStatus -eq "DAMAGED_GOVERNED_SKIPPED") {
    throw "Bootstrap did NOT complete successfully: governed downstream catalog installation failed (status: DAMAGED_GOVERNED_SKIPPED). The catalog manager rejected the registries, or the governed source is structurally invalid. Run scripts/manage_cvf_downstream_catalog.ps1 -Check in the project, repair docs/catalog/ARTIFACT_REGISTRY.json, then re-run bootstrap. See $bootstrapLogPath for detail."
}

Write-Host ""
if ($catalogKitStatus -eq "MIGRATION_REQUIRED_SKIPPED") {
    # Bounded, non-fatal - but this is explicitly NOT a governed-catalog
    # success, so it must not print the same claim as a real success.
    Write-Warn "Workspace bootstrap complete WITH NOTE - this is NOT a governed-catalog success."
    Write-Warn "MIGRATION_REQUIRED: pre-existing legacy/mixed catalog content was detected; the governed downstream catalog kit was not installed. Review and adopt it deliberately."
}
else {
    Write-Ok "Workspace bootstrap complete."
}
Write-Host "Governed downstream catalog kit status: $catalogKitStatus" -ForegroundColor Cyan
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
