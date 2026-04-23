<#
.SYNOPSIS
    Ingest .md files from a downstream project knowledge/ folder into knowledge/_index.json.

.DESCRIPTION
    W116-CP2: Reads all .md files from KnowledgePath, splits them into paragraph-level
    chunks (max 400 words each), extracts keywords, and writes a JSON index used by
    the CVF /api/knowledge/ingest endpoint.

    No external services required — pure file-based, keyword extraction is token-based.

.PARAMETER KnowledgePath
    Path to the knowledge/ folder. Defaults to ./knowledge relative to the current directory.

.PARAMETER OutputIndex
    Path to write the _index.json file. Defaults to <KnowledgePath>/_index.json.

.PARAMETER CollectionId
    Collection ID to embed in the index. Defaults to the folder name of KnowledgePath.

.PARAMETER CollectionName
    Human-readable collection name. Defaults to CollectionId.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File scripts/ingest_cvf_downstream_knowledge.ps1 -KnowledgePath ./knowledge
#>

param(
    [string]$KnowledgePath = "./knowledge",
    [string]$OutputIndex   = "",
    [string]$CollectionId  = "",
    [string]$CollectionName = ""
)

$ErrorActionPreference = "Stop"

function Write-Info([string]$Message) { Write-Host "[INFO] $Message" -ForegroundColor Cyan }
function Write-Ok([string]$Message)   { Write-Host "[OK]   $Message" -ForegroundColor Green }
function Write-Warn([string]$Message) { Write-Host "[WARN] $Message" -ForegroundColor Yellow }
function Write-Fail([string]$Message) { Write-Host "[FAIL] $Message" -ForegroundColor Red }

$resolvedKnowledgePath = [System.IO.Path]::GetFullPath($KnowledgePath)

if (-not (Test-Path $resolvedKnowledgePath -PathType Container)) {
    Write-Fail "Knowledge folder not found: $resolvedKnowledgePath"
    exit 1
}

if ([string]::IsNullOrWhiteSpace($OutputIndex)) {
    $OutputIndex = Join-Path $resolvedKnowledgePath "_index.json"
}

if ([string]::IsNullOrWhiteSpace($CollectionId)) {
    $CollectionId = (Split-Path $resolvedKnowledgePath -Leaf)
}

if ([string]::IsNullOrWhiteSpace($CollectionName)) {
    $CollectionName = $CollectionId
}

Write-Info "Knowledge folder : $resolvedKnowledgePath"
Write-Info "Output index     : $OutputIndex"
Write-Info "Collection ID    : $CollectionId"

# --- Tokenize for keyword extraction ---
function Get-Keywords([string]$text) {
    $tokens = $text.ToLower() -replace '[^a-z0-9\s_-]', ' ' `
                              -split '\s+' | Where-Object { $_.Length -ge 4 }
    # Deduplicate and return top 20 most frequent tokens (simple TF proxy)
    $freq = @{}
    foreach ($t in $tokens) {
        if ($freq.ContainsKey($t)) { $freq[$t]++ } else { $freq[$t] = 1 }
    }
    return ($freq.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 20).Key
}

# --- Split text into paragraphs, then batch into <=400-word chunks ---
function Split-IntoChunks([string]$text, [int]$maxWords = 400) {
    $paragraphs = $text -split "`r?`n\s*`r?`n" | Where-Object { $_.Trim().Length -gt 0 }
    $chunks = [System.Collections.ArrayList]::new()
    $current = [System.Collections.ArrayList]::new()
    $currentWords = 0

    foreach ($para in $paragraphs) {
        $wordCount = ($para -split '\s+' | Where-Object { $_ -ne '' }).Count
        if ($currentWords + $wordCount -gt $maxWords -and $current.Count -gt 0) {
            $null = $chunks.Add(($current -join "`n`n").Trim())
            $current = [System.Collections.ArrayList]::new()
            $currentWords = 0
        }
        $null = $current.Add($para.Trim())
        $currentWords += $wordCount
    }

    if ($current.Count -gt 0) {
        $null = $chunks.Add(($current -join "`n`n").Trim())
    }

    return $chunks
}

# --- Process all .md files (excluding _index.json itself) ---
$mdFiles = Get-ChildItem -Path $resolvedKnowledgePath -Filter "*.md" -File |
           Where-Object { $_.Name -ne "README.md" -or $_.Name -eq "README.md" } |
           Sort-Object Name

if ($mdFiles.Count -eq 0) {
    Write-Warn "No .md files found in: $resolvedKnowledgePath"
    Write-Warn "Add .md files describing your project then re-run this script."
    exit 0
}

Write-Info "Found $($mdFiles.Count) .md file(s)"

$allChunks = [System.Collections.ArrayList]::new()
$chunkIndex = 0

foreach ($file in $mdFiles) {
    Write-Info "Processing: $($file.Name)"
    $content = Get-Content -Path $file.FullName -Raw -Encoding utf8

    $chunks = Split-IntoChunks -text $content -maxWords 400

    foreach ($chunk in $chunks) {
        if ($chunk.Trim().Length -lt 20) { continue }

        $keywords = Get-Keywords -text $chunk
        if ($keywords.Count -eq 0) {
            $keywords = @($file.BaseName.ToLower())
        }

        $chunkId = "$CollectionId-chunk-$chunkIndex"
        $null = $allChunks.Add([ordered]@{
            id         = $chunkId
            sourceFile = $file.Name
            content    = $chunk
            keywords   = @($keywords)
        })
        $chunkIndex++
    }
}

if ($allChunks.Count -eq 0) {
    Write-Warn "No usable chunks extracted. Ensure .md files have substantive content."
    exit 0
}

# --- Write index ---
$indexObj = [ordered]@{
    collectionId   = $CollectionId
    collectionName = $CollectionName
    generatedAt    = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
    sourceFolder   = $resolvedKnowledgePath
    chunkCount     = $allChunks.Count
    chunks         = @($allChunks)
}

$indexJson = $indexObj | ConvertTo-Json -Depth 10
Set-Content -Path $OutputIndex -Value $indexJson -Encoding utf8

Write-Ok "Index written: $OutputIndex"
Write-Ok "$($allChunks.Count) chunk(s) from $($mdFiles.Count) file(s)"
Write-Info ""
Write-Info "Next step: POST this index to CVF /api/knowledge/ingest"
Write-Info "  Body: { collectionId: '$CollectionId', chunks: <contents of chunks array> }"
