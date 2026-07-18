#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().with_name("check_work_order_dispatch_quality.py")
SPEC = importlib.util.spec_from_file_location("check_work_order_dispatch_quality", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {MODULE_PATH}")
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class WorkOrderDispatchQualityTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.repo_root = Path(self.temp_dir.name)
        self._seed_required_markers()

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def _write(self, rel_path: str, text: str) -> None:
        path = self.repo_root / rel_path
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")

    def _seed_required_markers(self) -> None:
        self._write(
            MODULE.STANDARD_PATH,
            "\n".join(
                [
                    "Roadmap-To-Work-Order Trace Matrix",
                    "Negative And Fail-Condition Scan",
                    "Current Runtime Freshness Verification",
                    "ACCEPT_AS_OWNER_MAP coverage",
                    "Mandatory Gate-Failure Remediation Protocol",
                    "Worker Autonomy / No-Question Rule",
                    "Pending Artifact Evidence Finality",
                    "Commit Mode And Base-Anchor Lifecycle",
                    "Self-Reported Gate Evidence Consistency",
                    "Near-Threshold Owner Maintainability Plan",
                    "Work-Order Fulfillment Manifest",
                    MODULE.NEGATIVE_SEARCH_COLLISION_MARKER,
                    MODULE.SINGLE_AGENT_MULTI_ROLE_MARKER,
                    MODULE.INTAKE_ROLE_ROUTING_MARKER,
                    MODULE.EVIDENCE_REUSE_ENCODING_PLAN_MARKER,
                    MODULE.DISPATCH_PACKET_LEARNING_MARKER,
                    MODULE.THIS_SCRIPT_PATH,
                ]
            ),
        )
        self._write(
            MODULE.WORK_ORDER_TEMPLATE_PATH,
            "\n".join(
                [
                    "Source Verification Block",
                    "Roadmap-To-Work-Order Trace Matrix",
                    "Current Runtime Freshness Verification",
                    "ACCEPT_AS_OWNER_MAP coverage",
                    "Mandatory Gate-Failure Remediation Protocol",
                    "Worker Autonomy / No-Question Rule",
                    "Pending Artifact Evidence Finality",
                    "Commit Mode And Base-Anchor Lifecycle",
                    "Self-Reported Gate Evidence Consistency",
                    "Near-Threshold Owner Maintainability Plan",
                    "Work-Order Fulfillment Manifest",
                    MODULE.NEGATIVE_SEARCH_COLLISION_MARKER,
                    MODULE.SINGLE_AGENT_MULTI_ROLE_MARKER,
                    MODULE.INTAKE_ROLE_ROUTING_MARKER,
                    MODULE.EVIDENCE_REUSE_ENCODING_PLAN_MARKER,
                    MODULE.EVIDENCE_REUSE_ENCODING_STANDARD_PATH,
                    MODULE.THIS_SCRIPT_PATH,
                ]
            ),
        )
        self._write(
            MODULE.EVIDENCE_REUSE_ENCODING_STANDARD_PATH,
            "\n".join(
                [
                    MODULE.EVIDENCE_REUSE_ENCODING_PLAN_MARKER,
                    "REUSE_PRIOR_VERIFICATION",
                    "RECOMPUTE_REQUIRED",
                    "REVIEWER_RECOMPUTE_ONLY",
                    "unicodePathHandling",
                ]
            ),
        )
        self._write(
            MODULE.WORKER_AUTONOMY_STANDARD_PATH,
            "\n".join(
                [
                    "Worker Autonomy Prompt",
                    "Worker Autonomy / No-Question Rule",
                    "Commit Mode And Base-Anchor Requirement",
                    MODULE.THIS_SCRIPT_PATH,
                ]
            ),
        )
        self._write(MODULE.HOOK_CHAIN_PATH, MODULE.THIS_SCRIPT_PATH)

    def _ready_work_order_lines(self, extra_lines: list[str]) -> list[str]:
        return [
            "# Test",
            "Status: DISPATCH_READY",
            "Commit mode: WORKER_MAY_COMMIT",
            "dispatchBaseHead: abc123",
            "executionBaseHead: WORKER_MUST_CAPTURE_AT_START",
            "closureBaseHead: REVIEWER_CAPTURE",
            "## Worker Autonomy / No-Question Rule",
            "Allowed-scope remediation is mandatory.",
            "## Intake Role Routing Decision",
            "- Intake summary: operator request is bounded control-plane work.",
            "- Scope classification: bounded allowed scope with low blast radius.",
            "- Risk sensitivity: no public-sync, provider, live, secret, legal, production, or readiness claim.",
            "- Selected role route: routeMode=SINGLE_AGENT_SINGLE_ROLE.",
            "- Role separation basis: orchestrator and worker duties remain local; reviewer is not claimed independent.",
            "- Escalation condition: stop for operator checkpoint or external reviewer if scope/risk changes.",
            "## Source Verification Block",
            "| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |",
            "|---|---|---|---|---|---|",
            "| Template | `docs/reference/source.md` | Scope | `source.md` | doc | ACCEPT |",
            *extra_lines,
        ]

    def test_legacy_adjacent_foundation_work_order_without_coverage_disposition_fails(self) -> None:
        work_order = "docs/work_orders/CVF_WO_LEGACY_COVERAGE_TEST_2026-06-14.md"
        self._write(
            work_order,
            "\n".join(
                self._ready_work_order_lines(
                    [
                        "## Scope",
                        "This foundation plane workflow-chain work order touches legacy absorption for Model Gateway.",
                        "Legacy source family: `.private_reference/legacy/CVF_Important/ADDING_MODEL GATEWAY/`.",
                    ]
                )
            ),
        )
        self._write("docs/reference/source.md", "Scope\n")

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertFalse(report["compliant"])
        issues = report["violations"][0]["issues"]
        self.assertTrue(
            any(MODULE.LEGACY_COVERAGE_DISPOSITION_MARKER in issue for issue in issues),
            issues,
        )

    def test_legacy_adjacent_foundation_work_order_with_coverage_row_passes(self) -> None:
        work_order = "docs/work_orders/CVF_WO_LEGACY_COVERAGE_TEST_2026-06-14.md"
        self._write(
            work_order,
            "\n".join(
                self._ready_work_order_lines(
                    [
                        "## Scope",
                        "This foundation plane workflow-chain work order touches legacy absorption for Model Gateway.",
                        "Legacy source family: `.private_reference/legacy/CVF_Important/ADDING_MODEL GATEWAY/`.",
                        f"## {MODULE.LEGACY_COVERAGE_DISPOSITION_MARKER}",
                        f"- Coverage index: `{MODULE.LEGACY_COVERAGE_INDEX_PATH}`.",
                        "- Stable row id: `MGW-001`.",
                    ]
                )
            ),
        )
        self._write("docs/reference/source.md", "Scope\n")

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertTrue(report["compliant"], report.get("violations"))

    def test_legacy_adjacent_foundation_work_order_with_not_applicable_reason_passes(self) -> None:
        work_order = "docs/work_orders/CVF_WO_LEGACY_COVERAGE_TEST_2026-06-14.md"
        self._write(
            work_order,
            "\n".join(
                self._ready_work_order_lines(
                    [
                        "## Scope",
                        "This foundation plane workflow-chain work order mentions legacy only to record exclusion.",
                        f"## {MODULE.LEGACY_COVERAGE_DISPOSITION_MARKER}",
                        (
                            "NOT_APPLICABLE_WITH_REASON: guard-only packet does not upgrade, "
                            "reopen, or plan a legacy-adjacent CVF capability."
                        ),
                    ]
                )
            ),
        )
        self._write("docs/reference/source.md", "Scope\n")

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertTrue(report["compliant"], report.get("violations"))

    def test_lhw6_dispatch_without_gc018_and_trace_matrix_fails(self) -> None:
        work_order = "docs/work_orders/CVF_WO_LHW6_T1_TEST_2026-05-28.md"
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: DISPATCHED",
                    "Authority: docs/roadmaps/CVF_LHW6_TEST_ROADMAP_2026-05-28.md",
                    "## Source Verification Block",
                    "| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |",
                    "|---|---|---|---|---|---|",
                    "| Symbol | `governance/contracts/example.ts` | line 1 | `ExampleMode` | ExampleMode | ACCEPT |",
                ]
            ),
        )
        self._write("governance/contracts/example.ts", "export type ExampleMode = 'one';\n")

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertFalse(report["compliant"])
        issues = report["violations"][0]["issues"]
        self.assertIn("roadmap-derived work order is dispatch/ready without Roadmap-To-Work-Order Trace Matrix", issues)
        self.assertIn("LHW6 connector work order is dispatch/ready without fresh GC-018 baseline", issues)

    def test_dispatch_protected_path_without_core_guard_carrier_fails(self) -> None:
        work_order = "docs/work_orders/CVF_WO_PROTECTED_PATH_TEST_2026-06-13.md"
        self._write(
            work_order,
            "\n".join(
                self._ready_work_order_lines(
                    [
                        "## Allowed Implementation Scope",
                        "- `governance/compat/check_new_guard.py`",
                    ]
                )
            ),
        )
        self._write("docs/reference/source.md", "## Scope\nsource\n")

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertFalse(report["compliant"])
        issues = report["violations"][0]["issues"]
        self.assertTrue(
            any(
                "without a `Core Guard Self-Protection Authorization` block"
                in issue
                for issue in issues
            )
        )

    def test_dispatch_protected_path_with_complete_core_guard_carrier_passes(self) -> None:
        work_order = "docs/work_orders/CVF_WO_PROTECTED_PATH_TEST_2026-06-13.md"
        self._write(
            work_order,
            "\n".join(
                self._ready_work_order_lines(
                    [
                        "## Allowed Implementation Scope",
                        "- `governance/compat/check_new_guard.py`",
                        "## Core Guard Self-Protection Authorization",
                        "Authorized guard-maintenance scope: create one focused checker.",
                        "Protected paths:",
                        "- `governance/compat/check_new_guard.py`",
                        "Operator authorization: operator authorized this protected-path batch.",
                        "Rollback boundary: revert only this checker if rejected.",
                    ]
                )
            ),
        )
        self._write("docs/reference/source.md", "## Scope\nsource\n")

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertTrue(report["compliant"])

    def test_fast_lane_ready_with_closed_pass_precondition_fails(self) -> None:
        audit = "docs/reviews/CVF_LHW6_T2_FAST_LANE_AUDIT_2026-05-28.md"
        self._write(
            audit,
            "\n".join(
                [
                    "# Audit",
                    "Status: FAST_LANE_READY",
                    "Decision: FAST_LANE_READY (pre-condition: T1 CLOSED_PASS)",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([audit])

        self.assertFalse(report["compliant"])
        issues = report["violations"][0]["issues"]
        self.assertIn("FAST_LANE_READY audit has unmet/conditional CLOSED_PASS prerequisite; use HOLD_* until satisfied", issues)

    def test_worker_must_not_commit_completion_review_owned_by_worker_fails(self) -> None:
        work_order = "docs/work_orders/CVF_WO_TEST_WORKER_BOUNDARY_2026-06-03.md"
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: DISPATCH_READY",
                    "Commit mode: WORKER_MUST_NOT_COMMIT",
                    "dispatchBaseHead: abc123",
                    "executionBaseHead: WORKER_MUST_CAPTURE_AT_START",
                    "closureBaseHead: NOT_EXECUTED_YET",
                    "## Worker Autonomy / No-Question Rule",
                    "Allowed-scope remediation is mandatory.",
                    "## Source Verification Block",
                    "| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |",
                    "|---|---|---|---|---|---|",
                    "| Template | `docs/reference/source.md` | Scope | `source.md` | doc | ACCEPT |",
                    "## Agent Roles",
                    "| Role | Responsibility | Boundary |",
                    "|---|---|---|",
                    "| Worker | produce packet and completion review | no commit |",
                    "## Reviewer Closure Conversion Block",
                    "completionReviewPath: `docs/reviews/CVF_TEST_COMPLETION_2026-06-03.md`",
                    "reviewerOwnedClosurePaths:",
                    "- `docs/work_orders/CVF_WO_TEST_WORKER_BOUNDARY_2026-06-03.md`",
                    "- `docs/reviews/CVF_TEST_COMPLETION_2026-06-03.md`",
                ]
            ),
        )
        self._write("docs/reference/source.md", "## Scope\nsource\n")

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertFalse(report["compliant"])
        issues = report["violations"][0]["issues"]
        self.assertIn(
            "WORKER_MUST_NOT_COMMIT dispatch assigns completion review to Worker; "
            "use a worker handoff/evaluation artifact and reviewer-owned completion review, "
            "or explicitly change role/commit mode before dispatch",
            issues,
        )

    def test_worker_must_not_commit_reviewer_completion_review_allowed(self) -> None:
        work_order = "docs/work_orders/CVF_WO_TEST_REVIEWER_BOUNDARY_2026-06-03.md"
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: DISPATCH_READY",
                    "Commit mode: WORKER_MUST_NOT_COMMIT",
                    "dispatchBaseHead: abc123",
                    "executionBaseHead: WORKER_MUST_CAPTURE_AT_START",
                    "closureBaseHead: NOT_EXECUTED_YET",
                    "## Worker Autonomy / No-Question Rule",
                    "Allowed-scope remediation is mandatory.",
                    "## Source Verification Block",
                    "| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |",
                    "|---|---|---|---|---|---|",
                    "| Template | `docs/reference/source.md` | Scope | `source.md` | doc | ACCEPT |",
                    "## Agent Roles",
                    "| Role | Responsibility | Boundary |",
                    "|---|---|---|",
                    "| Worker | produce packet and handoff artifact | no commit |",
                    "| Reviewer | create completion review | owns closure |",
                    "## Reviewer Closure Conversion Block",
                    "completionReviewPath: `docs/reviews/CVF_TEST_COMPLETION_2026-06-03.md`",
                    "reviewerOwnedClosurePaths:",
                    "- `docs/work_orders/CVF_WO_TEST_REVIEWER_BOUNDARY_2026-06-03.md`",
                    "- `docs/reviews/CVF_TEST_COMPLETION_2026-06-03.md`",
                    "## Required Artifacts",
                    "| Artifact | Path | Owner |",
                    "|---|---|---|",
                    "| Completion review | `docs/reviews/CVF_TEST_COMPLETION_2026-06-03.md` | Reviewer |",
                ]
            ),
        )
        self._write("docs/reference/source.md", "## Scope\nsource\n")

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        issues = report["violations"][0]["issues"] if report["violations"] else []
        self.assertNotIn(
            "WORKER_MUST_NOT_COMMIT dispatch assigns completion review to Worker; "
            "use a worker handoff/evaluation artifact and reviewer-owned completion review, "
            "or explicitly change role/commit mode before dispatch",
            issues,
        )

    def test_single_agent_multi_role_without_control_block_fails(self) -> None:
        work_order = "docs/work_orders/CVF_WO_SINGLE_AGENT_MULTI_ROLE_TEST_2026-06-11.md"
        self._write("docs/reference/source.md", "## Scope\nsource\n")
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: DISPATCH_READY",
                    "Commit mode: WORKER_MAY_COMMIT",
                    "dispatchBaseHead: abc123",
                    "executionBaseHead: WORKER_MUST_CAPTURE_AT_START",
                    "closureBaseHead: REVIEWER_CAPTURE",
                    "## Worker Autonomy / No-Question Rule",
                    "Allowed-scope remediation is mandatory.",
                    "## Source Verification Block",
                    "| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |",
                    "|---|---|---|---|---|---|",
                    "| Template | `docs/reference/source.md` | Scope | `source.md` | doc | ACCEPT |",
                    "## Role Assignment",
                    "| Role | Owner | Evidence boundary |",
                    "|---|---|---|",
                    "| Worker | Codex | patch and tests |",
                    "| Reviewer | Codex | review and commit |",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertFalse(report["compliant"])
        self.assertIn(
            "work order uses single-agent multi-role execution but lacks "
            "`## Single-Agent Multi-Role Control Block`",
            report["violations"][0]["issues"],
        )

    def test_single_agent_multi_role_with_control_block_passes(self) -> None:
        work_order = "docs/work_orders/CVF_WO_SINGLE_AGENT_MULTI_ROLE_PASS_2026-06-11.md"
        self._write("docs/reference/source.md", "## Scope\nsource\n")
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: DISPATCH_READY",
                    "Commit mode: WORKER_MAY_COMMIT",
                    "dispatchBaseHead: abc123",
                    "executionBaseHead: WORKER_MUST_CAPTURE_AT_START",
                    "closureBaseHead: REVIEWER_CAPTURE",
                    "## Worker Autonomy / No-Question Rule",
                    "Allowed-scope remediation is mandatory.",
                    "## Source Verification Block",
                    "| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |",
                    "|---|---|---|---|---|---|",
                    "| Template | `docs/reference/source.md` | Scope | `source.md` | doc | ACCEPT |",
                    "## Role Assignment",
                    "| Role | Owner | Evidence boundary |",
                    "|---|---|---|",
                    "| Worker | Codex | patch and tests |",
                    "| Reviewer | Codex | review and commit |",
                    "## Single-Agent Multi-Role Control Block",
                    "- Role separation ledger: Orchestrator, Worker, Reviewer, and Committer duties are recorded separately.",
                    "- Evidence basis: review uses git diff, source paths, focused test output, and gate results, not memory-only claims.",
                    "- Self-review boundary: independent review not claimed; no independent review is represented by this block.",
                    "- Escalation conditions: stop and ask operator or external reviewer if scope/risk/public/provider/live proof changes.",
                    "- Gate sequence: reviewer-fast before commit and pre-closure on a real range before closure claim.",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        single_agent_issues = [
            issue
            for violation in report["violations"]
            for issue in violation["issues"]
            if "single-agent multi-role" in issue
        ]
        self.assertEqual([], single_agent_issues)

    def test_dispatch_ready_without_intake_role_routing_decision_fails(self) -> None:
        work_order = "docs/work_orders/CVF_WO_INTAKE_ROUTING_MISSING_2026-06-11.md"
        self._write("docs/reference/source.md", "## Scope\nsource\n")
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: DISPATCH_READY",
                    "Commit mode: WORKER_MAY_COMMIT",
                    "dispatchBaseHead: abc123",
                    "executionBaseHead: WORKER_MUST_CAPTURE_AT_START",
                    "closureBaseHead: REVIEWER_CAPTURE",
                    "## Worker Autonomy / No-Question Rule",
                    "Allowed-scope remediation is mandatory.",
                    "## Source Verification Block",
                    "| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |",
                    "|---|---|---|---|---|---|",
                    "| Template | `docs/reference/source.md` | Scope | `source.md` | doc | ACCEPT |",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertFalse(report["compliant"])
        self.assertIn(
            "dispatch/ready work order lacks `## Intake Role Routing Decision`",
            report["violations"][0]["issues"],
        )

    def test_dispatch_ready_with_intake_role_routing_decision_passes(self) -> None:
        work_order = "docs/work_orders/CVF_WO_INTAKE_ROUTING_PASS_2026-06-11.md"
        self._write("docs/reference/source.md", "## Scope\nsource\n")
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: DISPATCH_READY",
                    "Commit mode: WORKER_MAY_COMMIT",
                    "dispatchBaseHead: abc123",
                    "executionBaseHead: WORKER_MUST_CAPTURE_AT_START",
                    "closureBaseHead: REVIEWER_CAPTURE",
                    "## Worker Autonomy / No-Question Rule",
                    "Allowed-scope remediation is mandatory.",
                    "## Intake Role Routing Decision",
                    "- Intake summary: operator request is non-coder control-plane work.",
                    "- Scope classification: bounded allowed scope with low blast radius.",
                    "- Risk sensitivity: no public-sync, provider, live, secret, legal, production, or readiness claim.",
                    "- Selected role route: routeMode=SINGLE_AGENT_SINGLE_ROLE.",
                    "- Role separation basis: orchestrator and worker duties remain local; reviewer is not claimed independent.",
                    "- Escalation condition: stop for operator checkpoint or external reviewer if scope/risk changes.",
                    "## Source Verification Block",
                    "| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |",
                    "|---|---|---|---|---|---|",
                    "| Template | `docs/reference/source.md` | Scope | `source.md` | doc | ACCEPT |",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        routing_issues = [
            issue
            for violation in report["violations"]
            for issue in violation["issues"]
            if "intake role routing" in issue or "Intake Role Routing" in issue
        ]
        self.assertEqual([], routing_issues)

    def test_dispatch_ready_t11b_reference_without_evidence_reuse_plan_fails(self) -> None:
        work_order = "docs/work_orders/CVF_WO_T11B_REUSE_PLAN_MISSING_2026-06-11.md"
        self._write("docs/reference/source.md", "## Scope\nsource\n")
        self._write(
            work_order,
            "\n".join(
                self._ready_work_order_lines(
                    [
                        "## Execution Instructions",
                        "Consume the T11B verification result and Unicode-path extracted text.",
                    ]
                )
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertFalse(report["compliant"])
        self.assertIn(
            "dispatch/ready work order cites prior verification, external evidence, "
            "source bundle, T11B, extracted text, or Unicode-path evidence but lacks "
            "`## Evidence Reuse And Encoding Plan`",
            report["violations"][0]["issues"],
        )

    def test_dispatch_ready_t11b_reference_with_reuse_plan_passes(self) -> None:
        work_order = "docs/work_orders/CVF_WO_T11B_REUSE_PLAN_PASS_2026-06-11.md"
        self._write("docs/reference/source.md", "## Scope\nsource\n")
        self._write(
            work_order,
            "\n".join(
                self._ready_work_order_lines(
                    [
                        "## Evidence Reuse And Encoding Plan",
                        "verificationMode: REUSE_PRIOR_VERIFICATION",
                        "priorVerificationArtifact: `docs/reviews/CVF_LPCI2_T11B_SOURCE_VERIFICATION_COMPLETION_2026-06-07.md`",
                        "priorVerificationAnchor: `t11b-closure`",
                        "freshRecomputeRequired: NO",
                        "recomputeReason: N/A with reason",
                        "unicodePathHandling: use literal paths and UTF-8-safe readers",
                        "extractedTextAuthority: AUXILIARY_ONLY",
                        "## Execution Instructions",
                        "Consume the T11B verification result and Unicode-path extracted text.",
                    ]
                )
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        evidence_plan_issues = [
            issue
            for violation in report["violations"]
            for issue in violation["issues"]
            if "Evidence Reuse And Encoding Plan" in issue
            or "REUSE_PRIOR_VERIFICATION" in issue
            or "unicodePathHandling" in issue
            or "extractedTextAuthority" in issue
        ]
        self.assertEqual([], evidence_plan_issues)

    def test_dispatch_ready_recompute_mode_without_reason_fails(self) -> None:
        work_order = "docs/work_orders/CVF_WO_T11B_RECOMPUTE_REASON_MISSING_2026-06-11.md"
        self._write("docs/reference/source.md", "## Scope\nsource\n")
        self._write(
            work_order,
            "\n".join(
                self._ready_work_order_lines(
                    [
                        "## Evidence Reuse And Encoding Plan",
                        "verificationMode: RECOMPUTE_REQUIRED",
                        "priorVerificationArtifact: `docs/reviews/CVF_LPCI2_T11B_SOURCE_VERIFICATION_COMPLETION_2026-06-07.md`",
                        "priorVerificationAnchor: `t11b-closure`",
                        "freshRecomputeRequired: YES",
                        "recomputeReason: N/A with reason",
                        "unicodePathHandling: use literal paths and UTF-8-safe readers",
                        "extractedTextAuthority: AUXILIARY_ONLY",
                        "## Execution Instructions",
                        "Consume the T11B verification result and Unicode-path extracted text.",
                    ]
                )
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertFalse(report["compliant"])
        self.assertIn(
            "`RECOMPUTE_REQUIRED` requires a concrete `recomputeReason`",
            report["violations"][0]["issues"],
        )

    def test_accept_row_with_missing_source_file_fails(self) -> None:
        work_order = "docs/work_orders/CVF_WO_LHW6_T2_TEST_2026-05-28.md"
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: HOLD_PENDING_T1",
                    "## Source Verification Block",
                    "| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |",
                    "|---|---|---|---|---|---|",
                    "| Future values | `docs/reference/CVF_LHW6_MISSING_SPEC.md` | S3 | `bridgeAdvisoryType` | BridgeSpec | ACCEPT |",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertFalse(report["compliant"])
        self.assertIn(
            "Source Verification ACCEPT cites missing source file `docs/reference/CVF_LHW6_MISSING_SPEC.md`",
            report["violations"][0]["issues"],
        )

    def test_accept_value_row_missing_declared_source_value_fails(self) -> None:
        work_order = "docs/work_orders/CVF_WO_LHW6_T3_TEST_2026-05-28.md"
        self._write(
            "governance/contracts/workflow.ts",
            "\n".join(
                [
                    "export type WorkflowRecoveryAction =",
                    "  | 'resume_from_checkpoint'",
                    "  | 'request_human_review';",
                ]
            ),
        )
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: HOLD_PENDING_T1_T2",
                    "## Source Verification Block",
                    "| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |",
                    "|---|---|---|---|---|---|",
                    "| WorkflowRecoveryAction values `resume_from_checkpoint` | `governance/contracts/workflow.ts` | lines 1-3 | `WorkflowRecoveryAction` | WorkflowRecoveryAction | ACCEPT |",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertFalse(report["compliant"])
        self.assertIn(
            "Source Verification ACCEPT row claims values for `WorkflowRecoveryAction` but omits source value(s): request_human_review",
            report["violations"][0]["issues"],
        )

    def test_ready_work_order_with_blocked_source_row_fails(self) -> None:
        work_order = "docs/work_orders/CVF_WO_PM1_TEST_2026-05-29.md"
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: READY_FOR_IMPLEMENTATION",
                    "## Source Verification Block",
                    "| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |",
                    "|---|---|---|---|---|---|",
                    "| Executable proof path | `docs/reference/CVF_MISSING_METHOD_SPEC.md` | missing | `json_mode` | Method runner | BLOCKED_SOURCE_NOT_FOUND |",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertFalse(report["compliant"])
        self.assertIn(
            "dispatch/ready work order contains blocking Source Verification disposition; "
            "use HOLD/DRAFT until source facts are resolved",
            report["violations"][0]["issues"],
        )

    def test_ready_work_order_with_required_dependency_placeholder_fails(self) -> None:
        work_order = "docs/work_orders/CVF_WO_CI2_T5_TEST_2026-06-03.md"
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: DISPATCH_READY",
                    "dispatchBaseHead: abc1234",
                    "executionBaseHead: WORKER_MUST_CAPTURE_AT_START",
                    "closureBaseHead: NOT_EXECUTED_YET",
                    "Commit mode: WORKER_MUST_NOT_COMMIT",
                    "## Authority Chain",
                    "| Authority | Path / basis | Disposition |",
                    "| --- | --- | --- |",
                    "| Prior tranche | T4 pilot pack after closure | REQUIRED |",
                    "## Source Verification Block",
                    "| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |",
                    "|---|---|---|---|---|---|",
                    "| Existing use-case roadmap | `docs/roadmaps/CVF_LPCI_TEST.md` | title | `LPCI` | use-case roadmap | ACCEPT |",
                    "## Worker Autonomy / No-Question Rule",
                    "Proceed inside allowed scope.",
                ]
            ),
        )
        self._write("docs/roadmaps/CVF_LPCI_TEST.md", "# LPCI\n")

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertFalse(report["compliant"])
        issues = report["violations"][0]["issues"]
        self.assertIn(
            "dispatch/ready work order contains unresolved prerequisite disposition `REQUIRED`; "
            "release HOLD only after replacing it with source-backed ACCEPT evidence per "
            "docs/reference/CVF_WORK_ORDER_DEPENDENCY_RELEASE_EVIDENCE_STANDARD_2026-06-03.md",
            issues,
        )

    def test_ready_work_order_dependency_artifact_commit_must_contain_path(self) -> None:
        work_order = "docs/work_orders/CVF_WO_DEPENDENCY_COMMIT_TEST_2026-06-03.md"
        prerequisite = "docs/reviews/CVF_PRIOR_COMPLETION_2026-06-03.md"
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: DISPATCH_READY",
                    "dispatchBaseHead: abc1234",
                    "executionBaseHead: WORKER_MUST_CAPTURE_AT_START",
                    "closureBaseHead: NOT_EXECUTED_YET",
                    "Commit mode: WORKER_MUST_NOT_COMMIT",
                    "## Authority Chain",
                    "| Authority | Path / basis | Disposition |",
                    "| --- | --- | --- |",
                    f"| Prior tranche | `{prerequisite}` at commit `deadbee` | ACCEPT |",
                    "## Source Verification Block",
                    "| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |",
                    "|---|---|---|---|---|---|",
                    "| Existing use-case roadmap | `docs/roadmaps/CVF_LPCI_TEST.md` | title | `LPCI` | use-case roadmap | ACCEPT |",
                    "## Worker Autonomy / No-Question Rule",
                    "Proceed inside allowed scope.",
                ]
            ),
        )
        self._write("docs/roadmaps/CVF_LPCI_TEST.md", "# LPCI\n")

        def fake_run_git(args: list[str]) -> tuple[int, str, str]:
            if args[:2] == ["cat-file", "-e"]:
                return 1, "", "missing"
            return 0, "", ""

        with patch.object(MODULE, "REPO_ROOT", self.repo_root), patch.object(MODULE, "_run_git", fake_run_git):
            report = MODULE._classify([work_order])

        self.assertFalse(report["compliant"])
        self.assertIn(
            "dispatch/ready work order cites dependency artifact "
            f"`{prerequisite}` at commit `deadbee`, but that commit does not contain the path; "
            "cite the closure commit that contains the prerequisite artifact per "
            "docs/reference/CVF_WORK_ORDER_DEPENDENCY_RELEASE_EVIDENCE_STANDARD_2026-06-03.md",
            report["violations"][0]["issues"],
        )

    def test_ready_work_order_without_worker_autonomy_fails(self) -> None:
        work_order = "docs/work_orders/CVF_WO_AUTONOMY_TEST_2026-06-01.md"
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: READY_FOR_IMPLEMENTATION",
                    "## Source Verification Block",
                    "| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |",
                    "|---|---|---|---|---|---|",
                    "| Symbol | `governance/contracts/example.ts` | line 1 | `ExampleMode` | ExampleMode | ACCEPT |",
                ]
            ),
        )
        self._write("governance/contracts/example.ts", "export type ExampleMode = 'one';\n")

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertFalse(report["compliant"])
        self.assertIn(
            "dispatch/ready work order lacks Worker Autonomy / No-Question Rule",
            report["violations"][0]["issues"],
        )

    def test_ready_work_order_without_commit_mode_fails(self) -> None:
        work_order = "docs/work_orders/CVF_WO_COMMIT_MODE_TEST_2026-06-02.md"
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: READY_FOR_IMPLEMENTATION",
                    "## Worker Autonomy / No-Question Rule",
                    "Proceed inside allowed scope.",
                    "dispatchBaseHead: abc1234",
                    "executionBaseHead: capture before edits",
                    "closureBaseHead: reviewer stage",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertFalse(report["compliant"])
        self.assertIn(
            "dispatch/ready work order lacks explicit `Commit mode: "
            "WORKER_MAY_COMMIT | WORKER_MUST_NOT_COMMIT`",
            report["violations"][0]["issues"],
        )

    def test_ready_work_order_without_anchor_lifecycle_fails(self) -> None:
        work_order = "docs/work_orders/CVF_WO_ANCHOR_LIFECYCLE_TEST_2026-06-02.md"
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: DISPATCHED_TO_WORKER",
                    "## Worker Autonomy / No-Question Rule",
                    "Proceed inside allowed scope.",
                    "Commit mode: WORKER_MUST_NOT_COMMIT",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertFalse(report["compliant"])
        self.assertIn(
            "dispatch/ready work order lacks base-anchor lifecycle marker(s): "
            "dispatchBaseHead, executionBaseHead, closureBaseHead",
            report["violations"][0]["issues"],
        )

    def test_ready_work_order_with_invalid_commit_mode_fails(self) -> None:
        work_order = "docs/work_orders/CVF_WO_INVALID_COMMIT_MODE_TEST_2026-06-02.md"
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: DISPATCHED_TO_WORKER",
                    "## Worker Autonomy / No-Question Rule",
                    "Proceed inside allowed scope.",
                    "Commit mode: ASK_OPERATOR_LATER",
                    "dispatchBaseHead: abc1234",
                    "executionBaseHead: capture before edits",
                    "closureBaseHead: reviewer stage",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertFalse(report["compliant"])
        self.assertIn(
            "dispatch/ready work order has invalid commit mode "
            "`ASK_OPERATOR_LATER`; use WORKER_MAY_COMMIT or WORKER_MUST_NOT_COMMIT",
            report["violations"][0]["issues"],
        )

    def test_ready_no_commit_work_order_with_anchor_lifecycle_passes(self) -> None:
        work_order = "docs/work_orders/CVF_WO_VALID_NO_COMMIT_TEST_2026-06-02.md"
        self._write(
            work_order,
            "\n".join(
                [
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
                    "completionReviewPath: `docs/reviews/CVF_VALID_NO_COMMIT_COMPLETION_2026-06-02.md`",
                    "reviewerOwnedClosurePaths:",
                    "- `docs/work_orders/CVF_WO_VALID_NO_COMMIT_TEST_2026-06-02.md`",
                    "- `docs/reviews/CVF_VALID_NO_COMMIT_COMPLETION_2026-06-02.md`",
                    "## Worker Return Packet Shape Contract",
                    "contractProfile: WORKER_RETURN_FULL_GATE_V1",
                    "requiredGate: `python governance/compat/run_worker_return_fast_gate.py`",
                    "individualCheckerSubstitution: FORBIDDEN",
                    "workerReturnSkeleton: CHECKER_SAFE_SKELETON_REQUIRED",
                    "## Verification Commands",
                    "`python governance/compat/run_worker_return_fast_gate.py`",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertTrue(report["compliant"])

    def test_ready_no_commit_work_order_without_reviewer_closure_contract_fails(self) -> None:
        work_order = "docs/work_orders/CVF_WO_NO_REVIEWER_CONVERSION_TEST_2026-06-07.md"
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: DISPATCHED_TO_WORKER",
                    "## Worker Autonomy / No-Question Rule",
                    "Proceed inside allowed scope.",
                    "Commit mode: WORKER_MUST_NOT_COMMIT",
                    "dispatchBaseHead: abc1234",
                    "executionBaseHead: capture before edits",
                    "closureBaseHead: reviewer stage",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertFalse(report["compliant"])
        issues = report["violations"][0]["issues"]
        self.assertIn("WORKER_MUST_NOT_COMMIT dispatch lacks Reviewer Closure Conversion block", issues)
        self.assertIn(
            "WORKER_MUST_NOT_COMMIT dispatch lacks `completionReviewPath` for reviewer-owned closure",
            issues,
        )
        self.assertIn(
            "WORKER_MUST_NOT_COMMIT dispatch lacks `reviewerOwnedClosurePaths` for closure scope",
            issues,
        )

    def test_ready_no_commit_work_order_without_worker_return_shape_contract_fails(self) -> None:
        work_order = "docs/work_orders/CVF_WO_NO_WORKER_RETURN_SHAPE_TEST_2026-06-20.md"
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: DISPATCHED_TO_WORKER",
                    "## Worker Autonomy / No-Question Rule",
                    "Proceed inside allowed scope.",
                    "Commit mode: WORKER_MUST_NOT_COMMIT",
                    "dispatchBaseHead: abc1234",
                    "executionBaseHead: capture before edits",
                    "closureBaseHead: reviewer stage",
                    "## Reviewer Closure Conversion Block",
                    "completionReviewPath: `docs/reviews/CVF_NO_SHAPE_COMPLETION_2026-06-20.md`",
                    "reviewerOwnedClosurePaths:",
                    "- `docs/reviews/CVF_NO_SHAPE_COMPLETION_2026-06-20.md`",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertFalse(report["compliant"])
        issues = report["violations"][0]["issues"]
        self.assertTrue(
            any(MODULE.WORKER_RETURN_PACKET_SHAPE_CONTRACT_MARKER in issue for issue in issues),
            issues,
        )

    def test_ready_no_commit_work_order_with_incomplete_worker_return_shape_contract_fails(self) -> None:
        work_order = "docs/work_orders/CVF_WO_INCOMPLETE_WORKER_RETURN_SHAPE_TEST_2026-06-20.md"
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: DISPATCHED_TO_WORKER",
                    "## Worker Autonomy / No-Question Rule",
                    "Proceed inside allowed scope.",
                    "Commit mode: WORKER_MUST_NOT_COMMIT",
                    "dispatchBaseHead: abc1234",
                    "executionBaseHead: capture before edits",
                    "closureBaseHead: reviewer stage",
                    "## Reviewer Closure Conversion Block",
                    "completionReviewPath: `docs/reviews/CVF_INCOMPLETE_SHAPE_COMPLETION_2026-06-20.md`",
                    "reviewerOwnedClosurePaths:",
                    "- `docs/reviews/CVF_INCOMPLETE_SHAPE_COMPLETION_2026-06-20.md`",
                    "## Worker Return Packet Shape Contract",
                    "contractProfile: WORKER_RETURN_FULL_GATE_V1",
                    "requiredGate: `python governance/compat/run_worker_return_fast_gate.py`",
                    "workerReturnSkeleton: CHECKER_SAFE_SKELETON_REQUIRED",
                    "## Verification Commands",
                    "`python governance/compat/run_worker_return_fast_gate.py`",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertFalse(report["compliant"])
        issues = report["violations"][0]["issues"]
        self.assertIn(
            "`## Worker Return Packet Shape Contract` missing required contract term `individualCheckerSubstitution: FORBIDDEN`",
            issues,
        )

    def test_ready_work_order_cannot_forbid_near_threshold_owner_surface(self) -> None:
        work_order = "docs/work_orders/CVF_WO_OWNER_ROTATION_TEST_2026-06-01.md"
        owner_path = "EXTENSIONS/CVF_WEB/src/app/api/execute/route.ts"
        adjacent_path = "EXTENSIONS/CVF_WEB/src/app/api/memory/readout/route.ts"
        self._write(owner_path, "\n".join(f"line {index}" for index in range(118)) + "\n")
        self._write(
            MODULE.FILE_SIZE_REGISTRY_PATH,
            json.dumps(
                {
                    "thresholds": {
                        "general_source": {
                            "softThresholdLines": 90,
                            "hardThresholdLines": 120,
                        }
                    },
                    "nearHardRotationMarginLines": 5,
                    "nearHardMinShrinkLines": 10,
                    "proactiveOwnerSurfaces": [
                        {
                            "path": owner_path,
                            "status": "ACTIVE",
                            "domainPrefixes": ["EXTENSIONS/CVF_WEB/src/app/api/"],
                        }
                    ],
                }
            ),
        )
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: DISPATCHED_TO_WORKER",
                    "Allowed scope:",
                    f"- add `{adjacent_path}`",
                    "Forbidden scope:",
                    f"- `{owner_path}`",
                    "## Worker Autonomy / No-Question Rule",
                    "Proceed inside scope.",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertFalse(report["compliant"])
        self.assertIn(
            "dispatch/ready work order enters registered near-threshold owner domain for "
            f"`{owner_path}` (118/120 lines) without `## Near-Threshold Owner Maintainability Plan`",
            report["violations"][0]["issues"],
        )

    def test_pending_review_claiming_clean_git_status_fails(self) -> None:
        review = "docs/reviews/CVF_PENDING_REVIEW_2026-06-01.md"
        self._write(
            review,
            "\n".join(
                [
                    "# Pending Review",
                    "Status: IN_PROGRESS_DISPATCHED",
                    "## Governance Gates Run",
                    "- `git status --short` -> clean",
                ]
            ),
        )

        with (
            patch.object(MODULE, "REPO_ROOT", self.repo_root),
            patch.object(MODULE, "_get_changed", return_value={review: {"A"}}),
        ):
            report = MODULE._classify([review], base_ref="HEAD")

        self.assertFalse(report["compliant"])
        self.assertIn(
            "pending changed artifact records `git status --short` as clean even though the artifact "
            "itself is not committed; record the actual pending status or commit first",
            report["violations"][0]["issues"],
        )

    def test_pending_review_with_head_prev_range_evidence_fails(self) -> None:
        review = "docs/reviews/CVF_PENDING_RANGE_REVIEW_2026-06-01.md"
        self._write(
            review,
            "\n".join(
                [
                    "# Pending Range Review",
                    "Status: IN_PROGRESS_DISPATCHED",
                    "## Governance Gates Run",
                    "- `python governance/compat/check_work_order_dispatch_quality.py --base HEAD~1 --head HEAD --enforce` -> PASS",
                    "- `python governance/compat/run_agent_autorun_workflow_gate.py --phase pre-dispatch --base HEAD~1 --head HEAD` -> PASS",
                ]
            ),
        )

        with (
            patch.object(MODULE, "REPO_ROOT", self.repo_root),
            patch.object(MODULE, "_get_changed", return_value={review: {"A"}}),
        ):
            report = MODULE._classify([review], base_ref="HEAD")

        self.assertFalse(report["compliant"])
        self.assertIn(
            "pending changed artifact cites `--base HEAD~1 --head HEAD` gate evidence that does not "
            "prove the pending artifact; use a working-tree-aware validation or commit the artifact "
            "and rerun the real changed range",
            report["violations"][0]["issues"],
        )

    def test_pending_review_status_output_must_include_self_path(self) -> None:
        review = "docs/reviews/CVF_PENDING_STATUS_REVIEW_2026-06-01.md"
        self._write(
            review,
            "\n".join(
                [
                    "# Pending Status Review",
                    "Status: IN_PROGRESS_DISPATCHED",
                    "## Governance Gates Run",
                    "- `git status --short` ->",
                    "  - `?? docs/reviews/OTHER_REVIEW_2026-06-01.md`",
                ]
            ),
        )

        with (
            patch.object(MODULE, "REPO_ROOT", self.repo_root),
            patch.object(MODULE, "_get_changed", return_value={review: {"A"}}),
        ):
            report = MODULE._classify([review], base_ref="HEAD")

        self.assertFalse(report["compliant"])
        self.assertIn(
            "pending changed artifact records `git status --short` but omits its own pending path; "
            "record the actual pending status line for this artifact",
            report["violations"][0]["issues"],
        )

    def test_nonblocked_artifact_with_self_reported_gate_fail_fails(self) -> None:
        review = "docs/reviews/CVF_PENDING_GATE_FAIL_REVIEW_2026-06-01.md"
        self._write(
            review,
            "\n".join(
                [
                    "# Pending Gate Fail Review",
                    "Status: IN_PROGRESS_DISPATCHED",
                    "## Governance Gates Run",
                    "- `python governance/compat/check_work_order_dispatch_quality.py --base abc1234 --head HEAD --enforce` -> FAIL",
                ]
            ),
        )

        with (
            patch.object(MODULE, "REPO_ROOT", self.repo_root),
            patch.object(MODULE, "_get_changed", return_value={review: {"A"}}),
        ):
            report = MODULE._classify([review], base_ref="HEAD")

        self.assertFalse(report["compliant"])
        self.assertIn(
            "artifact records a failed self-reported governance gate while status is not BLOCKED/HOLD; "
            "repair allowed-scope failures and rerun, or mark the artifact BLOCKED with return action",
            report["violations"][0]["issues"],
        )

    def test_finding_bearing_artifact_with_autorun_pass_missing_learning_disposition_fails(self) -> None:
        review = "docs/reviews/CVF_PENDING_STALE_PASS_REVIEW_2026-06-01.md"
        self._write(
            review,
            "\n".join(
                [
                    "# Pending Stale Pass Review",
                    "Status: IN_PROGRESS_DISPATCHED",
                    "## Findings / Position",
                    "- Finding: gate evidence is current.",
                    "## Governance Gates Run",
                    "- `git status --short` ->",
                    f"  - `?? {review}`",
                    "- `python governance/compat/run_agent_autorun_workflow_gate.py --phase pre-dispatch --base abc1234 --head HEAD` -> PASS",
                ]
            ),
        )

        with (
            patch.object(MODULE, "REPO_ROOT", self.repo_root),
            patch.object(MODULE, "_get_changed", return_value={review: {"A"}}),
        ):
            report = MODULE._classify([review], base_ref="HEAD")

        self.assertFalse(report["compliant"])
        self.assertIn(
            "artifact records autorun gate PASS but is finding-bearing without "
            "`## Finding-To-Governance Learning Disposition`; rerun after adding the required section",
            report["violations"][0]["issues"],
        )

    def test_blocked_artifact_may_record_gate_fail_with_return_action(self) -> None:
        review = "docs/reviews/CVF_BLOCKED_GATE_FAIL_REVIEW_2026-06-01.md"
        self._write(
            review,
            "\n".join(
                [
                    "# Blocked Gate Fail Review",
                    "Status: BLOCKED",
                    "Return action: orchestrator must expand scope.",
                    "## Governance Gates Run",
                    "- `python governance/compat/check_work_order_dispatch_quality.py --base abc1234 --head HEAD --enforce` -> FAIL",
                ]
            ),
        )

        with (
            patch.object(MODULE, "REPO_ROOT", self.repo_root),
            patch.object(MODULE, "_get_changed", return_value={review: {"A"}}),
        ):
            report = MODULE._classify([review], base_ref="HEAD")

        self.assertTrue(report["compliant"])

    def test_closed_review_may_cite_future_hold_work_order_output(self) -> None:
        work_order = "docs/work_orders/CVF_WO_NEXT_2026-06-01.md"
        self._write(work_order, "# Next\n\nStatus: HOLD\n")
        review_text = "\n".join(
            [
                "# Completion",
                "Status: CLOSED_PASS_BOUNDED",
                "## Evidence Trace Block",
                f"| Future work order output | `{work_order}` authored as HOLD pending dependency-release refresh |",
            ]
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            issues = MODULE._validate_referenced_work_order_closure(review_text, "completion/spec artifact")

        self.assertEqual(issues, [])

    def test_closed_review_still_fails_open_work_order_dependency(self) -> None:
        work_order = "docs/work_orders/CVF_WO_OPEN_2026-06-01.md"
        self._write(work_order, "# Open\n\nStatus: DISPATCH_READY\n")
        review_text = "\n".join(
            [
                "# Completion",
                "Status: CLOSED_PASS_BOUNDED",
                "## Authority Chain",
                f"| Required work order | `{work_order}` |",
            ]
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            issues = MODULE._validate_referenced_work_order_closure(review_text, "completion/spec artifact")

        self.assertIn(
            f"closed completion/spec artifact cites work order `{work_order}` whose status is not CLOSED",
            issues,
        )

    def test_runtime_work_order_fulfillment_manifest_catches_missing_artifacts_and_forbidden_paths(self) -> None:
        work_order = "docs/work_orders/CVF_WO_MKG6_TEST_2026-06-01.md"
        changed_forbidden = "EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/index.ts"
        changed_runtime = "EXTENSIONS/CVF_WEB/src/app/api/execute/route.ts"
        proof_path = "EXTENSIONS/CVF_WEB/src/app/api/memory/readout/route.test.ts"
        self._write(changed_forbidden, "export const touched = true;\n")
        self._write(changed_runtime, "export const route = true;\n")
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: DISPATCHED_TO_WORKER",
                    "## Worker Autonomy / No-Question Rule",
                    "Proceed inside scope.",
                    "## Work-Order Fulfillment Manifest",
                    "Manifest applies.",
                    "## Required Artifact Manifest",
                    "| Path | Required at handoff | Purpose |",
                    "|---|---|---|",
                    "| `EXTENSIONS/CVF_WEB/src/app/api/memory/readout/route.ts` | Yes | route |",
                    "| `docs/reviews/CVF_MKG6_COMPLETION.md` | Yes | completion |",
                    "## Forbidden Path Manifest",
                    "| Path | Reason |",
                    "|---|---|",
                    f"| `{changed_forbidden}` | forbidden by work order |",
                    "## Forbidden Filesystem State At Dispatch",
                    "| Forbidden path | Expected state | Actual state at dispatch | Action if PRESENT |",
                    "|---|---|---|---|",
                    f"| `{changed_forbidden}` | ABSENT | ABSENT | N/A |",
                    "## Required Proof Manifest",
                    "| Proof | Path | Required literal | Required at handoff |",
                    "|---|---|---|---|",
                    f"| raw leak sentinel | `{proof_path}` | `RAW_MEMORY_CONTENT_MUST_NOT_LEAK` | Yes |",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order, changed_runtime, changed_forbidden])

        self.assertFalse(report["compliant"])
        issues = [
            issue
            for violation in report["violations"]
            if violation["path"] == work_order
            for issue in violation["issues"]
        ]
        self.assertIn(
            "required handoff artifact is missing: `EXTENSIONS/CVF_WEB/src/app/api/memory/readout/route.ts`",
            issues,
        )
        self.assertIn(
            "required handoff artifact is missing: `docs/reviews/CVF_MKG6_COMPLETION.md`",
            issues,
        )
        self.assertIn(
            f"changed file violates forbidden path manifest: `{changed_forbidden}` matches `{changed_forbidden}`",
            issues,
        )
        self.assertIn(
            f"required proof file is missing: `{proof_path}`",
            issues,
        )

    def test_forbidden_path_manifest_requires_dispatch_filesystem_state(self) -> None:
        work_order = "docs/work_orders/CVF_WO_FORBIDDEN_STATE_TEST_2026-06-13.md"
        forbidden_path = "EXTENSIONS/CVF_WEB/src/forbidden.ts"
        self._write(forbidden_path, "export const forbidden = true;\n")
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: DISPATCHED_TO_WORKER",
                    "## Worker Autonomy / No-Question Rule",
                    "Proceed inside scope.",
                    "## Work-Order Fulfillment Manifest",
                    "Manifest applies.",
                    "## Forbidden Path Manifest",
                    "| Path | Reason |",
                    "|---|---|",
                    f"| `{forbidden_path}` | out of scope |",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order, forbidden_path])

        self.assertFalse(report["compliant"])
        issues = [
            issue
            for violation in report["violations"]
            if violation["path"] == work_order
            for issue in violation["issues"]
        ]
        self.assertIn(
            "work order has a Forbidden Path Manifest but is missing "
            "`## Forbidden Filesystem State At Dispatch` block; "
            "orchestrator must record disk state of forbidden paths before dispatch",
            issues,
        )

    def test_required_proof_literal_must_exist_in_named_file(self) -> None:
        work_order = "docs/work_orders/CVF_WO_SENTINEL_TEST_2026-06-01.md"
        route_path = "EXTENSIONS/CVF_WEB/src/app/api/memory/readout/route.ts"
        proof_path = "EXTENSIONS/CVF_WEB/src/app/api/memory/readout/route.test.ts"
        self._write(route_path, "export const route = true;\n")
        self._write(proof_path, "it('checks response', () => {});\n")
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: DISPATCHED_TO_WORKER",
                    "## Worker Autonomy / No-Question Rule",
                    "Proceed inside scope.",
                    "## Work-Order Fulfillment Manifest",
                    "Manifest applies.",
                    "## Required Artifact Manifest",
                    "| Path | Required at handoff | Purpose |",
                    "|---|---|---|",
                    f"| `{route_path}` | Yes | route |",
                    "## Required Proof Manifest",
                    "| Proof | Path | Required literal | Required at handoff |",
                    "|---|---|---|---|",
                    f"| raw leak sentinel | `{proof_path}` | `RAW_MEMORY_CONTENT_MUST_NOT_LEAK` | Yes |",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order, route_path, proof_path])

        self.assertFalse(report["compliant"])
        issues = [
            issue
            for violation in report["violations"]
            if violation["path"] == work_order
            for issue in violation["issues"]
        ]
        self.assertIn(
            f"required proof literal `RAW_MEMORY_CONTENT_MUST_NOT_LEAK` is missing from `{proof_path}`",
            issues,
        )

    def test_required_proof_manifest_rejects_compound_literal_cells(self) -> None:
        work_order = "docs/work_orders/CVF_WO_COMPOUND_PROOF_LITERAL_2026-06-13.md"
        route_path = "EXTENSIONS/CVF_WEB/src/app/api/memory/readout/route.ts"
        proof_path = "EXTENSIONS/CVF_WEB/src/app/api/memory/readout/route.test.ts"
        self._write(route_path, "export const route = true;\n")
        self._write(
            proof_path,
            "RAW_MEMORY_CONTENT_MUST_NOT_LEAK\nMEMORY_RECEIPT_MUST_EXIST\n",
        )
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: DISPATCHED_TO_WORKER",
                    "Commit mode: WORKER_MAY_COMMIT",
                    "dispatchBaseHead: abc123",
                    "executionBaseHead: WORKER_MUST_CAPTURE_AT_START",
                    "closureBaseHead: REVIEWER_CAPTURE",
                    "## Worker Autonomy / No-Question Rule",
                    "Proceed inside scope.",
                    "## Intake Role Routing Decision",
                    "- Intake summary: bounded checker hardening.",
                    "- Scope classification: control-plane only.",
                    "- Risk sensitivity: no public/provider/live claim.",
                    "- Selected role route: routeMode=SINGLE_AGENT_SINGLE_ROLE.",
                    "- Role separation basis: local artifact separation.",
                    "- Escalation condition: stop if scope changes.",
                    "## Source Verification Block",
                    "| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |",
                    "|---|---|---|---|---|---|",
                    "| Template | `docs/reference/source.md` | Scope | `source.md` | doc | ACCEPT |",
                    "## Work-Order Fulfillment Manifest",
                    "Manifest applies.",
                    "## Required Artifact Manifest",
                    "| Path | Required at handoff | Purpose |",
                    "|---|---|---|",
                    f"| `{route_path}` | Yes | route |",
                    "## Required Proof Manifest",
                    "| Proof | Path | Required literal | Required at handoff |",
                    "|---|---|---|---|",
                    f"| sentinels | `{proof_path}` | `RAW_MEMORY_CONTENT_MUST_NOT_LEAK` and `MEMORY_RECEIPT_MUST_EXIST` | Yes |",
                ]
            ),
        )
        self._write("docs/reference/source.md", "## Scope\nsource\n")

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order, route_path, proof_path])

        self.assertFalse(report["compliant"])
        issues = [
            issue
            for violation in report["violations"]
            if violation["path"] == work_order
            for issue in violation["issues"]
        ]
        self.assertIn(
            "Required Proof Manifest row has multiple required literals in one "
            "cell; split the proof into one row per literal",
            issues,
        )

    def test_required_proof_manifest_allows_one_atomic_literal_per_row(self) -> None:
        work_order = "docs/work_orders/CVF_WO_ATOMIC_PROOF_LITERAL_2026-06-13.md"
        route_path = "EXTENSIONS/CVF_WEB/src/app/api/memory/readout/route.ts"
        proof_path = "EXTENSIONS/CVF_WEB/src/app/api/memory/readout/route.test.ts"
        self._write(route_path, "export const route = true;\n")
        self._write(
            proof_path,
            "RAW_MEMORY_CONTENT_MUST_NOT_LEAK\nMEMORY_RECEIPT_MUST_EXIST\n",
        )
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: DISPATCHED_TO_WORKER",
                    "Commit mode: WORKER_MAY_COMMIT",
                    "dispatchBaseHead: abc123",
                    "executionBaseHead: WORKER_MUST_CAPTURE_AT_START",
                    "closureBaseHead: REVIEWER_CAPTURE",
                    "## Worker Autonomy / No-Question Rule",
                    "Proceed inside scope.",
                    "## Intake Role Routing Decision",
                    "- Intake summary: bounded checker hardening.",
                    "- Scope classification: control-plane only.",
                    "- Risk sensitivity: no public/provider/live claim.",
                    "- Selected role route: routeMode=SINGLE_AGENT_SINGLE_ROLE.",
                    "- Role separation basis: local artifact separation.",
                    "- Escalation condition: stop if scope changes.",
                    "## Source Verification Block",
                    "| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |",
                    "|---|---|---|---|---|---|",
                    "| Template | `docs/reference/source.md` | Scope | `source.md` | doc | ACCEPT |",
                    "## Work-Order Fulfillment Manifest",
                    "Manifest applies.",
                    "## Required Artifact Manifest",
                    "| Path | Required at handoff | Purpose |",
                    "|---|---|---|",
                    f"| `{route_path}` | Yes | route |",
                    "## Required Proof Manifest",
                    "| Proof | Path | Required literal | Required at handoff |",
                    "|---|---|---|---|",
                    f"| raw leak sentinel | `{proof_path}` | `RAW_MEMORY_CONTENT_MUST_NOT_LEAK` | Yes |",
                    f"| receipt sentinel | `{proof_path}` | `MEMORY_RECEIPT_MUST_EXIST` | Yes |",
                ]
            ),
        )
        self._write("docs/reference/source.md", "## Scope\nsource\n")

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order, route_path, proof_path])

        issues = [
            issue
            for violation in report["violations"]
            if violation["path"] == work_order
            for issue in violation["issues"]
        ]
        self.assertNotIn(
            "Required Proof Manifest row has multiple required literals in one "
            "cell; split the proof into one row per literal",
            issues,
        )

    def test_new_doc_only_field_in_source_verification_fails(self) -> None:
        work_order = "docs/work_orders/CVF_WO_LHW12_T1_TEST_2026-05-29.md"
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: HOLD_PENDING_T1",
                    "## Source Verification Block",
                    "| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |",
                    "|---|---|---|---|---|---|",
                    "| `modelTierAdvisoryType` (new doc-only field) | N/A - canonical doc-only field | S3 | `modelTierAdvisoryType` | LHW12-T1 packet | ACCEPT |",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertFalse(report["compliant"])
        self.assertIn(
            "New doc-only fields must be listed in a separate New Doc-Only Fields table, "
            "not as Source Verification ACCEPT rows",
            report["violations"][0]["issues"],
        )

    def test_ready_live_method_proof_without_executable_path_fails(self) -> None:
        work_order = "docs/work_orders/CVF_WO_PM1_JSON_MODE_TEST_2026-05-29.md"
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: READY_FOR_IMPLEMENTATION",
                    "Purpose: live proof for provider method json_mode.",
                    "Run `/api/execute` with a method flag.",
                    "## Source Verification Block",
                    "| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |",
                    "|---|---|---|---|---|---|",
                    "| Provider lane | `governance/contracts/example.ts` | line 1 | `provider` | Provider map | ACCEPT |",
                ]
            ),
        )
        self._write("governance/contracts/example.ts", "export const provider = 'deepseek';\n")

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertFalse(report["compliant"])
        self.assertIn(
            "dispatch/ready live-method proof cites generic `/api/execute` or a method flag "
            "without a source-verified executable proof path",
            report["violations"][0]["issues"],
        )

    def test_memory_gateway_can_reinject_false_prose_without_source_fails(self) -> None:
        baseline = "docs/baselines/CVF_GC018_LHW13_TEST_2026-05-29.md"
        self._write(
            baseline,
            "\n".join(
                [
                    "# Baseline",
                    "Status: PROPOSED",
                    "GC says `MemoryGatewayDecision.canReinject=false` is preserved.",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([baseline])

        self.assertFalse(report["compliant"])
        self.assertIn(
            "Prose claims `MemoryGatewayDecision.canReinject=false`; the known source contract "
            "declares `canReinject` as a boolean unless a cited source proves a literal false assignment",
            report["violations"][0]["issues"],
        )

    def test_connector_doc_only_field_accept_citing_roadmap_fails(self) -> None:
        work_order = "docs/work_orders/CVF_WO_EL3_TEST_2026-05-29.md"
        roadmap = "docs/roadmaps/CVF_LHW12_TEST_ROADMAP_2026-05-29.md"
        self._write(roadmap, "# Roadmap\nStatus: PROPOSED\n")
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: HOLD_PENDING_T1",
                    "## Source Verification Block",
                    "| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |",
                    "|---|---|---|---|---|---|",
                    "| `modelTierAdvisoryType` doc-only field | `docs/roadmaps/CVF_LHW12_TEST_ROADMAP_2026-05-29.md` | S3 planned field list | `modelTierAdvisoryType` | LHW12-T1 doc-only field | ACCEPT |",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order, roadmap])

        self.assertFalse(report["compliant"])
        issues = [
            issue
            for violation in report["violations"]
            if violation["path"] == work_order
            for issue in violation["issues"]
        ]
        self.assertIn(
            "Source Verification ACCEPT for connector doc-only field cites a roadmap; "
            "cite the connector spec after it exists or move the field to New Doc-Only Fields",
            issues,
        )
        self.assertIn(
            "Source Verification ACCEPT uses pending/planned/future line or section language; "
            "use BLOCKED_SOURCE_NOT_FOUND until the source exists",
            issues,
        )

    def test_source_verification_function_line_anchor_must_cite_definition_line(self) -> None:
        work_order = "docs/work_orders/CVF_WO_SOURCE_LINE_ANCHOR_TEST_2026-06-13.md"
        source_path = "governance/compat/example_scan_report.py"
        self._write(
            source_path,
            "\n".join(
                [
                    "# Example",
                    "def build_scan_outcome_report(",
                    "    raw_scan,",
                    "    options,",
                    "):",
                    "    return raw_scan",
                    "",
                ]
            ),
        )
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: HOLD_PENDING_GC018",
                    "## Source Verification Block",
                    "| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |",
                    "|---|---|---|---|---|---|",
                    f"| Scan outcome builder exists | `{source_path}` | line 4 | `build_scan_outcome_report` | function | ACCEPT |",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertFalse(report["compliant"])
        issues = [
            issue
            for violation in report["violations"]
            if violation["path"] == work_order
            for issue in violation["issues"]
        ]
        self.assertIn(
            "Source Verification ACCEPT row cites `build_scan_outcome_report` at line 4, "
            f"but `{source_path}` defines it at line 2; cite the symbol definition line, "
            "not a continuation or interior signature line",
            issues,
        )

    def test_source_verification_function_definition_line_passes(self) -> None:
        work_order = "docs/work_orders/CVF_WO_SOURCE_LINE_ANCHOR_PASS_2026-06-13.md"
        source_path = "governance/compat/example_scan_report.py"
        self._write(
            source_path,
            "\n".join(
                [
                    "# Example",
                    "def build_scan_outcome_report(",
                    "    raw_scan,",
                    "    options,",
                    "):",
                    "    return raw_scan",
                    "",
                ]
            ),
        )
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: HOLD_PENDING_GC018",
                    "## Source Verification Block",
                    "| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |",
                    "|---|---|---|---|---|---|",
                    f"| Scan outcome builder exists | `{source_path}` | line 2 | `build_scan_outcome_report` | function | ACCEPT |",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertTrue(report["compliant"])

    def test_compliant_hold_packet_passes(self) -> None:
        work_order = "docs/work_orders/CVF_WO_LHW6_T1_TEST_2026-05-28.md"
        self._write(
            "governance/contracts/example.ts",
            "export type ExampleMode = 'one' | 'two';\n",
        )
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: HOLD_PENDING_GC018",
                    "Authority: docs/roadmaps/CVF_LHW6_TEST_ROADMAP_2026-05-28.md",
                    "## Roadmap-To-Work-Order Trace Matrix",
                    "| Roadmap requirement | Work order section | Output artifact or field | Verification command or check | Status |",
                    "|---|---|---|---|---|",
                    "| R1 | S1 | field | check | BLOCKED |",
                    "## Source Verification Block",
                    "| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |",
                    "|---|---|---|---|---|---|",
                    "| ExampleMode values `one` `two` | `governance/contracts/example.ts` | line 1 | `ExampleMode` | ExampleMode | ACCEPT |",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertTrue(report["compliant"])

    def test_accept_owner_map_complete_coverage_claim_requires_each_concept(self) -> None:
        roadmap = "docs/roadmaps/CVF_LHW22_TEST_ROADMAP_2026-05-31.md"
        self._write(
            MODULE.IMPORTANT_FULL_SCAN_AUDIT_PATH,
            "\n".join(
                [
                    "| Concept | Disposition | Reason |",
                    "|---|---|---|",
                    "| UCO — Capability-based constraint binding | `ACCEPT_AS_OWNER_MAP` | maps to guard |",
                    "| Artifact Store abstraction | `ACCEPT_AS_OWNER_MAP` | maps to git |",
                ]
            ),
        )
        self._write(
            roadmap,
            "\n".join(
                [
                    "# Roadmap",
                    "Status: HOLD_FOR_FRESH_GC018",
                    "This roadmap covers all `ACCEPT_AS_OWNER_MAP` items.",
                    "UCO — Capability-based constraint binding is in LHW22.",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([roadmap])

        self.assertFalse(report["compliant"])
        self.assertIn(
            "artifact claims complete ACCEPT_AS_OWNER_MAP coverage but lacks disposition for: Artifact Store abstraction",
            report["violations"][0]["issues"],
        )

    def test_absent_runtime_claim_requires_current_freshness_section(self) -> None:
        work_order = "docs/work_orders/CVF_WO_LHW23_TEST_2026-05-31.md"
        self._write(
            work_order,
            "\n".join(
                [
                    "# Work Order",
                    "Status: HOLD_FOR_FRESH_GC018",
                    "Gap: provider list is hardcoded strings and no registry is present.",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertFalse(report["compliant"])
        issues = report["violations"][0]["issues"]
        self.assertIn(
            "artifact makes absent/not-implemented/hardcoded runtime claims without a "
            "`Current Runtime Freshness Verification` section",
            issues,
        )
        self.assertIn(
            "provider registry absence/hardcoded claim must account for current "
            "`EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-registry.ts` and "
            "`PROVIDER_CAPABILITY_REGISTRY` surfaces",
            issues,
        )

    def test_provider_nonuse_claim_requires_runtime_freshness_section(self) -> None:
        work_order = "docs/work_orders/CVF_WO_PROVIDER_NONUSE_TEST_2026-06-11.md"
        self._write(
            work_order,
            "\n".join(
                [
                    "# Work Order",
                    "Status: DISPATCHED",
                    "Forbidden scope: no provider/API key use and no provider calls.",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertFalse(report["compliant"])
        issues = report["violations"][0]["issues"]
        self.assertIn(
            "artifact makes absent/not-implemented/hardcoded runtime claims without a "
            "`Current Runtime Freshness Verification` section",
            issues,
        )
        self.assertIn(
            "provider registry absence/hardcoded claim must account for current "
            "`EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-registry.ts` and "
            "`PROVIDER_CAPABILITY_REGISTRY` surfaces",
            issues,
        )

    def test_registry_update_nonuse_claim_does_not_trigger_provider_registry_check(self) -> None:
        work_order = "docs/work_orders/CVF_WO_CORPUS_REGISTRY_NONUSE_TEST_2026-06-11.md"
        self._write(
            work_order,
            "\n".join(
                [
                    "# Work Order",
                    "Status: DISPATCHED",
                    "Forbidden scope: no registry update for corpus metadata.",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertFalse(report["compliant"])
        issues = report["violations"][0]["issues"]
        self.assertIn(
            "artifact makes absent/not-implemented/hardcoded runtime claims without a "
            "`Current Runtime Freshness Verification` section",
            issues,
        )
        self.assertNotIn(
            "provider registry absence/hardcoded claim must account for current "
            "`EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-registry.ts` and "
            "`PROVIDER_CAPABILITY_REGISTRY` surfaces",
            issues,
        )

    def test_resolve_provider_claim_requires_current_owner_path(self) -> None:
        work_order = "docs/work_orders/CVF_WO_LHW23_TEST_2026-05-31.md"
        self._write(
            work_order,
            "\n".join(
                [
                    "# Work Order",
                    "Status: HOLD_FOR_FRESH_GC018",
                    "## Current Runtime Freshness Verification",
                    "`resolveProviderForRole()` is mapped to an old MCP source.",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertFalse(report["compliant"])
        self.assertIn(
            "`resolveProviderForRole()` claim must cite current source "
            "`EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src/execute.client.ts`",
            report["violations"][0]["issues"],
        )

    def test_hold_status_with_closed_token_fails_without_closed_finality(self) -> None:
        work_order = "docs/work_orders/CVF_WO_LHW11_T2_TEST_2026-05-29.md"
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: HOLD_UNTIL_T1_CLOSED_PASS",
                    "## Roadmap-To-Work-Order Trace Matrix",
                    "| Roadmap requirement | Work order section | Output artifact or field | Verification command or check | Status |",
                    "|---|---|---|---|---|",
                    "| R1 | S1 | field | check | OPEN |",
                    "## Closure Checklist",
                    "- [ ] Keep blocked until T1 passes",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertFalse(report["compliant"])
        issues = report["violations"][0]["issues"]
        self.assertIn(
            "work order hold/draft/proposed status must not contain `CLOSED`; "
            "use PASS or SATISFIED wording for prerequisite status tokens",
            issues,
        )
        self.assertNotIn("closed work order contains 1 table row(s) still marked OPEN", issues)
        self.assertNotIn("closed work order contains 1 unchecked checklist item(s)", issues)

    def test_source_verification_symbol_assignment_fails(self) -> None:
        work_order = "docs/work_orders/CVF_WO_LHW11_T1_TEST_2026-05-29.md"
        self._write(
            "governance/contracts/memory.ts",
            "export interface MemoryReceipt { rawMemoryReleased: boolean; }\n",
        )
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: HOLD_PENDING_T1",
                    "## Source Verification Block",
                    "| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |",
                    "|---|---|---|---|---|---|",
                    "| LITERAL_INVARIANT rawMemoryReleased false | `governance/contracts/memory.ts` | line 1 | `rawMemoryReleased: false` | MemoryReceipt | ACCEPT |",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertFalse(report["compliant"])
        issues = report["violations"][0]["issues"]
        self.assertIn(
            "Source Verification `Verified path or symbol` must contain only a field/path/symbol, "
            "not a value assignment or type annotation",
            issues,
        )
        self.assertNotIn(
            "Source Verification ACCEPT row claims a false invariant for `false` but "
            "`governance/contracts/memory.ts` does not declare or assign that field as literal false",
            issues,
        )

    def test_source_verification_symbol_type_annotation_fails(self) -> None:
        work_order = "docs/work_orders/CVF_WO_LHW11_T3_TEST_2026-05-29.md"
        self._write(
            "governance/contracts/memory.ts",
            "export interface MemoryReceipt { canReinject: boolean; }\n",
        )
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: HOLD_PENDING_T3",
                    "## Source Verification Block",
                    "| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |",
                    "|---|---|---|---|---|---|",
                    "| EXISTS canReinject field | `governance/contracts/memory.ts` | line 1 | `canReinject: boolean` | MemoryReceipt | ACCEPT |",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertFalse(report["compliant"])
        self.assertIn(
            "Source Verification `Verified path or symbol` must contain only a field/path/symbol, "
            "not a value assignment or type annotation",
            report["violations"][0]["issues"],
        )

    def test_dispatch_work_order_with_noncanonical_source_disposition_fails(self) -> None:
        work_order = "docs/work_orders/CVF_WO_SOURCE_DISPOSITION_TEST_2026-06-08.md"
        self._write("governance/contracts/source.ts", "export interface SourceThing { value: string; }\n")
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: DISPATCHED",
                    "Commit mode: WORKER_MAY_COMMIT",
                    "dispatchBaseHead: abc123",
                    "executionBaseHead: WORKER_MUST_CAPTURE_AT_START",
                    "closureBaseHead: REVIEWER_CAPTURE",
                    "## Worker Autonomy / No-Question Rule",
                    "Allowed-scope remediation is mandatory.",
                    "## Source Verification Block",
                    "| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |",
                    "|---|---|---|---|---|---|",
                    "| SourceThing | `governance/contracts/source.ts` | (worker to verify exact lines) | `SourceThing` | SourceThing | ACCEPT_PENDING_WORKER |",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertFalse(report["compliant"])
        issues = report["violations"][0]["issues"]
        self.assertIn(
            "Source Verification disposition must be one of ACCEPT, REJECT, "
            "or BLOCKED_SOURCE_NOT_FOUND; found `ACCEPT_PENDING_WORKER`",
            issues,
        )
        self.assertIn(
            "Source Verification row defers source facts to worker/future verification; "
            "resolve before dispatch or set BLOCKED_SOURCE_NOT_FOUND",
            issues,
        )

    def test_dispatch_work_order_with_noncanonical_source_table_shape_fails(self) -> None:
        work_order = "docs/work_orders/CVF_WO_SOURCE_TABLE_SHAPE_TEST_2026-06-11.md"
        self._write("governance/contracts/source.ts", "export interface SourceThing { value: string; }\n")
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: DISPATCHED",
                    "Commit mode: WORKER_MAY_COMMIT",
                    "dispatchBaseHead: abc123",
                    "executionBaseHead: WORKER_MUST_CAPTURE_AT_START",
                    "closureBaseHead: REVIEWER_CAPTURE",
                    "## Worker Autonomy / No-Question Rule",
                    "Allowed-scope remediation is mandatory.",
                    "## Source Verification Block",
                    "| Symbol / path | File | Verified line | Disposition |",
                    "|---|---|---|---|",
                    "| `SourceThing` | `governance/contracts/source.ts` | line 1 | ACCEPT |",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertFalse(report["compliant"])
        self.assertIn(
            "Source Verification table uses noncanonical columns; required columns are: "
            "Claimed item | Source file | Verified line/section | Verified path or symbol | "
            "Owning interface/function/schema | Disposition",
            report["violations"][0]["issues"],
        )

    def test_work_order_misclassifies_agents_md_as_provider_specific_memory_fails(self) -> None:
        work_order = "docs/work_orders/CVF_WO_PROVIDER_MEMORY_BOUNDARY_TEST_2026-06-14.md"
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: DRAFT",
                    (
                        "Provider-specific memory files (`CLAUDE.md`, `AGENTS.md`, "
                        "IDE summaries) are not CVF source authority."
                    ),
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertFalse(report["compliant"])
        self.assertIn(
            "work order misclassifies `AGENTS.md` as provider-specific or non-authoritative; "
            "`AGENTS.md` is canonical CVF authority",
            report["violations"][0]["issues"],
        )

    def test_not_found_claim_without_negative_search_block_fails(self) -> None:
        work_order = "docs/work_orders/CVF_WO_NEGATIVE_SEARCH_TEST_2026-06-11.md"
        self._write("governance/contracts/source.ts", "export interface SourceThing { value: string; }\n")
        self._write(
            "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/profile.test.ts",
            "const fixture = { documentStatus: 'approved' };\n",
        )
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: DISPATCHED",
                    "Commit mode: WORKER_MAY_COMMIT",
                    "dispatchBaseHead: abc123",
                    "executionBaseHead: WORKER_MUST_CAPTURE_AT_START",
                    "closureBaseHead: REVIEWER_CAPTURE",
                    "Runtime token `documentStatus` is NOT FOUND in EXTENSIONS.",
                    "## Worker Autonomy / No-Question Rule",
                    "Allowed-scope remediation is mandatory.",
                    "## Source Verification Block",
                    "| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |",
                    "|---|---|---|---|---|---|",
                    "| SourceThing | `governance/contracts/source.ts` | line 1 | `SourceThing` | SourceThing | ACCEPT |",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertFalse(report["compliant"])
        self.assertIn(
            "work order contains `NOT FOUND` or `BLOCKED_SOURCE_NOT_FOUND` "
            "but lacks `## Negative Search And Collision Discipline` evidence",
            report["violations"][0]["issues"],
        )

    def test_not_found_claim_with_unrecorded_repo_collision_fails(self) -> None:
        work_order = "docs/work_orders/CVF_WO_NEGATIVE_SEARCH_COLLISION_TEST_2026-06-11.md"
        self._write("governance/contracts/source.ts", "export interface SourceThing { value: string; }\n")
        self._write(
            "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/profile.test.ts",
            "const fixture = { documentStatus: 'approved' };\n",
        )
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: DISPATCHED",
                    "Commit mode: WORKER_MAY_COMMIT",
                    "dispatchBaseHead: abc123",
                    "executionBaseHead: WORKER_MUST_CAPTURE_AT_START",
                    "closureBaseHead: REVIEWER_CAPTURE",
                    "Runtime token `documentStatus` is NOT FOUND in runtime owners.",
                    "## Worker Autonomy / No-Question Rule",
                    "Allowed-scope remediation is mandatory.",
                    "## Source Verification Block",
                    "| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |",
                    "|---|---|---|---|---|---|",
                    "| SourceThing | `governance/contracts/source.ts` | line 1 | `SourceThing` | SourceThing | ACCEPT |",
                    "## Negative Search And Collision Discipline",
                    "- Search roots: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION`.",
                    "- Search command: `rg \"documentStatus\" EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION`.",
                    "- Coverage: source, tests, docs, JSON, external evidence.",
                    "- Same-token collision results: none for `documentStatus`.",
                    "- Disposition: token absent from runtime owner.",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertFalse(report["compliant"])
        self.assertIn(
            "work order claims `documentStatus` as not found while the same token "
            "appears elsewhere in the repo; record the collision/non-authoritative "
            "occurrence instead of a bare `NOT FOUND` claim",
            report["violations"][0]["issues"],
        )

    def test_not_found_claim_with_collision_disposition_passes(self) -> None:
        work_order = "docs/work_orders/CVF_WO_NEGATIVE_SEARCH_COLLISION_PASS_2026-06-11.md"
        self._write("governance/contracts/source.ts", "export interface SourceThing { value: string; }\n")
        self._write(
            "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/profile.test.ts",
            "const fixture = { documentStatus: 'approved' };\n",
        )
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: DISPATCHED",
                    "Commit mode: WORKER_MAY_COMMIT",
                    "dispatchBaseHead: abc123",
                    "executionBaseHead: WORKER_MUST_CAPTURE_AT_START",
                    "closureBaseHead: REVIEWER_CAPTURE",
                    "Runtime token `documentStatus` is NOT FOUND in the EC-02 runtime owner.",
                    "## Worker Autonomy / No-Question Rule",
                    "Allowed-scope remediation is mandatory.",
                    "## Source Verification Block",
                    "| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |",
                    "|---|---|---|---|---|---|",
                    "| SourceThing | `governance/contracts/source.ts` | line 1 | `SourceThing` | SourceThing | ACCEPT |",
                    "## Negative Search And Collision Discipline",
                    "- Search roots: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src`, `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests`.",
                    "- Search command: `rg \"documentStatus\" EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION`.",
                    "- Coverage: source, tests, docs, JSON, external evidence.",
                    "- Same-token collision results: `documentStatus` occurs in a non-authoritative test fixture with different meaning.",
                    "- Disposition: collision is not binding for EC-02 lifecycle support; token absent from the EC-02 runtime owner.",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        negative_search_issues = [
            issue
            for violation in report["violations"]
            for issue in violation["issues"]
            if "negative-search" in issue or "same token" in issue or "NOT FOUND" in issue
        ]
        self.assertEqual([], negative_search_issues)

    def test_dispatch_work_order_with_pending_closed_pass_dependency_fails(self) -> None:
        work_order = "docs/work_orders/CVF_WO_PENDING_DEPENDENCY_TEST_2026-06-08.md"
        self._write("governance/contracts/source.ts", "export interface SourceThing { value: string; }\n")
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: DISPATCHED",
                    "Commit mode: WORKER_MAY_COMMIT",
                    "dispatchBaseHead: abc123",
                    "executionBaseHead: WORKER_MUST_CAPTURE_AT_START",
                    "closureBaseHead: REVIEWER_CAPTURE",
                    "Prerequisite: DSCP-T6 `CLOSED_PASS_BOUNDED` pending reviewer commit.",
                    "## Worker Autonomy / No-Question Rule",
                    "Allowed-scope remediation is mandatory.",
                    "## Source Verification Block",
                    "| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |",
                    "|---|---|---|---|---|---|",
                    "| SourceThing | `governance/contracts/source.ts` | line 1 | `SourceThing` | SourceThing | ACCEPT |",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertFalse(report["compliant"])
        self.assertIn(
            "dispatch/ready work order contains pending predecessor release language next to "
            "`CLOSED_PASS` evidence; keep status HOLD/DRAFT until the prerequisite closure commit exists",
            report["violations"][0]["issues"],
        )

    def test_dispatch_work_order_with_placeholder_dispatch_base_fails(self) -> None:
        work_order = "docs/work_orders/CVF_WO_PLACEHOLDER_DISPATCH_BASE_2026-06-11.md"
        self._write("governance/contracts/source.ts", "export interface SourceThing { value: string; }\n")
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: DISPATCHED",
                    "Commit mode: WORKER_MUST_NOT_COMMIT",
                    "dispatchBaseHead: worker must capture at dispatch time",
                    "executionBaseHead: WORKER_MUST_CAPTURE_AT_START",
                    "closureBaseHead: REVIEWER_CAPTURE",
                    "## Worker Autonomy / No-Question Rule",
                    "Allowed-scope remediation is mandatory.",
                    "## Source Verification Block",
                    "| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |",
                    "|---|---|---|---|---|---|",
                    "| SourceThing | `governance/contracts/source.ts` | line 1 | `SourceThing` | SourceThing | ACCEPT |",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertFalse(report["compliant"])
        self.assertIn(
            "dispatch/ready work order has non-commit `dispatchBaseHead`; "
            "the orchestrator must set a real git commit hash before dispatch",
            report["violations"][0]["issues"],
        )

    def test_dispatch_roadmap_with_pending_closed_pass_dependency_fails(self) -> None:
        roadmap = "docs/roadmaps/CVF_PENDING_DEPENDENCY_ROADMAP_2026-06-08.md"
        self._write(
            roadmap,
            "\n".join(
                [
                    "# Roadmap",
                    "Status: DISPATCHED",
                    "Predecessor: DSCP-T7 `CLOSED_PASS_BOUNDED` pending T7 implementation.",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([roadmap])

        self.assertFalse(report["compliant"])
        self.assertIn(
            "dispatch/ready roadmap contains pending predecessor release language next to "
            "`CLOSED_PASS` evidence; keep status HOLD/DRAFT until the prerequisite closure commit exists",
            report["violations"][0]["issues"],
        )

    def test_hold_work_order_does_not_block_unrelated_runtime_change(self) -> None:
        work_order = "docs/work_orders/CVF_WO_HOLD_UNRELATED_RUNTIME_2026-06-08.md"
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: HOLD_UNTIL_T1_PASS",
                    "## Scope / Target / Owner Boundary",
                    "- `EXTENSIONS/CVF_SAMPLE/src/owned.ts`",
                ]
            ),
        )
        self._write("EXTENSIONS/CVF_OTHER/src/unrelated.ts", "export const value = 1;\n")

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify(
                [
                    work_order,
                    "EXTENSIONS/CVF_OTHER/src/unrelated.ts",
                ]
            )

        self.assertTrue(report["compliant"])

    def test_hold_work_order_blocks_owned_runtime_change(self) -> None:
        work_order = "docs/work_orders/CVF_WO_HOLD_OWNED_RUNTIME_2026-06-08.md"
        owned_path = "EXTENSIONS/CVF_SAMPLE/src/owned.ts"
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: HOLD_UNTIL_T1_PASS",
                    "## Scope / Target / Owner Boundary",
                    f"- `{owned_path}`",
                ]
            ),
        )
        self._write(owned_path, "export const value = 1;\n")

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order, owned_path])

        self.assertFalse(report["compliant"])
        self.assertIn(
            "changed range includes runtime/source files while referenced work order "
            f"`{work_order}` is still `HOLD_UNTIL_T1_PASS`; release/downgrade the work order "
            f"before implementation. Runtime/source sample: {owned_path}. Referring artifact(s): {work_order}",
            report["violations"][0]["issues"],
        )

    def test_closed_work_order_with_open_rows_and_unchecked_boxes_fails(self) -> None:
        work_order = "docs/work_orders/CVF_WO_LHW10_T1_TEST_2026-05-28.md"
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: CLOSED_PASS_BOUNDED",
                    "## Roadmap-To-Work-Order Trace Matrix",
                    "| Roadmap requirement | Work order section | Output artifact or field | Verification command or check | Status |",
                    "|---|---|---|---|---|",
                    "| R1 | S1 | field | check | OPEN |",
                    "## Closure Checklist",
                    "- [ ] Spec complete",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertFalse(report["compliant"])
        issues = report["violations"][0]["issues"]
        self.assertIn("closed work order contains 1 table row(s) still marked OPEN", issues)
        self.assertIn("closed work order contains 1 unchecked checklist item(s)", issues)

    def test_closed_roadmap_with_hold_residue_fails(self) -> None:
        roadmap = "docs/roadmaps/CVF_LHW10_TEST_ROADMAP_2026-05-28.md"
        self._write(
            roadmap,
            "\n".join(
                [
                    "# Roadmap",
                    "Status: CLOSED_PASS_BOUNDED",
                    "Dispatch status: T1 WORK_ORDER_READY. T2 HOLD until T1 CLOSED_PASS.",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([roadmap])

        self.assertFalse(report["compliant"])
        self.assertTrue(
            any("closed roadmap contains stale dispatch/hold status residue" in issue
                for issue in report["violations"][0]["issues"])
        )

    def test_active_fast_lane_with_pass_disposition_fails(self) -> None:
        audit = "docs/reviews/CVF_LHW10_T3_FAST_LANE_AUDIT_2026-05-28.md"
        self._write(
            audit,
            "\n".join(
                [
                    "# Audit",
                    "Status: ACTIVE",
                    "**Decision: ACCEPT**",
                    "**Disposition: FAST_LANE_PASS**",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([audit])

        self.assertFalse(report["compliant"])
        self.assertIn(
            "fast-lane audit status is still ACTIVE/DRAFT/HOLD while disposition or decision is pass/approve",
            report["violations"][0]["issues"],
        )

    def test_closed_work_order_changed_range_outside_allowed_scope_fails(self) -> None:
        work_order = "docs/work_orders/CVF_WO_LHW12_T1_TEST_2026-05-29.md"
        spec = "docs/reference/CVF_LHW12_T1_TEST_CONNECTOR_SPEC_2026-05-29.md"
        archive = "docs/reviews/archive/CVF_OLD_REVIEW_2026-05-01.md"
        self._write(spec, "# Spec\nStatus: DRAFT\n")
        self._write(archive, "# Old Review\nStatus: archived\n")
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: CLOSED_PASS_BOUNDED",
                    "## 4. Scope",
                    "Allowed scope:",
                    f"- Create `{spec}`.",
                    "- Update this work order status only.",
                    "- Update session continuity files.",
                    "Forbidden scope:",
                    "- Archive cleanup or unrelated maintenance.",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order, spec, archive])

        self.assertFalse(report["compliant"])
        scope_issues = [
            issue
            for violation in report["violations"]
            if violation["path"] == work_order
            for issue in violation["issues"]
        ]
        self.assertTrue(
            any("outside its Allowed scope" in issue and archive in issue for issue in scope_issues)
        )

    def test_closed_work_order_allows_explicit_root_governance_path(self) -> None:
        work_order = "docs/work_orders/CVF_WO_ROOT_GOVERNANCE_TEST_2026-06-01.md"
        root_governance_path = "AGENTS.md"
        self._write(root_governance_path, "# Agent instructions\n")
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: CLOSED_PASS_BOUNDED",
                    "## Scope",
                    "Allowed scope:",
                    f"- Update `{root_governance_path}`.",
                    "Forbidden scope:",
                    "- Other root files.",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order, root_governance_path])

        self.assertTrue(report["compliant"])

    def test_closed_work_order_allows_explicit_gitignore_path(self) -> None:
        work_order = "docs/work_orders/CVF_WO_ROOT_GITIGNORE_TEST_2026-06-05.md"
        root_path = ".gitignore"
        self._write(root_path, ".cvf/runtime/\n")
        self._write(
            work_order,
            "\n".join(
                [
                    "# Test",
                    "Status: CLOSED_PASS_BOUNDED",
                    "## Scope",
                    "Allowed scope:",
                    f"- Update `{root_path}`.",
                    "Forbidden scope:",
                    "- Other root files.",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order, root_path])

        self.assertTrue(report["compliant"])

    def test_closed_lhw_roadmap_requires_full_wave_range_fails(self) -> None:
        roadmap = "docs/roadmaps/CVF_LHW12_TEST_ROADMAP_2026-05-29.md"
        t3_spec = "docs/reference/CVF_LHW12_T3_TEST_CONNECTOR_SPEC_2026-05-29.md"
        self._write("docs/baselines/CVF_GC018_LHW12_TEST_2026-05-29.md", "# GC-018\n")
        self._write(t3_spec, "# T3 Spec\nStatus: DRAFT\n")
        self._write(
            roadmap,
            "\n".join(
                [
                    "# Roadmap",
                    "Status: CLOSED_PASS_BOUNDED",
                    "LHW12 connector wave closure.",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([roadmap, t3_spec])

        self.assertFalse(report["compliant"])
        roadmap_issues = [
            issue
            for violation in report["violations"]
            if violation["path"] == roadmap
            for issue in violation["issues"]
        ]
        self.assertIn(
            "closed LHW12 connector roadmap changed without full wave-range evidence; "
            "missing changed artifact(s) for T1, T2",
            roadmap_issues,
        )

    def test_connector_spec_false_line_count_claim_fails(self) -> None:
        spec = "docs/reference/CVF_LHW12_T1_TEST_CONNECTOR_SPEC_2026-05-29.md"
        self._write(
            spec,
            "\n".join(
                [
                    "# Spec",
                    "Status: DRAFT",
                    "- Connector spec < 5 lines (actual: 4 lines).",
                    "Line 4",
                    "Line 5",
                    "Line 6",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([spec])

        self.assertFalse(report["compliant"])
        self.assertIn(
            "connector spec claims a line-count threshold under 5 lines but file has 6 lines",
            report["violations"][0]["issues"],
        )

    # ---------------------------------------------------------------------------
    # P4B-B authoring defect bundle regression (GC018-DISPATCH-PACKET-AUTHORING-
    # GUARD-HARDENING-2026-06-15). All four finding classes must be detected
    # together on a single defective work order that mirrors the real P4B-B packet.
    # ---------------------------------------------------------------------------

    def _p4b_b_defective_work_order_lines(self) -> list[str]:
        """Construct a minimal P4B-B-like work order that carries all four
        authoring defects reported in the hardening GC-018:
          1. dispatchBaseHead is prose, not a commit SHA.
          2. Missing Worker Autonomy / No-Question Rule section.
          3. Source Verification uses noncanonical columns (adds BOUNDARY column).
          4. Source Verification disposition contains boundary prose instead of
             the canonical ACCEPT / REJECT / BLOCKED_SOURCE_NOT_FOUND vocabulary.
        """
        return [
            "# CVF Agent Work Order: P4B-B Defect Bundle Regression Fixture",
            "Status: DISPATCHED_TO_WORKER",
            "Commit mode: WORKER_MAY_COMMIT",
            # Defect 1: prose instead of a 6-40 hex SHA
            "dispatchBaseHead: current HEAD at time of P5-C session sync",
            "executionBaseHead: Codex captures with git rev-parse --short HEAD before first edit",
            "closureBaseHead: Codex records material commit SHA in completion review",
            "## Intake Role Routing Decision",
            "- Intake summary: bounded R1 doc-only.",
            "- Scope classification: bounded allowed scope.",
            "- Risk sensitivity: no live call.",
            "- Selected role route: routeMode=SINGLE_AGENT_MULTI_ROLE_CODEX.",
            "- Role separation basis: Codex implements and reviews.",
            "- Escalation condition: stop for network or credential.",
            # Defect 2: No-Question Rule section is absent (intentionally omitted)
            # Defect 3+4: noncanonical column header AND boundary prose in Disposition
            "## Source Verification Block",
            (
                "| Claimed item | Source file | Verified line | Verified symbol"
                " | Owning interface | Disposition |"
            ),
            "|---|---|---|---|---|---|",
            (
                "| CredentialBoundary.resolveSecretForRuntime (live-only, forbidden in T0)"
                " | EXTENSIONS/CVF_MODEL_GATEWAY/src/credential-boundary.ts | line 33"
                " | resolveSecretForRuntime | CredentialBoundary"
                " | BOUNDARY: must not be called with real key in T0 |"
            ),
            (
                "| Alibaba sample adapter (sample, not canonical)"
                " | EXTENSIONS/CVF_MODEL_GATEWAY/src/providers/alibaba/stream-adapter.ts"
                " | line 28 | createAlibabaQwenTurboStreamAdapter | alibaba stream adapter"
                " | BOUNDARY: sample only; matrix documents env var names; T0 must not instantiate with real key |"
            ),
            "## Roadmap-To-Work-Order Trace Matrix",
            "| Requirement | Work-order section | Disposition |",
            "|---|---|---|",
            "| T0 scope | Allowed Scope | RELEASED |",
        ]

    def test_p4b_b_authoring_defect_bundle_all_four_findings_detected(self) -> None:
        """Regression: a P4B-B-like packet with all four authoring defects must
        produce findings for each defect class. This test prevents future checker
        edits from silently dropping any of the four controls."""
        work_order = "docs/work_orders/CVF_WO_P4B_B_DEFECT_BUNDLE_REGRESSION_FIXTURE_2026-06-15.md"
        self._write(work_order, "\n".join(self._p4b_b_defective_work_order_lines()))
        self._write("docs/reference/source.md", "Scope\n")

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertFalse(report["compliant"], "defective packet must fail dispatch-quality")
        violations = report.get("violations", [])
        self.assertTrue(violations, "at least one violation entry expected")
        issues: list[str] = []
        for v in violations:
            if v.get("path") == work_order:
                issues.extend(v.get("issues", []))

        # Finding 1: prose dispatchBaseHead
        self.assertTrue(
            any("non-commit" in issue and "dispatchBaseHead" in issue for issue in issues),
            f"Finding 1 (non-commit dispatchBaseHead) not detected. Issues: {issues}",
        )
        # Finding 2: missing Worker Autonomy / No-Question Rule
        self.assertTrue(
            any("Worker Autonomy" in issue for issue in issues),
            f"Finding 2 (missing Worker Autonomy) not detected. Issues: {issues}",
        )
        # Finding 3: noncanonical Source Verification column schema
        self.assertTrue(
            any("noncanonical columns" in issue for issue in issues),
            f"Finding 3 (noncanonical Source Verification columns) not detected. Issues: {issues}",
        )
        # Finding 4: BOUNDARY prose in Disposition cell
        self.assertTrue(
            any("disposition" in issue.lower() and "ACCEPT" in issue for issue in issues),
            f"Finding 4 (BOUNDARY prose in disposition) not detected. Issues: {issues}",
        )

    def test_p4b_b_defect_bundle_canonical_packet_passes(self) -> None:
        """Inverse regression: a packet that fixes all four defects must pass the
        checker, confirming the controls are not over-broad."""
        work_order = "docs/work_orders/CVF_WO_P4B_B_CANONICAL_REGRESSION_FIXTURE_2026-06-15.md"
        self._write(
            work_order,
            "\n".join(
                self._ready_work_order_lines(
                    [
                        "## Roadmap-To-Work-Order Trace Matrix",
                        "| Requirement | Work-order section | Disposition |",
                        "|---|---|---|",
                        "| T0 scope | Allowed Scope | RELEASED |",
                        "## Evidence Requirements",
                        "Evidence: gate output required.",
                        "## Review Gate",
                        "Reviewer inspects diff.",
                        "## Closure Checklist",
                        "- [ ] Gate PASS",
                        "## Return-To-Orchestrator Conditions",
                        "Stop for scope expansion.",
                    ]
                )
            ),
        )
        self._write("docs/reference/source.md", "Scope\n")

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertTrue(report["compliant"], report.get("violations"))


class StaleRoadmapRedispatchGuardTests(unittest.TestCase):
    """RSF-T2: a roadmap-derived ready/dispatch work order whose tranche already
    has a CLOSED_PASS_BOUNDED completion must be blocked as a stale redispatch."""

    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.repo_root = Path(self.temp_dir.name)

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def _write(self, rel_path: str, text: str) -> None:
        path = self.repo_root / rel_path
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")

    def _roadmap_derived_ready_work_order(self) -> str:
        return "\n".join(
            [
                "# Test Work Order",
                "Status: DISPATCHED_TO_WORKER",
                "docs/roadmaps/CVF_EXAMPLE_ROADMAP_2026-06-16.md",
                "## Roadmap-To-Work-Order Trace Matrix",
                "| Roadmap requirement | Work order section | Output | Check | Status |",
                "|---|---|---|---|---|",
                "| R1 | S1 | artifact | check | PASS |",
            ]
        )

    def test_scope_token_extraction(self) -> None:
        self.assertEqual(
            MODULE._work_order_scope_token(
                "docs/work_orders/CVF_AGENT_WORK_ORDER_EXAMPLE_FEATURE_FOR_CODEX_2026-06-16.md"
            ),
            "EXAMPLE_FEATURE",
        )
        # Non-canonical filename yields empty token.
        self.assertEqual(MODULE._work_order_scope_token("docs/work_orders/random.md"), "")

    def test_stale_redispatch_blocked_by_filename_match(self) -> None:
        # T2-AC1: matching closed completion blocks stale roadmap-derived dispatch.
        work_order = "docs/work_orders/CVF_AGENT_WORK_ORDER_EXAMPLE_FEATURE_FOR_CODEX_2026-06-16.md"
        self._write(work_order, self._roadmap_derived_ready_work_order())
        self._write(
            "docs/reviews/CVF_EXAMPLE_FEATURE_COMPLETION_2026-06-16.md",
            "# Completion\nStatus: CLOSED_PASS_BOUNDED\n",
        )
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            issues = MODULE._validate_stale_roadmap_redispatch(
                work_order, self._roadmap_derived_ready_work_order()
            )
        self.assertTrue(
            any("stale roadmap-derived dispatch/ready work order" in issue for issue in issues),
            issues,
        )

    def test_non_stale_dispatch_passes_when_no_closed_completion(self) -> None:
        # T2-AC2: non-stale roadmap-derived dispatch passes (no matching completion).
        work_order = "docs/work_orders/CVF_AGENT_WORK_ORDER_FRESH_FEATURE_FOR_CODEX_2026-06-16.md"
        self._write(work_order, self._roadmap_derived_ready_work_order())
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            issues = MODULE._validate_stale_roadmap_redispatch(
                work_order, self._roadmap_derived_ready_work_order()
            )
        self.assertEqual(issues, [])

    def test_non_closed_completion_does_not_block(self) -> None:
        # A completion that is not CLOSED_PASS_BOUNDED must not block dispatch.
        work_order = "docs/work_orders/CVF_AGENT_WORK_ORDER_PENDING_FEATURE_FOR_CODEX_2026-06-16.md"
        self._write(work_order, self._roadmap_derived_ready_work_order())
        self._write(
            "docs/reviews/CVF_PENDING_FEATURE_COMPLETION_2026-06-16.md",
            "# Completion\nStatus: COMPLETE_PENDING_REVIEW\n",
        )
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            issues = MODULE._validate_stale_roadmap_redispatch(
                work_order, self._roadmap_derived_ready_work_order()
            )
        self.assertEqual(issues, [])

    def test_non_roadmap_derived_work_order_skipped(self) -> None:
        # The guard only applies to roadmap-derived work orders.
        work_order = "docs/work_orders/CVF_AGENT_WORK_ORDER_EXAMPLE_FEATURE_FOR_CODEX_2026-06-16.md"
        non_roadmap_text = "# WO\nStatus: DISPATCHED_TO_WORKER\nNo roadmap reference here.\n"
        self._write(
            "docs/reviews/CVF_EXAMPLE_FEATURE_COMPLETION_2026-06-16.md",
            "# Completion\nStatus: CLOSED_PASS_BOUNDED\n",
        )
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            issues = MODULE._validate_stale_roadmap_redispatch(work_order, non_roadmap_text)
        self.assertEqual(issues, [])

    def test_explicit_completion_path_reference_blocks(self) -> None:
        # A bounded explicit completionReviewPath reference is also honored.
        work_order = "docs/work_orders/CVF_AGENT_WORK_ORDER_REFERENCED_FOR_CODEX_2026-06-16.md"
        body = "\n".join(
            [
                "# WO",
                "Status: DISPATCHED_TO_WORKER",
                "docs/roadmaps/CVF_EXAMPLE_ROADMAP_2026-06-16.md",
                "completionReviewPath:",
                "`docs/reviews/CVF_OTHER_SCOPE_COMPLETION_2026-06-16.md`",
            ]
        )
        self._write(work_order, body)
        self._write(
            "docs/reviews/CVF_OTHER_SCOPE_COMPLETION_2026-06-16.md",
            "# Completion\nStatus: CLOSED_PASS_BOUNDED\n",
        )
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            issues = MODULE._validate_stale_roadmap_redispatch(work_order, body)
        self.assertTrue(any("stale roadmap-derived" in issue for issue in issues), issues)

    def test_prior_completion_reference_in_authority_chain_does_not_block(self) -> None:
        # Prior-tranche completion evidence is not the current work order's closure.
        work_order = "docs/work_orders/CVF_AGENT_WORK_ORDER_CURRENT_SCOPE_FOR_CODEX_2026-06-16.md"
        body = "\n".join(
            [
                "# WO",
                "Status: DISPATCHED_TO_WORKER",
                "docs/roadmaps/CVF_EXAMPLE_ROADMAP_2026-06-16.md",
                "completionReviewPath:",
                "`docs/reviews/CVF_CURRENT_SCOPE_COMPLETION_2026-06-16.md`",
                "## Authority Chain",
                "- Prior completion:",
                "  `docs/reviews/CVF_PRIOR_SCOPE_COMPLETION_2026-06-16.md`.",
            ]
        )
        self._write(
            "docs/reviews/CVF_PRIOR_SCOPE_COMPLETION_2026-06-16.md",
            "# Completion\nStatus: CLOSED_PASS_BOUNDED\n",
        )
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            issues = MODULE._validate_stale_roadmap_redispatch(work_order, body)
        self.assertEqual(issues, [])


if __name__ == "__main__":
    unittest.main()
