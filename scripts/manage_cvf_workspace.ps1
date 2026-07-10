param(
    [Parameter(Mandatory = $true)]
    [string]$WorkspaceRoot,

    [ValidateSet("Status", "Update", "Repair")]
    [string]$Action = "Status",

    [switch]$CheckRemote,

    [switch]$RunGate,

    [switch]$Json
)

$ErrorActionPreference = "Stop"
$workspaceResolved = [System.IO.Path]::GetFullPath($WorkspaceRoot)
$corePath = Join-Path $workspaceResolved ".Controlled-Vibe-Framework-CVF"
$scriptMap = @{
    Status = "get_cvf_workspace_status.ps1"
    Update = "update_cvf_workspace_public_core.ps1"
    Repair = "repair_cvf_workspace.ps1"
}
$target = Join-Path $corePath ("scripts\" + $scriptMap[$Action])
if (-not (Test-Path -LiteralPath $target -PathType Leaf)) {
    throw "Workspace management source not found: $target"
}

$arguments = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $target, "-WorkspaceRoot", $workspaceResolved)
if ($Action -eq "Status") {
    if ($CheckRemote) { $arguments += "-CheckRemote" }
    if ($Json) { $arguments += "-Json" }
}
elseif ($Action -eq "Repair") {
    if ($Json) { $arguments += "-Json" }
}
elseif ($Action -eq "Update" -and $RunGate) {
    $arguments += "-RunGate"
}

& powershell @arguments
if ($LASTEXITCODE -ne 0) {
    throw "Workspace $Action action failed with exit code $LASTEXITCODE"
}
