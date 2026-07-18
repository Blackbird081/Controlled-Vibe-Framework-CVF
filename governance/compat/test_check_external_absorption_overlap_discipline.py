from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().with_name("check_external_absorption_overlap_discipline.py")
SPEC = importlib.util.spec_from_file_location("check_external_absorption_overlap_discipline", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


VALID_ARTIFACT = """
# Sample External Absorption

External absorption core: REQUIRED

## External Absorption Core

| Field | Value |
|---|---|
| Standard | docs/reference/external_agent_review/CVF_EXTERNAL_ABSORPTION_CORE_STANDARD.md |
| Input root or repository | https://github.com/example/repo at abc123 |
| Enumeration command | Get-ChildItem -LiteralPath '.private_reference/source_mirrors/example' -Recurse -Force -File |
| Manifest artifact or inline manifest | inline table below |
| Processing ledger artifact or inline ledger | inline table below |
| Ledger terminal statuses | READ, ADAPTED, DEFERRED, REJECTED, NO_NEW_VALUE, BLOCKED_UNREADABLE |
| Disposition taxonomy | ABSORB, ADAPT, DEFER, REJECT, BLOCK, NO_NEW_VALUE |
| Owner-surface map | inline table mapping accepted rows to docs/reference/example.md |
| Unresolved items | 0 |
| Completion claim boundary | bounded documentation-only absorption |

## Overlap And Novelty Classification

| Source item or group | Existing CVF owner surface checked | Overlap disposition | Novelty / delta | Action |
|---|---|---|---|---|
| README and package docs | docs/reference/example.md | CONFIRMED_EXISTING | Confirms existing doctrine without changing owner semantics. | Keep existing owner surface. |
| Runtime adapter notes | docs/reference/runtime/example.md | ENRICH_EXISTING | Adds one missing adapter-boundary warning. | Update owner surface in allowed scope. |
| New checker hint | OWNER_SURFACE_NOT_FOUND | NEW_FINDING | New reusable checker idea with no current owner. | Park with reopen condition. |
| Generated asset | docs/reference/example.md | NO_NEW_VALUE | Static asset duplicates existing no-value rule. | Close with reason. |

## Corpus Completeness And Report Integrity

- Corpus verdict: COMPLETE_VERIFIED

## External Knowledge Intake Routing

| Field | Value |
|---|---|
| Chain map | docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md |
"""


class ExternalAbsorptionOverlapDisciplineTests(unittest.TestCase):
    def test_valid_artifact_passes(self) -> None:
        violations = MODULE.check_text(
            "docs/reviews/CVF_SAMPLE_EXTERNAL_ABSORPTION_REVIEW.md",
            VALID_ARTIFACT,
        )

        self.assertEqual([], violations)

    def test_missing_overlap_section_fails(self) -> None:
        text = VALID_ARTIFACT.replace("## Overlap And Novelty Classification", "## Removed Overlap")

        violations = MODULE.check_text("docs/reviews/CVF_SAMPLE.md", text)

        self.assertTrue(any(item["type"] == "external_absorption_overlap_section_missing" for item in violations))

    def test_missing_owner_surface_fails(self) -> None:
        text = VALID_ARTIFACT.replace("docs/reference/example.md | CONFIRMED_EXISTING", "N/A | CONFIRMED_EXISTING")

        violations = MODULE.check_text("docs/reviews/CVF_SAMPLE.md", text)

        self.assertTrue(any(item["type"] == "external_absorption_overlap_owner_surface_missing" for item in violations))

    def test_unknown_disposition_fails(self) -> None:
        text = VALID_ARTIFACT.replace("CONFIRMED_EXISTING", "MAYBE_NEW", 1)

        violations = MODULE.check_text("docs/reviews/CVF_SAMPLE.md", text)

        self.assertTrue(any(item["type"] == "external_absorption_overlap_disposition_unknown" for item in violations))

    def test_unrelated_internal_doc_is_ignored(self) -> None:
        violations = MODULE.check_text(
            "docs/reviews/CVF_INTERNAL_ONLY_COMPLETION.md",
            "# Internal\n\nStatus: CLOSED_PASS_BOUNDED\n",
        )

        self.assertEqual([], violations)

    def test_remote_url_plus_chain_map_absorption_word_is_ignored(self) -> None:
        text = """
# Internal Governance Review

## Evidence

Remote evidence: https://github.com/example/project.git

Required routing source:
docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md
"""

        violations = MODULE.check_text("docs/reviews/CVF_INTERNAL_ROUTE_REVIEW.md", text)

        self.assertEqual([], violations)

    def test_standard_requires_overlap_markers(self) -> None:
        text = """
# CVF External Absorption Core Standard

Status: ACTIVE_REFERENCE

## Overlap And Novelty Classification Rule

## Overlap And Novelty Classification

governance/compat/check_external_absorption_overlap_discipline.py
CONFIRMED_EXISTING
ENRICH_EXISTING
NEW_FINDING
OWNER_SURFACE_NOT_FOUND
"""

        violations = MODULE.check_text(
            "docs/reference/external_agent_review/CVF_EXTERNAL_ABSORPTION_CORE_STANDARD.md",
            text,
        )

        self.assertEqual([], violations)


if __name__ == "__main__":
    unittest.main()
