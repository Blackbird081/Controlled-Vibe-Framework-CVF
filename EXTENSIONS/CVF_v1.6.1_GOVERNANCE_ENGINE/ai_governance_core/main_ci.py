"""
main_ci.py

CI Governance Entry Point
--------------------------

Purpose:
- Run governance pipeline in CI
- Output compact JSON
- Enforce fail-fast rules

Author: Governance Engine
"""

import sys
from core_orchestrator import (
    CoreOrchestrator,
    GovernanceRequest
)

from policy_layer.base_policy import BasePolicyEngine
from enforcement_layer.decision_matrix import DecisionMatrix
from enforcement_layer.action_router import ActionRouter
from approval_layer.approval_workflow import ApprovalWorkflow
from domain_layer.domain_registry import DomainRegistry
from ledger_layer.immutable_ledger import ImmutableLedger
from reports.report_formatter import ReportFormatter


def bootstrap_orchestrator() -> CoreOrchestrator:
    return CoreOrchestrator(
        policy_engine=BasePolicyEngine(),
        decision_matrix=DecisionMatrix(rules=[]),
        action_router=ActionRouter(),
        approval_workflow=ApprovalWorkflow(),
        registry=DomainRegistry(),
        ledger=ImmutableLedger()
    )


def should_fail(report: dict) -> bool:

    decision = report.get("decision_analysis", {}).get("final_decision")
    integrity = report.get("integrity", {})
    ledger_trace = report.get("ledger_trace")

    if decision == "REJECT":
        return True

    if not integrity.get("trace_complete", False):
        return True

    if not ledger_trace:
        return True

    return False


def main():

    orchestrator = bootstrap_orchestrator()
    formatter = ReportFormatter()

    request = GovernanceRequest(
        request_id="REQ-CI-001",
        artifact_id="ART-COMPONENT-123",
        payload={
            "complexity_score": 75,
            "ui_change_scope": "CRITICAL",
            "touches_design_system": True
        }
    )

    result = orchestrator.execute(request)

    # Print compact audit JSON (for logs / artifacts)
    print(formatter.format(result.report, "audit_compact"))

    if should_fail(result.report):
        sys.exit(1)

    sys.exit(0)


if __name__ == "__main__":
    main()