param(
    [Parameter(Mandatory = $true)]
    [string]$WorkspaceRoot,

    [Parameter(Mandatory = $true)]
    [string]$ProjectName,

    [string]$ProjectRepo = ""
)

$ErrorActionPreference = "Stop"

function Write-Info([string]$Message) {
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Ok([string]$Message) {
    Write-Host "[OK]   $Message" -ForegroundColor Green
}

function Ensure-Directory([string]$Path) {
    if (-not (Test-Path $Path)) {
        New-Item -ItemType Directory -Path $Path | Out-Null
        Write-Ok "Created directory: $Path"
    }
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw "git is required but was not found in PATH."
}

$workspaceRootResolved = [System.IO.Path]::GetFullPath($WorkspaceRoot)
$cvfCorePath = Join-Path $workspaceRootResolved ".Controlled-Vibe-Framework-CVF"
$projectPath = Join-Path $workspaceRootResolved $ProjectName
$workspaceFilePath = Join-Path $workspaceRootResolved "$ProjectName.code-workspace"

Write-Info "Workspace root: $workspaceRootResolved"
Ensure-Directory $workspaceRootResolved

if (-not (Test-Path $cvfCorePath)) {
    Write-Info "Cloning CVF core into: $cvfCorePath"
    git clone https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git $cvfCorePath
    Write-Ok "CVF core cloned"
}
else {
    Write-Info "CVF core already exists: $cvfCorePath"
}

if (-not (Test-Path $projectPath)) {
    if ([string]::IsNullOrWhiteSpace($ProjectRepo)) {
        Write-Info "Creating empty project folder: $projectPath"
        Ensure-Directory $projectPath
    }
    else {
        Write-Info "Cloning project repo into: $projectPath"
        git clone $ProjectRepo $projectPath
        Write-Ok "Project cloned"
    }
}
else {
    Write-Info "Project folder already exists: $projectPath"
}

$vscodeDir = Join-Path $projectPath ".vscode"
Ensure-Directory $vscodeDir

$settings = @{
    "terminal.integrated.cwd" = '${workspaceFolder}'
    "terminal.integrated.defaultProfile.windows" = "PowerShell"
}
$settingsJson = $settings | ConvertTo-Json -Depth 5
Set-Content -Path (Join-Path $vscodeDir "settings.json") -Value $settingsJson -Encoding utf8
Write-Ok "Updated: $vscodeDir\\settings.json"

$workspaceDef = @{
    folders = @(
        @{ path = $ProjectName }
    )
    settings = @{
        "terminal.integrated.cwd" = '${workspaceFolder}'
        "terminal.integrated.defaultProfile.windows" = "PowerShell"
    }
}
$workspaceJson = $workspaceDef | ConvertTo-Json -Depth 5
Set-Content -Path $workspaceFilePath -Value $workspaceJson -Encoding utf8
Write-Ok "Updated: $workspaceFilePath"

Write-Host ""
Write-Ok "Workspace bootstrap complete."
Write-Host "Open this workspace file in VS Code:" -ForegroundColor Yellow
Write-Host "  $workspaceFilePath"
Write-Host ""
Write-Host "Isolation reminder:" -ForegroundColor Yellow
Write-Host "  Work in project root only: $projectPath"
Write-Host "  Do not run downstream project tasks in CVF core root: $cvfCorePath"
