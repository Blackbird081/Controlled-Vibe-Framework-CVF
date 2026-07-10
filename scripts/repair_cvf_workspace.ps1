param(
    [Parameter(Mandatory = $true)]
    [string]$WorkspaceRoot,

    [switch]$Json
)

$ErrorActionPreference = "Stop"
$expectedRemote = "https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git"
$workspaceResolved = [System.IO.Path]::GetFullPath($WorkspaceRoot)
$corePath = Join-Path $workspaceResolved ".Controlled-Vibe-Framework-CVF"
$activePath = Join-Path $workspaceResolved "CVF_RULE_PACKS\ACTIVE_RULE_PACK.json"

if (-not (Test-Path -LiteralPath $corePath -PathType Container)) {
    throw "Hidden public core not found: $corePath"
}
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw "git is required but was not found in PATH."
}

$remote = (git -C $corePath remote get-url origin).Trim()
if ($remote -ne $expectedRemote) {
    throw "Unexpected hidden core remote: $remote"
}
if (-not (Test-Path -LiteralPath $activePath -PathType Leaf)) {
    throw "Active public profile record not found: $activePath"
}

$activeBefore = Get-Content -LiteralPath $activePath -Raw -Encoding utf8 | ConvertFrom-Json
$profileBefore = $activeBefore.activeProfile
$headBefore = (git -C $corePath rev-parse HEAD).Trim()
$supported = @("public-free", "paid-user-safe")
if ($supported -notcontains $profileBefore) {
    throw "Repair refuses unsupported active profile: $profileBefore"
}

$wrapperInstaller = Join-Path $corePath "scripts\install_cvf_workspace_root_wrappers.ps1"
$profileScript = Join-Path $corePath "scripts\sync_cvf_workspace_public_profile.ps1"
foreach ($required in @($wrapperInstaller, $profileScript)) {
    if (-not (Test-Path -LiteralPath $required -PathType Leaf)) {
        throw "Required repair source is missing: $required"
    }
}

$wrapperOutput = & powershell -NoProfile -ExecutionPolicy Bypass -File $wrapperInstaller -WorkspaceRoot $workspaceResolved
if ($LASTEXITCODE -ne 0) {
    throw "Workspace wrapper repair failed with exit code $LASTEXITCODE"
}
$profileOutput = & powershell -NoProfile -ExecutionPolicy Bypass -File $profileScript -WorkspaceRoot $workspaceResolved -ProfileName $profileBefore
if ($LASTEXITCODE -ne 0) {
    throw "Workspace profile repair failed with exit code $LASTEXITCODE"
}

$headAfter = (git -C $corePath rev-parse HEAD).Trim()
$activeAfter = Get-Content -LiteralPath $activePath -Raw -Encoding utf8 | ConvertFrom-Json
if ($headAfter -ne $headBefore) {
    throw "Repair changed hidden core HEAD. Before=$headBefore After=$headAfter"
}
if ($activeAfter.activeProfile -ne $profileBefore) {
    throw "Repair changed active profile. Before=$profileBefore After=$($activeAfter.activeProfile)"
}

$result = [ordered]@{
    schemaVersion = "1.0"
    disposition = "REPAIRED"
    workspaceRoot = $workspaceResolved
    coreCommitBefore = $headBefore
    coreCommitAfter = $headAfter
    activeProfileBefore = $profileBefore
    activeProfileAfter = $activeAfter.activeProfile
    actions = @("REFRESHED_ROOT_ARTIFACTS", "REMATERIALIZED_ACTIVE_PROFILE")
}

if ($Json) {
    $result | ConvertTo-Json -Depth 6
}
else {
    $wrapperOutput | ForEach-Object { Write-Host $_ }
    $profileOutput | ForEach-Object { Write-Host $_ }
    Write-Host "[OK] CVF workspace repaired without changing core HEAD or active profile." -ForegroundColor Green
}
