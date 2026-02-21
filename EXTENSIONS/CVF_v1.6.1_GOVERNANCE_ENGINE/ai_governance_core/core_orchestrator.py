"""
core_orchestrator.py

Governance Core Orchestrator
----------------------------

Purpose:
- Execute full governance pipeline
- Wire all governance components together
- Produce final structured report

Author: Governance Engine
"""

from typing import Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime

# Core Layers
from policy_layer.base_policy import BasePolicyEngine
from enforcement_layer.decision_matrix import DecisionMatrix
from enforcement_layer.action_router import ActionRouter
from approval_layer.approval_workflow import ApprovalWorkflow
from domain_layer.domain_registry import DomainRegistry
from ledger_layer.immutable_ledger import ImmutableLedger
from reports.json_report_builder import (
    JSONReportBuilder,
    GovernanceReportContext
)
from telemetry_layer.project_scorecard import (
    GovernanceExecutionRecord
)


# =====================================
# ORCHESTRATION CONTEXT
# =====================================

@dataclass
class GovernanceRequest:
    request_id: str
    artifact_id: str
    payload: Dict[str, Any]


@dataclass
class GovernanceResult:
    report: Dict[str, Any]
    execution_record: GovernanceExecutionRecord


# =====================================
# CORE ORCHESTRATOR
# =====================================

class CoreOrchestrator:

    def __init__(
        self,
        policy_engine: BasePolicyEngine,
        decision_matrix: DecisionMatrix,
        action_router: ActionRouter,
        approval_workflow: ApprovalWorkflow,
        registry: DomainRegistry,
        ledger: ImmutableLedger
    ):
        self.policy_engine = policy_engine
        self.decision_matrix = decision_matrix
        self.action_router = action_router
        self.approval_workflow = approval_workflow
        self.registry = registry
        self.ledger = ledger
        self.report_builder = JSONReportBuilder()

    # =====================================
    # MAIN PIPELINE
    # =====================================

    def execute(self, request: GovernanceRequest) -> GovernanceResult:

        # 1️⃣ Policy Evaluation
        policy_result = self.policy_engine.evaluate(request.payload)

        # 2️⃣ Risk & Decision Evaluation
        decision_result = self.decision_matrix.evaluate(
            request.payload,
            policy_result
        )

        # 3️⃣ Routing
        routing_result = self.action_router.route(decision_result)

        # 4️⃣ Approval (if required)
        approval_snapshot = None
        if routing_result.get("action_target") == "REQUIRES_APPROVAL":
            approval_snapshot = self.approval_workflow.initiate(
                request.request_id,
                decision_result
            )

        # 5️⃣ Registry Update
        registry_snapshot = self.registry.update(
            request.artifact_id,
            decision_result
        )

        # 6️⃣ Ledger Append
        ledger_reference = self.ledger.append(
            {
                "request_id": request.request_id,
                "decision": decision_result,
                "timestamp": datetime.utcnow().isoformat()
            }
        )

        # 7️⃣ Build Governance Report
        report_context = GovernanceReportContext(
            request_id=request.request_id,
            artifact_id=request.artifact_id,
            decision_result=decision_result,
            routing_result=routing_result,
            approval_snapshot=approval_snapshot,
            registry_snapshot=registry_snapshot,
            ledger_reference=ledger_reference
        )

        report = self.report_builder.build(report_context)

        # 8️⃣ Telemetry Record
        execution_record = GovernanceExecutionRecord(
            risk_score=decision_result.get("risk_score", 0),
            final_decision=decision_result.get("final_decision"),
            approval_status=(
                approval_snapshot.get("status")
                if approval_snapshot else None
            ),
            governance_state=registry_snapshot.get("governance_state")
            if registry_snapshot else None,
            ledger_attached=True if ledger_reference else False
        )

        return GovernanceResult(
            report=report,
            execution_record=execution_record
        )