"""Tests for production ASSF package execution adapters."""

from __future__ import annotations

import json
import os
import shutil
import sys
import tempfile
import unittest
from contextlib import redirect_stdout
from io import StringIO
from pathlib import Path
from unittest.mock import patch

_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

import run_assf_package_use_proof_adapter as use_proof
from run_assf_production_cli_mcp_adapter import build_cli_mcp_execution_envelope, main as cli_mcp_main
from run_assf_production_package_executor import (
    DENIED_NOT_ACTIVE,
    DRY_RUN_DISPOSITION,
    LIVE_PASS_DISPOSITION,
    build_production_package_execution_packet,
)


class ProductionPackageExecutorTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = Path(tempfile.mkdtemp(prefix="assf-production-executor-"))
        self.repo_root = self.temp_dir / "repo"
        self.skill_id = "ready-skill"
        package_path = (
            self.repo_root
            / "docs"
            / "reference"
            / "agent_system_skills"
            / "packages"
            / self.skill_id
            / "SKILL.md"
        )
        package_path.parent.mkdir(parents=True, exist_ok=True)
        package_path.write_text("# Ready Skill\n\nUse this for test proof.\n", encoding="utf-8")
        self.index_path = self.repo_root / "docs" / "reference" / "agent_system_skills" / "generated" / "skill-index.json"
        self.truth_index_path = (
            self.repo_root
            / "docs"
            / "reference"
            / "agent_system_skills"
            / "truth"
            / "generated"
            / "skill-truth-index.json"
        )
        self.ledger_path = self.repo_root / "docs" / "reference" / "model_gateway" / "free-quota-ledger.json"
        self._write_index(status="ACTIVE", external="IMPLEMENTED")
        self._write_truth()
        self._write_ledger()

    def tearDown(self) -> None:
        shutil.rmtree(self.temp_dir)

    def _entry(self, *, status: str, external: str) -> dict:
        return {
            "approvalState": "APPROVED",
            "authorityCeiling": "ADVISORY",
            "candidateState": status,
            "canonicalRoot": (
                "docs/reference/agent_system_skills/packages/"
                f"{self.skill_id}/SKILL.md"
            ),
            "capabilityBoundary": "bounded package execution only",
            "certificationState": "CERTIFIED",
            "compositionOrder": 1,
            "externalCliMcpDisposition": external,
            "internalAgentDisposition": "IMPLEMENTED",
            "name": "Ready Skill",
            "riskCeiling": "R1",
            "riskProfile": "R1",
            "skillId": self.skill_id,
            "status": status,
            "uatState": "PASSED",
            "version": "0.1.0",
        }

    def _write_index(self, *, status: str, external: str) -> None:
        self.index_path.parent.mkdir(parents=True, exist_ok=True)
        self.index_path.write_text(
            json.dumps({"skills": [self._entry(status=status, external=external)]}),
            encoding="utf-8",
        )

    def _write_truth(self) -> None:
        self.truth_index_path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "entries": [
                {
                    "canonicalPacketPath": f"docs/reference/{self.skill_id}.json",
                    "receiptHash": "sha256:" + "1" * 64,
                    "runtimeEligibility": "RUNTIME_PACKAGE_ELIGIBLE",
                    "skillId": self.skill_id,
                    "truthPacketId": f"SKSOT-T1-{self.skill_id}",
                    "truthStatus": "approved",
                    "verificationMode": "STRICT",
                }
            ],
            "schemaVersion": "0.1.0",
        }
        self.truth_index_path.write_text(json.dumps(payload), encoding="utf-8")

    def _write_ledger(self) -> None:
        self.ledger_path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "models": [
                {
                    "diagnosticRerun": {"result": "PASS"},
                    "expirationDate": "2026-07-16",
                    "freeQuotaRemaining": 999999,
                    "modelCode": "qwen3.6-flash-2026-04-16",
                    "statusAtCapture": "Enabled",
                }
            ]
        }
        self.ledger_path.write_text(json.dumps(payload), encoding="utf-8")

    def _packet(self, **kwargs: object) -> dict:
        return build_production_package_execution_packet(
            index_path=self.index_path,
            truth_index_path=self.truth_index_path,
            repo_root=self.repo_root,
            free_quota_ledger_path=self.ledger_path,
            skill_id=self.skill_id,
            **kwargs,
        )

    def test_dry_run_requires_active_source(self) -> None:
        packet = self._packet()

        self.assertEqual(packet["executionDisposition"], DRY_RUN_DISPOSITION)
        self.assertEqual(packet["activeSourceCheck"]["reasons"], [])
        self.assertEqual(packet["sourceTruthTrace"]["skillId"], self.skill_id)

    def test_non_active_package_is_denied_before_use_proof(self) -> None:
        self._write_index(status="APPROVED", external="IMPLEMENTED")

        packet = self._packet()

        self.assertEqual(packet["executionDisposition"], DENIED_NOT_ACTIVE)
        self.assertNotIn("packageUseProof", packet)

    def test_external_cli_mcp_wrapper_emits_execution_receipt_with_fake_live_call(self) -> None:
        def fake_caller(payload: dict, api_key: str, timeout_seconds: int):
            return use_proof.ProviderResult(
                body={"choices": [{"message": {"content": "receipt backed output"}}]},
                headers={"x-request-id": "req-test"},
                http_status=200,
                latency_ms=321,
            )

        with patch.dict(os.environ, {"DASHSCOPE_API_KEY": "test-key"}, clear=False):
            envelope = build_cli_mcp_execution_envelope(
                index_path=self.index_path,
                truth_index_path=self.truth_index_path,
                repo_root=self.repo_root,
                free_quota_ledger_path=self.ledger_path,
                skill_id=self.skill_id,
                request_id="req-1",
                live=True,
                live_caller=fake_caller,
            )

        self.assertTrue(envelope["success"])
        self.assertEqual(envelope["executionDisposition"], LIVE_PASS_DISPOSITION)
        self.assertTrue(envelope["executionReceiptId"].startswith("sha256:"))
        trace = envelope["sourceTruthTrace"]
        self.assertTrue(trace["skillUsageReceiptId"].startswith("sha256:"))
        self.assertTrue(trace["useProofReceiptId"].startswith("sha256:"))

    def test_cli_mcp_main_returns_failure_for_denied_disposition(self) -> None:
        self._write_index(status="APPROVED", external="IMPLEMENTED")

        with redirect_stdout(StringIO()):
            exit_code = cli_mcp_main(
                [
                    "--index-path",
                    str(self.index_path),
                    "--truth-index-path",
                    str(self.truth_index_path),
                    "--repo-root",
                    str(self.repo_root),
                    "--free-quota-ledger-path",
                    str(self.ledger_path),
                    "--skill-id",
                    self.skill_id,
                ]
            )

        self.assertEqual(exit_code, 1)


if __name__ == "__main__":
    unittest.main()
