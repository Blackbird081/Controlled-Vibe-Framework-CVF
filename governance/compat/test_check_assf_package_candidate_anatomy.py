"""Tests for check_assf_package_candidate_anatomy.py."""

import json
import sys
import tempfile
import unittest
from pathlib import Path

_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

from check_assf_package_candidate_anatomy import check
from generate_assf_skill_index import generate_index


def _valid_entry(skill_id: str = "cvf-test-skill") -> dict:
    return {
        "registryOrder": 1,
        "skillId": skill_id,
        "name": "CVF Test Skill",
        "version": "0.1.0",
        "owner": "CVF test owner",
        "status": "CANDIDATE",
        "canonicalRoot": f"docs/reference/agent_system_skills/registry/entries/{skill_id}.json",
        "originLane": "TEST",
        "sourceArtifacts": ["docs/reviews/CVF_ASSF_TEST.md"],
        "legacyRows": [],
        "license": "CVF_PRIVATE_GOVERNED",
        "reviewArtifacts": [],
        "purpose": "Exercise package candidate anatomy.",
        "triggerPatterns": ["test trigger"],
        "taskClasses": ["test-task"],
        "useWhen": "Use for tests.",
        "doNotUseWhen": "Do not use outside tests.",
        "riskTriggers": [],
        "roles": ["reviewer"],
        "phases": ["REVIEWER_CLOSURE"],
        "surfaces": ["governance/compat"],
        "riskCeiling": "R0",
        "contextProfile": "test-profile",
        "inputs": ["test input"],
        "outputs": ["test output"],
        "executionConstraints": "metadata-only",
        "acceptanceEvidence": "unit tests",
        "riskProfile": "R0",
        "authorityCeiling": "metadata-only",
        "sideEffects": "none",
        "permissions": "read metadata",
        "rollback": "delete test entry",
        "safeStop": "stop on violation",
        "candidateState": "CANDIDATE",
        "approvalState": "AWAITING_REVIEW",
        "uatState": "NOT_STARTED",
        "certificationState": "NOT_STARTED",
        "deprecation": "none",
        "successor": "none",
        "retirement": "none",
        "dependencies": [],
        "conflicts": [],
        "compositionOrder": 1,
        "capabilityBoundary": "no runtime activation",
        "internalAgentDisposition": "CANDIDATE",
        "resolverBehavior": "metadata-only; resolver returns metadata only",
        "loaderBoundary": "loading this metadata never grants authority",
        "externalCliMcpDisposition": "DEFERRED_WITH_REASON",
        "adapterContract": "N/A with reason: no adapter in test",
        "adapterEvidence": "N/A with reason: no adapter implemented",
        "externalMutationBoundary": "no external mutation",
        "platformCompatibility": "cross-platform",
        "shellAssumptions": "none",
        "osConstraints": "none",
    }


def _write_entry(entries_dir: Path, entry: dict) -> None:
    (entries_dir / f"{entry['skillId']}.json").write_text(
        json.dumps(entry, indent=2, sort_keys=True),
        encoding="utf-8",
    )


class AssfPackageCandidateAnatomyTests(unittest.TestCase):
    def test_valid_candidate_entry_passes(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            entries_dir = root / "entries"
            entries_dir.mkdir()
            index_path = root / "skill-index.json"
            _write_entry(entries_dir, _valid_entry())
            generate_index(index_path, entries_dir)

            violations = check(index_path, entries_dir)

            self.assertEqual(violations, [])

    def test_missing_risk_triggers_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            entries_dir = root / "entries"
            entries_dir.mkdir()
            index_path = root / "skill-index.json"
            entry = _valid_entry()
            del entry["riskTriggers"]
            _write_entry(entries_dir, entry)
            generate_index(index_path, entries_dir)

            violations = check(index_path, entries_dir)

            self.assertTrue(any("missing required field riskTriggers" in v for v in violations))

    def test_candidate_status_requires_candidate_state(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            entries_dir = root / "entries"
            entries_dir.mkdir()
            index_path = root / "skill-index.json"
            entry = _valid_entry()
            entry["candidateState"] = "PROPOSED"
            _write_entry(entries_dir, entry)
            generate_index(index_path, entries_dir)

            violations = check(index_path, entries_dir)

            self.assertTrue(any("status CANDIDATE requires candidateState" in v for v in violations))

    def test_implemented_external_adapter_requires_evidence(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            entries_dir = root / "entries"
            entries_dir.mkdir()
            index_path = root / "skill-index.json"
            entry = _valid_entry()
            entry["externalCliMcpDisposition"] = "IMPLEMENTED"
            _write_entry(entries_dir, entry)
            generate_index(index_path, entries_dir)

            violations = check(index_path, entries_dir)

            self.assertTrue(any("adapterContract" in v for v in violations))
            self.assertTrue(any("adapterEvidence" in v for v in violations))

    def test_duplicate_registry_order_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            entries_dir = root / "entries"
            entries_dir.mkdir()
            index_path = root / "skill-index.json"
            first = _valid_entry("cvf-test-skill-a")
            second = _valid_entry("cvf-test-skill-b")
            second["registryOrder"] = first["registryOrder"]
            _write_entry(entries_dir, first)
            _write_entry(entries_dir, second)
            generate_index(index_path, entries_dir)

            violations = check(index_path, entries_dir)

            self.assertTrue(any("duplicate registryOrder" in v for v in violations))


if __name__ == "__main__":
    unittest.main()
