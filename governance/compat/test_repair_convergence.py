"""Declared repair-chain admission through Core and the installed portable runner."""
import copy
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from test_milestone_coverage import cov, fixture, block, write
from test_downstream_gate_profile import make_project, inst, LIB, REPO
import milestone_coverage_admission as core


def git(root, *args):
    p = subprocess.run(["git", "-C", str(root), *args], capture_output=True,
                       text=True, encoding="utf-8", errors="replace", timeout=15)
    if p.returncode:
        raise AssertionError(p.stderr)
    return p.stdout.strip()


class RepairTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="cvf-repair-")
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.data = fixture(self.root)
        self.packet = "docs/reviews/repair.md"
        write(self.root, self.packet, block(self.data))
        self.fact = self.put("docs/evidence/observed.json", {"observed": "same outcome still unmet"})
        self.attempt = dict(schemaVersion="cvf.repairAttempt@1.0.0", milestoneId="M1",
                            criterionIds=["H01"], trancheId="repair-first", activity="REPAIR",
                            result="UNMET", proofState="STATIC_FIX_VERIFIED", elapsedMinutes=7,
                            evidence=[self.fact])
        self.ref = self.put("docs/evidence/attempt.json", self.attempt)
        self.registry = json.loads((self.root / cov.AUTHORITY_REGISTRY).read_text())
        self.registry.update(schemaVersion="cvf.milestoneAuthority@1.1.0",
                             repairControls={"M1": dict(history=[self.ref], affectedCriteria=["H01"], audit=None)})
        self.save_registry()

    def put(self, path, value):
        write(self.root, path, json.dumps(value, indent=2))
        return dict(path=path, sha256=cov.digest((self.root / path).read_bytes()))

    def save_registry(self):
        write(self.root, cov.AUTHORITY_REGISTRY, json.dumps(self.registry))

    def result(self):
        write(self.root, self.packet, block(self.data))
        return cov.validate_file(self.root, self.packet)

    def audit(self, **changes):
        write(self.root, self.packet, block(self.data))
        a = dict(schemaVersion="cvf.repairChainAssessment@1.0.0", milestoneId="M1",
                 history=self.registry["repairControls"]["M1"]["history"], affectedCriteria=["H01"],
                 failureBoundary="identity guard before native binding", observedEvidence=[self.fact],
                 causeStatus="HYPOTHESIS", causeOrHypothesis="separator representation rejects same executable",
                 remainingChain=["validate identity", "bind app", "run actual acceptance and cleanup"],
                 discriminator=dict(question="does the recorded actual path pass normalization?",
                                    expected="same executable accepted; different executable refused", budgetMinutes=10),
                 correctiveAction="normalize identity at adapter boundary and preserve unverified launch evidence",
                 owner="Local", cumulativeMinutes=7, additionalCeilingMinutes=10,
                 stopCondition="stop at the first unexplained failure", reopenCondition="new exact evidence",
                 disposition="REPAIR_ADMITTED",
                 admittedAction=dict(kind="IMPLEMENT", selected=["H01"], owner="worker", output="preview proof",
                                     packet=dict(path=self.packet, sha256=cov.digest((self.root / self.packet).read_bytes()))),
                 review=dict(reviewer="independent Local", decision="ACCEPTED", evidence=[self.fact]))
        a.update(changes)
        self.registry["repairControls"]["M1"]["audit"] = self.put("docs/evidence/audit.json", a)
        self.save_registry()
        return a

    def init_git(self):
        git(self.root, "init", "-q")
        git(self.root, "config", "user.email", "fixture@example.invalid")
        git(self.root, "config", "user.name", "Disposable fixture")
        git(self.root, "add", ".")
        git(self.root, "commit", "-qm", "fixture baseline")
        return git(self.root, "rev-parse", "HEAD")

    def test_first_failed_repair_requires_audit_without_packet_opt_in(self):
        self.assertIn("COV_REPAIR_AUDIT_REQUIRED", self.result())
        self.data["action"]["owner"] = "different model and tranche"
        self.assertIn("COV_REPAIR_AUDIT_REQUIRED", self.result())

    def test_pinned_reviewed_audit_admits_only_exact_successor(self):
        self.audit()
        self.assertEqual(self.result(), [])
        self.packet = "docs/reviews/renamed-successor.md"
        self.assertIn("COV_REPAIR_PACKET_MISMATCH", self.result())

    def test_wrong_outcome_stale_audit_and_history_are_rejected(self):
        self.audit(milestoneId="M2")
        self.assertIn("COV_REPAIR_AUDIT_HISTORY_MISMATCH", self.result())
        self.audit(history=[])
        self.assertIn("COV_REPAIR_AUDIT_HISTORY_MISMATCH", self.result())
        self.audit()
        write(self.root, "docs/evidence/audit.json", "{}")
        self.assertIn("COV_EVIDENCE_STALE", self.result())

    def test_cost_reset_and_unmeasured_history_are_not_fabricated(self):
        self.audit(cumulativeMinutes=0)
        self.assertIn("COV_REPAIR_COST_RESET", self.result())
        self.attempt["elapsedMinutes"] = "UNKNOWN"
        self.registry["repairControls"]["M1"]["history"] = [self.put("docs/evidence/attempt.json", self.attempt)]
        self.audit(cumulativeMinutes=7)
        self.assertIn("COV_REPAIR_COST_RESET", self.result())
        self.audit(cumulativeMinutes="UNKNOWN")
        self.assertEqual(self.result(), [])

    def test_finite_assessment_gathering_and_independent_work_remain_possible(self):
        self.data["action"].update(kind="VERIFY", question="locate failed boundary", sourceBoundary="named receipt")
        self.assertEqual(self.result(), [])
        self.data = fixture(self.root)
        self.save_registry()
        self.data["action"]["selected"] = ["H02"]
        self.assertIn("COV_REPAIR_INDEPENDENCE_REQUIRED", self.result())
        self.data["rows"][0]["independence"] = dict(reviewer="Local", reason="separate consumer and no shared prerequisite", evidence=[self.fact])
        self.assertEqual(self.result(), [])

    def test_blocked_needs_no_fabricated_action_and_does_not_admit_retry(self):
        self.audit(disposition="BLOCKED", admittedAction=None, discriminator=None, additionalCeilingMinutes=0)
        self.assertIn("COV_REPAIR_SUCCESSOR_HELD", self.result())

    def test_diagnostic_packet_binds_question_and_budget(self):
        question = "does the recorded actual path pass normalization?"
        self.data["action"].update(kind="VERIFY", question=question, sourceBoundary="recorded metadata")
        a = self.audit()
        a["admittedAction"]["kind"] = "VERIFY"
        self.audit(disposition="DIAGNOSTIC_ONLY", admittedAction=a["admittedAction"])
        self.assertEqual(self.result(), [])
        self.data["action"]["budgetMinutes"] = 11
        a = self.audit()
        a["admittedAction"]["kind"] = "VERIFY"
        self.audit(disposition="DIAGNOSTIC_ONLY", admittedAction=a["admittedAction"])
        self.assertIn("COV_REPAIR_BUDGET_EXCEEDED", self.result())

    def test_static_fix_cannot_resolve_but_full_flow_record_releases_repair_constraint(self):
        resolved = {**self.attempt, "trancheId": "integrated-repair", "result": "MET"}
        self.registry["repairControls"]["M1"]["history"].append(self.put("docs/evidence/resolution.json", resolved))
        self.save_registry()
        self.assertIn("COV_REPAIR_STATIC_NOT_RESOLUTION", self.result())
        resolved["proofState"] = "FULL_FLOW_VERIFIED"
        self.registry["repairControls"]["M1"]["history"][-1] = self.put("docs/evidence/resolution.json", resolved)
        self.save_registry()
        self.assertEqual(self.result(), [])

    def test_registry_only_erasure_and_history_rewrite_fail_core_admission(self):
        self.init_git()
        self.registry["repairControls"] = {}
        self.save_registry()
        issues = core.collect_coverage_violations(self.root, [cov.AUTHORITY_REGISTRY])
        self.assertIn("COV_REPAIR_ENROLLMENT_ERASED", issues[0]["issues"])

    def test_pre_enrollment_ancestor_cannot_bypass_head_history(self):
        registered = copy.deepcopy(self.registry)
        self.registry["repairControls"] = {}; self.save_registry()
        old = self.init_git()
        self.registry = registered; self.save_registry()
        git(self.root, "add", cov.AUTHORITY_REGISTRY); git(self.root, "commit", "-qm", "enroll failure")
        self.registry["repairControls"] = {}; self.save_registry()
        self.assertIn("COV_REPAIR_ENROLLMENT_ERASED", cov.validate_repair_transition(self.root, old))

    def test_invalid_explicit_base_cannot_erase_enrollment(self):
        self.init_git()
        self.registry["repairControls"] = {}; self.save_registry()
        self.assertIn("COV_REPAIR_BASE_REQUIRED", cov.validate_repair_transition(self.root, "missing-ref"))

    def test_registry_deletion_and_prefix_reset_fail(self):
        self.init_git()
        self.registry["repairControls"]["M1"]["history"] = []; self.save_registry()
        self.assertIn("COV_REPAIR_HISTORY_RESET", cov.validate_repair_transition(self.root))
        (self.root / cov.AUTHORITY_REGISTRY).unlink()
        self.assertIn("COV_REPAIR_ENROLLMENT_ERASED", cov.validate_repair_transition(self.root))

    def test_static_success_rows_cannot_override_unresolved_repair_history(self):
        self.data["phase"] = "REVIEW"; self.data["action"]["kind"] = "REVIEW"
        for row in self.data["rows"]:
            row.update(state="VERIFIED", evidence=[self.fact])
        self.data["conclusions"].update(product="COMPLETE", acceptance=[self.fact])
        self.assertIn("COV_REPAIR_UNRESOLVED_PRODUCT", self.result())

    def test_missing_enrollment_base_and_malformed_registry_fail_closed(self):
        self.assertIn("COV_REPAIR_BASE_REQUIRED", cov.validate_repair_transition(self.root))
        for malformed in ("[]", "null"):
            write(self.root, cov.AUTHORITY_REGISTRY, malformed)
            self.assertIn("COV_AUTHORITY_REGISTRY", cov.validate_repair_transition(self.root))

    def test_core_active_order_and_installed_runner_refuse_then_accept(self):
        make_project(self.root)
        self.init_git()
        install = inst.install(self.root, LIB, REPO, git(REPO, "rev-parse", "HEAD"))
        self.assertEqual(install["status"], "FRESH_INSTALLED", install)
        write(self.root, "CVF_SESSION/ACTIVE_SESSION_BOOTSTRAP_READ_MODEL.json",
              json.dumps({"currentAuthority": {"workOrderPath": "docs/work_orders/repair.md"}}))
        self.packet = "docs/work_orders/repair.md"
        # Required DISPATCH packet is source evidence; unrelated WO shape gates stay independent.
        self.result()
        self.assertTrue(any("COV_REPAIR_AUDIT_REQUIRED" in x["issues"] for x in core.collect_coverage_violations(self.root, [])))
        runner = self.root / "scripts/cvf_gates/cvf_downstream_gate_runner.py"
        def invoke():
            result = subprocess.run([sys.executable, "-B", str(runner), "run", "--phase", "reviewer-fast",
                                     "--project-root", str(self.root), "--packet", self.packet, "--json", "--no-receipt"],
                                    capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=45)
            report = json.loads(result.stdout)
            return next(x for x in report["results"] if x["controlId"] == "CVF-DG-COV-01")
        self.assertIn("COV_REPAIR_AUDIT_REQUIRED", [x["code"] for x in invoke()["findings"]])
        self.audit()
        actual = invoke()
        self.assertEqual(actual["outcome"], "PASS", actual)
        self.assertEqual(core.collect_coverage_violations(self.root, []), [])


if __name__ == "__main__":
    unittest.main()
