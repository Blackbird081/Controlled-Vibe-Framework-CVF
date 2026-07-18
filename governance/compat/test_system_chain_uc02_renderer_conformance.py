from __future__ import annotations

import json
import re
import sys
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPTS_DIR = REPO_ROOT / "scripts"
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

from export_cvf_remediation_receipt_log import build_log  # noqa: E402
from export_cvf_release_packet import build_packet  # noqa: E402
from runtime_evidence_manifest.manifest_builder import build_manifest_log  # noqa: E402

CHECKER_READ_AHEAD_HEADING = "## Checker Source Read-Ahead Block"
REQUIRED_COMMON_HEADINGS = (
    "Memory class",
    "Status",
    "## Purpose",
    "## Target",
    "## Claim Boundary",
)
REQUIRED_REVIEW_HEADINGS = (
    "## Findings",
    "## Risk",
    "## Decision",
    "## Scope",
    "## Finding-To-Governance Learning Disposition",
)


def _assert_epistemic_na(testcase: unittest.TestCase, text: str) -> None:
    testcase.assertIn("EPISTEMIC_PROCESS_NA_WITH_REASON:", text)


def _assert_ascii(testcase: unittest.TestCase, text: str) -> None:
    non_ascii = [ch for ch in text if ord(ch) > 127]
    testcase.assertEqual(non_ascii, [], f"unexpected non-ASCII characters: {non_ascii!r}")


def _assert_no_empty_range_literals(testcase: unittest.TestCase, text: str) -> None:
    testcase.assertIsNone(
        re.search(r"--base\s+HEAD\s+--head\s+HEAD", text),
        "renderer output must not contain a literal --base HEAD --head HEAD range",
    )
    testcase.assertIsNone(
        re.search(r"--base\s+HEAD~1\s+--head\s+HEAD", text),
        "renderer output must not contain a literal --base HEAD~1 --head HEAD range",
    )


def _assert_checker_read_ahead_block(testcase: unittest.TestCase, text: str) -> None:
    testcase.assertIn(CHECKER_READ_AHEAD_HEADING, text)
    testcase.assertIn("applicableCheckersRead", text)
    testcase.assertIn("literalTokensReviewed", text)
    testcase.assertIn("gateRunPurpose", text)
    testcase.assertIn("claimBoundary", text)
    testcase.assertIn("governance/compat/check_", text)
    testcase.assertIn("not first discovery", text.lower())


def _assert_common_review_headings(testcase: unittest.TestCase, text: str) -> None:
    for heading in REQUIRED_COMMON_HEADINGS:
        testcase.assertIn(heading, text, f"missing required common element: {heading}")
    for heading in REQUIRED_REVIEW_HEADINGS:
        testcase.assertIn(heading, text, f"missing required review section: {heading}")


class BuildLogRendererTests(unittest.TestCase):
    def _artifact(self, tmp_path: Path) -> Path:
        artifact = {
            "schemaVersion": "1.0",
            "adapter": "test-adapter",
            "receiptCount": 1,
            "receipts": [
                {
                    "receiptId": "rcpt-1",
                    "action": "approve",
                    "sourceProposalId": "prop-1",
                    "step": "review",
                    "recordedAt": "2026-03-07T00:00:00Z",
                }
            ],
        }
        path = tmp_path / "artifact.json"
        path.write_text(json.dumps(artifact), encoding="utf-8")
        return path

    def test_build_log_produces_governed_markdown_structure(self) -> None:
        import tempfile

        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            artifact_path = self._artifact(tmp_path)
            output = build_log(artifact_path)
            _assert_ascii(self, output)
            _assert_no_empty_range_literals(self, output)
            _assert_checker_read_ahead_block(self, output)
            _assert_common_review_headings(self, output)
            _assert_epistemic_na(self, output)

    def test_build_log_handles_empty_receipts(self) -> None:
        import tempfile

        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            artifact_path = tmp_path / "empty.json"
            artifact_path.write_text(
                json.dumps({"schemaVersion": "1.0", "adapter": "x", "receiptCount": 0, "receipts": []}),
                encoding="utf-8",
            )
            output = build_log(artifact_path)
            _assert_ascii(self, output)
            _assert_checker_read_ahead_block(self, output)
            _assert_common_review_headings(self, output)
            _assert_epistemic_na(self, output)


class BuildManifestLogRendererTests(unittest.TestCase):
    def test_build_manifest_log_produces_governed_markdown_structure(self) -> None:
        manifest = {
            "schemaVersion": "1.0",
            "manifestType": "CVF_MULTI_RUNTIME_REMEDIATION_EVIDENCE",
            "requestId": "req-1",
            "traceBatch": "batch-1",
            "releaseManifestPath": "docs/reference/CVF_RELEASE_MANIFEST.md",
            "linkedPacketPath": "docs/reviews/cvf_phase_governance/CVF_RELEASE_APPROVAL_PACKET_LOCAL_BASELINE_2026-03-07.md",
            "manifestLogPath": "docs/reviews/cvf_phase_governance/CVF_W4_MULTI_RUNTIME_EVIDENCE_LOG_2026-03-07.md",
            "runtimeFamilyCount": 1,
            "totalReceiptCount": 1,
            "releaseLinesCovered": ["stable"],
            "maturityBandsCovered": ["GA"],
            "entries": [
                {
                    "runtimeFamily": "phase_governance",
                    "versionToken": "v1.1.2",
                    "releaseLine": "stable",
                    "maturity": "GA",
                    "adapter": "test-adapter",
                    "receiptCount": 1,
                    "artifactPath": "docs/reviews/cvf_phase_governance/CVF_W4_PHASE_GOVERNANCE_EVIDENCE_2026-03-07.json",
                    "logPath": "docs/reviews/cvf_phase_governance/CVF_W4_PHASE_GOVERNANCE_LOG_2026-03-07.md",
                }
            ],
        }
        manifest_json_path = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_W4_MULTI_RUNTIME_EVIDENCE_MANIFEST_2026-03-07.json"
        output = build_manifest_log(manifest, manifest_json_path)
        _assert_ascii(self, output)
        _assert_no_empty_range_literals(self, output)
        _assert_checker_read_ahead_block(self, output)
        _assert_common_review_headings(self, output)
        _assert_epistemic_na(self, output)


class BuildPacketRendererTests(unittest.TestCase):
    def test_build_packet_produces_governed_markdown_structure(self) -> None:
        import tempfile

        with tempfile.TemporaryDirectory() as tmp:
            output_path = Path(tmp) / "CVF_TEST_PACKET_2026-03-07.md"
            content = build_packet(
                output=output_path,
                owner="test owner",
                packet_type="local release approval snapshot",
                version_token="v1.1.2",
                target_module="",
                local_only_constraints="not yet pushed",
                known_open_risks="none",
                decision="conditional local GO",
            )
            _assert_ascii(self, content)
            _assert_no_empty_range_literals(self, content)
            _assert_checker_read_ahead_block(self, content)
            _assert_common_review_headings(self, content)
            _assert_epistemic_na(self, content)

    def test_build_packet_latest_batch_title_is_ascii_and_no_empty_range(self) -> None:
        import tempfile

        with tempfile.TemporaryDirectory() as tmp:
            output_path = Path(tmp) / "CVF_TEST_PACKET_2026-03-07.md"
            content = build_packet(
                output=output_path,
                owner="test owner",
                packet_type="local release approval snapshot",
                version_token="v1.1.2",
                target_module="",
                local_only_constraints="not yet pushed",
                known_open_risks="none",
                decision="conditional local GO",
            )
            batch_line = next(line for line in content.splitlines() if line.startswith("- latest test log batch:"))
            _assert_ascii(self, batch_line)


if __name__ == "__main__":
    unittest.main()
