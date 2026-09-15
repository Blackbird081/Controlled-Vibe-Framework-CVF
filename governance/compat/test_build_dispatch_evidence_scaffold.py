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
    resolve_evidence_readiness_applicable,
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


class TestEvidenceReadinessScaffoldBlock(unittest.TestCase):
    """EVIDENCE-READINESS-T1 requirement 6: generated dispatch/return
    scaffold owners automatically carry the compact evidence-readiness
    acceptance/binding block for applicable tasks, so a future worker cannot
    omit it by forgetting -- and never carry it for ordinary tasks."""

    def test_work_order_omits_block_by_default(self) -> None:
        args = _base_args()
        work_order = build_work_order(args, detect_triggers(args))
        self.assertNotIn("## Evidence Readiness Acceptance Contract", work_order)
        self.assertNotIn("evidenceReadinessContract", work_order)

    def test_work_order_includes_block_when_applicable(self) -> None:
        args = _base_args(evidence_readiness_applicable=True)
        work_order = build_work_order(args, detect_triggers(args))
        self.assertIn("## Evidence Readiness Acceptance Contract", work_order)
        self.assertIn("evidenceReadinessContract: REQUIRED_V1", work_order)
        self.assertIn("## Evidence Readiness Binding", work_order)

    def test_worker_return_skeleton_omits_block_by_default(self) -> None:
        args = _base_args()
        skeleton = build_worker_return_skeleton(args)
        self.assertNotIn("## Evidence Readiness Binding", skeleton)

    def test_worker_return_skeleton_includes_block_when_applicable(self) -> None:
        args = _base_args(evidence_readiness_applicable=True)
        skeleton = build_worker_return_skeleton(args)
        self.assertIn("## Evidence Readiness Binding", skeleton)
        self.assertIn("evidenceBindingSchema: cvf.workerEvidenceReadiness.v1", skeleton)

    def test_applicable_skeleton_is_reached_by_checker_and_fails_unfilled(self) -> None:
        """Cross-module proof: the generated skeleton's evidence-readiness
        block is reached by the real validator (not just present as text),
        and an unfilled skeleton correctly fails rather than silently
        passing, matching the AUTO/no-fabrication pattern used by the P4
        observation and architecture-echo blocks elsewhere in this file."""
        sys.path.insert(0, str(Path(__file__).resolve().parent))
        import worker_evidence_readiness as wer  # noqa: PLC0415

        args = _base_args(evidence_readiness_applicable=True)
        work_order = build_work_order(args, detect_triggers(args))
        skeleton = build_worker_return_skeleton(args)
        result = wer.evaluate_worker_return(
            return_text=skeleton,
            work_order_text=work_order,
            repo_root=Path(__file__).resolve().parents[2],
        )
        self.assertTrue(result.applicable)
        self.assertFalse(result.is_clean)

    def test_cli_evidence_readiness_flag_is_recognized(self) -> None:
        error = main(
            [
                "--batch-id",
                "TEST-ER-CLI",
                "--title",
                "Test ER CLI",
                "--date",
                "2026-07-01",
                "--base",
                "abc1234",
                "--commit-mode",
                "WORKER_MUST_NOT_COMMIT",
                "--evidence-readiness-applicable",
                "--stdout",
            ]
        )
        self.assertEqual(error, 0)


class TestEvidenceReadinessApplicabilityDefault(unittest.TestCase):
    """F4 rework fix: the reviewer found `evidence_readiness_applicable`
    defaulted to `False`, so a worker had to remember to pass a flag by
    hand -- defeating requirement 6 ("derive applicability from trusted
    work-order scope/contract ... not a worker-selected opt-out"). These
    tests prove the *unset default* (no flag passed at all) now
    self-determines from the packet's own already-declared shape instead of
    silently staying off, and that an explicit override still wins in both
    directions."""

    def test_unset_default_is_none_not_false(self) -> None:
        """The dataclass default itself must be the tri-state sentinel
        (auto-derive), never a hard-coded `False` a worker must override."""
        args = _base_args()
        self.assertIsNone(args.evidence_readiness_applicable)

    def test_neutral_title_auto_derives_to_not_applicable(self) -> None:
        args = _base_args(title="A quiet neutral title with no evidence signal")
        self.assertFalse(resolve_evidence_readiness_applicable(args))
        work_order = build_work_order(args, detect_triggers(args))
        self.assertNotIn("## Evidence Readiness Acceptance Contract", work_order)

    def test_audit_indicator_in_title_auto_derives_to_applicable(self) -> None:
        """Requirement 6 proof: nobody passed any flag; the title alone
        (a trusted, already-declared field) is enough to self-determine
        applicability on."""
        args = _base_args(title="Runtime Value Audit For Domain Pilot")
        self.assertTrue(resolve_evidence_readiness_applicable(args))
        work_order = build_work_order(args, detect_triggers(args))
        self.assertIn("## Evidence Readiness Acceptance Contract", work_order)
        self.assertIn("evidenceReadinessContract: REQUIRED_V1", work_order)

    def test_corpus_scan_dependency_text_auto_derives_to_applicable(self) -> None:
        args = _base_args(dependencies=["corpus scan completeness evidence"])
        self.assertTrue(resolve_evidence_readiness_applicable(args))

    def test_evidence_binding_indicator_auto_derives_to_applicable(self) -> None:
        args = _base_args(title="Evidence binding hardening pass")
        self.assertTrue(resolve_evidence_readiness_applicable(args))

    def test_explicit_true_override_wins_over_neutral_title(self) -> None:
        args = _base_args(title="A quiet neutral title with no evidence signal", evidence_readiness_applicable=True)
        self.assertTrue(resolve_evidence_readiness_applicable(args))

    def test_explicit_false_override_wins_over_audit_indicator(self) -> None:
        """A deliberate, explicit opt-out for a genuine false positive must
        still be possible -- the fix removes the *silent* default-off, not
        the ability to override at all."""
        args = _base_args(title="Runtime Value Audit For Domain Pilot", evidence_readiness_applicable=False)
        self.assertFalse(resolve_evidence_readiness_applicable(args))
        work_order = build_work_order(args, detect_triggers(args))
        self.assertNotIn("## Evidence Readiness Acceptance Contract", work_order)

    def test_cli_omitting_both_flags_auto_derives_from_title(self) -> None:
        """End-to-end CLI proof: no `--evidence-readiness-applicable` and no
        `--no-evidence-readiness-applicable` passed at all; the generated
        work order still carries the contract because the title alone
        triggers auto-derivation."""
        buf_output = []
        import io
        from contextlib import redirect_stdout

        buf = io.StringIO()
        with redirect_stdout(buf):
            exit_code = main(
                [
                    "--batch-id",
                    "TEST-ER-AUTO",
                    "--title",
                    "Corpus Scan Audit Hardening",
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
        self.assertIn("evidenceReadinessContract: REQUIRED_V1", output)

    def test_cli_explicit_no_flag_suppresses_auto_derivation(self) -> None:
        import io
        from contextlib import redirect_stdout

        buf = io.StringIO()
        with redirect_stdout(buf):
            exit_code = main(
                [
                    "--batch-id",
                    "TEST-ER-NOAUTO",
                    "--title",
                    "Corpus Scan Audit Hardening",
                    "--date",
                    "2026-07-01",
                    "--base",
                    "abc1234",
                    "--commit-mode",
                    "WORKER_MUST_NOT_COMMIT",
                    "--no-evidence-readiness-applicable",
                    "--stdout",
                ]
            )
        self.assertEqual(exit_code, 0)
        output = buf.getvalue()
        self.assertNotIn("evidenceReadinessContract: REQUIRED_V1", output)


if __name__ == "__main__":
    unittest.main()
