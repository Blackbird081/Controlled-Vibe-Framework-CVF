"""Platform-neutral tests for the portable downstream gate profile (CVF-DGIP-T1 and R1).
Hermetic: disposable temp projects only; no real project, network or bytecode."""

from __future__ import annotations

import sys

sys.dont_write_bytecode = True

import importlib.util
import json
import os
import re
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest import mock

REPO = Path(__file__).resolve().parents[2]
LIB = REPO / "scripts" / "lib" / "downstream_governance"
DOCS = REPO / "docs" / "reference" / "downstream_gate_profile"
CORE_COMPAT = REPO / "governance" / "compat"
sys.path.insert(0, str(LIB))

import cvf_dg_applicability as appl  # noqa: E402
import cvf_dg_common as common  # noqa: E402
import cvf_dg_continuity as cont  # noqa: E402
import cvf_dg_coverage as cov  # noqa: E402
import cvf_dg_install as inst  # noqa: E402
import cvf_dg_intake as intake  # noqa: E402
import cvf_dg_review as review  # noqa: E402
import cvf_dg_routing as routing  # noqa: E402

PROFILE = inst.load_profile(LIB)
CONTRACT = PROFILE["continuityContract"]["id"]
NEXT_MOVE = "Complete INTAKE: record intent, context, constraints, risk, authority, and acceptance boundary."
HANDOFF = "CVF_SESSION/handoffs/AGENT_HANDOFF_V1_2026-10-03.md"
SHA40 = "a" * 40
ENV = {**os.environ, "PYTHONDONTWRITEBYTECODE": "1"}


def write(path: Path, text: str, newline: str = "\n") -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(text.replace("\n", newline).encode("utf-8"))


def make_project(root: Path, newline: str = "\n", mode: str = "INTAKE", phase: str = "INTAKE", memory_mode: str | None = None,
                 memory_phase: str | None = None, impl_phase: str | None = None, handoff_mode: str | None = None,
                 handoff_phase: str | None = None, handoff_status: str = "Status: ACTIVE", work_orders: list | None = None) -> Path:
    state = {"schemaVersion": "1.0", "continuityContract": CONTRACT, "projectName": "Probe", "currentMode": mode, "activePhase": phase,
             "phaseModel": list(PROFILE["continuityContract"]["phaseModel"]), "activeHandoff": HANDOFF, "nextAllowedMove": NEXT_MOVE,
             "parkedOperatorCheckpoint": None, "activeRole": "ORCHESTRATOR", "roleRoute": "SINGLE_AGENT_MULTI_ROLE_ALLOWED", "updatedAt": "2026-10-03"}
    write(root / "CVF_SESSION/ACTIVE_SESSION_STATE.json", json.dumps(state, indent=2), newline)
    write(root / "IMPLEMENTATION_STATUS.json", json.dumps({
        "schemaVersion": "1.0", "projectName": "Probe", "overallStatus": "BOOTSTRAPPED", "currentPhase": impl_phase or phase,
        "completedCapabilities": [], "activeWorkOrders": work_orders or [], "knownLimitations": ["x"], "evidence": [], "updatedAt": "2026-10-03"}, indent=2), newline)
    write(root / "CVF_SESSION_MEMORY.md", "# Project Session Memory\n\n## Current Truth\n\n"
          f"- Contract: {CONTRACT}\n- Current mode: {memory_mode or mode}\n- Active phase: {memory_phase or phase}\n- Active handoff: {HANDOFF}\n\n## Startup Order\n", newline)
    write(root / HANDOFF, f"# Agent Handoff V1\n\n{handoff_status}\n\n## Current State\n\n- Project: Probe\n"
          f"- Current mode: {handoff_mode or mode}\n- Active phase: {handoff_phase or phase}\n- Active role: ORCHESTRATOR\n"
          f"- Next allowed move: {NEXT_MOVE}\n- Parked operator checkpoint: none\n\n## Completed\n", newline)
    return root


def codes(result) -> set[str]:
    return {f.code for f in result.findings}


def cli(runner: Path, cwd: Path, *args: str, **env: str) -> subprocess.CompletedProcess:
    return subprocess.run([sys.executable, "-B", str(runner), *args], cwd=cwd, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, env={**ENV, **env})


def pins(root: Path, bundle: bool = True) -> list[str]:
    lock = json.loads((root / ".cvf/gate-profile.lock.json").read_text(encoding="utf-8"))
    out = ["--expect-profile-sha256", lock["profileSha256"], "--expect-runner-sha256", lock["runnerSha256"]]
    return out + (["--expect-bundle-sha256", lock["bundleSha256"]] if bundle else [])


class Tmp(unittest.TestCase):
    def setUp(self) -> None:
        self._dir = tempfile.TemporaryDirectory(prefix="cvf-dg-unit-")
        self.root = Path(self._dir.name) / "project"
        self.root.mkdir()
        self.addCleanup(self._dir.cleanup)


class ProfileContractTests(unittest.TestCase):
    def test_profile_is_internally_consistent(self) -> None:
        ids = [c["id"] for c in PROFILE["controls"]]
        self.assertEqual(len(ids), len(set(ids)))
        self.assertIn("reviewer-fast", PROFILE["phases"])
        for control in PROFILE["controls"]:
            self.assertTrue(control["mandatory"] and (LIB / f"{control['module']}.py").is_file(), control["id"])
            self.assertTrue(set(control["phases"]) <= set(PROFILE["phases"]))
            if control["id"] != "CVF-DG-INST-01" and control["id"] != "CVF-DG-CONT-01":
                self.assertIn("reviewer-fast", control["phases"], control["id"])
        for name in PROFILE["installedFiles"]:
            source = REPO / PROFILE["coreSources"][name] if name in PROFILE["coreSources"] else LIB / name
            self.assertTrue(source.is_file() and source.stat().st_size > 0, name)
    def test_schemas_agree_with_profile(self) -> None:
        schema = json.loads((DOCS / "downstream_gate_profile.schema.json").read_text(encoding="utf-8"))
        self.assertEqual(schema["properties"]["phases"]["items"]["enum"], PROFILE["phases"])
        self.assertEqual(schema["properties"]["claimStates"]["items"]["enum"], PROFILE["claimStates"])
        record = json.loads((DOCS / "downstream_finding_intake.schema.json").read_text(encoding="utf-8"))
        self.assertEqual(record["properties"]["defectClass"]["enum"], PROFILE["intake"]["defectClasses"])
        self.assertEqual(record["properties"]["acceptance"]["enum"], PROFILE["intake"]["acceptanceStates"])
        self.assertEqual(record["properties"]["parentDisposition"]["enum"], PROFILE["intake"]["parentDispositions"])
        self.assertEqual(set(record["required"]) - {"schemaVersion", "profileId", "parentOwner", "acceptance", "parentDisposition",
                                                    "parentLinks", "sourceClaimStatus", "contentSha256"}, set(intake.INPUT_FIELDS))
        self.assertEqual(set(json.loads((DOCS / "DOWNSTREAM_FINDING_INTAKE_TEMPLATE.json").read_text(encoding="utf-8"))), set(intake.INPUT_FIELDS))
    def test_parent_tokens_match_profile(self) -> None:
        standard = (REPO / "docs/reference/review_cost_control/CVF_REVIEW_COST_AND_DIMINISHING_RETURN_CONTROL_STANDARD.md").read_text(encoding="utf-8")
        checker = (CORE_COMPAT / "check_review_cost_control.py").read_text(encoding="utf-8")
        f2g = (REPO / PROFILE["intake"]["parentOwner"]).read_text(encoding="utf-8")
        for token in PROFILE["reviewerRouting"]["allowedBoundaries"]:
            self.assertTrue(token in standard and token in checker, token)
        for token in PROFILE["intake"]["defectClasses"] + PROFILE["intake"]["learningLanes"]:
            self.assertIn(token, f2g, token)
    def test_new_files_obey_size_budget(self) -> None:
        for family in (LIB, DOCS):
            files = [p for p in family.iterdir() if p.is_file()]
            self.assertLessEqual(len(files), 16, family)
            for path in files:
                self.assertLessEqual(len(path.read_text(encoding="utf-8").splitlines()), 600, path.name)
    def test_bootstrap_content_projects_the_pinned_contract(self) -> None:
        content = (REPO / "scripts/lib/downstream_catalog/CvfDownstreamBootstrapContent.ps1").read_text(encoding="utf-8")
        for needle in (CONTRACT, "## Current Truth", NEXT_MOVE):
            self.assertIn(needle, content)
        for key in PROFILE["continuityContract"]["stateRequired"]:
            self.assertTrue(re.search(rf"(?m)^\s*{key}\s*=", content), key)


class ContinuityTests(Tmp):
    def run_cont(self):
        return cont.check_continuity(self.root, PROFILE, CORE_COMPAT)
    def test_positive_control_lf_crlf_and_bom(self) -> None:
        for newline in ("\n", "\r\n"):
            make_project(self.root, newline)
            self.assertEqual(self.run_cont().outcome, "PASS", newline)
        state_path = self.root / "CVF_SESSION/ACTIVE_SESSION_STATE.json"
        state_path.write_bytes(b"\xef\xbb\xbf" + state_path.read_bytes())
        self.assertEqual(self.run_cont().outcome, "PASS")
    def test_review_pending_maps_to_review_phase_only(self) -> None:
        make_project(self.root, mode="REVIEW_PENDING", phase="REVIEW")
        self.assertEqual(self.run_cont().outcome, "PASS")
        make_project(self.root, mode="REVIEW_PENDING", phase="REVIEW", memory_phase="WORK_ORDER", impl_phase="WORK_ORDER")
        result = self.run_cont()
        self.assertIn("SURFACE_MISMATCH", codes(result))
        self.assertTrue(any("IMPLEMENTATION_STATUS.json#/currentPhase" in f.message for f in result.findings))
        make_project(self.root, mode="REVIEW_PENDING", phase="BUILD")
        self.assertIn("MODE_PHASE_MISMATCH", codes(self.run_cont()))
    def test_each_truth_surface_drift_has_a_field_locator(self) -> None:
        for kwargs in (dict(memory_mode="BUILD"), dict(memory_phase="DESIGN"), dict(impl_phase="SPEC"), dict(handoff_mode="REVIEW"), dict(handoff_phase="FREEZE")):
            make_project(self.root, **kwargs)
            result = self.run_cont()
            self.assertIn("SURFACE_MISMATCH", codes(result), kwargs)
            self.assertTrue(all(f.locator for f in result.findings), kwargs)
    def test_next_move_pointer_and_conflicting_handoff(self) -> None:
        make_project(self.root)
        handoff = self.root / HANDOFF
        write(handoff, handoff.read_text(encoding="utf-8").replace(NEXT_MOVE, "Something else entirely."))
        self.assertIn("SURFACE_MISMATCH", codes(self.run_cont()))
        make_project(self.root)
        write(self.root / "CVF_SESSION/handoffs/AGENT_HANDOFF_V2.md", "Status: ACTIVE\n")
        self.assertIn("CONFLICTING_ACTIVE_HANDOFF", codes(self.run_cont()))
    def test_missing_duplicate_and_unknown_fields_fail(self) -> None:
        make_project(self.root)
        memory = self.root / "CVF_SESSION_MEMORY.md"
        text = memory.read_text(encoding="utf-8")
        for body, code in ((text.replace("- Active phase: INTAKE\n", ""), "MISSING_FIELD"),
                           (text.replace("- Active phase: INTAKE\n", "- Active phase: INTAKE\n- Active phase: INTAKE\n"), "DUPLICATE_FIELD"),
                           (text.replace("- Active phase: INTAKE\n", "- Active phase: INTAKE\n- Surprise: x\n"), "UNKNOWN_FIELD"),
                           (text + "\n## Current Truth\n\n- Contract: x\n", "DUPLICATE_SECTION")):
            write(memory, body)
            self.assertIn(code, codes(self.run_cont()))
        make_project(self.root)
        state_path = self.root / "CVF_SESSION/ACTIVE_SESSION_STATE.json"
        data = json.loads(state_path.read_text(encoding="utf-8"))
        write(state_path, json.dumps({**data, "rogueKey": 1}))
        self.assertIn("UNKNOWN_FIELD", codes(self.run_cont()))
        write(state_path, json.dumps({**data, "x-project-note": "extensions are allowed"}))
        self.assertEqual(self.run_cont().outcome, "PASS")
        write(state_path, state_path.read_text(encoding="utf-8").replace('"currentMode"', '"currentMode": "INTAKE", "currentMode"', 1))
        self.assertEqual(self.run_cont().outcome, "FAIL")
    def test_legacy_state_without_contract_is_migration_required_not_pass(self) -> None:
        make_project(self.root)
        state_path = self.root / "CVF_SESSION/ACTIVE_SESSION_STATE.json"
        write(state_path, json.dumps({k: v for k, v in json.loads(state_path.read_text(encoding="utf-8")).items() if k != "continuityContract"}))
        before, result = state_path.read_bytes(), self.run_cont()
        self.assertEqual(result.outcome, "BLOCKED_MIGRATION_REQUIRED")
        self.assertFalse(result.ok)
        self.assertEqual(before, state_path.read_bytes(), "never rewritten")
    def test_f05_handoff_status_must_be_exactly_one_valid_active_declaration(self) -> None:
        for status, code in (("Status: ACTIVE\nStatus: ARCHIVED", "HANDOFF_STATUS_INVALID"), ("Status: ACTIVE\nStatus: ACTIVE", "HANDOFF_STATUS_INVALID"),
                             ("Status: ARCHIVED", "HANDOFF_NOT_ACTIVE"), ("Status: ACTIVE (draft)", "HANDOFF_NOT_ACTIVE"), ("status: ACTIVE", "HANDOFF_NOT_ACTIVE"),
                             ("Owner: nobody", "HANDOFF_STATUS_INVALID")):
            make_project(self.root, handoff_status=status)
            self.assertIn(code, codes(self.run_cont()), status)
        make_project(self.root, handoff_status="Status: ACTIVE\n\n```\nStatus: ARCHIVED\n```")
        self.assertEqual(self.run_cont().outcome, "PASS", "a fenced example is not a declaration")
        make_project(self.root)
        write(self.root / "CVF_SESSION/handoffs/AGENT_HANDOFF_V0.md", "Status: ARCHIVED\n")
        self.assertEqual(self.run_cont().outcome, "PASS", "an archived handoff is preserved")
    def test_f06_active_work_orders_join_existence_status_and_uniqueness(self) -> None:
        rel = "docs/work_orders/CVF_AGENT_WORK_ORDER_A.md"
        make_project(self.root, mode="BUILD", phase="BUILD", work_orders=[rel])
        for status in ("Status: DRAFT", "Status: HOLD", "Status: CLOSED_PASS_BOUNDED", "Status: SOMETHING_NEW", "Status: DISPATCH_READY - x"):
            write(self.root / rel, status + "\n")
            self.assertIn("ACTIVE_WORK_ORDER_NOT_ACTIVE", codes(self.run_cont()), status)
        write(self.root / rel, "Status: DISPATCH_READY\n")
        self.assertTrue(self.run_cont().ok)
        make_project(self.root, mode="BUILD", phase="BUILD", work_orders=[rel, rel])
        self.assertIn("ACTIVE_WORK_ORDER_DUPLICATE", codes(self.run_cont()))
        make_project(self.root, mode="BUILD", phase="BUILD", work_orders=["docs/work_orders/missing.md", "docs/specs/x.md"])
        write(self.root / "docs/specs/x.md", "Status: DISPATCH_READY\n")
        self.assertTrue({"ACTIVE_WORK_ORDER_MISSING", "ACTIVE_WORK_ORDER_PATH_INVALID"} <= codes(self.run_cont()))
        make_project(self.root, work_orders=[rel])
        write(self.root / rel, "Status: DISPATCH_READY\n")
        self.assertIn("WORK_ORDER_BEFORE_PHASE", codes(self.run_cont()))


class InstallTests(Tmp):
    def install(self, **kwargs) -> dict:
        return inst.install(self.root, LIB, REPO, "c" * 40, **kwargs)
    def verify(self, trusted: bool = False, **kwargs):
        return inst.verify_install(self.root, LIB, REPO if trusted else None, trusted, **kwargs)
    def lock(self) -> dict:
        return json.loads((self.root / ".cvf/gate-profile.lock.json").read_text(encoding="utf-8"))
    def test_fresh_install_is_idempotent_and_verifiable(self) -> None:
        make_project(self.root)
        self.assertEqual(self.install()["status"], "FRESH_INSTALLED")
        lock_before = (self.root / ".cvf/gate-profile.lock.json").read_bytes()
        self.assertEqual(self.verify(trusted=True).outcome, "PASS")
        self.assertEqual(self.install()["status"], "ALREADY_INSTALLED")
        self.assertEqual(lock_before, (self.root / ".cvf/gate-profile.lock.json").read_bytes())
        self.assertTrue((self.root / ".github/workflows/cvf-downstream-gates.yml").is_file())
    def test_missing_empty_and_tampered_files_are_rejected(self) -> None:
        self.install()
        runner = self.root / "scripts/cvf_gates/cvf_downstream_gate_runner.py"
        original = runner.read_bytes()
        runner.write_bytes(b"")
        self.assertIn("FILE_EMPTY", codes(self.verify()))
        runner.write_bytes(b"import sys\nsys.exit(0)\n")
        self.assertIn("FILE_TAMPERED", codes(self.verify()))
        runner.unlink()
        self.assertIn("FILE_MISSING", codes(self.verify()))
        runner.write_bytes(original.replace(b"\n", b"\r\n"))
        self.assertEqual(self.verify(trusted=True).outcome, "PASS", "a CRLF checkout keeps its identity")
    def repin_noop_continuity(self) -> Path:
        """Attacker move: replace one mandatory module with a no-op and make the lock agree with the new bytes."""
        module = self.root / "scripts/cvf_gates/cvf_dg_continuity.py"
        module.write_text("from cvf_dg_common import ControlResult\n\n\ndef check_continuity(project_root, profile, checker_dir):\n    return ControlResult('CVF-DG-CONT-01', 'PASS')\n", encoding="utf-8", newline="\n")
        lock_path = self.root / ".cvf/gate-profile.lock.json"
        lock = self.lock()
        lock["files"]["cvf_dg_continuity.py"] = common.file_content_sha256(module)
        lock["bundleSha256"] = common.bundle_digest(self.root / "scripts/cvf_gates")[0]
        write(lock_path, json.dumps(lock))
        return module
    def test_f02_consistent_module_and_lock_edit_is_refused_by_independent_anchors(self) -> None:
        self.install()
        expected = self.lock()
        self.repin_noop_continuity()
        self.assertEqual(self.verify().outcome, "PASS", "a lock-only check cannot see a consistent edit")
        result = self.verify(expect_profile_sha=expected["profileSha256"], expect_runner_sha=expected["runnerSha256"], expect_bundle_sha=expected["bundleSha256"])
        self.assertEqual(codes(result), {"BUNDLE_PIN_MISMATCH"}, "expected pins compare actual bytes, not editable lock metadata")
        self.assertIn("TRUSTED_MISMATCH", codes(self.verify(trusted=True)))
    def test_f02_stage0_checks_pins_before_any_project_module_is_imported(self) -> None:
        make_project(self.root)
        self.install()
        expected = pins(self.root)
        module, runner = self.repin_noop_continuity(), self.root / "scripts/cvf_gates/cvf_downstream_gate_runner.py"
        marker = self.root / "imported.flag"
        module.write_text(module.read_text(encoding="utf-8") + f"open({str(marker)!r}, 'w').close()\n", encoding="utf-8", newline="\n")
        done = cli(runner, self.root, "run", "--phase", "pr-ci", "--project-root", str(self.root), "--base", "HEAD", *expected)
        self.assertTrue(done.returncode == 2 and "BUNDLE_PIN_MISMATCH" in done.stdout and not marker.exists(), done.stdout)
        self.assertIn("PIN_REQUIRED", cli(runner, self.root, "run", "--phase", "pr-ci", "--project-root", str(self.root), "--base", "HEAD").stdout)
    def test_unexpected_files_and_bundle_digest_parity(self) -> None:
        self.install()
        gates = self.root / "scripts/cvf_gates"
        spec = importlib.util.spec_from_file_location("runner_stage0_probe", gates / "cvf_downstream_gate_runner.py")
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        self.assertEqual(module._stage0_bundle(gates), common.bundle_digest(gates))
        write(gates / "sitecustomize.py", "raise SystemExit(0)\n")
        self.assertIn("UNEXPECTED_FILE", codes(self.verify()))
        self.assertIn("BUNDLE_MISMATCH", codes(self.verify()))
    def test_no_op_local_override_and_env_override_are_refused(self) -> None:
        self.install()
        override = self.root / ".cvf/gate-profile.local.json"
        for body in ({"controls": []}, {"disable": ["CVF-DG-CONT-01"]},
                     {"additionalControls": [{"id": "CVF-DG-CONT-01", "phases": ["pr-ci"], "command": ["python", "-c", "pass"]}]}):
            write(override, json.dumps(body))
            self.assertIn("OVERRIDE_REFUSED", codes(self.verify()), body)
        write(override, json.dumps({"additionalControls": [{"id": "LOCAL-ok", "phases": ["pr-ci"], "command": ["python", "-c", "pass"]}]}))
        self.assertEqual(self.verify().outcome, "PASS")
        override.unlink()
        with mock.patch.dict(os.environ, {"CVF_DG_SKIP": "1"}):
            self.assertIn("OVERRIDE_REFUSED", codes(self.verify()))
    def test_pins_collision_and_drift_preservation(self) -> None:
        self.install()
        for kwarg, code in (("expect_profile_sha", "PROFILE_PIN_MISMATCH"), ("expect_runner_sha", "RUNNER_PIN_MISMATCH"), ("expect_bundle_sha", "BUNDLE_PIN_MISMATCH")):
            self.assertIn(code, codes(self.verify(**{kwarg: "0" * 64})))
        workflow = self.root / ".github/workflows/cvf-downstream-gates.yml"
        workflow.write_text(workflow.read_text(encoding="utf-8") + "# edited\n", encoding="utf-8", newline="\n")
        self.assertIn("CI_WORKFLOW_DRIFT", codes(self.verify()))
        self.assertEqual(self.install()["status"], "DRIFT_PRESERVED")
        self.assertTrue(workflow.read_text(encoding="utf-8").endswith("# edited\n"), "no silent overwrite")
    def test_project_owned_files_block_install_and_workflow_is_preserved(self) -> None:
        owned = self.root / "scripts/cvf_gates/cvf_dg_common.py"
        write(owned, "# project owned\n")
        self.assertEqual(self.install()["status"], "BLOCKED_COLLISION")
        self.assertEqual(owned.read_text(encoding="utf-8"), "# project owned\n")
        owned.unlink()
        write(self.root / "scripts/cvf_gates/NOTES.md", "mine\n")
        self.assertEqual(self.install()["status"], "BLOCKED_COLLISION")
        (self.root / "scripts/cvf_gates/NOTES.md").unlink()
        fake_core = Path(self._dir.name) / "core"
        fake_core.mkdir()
        self.assertEqual(inst.install(self.root, LIB, fake_core, "c" * 40)["status"], "BLOCKED_CORE_SOURCE_MISSING")
        flow = self.root / ".github/workflows/cvf-downstream-gates.yml"
        write(flow, "name: mine\n")
        self.assertEqual(self.install()["status"], "FRESH_INSTALLED")
        self.assertEqual(flow.read_text(encoding="utf-8"), "name: mine\n")
        self.assertEqual(self.lock()["ciWorkflow"]["disposition"], "PROJECT_OWNED_PRESERVED")


class PacketControlTests(Tmp):
    def setUp(self) -> None:
        super().setUp()
        make_project(self.root)
        inst.install(self.root, LIB, REPO, "c" * 40)
        self.gates = self.root / "scripts/cvf_gates"
    def packet(self, rel: str, text: str) -> str:
        write(self.root / rel, text)
        return rel
    def appl(self, rel: str):
        return appl.check_applicability(self.root, [rel], self.gates)
    def test_status_grammar_table(self) -> None:
        cases = {"Status: HOLD\n": "NOT_APPLICABLE_WITH_REASON", "Status: DRAFT\n": "NOT_APPLICABLE_WITH_REASON", "Status: CLOSED_PASS_BOUNDED\n": "NOT_APPLICABLE_WITH_REASON",
                 "Status: DISPATCH_READY\n": "FAIL", "Status: DISPATCH_READY (issue #12)\n": "FAIL", "Status: DISPATCH_READY - issue #12\n": "FAIL", "Status:\n": "FAIL",
                 "Status: DISPATCH_READY\nStatus: DISPATCH_READY\n": "FAIL", "Status: DISPATCH_READY\nStatus: HOLD\n": "FAIL",
                 "Status: dispatch_ready\n": "FAIL", "Status: SOMETHING_NEW\n": "FAIL", "no status here\n": "FAIL"}
        for body, expected in cases.items():
            self.assertEqual(self.appl(self.packet("docs/work_orders/CVF_AGENT_WORK_ORDER_T.md", body)).outcome, expected, body)
    def test_not_applicable_reports_reason_and_checked_ids(self) -> None:
        result = self.appl(self.packet("docs/work_orders/CVF_AGENT_WORK_ORDER_T.md", "Status: HOLD\n"))
        self.assertTrue(result.ok and result.reason and result.checked_control_ids == ["work_order_status_grammar"])
        self.assertIn("closeability contract was not checked", result.reason)
        self.assertEqual(self.appl(self.packet("docs/work_orders/README.md", "# Work orders\n")).outcome, "NOT_APPLICABLE_WITH_REASON")
        self.assertEqual(appl.check_applicability(self.root, [], self.gates).outcome, "NOT_APPLICABLE_WITH_REASON")
        (self.gates / "check_gate_to_role_closeability.py").unlink()
        self.assertEqual(self.appl("docs/work_orders/CVF_AGENT_WORK_ORDER_T.md").outcome, "BLOCKED_INVALID_INPUT", "an unavailable pinned checker fails closed")
    def rework(self, **over) -> str:
        fields = {"dispatchKind": "REWORK", "reviewerLocalRepairBoundary": "SCOPE_OR_AUTHORITY_EXPANSION",
                  "reviewerLocalRepairBasis": "Finding F1 at workflow.yml needs a new deploy path outside the work order",
                  "unchangedObjective": "YES", "unchangedDesign": "YES", "unchangedPaths": "NO", "unchangedAuthority": "YES",
                  "unchangedEffects": "YES", "unchangedCommitOwner": "YES", "evidenceDetermined": "YES", "focusedVerification": "rerun the focused workflow test"}
        fields.update(over)
        return self.packet("docs/work_orders/WO.md", "".join(f"{k}: {v}\n" for k, v in fields.items() if v is not None))
    def route(self, rel: str):
        return routing.check_routing(self.root, [rel], PROFILE)
    def test_reviewer_local_repair_routing(self) -> None:
        self.assertTrue(self.route(self.rework()).ok, "real boundary change still permits worker return")
        for over, code in (({"unchangedPaths": "YES"}, "REWORK_UNJUSTIFIED_REVIEWER_LOCAL_AVAILABLE"), ({"reviewerLocalRepairBoundary": "BECAUSE"}, "REWORK_BOUNDARY_INVALID"),
                           ({"reviewerLocalRepairBasis": "TODO fill this in later please"}, "REWORK_BASIS_INVALID"), ({"reviewerLocalRepairBasis": "short"}, "REWORK_BASIS_INVALID"),
                           ({"reviewerLocalRepairBoundary": "NEW_EVIDENCE_REQUIRED"}, "REWORK_BOUNDARY_UNSUPPORTED"), ({"unchangedAuthority": None}, "ASSESSMENT_FIELD_INVALID"),
                           ({"dispatchKind": "RETRY"}, "DISPATCH_KIND_INVALID")):
            self.assertIn(code, codes(self.route(self.rework(**over))), over)
        self.assertIn("DUPLICATE_FIELD", codes(self.route(self.packet("docs/work_orders/D.md", "dispatchKind: INITIAL\ndispatchKind: REWORK\n"))))
        self.assertTrue(self.route(self.packet("docs/work_orders/I.md", "dispatchKind: INITIAL\n")).ok)
        self.assertEqual(self.route(self.packet("docs/work_orders/N.md", "# no dispatch kind\n")).outcome, "NOT_APPLICABLE_WITH_REASON")
    def role(self, text: str):
        return review.check_roles(self.root, [self.packet("docs/reviews/R.md", text)], PROFILE)
    def test_reviewer_independence_and_f03_risk_grammar(self) -> None:
        self.assertIn("SELF_REVIEW", codes(self.role("Risk: R2\nWorker: Agent-A (worker)\nReviewer: agent-a (reviewer)\n")))
        self.assertTrue(self.role("Risk: R2\nWorker: Agent-A\nReviewer: Agent-B\n").ok)
        self.assertIn("ROLE_FIELD_INVALID", codes(self.role("Risk: R3\nWorker: Agent-A\n")))
        self.assertEqual(self.role("Risk: R1\nWorker: A\nReviewer: A\n").outcome, "PASS")
        self.assertEqual(self.role("# prose review\n").outcome, "NOT_APPLICABLE_WITH_REASON")
        for text, code in (("Risk: r2\nWorker: A\nReviewer: A\n", "RISK_INVALID"), ("Risk: R9\nWorker: A\nReviewer: B\n", "RISK_INVALID"),
                           ("Risk:\nWorker: A\nReviewer: A\n", "EMPTY_FIELD"), ("Risk: R2, R3\nWorker: A\nReviewer: A\n", "RISK_INVALID"),
                           ("Risk: R2\nRisk: R1\nWorker: A\nReviewer: A\n", "DUPLICATE_FIELD"), ("risk: R2\nWorker: A\nReviewer: A\n", "LABEL_CASE"),
                           ("Worker: A\nReviewer: A\n", "RISK_MISSING"), ("Reviewer: B\n", "RISK_MISSING"),
                           ("Risk: R2\nWorker: A\nWorker: B\nReviewer: C\n", "DUPLICATE_FIELD"), ("Risk: R2\nworker: A\nReviewer: C\n", "LABEL_CASE")):
            result = self.role(text)
            self.assertIn(code, codes(result), text)
            self.assertFalse(result.ok, text)
    def claim(self, text: str):
        return review.check_claims(self.root, [self.packet("docs/reviews/C.md", text)], PROFILE, self.gates)
    def test_claims_are_bound_to_evidence(self) -> None:
        self.assertTrue(self.claim("Gate claim: CVF-DG-CONT-01=INSTALLED\n").ok)
        for text, code in (("Gate claim: CVF-DG-CONT-01=INVOKED\n", "UNSUPPORTED_CLAIM"), ("Gate claim: CVF-DG-CONT-01=PROVEN_HERMETIC\n", "UNSUPPORTED_CLAIM"),
                           ("Gate claim: NOPE-01=INSTALLED\n", "CLAIM_CONTROL_UNKNOWN"), ("Gate claim: CVF-DG-CONT-01=ENFORCED\n", "CLAIM_STATE_UNKNOWN"),
                           ("Gate claim: CVF-DG-ROUTE-01=NOT_APPLICABLE_WITH_REASON\n", "CLAIM_REASON_MISSING"), ("The workspace is agent-enforcement-ready.\n", "BROAD_CLAIM_PHRASE")):
            self.assertIn(code, codes(self.claim(text)), text)
        self.assertTrue(self.claim("This does not mean the workspace is fully enforced.\n").ok)
        cli(self.gates / "cvf_downstream_gate_runner.py", self.root, "run", "--phase", "bootstrap", "--project-root", str(self.root))
        self.assertTrue(self.claim("Gate claim: CVF-DG-CONT-01=INVOKED\n").ok, "a bound receipt supports INVOKED")
    def test_f04_claim_declarations_are_collected_before_values_are_parsed(self) -> None:
        for text, code in (("Gate claim: CVF-DG-CONT-01=PROVEN_HERMETIC because trust me\n", "CLAIM_MALFORMED"), ("Gate claim: CVF-DG-CONT-01\n", "CLAIM_MALFORMED"),
                           ("Gate claim: =INSTALLED\n", "CLAIM_MALFORMED"), ("gate claim: CVF-DG-CONT-01=INSTALLED\n", "CLAIM_MALFORMED"),
                           ("Gate claim: CVF-DG-CONT-01=installed\n", "CLAIM_MALFORMED"), ("Gate claim:\n", "CLAIM_MALFORMED"),
                           ("Gate claim: CVF-DG-CONT-01=INSTALLED\nGate claim: CVF-DG-CONT-01=INSTALLED\n", "CLAIM_DUPLICATE")):
            result = self.claim(text)
            self.assertIn(code, codes(result), text)
            self.assertFalse(result.ok)
        self.assertTrue(self.claim("```\nGate claim: CVF-DG-CONT-01=PROVEN_HERMETIC trailing\n```\n").ok, "a fenced example is not a declaration")
    def test_coverage_states_are_truthful(self) -> None:
        coverage = cov.compute_coverage(self.root, self.gates)
        self.assertFalse(coverage["hostedCiObserved"])
        self.assertEqual({e["state"] for row in coverage["phases"].values() for e in row.values()}, {"INSTALLED", "NOT_APPLICABLE_WITH_REASON"})
        self.assertEqual(coverage["phases"]["reviewer-fast"]["CVF-DG-RANGE-01"]["state"], "INSTALLED")
        workflow = self.root / ".github/workflows/cvf-downstream-gates.yml"
        workflow.unlink()
        self.assertEqual(cov.compute_coverage(self.root, self.gates)["phases"]["pr-ci"]["CVF-DG-CONT-01"]["state"], "BLOCKED", "a deleted generated workflow is drift")
        (self.gates / "cvf_dg_common.py").write_bytes(b"")
        self.assertEqual(cov.compute_coverage(self.root, self.gates)["phases"]["bootstrap"]["CVF-DG-CONT-01"]["state"], "BLOCKED")
    def test_proof_receipt_requires_matching_identity(self) -> None:
        lock = json.loads((self.root / ".cvf/gate-profile.lock.json").read_text(encoding="utf-8"))
        proof = {"schemaVersion": cov.PROOF_SCHEMA, **{k: lock[k] for k in cov.PIN_KEYS}, "controls": {"CVF-DG-CONT-01": {"phases": ["bootstrap"], "negativeCases": ["x"]}}}
        path = Path(self._dir.name) / "proof.json"
        write(path, json.dumps(proof))
        self.assertEqual(cov.compute_coverage(self.root, self.gates, path)["phases"]["bootstrap"]["CVF-DG-CONT-01"]["state"], "PROVEN_HERMETIC")
        write(path, json.dumps({**proof, "bundleSha256": "0" * 64}))
        self.assertEqual(cov.compute_coverage(self.root, self.gates, path)["phases"]["bootstrap"]["CVF-DG-CONT-01"]["state"], "INSTALLED")


class IntakeTests(Tmp):
    def finding(self, **over) -> dict:
        data = json.loads((DOCS / "DOWNSTREAM_FINDING_INTAKE_TEMPLATE.json").read_text(encoding="utf-8"))
        data.update({"findingId": "FND-001", "title": "Continuity drift passes doctor", "sourceProject": "Example Project", "sourceSha": SHA40,
                     "observed": "doctor PASS with drift", "expected": "drift blocks",
                     "negativeEvidence": [{"locator": "docs/reviews/x.md#L1", "description": "manual drift catch"}],
                     "chainJoins": [{"join": "template to executable", "gap": "no runner", "earliestControlPoint": "bootstrap"}],
                     "candidateControl": "CVF-DG-CONT-01 style gate", "claimLimits": "project claims unverified"})
        data.update(over)
        return data
    def build(self, data: dict):
        src = Path(self._dir.name) / "finding.json"
        write(src, json.dumps(data))
        return intake.build_intake(src, self.root, PROFILE)
    def test_deterministic_generation_is_not_acceptance(self) -> None:
        target, problems = self.build(self.finding())
        self.assertFalse(problems)
        first = target.read_bytes()
        self.assertEqual(first, self.build(self.finding())[0].read_bytes())
        record = json.loads(first)
        self.assertEqual(record["acceptance"], "NOT_ACCEPTED_GENERATION_ONLY")
        self.assertTrue(all(v is None for v in record["parentLinks"].values()))
        self.assertEqual(intake.validate_record(record, PROFILE), [])
        self.assertIn("CONTENT_IDENTITY_MISMATCH", {f.code for f in intake.validate_record({**record, "observed": "edited after generation"}, PROFILE)})

    @staticmethod
    def resign(record: dict) -> dict:
        body = {k: v for k, v in record.items() if k != "contentSha256"}
        return {**body, "contentSha256": common.content_sha256(common.canonical_json(body).encode("utf-8"))}
    def test_f07_full_record_schema_is_validated_even_when_the_digest_is_recomputed(self) -> None:
        record = json.loads(self.build(self.finding())[0].read_bytes())
        drop = lambda key: {k: v for k, v in record.items() if k != key}  # noqa: E731
        links = dict(record["parentLinks"])
        cases = {"schemaVersion removed": (self.resign(drop("schemaVersion")), "MISSING_FIELD"), "profileId changed": (self.resign({**record, "profileId": "other"}), "INVALID_FIELD"),
                 "parentOwner changed": (self.resign({**record, "parentOwner": "elsewhere.md"}), "INVALID_FIELD"), "schemaVersion changed": (self.resign({**record, "schemaVersion": "9"}), "INVALID_FIELD"),
                 "parentLinks removed": (self.resign(drop("parentLinks")), "MISSING_FIELD"), "link key removed": (self.resign({**record, "parentLinks": {k: v for k, v in links.items() if k != "checker"}}), "INVALID_FIELD"),
                 "link type wrong": (self.resign({**record, "parentLinks": {**links, "workOrder": 5}}), "INVALID_FIELD"), "unknown field": (self.resign({**record, "extra": 1}), "UNKNOWN_FIELD"),
                 "claim status changed": (self.resign({**record, "sourceClaimStatus": "VERIFIED"}), "INVALID_FIELD"), "bogus disposition": (self.resign({**record, "parentDisposition": "MAYBE"}), "INVALID_FIELD"),
                 "accepted without link": (self.resign({**record, "acceptance": "ACCEPTED_BY_PARENT", "parentDisposition": "ACCEPTED_BY_PARENT"}), "STATE_LINK_INCOHERENT"),
                 "pending with link": (self.resign({**record, "parentLinks": {**links, "workOrder": "docs/work_orders/x.md"}}), "STATE_LINK_INCOHERENT"),
                 "defect class changed": (self.resign({**record, "defectClass": "MADE_UP"}), "INVALID_FIELD")}
        for label, (mutated, code) in cases.items():
            self.assertIn(code, {f.code for f in intake.validate_record(mutated, PROFILE)}, label)
        decided = self.resign({**record, "acceptance": "ACCEPTED_BY_PARENT", "parentDisposition": "ACCEPTED_BY_PARENT", "parentLinks": {**links, "admissionRecord": "docs/reviews/admit.md"}})
        self.assertEqual(intake.validate_record(decided, PROFILE), [], "a parent decision with its admission link is valid")
    def test_invalid_inputs_are_refused_and_never_overwrite(self) -> None:
        for over, code in (({"sourceSha": "abc"}, "INVALID_FIELD"), ({"defectClass": "MADE_UP"}, "INVALID_FIELD"), ({"negativeEvidence": []}, "INVALID_FIELD"),
                           ({"extra": 1}, "UNKNOWN_FIELD"), ({"observed": "token = sk-abcdefghijklmnopqrstuvwxyz"}, "SECRET_LIKE_CONTENT")):
            target, problems = self.build(self.finding(**over))
            self.assertIsNone(target, over)
            self.assertIn(code, {p.code for p in problems}, over)
        data = self.finding()
        data.pop("claimLimits")
        self.assertIn("MISSING_FIELD", {p.code for p in self.build(data)[1]})
        self.assertIsNotNone(self.build(self.finding())[0])
        self.assertIn("INTAKE_EXISTS_DIFFERENT", {p.code for p in self.build(self.finding(title="A different title"))[1]})
    def test_registry_is_parent_owned_and_links_resolve(self) -> None:
        entry = json.loads((DOCS / "downstream_finding_intake_registry.json").read_text(encoding="utf-8"))["entries"][0]
        self.assertEqual(entry["sourceSnapshot"]["sha256"], common.raw_sha256((REPO / entry["sourceSnapshot"]["path"]).read_bytes()))
        self.assertTrue(all(f["parentDisposition"] == "ACCEPTED_BOUNDED_HERMETIC_FILE_CONTROL_ONLY" and f["dedup"] and all((REPO / d["owner"]).is_file() for d in f["dedup"]) for f in entry["findings"]))
        self.assertTrue(all(k.startswith("worker") or (REPO / v).is_file() for k, v in entry["parentLinks"].items()))


class RunnerCliTests(Tmp):
    def install(self) -> Path:
        make_project(self.root)
        cli(LIB / "cvf_downstream_gate_runner.py", self.root, "install", "--project-root", str(self.root), "--core-root", str(REPO))
        return self.root / "scripts/cvf_gates/cvf_downstream_gate_runner.py"
    def test_phase_exit_codes_and_failure_propagation(self) -> None:
        runner, trusted = self.install(), LIB / "cvf_downstream_gate_runner.py"
        phases = [p for p in PROFILE["phases"] if p != "pr-ci"]
        for phase in phases:
            self.assertEqual(cli(runner, self.root, "run", "--phase", phase, "--project-root", str(self.root)).returncode, 0, phase)
            self.assertEqual(cli(trusted, self.root, "run", "--phase", phase, "--project-root", str(self.root), "--trusted").returncode, 0, phase)
        memory = self.root / "CVF_SESSION_MEMORY.md"
        write(memory, memory.read_text(encoding="utf-8").replace("- Current mode: INTAKE", "- Current mode: BUILD"))
        for phase in phases:
            done = cli(runner, self.root, "run", "--phase", phase, "--project-root", str(self.root))
            self.assertEqual(done.returncode, 2, phase)
            self.assertIn("SURFACE_MISMATCH", done.stdout)
        write(self.root / "docs/work_orders/CVF_AGENT_WORK_ORDER_X.md", "Status: DISPATCH_READY - issue 1\n")
        for phase in ("pre-dispatch", "reviewer-fast"):
            done = cli(runner, self.root, "run", "--phase", phase, "--project-root", str(self.root), "--packet", "docs/work_orders/CVF_AGENT_WORK_ORDER_X.md")
            self.assertIn("status_malformed", done.stdout, phase)
        self.assertEqual(cli(runner, self.root, "run", "--phase", "no-such-phase").returncode, 3)
    def test_f08_reviewer_fast_runs_every_review_control(self) -> None:
        runner = self.install()
        done = cli(runner, self.root, "run", "--phase", "reviewer-fast", "--project-root", str(self.root), "--json")
        self.assertEqual(done.returncode, 0, done.stdout)
        ran = {r["controlId"] for r in json.loads(done.stdout)["results"]}
        self.assertEqual(ran, {c["id"] for c in PROFILE["controls"] if "reviewer-fast" in c["phases"]})
        self.assertTrue({"CVF-DG-ROUTE-01", "CVF-DG-ROLE-01", "CVF-DG-CLAIM-01", "CVF-DG-APPL-01", "CVF-DG-RANGE-01"} <= ran)
        write(self.root / "docs/reviews/CVF_X_REVIEW.md", "Risk: R2\nWorker: A\nReviewer: A\n")
        bad = cli(runner, self.root, "run", "--phase", "reviewer-fast", "--project-root", str(self.root), "--packet", "docs/reviews/CVF_X_REVIEW.md")
        self.assertEqual(bad.returncode, 2)
        self.assertIn("SELF_REVIEW", bad.stdout)
class RangeTests(Tmp):
    """F01: the PR/push command must bind a real candidate range; a clean committed checkout is not an empty one."""
    def git(self, *args: str) -> str:
        done = subprocess.run(["git", "-c", "user.email=t@example.invalid", "-c", "user.name=t", *args], cwd=self.root, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        self.assertEqual(done.returncode, 0, done.stderr)
        return done.stdout.strip()
    def setUp(self) -> None:
        super().setUp()
        make_project(self.root)
        cli(LIB / "cvf_downstream_gate_runner.py", self.root, "install", "--project-root", str(self.root), "--core-root", str(REPO))
        self.git("init", "-q")
        self.git("add", "-A")
        self.git("commit", "-q", "-m", "base")
        self.base = self.git("rev-parse", "HEAD")
        self.runner = self.root / "scripts/cvf_gates/cvf_downstream_gate_runner.py"
    def pr(self, *extra: str, **env: str) -> subprocess.CompletedProcess:
        return cli(self.runner, self.root, "run", "--phase", "pr-ci", "--project-root", str(self.root), *pins(self.root), *extra, **env)
    def commit(self, files: dict) -> None:
        for rel, text in files.items():
            write(self.root / rel, text)
        self.git("add", "-A")
        self.git("commit", "-q", "-m", "candidate")
    def test_clean_committed_candidates_are_discovered_and_refused(self) -> None:
        write(self.root / "docs/work_orders/CVF_AGENT_WORK_ORDER_X.md", "Status: DISPATCH_READY - issue 1\n")
        write(self.root / "docs/reviews/CVF_R.md", "Risk: R2\nWorker: A\nReviewer: A\nGate claim: CVF-DG-CONT-01=PROVEN_HERMETIC trailing\n")
        write(self.root / "docs/work_orders/CVF_AGENT_WORK_ORDER_Y.md", "dispatchKind: REWORK\nStatus: HOLD\nreviewerLocalRepairBoundary: NEW_EVIDENCE_REQUIRED\nreviewerLocalRepairBasis: Finding F1 at workflow.yml is a tiny closed-evidence fix\n"
              + "".join(f"{k}: YES\n" for k in PROFILE["reviewerRouting"]["assessmentFields"]) + "focusedVerification: rerun the focused test\n")
        self.git("add", "-A")
        self.git("commit", "-q", "-m", "candidate")
        self.assertEqual(self.git("status", "--porcelain"), "", "the checkout is clean: nothing is uncommitted")
        done = self.pr("--base", self.base, "--head", "HEAD")
        self.assertEqual(done.returncode, 2, done.stdout)
        for code in ("status_malformed", "SELF_REVIEW", "CLAIM_MALFORMED", "REWORK_UNJUSTIFIED_REVIEWER_LOCAL_AVAILABLE"):
            self.assertIn(code, done.stdout)
        self.assertIn("RANGE_RESOLVED", done.stdout)
    def test_missing_or_unresolvable_range_refuses_instead_of_emptying_discovery(self) -> None:
        self.commit({"docs/work_orders/CVF_AGENT_WORK_ORDER_X.md": "Status: DISPATCH_READY - issue 1\n"})
        for extra, env, code in (((), {}, "RANGE_BASE_MISSING"), (("--base", "f" * 40), {}, "RANGE_BASE_UNRESOLVED"), (("--base", "nonexistent-ref"), {}, "RANGE_BASE_UNRESOLVED"),
                                 (("--base-from-env", "CVF_DG_BASE"), {}, "RANGE_BASE_MISSING"), (("--base", self.base, "--head", self.base), {}, "RANGE_HEAD_NOT_CHECKED_OUT")):
            done = self.pr(*extra, **env)
            self.assertEqual(done.returncode, 2, extra)
            self.assertIn(code, done.stdout, extra)
        ok = self.pr("--base-from-env", "CVF_DG_BASE", "--head", "HEAD", CVF_DG_BASE=self.base)
        self.assertEqual(ok.returncode, 2, "the env-bound base finds the malformed committed order")
        self.assertIn("status_malformed", ok.stdout)
    def test_pristine_range_has_an_explicit_checked_disposition(self) -> None:
        done = self.pr("--base", self.base, "--head", "HEAD")
        self.assertEqual(done.returncode, 0, done.stdout)
        self.assertIn("RANGE_EMPTY_CHECKED", done.stdout)
    def test_rename_delete_and_initial_push(self) -> None:
        self.commit({"docs/work_orders/CVF_AGENT_WORK_ORDER_A.md": "Status: HOLD\n"})
        mid = self.git("rev-parse", "HEAD")
        self.git("mv", "docs/work_orders/CVF_AGENT_WORK_ORDER_A.md", "docs/work_orders/CVF_AGENT_WORK_ORDER_B.md")
        write(self.root / "docs/work_orders/CVF_AGENT_WORK_ORDER_B.md", "Status: HOLD\nStatus: HOLD\n")
        self.git("add", "-A")
        self.git("commit", "-q", "-m", "rename and break")
        renamed = self.pr("--base", mid, "--head", "HEAD")
        self.assertIn("status_duplicate", renamed.stdout, "the renamed candidate is checked under its new path")
        self.git("rm", "-q", "docs/work_orders/CVF_AGENT_WORK_ORDER_B.md")
        self.git("commit", "-q", "-m", "delete")
        deleted = self.pr("--base", mid, "--head", "HEAD")
        self.assertIn("deleted candidate not checked: docs/work_orders/CVF_AGENT_WORK_ORDER_A.md", deleted.stdout, "A was renamed to B and B deleted: net deletion of A")
        self.assertEqual(deleted.returncode, 0, deleted.stdout)
        self.commit({"docs/work_orders/CVF_AGENT_WORK_ORDER_C.md": "Status: DISPATCH_READY - x\n"})
        initial = self.pr("--base", "0" * 40, "--head", "HEAD")
        self.assertIn("RANGE_INITIAL_ALL_FILES", initial.stdout)
        self.assertIn("status_malformed", initial.stdout)
    def test_workflow_command_is_shell_free_and_pinned(self) -> None:
        text = (self.root / ".github/workflows/cvf-downstream-gates.yml").read_text(encoding="utf-8")
        self.assertTrue(all(t in text for t in ("--base-from-env CVF_DG_BASE", "--head HEAD", "--expect-bundle-sha256", "fetch-depth: 0")) and "{{BUNDLE_SHA256}}" not in text)


if __name__ == "__main__":
    unittest.main()
