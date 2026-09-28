import json
import tempfile
import unittest
from pathlib import Path

from governance.compat import check_package_skill_target_state_feasibility as gate


class TargetStateFeasibilityTests(unittest.TestCase):
    def payload(self) -> dict:
        return {
            "schemaVersion": gate.SCHEMA,
            "skillId": "example-skill",
            "sopPhase": "P8",
            "targetState": {
                "status": "ACTIVE",
                "candidateState": "ACTIVE",
                "uatState": "PASSED",
                "certificationState": "CERTIFIED",
                "internalAgentDisposition": "IMPLEMENTED",
                "externalCliMcpDisposition": "DEFERRED_WITH_REASON",
                "truthApprovalStatus": "APPROVED",
                "truthAssuranceLevel": "STRICT",
                "adapterContract": "N/A with reason: deferred",
                "adapterEvidence": "N/A with reason: deferred",
            },
            "externalUseClaimed": False,
            "expectedDecisions": {
                "internalActivation": "ACTIVATION_READY",
                "externalBodyRead": gate.EXTERNAL_BODY_DENIED,
                "externalOutputUse": gate.EXTERNAL_OUTPUT_DENIED,
            },
            "blockerRouting": {
                "technicalDecisionOwner": "LOCAL",
                "workerTerminalReturn": "BLOCKED_WITH_REASON",
                "operatorQuestionAllowed": False,
            },
            "checkerSources": sorted(gate.REQUIRED_CHECKERS),
            "mutations": ["REGISTRY_ENTRY", "PACKAGE_SOURCE", "TRUTH_PACKET"],
        }

    def text(self, payload: dict, *, include_paths: bool = True) -> str:
        paths = "\n".join(sorted(set().union(*gate.PROJECTION_PATHS.values()))) if include_paths else ""
        return (
            f"{gate.CONTROL_HEADING}\n\nP8\n\n{gate.CONTRACT_HEADING}\n\n"
            f"```json\n{json.dumps(payload)}\n```\n\n{paths}\n"
        )

    def test_internal_active_with_deferred_external_is_feasible(self) -> None:
        payload = self.payload()
        self.assertEqual(gate.validate_contract(payload, self.text(payload)), [])

    def test_active_external_claim_without_implemented_adapter_fails(self) -> None:
        payload = self.payload()
        payload["externalUseClaimed"] = True
        issues = gate.validate_contract(payload, self.text(payload))
        self.assertTrue(any("requires externalCliMcpDisposition IMPLEMENTED" in item for item in issues))

    def test_implemented_external_adapter_requires_evidence(self) -> None:
        payload = self.payload()
        payload["externalUseClaimed"] = True
        payload["targetState"]["externalCliMcpDisposition"] = "IMPLEMENTED"
        issues = gate.validate_contract(payload, self.text(payload))
        self.assertTrue(any("concrete targetState.adapterContract" in item for item in issues))
        self.assertTrue(any("concrete targetState.adapterEvidence" in item for item in issues))

    def test_phase_lifecycle_contradiction_fails(self) -> None:
        payload = self.payload()
        payload["targetState"]["status"] = "APPROVED"
        issues = gate.validate_contract(payload, self.text(payload))
        self.assertTrue(any("P8 requires targetState.status ACTIVE" in item for item in issues))

    def test_operator_question_routing_fails_closed(self) -> None:
        payload = self.payload()
        payload["blockerRouting"]["operatorQuestionAllowed"] = True
        issues = gate.validate_contract(payload, self.text(payload))
        self.assertTrue(any("operatorQuestionAllowed must be false" in item for item in issues))

    def test_missing_generated_dependency_fails(self) -> None:
        payload = self.payload()
        issues = gate.validate_contract(payload, self.text(payload, include_paths=False))
        self.assertTrue(any("omits inferred dependent projections" in item for item in issues))

    def test_non_package_work_order_is_not_applicable(self) -> None:
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "order.md"
            path.write_text("# ordinary work order\n", encoding="utf-8")
            self.assertEqual(gate.check_path(path), [])


if __name__ == "__main__":
    unittest.main()
