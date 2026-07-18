"""
Focused tests for check_system_loop_interlock.py.

Covers FPC-T3-C03 expected-chain manifest comparison:
- eligible manifest rows must exist in the registry;
- expected status must match;
- expected automationLevel must match;
- non-mutating helper behavior stays file-read only.
"""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock


REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT))

from governance.compat import check_system_loop_interlock as checker


def _registry(
    *,
    status: str = "ACTIVE",
    automation: str = "STRUCTURAL_GUARDED",
    include_connection: bool = True,
) -> dict[str, object]:
    connections: list[dict[str, str]] = []
    if include_connection:
        connections.append(
            {
                "id": "expected-one",
                "status": status,
                "automationLevel": automation,
            }
        )
    return {"connections": connections}


def _manifest() -> dict[str, object]:
    return {
        "expectedChains": [
            {
                "candidateId": "FPC-T2-C01",
                "expectedRegistryId": "expected-one",
                "expectedStatus": "ACTIVE",
                "expectedAutomationLevel": "STRUCTURAL_GUARDED",
                "futureCheckerDisposition": "ELIGIBLE_FOR_EXPECTED_CHAIN_CHECK",
            }
        ]
    }


def _run(registry: dict[str, object]) -> list[str]:
    with tempfile.TemporaryDirectory() as tmp_dir:
        manifest_path = Path(tmp_dir) / "expected-chain-manifest.json"
        manifest_path.write_text(json.dumps(_manifest()), encoding="utf-8")
        with mock.patch.object(checker, "EXPECTED_CHAIN_MANIFEST_PATH", manifest_path):
            return checker._validate_expected_chain_manifest(registry)


class TestExpectedChainManifestComparison(unittest.TestCase):
    def test_matching_expected_chain_passes(self) -> None:
        self.assertEqual(_run(_registry()), [])

    def test_missing_expected_registry_id_is_detected(self) -> None:
        violations = _run(_registry(include_connection=False))
        self.assertTrue(any("expected registry id is missing" in item for item in violations))

    def test_status_mismatch_is_detected(self) -> None:
        violations = _run(_registry(status="PROPOSED"))
        self.assertTrue(any("status `ACTIVE`" in item for item in violations))

    def test_automation_level_mismatch_is_detected(self) -> None:
        violations = _run(_registry(automation="HUMAN_ROUTED"))
        self.assertTrue(any("automationLevel `STRUCTURAL_GUARDED`" in item for item in violations))


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
