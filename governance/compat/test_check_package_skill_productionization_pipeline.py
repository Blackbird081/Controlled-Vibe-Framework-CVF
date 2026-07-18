"""Tests for check_package_skill_productionization_pipeline.py."""

import json
import sys
import tempfile
import unittest
from pathlib import Path

_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

import check_package_skill_productionization_pipeline as checker
from generate_assf_skill_index import generate_index


HASH = "sha256:" + ("b" * 64)


def _entry(skill_id: str = "cvf-test-package", status: str = "CANDIDATE") -> dict:
    package_root = f"docs/reference/agent_system_skills/packages/{skill_id}/SKILL.md"
    canonical = (
        package_root
        if status in {"PROPOSED", "APPROVED", "ACTIVE"}
        else f"docs/reference/agent_system_skills/registry/entries/{skill_id}.json"
    )
    return {
        "registryOrder": 1,
        "skillId": skill_id,
        "name": "CVF Test Package",
        "version": "0.1.0",
        "owner": "CVF test owner",
        "status": status,
        "canonicalRoot": canonical,
        "originLane": "TEST",
        "sourceArtifacts": ["docs/reviews/CVF_TEST_SOURCE_REVIEW.md"],
        "legacyRows": [],
        "license": "CVF_PRIVATE_GOVERNED",
        "reviewArtifacts": ["docs/reviews/CVF_TEST_SOURCE_REVIEW.md"],
        "purpose": "Test package pipeline.",
        "triggerPatterns": ["test"],
        "taskClasses": ["test"],
        "useWhen": "Use in tests.",
        "doNotUseWhen": "Do not use outside tests.",
        "riskTriggers": [],
        "roles": ["worker"],
        "phases": ["WORKER_EXECUTION"],
        "surfaces": ["governance/compat"],
        "riskCeiling": "R0",
        "contextProfile": "test",
        "inputs": ["input"],
        "outputs": ["output"],
        "executionConstraints": "metadata-only",
        "acceptanceEvidence": "tests",
        "riskProfile": "R0",
        "authorityCeiling": "advisory",
        "sideEffects": "none",
        "permissions": "read metadata",
        "rollback": "delete test files",
        "safeStop": "stop",
        "candidateState": status,
        "approvalState": "APPROVED" if status in {"APPROVED", "ACTIVE"} else "AWAITING_REVIEW",
        "uatState": "PASSED" if status in {"APPROVED", "ACTIVE"} else "NOT_STARTED",
        "certificationState": "CERTIFIED" if status in {"APPROVED", "ACTIVE"} else "NOT_STARTED",
        "deprecation": "none",
        "successor": "none",
        "retirement": "none",
        "dependencies": [],
        "conflicts": [],
        "compositionOrder": 1,
        "capabilityBoundary": "no action authority",
        "internalAgentDisposition": "IMPLEMENTED" if status in {"APPROVED", "ACTIVE"} else "CANDIDATE",
        "resolverBehavior": "metadata-only",
        "loaderBoundary": "loading this metadata never grants authority",
        "externalCliMcpDisposition": "IMPLEMENTED" if status == "ACTIVE" else "DEFERRED_WITH_REASON",
        "adapterContract": (
            "docs/reference/agent_system_skills/CVF_ASSF_PRODUCTION_PACKAGE_RUNTIME_STANDARD.md"
            if status == "ACTIVE"
            else "N/A with reason: no adapter"
        ),
        "adapterEvidence": (
            "docs/reviews/CVF_TEST_SOURCE_REVIEW.md"
            if status == "ACTIVE"
            else "N/A with reason: no adapter"
        ),
        "externalMutationBoundary": "no external mutation",
        "platformCompatibility": "cross-platform",
        "shellAssumptions": "none",
        "osConstraints": "none",
    }


def _package_source(skill_id: str, state: str) -> dict:
    return {
        "skillId": skill_id,
        "lifecycleState": state,
        "uatState": "PASSED" if state in {"APPROVED", "ACTIVE"} else "NOT_STARTED",
        "certificationState": "CERTIFIED" if state in {"APPROVED", "ACTIVE"} else "NOT_STARTED",
        "internalAgentDisposition": "IMPLEMENTED" if state in {"APPROVED", "ACTIVE"} else "CANDIDATE",
        "externalCliMcpDisposition": "IMPLEMENTED" if state == "ACTIVE" else "DEFERRED_WITH_REASON",
    }


def _truth_packet(root: Path, skill_id: str) -> dict:
    packet_path = root / "docs/reference/agent_system_skills/truth/packets" / f"{skill_id}.json"
    return {
        "truthPacketId": f"TRUTH-{skill_id}",
        "skillId": skill_id,
        "canonicalPacketPath": packet_path.relative_to(root).as_posix(),
        "truthStatus": "approved",
        "verificationMode": "STRICT",
        "runtimeEligibility": "RUNTIME_PACKAGE_ELIGIBLE",
    }


def _write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True), encoding="utf-8")


def _write_repo(root: Path, entry: dict, with_truth: bool = False) -> tuple[Path, Path, Path, Path]:
    skill_id = entry["skillId"]
    (root / "docs/reviews").mkdir(parents=True, exist_ok=True)
    (root / "docs/reviews/CVF_TEST_SOURCE_REVIEW.md").write_text("# Review\n", encoding="utf-8")
    (root / "docs/reference/agent_system_skills").mkdir(parents=True, exist_ok=True)
    (root / "docs/reference/agent_system_skills/CVF_ASSF_PRODUCTION_PACKAGE_RUNTIME_STANDARD.md").write_text(
        "# Standard\n",
        encoding="utf-8",
    )
    entries_dir = root / "docs/reference/agent_system_skills/registry/entries"
    index_path = root / "docs/reference/agent_system_skills/generated/skill-index.json"
    truth_packets = root / "docs/reference/agent_system_skills/truth/packets"
    truth_index = root / "docs/reference/agent_system_skills/truth/generated/skill-truth-index.json"
    _write_json(entries_dir / f"{skill_id}.json", entry)
    if entry["status"] in {"PROPOSED", "APPROVED", "ACTIVE"}:
        package_dir = root / "docs/reference/agent_system_skills/packages" / skill_id
        package_dir.mkdir(parents=True, exist_ok=True)
        (package_dir / "SKILL.md").write_text("# Skill\n", encoding="utf-8")
        _write_json(package_dir / "skill.source.json", _package_source(skill_id, entry["status"]))
    generate_index(index_path, entries_dir)
    truth_index.parent.mkdir(parents=True, exist_ok=True)
    if with_truth:
        packet = _truth_packet(root, skill_id)
        _write_json(truth_packets / f"{skill_id}.json", packet)
        _write_json(
            truth_index,
            {
                "entries": [
                    {
                        "canonicalPacketPath": packet["canonicalPacketPath"],
                        "skillId": skill_id,
                    }
                ]
            },
        )
    else:
        _write_json(truth_index, {"entries": []})
    return entries_dir, index_path, truth_packets, truth_index


class PackageSkillProductionizationPipelineTests(unittest.TestCase):
    def test_candidate_passes_with_source_artifact(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            entries_dir, index_path, truth_packets, truth_index = _write_repo(root, _entry())

            violations, _ = checker.check(
                base="HEAD",
                head="HEAD",
                repo_root=root,
                entries_dir=entries_dir,
                index_path=index_path,
                truth_packets_dir=truth_packets,
                truth_index_path=truth_index,
            )

            self.assertEqual(violations, [])

    def test_proposed_missing_package_source_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            entry = _entry(status="PROPOSED")
            entries_dir, index_path, truth_packets, truth_index = _write_repo(root, entry)
            (root / "docs/reference/agent_system_skills/packages/cvf-test-package/skill.source.json").unlink()

            violations = checker._check_lifecycle_snapshot(entries_dir, index_path, root, truth_packets, truth_index)

            self.assertTrue(any("skill.source.json" in item.message for item in violations))

    def test_active_missing_truth_packet_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            entries_dir, index_path, truth_packets, truth_index = _write_repo(root, _entry(status="ACTIVE"))

            violations = checker._check_lifecycle_snapshot(entries_dir, index_path, root, truth_packets, truth_index)

            self.assertTrue(any("truth packet" in item.message for item in violations))

    def test_active_with_truth_packet_passes(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            entries_dir, index_path, truth_packets, truth_index = _write_repo(
                root,
                _entry(status="ACTIVE"),
                with_truth=True,
            )

            violations = checker._check_lifecycle_snapshot(entries_dir, index_path, root, truth_packets, truth_index)

            self.assertEqual(violations, [])

    def test_changed_package_artifact_requires_control_block(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            path = root / "docs/work_orders/CVF_AGENT_WORK_ORDER_TEST.md"
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text("This package skill work order mutates ASSF package state.\n", encoding="utf-8")

            violations = checker._check_changed_artifacts(
                {"docs/work_orders/CVF_AGENT_WORK_ORDER_TEST.md": ["A"]},
                root,
            )

            self.assertTrue(any("Control Block" in item.message for item in violations))

    def test_changed_package_artifact_with_control_block_passes(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            path = root / "docs/work_orders/CVF_AGENT_WORK_ORDER_TEST.md"
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(
                "\n".join(
                    [
                        "This package skill work order mutates ASSF package state.",
                        "",
                        "## Package Skill Productionization Control Block",
                        "",
                        "- SOP source: docs/reference/agent_system_skills/CVF_PACKAGE_SKILL_PRODUCTIONIZATION_SOP.md",
                        "- Current phase: P3 ASSF metadata candidate",
                        "- Target lifecycle state: CANDIDATE",
                        "- Prior phase evidence: source authority ready",
                        "- Next forbidden skip: no package root or ACTIVE jump",
                        "- Runtime/provider proof: N/A with reason: no runtime claim",
                        "- Claim boundary: package metadata only",
                    ]
                ),
                encoding="utf-8",
            )

            violations = checker._check_changed_artifacts(
                {"docs/work_orders/CVF_AGENT_WORK_ORDER_TEST.md": ["A"]},
                root,
            )

            self.assertEqual(violations, [])


if __name__ == "__main__":
    unittest.main()
