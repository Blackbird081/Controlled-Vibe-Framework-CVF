"""
test_integration.py

Integration tests — full governance pipeline end-to-end.
"""

import pytest
import os
import json
import tempfile
import shutil

from core_orchestrator import CoreOrchestrator, GovernanceRequest
from policy_layer.base_policy import BasePolicyEngine
from enforcement_layer.decision_matrix import DecisionMatrix, PolicyRule
from enforcement_layer.action_router import ActionRouter
from enforcement_layer.shared_enums import GovernanceDecision
from approval_layer.approval_workflow import (
    ApprovalWorkflow,
    RiskLevel,
    ApprovalStep,
)
from domain_layer.domain_registry import DomainRegistry
from ledger_layer.immutable_ledger import ImmutableLedger
from adapters.cvf_risk_adapter import CVFRiskAdapter
from adapters.cvf_quality_adapter import CVFQualityAdapter
from adapters.cvf_enforcement_adapter import CVFEnforcementAdapter


@pytest.fixture
def tmp_env(tmp_dir):
    """Set up temporary ledger and registry files."""
    ledger_path = os.path.join(tmp_dir, "ledger_chain.json")
    with open(ledger_path, "w") as f:
        json.dump([], f)
    return {"tmp_dir": tmp_dir, "ledger_path": ledger_path}


@pytest.fixture
def orchestrator(tmp_env):
    """Create a fully-wired orchestrator with tmp files."""
    approval_matrix = {
        RiskLevel.LOW: [ApprovalStep(role="DEV", sla_hours=24)],
        RiskLevel.MEDIUM: [ApprovalStep(role="LEAD", sla_hours=12)],
        RiskLevel.HIGH: [
            ApprovalStep(role="LEAD", sla_hours=8),
            ApprovalStep(role="SEC", sla_hours=4),
        ],
        RiskLevel.CRITICAL: [
            ApprovalStep(role="SEC", sla_hours=4),
            ApprovalStep(role="EXEC", sla_hours=2),
        ],
    }

    rules = [
        PolicyRule(
            rule_id="R-HIGH-COMPLEXITY",
            description="Block high complexity",
            condition=lambda ctx: ctx.get("complexity_score", 0) > 80,
            decision=GovernanceDecision.DENY,
            risk_weight=0.8,
            priority=10,
        ),
        PolicyRule(
            rule_id="R-MEDIUM-COMPLEXITY",
            description="Review medium complexity",
            condition=lambda ctx: ctx.get("complexity_score", 0) > 50,
            decision=GovernanceDecision.REVIEW,
            risk_weight=0.4,
            priority=20,
        ),
    ]

    return CoreOrchestrator(
        policy_engine=BasePolicyEngine(),
        decision_matrix=DecisionMatrix(rules=rules),
        action_router=ActionRouter(),
        approval_workflow=ApprovalWorkflow(approval_matrix=approval_matrix),
        registry=DomainRegistry(),
        ledger=ImmutableLedger(ledger_path=tmp_env["ledger_path"]),
    )


class TestEndToEnd:
    """Full pipeline integration tests."""

    def test_low_risk_passes(self, orchestrator):
        request = GovernanceRequest(
            request_id="REQ-001",
            artifact_id="ART-001",
            payload={"complexity_score": 30},
        )
        result = orchestrator.execute(request)
        assert result.report is not None
        assert result.execution_record is not None

    def test_high_risk_blocked(self, orchestrator):
        request = GovernanceRequest(
            request_id="REQ-002",
            artifact_id="ART-002",
            payload={"complexity_score": 90},
        )
        result = orchestrator.execute(request)
        assert result.execution_record.risk_score >= 0.8

    def test_cvf_phase_in_ledger(self, orchestrator, tmp_env):
        request = GovernanceRequest(
            request_id="REQ-003",
            artifact_id="ART-003",
            payload={"complexity_score": 30},
            cvf_phase="C",
            cvf_risk_level="R2",
        )
        result = orchestrator.execute(request)

        with open(tmp_env["ledger_path"], "r") as f:
            chain = json.load(f)
        assert len(chain) >= 1
        last_event = chain[-1]["event"]
        assert last_event.get("cvf_phase") == "C"
        assert last_event.get("cvf_risk_level") == "R2"


class TestAdapterEnrichment:
    """Test that adapters correctly enrich results."""

    def test_risk_adapter_enriches(self, sample_governance_result):
        result = CVFRiskAdapter.enrich_result(sample_governance_result)
        assert result["cvf_risk_level"] == "R3"

    def test_quality_adapter_enriches(self, sample_governance_result):
        result = CVFQualityAdapter.enrich_result(sample_governance_result)
        assert "cvf_quality" in result
        assert result["cvf_quality"]["overall"] > 0

    def test_enforcement_adapter_enriches(self, sample_governance_result):
        result = CVFEnforcementAdapter.enrich_result(
            sample_governance_result, phase="D"
        )
        assert result["cvf_enforcement"]["action"] == "ALLOW"
        assert result["cvf_enforcement"]["override_allowed"] is True

    def test_full_enrichment_chain(self, sample_governance_result):
        """All three adapters applied in sequence."""
        result = sample_governance_result
        CVFRiskAdapter.enrich_result(result)
        CVFQualityAdapter.enrich_result(result)
        CVFEnforcementAdapter.enrich_result(result, phase="C")

        assert "cvf_risk_level" in result
        assert "cvf_quality" in result
        assert "cvf_enforcement" in result
