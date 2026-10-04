"""PLL-T1: disposable structural learning-home and explicit-upgrade proof.

No real project or provider calls. Bootstrap clones only a local public anchor,
then overlays the candidate through the existing hermetic helper. This is one
Local actor's validation, not an independent reviewer identity.
"""
from __future__ import annotations

import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.dont_write_bytecode = True
REPO = Path(__file__).resolve().parents[2]
LIB = REPO / "scripts/lib/downstream_governance"
sys.path.insert(0, str(LIB))
import cvf_dg_install as inst


class LearningHomeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="cvf-pll-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / "project"
        self.root.mkdir()
        self.home = self.root / inst.LEARNING_HOME

    def install(self, upgrade=False):
        return inst.install(self.root, LIB, REPO, "a" * 40, upgrade=upgrade)

    def tree(self):
        return {p.relative_to(self.root).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
                for p in self.root.rglob("*") if p.is_file()}

    def test_fresh_installs_pinned_templates_and_editable_home(self):
        self.assertEqual(self.install()["status"], "FRESH_INSTALLED")
        for name, source in inst.LEARNING_TEMPLATES.items():
            self.assertEqual((self.home / name).read_bytes(), (LIB / source).read_bytes())
        self.assertTrue(inst.verify_install(self.root, LIB, REPO, trusted=True).ok)

    def test_repeat_is_byte_idempotent(self):
        self.install()
        before = self.tree()
        self.assertEqual(self.install()["status"], "ALREADY_INSTALLED")
        self.assertEqual(before, self.tree())

    def test_preserves_project_readme_template_and_record(self):
        self.home.mkdir(parents=True)
        for name in [*inst.LEARNING_TEMPLATES, "local.md"]:
            (self.home / name).write_text("Project-owned " + name, encoding="utf-8")
        before = {p.name: p.read_bytes() for p in self.home.iterdir()}
        self.assertEqual(self.install()["status"], "FRESH_INSTALLED")
        self.assertEqual(self.install(upgrade=True)["status"], "UPGRADED")
        self.assertEqual(before, {p.name: p.read_bytes() for p in self.home.iterdir()})

    def test_missing_home_detected_without_implicit_repair(self):
        self.install()
        (self.home / "README.md").unlink()
        before = self.tree()
        self.assertIn("LEARNING_HOME_INCOMPLETE", {f.code for f in inst.verify_install(self.root, LIB).findings})
        self.assertEqual(self.install()["status"], "DRIFT_PRESERVED")
        self.assertEqual(before, self.tree())

    def test_empty_existing_readme_refuses_before_any_install_write(self):
        self.home.mkdir(parents=True)
        (self.home / "README.md").write_text("  \n", encoding="utf-8")
        before = self.tree()
        self.assertEqual(self.install()["status"], "BLOCKED_LEARNING_HOME")
        self.assertEqual(before, self.tree())

    def test_directory_conflict_refuses_before_writes(self):
        self.home.mkdir(parents=True)
        (self.home / "LEARNING_RECORD_TEMPLATE.md").mkdir()
        self.assertEqual(self.install()["status"], "BLOCKED_LEARNING_HOME")
        self.assertFalse((self.home / "README.md").exists())
        self.assertFalse((self.root / ".cvf/gate-profile.lock.json").exists())

    def test_ancestor_file_conflict_refuses(self):
        (self.root / "docs").write_text("keep", encoding="utf-8")
        self.assertEqual(self.install()["status"], "BLOCKED_LEARNING_HOME")
        self.assertEqual((self.root / "docs").read_text(), "keep")

    def test_missing_core_template_refuses_before_any_project_write(self):
        candidate = Path(self.temp.name) / "lib"
        shutil.copytree(LIB, candidate)
        (candidate / "project_learning_record.template.md").unlink()
        result = inst.install(self.root, candidate, REPO, "a" * 40)
        self.assertEqual(result["status"], "BLOCKED_CORE_SOURCE_MISSING")
        self.assertEqual(self.tree(), {})

    def test_old_profile_lock_requires_explicit_upgrade(self):
        self.install()
        lockpath = self.root / ".cvf/gate-profile.lock.json"
        lock = json.loads(lockpath.read_text())
        lock["profileId"] = "cvf.downstreamGateProfile@1.0.0"
        lock["profileVersion"] = "1.0.0"
        lockpath.write_text(json.dumps(lock), encoding="utf-8")
        shutil.rmtree(self.home)
        before = self.tree()
        self.assertEqual(self.install()["status"], "DRIFT_PRESERVED")
        self.assertEqual(before, self.tree())
        self.assertFalse(self.home.exists())
        self.assertEqual(self.install(upgrade=True)["status"], "UPGRADED")
        self.assertTrue(inst.verify_install(self.root, LIB, REPO, trusted=True).ok)

    def test_resolved_home_outside_project_refuses_and_preserves_external(self):
        outside = Path(self.temp.name) / "outside"
        outside.mkdir()
        sentinel = outside / "sentinel.txt"
        sentinel.write_text("unchanged", encoding="utf-8")
        self.home.parent.mkdir(parents=True)
        if os.name == "nt":
            # A directory junction needs no symlink privilege. Fixed tool-created paths only.
            command = "New-Item -ItemType Junction -Path $env:CVF_PLL_LINK -Target $env:CVF_PLL_TARGET | Out-Null"
            result = subprocess.run(["powershell", "-NoProfile", "-Command", command], capture_output=True, text=True,
                                    env={**os.environ, "CVF_PLL_LINK": str(self.home), "CVF_PLL_TARGET": str(outside)})
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.addCleanup(lambda: os.rmdir(self.home) if self.home.exists() else None)
        else:
            self.home.symlink_to(outside, target_is_directory=True)
        self.assertEqual(self.install()["status"], "BLOCKED_LEARNING_HOME")
        self.assertEqual({p.name for p in outside.iterdir()}, {"sentinel.txt"})
        self.assertEqual(sentinel.read_text(), "unchanged")

    def test_editable_home_not_mistaken_for_pinned_core_authority(self):
        self.install()
        (self.home / "README.md").write_text("Project index edited", encoding="utf-8")
        self.assertTrue(inst.verify_install(self.root, LIB, REPO, trusted=True).ok)
        pinned = self.root / "scripts/cvf_gates/project_learning_home.template.md"
        pinned.write_text("tamper", encoding="utf-8")
        self.assertIn("TRUSTED_MISMATCH", {f.code for f in inst.verify_install(self.root, LIB, REPO, trusted=True).findings})

    def test_fresh_bootstrap_catalog_discovery_repeat_and_legacy_catalog(self):
        if os.name != "nt":
            self.skipTest("Windows PowerShell bootstrap proof only")
        # Paths are passed as process arguments, never interpolated shell literals.
        script = Path(self.temp.name) / "bootstrap-probe.ps1"
        script.write_text(r'''param($Repo, $TempRoot)
$ErrorActionPreference = "Stop"
$env:PYTHONDONTWRITEBYTECODE = "1"
$env:GIT_CONFIG_COUNT = "1"
$env:GIT_CONFIG_KEY_0 = "http.proxy"
$env:GIT_CONFIG_VALUE_0 = "http://127.0.0.1:9"
$env:HTTP_PROXY = "http://127.0.0.1:9"
$env:HTTPS_PROXY = "http://127.0.0.1:9"
$env:ALL_PROXY = "http://127.0.0.1:9"
$env:GIT_TERMINAL_PROMPT = "0"
. (Join-Path $Repo "scripts/lib/downstream_catalog/CvfGoldenHarnessSupport.ps1")
$workspace = Join-Path $TempRoot "workspace"
$core = Join-Path $workspace ".Controlled-Vibe-Framework-CVF"
New-CvfHermeticCoreClone -SourceRepoPath $Repo -DestCorePath $core
$bootstrap = Join-Path $Repo "scripts/new-cvf-workspace.ps1"
& powershell -NoProfile -ExecutionPolicy Bypass -File $bootstrap -WorkspaceRoot $workspace -ProjectName "Probe"
if ($LASTEXITCODE -ne 0) { throw "fresh bootstrap failed" }
$project = Join-Path $workspace "Probe"
$learningProbeDir = Join-Path $project "docs/reviews/learnings"
if (-not (Test-Path (Join-Path $learningProbeDir "LEARNING_RECORD_TEMPLATE.md"))) { throw "learning template missing" }
$registry = Get-Content (Join-Path $project "docs/catalog/ARTIFACT_REGISTRY.json") -Raw | ConvertFrom-Json
if (@($registry.artifacts | Where-Object { $_.id -eq "family-learnings" -and $_.path -eq "docs/reviews/learnings" }).Count -ne 1) { throw "catalog discovery missing" }
foreach ($relative in @("docs/INDEX.md", "CVF_SESSION_MEMORY.md", "AGENTS.md")) {
    if ((Get-Content (Join-Path $project $relative) -Raw) -notmatch "docs/reviews/learnings") { throw "pointer missing: $relative" }
}
$readme = Join-Path $learningProbeDir "README.md"
[IO.File]::WriteAllText($readme, "Project-owned learning index")
& powershell -NoProfile -ExecutionPolicy Bypass -File $bootstrap -WorkspaceRoot $workspace -ProjectName "Probe"
if ($LASTEXITCODE -ne 0 -or [IO.File]::ReadAllText($readme) -ne "Project-owned learning index") { throw "repeat/preservation failed" }
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $project "scripts/manage_cvf_downstream_catalog.ps1") -ProjectRoot $project -Check
if ($LASTEXITCODE -ne 0) { throw "catalog check failed" }
# A legacy registry without the new optional family remains valid structurally.
$registry.artifacts = @($registry.artifacts | Where-Object { $_.id -ne "family-learnings" })
$registry | ConvertTo-Json -Depth 8 | Set-Content (Join-Path $project "docs/catalog/ARTIFACT_REGISTRY.json") -Encoding UTF8
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $project "scripts/manage_cvf_downstream_catalog.ps1") -ProjectRoot $project -Write
if ($LASTEXITCODE -ne 0) { throw "legacy catalog baseline unexpectedly broadened" }
Write-Output "PLL_BOOTSTRAP_DISCOVERY_PRESERVATION_LEGACY_PASS"
''', encoding="utf-8")
        result = subprocess.run(["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", str(script),
                                 "-Repo", str(REPO), "-TempRoot", self.temp.name],
                                stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding="utf-8", errors="replace", timeout=180)
        runtime = REPO / ".cvf/runtime/pll-bootstrap-2026-10-04.log"
        runtime.write_text(result.stdout, encoding="utf-8")
        self.assertEqual(result.returncode, 0, result.stdout[-8000:])
        self.assertIn("PLL_BOOTSTRAP_DISCOVERY_PRESERVATION_LEGACY_PASS", result.stdout)


if __name__ == "__main__":
    unittest.main()
