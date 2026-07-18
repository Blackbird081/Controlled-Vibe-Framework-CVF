"""Tests for governance/compat/run_assf_active_resolver.py."""

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

from run_assf_active_resolver import (
    CONSUMER_EXTERNAL,
    DENIED_EXTERNAL_ADAPTER_NOT_IMPLEMENTED,
    DENIED_MISSING_TRUTH_PACKET,
    DENIED_NOT_RUNTIME_ELIGIBLE,
    READY_DECISION,
    build_active_resolver_packet,
)


class ActiveResolverTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = Path(tempfile.mkdtemp(prefix="assf-active-resolver-"))
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
                    "skillId": "ready-skill",
                    "name": "Ready Skill",
                    "version": "0.1.0",
                    "status": "APPROVED",
                    "canonicalRoot": "docs/reference/agent_system_skills/packages/ready-skill/SKILL.md",
                    "riskProfile": "R1",
                    "riskCeiling": "R1",
                    "authorityCeiling": "ADVISORY",
                    "candidateState": "APPROVED",
                    "approvalState": "APPROVED",
                    "uatState": "PASSED",
                    "certificationState": certification_state,
                    "internalAgentDisposition": "IMPLEMENTED",
                    "externalCliMcpDisposition": "DEFERRED_WITH_REASON",
                    "taskClasses": ["implementation"],
                    "roles": ["worker"],
                    "phases": ["implementation"],
                    "surfaces": ["governance/compat"],
                    "compositionOrder": 1,
                    "useWhen": "use for tests",
                    "doNotUseWhen": "do not use outside tests",
                }
            ]
        }
        self.index_path.write_text(json.dumps(payload), encoding="utf-8")

    def _write_truth(self) -> None:
        payload = {
            "entries": [
                {
                    "canonicalPacketPath": "docs/reference/agent_system_skills/truth/packets/ready-skill.json",
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

    def test_ready_internal_agent_decision(self) -> None:
        packet = build_active_resolver_packet(
            index_path=self.index_path,
            truth_index_path=self.truth_index_path,
            repo_root=self.repo_root,
            skill_id="ready-skill",
        )
        self.assertEqual(packet.total_candidates, 1)
        item = packet.items[0]
        self.assertEqual(item.activation_decision, READY_DECISION)
        self.assertEqual(item.decision_reasons, ())
        self.assertIn("--include-instruction-bodies", item.loader_command or "")
        self.assertIsNone(item.instruction_body if hasattr(item, "instruction_body") else None)

    def test_ready_packet_has_decision_receipt_not_usage_receipt(self) -> None:
        packet = build_active_resolver_packet(
            index_path=self.index_path,
            truth_index_path=self.truth_index_path,
            repo_root=self.repo_root,
        )
        payload = packet.to_dict()
        self.assertIn("resolverDecisionReceipts", payload)
        self.assertEqual(
            payload["resolverDecisionReceipts"][0]["receiptType"],
            "CVF_ASSF_ACTIVE_RESOLVER_DECISION_RECEIPT",
        )
        self.assertNotIn("skillUsageReceipts", payload)

    def test_missing_truth_packet_denies(self) -> None:
        self.truth_index_path.write_text(
            json.dumps({"entries": [], "schemaVersion": "0.1.0"}),
            encoding="utf-8",
        )
        packet = build_active_resolver_packet(
            index_path=self.index_path,
            truth_index_path=self.truth_index_path,
            repo_root=self.repo_root,
        )
        self.assertEqual(packet.items[0].activation_decision, DENIED_MISSING_TRUTH_PACKET)

    def test_runtime_ineligible_denies(self) -> None:
        self._write_index(certification_state="PENDING")
        packet = build_active_resolver_packet(
            index_path=self.index_path,
            truth_index_path=self.truth_index_path,
            repo_root=self.repo_root,
        )
        self.assertEqual(packet.items[0].activation_decision, DENIED_NOT_RUNTIME_ELIGIBLE)
        self.assertIn(
            "CERTIFICATION_NOT_CERTIFIED",
            packet.items[0].runtime_ineligibility_reasons,
        )

    def test_external_consumer_denied_until_adapter(self) -> None:
        packet = build_active_resolver_packet(
            index_path=self.index_path,
            truth_index_path=self.truth_index_path,
            repo_root=self.repo_root,
            consumer=CONSUMER_EXTERNAL,
        )
        self.assertEqual(
            packet.items[0].activation_decision,
            DENIED_EXTERNAL_ADAPTER_NOT_IMPLEMENTED,
        )

    def test_selector_filters_candidates(self) -> None:
        packet = build_active_resolver_packet(
            index_path=self.index_path,
            truth_index_path=self.truth_index_path,
            repo_root=self.repo_root,
            role="reviewer",
        )
        self.assertEqual(packet.total_candidates, 0)
        self.assertEqual(packet.items, ())

    def test_invalid_consumer_raises(self) -> None:
        with self.assertRaises(ValueError):
            build_active_resolver_packet(
                index_path=self.index_path,
                truth_index_path=self.truth_index_path,
                repo_root=self.repo_root,
                consumer="unknown",
            )


if __name__ == "__main__":
    unittest.main()
