"""Focused tests for run_assf_runtime_eligibility_audit.py."""

from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().with_name("run_assf_runtime_eligibility_audit.py")
SPEC = importlib.util.spec_from_file_location(
    "run_assf_runtime_eligibility_audit", MODULE_PATH
)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


def _entry(
    skill_id: str,
    *,
    status: str = "PROPOSED",
    certification_state: str = "NOT_STARTED",
    uat_state: str = "NOT_STARTED",
    internal_disposition: str = "CANDIDATE",
    canonical_root: str | None = None,
) -> dict:
    root = (
        canonical_root
        or f"docs/reference/agent_system_skills/packages/{skill_id}/SKILL.md"
    )
    return {
        "approvalState": "AWAITING_REVIEW",
        "authorityCeiling": "read-only package guidance",
        "candidateState": status,
        "canonicalRoot": root,
        "capabilityBoundary": "no authority expansion",
        "certificationState": certification_state,
        "compositionOrder": 1,
        "doNotUseWhen": "do not use outside tests",
        "externalCliMcpDisposition": "DEFERRED_WITH_REASON",
        "internalAgentDisposition": internal_disposition,
        "name": f"Skill {skill_id}",
        "phases": ["WORKER_EXECUTION"],
        "riskCeiling": "R0",
        "riskProfile": "R0",
        "roles": ["worker"],
        "skillId": skill_id,
        "status": status,
        "surfaces": ["docs/reference/agent_system_skills/packages"],
        "taskClasses": ["worker-execution"],
        "uatState": uat_state,
        "useWhen": "use when testing",
        "version": "0.1.0",
    }


def _write_index(root: Path, entries: list[dict]) -> Path:
    index_path = root / "skill-index.json"
    index_path.write_text(
        json.dumps({"claimBoundary": "metadata-only", "skills": entries}, indent=2),
        encoding="utf-8",
    )
    return index_path


def _write_skill_body(root: Path, skill_id: str) -> None:
    skill_path = (
        root
        / "docs"
        / "reference"
        / "agent_system_skills"
        / "packages"
        / skill_id
        / "SKILL.md"
    )
    skill_path.parent.mkdir(parents=True, exist_ok=True)
    skill_path.write_text("# Eligible Skill\n", encoding="utf-8")


class RuntimeEligibilityAuditTests(unittest.TestCase):
    def test_audit_summarizes_runtime_gate_reasons(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_skill_body(root, "eligible")
            index_path = _write_index(
                root,
                [
                    _entry(
                        "eligible",
                        certification_state="CERTIFIED",
                        uat_state="PASSED",
                        internal_disposition="IMPLEMENTED",
                    ),
                    _entry("blocked"),
                ],
            )
            audit = MODULE.build_runtime_eligibility_audit(
                index_path=index_path,
                repo_root=root,
            ).to_dict()

        self.assertEqual(audit["runtimeEligibleCount"], 1)
        self.assertEqual(audit["runtimeIneligibleCount"], 1)
        self.assertEqual(audit["readyForBodyLoad"], ["eligible"])
        self.assertEqual(audit["ineligibilityReasonCounts"]["UAT_NOT_PASSED"], 1)
        self.assertEqual(
            audit["ineligibilityReasonCounts"]["CERTIFICATION_NOT_CERTIFIED"], 1
        )
        self.assertFalse(audit["instructionBodiesRequested"])

    def test_package_roots_only_filters_registry_rooted_entries(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            index_path = _write_index(
                root,
                [
                    _entry("package-root"),
                    _entry(
                        "registry-root",
                        canonical_root=(
                            "docs/reference/agent_system_skills/registry/entries/"
                            "registry-root.json"
                        ),
                    ),
                ],
            )
            audit = MODULE.build_runtime_eligibility_audit(
                index_path=index_path,
                repo_root=root,
                package_roots_only=True,
            ).to_dict()

        self.assertTrue(audit["packageRootsOnly"])
        self.assertEqual(audit["returnedRecords"], 1)
        self.assertEqual(audit["packageRootCounts"], {"PACKAGE_ROOT": 1})
        self.assertEqual(audit["blockedPackageRoots"][0]["skillId"], "package-root")

    def test_claim_boundary_denies_activation_and_adapters(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            audit = MODULE.build_runtime_eligibility_audit(
                index_path=_write_index(root, [_entry("blocked")]),
                repo_root=root,
            ).to_dict()

        boundary = audit["claimBoundary"]
        self.assertIn("does not request instruction bodies", boundary)
        self.assertIn("activate packages", boundary)
        self.assertIn("implement CLI/MCP adapter behavior", boundary)


if __name__ == "__main__":
    unittest.main()
