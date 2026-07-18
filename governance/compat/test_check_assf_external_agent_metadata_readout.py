"""Tests for check_assf_external_agent_metadata_readout.py."""

from __future__ import annotations

import copy
import json
import sys
import tempfile
import unittest
from pathlib import Path

_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

from check_assf_external_agent_metadata_readout import check, check_payload
from run_assf_external_agent_metadata_readout import build_metadata_readout


def _write_index(root: Path) -> Path:
    index_path = root / "skill-index.json"
    index_path.write_text(
        json.dumps(
            {
                "claimBoundary": "metadata-only",
                "skills": [
                    {
                        "adapterContract": "N/A with reason: not implemented",
                        "adapterEvidence": "N/A with reason: no adapter",
                        "authorityCeiling": "read-only inspection",
                        "canonicalRoot": "docs/reference/example.json",
                        "capabilityBoundary": "no activation",
                        "candidateState": "CANDIDATE",
                        "certificationState": "CERTIFIED",
                        "externalCliMcpDisposition": "DEFERRED_WITH_REASON",
                        "externalMutationBoundary": "no external mutation",
                        "license": "CVF_PRIVATE_GOVERNED",
                        "name": "Example Skill",
                        "originLane": "ASSF-T2",
                        "reviewArtifacts": ["docs/reviews/example.md"],
                        "riskCeiling": "R0",
                        "riskProfile": "R0",
                        "skillId": "example-skill",
                        "sourceArtifacts": ["docs/baselines/example.md"],
                        "status": "CANDIDATE",
                        "uatState": "PASSED",
                        "version": "0.1.0",
                        "purpose": "must not leak",
                    }
                ],
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    return index_path


class AssfExternalAgentMetadataReadoutCheckTests(unittest.TestCase):
    def _payload(self) -> dict:
        with tempfile.TemporaryDirectory() as tmp:
            return build_metadata_readout(index_path=_write_index(Path(tmp))).to_dict()

    def test_current_helper_payload_passes(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            violations = check(index_path=_write_index(Path(tmp)))

        self.assertEqual(violations, [])

    def test_non_allowlisted_item_field_fails(self) -> None:
        payload = self._payload()
        payload["items"][0]["purpose"] = "leaked"

        violations = check_payload(payload)

        self.assertTrue(any("non-allowlisted fields" in item for item in violations))

    def test_widened_adapter_implementation_fails(self) -> None:
        payload = self._payload()
        payload["adapterImplementation"] = "IMPLEMENTED"

        violations = check_payload(payload)

        self.assertTrue(any("adapterImplementation" in item for item in violations))

    def test_allowed_field_family_extra_field_fails(self) -> None:
        payload = self._payload()
        payload["allowedFieldFamilies"]["identity"].append("purpose")

        violations = check_payload(payload)

        self.assertTrue(any("extra fields" in item for item in violations))

    def test_weak_claim_boundary_fails(self) -> None:
        payload = self._payload()
        payload["claimBoundary"] = "metadata readout"

        violations = check_payload(payload)

        self.assertTrue(any("claimBoundary missing" in item for item in violations))

    def test_payload_is_not_mutated_by_checker(self) -> None:
        payload = self._payload()
        original = copy.deepcopy(payload)

        check_payload(payload)

        self.assertEqual(payload, original)


if __name__ == "__main__":
    unittest.main()
