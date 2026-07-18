from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().with_name("check_external_absorption_value_conversion.py")
SPEC = importlib.util.spec_from_file_location("check_external_absorption_value_conversion", MODULE_PATH)
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
| Enumeration command | Get-ChildItem -LiteralPath '.private_reference/external_repos/repo' -Recurse -Force -File |
| Manifest artifact or inline manifest | inline table below |
| Processing ledger artifact or inline ledger | inline table below with file-level rows |
| Ledger terminal statuses | READ, ADAPTED, DEFERRED, REJECTED, NO_NEW_VALUE, BLOCKED_UNREADABLE |
| Disposition taxonomy | ABSORB, ADAPT, DEFER, REJECT, BLOCK, NO_NEW_VALUE |
| Owner-surface map | inline table mapping accepted rows to docs/reference/example.md |
| Unresolved items | 0 |
| Completion claim boundary | bounded documentation-only absorption; no runtime/provider/public/production claim |

## External Absorption Value Conversion Matrix

| Source item | Value extracted | Conversion lane | CVF target surface | Next governed action | Runtime/package boundary |
|---|---|---|---|---|---|
| file 1 | doctrine value | DOCTRINE_ADAPTED | docs/reference/example.md | Already adapted in this tranche | Documentation only |
| file 2 | package schema | PACKAGE_CANDIDATE | docs/reference/package_contract.md | Open fresh GC-018 before package creation | Candidate only; no package activated |
| file 3 | resolver behavior | RUNTIME_CANDIDATE | runtime owner pending | Separate runtime work order and live proof before behavior claim | No runtime mutation in this tranche |
| file 4 | checker requirements | CHECKER_CANDIDATE | governance/compat/check_example.py | Source-verified checker work order | Candidate only; no hook wiring now |
| file 5 | external checker | REJECT_DIRECT_IMPORT | N/A with reason: direct import rejected | Keep rejected unless CVF-native rewrite is authorized | No direct import |
| file 6 | treeview | NO_PACKAGE_OR_RUNTIME_VALUE | N/A with reason: inventory only | None; resolved by review manifest | No package/runtime value |

## Corpus Completeness And Report Integrity

- Corpus verdict: COMPLETE_VERIFIED

## External Knowledge Intake Routing

| Field | Value |
|---|---|
| Chain map | docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md |
"""


class ExternalAbsorptionValueConversionTests(unittest.TestCase):
    def test_valid_artifact_passes(self) -> None:
        violations = MODULE.check_text(
            "docs/reviews/CVF_SAMPLE_EXTERNAL_ABSORPTION_REVIEW.md",
            VALID_ARTIFACT,
        )

        self.assertEqual([], violations)

    def test_missing_value_conversion_matrix_fails(self) -> None:
        text = VALID_ARTIFACT.replace(
            "## External Absorption Value Conversion Matrix",
            "## Removed Matrix",
        )

        violations = MODULE.check_text("docs/reviews/CVF_SAMPLE.md", text)

        self.assertTrue(any(item["type"] == "external_absorption_value_conversion_section_missing" for item in violations))

    def test_missing_package_lane_fails(self) -> None:
        text = VALID_ARTIFACT.replace("PACKAGE_CANDIDATE", "DOCTRINE_ADAPTED")

        violations = MODULE.check_text("docs/reviews/CVF_SAMPLE.md", text)

        self.assertTrue(any(item["type"] == "external_absorption_value_conversion_lane_missing" for item in violations))

    def test_candidate_without_next_action_fails(self) -> None:
        text = VALID_ARTIFACT.replace(
            "| file 2 | package schema | PACKAGE_CANDIDATE | docs/reference/package_contract.md | Open fresh GC-018 before package creation | Candidate only; no package activated |",
            "| file 2 | package schema | PACKAGE_CANDIDATE | docs/reference/package_contract.md | N/A | Candidate only; no package activated |",
        )

        violations = MODULE.check_text("docs/reviews/CVF_SAMPLE.md", text)

        self.assertTrue(any(item["type"] == "external_absorption_value_conversion_next_action_missing" for item in violations))

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

    def test_standard_requires_new_markers(self) -> None:
        text = """
# CVF External Absorption Core Standard

Status: ACTIVE_REFERENCE

## Required Value Conversion Matrix

## External Absorption Value Conversion Matrix

governance/compat/check_external_absorption_value_conversion.py
governance/compat/check_external_absorption_core.py
PACKAGE_CANDIDATE
RUNTIME_CANDIDATE
CHECKER_CANDIDATE
NO_PACKAGE_OR_RUNTIME_VALUE
"""

        violations = MODULE.check_text(
            "docs/reference/external_agent_review/CVF_EXTERNAL_ABSORPTION_CORE_STANDARD.md",
            text,
        )

        self.assertEqual([], violations)


if __name__ == "__main__":
    unittest.main()
