# CVF Downstream Gate Profile - PowerShell integration (Windows PowerShell 5.1 and 7).
#
# Core-side only; dot-sourced by new-cvf-workspace.ps1, the workspace doctor and the
# web evidence bridge. The Python runner next to this file is the single
# framework-owned control source (profile cvf.downstreamGateProfile@1.1.0).

$Script:CvfGateProfileId = "cvf.downstreamGateProfile@1.1.0"
$Script:CvfGateProfileCoreFiles = @(
    "governance\compat\check_gate_to_role_closeability.py",
    "scripts\lib\downstream_governance\CvfDownstreamGateProfile.ps1",
    "scripts\lib\downstream_governance\cvf_downstream_gate_profile.json",
    "scripts\lib\downstream_governance\cvf_downstream_gate_runner.py",
    "scripts\lib\downstream_governance\cvf_dg_common.py",
    "scripts\lib\downstream_governance\cvf_dg_install.py",
    "scripts\lib\downstream_governance\cvf_dg_continuity.py",
    "scripts\lib\downstream_governance\cvf_dg_applicability.py",
    "scripts\lib\downstream_governance\cvf_dg_routing.py",
    "scripts\lib\downstream_governance\cvf_dg_review.py",
    "scripts\lib\downstream_governance\cvf_dg_intake.py",
    "scripts\lib\downstream_governance\cvf_dg_coverage.py",
    "scripts\lib\downstream_governance\downstream_pr_gates.yml.template",
    "scripts\lib\downstream_governance\git-pre-commit.template",
    "scripts\lib\downstream_governance\project_learning_home.template.md",
    "scripts\lib\downstream_governance\project_learning_record.template.md"
)

function Resolve-CvfPython {
    foreach ($candidate in @("python", "python3")) {
        $command = Get-Command $candidate -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($null -eq $command) { continue }
        $previous = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        try {
            $major = (& $command.Source -c "import sys; print(sys.version_info[0])" 2>$null | Out-String).Trim()
        }
        finally { $ErrorActionPreference = $previous }
        if ($major -eq "3") { return $command.Source }
    }
    return $null
}

function Invoke-CvfGateRunner {
    # Always runs the Core runner (trusted copy). Bytecode is disabled so a
    # hermetic or CI tree never gains untracked cache files.
    param([Parameter(Mandatory = $true)][string]$CorePath, [Parameter(Mandatory = $true)][string[]]$Arguments)
    $python = Resolve-CvfPython
    if ($null -eq $python) {
        return [PSCustomObject]@{ ExitCode = 3; Output = "BLOCKED_PYTHON_UNAVAILABLE: a mandatory downstream gate needs Python 3" }
    }
    $runner = Join-Path $CorePath "scripts\lib\downstream_governance\cvf_downstream_gate_runner.py"
    if (-not (Test-Path -LiteralPath $runner -PathType Leaf)) {
        return [PSCustomObject]@{ ExitCode = 3; Output = "BLOCKED_TRUSTED_RUNNER_MISSING: $runner" }
    }
    $previous = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $previousBytecode = $env:PYTHONDONTWRITEBYTECODE
    $env:PYTHONDONTWRITEBYTECODE = "1"
    try {
        $output = & $python -B $runner @Arguments 2>&1 | Out-String
        return [PSCustomObject]@{ ExitCode = $LASTEXITCODE; Output = $output }
    }
    finally {
        $env:PYTHONDONTWRITEBYTECODE = $previousBytecode
        $ErrorActionPreference = $previous
    }
}

function Get-CvfGateProfileMode {
    # FRESH: no continuity surface exists yet. EXISTING: a lock is already present.
    # EXPLICIT: operator passed -InstallGateProfile. SKIP: pre-existing project
    # without a lock; reported as MIGRATION_REQUIRED, never silently rewritten.
    param([Parameter(Mandatory = $true)][string]$ProjectPath, [switch]$Explicit)
    if ($Explicit) { return "EXPLICIT" }
    if (Test-Path -LiteralPath (Join-Path $ProjectPath ".cvf\gate-profile.lock.json") -PathType Leaf) { return "EXISTING" }
    $surfaces = @("CVF_SESSION_MEMORY.md", "CVF_SESSION\ACTIVE_SESSION_STATE.json", "IMPLEMENTATION_STATUS.json")
    $anyExisting = @($surfaces | Where-Object { Test-Path -LiteralPath (Join-Path $ProjectPath $_) }).Count -gt 0
    if ($anyExisting) { return "SKIP" }
    return "FRESH"
}

function Install-CvfDownstreamGateProfile {
    param(
        [Parameter(Mandatory = $true)][string]$ProjectPath,
        [Parameter(Mandatory = $true)][string]$CvfCorePath,
        [Parameter(Mandatory = $true)][string]$CvfHead,
        [Parameter(Mandatory = $true)][string]$Mode
    )
    if ($Mode -eq "SKIP") {
        Write-Host "[WARN] MIGRATION_REQUIRED: pre-existing project without a gate profile lock. No gate file was installed; adopt deliberately with -InstallGateProfile." -ForegroundColor Yellow
        return "MIGRATION_REQUIRED_SKIPPED"
    }
    $result = Invoke-CvfGateRunner -CorePath $CvfCorePath -Arguments @("install", "--project-root", $ProjectPath, "--core-root", $CvfCorePath, "--core-commit", $CvfHead)
    $statusLine = @($result.Output -split "`r?`n" | Where-Object { $_ -like "GATE_PROFILE_STATUS:*" } | Select-Object -Last 1)
    if ($statusLine.Count -eq 0) {
        Write-Host "[FAIL] Gate profile installer gave no status: $($result.Output)" -ForegroundColor Red
        return "BLOCKED_INSTALLER_NO_STATUS"
    }
    $status = ($statusLine[0] -split "\s+")[1]
    Write-Host "[INFO] $($statusLine[0])" -ForegroundColor Cyan
    return $status
}

function Get-CvfGateProfileDoctorChecks {
    # Returns doctor check descriptors; the doctor owns Add-Check/Add-Warn.
    param([Parameter(Mandatory = $true)][string]$ProjectPath, [Parameter(Mandatory = $true)][string]$CorePath, $ManifestObj)
    $lockPath = Join-Path $ProjectPath ".cvf\gate-profile.lock.json"
    $gatesDir = Join-Path $ProjectPath "scripts\cvf_gates"
    $hasMarker = ($null -ne $ManifestObj) -and ($ManifestObj.PSObject.Properties.Name -contains "downstreamGateProfile")
    $governed = $hasMarker -or (Test-Path -LiteralPath $lockPath) -or (Test-Path -LiteralPath $gatesDir)
    if (-not $governed) {
        return [PSCustomObject]@{
            Checks  = @([PSCustomObject]@{ Name = "Downstream gate profile not installed"; Kind = "WARN"; Detail = "GATE_PROFILE_NOT_INSTALLED: pre-existing project; MIGRATION_REQUIRED. No inherited gate coverage is claimed (see the workspace migration contract)." })
            Summary = "GATE_COVERAGE: NOT_INSTALLED (migration required); hostedCiObserved=false"
        }
    }
    $run = Invoke-CvfGateRunner -CorePath $CorePath -Arguments @("run", "--phase", "bootstrap", "--project-root", $ProjectPath, "--trusted", "--json")
    $jsonStart = $run.Output.IndexOf("{")
    $parsed = $null
    if ($jsonStart -ge 0) {
        try { $parsed = $run.Output.Substring($jsonStart) | ConvertFrom-Json } catch { $parsed = $null }
    }
    if ($null -eq $parsed) {
        return [PSCustomObject]@{
            Checks  = @([PSCustomObject]@{ Name = "Downstream gate profile runs (bootstrap phase)"; Kind = "CHECK"; Passed = $false; Detail = "BLOCKED: trusted runner produced no result (exit $($run.ExitCode)): $($run.Output.Trim())" })
            Summary = "GATE_COVERAGE: BLOCKED; hostedCiObserved=false"
        }
    }
    $checks = @()
    foreach ($control in $parsed.results) {
        $detail = if ($control.ok) { "$($control.outcome)" } else { (@($control.findings | Select-Object -First 4 | ForEach-Object { "$($_.code)@$($_.locator)" }) -join "; ") + " [$($control.outcome)]" }
        $checks += [PSCustomObject]@{ Name = "Gate $($control.controlId)"; Kind = "CHECK"; Passed = [bool]$control.ok; Detail = $detail }
    }
    $coverage = Invoke-CvfGateRunner -CorePath $CorePath -Arguments @("coverage", "--project-root", $ProjectPath, "--json")
    $summary = "GATE_COVERAGE: UNKNOWN; hostedCiObserved=false"
    $coverageStart = $coverage.Output.IndexOf("{")
    if ($coverageStart -ge 0) {
        try {
            $cov = $coverage.Output.Substring($coverageStart) | ConvertFrom-Json
            $pairs = @($cov.summary.PSObject.Properties | ForEach-Object { "$($_.Name)=$($_.Value)" }) -join " "
            $summary = "GATE_COVERAGE: $pairs hostedCiObserved=false"
        }
        catch { }
    }
    return [PSCustomObject]@{ Checks = $checks; Summary = $summary }
}
