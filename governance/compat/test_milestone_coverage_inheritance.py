"""Real installed runner and genuine historical1.1 upgrade, disposable workspaces."""
import copy
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.dont_write_bytecode = True
from test_downstream_gate_profile import make_project, LIB, REPO, inst, PROFILE
from test_milestone_coverage import fixture, block, write

OLD_CORE = "50b6f8d94a26d8b1014bb00f31d3493616ce9fdd"
ENV = {**os.environ, "PYTHONDONTWRITEBYTECODE": "1"}


def run(*args, cwd=None):
    return subprocess.run(list(args), cwd=cwd, env=ENV, capture_output=True,
                          text=True, encoding="utf-8", errors="replace", timeout=45)


class InheritanceTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="cvf-milestone-inherit-")
        self.addCleanup(self.tmp.cleanup)
        self.base = Path(self.tmp.name)
        self.root = self.base / "project"
        self.root.mkdir()
        make_project(self.root)

    def install(self):
        result = inst.install(self.root, LIB, REPO, OLD_CORE)
        self.assertEqual(result["status"], "FRESH_INSTALLED", result)

    def invoke(self, packet=None):
        args = [sys.executable, "-B", str(self.root / "scripts/cvf_gates/cvf_downstream_gate_runner.py"),
                "run", "--phase", "reviewer-fast", "--project-root", str(self.root), "--json", "--no-receipt"]
        if packet:
            args += ["--packet", packet]
        result = run(*args)
        self.assertTrue(result.stdout.strip().startswith("{"), result.stdout + result.stderr)
        data = json.loads(result.stdout)
        cov = next(r for r in data["results"] if r["controlId"] == "CVF-DG-COV-01")
        return result, cov

    def test_fresh_installed_runner_and_missing_row_refusal(self):
        self.install()
        lock = json.loads((self.root / ".cvf/gate-profile.lock.json").read_text())
        self.assertEqual(lock["profileId"], "cvf.downstreamGateProfile@1.2.0")
        data = fixture(self.root)
        packet = "docs/reviews/coverage.md"
        write(self.root, packet, block(data))
        result, cov = self.invoke(packet)
        self.assertEqual(result.returncode, 0, result.stdout)
        self.assertEqual(cov["outcome"], "PASS")
        data["rows"].pop()
        write(self.root, packet, block(data))
        result, cov = self.invoke(packet)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("COV_CRITERION_SET_MISMATCH", [x["code"] for x in cov["findings"]])

    def test_fresh_empty_intake_is_not_coverage_pass(self):
        self.install()
        result, cov = self.invoke()
        self.assertEqual(result.returncode, 0, result.stdout)
        self.assertEqual(cov["outcome"], "NOT_APPLICABLE_WITH_REASON")

    def test_fresh_discovery_then_local_scope_admission(self):
        self.install()
        data = fixture(self.root)
        registry = self.root / "docs/milestone-coverage-authority.json"
        registry.unlink()  # Owned disposable fixture: install creates no project authority.
        data.update(authority=None, rows=[])
        data["action"].update(kind="VERIFY", selected=[], question="locate approved scope", sourceBoundary="operator roadmap")
        packet = "docs/reviews/first-admission.md"
        write(self.root, packet, block(data))
        result, cov = self.invoke(packet)
        self.assertEqual(result.returncode, 0, result.stdout)
        self.assertEqual(cov["outcome"], "PASS")
        data = fixture(self.root)  # Simulated Local declaration, not inferred operator consent.
        write(self.root, packet, block(data))
        result, cov = self.invoke(packet)
        self.assertEqual(result.returncode, 0, result.stdout)
        self.assertEqual(cov["outcome"], "PASS")

    def test_active_unchanged_order_rechecks_bound_source(self):
        self.install()
        data = fixture(self.root)
        packet = "docs/work_orders/active.md"
        write(self.root, packet, "Status: READY\n" + block(data))
        state = json.loads((self.root / "IMPLEMENTATION_STATUS.json").read_text())
        state["activeWorkOrders"] = [packet]
        write(self.root, "IMPLEMENTATION_STATUS.json", json.dumps(state))
        # Other gates may reject this intentionally minimal order; COV must still run.
        _, cov = self.invoke()
        self.assertEqual(cov["outcome"], "PASS")
        source = self.root / data["authority"]["path"]
        source.write_text(source.read_text().replace("usable preview", "different acceptance"))
        _, cov = self.invoke()
        self.assertIn("COV_AUTHORITY_STALE", [x["code"] for x in cov["findings"]])

    def test_missing_roadmap_coverage(self):
        self.install()
        fixture(self.root)
        result, cov = self.invoke("docs/roadmaps/criteria.md")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("COV_BLOCK_REQUIRED", [x["code"] for x in cov["findings"]])

    def test_archived_active_order_and_invalid_encoding_refused(self):
        self.install()
        state = json.loads((self.root / "IMPLEMENTATION_STATUS.json").read_text())
        state["activeWorkOrders"] = ["docs/work_orders/archive/old.md"]
        write(self.root, "IMPLEMENTATION_STATUS.json", json.dumps(state))
        _, cov = self.invoke()
        self.assertIn("COV_ACTIVE_INPUT_INVALID", [x["code"] for x in cov["findings"]])
        state["activeWorkOrders"] = []
        write(self.root, "IMPLEMENTATION_STATUS.json", json.dumps(state))
        write(self.root, "docs/reviews/invalid.md", "placeholder")
        (self.root / "docs/reviews/invalid.md").write_bytes(b"\xff")
        _, cov = self.invoke("docs/reviews/invalid.md")
        self.assertIn("COV_INVALID_INPUT:UnicodeDecodeError", [x["code"] for x in cov["findings"]])

    def old_install(self):
        old = self.base / "old-core"
        def materialize(path):
            result = subprocess.run(["git", "show", f"{OLD_CORE}:{path}"], cwd=REPO, capture_output=True, timeout=30)
            self.assertEqual(result.returncode, 0, result.stderr)
            target = old / path
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(result.stdout)
        prefix = "scripts/lib/downstream_governance/"
        materialize(prefix + "cvf_downstream_gate_profile.json")
        profile = json.loads((old / prefix / "cvf_downstream_gate_profile.json").read_text())
        self.assertEqual(profile["profileId"], "cvf.downstreamGateProfile@1.1.0")
        for name in profile["installedFiles"]:
            materialize(profile.get("coreSources", {}).get(name, prefix + name))
        materialize(prefix + "downstream_pr_gates.yml.template")
        result = run(sys.executable, "-B", str(old / prefix / "cvf_downstream_gate_runner.py"),
                     "install", "--project-root", str(self.root), "--core-root", str(old), "--core-commit", OLD_CORE)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_genuine_11_explicit_upgrade_retains_project_and_updates_generated_ci(self):
        self.old_install()
        write(self.root, "docs/roadmaps/project-owned.md", "Owned roadmap: untouched by installer")
        protected = ["docs/roadmaps/project-owned.md", "CVF_SESSION_MEMORY.md", "IMPLEMENTATION_STATUS.json",
                     "docs/reviews/learnings/README.md"]
        before = {p: (self.root / p).read_bytes() for p in protected}
        old_lock = (self.root / ".cvf/gate-profile.lock.json").read_bytes()
        refused = inst.install(self.root, LIB, REPO, OLD_CORE)
        self.assertEqual(refused["status"], "DRIFT_PRESERVED")
        self.assertEqual((self.root / ".cvf/gate-profile.lock.json").read_bytes(), old_lock)
        upgraded = inst.install(self.root, LIB, REPO, OLD_CORE, upgrade=True)
        self.assertEqual(upgraded["status"], "UPGRADED", upgraded)
        self.assertTrue(inst.verify_install(self.root, LIB, REPO, trusted=True).ok)
        for p, content in before.items():
            self.assertEqual((self.root / p).read_bytes(), content, p)
        lock = json.loads((self.root / ".cvf/gate-profile.lock.json").read_text())
        workflow = (self.root / ".github/workflows/cvf-downstream-gates.yml").read_text()
        self.assertTrue(all(lock[k] in workflow for k in ("profileSha256", "runnerSha256", "bundleSha256")))
        self.assertEqual(inst.install(self.root, LIB, REPO, OLD_CORE)["status"], "ALREADY_INSTALLED")
        data = fixture(self.root)
        write(self.root, "docs/reviews/coverage.md", block(data))
        result, cov = self.invoke("docs/reviews/coverage.md")
        self.assertEqual(result.returncode, 0, result.stdout)
        self.assertEqual(cov["outcome"], "PASS")

    def test_upgrade_preserves_edited_ci_and_reports_required_reconciliation(self):
        self.old_install()
        workflow = self.root / ".github/workflows/cvf-downstream-gates.yml"
        edited = workflow.read_bytes() + b"\n# project-owned change\n"
        workflow.write_bytes(edited)
        result = inst.install(self.root, LIB, REPO, OLD_CORE, upgrade=True)
        self.assertEqual(result["status"], "UPGRADED_CI_RECONCILIATION_REQUIRED")
        self.assertEqual(workflow.read_bytes(), edited)
        findings = inst.verify_install(self.root, LIB, REPO, trusted=True).findings
        self.assertIn("CI_OWNER_RECONCILIATION_REQUIRED", [x.code for x in findings])

    def test_tampered_installed_validator_refused(self):
        self.install()
        target = self.root / "scripts/cvf_gates/cvf_milestone_coverage.py"
        target.write_bytes(target.read_bytes() + b"\n# drift\n")
        findings = inst.verify_install(self.root, LIB, REPO, trusted=True).findings
        self.assertIn("FILE_TAMPERED", [x.code for x in findings])


if __name__ == "__main__":
    unittest.main()
