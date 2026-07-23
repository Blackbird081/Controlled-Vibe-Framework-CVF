# CVF Golden Downstream Bootstrap Harness Support
#
# Core-side only test infrastructure, extracted from
# test_cvf_golden_downstream_bootstrap.ps1 to keep that entrypoint below the
# 600-line project guard. Dot-sourced by the harness, so `$script:` scoped
# references (e.g. $script:tempRoots) resolve in the harness's own scope.

function Test-CvfSafeCleanupTarget {
    # BSL-R6: a deletion target is safe only if it resolves under the OS temp
    # directory AND either equals/nests under a root this run actually
    # created (tracked in $script:tempRoots) or its own leaf name carries the
    # harness-owned "cvf-golden-" prefix. Never true for the temp root
    # itself, and never true for anything outside temp.
    param([string]$Path)
    if ([string]::IsNullOrWhiteSpace($Path)) { return $false }
    $resolved = [System.IO.Path]::GetFullPath($Path).TrimEnd('\')
    $tempRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath()).TrimEnd('\')
    if ($resolved.Length -le $tempRoot.Length) { return $false }
    if (-not $resolved.StartsWith($tempRoot + '\', [System.StringComparison]::OrdinalIgnoreCase)) { return $false }
    foreach ($root in $script:tempRoots) {
        $rootResolved = [System.IO.Path]::GetFullPath($root).TrimEnd('\')
        if ($resolved -eq $rootResolved -or $resolved.StartsWith($rootResolved + '\', [System.StringComparison]::OrdinalIgnoreCase)) { return $true }
    }
    $leaf = Split-Path -Leaf $resolved
    if ($leaf -like 'cvf-golden-*') { return $true }
    return $false
}

function Remove-CvfHermeticDirectory {
    param([Parameter(Mandatory = $true)][string]$Path)
    if (-not (Test-CvfSafeCleanupTarget $Path)) {
        throw "REFUSING_UNSAFE_CLEANUP_TARGET: $Path is not a tracked hermetic temp directory."
    }
    if (-not (Test-Path -LiteralPath $Path)) { return $true }
    for ($attempt = 1; $attempt -le 5; $attempt++) {
        Remove-Item -LiteralPath $Path -Recurse -Force -ErrorAction SilentlyContinue
        if (-not (Test-Path -LiteralPath $Path)) { return $true }
        Start-Sleep -Milliseconds 500
    }
    if (Test-Path -LiteralPath $Path) {
        # The full core clone includes governance/compat files with very long
        # names; combined with a deep %TEMP% path this exceeds Win32
        # MAX_PATH, which makes Remove-Item's normal delete silently leave
        # files behind. `cmd /c rd /s /q "\\?\<path>"` opts into the Win32
        # long-path form and reliably removes these trees.
        cmd /c rd /s /q "\\?\$Path" 2>&1 | Out-Null
    }
    return -not (Test-Path -LiteralPath $Path)
}

function Resolve-CvfPublicBaseRepoPath {
    param([Parameter(Mandatory = $true)][string]$SourceRepoPath)

    $publicInstaller = Join-Path $SourceRepoPath "scripts\install_cvf_workspace_root_wrappers.ps1"
    $publicHandoff = Join-Path $SourceRepoPath "AGENT_HANDOFF.md"
    if ((Test-Path -LiteralPath $publicInstaller -PathType Leaf) -and
        (Test-Path -LiteralPath $publicHandoff -PathType Leaf)) {
        return $SourceRepoPath
    }

    # In the private provenance checkout, public-only mapped filenames are
    # intentionally absent. Use the sibling public-sync clone as the clean
    # public-main anchor, then overlay the provenance candidate below.
    $siblingPublicSync = "$SourceRepoPath-public-sync"
    $siblingInstaller = Join-Path $siblingPublicSync "scripts\install_cvf_workspace_root_wrappers.ps1"
    $siblingHandoff = Join-Path $siblingPublicSync "AGENT_HANDOFF.md"
    if ((Test-Path -LiteralPath (Join-Path $siblingPublicSync ".git")) -and
        (Test-Path -LiteralPath $siblingInstaller -PathType Leaf) -and
        (Test-Path -LiteralPath $siblingHandoff -PathType Leaf)) {
        return $siblingPublicSync
    }

    throw "PUBLIC_SYNC_BASE_NOT_FOUND: run this public-surface harness from the public clone or beside a synchronized '<provenance>-public-sync' clone."
}

function New-CvfCleanPublicMainClone {
    # Anchors HEAD at the same commit as (local) main / real origin/main, no
    # overlay. Used where a downstream flow (e.g. the fresh-clone
    # initializer) requires a clean core and validates the pinned commit is
    # reachable from the real public remote - a synthetic unmerged commit
    # could never satisfy that honestly.
    param([Parameter(Mandatory = $true)][string]$SourceRepoPath, [Parameter(Mandatory = $true)][string]$DestCorePath)

    $publicBaseRepoPath = Resolve-CvfPublicBaseRepoPath -SourceRepoPath $SourceRepoPath
    git -c core.longpaths=true clone --quiet --single-branch --branch main $publicBaseRepoPath $DestCorePath 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Local hermetic core clone failed from $publicBaseRepoPath" }
    git -C $DestCorePath config core.longpaths true
    git -C $DestCorePath remote set-url origin "https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git"
}

function New-CvfHermeticCoreClone {
    # Same anchor as New-CvfCleanPublicMainClone, but with this tranche's
    # ceiling files overlaid as UNCOMMITTED working-tree changes (not a new
    # commit). Leaving HEAD untouched keeps it identical to real
    # origin/main, so the doctor's freshness/pin-reachability checks pass
    # honestly; the dirty worktree only produces the doctor's existing
    # bounded "pending public-core overlay" warning, which accurately
    # describes an unmerged tranche sitting in the core checkout.
    param([Parameter(Mandatory = $true)][string]$SourceRepoPath, [Parameter(Mandatory = $true)][string]$DestCorePath)

    New-CvfCleanPublicMainClone -SourceRepoPath $SourceRepoPath -DestCorePath $DestCorePath

    $overlayRelativePaths = @(
        "scripts\new-cvf-workspace.ps1",
        "scripts\check_cvf_workspace_agent_enforcement.ps1",
        "scripts\initialize_cvf_project_clone.ps1",
        "scripts\update_cvf_workspace_public_core.ps1",
        "scripts\lib\downstream_catalog",
        "governance\toolkit\05_OPERATION\downstream_catalog",
        "docs\GET_STARTED.md",
        "docs\reference\CVF_WORKSPACE_RULES.md"
    )
    foreach ($rel in $overlayRelativePaths) {
        $src = Join-Path $SourceRepoPath $rel
        $dst = Join-Path $DestCorePath $rel
        if (-not (Test-Path -LiteralPath $src)) { continue }
        if (Test-Path -LiteralPath $src -PathType Container) {
            New-Item -ItemType Directory -Path $dst -Force | Out-Null
            Copy-Item -LiteralPath $src -Destination (Split-Path -Parent $dst) -Recurse -Force
        }
        else {
            $dstParent = Split-Path -Parent $dst
            New-Item -ItemType Directory -Path $dstParent -Force | Out-Null
            Copy-Item -LiteralPath $src -Destination $dst -Force
        }
    }

    # Reproduce the canonical public-sync mapped exports when the source is
    # the private provenance checkout. The public clone already has these
    # destination names, but copying again is harmless and deterministic.
    $mappedExports = @(
        @{
            Source = "governance\toolkit\05_OPERATION\CVF_PUBLIC_CORE_CONTINUATION.md"
            Destination = "AGENT_HANDOFF.md"
        },
        @{
            Source = "scripts\install_cvf_workspace_root_wrappers_public.ps1"
            Destination = "scripts\install_cvf_workspace_root_wrappers.ps1"
        }
    )
    foreach ($mapping in $mappedExports) {
        $src = Join-Path $SourceRepoPath $mapping.Source
        if (-not (Test-Path -LiteralPath $src -PathType Leaf)) { continue }
        $dst = Join-Path $DestCorePath $mapping.Destination
        New-Item -ItemType Directory -Path (Split-Path -Parent $dst) -Force | Out-Null
        Copy-Item -LiteralPath $src -Destination $dst -Force
    }
}

# Native stderr text (git progress lines, nested script errors) becomes an
# ErrorRecord when merged via 2>&1; under EAP=Stop that throws immediately
# even though the caller only wants the exit code and text. Each wrapper
# below relaxes EAP for the duration of its own native call only.

function Invoke-CvfDoctor([string]$ProjectPath, [string]$CoreDoctorPath) {
    $previousEap = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        $output = powershell -ExecutionPolicy Bypass -File $CoreDoctorPath -ProjectPath $ProjectPath -AllowOfflinePinnedCore 2>&1 | Out-String
        return [PSCustomObject]@{ ExitCode = $LASTEXITCODE; Output = $output }
    }
    finally { $ErrorActionPreference = $previousEap }
}

function Invoke-CvfCatalogManager([string]$ManagerPath, [switch]$Write) {
    $previousEap = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        if ($Write) { $output = powershell -ExecutionPolicy Bypass -File $ManagerPath -Write 2>&1 | Out-String }
        else { $output = powershell -ExecutionPolicy Bypass -File $ManagerPath -Check 2>&1 | Out-String }
        return [PSCustomObject]@{ ExitCode = $LASTEXITCODE; Output = $output }
    }
    finally { $ErrorActionPreference = $previousEap }
}

function Invoke-CvfBootstrap([string]$WorkspaceRoot, [string]$ProjectName, [string]$BootstrapScriptPath) {
    $previousEap = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        $output = powershell -ExecutionPolicy Bypass -File $BootstrapScriptPath -WorkspaceRoot $WorkspaceRoot -ProjectName $ProjectName 2>&1 | Out-String
        return [PSCustomObject]@{ ExitCode = $LASTEXITCODE; Output = $output }
    }
    finally { $ErrorActionPreference = $previousEap }
}

function Invoke-CvfFreshCloneInit([string]$InitializerPath, [string]$ProjectPath) {
    $previousEap = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        $output = powershell -ExecutionPolicy Bypass -File $InitializerPath -ProjectPath $ProjectPath 2>&1 | Out-String
        return [PSCustomObject]@{ ExitCode = $LASTEXITCODE; Output = $output }
    }
    finally { $ErrorActionPreference = $previousEap }
}

function Copy-DisposableProject {
    # Copies land as a sibling of the source project's own workspace (not an
    # unrelated standalone temp folder) so the copy's .cvf/manifest.json
    # relative core/workspace-rules paths keep resolving; otherwise every
    # doctor run on a disposable copy would spuriously fail on core
    # reachability, unrelated to whatever defect the copy is meant to test.
    param([Parameter(Mandatory = $true)][string]$SourceProjectPath, [Parameter(Mandatory = $true)][string]$WorkspaceRoot, [Parameter(Mandatory = $true)][string]$Label)
    $dest = Join-Path $WorkspaceRoot $Label
    if (Test-Path -LiteralPath $dest) { Remove-CvfHermeticDirectory -Path $dest | Out-Null }
    New-Item -ItemType Directory -Path $dest -Force | Out-Null
    Copy-Item -Path "$SourceProjectPath\*" -Destination $dest -Recurse -Force
    return $dest
}

function New-CvfValidModuleFixture {
    param([string]$Id = "m1", [string]$Status = "STUB")
    return [ordered]@{
        id = $Id; name = "M1"; path = "docs/INDEX.md"; status = $Status
        description = "fixture module"; evidence = "scripts/test_cvf_golden_downstream_bootstrap.ps1 fixture"
        controls = @(); dependencies = @()
    }
}
