from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().with_name(
    "check_external_knowledge_intake_routing.py"
)
SPEC = importlib.util.spec_from_file_location(
    "check_external_knowledge_intake_routing", MODULE_PATH
)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


VALID_BLOCK = """
External knowledge intake routing: REQUIRED

## External Knowledge Intake Routing

| Field | Value |
| --- | --- |
| Chain map | docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md |
| Input type | External-agent returned output |
| Chain map route | External returned output -> absorption table -> promote/adapt/reject/block |
| Matching local-view guard | governance/compat/check_external_agent_absorption_table.py |
| Owner surface | docs/reviews/ |
| Disposition | CHANGED_DISPOSITION |
| Claim boundary | Bounded routing evidence only; no universal interception |
"""


class ExternalKnowledgeIntakeRoutingTests(unittest.TestCase):
    def test_valid_explicit_block_passes(self) -> None:
        violations = MODULE.check_text(
            "docs/reviews/CVF_EXTERNAL_RETURN_SAMPLE_COMPLETION_2026-06-19.md",
            VALID_BLOCK,
        )

        self.assertEqual([], violations)

    def test_missing_chain_map_citation_fails(self) -> None:
        text = VALID_BLOCK.replace(
            "docs/reference/external_agent_review/"
            "CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md",
            "docs/reference/external_agent_review/OTHER.md",
        )

        violations = MODULE.check_text(
            "docs/reviews/CVF_EXTERNAL_RETURN_SAMPLE_COMPLETION_2026-06-19.md",
            text,
        )

        self.assertTrue(any("missing chain map citation" in item for item in violations))

    def test_missing_section_fails(self) -> None:
        violations = MODULE.check_text(
            "docs/reviews/CVF_EXTERNAL_RETURN_SAMPLE_COMPLETION_2026-06-19.md",
            "External knowledge intake routing: REQUIRED\n",
        )

        self.assertTrue(any("missing `## External Knowledge Intake Routing`" in item for item in violations))

    def test_invalid_input_type_fails(self) -> None:
        text = VALID_BLOCK.replace(
            "| Input type | External-agent returned output |",
            "| Input type | Random outside input |",
        )

        violations = MODULE.check_text(
            "docs/reviews/CVF_EXTERNAL_RETURN_SAMPLE_COMPLETION_2026-06-19.md",
            text,
        )

        self.assertTrue(any("Input type" in item for item in violations))

    def test_matching_guard_without_guard_or_na_fails(self) -> None:
        text = VALID_BLOCK.replace(
            "| Matching local-view guard | governance/compat/check_external_agent_absorption_table.py |",
            "| Matching local-view guard | manual review only |",
        )

        violations = MODULE.check_text(
            "docs/reviews/CVF_EXTERNAL_RETURN_SAMPLE_COMPLETION_2026-06-19.md",
            text,
        )

        self.assertTrue(any("Matching local-view guard" in item for item in violations))

    def test_matching_guard_na_with_reason_passes(self) -> None:
        text = VALID_BLOCK.replace(
            "| Matching local-view guard | governance/compat/check_external_agent_absorption_table.py |",
            "| Matching local-view guard | N/A with reason: this is doc-only closure evidence |",
        )

        violations = MODULE.check_text(
            "docs/reviews/CVF_EXTERNAL_RETURN_SAMPLE_COMPLETION_2026-06-19.md",
            text,
        )

        self.assertEqual([], violations)

    def test_unrelated_path_ignored(self) -> None:
        violations = MODULE.check_text(
            "docs/reviews/CVF_INTERNAL_ONLY_COMPLETION_2026-06-19.md",
            "Status: CLOSED_PASS_BOUNDED\n",
        )

        self.assertEqual([], violations)

    def test_archive_path_ignored(self) -> None:
        violations = MODULE.check_text(
            "docs/reviews/archive/CVF_EXTERNAL_RETURN_SAMPLE_COMPLETION_2026-06-19.md",
            "External knowledge intake routing: REQUIRED\n",
        )

        self.assertEqual([], violations)


if __name__ == "__main__":
    unittest.main()
