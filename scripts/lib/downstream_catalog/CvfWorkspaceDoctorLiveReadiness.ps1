# CVF Workspace Doctor - Live Readiness Helpers
#
# Extracted from check_cvf_workspace_agent_enforcement.ps1 to keep that
# entrypoint below the 600-line project guard. Core-side only (not copied
# into downstream projects); secret-free by construction - never returns a
# raw key value, only presence/source metadata.

function Normalize-EnvValue {
    param([string]$Value)
    if ([string]::IsNullOrWhiteSpace($Value)) {
        return ""
    }
    $trimmed = $Value.Trim()
    if (($trimmed.StartsWith('"') -and $trimmed.EndsWith('"')) -or
        ($trimmed.StartsWith("'") -and $trimmed.EndsWith("'"))) {
        return $trimmed.Substring(1, $trimmed.Length - 2).Trim()
    }
    return $trimmed
}

function Get-LocalEnvKeySource {
    param(
        [string]$CorePath,
        [string[]]$KeyNames
    )

    if ([string]::IsNullOrWhiteSpace($CorePath) -or -not (Test-Path $CorePath -PathType Container)) {
        return $null
    }

    $envFiles = @(
        (Join-Path $CorePath "EXTENSIONS\CVF_v1.6_AGENT_PLATFORM\cvf-web\.env.local"),
        (Join-Path $CorePath "EXTENSIONS\CVF_v1.6_AGENT_PLATFORM\cvf-web\.env"),
        (Join-Path $CorePath ".env.local"),
        (Join-Path $CorePath ".env")
    )

    foreach ($envFile in $envFiles) {
        if (-not (Test-Path $envFile -PathType Leaf)) {
            continue
        }

        $lines = Get-Content -Path $envFile -Encoding utf8
        foreach ($line in $lines) {
            $trimmed = $line.Trim()
            if ([string]::IsNullOrWhiteSpace($trimmed) -or $trimmed.StartsWith("#")) {
                continue
            }
            if ($trimmed.StartsWith("export ")) {
                $trimmed = $trimmed.Substring(7).Trim()
            }

            foreach ($keyName in $KeyNames) {
                if ($trimmed -match "^$([regex]::Escape($keyName))\s*=(.+)$") {
                    $value = Normalize-EnvValue $Matches[1]
                    if (-not [string]::IsNullOrWhiteSpace($value)) {
                        return [PSCustomObject]@{
                            KeyName = $keyName
                            Source  = "ignored_local_env"
                            Path    = $envFile
                        }
                    }
                }
            }
        }
    }

    return $null
}

function Get-LiveReadiness {
    param([string]$CorePath)

    $dashScopeAliases = @(
        "DASHSCOPE_API_KEY",
        "ALIBABA_API_KEY",
        "CVF_ALIBABA_API_KEY",
        "CVF_BENCHMARK_ALIBABA_KEY"
    )

    foreach ($alias in $dashScopeAliases) {
        $value = [Environment]::GetEnvironmentVariable($alias)
        if (-not [string]::IsNullOrWhiteSpace($value)) {
            return [PSCustomObject]@{
                LiveKeyAvailable = $true
                ProviderLane     = "alibaba"
                KeyName          = $alias
                Source           = "process_env"
                Path             = ""
            }
        }
    }

    $localSource = Get-LocalEnvKeySource -CorePath $CorePath -KeyNames $dashScopeAliases
    if ($null -ne $localSource) {
        return [PSCustomObject]@{
            LiveKeyAvailable = $true
            ProviderLane     = "alibaba"
            KeyName          = $localSource.KeyName
            Source           = $localSource.Source
            Path             = $localSource.Path
        }
    }

    return [PSCustomObject]@{
        LiveKeyAvailable = $false
        ProviderLane     = "none"
        KeyName          = "none"
        Source           = "none"
        Path             = ""
    }
}
