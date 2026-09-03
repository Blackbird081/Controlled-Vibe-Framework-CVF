#!/usr/bin/env python3
"""Focused unit tests for the WOAS-R1 dispatch packet authoring scaffold helper."""

from __future__ import annotations

import re
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_dispatch_packet_scaffold import (
    ScaffoldArgs,
    build_gc018_baseline,
    build_trigger_map_table,
    build_work_order,
    build_worker_return_skeleton,
    detect_triggers,
    main,
    TRIGGER_FAMILIES,
)
from run_agent_automation_assist import (
    diagnose_no_commit_work_order,
    WORKER_RETURN_PACKET_SHAPE_CONDITIONAL_TERMS,
    WORKER_RETURN_PACKET_SHAPE_REQUIRED_TERMS,
)

FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"
SOURCE_INTAKE_GOLDEN_FIXTURE = FIXTURES_DIR / "woas_r2_source_intake_scaffold_golden.md"
WORKER_RETURN_SKELETON_GOLDEN_FIXTURE = FIXTURES_DIR / "woas_r3_worker_return_skeleton_golden.md"

# Mirrors governance/compat/check_source_intake_decision_packet_preflight.py's
# STANDALONE_MARKER_PATTERN / REQUIRED_SECTION exactly, so this test fails if
# the helper's source-intake stub ever accidentally opts a generated sample
# into the real KIOD-R8 decision-packet checker (ADIF-0020/ADIF-0021
# marker-overmatch prevention; WOAS-R2 AC4).
KIOD_R8_STANDALONE_MARKER_PATTERN = re.compile(
    r"^\s*[-*]?\s*Source intake decision packet: REQUIRED\s*$", re.MULTILINE
)
KIOD_R8_REQUIRED_SECTION_HEADING_PATTERN = re.compile(
    r"^## Source Intake Decision Packet\s*$", re.MULTILINE
)


def _base_args(**overrides) -> ScaffoldArgs:
    defaults = dict(
        packet_kind="generic-worker-dispatch",
        batch_id="TEST-BATCH",
        title="Test Packet",
        date="2026-07-01",
        base="abc1234",
        commit_mode="WORKER_MUST_NOT_COMMIT",
        dependencies=[],
    )
    defaults.update(overrides)
    return ScaffoldArgs(**defaults)


class TestGenericWorkerDispatch(unittest.TestCase):
    """AC1: helper emits a generic held worker-dispatch baseline and work order."""

    def test_baseline_has_required_machine_shape_sections(self) -> None:
        args = _base_args()
        active = detect_triggers(args)
        baseline = build_gc018_baseline(args, active)
        for marker in (
            "## Purpose",
            "## ADIF Defect Registry Disclosure",
            "## Checker Source Read-Ahead Block",
            "## Source Verification Block",
            "## Negative Search And Collision Discipline",
            "## Public Export Disposition",
        ):
            self.assertIn(marker, baseline)

    def test_work_order_has_required_machine_shape_sections(self) -> None:
        args = _base_args()
        active = detect_triggers(args)
        work_order = build_work_order(args, active)
        for marker in (
            "## Dispatch Prompt Envelope",
            "## Purpose",
            "## Worker Autonomy / No-Question Rule",
            "## ADIF Defect Registry Disclosure",
            "## Checker Source Read-Ahead Block",
            "## Source Verification Block",
            "## Negative Search And Collision Discipline",
            "## Required Artifact Manifest",
            "## Worker Return Packet Shape Contract",
            "## Agent Operation Trace Block",
            "## Delta Execution Claim Boundary Control Block",
            "## Public Export Disposition",
        ):
            self.assertIn(marker, work_order)

    def test_generated_work_order_opts_into_convergence_checker(self) -> None:
        args = _base_args()
        work_order = build_work_order(args, detect_triggers(args))
        self.assertIn("docType: work_order", work_order)
        self.assertIn("Review-Dispatch Convergence Control: REQUIRED", work_order)
        self.assertIn("dispatchKind: INITIAL", work_order)
        self.assertIn("consolidatedDefectClassSweep: COMPLETE_INITIAL_ACCEPTANCE_MATRIX", work_order)
        self.assertIn("successorTrancheOpened: NO", work_order)
        self.assertIn(
            "implementationAutonomyDisposition: CONTRACT_AUTHORITY_EVIDENCE_OUTCOME_ONLY",
            work_order,
        )
        self.assertIn("preExecutionReviewAdmission: NOT_REQUIRED_BEFORE_EXECUTION", work_order)
        self.assertIn("preExecutionReviewTrigger: NONE", work_order)
        self.assertIn("nextRoutineReviewBoundary: WORKER_RETURN", work_order)
        self.assertIn(
            "reviewerWorkBoundary: EVALUATE_RETURNED_EVIDENCE_NOT_RECREATE_IMPLEMENTATION",
            work_order,
        )

    def test_rework_scaffold_emits_one_consolidated_packet(self) -> None:
        args = _base_args(
            dispatch_kind="REWORK",
            dispatch_surface="EXTERNAL_AGENT_CLI_MCP",
            review_round_count=1,
            root_cause_cluster_id="cluster-lock-identity",
            prior_finding_set_digest="a" * 64,
            cumulative_external_invocation_count=1,
            external_invocation_ceiling=2,
        )
        work_order = build_work_order(args, detect_triggers(args))
        self.assertIn("reworkGeneration: 1", work_order)
        self.assertIn("rootCauseClusterId: cluster-lock-identity", work_order)
        self.assertIn("consolidatedDefectClassSweep: COMPLETE_BEFORE_REWORK_DISPATCH", work_order)
        self.assertIn("nextDispatchDisposition: ONE_CONSOLIDATED_REWORK", work_order)

    def test_dispatch_prompt_envelope_is_first_section(self) -> None:
        args = _base_args()
        active = detect_triggers(args)
        work_order = build_work_order(args, active)
        first_heading_index = work_order.find("\n## ")
        self.assertNotEqual(first_heading_index, -1)
        first_heading_line = work_order[first_heading_index + 1 :].splitlines()[0]
        self.assertEqual(first_heading_line, "## Dispatch Prompt Envelope")

    def test_checker_read_ahead_block_has_four_required_fields(self) -> None:
        args = _base_args()
        active = detect_triggers(args)
        work_order = build_work_order(args, active)
        for field in (
            "applicableCheckersRead",
            "literalTokensReviewed",
            "gateRunPurpose",
            "claimBoundary",
        ):
            self.assertIn(field, work_order)

    def test_source_verification_block_has_required_columns(self) -> None:
        args = _base_args()
        active = detect_triggers(args)
        work_order = build_work_order(args, active)
        for column in (
            "Claimed item",
            "Source file",
            "Verified line/section",
            "Verified path or symbol",
            "Owning interface/function/schema",
            "Disposition",
        ):
            self.assertIn(column, work_order)

    def test_adif_disclosure_has_exact_resolver_query_field_names(self) -> None:
        args = _base_args()
        active = detect_triggers(args)
        baseline = build_gc018_baseline(args, active)
        self.assertIn("Resolver query: taskClass=`", baseline)
        self.assertIn("role=`", baseline)
        self.assertIn("lifecyclePhase=`", baseline)


class TestHeldPacketDependencyFields(unittest.TestCase):
    """AC4: held packets contain dependency-release evidence fields."""

    def test_dependency_flag_activates_held_dependency_trigger(self) -> None:
        args = _base_args(dependencies=["upstream closure evidence"])
        active = detect_triggers(args)
        self.assertTrue(active["held_dependency"])

    def test_no_dependency_and_non_held_kind_does_not_activate_trigger(self) -> None:
        args = _base_args(dependencies=[], packet_kind="generic-worker-dispatch")
        active = detect_triggers(args)
        self.assertFalse(active["held_dependency"])

    def test_held_dependency_packet_kind_activates_without_dependency_flag(self) -> None:
        args = _base_args(dependencies=[], packet_kind="held-dependency")
        active = detect_triggers(args)
        self.assertTrue(active["held_dependency"])

    def test_dependency_release_evidence_section_lists_dependency_text(self) -> None:
        args = _base_args(dependencies=["KIOD-R8 closure evidence"])
        active = detect_triggers(args)
        baseline = build_gc018_baseline(args, active)
        self.assertIn("## Dependency Release Evidence", baseline)
        self.assertIn("KIOD-R8 closure evidence", baseline)

    def test_non_held_packet_omits_dependency_release_evidence_section(self) -> None:
        args = _base_args(dependencies=[], packet_kind="generic-worker-dispatch")
        active = detect_triggers(args)
        baseline = build_gc018_baseline(args, active)
        self.assertNotIn("## Dependency Release Evidence", baseline)


class TestNoCommitWorkerPacket(unittest.TestCase):
    """AC2: helper emits a no-commit worker packet with AHB and Reviewer Closure Conversion."""

    def test_worker_must_not_commit_activates_no_commit_trigger(self) -> None:
        args = _base_args(commit_mode="WORKER_MUST_NOT_COMMIT")
        active = detect_triggers(args)
        self.assertTrue(active["no_commit_worker"])

    def test_worker_may_commit_does_not_activate_no_commit_trigger(self) -> None:
        args = _base_args(commit_mode="WORKER_MAY_COMMIT")
        active = detect_triggers(args)
        self.assertFalse(active["no_commit_worker"])

    def test_work_order_includes_ahb_and_reviewer_closure_when_must_not_commit(self) -> None:
        args = _base_args(commit_mode="WORKER_MUST_NOT_COMMIT")
        active = detect_triggers(args)
        work_order = build_work_order(args, active)
        self.assertIn("## Agent Handoff Contract Control Block", work_order)
        self.assertIn("## Reviewer Closure Conversion", work_order)
        self.assertIn("workerCommitPermission | FORBIDDEN", work_order)

    def test_no_commit_work_order_uses_compact_worker_return_full_gate_contract(self) -> None:
        args = _base_args(commit_mode="WORKER_MUST_NOT_COMMIT")
        active = detect_triggers(args)
        work_order = build_work_order(args, active)
        self.assertIn("## Worker Return Packet Shape Contract", work_order)
        self.assertIn("contractProfile: WORKER_RETURN_FULL_GATE_V1", work_order)
        self.assertIn(
            "requiredGate: `python governance/compat/run_worker_return_fast_gate.py`",
            work_order,
        )
        self.assertIn("individualCheckerSubstitution: FORBIDDEN", work_order)
        self.assertIn("workerReturnSkeleton: CHECKER_SAFE_SKELETON_REQUIRED", work_order)
        self.assertIn("Shape-list rule:", work_order)
        self.assertIn("## Verification Commands", work_order)
        self.assertIn("python governance/compat/run_worker_return_fast_gate.py", work_order)

    def test_no_commit_work_order_includes_worker_output_read_ahead_mandate(self) -> None:
        args = _base_args(commit_mode="WORKER_MUST_NOT_COMMIT")
        active = detect_triggers(args)
        work_order = build_work_order(args, active)
        self.assertIn("## Worker Output Checker Read-Ahead Mandate", work_order)
        self.assertIn("docType, path family, and conditional content class", work_order)
        self.assertIn("write section names without the `##` prefix", work_order)

    def test_ahb_block_has_required_base_head_fields(self) -> None:
        args = _base_args(commit_mode="WORKER_MUST_NOT_COMMIT", base="deadbeef")
        active = detect_triggers(args)
        work_order = build_work_order(args, active)
        self.assertIn("dispatchBaseHead=deadbeef", work_order)
        self.assertIn("executionBaseHead=WORKER_MUST_CAPTURE_AT_START", work_order)
        self.assertIn("closureBaseHead=REVIEWER_TO_SET", work_order)

    def test_work_order_omits_ahb_when_worker_may_commit(self) -> None:
        args = _base_args(commit_mode="WORKER_MAY_COMMIT")
        active = detect_triggers(args)
        work_order = build_work_order(args, active)
        self.assertNotIn("## Agent Handoff Contract Control Block", work_order)
        self.assertNotIn("## Reviewer Closure Conversion", work_order)


class TestTriggerDrivenOptionalBlocks(unittest.TestCase):
    """AC3: trigger-driven stubs for source-intake, runtime/provider/live,
    package-skill, Web/UI, MCP/CLI, public-sync, evidence-reuse, and
    protected-path indicators."""

    def test_source_intake_indicator_activates_trigger_and_stub(self) -> None:
        args = _base_args(title="Outside-source repo folder review")
        active = detect_triggers(args)
        self.assertTrue(active["source_intake"])
        baseline = build_gc018_baseline(args, active)
        self.assertIn("## Source-Intake Decision Packet Fields", baseline)

    def test_runtime_provider_live_indicator_activates_trigger_and_stub(self) -> None:
        args = _base_args(title="Runtime provider live proof packet")
        active = detect_triggers(args)
        self.assertTrue(active["runtime_provider_live"])
        baseline = build_gc018_baseline(args, active)
        self.assertIn("## Current Runtime Freshness Verification", baseline)

    def test_package_skill_indicator_activates_trigger_and_stub(self) -> None:
        args = _base_args(title="Package skill registry work")
        active = detect_triggers(args)
        self.assertTrue(active["package_skill"])
        baseline = build_gc018_baseline(args, active)
        self.assertIn("## Package Skill Productionization Control Block", baseline)

    def test_web_ui_dashboard_indicator_activates_trigger_and_stub(self) -> None:
        args = _base_args(title="Web dashboard UI redesign")
        active = detect_triggers(args)
        self.assertTrue(active["web_ui_dashboard"])
        baseline = build_gc018_baseline(args, active)
        self.assertIn("## Web/UI Claim Boundary", baseline)

    def test_mcp_cli_indicator_activates_trigger_and_stub(self) -> None:
        args = _base_args(title="MCP adapter and CLI boundary work")
        active = detect_triggers(args)
        self.assertTrue(active["mcp_cli"])
        baseline = build_gc018_baseline(args, active)
        self.assertIn("## MCP/CLI Adapter Boundary", baseline)

    def test_public_sync_indicator_activates_trigger_and_stub(self) -> None:
        args = _base_args(title="Public-sync export batch")
        active = detect_triggers(args)
        self.assertTrue(active["public_sync"])
        baseline = build_gc018_baseline(args, active)
        self.assertIn("## Public/Provenance Boundary", baseline)

    def test_unicode_evidence_reuse_indicator_activates_trigger_and_stub(self) -> None:
        args = _base_args(title="Unicode encoding and prior evidence reuse")
        active = detect_triggers(args)
        self.assertTrue(active["unicode_evidence_reuse"])
        baseline = build_gc018_baseline(args, active)
        self.assertIn("## Evidence Reuse And Encoding Plan", baseline)
        self.assertIn("verificationMode: FILL_ME", baseline)
        self.assertIn("unicodePathHandling: use literal paths and UTF-8-safe readers", baseline)
        self.assertIn("field-line parser", baseline)

    def test_protected_governance_path_indicator_activates_trigger_and_stub(self) -> None:
        args = _base_args(title="Update hook catalog and checker wiring")
        active = detect_triggers(args)
        self.assertTrue(active["protected_governance_path"])
        baseline = build_gc018_baseline(args, active)
        self.assertIn("## Core Guard Self-Protection Authorization", baseline)

    def test_negative_search_stub_includes_exact_command_roots_and_query(self) -> None:
        args = _base_args(title="Collision discipline sample")
        active = detect_triggers(args)
        baseline = build_gc018_baseline(args, active)
        self.assertIn("search roots: governed artifact roots plus session state", baseline)
        self.assertIn("exact search command:", baseline)
        self.assertIn("query used FILL_ME", baseline)

    def test_neutral_title_does_not_activate_content_triggers(self) -> None:
        args = _base_args(title="A quiet neutral title with no trigger words")
        active = detect_triggers(args)
        for key in (
            "source_intake",
            "runtime_provider_live",
            "package_skill",
            "web_ui_dashboard",
            "mcp_cli",
            "public_sync",
            "unicode_evidence_reuse",
            "protected_governance_path",
        ):
            self.assertFalse(active[key], f"trigger {key} unexpectedly active")


class TestSourceIntakeGoldenFixture(unittest.TestCase):
    """WOAS-R2: source-intake scaffold output regression fixture and
    marker-overmatch avoidance (AC1, AC4).

    SCEC-T1 note: `include_scec_block=False` here is deliberate and scoped
    only to this pre-existing, out-of-manifest golden fixture
    (`governance/compat/fixtures/woas_r2_source_intake_scaffold_golden.md`,
    which SCEC-T1's Required Artifact Manifest does not authorize touching).
    Every other `ScaffoldArgs` construction site in this module and in
    `check_semantic_convergence_control.py`'s own tests keeps the class
    default `include_scec_block=True`, so new work orders still emit a valid
    SCEC block by default per the SCEC-T1 scaffold requirement.
    """

    GOLDEN_ARGS = dict(
        packet_kind="source-intake",
        batch_id="WOAS-R2-GOLDEN",
        title="Source Intake Scaffold Golden Fixture",
        date="2026-07-01",
        base="GOLDENFIXTUREBASEHEAD",
        commit_mode="WORKER_MUST_NOT_COMMIT",
        dependencies=[],
        include_scec_block=False,
    )

    def _golden_work_order(self) -> str:
        args = ScaffoldArgs(**self.GOLDEN_ARGS)
        active = detect_triggers(args)
        return build_work_order(args, active)

    def test_golden_fixture_file_exists(self) -> None:
        self.assertTrue(
            SOURCE_INTAKE_GOLDEN_FIXTURE.is_file(),
            f"missing golden fixture at {SOURCE_INTAKE_GOLDEN_FIXTURE}",
        )

    def test_source_intake_output_matches_golden_fixture_exactly(self) -> None:
        expected = SOURCE_INTAKE_GOLDEN_FIXTURE.read_text(encoding="utf-8")
        actual = self._golden_work_order()
        self.assertEqual(
            expected,
            actual,
            "helper source-intake output drifted from the checked-in golden "
            "fixture; regenerate the fixture only after confirming the drift "
            "is an intended shape change",
        )

    def test_source_intake_output_has_source_intake_trigger_active(self) -> None:
        args = ScaffoldArgs(**self.GOLDEN_ARGS)
        active = detect_triggers(args)
        self.assertTrue(active["source_intake"])

    def test_source_intake_output_avoids_standalone_kiod_r8_marker(self) -> None:
        work_order = self._golden_work_order()
        self.assertIsNone(
            KIOD_R8_STANDALONE_MARKER_PATTERN.search(work_order),
            "source-intake scaffold stub must never emit the standalone "
            "`Source intake decision packet: REQUIRED` declaration line, or "
            "generated samples would false-opt into the real KIOD-R8 "
            "decision-packet checker",
        )

    def test_source_intake_output_avoids_real_required_section_heading(self) -> None:
        work_order = self._golden_work_order()
        self.assertIsNone(
            KIOD_R8_REQUIRED_SECTION_HEADING_PATTERN.search(work_order),
            "source-intake scaffold stub must use a distinct heading "
            "(`## Source-Intake Decision Packet Fields (trigger stub)`), not "
            "the real `## Source Intake Decision Packet` required-section "
            "heading",
        )

    def test_source_intake_baseline_also_avoids_marker_overmatch(self) -> None:
        args = ScaffoldArgs(**self.GOLDEN_ARGS)
        active = detect_triggers(args)
        baseline = build_gc018_baseline(args, active)
        self.assertIsNone(KIOD_R8_STANDALONE_MARKER_PATTERN.search(baseline))
        self.assertIsNone(KIOD_R8_REQUIRED_SECTION_HEADING_PATTERN.search(baseline))

    def test_declaration_shape_marker_would_be_detected_if_present(self) -> None:
        """Regression guard for the test itself: confirm the KIOD-R8 patterns
        used above actually match a real standalone declaration, so a future
        typo in the regex cannot silently make AC4 tests vacuous."""
        real_marker_sample = "Source intake decision packet: REQUIRED\n"
        self.assertIsNotNone(KIOD_R8_STANDALONE_MARKER_PATTERN.search(real_marker_sample))
        real_heading_sample = "## Source Intake Decision Packet\n"
        self.assertIsNotNone(
            KIOD_R8_REQUIRED_SECTION_HEADING_PATTERN.search(real_heading_sample)
        )

    def test_quoted_marker_in_literal_token_list_is_not_standalone(self) -> None:
        """Gotcha 35: quoting the real marker inside backticks as a literal
        token (e.g. inside a Checker Source Read-Ahead Block) must not count
        as a standalone declaration line."""
        quoted_sample = (
            "| literalTokensReviewed | `Source intake decision packet: "
            "REQUIRED` reviewed for avoidance |\n"
        )
        self.assertIsNone(KIOD_R8_STANDALONE_MARKER_PATTERN.search(quoted_sample))

    def test_golden_output_has_no_commit_and_source_intake_sections_together(self) -> None:
        work_order = self._golden_work_order()
        for marker in (
            "## Dispatch Prompt Envelope",
            "## Agent Handoff Contract Control Block",
            "## Reviewer Closure Conversion",
            "## Source-Intake Decision Packet Fields (trigger stub)",
            "## Negative Search And Collision Discipline",
            "## Public Export Disposition",
            "DEFERRED_PRIVATE_ONLY",
        ):
            self.assertIn(marker, work_order)


class TestWorkerReturnSkeleton(unittest.TestCase):
    """WOAS-R3: worker-return skeleton generation, golden fixture, CLI opt-in,
    default-output stability, and KIOD-R8 marker-overmatch avoidance."""

    GOLDEN_ARGS = dict(
        packet_kind="generic-worker-dispatch",
        batch_id="WOAS-R3-GOLDEN",
        title="Worker Return Skeleton Scaffold",
        date="2026-07-01",
        base="GOLDENFIXTUREBASEHEAD",
        commit_mode="WORKER_MUST_NOT_COMMIT",
        dependencies=[],
    )

    def _golden_skeleton(self) -> str:
        args = ScaffoldArgs(**self.GOLDEN_ARGS)
        return build_worker_return_skeleton(args)

    def test_golden_fixture_file_exists(self) -> None:
        self.assertTrue(
            WORKER_RETURN_SKELETON_GOLDEN_FIXTURE.is_file(),
            f"missing golden fixture at {WORKER_RETURN_SKELETON_GOLDEN_FIXTURE}",
        )

    def test_skeleton_matches_golden_fixture_exactly(self) -> None:
        expected = WORKER_RETURN_SKELETON_GOLDEN_FIXTURE.read_text(encoding="utf-8")
        actual = self._golden_skeleton()
        self.assertEqual(
            expected,
            actual,
            "worker-return skeleton output drifted from the checked-in golden "
            "fixture; regenerate the fixture only after confirming the drift "
            "is an intended shape change",
        )

    def test_skeleton_has_status_complete_pending_review(self) -> None:
        skeleton = self._golden_skeleton()
        self.assertIn("Status: COMPLETE_PENDING_REVIEW", skeleton)

    def test_skeleton_has_dispatch_work_order_and_execution_base_head(self) -> None:
        skeleton = self._golden_skeleton()
        self.assertIn("Self-declared worker-return artifact: yes", skeleton)
        self.assertIn("Responds to work order:", skeleton)
        self.assertIn("dispatchWorkOrder:", skeleton)
        self.assertIn("executionBaseHead:", skeleton)
        self.assertIn("rawMemoryReleased=false", skeleton)
        self.assertIn("git rev-parse --short HEAD", skeleton)

    def test_skeleton_emits_empty_resolution_evidence_default(self) -> None:
        import check_semantic_convergence_control as scec_checker

        skeleton = self._golden_skeleton()
        blocks = scec_checker.find_active_blocks(skeleton)
        self.assertEqual(len(blocks), 1)
        self.assertEqual(blocks[0].get("resolutionEvidence"), {})

    def test_skeleton_has_no_banned_worker_return_quality_gate_placeholder(self) -> None:
        """WOAS-R7: generated skeleton must be checker-safe by construction -
        it must never contain a token from
        `check_worker_return_quality_gate.PLACEHOLDER_MARKERS`, since that
        checker scans the full raw document text regardless of context."""
        skeleton = self._golden_skeleton()
        self.assertNotIn("FILL_ME", skeleton)
        self.assertNotIn("WORKER_MUST_CAPTURE_AT_START", skeleton)

    def test_skeleton_has_required_top_level_sections(self) -> None:
        skeleton = self._golden_skeleton()
        for heading in (
            "## Purpose",
            "## Scope / Methodology",
            "## Findings / Position",
            "## Risk / Corrective Action",
            "## Checker Source Read-Ahead Block",
            "## Agent Operation Trace Block",
            "## Delta Execution Claim Boundary Control Block",
            "## Public Export Disposition",
            "## Claim Boundary",
            "## git status --short",
            "## Changed Files",
            "## Command Evidence",
            "## No-Commit Statement",
        ):
            self.assertIn(heading, skeleton, f"missing heading: {heading}")

    def test_skeleton_has_all_aot_labels(self) -> None:
        skeleton = self._golden_skeleton()
        for label in (
            "Actor",
            "Provider or surface",
            "Session or invocation",
            "Working directory",
            "Command or tool surface",
            "Target paths",
            "Allowed scope source",
            "Before status evidence",
            "After status evidence",
            "Diff evidence",
            "Approval boundary",
            "Claim boundary",
            "Agent type",
            "Invocation ID",
            "Expected manifest",
            "Actual changed set",
            "Manifest delta",
            "Deletion or rename disposition",
        ):
            self.assertIn(label, skeleton, f"missing AOT label: {label}")

    def test_skeleton_has_all_delta_fields(self) -> None:
        skeleton = self._golden_skeleton()
        for field in (
            "claimScope",
            "claimDisposition",
            "receiptEvidence",
            "actionEvidence",
            "invocationBoundary",
            "interceptionBoundary",
            "claimLanguage",
            "forbiddenExpansion",
        ):
            self.assertIn(field, skeleton, f"missing Delta field: {field}")
        self.assertIn("CLAIM_REJECTED_NO_RECEIPT", skeleton)
        self.assertIn("CLAIM_REJECTED_NO_ACTION", skeleton)

    def test_skeleton_has_public_export_deferred(self) -> None:
        skeleton = self._golden_skeleton()
        self.assertIn("DEFERRED_PRIVATE_ONLY", skeleton)

    def test_skeleton_has_conditional_na_sections(self) -> None:
        skeleton = self._golden_skeleton()
        for section in (
            "## External Knowledge Intake Routing",
            "## Rescan Intelligence Hardening",
            "## Corpus Completeness And Report Integrity",
            "## Finding-To-Governance Learning Disposition",
            "## Epistemic Process Block",
            "## Machine Closure Package",
        ):
            self.assertIn(section, skeleton, f"missing conditional section: {section}")
        self.assertIn("NOT_APPLICABLE_WITH_REASON", skeleton)
        self.assertIn(
            "operator-provided external comparison, critique, or recommendation",
            skeleton,
        )
        self.assertIn(
            "Reason: N/A with reason: this worker return is not a rescan",
            skeleton,
        )
        self.assertIn(
            "Corpus verdict: NOT_APPLICABLE_WITH_REASON - N/A with reason",
            skeleton,
        )

    def test_skeleton_has_worker_experience_and_fast_gate_command(self) -> None:
        skeleton = self._golden_skeleton()
        self.assertIn("## Worker Experience Retrospective", skeleton)
        self.assertIn("WORKER_EXPERIENCE_RETRO_NA_WITH_REASON", skeleton)
        self.assertIn("python governance/compat/run_worker_return_fast_gate.py", skeleton)

    def test_skeleton_has_no_commit_statement(self) -> None:
        skeleton = self._golden_skeleton()
        self.assertIn("WORKER_MUST_NOT_COMMIT honored", skeleton)

    def test_skeleton_avoids_kiod_r8_marker_overmatch(self) -> None:
        skeleton = self._golden_skeleton()
        self.assertIsNone(
            KIOD_R8_STANDALONE_MARKER_PATTERN.search(skeleton),
            "worker-return skeleton must not emit standalone KIOD-R8 marker",
        )
        self.assertIsNone(
            KIOD_R8_REQUIRED_SECTION_HEADING_PATTERN.search(skeleton),
            "worker-return skeleton must not emit real KIOD-R8 required-section heading",
        )

    def test_cli_opt_in_produces_skeleton_section(self) -> None:
        import io
        from contextlib import redirect_stdout

        buf = io.StringIO()
        with redirect_stdout(buf):
            exit_code = main(
                [
                    "--packet-kind",
                    "generic-worker-dispatch",
                    "--batch-id",
                    "WOAS-R3-CLI",
                    "--title",
                    "Worker Return Skeleton Scaffold",
                    "--date",
                    "2026-07-01",
                    "--base",
                    "abc1234",
                    "--commit-mode",
                    "WORKER_MUST_NOT_COMMIT",
                    "--stdout",
                    "--include-worker-return-skeleton",
                ]
            )
        self.assertEqual(exit_code, 0)
        output = buf.getvalue()
        self.assertIn("=== Generated Worker Return Skeleton ===", output)
        self.assertIn("Status: COMPLETE_PENDING_REVIEW", output)
        self.assertIn("## Agent Operation Trace Block", output)
        self.assertIn("--include-worker-return-skeleton --stdout", output)

    def test_cli_without_opt_in_omits_skeleton_section(self) -> None:
        import io
        from contextlib import redirect_stdout

        buf = io.StringIO()
        with redirect_stdout(buf):
            exit_code = main(
                [
                    "--packet-kind",
                    "generic-worker-dispatch",
                    "--batch-id",
                    "WOAS-R3-NOOPT",
                    "--title",
                    "Worker Return Skeleton Scaffold",
                    "--date",
                    "2026-07-01",
                    "--base",
                    "abc1234",
                    "--commit-mode",
                    "WORKER_MUST_NOT_COMMIT",
                    "--stdout",
                ]
            )
        self.assertEqual(exit_code, 0)
        output = buf.getvalue()
        self.assertNotIn("=== Generated Worker Return Skeleton ===", output)
        self.assertNotIn("--include-worker-return-skeleton --stdout", output)


class TestTriggerMapExplainability(unittest.TestCase):
    """The helper must expose an explainable trigger map."""

    def test_trigger_map_lists_all_ten_families(self) -> None:
        table = build_trigger_map_table()
        self.assertEqual(len(TRIGGER_FAMILIES), 10)
        for _key, name, _indicators, stub in TRIGGER_FAMILIES:
            self.assertIn(name, table)
            self.assertIn(stub.split(";")[0], table)

    def test_trigger_map_reference_mode_has_na_status(self) -> None:
        table = build_trigger_map_table()
        self.assertIn("N/A (reference only)", table)
        self.assertNotIn("ACTIVE", table)

    def test_trigger_map_active_mode_shows_active_and_inactive(self) -> None:
        args = _base_args(dependencies=["dep"], commit_mode="WORKER_MUST_NOT_COMMIT")
        active = detect_triggers(args)
        table = build_trigger_map_table(active)
        self.assertIn("ACTIVE", table)
        self.assertIn("inactive", table)

    def test_explain_trigger_map_cli_exits_zero(self) -> None:
        exit_code = main(["--explain-trigger-map"])
        self.assertEqual(exit_code, 0)


class TestCliBehavior(unittest.TestCase):
    def test_missing_required_args_exits_nonzero(self) -> None:
        exit_code = main(["--packet-kind", "generic-worker-dispatch"])
        self.assertEqual(exit_code, 2)

    def test_full_args_without_stdout_exits_nonzero(self) -> None:
        exit_code = main(
            [
                "--packet-kind",
                "generic-worker-dispatch",
                "--batch-id",
                "CLI-TEST",
                "--title",
                "CLI Test Packet",
                "--date",
                "2026-07-01",
                "--base",
                "abc1234",
                "--commit-mode",
                "WORKER_MUST_NOT_COMMIT",
            ]
        )
        self.assertEqual(exit_code, 2)

    def test_full_args_with_stdout_exits_zero(self) -> None:
        exit_code = main(
            [
                "--packet-kind",
                "generic-worker-dispatch",
                "--batch-id",
                "CLI-TEST",
                "--title",
                "CLI Test Packet",
                "--date",
                "2026-07-01",
                "--base",
                "abc1234",
                "--commit-mode",
                "WORKER_MUST_NOT_COMMIT",
                "--dependency",
                "sample upstream closure",
                "--stdout",
            ]
        )
        self.assertEqual(exit_code, 0)


class TestEacqFvL2ExecutionBasePacketShapeHardening(unittest.TestCase):
    """EACQ-FV-L2: execution-base command literal, complete scoped
    packet-shape contract, and canonical Required Artifact Manifest heading
    for generated no-commit work orders (Focused Case Matrix rows 1-7)."""

    def test_no_commit_generated_command_uses_execution_base_placeholder(self) -> None:
        """Case 1: no-commit generated command contains <executionBaseHead>
        and not the dispatch-base literal in the pre-implementation command."""
        args = _base_args(commit_mode="WORKER_MUST_NOT_COMMIT", base="abc1234")
        active = detect_triggers(args)
        work_order = build_work_order(args, active)
        pre_impl_line = next(
            line
            for line in work_order.splitlines()
            if "--phase pre-implementation" in line
        )
        self.assertIn("<executionBaseHead>", pre_impl_line)
        self.assertNotIn("abc1234", pre_impl_line)
        self.assertIn("--head HEAD", pre_impl_line)

    def test_scoped_contract_contains_every_required_term(self) -> None:
        """Case 2: every current required term is present inside the
        Worker Return Packet Shape Contract section."""
        args = _base_args(commit_mode="WORKER_MUST_NOT_COMMIT")
        active = detect_triggers(args)
        work_order = build_work_order(args, active)
        section = work_order.split("## Worker Return Packet Shape Contract", 1)[1]
        section = section.split("\n## ", 1)[0]
        for term in WORKER_RETURN_PACKET_SHAPE_REQUIRED_TERMS:
            self.assertIn(term, section, f"missing required term: {term}")

    def test_scoped_contract_contains_every_conditional_term(self) -> None:
        """Case 3: every current conditional term is present inside the
        Worker Return Packet Shape Contract section."""
        args = _base_args(commit_mode="WORKER_MUST_NOT_COMMIT")
        active = detect_triggers(args)
        work_order = build_work_order(args, active)
        section = work_order.split("## Worker Return Packet Shape Contract", 1)[1]
        section = section.split("\n## ", 1)[0]
        for term in WORKER_RETURN_PACKET_SHAPE_CONDITIONAL_TERMS:
            self.assertIn(term, section, f"missing conditional term: {term}")

    def test_scoped_contract_contains_na_with_reason_instruction(self) -> None:
        """Case 4: the N/A with reason instruction is present inside the
        contract section."""
        args = _base_args(commit_mode="WORKER_MUST_NOT_COMMIT")
        active = detect_triggers(args)
        work_order = build_work_order(args, active)
        section = work_order.split("## Worker Return Packet Shape Contract", 1)[1]
        section = section.split("\n## ", 1)[0]
        self.assertIn("N/A with reason", section)

    def test_generated_work_order_has_exactly_one_canonical_manifest_heading(self) -> None:
        """Case 5: exactly one canonical heading; old heading absent."""
        args = _base_args(commit_mode="WORKER_MUST_NOT_COMMIT")
        active = detect_triggers(args)
        work_order = build_work_order(args, active)
        self.assertEqual(work_order.count("## Required Artifact Manifest"), 1)
        self.assertEqual(work_order.count("## Work-Order Fulfillment Manifest"), 0)
        self.assertIn("| Artifact | Required worker action |", work_order)
        self.assertNotIn("| Path | Required at handoff | Purpose |", work_order)

    def test_automation_assist_diagnostic_reports_clean_contract(self) -> None:
        """Case 6: automation-assist reports has_contract=true, no missing
        required/conditional terms, no missing N/A instruction."""
        args = _base_args(commit_mode="WORKER_MUST_NOT_COMMIT")
        active = detect_triggers(args)
        work_order = build_work_order(args, active)
        diagnostic = diagnose_no_commit_work_order("generated-work-order.md", work_order)
        self.assertTrue(diagnostic.has_contract)
        self.assertEqual(diagnostic.missing_required, ())
        self.assertEqual(diagnostic.missing_conditional, ())
        self.assertFalse(diagnostic.missing_na_instruction)
        self.assertTrue(diagnostic.is_clean)

    def test_existing_packet_kind_and_commit_mode_variants_remain_passing(self) -> None:
        """Case 7: existing packet-kind/commit-mode variants still generate
        and the WORKER_MAY_COMMIT variant omits the no-commit-only contract
        while still using the canonical manifest heading."""
        for packet_kind in ("generic-worker-dispatch", "held-dependency", "protected-governance-path"):
            for commit_mode in ("WORKER_MUST_NOT_COMMIT", "WORKER_MAY_COMMIT"):
                args = _base_args(packet_kind=packet_kind, commit_mode=commit_mode)
                active = detect_triggers(args)
                work_order = build_work_order(args, active)
                self.assertEqual(work_order.count("## Required Artifact Manifest"), 1)
                self.assertEqual(work_order.count("## Work-Order Fulfillment Manifest"), 0)
                pre_impl_line = next(
                    line
                    for line in work_order.splitlines()
                    if "--phase pre-implementation" in line
                )
                self.assertIn("<executionBaseHead>", pre_impl_line)
                self.assertNotIn(args.base, pre_impl_line)

    def test_worker_may_commit_generated_command_also_uses_execution_base(self) -> None:
        """Boundary: commit-capable packet-kind generation still passes and
        uses the worker-captured execution-base placeholder, not the
        dispatch-base literal, in the pre-implementation command."""
        args = _base_args(commit_mode="WORKER_MAY_COMMIT", base="deadbeef")
        active = detect_triggers(args)
        work_order = build_work_order(args, active)
        pre_impl_line = next(
            line
            for line in work_order.splitlines()
            if "--phase pre-implementation" in line
        )
        self.assertIn("<executionBaseHead>", pre_impl_line)
        self.assertNotIn("deadbeef", pre_impl_line)


class TestScecBlockEmission(unittest.TestCase):
    """SCEC-T1: dispatch scaffold must support emitting a valid initial or
    successor SCEC block from explicit CLI arguments, and must never
    fabricate predecessor hashes, proof evidence, or readiness."""

    def test_default_work_order_emits_valid_initial_scec_block(self) -> None:
        import check_semantic_convergence_control as scec_checker

        args = _base_args()
        self.assertTrue(args.include_scec_block)
        work_order = build_work_order(args, detect_triggers(args))
        blocks = scec_checker.find_active_blocks(work_order)
        self.assertEqual(len(blocks), 1)
        result = scec_checker.validate_block(blocks[0])
        self.assertEqual(result.violations, ())
        self.assertEqual(blocks[0]["chainMode"], "INITIAL")
        self.assertIsNone(blocks[0]["predecessor"])

    def test_internal_legacy_golden_override_omits_the_section(self) -> None:
        args = _base_args(include_scec_block=False)
        work_order = build_work_order(args, detect_triggers(args))
        self.assertNotIn("## Semantic Convergence Outcome", work_order)

    def test_successor_without_explicit_hash_emits_unresolved_sentinel(self) -> None:
        """Missing successor facts must produce the explicit unresolved
        sentinel, which the checker rejects pre-dispatch -- not a fabricated
        hash."""
        import check_semantic_convergence_control as scec_checker

        args = _base_args(scec_chain_mode="SUCCESSOR", scec_chain_ordinal=1)
        work_order = build_work_order(args, detect_triggers(args))
        blocks = scec_checker.find_active_blocks(work_order)
        self.assertEqual(len(blocks), 1)
        predecessor = blocks[0]["predecessor"]
        self.assertEqual(predecessor["path"], "SCEC_PREDECESSOR_HASH_UNRESOLVED")
        self.assertEqual(predecessor["sha256"], "SCEC_PREDECESSOR_HASH_UNRESOLVED")
        result = scec_checker.validate_block(blocks[0])
        codes = {v.code for v in result.violations}
        self.assertIn("PREDECESSOR_UNRESOLVED_SENTINEL", codes)

    def test_successor_with_explicit_hash_and_real_predecessor_file_passes(self) -> None:
        import check_semantic_convergence_control as scec_checker

        predecessor_content = "example predecessor content"
        real_hash = scec_checker.sha256_of_text(predecessor_content)
        args = _base_args(
            scec_chain_mode="SUCCESSOR",
            scec_chain_ordinal=1,
            scec_predecessor_path="docs/reviews/example.md",
            scec_predecessor_sha256=real_hash,
        )
        work_order = build_work_order(args, detect_triggers(args))
        blocks = scec_checker.find_active_blocks(work_order)
        self.assertEqual(len(blocks), 1)
        result = scec_checker.validate_block(
            blocks[0], predecessor_hash_resolver=lambda path: real_hash
        )
        self.assertEqual(result.violations, ())

    def test_scec_disposition_and_scope_flow_through_from_cli_shaped_args(self) -> None:
        args = _base_args(
            scec_required_disposition="ROOT_CONTRACT_REQUIRED",
            scec_successor_scope="INTEGRATED_ROOT_CONTRACT",
        )
        work_order = build_work_order(args, detect_triggers(args))
        self.assertIn('"requiredDisposition": "ROOT_CONTRACT_REQUIRED"', work_order)
        self.assertIn('"successorScope": "INTEGRATED_ROOT_CONTRACT"', work_order)

if __name__ == "__main__":
    unittest.main()
