from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().with_name("check_external_absorption_core.py")
SPEC = importlib.util.spec_from_file_location("check_external_absorption_core", MODULE_PATH)
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
| Input root or repository | https://github.com/example/repo at abc123 and `.private_reference/external_repos/repo` |
| Enumeration command | Get-ChildItem -LiteralPath '.private_reference/external_repos/repo' -Recurse -Force -File |
| Manifest artifact or inline manifest | inline table below |
| Processing ledger artifact or inline ledger | inline table below with file-level rows |
| Ledger terminal statuses | READ, ADAPTED, DEFERRED, REJECTED, NO_NEW_VALUE, BLOCKED_UNREADABLE |
| Disposition taxonomy | ABSORB, ADAPT, DEFER, REJECT, BLOCK, NO_NEW_VALUE |
| Owner-surface map | inline table mapping accepted rows to docs/reference/example.md |
| Unresolved items | 0 |
| Completion claim boundary | bounded documentation-only absorption; no runtime/provider/public/production claim |

## Corpus Completeness And Report Integrity

- Corpus task class: KNOWLEDGE_ABSORPTION
- Corpus root: `.private_reference/external_repos/repo`
- Snapshot time: 2026-06-29T00:00:00Z
- Enumeration command: Get-ChildItem -LiteralPath '.private_reference/external_repos/repo' -Recurse -Force -File
- Manifest artifact or inline manifest: inline manifest
- Manifest hash: N/A with reason: inline test fixture
- Processing ledger artifact or inline ledger: inline file-level ledger
- Allowed terminal statuses: READ | SKIPPED_WITH_REASON | DEFERRED | BLOCKED_UNREADABLE
- Reconciliation: manifest=1; ledger_terminal=1; exclusions=0; unresolved=0
- Unresolved files: 0
- Declared exclusions: none
- Unreadable or unsupported files: none
- Aggregation check: PASS
- Drift check: N/A with reason: test fixture
- Output traceability: inline source row
- Adversarial verification: fixture validates required guard shape
- Corpus verdict: COMPLETE_VERIFIED

## External Knowledge Intake Routing

| Field | Value |
|---|---|
| Chain map | docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md |
| Input type | external repo or copied folder |
| Chain map route | external repo or copied folder -> external absorption core -> owner-surface disposition |
| Matching local-view guard | governance/compat/check_external_absorption_core.py |
| Owner surface | docs/reference/example.md |
| Disposition | ADAPT |
| Claim boundary | bounded test fixture |
"""


class ExternalAbsorptionCoreTests(unittest.TestCase):
    def test_valid_artifact_passes(self) -> None:
        violations = MODULE.check_text(
            "docs/roadmaps/CVF_SAMPLE_EXTERNAL_ABSORPTION_ROADMAP.md",
            VALID_ARTIFACT,
        )

        self.assertEqual([], violations)

    def test_missing_core_section_fails_for_source_path(self) -> None:
        text = """
# Sample

This absorbs `.private_reference/legacy/CVF 28.06/Pack`.

## Corpus Completeness And Report Integrity

- Corpus verdict: COMPLETE_VERIFIED

## External Knowledge Intake Routing

| Field | Value |
|---|---|
| Chain map | docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md |
"""

        violations = MODULE.check_text("docs/reviews/CVF_SAMPLE.md", text)

        self.assertTrue(any(item["type"] == "external_absorption_core_section_missing" for item in violations))

    def test_corpus_not_applicable_fails_for_external_absorption(self) -> None:
        text = VALID_ARTIFACT.replace(
            "- Corpus verdict: COMPLETE_VERIFIED",
            "- Corpus verdict: NOT_APPLICABLE_WITH_REASON - bad fixture",
        )

        violations = MODULE.check_text("docs/reviews/CVF_SAMPLE.md", text)

        self.assertTrue(any(item["type"] == "external_absorption_core_corpus_na_invalid" for item in violations))

    def test_missing_status_taxonomy_fails(self) -> None:
        text = VALID_ARTIFACT.replace(", BLOCKED_UNREADABLE", "")

        violations = MODULE.check_text("docs/reviews/CVF_SAMPLE.md", text)

        self.assertTrue(any(item["type"] == "external_absorption_core_status_missing" for item in violations))

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

    def test_github_absorption_without_source_path_is_applicable(self) -> None:
        text = VALID_ARTIFACT.replace(".private_reference/external_repos/repo", "local mirror")

        violations = MODULE.check_text(
            "docs/roadmaps/CVF_GITHUB_ABSORPTION_ROADMAP.md",
            text,
        )

        self.assertEqual([], violations)


if __name__ == "__main__":
    unittest.main()
