param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectPath,

    [switch]$CheckLiveReadiness,

    [switch]$AllowOfflinePinnedCore
)

$ErrorActionPreference = "SilentlyContinue"
$expectedPublicRemote = "https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git"
$requiredPublicCoreFiles = @(
    "AGENTS.md",
    "AGENT_HANDOFF.md",
    "docs\reference\CVF_WORKSPACE_RULES.md",
    "governance\toolkit\05_OPERATION\CVF_DOWNSTREAM_AGENTS_TEMPLATE.md",
    "scripts\check_cvf_workspace_agent_enforcement.ps1",
    "scripts\check_cvf_workspace_new_project_enforcement.ps1",
    "scripts\ingest_cvf_downstream_knowledge.ps1",
    "scripts\initialize_cvf_project_clone.ps1",
    "scripts\initialize_cvf_repository_clone.ps1",
    "scripts\new-cvf-workspace.ps1",
    "scripts\update_cvf_workspace_public_core.ps1",
    "scripts\write_cvf_workspace_web_evidence_bridge.ps1"
)

function Resolve-ProjectBoundPath {
    param(
        [string]$ProjectRoot,
        [string]$RelativePath,
        [string]$AbsolutePath
    )
    if (-not [string]::IsNullOrWhiteSpace($RelativePath)) {
        return [System.IO.Path]::GetFullPath((Join-Path $ProjectRoot $RelativePath))
    }
    if (-not [string]::IsNullOrWhiteSpace($AbsolutePath)) {
        return [System.IO.Path]::GetFullPath($AbsolutePath)
    }
    return $null
}

$projectResolved = [System.IO.Path]::GetFullPath($ProjectPath)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$cvfCoreCandidate = Split-Path -Parent $scriptDir

$results = [System.Collections.ArrayList]::new()
$failCount = 0
$warnCount = 0

function Add-Check {
    param([string]$Name, [bool]$Passed, [string]$Detail = "")
    $status = if ($Passed) { "PASS" } else { "FAIL" }
    if (-not $Passed) { $script:failCount++ }
    $null = $script:results.Add([PSCustomObject]@{
        Check  = $Name
        Status = $status
        Detail = $Detail
    })
}

function Add-Warn {
    param([string]$Name, [string]$Detail = "")
    $script:warnCount++
    $null = $script:results.Add([PSCustomObject]@{
        Check  = $Name
        Status = "WARN"
        Detail = $Detail
    })
}

function Normalize-EnvValue {
    param([string]$Value)
    if ([string]::IsNullOrWhiteSpace($Value)) {
        return ""
    }
    $trimmed = $Value.Trim()
    if (($trimmed.StartsWith('"') -and $trimmed.EndsWith('"')) -or
        ($trimmed.StartsWith("'") -and $trimmed.EndsWith("'"))) {
        return $trimmed.Substring(1, $trimmed.Length - 2).Trim()
    }
    return $trimmed
}

function Get-LocalEnvKeySource {
    param(
        [string]$CorePath,
        [string[]]$KeyNames
    )

    if ([string]::IsNullOrWhiteSpace($CorePath) -or -not (Test-Path $CorePath -PathType Container)) {
        return $null
    }

    $envFiles = @(
        (Join-Path $CorePath "EXTENSIONS\CVF_v1.6_AGENT_PLATFORM\cvf-web\.env.local"),
        (Join-Path $CorePath "EXTENSIONS\CVF_v1.6_AGENT_PLATFORM\cvf-web\.env"),
        (Join-Path $CorePath ".env.local"),
        (Join-Path $CorePath ".env")
    )

    foreach ($envFile in $envFiles) {
        if (-not (Test-Path $envFile -PathType Leaf)) {
            continue
        }

        $lines = Get-Content -Path $envFile -Encoding utf8
        foreach ($line in $lines) {
            $trimmed = $line.Trim()
            if ([string]::IsNullOrWhiteSpace($trimmed) -or $trimmed.StartsWith("#")) {
                continue
            }
            if ($trimmed.StartsWith("export ")) {
                $trimmed = $trimmed.Substring(7).Trim()
            }

            foreach ($keyName in $KeyNames) {
                if ($trimmed -match "^$([regex]::Escape($keyName))\s*=(.+)$") {
                    $value = Normalize-EnvValue $Matches[1]
                    if (-not [string]::IsNullOrWhiteSpace($value)) {
                        return [PSCustomObject]@{
                            KeyName = $keyName
                            Source  = "ignored_local_env"
                            Path    = $envFile
                        }
                    }
                }
            }
        }
    }

    return $null
}

function Get-LiveReadiness {
    param([string]$CorePath)

    $dashScopeAliases = @(
        "DASHSCOPE_API_KEY",
        "ALIBABA_API_KEY",
        "CVF_ALIBABA_API_KEY",
        "CVF_BENCHMARK_ALIBABA_KEY"
    )

    foreach ($alias in $dashScopeAliases) {
        $value = [Environment]::GetEnvironmentVariable($alias)
        if (-not [string]::IsNullOrWhiteSpace($value)) {
            return [PSCustomObject]@{
                LiveKeyAvailable = $true
                ProviderLane     = "alibaba"
                KeyName          = $alias
                Source           = "process_env"
                Path             = ""
            }
        }
    }

    $localSource = Get-LocalEnvKeySource -CorePath $CorePath -KeyNames $dashScopeAliases
    if ($null -ne $localSource) {
        return [PSCustomObject]@{
            LiveKeyAvailable = $true
            ProviderLane     = "alibaba"
            KeyName          = $localSource.KeyName
            Source           = $localSource.Source
            Path             = $localSource.Path
        }
    }

    return [PSCustomObject]@{
        LiveKeyAvailable = $false
        ProviderLane     = "none"
        KeyName          = "none"
        Source           = "none"
        Path             = ""
    }
}

Write-Host ""
Write-Host "CVF Workspace Agent Enforcement Doctor" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "Project: $projectResolved"
Write-Host ""

# Check 1: Project exists
$projectExists = Test-Path $projectResolved -PathType Container
Add-Check "Project folder exists" $projectExists $projectResolved

if (-not $projectExists) {
    Write-Host "[FATAL] Project folder not found: $projectResolved" -ForegroundColor Red
    exit 1
}

# Check 2: Project is NOT inside CVF core
$insideCore = $projectResolved.StartsWith($cvfCoreCandidate, [System.StringComparison]::OrdinalIgnoreCase) -and
              ($projectResolved.Length -gt $cvfCoreCandidate.Length)

# Also detect if project path contains well-known CVF core markers
$coreMarkers = @("Controlled-Vibe-Framework-CVF", ".Controlled-Vibe-Framework-CVF")
$pathContainsCore = $false
foreach ($marker in $coreMarkers) {
    if ($projectResolved -like "*\$marker\*") {
        $pathContainsCore = $true
        break
    }
}
$isolationOk = -not $insideCore -and -not $pathContainsCore
$isolationDetail = if (-not $isolationOk) { "Project path appears to be inside CVF core - workspace isolation violated" } else { "OK" }
Add-Check "Project isolated from CVF core" $isolationOk $isolationDetail

# Check 3: .cvf/manifest.json exists
$manifestPath = Join-Path $projectResolved ".cvf\manifest.json"
$manifestExists = Test-Path $manifestPath -PathType Leaf
Add-Check ".cvf/manifest.json exists" $manifestExists $manifestPath

# Check 4: .cvf/manifest.json is valid JSON with required fields
$manifestValid = $false
$manifestObj = $null
if ($manifestExists) {
    try {
        $manifestContent = Get-Content $manifestPath -Raw -Encoding utf8
        $manifestObj = $manifestContent | ConvertFrom-Json
        $portableManifest = ($manifestObj.PSObject.Properties.Name -contains "cvfCoreRelativePath")
        $requiredFields = if ($portableManifest) {
            @("schemaVersion", "cvfCoreRepository", "cvfCoreCommit", "cvfCoreRelativePath",
              "workspaceRulesRelativePath", "phaseModel", "liveGovernanceEvidenceRequired",
              "mockAllowedOnlyForUi", "requiredDocs", "bootstrapDate", "enforcementVersion")
        }
        else {
            @("cvfCorePath","cvfCoreCommit","workspaceRoot","projectPath","phaseModel",
              "liveGovernanceEvidenceRequired","mockAllowedOnlyForUi","requiredDocs",
              "bootstrapDate","enforcementVersion")
        }
        $missing = $requiredFields | Where-Object { -not ($manifestObj.PSObject.Properties.Name -contains $_) }
        $absolutePortableFields = @()
        if ($portableManifest) {
            foreach ($field in @("cvfCoreRelativePath", "workspaceRulesRelativePath")) {
                if ([System.IO.Path]::IsPathRooted([string]$manifestObj.$field)) {
                    $absolutePortableFields += $field
                }
            }
        }
        $manifestValid = ($missing.Count -eq 0) -and ($absolutePortableFields.Count -eq 0)
        $manifestDetail = if ($manifestValid) {
            if ($portableManifest) { "Portable schema fields present; tracked paths are relative" } else { "Legacy schema fields present" }
        }
        elseif ($missing.Count -gt 0) { "Missing fields: $($missing -join ', ')" }
        else { "Portable path fields must be relative: $($absolutePortableFields -join ', ')" }
    }
    catch {
        $manifestDetail = "JSON parse error: $_"
    }
    Add-Check ".cvf/manifest.json is valid" $manifestValid $manifestDetail
}

# Check 5: .cvf/policy.json exists
$policyPath = Join-Path $projectResolved ".cvf\policy.json"
$policyExists = Test-Path $policyPath -PathType Leaf
Add-Check ".cvf/policy.json exists" $policyExists $policyPath

# Check 6: live governance evidence policy is enabled
$liveEvidenceEnabled = $false
if ($policyExists) {
    try {
        $policyContent = Get-Content $policyPath -Raw -Encoding utf8
        $policyObj = $policyContent | ConvertFrom-Json
        $liveEvidenceEnabled = ($policyObj.liveGovernanceEvidenceRequired -eq $true)
    }
    catch {
        # parse error - already counted as FAIL via policyExists path
    }
    $liveEvidenceDetail = if ($liveEvidenceEnabled) { "liveGovernanceEvidenceRequired = true" } else { "liveGovernanceEvidenceRequired is not true in policy.json" }
    Add-Check "Live governance evidence mandatory" $liveEvidenceEnabled $liveEvidenceDetail
}

# Check 7: downstream AGENTS.md exists
$agentsPath = Join-Path $projectResolved "AGENTS.md"
$agentsExists = Test-Path $agentsPath -PathType Leaf
Add-Check "AGENTS.md exists" $agentsExists $agentsPath

# Check 8: Bootstrap log exists
$docsDir = Join-Path $projectResolved "docs"
$bootstrapLogs = @(Get-ChildItem -Path $docsDir -Filter "CVF_BOOTSTRAP_LOG_*.md" -ErrorAction SilentlyContinue)
$bootstrapLogExists = ($bootstrapLogs.Count -gt 0)
$bootstrapLogDetail = if ($bootstrapLogExists) { $bootstrapLogs[0].FullName } else { "No CVF_BOOTSTRAP_LOG_*.md found in $docsDir" }
Add-Check "Bootstrap log exists" $bootstrapLogExists $bootstrapLogDetail

if ($bootstrapLogExists -and (Test-Path -LiteralPath (Join-Path $projectResolved ".git") -PathType Container)) {
    $bootstrapLogRelative = "docs/" + $bootstrapLogs[0].Name
    $ignoreOutput = git -C $projectResolved check-ignore -v $bootstrapLogRelative 2>$null
    $ignoreDetail = ($ignoreOutput | Out-String).Trim()
    $lastIgnoreRule = @($ignoreOutput | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Last 1)
    $isUnignoredByNegation = ($lastIgnoreRule.Count -gt 0 -and $lastIgnoreRule[0] -match '^[^:]+:\d+:!')
    if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($ignoreDetail) -and -not $isUnignoredByNegation) {
        Add-Warn "Bootstrap log is visible to git" "IGNORED_BY_PROJECT_GITIGNORE: $bootstrapLogRelative -> $ignoreDetail"
    }
}

# Check 9: CVF core path is reachable
$cvfCorePath = $null
$localBindingPath = Join-Path $projectResolved ".cvf\local-binding.json"
$localBinding = $null
if (Test-Path -LiteralPath $localBindingPath -PathType Leaf) {
    try { $localBinding = Get-Content -LiteralPath $localBindingPath -Raw -Encoding utf8 | ConvertFrom-Json }
    catch { Add-Check "Local CVF binding is valid" $false "JSON parse error: $_" }
}
if ($null -ne $manifestObj) {
    $boundCorePath = if ($null -ne $localBinding) { [string]$localBinding.cvfCorePath } else { "" }
    $cvfCorePath = Resolve-ProjectBoundPath -ProjectRoot $projectResolved `
        -RelativePath ([string]$manifestObj.cvfCoreRelativePath) `
        -AbsolutePath $(if ($boundCorePath) { $boundCorePath } else { [string]$manifestObj.cvfCorePath })
}
$coreReachable = $false
if ($cvfCorePath) {
    $coreReachable = (Test-Path $cvfCorePath -PathType Container)
    Add-Check "CVF core path reachable" $coreReachable $cvfCorePath
}
else {
    Add-Check "CVF core path reachable" $false "No portable relative path or local/legacy binding found"
}

# Check 10: Workspace rules file exists at workspace root
$workspaceRulesPath = $null
if ($null -ne $localBinding -and $localBinding.workspaceRulesPath) {
    $workspaceRulesPath = $localBinding.workspaceRulesPath
}
elseif ($null -ne $manifestObj -and $manifestObj.workspaceRulesRelativePath) {
    $workspaceRulesPath = Resolve-ProjectBoundPath -ProjectRoot $projectResolved -RelativePath ([string]$manifestObj.workspaceRulesRelativePath) -AbsolutePath ""
}
elseif ($null -ne $manifestObj -and $manifestObj.workspaceRulesPath) {
    $workspaceRulesPath = $manifestObj.workspaceRulesPath
}
elseif ($null -ne $manifestObj -and $manifestObj.workspaceRoot) {
    $workspaceRulesPath = Join-Path $manifestObj.workspaceRoot "WORKSPACE_RULES.md"
}

$workspaceRulesExists = $false
if ($workspaceRulesPath) {
    $workspaceRulesExists = Test-Path $workspaceRulesPath -PathType Leaf
    Add-Check "Workspace rules file exists" $workspaceRulesExists $workspaceRulesPath
}
else {
    Add-Check "Workspace rules file exists" $false "workspaceRulesRelativePath/local binding not found"
}

# Check 11: CVF core remote is the public CVF repository
if ($coreReachable) {
    $actualRemote = (git -C $cvfCorePath remote get-url origin 2>$null | Out-String).Trim()
    $manifestRemote = if ($null -ne $manifestObj -and $manifestObj.cvfCoreRepository) { [string]$manifestObj.cvfCoreRepository } else { $expectedPublicRemote }
    $remoteMatches = ($actualRemote -eq $manifestRemote)
    $remoteDetail = if ($remoteMatches) { $actualRemote } else { "Expected: $manifestRemote / Actual: $actualRemote" }
    Add-Check "CVF core origin is public remote" $remoteMatches $remoteDetail
}

# Check 12: Public workspace kit is present in the hidden core
if ($coreReachable) {
    $missingCoreFiles = @($requiredPublicCoreFiles | Where-Object {
        -not (Test-Path -LiteralPath (Join-Path $cvfCorePath $_) -PathType Leaf)
    })
    $kitPresent = ($missingCoreFiles.Count -eq 0)
    $kitDetail = if ($kitPresent) { "All $($requiredPublicCoreFiles.Count) public workspace-kit files present" } else { "Missing: $($missingCoreFiles -join ', ')" }
    Add-Check "Public workspace kit is complete" $kitPresent $kitDetail
}

# Check 13: Hidden public core is synchronized with origin/main
if ($coreReachable) {
    git -C $cvfCorePath fetch origin main --quiet 2>$null
    $fetchPassed = ($LASTEXITCODE -eq 0)
    if ($fetchPassed) {
        $localHead = (git -C $cvfCorePath rev-parse HEAD 2>$null | Out-String).Trim()
        $remoteHead = (git -C $cvfCorePath rev-parse origin/main 2>$null | Out-String).Trim()
        $fresh = (-not [string]::IsNullOrWhiteSpace($localHead)) -and ($localHead -eq $remoteHead)
        if ($fresh) {
            Add-Check "CVF public core matches origin/main" $true "Commit: $($localHead.Substring(0, 8))"
        }
        else {
            git -C $cvfCorePath merge-base --is-ancestor $localHead $remoteHead 2>$null
            $freshnessClass = if ($LASTEXITCODE -eq 0) { "BEHIND_PUBLIC_REMOTE" } else { "DIVERGED_OR_UNRELATED_HISTORY" }
            Add-Check "CVF public core matches origin/main" $false "$freshnessClass. Local: $localHead / origin/main: $remoteHead. Run scripts/update_cvf_workspace_public_core.ps1."
        }
    }
    elseif ($AllowOfflinePinnedCore) {
        Add-Warn "CVF public core matches origin/main" "REMOTE_FRESHNESS_UNVERIFIED: origin/main fetch failed; offline pinned-core override used."
    }
    else {
        Add-Check "CVF public core matches origin/main" $false "REMOTE_FRESHNESS_UNVERIFIED: origin/main fetch failed. Re-run with network access or use -AllowOfflinePinnedCore for an explicit bounded offline override."
    }

    $corePending = (git -C $cvfCorePath status --porcelain 2>$null | Out-String).Trim()
    if ([string]::IsNullOrWhiteSpace($corePending)) {
        Add-Check "CVF public core worktree clean" $true "No pending core overlay"
    }
    else {
        Add-Warn "CVF public core worktree clean" "Pending public-core overlay exists. Review and publish or remove it before claiming a clean public-core state."
    }
}

# Check 14: CVF core commit matches manifest
if ($coreReachable -and $manifestObj.cvfCoreCommit) {
    $ErrorActionPreference = "SilentlyContinue"
    $actualCommit = (git -C $cvfCorePath rev-parse HEAD 2>$null | Out-String).Trim()
    $ErrorActionPreference = "SilentlyContinue"
    $commitMatch = $actualCommit.StartsWith([string]$manifestObj.cvfCoreCommit, [System.StringComparison]::OrdinalIgnoreCase)
    $commitDetail = if ($commitMatch) { "Commit: $actualCommit" } else { "Manifest: $($manifestObj.cvfCoreCommit) / Actual: $actualCommit (warn only - core may have updated)" }
    Add-Check "CVF core commit matches manifest" $commitMatch $commitDetail
    if (-not $commitMatch) {
        # Commit mismatch is a warning, not a hard failure - decrement failCount
        $failCount--
    }
}

if ($coreReachable -and $manifestObj.cvfCoreCommit) {
    git -C $cvfCorePath merge-base --is-ancestor $manifestObj.cvfCoreCommit origin/main 2>$null
    $pinReachable = ($LASTEXITCODE -eq 0)
    Add-Check "Pinned CVF core commit is public-remote reachable" $pinReachable $(if ($pinReachable) { [string]$manifestObj.cvfCoreCommit } else { "BLOCKED_CORE_COMMIT_NOT_REMOTE_REACHABLE: $($manifestObj.cvfCoreCommit)" })
}

# Check 15: Required docs in manifest exist
if ($null -ne $manifestObj -and $manifestObj.requiredDocs) {
    $allDocsPresent = $true
    $missingDocs = @()
    foreach ($doc in $manifestObj.requiredDocs) {
        $docPath = Join-Path $projectResolved $doc
        if (-not (Test-Path $docPath)) {
            $allDocsPresent = $false
            $missingDocs += $doc
        }
    }
    $docsDetail = if ($allDocsPresent) { "All $($manifestObj.requiredDocs.Count) required docs present" } else { "Missing: $($missingDocs -join ', ')" }
    Add-Check "Required docs referenced by manifest exist" $allDocsPresent $docsDetail
}

# Check 16 (optional/warn): if knowledgePath is declared in manifest, folder should exist
if ($null -ne $manifestObj -and $manifestObj.knowledgePath) {
    $knowledgeFolderPath = Join-Path $projectResolved $manifestObj.knowledgePath.TrimEnd('/')
    $knowledgeFolderExists = Test-Path $knowledgeFolderPath -PathType Container
    $knowledgeDetail = if ($knowledgeFolderExists) { "OK: $knowledgeFolderPath" } else { "Folder not found: $knowledgeFolderPath (run new-cvf-workspace.ps1 or create manually)" }
    if (-not $knowledgeFolderExists) {
        Write-Host "[WARN] Knowledge folder declared but missing: $knowledgeFolderPath" -ForegroundColor Yellow
    }
    # warn only — do not increment failCount
    $null = $script:results.Add([PSCustomObject]@{
        Check  = "knowledge/ folder present (optional)"
        Status = if ($knowledgeFolderExists) { "PASS" } else { "WARN" }
        Detail = $knowledgeDetail
    })
}

# Check 17: canonical seven-step phase model is present and ordered.
if ($null -ne $manifestObj -and $manifestObj.phaseModel) {
    $expectedPhaseModel = @("INTAKE", "DESIGN", "SPEC", "WORK_ORDER", "BUILD", "REVIEW", "FREEZE")
    $actualPhaseModel = @($manifestObj.phaseModel)
    $phaseModelMatches = (($actualPhaseModel -join "|") -eq ($expectedPhaseModel -join "|"))
    Add-Check "Seven-step phase model is canonical" $phaseModelMatches ($actualPhaseModel -join " -> ")
}

# Check 18: project continuity and discovery surfaces exist.
$governanceFrontDoors = @(
    "CVF_SESSION_MEMORY.md",
    "CVF_SESSION\ACTIVE_SESSION_STATE.json",
    "IMPLEMENTATION_STATUS.json",
    "docs\INDEX.md",
    "docs\catalog\MODULE_REGISTRY.json",
    "docs\catalog\MODULE_CATALOG.md"
)
$missingFrontDoors = @($governanceFrontDoors | Where-Object {
    -not (Test-Path -LiteralPath (Join-Path $projectResolved $_) -PathType Leaf)
})
Add-Check "Project continuity and catalog front doors exist" ($missingFrontDoors.Count -eq 0) $(if ($missingFrontDoors.Count -eq 0) { "All required front doors present" } else { "Missing: $($missingFrontDoors -join ', ')" })

# Check 19: active state is valid and points to an existing handoff.
$activeStatePath = Join-Path $projectResolved "CVF_SESSION\ACTIVE_SESSION_STATE.json"
$activeStateValid = $false
$activeHandoffDetail = "Active state unavailable"
if (Test-Path -LiteralPath $activeStatePath -PathType Leaf) {
    try {
        $projectState = Get-Content -LiteralPath $activeStatePath -Raw -Encoding utf8 | ConvertFrom-Json
        $stateFields = @("currentMode", "activePhase", "phaseModel", "activeHandoff", "nextAllowedMove", "activeRole", "roleRoute")
        $missingStateFields = @($stateFields | Where-Object { -not ($projectState.PSObject.Properties.Name -contains $_) })
        $handoffPath = if ($projectState.activeHandoff) { Join-Path $projectResolved $projectState.activeHandoff } else { "" }
        $handoffExists = (-not [string]::IsNullOrWhiteSpace($handoffPath)) -and (Test-Path -LiteralPath $handoffPath -PathType Leaf)
        $activeStateValid = ($missingStateFields.Count -eq 0) -and $handoffExists
        $activeHandoffDetail = if ($activeStateValid) { $projectState.activeHandoff } else { "Missing fields: $($missingStateFields -join ', '); handoff exists: $handoffExists" }
    }
    catch {
        $activeHandoffDetail = "JSON parse or pointer error: $_"
    }
}
Add-Check "Active session state resolves its handoff" $activeStateValid $activeHandoffDetail

# Check 20: machine-readable implementation and catalog files parse as JSON.
$jsonTruthFiles = @("IMPLEMENTATION_STATUS.json", "docs\catalog\MODULE_REGISTRY.json")
$invalidTruthFiles = @()
foreach ($relativeJson in $jsonTruthFiles) {
    try {
        $null = Get-Content -LiteralPath (Join-Path $projectResolved $relativeJson) -Raw -Encoding utf8 | ConvertFrom-Json
    }
    catch {
        $invalidTruthFiles += $relativeJson
    }
}
Add-Check "Implementation status and module registry are valid JSON" ($invalidTruthFiles.Count -eq 0) $(if ($invalidTruthFiles.Count -eq 0) { "Both JSON truth surfaces parse" } else { "Invalid: $($invalidTruthFiles -join ', ')" })

# Check 21: downstream agent contract is provider-neutral and role-aware.
$agentsContractValid = $false
if (Test-Path -LiteralPath $agentsPath -PathType Leaf) {
    $agentsText = Get-Content -LiteralPath $agentsPath -Raw -Encoding utf8
    $requiredRoleTokens = @("ORCHESTRATOR", "SPEC_AUTHOR", "WORK_ORDER_AUTHOR", "IMPLEMENTATION_WORKER", "REVIEWER", "CLOSER", "SESSION_SYNC_STEWARD")
    $missingRoleTokens = @($requiredRoleTokens | Where-Object { $agentsText -notmatch [regex]::Escape($_) })
    $agentsContractValid = ($missingRoleTokens.Count -eq 0) -and ($agentsText -match "INTAKE -> DESIGN -> SPEC -> WORK_ORDER -> BUILD -> REVIEW -> FREEZE")
    $agentsContractDetail = if ($agentsContractValid) { "Seven-step chain and provider-neutral roles present" } else { "Missing role tokens: $($missingRoleTokens -join ', ')" }
    Add-Check "AGENTS contract defines roles and seven steps" $agentsContractValid $agentsContractDetail
}

# Check 22: startup and tranche transitions require fresh continuity reads.
$continuityRehydrationValid = $false
$continuityRehydrationDetail = "AGENTS.md unavailable"
if (Test-Path -LiteralPath $agentsPath -PathType Leaf) {
    if (-not $agentsText) {
        $agentsText = Get-Content -LiteralPath $agentsPath -Raw -Encoding utf8
    }
    $rehydrationTokens = @(
        "Mandatory Continuity Rehydration",
        "new or resumed chat/session",
        "new tranche or work order",
        "Do not rely on chat history",
        "BLOCKED_CONTINUITY_DRIFT"
    )
    $missingRehydrationTokens = @($rehydrationTokens | Where-Object {
        $agentsText -notmatch [regex]::Escape($_)
    })
    $continuityRehydrationValid = ($missingRehydrationTokens.Count -eq 0)
    $continuityRehydrationDetail = if ($continuityRehydrationValid) {
        "Session/tranche continuity rehydration contract present"
    }
    else {
        "Missing contract tokens: $($missingRehydrationTokens -join ', ')"
    }
}
Add-Check "Session and tranche continuity rehydration required" $continuityRehydrationValid $continuityRehydrationDetail

# Print results table
Write-Host ""
Write-Host ("  {0,-50} {1}" -f "Check", "Status") -ForegroundColor White
Write-Host ("  {0,-50} {1}" -f ("-" * 50), ("-" * 6)) -ForegroundColor DarkGray

foreach ($r in $results) {
    $color = switch ($r.Status) { "PASS" { "Green" } "WARN" { "Yellow" } default { "Red" } }
    $symbol = switch ($r.Status) { "PASS" { "[PASS]" } "WARN" { "[WARN]" } default { "[FAIL]" } }
    Write-Host ("  {0,-50} " -f $r.Check) -NoNewline
    Write-Host $symbol -ForegroundColor $color
    if ($r.Detail -and $r.Status -ne "PASS") {
        Write-Host ("         -> $($r.Detail)") -ForegroundColor DarkYellow
    }
}

Write-Host ""

if ($CheckLiveReadiness) {
    $readiness = Get-LiveReadiness -CorePath $cvfCorePath
    Write-Host "CVF Live Governance Readiness (optional, secret-free)" -ForegroundColor Cyan
    Write-Host "====================================================" -ForegroundColor Cyan
    Write-Host ("  live_key_available: {0}" -f ($readiness.LiveKeyAvailable.ToString().ToLowerInvariant()))
    Write-Host ("  provider_lane:      {0}" -f $readiness.ProviderLane)
    Write-Host ("  key_name:           {0}" -f $readiness.KeyName)
    Write-Host ("  source:             {0}" -f $readiness.Source)
    if ($readiness.Path) {
        Write-Host ("  source_path:        {0}" -f $readiness.Path)
    }
    Write-Host "  raw_key_value:      NOT PRINTED"
    Write-Host "  release_gate:       python scripts/run_cvf_release_gate_bundle.py --json"
    if (-not $readiness.LiveKeyAvailable) {
        Write-Host "  note: Missing live key does not fail workspace enforcement doctor." -ForegroundColor Yellow
    }
    Write-Host ""
}

$totalChecks = $results.Count
$passCount = $totalChecks - $failCount - $warnCount

if ($failCount -eq 0) {
    if ($warnCount -eq 0) {
        Write-Host "  RESULT: PASS ($passCount/$totalChecks checks passed)" -ForegroundColor Green
        Write-Host "  This workspace is agent-enforcement-ready." -ForegroundColor Green
    }
    else {
        Write-Host "  RESULT: PASS WITH NOTE ($passCount passed, $warnCount warning(s))" -ForegroundColor Yellow
        Write-Host "  This workspace is agent-enforcement-ready with the bounded note above." -ForegroundColor Yellow
    }
    exit 0
}
else {
    Write-Host "  RESULT: FAIL ($passCount/$totalChecks checks passed, $failCount failed)" -ForegroundColor Red
    Write-Host "  Fix the failures above, then re-run this doctor." -ForegroundColor Red
    exit 1
}
