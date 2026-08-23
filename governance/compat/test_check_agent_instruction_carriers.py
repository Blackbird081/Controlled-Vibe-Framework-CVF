"""Focused tests for check_agent_instruction_carriers.

Text Encoding Exception: one fixture below intentionally writes a non-ASCII
character to a temp fixture file to exercise the ASCII-only carrier check;
that character is test fixture data, not authored prose in this file itself.
"""

from __future__ import annotations

import hashlib
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

import check_agent_instruction_carriers as checker


def _write(root: Path, rel: str, content: str) -> None:
    full = root / rel
    full.parent.mkdir(parents=True, exist_ok=True)
    full.write_text(content, encoding="utf-8", newline="\n")


def _minimal_agents_text() -> str:
    lines = ["# CVF Agent Instructions", ""]
    for literal in checker.AGENTS_DIRECT_LITERALS:
        if "\n" not in literal:
            lines.append(literal)
    return "\n".join(lines) + "\n"


def _minimal_claude_text() -> str:
    return "\n".join(checker.CLAUDE_DIRECT_LITERALS) + "\n"


def _minimal_template_text() -> str:
    lines = list(checker.TEMPLATE_ROLE_TOKENS)
    lines.extend(checker.TEMPLATE_REHYDRATION_TOKENS)
    lines.append(checker.TEMPLATE_PHASE_CHAIN)
    lines.extend(checker.TEMPLATE_SUBSTITUTION_TOKENS)
    lines.append(checker.TEMPLATE_GOLDEN_HEADING)
    lines.extend(checker.TEMPLATE_GOLDEN_PHRASES)
    return "\n".join(lines) + "\n"


def _minimal_routing_index_text() -> str:
    rows = [f"| {heading} | owner | ROUTE |" for heading in checker.REQUIRED_AGENTS_HEADINGS]
    body = "\n".join(rows)
    archives = "\n".join(f"archive: {p}" for p in (checker.AGENTS_ARCHIVE_PATH, checker.CLAUDE_ARCHIVE_PATH, checker.TEMPLATE_ARCHIVE_PATH))
    hashes = "\n".join(f"hash: {h}" for h in (checker.AGENTS_PREIMAGE_SHA256, checker.CLAUDE_PREIMAGE_SHA256, checker.TEMPLATE_PREIMAGE_SHA256))
    return f"{body}\n\n{archives}\n\n{hashes}\n"


class CompliantFixtureTests(unittest.TestCase):
    """Builds a minimal fully-compliant fixture tree and asserts zero violations."""

    def setUp(self) -> None:
        self._tmp = TemporaryDirectory()
        self._root = Path(self._tmp.name)
        self._orig_root = checker.REPO_ROOT
        checker.REPO_ROOT = self._root

        agents_text = _minimal_agents_text()
        claude_text = _minimal_claude_text()
        template_text = _minimal_template_text()

        _write(self._root, checker.AGENTS_PATH, agents_text)
        _write(self._root, checker.CLAUDE_PATH, claude_text)
        _write(self._root, checker.DOWNSTREAM_TEMPLATE_PATH, template_text)
        _write(self._root, checker.ROUTING_INDEX_PATH, _minimal_routing_index_text())

        agents_bytes = agents_text.encode("utf-8")
        claude_bytes = claude_text.encode("utf-8")
        template_bytes = template_text.encode("utf-8")
        checker.AGENTS_PREIMAGE_SHA256_ORIG = checker.AGENTS_PREIMAGE_SHA256
        checker.AGENTS_PREIMAGE_SHA256 = hashlib.sha256(agents_bytes).hexdigest()
        checker.CLAUDE_PREIMAGE_SHA256 = hashlib.sha256(claude_bytes).hexdigest()
        checker.TEMPLATE_PREIMAGE_SHA256 = hashlib.sha256(template_bytes).hexdigest()
        checker.ARCHIVE_BINDINGS = (
            (checker.AGENTS_PATH, checker.AGENTS_ARCHIVE_PATH, checker.AGENTS_PREIMAGE_SHA256),
            (checker.CLAUDE_PATH, checker.CLAUDE_ARCHIVE_PATH, checker.CLAUDE_PREIMAGE_SHA256),
            (checker.DOWNSTREAM_TEMPLATE_PATH, checker.TEMPLATE_ARCHIVE_PATH, checker.TEMPLATE_PREIMAGE_SHA256),
        )
        _write(self._root, checker.AGENTS_ARCHIVE_PATH, agents_text)
        _write(self._root, checker.CLAUDE_ARCHIVE_PATH, claude_text)
        _write(self._root, checker.TEMPLATE_ARCHIVE_PATH, template_text)
        _write(self._root, checker.ROUTING_INDEX_PATH, _minimal_routing_index_text())

        for catalog_path in checker.SELF_BINDING_CATALOGS:
            _write(self._root, catalog_path, checker.THIS_SCRIPT_PATH)

    def tearDown(self) -> None:
        checker.REPO_ROOT = self._orig_root
        self._tmp.cleanup()

    def test_fully_compliant_tree_has_zero_violations(self) -> None:
        violations = checker.run()
        self.assertEqual(violations, [], msg=f"unexpected violations: {violations}")

    def test_agents_over_line_budget_is_flagged(self) -> None:
        bloated = _minimal_agents_text() + ("\n" * 221)
        _write(self._root, checker.AGENTS_PATH, bloated)
        violations = checker.run()
        kinds = {kind for _, kind, _ in violations}
        self.assertIn("carrier_over_line_budget", kinds)

    def test_archive_hash_mismatch_is_flagged(self) -> None:
        _write(self._root, checker.AGENTS_ARCHIVE_PATH, _minimal_agents_text() + "tampered\n")
        violations = checker.run()
        kinds = {kind for _, kind, _ in violations}
        self.assertIn("archive_hash_mismatch", kinds)

    def test_missing_archive_is_flagged(self) -> None:
        (self._root / checker.CLAUDE_ARCHIVE_PATH).unlink()
        violations = checker.run()
        kinds = {kind for _, kind, _ in violations}
        self.assertIn("archive_missing", kinds)

    def test_routing_index_missing_heading_is_flagged(self) -> None:
        rows = [
            f"| {heading} | owner | ROUTE |"
            for heading in checker.REQUIRED_AGENTS_HEADINGS
            if heading != "Latest Closed Continuation Roadmap"
        ]
        archives = "\n".join(f"archive: {p}" for p in (checker.AGENTS_ARCHIVE_PATH, checker.CLAUDE_ARCHIVE_PATH, checker.TEMPLATE_ARCHIVE_PATH))
        hashes = "\n".join(f"hash: {h}" for h in (checker.AGENTS_PREIMAGE_SHA256, checker.CLAUDE_PREIMAGE_SHA256, checker.TEMPLATE_PREIMAGE_SHA256))
        _write(self._root, checker.ROUTING_INDEX_PATH, "\n".join(rows) + f"\n\n{archives}\n\n{hashes}\n")
        violations = checker.run()
        kinds = {kind for _, kind, _ in violations}
        self.assertIn("routing_index_heading_missing", kinds)

    def test_routing_index_duplicated_heading_is_flagged(self) -> None:
        text = _minimal_routing_index_text()
        text += "\n| Session Memory Front Door | dup owner | ROUTE |\n"
        _write(self._root, checker.ROUTING_INDEX_PATH, text)
        violations = checker.run()
        kinds = {kind for _, kind, _ in violations}
        self.assertIn("routing_index_heading_duplicated", kinds)

    def test_missing_direct_literal_in_agents_is_flagged(self) -> None:
        _write(self._root, checker.AGENTS_PATH, "# CVF Agent Instructions\nnothing required here\n")
        violations = checker.run()
        kinds = {kind for _, kind, _ in violations}
        self.assertIn("direct_literal_missing", kinds)

    def test_missing_claude_not_cvf_source_is_flagged(self) -> None:
        stripped = _minimal_claude_text().replace("NOT_CVF_SOURCE", "")
        _write(self._root, checker.CLAUDE_PATH, stripped)
        violations = checker.run()
        kinds = {kind for _, kind, _ in violations}
        self.assertIn("direct_literal_missing", kinds)

    def test_missing_template_role_token_is_flagged(self) -> None:
        stripped = _minimal_template_text().replace("ORCHESTRATOR", "")
        _write(self._root, checker.DOWNSTREAM_TEMPLATE_PATH, stripped)
        violations = checker.run()
        kinds = {kind for _, kind, _ in violations}
        self.assertIn("template_role_token_missing", kinds)

    def test_template_golden_heading_duplicated_is_flagged(self) -> None:
        doubled = _minimal_template_text() + f"\n{checker.TEMPLATE_GOLDEN_HEADING}\n"
        _write(self._root, checker.DOWNSTREAM_TEMPLATE_PATH, doubled)
        violations = checker.run()
        kinds = {kind for _, kind, _ in violations}
        self.assertIn("template_golden_heading_count", kinds)

    def test_unconditional_full_read_wording_is_flagged(self) -> None:
        text = _minimal_agents_text() + "\nYou must always read the full history before proceeding.\n"
        _write(self._root, checker.AGENTS_PATH, text)
        violations = checker.run()
        kinds = {kind for _, kind, _ in violations}
        self.assertIn("unconditional_full_read_wording", kinds)

    def test_missing_self_binding_is_flagged(self) -> None:
        _write(self._root, checker.SELF_BINDING_CATALOGS[0], "no binding here")
        violations = checker.run()
        kinds = {kind for _, kind, _ in violations}
        self.assertIn("self_binding_missing", kinds)

    def test_missing_carrier_is_flagged(self) -> None:
        (self._root / checker.CLAUDE_PATH).unlink()
        violations = checker.run()
        kinds = {kind for _, kind, _ in violations}
        self.assertIn("carrier_missing", kinds)

    def test_malformed_encoding_is_flagged(self) -> None:
        full = self._root / checker.AGENTS_PATH
        full.write_bytes(b"\xff\xfe not valid utf-8 strict \x80")
        violations = checker.run()
        kinds = {kind for _, kind, _ in violations}
        self.assertIn("carrier_encoding_invalid", kinds)

    def test_non_ascii_carrier_is_flagged(self) -> None:
        text = _minimal_agents_text() + "\ncafé\n"
        _write(self._root, checker.AGENTS_PATH, text)
        violations = checker.run()
        kinds = {kind for _, kind, _ in violations}
        self.assertIn("carrier_not_ascii", kinds)


if __name__ == "__main__":
    unittest.main()
