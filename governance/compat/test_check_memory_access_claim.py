"""
Focused tests for check_memory_access_claim.py.

Covers MPI-T5 requirements:
- one true-positive per required overclaim class;
- cited true-negative for matching claim language;
- unrelated governed Markdown true-negative;
- EVEROS-T4 source-derived memory claim guard extension;
- CLI --base/--head/--enforce/--json behavior;
- no write/network/provider mutation primitives in the checker implementation.
"""

from __future__ import annotations

import io
import json
import sys
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest import mock


REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT))

from governance.compat import check_memory_access_claim as checker


GOVERNED_PATH = "docs/reviews/test_memory_claim.md"
ROADMAP_PATH = "docs/roadmaps/test_memory_claim.md"


def _doc(body: str, source_block: str = "") -> str:
    source = source_block or """\
| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Source fact type | Disposition |
|---|---|---|---|---|---|---|
"""
    return f"""\
# Test Memory Claim

Status: TEST

## Source Verification Block

{source}

## Claim Boundary

{body}
"""


class TestMemoryAccessClaimTruePositives(unittest.TestCase):

    def _types_for(self, body: str, source_block: str = "") -> list[str]:
        violations = checker.diagnose_memory_access_claims(
            GOVERNED_PATH,
            _doc(body, source_block),
        )
        return [item["type"] for item in violations]

    def test_external_agent_live_runtime_access_without_citation_detected(self) -> None:
        types = self._types_for(
            "External agents can read CVF memory through the live runtime MCP route."
        )
        self.assertIn("external_agent_live_read_access", types)

    def test_scan_registry_auto_wired_without_route_citation_detected(self) -> None:
        types = self._types_for(
            "The scan-registry projection is automatically loaded and wired into the route."
        )
        self.assertIn("scan_registry_auto_wired_route", types)

    def test_vector_db_live_memory_access_without_citation_detected(self) -> None:
        types = self._types_for(
            "The vector DB is live memory access for external agents in production."
        )
        self.assertIn("kgr_graph_vector_durable_live_memory_access", types)

    def test_raw_memory_release_detected(self) -> None:
        types = self._types_for("The route returns rawMemoryReleased: true for this path.")
        self.assertIn("raw_memory_or_reinjection_permitted", types)

    def test_index_replaces_canonical_authority_detected(self) -> None:
        types = self._types_for(
            "This INDEX artifact replaces canonical source authority for Memory Plane facts."
        )
        self.assertIn("index_replaces_canonical_authority", types)

    def test_derived_view_as_source_authority_detected(self) -> None:
        types = self._types_for(
            "The semantic index provides source authority for the memory decision."
        )
        self.assertIn("derived_view_as_source_authority", types)

    def test_stale_derived_view_safe_use_detected(self) -> None:
        types = self._types_for(
            "A stale derived index may still authorize dispatch for this workflow."
        )
        self.assertIn("stale_or_conflicted_view_safe_to_use", types)

    def test_derived_view_runtime_capability_detected(self) -> None:
        types = self._types_for(
            "The cache index is a live runtime memory capability for governed agents."
        )
        self.assertIn("derived_view_runtime_capability", types)

    def test_retrieval_result_reinjection_detected(self) -> None:
        types = self._types_for(
            "A cache hit authorizes prompt reinjection for the next request."
        )
        self.assertIn("retrieval_result_allows_reinjection", types)


class TestMemoryAccessClaimTrueNegatives(unittest.TestCase):

    def test_external_agent_claim_with_route_source_verification_passes(self) -> None:
        source = """\
| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Source fact type | Disposition |
|---|---|---|---|---|---|---|
| External read route exists | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/memory/readout/route.ts` | POST handler | `POST` | memory readout route | RUNTIME_BEHAVIOR | ACCEPT |
"""
        violations = checker.diagnose_memory_access_claims(
            GOVERNED_PATH,
            _doc("External agents can read CVF memory through the live runtime MCP route.", source),
        )
        self.assertEqual(violations, [])

    def test_derived_runtime_claim_with_generated_source_verification_passes(self) -> None:
        source = """\
| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Source fact type | Disposition |
|---|---|---|---|---|---|---|
| Generated source layout exists | `governance/compat/generate_corpus_scan_registry.py` | generator entrypoint | `main` | corpus scan registry generator | RUNTIME_BEHAVIOR | ACCEPT |
"""
        violations = checker.diagnose_memory_access_claims(
            GOVERNED_PATH,
            _doc("The metadata index is a runtime memory surface for this generated read model.", source),
        )
        self.assertEqual(violations, [])

    def test_unrelated_governed_markdown_passes(self) -> None:
        violations = checker.diagnose_memory_access_claims(
            "docs/work_orders/test_unrelated.md",
            _doc("This work order updates a static table and carries no Memory Plane access claim."),
        )
        self.assertEqual(violations, [])

    def test_guardrail_context_does_not_self_trigger(self) -> None:
        text = _doc(
            "The checker flags claim language asserting external agents can read CVF memory "
            "through a live runtime route."
        )
        violations = checker.diagnose_memory_access_claims(GOVERNED_PATH, text)
        self.assertEqual(violations, [])

    def test_source_derived_guardrail_context_does_not_self_trigger(self) -> None:
        text = _doc(
            "The guard target is an overclaim where a semantic index provides source "
            "authority without proof."
        )
        violations = checker.diagnose_memory_access_claims(GOVERNED_PATH, text)
        self.assertEqual(violations, [])

    def test_roadmap_path_is_applicable(self) -> None:
        violations = checker.diagnose_memory_access_claims(
            ROADMAP_PATH,
            _doc("The semantic index provides source authority for the memory decision."),
        )
        self.assertEqual(violations[0]["type"], "derived_view_as_source_authority")


class TestMemoryAccessClaimCliContract(unittest.TestCase):

    def _run_main(self, argv: list[str], doc_text: str) -> tuple[int, str]:
        with mock.patch.object(sys, "argv", ["check_memory_access_claim.py", *argv]), \
             mock.patch.object(checker, "_get_changed_name_status", return_value={GOVERNED_PATH: {"M"}}), \
             mock.patch.object(checker, "_get_worktree_name_status", return_value={}), \
             mock.patch.object(checker, "_read_rel", return_value=doc_text), \
             mock.patch.object(checker.Path, "exists", return_value=True), \
             mock.patch.object(checker.Path, "is_dir", return_value=False):
            output = io.StringIO()
            with redirect_stdout(output):
                rc = checker.main()
            return rc, output.getvalue()

    def test_non_enforcing_mode_reports_violation_but_returns_zero(self) -> None:
        rc, output = self._run_main(
            ["--base", "BASE", "--head", "HEAD"],
            _doc("External agents can read CVF memory through the live runtime MCP route."),
        )
        self.assertEqual(rc, 0)
        self.assertIn("VIOLATION", output)

    def test_enforcing_mode_returns_nonzero_for_violation(self) -> None:
        rc, output = self._run_main(
            ["--base", "BASE", "--head", "HEAD", "--enforce"],
            _doc("External agents can read CVF memory through the live runtime MCP route."),
        )
        self.assertEqual(rc, 2)
        self.assertIn("missing required citation", output)

    def test_json_mode_returns_structured_report(self) -> None:
        rc, output = self._run_main(
            ["--base", "BASE", "--head", "HEAD", "--json"],
            _doc("External agents can read CVF memory through the live runtime MCP route."),
        )
        self.assertEqual(rc, 0)
        report = json.loads(output)
        self.assertEqual(report["violationCount"], 1)
        self.assertEqual(report["range"]["base"], "BASE")
        self.assertEqual(report["range"]["head"], "HEAD")

    def test_enforcing_mode_returns_zero_when_clean(self) -> None:
        rc, output = self._run_main(
            ["--base", "BASE", "--head", "HEAD", "--enforce"],
            _doc("Plain governed Markdown with no scoped access claim."),
        )
        self.assertEqual(rc, 0)
        self.assertIn("COMPLIANT", output)


class TestReadOnlyImplementationBoundary(unittest.TestCase):

    def test_checker_source_has_no_write_or_network_primitives(self) -> None:
        source = Path(checker.__file__).read_text(encoding="utf-8")
        forbidden_tokens = (
            ".write_text(",
            ".write_bytes(",
            "open(",
            "requests.",
            "urllib.",
            "socket.",
            "http.client",
        )
        for token in forbidden_tokens:
            with self.subTest(token=token):
                self.assertNotIn(token, source)


if __name__ == "__main__":
    unittest.main()
