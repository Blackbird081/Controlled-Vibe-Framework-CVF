param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectPath,

    [switch]$CheckLiveReadiness,

    [string]$ReleaseGateResult = "OPERATOR_MUST_ATTACH_LATEST_RESULT",

    [string]$ReleaseGateCommand = "python scripts/run_cvf_release_gate_bundle.py --json"
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

function Escape-MarkdownFence([string]$Text) {
    if ([string]::IsNullOrEmpty($Text)) {
        return ""
    }
    return $Text -replace "~~~", "---"
}

$projectResolved = [System.IO.Path]::GetFullPath($ProjectPath)
if (-not (Test-Path $projectResolved -PathType Container)) {
    throw "ProjectPath does not exist: $projectResolved"
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$cvfCorePath = Split-Path -Parent $scriptDir
$manifestPath = Join-Path $projectResolved ".cvf\manifest.json"
$manifestObj = $null

if (Test-Path $manifestPath -PathType Leaf) {
    $manifestObj = Get-Content -Path $manifestPath -Raw -Encoding utf8 | ConvertFrom-Json
    if ($manifestObj.cvfCorePath) {
        $cvfCorePath = [string]$manifestObj.cvfCorePath
    }
}

$doctorScript = Join-Path $cvfCorePath "scripts\check_cvf_workspace_agent_enforcement.ps1"
if (-not (Test-Path $doctorScript -PathType Leaf)) {
    throw "Workspace doctor not found: $doctorScript"
}

$dateStamp = Get-Date -Format "yyyy-MM-dd"
$recordIdDate = Get-Date -Format "yyyyMMdd"
$docsDir = Join-Path $projectResolved "docs"
if (-not (Test-Path $docsDir)) {
    New-Item -ItemType Directory -Path $docsDir | Out-Null
}

$receiptPath = Join-Path $docsDir "CVF_WORKSPACE_WEB_EVIDENCE_BRIDGE_$recordIdDate.md"
$doctorArgs = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $doctorScript, "-ProjectPath", $projectResolved)
if ($CheckLiveReadiness) {
    $doctorArgs += "-CheckLiveReadiness"
}

Write-Info "Running workspace doctor for bridge receipt..."
$doctorOutput = ""
$doctorExitCode = 1
try {
    $doctorOutput = (& powershell @doctorArgs 2>&1 | Out-String).Trim()
    $doctorExitCode = $LASTEXITCODE
}
catch {
    $doctorOutput = ($_ | Out-String).Trim()
    $doctorExitCode = 1
}

$doctorStatus = if ($doctorExitCode -eq 0) { "PASS" } else { "FAIL" }
if ($doctorStatus -eq "PASS") {
    Write-Ok "Workspace doctor passed"
}
else {
    Write-Warn "Workspace doctor failed; receipt will record FAIL and the script will exit non-zero"
}

$liveReadinessSummary = "NOT_RUN"
if ($CheckLiveReadiness) {
    if ($doctorOutput -match "live_key_available:\s*(true|false)") {
        $liveReadinessSummary = "live_key_available=$($Matches[1])"
    }
    else {
        $liveReadinessSummary = "CHECKED_BUT_NOT_PARSED"
    }
}

$cvfCoreCommit = "UNKNOWN"
try {
    $cvfCoreCommit = (git -C $cvfCorePath rev-parse --short HEAD 2>$null).Trim()
}
catch {
    $cvfCoreCommit = if ($manifestObj -and $manifestObj.cvfCoreCommit) { [string]$manifestObj.cvfCoreCommit } else { "UNKNOWN" }
}

$projectName = Split-Path -Leaf $projectResolved
$escapedDoctorOutput = Escape-MarkdownFence $doctorOutput
$doctorCommandForReceipt = "powershell -ExecutionPolicy Bypass -File `"$doctorScript`" -ProjectPath `"$projectResolved`""
if ($CheckLiveReadiness) {
    $doctorCommandForReceipt = "$doctorCommandForReceipt -CheckLiveReadiness"
}

$receipt = @"
# CVF Workspace-To-Web Evidence Bridge

> Date: $dateStamp
> Record ID: W114-CP6-BRIDGE-$recordIdDate-$projectName
> Status: $doctorStatus
> Project: $projectResolved
> CVF Core: $cvfCorePath
> CVF Core Commit: $cvfCoreCommit

## 1. Purpose

This receipt lets a downstream workspace point to CVF Web live governance proof without copying, storing, or printing provider API keys inside the downstream project.

It bridges three evidence layers:

1. workspace enforcement artifacts in this downstream project;
2. optional secret-free live readiness visibility from the operator environment;
3. CVF core/web release evidence that must be run from the CVF core repository.

## 2. Workspace Enforcement

- Workspace doctor status: $doctorStatus
- Doctor command:

~~~powershell
$doctorCommandForReceipt
~~~

- Optional live readiness summary: $liveReadinessSummary
- Raw provider key values: NOT PRINTED
- Provider keys copied into downstream project: NO

## 3. CVF Web Live Governance Proof Reference

Run release-quality governance proof from the CVF core repository:

~~~bash
$ReleaseGateCommand
~~~

Latest attached result:

~~~text
$ReleaseGateResult
~~~

Canonical CVF evidence references:

- docs/assessments/CVF_W114_T1_NONCODER_OUTCOME_EVIDENCE_PACK_2026-04-23.md
- docs/assessments/CVF_W114_T1_NONCODER_OUTCOME_EVIDENCE_RAW_2026-04-23.json
- docs/assessments/CVF_W114_T1_WEB_BENEFIT_VISIBILITY_ASSESSMENT_2026-04-23.md
- docs/roadmaps/CVF_W114_T1_NONCODER_VALUE_MAXIMIZATION_AND_EVIDENCE_ROADMAP_2026-04-22.md

## 4. Claim Boundary

This downstream project may claim:

- the workspace is agent-enforcement-ready when the doctor status is PASS;
- live provider readiness was checked secret-free only if -CheckLiveReadiness was used;
- CVF Web governance proof is inherited by reference to the CVF core release gate and evidence records.

This downstream project must not claim:

- that provider API keys are stored or distributed by .cvf/;
- that workspace doctor pass proves provider connectivity;
- that mock UI checks prove governance behavior;
- that Web is the full CVF runtime.

## 5. Doctor Output

~~~text
$escapedDoctorOutput
~~~
"@

Set-Content -Path $receiptPath -Value $receipt -Encoding utf8
Write-Ok "Bridge receipt written: $receiptPath"

if ($doctorExitCode -ne 0) {
    exit $doctorExitCode
}

exit 0
