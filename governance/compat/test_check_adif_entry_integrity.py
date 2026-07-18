"""Focused tests for the ADIF-T5 standalone entry-integrity machine guard."""

from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).resolve().with_name("check_adif_entry_integrity.py")
SPEC = importlib.util.spec_from_file_location("check_adif_entry_integrity", MODULE_PATH)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


def _entry(
    defect_id: str,
    *,
    severity: str = "MEDIUM",
    lifecycle_state: str = "ACTIVE",
    enforcement_level: str = "GUIDANCE_ONLY",
    checker_bindings: str = "NOT_APPLICABLE_WITH_REASON: guidance only",
    supersedes: str = "NONE",
    source_path: str | None = None,
):
    return MODULE.resolver.DefectEntry(
        defect_id=defect_id,
        title=f"title for {defect_id}",
        defect_category="TEST_FIXTURE",
        defect_class="WORKER_EXECUTION_ERROR",
        defect_role="NOT_APPLICABLE_WITH_REASON: fixture",
        severity=severity,
        lifecycle_state=lifecycle_state,
        task_classes=("Closure",),
        roles=("closer",),
        lifecycle_phases=("pre-closure",),
        surface_selectors="test fixture",
        detection_signals="test fixture",
        enforcement_level=enforcement_level,
        checker_bindings=checker_bindings,
        promotion_state="RULE_EXISTS",
        supersedes=supersedes,
        last_verified_commit="0000000",
        roadmap_seed_id="NONE",
        source_path=source_path or f"/fake/{defect_id}.md",
    )


def _trace_block(*, omit: str | None = None) -> str:
    rows = [
        ("Actor", "test"),
        ("Provider or surface", "local workspace"),
        ("Session or invocation", "test invocation"),
        ("Working directory", "repository root"),
        ("Command or tool surface", "unit test"),
        ("Target paths", "test entry"),
        ("Allowed scope source", "unit test"),
        ("Before status evidence", "before"),
        ("After status evidence", "after"),
        ("Diff evidence", "git diff"),
        ("Approval boundary", "test only"),
        ("Claim boundary", "test only"),
        ("Agent type", "test"),
        ("Invocation ID", "test-adif-entry"),
        ("Expected manifest", "test entry"),
        ("Actual changed set", "test entry"),
        ("Manifest delta", "MATCH"),
    ]
    lines = ["## Agent Operation Trace Block", "", "| Field | Evidence |", "|---|---|"]
    for label, value in rows:
        if label == omit:
            continue
        lines.append(f"| {label} | {value} |")
    return "\n".join(lines)


class EntryIntegrityGuardTests(unittest.TestCase):
    def test_real_committed_entries_pass_with_zero_violations(self) -> None:
        violations = MODULE.check_entry_integrity()
        self.assertEqual(violations, ())

    def test_clean_fixture_set_passes(self) -> None:
        entries = (_entry("ADIF-9001"), _entry("ADIF-9002"))
        violations = MODULE.check_entry_integrity(entries=entries)
        self.assertEqual(violations, ())

    def test_detects_duplicate_defect_ids(self) -> None:
        entries = (_entry("ADIF-9001"), _entry("ADIF-9001"))
        violations = MODULE.check_entry_integrity(entries=entries)
        classes = {v.violation_class for v in violations}
        self.assertIn("DUPLICATE_DEFECT_ID", classes)

    def test_detects_dangling_supersedes_reference(self) -> None:
        entries = (_entry("ADIF-9001", supersedes="ADIF-0000"),)
        violations = MODULE.check_entry_integrity(entries=entries)
        classes = {v.violation_class for v in violations}
        self.assertIn("DANGLING_SUPERSESSION", classes)

    def test_detects_stale_supersession_when_both_active(self) -> None:
        entries = (
            _entry("ADIF-9001", lifecycle_state="ACTIVE", supersedes="ADIF-9002"),
            _entry("ADIF-9002", lifecycle_state="ACTIVE"),
        )
        violations = MODULE.check_entry_integrity(entries=entries)
        classes = {v.violation_class for v in violations}
        self.assertIn("STALE_SUPERSESSION", classes)

    def test_supersession_to_superseded_entry_is_not_stale(self) -> None:
        entries = (
            _entry("ADIF-9001", lifecycle_state="ACTIVE", supersedes="ADIF-9002"),
            _entry("ADIF-9002", lifecycle_state="SUPERSEDED"),
        )
        violations = MODULE.check_entry_integrity(entries=entries)
        self.assertEqual(violations, ())

    def test_detects_supersession_cycle(self) -> None:
        entries = (
            _entry("ADIF-9001", supersedes="ADIF-9002"),
            _entry("ADIF-9002", supersedes="ADIF-9001"),
        )
        violations = MODULE.check_entry_integrity(entries=entries)
        classes = {v.violation_class for v in violations}
        self.assertIn("STALE_SUPERSESSION", classes)

    def test_detects_three_entry_supersession_cycle(self) -> None:
        entries = (
            _entry("ADIF-9001", supersedes="ADIF-9002"),
            _entry("ADIF-9002", supersedes="ADIF-9003"),
            _entry("ADIF-9003", supersedes="ADIF-9001"),
        )
        violations = MODULE.check_entry_integrity(entries=entries)
        self.assertTrue(
            any(v.violation_class == "STALE_SUPERSESSION" and "ADIF-9003" in v.detail for v in violations)
        )

    def test_detects_dangling_canonical_source_path(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            entry_file = Path(temp_dir) / "entry.md"
            entry_file.write_text(
                "# Entry\n\n## Canonical Sources\n\n- `docs/reference/DOES_NOT_EXIST_ADIF.md`\n\n## Remediation\n\nNone.\n",
                encoding="utf-8",
            )
            violations = MODULE.check_entry_integrity(
                entries=(_entry("ADIF-9001", source_path=str(entry_file)),)
            )
        self.assertTrue(any(v.violation_class == "DANGLING_CANONICAL_SOURCE" for v in violations))

    def test_existing_canonical_source_path_passes_source_check(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            entry_file = Path(temp_dir) / "entry.md"
            entry_file.write_text(
                "# Entry\n\n## Canonical Sources\n\n- `AGENTS.md`\n\n## Remediation\n\nNone.\n",
                encoding="utf-8",
            )
            violations = MODULE.check_entry_integrity(
                entries=(_entry("ADIF-9001", source_path=str(entry_file)),)
            )
        self.assertFalse(
            any(v.violation_class in {"DANGLING_CANONICAL_SOURCE", "MISSING_CANONICAL_SOURCES"} for v in violations)
        )

    def test_detects_missing_agent_operation_trace_block(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            entry_file = Path(temp_dir) / "entry.md"
            entry_file.write_text(
                "# Entry\n\n## Canonical Sources\n\n- `AGENTS.md`\n\n## Remediation\n\nNone.\n",
                encoding="utf-8",
            )
            violations = MODULE.check_entry_integrity(
                entries=(_entry("ADIF-9001", source_path=str(entry_file)),)
            )
        self.assertTrue(any(v.violation_class == "MISSING_AGENT_OPERATION_TRACE" for v in violations))

    def test_detects_incomplete_agent_operation_trace_block(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            entry_file = Path(temp_dir) / "entry.md"
            entry_file.write_text(
                "# Entry\n\n## Canonical Sources\n\n- `AGENTS.md`\n\n## Remediation\n\nNone.\n\n"
                + _trace_block(omit="Diff evidence")
                + "\n",
                encoding="utf-8",
            )
            violations = MODULE.check_entry_integrity(
                entries=(_entry("ADIF-9001", source_path=str(entry_file)),)
            )
        self.assertTrue(
            any(
                v.violation_class == "INCOMPLETE_AGENT_OPERATION_TRACE"
                and "Diff evidence" in v.detail
                for v in violations
            )
        )

    def test_complete_agent_operation_trace_block_passes(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            entry_file = Path(temp_dir) / "entry.md"
            entry_file.write_text(
                "# Entry\n\n## Canonical Sources\n\n- `AGENTS.md`\n\n## Remediation\n\nNone.\n\n"
                + _trace_block()
                + "\n",
                encoding="utf-8",
            )
            violations = MODULE.check_entry_integrity(
                entries=(_entry("ADIF-9001", source_path=str(entry_file)),)
            )
        self.assertEqual(violations, ())

    def test_detects_invalid_severity_enum(self) -> None:
        entries = (_entry("ADIF-9001", severity="CRITICAL"),)
        violations = MODULE.check_entry_integrity(entries=entries)
        self.assertTrue(any(v.violation_class == "INVALID_ENUM_VALUE" and "severity" in v.detail for v in violations))

    def test_detects_invalid_lifecycle_state_enum(self) -> None:
        entries = (_entry("ADIF-9001", lifecycle_state="DELETED"),)
        violations = MODULE.check_entry_integrity(entries=entries)
        self.assertTrue(
            any(v.violation_class == "INVALID_ENUM_VALUE" and "lifecycleState" in v.detail for v in violations)
        )

    def test_detects_invalid_enforcement_level_enum(self) -> None:
        entries = (_entry("ADIF-9001", enforcement_level="ALWAYS_ON"),)
        violations = MODULE.check_entry_integrity(entries=entries)
        self.assertTrue(
            any(v.violation_class == "INVALID_ENUM_VALUE" and "enforcementLevel" in v.detail for v in violations)
        )

    def test_detects_dangling_checker_binding(self) -> None:
        entries = (
            _entry(
                "ADIF-9001",
                enforcement_level="MACHINE_CHECKED",
                checker_bindings="governance/compat/check_does_not_exist_at_all.py",
            ),
        )
        violations = MODULE.check_entry_integrity(entries=entries)
        classes = {v.violation_class for v in violations}
        self.assertIn("DANGLING_CHECKER_BINDING", classes)
        self.assertIn("DISHONEST_ENFORCEMENT_CLAIM", classes)

    def test_machine_checked_with_real_checker_path_passes(self) -> None:
        entries = (
            _entry(
                "ADIF-9001",
                enforcement_level="MACHINE_CHECKED",
                checker_bindings="governance/compat/check_machine_closure_package.py",
            ),
        )
        violations = MODULE.check_entry_integrity(entries=entries)
        self.assertEqual(violations, ())

    def test_machine_checked_with_no_checker_path_is_dishonest_claim(self) -> None:
        entries = (
            _entry(
                "ADIF-9001",
                enforcement_level="MACHINE_CHECKED",
                checker_bindings="NOT_APPLICABLE_WITH_REASON: fabricated",
            ),
        )
        violations = MODULE.check_entry_integrity(entries=entries)
        classes = {v.violation_class for v in violations}
        self.assertIn("DISHONEST_ENFORCEMENT_CLAIM", classes)

    def test_guard_never_mutates_entries_directory(self) -> None:
        entries_dir = MODULE.resolver.ENTRIES_DIR
        before_listing = sorted(p.name for p in entries_dir.glob("*"))
        MODULE.check_entry_integrity()
        after_listing = sorted(p.name for p in entries_dir.glob("*"))
        self.assertEqual(before_listing, after_listing)

    def test_main_returns_zero_without_enforce_even_with_violations(self) -> None:
        exit_code = MODULE.main([])
        self.assertEqual(exit_code, 0)

    def test_main_returns_zero_with_enforce_when_clean(self) -> None:
        exit_code = MODULE.main(["--enforce"])
        self.assertEqual(exit_code, 0)


if __name__ == "__main__":
    unittest.main()
