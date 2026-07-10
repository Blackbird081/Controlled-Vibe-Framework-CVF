param(
    [Parameter(Mandatory = $true)]
    [string]$WorkspaceRoot,

    [ValidateSet("public-free", "paid-user-safe")]
    [string]$ProfileName = "public-free"
)

$ErrorActionPreference = "Stop"
$publicRemote = "https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw "git is required but was not found in PATH."
}

$workspaceResolved = [System.IO.Path]::GetFullPath($WorkspaceRoot)
New-Item -ItemType Directory -Path $workspaceResolved -Force | Out-Null
$corePath = [System.IO.Path]::GetFullPath((Join-Path $workspaceResolved ".Controlled-Vibe-Framework-CVF"))
$workspacePrefix = $workspaceResolved.TrimEnd("\") + "\"
if (-not $corePath.StartsWith($workspacePrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Hidden core resolved outside workspace root: $corePath"
}

if (Test-Path -LiteralPath $corePath) {
    throw "Workspace already contains a hidden CVF core. Use Update-CVF-Workspace.ps1 instead: $corePath"
}

git -c core.longpaths=true clone $publicRemote $corePath
if ($LASTEXITCODE -ne 0) {
    throw "git clone failed with exit code $LASTEXITCODE"
}
git -C $corePath config core.longpaths true
if ($LASTEXITCODE -ne 0) {
    throw "failed to persist core.longpaths for the hidden public core"
}

try {
    $remote = (git -C $corePath remote get-url origin).Trim()
    if ($remote -ne $publicRemote) {
        throw "Unexpected cloned CVF remote: $remote"
    }

    $manifestPath = Join-Path $corePath "docs\reference\workspace_distribution\CVF_WORKSPACE_DISTRIBUTION_MANIFEST.json"
    $manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding utf8 | ConvertFrom-Json
    foreach ($required in @($manifest.requiredCoreFiles)) {
        if (-not (Test-Path -LiteralPath (Join-Path $corePath $required) -PathType Leaf)) {
            throw "Installed public core is missing required distribution file: $required"
        }
    }

    $wrapperInstaller = Join-Path $corePath "scripts\install_cvf_workspace_root_wrappers.ps1"
    & powershell -ExecutionPolicy Bypass -File $wrapperInstaller -WorkspaceRoot $workspaceResolved
    if ($LASTEXITCODE -ne 0) {
        throw "Workspace wrapper installation failed with exit code $LASTEXITCODE"
    }

    $profileScript = Join-Path $corePath "scripts\sync_cvf_workspace_public_profile.ps1"
    & powershell -ExecutionPolicy Bypass -File $profileScript -WorkspaceRoot $workspaceResolved -ProfileName $ProfileName
    if ($LASTEXITCODE -ne 0) {
        throw "Workspace profile installation failed with exit code $LASTEXITCODE"
    }

    $receipt = [ordered]@{
        schemaVersion = "1.0"
        distributionVersion = $manifest.distributionVersion
        publicRemote = $publicRemote
        publicCoreCommit = (git -C $corePath rev-parse HEAD).Trim()
        profileName = $ProfileName
        installedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    }
    $receipt | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $workspaceResolved "CVF_WORKSPACE_INSTALL_RECEIPT.json") -Encoding utf8
}
catch {
    if (Test-Path -LiteralPath $corePath -PathType Container) {
        Remove-Item -LiteralPath $corePath -Recurse -Force
    }
    throw
}

Write-Host "[OK] CVF Workspace $($manifest.distributionVersion) installed with profile '$ProfileName'." -ForegroundColor Green
