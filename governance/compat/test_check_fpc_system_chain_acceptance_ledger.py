from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from governance.compat import check_fpc_system_chain_acceptance_ledger as checker


def _write(path: Path, data: object) -> None:
    path.write_text(json.dumps(data), encoding="utf-8")


def _closure(path: Path) -> None:
    path.write_text("Status: CLOSED_PASS_BOUNDED\n", encoding="utf-8")


class TestFpcSystemChainAcceptanceLedger(unittest.TestCase):
    def _fixture(self, tmp: Path) -> tuple[Path, Path, Path]:
        closure = tmp / "closure.md"
        evidence = tmp / "evidence.md"
        _closure(closure)
        evidence.write_text("evidence\n", encoding="utf-8")
        ledger = {
            "schemaVersion": "0.1.0",
            "ledgerId": "test",
            "status": "ACTIVE_REFERENCE",
            "acceptedClosureChain": [
                {
                    "trancheId": tranche,
                    "gapId": tranche,
                    "acceptanceLevel": "MACHINE_CHECKED_BOUNDED_ACCEPTED",
                    "materialCommit": checker.EXPECTED_MATERIAL_COMMITS[tranche],
                    "closureArtifact": str(closure),
                    "evidenceSurface": str(evidence),
                    "reopenCondition": "regression only",
                }
                for tranche in sorted(checker.REQUIRED_TRANCHE_IDS)
            ],
            "expectedRegistryIds": ["expected-one"],
            "downstreamReopenGates": [
                {
                    "laneId": lane,
                    "gateStatus": "PARKED",
                    "requiredConditions": ["fresh GC-018"],
                    "forbiddenUntilGatePasses": ["runtime work"],
                }
                for lane in sorted(checker.REQUIRED_DOWNSTREAM_LANES)
            ],
            "acceptanceVerdict": "FOUNDATION_SYSTEM_CHAIN_ACCEPTED_BOUNDED",
            "claimBoundary": "bounded",
        }
        registry = {
            "connections": [
                {
                    "id": "expected-one",
                    "status": "ACTIVE",
                    "automationLevel": "STRUCTURAL_GUARDED",
                }
            ]
        }
        manifest = {
            "expectedChains": [
                {
                    "expectedRegistryId": "expected-one",
                    "futureCheckerDisposition": "ELIGIBLE_FOR_EXPECTED_CHAIN_CHECK",
                }
            ]
        }
        ledger_path = tmp / "ledger.json"
        registry_path = tmp / "registry.json"
        manifest_path = tmp / "manifest.json"
        _write(ledger_path, ledger)
        _write(registry_path, registry)
        _write(manifest_path, manifest)
        return ledger_path, registry_path, manifest_path

    def test_valid_fixture_passes(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            paths = self._fixture(Path(tmp_dir))
            self.assertEqual(checker.validate_ledger(*paths), [])

    def test_missing_required_tranche_is_detected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            ledger_path, registry_path, manifest_path = self._fixture(Path(tmp_dir))
            ledger = json.loads(ledger_path.read_text(encoding="utf-8"))
            ledger["acceptedClosureChain"] = ledger["acceptedClosureChain"][:-1]
            _write(ledger_path, ledger)
            violations = checker.validate_ledger(ledger_path, registry_path, manifest_path)
            self.assertTrue(any("missing required tranche ids" in item for item in violations))

    def test_manifest_mismatch_is_detected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            ledger_path, registry_path, manifest_path = self._fixture(Path(tmp_dir))
            manifest = {
                "expectedChains": [
                    {
                        "expectedRegistryId": "different",
                        "futureCheckerDisposition": "ELIGIBLE_FOR_EXPECTED_CHAIN_CHECK",
                    }
                ]
            }
            _write(manifest_path, manifest)
            violations = checker.validate_ledger(ledger_path, registry_path, manifest_path)
            self.assertTrue(any("must match eligible manifest ids" in item for item in violations))

    def test_open_downstream_gate_is_detected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            ledger_path, registry_path, manifest_path = self._fixture(Path(tmp_dir))
            ledger = json.loads(ledger_path.read_text(encoding="utf-8"))
            ledger["downstreamReopenGates"][0]["gateStatus"] = "OPEN"
            _write(ledger_path, ledger)
            violations = checker.validate_ledger(ledger_path, registry_path, manifest_path)
            self.assertTrue(any("gateStatus must remain PARKED" in item for item in violations))

    def test_stale_material_carrier_is_detected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            ledger_path, registry_path, manifest_path = self._fixture(Path(tmp_dir))
            ledger = json.loads(ledger_path.read_text(encoding="utf-8"))
            ledger["acceptedClosureChain"][0]["materialCommit"] = "62a76d05"
            _write(ledger_path, ledger)
            violations = checker.validate_ledger(ledger_path, registry_path, manifest_path)
            self.assertTrue(any("current provenance carrier" in item for item in violations))


if __name__ == "__main__":
    unittest.main()
