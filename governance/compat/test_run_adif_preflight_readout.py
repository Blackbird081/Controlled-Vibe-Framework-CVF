"""Focused tests for the ADIF-T3 read-only preflight defect-packet readout."""

from __future__ import annotations

import importlib.util
import io
import sys
import unittest
from contextlib import redirect_stdout
from pathlib import Path

MODULE_PATH = Path(__file__).resolve().with_name("run_adif_preflight_readout.py")
SPEC = importlib.util.spec_from_file_location("run_adif_preflight_readout", MODULE_PATH)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class PreflightReadoutTests(unittest.TestCase):
    def test_readout_matches_resolver_for_known_task_class(self) -> None:
        readout = MODULE.build_preflight_readout(
            task_class="Closure",
            role="closer",
            lifecycle_phase="pre-closure",
            max_results=10,
        )
        defect_ids = {line.defect_id for line in readout.lines}
        self.assertIn("ADIF-0003", defect_ids)
        self.assertIn("ADIF-0005", defect_ids)

    def test_readout_is_bounded_by_max_results(self) -> None:
        readout = MODULE.build_preflight_readout(max_results=2)
        self.assertLessEqual(len(readout.lines), 2)

    def test_no_match_produces_empty_readout_with_human_text(self) -> None:
        readout = MODULE.build_preflight_readout(task_class="Nonexistent Task Class")
        self.assertEqual(readout.lines, ())
        self.assertEqual(readout.total_candidates, 0)
        self.assertIn("no matching defect entries", readout.to_human_text())

    def test_human_text_includes_claim_boundary_and_does_not_mutate_filesystem(self) -> None:
        entries_dir = MODULE.resolver.ENTRIES_DIR
        before_listing = sorted(p.name for p in entries_dir.glob("*"))
        readout = MODULE.build_preflight_readout(max_results=3)
        after_listing = sorted(p.name for p in entries_dir.glob("*"))
        self.assertEqual(before_listing, after_listing)
        text = readout.to_human_text()
        self.assertIn("not evidence", text)
        self.assertIn("source: docs/reference/", text)

    def test_to_dict_round_trips_line_fields(self) -> None:
        readout = MODULE.build_preflight_readout(max_results=1)
        if not readout.lines:
            self.skipTest("no candidates available to round-trip")
        payload = readout.to_dict()
        self.assertEqual(len(payload["lines"]), len(readout.lines))
        first = payload["lines"][0]
        self.assertEqual(first["defectId"], readout.lines[0].defect_id)
        self.assertTrue(first["sourcePath"].startswith("docs/reference/"))
        self.assertEqual(first["sourcePath"], readout.lines[0].source_path)

    def test_truncated_flag_propagates_from_resolver(self) -> None:
        readout = MODULE.build_preflight_readout(max_results=1)
        if readout.total_candidates <= 1:
            self.skipTest("not enough real entries to exercise truncation")
        self.assertTrue(readout.truncated)
        self.assertIn("truncated", readout.to_human_text().lower())

    def test_does_not_duplicate_resolver_matching_logic(self) -> None:
        direct_packet = MODULE.resolver.resolve_defect_packet(
            task_class="Closure",
            role="closer",
            max_results=5,
        )
        readout = MODULE.build_preflight_readout(task_class="Closure", role="closer", max_results=5)
        direct_ids = [item.defect_id for item in direct_packet.items]
        readout_ids = [line.defect_id for line in readout.lines]
        self.assertEqual(direct_ids, readout_ids)

    def test_cli_human_output_uses_readout_text(self) -> None:
        buffer = io.StringIO()
        with redirect_stdout(buffer):
            exit_code = MODULE.main(["--task-class", "Nonexistent Task Class"])
        self.assertEqual(exit_code, 0)
        self.assertIn("no matching defect entries", buffer.getvalue())

    def test_cli_json_output_uses_readout_shape(self) -> None:
        buffer = io.StringIO()
        with redirect_stdout(buffer):
            exit_code = MODULE.main(["--task-class", "Nonexistent Task Class", "--json"])
        self.assertEqual(exit_code, 0)
        self.assertIn('"lines": []', buffer.getvalue())


if __name__ == "__main__":
    unittest.main()
