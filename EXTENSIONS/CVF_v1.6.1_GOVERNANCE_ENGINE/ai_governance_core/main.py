"""
main.py

Local Governance Execution Entry Point
---------------------------------------

Purpose:
- Run governance pipeline locally
- Print human-readable report
- For manual validation / development

Author: Governance Engine
"""

import json
from core_orchestrator import (
    CoreOrchestrator,
    GovernanceRequest
)

# Layer imports (wiring)
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


def main():

    orchestrator = bootstrap_orchestrator()
    formatter = ReportFormatter()

    # Example payload (replace in real usage)
    request = GovernanceRequest(
        request_id="REQ-LOCAL-001",
        artifact_id="ART-UI-LOGIN",
        payload={
            "complexity_score": 60,
            "ui_change_scope": "MAJOR",
            "touches_design_system": True
        }
    )

    result = orchestrator.execute(request)

    print("\n===== PRETTY JSON REPORT =====\n")
    print(formatter.format(result.report, "json_pretty"))

    print("\n===== MARKDOWN REPORT =====\n")
    print(formatter.format(result.report, "markdown"))

    print("\n===== TELEMETRY RECORD =====\n")
    print(json.dumps(result.execution_record.__dict__, indent=2))


if __name__ == "__main__":
    main()