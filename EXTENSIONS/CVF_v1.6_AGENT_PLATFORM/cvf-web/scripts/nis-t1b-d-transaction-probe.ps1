<#
.SYNOPSIS
  NIS-T1B-D transaction probe: real second-process proof against FileIntentSpecAcceptanceStore.createIfAbsent.
.DESCRIPTION
  Builds the production store/actor/security modules into a scratch bundle, runs the deterministic barrier protocol
  (READY, START_ATTEMPT, ATTEMPTING, PARENT_RELEASE, ENTERED, COMPLETE), the post-acquire failure injection and the four
  rollback adversaries (EXTRA_ALLOW, DENY, INHERITED, WRONG_OWNER) on a synthetic private root, then cross-checks the
  published ACL with an independent Get-Acl reader. Evidence is secret-safe JSON. Exit 0 only when every field was
  exercised and passed; exit 2 when a field failed or the host cannot exercise it (consolidated limitation in evidence).
.PARAMETER SyntheticRoot
  Optional absolute path for the synthetic private root. Must be a not-yet-existing directory directly under $env:TEMP
  whose name starts with nis-t1b-d-. Default: a generated nis-t1b-d-probe-<guid> directory.
.PARAMETER EvidencePath
  Optional absolute path for the evidence JSON. Default: a unique file under .cvf/runtime/nis-t1b-d-worker-20261005/.
.PARAMETER BarrierTimeoutMs
  Deadlock-safety timeout only for barrier waits (default 30000). It is never used as ordering proof.
.PARAMETER KeepRoot
  Keep the synthetic root and bundle for inspection (default: verified-contained cleanup).
.PARAMETER Help
  Show this help.
#>
[CmdletBinding()]
param(
    [string]$SyntheticRoot,
    [string]$EvidencePath,
    [int]$BarrierTimeoutMs = 30000,
    [switch]$KeepRoot,
    [switch]$Help
)
$ErrorActionPreference = 'Stop'
if ($Help) { Get-Help $MyInvocation.MyCommand.Path -Detailed; exit 0 }
if ($env:OS -ne 'Windows_NT') { Write-Error 'PROFILE_UNSUPPORTED_PLATFORM: Windows only'; exit 2 }

$scripts = Split-Path -Parent $MyInvocation.MyCommand.Path
$web = Split-Path -Parent $scripts
$repo = (git -C $web rev-parse --show-toplevel).Trim() -replace '/', '\'
$node = (Get-Command node -ErrorAction Stop).Source
$temp = [IO.Path]::GetFullPath($env:TEMP).TrimEnd('\')
$stamp = (Get-Date -Format 'yyyyMMddTHHmmssfff') + '-' + [guid]::NewGuid().ToString('N').Substring(0, 8)

function Assert-Contained([string]$Path) {
    $full = [IO.Path]::GetFullPath($Path).TrimEnd('\')
    $parent = [IO.Path]::GetDirectoryName($full)
    if ($parent -ne $temp -or -not ([IO.Path]::GetFileName($full)).StartsWith('nis-t1b-d-')) { throw "UNSAFE_PROBE_PATH: $full" }
    return $full
}
if (-not $SyntheticRoot) { $SyntheticRoot = Join-Path $temp "nis-t1b-d-probe-$stamp" }
$root = Assert-Contained $SyntheticRoot
if (Test-Path -LiteralPath $root) { throw "SYNTHETIC_ROOT_EXISTS: choose a new directory" }
$bundleDir = Join-Path $temp "nis-t1b-d-build-$stamp"
if (-not $EvidencePath) {
    $runtime = Join-Path $repo '.cvf\runtime\nis-t1b-d-worker-20261005'
    New-Item -ItemType Directory -Force $runtime | Out-Null
    $EvidencePath = Join-Path $runtime "probe-evidence-$stamp.json"
}
if (Test-Path -LiteralPath $EvidencePath) { throw 'EVIDENCE_EXISTS: unique receipts are never overwritten' }

$code = 2
try {
    New-Item -ItemType Directory $bundleDir, $root | Out-Null
    $bundle = Join-Path $bundleDir 'probe.cjs'
    & $node (Join-Path $scripts 'nis-t1b-d-probe-build.mjs') $bundle
    if ($LASTEXITCODE -ne 0) { throw 'PROBE_BUILD_FAILED' }
    # Root becomes private through the production hardening path before any scenario runs.
    $env:NODE_ENV = 'test'
    & $node -e "require(process.argv[1]).hardenPrivate(process.argv[2]).then(()=>process.exit(0),e=>{console.error(e.message);process.exit(1)})" $bundle $root
    if ($LASTEXITCODE -ne 0) { throw 'SYNTHETIC_ROOT_HARDENING_FAILED' }
    & $node (Join-Path $scripts 'nis-t1b-d-probe-driver.mjs') --bundle $bundle --root $root --out $EvidencePath --barrier-timeout-ms $BarrierTimeoutMs
    $code = $LASTEXITCODE

    # Independent reader: plain Get-Acl, separate from the production measurement code.
    if (Test-Path -LiteralPath $EvidencePath) {
        $evidence = Get-Content -Raw -LiteralPath $EvidencePath | ConvertFrom-Json
        $cross = [ordered]@{ reader = 'Get-Acl (independent of production measureSecurity)'; targets = @() }
        if ($evidence.security) {
            foreach ($name in 'namespaceDirectory', 'recordFile') {
                $target = $evidence.security.crossCheckTargets.$name
                $expected = $evidence.security.$name
                if (-not $target -or -not $expected) { continue }
                $acl = Get-Acl -LiteralPath $target
                $sid = [Security.Principal.SecurityIdentifier]
                $actualAces = @($acl.GetAccessRules($true, $true, $sid) | ForEach-Object { '{0}|{1}|{2}|{3}' -f $_.IdentityReference.Value, $_.AccessControlType, [int]$_.FileSystemRights, $_.IsInherited } | Sort-Object)
                $expectedAces = @($expected.aces | ForEach-Object { '{0}|{1}|{2}|{3}' -f $_.sid, $_.accessType, $_.rights, ([string]$_.isInherited).ToLower() -replace 'true', 'True' -replace 'false', 'False' } | Sort-Object)
                $same = ($acl.GetOwner($sid).Value -eq $expected.ownerSid) -and ($acl.AreAccessRulesProtected -eq ($expected.protectionState -eq 'PROTECTED')) -and (($actualAces -join ';') -eq ($expectedAces -join ';'))
                $cross.targets += [ordered]@{ target = $name; matchesProductionTuple = $same; ownerSid = $acl.GetOwner($sid).Value; protected = $acl.AreAccessRulesProtected; aceCount = $actualAces.Count }
            }
        }
        $cross.allMatch = (@($cross.targets | Where-Object { -not $_.matchesProductionTuple }).Count -eq 0) -and ($cross.targets.Count -gt 0)
        $cross | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath "$EvidencePath.crosscheck.json" -Encoding UTF8
        Write-Output ("independent Get-Acl cross-check: allMatch={0} (see {1}.crosscheck.json)" -f $cross.allMatch, $EvidencePath)
        if (-not $cross.allMatch -and $code -eq 0) { $code = 2 }
    }
}
finally {
    $env:NODE_ENV = $null
    if (-not $KeepRoot) {
        foreach ($dir in $root, $bundleDir) {
            $full = Assert-Contained $dir
            if (Test-Path -LiteralPath $full) { Remove-Item -LiteralPath $full -Recurse -Force }
        }
    }
}
exit $code
