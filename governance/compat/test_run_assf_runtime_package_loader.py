"""Focused tests for run_assf_runtime_package_loader.py."""

from __future__ import annotations

import builtins
import contextlib
import io
import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().with_name("run_assf_runtime_package_loader.py")
SPEC = importlib.util.spec_from_file_location(
    "run_assf_runtime_package_loader", MODULE_PATH
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
    internal_disposition: str = "CONTRACT_ONLY",
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


def _write_skill_body(root: Path, skill_id: str, body: str = "# Runtime Skill") -> None:
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
    skill_path.write_text(body, encoding="utf-8")


class RuntimePackageLoaderTests(unittest.TestCase):
    def test_metadata_only_readout_does_not_open_instruction_body(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_skill_body(root, "eligible-skill")
            index_path = _write_index(
                root,
                [
                    _entry(
                        "eligible-skill",
                        certification_state="CERTIFIED",
                        uat_state="PASSED",
                        internal_disposition="IMPLEMENTED",
                    )
                ],
            )
            original_open = builtins.open

            def guarded_open(file, mode="r", *args, **kwargs):
                if str(file).endswith("SKILL.md"):
                    raise AssertionError(f"instruction body opened: {file}")
                return original_open(file, mode, *args, **kwargs)

            with patch("builtins.open", side_effect=guarded_open):
                packet = MODULE.build_runtime_package_packet(
                    index_path=index_path,
                    repo_root=root,
                )

        item = packet.to_dict()["items"][0]
        self.assertTrue(item["runtimeEligible"])
        self.assertEqual(item["packageBodyDisposition"], "NOT_REQUESTED")
        self.assertNotIn("instructionBody", item)

    def test_include_instruction_bodies_loads_only_eligible_package(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_skill_body(root, "eligible-skill", "# Eligible Skill\n")
            index_path = _write_index(
                root,
                [
                    _entry(
                        "eligible-skill",
                        certification_state="CERTIFIED",
                        uat_state="PASSED",
                        internal_disposition="IMPLEMENTED",
                    )
                ],
            )
            packet = MODULE.build_runtime_package_packet(
                index_path=index_path,
                repo_root=root,
                include_instruction_bodies=True,
            )

        item = packet.to_dict()["items"][0]
        self.assertTrue(item["runtimeEligible"])
        self.assertEqual(item["packageBodyDisposition"], "LOADED")
        self.assertEqual(item["instructionBody"], "# Eligible Skill\n")
        self.assertEqual(len(packet.to_dict()["skillUsageReceipts"]), 1)
        receipt = item["skillUsageReceipt"]
        self.assertEqual(receipt["receiptType"], "CVF_ASSF_SKILL_USAGE_RECEIPT")
        self.assertEqual(receipt["skillId"], "eligible-skill")
        self.assertEqual(receipt["packageBodyDisposition"], "LOADED")
        self.assertTrue(receipt["bodyHash"].startswith("sha256:"))
        self.assertIn("does not grant authority", receipt["authorityBoundary"])

    def test_include_instruction_bodies_denies_proposed_package(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_skill_body(root, "proposed-skill")
            index_path = _write_index(root, [_entry("proposed-skill")])
            packet = MODULE.build_runtime_package_packet(
                index_path=index_path,
                repo_root=root,
                include_instruction_bodies=True,
            )

        item = packet.to_dict()["items"][0]
        self.assertFalse(item["runtimeEligible"])
        self.assertEqual(item["packageBodyDisposition"], "NOT_RUNTIME_ELIGIBLE")
        self.assertIn("CERTIFICATION_NOT_CERTIFIED", item["ineligibilityReasons"])
        self.assertIn("UAT_NOT_PASSED", item["ineligibilityReasons"])
        self.assertIn(
            "INTERNAL_DISPOSITION_NOT_IMPLEMENTED",
            item["ineligibilityReasons"],
        )
        self.assertNotIn("instructionBody", item)
        self.assertNotIn("skillUsageReceipt", item)
        self.assertEqual(packet.to_dict()["skillUsageReceipts"], [])

    def test_receipt_output_writes_receipt_bundle(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_skill_body(root, "eligible-skill", "# Eligible Skill\n")
            index_path = _write_index(
                root,
                [
                    _entry(
                        "eligible-skill",
                        certification_state="CERTIFIED",
                        uat_state="PASSED",
                        internal_disposition="IMPLEMENTED",
                    )
                ],
            )
            receipt_path = root / "receipt.json"
            with contextlib.redirect_stdout(io.StringIO()):
                exit_code = MODULE.main(
                    [
                        "--index-path",
                        str(index_path),
                        "--repo-root",
                        str(root),
                        "--skill-id",
                        "eligible-skill",
                        "--include-instruction-bodies",
                        "--json",
                        "--receipt-out",
                        str(receipt_path),
                    ]
                )
            bundle = json.loads(receipt_path.read_text(encoding="utf-8"))

        self.assertEqual(exit_code, 0)
        self.assertEqual(len(bundle["skillUsageReceipts"]), 1)
        self.assertEqual(
            bundle["skillUsageReceipts"][0]["receiptType"],
            "CVF_ASSF_SKILL_USAGE_RECEIPT",
        )

    def test_out_of_scope_package_root_is_denied(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            index_path = _write_index(
                root,
                [
                    _entry(
                        "bad-root",
                        certification_state="CERTIFIED",
                        uat_state="PASSED",
                        internal_disposition="IMPLEMENTED",
                        canonical_root="docs/reference/agent_system_skills/registry/entries/bad-root.json",
                    )
                ],
            )
            packet = MODULE.build_runtime_package_packet(
                index_path=index_path,
                repo_root=root,
                include_instruction_bodies=True,
            )

        item = packet.to_dict()["items"][0]
        self.assertFalse(item["runtimeEligible"])
        self.assertIn("PACKAGE_ROOT_OUT_OF_SCOPE", item["ineligibilityReasons"])
        self.assertEqual(item["packageBodyDisposition"], "NOT_RUNTIME_ELIGIBLE")

    def test_selector_filter_and_truncation(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            index_path = _write_index(root, [_entry("a-skill"), _entry("b-skill")])
            packet = MODULE.build_runtime_package_packet(
                index_path=index_path,
                repo_root=root,
                role="worker",
                max_results=1,
            )

        self.assertEqual(packet.total_candidates, 2)
        self.assertTrue(packet.truncated)
        self.assertEqual(len(packet.items), 1)

    def test_claim_boundary_denies_authority_and_adapter_behavior(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            packet = MODULE.build_runtime_package_packet(
                index_path=_write_index(root, [_entry("example")]),
                repo_root=root,
            )

        boundary = packet.to_dict()["claimBoundary"]
        self.assertIn("does not activate a package", boundary)
        self.assertIn("grant authority", boundary)
        self.assertIn("implement CLI/MCP adapter behavior", boundary)

    def test_invalid_arguments_fail(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            index_path = _write_index(root, [_entry("example")])
            with self.assertRaises(ValueError):
                MODULE.build_runtime_package_packet(
                    index_path=index_path,
                    repo_root=root,
                    max_results=0,
                )
            with self.assertRaises(ValueError):
                MODULE.build_runtime_package_packet(
                    index_path=index_path,
                    repo_root=root,
                    risk_ceiling="INVALID",
                )


if __name__ == "__main__":
    unittest.main()
