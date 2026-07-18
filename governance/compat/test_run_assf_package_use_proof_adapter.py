"""Focused tests for run_assf_package_use_proof_adapter.py."""

from __future__ import annotations

import contextlib
import io
import importlib.util
import json
import os
import shutil
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

MODULE_PATH = _HERE / "run_assf_package_use_proof_adapter.py"
SPEC = importlib.util.spec_from_file_location(
    "run_assf_package_use_proof_adapter", MODULE_PATH
)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


def _sha(value: str) -> str:
    import hashlib

    return "sha256:" + hashlib.sha256(value.encode("utf-8")).hexdigest()


class PackageUseProofAdapterTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = Path(tempfile.mkdtemp(prefix="assf-use-proof-"))
        self.repo_root = self.temp_dir / "repo"
        self.skill_id = "ready-skill"
        self.skill_path = (
            self.repo_root
            / "docs"
            / "reference"
            / "agent_system_skills"
            / "packages"
            / self.skill_id
            / "SKILL.md"
        )
        self.skill_path.parent.mkdir(parents=True, exist_ok=True)
        self.skill_path.write_text(
            "# Ready Skill\n\nUse source verification before edits.\n",
            encoding="utf-8",
        )
        self.index_path = (
            self.repo_root
            / "docs"
            / "reference"
            / "agent_system_skills"
            / "generated"
            / "skill-index.json"
        )
        self.truth_index_path = (
            self.repo_root
            / "docs"
            / "reference"
            / "agent_system_skills"
            / "truth"
            / "generated"
            / "skill-truth-index.json"
        )
        self.free_quota_ledger_path = (
            self.repo_root
            / "docs"
            / "reference"
            / "model_gateway"
            / "CVF_ALIBABA_FREE_QUOTA_MODEL_LEDGER.json"
        )
        self._write_index()
        self._write_truth()
        self._write_free_quota_ledger()

    def tearDown(self) -> None:
        shutil.rmtree(self.temp_dir)

    def _write_index(self, *, certification_state: str = "CERTIFIED") -> None:
        payload = {
            "skills": [
                {
                    "approvalState": "APPROVED",
                    "authorityCeiling": "ADVISORY",
                    "candidateState": "APPROVED",
                    "canonicalRoot": (
                        "docs/reference/agent_system_skills/packages/"
                        f"{self.skill_id}/SKILL.md"
                    ),
                    "capabilityBoundary": "no authority expansion",
                    "certificationState": certification_state,
                    "compositionOrder": 1,
                    "doNotUseWhen": "do not use outside tests",
                    "externalCliMcpDisposition": "DEFERRED_WITH_REASON",
                    "internalAgentDisposition": "IMPLEMENTED",
                    "name": "Ready Skill",
                    "phases": ["implementation"],
                    "riskCeiling": "R1",
                    "riskProfile": "R1",
                    "roles": ["worker"],
                    "skillId": self.skill_id,
                    "status": "APPROVED",
                    "surfaces": ["governance/compat"],
                    "taskClasses": ["implementation"],
                    "uatState": "PASSED",
                    "useWhen": "use for tests",
                    "version": "0.1.0",
                }
            ]
        }
        self.index_path.parent.mkdir(parents=True, exist_ok=True)
        self.index_path.write_text(json.dumps(payload), encoding="utf-8")

    def _write_truth(self) -> None:
        payload = {
            "entries": [
                {
                    "canonicalPacketPath": (
                        "docs/reference/agent_system_skills/truth/packets/"
                        f"{self.skill_id}.json"
                    ),
                    "receiptHash": _sha("truth"),
                    "runtimeEligibility": "RUNTIME_PACKAGE_ELIGIBLE",
                    "skillId": self.skill_id,
                    "truthPacketId": "SKSOT-T1-ready-skill",
                    "truthStatus": "approved",
                    "verificationMode": "STRICT",
                }
            ],
            "schemaVersion": "0.1.0",
        }
        self.truth_index_path.parent.mkdir(parents=True, exist_ok=True)
        self.truth_index_path.write_text(json.dumps(payload), encoding="utf-8")

    def _write_free_quota_ledger(self) -> None:
        payload = {
            "schemaVersion": "0.1.0",
            "artifact": "CVF_ALIBABA_FREE_QUOTA_MODEL_LEDGER",
            "models": [
                {
                    "modelCode": "qwen3.6-plus",
                    "expirationDate": "2026-07-01",
                    "freeQuotaRemaining": 911370,
                    "freeQuotaTotal": 1000000,
                    "statusAtCapture": "Enabled",
                },
                {
                    "modelCode": "qwen3.6-flash-2026-04-16",
                    "expirationDate": "2026-07-16",
                    "freeQuotaRemaining": 998675,
                    "freeQuotaTotal": 1000000,
                    "statusAtCapture": "Enabled",
                    "diagnosticRerun": {"result": "PASS"},
                },
            ],
        }
        self.free_quota_ledger_path.parent.mkdir(parents=True, exist_ok=True)
        self.free_quota_ledger_path.write_text(json.dumps(payload), encoding="utf-8")

    def _packet(self, **kwargs: object) -> dict:
        return MODULE.build_package_use_proof_packet(
            index_path=self.index_path,
            truth_index_path=self.truth_index_path,
            repo_root=self.repo_root,
            free_quota_ledger_path=self.free_quota_ledger_path,
            skill_id=self.skill_id,
            **kwargs,
        )

    def test_dry_run_loads_package_and_classifies_used_with_receipt(self) -> None:
        packet = self._packet()

        self.assertEqual(
            packet["executionDisposition"],
            "DRY_RUN_READY_FOR_LIVE_PROVIDER_USE_PROOF",
        )
        self.assertEqual(packet["executionMode"], "DRY_RUN_NO_PROVIDER_CALL")
        self.assertEqual(packet["provider"], "alibaba-dashscope")
        self.assertEqual(
            packet["providerSelection"]["requestedProvider"],
            "AUTO_FROM_ASSF_LIVE_PROVIDER_CANDIDATES",
        )
        self.assertEqual(
            packet["providerSelection"]["resolvedProvider"],
            "alibaba-dashscope",
        )
        self.assertEqual(
            packet["providerSelection"]["providerStatus"],
            "PROVIDER_USABLE",
        )
        self.assertEqual(packet["model"], "qwen3.6-flash-2026-04-16")
        self.assertEqual(
            packet["modelSelection"]["status"],
            "MODEL_FREE_QUOTA_USABLE",
        )
        self.assertTrue(packet["packageRead"]["runtimeEligible"])
        self.assertEqual(packet["packageRead"]["packageBodyDisposition"], "LOADED")
        self.assertTrue(packet["packageRead"]["skillUsageReceiptId"].startswith("sha256:"))
        self.assertEqual(
            packet["activationPolicy"]["activationPolicyState"],
            "USED_WITH_RECEIPT",
        )
        self.assertFalse(packet["lifecycleMutation"])
        self.assertEqual(packet["sourceMutations"], [])
        self.assertNotIn('"instructionBody":', json.dumps(packet))

    def test_live_fake_provider_emits_use_proof_receipt(self) -> None:
        def fake_caller(payload: dict, api_key: str, timeout_seconds: int):
            self.assertEqual(api_key, "test-key")
            self.assertEqual(payload["model"], "qwen3.6-flash-2026-04-16")
            self.assertGreater(timeout_seconds, 0)
            return MODULE.ProviderResult(
                http_status=200,
                headers={"x-request-id": "req-test"},
                body={
                    "id": "chatcmpl-test",
                    "choices": [
                        {
                            "message": {
                                "content": (
                                    "Applied controls: source verification, "
                                    "bounded scope, claim boundary."
                                )
                            }
                        }
                    ],
                },
                latency_ms=123,
            )

        with patch.dict(os.environ, {"DASHSCOPE_API_KEY": "test-key"}, clear=False):
            packet = self._packet(live=True, live_caller=fake_caller)

        self.assertEqual(packet["executionDisposition"], "LIVE_PROVIDER_USE_PROOF_PASS")
        receipt = packet["packageUseProofReceipt"]
        self.assertEqual(
            receipt["receiptType"],
            "CVF_ASSF_PACKAGE_USE_PROOF_RECEIPT",
        )
        self.assertEqual(receipt["skillId"], self.skill_id)
        self.assertEqual(receipt["provider"], "alibaba-dashscope")
        self.assertEqual(receipt["model"], "qwen3.6-flash-2026-04-16")
        self.assertTrue(receipt["skillUsageReceiptId"].startswith("sha256:"))
        self.assertEqual(packet["liveCall"]["providerTraceId"], "req-test")
        self.assertIsNone(packet["diagnostic"])

    def test_qwen_turbo_is_denied_as_unverified_free_quota_model(self) -> None:
        packet = self._packet(live=True, model="qwen-turbo")

        self.assertEqual(
            packet["executionDisposition"],
            "LIVE_PROVIDER_DENIED_MODEL_FREE_QUOTA",
        )
        self.assertEqual(
            packet["diagnostic"]["class"],
            "MODEL_FREE_QUOTA_NOT_VERIFIED",
        )
        self.assertEqual(packet["diagnostic"]["stage"], "model_selection")
        self.assertNotIn("packageRead", packet)

    def test_provider_alias_normalizes_to_dashscope_candidate(self) -> None:
        packet = self._packet(provider="alibaba")

        self.assertEqual(
            packet["executionDisposition"],
            "DRY_RUN_READY_FOR_LIVE_PROVIDER_USE_PROOF",
        )
        self.assertEqual(packet["provider"], "alibaba-dashscope")
        self.assertEqual(packet["providerSelection"]["requestedProvider"], "alibaba")
        self.assertEqual(
            packet["providerSelection"]["resolvedProvider"],
            "alibaba-dashscope",
        )

    def test_unsupported_provider_is_denied_before_package_read(self) -> None:
        packet = self._packet(provider="deepseek", live=True)

        self.assertEqual(
            packet["executionDisposition"],
            "LIVE_PROVIDER_DENIED_PROVIDER_SELECTION",
        )
        self.assertEqual(packet["diagnostic"]["stage"], "provider_selection")
        self.assertEqual(
            packet["diagnostic"]["class"],
            "PROVIDER_NOT_SOURCE_BACKED_FOR_ASSF_USE_CASE",
        )
        self.assertNotIn("packageRead", packet)

    def test_live_missing_key_returns_secret_safe_diagnostic(self) -> None:
        clean_env = {key: "" for key in MODULE.API_KEY_ENV_CANDIDATES}
        with (
            patch.dict(os.environ, clean_env, clear=False),
            patch.object(MODULE, "_safe_loaded_env_files", return_value=[]),
        ):
            packet = self._packet(live=True)

        self.assertEqual(packet["executionDisposition"], "LIVE_PROVIDER_DENIED_MISSING_KEY")
        diagnostic = packet["diagnostic"]
        self.assertEqual(diagnostic["stage"], "credential_resolution")
        self.assertEqual(diagnostic["class"], "missing_live_provider_key")
        self.assertTrue(diagnostic["retryable"])
        self.assertNotIn("test-key", json.dumps(packet))

    def test_ineligible_package_is_denied_before_provider_call(self) -> None:
        self._write_index(certification_state="PENDING")
        packet = self._packet(live=True)

        self.assertEqual(
            packet["executionDisposition"],
            "DENIED_MISSING_SKILL_USAGE_RECEIPT",
        )
        self.assertEqual(
            packet["diagnostic"]["stage"],
            "package_body_read",
        )
        self.assertEqual(packet["packageRead"]["packageBodyDisposition"], "NOT_RUNTIME_ELIGIBLE")

    def test_cli_receipt_out_writes_packet(self) -> None:
        receipt_out = self.temp_dir / "receipt" / "use-proof.json"
        with contextlib.redirect_stdout(io.StringIO()):
            exit_code = MODULE.main(
                [
                    "--index-path",
                    str(self.index_path),
                    "--truth-index-path",
                    str(self.truth_index_path),
                    "--repo-root",
                    str(self.repo_root),
                    "--free-quota-ledger-path",
                    str(self.free_quota_ledger_path),
                    "--skill-id",
                    self.skill_id,
                    "--json",
                    "--receipt-out",
                    str(receipt_out),
                ]
            )

        packet = json.loads(receipt_out.read_text(encoding="utf-8"))
        self.assertEqual(exit_code, 0)
        self.assertEqual(
            packet["executionDisposition"],
            "DRY_RUN_READY_FOR_LIVE_PROVIDER_USE_PROOF",
        )

    def test_json_output_is_ascii_safe_for_windows_stdout(self) -> None:
        def fake_caller(payload: dict, api_key: str, timeout_seconds: int):
            return MODULE.ProviderResult(
                http_status=200,
                headers={"x-request-id": "req-test"},
                body={"choices": [{"message": {"content": "Use <= and unicode \u2264 safely"}}]},
                latency_ms=123,
            )

        with patch.dict(os.environ, {"DASHSCOPE_API_KEY": "test-key"}, clear=False):
            packet = self._packet(live=True, live_caller=fake_caller)
        encoded = json.dumps(packet, ensure_ascii=True, indent=2)

        self.assertIn("\\u2264", encoded)
        encoded.encode("cp1252")


if __name__ == "__main__":
    unittest.main()
