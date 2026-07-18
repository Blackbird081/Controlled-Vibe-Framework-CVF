from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().with_name("check_agent_operation_trace.py")
SPEC = importlib.util.spec_from_file_location("check_agent_operation_trace", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


VALID_TRACE = """
## Agent Operation Trace Block

| Field | Evidence |
| --- | --- |
| Actor | Codex |
| Provider or surface | Codex CLI |
| Session or invocation | current session |
| Working directory | repo root |
| Command or tool surface | apply_patch |
| Target paths | docs/work_orders/example.md |
| Allowed scope source | operator instruction |
| Before status evidence | git status --short |
| After status evidence | git status --short |
| Diff evidence | git diff --name-status |
| Approval boundary | operator approved |
| Claim boundary | repo-local evidence only |
| Agent type | Codex |
| Invocation ID | N/A with reason: test fixture |
| Expected manifest | N/A with reason: unit test fixture not a worker return |
| Actual changed set | N/A with reason: unit test fixture not a worker return |
| Manifest delta | N/A with reason: unit test fixture not a worker return |
"""


class AgentOperationTraceTests(unittest.TestCase):
    def test_changed_work_order_without_trace_is_violation(self) -> None:
        changed = {"docs/work_orders/CVF_AGENT_WORK_ORDER_EXAMPLE.md": {"A"}}
        texts = {"docs/work_orders/CVF_AGENT_WORK_ORDER_EXAMPLE.md": "Status: DISPATCHED\n"}

        violations = MODULE.find_trace_violations(changed, texts)

        self.assertEqual(len(violations), 1)
        self.assertIn("missing or incomplete", violations[0])

    def test_changed_work_order_with_complete_trace_passes(self) -> None:
        changed = {"docs/work_orders/CVF_AGENT_WORK_ORDER_EXAMPLE.md": {"M"}}
        texts = {"docs/work_orders/CVF_AGENT_WORK_ORDER_EXAMPLE.md": VALID_TRACE}

        self.assertEqual(MODULE.find_trace_violations(changed, texts), [])

    def test_completion_review_with_worker_trigger_requires_trace(self) -> None:
        changed = {"docs/reviews/CVF_EXAMPLE_COMPLETION_2026-06-13.md": {"A"}}
        texts = {
            "docs/reviews/CVF_EXAMPLE_COMPLETION_2026-06-13.md": (
                "docType: completion_review\nWorker: Claude\n"
            )
        }

        violations = MODULE.find_trace_violations(changed, texts)

        self.assertEqual(len(violations), 1)

    def test_non_execution_review_is_ignored(self) -> None:
        changed = {"docs/reviews/CVF_NOTE_2026-06-13.md": {"A"}}
        texts = {"docs/reviews/CVF_NOTE_2026-06-13.md": "Status: NOTE\n"}

        self.assertEqual(MODULE.find_trace_violations(changed, texts), [])

    def test_protected_delete_requires_delete_or_rename_disposition(self) -> None:
        changed = {
            "docs/roadmaps/CVF_OLD.md": {"D"},
            "docs/reviews/CVF_EXAMPLE_COMPLETION_2026-06-13.md": {"A"},
        }
        texts = {"docs/reviews/CVF_EXAMPLE_COMPLETION_2026-06-13.md": VALID_TRACE}

        violations = MODULE.find_trace_violations(changed, texts)

        self.assertEqual(len(violations), 1)
        self.assertIn("protected delete/rename", violations[0])

    def test_protected_delete_with_disposition_passes(self) -> None:
        changed = {
            "docs/roadmaps/CVF_OLD.md": {"D"},
            "docs/reviews/CVF_EXAMPLE_COMPLETION_2026-06-13.md": {"A"},
        }
        texts = {
            "docs/reviews/CVF_EXAMPLE_COMPLETION_2026-06-13.md": (
                VALID_TRACE
                + "| Deletion or rename disposition | authorized archive rotation |\n"
            )
        }

        self.assertEqual(MODULE.find_trace_violations(changed, texts), [])

    # --- AOT-T2-C02: Agent type and Invocation ID must appear in trace ---

    def test_trace_missing_agent_type_is_violation(self) -> None:
        trace_without_agent_type = VALID_TRACE.replace("| Agent type | Codex |\n", "")
        changed = {"docs/work_orders/CVF_AGENT_WORK_ORDER_EXAMPLE.md": {"M"}}
        texts = {"docs/work_orders/CVF_AGENT_WORK_ORDER_EXAMPLE.md": trace_without_agent_type}

        violations = MODULE.find_trace_violations(changed, texts)

        self.assertEqual(len(violations), 1)
        self.assertIn("Agent type", violations[0])

    def test_trace_missing_invocation_id_is_violation(self) -> None:
        trace_without_invocation_id = VALID_TRACE.replace(
            "| Invocation ID | N/A with reason: test fixture |\n", ""
        )
        changed = {"docs/work_orders/CVF_AGENT_WORK_ORDER_EXAMPLE.md": {"M"}}
        texts = {"docs/work_orders/CVF_AGENT_WORK_ORDER_EXAMPLE.md": trace_without_invocation_id}

        violations = MODULE.find_trace_violations(changed, texts)

        self.assertEqual(len(violations), 1)
        self.assertIn("Invocation ID", violations[0])

    # --- AOT-T2-C01: Reference deliverable trace eligibility ---

    def test_worker_authored_reference_deliverable_without_trace_is_violation(self) -> None:
        """A docs/reference/ file with WORKER_RETURN trigger but no trace block must fail."""
        changed = {"docs/reference/CVF_AOT_T2_COVERAGE_PLAN_2026-06-13.md": {"A"}}
        texts = {
            "docs/reference/CVF_AOT_T2_COVERAGE_PLAN_2026-06-13.md": (
                "Status: COMPLETE_PENDING_REVIEW\n"
                "Worker: Claude\n"
                "Some planning content here.\n"
            )
        }

        violations = MODULE.find_trace_violations(changed, texts)

        self.assertEqual(len(violations), 1)
        self.assertIn("missing or incomplete", violations[0])

    def test_normal_reference_standard_without_worker_trigger_is_ignored(self) -> None:
        """A docs/reference/ standard file without worker triggers must NOT require trace."""
        changed = {"docs/reference/CVF_SOME_STANDARD_2026-06-13.md": {"M"}}
        texts = {
            "docs/reference/CVF_SOME_STANDARD_2026-06-13.md": (
                "docType: reference_standard\n"
                "Status: ACTIVE_STANDARD\n"
                "This is a standard document with no worker triggers.\n"
            )
        }

        self.assertEqual(MODULE.find_trace_violations(changed, texts), [])

    def test_worker_authored_reference_deliverable_with_complete_trace_passes(self) -> None:
        """A docs/reference/ file with WORKER_RETURN trigger and complete trace must pass."""
        content = "Status: COMPLETE_PENDING_REVIEW\nWorker: Claude\n" + VALID_TRACE
        changed = {"docs/reference/CVF_AOT_T2_COVERAGE_PLAN_2026-06-13.md": {"A"}}
        texts = {"docs/reference/CVF_AOT_T2_COVERAGE_PLAN_2026-06-13.md": content}

        self.assertEqual(MODULE.find_trace_violations(changed, texts), [])

    # --- AOT-T2-C01: Manifest delta enforcement ---

    def test_manifest_match_passes(self) -> None:
        path = "docs/work_orders/CVF_AGENT_WORK_ORDER_EXAMPLE.md"
        trace = VALID_TRACE.replace(
            "| Expected manifest | N/A with reason: unit test fixture not a worker return |",
            "| Expected manifest | docs/reference/plan.md |",
        ).replace(
            "| Actual changed set | N/A with reason: unit test fixture not a worker return |",
            "| Actual changed set | docs/reference/plan.md |",
        ).replace(
            "| Manifest delta | N/A with reason: unit test fixture not a worker return |",
            "| Manifest delta | MATCH |",
        )
        changed = {
            path: {"M"},
            "docs/reference/plan.md": {"A"},
        }
        texts = {path: trace, "docs/reference/plan.md": "content"}

        self.assertEqual(MODULE.find_trace_violations(changed, texts), [])

    def test_root_level_handoff_path_in_manifest_passes(self) -> None:
        path = "docs/work_orders/CVF_AGENT_WORK_ORDER_EXAMPLE.md"
        handoff_path = "AGENT_HANDOFF_V18_2026-06-12.md"
        trace = VALID_TRACE.replace(
            "| Expected manifest | N/A with reason: unit test fixture not a worker return |",
            f"| Expected manifest | docs/reference/plan.md; {handoff_path} |",
        ).replace(
            "| Actual changed set | N/A with reason: unit test fixture not a worker return |",
            f"| Actual changed set | docs/reference/plan.md; {handoff_path} |",
        ).replace(
            "| Manifest delta | N/A with reason: unit test fixture not a worker return |",
            "| Manifest delta | MATCH |",
        )
        changed = {
            path: {"M"},
            "docs/reference/plan.md": {"A"},
            handoff_path: {"M"},
        }
        texts = {path: trace, "docs/reference/plan.md": "content", handoff_path: "content"}

        self.assertEqual(MODULE.find_trace_violations(changed, texts), [])

    def test_trace_field_extraction_ignores_preceding_manifest_tables(self) -> None:
        path = "docs/reviews/CVF_WORKER_RETURN.md"
        content = (
            "| Criterion | Required evidence |\n"
            "| --- | --- |\n"
            "| Manifest delta | MISSING_DELIVERABLE: docs/reviews/misleading.md |\n"
            + VALID_TRACE.replace(
                "| Target paths | docs/work_orders/example.md |",
                "| Target paths | docs/reference/plan.md; docs/reviews/CVF_WORKER_RETURN.md |",
            ).replace(
                "| Expected manifest | N/A with reason: unit test fixture not a worker return |",
                "| Expected manifest | docs/reference/plan.md; docs/reviews/CVF_WORKER_RETURN.md |",
            ).replace(
                "| Actual changed set | N/A with reason: unit test fixture not a worker return |",
                "| Actual changed set | docs/reference/plan.md; docs/reviews/CVF_WORKER_RETURN.md |",
            ).replace(
                "| Manifest delta | N/A with reason: unit test fixture not a worker return |",
                "| Manifest delta | MATCH |",
            )
        )
        changed = {
            path: {"A"},
            "docs/reference/plan.md": {"M"},
        }
        texts = {path: content, "docs/reference/plan.md": "content"}

        self.assertEqual(MODULE.find_trace_violations(changed, texts), [])

    def test_actual_changed_set_must_match_observed_paths(self) -> None:
        path = "docs/reviews/CVF_WORKER_RETURN.md"
        trace = VALID_TRACE.replace(
            "| Expected manifest | N/A with reason: unit test fixture not a worker return |",
            "| Expected manifest | docs/reference/plan.md; docs/reviews/CVF_WORKER_RETURN.md |",
        ).replace(
            "| Actual changed set | N/A with reason: unit test fixture not a worker return |",
            "| Actual changed set | docs/reference/plan.md |",
        ).replace(
            "| Manifest delta | N/A with reason: unit test fixture not a worker return |",
            "| Manifest delta | MATCH |",
        )
        changed = {
            path: {"A"},
            "docs/reference/plan.md": {"M"},
        }
        texts = {path: trace, "docs/reference/plan.md": "content"}

        violations = MODULE.find_trace_violations(changed, texts)

        self.assertTrue(any("Actual changed set omits observed" in v for v in violations))

    def test_missing_expected_deliverable_is_violation(self) -> None:
        path = "docs/work_orders/CVF_AGENT_WORK_ORDER_EXAMPLE.md"
        trace = VALID_TRACE.replace(
            "| Expected manifest | N/A with reason: unit test fixture not a worker return |",
            "| Expected manifest | docs/reference/plan.md; docs/reviews/worker_return.md |",
        ).replace(
            "| Actual changed set | N/A with reason: unit test fixture not a worker return |",
            "| Actual changed set | docs/reference/plan.md |",
        ).replace(
            "| Manifest delta | N/A with reason: unit test fixture not a worker return |",
            "| Manifest delta | MISSING_DELIVERABLE: docs/reviews/worker_return.md |",
        )
        changed = {
            path: {"M"},
            "docs/reference/plan.md": {"A"},
        }
        texts = {path: trace, "docs/reference/plan.md": "content"}

        violations = MODULE.find_trace_violations(changed, texts)

        self.assertTrue(any("MISSING_DELIVERABLE" in v for v in violations))

    def test_unauthorized_addition_is_violation(self) -> None:
        path = "docs/work_orders/CVF_AGENT_WORK_ORDER_EXAMPLE.md"
        trace = VALID_TRACE.replace(
            "| Expected manifest | N/A with reason: unit test fixture not a worker return |",
            "| Expected manifest | docs/reference/plan.md |",
        ).replace(
            "| Actual changed set | N/A with reason: unit test fixture not a worker return |",
            "| Actual changed set | docs/reference/plan.md; docs/reference/extra.md |",
        ).replace(
            "| Manifest delta | N/A with reason: unit test fixture not a worker return |",
            "| Manifest delta | UNAUTHORIZED_ADDITION: docs/reference/extra.md |",
        )
        changed = {
            path: {"M"},
            "docs/reference/plan.md": {"A"},
            "docs/reference/extra.md": {"A"},
        }
        texts = {
            path: trace,
            "docs/reference/plan.md": "content",
            "docs/reference/extra.md": "content",
        }

        violations = MODULE.find_trace_violations(changed, texts)

        self.assertTrue(any("UNAUTHORIZED_ADDITION" in v for v in violations))

    def test_na_with_reason_manifest_passes_for_non_worker(self) -> None:
        """All manifest fields N/A with reason skips manifest comparison."""
        changed = {"docs/work_orders/CVF_AGENT_WORK_ORDER_EXAMPLE.md": {"M"}}
        texts = {"docs/work_orders/CVF_AGENT_WORK_ORDER_EXAMPLE.md": VALID_TRACE}

        self.assertEqual(MODULE.find_trace_violations(changed, texts), [])

    # --- AOT-T3: dispatch manifest scope discipline ---

    def test_dispatch_future_paths_in_write_ownership_do_not_count_as_manifest(self) -> None:
        path = "docs/work_orders/CVF_AGENT_WORK_ORDER_AOT_T3_EXAMPLE.md"
        gc018 = "docs/baselines/CVF_GC018_AOT_T3_EXAMPLE.md"
        roadmap = "docs/roadmaps/CVF_AOT_EXAMPLE_ROADMAP.md"
        trace = (
            "Status: DISPATCH_READY\n\n"
            "## Write Ownership\n\n"
            "Owned files:\n\n"
            "- `governance/compat/check_agent_operation_trace.py`\n"
            "- `governance/compat/test_check_agent_operation_trace.py`\n"
            "- `docs/reviews/CVF_AOT_T3_EXAMPLE_COMPLETION.md`\n\n"
            + VALID_TRACE.replace(
                "| Expected manifest | N/A with reason: unit test fixture not a worker return |",
                f"| Expected manifest | {gc018}; {path}; {roadmap} |",
            ).replace(
                "| Actual changed set | N/A with reason: unit test fixture not a worker return |",
                f"| Actual changed set | {gc018}; {path}; {roadmap} |",
            ).replace(
                "| Manifest delta | N/A with reason: unit test fixture not a worker return |",
                "| Manifest delta | MATCH |",
            )
        )
        changed = {
            gc018: {"A"},
            path: {"A"},
            roadmap: {"M"},
        }
        texts = {gc018: "content", path: trace, roadmap: "content"}

        self.assertEqual(MODULE.find_trace_violations(changed, texts), [])

    def test_dispatch_manifest_listing_future_write_ownership_path_is_violation(self) -> None:
        path = "docs/work_orders/CVF_AGENT_WORK_ORDER_AOT_T3_EXAMPLE.md"
        gc018 = "docs/baselines/CVF_GC018_AOT_T3_EXAMPLE.md"
        roadmap = "docs/roadmaps/CVF_AOT_EXAMPLE_ROADMAP.md"
        future = "governance/compat/check_agent_operation_trace.py"
        trace = (
            "Status: DISPATCH_READY\n\n"
            "## Write Ownership\n\n"
            "Owned files:\n\n"
            f"- `{future}`\n"
            "- `docs/reviews/CVF_AOT_T3_EXAMPLE_COMPLETION.md`\n\n"
            + VALID_TRACE.replace(
                "| Expected manifest | N/A with reason: unit test fixture not a worker return |",
                f"| Expected manifest | {gc018}; {path}; {roadmap}; {future} |",
            ).replace(
                "| Actual changed set | N/A with reason: unit test fixture not a worker return |",
                f"| Actual changed set | {gc018}; {path}; {roadmap} |",
            ).replace(
                "| Manifest delta | N/A with reason: unit test fixture not a worker return |",
                f"| Manifest delta | MISSING_DELIVERABLE: {future} |",
            )
        )
        changed = {
            gc018: {"A"},
            path: {"A"},
            roadmap: {"M"},
        }
        texts = {gc018: "content", path: trace, roadmap: "content"}

        violations = MODULE.find_trace_violations(changed, texts)

        self.assertTrue(any("DISPATCH_SCOPE_VIOLATION" in v for v in violations))


if __name__ == "__main__":
    unittest.main()
