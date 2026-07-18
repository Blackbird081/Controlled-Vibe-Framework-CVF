"""Tests for run_assf_package_lifecycle_decision.py."""

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

from run_assf_package_lifecycle_decision import (
    DECISION_HOLD_NO_ACTIVE_SOURCE_MUTATION,
    SOURCE_MUTATION_DISPOSITION,
    build_package_lifecycle_decision,
    main,
)


class PackageLifecycleDecisionTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = Path(tempfile.mkdtemp(prefix="assf-lifecycle-decision-"))
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
                    "originLane": "ASCP-T4-TEST",
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
                }
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

    def _decision(self, **kwargs: object):
        return build_package_lifecycle_decision(
            index_path=self.index_path,
            truth_index_path=self.truth_index_path,
            repo_root=self.repo_root,
            **kwargs,
        )

    def test_decision_holds_source_mutation_even_when_ready(self) -> None:
        payload = self._decision().to_dict()

        self.assertEqual(
            payload["lifecycleSourceMutationDecision"],
            DECISION_HOLD_NO_ACTIVE_SOURCE_MUTATION,
        )
        self.assertEqual(
            payload["sourceMutationDisposition"],
            SOURCE_MUTATION_DISPOSITION,
        )
        self.assertEqual(payload["runtimeEligibleSkillIds"], ["ready-skill"])
        self.assertEqual(payload["activationReadySkillIds"], ["ready-skill"])
        self.assertEqual(payload["externalProjectionReadySkillIds"], ["ready-skill"])
        self.assertEqual(payload["lifecycleSourceMutations"], [])
        self.assertEqual(payload["recommendedSourceMutations"], [])

    def test_decision_does_not_open_package_instruction_body_or_write(self) -> None:
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
            decision = self._decision()

        self.assertEqual(decision.total_candidates, 1)
        self.assertTrue(all(not path.endswith("SKILL.md") for path in opened_paths))

    def test_existing_active_source_records_are_reported_not_created(self) -> None:
        raw = json.loads(self.index_path.read_text(encoding="utf-8"))
        raw["skills"][0]["status"] = "ACTIVE"
        self.index_path.write_text(json.dumps(raw), encoding="utf-8")

        payload = self._decision().to_dict()

        self.assertEqual(payload["activeSourceSkillIds"], ["ready-skill"])
        self.assertEqual(payload["recommendedSourceMutations"], [])

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
                    "--json",
                ]
            )

        self.assertEqual(rc, 0)
        payload = json.loads(mocked_print.call_args.args[0])
        self.assertEqual(
            payload["lifecycleSourceMutationDecision"],
            DECISION_HOLD_NO_ACTIVE_SOURCE_MUTATION,
        )

    def test_invalid_max_results_fails(self) -> None:
        with self.assertRaises(ValueError):
            self._decision(max_results=0)


if __name__ == "__main__":
    unittest.main()
