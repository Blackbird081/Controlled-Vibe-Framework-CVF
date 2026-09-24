"""Focused tests for ACEL Foundation T1 dispatch/return loop control.

DRC-01/DRC-02: ready no-commit work orders must carry a parseable Required
Artifact Manifest and one exact agreeing worker-return binding at dispatch
time, with no runtime/source change in the range.

DRC-04/DRC-05/DRC-06: the worker-return quality gate, given an active work
order, must resolve and diagnose the exact bound return even when changed-path
discovery selects zero, must not let an unrelated eligible return satisfy it,
and must keep legacy behavior when no active work order is supplied.
"""

from __future__ import annotations

import contextlib
import importlib.util
import io
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


COMPAT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(COMPAT_DIR))


def _load(name: str):
    spec = importlib.util.spec_from_file_location(name, COMPAT_DIR / f"{name}.py")
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load {name}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


DISPATCH = _load("check_work_order_dispatch_quality")
QUALITY = _load("check_worker_return_quality_gate")

WORK_ORDER = "docs/work_orders/CVF_WO_DRC_TEST_2026-09-23.md"
RETURN_PATH = "docs/reviews/CVF_DRC_TEST_WORKER_RETURN_2026-09-23.md"
UNRELATED_RETURN = "docs/reviews/CVF_DRC_UNRELATED_WORKER_RETURN_2026-09-23.md"

MANIFEST_TABLE = (
    "## Required Artifact Manifest",
    "| Path | Required at handoff | Purpose |",
    "|---|---|---|",
    "| `governance/compat/example_checker.py` | Yes | checker |",
    f"| `{RETURN_PATH}` | Yes | worker return |",
)


def _work_order(*, manifest=MANIFEST_TABLE, scalar=RETURN_PATH, field=RETURN_PATH, extra=()) -> str:
    lines = [
        "# Test",
        "Status: DISPATCHED_TO_WORKER",
        "## Worker Autonomy / No-Question Rule",
        "Proceed inside allowed scope.",
        "Commit mode: WORKER_MUST_NOT_COMMIT",
        "dispatchBaseHead: abc1234",
        "executionBaseHead: capture before edits",
        "closureBaseHead: reviewer stage",
        "## Intake Role Routing Decision",
        "- Intake summary: operator request is bounded no-commit worker execution.",
        "- Scope classification: bounded work order with low blast radius.",
        "- Risk sensitivity: no public-sync, provider, live, secret, legal, production, or readiness claim.",
        "- Selected role route: routeMode=MULTI_AGENT_MULTI_ROLE.",
        "- Role separation basis: worker produces packet; reviewer owns completion and closure.",
        "- Escalation condition: stop for operator checkpoint if scope/risk changes.",
        "## Reviewer Closure Conversion Block",
        "completionReviewPath: `docs/reviews/CVF_DRC_TEST_COMPLETION_2026-09-23.md`",
        "reviewerOwnedClosurePaths:",
        "- `docs/reviews/CVF_DRC_TEST_COMPLETION_2026-09-23.md`",
        "## Work-Order Fulfillment Manifest",
        "The following manifest is exact.",
        *manifest,
        "## Worker Return Packet Shape Contract",
    ]
    if field is not None:
        lines.append(f"workerReturnPath: `{field}`")
    if scalar is not None:
        lines.append(f"Worker return path: `{scalar}`")
    lines += [
        *extra,
        "contractProfile: WORKER_RETURN_FULL_GATE_V1",
        "requiredGate: `python governance/compat/run_worker_return_fast_gate.py`",
        "individualCheckerSubstitution: FORBIDDEN",
        "workerReturnSkeleton: CHECKER_SAFE_SKELETON_REQUIRED",
        "## Verification Commands",
        "`python governance/compat/run_worker_return_fast_gate.py`",
    ]
    return "\n".join(lines) + "\n"


def _valid_return(work_order: str = WORK_ORDER) -> str:
    return "\n".join(
        [
            "# Worker Return",
            "Status: COMPLETE_PENDING_REVIEW",
            "Self-declared worker-return artifact: yes",
            f"Responds to work order: `{work_order}`",
            f"dispatchWorkOrder: `{work_order}`",
            "executionBaseHead: `abc1234`",
            "## Purpose", "Fixture.",
            "## Scope / Methodology", "Fixture.",
            "## Findings / Position", "Fixture.",
            "## Risk / Corrective Action", "Fixture.",
            "## Checker Source Read-Ahead Block",
            "applicableCheckersRead: `governance/compat/check_worker_return_quality_gate.py`",
            "literalTokensReviewed: fixture", "gateRunPurpose: confirmation", "claimBoundary: fixture",
            "## Agent Operation Trace Block",
            *[f"| {label} | fixture |" for label in QUALITY.AOT_FIELDS],
            "| Diff | `git diff --name-status` |",
            "## Delta Execution Claim Boundary Control Block",
            *[f"| {label} | fixture |" for label in QUALITY.DELTA_FIELDS],
            "CLAIM_REJECTED_NO_RECEIPT ACTION_EVIDENCE_PRESENT",
            "## Public Export Disposition", "DEFERRED_PRIVATE_ONLY",
            "## External Knowledge Intake Routing", QUALITY.INTERNAL_ONLY_INPUT_CANONICAL,
            "## Rescan Intelligence Hardening", "N/A with reason: fixture",
            "## Corpus Completeness And Report Integrity", "N/A with reason: fixture",
            "## Finding-To-Governance Learning Disposition", "fixture",
            "## Epistemic Process Block", "fixture",
            "## Claim Boundary", "fixture",
            "## git status --short", "fixture",
            "## Changed Files", "fixture",
            "## Command Evidence", "PASS fixture",
            "## No-Commit Statement", "WORKER_MUST_NOT_COMMIT honored.",
        ]
    ) + "\n"


class DispatchManifestAdmissionTests(unittest.TestCase):
    """DRC-01 / DRC-02 in an isolated temp root with no runtime change."""

    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.root = Path(self.temp_dir.name)

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def _classify(self, text: str) -> list[str]:
        path = self.root / WORK_ORDER
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")
        with patch.object(DISPATCH, "REPO_ROOT", self.root):
            report = DISPATCH._classify([WORK_ORDER])
        return [issue for v in report["violations"] for issue in v["issues"]]

    def test_positive_exact_manifest_and_binding_is_compliant(self) -> None:
        self.assertEqual(self._classify(_work_order()), [])

    def test_drc01_manifest_heading_absent_fails_without_runtime_change(self) -> None:
        issues = self._classify(_work_order(manifest=()))
        self.assertTrue(any("lacks `## Required Artifact Manifest`" in i for i in issues), issues)

    def test_drc01_no_manifest_or_binding_surface_still_fails(self) -> None:
        issues = self._classify(_work_order(manifest=(), scalar=None, field=None))
        self.assertTrue(any("lacks `## Required Artifact Manifest`" in i for i in issues), issues)
        self.assertTrue(any("lacks exact `Worker return path:`" in i for i in issues), issues)
        self.assertTrue(any("lacks exact `workerReturnPath:`" in i for i in issues), issues)

    def test_drc01_prose_only_manifest_fails(self) -> None:
        issues = self._classify(_work_order(manifest=("## Required Artifact Manifest", "See the paths above.")))
        self.assertTrue(any("prose-only or unparseable" in i for i in issues), issues)

    def test_drc01_unparseable_manifest_table_fails(self) -> None:
        manifest = ("## Required Artifact Manifest", "| Note | Detail |", "|---|---|", "| worker return | later |")
        issues = self._classify(_work_order(manifest=manifest))
        self.assertTrue(any("prose-only or unparseable" in i for i in issues), issues)

    def test_drc01_scaffold_shape_without_required_column_is_parseable(self) -> None:
        manifest = ("## Required Artifact Manifest", "| Artifact | Required worker action |", "|---|---|",
                    f"| `{RETURN_PATH}` | create |")
        self.assertEqual(self._classify(_work_order(manifest=manifest)), [])

    def test_drc02_missing_exact_scalar_fails(self) -> None:
        issues = self._classify(_work_order(scalar=None))
        self.assertTrue(any("lacks exact `Worker return path:`" in i for i in issues), issues)

    def test_drc02_missing_camelcase_field_fails(self) -> None:
        issues = self._classify(_work_order(field=None))
        self.assertTrue(any("lacks exact `workerReturnPath:`" in i for i in issues), issues)

    def test_drc02_mismatched_binding_fails(self) -> None:
        issues = self._classify(_work_order(scalar=UNRELATED_RETURN))
        self.assertTrue(any("disagree" in i for i in issues), issues)

    def test_dispatch_quality_command_must_not_reuse_dispatch_base(self) -> None:
        stale = _work_order() + (
            "python governance/compat/check_work_order_dispatch_quality.py "
            "--base abc1234 --head HEAD --enforce\n"
        )
        issues = self._classify(stale)
        self.assertTrue(any("use `executionBaseHead`" in i for i in issues), issues)
        current = stale.replace("--base abc1234", "--base <executionBaseHead>")
        self.assertEqual(self._classify(current), [])

    def test_drc02_duplicate_binding_fails(self) -> None:
        issues = self._classify(_work_order(extra=(f"Worker return path: `{RETURN_PATH}`",)))
        self.assertTrue(any("2 `Worker return path:` bindings" in i for i in issues), issues)

    def test_drc02_binding_outside_manifest_fails(self) -> None:
        issues = self._classify(_work_order(scalar=UNRELATED_RETURN, field=UNRELATED_RETURN))
        self.assertTrue(any("is not a required row" in i for i in issues), issues)

    def test_drc02_optional_manifest_row_does_not_satisfy_binding(self) -> None:
        manifest = ("## Required Artifact Manifest", "| Path | Required at handoff |", "|---|---|",
                    f"| `{RETURN_PATH}` | No |", "| `governance/compat/example_checker.py` | Yes |")
        issues = self._classify(_work_order(manifest=manifest))
        self.assertTrue(any("is not a required row" in i for i in issues), issues)


class ActiveWorkOrderReturnAdmissionTests(unittest.TestCase):
    """DRC-04 / DRC-05 / DRC-06 in an isolated temporary Git repository."""

    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.root = Path(self.temp_dir.name)
        self._git("init", "-q")
        self._git("config", "user.email", "drc@example.invalid")
        self._git("config", "user.name", "drc")
        self._write("README.md", "fixture\n")
        self._write(WORK_ORDER, _work_order())
        self._git("add", "-A")
        self._git("commit", "-q", "-m", "seed")
        self.patcher = patch.object(QUALITY, "REPO_ROOT", self.root)
        self.patcher.start()

    def tearDown(self) -> None:
        self.patcher.stop()
        self.temp_dir.cleanup()

    def _git(self, *args: str) -> None:
        subprocess.run(["git", *args], cwd=self.root, check=True, capture_output=True)

    def _write(self, rel: str, text: str) -> None:
        path = self.root / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")

    def _main(self, *args: str) -> tuple[int, str]:
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            code = QUALITY.main(["--enforce", *args])
        return code, out.getvalue()

    def test_drc06_legacy_zero_changed_without_active_order_stays_compliant(self) -> None:
        code, out = self._main()
        self.assertEqual(code, 0, out)
        self.assertIn("Eligible worker-return artifacts checked: 0", out)

    def test_drc04_absent_exact_return_fails_with_zero_changed(self) -> None:
        code, out = self._main("--active-work-order", WORK_ORDER)
        self.assertEqual(code, 1, out)
        self.assertIn("is absent; no other return can satisfy it", out)

    def test_drc04_ineligible_exact_return_fails(self) -> None:
        self._write(RETURN_PATH, "# Notes\nNot a worker return.\n")
        code, out = self._main("--active-work-order", WORK_ORDER)
        self.assertEqual(code, 1, out)
        self.assertIn("is not an eligible worker-return artifact", out)

    def test_drc04_committed_valid_exact_return_admitted_when_discovery_selects_zero(self) -> None:
        self._write(RETURN_PATH, _valid_return())
        self._git("add", "-A")
        self._git("commit", "-q", "-m", "return")
        self.assertEqual(QUALITY.get_changed_paths(None, "HEAD"), {})
        code, out = self._main("--active-work-order", WORK_ORDER)
        self.assertEqual(code, 0, out)
        self.assertIn("Eligible worker-return artifacts checked: 1", out)

    def test_drc04_exact_return_bound_to_other_order_fails(self) -> None:
        self._write(RETURN_PATH, _valid_return("docs/work_orders/CVF_OTHER_2026-09-23.md"))
        code, out = self._main("--active-work-order", WORK_ORDER)
        self.assertEqual(code, 1, out)
        self.assertIn("not the active work order", out)

    def test_drc04_active_order_must_be_contained_work_order(self) -> None:
        for bad in ("../outside.md", "README.md", "docs/work_orders/CVF_MISSING_2026-09-23.md"):
            code, out = self._main("--active-work-order", bad)
            self.assertEqual(code, 1, (bad, out))

    def test_drc04_active_order_without_exact_binding_fails(self) -> None:
        self._write(WORK_ORDER, _work_order(scalar=None))
        code, out = self._main("--active-work-order", WORK_ORDER)
        self.assertEqual(code, 1, out)
        self.assertIn("must bind exactly one agreeing", out)

    def test_drc05_unrelated_eligible_return_cannot_satisfy_active_order(self) -> None:
        self._write(UNRELATED_RETURN, _valid_return("docs/work_orders/CVF_OTHER_2026-09-23.md"))
        legacy_code, legacy_out = self._main()
        self.assertEqual(legacy_code, 0, legacy_out)
        self.assertIn("Eligible worker-return artifacts checked: 1", legacy_out)
        code, out = self._main("--active-work-order", WORK_ORDER)
        self.assertEqual(code, 1, out)
        self.assertIn(f"{RETURN_PATH}: exact worker return bound by", out)

    def test_drc05_exact_return_is_diagnosed_once_when_also_changed(self) -> None:
        self._write(RETURN_PATH, _valid_return())
        diagnostics = QUALITY.run(None, "HEAD", WORK_ORDER)
        self.assertEqual([d.path for d in diagnostics], [RETURN_PATH])
        self.assertTrue(diagnostics[0].is_clean, diagnostics[0].issues)


class TerminalReadinessOwnerBoundaryTests(unittest.TestCase):
    """DRC-06: review-cost control stays the terminal-readiness owner."""

    def test_quality_gate_does_not_take_over_terminal_readiness(self) -> None:
        quality_source = (COMPAT_DIR / "check_worker_return_quality_gate.py").read_text(encoding="utf-8")
        review_cost_source = (COMPAT_DIR / "check_review_cost_control.py").read_text(encoding="utf-8")
        self.assertNotIn("terminalReadinessVerdict", quality_source)
        self.assertIn("terminalReadinessVerdict", review_cost_source)


if __name__ == "__main__":
    unittest.main()
