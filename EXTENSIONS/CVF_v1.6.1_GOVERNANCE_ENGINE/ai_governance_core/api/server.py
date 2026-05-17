"""
server.py

CVF Governance Engine — FastAPI Server
---------------------------------------

Exposes the governance pipeline as a REST API with:
- POST /api/v1/evaluate     — Run full governance evaluation
- POST /api/v1/approve      — Submit approval decision
- GET  /api/v1/ledger       — Query ledger entries
- GET  /api/v1/health       — Health check
- GET  /api/v1/risk-convert — Convert between CVF/internal risk levels

All responses follow CVF-compatible JSON format.

Usage:
  uvicorn api.server:app --host 0.0.0.0 --port 8100

Author: Governance Engine — CVF v1.6.1
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from datetime import datetime
import json
import os

# Core
from core_orchestrator import CoreOrchestrator, GovernanceRequest, GovernanceResult
from policy_layer.base_policy import BasePolicyEngine
from enforcement_layer.decision_matrix import DecisionMatrix
from enforcement_layer.action_router import ActionRouter
from approval_layer.approval_workflow import (
    ApprovalWorkflow,
    ApprovalStatus,
    RiskLevel,
    ApprovalStep,
)
from domain_layer.domain_registry import DomainRegistry
from ledger_layer.immutable_ledger import ImmutableLedger

# Adapters
from adapters.cvf_risk_adapter import CVFRiskAdapter
from adapters.cvf_quality_adapter import CVFQualityAdapter
from adapters.cvf_enforcement_adapter import CVFEnforcementAdapter


# ===========================
# APP SETUP
# ===========================

app = FastAPI(
    title="CVF Governance Engine API",
    description="AI Governance Pipeline — CVF v1.6.1",
    version="1.6.1",
)


# ===========================
# SINGLETON ORCHESTRATOR
# ===========================

_default_approval_matrix = {
    RiskLevel.LOW: [ApprovalStep(role="DEVELOPER", sla_hours=24)],
    RiskLevel.MEDIUM: [
        ApprovalStep(role="TEAM_LEAD", sla_hours=12),
    ],
    RiskLevel.HIGH: [
        ApprovalStep(role="TEAM_LEAD", sla_hours=8),
        ApprovalStep(role="SECURITY_OFFICER", sla_hours=4),
    ],
    RiskLevel.CRITICAL: [
        ApprovalStep(role="SECURITY_OFFICER", sla_hours=4),
        ApprovalStep(role="EXECUTIVE_APPROVER", sla_hours=2),
    ],
}

_approval_workflow = ApprovalWorkflow(approval_matrix=_default_approval_matrix)

_orchestrator = CoreOrchestrator(
    policy_engine=BasePolicyEngine(),
    decision_matrix=DecisionMatrix(rules=[]),
    action_router=ActionRouter(),
    approval_workflow=_approval_workflow,
    registry=DomainRegistry(),
    ledger=ImmutableLedger(),
)


# ===========================
# REQUEST / RESPONSE MODELS
# ===========================

class EvaluateRequest(BaseModel):
    request_id: str = Field(..., description="Unique request identifier")
    artifact_id: str = Field(..., description="Artifact being evaluated")
    payload: Dict[str, Any] = Field(..., description="Evaluation context")
    cvf_phase: Optional[str] = Field(None, description="CVF phase (A-E)")
    cvf_risk_level: Optional[str] = Field(None, description="CVF risk level (R0-R4)")


class ApproveRequest(BaseModel):
    request_id: str
    approver_id: str
    decision: str = Field(..., description="APPROVED or REJECTED")
    comment: Optional[str] = None


class RiskConvertRequest(BaseModel):
    value: str = Field(..., description="Risk level or score to convert")
    direction: str = Field("to_cvf", description="to_cvf or from_cvf")


class CVFResponse(BaseModel):
    status: str
    timestamp: str
    data: Dict[str, Any]


# ===========================
# ENDPOINTS
# ===========================

@app.get("/api/v1/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "CVF Governance Engine",
        "version": "1.6.1",
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.post("/api/v1/evaluate", response_model=CVFResponse)
async def evaluate(req: EvaluateRequest):
    """
    Run the full governance pipeline on the provided payload.
    Returns CVF-enriched result with risk, quality, and enforcement metadata.
    """
    try:
        gov_request = GovernanceRequest(
            request_id=req.request_id,
            artifact_id=req.artifact_id,
            payload=req.payload,
            cvf_phase=req.cvf_phase,
            cvf_risk_level=req.cvf_risk_level,
        )

        result = _orchestrator.execute(gov_request)

        # Enrich with CVF adapters
        report = result.report
        report["risk_score"] = result.execution_record.risk_score

        CVFRiskAdapter.enrich_result(report)
        CVFQualityAdapter.enrich_result(report)
        CVFEnforcementAdapter.enrich_result(report, phase=req.cvf_phase)

        return CVFResponse(
            status="ok",
            timestamp=datetime.utcnow().isoformat(),
            data={
                "report": report,
                "execution_record": result.execution_record.__dict__,
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/approve", response_model=CVFResponse)
async def approve(req: ApproveRequest):
    """Submit an approval or rejection decision."""
    try:
        status_map = {
            "APPROVED": ApprovalStatus.APPROVED,
            "REJECTED": ApprovalStatus.REJECTED,
        }
        decision = status_map.get(req.decision.upper())
        if not decision:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid decision: {req.decision}. Use APPROVED or REJECTED.",
            )

        updated = _approval_workflow.submit_decision(
            request_id=req.request_id,
            approver_id=req.approver_id,
            decision=decision,
            comment=req.comment,
        )

        return CVFResponse(
            status="ok",
            timestamp=datetime.utcnow().isoformat(),
            data={
                "request_id": updated.request_id,
                "status": updated.status.value,
                "current_step": updated.current_step_index,
                "total_decisions": len(updated.decisions),
            },
        )
    except KeyError:
        raise HTTPException(status_code=404, detail="Approval request not found")
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/v1/ledger", response_model=CVFResponse)
async def ledger(limit: int = 50):
    """Query the most recent ledger entries."""
    ledger_path = "ledger_layer/ledger_chain.json"
    try:
        if os.path.exists(ledger_path):
            with open(ledger_path, "r") as f:
                chain = json.load(f)
        else:
            chain = []

        entries = chain[-limit:] if len(chain) > limit else chain

        return CVFResponse(
            status="ok",
            timestamp=datetime.utcnow().isoformat(),
            data={
                "total_blocks": len(chain),
                "returned": len(entries),
                "entries": entries,
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/risk-convert", response_model=CVFResponse)
async def risk_convert(req: RiskConvertRequest):
    """Convert between CVF risk levels (R0-R4) and internal levels."""
    try:
        if req.direction == "to_cvf":
            # Try numeric first
            try:
                score = float(req.value)
                cvf_level = CVFRiskAdapter.score_to_cvf(score)
                return CVFResponse(
                    status="ok",
                    timestamp=datetime.utcnow().isoformat(),
                    data={
                        "input": req.value,
                        "cvf_level": cvf_level.value,
                        "direction": "score → CVF",
                    },
                )
            except ValueError:
                pass

            cvf_level = CVFRiskAdapter.to_cvf(req.value)
            return CVFResponse(
                status="ok",
                timestamp=datetime.utcnow().isoformat(),
                data={
                    "input": req.value,
                    "cvf_level": cvf_level.value,
                    "direction": "internal → CVF",
                },
            )
        else:
            internal = CVFRiskAdapter.from_cvf(req.value)
            score = CVFRiskAdapter.cvf_to_score(req.value)
            return CVFResponse(
                status="ok",
                timestamp=datetime.utcnow().isoformat(),
                data={
                    "input": req.value,
                    "internal_level": internal.value,
                    "numeric_score": score,
                    "direction": "CVF → internal",
                },
            )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
