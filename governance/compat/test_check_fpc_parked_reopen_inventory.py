from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from governance.compat import check_fpc_parked_reopen_inventory as checker


def _write(path: Path, data: object) -> None:
    path.write_text(json.dumps(data), encoding="utf-8")


class TestFpcParkedReopenInventory(unittest.TestCase):
    def _fixture(self, tmp: Path) -> tuple[Path, Path, Path]:
        owner = tmp / "owner.md"
        owner.write_text("owner\n", encoding="utf-8")
        condition_by_lane = {
            "MPI-T6-runtime": "fresh GC-018 proves an operator-stated product requirement explicitly needs the MPI lane itself and current MPI contract/helper/durable surfaces are insufficient",
            "runtime-provider-live": "fresh GC-018 proves a concrete runtime governance behavior claim needs live proof, with secret-safe diagnostics and quota/provider failure classification",
            "use-case-adapter-public": "fresh GC-018 proves a concrete adapter behavior or public-surface gap remains after UAP-T2, cites owner source files, and includes public/provenance boundary evidence",
        }
        ledger = {
            "downstreamReopenGates": [
                {
                    "laneId": lane_id,
                    "gateStatus": "PARKED",
                    "requiredConditions": [f"{lane_id} required"],
                    "forbiddenUntilGatePasses": [f"{lane_id} forbidden"],
                }
                for lane_id in sorted(checker.REQUIRED_LANE_IDS)
            ]
        }
        inventory = {
            "schemaVersion": "0.1.0",
            "inventoryId": "test",
            "status": "ACTIVE_REFERENCE",
            "sourceAuthority": [str(owner)],
            "inventoryBoundary": {
                field: False for field in checker.REQUIRED_BOUNDARY_FALSE_FIELDS
            },
            "requiredLaneIds": sorted(checker.REQUIRED_LANE_IDS),
            "laneInventories": [
                {
                    "laneId": gate["laneId"],
                    "gateStatus": "PARKED",
                    "conditionText": condition_by_lane[gate["laneId"]],
                    "owningArtifacts": [str(owner)],
                    "evidenceFields": ["evidence field"],
                    "requiredConditions": gate["requiredConditions"],
                    "forbiddenUntilGatePasses": gate["forbiddenUntilGatePasses"],
                    "reproposalRule": "requires source-backed evidence",
                }
                for gate in ledger["downstreamReopenGates"]
            ],
            "checkerCandidate": {"nextTranche": "FPC-PRG-T2"},
            "claimBoundary": "bounded",
        }
        dsd_lines = [
            "# DSD",
            "",
            "## Reopen Conditions",
            "",
            "| Lane | Required condition before re-proposal |",
            "|---|---|",
        ]
        for lane_id in sorted(condition_by_lane):
            dsd_lines.append(f"| `{lane_id}` | {condition_by_lane[lane_id]} |")
        inventory_path = tmp / "inventory.json"
        ledger_path = tmp / "ledger.json"
        dsd_path = tmp / "dsd.md"
        _write(inventory_path, inventory)
        _write(ledger_path, ledger)
        dsd_path.write_text("\n".join(dsd_lines) + "\n", encoding="utf-8")
        return inventory_path, ledger_path, dsd_path

    def test_valid_fixture_passes(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            paths = self._fixture(Path(tmp_dir))
            self.assertEqual(checker.validate_inventory(*paths), [])

    def test_missing_lane_is_detected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            inventory_path, ledger_path, dsd_path = self._fixture(Path(tmp_dir))
            inventory = json.loads(inventory_path.read_text(encoding="utf-8"))
            inventory["laneInventories"] = inventory["laneInventories"][:-1]
            _write(inventory_path, inventory)
            violations = checker.validate_inventory(inventory_path, ledger_path, dsd_path)
            self.assertTrue(any("exactly parked lane ids" in item for item in violations))

    def test_condition_drift_is_detected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            inventory_path, ledger_path, dsd_path = self._fixture(Path(tmp_dir))
            inventory = json.loads(inventory_path.read_text(encoding="utf-8"))
            inventory["laneInventories"][0]["conditionText"] = "stale"
            _write(inventory_path, inventory)
            violations = checker.validate_inventory(inventory_path, ledger_path, dsd_path)
            self.assertTrue(any("conditionText drifted" in item for item in violations))

    def test_required_condition_drift_is_detected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            inventory_path, ledger_path, dsd_path = self._fixture(Path(tmp_dir))
            inventory = json.loads(inventory_path.read_text(encoding="utf-8"))
            inventory["laneInventories"][0]["requiredConditions"] = ["different"]
            _write(inventory_path, inventory)
            violations = checker.validate_inventory(inventory_path, ledger_path, dsd_path)
            self.assertTrue(any("requiredConditions drifted" in item for item in violations))

    def test_wrong_lane_id_is_detected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            inventory_path, ledger_path, dsd_path = self._fixture(Path(tmp_dir))
            inventory = json.loads(inventory_path.read_text(encoding="utf-8"))
            inventory["laneInventories"][0]["laneId"] = "unrecorded-lane"
            _write(inventory_path, inventory)
            violations = checker.validate_inventory(inventory_path, ledger_path, dsd_path)
            self.assertTrue(any("exactly parked lane ids" in item for item in violations))

    def test_empty_evidence_fields_are_detected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            inventory_path, ledger_path, dsd_path = self._fixture(Path(tmp_dir))
            inventory = json.loads(inventory_path.read_text(encoding="utf-8"))
            inventory["laneInventories"][0]["evidenceFields"] = []
            _write(inventory_path, inventory)
            violations = checker.validate_inventory(inventory_path, ledger_path, dsd_path)
            self.assertTrue(any("`evidenceFields` must be" in item for item in violations))

    def test_boundary_flag_drift_is_detected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            inventory_path, ledger_path, dsd_path = self._fixture(Path(tmp_dir))
            inventory = json.loads(inventory_path.read_text(encoding="utf-8"))
            inventory["inventoryBoundary"][checker.REQUIRED_BOUNDARY_FALSE_FIELDS[0]] = True
            _write(inventory_path, inventory)
            violations = checker.validate_inventory(inventory_path, ledger_path, dsd_path)
            self.assertTrue(any("inventoryBoundary" in item for item in violations))

    def test_forbidden_list_drift_is_detected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            inventory_path, ledger_path, dsd_path = self._fixture(Path(tmp_dir))
            inventory = json.loads(inventory_path.read_text(encoding="utf-8"))
            inventory["laneInventories"][0]["forbiddenUntilGatePasses"] = ["different"]
            _write(inventory_path, inventory)
            violations = checker.validate_inventory(inventory_path, ledger_path, dsd_path)
            self.assertTrue(any("forbiddenUntilGatePasses drifted" in item for item in violations))


if __name__ == "__main__":
    unittest.main()
