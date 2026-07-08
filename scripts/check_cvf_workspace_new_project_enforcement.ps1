param(
    [Parameter(Mandatory = $true)]
    [string]$WorkspaceRoot,

    [string]$BaselinePath = "",

    [string]$PromoteProjectName = "",

    [switch]$AllowOfflinePinnedCore,

    [switch]$CheckLiveReadiness
)

$ErrorActionPreference = "Stop"

function Resolve-FullPath([string]$Path) {
    return [System.IO.Path]::GetFullPath($Path)
}

function Write-Ok([string]$Message) {
    Write-Host "[OK]   $Message" -ForegroundColor Green
}

$workspaceResolved = Resolve-FullPath $WorkspaceRoot
if (-not (Test-Path -LiteralPath $workspaceResolved -PathType Container)) {
    throw "Workspace root not found: $workspaceResolved"
}

if ([string]::IsNullOrWhiteSpace($BaselinePath)) {
    $BaselinePath = Join-Path $workspaceResolved "WORKSPACE_PROJECT_ENFORCEMENT_BASELINE.json"
}
$baselineResolved = Resolve-FullPath $BaselinePath
if (-not (Test-Path -LiteralPath $baselineResolved -PathType Leaf)) {
    throw "Baseline file not found: $baselineResolved"
}

$corePath = Join-Path $workspaceResolved ".Controlled-Vibe-Framework-CVF"
$doctorPath = Join-Path $corePath "scripts\check_cvf_workspace_agent_enforcement.ps1"
if (-not (Test-Path -LiteralPath $doctorPath -PathType Leaf)) {
    throw "Workspace doctor not found: $doctorPath"
}

$baseline = Get-Content -LiteralPath $baselineResolved -Raw -Encoding utf8 | ConvertFrom-Json
$legacyProjects = @{}
foreach ($name in $baseline.legacyProjects) {
    if (-not [string]::IsNullOrWhiteSpace($name)) {
        $legacyProjects[$name] = $true
    }
}

$excludedNames = @(
    ".Controlled-Vibe-Framework-CVF",
    ".claude",
    ".agents",
    "CVF_RULE_PACKS",
    "_cvf-core-backups",
    "scripts"
)

$projects = Get-ChildItem -LiteralPath $workspaceResolved -Directory -Force |
    Where-Object { $excludedNames -notcontains $_.Name -and -not $_.Name.StartsWith(".") } |
    Sort-Object Name

$results = @()
$failedProjects = @()
$promotedProjects = @()

Write-Host ""
Write-Host "CVF Workspace New-Project Enforcement Gate" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Workspace: $workspaceResolved"
Write-Host "Baseline:  $baselineResolved"
if (-not [string]::IsNullOrWhiteSpace($PromoteProjectName)) {
    Write-Host "Promote:   $PromoteProjectName"
}
Write-Host ""

foreach ($project in $projects) {
    $isLegacy = $legacyProjects.ContainsKey($project.Name)
    $promoteThisProject = $isLegacy -and
        (-not [string]::IsNullOrWhiteSpace($PromoteProjectName)) -and
        ($project.Name -eq $PromoteProjectName)

    if ($isLegacy -and -not $promoteThisProject) {
        $results += [PSCustomObject]@{
            Project = $project.Name
            Status  = "LEGACY_EXEMPT"
            Detail  = "Grandfathered by workspace baseline"
        }
        continue
    }

    $doctorArgs = @(
        "-ExecutionPolicy", "Bypass",
        "-File", $doctorPath,
        "-ProjectPath", $project.FullName
    )
    if ($AllowOfflinePinnedCore) {
        $doctorArgs += "-AllowOfflinePinnedCore"
    }
    if ($CheckLiveReadiness) {
        $doctorArgs += "-CheckLiveReadiness"
    }

    $output = & powershell @doctorArgs 2>&1
    $exitCode = $LASTEXITCODE
    $resultLine = ($output | Select-String "RESULT:" | Select-Object -Last 1)
    $detail = if ($null -ne $resultLine) {
        $resultLine.Line.Trim()
    }
    else {
        "Doctor finished without RESULT line"
    }

    if ($exitCode -eq 0) {
        if ($promoteThisProject) {
            $status = "PROMOTED_PASS"
            $promotedProjects += $project.Name
            $detail = "$detail | removed from workspace legacy baseline"
        }
        else {
            $status = "ENFORCED_PASS"
        }
    }
    else {
        $status = if ($promoteThisProject) { "PROMOTION_FAIL" } else { "ENFORCED_FAIL" }
        $failedProjects += $project.Name
        $failLines = @($output | Select-String "\[FAIL\]" | ForEach-Object { $_.Line.Trim() })
        if ($failLines.Count -gt 0) {
            $detail = $detail + " | " + ($failLines -join " ; ")
        }
    }

    $results += [PSCustomObject]@{
        Project = $project.Name
        Status  = $status
        Detail  = $detail
    }
}

if ($promotedProjects.Count -gt 0) {
    $remainingLegacy = @($baseline.legacyProjects | Where-Object { $promotedProjects -notcontains $_ })
    $updatedBaseline = [ordered]@{
        schemaVersion  = if ($baseline.schemaVersion) { $baseline.schemaVersion } else { "1.0" }
        legacyProjects = @($remainingLegacy)
    }
    $updatedBaseline | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $baselineResolved -Encoding utf8
}

$results | Format-Table -AutoSize
Write-Host ""

if ($promotedProjects.Count -gt 0) {
    Write-Ok ("Promoted project(s) out of legacy baseline: {0}" -f ($promotedProjects -join ", "))
}

if ($failedProjects.Count -gt 0) {
    Write-Host ("RESULT: FAIL - {0} enforced project(s) failed doctor" -f $failedProjects.Count) -ForegroundColor Red
    Write-Host ("Projects: {0}" -f ($failedProjects -join ", ")) -ForegroundColor Red
    exit 1
}

Write-Ok "RESULT: PASS - all new/non-exempt projects passed doctor."
exit 0
