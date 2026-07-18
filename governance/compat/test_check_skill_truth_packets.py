"""Tests for check_skill_truth_packets.py."""

import json
import sys
import tempfile
import unittest
from pathlib import Path

_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

import check_skill_truth_packets as checker


HASH = "sha256:" + ("a" * 64)


def _registry_entry(skill_id: str = "skill-one") -> dict:
    return {
        "skillId": skill_id,
        "status": "APPROVED",
        "uatState": "PASSED",
        "certificationState": "CERTIFIED",
        "internalAgentDisposition": "IMPLEMENTED",
        "externalCliMcpDisposition": "DEFERRED_WITH_REASON",
        "canonicalRoot": f"docs/reference/agent_system_skills/packages/{skill_id}/SKILL.md",
    }


def _packet(root: Path, skill_id: str = "skill-one") -> dict:
    packet_path = (
        root
        / "docs"
        / "reference"
        / "agent_system_skills"
        / "truth"
        / "packets"
        / f"{skill_id}.json"
    )
    return {
        "schemaVersion": "0.1.0",
        "truthPacketId": f"SKSOT-T1-{skill_id}",
        "skillId": skill_id,
        "canonicalPacketPath": packet_path.relative_to(root).as_posix(),
        "registryEntryPath": f"docs/reference/agent_system_skills/registry/entries/{skill_id}.json",
        "packageRootPath": f"docs/reference/agent_system_skills/packages/{skill_id}/SKILL.md",
        "truthStatus": "approved",
        "verificationMode": "STRICT",
        "runtimeEligibility": "RUNTIME_PACKAGE_ELIGIBLE",
        "lifecycleSnapshot": {
            "status": "APPROVED",
            "uatState": "PASSED",
            "certificationState": "CERTIFIED",
            "internalAgentDisposition": "IMPLEMENTED",
            "externalCliMcpDisposition": "DEFERRED_WITH_REASON",
            "canonicalRoot": f"docs/reference/agent_system_skills/packages/{skill_id}/SKILL.md",
        },
        "authorityBoundary": "No ACTIVE resolver, provider call, public sync, or adapter authority.",
        "evidence": [
            {
                "evidenceId": "EV-REGISTRY",
                "kind": "registry_entry",
                "status": "approved",
                "sourcePath": f"docs/reference/agent_system_skills/registry/entries/{skill_id}.json",
            },
            {
                "evidenceId": "EV-PACKAGE",
                "kind": "package_root",
                "status": "approved",
                "sourcePath": f"docs/reference/agent_system_skills/packages/{skill_id}/SKILL.md",
            },
        ],
        "provenanceLabels": [
            {
                "claimId": "CLAIM-LIFECYCLE",
                "label": "MEASURED",
                "sourceEvidenceIds": ["EV-REGISTRY"],
            }
        ],
        "obligations": [
            {
                "obligationId": "OB-LIFECYCLE",
                "strength": "HARD",
                "state": "satisfied",
            }
        ],
        "verificationResults": [
            {
                "resultId": "VR-STRICT",
                "method": "schema",
                "status": "pass",
                "evidenceIds": ["EV-REGISTRY", "EV-PACKAGE"],
                "obligationIds": ["OB-LIFECYCLE"],
            }
        ],
        "receipt": {
            "receiptId": f"RCPT-{skill_id}",
            "status": "issued",
            "previousHash": None,
            "hash": HASH,
        },
    }


def _write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True), encoding="utf-8")


def _write_repo(root: Path, packet: dict, registry: dict | None = None) -> tuple[Path, Path, Path]:
    skill_id = packet["skillId"]
    packets_dir = root / "docs" / "reference" / "agent_system_skills" / "truth" / "packets"
    index_path = (
        root
        / "docs"
        / "reference"
        / "agent_system_skills"
        / "truth"
        / "generated"
        / "skill-truth-index.json"
    )
    registry_dir = root / "docs" / "reference" / "agent_system_skills" / "registry" / "entries"
    package_root = root / "docs" / "reference" / "agent_system_skills" / "packages" / skill_id / "SKILL.md"
    package_root.parent.mkdir(parents=True, exist_ok=True)
    package_root.write_text("# Skill\n", encoding="utf-8")
    _write_json(registry_dir / f"{skill_id}.json", registry or _registry_entry(skill_id))
    _write_json(packets_dir / f"{skill_id}.json", packet)
    _write_json(
        index_path,
        {
            "schemaVersion": "0.1.0",
            "generatedFrom": "docs/reference/agent_system_skills/truth/packets",
            "entries": [
                {
                    "canonicalPacketPath": packet["canonicalPacketPath"],
                    "receiptHash": packet["receipt"]["hash"],
                    "runtimeEligibility": packet["runtimeEligibility"],
                    "skillId": packet["skillId"],
                    "truthPacketId": packet["truthPacketId"],
                    "truthStatus": packet["truthStatus"],
                    "verificationMode": packet["verificationMode"],
                }
            ],
        },
    )
    return packets_dir, index_path, registry_dir


class SkillTruthPacketTests(unittest.TestCase):
    def test_valid_strict_packet_passes(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            packet = _packet(root)
            packets_dir, index_path, registry_dir = _write_repo(root, packet)

            checker.REPO_ROOT = root
            violations = checker.check(packets_dir, index_path, registry_dir)

            self.assertEqual(violations, [])

    def test_runtime_eligible_packet_allows_active_registry_status(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            packet = _packet(root)
            packet["lifecycleSnapshot"]["status"] = "ACTIVE"
            registry = _registry_entry()
            registry["status"] = "ACTIVE"
            packets_dir, index_path, registry_dir = _write_repo(root, packet, registry)

            checker.REPO_ROOT = root
            violations = checker.check(packets_dir, index_path, registry_dir)

            self.assertEqual(violations, [])

    def test_unknown_provenance_label_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            packet = _packet(root)
            packet["provenanceLabels"][0]["label"] = "MAYBE"
            packets_dir, index_path, registry_dir = _write_repo(root, packet)

            checker.REPO_ROOT = root
            violations = checker.check(packets_dir, index_path, registry_dir)

            self.assertTrue(any("provenance label" in item.message for item in violations))

    def test_strict_unapproved_evidence_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            packet = _packet(root)
            packet["evidence"][0]["status"] = "draft"
            packets_dir, index_path, registry_dir = _write_repo(root, packet)

            checker.REPO_ROOT = root
            violations = checker.check(packets_dir, index_path, registry_dir)

            self.assertTrue(any("approved evidence" in item.message for item in violations))

    def test_hard_obligation_must_be_satisfied(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            packet = _packet(root)
            packet["obligations"][0]["state"] = "open"
            packets_dir, index_path, registry_dir = _write_repo(root, packet)

            checker.REPO_ROOT = root
            violations = checker.check(packets_dir, index_path, registry_dir)

            self.assertTrue(any("satisfied HARD" in item.message for item in violations))

    def test_index_drift_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            packet = _packet(root)
            packets_dir, index_path, registry_dir = _write_repo(root, packet)
            index = json.loads(index_path.read_text(encoding="utf-8"))
            index["entries"][0]["truthStatus"] = "draft"
            index_path.write_text(json.dumps(index), encoding="utf-8")

            checker.REPO_ROOT = root
            violations = checker.check(packets_dir, index_path, registry_dir)

            self.assertTrue(any("generated truth index" in item.message for item in violations))

    def test_registry_lifecycle_mismatch_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            packet = _packet(root)
            registry = _registry_entry()
            registry["uatState"] = "NOT_STARTED"
            packets_dir, index_path, registry_dir = _write_repo(root, packet, registry)

            checker.REPO_ROOT = root
            violations = checker.check(packets_dir, index_path, registry_dir)

            self.assertTrue(any("uatState" in item.message for item in violations))


if __name__ == "__main__":
    unittest.main()
