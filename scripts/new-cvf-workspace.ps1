param(
    [Parameter(Mandatory = $true)]
    [string]$WorkspaceRoot,

    [Parameter(Mandatory = $true)]
    [string]$ProjectName,

    [string]$ProjectRepo = "",

    [switch]$InstallGateProfile
)

$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "lib\downstream_catalog\CvfDownstreamCatalogLib.ps1")
. (Join-Path $PSScriptRoot "lib\downstream_catalog\CvfDownstreamBootstrapContent.ps1")
. (Join-Path $PSScriptRoot "lib\downstream_governance\CvfDownstreamGateProfile.ps1")

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
$workspaceWrapperInstallerPath = Join-Path $PSScriptRoot "install_cvf_workspace_root_wrappers.ps1"
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
) + $Script:CvfGateProfileCoreFiles

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

# The caller supplies the functions above while the selected hidden Core supplies
# the installed profile. Refuse mixed generations before writing project/wrappers.
$callerRoot = Split-Path -Parent $PSScriptRoot
$profileRelative = "scripts\lib\downstream_governance\cvf_downstream_gate_profile.json"
$callerProfile = Get-Content -LiteralPath (Join-Path $callerRoot $profileRelative) -Raw -Encoding utf8 | ConvertFrom-Json
$preflightFiles = @($Script:CvfGateProfileCoreFiles) + @(
    "scripts\new-cvf-workspace.ps1",
    "scripts\check_cvf_workspace_agent_enforcement.ps1",
    "scripts\install_cvf_workspace_root_wrappers.ps1",
    "scripts\lib\downstream_catalog\CvfDownstreamCatalogLib.ps1",
    "scripts\lib\downstream_catalog\CvfDownstreamBootstrapContent.ps1",
    "scripts\lib\downstream_catalog\CvfWorkspaceDoctorLiveReadiness.ps1",
    "governance\toolkit\05_OPERATION\CVF_DOWNSTREAM_AGENTS_TEMPLATE.md"
)
foreach ($name in $callerProfile.installedFiles) {
    $mapped = $callerProfile.coreSources.PSObject.Properties[$name]
    if ($null -ne $mapped -and $mapped.Value) { $preflightFiles += [string]$mapped.Value }
    else { $preflightFiles += "scripts\lib\downstream_governance\$name" }
}
$preflightFiles += "scripts\lib\downstream_governance\downstream_pr_gates.yml.template"
function Get-CvfSourceSha256([string]$Path) {
    $algorithm = [System.Security.Cryptography.SHA256]::Create()
    try {
        $encoding = [System.Text.Encoding]::GetEncoding(28591)
        $text = $encoding.GetString([System.IO.File]::ReadAllBytes($Path))
        $bytes = $encoding.GetBytes($text.Replace("`r`n", "`n"))
        return [BitConverter]::ToString($algorithm.ComputeHash($bytes))
    }
    finally { $algorithm.Dispose() }
}
foreach ($relative in ($preflightFiles | Select-Object -Unique)) {
    $callerFile = Join-Path $callerRoot $relative
    $selectedFile = Join-Path $cvfCorePath $relative
    if (-not (Test-Path -LiteralPath $callerFile -PathType Leaf) -or
        -not (Test-Path -LiteralPath $selectedFile -PathType Leaf) -or
        (Get-CvfSourceSha256 $callerFile) -ne (Get-CvfSourceSha256 $selectedFile)) {
        throw "BLOCKED_WORKSPACE_SOURCE_SKEW: caller and selected Core gate sources differ or are missing: $relative. Reconcile source versions before bootstrap; no project or workspace wrapper was written."
    }
}

# Existing governance identity must remain valid before any refresh touches the project.
$existingManifestPath = Join-Path $projectPath ".cvf\manifest.json"
$existingPolicyPath = Join-Path $projectPath ".cvf\policy.json"
$existingLockPath = Join-Path $projectPath ".cvf\gate-profile.lock.json"
if ((Test-Path -LiteralPath $existingManifestPath) -or (Test-Path -LiteralPath $existingPolicyPath) -or (Test-Path -LiteralPath $existingLockPath)) {
    try {
        $manifest = Get-Content -LiteralPath $existingManifestPath -Raw -Encoding utf8 | ConvertFrom-Json -ErrorAction Stop
        $policy = Get-Content -LiteralPath $existingPolicyPath -Raw -Encoding utf8 | ConvertFrom-Json -ErrorAction Stop
        $selectedHead = (git -C $cvfCorePath rev-parse HEAD | Out-String).Trim()
        if ($LASTEXITCODE -ne 0 -or $selectedHead -notmatch '^[a-f0-9]{40}$' -or
            [string]$manifest.cvfCoreCommit -cne $selectedHead -or
            [string]$manifest.cvfCoreRepository -cne 'https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git' -or
            [string]$manifest.cvfCoreRelativePath -cne '../.Controlled-Vibe-Framework-CVF' -or
            $policy.workspaceActivationSourcePolicy -notin @('CORE_ONLY', 'CORE_AND_SUPPLEMENTAL') -or
            ($policy.workspaceActivationExecutableSource -and $policy.workspaceActivationExecutableSource -notin @('PINNED_CORE', 'OPERATOR_LOCAL_PACK'))) {
            throw 'Existing manifest pin/path or activation policy does not match the selected Core.'
        }
        if (Test-Path -LiteralPath $existingLockPath) {
            $lock = Get-Content -LiteralPath $existingLockPath -Raw -Encoding utf8 | ConvertFrom-Json -ErrorAction Stop
            if ($lock.schemaVersion -cne 'cvf.downstreamGateLock@1.0.0' -or
                $lock.profileId -cne $callerProfile.profileId -or $lock.coreCommit -cne $selectedHead -or
                $lock.profileSha256 -cne (Get-CvfSourceSha256 (Join-Path $callerRoot $profileRelative)).Replace('-', '').ToLowerInvariant() -or
                $lock.runnerSha256 -cne (Get-CvfSourceSha256 (Join-Path $callerRoot 'scripts\lib\downstream_governance\cvf_downstream_gate_runner.py')).Replace('-', '').ToLowerInvariant()) {
                throw 'Existing gate lock differs from the selected Core profile.'
            }
            $python = Resolve-CvfPython
            if (-not $python) { throw 'Python 3 is required for existing lock validation.' }
            $verifyCode = 'import json,sys; from pathlib import Path; lib=Path(sys.argv[2]); sys.path.insert(0,str(lib)); from cvf_dg_install import verify_install; r=verify_install(Path(sys.argv[1]),lib,Path(sys.argv[3]),True); print(json.dumps(r.as_dict())); sys.exit(0 if r.ok else 1)'
            $verifyResult = & $python -B -c $verifyCode $projectPath (Join-Path $cvfCorePath 'scripts\lib\downstream_governance') $cvfCorePath 2>&1 | Out-String
            if ($LASTEXITCODE -ne 0) { throw "Existing profile verification failed: $verifyResult" }
        }
    }
    catch { throw "BLOCKED_EXISTING_PROJECT_IDENTITY: $_ No project or workspace wrapper was written; retain the existing pin and use a reviewed migration." }
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

## Development Responsibility And Feedback

Apply `docs/reference/CVF_PRODUCT_MILESTONE_COVERAGE_CONTRACT_2026-10-23.md`,
section "Development-Owned Internal Readiness Before User Feedback", in the CVF core.
The development team proves usable product delivery before requesting feedback;
noncoders supply business decisions, not technical QA. Follow its acceptance layers,
five evidence questions and authority/claim limits in the existing project records.

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

# DGIP: decide the gate-profile mode BEFORE any continuity surface is written.
$gateProfileMode = Get-CvfGateProfileMode -ProjectPath $projectPath -Explicit:$InstallGateProfile
$gateRequiredDocs = if ($gateProfileMode -ne "SKIP") { @(".cvf/gate-profile.lock.json", "scripts/cvf_gates/cvf_downstream_gate_runner.py") } else { @() }

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
    ) + $catalogRequiredDocs + $gateRequiredDocs
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
if ($gateProfileMode -ne "SKIP") {
    # Marker only when the profile is (or is being) installed; a skipped legacy project stays unmarked.
    $manifestObj.downstreamGateProfile = $Script:CvfGateProfileId
}
$manifestJson = $manifestObj | ConvertTo-Json -Depth 5
Write-ProjectFileIfMissing -FilePath (Join-Path $cvfManifestDir "manifest.json") -Content $manifestJson
Ensure-ProjectGitIgnoreLine -ProjectRoot $projectPath -Line ".cvf/local-binding.json"
if ($gateProfileMode -ne "SKIP") { Ensure-ProjectGitIgnoreLine -ProjectRoot $projectPath -Line ".cvf/runtime/" }

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
    workspaceActivationSourcePolicy = "CORE_ONLY"
    workspaceActivationExecutableSource = "PINNED_CORE"
}
$policyJson = $policyObj | ConvertTo-Json -Depth 5
Write-ProjectFileIfMissing -FilePath (Join-Path $cvfManifestDir "policy.json") -Content $policyJson

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
        $existingBytes = [System.IO.File]::ReadAllBytes($downstreamAgentsPath)
        $byteInspectionText = [System.Text.Encoding]::GetEncoding(28591).GetString($existingBytes)
        $mergeStartToken = '<!-- CVF_MERGE_BLOCK_START:'
        $mergeEndToken = '<!-- CVF_MERGE_BLOCK_END -->'
        $mergeStartMatches = [regex]::Matches($byteInspectionText, [regex]::Escape($mergeStartToken))
        $mergeEndMatches = [regex]::Matches($byteInspectionText, [regex]::Escape($mergeEndToken))
        $hasValidMergeBlock = ($mergeStartMatches.Count -eq 1 -and $mergeEndMatches.Count -eq 1 -and $mergeStartMatches[0].Index -lt $mergeEndMatches[0].Index)
        if (($mergeStartMatches.Count -ne 0 -or $mergeEndMatches.Count -ne 0) -and -not $hasValidMergeBlock) {
            throw "MALFORMED_CVF_MERGE_BLOCK: duplicate, reversed, or unterminated markers in $downstreamAgentsPath. File was not changed."
        }

        $contentForGeneratedCheck = $byteInspectionText
        if ($hasValidMergeBlock) {
            $priorBlockEnd = $mergeEndMatches[0].Index + $mergeEndToken.Length
            if ($byteInspectionText.Substring($priorBlockEnd).StartsWith("`r`n`r`n")) { $priorBlockEnd += 4 }
            elseif ($byteInspectionText.Substring($priorBlockEnd).StartsWith("`n`n")) { $priorBlockEnd += 2 }
            $contentForGeneratedCheck = $byteInspectionText.Substring(0, $mergeStartMatches[0].Index) + $byteInspectionText.Substring($priorBlockEnd)
        }
        $isCvfGeneratedAgents = (
            $contentForGeneratedCheck -match 'Generated by CVF workspace bootstrap' -and
            $contentForGeneratedCheck -match 'CVF Agent Instructions'
        )

        if ($isCvfGeneratedAgents) {
            Set-Content -LiteralPath $downstreamAgentsPath -Value $agentContent -Encoding utf8
            Write-Ok "Updated CVF-generated AGENTS.md in place: $downstreamAgentsPath"
        }
        else {
            Write-Warn "AGENTS.md already exists at: $downstreamAgentsPath"
            Write-Warn "Inserting one CVF merge block at top - review and merge manually."
            $mergeBlockText = "<!-- CVF_MERGE_BLOCK_START: generated $dateStamp by new-cvf-workspace.ps1 -->`r`n<!-- Review this block and merge with your existing AGENTS.md content. -->`r`n$agentContent`r`n<!-- CVF_MERGE_BLOCK_END -->`r`n`r`n"
            $mergeBlockBytes = [System.Text.UTF8Encoding]::new($false).GetBytes($mergeBlockText)
            $outsideStream = [System.IO.MemoryStream]::new()
            if ($hasValidMergeBlock) {
                $outsideStream.Write($existingBytes, 0, $mergeStartMatches[0].Index)
                $outsideStream.Write($existingBytes, $priorBlockEnd, $existingBytes.Length - $priorBlockEnd)
            }
            else {
                $outsideStream.Write($existingBytes, 0, $existingBytes.Length)
            }
            $outsideBytes = $outsideStream.ToArray()
            $outsideStream.Dispose()
            $updatedStream = [System.IO.MemoryStream]::new()
            $updatedStream.Write($mergeBlockBytes, 0, $mergeBlockBytes.Length)
            $updatedStream.Write($outsideBytes, 0, $outsideBytes.Length)
            [System.IO.File]::WriteAllBytes($downstreamAgentsPath, $updatedStream.ToArray())
            $updatedStream.Dispose()
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

# The pinned installer prepares the learning home with boundary checks before catalog registration.
# SKIP and drift-preserved existing profiles never acquire new learning content implicitly.
$gateProfileStatus = Install-CvfDownstreamGateProfile -ProjectPath $projectPath -CvfCorePath $cvfCorePath -CvfHead $cvfHead -Mode $gateProfileMode

# Governed downstream catalog kit: Artifact Registry, Module Registry, schemas,
# executable catalog manager, and deterministic Index/Module Catalog views.
$catalogKitStatus = Install-CvfDownstreamCatalogKit -ProjectPath $projectPath -CvfCorePath $cvfCorePath `
    -ProjectName $ProjectName -DateStamp $dateStamp -InitialHandoffRelative $initialHandoffRelative

# Bootstrap Log
$logContent = Get-CvfBootstrapLogContent -RecordIdDate $recordIdDate -ProjectName $ProjectName -DateStamp $dateStamp `
    -CvfHead $cvfHead -AgentInstructionsStatus $agentInstructionsStatus -CatalogKitStatus $catalogKitStatus -GateProfileStatus $gateProfileStatus
Set-Content -Path $bootstrapLogPath -Value $logContent -Encoding utf8
Write-Ok "Created: $bootstrapLogPath"

# BSL-R8: a fresh or already-governed bootstrap must not claim success when
# the catalog installation itself failed. The log above is still written so
# the failure is on record, but the script must stop here with a non-zero
# exit and must never reach the "Workspace bootstrap complete." line below.
if ($catalogKitStatus -eq "DAMAGED_GOVERNED_SKIPPED") {
    throw "Bootstrap did NOT complete successfully: governed downstream catalog installation failed (status: DAMAGED_GOVERNED_SKIPPED). The catalog manager rejected the registries, or the governed source is structurally invalid. Run scripts/manage_cvf_downstream_catalog.ps1 -Check in the project, repair docs/catalog/ARTIFACT_REGISTRY.json, then re-run bootstrap. See $bootstrapLogPath for detail."
}

if ($gateProfileStatus -notin @("FRESH_INSTALLED", "ALREADY_INSTALLED", "UPGRADED", "MIGRATION_REQUIRED_SKIPPED")) {
    throw "Bootstrap did NOT complete successfully: downstream gate profile status $gateProfileStatus (no silent overwrite of project-owned or drifted gate files). See $bootstrapLogPath."
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
Write-Host "Downstream gate profile status: $gateProfileStatus (INSTALLED is not INVOKED; run the doctor for coverage)" -ForegroundColor Cyan
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
