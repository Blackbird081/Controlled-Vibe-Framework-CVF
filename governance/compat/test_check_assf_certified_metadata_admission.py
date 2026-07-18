"""Tests for check_assf_certified_metadata_admission.py."""

import json
import sys
import tempfile
import unittest
from pathlib import Path

_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

from check_assf_certified_metadata_admission import check
from generate_assf_skill_index import generate_index


def _certified_entry(skill_id: str = "skill-certified") -> dict:
    return {
        "registryOrder": 1,
        "skillId": skill_id,
        "name": skill_id,
        "status": "CANDIDATE",
        "reviewArtifacts": [
            "docs/reviews/CVF_ASSF_TEST_REVIEW_ARTIFACT.md",
        ],
        "uatState": "PASSED",
        "certificationState": "CERTIFIED",
        "internalAgentDisposition": "IMPLEMENTED",
        "resolverBehavior": "metadata-only; no instruction body opened",
        "loaderBoundary": "loading this metadata never grants authority",
        "externalCliMcpDisposition": "DEFERRED_WITH_REASON",
        "adapterContract": (
            "N/A with reason: external CLI/MCP adapter not authored"
        ),
        "adapterEvidence": "N/A with reason: no adapter implemented",
        "externalMutationBoundary": "no external mutation permitted",
    }


def _write_entry(entries_dir: Path, entry: dict) -> None:
    (entries_dir / f"{entry['skillId']}.json").write_text(
        json.dumps(entry, indent=2, sort_keys=True),
        encoding="utf-8",
    )


def _make_repo(root: Path) -> tuple[Path, Path]:
    entries_dir = root / "entries"
    entries_dir.mkdir()
    index_path = root / "skill-index.json"
    review_dir = root / "docs" / "reviews"
    review_dir.mkdir(parents=True)
    (review_dir / "CVF_ASSF_TEST_REVIEW_ARTIFACT.md").write_text(
        "# Review\n",
        encoding="utf-8",
    )
    return entries_dir, index_path


class CertifiedMetadataAdmissionTests(unittest.TestCase):
    def test_certified_entry_passes_when_metadata_is_bounded(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            entries_dir, index_path = _make_repo(root)
            _write_entry(entries_dir, _certified_entry())
            generate_index(index_path, entries_dir)

            violations = check(
                index_path,
                entries_dir,
                repo_root=root,
                require_certified=True,
            )

            self.assertEqual(violations, [])

    def test_certified_requires_uat_passed(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            entries_dir, index_path = _make_repo(root)
            entry = _certified_entry()
            entry["uatState"] = "NOT_STARTED"
            _write_entry(entries_dir, entry)
            generate_index(index_path, entries_dir)

            violations = check(index_path, entries_dir, repo_root=root)

            self.assertTrue(any("uatState PASSED" in v for v in violations))

    def test_certified_requires_existing_review_artifact(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            entries_dir, index_path = _make_repo(root)
            entry = _certified_entry()
            entry["reviewArtifacts"] = ["docs/reviews/MISSING.md"]
            _write_entry(entries_dir, entry)
            generate_index(index_path, entries_dir)

            violations = check(index_path, entries_dir, repo_root=root)

            self.assertTrue(any("does not exist" in v for v in violations))

    def test_generated_index_lifecycle_mismatch_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            entries_dir, index_path = _make_repo(root)
            _write_entry(entries_dir, _certified_entry())
            generate_index(index_path, entries_dir)
            current = json.loads(index_path.read_text(encoding="utf-8"))
            current["skills"][0]["uatState"] = "NOT_STARTED"
            index_path.write_text(json.dumps(current), encoding="utf-8")

            violations = check(index_path, entries_dir, repo_root=root)

            self.assertTrue(any("drifted" in v for v in violations))

    def test_implemented_adapter_requires_contract_and_evidence(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            entries_dir, index_path = _make_repo(root)
            entry = _certified_entry()
            entry["externalCliMcpDisposition"] = "IMPLEMENTED"
            _write_entry(entries_dir, entry)
            generate_index(index_path, entries_dir)

            violations = check(index_path, entries_dir, repo_root=root)

            self.assertTrue(any("adapterContract" in v for v in violations))
            self.assertTrue(any("adapterEvidence" in v for v in violations))

    def test_active_certified_entry_requires_concrete_adapter_evidence(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            entries_dir, index_path = _make_repo(root)
            entry = _certified_entry()
            entry["status"] = "ACTIVE"
            entry["candidateState"] = "ACTIVE"
            entry["externalCliMcpDisposition"] = "IMPLEMENTED"
            _write_entry(entries_dir, entry)
            generate_index(index_path, entries_dir)

            violations = check(index_path, entries_dir, repo_root=root)

            self.assertTrue(any("concrete adapterContract" in v for v in violations))
            self.assertTrue(any("concrete adapterEvidence" in v for v in violations))

    def test_active_certified_entry_passes_with_concrete_adapter_evidence(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            entries_dir, index_path = _make_repo(root)
            entry = _certified_entry()
            entry["status"] = "ACTIVE"
            entry["candidateState"] = "ACTIVE"
            entry["externalCliMcpDisposition"] = "IMPLEMENTED"
            entry["adapterContract"] = "docs/reference/agent_system_skills/CVF_ASSF_PRODUCTION_PACKAGE_RUNTIME_STANDARD.md"
            entry["adapterEvidence"] = "docs/reviews/CVF_ASSF_TEST_REVIEW_ARTIFACT.md"
            _write_entry(entries_dir, entry)
            generate_index(index_path, entries_dir)

            violations = check(index_path, entries_dir, repo_root=root)

            self.assertEqual(violations, [])

    def test_require_certified_fails_when_none_present(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            entries_dir, index_path = _make_repo(root)
            entry = _certified_entry("skill-candidate")
            entry["certificationState"] = "NOT_STARTED"
            entry["uatState"] = "NOT_STARTED"
            _write_entry(entries_dir, entry)
            generate_index(index_path, entries_dir)

            violations = check(
                index_path,
                entries_dir,
                repo_root=root,
                require_certified=True,
            )

            self.assertTrue(any("no ASSF registry entry" in v for v in violations))


if __name__ == "__main__":
    unittest.main()
