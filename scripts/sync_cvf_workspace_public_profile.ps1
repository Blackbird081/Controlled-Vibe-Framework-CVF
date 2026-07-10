param(
    [Parameter(Mandatory = $true)]
    [string]$WorkspaceRoot,

    [ValidateSet("public-free", "paid-user-safe")]
    [string]$ProfileName = "public-free",

    [string]$CorePath = ""
)

$ErrorActionPreference = "Stop"
$expectedRemote = "https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git"
$denyTokens = @(
    ("CVF_" + "SESSION"),
    ("provenance" + "-local"),
    ("Get-CVF-Workspace-" + "OverlayProfiles"),
    ("Update-CVF-Workspace-" + "Overlay")
)

function Assert-ChildPath([string]$Child, [string]$Parent, [string]$Label) {
    $childFull = [System.IO.Path]::GetFullPath($Child)
    $parentFull = [System.IO.Path]::GetFullPath($Parent).TrimEnd("\") + "\"
    if (-not $childFull.StartsWith($parentFull, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "$Label resolved outside allowed root: $childFull"
    }
    return $childFull
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw "git is required but was not found in PATH."
}

$workspaceResolved = [System.IO.Path]::GetFullPath($WorkspaceRoot)
if (-not (Test-Path -LiteralPath $workspaceResolved -PathType Container)) {
    throw "Workspace root not found: $workspaceResolved"
}

if ([string]::IsNullOrWhiteSpace($CorePath)) {
    $CorePath = Join-Path $workspaceResolved ".Controlled-Vibe-Framework-CVF"
}
$coreResolved = [System.IO.Path]::GetFullPath($CorePath)
if (-not (Test-Path -LiteralPath $coreResolved -PathType Container)) {
    throw "CVF public core not found: $coreResolved"
}

$remote = (git -C $coreResolved remote get-url origin).Trim()
if ($remote -ne $expectedRemote) {
    throw "Unexpected CVF public core remote: $remote"
}

$manifestPath = Join-Path $coreResolved "docs\reference\workspace_distribution\CVF_WORKSPACE_DISTRIBUTION_MANIFEST.json"
if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) {
    throw "Distribution manifest not found: $manifestPath"
}
$manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding utf8 | ConvertFrom-Json
if (@($manifest.supportedProfiles) -notcontains $ProfileName) {
    throw "Profile is not supported by this public distribution: $ProfileName"
}

$profileEntries = @($manifest.profiles.$ProfileName)
if ($profileEntries.Count -eq 0) {
    throw "Profile has no artifacts: $ProfileName"
}

$packRoot = Assert-ChildPath -Child (Join-Path $workspaceResolved "CVF_RULE_PACKS\$ProfileName") -Parent $workspaceResolved -Label "Profile output"
$sourceRoot = Join-Path $packRoot "source"
if (Test-Path -LiteralPath $packRoot) {
    Remove-Item -LiteralPath $packRoot -Recurse -Force
}
New-Item -ItemType Directory -Path $sourceRoot -Force | Out-Null

$copied = @()
foreach ($relativePath in $profileEntries) {
    $sourcePath = Assert-ChildPath -Child (Join-Path $coreResolved $relativePath) -Parent $coreResolved -Label "Profile source"
    if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
        throw "Profile source not found: $relativePath"
    }
    $content = Get-Content -LiteralPath $sourcePath -Raw -Encoding utf8
    foreach ($token in $denyTokens) {
        if ($content.IndexOf($token, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) {
            throw "Protected token '$token' found in public profile source: $relativePath"
        }
    }
    $targetPath = Assert-ChildPath -Child (Join-Path $sourceRoot $relativePath) -Parent $packRoot -Label "Profile target"
    New-Item -ItemType Directory -Path (Split-Path -Parent $targetPath) -Force | Out-Null
    Copy-Item -LiteralPath $sourcePath -Destination $targetPath -Force
    $copied += [ordered]@{
        sourcePath = $relativePath
        sha256 = (Get-FileHash -LiteralPath $targetPath -Algorithm SHA256).Hash.ToLowerInvariant()
    }
}

$rootFiles = @()
foreach ($template in @($manifest.rootTemplates)) {
    $templateSource = Assert-ChildPath -Child (Join-Path $coreResolved $template.sourcePath) -Parent $coreResolved -Label "Root template source"
    $rootTarget = Assert-ChildPath -Child (Join-Path $workspaceResolved $template.targetPath) -Parent $workspaceResolved -Label "Root template target"
    $disposition = "PRESERVED_EXISTING"
    if (-not (Test-Path -LiteralPath $rootTarget -PathType Leaf)) {
        Copy-Item -LiteralPath $templateSource -Destination $rootTarget
        $disposition = "CREATED"
    }
    $rootFiles += [ordered]@{ targetPath = $template.targetPath; disposition = $disposition }
}

$coreCommit = (git -C $coreResolved rev-parse HEAD).Trim()
$packManifest = [ordered]@{
    schemaVersion = "1.0"
    distributionVersion = $manifest.distributionVersion
    profileName = $ProfileName
    sourceRepository = "Controlled-Vibe-Framework-CVF"
    sourceCommit = $coreCommit
    artifactCount = $copied.Count
    artifacts = $copied
    workspaceRootFiles = $rootFiles
}
$packManifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $packRoot "RULE_PACK_MANIFEST.json") -Encoding utf8

$active = [ordered]@{
    schemaVersion = "1.0"
    distributionVersion = $manifest.distributionVersion
    activeProfile = $ProfileName
    sourceCommit = $coreCommit
    artifactCount = $copied.Count
}
$active | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $workspaceResolved "CVF_RULE_PACKS\ACTIVE_RULE_PACK.json") -Encoding utf8

Write-Host "[OK] Public profile '$ProfileName' applied with $($copied.Count) artifacts." -ForegroundColor Green
