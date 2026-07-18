"""Tests for run_assf_cli_mcp_adapter_projection.py."""

from __future__ import annotations

import builtins
import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

from run_assf_cli_mcp_adapter_projection import (
    CONSUMER_EXTERNAL,
    EXTERNAL_BODY_READ_DISPOSITION,
    EXTERNAL_OUTPUT_USE_DISPOSITION,
    PROJECTION_IMPLEMENTATION,
    build_cli_mcp_adapter_projection,
    main,
)


FORBIDDEN_ITEM_FIELDS = {
    "bodyReadAllowed",
    "bodyReadRequested",
    "instructionBody",
    "loaderCommand",
    "matchedUsageReceiptIds",
    "outputConsumed",
    "packageBodyReceiptRequired",
    "policyDecisionReceipt",
    "resolverDecisionReceipt",
    "runtimeEligible",
    "runtimeIneligibilityReasons",
    "skillUsageReceipt",
    "skillUsageReceipts",
    "truth",
}


class CliMcpAdapterProjectionTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = Path(tempfile.mkdtemp(prefix="assf-cli-mcp-projection-"))
        self.repo_root = self.temp_dir / "repo"
        self.package_path = (
            self.repo_root
            / "docs"
            / "reference"
            / "agent_system_skills"
            / "packages"
            / "ready-skill"
            / "SKILL.md"
        )
        self.package_path.parent.mkdir(parents=True, exist_ok=True)
        self.package_path.write_text("# Ready Skill\n", encoding="utf-8")
        self.index_path = self.temp_dir / "skill-index.json"
        self.truth_index_path = self.temp_dir / "skill-truth-index.json"
        self._write_index()
        self._write_truth()

    def tearDown(self) -> None:
        shutil.rmtree(self.temp_dir)

    def _write_index(self) -> None:
        payload = {
            "skills": [
                {
                    "adapterContract": (
                        "N/A with reason: external adapter remains deferred"
                    ),
                    "adapterEvidence": "N/A with reason: no adapter execution",
                    "approvalState": "APPROVED",
                    "authorityCeiling": "ADVISORY",
                    "candidateState": "APPROVED",
                    "canonicalRoot": (
                        "docs/reference/agent_system_skills/packages/"
                        "ready-skill/SKILL.md"
                    ),
                    "capabilityBoundary": "no external mutation",
                    "certificationState": "CERTIFIED",
                    "compositionOrder": 1,
                    "externalCliMcpDisposition": "DEFERRED_WITH_REASON",
                    "externalMutationBoundary": "no external mutation",
                    "internalAgentDisposition": "IMPLEMENTED",
                    "license": "CVF_PRIVATE_GOVERNED",
                    "name": "Ready Skill",
                    "originLane": "ASCP-T3-TEST",
                    "phases": ["implementation"],
                    "reviewArtifacts": ["docs/reviews/ready-skill.md"],
                    "riskCeiling": "R1",
                    "riskProfile": "R1",
                    "roles": ["worker"],
                    "skillId": "ready-skill",
                    "sourceArtifacts": ["docs/baselines/ready-skill.md"],
                    "status": "APPROVED",
                    "surfaces": ["governance/compat"],
                    "taskClasses": ["implementation"],
                    "triggerPatterns": ["must not leak"],
                    "uatState": "PASSED",
                    "useWhen": "must not leak",
                    "version": "0.1.0",
                },
                {
                    "authorityCeiling": "ADVISORY",
                    "canonicalRoot": "outside/SKILL.md",
                    "certificationState": "PENDING",
                    "externalCliMcpDisposition": "DEFERRED_WITH_REASON",
                    "internalAgentDisposition": "CANDIDATE",
                    "name": "Other Skill",
                    "riskCeiling": "R1",
                    "riskProfile": "R1",
                    "skillId": "other-skill",
                    "status": "CANDIDATE",
                    "uatState": "PENDING",
                    "version": "0.1.0",
                },
            ]
        }
        self.index_path.write_text(json.dumps(payload), encoding="utf-8")

    def _write_truth(self) -> None:
        payload = {
            "entries": [
                {
                    "canonicalPacketPath": "docs/reference/ready-skill.json",
                    "receiptHash": "sha256:" + "1" * 64,
                    "runtimeEligibility": "RUNTIME_PACKAGE_ELIGIBLE",
                    "skillId": "ready-skill",
                    "truthPacketId": "SKSOT-T1-ready-skill",
                    "truthStatus": "approved",
                    "verificationMode": "STRICT",
                }
            ],
            "schemaVersion": "0.1.0",
        }
        self.truth_index_path.write_text(json.dumps(payload), encoding="utf-8")

    def _projection(self, **kwargs: object):
        return build_cli_mcp_adapter_projection(
            index_path=self.index_path,
            truth_index_path=self.truth_index_path,
            repo_root=self.repo_root,
            **kwargs,
        )

    def test_projection_exposes_allowlisted_metadata_and_policy_state(self) -> None:
        payload = self._projection(skill_id="ready-skill").to_dict()

        self.assertEqual(payload["consumer"], CONSUMER_EXTERNAL)
        self.assertEqual(
            payload["adapterProjectionImplementation"],
            PROJECTION_IMPLEMENTATION,
        )
        item = payload["items"][0]
        self.assertEqual(item["skillId"], "ready-skill")
        self.assertEqual(item["activationPolicyState"], "ACTIVATION_READY")
        self.assertTrue(item["activationReady"])
        self.assertEqual(
            item["externalBodyReadDisposition"],
            EXTERNAL_BODY_READ_DISPOSITION,
        )
        self.assertEqual(
            item["externalOutputUseDisposition"],
            EXTERNAL_OUTPUT_USE_DISPOSITION,
        )
        self.assertEqual(item["adapterContract"], "N/A with reason: external adapter remains deferred")
        self.assertIn("sourceArtifacts", item)
        self.assertNotIn("triggerPatterns", item)
        self.assertNotIn("useWhen", item)

    def test_projection_does_not_emit_internal_resolver_or_receipt_fields(self) -> None:
        item = self._projection(skill_id="ready-skill").to_dict()["items"][0]
        self.assertTrue(FORBIDDEN_ITEM_FIELDS.isdisjoint(item))

    def test_projection_does_not_open_package_instruction_body(self) -> None:
        opened_paths: list[str] = []
        original_open = builtins.open

        def guarded_open(file, mode="r", *args, **kwargs):
            path_text = str(file)
            opened_paths.append(path_text)
            if path_text.endswith("SKILL.md"):
                raise AssertionError(f"instruction body opened: {file}")
            if any(flag in str(mode) for flag in ("w", "a", "+")):
                raise AssertionError(f"write attempted: {file}")
            return original_open(file, mode, *args, **kwargs)

        with patch("builtins.open", side_effect=guarded_open):
            projection = self._projection(skill_id="ready-skill")

        self.assertEqual(projection.total_candidates, 1)
        self.assertTrue(all(not path.endswith("SKILL.md") for path in opened_paths))

    def test_selector_filter_and_external_denial_posture(self) -> None:
        payload = self._projection(
            task_class="implementation",
            role="worker",
            phase="implementation",
            surface="governance/compat",
            risk_ceiling="R1",
        ).to_dict()

        self.assertEqual(payload["totalCandidates"], 1)
        self.assertEqual(payload["items"][0]["skillId"], "ready-skill")
        self.assertEqual(
            payload["items"][0]["externalBodyReadDisposition"],
            EXTERNAL_BODY_READ_DISPOSITION,
        )

    def test_cli_json_output(self) -> None:
        with patch("builtins.print") as mocked_print:
            rc = main(
                [
                    "--index-path",
                    str(self.index_path),
                    "--truth-index-path",
                    str(self.truth_index_path),
                    "--repo-root",
                    str(self.repo_root),
                    "--skill-id",
                    "ready-skill",
                    "--json",
                ]
            )

        self.assertEqual(rc, 0)
        payload = json.loads(mocked_print.call_args.args[0])
        self.assertEqual(payload["consumer"], CONSUMER_EXTERNAL)
        self.assertEqual(payload["items"][0]["skillId"], "ready-skill")

    def test_invalid_max_results_fails(self) -> None:
        with self.assertRaises(ValueError):
            self._projection(max_results=0)


if __name__ == "__main__":
    unittest.main()
