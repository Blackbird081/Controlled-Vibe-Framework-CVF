param(
    [Parameter(Mandatory = $true)]
    [string]$WorkspaceRoot,

    [switch]$CheckRemote,

    [switch]$Json
)

$ErrorActionPreference = "Stop"
$expectedRemote = "https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git"
$issues = [System.Collections.Generic.List[object]]::new()
$severity = 0

function Add-Issue([string]$Code, [string]$Message, [int]$Level) {
    $script:issues.Add([ordered]@{ code = $Code; message = $Message })
    if ($Level -gt $script:severity) {
        $script:severity = $Level
    }
}

function Test-ChildPath([string]$Child, [string]$Parent) {
    $childFull = [System.IO.Path]::GetFullPath($Child)
    $parentFull = [System.IO.Path]::GetFullPath($Parent).TrimEnd("\") + "\"
    return $childFull.StartsWith($parentFull, [System.StringComparison]::OrdinalIgnoreCase)
}

$workspaceResolved = [System.IO.Path]::GetFullPath($WorkspaceRoot)
$corePath = Join-Path $workspaceResolved ".Controlled-Vibe-Framework-CVF"
$manifestPath = Join-Path $corePath "docs\reference\workspace_distribution\CVF_WORKSPACE_DISTRIBUTION_MANIFEST.json"
$activePath = Join-Path $workspaceResolved "CVF_RULE_PACKS\ACTIVE_RULE_PACK.json"
$receiptPath = Join-Path $workspaceResolved "CVF_WORKSPACE_INSTALL_RECEIPT.json"
$manifest = $null
$active = $null
$localCommit = $null
$remoteCommit = $null
$activeProfile = $null
$distributionVersion = $null
$checkMode = "LOCAL_ONLY"

if (-not (Test-Path -LiteralPath $workspaceResolved -PathType Container)) {
    Add-Issue "WORKSPACE_MISSING" "Workspace root does not exist." 3
}
elseif (-not (Test-Path -LiteralPath $corePath -PathType Container)) {
    Add-Issue "CORE_MISSING" "Hidden public core is missing." 3
}
elseif (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Add-Issue "GIT_MISSING" "git is not available in PATH." 3
}
else {
    $previousOptionalLocks = $env:GIT_OPTIONAL_LOCKS
    $env:GIT_OPTIONAL_LOCKS = "0"
    try {
        $remote = (git -C $corePath remote get-url origin 2>$null).Trim()
        if ($LASTEXITCODE -ne 0 -or $remote -ne $expectedRemote) {
            Add-Issue "REMOTE_MISMATCH" "Hidden core does not use the approved public remote." 3
        }

        $localCommit = (git -C $corePath rev-parse HEAD 2>$null).Trim()
        if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($localCommit)) {
            Add-Issue "CORE_HEAD_INVALID" "Hidden core HEAD could not be resolved." 3
            $localCommit = $null
        }

        $pending = @(git -C $corePath status --porcelain --untracked-files=no 2>$null)
        if ($LASTEXITCODE -ne 0) {
            Add-Issue "CORE_STATUS_FAILED" "Hidden core status could not be read." 3
        }
        elseif ($pending.Count -gt 0) {
            Add-Issue "CORE_DIRTY" "Hidden core has tracked changes." 2
        }

        if (Test-Path -LiteralPath $manifestPath -PathType Leaf) {
            try {
                $manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding utf8 | ConvertFrom-Json
                $distributionVersion = $manifest.distributionVersion
            }
            catch {
                Add-Issue "DISTRIBUTION_MANIFEST_INVALID" "Distribution manifest is invalid JSON." 3
            }
        }
        else {
            Add-Issue "DISTRIBUTION_MANIFEST_MISSING" "Distribution manifest is missing." 3
        }

        if (-not (Test-Path -LiteralPath $receiptPath -PathType Leaf)) {
            Add-Issue "INSTALL_RECEIPT_MISSING" "Workspace install receipt is missing." 3
        }
        else {
            try {
                [void](Get-Content -LiteralPath $receiptPath -Raw -Encoding utf8 | ConvertFrom-Json)
            }
            catch {
                Add-Issue "INSTALL_RECEIPT_INVALID" "Workspace install receipt is invalid JSON." 3
            }
        }

        if (-not (Test-Path -LiteralPath $activePath -PathType Leaf)) {
            Add-Issue "ACTIVE_PROFILE_MISSING" "Active public profile record is missing." 3
        }
        else {
            try {
                $active = Get-Content -LiteralPath $activePath -Raw -Encoding utf8 | ConvertFrom-Json
                $activeProfile = $active.activeProfile
            }
            catch {
                Add-Issue "ACTIVE_PROFILE_INVALID" "Active public profile record is invalid JSON." 3
            }
        }

        if ($null -ne $manifest) {
            foreach ($required in @($manifest.requiredCoreFiles)) {
                if (-not (Test-Path -LiteralPath (Join-Path $corePath $required) -PathType Leaf)) {
                    Add-Issue "CORE_FILE_MISSING" "Required core file is missing: $required" 3
                }
            }
            $requiredRootFiles = @()
            if ($null -ne $manifest.PSObject.Properties["requiredWorkspaceRootFiles"]) {
                $requiredRootFiles = @($manifest.requiredWorkspaceRootFiles)
            }
            foreach ($requiredRoot in $requiredRootFiles) {
                if (-not (Test-Path -LiteralPath (Join-Path $workspaceResolved $requiredRoot) -PathType Leaf)) {
                    Add-Issue "ROOT_ARTIFACT_MISSING" "Required workspace artifact is missing: $requiredRoot" 3
                }
            }
        }

        if ($null -ne $active -and $null -ne $manifest) {
            if (@($manifest.supportedProfiles) -notcontains $activeProfile) {
                Add-Issue "PROFILE_UNSUPPORTED" "Active profile is not supported by this distribution." 3
            }
            if ($active.distributionVersion -ne $manifest.distributionVersion) {
                Add-Issue "PROFILE_VERSION_DRIFT" "Active profile uses a different distribution version." 2
            }
            if ($null -ne $localCommit -and $active.sourceCommit -ne $localCommit) {
                Add-Issue "PROFILE_SOURCE_DRIFT" "Active profile was not materialized from the current core HEAD." 2
            }

            $packRoot = Join-Path $workspaceResolved "CVF_RULE_PACKS\$activeProfile"
            $packManifestPath = Join-Path $packRoot "RULE_PACK_MANIFEST.json"
            if (-not (Test-Path -LiteralPath $packManifestPath -PathType Leaf)) {
                Add-Issue "PROFILE_MANIFEST_MISSING" "Active profile manifest is missing." 3
            }
            else {
                try {
                    $pack = Get-Content -LiteralPath $packManifestPath -Raw -Encoding utf8 | ConvertFrom-Json
                    $sourceRoot = Join-Path $packRoot "source"
                    foreach ($artifact in @($pack.artifacts)) {
                        $artifactPath = Join-Path $sourceRoot $artifact.sourcePath
                        if (-not (Test-ChildPath -Child $artifactPath -Parent $sourceRoot)) {
                            Add-Issue "PROFILE_PATH_INVALID" "Profile artifact path escapes its source root." 3
                        }
                        elseif (-not (Test-Path -LiteralPath $artifactPath -PathType Leaf)) {
                            Add-Issue "PROFILE_ARTIFACT_MISSING" "Profile artifact is missing: $($artifact.sourcePath)" 3
                        }
                        else {
                            $actualHash = (Get-FileHash -LiteralPath $artifactPath -Algorithm SHA256).Hash.ToLowerInvariant()
                            if ($actualHash -ne $artifact.sha256) {
                                Add-Issue "PROFILE_ARTIFACT_DRIFT" "Profile artifact hash differs: $($artifact.sourcePath)" 2
                            }
                        }
                    }
                }
                catch {
                    Add-Issue "PROFILE_MANIFEST_INVALID" "Active profile manifest is invalid." 3
                }
            }
        }

        if ($CheckRemote -and $severity -lt 3) {
            $checkMode = "REMOTE_AWARE"
            $remoteLine = @(git ls-remote $expectedRemote refs/heads/main 2>$null) | Select-Object -First 1
            if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($remoteLine)) {
                Add-Issue "REMOTE_CHECK_FAILED" "Public main revision could not be read." 3
            }
            else {
                $remoteCommit = ($remoteLine -split "\s+")[0]
                if ($null -ne $localCommit -and $remoteCommit -ne $localCommit) {
                    Add-Issue "PUBLIC_UPDATE_AVAILABLE" "A different public main revision is available." 1
                }
            }
        }
    }
    finally {
        $env:GIT_OPTIONAL_LOCKS = $previousOptionalLocks
    }
}

$verdict = "CURRENT"
if ($severity -ge 3) {
    $verdict = "REPAIR_REQUIRED"
}
elseif ($severity -eq 2) {
    $verdict = "DRIFTED"
}
elseif ($severity -eq 1) {
    $verdict = "UPDATE_AVAILABLE"
}

$result = [ordered]@{
    schemaVersion = "1.0"
    distributionVersion = $distributionVersion
    healthVerdict = $verdict
    checkMode = $checkMode
    workspaceRoot = $workspaceResolved
    activeProfile = $activeProfile
    localCommit = $localCommit
    remoteCommit = $remoteCommit
    issues = @($issues)
}

if ($Json) {
    $result | ConvertTo-Json -Depth 8
}
else {
    Write-Host "CVF Workspace: $verdict"
    Write-Host "  Profile: $activeProfile"
    Write-Host "  Core:    $localCommit"
    foreach ($issue in $issues) {
        Write-Host "  [$($issue.code)] $($issue.message)"
    }
}
