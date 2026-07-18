from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from governance.compat import check_kiod_runtime_candidate_reopen_inventory as checker


def _write(path: Path, data: object) -> None:
    path.write_text(json.dumps(data), encoding="utf-8")


class TestKiodRuntimeCandidateReopenInventory(unittest.TestCase):
    def _fixture(self, tmp: Path) -> tuple[Path, Path]:
        owner = tmp / "owner.md"
        owner.write_text("owner\n", encoding="utf-8")
        condition_by_candidate = {
            "D-file06": "operator needs live vector retrieval",
            "I-file19": "operator needs Learning Plane memory-index read",
        }
        decision_lines = [
            "# Decision",
            "",
            "## Reopen Conditions",
            "",
            "| Candidate | Reopen condition | Required evidence before reopening |",
            "| --- | --- | --- |",
        ]
        for candidate_id in sorted(condition_by_candidate):
            decision_lines.append(
                f"| {candidate_id} (label) | {condition_by_candidate[candidate_id]} | evidence |"
            )
        inventory = {
            "schemaVersion": "0.1.0",
            "inventoryId": "test",
            "status": "ACTIVE_REFERENCE",
            "date": "2026-07-02",
            "docType": "reference",
            "sourceAuthority": [str(owner)],
            "inventoryBoundary": {
                field: False for field in checker.REQUIRED_BOUNDARY_FALSE_FIELDS
            },
            "requiredCandidateIds": sorted(checker.REQUIRED_CANDIDATE_IDS),
            "candidateInventories": [
                {
                    "candidateId": candidate_id,
                    "gateStatus": "PARKED",
                    "conditionText": condition_by_candidate[candidate_id],
                    "owningArtifacts": [str(owner)],
                    "evidenceFields": ["evidence field"],
                    "requiredConditions": ["required condition"],
                    "forbiddenUntilGatePasses": ["forbidden item"],
                    "reproposalRule": "requires source-backed evidence",
                }
                for candidate_id in sorted(condition_by_candidate)
            ],
            "checkerCandidate": {"checkerPath": "governance/compat/check_kiod_runtime_candidate_reopen_inventory.py"},
            "publicExportDisposition": "DEFERRED_PRIVATE_ONLY",
            "claimBoundary": "bounded",
        }
        inventory_path = tmp / "inventory.json"
        decision_path = tmp / "decision.md"
        _write(inventory_path, inventory)
        decision_path.write_text("\n".join(decision_lines) + "\n", encoding="utf-8")
        return inventory_path, decision_path

    def test_valid_fixture_passes(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            paths = self._fixture(Path(tmp_dir))
            self.assertEqual(checker.validate_inventory(*paths), [])

    def test_missing_candidate_is_detected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            inventory_path, decision_path = self._fixture(Path(tmp_dir))
            inventory = json.loads(inventory_path.read_text(encoding="utf-8"))
            inventory["candidateInventories"] = inventory["candidateInventories"][:-1]
            _write(inventory_path, inventory)
            violations = checker.validate_inventory(inventory_path, decision_path)
            self.assertTrue(any("exactly D-file06 and I-file19" in item for item in violations))

    def test_condition_drift_is_detected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            inventory_path, decision_path = self._fixture(Path(tmp_dir))
            inventory = json.loads(inventory_path.read_text(encoding="utf-8"))
            inventory["candidateInventories"][0]["conditionText"] = "stale condition"
            _write(inventory_path, inventory)
            violations = checker.validate_inventory(inventory_path, decision_path)
            self.assertTrue(any("conditionText drifted" in item for item in violations))

    def test_condition_text_backtick_normalization_does_not_false_positive(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            inventory_path, decision_path = self._fixture(Path(tmp_dir))
            decision_text = decision_path.read_text(encoding="utf-8")
            decision_text = decision_text.replace(
                "operator needs live vector retrieval",
                "operator needs `live` vector retrieval",
            )
            decision_path.write_text(decision_text, encoding="utf-8")
            inventory = json.loads(inventory_path.read_text(encoding="utf-8"))
            for candidate in inventory["candidateInventories"]:
                if candidate["candidateId"] == "D-file06":
                    candidate["conditionText"] = "operator needs live vector retrieval"
            _write(inventory_path, inventory)
            violations = checker.validate_inventory(inventory_path, decision_path)
            self.assertFalse(any("conditionText drifted" in item for item in violations))

    def test_empty_evidence_fields_are_detected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            inventory_path, decision_path = self._fixture(Path(tmp_dir))
            inventory = json.loads(inventory_path.read_text(encoding="utf-8"))
            inventory["candidateInventories"][0]["evidenceFields"] = []
            _write(inventory_path, inventory)
            violations = checker.validate_inventory(inventory_path, decision_path)
            self.assertTrue(any("`evidenceFields` must be" in item for item in violations))

    def test_missing_owning_artifact_is_detected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            inventory_path, decision_path = self._fixture(Path(tmp_dir))
            inventory = json.loads(inventory_path.read_text(encoding="utf-8"))
            inventory["candidateInventories"][0]["owningArtifacts"] = ["does/not/exist.md"]
            _write(inventory_path, inventory)
            violations = checker.validate_inventory(inventory_path, decision_path)
            self.assertTrue(any("owning artifact does not exist" in item for item in violations))

    def test_boundary_flag_drift_is_detected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            inventory_path, decision_path = self._fixture(Path(tmp_dir))
            inventory = json.loads(inventory_path.read_text(encoding="utf-8"))
            inventory["inventoryBoundary"][checker.REQUIRED_BOUNDARY_FALSE_FIELDS[0]] = True
            _write(inventory_path, inventory)
            violations = checker.validate_inventory(inventory_path, decision_path)
            self.assertTrue(any("inventoryBoundary" in item for item in violations))

    def test_missing_claim_boundary_is_detected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            inventory_path, decision_path = self._fixture(Path(tmp_dir))
            inventory = json.loads(inventory_path.read_text(encoding="utf-8"))
            inventory["claimBoundary"] = ""
            _write(inventory_path, inventory)
            violations = checker.validate_inventory(inventory_path, decision_path)
            self.assertTrue(any("claimBoundary must be non-empty" in item for item in violations))


class TestKiodChangedDocReproposalScan(unittest.TestCase):
    def test_unsupported_reproposal_is_flagged(self) -> None:
        text = (
            "# Some Work Order\n\n"
            "We should implement D-file06 vector retrieval now to speed up memory lookup.\n"
        )
        flagged = checker._has_unsupported_reproposal(text)
        self.assertIn("D-file06", flagged)

    def test_parked_boundary_reference_is_not_flagged(self) -> None:
        text = (
            "# Some Review\n\n"
            "D-file06 remains a parked runtime candidate; this work order does not "
            "implement vector retrieval or any LanceDB behavior.\n"
        )
        flagged = checker._has_unsupported_reproposal(text)
        self.assertNotIn("D-file06", flagged)

    def test_source_backed_reproposal_evidence_is_not_flagged(self) -> None:
        text = (
            "# Fresh Runtime Roadmap\n\n"
            "Following a fresh operator decision and fresh GC-018, we will implement "
            "D-file06 vector retrieval after source verification and a proof plan citing "
            "KIOD-R10.\n"
        )
        flagged = checker._has_unsupported_reproposal(text)
        self.assertNotIn("D-file06", flagged)

    def test_kiod_r10_name_alone_does_not_exempt_reproposal(self) -> None:
        text = (
            "# Weak Runtime Roadmap\n\n"
            "KIOD-R10 mentioned D-file06. We will implement D-file06 vector "
            "retrieval now for memory lookup speed.\n"
        )
        flagged = checker._has_unsupported_reproposal(text)
        self.assertIn("D-file06", flagged)

    def test_reopen_condition_phrase_alone_does_not_exempt_reproposal(self) -> None:
        text = (
            "# Weak Runtime Roadmap\n\n"
            "The reopen condition is interesting. Proceed with I-file19 memory-index "
            "read implementation in this tranche.\n"
        )
        flagged = checker._has_unsupported_reproposal(text)
        self.assertIn("I-file19", flagged)

    def test_closure_only_reference_to_i_file19_is_not_flagged(self) -> None:
        text = (
            "# KIOD-R10 Closure\n\n"
            "I-file19 remains excluded runtime candidate; KIOD-R10 does not authorize "
            "Learning Plane runtime integration.\n"
        )
        flagged = checker._has_unsupported_reproposal(text)
        self.assertNotIn("I-file19", flagged)

    def test_check_changed_docs_scans_only_applicable_governed_paths(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp = Path(tmp_dir)
            applicable = tmp / "docs" / "reviews" / "sample.md"
            applicable.parent.mkdir(parents=True)
            applicable.write_text(
                "We should implement I-file19 memory-index read immediately.\n",
                encoding="utf-8",
            )
            not_applicable = tmp / "src" / "sample.py"
            not_applicable.parent.mkdir(parents=True)
            not_applicable.write_text("implement D-file06 now\n", encoding="utf-8")

            original_repo_root = checker.REPO_ROOT
            original_changed_files = checker._changed_files
            try:
                checker.REPO_ROOT = tmp
                checker._changed_files = lambda base, head: [
                    "docs/reviews/sample.md",
                    "src/sample.py",
                ]
                violations = checker.check_changed_docs(None, None)
            finally:
                checker.REPO_ROOT = original_repo_root
                checker._changed_files = original_changed_files

            self.assertTrue(any("docs/reviews/sample.md" in v for v in violations))
            self.assertFalse(any("src/sample.py" in v for v in violations))


if __name__ == "__main__":
    unittest.main()
