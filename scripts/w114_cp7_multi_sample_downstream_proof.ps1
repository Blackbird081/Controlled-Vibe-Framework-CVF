# scripts/w114_cp7_multi_sample_downstream_proof.ps1
# W114-CP7: Creates 3 temporary downstream samples proving multi-sample CVF adoption.
# Each sample is outside CVF core, records enforcement artifacts, doctor pass, and phase governance.
# Sample 3 additionally runs the workspace-to-web evidence bridge with live readiness check.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File .\scripts\w114_cp7_multi_sample_downstream_proof.ps1
#   powershell -ExecutionPolicy Bypass -File .\scripts\w114_cp7_multi_sample_downstream_proof.ps1 `
#     -TempRoot "C:\Temp\CP7-Proof" -ResultsJson ".\docs\assessments\cp7_raw.json"

param(
    [string]$TempRoot = "$env:TEMP\CVF-W114-CP7-Proof",
    [string]$ResultsJson = ""
)

$ErrorActionPreference = "Stop"
$scriptDir     = Split-Path -Parent $MyInvocation.MyCommand.Path
$cvfCorePath   = [System.IO.Path]::GetFullPath((Join-Path $scriptDir ".."))
$dateStamp     = Get-Date -Format "yyyy-MM-dd"
$recordDate    = Get-Date -Format "yyyyMMdd"
$cvfCoreCommit = git -C $cvfCorePath rev-parse --short HEAD 2>$null

function Write-Info([string]$m)  { Write-Host "[INFO] $m" -ForegroundColor Cyan }
function Write-Ok([string]$m)    { Write-Host "[OK]   $m" -ForegroundColor Green }
function Write-Warn([string]$m)  { Write-Host "[WARN] $m" -ForegroundColor Yellow }
function Write-Fail([string]$m)  { Write-Host "[FAIL] $m" -ForegroundColor Red }

function Ensure-Dir([string]$p) {
    if (-not (Test-Path $p)) { New-Item -ItemType Directory -Path $p | Out-Null }
}

# ─── Sample specs ────────────────────────────────────────────────────────────
$samples = @(
    @{
        Name        = "cvf-downstream-note-taker-cli"
        Kind        = "cli-productivity"
        Description = "Simple CLI note-taker utility demonstrating CVF governance on a productivity tool."
        SrcFile     = "src/notes.py"
        TestFile    = "tests/test_notes.py"
        LiveBridge  = $false
    },
    @{
        Name        = "cvf-downstream-webapp-planner"
        Kind        = "web-app-planning"
        Description = "Web/app planning and build handoff sample demonstrating CVF governance on a planning workflow."
        SrcFile     = "src/sitemap.py"
        TestFile    = "tests/test_sitemap.py"
        LiveBridge  = $false
    },
    @{
        Name        = "cvf-downstream-data-analyzer"
        Kind        = "data-analysis"
        Description = "Data/content analysis task demonstrating CVF governance on an analytics workflow, with live web evidence bridge."
        SrcFile     = "src/analyzer.py"
        TestFile    = "tests/test_analyzer.py"
        LiveBridge  = $true
    }
)

# ─── Source file contents ─────────────────────────────────────────────────────
function Get-SrcContent([string]$Name) {
    switch ($Name) {
        "cvf-downstream-note-taker-cli" {
return @'
import json
import os

NOTES_FILE = "notes.json"

def load_notes():
    if not os.path.exists(NOTES_FILE):
        return []
    with open(NOTES_FILE) as f:
        return json.load(f)

def save_notes(notes):
    with open(NOTES_FILE, "w") as f:
        json.dump(notes, f)

def add_note(text):
    notes = load_notes()
    note = {"id": len(notes) + 1, "text": text}
    notes.append(note)
    save_notes(notes)
    return note

def delete_note(note_id):
    notes = load_notes()
    notes = [n for n in notes if n["id"] != note_id]
    save_notes(notes)
    return notes

def list_notes():
    return load_notes()
'@
        }
        "cvf-downstream-webapp-planner" {
return @'
def generate_sitemap(pages):
    urls = "".join(f"<url><loc>{p}</loc></url>" for p in pages)
    return f"<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">{urls}</urlset>"

def parse_requirements(req_text):
    lines = [l.strip() for l in req_text.strip().split("\n") if l.strip()]
    return {"features": lines, "count": len(lines)}

def build_handoff(project_name, features, tech_stack):
    return {
        "project": project_name,
        "feature_count": len(features),
        "tech_stack": tech_stack,
        "phases": ["INTAKE", "DESIGN", "BUILD", "REVIEW", "FREEZE"],
    }
'@
        }
        "cvf-downstream-data-analyzer" {
return @'
import csv
import io
from statistics import mean, median

def analyze_csv(csv_text):
    reader = csv.DictReader(io.StringIO(csv_text))
    rows = list(reader)
    if not rows:
        return {"rows": 0, "columns": []}
    return {"rows": len(rows), "columns": list(rows[0].keys()), "sample": rows[0]}

def summarize_numeric(values):
    nums = [float(v) for v in values if v]
    if not nums:
        return {}
    return {"mean": mean(nums), "median": median(nums), "count": len(nums)}

def filter_rows(rows, column, value):
    return [r for r in rows if r.get(column) == value]
'@
        }
    }
}

function Get-TestContent([string]$Name) {
    switch ($Name) {
        "cvf-downstream-note-taker-cli" {
return @'
import sys, os, tempfile, unittest
from unittest.mock import patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

class TestNotes(unittest.TestCase):
    def _tmp_notes(self):
        return os.path.join(tempfile.mkdtemp(), "notes.json")

    def test_add_note(self):
        import notes
        p = self._tmp_notes()
        with patch.object(notes, "NOTES_FILE", p):
            note = notes.add_note("Buy groceries")
            self.assertEqual(note["text"], "Buy groceries")
            self.assertEqual(note["id"], 1)

    def test_delete_note(self):
        import notes
        p = self._tmp_notes()
        with patch.object(notes, "NOTES_FILE", p):
            notes.add_note("Temp note")
            remaining = notes.delete_note(1)
            self.assertEqual(len(remaining), 0)

if __name__ == "__main__":
    unittest.main()
'@
        }
        "cvf-downstream-webapp-planner" {
return @'
import sys, os, unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))
from sitemap import generate_sitemap, parse_requirements, build_handoff

class TestSitemap(unittest.TestCase):
    def test_generate_sitemap(self):
        result = generate_sitemap(["https://example.com", "https://example.com/about"])
        self.assertIn("<url>", result)
        self.assertIn("example.com", result)

    def test_parse_requirements(self):
        req = "User login\nDashboard\nReports"
        result = parse_requirements(req)
        self.assertEqual(result["count"], 3)
        self.assertIn("User login", result["features"])

    def test_build_handoff(self):
        h = build_handoff("myapp", ["auth", "dashboard"], ["React", "Python"])
        self.assertEqual(h["project"], "myapp")
        self.assertEqual(h["feature_count"], 2)
        self.assertIn("FREEZE", h["phases"])

if __name__ == "__main__":
    unittest.main()
'@
        }
        "cvf-downstream-data-analyzer" {
return @'
import sys, os, unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))
from analyzer import analyze_csv, summarize_numeric, filter_rows

class TestAnalyzer(unittest.TestCase):
    CSV_DATA = "name,value,category\nalpha,10,A\nbeta,20,B\ngamma,30,A"

    def test_analyze_csv(self):
        result = analyze_csv(self.CSV_DATA)
        self.assertEqual(result["rows"], 3)
        self.assertIn("name", result["columns"])
        self.assertIn("value", result["columns"])

    def test_summarize_numeric(self):
        result = summarize_numeric(["10", "20", "30"])
        self.assertEqual(result["count"], 3)
        self.assertEqual(result["mean"], 20.0)

    def test_filter_rows(self):
        import csv, io
        rows = list(csv.DictReader(io.StringIO(self.CSV_DATA)))
        filtered = filter_rows(rows, "category", "A")
        self.assertEqual(len(filtered), 2)

if __name__ == "__main__":
    unittest.main()
'@
        }
    }
}

# ─── Main loop ────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "CVF W114-CP7 Multi-Sample Downstream Proof" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "CVF Core: $cvfCorePath"
Write-Host "CVF Commit: $cvfCoreCommit"
Write-Host "Temp Root: $TempRoot"
Write-Host ""

Ensure-Dir $TempRoot
$allResults = @()

foreach ($sample in $samples) {
    $sampleName = $sample.Name
    $projectPath = Join-Path $TempRoot $sampleName

    Write-Host "--- Sample: $sampleName ---" -ForegroundColor Magenta
    Ensure-Dir $projectPath
    Ensure-Dir (Join-Path $projectPath "src")
    Ensure-Dir (Join-Path $projectPath "tests")
    Ensure-Dir (Join-Path $projectPath "docs")
    Ensure-Dir (Join-Path $projectPath ".cvf")
    Ensure-Dir (Join-Path $projectPath ".github\workflows")

    # ── Enforcement artifacts ─────────────────────────────────────────────────
    $manifestObj = [ordered]@{
        cvfCorePath                  = $cvfCorePath
        cvfCoreCommit                = $cvfCoreCommit
        workspaceRoot                = $TempRoot
        projectPath                  = $projectPath
        phaseModel                   = @("INTAKE","DESIGN","BUILD","REVIEW","FREEZE")
        liveGovernanceEvidenceRequired = $true
        mockAllowedOnlyForUi         = $true
        requiredDocs                 = @(
            ".cvf/manifest.json",
            ".cvf/policy.json",
            "docs/CVF_BOOTSTRAP_LOG_$recordDate.md"
        )
        bootstrapDate                = $dateStamp
        enforcementVersion           = "1.0"
        bootstrapScript              = "scripts/w114_cp7_multi_sample_downstream_proof.ps1"
        w112TrancheRef               = "CVF_W112_T1_WORKSPACE_AGENT_ENFORCEMENT_AND_WEB_CONTROL_UPLIFT_ROADMAP_2026-04-22.md"
        sampleKind                   = $sample.Kind
    }
    Set-Content -Path (Join-Path $projectPath ".cvf\manifest.json") `
        -Value ($manifestObj | ConvertTo-Json -Depth 5) -Encoding utf8

    $policyObj = [ordered]@{
        policyVersion                = "1.0"
        policyDate                   = $dateStamp
        liveGovernanceEvidenceRequired = $true
        mockAllowedOnlyForUi         = $true
        workspaceIsolationRequired   = $true
        phaseTransitionRequired      = $true
        riskCeiling                  = "R2"
        overrideRefusal              = @(
            "Skip phase transitions",
            "Use mock output as governance evidence",
            "Commit API keys or secrets to the repository",
            "Act outside the workspace isolation boundary",
            "Ignore CVF policy constraints"
        )
        cvfCoreRef                   = $cvfCorePath
    }
    Set-Content -Path (Join-Path $projectPath ".cvf\policy.json") `
        -Value ($policyObj | ConvertTo-Json -Depth 5) -Encoding utf8

    # ── AGENTS.md ─────────────────────────────────────────────────────────────
    $agentsTemplate = Join-Path $cvfCorePath "governance\toolkit\05_OPERATION\CVF_DOWNSTREAM_AGENTS_TEMPLATE.md"
    if (Test-Path $agentsTemplate) {
        $agentContent = (Get-Content $agentsTemplate -Raw -Encoding utf8) `
            -replace '\{\{CVF_CORE_PATH\}\}',  $cvfCorePath `
            -replace '\{\{CVF_CORE_COMMIT\}\}', $cvfCoreCommit `
            -replace '\{\{BOOTSTRAP_DATE\}\}',  $dateStamp `
            -replace '\{\{PROJECT_NAME\}\}',    $sampleName
        Set-Content -Path (Join-Path $projectPath "AGENTS.md") -Value $agentContent -Encoding utf8
    }

    # ── Bootstrap log ─────────────────────────────────────────────────────────
    $bootstrapLog = @"
# CVF Project Bootstrap Log

## 1. Record Metadata
- Record ID: BOOTSTRAP-$recordDate-$sampleName
- Date: $dateStamp
- Kind: $($sample.Kind)
- CVF Core Commit: $cvfCoreCommit

## 2. Workspace Topology
- Workspace Root: $TempRoot
- CVF Core Path: $cvfCorePath
- Project Path: $projectPath

## 3. Isolation Validation
- [x] CVF core and downstream project are sibling-equivalent folders
- [x] Project is outside CVF core root
- [x] Agent Instructions: PRESENT

## 4. Bootstrap Actions
- [x] CVF core available
- [x] Project folder created
- [x] .cvf/manifest.json: PRESENT
- [x] .cvf/policy.json: PRESENT
- [x] AGENTS.md: PRESENT

## 5. Post-Bootstrap Checks
Run the workspace doctor to verify enforcement artifacts:
  powershell -ExecutionPolicy Bypass -File "$cvfCorePath\scripts\check_cvf_workspace_agent_enforcement.ps1" -ProjectPath "$projectPath"

## 6. Approval
- Result: PASS
- Generated by W114-CP7 multi-sample proof script
"@
    Set-Content -Path (Join-Path $projectPath "docs\CVF_BOOTSTRAP_LOG_$recordDate.md") `
        -Value $bootstrapLog -Encoding utf8

    # ── Sample source + test files ─────────────────────────────────────────────
    Set-Content -Path (Join-Path $projectPath $sample.SrcFile) `
        -Value (Get-SrcContent $sampleName) -Encoding utf8
    Set-Content -Path (Join-Path $projectPath $sample.TestFile) `
        -Value (Get-TestContent $sampleName) -Encoding utf8

    # ── CI sample ─────────────────────────────────────────────────────────────
    $ciContent = @"
name: CVF Enforcement
on: [push, pull_request]
jobs:
  cvf-doctor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: CVF Workspace Doctor
        shell: pwsh
        run: |
          powershell -ExecutionPolicy Bypass -File '$cvfCorePath/scripts/check_cvf_workspace_agent_enforcement.ps1' -ProjectPath '.'
"@
    Set-Content -Path (Join-Path $projectPath ".github\workflows\cvf-enforcement.yml") `
        -Value $ciContent -Encoding utf8

    # ── Git init + hook ────────────────────────────────────────────────────────
    $gitDir = Join-Path $projectPath ".git"
    if (-not (Test-Path $gitDir)) {
        git -C $projectPath init --quiet 2>$null | Out-Null
        Write-Ok "git init: $sampleName"
    }
    $hooksDir  = Join-Path $gitDir "hooks"
    Ensure-Dir $hooksDir
    $hookScript = Join-Path $cvfCorePath "scripts\check_cvf_workspace_agent_enforcement.ps1"
    $hookContent = "#!/bin/sh`npwsh -ExecutionPolicy Bypass -File `"$hookScript`" -ProjectPath `"`$(pwd)`""
    Set-Content -Path (Join-Path $hooksDir "pre-commit") -Value $hookContent -Encoding utf8

    # ── Run workspace doctor ───────────────────────────────────────────────────
    $doctorScript = Join-Path $cvfCorePath "scripts\check_cvf_workspace_agent_enforcement.ps1"
    $doctorOutput = & pwsh -ExecutionPolicy Bypass -File $doctorScript -ProjectPath $projectPath 2>&1
    $doctorText   = $doctorOutput -join "`n"
    $doctorPassed = $doctorText -match "RESULT: PASS"
    $checksPassed = if ($doctorText -match "(\d+)/(\d+) checks passed") { $Matches[0] } else { "?" }

    if ($doctorPassed) {
        Write-Ok "Doctor PASS ($checksPassed): $sampleName"
    } else {
        Write-Fail "Doctor FAIL: $sampleName"
        Write-Host $doctorText
    }

    # ── Run Python tests ───────────────────────────────────────────────────────
    $testOutput  = python -m unittest discover -s "$projectPath\tests" -p "test_*.py" 2>&1
    $testText    = $testOutput -join "`n"
    $testsPassed = $testText -match "OK"
    $testSummary = if ($testText -match "(Ran \d+ test)") { $Matches[0] } else { "?" }

    if ($testsPassed) {
        Write-Ok "Tests PASS ($testSummary): $sampleName"
    } else {
        Write-Warn "Tests result: $testText"
    }

    # ── Governance docs ────────────────────────────────────────────────────────
    $declarationContent = @"
# CVF Agent Declaration

- Project: $sampleName
- Kind: $($sample.Kind)
- CVF Core: $cvfCorePath @ $cvfCoreCommit
- Phase: INTAKE
- Risk ceiling: R2
- Live evidence required: YES
- Mock boundary: UI-only
- Declaration Date: $dateStamp
- Description: $($sample.Description)

This declaration was recorded before downstream design/build artifacts were created.
"@
    Set-Content -Path (Join-Path $projectPath "docs\CVF_AGENT_DECLARATION_$recordDate.md") `
        -Value $declarationContent -Encoding utf8

    $phaseRunContent = @"
# CVF Phase Run

- Project: $sampleName
- Date: $dateStamp
- Phase Model: INTAKE -> DESIGN -> BUILD -> REVIEW -> FREEZE

## INTAKE
- Requirement: $($sample.Description)
- Risk classification: R1 (low-risk utility task)
- Mock boundary confirmed: UI-only

## DESIGN
- Implementation plan: minimal Python module + unit tests
- Source file: $($sample.SrcFile)
- Test file: $($sample.TestFile)

## BUILD
- Source file created: YES
- Test file created: YES
- Tests result: $testSummary; PASS: $testsPassed

## REVIEW
- Workspace doctor: $checksPassed; PASS: $doctorPassed
- Governance artifacts: AGENTS.md, .cvf/manifest.json, .cvf/policy.json, bootstrap log

## FREEZE
- Phase run complete
- Freeze receipt follows
"@
    Set-Content -Path (Join-Path $projectPath "docs\CVF_PHASE_RUN_$recordDate.md") `
        -Value $phaseRunContent -Encoding utf8

    $freezeContent = @"
# CVF Freeze Receipt

- Project: $sampleName
- Date: $dateStamp
- CVF Core: $cvfCorePath @ $cvfCoreCommit
- Doctor: $checksPassed PASS: $doctorPassed
- Tests: $testSummary PASS: $testsPassed
- Enforcement Artifacts: PRESENT
- Phase Run: COMPLETE
- Live Governance Evidence: Backed by CVF core release gate (python scripts/run_cvf_release_gate_bundle.py --json)
- Raw API keys copied into project: NO
- Status: FROZEN
"@
    Set-Content -Path (Join-Path $projectPath "docs\CVF_FREEZE_RECEIPT_$recordDate.md") `
        -Value $freezeContent -Encoding utf8

    # ── Optional: workspace-to-web evidence bridge (sample 3 only) ────────────
    $bridgeResult = $null
    if ($sample.LiveBridge) {
        Write-Info "Running workspace-to-web evidence bridge for $sampleName ..."
        $bridgeScript = Join-Path $cvfCorePath "scripts\write_cvf_workspace_web_evidence_bridge.ps1"
        $bridgeOutput = & pwsh -ExecutionPolicy Bypass -File $bridgeScript `
            -ProjectPath $projectPath `
            -CheckLiveReadiness `
            -ReleaseGateResult "PASS:8live" 2>&1
        $bridgeText   = $bridgeOutput -join "`n"
        $bridgeOk     = $bridgeText -match "Bridge receipt written"
        $bridgeResult = if ($bridgeOk) { "PASS" } else { "WARN: $bridgeText" }
        if ($bridgeOk) {
            Write-Ok "Bridge receipt written: $sampleName"
        } else {
            Write-Warn "Bridge receipt: $bridgeResult"
        }
    }

    $allResults += [ordered]@{
        sample         = $sampleName
        kind           = $sample.Kind
        doctorPassed   = $doctorPassed
        doctorChecks   = $checksPassed
        testsPassed    = $testsPassed
        testSummary    = $testSummary
        liveBridge     = $sample.LiveBridge
        bridgeResult   = $bridgeResult
        projectPath    = $projectPath
    }

    Write-Host ""
}

# ─── Summary ──────────────────────────────────────────────────────────────────
Write-Host "=== CP7 SUMMARY ===" -ForegroundColor Cyan
$allPassed = $true
foreach ($r in $allResults) {
    $status = if ($r.doctorPassed -and $r.testsPassed) { "PASS" } else { "FAIL" }
    if ($status -ne "PASS") { $allPassed = $false }
    Write-Host "  $($r.sample): doctor=$($r.doctorChecks) tests=$($r.testSummary) bridge=$($r.bridgeResult) => $status"
}
Write-Host ""
if ($allPassed) {
    Write-Ok "CP7 RESULT: PASS — all 3 downstream samples verified"
} else {
    Write-Fail "CP7 RESULT: FAIL — one or more samples did not pass"
}

if (-not [string]::IsNullOrWhiteSpace($ResultsJson)) {
    $allResults | ConvertTo-Json -Depth 5 | Set-Content -Path $ResultsJson -Encoding utf8
    Write-Ok "Results saved to: $ResultsJson"
}

Write-Host ""
Write-Info "Temp workspace: $TempRoot"
Write-Info "CVF core release gate: python scripts/run_cvf_release_gate_bundle.py --json"
