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

function Ensure-Directory([string]$Path) {
    if (-not (Test-Path $Path)) {
        New-Item -ItemType Directory -Path $Path | Out-Null
        Write-Ok "Created directory: $Path"
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

Write-Info "Workspace root: $workspaceRootResolved"
Ensure-Directory $workspaceRootResolved

if (-not (Test-Path $cvfCorePath)) {
    Write-Info "Cloning CVF core into: $cvfCorePath"
    git clone https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git $cvfCorePath
    Write-Ok "CVF core cloned"
}
else {
    Write-Info "CVF core already exists: $cvfCorePath"
}

if (-not (Test-Path $workspaceRulesPath -PathType Leaf)) {
    $workspaceRulesContent = @"
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
- Run application work from the application project root.
- Keep provider keys and secrets out of this file, `.cvf/`, generated `AGENTS.md`, and bootstrap logs.

## Reference

Canonical source: `.Controlled-Vibe-Framework-CVF/docs/reference/CVF_WORKSPACE_RULES.md`
"@
    Set-Content -Path $workspaceRulesPath -Value $workspaceRulesContent -Encoding utf8
    Write-Ok "Created: $workspaceRulesPath"
}
else {
    Write-Info "Workspace rules already exist: $workspaceRulesPath"
}

if (-not (Test-Path $projectPath)) {
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
    phaseModel                   = @("INTAKE", "DESIGN", "BUILD", "REVIEW", "FREEZE")
    liveGovernanceEvidenceRequired = $true
    mockAllowedOnlyForUi         = $true
    requiredDocs                 = @(
        ".cvf/manifest.json",
        ".cvf/policy.json",
        "..\WORKSPACE_RULES.md",
        "docs/CVF_BOOTSTRAP_LOG_$recordIdDate.md"
    )
    bootstrapDate                = $dateStamp
    enforcementVersion           = "1.0"
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
if (-not (Test-Path $knowledgeDir)) {
    Ensure-Directory $knowledgeDir
    $knowledgeReadme = @"
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

- Secrets, API keys, or credentials (never — governance enforcement will reject these)
- Binary files or non-markdown formats (not supported in this wave)

## Reference

W116-T1 Downstream Knowledge Pipeline — `docs/roadmaps/CVF_W116_T1_DOWNSTREAM_KNOWLEDGE_PIPELINE_ROADMAP_2026-04-23.md`
"@
    Set-Content -Path (Join-Path $knowledgeDir "README.md") -Value $knowledgeReadme -Encoding utf8
    Write-Ok "Created: $knowledgeDir\README.md (project knowledge stub)"
}
else {
    Write-Ok "knowledge/ folder already exists: $knowledgeDir"
}

# CP1: Generate downstream AGENTS.md from template
$agentsTemplatePath = Join-Path $cvfCorePath "governance\toolkit\05_OPERATION\CVF_DOWNSTREAM_AGENTS_TEMPLATE.md"
$downstreamAgentsPath = Join-Path $projectPath "AGENTS.md"
$agentInstructionsStatus = "MISSING"

if (Test-Path $agentsTemplatePath) {
    $templateContent = Get-Content -Path $agentsTemplatePath -Raw -Encoding utf8
    $agentContent = $templateContent `
        -replace '\{\{CVF_CORE_PATH\}\}', $cvfCorePath `
        -replace '\{\{CVF_CORE_COMMIT\}\}', $cvfHead `
        -replace '\{\{BOOTSTRAP_DATE\}\}', $dateStamp `
        -replace '\{\{PROJECT_NAME\}\}', $ProjectName

    if (Test-Path $downstreamAgentsPath) {
        Write-Warn "AGENTS.md already exists at: $downstreamAgentsPath"
        Write-Warn "Inserting CVF merge block at top - review and merge manually."
        $existingContent = Get-Content -Path $downstreamAgentsPath -Raw -Encoding utf8
        $mergeBlock = @"
<!-- CVF_MERGE_BLOCK_START: generated $dateStamp by new-cvf-workspace.ps1 -->
<!-- Review this block and merge with your existing AGENTS.md content. -->
$agentContent
<!-- CVF_MERGE_BLOCK_END -->

$existingContent
"@
        Set-Content -Path $downstreamAgentsPath -Value $mergeBlock -Encoding utf8
        Write-Ok "Updated AGENTS.md with CVF merge block: $downstreamAgentsPath"
    }
    else {
        Set-Content -Path $downstreamAgentsPath -Value $agentContent -Encoding utf8
        Write-Ok "Created: $downstreamAgentsPath"
    }
    $agentInstructionsStatus = "PRESENT"
}
else {
    Write-Warn "CVF agent template not found at: $agentsTemplatePath"
    Write-Warn "AGENTS.md was NOT generated. Run bootstrap from an up-to-date CVF core."
    $agentInstructionsStatus = "MISSING - template not found"
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
