"""
core_orchestrator.py

Governance Core Orchestrator
----------------------------

Purpose:
- Execute full governance pipeline
- Wire all governance components together
- Produce final structured report
- Unified entry-point (replaces governance_layer.governance_orchestrator)

Author: Governance Engine
"""

from typing import Dict, Any, Optional, Callable, List
from dataclasses import dataclass, field
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
    cvf_phase: Optional[str] = None
    cvf_risk_level: Optional[str] = None


@dataclass
class GovernanceResult:
    report: Dict[str, Any]
    execution_record: GovernanceExecutionRecord
    compliance_result: Optional[Dict[str, Any]] = None
    brand_result: Optional[Dict[str, Any]] = None


# =====================================
# CORE ORCHESTRATOR
# =====================================

class CoreOrchestrator:
    """
    Unified governance orchestrator with DI-based 8-step pipeline.

    Optional components (compliance_engine, brand_guardian, override_engine,
    telemetry_exporter, audit_hook) extend the pipeline for domain-specific
    governance (brand safety, HTML compliance, etc.).
    """

    def __init__(
        self,
        policy_engine: BasePolicyEngine,
        decision_matrix: DecisionMatrix,
        action_router: ActionRouter,
        approval_workflow: ApprovalWorkflow,
        registry: DomainRegistry,
        ledger: ImmutableLedger,
        compliance_engine=None,
        brand_guardian=None,
        override_engine=None,
        telemetry_exporter=None,
        audit_hook: Optional[Callable[[str, dict], None]] = None
    ):
        self.policy_engine = policy_engine
        self.decision_matrix = decision_matrix
        self.action_router = action_router
        self.approval_workflow = approval_workflow
        self.registry = registry
        self.ledger = ledger
        self.report_builder = JSONReportBuilder()

        # Optional domain-specific components
        self.compliance_engine = compliance_engine
        self.brand_guardian = brand_guardian
        self.override_engine = override_engine
        self.telemetry_exporter = telemetry_exporter
        self.audit_hook = audit_hook

    # =====================================
    # MAIN PIPELINE
    # =====================================

    def execute(self, request: GovernanceRequest) -> GovernanceResult:

        # 1️⃣ Policy Evaluation
        policy_result = self.policy_engine.evaluate(request.payload)

        # 2️⃣ Risk & Decision Evaluation
        evaluation = self.decision_matrix.evaluate(request.payload)

        # Normalize to dict for downstream consumers
        decision_result = {
            "final_decision": evaluation.final_decision.value,
            "risk_score": evaluation.risk_score,
            "triggered_rules": evaluation.triggered_rules,
            "evaluated_at": evaluation.evaluated_at.isoformat(),
        }

        # 2.5 Compliance Check (optional)
        compliance_result = None
        if self.compliance_engine and "html" in request.payload:
            compliance_result = self.compliance_engine.validate(
                request.payload.get("html", ""),
                request.payload.get("css", "")
            )

        # 2.6 Brand Check (optional)
        brand_result = None
        if self.brand_guardian and "approved_system" in request.payload:
            brand_result = self.brand_guardian.protect(
                request.payload.get("approved_system", {}),
                request.payload.get("new_system", {})
            )

        # 2.7 Override Check (optional)
        override_used = False
        if self.override_engine:
            project = request.payload.get("project", request.artifact_id)
            if compliance_result and compliance_result.get("status") == "REJECTED":
                if self.override_engine.is_override_allowed(project, "COMPLIANCE"):
                    override_used = True
            if brand_result and brand_result.get("freeze", {}).get("freeze"):
                if self.override_engine.is_override_allowed(project, "BRAND_DRIFT"):
                    override_used = True

        # 3️⃣ Routing
        from enforcement_layer.action_router import ActionContext
        action_context = ActionContext(
            request_id=request.request_id,
            resource_id=request.artifact_id,
            actor_id=request.payload.get("actor_id", "system"),
            risk_score=evaluation.risk_score,
            governance_decision=evaluation.final_decision,
        )
        routing_target = self.action_router.route(action_context)
        routing_result = {
            "action_target": routing_target.value,
        }

        # 4️⃣ Approval (if required)
        approval_snapshot = None
        if routing_target.value == "REQUIRE_APPROVAL":
            approval_snapshot = {
                "status": "PENDING",
                "request_id": request.request_id,
                "triggered_by": "governance_pipeline",
            }

        # 5️⃣ Registry Update
        registry_snapshot = self.registry.update(
            request.artifact_id,
            evaluation
        )

        # 6️⃣ Ledger Append (with CVF metadata)
        ledger_entry = {
            "request_id": request.request_id,
            "decision": decision_result,
            "timestamp": datetime.utcnow().isoformat()
        }
        if request.cvf_phase:
            ledger_entry["cvf_phase"] = request.cvf_phase
        if request.cvf_risk_level:
            ledger_entry["cvf_risk_level"] = request.cvf_risk_level
        if override_used:
            ledger_entry["override_used"] = True

        ledger_reference = self.ledger.append_event(ledger_entry)

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

        # 8.5 Telemetry Export (optional)
        if self.telemetry_exporter and compliance_result:
            combined = {
                "compliance": compliance_result,
                "brand": brand_result or {},
                "override_used": override_used,
                "final_status": report.get("final_status", "UNKNOWN")
            }
            self.telemetry_exporter.export(
                request.payload.get("project", request.artifact_id),
                combined
            )

        # 8.6 Audit Hook (optional)
        if self.audit_hook:
            self.audit_hook("PIPELINE_COMPLETE", {
                "request_id": request.request_id,
                "artifact_id": request.artifact_id,
                "final_decision": execution_record.final_decision,
                "risk_score": execution_record.risk_score,
                "override_used": override_used,
                "timestamp": datetime.utcnow().isoformat()
            })

        return GovernanceResult(
            report=report,
            execution_record=execution_record,
            compliance_result=compliance_result,
            brand_result=brand_result
        )