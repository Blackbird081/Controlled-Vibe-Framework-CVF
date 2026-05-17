"""
json_report_builder.py

Governance JSON Report Builder
------------------------------

Purpose:
- Generate structured governance reports
- Aggregate decision, routing, approval and registry data
- Support compliance export
- Remain I/O agnostic (returns dict only)

Author: Governance Engine
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Dict, Any, List, Optional


# =========================
# REPORT MODELS
# =========================

@dataclass
class GovernanceReportContext:
    request_id: str
    artifact_id: str
    decision_result: Dict[str, Any]
    routing_result: Dict[str, Any]
    approval_snapshot: Optional[Dict[str, Any]]
    registry_snapshot: Optional[Dict[str, Any]]
    ledger_reference: Optional[Dict[str, Any]]


# =========================
# REPORT BUILDER
# =========================

class JSONReportBuilder:

    def __init__(self, report_version: str = "1.0"):
        self.report_version = report_version

    # =========================
    # MAIN ENTRY
    # =========================

    def build(self, context: GovernanceReportContext) -> Dict[str, Any]:

        report = {
            "report_metadata": self._build_metadata(),
            "request_summary": self._build_request_summary(context),
            "decision_analysis": self._build_decision_section(context),
            "routing_analysis": self._build_routing_section(context),
            "approval_status": self._build_approval_section(context),
            "registry_state": self._build_registry_section(context),
            "ledger_trace": self._build_ledger_section(context),
            "integrity": self._build_integrity_block(context)
        }

        return report

    # =========================
    # SECTION BUILDERS
    # =========================

    def _build_metadata(self) -> Dict[str, Any]:
        return {
            "generated_at": datetime.utcnow().isoformat(),
            "report_version": self.report_version,
            "report_type": "GOVERNANCE_EXECUTION_TRACE"
        }

    def _build_request_summary(
        self,
        context: GovernanceReportContext
    ) -> Dict[str, Any]:

        return {
            "request_id": context.request_id,
            "artifact_id": context.artifact_id
        }

    def _build_decision_section(
        self,
        context: GovernanceReportContext
    ) -> Dict[str, Any]:

        decision = context.decision_result or {}

        return {
            "final_decision": decision.get("final_decision"),
            "risk_score": decision.get("risk_score"),
            "triggered_rules": decision.get("triggered_rules", []),
            "evaluated_at": decision.get("evaluated_at")
        }

    def _build_routing_section(
        self,
        context: GovernanceReportContext
    ) -> Dict[str, Any]:

        routing = context.routing_result or {}

        return {
            "action_target": routing.get("action_target"),
            "routed_at": routing.get("routed_at"),
            "risk_score_used": routing.get("risk_score")
        }

    def _build_approval_section(
        self,
        context: GovernanceReportContext
    ) -> Optional[Dict[str, Any]]:

        if not context.approval_snapshot:
            return None

        approval = context.approval_snapshot

        return {
            "status": approval.get("status"),
            "current_step_index": approval.get("current_step_index"),
            "approval_chain": approval.get("approval_chain"),
            "expires_at": approval.get("expires_at")
        }

    def _build_registry_section(
        self,
        context: GovernanceReportContext
    ) -> Optional[Dict[str, Any]]:

        if not context.registry_snapshot:
            return None

        registry = context.registry_snapshot

        return {
            "artifact_status": registry.get("status"),
            "governance_state": registry.get("governance_state"),
            "current_version": registry.get("current_version"),
            "risk_level": registry.get("risk_level")
        }

    def _build_ledger_section(
        self,
        context: GovernanceReportContext
    ) -> Optional[Dict[str, Any]]:

        if not context.ledger_reference:
            return None

        return {
            "ledger_id": context.ledger_reference.get("ledger_id"),
            "latest_block_index": context.ledger_reference.get("latest_block_index"),
            "latest_hash": context.ledger_reference.get("latest_hash")
        }

    def _build_integrity_block(
        self,
        context: GovernanceReportContext
    ) -> Dict[str, Any]:

        return {
            "has_approval": context.approval_snapshot is not None,
            "has_registry_snapshot": context.registry_snapshot is not None,
            "has_ledger_reference": context.ledger_reference is not None,
            "trace_complete": all([
                context.decision_result is not None,
                context.routing_result is not None
            ])
        }