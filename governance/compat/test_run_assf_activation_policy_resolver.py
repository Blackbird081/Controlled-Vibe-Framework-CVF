"""Tests for governance/compat/run_assf_activation_policy_resolver.py."""

from __future__ import annotations

import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

from run_assf_activation_policy_resolver import (
    STATE_ACTIVATION_READY,
    STATE_BODY_READ_DENIED,
    STATE_BODY_READ_REQUESTED,
    STATE_SELECTED,
    STATE_USED_WITHOUT_RECEIPT_DENIED,
    STATE_USED_WITH_RECEIPT,
    build_activation_policy_packet,
)
from run_assf_active_resolver import CONSUMER_EXTERNAL


class ActivationPolicyResolverTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = Path(tempfile.mkdtemp(prefix="assf-activation-policy-"))
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

    def _write_index(self, *, certification_state: str = "CERTIFIED") -> None:
        payload = {
            "skills": [
                {
                    "approvalState": "APPROVED",
                    "authorityCeiling": "ADVISORY",
                    "candidateState": "APPROVED",
                    "canonicalRoot": (
                        "docs/reference/agent_system_skills/packages/"
                        "ready-skill/SKILL.md"
                    ),
                    "certificationState": certification_state,
                    "compositionOrder": 1,
                    "doNotUseWhen": "do not use outside tests",
                    "externalCliMcpDisposition": "DEFERRED_WITH_REASON",
                    "internalAgentDisposition": "IMPLEMENTED",
                    "name": "Ready Skill",
                    "riskCeiling": "R1",
                    "riskProfile": "R1",
                    "phases": ["implementation"],
                    "roles": ["worker"],
                    "skillId": "ready-skill",
                    "status": "APPROVED",
                    "surfaces": ["governance/compat"],
                    "taskClasses": ["implementation"],
                    "uatState": "PASSED",
                    "useWhen": "use for tests",
                    "version": "0.1.0",
                }
            ]
        }
        self.index_path.write_text(json.dumps(payload), encoding="utf-8")

    def _write_truth(self) -> None:
        payload = {
            "entries": [
                {
                    "canonicalPacketPath": (
                        "docs/reference/agent_system_skills/truth/packets/"
                        "ready-skill.json"
                    ),
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

    def _usage_receipt(self, *, skill_id: str = "ready-skill") -> dict[str, str]:
        return {
            "bodyHash": "sha256:" + "2" * 64,
            "packageBodyDisposition": "LOADED",
            "receiptId": "sha256:" + "3" * 64,
            "receiptType": "CVF_ASSF_SKILL_USAGE_RECEIPT",
            "skillId": skill_id,
        }

    def _packet(self, **kwargs: object):
        return build_activation_policy_packet(
            index_path=self.index_path,
            truth_index_path=self.truth_index_path,
            repo_root=self.repo_root,
            skill_id="ready-skill",
            **kwargs,
        )

    def test_ready_without_body_read_request_is_activation_ready(self) -> None:
        packet = self._packet()
        item = packet.items[0]
        self.assertEqual(item.policy_state, STATE_ACTIVATION_READY)
        self.assertTrue(item.activation_ready)
        self.assertTrue(item.body_read_allowed)
        self.assertFalse(item.body_read_requested)
        self.assertFalse(item.used_with_receipt)
        self.assertNotIn("skillUsageReceipts", packet.to_dict())

    def test_body_read_request_is_classified_without_opening_body(self) -> None:
        packet = self._packet(body_read_requested=True)
        item = packet.items[0]
        self.assertEqual(item.policy_state, STATE_BODY_READ_REQUESTED)
        self.assertTrue(item.body_read_allowed)
        self.assertEqual(item.matched_usage_receipt_ids, ())
        self.assertNotIn("instructionBody", item.to_dict())

    def test_output_consumed_without_receipt_is_denied(self) -> None:
        packet = self._packet(output_consumed=True)
        item = packet.items[0]
        self.assertEqual(item.policy_state, STATE_USED_WITHOUT_RECEIPT_DENIED)
        self.assertFalse(item.used_with_receipt)
        self.assertIn(
            "OUTPUT_CONSUMED_WITHOUT_MATCHING_SKILL_USAGE_RECEIPT",
            item.policy_reasons,
        )

    def test_output_consumed_with_matching_receipt_is_used_with_receipt(self) -> None:
        receipt = self._usage_receipt()
        packet = self._packet(output_consumed=True, usage_receipts=(receipt,))
        item = packet.items[0]
        self.assertEqual(item.policy_state, STATE_USED_WITH_RECEIPT)
        self.assertTrue(item.used_with_receipt)
        self.assertEqual(item.matched_usage_receipt_ids, (receipt["receiptId"],))

    def test_mismatched_receipt_does_not_authorize_use(self) -> None:
        receipt = self._usage_receipt(skill_id="other-skill")
        packet = self._packet(output_consumed=True, usage_receipts=(receipt,))
        self.assertEqual(
            packet.items[0].policy_state,
            STATE_USED_WITHOUT_RECEIPT_DENIED,
        )

    def test_external_consumer_remains_selected_not_ready(self) -> None:
        packet = self._packet(consumer=CONSUMER_EXTERNAL)
        item = packet.items[0]
        self.assertEqual(item.policy_state, STATE_SELECTED)
        self.assertFalse(item.activation_ready)
        self.assertFalse(item.body_read_allowed)

    def test_body_read_is_denied_when_activation_not_ready(self) -> None:
        self._write_index(certification_state="PENDING")
        packet = self._packet(body_read_requested=True)
        item = packet.items[0]
        self.assertEqual(item.policy_state, STATE_BODY_READ_DENIED)
        self.assertFalse(item.body_read_allowed)


if __name__ == "__main__":
    unittest.main()
