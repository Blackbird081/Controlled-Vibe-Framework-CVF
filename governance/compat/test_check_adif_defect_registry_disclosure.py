"""Focused tests for check_adif_defect_registry_disclosure."""

from __future__ import annotations

import unittest

import check_adif_defect_registry_disclosure as checker


class CheckFileTests(unittest.TestCase):
    def test_missing_section_is_a_violation(self) -> None:
        violations = checker.check_file("docs/work_orders/x.md", "# Test\n\nNo section.\n")
        self.assertEqual(len(violations), 1)
        self.assertIn("missing required", violations[0])

    def test_missing_query_line_is_a_violation(self) -> None:
        text = "## ADIF Defect Registry Disclosure\n\nNo query line here.\n"
        violations = checker.check_file("docs/work_orders/x.md", text)
        self.assertEqual(len(violations), 1)
        self.assertIn("Resolver query", violations[0])

    def test_omitted_returned_defect_id_is_a_violation(self) -> None:
        text = (
            "## ADIF Defect Registry Disclosure\n\n"
            "Resolver query: taskClass=`Work-order authoring / dispatch`, "
            "role=`dispatcher`, lifecyclePhase=`pre-dispatch`\n\n"
            "Returned defects: ADIF-0001\n"
        )
        violations = checker.check_file("docs/work_orders/x.md", text)
        self.assertEqual(len(violations), 1)
        self.assertIn("omits defectId", violations[0])

    def test_full_disclosure_is_compliant(self) -> None:
        ids = sorted(
            checker._expected_defect_ids(
                "Work-order authoring / dispatch", "dispatcher", "pre-dispatch"
            )
        )
        self.assertTrue(ids)
        listed = "\n".join(f"- {defect_id}" for defect_id in ids)
        text = (
            "## ADIF Defect Registry Disclosure\n\n"
            "Resolver query: taskClass=`Work-order authoring / dispatch`, "
            "role=`dispatcher`, lifecyclePhase=`pre-dispatch`\n\n"
            f"{listed}\n\n"
            "## Next Section\n"
        )
        violations = checker.check_file("docs/work_orders/x.md", text)
        self.assertEqual(violations, [])

    def test_zero_candidates_requires_none_returned_marker(self) -> None:
        text = (
            "## ADIF Defect Registry Disclosure\n\n"
            "Resolver query: taskClass=`nonexistent-task-class`, "
            "role=`nonexistent-role`, lifecyclePhase=`nonexistent-phase`\n\n"
            "Returned defects: ADIF-0001\n"
        )
        violations = checker.check_file("docs/work_orders/x.md", text)
        self.assertEqual(violations, [])


class ApplicabilityTests(unittest.TestCase):
    def test_gc018_and_work_order_paths_are_applicable(self) -> None:
        self.assertTrue(
            checker._is_applicable(
                "docs/baselines/CVF_GC018_EXAMPLE_2026-06-23.md"
            )
        )
        self.assertTrue(
            checker._is_applicable(
                "docs/work_orders/CVF_AGENT_WORK_ORDER_EXAMPLE_2026-06-23.md"
            )
        )

    def test_unrelated_path_is_not_applicable(self) -> None:
        self.assertFalse(checker._is_applicable("docs/reference/CVF_SOME_DOC.md"))


if __name__ == "__main__":
    unittest.main()
