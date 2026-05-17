"""
approval_workflow.py

Enterprise Approval Workflow Engine
------------------------------------

Features:
- Multi-level approval chain
- Risk-based routing
- SLA timeout handling
- Escalation
- Override support
- Audit trail hooks
- Immutable state transitions

Author: Governance Engine
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional, Dict, Callable
from datetime import datetime, timedelta
import uuid


# =========================
# ENUMS
# =========================

class ApprovalStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    ESCALATED = "ESCALATED"
    EXPIRED = "EXPIRED"
    OVERRIDDEN = "OVERRIDDEN"


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


# =========================
# DATA MODELS
# =========================

@dataclass(frozen=True)
class ApprovalStep:
    role: str
    required: bool = True
    sla_hours: int = 24


@dataclass
class ApprovalDecision:
    approver_id: str
    decision: ApprovalStatus
    comment: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.utcnow)


@dataclass
class ApprovalRequest:
    request_id: str
    resource_id: str
    requested_by: str
    risk_level: RiskLevel
    created_at: datetime = field(default_factory=datetime.utcnow)
    status: ApprovalStatus = ApprovalStatus.PENDING
    current_step_index: int = 0
    decisions: List[ApprovalDecision] = field(default_factory=list)
    expires_at: Optional[datetime] = None


# =========================
# APPROVAL WORKFLOW ENGINE
# =========================

class ApprovalWorkflow:

    def __init__(
        self,
        approval_matrix: Dict[RiskLevel, List[ApprovalStep]],
        audit_hook: Optional[Callable[[str, dict], None]] = None,
        escalation_handler: Optional[Callable[[ApprovalRequest], None]] = None
    ):
        """
        approval_matrix:
            RiskLevel -> List of ApprovalStep
        """
        self.approval_matrix = approval_matrix
        self.audit_hook = audit_hook
        self.escalation_handler = escalation_handler

        self._requests: Dict[str, ApprovalRequest] = {}

    # =========================
    # CREATE REQUEST
    # =========================

    def create_request(
        self,
        resource_id: str,
        requested_by: str,
        risk_level: RiskLevel
    ) -> ApprovalRequest:

        request_id = str(uuid.uuid4())
        steps = self.approval_matrix.get(risk_level)

        if not steps:
            raise ValueError(f"No approval matrix defined for risk level: {risk_level}")

        expires_at = datetime.utcnow() + timedelta(hours=steps[0].sla_hours)

        request = ApprovalRequest(
            request_id=request_id,
            resource_id=resource_id,
            requested_by=requested_by,
            risk_level=risk_level,
            expires_at=expires_at
        )

        self._requests[request_id] = request

        self._audit("REQUEST_CREATED", request)

        return request

    # =========================
    # APPROVE / REJECT
    # =========================

    def submit_decision(
        self,
        request_id: str,
        approver_id: str,
        decision: ApprovalStatus,
        comment: Optional[str] = None
    ) -> ApprovalRequest:

        request = self._get_request(request_id)

        if request.status != ApprovalStatus.PENDING:
            raise RuntimeError("Request is not in pending state")

        approval_steps = self.approval_matrix[request.risk_level]
        current_step = approval_steps[request.current_step_index]

        decision_record = ApprovalDecision(
            approver_id=approver_id,
            decision=decision,
            comment=comment
        )

        request.decisions.append(decision_record)

        if decision == ApprovalStatus.REJECTED:
            request.status = ApprovalStatus.REJECTED
            self._audit("REQUEST_REJECTED", request)
            return request

        if decision == ApprovalStatus.APPROVED:
            if request.current_step_index + 1 < len(approval_steps):
                # Move to next step
                request.current_step_index += 1
                next_step = approval_steps[request.current_step_index]
                request.expires_at = datetime.utcnow() + timedelta(hours=next_step.sla_hours)
                self._audit("STEP_APPROVED", request)
            else:
                # Final approval
                request.status = ApprovalStatus.APPROVED
                self._audit("REQUEST_APPROVED", request)

        return request

    # =========================
    # SLA CHECK
    # =========================

    def check_expiration(self, request_id: str):

        request = self._get_request(request_id)

        if request.status != ApprovalStatus.PENDING:
            return request

        if request.expires_at and datetime.utcnow() > request.expires_at:
            request.status = ApprovalStatus.EXPIRED
            self._audit("REQUEST_EXPIRED", request)

            if self.escalation_handler:
                self.escalation_handler(request)

        return request

    # =========================
    # OVERRIDE
    # =========================

    def override_request(
        self,
        request_id: str,
        override_by: str,
        comment: Optional[str] = None
    ) -> ApprovalRequest:

        request = self._get_request(request_id)

        if request.status not in [ApprovalStatus.REJECTED, ApprovalStatus.EXPIRED]:
            raise RuntimeError("Override allowed only for REJECTED or EXPIRED requests")

        decision_record = ApprovalDecision(
            approver_id=override_by,
            decision=ApprovalStatus.OVERRIDDEN,
            comment=comment
        )

        request.decisions.append(decision_record)
        request.status = ApprovalStatus.OVERRIDDEN

        self._audit("REQUEST_OVERRIDDEN", request)

        return request

    # =========================
    # INTERNAL HELPERS
    # =========================

    def _get_request(self, request_id: str) -> ApprovalRequest:
        if request_id not in self._requests:
            raise KeyError("Approval request not found")
        return self._requests[request_id]

    def _audit(self, event_type: str, request: ApprovalRequest):
        if self.audit_hook:
            self.audit_hook(event_type, {
                "request_id": request.request_id,
                "resource_id": request.resource_id,
                "status": request.status.value,
                "risk_level": request.risk_level.value,
                "timestamp": datetime.utcnow().isoformat()
            })
