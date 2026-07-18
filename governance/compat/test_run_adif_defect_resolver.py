"""Focused tests for the ADIF-T2 read-only defect packet resolver."""

from __future__ import annotations

import importlib.util
import io
import sys
import unittest
from contextlib import redirect_stdout
from pathlib import Path

MODULE_PATH = Path(__file__).resolve().with_name("run_adif_defect_resolver.py")
SPEC = importlib.util.spec_from_file_location("run_adif_defect_resolver", MODULE_PATH)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


def _make_entry(
    defect_id: str,
    severity: str = "MEDIUM",
    lifecycle_state: str = "ACTIVE",
    task_classes: tuple = ("Closure",),
    roles: tuple = ("closer",),
    lifecycle_phases: tuple = ("pre-closure",),
    surface_selectors: str = "completion reviews",
    enforcement_level: str = "MACHINE_CHECKED",
):
    return MODULE.DefectEntry(
        defect_id=defect_id,
        title=f"title for {defect_id}",
        defect_category="CLOSURE_EVIDENCE",
        defect_class="MACHINE_GATE_GAP",
        defect_role="NOT_APPLICABLE_WITH_REASON: test fixture",
        severity=severity,
        lifecycle_state=lifecycle_state,
        task_classes=task_classes,
        roles=roles,
        lifecycle_phases=lifecycle_phases,
        surface_selectors=surface_selectors,
        detection_signals="test fixture signal",
        enforcement_level=enforcement_level,
        checker_bindings="governance/compat/check_machine_closure_package.py",
        promotion_state="MACHINE_CHECK_ADDED",
        supersedes="NONE",
        last_verified_commit="0000000",
        roadmap_seed_id="NONE",
        source_path=f"/fake/{defect_id}.md",
    )


class RealEntriesTests(unittest.TestCase):
    def test_real_entries_load_and_resolve_without_filesystem_mutation(self) -> None:
        entries_dir = MODULE.ENTRIES_DIR
        before_listing = sorted(p.name for p in entries_dir.glob("CVF_ADIF-*.md"))
        entries = MODULE.load_entries()
        self.assertEqual(len(entries), len(before_listing))
        self.assertGreaterEqual(len(entries), 9)
        after_listing = sorted(p.name for p in entries_dir.glob("CVF_ADIF-*.md"))
        self.assertEqual(before_listing, after_listing)

        packet = MODULE.resolve_defect_packet(entries=entries)
        self.assertGreaterEqual(packet.total_candidates, 9)
        self.assertLessEqual(len(packet.items), 10)
        self.assertTrue(packet.to_dict()["claimBoundary"])

    def test_task_class_role_phase_filtering_matches_expected_entry(self) -> None:
        entries = MODULE.load_entries()
        packet = MODULE.resolve_defect_packet(
            task_class="Closure",
            role="closer",
            lifecycle_phase="pre-closure",
            entries=entries,
        )
        defect_ids = {item.defect_id for item in packet.items}
        self.assertIn("ADIF-0003", defect_ids)
        self.assertIn("ADIF-0005", defect_ids)
        self.assertNotIn("ADIF-0001", defect_ids)

    def test_no_match_returns_empty_packet(self) -> None:
        entries = MODULE.load_entries()
        packet = MODULE.resolve_defect_packet(task_class="Nonexistent Task Class", entries=entries)
        self.assertEqual(packet.items, ())
        self.assertEqual(packet.total_candidates, 0)
        self.assertFalse(packet.truncated)

    def test_load_entries_returns_empty_tuple_for_missing_directory(self) -> None:
        missing = MODULE.ENTRIES_DIR.parent / "does-not-exist-entries-dir"
        self.assertFalse(missing.exists())
        self.assertEqual(MODULE.load_entries(entries_dir=missing), ())

    def test_to_dict_does_not_claim_comprehension(self) -> None:
        entries = MODULE.load_entries()
        packet = MODULE.resolve_defect_packet(entries=entries, max_results=1)
        payload = packet.to_dict()
        self.assertIn("not evidence", payload["claimBoundary"])

    def test_real_entry_source_citations_are_repo_relative(self) -> None:
        packet = MODULE.resolve_defect_packet(entries=MODULE.load_entries())
        self.assertTrue(packet.items)
        for item in packet.items:
            self.assertTrue(item.source_path.startswith("docs/reference/"))
            self.assertNotIn("\\", item.source_path)


class FixtureEntryTests(unittest.TestCase):
    def test_deterministic_ordering_is_severity_descending_then_defect_id(self) -> None:
        fixtures = (
            _make_entry("ADIF-9003", severity="LOW"),
            _make_entry("ADIF-9001", severity="HIGH"),
            _make_entry("ADIF-9002", severity="HIGH"),
            _make_entry("ADIF-9004", severity="MEDIUM"),
        )
        packet = MODULE.resolve_defect_packet(entries=fixtures, max_results=10)
        ordered_ids = [item.defect_id for item in packet.items]
        self.assertEqual(ordered_ids, ["ADIF-9001", "ADIF-9002", "ADIF-9004", "ADIF-9003"])

    def test_max_results_bounds_and_flags_truncation(self) -> None:
        fixtures = tuple(_make_entry(f"ADIF-900{i}") for i in range(5))
        packet = MODULE.resolve_defect_packet(entries=fixtures, max_results=2)
        self.assertEqual(len(packet.items), 2)
        self.assertTrue(packet.truncated)
        self.assertEqual(packet.total_candidates, 5)

    def test_only_active_entries_are_eligible_by_default(self) -> None:
        fixtures = (
            _make_entry("ADIF-9101", lifecycle_state="RETIRED"),
            _make_entry("ADIF-9102", lifecycle_state="SUPERSEDED"),
            _make_entry("ADIF-9103", lifecycle_state="ACTIVE"),
            _make_entry("ADIF-9104", lifecycle_state="PROPOSED"),
            _make_entry("ADIF-9105", lifecycle_state="REJECTED"),
        )
        packet = MODULE.resolve_defect_packet(entries=fixtures)
        defect_ids = {item.defect_id for item in packet.items}
        self.assertEqual(defect_ids, {"ADIF-9103"})

    def test_risk_ceiling_excludes_entries_above_ceiling(self) -> None:
        fixtures = (
            _make_entry("ADIF-9201", severity="LOW"),
            _make_entry("ADIF-9202", severity="MEDIUM"),
            _make_entry("ADIF-9203", severity="HIGH"),
        )
        packet = MODULE.resolve_defect_packet(entries=fixtures, risk_ceiling="MEDIUM")
        defect_ids = {item.defect_id for item in packet.items}
        self.assertEqual(defect_ids, {"ADIF-9201", "ADIF-9202"})

    def test_surface_selector_filtering_is_case_insensitive_substring_match(self) -> None:
        fixtures = (
            _make_entry("ADIF-9301", surface_selectors="Completion Reviews And Audits"),
            _make_entry("ADIF-9302", surface_selectors="dispatch packets only"),
        )
        packet = MODULE.resolve_defect_packet(entries=fixtures, surface_selector="completion reviews")
        defect_ids = {item.defect_id for item in packet.items}
        self.assertEqual(defect_ids, {"ADIF-9301"})

    def test_max_results_must_be_positive(self) -> None:
        with self.assertRaises(ValueError):
            MODULE.resolve_defect_packet(max_results=0)

    def test_risk_ceiling_rejects_unknown_value(self) -> None:
        with self.assertRaises(ValueError):
            MODULE.resolve_defect_packet(risk_ceiling="CRITICAL")

    def test_cli_json_output_uses_existing_resolver_shape(self) -> None:
        buffer = io.StringIO()
        with redirect_stdout(buffer):
            exit_code = MODULE.main(["--task-class", "Nonexistent Task Class", "--json"])
        self.assertEqual(exit_code, 0)
        self.assertIn('"items": []', buffer.getvalue())

    def test_cli_human_output_names_empty_return(self) -> None:
        buffer = io.StringIO()
        with redirect_stdout(buffer):
            exit_code = MODULE.main(["--task-class", "Nonexistent Task Class"])
        self.assertEqual(exit_code, 0)
        self.assertIn("Returned defects: NONE_RETURNED", buffer.getvalue())


if __name__ == "__main__":
    unittest.main()
