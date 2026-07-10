param(
    [Parameter(Mandatory = $true)]
    [string]$OutputPath
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$outputResolved = [System.IO.Path]::GetFullPath($OutputPath)
$manifestRelative = "docs\reference\workspace_distribution\CVF_WORKSPACE_DISTRIBUTION_MANIFEST.json"
$files = @(
    "docs\reference\workspace_distribution\README.md",
    $manifestRelative,
    "scripts\install_cvf_workspace.ps1"
)

if (Test-Path -LiteralPath $outputResolved) {
    Remove-Item -LiteralPath $outputResolved -Recurse -Force
}
New-Item -ItemType Directory -Path $outputResolved -Force | Out-Null

$packageFiles = @()
foreach ($relativePath in $files) {
    $source = [System.IO.Path]::GetFullPath((Join-Path $repoRoot $relativePath))
    $target = [System.IO.Path]::GetFullPath((Join-Path $outputResolved $relativePath))
    $outputPrefix = $outputResolved.TrimEnd("\") + "\"
    if (-not $target.StartsWith($outputPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Package target resolved outside output root: $target"
    }
    New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force | Out-Null
    Copy-Item -LiteralPath $source -Destination $target
    $packageFiles += [ordered]@{
        path = $relativePath.Replace("\", "/")
        sha256 = (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash.ToLowerInvariant()
    }
}

$distributionManifest = Get-Content -LiteralPath (Join-Path $repoRoot $manifestRelative) -Raw -Encoding utf8 | ConvertFrom-Json
$package = [ordered]@{
    schemaVersion = "1.0"
    distributionVersion = $distributionManifest.distributionVersion
    files = $packageFiles
}
$package | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $outputResolved "CVF_WORKSPACE_DISTRIBUTION_PACKAGE.json") -Encoding utf8
Write-Host "[OK] Distribution package built: $outputResolved" -ForegroundColor Green
