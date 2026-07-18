from core.policy_engine import (
    CVF_POLICY_ADAPTER_VERSION,
    PolicyEngine,
    build_cvf_policy_adapter_snapshot,
)
from core_orchestrator import (
    GovernanceRequest,
    GovernanceResult,
    build_cvf_orchestration_snapshot,
)
from main import build_local_execution_summary
from telemetry_layer.project_scorecard import GovernanceExecutionRecord


def test_policy_engine_builds_cvf_policy_adapter_snapshot():
    result = PolicyEngine().evaluate(["missing_alt_text"])
    snapshot = build_cvf_policy_adapter_snapshot(result)

    assert snapshot["adapterVersion"] == CVF_POLICY_ADAPTER_VERSION
    assert snapshot["source"] == "governance-engine:core-policy-engine"
    assert snapshot["policyResult"] in ["allow", "requires_approval", "deny"]
    assert snapshot["counts"]["medium"] >= 1


def test_policy_engine_adapter_maps_rejected_to_deny():
    snapshot = PolicyEngine().evaluate_cvf_policy_adapter(["A11Y-MISSING-ALT"])

    assert snapshot["status"] == "REJECTED"
    assert snapshot["policyResult"] == "deny"


def test_orchestrator_snapshot_preserves_result_payload():
    request = GovernanceRequest(
        request_id="REQ-PHASE2B-001",
        artifact_id="ART-PHASE2B-001",
        payload={"complexity_score": 10},
        cvf_phase="BUILD",
        cvf_risk_level="R1",
    )
    result = GovernanceResult(
        report={"final_status": "ALLOW"},
        execution_record=GovernanceExecutionRecord(
            risk_score=0.1,
            final_decision="ALLOW",
            approval_status=None,
            governance_state="ACTIVE",
            ledger_attached=True,
        ),
    )

    snapshot = build_cvf_orchestration_snapshot(request, result)

    assert snapshot["source"] == "governance-engine:core-orchestrator"
    assert snapshot["requestId"] == "REQ-PHASE2B-001"
    assert snapshot["finalDecision"] == "ALLOW"
    assert snapshot["ledgerAttached"] is True


def test_main_local_execution_summary_uses_orchestrator_snapshot():
    request = GovernanceRequest(
        request_id="REQ-LOCAL-SUMMARY",
        artifact_id="ART-LOCAL-SUMMARY",
        payload={},
    )
    result = GovernanceResult(
        report={},
        execution_record=GovernanceExecutionRecord(
            risk_score=0,
            final_decision="ALLOW",
            approval_status=None,
            governance_state=None,
            ledger_attached=False,
        ),
    )

    summary = build_local_execution_summary(request, result)

    assert summary["entrypoint"] == "governance-engine:main"
    assert summary["orchestration"]["requestId"] == "REQ-LOCAL-SUMMARY"
