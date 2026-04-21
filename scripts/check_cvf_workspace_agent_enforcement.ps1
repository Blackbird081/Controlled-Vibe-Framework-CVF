param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectPath
)

$ErrorActionPreference = "SilentlyContinue"

$projectResolved = [System.IO.Path]::GetFullPath($ProjectPath)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$cvfCoreCandidate = Split-Path -Parent $scriptDir

$results = [System.Collections.ArrayList]::new()
$failCount = 0

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

Write-Host ""
Write-Host "CVF Workspace Agent Enforcement Doctor" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "Project: $projectResolved"
Write-Host ""

# ── Check 1: Project exists ───────────────────────────────────────────────────
$projectExists = Test-Path $projectResolved -PathType Container
Add-Check "Project folder exists" $projectExists $projectResolved

if (-not $projectExists) {
    Write-Host "[FATAL] Project folder not found: $projectResolved" -ForegroundColor Red
    exit 1
}

# ── Check 2: Project is NOT inside CVF core ───────────────────────────────────
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
$isolationDetail = if (-not $isolationOk) { "Project path appears to be inside CVF core — workspace isolation violated" } else { "OK" }
Add-Check "Project isolated from CVF core" $isolationOk $isolationDetail

# ── Check 3: .cvf/manifest.json exists ───────────────────────────────────────
$manifestPath = Join-Path $projectResolved ".cvf\manifest.json"
$manifestExists = Test-Path $manifestPath -PathType Leaf
Add-Check ".cvf/manifest.json exists" $manifestExists $manifestPath

# ── Check 4: .cvf/manifest.json is valid JSON with required fields ───────────
$manifestValid = $false
$manifestObj = $null
if ($manifestExists) {
    try {
        $manifestContent = Get-Content $manifestPath -Raw -Encoding utf8
        $manifestObj = $manifestContent | ConvertFrom-Json
        $requiredFields = @("cvfCorePath","cvfCoreCommit","workspaceRoot","projectPath","phaseModel",
                            "liveGovernanceEvidenceRequired","mockAllowedOnlyForUi","requiredDocs",
                            "bootstrapDate","enforcementVersion")
        $missing = $requiredFields | Where-Object { -not ($manifestObj.PSObject.Properties.Name -contains $_) }
        $manifestValid = ($missing.Count -eq 0)
        $manifestDetail = if ($manifestValid) { "All required fields present" } else { "Missing fields: $($missing -join ', ')" }
    }
    catch {
        $manifestDetail = "JSON parse error: $_"
    }
    Add-Check ".cvf/manifest.json is valid" $manifestValid $manifestDetail
}

# ── Check 5: .cvf/policy.json exists ─────────────────────────────────────────
$policyPath = Join-Path $projectResolved ".cvf\policy.json"
$policyExists = Test-Path $policyPath -PathType Leaf
Add-Check ".cvf/policy.json exists" $policyExists $policyPath

# ── Check 6: live governance evidence policy is enabled ──────────────────────
$liveEvidenceEnabled = $false
if ($policyExists) {
    try {
        $policyContent = Get-Content $policyPath -Raw -Encoding utf8
        $policyObj = $policyContent | ConvertFrom-Json
        $liveEvidenceEnabled = ($policyObj.liveGovernanceEvidenceRequired -eq $true)
    }
    catch {
        # parse error — already counted as FAIL via policyExists path
    }
    $liveEvidenceDetail = if ($liveEvidenceEnabled) { "liveGovernanceEvidenceRequired = true" } else { "liveGovernanceEvidenceRequired is not true in policy.json" }
    Add-Check "Live governance evidence mandatory" $liveEvidenceEnabled $liveEvidenceDetail
}

# ── Check 7: downstream AGENTS.md exists ─────────────────────────────────────
$agentsPath = Join-Path $projectResolved "AGENTS.md"
$agentsExists = Test-Path $agentsPath -PathType Leaf
Add-Check "AGENTS.md exists" $agentsExists $agentsPath

# ── Check 8: Bootstrap log exists ────────────────────────────────────────────
$docsDir = Join-Path $projectResolved "docs"
$bootstrapLogs = @(Get-ChildItem -Path $docsDir -Filter "CVF_BOOTSTRAP_LOG_*.md" -ErrorAction SilentlyContinue)
$bootstrapLogExists = ($bootstrapLogs.Count -gt 0)
$bootstrapLogDetail = if ($bootstrapLogExists) { $bootstrapLogs[0].FullName } else { "No CVF_BOOTSTRAP_LOG_*.md found in $docsDir" }
Add-Check "Bootstrap log exists" $bootstrapLogExists $bootstrapLogDetail

# ── Check 9: CVF core path is reachable ──────────────────────────────────────
$cvfCorePath = $null
if ($null -ne $manifestObj -and $manifestObj.cvfCorePath) {
    $cvfCorePath = $manifestObj.cvfCorePath
}
$coreReachable = $false
if ($cvfCorePath) {
    $coreReachable = (Test-Path $cvfCorePath -PathType Container)
    Add-Check "CVF core path reachable" $coreReachable $cvfCorePath
}
else {
    Add-Check "CVF core path reachable" $false "cvfCorePath not found in manifest"
}

# ── Check 10: CVF core commit matches manifest ────────────────────────────────
if ($coreReachable -and $manifestObj.cvfCoreCommit) {
    $ErrorActionPreference = "SilentlyContinue"
    $actualCommit = git -C $cvfCorePath rev-parse --short HEAD 2>$null
    $ErrorActionPreference = "SilentlyContinue"
    $commitMatch = ($actualCommit -eq $manifestObj.cvfCoreCommit)
    $commitDetail = if ($commitMatch) { "Commit: $actualCommit" } else { "Manifest: $($manifestObj.cvfCoreCommit) / Actual: $actualCommit (warn only — core may have updated)" }
    Add-Check "CVF core commit matches manifest" $commitMatch $commitDetail
    if (-not $commitMatch) {
        # Commit mismatch is a warning, not a hard failure — decrement failCount
        $failCount--
    }
}

# ── Check 11: Required docs in manifest exist ─────────────────────────────────
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

# ── Print results table ───────────────────────────────────────────────────────
Write-Host ""
Write-Host ("  {0,-50} {1}" -f "Check", "Status") -ForegroundColor White
Write-Host ("  {0,-50} {1}" -f ("─" * 50), ("─" * 6)) -ForegroundColor DarkGray

foreach ($r in $results) {
    $color = if ($r.Status -eq "PASS") { "Green" } else { "Red" }
    $symbol = if ($r.Status -eq "PASS") { "[PASS]" } else { "[FAIL]" }
    Write-Host ("  {0,-50} " -f $r.Check) -NoNewline
    Write-Host $symbol -ForegroundColor $color
    if ($r.Detail -and $r.Status -eq "FAIL") {
        Write-Host ("         -> $($r.Detail)") -ForegroundColor DarkYellow
    }
}

Write-Host ""
$totalChecks = $results.Count
$passCount = $totalChecks - $failCount

if ($failCount -eq 0) {
    Write-Host "  RESULT: PASS ($passCount/$totalChecks checks passed)" -ForegroundColor Green
    Write-Host "  This workspace is agent-enforcement-ready." -ForegroundColor Green
    exit 0
}
else {
    Write-Host "  RESULT: FAIL ($passCount/$totalChecks checks passed, $failCount failed)" -ForegroundColor Red
    Write-Host "  Fix the failures above, then re-run this doctor." -ForegroundColor Red
    exit 1
}
