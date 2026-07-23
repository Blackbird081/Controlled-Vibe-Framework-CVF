# CVF Golden Downstream Bootstrap Harness (tranche CVF-BSL-T1, repair round
# for independent review findings BSL-R1 through BSL-R7)
#
# Hermetic, disposable test of the governed downstream catalog kit:
# bootstraps a throwaway project twice (idempotency), validates the catalog
# manager and workspace doctor against the clean state, exercises negative
# drift/violation/closed-schema cases on disposable copies, proves legacy
# project content is never overwritten, distinguishes true-legacy from
# damaged-governed doctor behavior, and validates fresh-clone local-binding
# portability and public-kit completeness. Uses only local git clones of
# this checkout (no provider call, no dependency install, no change to any
# non-disposable repository). Exits non-zero on any failed assertion,
# including leftover temp residue, and always removes its temporary
# directories through a path-safety guard.

$ErrorActionPreference = "Stop"

$script:results = [System.Collections.Generic.List[object]]::new()
$script:tempRoots = [System.Collections.Generic.List[string]]::new()

function Add-Result {
    param([string]$Ac, [string]$Name, [bool]$Pass, [string]$Detail = "")
    $script:results.Add([PSCustomObject]@{ Ac = $Ac; Name = $Name; Pass = $Pass; Detail = $Detail })
    $symbol = if ($Pass) { "PASS" } else { "FAIL" }
    $color = if ($Pass) { "Green" } else { "Red" }
    Write-Host ("[{0}] {1} : {2}" -f $symbol, $Ac, $Name) -ForegroundColor $color
    if (-not $Pass -and $Detail) { Write-Host "        -> $Detail" -ForegroundColor Yellow }
}

function New-TempDirectory([string]$Prefix) {
    $dir = Join-Path ([System.IO.Path]::GetTempPath()) "$Prefix-$([Guid]::NewGuid().ToString('N').Substring(0,10))"
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
    $script:tempRoots.Add($dir)
    return $dir
}

. (Join-Path $PSScriptRoot "lib\downstream_catalog\CvfGoldenHarnessSupport.ps1")
. (Join-Path $PSScriptRoot "lib\downstream_catalog\CvfDownstreamCatalogLib.ps1")

# ------------------------------------------------------------------
# Setup
# ------------------------------------------------------------------

$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$bootstrapScript = Join-Path $repoRoot "scripts\new-cvf-workspace.ps1"
$projectName = "GoldenDownstreamProbe"

try {
    $workspaceA = New-TempDirectory "cvf-golden-workspace-a"
    $coreA = Join-Path $workspaceA ".Controlled-Vibe-Framework-CVF"
    New-CvfHermeticCoreClone -SourceRepoPath $repoRoot -DestCorePath $coreA
    $projectA = Join-Path $workspaceA $projectName
    New-Item -ItemType Directory -Path $projectA -Force | Out-Null
    git -C $projectA init --quiet
    git -C $projectA -c user.email="downstream@local" -c user.name="Downstream Probe" commit --quiet --allow-empty -m "empty downstream repository" | Out-Null

    $firstBootstrap = Invoke-CvfBootstrap -WorkspaceRoot $workspaceA -ProjectName $projectName -BootstrapScriptPath $bootstrapScript
    if ($firstBootstrap.ExitCode -ne 0) { throw "First bootstrap run failed with exit $($firstBootstrap.ExitCode): $($firstBootstrap.Output)" }

    $doctorPathA = Join-Path $coreA "scripts\check_cvf_workspace_agent_enforcement.ps1"
    $managerPathA = Join-Path $projectA "scripts\manage_cvf_downstream_catalog.ps1"

    # AC-01: required surfaces exist
    $requiredSurfaces = @(
        ".cvf\manifest.json", ".cvf\policy.json", "AGENTS.md",
        "CVF_SESSION_MEMORY.md", "CVF_SESSION\ACTIVE_SESSION_STATE.json",
        "IMPLEMENTATION_STATUS.json",
        "docs\catalog\ARTIFACT_REGISTRY.json", "docs\catalog\MODULE_REGISTRY.json",
        "docs\catalog\schemas\ARTIFACT_REGISTRY.schema.json", "docs\catalog\schemas\MODULE_REGISTRY.schema.json",
        "docs\INDEX.md", "docs\catalog\MODULE_CATALOG.md",
        "scripts\manage_cvf_downstream_catalog.ps1", "scripts\lib\downstream_catalog\CvfDownstreamCatalogLib.ps1"
    )
    $missingSurfaces = @($requiredSurfaces | Where-Object { -not (Test-Path -LiteralPath (Join-Path $projectA $_)) })
    Add-Result "AC-01" "All required generated surfaces exist" ($missingSurfaces.Count -eq 0) ("Missing: " + ($missingSurfaces -join ", "))
    $bootstrapLogExists = @(Get-ChildItem -Path (Join-Path $projectA "docs") -Filter "CVF_BOOTSTRAP_LOG_*.md" -ErrorAction SilentlyContinue).Count -gt 0
    Add-Result "AC-01" "Bootstrap log exists" $bootstrapLogExists

    # AC-02: active state
    $activeState = Get-Content -LiteralPath (Join-Path $projectA "CVF_SESSION\ACTIVE_SESSION_STATE.json") -Raw | ConvertFrom-Json
    $implStatus = Get-Content -LiteralPath (Join-Path $projectA "IMPLEMENTATION_STATUS.json") -Raw | ConvertFrom-Json
    $ac02 = ($activeState.currentMode -eq "INTAKE") -and ($activeState.activeRole -eq "ORCHESTRATOR") -and
            (@($implStatus.activeWorkOrders).Count -eq 0) -and (@($implStatus.completedCapabilities).Count -eq 0)
    Add-Result "AC-02" "Active state is INTAKE/ORCHESTRATOR; no fabricated work order/capability" $ac02

    # AC-03: Artifact Registry check + baseline coverage
    $checkResult = Invoke-CvfCatalogManager -ManagerPath $managerPathA
    Add-Result "AC-03" "Catalog manager --check passes on pristine project" ($checkResult.ExitCode -eq 0) $checkResult.Output
    $artifactRegistry = Get-Content -LiteralPath (Join-Path $projectA "docs\catalog\ARTIFACT_REGISTRY.json") -Raw | ConvertFrom-Json
    $ids = @($artifactRegistry.artifacts | ForEach-Object { $_.id })
    Add-Result "AC-03" "Artifact Registry has 17 unique mandatory entries" (($ids.Count -eq 17) -and (($ids | Select-Object -Unique).Count -eq 17)) "count=$($ids.Count)"

    # AC-03 / BSL-R3: manifest carries the governed-catalog marker
    $manifestA = Get-Content -LiteralPath (Join-Path $projectA ".cvf\manifest.json") -Raw | ConvertFrom-Json
    Add-Result "BSL-R3" "Freshly bootstrapped manifest carries catalogKitVersion marker and expanded requiredDocs" `
        (($manifestA.PSObject.Properties.Name -contains "catalogKitVersion") -and
         ($manifestA.requiredDocs -contains "docs/catalog/ARTIFACT_REGISTRY.json") -and
         ($manifestA.requiredDocs -contains "scripts/manage_cvf_downstream_catalog.ps1"))

    # AC-04: empty Module Registry, zero metrics, no runtime claim
    $moduleRegistry = Get-Content -LiteralPath (Join-Path $projectA "docs\catalog\MODULE_REGISTRY.json") -Raw | ConvertFrom-Json
    $moduleCatalogText = Get-Content -LiteralPath (Join-Path $projectA "docs\catalog\MODULE_CATALOG.md") -Raw
    $ac04 = (@($moduleRegistry.modules).Count -eq 0) -and ($moduleCatalogText -match "Total modules: 0") -and ($moduleCatalogText -match "Do not infer runtime")
    Add-Result "AC-04" "Module Registry empty; Module Catalog makes no runtime claim" $ac04

    # AC-05: byte-stable regeneration
    $indexBefore = Get-Content -LiteralPath (Join-Path $projectA "docs\INDEX.md") -Raw
    $catalogBefore = Get-Content -LiteralPath (Join-Path $projectA "docs\catalog\MODULE_CATALOG.md") -Raw
    $writeResult = Invoke-CvfCatalogManager -ManagerPath $managerPathA -Write
    $indexAfter = Get-Content -LiteralPath (Join-Path $projectA "docs\INDEX.md") -Raw
    $catalogAfter = Get-Content -LiteralPath (Join-Path $projectA "docs\catalog\MODULE_CATALOG.md") -Raw
    Add-Result "AC-05" "Regenerated views are byte-stable" (($writeResult.ExitCode -eq 0) -and ($indexBefore -ceq $indexAfter) -and ($catalogBefore -ceq $catalogAfter))

    # AC-08 (clean): doctor passes pristine project
    $doctorClean = Invoke-CvfDoctor -ProjectPath $projectA -CoreDoctorPath $doctorPathA
    Add-Result "AC-08" "Doctor passes pristine generated project" ($doctorClean.ExitCode -eq 0) $doctorClean.Output

    # AC-06: idempotent second bootstrap - commit, rerun, expect no tracked diff
    git -C $projectA add -A | Out-Null
    git -C $projectA -c user.email="downstream@local" -c user.name="Downstream Probe" commit --quiet -m "first bootstrap" | Out-Null
    $secondBootstrap = Invoke-CvfBootstrap -WorkspaceRoot $workspaceA -ProjectName $projectName -BootstrapScriptPath $bootstrapScript
    $trackedDiff = (git -C $projectA status --porcelain | Out-String).Trim()
    Add-Result "AC-06" "Second bootstrap run is idempotent (no tracked diff)" (($secondBootstrap.ExitCode -eq 0) -and [string]::IsNullOrWhiteSpace($trackedDiff)) "exit=$($secondBootstrap.ExitCode) diff=$trackedDiff"

    # ------------------------------------------------------------------
    # AC-07 / AC-08 / BSL-R2 / BSL-R4: disposable copies with deliberate defects
    # ------------------------------------------------------------------
    function Test-NegativeCase {
        param([string]$Ac = "AC-07", [string]$Name, [scriptblock]$Mutate, [string]$ExpectSubstring, [switch]$AlsoDoctor)

        $copyPath = Copy-DisposableProject -SourceProjectPath $projectA -WorkspaceRoot $workspaceA -Label ($Name -replace '[^a-zA-Z0-9]', '')
        & $Mutate $copyPath
        $manager = Join-Path $copyPath "scripts\manage_cvf_downstream_catalog.ps1"
        $result = Invoke-CvfCatalogManager -ManagerPath $manager
        $pass = ($result.ExitCode -ne 0) -and ($result.Output -match [regex]::Escape($ExpectSubstring))
        Add-Result $Ac "Negative case rejected: $Name" $pass $result.Output
        if ($AlsoDoctor) {
            $doctorResult = Invoke-CvfDoctor -ProjectPath $copyPath -CoreDoctorPath $doctorPathA
            Add-Result "AC-08" "Doctor fails on drift: $Name" ($doctorResult.ExitCode -ne 0) $doctorResult.Output
        }
        Remove-CvfHermeticDirectory -Path $copyPath | Out-Null
    }

    Test-NegativeCase -Name "missing-registered-path" -ExpectSubstring "does not exist" -AlsoDoctor -Mutate {
        param($p)
        $f = Join-Path $p "docs\catalog\ARTIFACT_REGISTRY.json"
        $j = Get-Content -LiteralPath $f -Raw | ConvertFrom-Json
        $j.artifacts[0].path = "docs/catalog/schemas/DOES_NOT_EXIST.json"
        Set-Content -LiteralPath $f -Value ($j | ConvertTo-Json -Depth 6)
    }

    Test-NegativeCase -Name "duplicate-artifact-id" -ExpectSubstring "duplicate id" -Mutate {
        param($p)
        $f = Join-Path $p "docs\catalog\ARTIFACT_REGISTRY.json"
        $j = Get-Content -LiteralPath $f -Raw | ConvertFrom-Json
        $j.artifacts[1].id = $j.artifacts[0].id
        Set-Content -LiteralPath $f -Value ($j | ConvertTo-Json -Depth 6)
    }

    Test-NegativeCase -Name "path-escape" -ExpectSubstring "path escape" -Mutate {
        param($p)
        $f = Join-Path $p "docs\catalog\ARTIFACT_REGISTRY.json"
        $j = Get-Content -LiteralPath $f -Raw | ConvertFrom-Json
        $j.artifacts[0].path = "../escape.json"
        Set-Content -LiteralPath $f -Value ($j | ConvertTo-Json -Depth 6)
    }

    Test-NegativeCase -Name "windows-separator" -ExpectSubstring "path escape" -Mutate {
        param($p)
        $f = Join-Path $p "docs\catalog\ARTIFACT_REGISTRY.json"
        $j = Get-Content -LiteralPath $f -Raw | ConvertFrom-Json
        $j.artifacts[0].path = "docs\catalog\schemas\ARTIFACT_REGISTRY.schema.json"
        Set-Content -LiteralPath $f -Value ($j | ConvertTo-Json -Depth 6)
    }

    Test-NegativeCase -Name "empty-required-field" -ExpectSubstring "must be non-empty" -Mutate {
        param($p)
        $f = Join-Path $p "docs\catalog\ARTIFACT_REGISTRY.json"
        $j = Get-Content -LiteralPath $f -Raw | ConvertFrom-Json
        $j.artifacts[0].description = ""
        Set-Content -LiteralPath $f -Value ($j | ConvertTo-Json -Depth 6)
    }

    Test-NegativeCase -Name "invalid-lifecycle-status" -ExpectSubstring "invalid lifecycle status" -Mutate {
        param($p)
        $f = Join-Path $p "docs\catalog\ARTIFACT_REGISTRY.json"
        $j = Get-Content -LiteralPath $f -Raw | ConvertFrom-Json
        $j.artifacts[0].status = "NOT_A_STATUS"
        Set-Content -LiteralPath $f -Value ($j | ConvertTo-Json -Depth 6)
    }

    Test-NegativeCase -Name "missing-mandatory-baseline-entry" -ExpectSubstring "missing mandatory authority surface" -AlsoDoctor -Mutate {
        param($p)
        $f = Join-Path $p "docs\catalog\ARTIFACT_REGISTRY.json"
        $j = Get-Content -LiteralPath $f -Raw | ConvertFrom-Json
        $j.artifacts = @($j.artifacts | Where-Object { $_.id -ne "family-reviews" })
        Set-Content -LiteralPath $f -Value ($j | ConvertTo-Json -Depth 6)
    }

    Test-NegativeCase -Name "invalid-module-status" -ExpectSubstring "invalid status" -Mutate {
        param($p)
        $f = Join-Path $p "docs\catalog\MODULE_REGISTRY.json"
        $j = Get-Content -LiteralPath $f -Raw | ConvertFrom-Json
        $j.modules = @((New-CvfValidModuleFixture -Status "BOGUS"))
        Set-Content -LiteralPath $f -Value ($j | ConvertTo-Json -Depth 6)
    }

    Test-NegativeCase -Ac "BSL-R4" -Name "plan-only-module-status-rejected" -ExpectSubstring "PLANNED" -Mutate {
        param($p)
        $f = Join-Path $p "docs\catalog\MODULE_REGISTRY.json"
        $j = Get-Content -LiteralPath $f -Raw | ConvertFrom-Json
        $j.modules = @((New-CvfValidModuleFixture -Status "PLANNED"))
        Set-Content -LiteralPath $f -Value ($j | ConvertTo-Json -Depth 6)
    }

    Test-NegativeCase -Name "unknown-cvf-control" -ExpectSubstring "unknown CVF control token" -Mutate {
        param($p)
        $f = Join-Path $p "docs\catalog\MODULE_REGISTRY.json"
        $j = Get-Content -LiteralPath $f -Raw | ConvertFrom-Json
        $m = New-CvfValidModuleFixture
        $m.controls = @("NOT-A-CONTROL")
        $j.modules = @($m)
        Set-Content -LiteralPath $f -Value ($j | ConvertTo-Json -Depth 6)
    }

    Test-NegativeCase -Name "unknown-module-dependency" -ExpectSubstring "unknown module dependency" -Mutate {
        param($p)
        $f = Join-Path $p "docs\catalog\MODULE_REGISTRY.json"
        $j = Get-Content -LiteralPath $f -Raw | ConvertFrom-Json
        $m = New-CvfValidModuleFixture
        $m.dependencies = @("ghost-module")
        $j.modules = @($m)
        Set-Content -LiteralPath $f -Value ($j | ConvertTo-Json -Depth 6)
    }

    Test-NegativeCase -Name "hand-edited-generated-view" -ExpectSubstring "does not match the generated view" -AlsoDoctor -Mutate {
        param($p)
        Add-Content -LiteralPath (Join-Path $p "docs\INDEX.md") -Value "`r`nhand-edited line"
    }

    # --- BSL-R2: closed-schema adversarial cases -----------------------
    Test-NegativeCase -Ac "BSL-R2" -Name "rogue-top-level-property" -ExpectSubstring "additional property not allowed" -Mutate {
        param($p)
        $f = Join-Path $p "docs\catalog\ARTIFACT_REGISTRY.json"
        $j = Get-Content -LiteralPath $f -Raw | ConvertFrom-Json
        $j | Add-Member -NotePropertyName "rogueTopLevel" -NotePropertyValue "unexpected" -Force
        Set-Content -LiteralPath $f -Value ($j | ConvertTo-Json -Depth 6)
    }

    Test-NegativeCase -Ac "BSL-R2" -Name "empty-top-level-project-name" -ExpectSubstring "must be non-empty" -Mutate {
        param($p)
        $f = Join-Path $p "docs\catalog\ARTIFACT_REGISTRY.json"
        $j = Get-Content -LiteralPath $f -Raw | ConvertFrom-Json
        $j.projectName = ""
        Set-Content -LiteralPath $f -Value ($j | ConvertTo-Json -Depth 6)
    }

    Test-NegativeCase -Ac "BSL-R2" -Name "missing-artifacts-collection" -ExpectSubstring "missing required field 'artifacts'" -Mutate {
        param($p)
        $f = Join-Path $p "docs\catalog\ARTIFACT_REGISTRY.json"
        $j = Get-Content -LiteralPath $f -Raw | ConvertFrom-Json
        $j.PSObject.Properties.Remove('artifacts')
        Set-Content -LiteralPath $f -Value ($j | ConvertTo-Json -Depth 6)
    }

    Test-NegativeCase -Ac "BSL-R2" -Name "additional-entry-property" -ExpectSubstring "additional property not allowed" -Mutate {
        param($p)
        $f = Join-Path $p "docs\catalog\ARTIFACT_REGISTRY.json"
        $j = Get-Content -LiteralPath $f -Raw | ConvertFrom-Json
        $j.artifacts[0] | Add-Member -NotePropertyName "extra" -NotePropertyValue "unexpected" -Force
        Set-Content -LiteralPath $f -Value ($j | ConvertTo-Json -Depth 6)
    }

    Test-NegativeCase -Ac "BSL-R2" -Name "wrong-type-controls-not-array" -ExpectSubstring "must be an array" -Mutate {
        param($p)
        $f = Join-Path $p "docs\catalog\MODULE_REGISTRY.json"
        $j = Get-Content -LiteralPath $f -Raw | ConvertFrom-Json
        $m = New-CvfValidModuleFixture
        $m.controls = "GC-001"
        $j.modules = @($m)
        Set-Content -LiteralPath $f -Value ($j | ConvertTo-Json -Depth 6)
    }

    Test-NegativeCase -Ac "BSL-R2" -Name "registry-project-identity-mismatch" -ExpectSubstring "project identity mismatch" -Mutate {
        param($p)
        $f = Join-Path $p "docs\catalog\MODULE_REGISTRY.json"
        $j = Get-Content -LiteralPath $f -Raw | ConvertFrom-Json
        $j.projectName = "SomeOtherProjectName"
        Set-Content -LiteralPath $f -Value ($j | ConvertTo-Json -Depth 6)
    }

    # ------------------------------------------------------------------
    # BSL-R1: legacy/mixed project content is never overwritten
    # ------------------------------------------------------------------
    $sentinelProjectName = "LegacySentinelProbe"
    $sentinelProject = Join-Path $workspaceA $sentinelProjectName
    New-Item -ItemType Directory -Path (Join-Path $sentinelProject "docs\catalog") -Force | Out-Null
    $sentinelIndex = "# SENTINEL INDEX`r`nDo not overwrite this hand-authored content.`r`n"
    $sentinelCatalog = "# SENTINEL MODULE CATALOG`r`nDo not overwrite this hand-authored content.`r`n"
    Set-Content -LiteralPath (Join-Path $sentinelProject "docs\INDEX.md") -Value $sentinelIndex -Encoding utf8 -NoNewline
    Set-Content -LiteralPath (Join-Path $sentinelProject "docs\catalog\MODULE_CATALOG.md") -Value $sentinelCatalog -Encoding utf8 -NoNewline
    $legacyModuleRegistry = [ordered]@{ schemaVersion = "1.0"; projectName = $sentinelProjectName; modules = @(); updatedAt = "2020-01-01"; claimBoundary = "legacy fixture" }
    Set-Content -LiteralPath (Join-Path $sentinelProject "docs\catalog\MODULE_REGISTRY.json") -Value ($legacyModuleRegistry | ConvertTo-Json -Depth 6) -Encoding utf8
    git -C $sentinelProject init --quiet
    git -C $sentinelProject add -A | Out-Null
    git -C $sentinelProject -c user.email="downstream@local" -c user.name="Downstream Probe" commit --quiet -m "pre-existing legacy project" | Out-Null

    $sentinelBootstrap = Invoke-CvfBootstrap -WorkspaceRoot $workspaceA -ProjectName $sentinelProjectName -BootstrapScriptPath $bootstrapScript
    $indexAfterSentinel = Get-Content -LiteralPath (Join-Path $sentinelProject "docs\INDEX.md") -Raw
    $catalogAfterSentinel = Get-Content -LiteralPath (Join-Path $sentinelProject "docs\catalog\MODULE_CATALOG.md") -Raw
    $artifactRegistryNotCreated = -not (Test-Path -LiteralPath (Join-Path $sentinelProject "docs\catalog\ARTIFACT_REGISTRY.json"))
    $sentinelManifest = Get-Content -LiteralPath (Join-Path $sentinelProject ".cvf\manifest.json") -Raw | ConvertFrom-Json
    $noCatalogMarkerOnLegacy = -not ($sentinelManifest.PSObject.Properties.Name -contains "catalogKitVersion")
    Add-Result "BSL-R1" "Bootstrap exits 0 on a legacy/mixed project without installing the catalog kit" ($sentinelBootstrap.ExitCode -eq 0)
    Add-Result "BSL-R1" "Legacy docs/INDEX.md is byte-identical to the pre-existing sentinel content" ($indexAfterSentinel -ceq $sentinelIndex) "INDEX_PRESERVED: $($indexAfterSentinel -ceq $sentinelIndex)"
    Add-Result "BSL-R1" "Legacy docs/catalog/MODULE_CATALOG.md is byte-identical to the pre-existing sentinel content" ($catalogAfterSentinel -ceq $sentinelCatalog) "CATALOG_PRESERVED: $($catalogAfterSentinel -ceq $sentinelCatalog)"
    Add-Result "BSL-R1" "Legacy/mixed project never receives a governed ARTIFACT_REGISTRY.json" $artifactRegistryNotCreated
    Add-Result "BSL-R1" "Legacy/mixed project manifest never receives the governed-catalog marker" $noCatalogMarkerOnLegacy
    Add-Result "BSL-R1" "Bootstrap output reports MIGRATION_REQUIRED for the legacy/mixed project" ($sentinelBootstrap.Output -match "MIGRATION_REQUIRED")
    Add-Result "BSL-R8" "MIGRATION_REQUIRED_SKIPPED stays bounded (exit 0) but never prints the unqualified success claim" `
        (($sentinelBootstrap.ExitCode -eq 0) -and (-not ($sentinelBootstrap.Output -match "Workspace bootstrap complete\."))) $sentinelBootstrap.Output
    Add-Result "BSL-R8" "MIGRATION_REQUIRED_SKIPPED completion message explicitly states it is not a governed-catalog success" `
        ($sentinelBootstrap.Output -match "NOT a governed-catalog success") $sentinelBootstrap.Output

    # ------------------------------------------------------------------
    # BSL-R3: true legacy (bounded warning) vs damaged governed kit (blocking failure)
    # ------------------------------------------------------------------
    $trueLegacyProject = Copy-DisposableProject -SourceProjectPath $projectA -WorkspaceRoot $workspaceA -Label "truelegacy"
    $trueLegacyManifestPath = Join-Path $trueLegacyProject ".cvf\manifest.json"
    $trueLegacyManifest = Get-Content -LiteralPath $trueLegacyManifestPath -Raw | ConvertFrom-Json
    $trueLegacyManifest.PSObject.Properties.Remove('catalogKitVersion')
    $catalogKitRequiredDocPaths = @(
        "docs/catalog/ARTIFACT_REGISTRY.json", "docs/catalog/schemas/ARTIFACT_REGISTRY.schema.json",
        "docs/catalog/schemas/MODULE_REGISTRY.schema.json", "scripts/manage_cvf_downstream_catalog.ps1",
        "scripts/lib/downstream_catalog/CvfDownstreamCatalogLib.ps1"
    )
    # A real true-legacy manifest would never reference paths that only the
    # governed kit creates; strip them so this fixture matches what
    # bootstrap would actually have written for such a project.
    $trueLegacyManifest.requiredDocs = @($trueLegacyManifest.requiredDocs | Where-Object { $catalogKitRequiredDocPaths -notcontains $_ })
    Set-Content -LiteralPath $trueLegacyManifestPath -Value ($trueLegacyManifest | ConvertTo-Json -Depth 8) -Encoding utf8
    Remove-Item -LiteralPath (Join-Path $trueLegacyProject "scripts\manage_cvf_downstream_catalog.ps1") -Force
    Remove-CvfHermeticDirectory -Path (Join-Path $trueLegacyProject "scripts\lib\downstream_catalog") | Out-Null
    Remove-Item -LiteralPath (Join-Path $trueLegacyProject "docs\catalog\ARTIFACT_REGISTRY.json") -Force
    Remove-CvfHermeticDirectory -Path (Join-Path $trueLegacyProject "docs\catalog\schemas") | Out-Null
    $trueLegacyDoctor = Invoke-CvfDoctor -ProjectPath $trueLegacyProject -CoreDoctorPath $doctorPathA
    Add-Result "BSL-R3" "Doctor PASSes a true legacy project (no marker, no surface) with a bounded warning" `
        (($trueLegacyDoctor.ExitCode -eq 0) -and ($trueLegacyDoctor.Output -match "LEGACY_PROJECT")) $trueLegacyDoctor.Output
    Remove-CvfHermeticDirectory -Path $trueLegacyProject | Out-Null

    $damagedGovernedProject = Copy-DisposableProject -SourceProjectPath $projectA -WorkspaceRoot $workspaceA -Label "damagedgoverned"
    Remove-Item -LiteralPath (Join-Path $damagedGovernedProject "scripts\manage_cvf_downstream_catalog.ps1") -Force
    $damagedGovernedDoctor = Invoke-CvfDoctor -ProjectPath $damagedGovernedProject -CoreDoctorPath $doctorPathA
    Add-Result "BSL-R3" "Doctor FAILs a damaged governed kit (marker/surfaces present, manager deleted) instead of falling back to legacy" `
        (($damagedGovernedDoctor.ExitCode -ne 0) -and ($damagedGovernedDoctor.Output -match "DAMAGED_GOVERNED_KIT")) $damagedGovernedDoctor.Output
    Remove-CvfHermeticDirectory -Path $damagedGovernedProject | Out-Null

    # BSL-R1 (bootstrap-time damaged governed source): ARTIFACT_REGISTRY.json
    # present but invalid must not be overwritten and must not regenerate views.
    $damagedSourceProject = Copy-DisposableProject -SourceProjectPath $projectA -WorkspaceRoot $workspaceA -Label "damagedsource"
    $damagedRegistryPath = Join-Path $damagedSourceProject "docs\catalog\ARTIFACT_REGISTRY.json"
    Set-Content -LiteralPath $damagedRegistryPath -Value '{ "not": "a valid registry" }' -Encoding utf8
    # Compare against what was actually written (not a hand-typed literal)
    # so the assertion is not sensitive to Set-Content's own newline choices.
    $damagedRegistryContentBefore = Get-Content -LiteralPath $damagedRegistryPath -Raw
    $indexBeforeDamagedWrite = Get-Content -LiteralPath (Join-Path $damagedSourceProject "docs\INDEX.md") -Raw
    $damagedSourceBootstrap = Invoke-CvfBootstrap -WorkspaceRoot $workspaceA -ProjectName (Split-Path -Leaf $damagedSourceProject) -BootstrapScriptPath $bootstrapScript
    $indexAfterDamagedWrite = Get-Content -LiteralPath (Join-Path $damagedSourceProject "docs\INDEX.md") -Raw
    $registryStillDamaged = (Get-Content -LiteralPath $damagedRegistryPath -Raw) -ceq $damagedRegistryContentBefore
    Add-Result "BSL-R1" "A damaged governed ARTIFACT_REGISTRY.json is preserved as-is and never overwritten" $registryStillDamaged
    Add-Result "BSL-R1" "Generated views are not regenerated from a damaged governed source" ($indexBeforeDamagedWrite -ceq $indexAfterDamagedWrite)
    Add-Result "BSL-R1" "Bootstrap reports the damaged governed kit rather than failing silently" ($damagedSourceBootstrap.Output -match "DAMAGED_GOVERNED")
    Add-Result "BSL-R8" "Bootstrap exits non-zero when catalog installation is damaged (shape-invalid registry, from the very first bootstrap)" ($damagedSourceBootstrap.ExitCode -ne 0) "exit=$($damagedSourceBootstrap.ExitCode)"
    Add-Result "BSL-R8" "Bootstrap does not print the success claim when catalog installation is damaged (shape-invalid registry)" (-not ($damagedSourceBootstrap.Output -match "Workspace bootstrap complete")) $damagedSourceBootstrap.Output
    Remove-CvfHermeticDirectory -Path $damagedSourceProject | Out-Null

    # BSL-R8: force the catalog MANAGER itself to fail, not just an
    # up-front shape-invalid registry. This registry passes
    # Get-CvfCatalogState's top-level shape check (so classification is
    # ALREADY_GOVERNED, matching the fixture's intent), but a duplicate
    # artifact id fails Test-CvfArtifactRegistry's full content validation,
    # so the manager -Write invocation itself exits non-zero after retries
    # and Install-CvfDownstreamCatalogKit reaches DAMAGED_GOVERNED_SKIPPED
    # through the OTHER code path than the fixture above.
    $managerFailProject = Copy-DisposableProject -SourceProjectPath $projectA -WorkspaceRoot $workspaceA -Label "managerforcedfail"
    $managerFailRegistryPath = Join-Path $managerFailProject "docs\catalog\ARTIFACT_REGISTRY.json"
    $managerFailRegistry = Get-Content -LiteralPath $managerFailRegistryPath -Raw | ConvertFrom-Json
    $managerFailRegistry.artifacts[1].id = $managerFailRegistry.artifacts[0].id
    Set-Content -LiteralPath $managerFailRegistryPath -Value ($managerFailRegistry | ConvertTo-Json -Depth 6)
    $preClassification = Get-CvfCatalogState -ProjectPath $managerFailProject
    $managerForcedFailBootstrap = Invoke-CvfBootstrap -WorkspaceRoot $workspaceA -ProjectName (Split-Path -Leaf $managerFailProject) -BootstrapScriptPath $bootstrapScript
    Add-Result "BSL-R8" "Fixture reaches the manager-exit-nonzero path (registry passes shape check, fails content validation)" ($preClassification -eq "ALREADY_GOVERNED") "preClassification=$preClassification"
    Add-Result "BSL-R8" "Bootstrap exits non-zero when the catalog manager itself rejects the registries" ($managerForcedFailBootstrap.ExitCode -ne 0) "exit=$($managerForcedFailBootstrap.ExitCode)"
    Add-Result "BSL-R8" "Bootstrap does not print the success claim when the catalog manager rejects the registries" (-not ($managerForcedFailBootstrap.Output -match "Workspace bootstrap complete")) $managerForcedFailBootstrap.Output
    Add-Result "BSL-R8" "Bootstrap output explicitly identifies the damaged-governed failure (no silent/ambiguous exit)" ($managerForcedFailBootstrap.Output -match "DAMAGED_GOVERNED") $managerForcedFailBootstrap.Output
    Remove-CvfHermeticDirectory -Path $managerFailProject | Out-Null

    # ------------------------------------------------------------------
    # AC-09 / BSL-R5: fresh-clone / local-binding portability, strictly gated
    # ------------------------------------------------------------------
    $workspaceB = New-TempDirectory "cvf-golden-workspace-b"
    $coreB = Join-Path $workspaceB ".Controlled-Vibe-Framework-CVF"
    New-CvfCleanPublicMainClone -SourceRepoPath $repoRoot -DestCorePath $coreB
    $projectB = Join-Path $workspaceB $projectName
    git -c core.longpaths=true clone --quiet $projectA $projectB 2>&1 | Out-Null
    $freshCloneOk = $LASTEXITCODE -eq 0
    $localBindingAbsentAfterClone = -not (Test-Path -LiteralPath (Join-Path $projectB ".cvf\local-binding.json"))
    Add-Result "AC-09" "Fresh clone excludes ignored local binding" ($freshCloneOk -and $localBindingAbsentAfterClone)

    Set-Content -LiteralPath (Join-Path $workspaceB "WORKSPACE_RULES.md") -Value "# CVF Workspace Rules`r`n`r`nFresh-clone fixture." -Encoding utf8
    $initializerPath = Join-Path $projectB "scripts\initialize_cvf_clone.ps1"
    $initResult = Invoke-CvfFreshCloneInit -InitializerPath $initializerPath -ProjectPath $projectB
    $localBindingRecreated = Test-Path -LiteralPath (Join-Path $projectB ".cvf\local-binding.json")
    $ac09Strict = ($initResult.ExitCode -eq 0) -and $localBindingRecreated
    Add-Result "AC-09" "Fresh-clone initializer completes with exit 0 AND recreates ignored local binding (BSL-R5: exit code is required, not just the binding file)" `
        $ac09Strict "init exit=$($initResult.ExitCode); binding recreated=$localBindingRecreated; $($initResult.Output)"

    $manifestPortableCheck = Get-Content -LiteralPath (Join-Path $projectB ".cvf\manifest.json") -Raw | ConvertFrom-Json
    $portableOk = (-not [System.IO.Path]::IsPathRooted($manifestPortableCheck.cvfCoreRelativePath)) -and
                  (-not [System.IO.Path]::IsPathRooted($manifestPortableCheck.workspaceRulesRelativePath))
    Add-Result "AC-09" "Tracked manifest keeps only portable relative core identity" $portableOk

    # ------------------------------------------------------------------
    # AC-10: absolute-path / secret scan across generated tracked files
    # ------------------------------------------------------------------
    $secretPatterns = @('DASHSCOPE_API_KEY\s*=\s*\S', 'sk-[A-Za-z0-9]{16,}', 'AKIA[0-9A-Z]{16}')
    $absoluteHit = $false
    $secretHit = $false
    Get-ChildItem -LiteralPath $projectA -Recurse -File -Force |
        Where-Object { $_.FullName -notmatch '\\\.git\\' -and $_.Name -ne 'local-binding.json' } |
        ForEach-Object {
            $text = Get-Content -LiteralPath $_.FullName -Raw -ErrorAction SilentlyContinue
            if ($null -eq $text) { return }
            if ($text -match [regex]::Escape($workspaceA)) { $script:absoluteHitFile = $_.FullName; $absoluteHit = $true }
            foreach ($pat in $secretPatterns) { if ($text -match $pat) { $secretHit = $true } }
        }
    Add-Result "AC-10" "No tracked generated file contains the disposable workspace absolute path" (-not $absoluteHit) "$($script:absoluteHitFile)"
    Add-Result "AC-10" "No tracked generated file contains a recognizable secret pattern" (-not $secretHit)

    # ------------------------------------------------------------------
    # AC-11: file-size guard
    # ------------------------------------------------------------------
    $sizeGuardFiles = @(
        (Join-Path $repoRoot "scripts\new-cvf-workspace.ps1"),
        (Join-Path $repoRoot "scripts\check_cvf_workspace_agent_enforcement.ps1"),
        (Join-Path $repoRoot "scripts\update_cvf_workspace_public_core.ps1"),
        (Join-Path $repoRoot "scripts\lib\downstream_catalog\CvfDownstreamCatalogLib.ps1"),
        (Join-Path $repoRoot "scripts\lib\downstream_catalog\CvfDownstreamBootstrapContent.ps1"),
        (Join-Path $repoRoot "scripts\lib\downstream_catalog\CvfWorkspaceDoctorLiveReadiness.ps1"),
        (Join-Path $repoRoot "scripts\lib\downstream_catalog\manage_cvf_downstream_catalog.ps1"),
        (Join-Path $repoRoot "scripts\test_cvf_golden_downstream_bootstrap.ps1")
    )
    # [System.IO.File]::ReadAllLines (not Get-Content|Measure-Object, which
    # undercounted here) matches the plain newline-count a reviewer or `wc -l`
    # would see, regardless of embedded here-strings.
    $oversized = @($sizeGuardFiles | Where-Object { ([System.IO.File]::ReadAllLines($_)).Count -gt 600 })
    Add-Result "AC-11" "All new/modified authored files are at most 600 lines" ($oversized.Count -eq 0) ($oversized -join ", ")

    # ------------------------------------------------------------------
    # BSL-R7: public-kit completeness covers every new helper/schema/guard
    # ------------------------------------------------------------------
    $newCoreHelperPaths = @(
        "scripts\lib\downstream_catalog\CvfDownstreamCatalogLib.ps1",
        "scripts\lib\downstream_catalog\CvfDownstreamBootstrapContent.ps1",
        "scripts\lib\downstream_catalog\CvfWorkspaceDoctorLiveReadiness.ps1",
        "scripts\lib\downstream_catalog\manage_cvf_downstream_catalog.ps1",
        "scripts\lib\downstream_catalog\schemas\ARTIFACT_REGISTRY.schema.json",
        "scripts\lib\downstream_catalog\schemas\MODULE_REGISTRY.schema.json",
        "governance\toolkit\05_OPERATION\downstream_catalog\CVF_DOWNSTREAM_CATALOG_GUARD.md"
    )

    $workspaceE = New-TempDirectory "cvf-golden-workspace-e"
    $coreE = Join-Path $workspaceE ".Controlled-Vibe-Framework-CVF"
    New-CvfHermeticCoreClone -SourceRepoPath $repoRoot -DestCorePath $coreE
    Remove-Item -LiteralPath (Join-Path $coreE "scripts\lib\downstream_catalog\manage_cvf_downstream_catalog.ps1") -Force
    $damagedCoreBootstrap = Invoke-CvfBootstrap -WorkspaceRoot $workspaceE -ProjectName "DamagedCoreProbe" -BootstrapScriptPath $bootstrapScript
    Add-Result "BSL-R7" "Bootstrap refuses to run against a public core missing a new helper file" `
        (($damagedCoreBootstrap.ExitCode -ne 0) -and ($damagedCoreBootstrap.Output -match "workspace kit is incomplete") -and ($damagedCoreBootstrap.Output -match [regex]::Escape("manage_cvf_downstream_catalog.ps1"))) `
        $damagedCoreBootstrap.Output

    $workspaceD = New-TempDirectory "cvf-golden-workspace-d"
    $coreD = Join-Path $workspaceD ".Controlled-Vibe-Framework-CVF"
    New-CvfHermeticCoreClone -SourceRepoPath $repoRoot -DestCorePath $coreD
    Remove-Item -LiteralPath (Join-Path $coreD "scripts\lib\downstream_catalog\CvfDownstreamCatalogLib.ps1") -Force
    $projectD = Join-Path $workspaceD $projectName
    New-Item -ItemType Directory -Path $projectD -Force | Out-Null
    Copy-Item -Path "$projectA\*" -Destination $projectD -Recurse -Force
    $doctorPathD = Join-Path $coreD "scripts\check_cvf_workspace_agent_enforcement.ps1"
    $damagedCoreDoctor = Invoke-CvfDoctor -ProjectPath $projectD -CoreDoctorPath $doctorPathD
    Add-Result "BSL-R7" "Doctor fails 'Public workspace kit is complete' when a new helper file is missing from the public core" `
        (($damagedCoreDoctor.ExitCode -ne 0) -and ($damagedCoreDoctor.Output -match "Public workspace kit is complete") -and ($damagedCoreDoctor.Output -match [regex]::Escape("CvfDownstreamCatalogLib.ps1"))) `
        $damagedCoreDoctor.Output

    $reconcilerText = Get-Content -LiteralPath (Join-Path $repoRoot "scripts\update_cvf_workspace_public_core.ps1") -Raw
    $missingFromReconciler = @($newCoreHelperPaths | Where-Object { -not $reconcilerText.Contains($_) })
    Add-Result "BSL-R7" "Public-core reconciler completeness list includes every new catalog/helper/schema/guard surface" `
        ($missingFromReconciler.Count -eq 0) ($missingFromReconciler -join ", ")

    $publicMapperPath = Join-Path $repoRoot "scripts\cvf-public-sync.ps1"
    if (Test-Path -LiteralPath $publicMapperPath -PathType Leaf) {
        $publicMapperText = Get-Content -LiteralPath $publicMapperPath -Raw
        $missingFromPublicMapper = @($newCoreHelperPaths | Where-Object { -not $publicMapperText.Contains($_) })
        Add-Result "BSL-R7" "WorkspaceKitOnly public mapper includes every new catalog/helper/schema/guard surface" `
            ($missingFromPublicMapper.Count -eq 0) ($missingFromPublicMapper -join ", ")
    }
    else {
        Add-Result "BSL-R7" "WorkspaceKitOnly mapper check is provenance-only on the intentionally mapper-free public surface" `
            $true "N/A_WITH_REASON: private projection control plane is not exported"
    }

    $bootstrapListText = Get-Content -LiteralPath $bootstrapScript -Raw
    $doctorListText = Get-Content -LiteralPath (Join-Path $repoRoot "scripts\check_cvf_workspace_agent_enforcement.ps1") -Raw
    $missingFromBootstrapList = @($newCoreHelperPaths | Where-Object { -not $bootstrapListText.Contains($_) })
    $missingFromDoctorList = @($newCoreHelperPaths | Where-Object { -not $doctorListText.Contains($_) })
    Add-Result "BSL-R7" "Bootstrap's own public-kit completeness list includes every new surface" ($missingFromBootstrapList.Count -eq 0) ($missingFromBootstrapList -join ", ")
    Add-Result "BSL-R7" "Doctor's own public-kit completeness list includes every new surface" ($missingFromDoctorList.Count -eq 0) ($missingFromDoctorList -join ", ")

    # ------------------------------------------------------------------
    # AC-15 / BSL-R9: public documentation and the generated log must not
    # disagree with actual behavior. Both defects are executable checks now,
    # not prose-only review.
    # ------------------------------------------------------------------
    $projectABootstrapLog = Get-ChildItem -Path (Join-Path $projectA "docs") -Filter "CVF_BOOTSTRAP_LOG_*.md" | Select-Object -First 1
    $manifestLineMatches = @(Select-String -LiteralPath $projectABootstrapLog.FullName -Pattern ([regex]::Escape(".cvf/manifest.json: PRESENT")))
    Add-Result "AC-15" "Bootstrap log states .cvf/manifest.json presence exactly once, not duplicated (BSL-R9)" ($manifestLineMatches.Count -eq 1) "count=$($manifestLineMatches.Count)"

    $workspaceRulesText = Get-Content -LiteralPath (Join-Path $repoRoot "docs\reference\CVF_WORKSPACE_RULES.md") -Raw
    $documentsRealClassifier = ($workspaceRulesText -match "catalogKitVersion") -and
                               ($workspaceRulesText -match "DAMAGED_GOVERNED_KIT") -and
                               ($workspaceRulesText -match [regex]::Escape("any governed-catalog surface exists"))
    $noStaleManagerOnlyClaim = -not ($workspaceRulesText -match [regex]::Escape("When the catalog manager is present, the doctor also runs it"))
    Add-Result "AC-15" "CVF_WORKSPACE_RULES.md documents the real marker-or-any-surface governed classifier and blocking DAMAGED_GOVERNED_KIT behavior (BSL-R9)" $documentsRealClassifier
    Add-Result "AC-15" "CVF_WORKSPACE_RULES.md no longer claims governed status depends only on the manager script's presence (BSL-R9)" $noStaleManagerOnlyClaim

    # ------------------------------------------------------------------
    # BSL-R6: cleanup path-safety guard (pure predicate; no real deletion of
    # anything outside a harmless, harness-created throwaway folder)
    # ------------------------------------------------------------------
    $unsafeTargets = @($repoRoot, "C:\Windows", ([System.IO.Path]::GetTempPath()))
    $unsafeRejectedAll = -not (@($unsafeTargets | ForEach-Object { Test-CvfSafeCleanupTarget $_ }) -contains $true)
    Add-Result "BSL-R6" "Cleanup safety guard rejects paths outside tracked hermetic roots (repo root, system dir, bare temp root)" $unsafeRejectedAll

    $harmlessUntrackedDir = Join-Path ([System.IO.Path]::GetTempPath()) "not-a-tracked-cvf-golden-dir-$([Guid]::NewGuid().ToString('N').Substring(0,8))"
    New-Item -ItemType Directory -Path $harmlessUntrackedDir -Force | Out-Null
    $guardRefused = $false
    try { Remove-CvfHermeticDirectory -Path $harmlessUntrackedDir | Out-Null }
    catch { if ($_.Exception.Message -like "REFUSING_UNSAFE_CLEANUP_TARGET*") { $guardRefused = $true } }
    $stillExists = Test-Path -LiteralPath $harmlessUntrackedDir
    Add-Result "BSL-R6" "Remove-CvfHermeticDirectory refuses an untracked target and leaves it untouched" ($guardRefused -and $stillExists)
    Remove-Item -LiteralPath $harmlessUntrackedDir -Recurse -Force -ErrorAction SilentlyContinue

    $trackedRootSafe = Test-CvfSafeCleanupTarget $workspaceA
    $nestedDisposableSafe = Test-CvfSafeCleanupTarget (Join-Path $workspaceA "some-disposable-copy")
    Add-Result "BSL-R6" "Cleanup safety guard accepts a tracked hermetic root and paths nested under it" ($trackedRootSafe -and $nestedDisposableSafe)
}
finally {
    foreach ($dir in $script:tempRoots) {
        $removed = Remove-CvfHermeticDirectory -Path $dir
        if (-not $removed) {
            Write-Host "[WARN] Could not remove hermetic temp directory: $dir" -ForegroundColor Yellow
        }
    }
    $residue = @($script:tempRoots | Where-Object { Test-Path -LiteralPath $_ })
    # BSL-R6: residue is a failed assertion, not just a console warning, so it
    # forces a non-zero exit rather than a silent PASS.
    Add-Result "AC-13" "No hermetic temp directory residue remains after cleanup" ($residue.Count -eq 0) ($residue -join ", ")
}

# ------------------------------------------------------------------
# Summary
# ------------------------------------------------------------------
Write-Host ""
Write-Host "CVF Golden Downstream Bootstrap Harness - Summary" -ForegroundColor Cyan
$failed = @($script:results | Where-Object { -not $_.Pass })
Write-Host ("  {0}/{1} assertions passed" -f ($script:results.Count - $failed.Count), $script:results.Count)
if ($failed.Count -gt 0) {
    Write-Host "  FAILED:" -ForegroundColor Red
    foreach ($f in $failed) { Write-Host ("   - [{0}] {1}: {2}" -f $f.Ac, $f.Name, $f.Detail) -ForegroundColor Red }
    exit 1
}
Write-Host "  RESULT: PASS" -ForegroundColor Green
exit 0
