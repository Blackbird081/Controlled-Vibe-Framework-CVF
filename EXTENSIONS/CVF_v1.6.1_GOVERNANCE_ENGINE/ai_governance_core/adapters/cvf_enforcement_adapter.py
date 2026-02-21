"""
cvf_enforcement_adapter.py

CVF Enforcement Adapter
------------------------

Maps between:
- Governance Engine decisions: ALLOW, DENY, REVIEW, ESCALATE, SANDBOX
- CVF enforcement actions: ALLOW, BLOCK, NEEDS_APPROVAL, ESCALATE, LOG_ONLY
- CVF phase authority: which phases can override/approve

Also provides CVF-compatible enforcement response format.

Author: Governance Engine — CVF v1.6.1
"""

from enum import Enum
from typing import Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime

from enforcement_layer.shared_enums import GovernanceDecision, ActionTarget


# ===========================
# CVF ENFORCEMENT ACTIONS
# ===========================

class CVFEnforcementAction(str, Enum):
    ALLOW = "ALLOW"
    BLOCK = "BLOCK"
    NEEDS_APPROVAL = "NEEDS_APPROVAL"
    ESCALATE = "ESCALATE"
    LOG_ONLY = "LOG_ONLY"


# ===========================
# CVF PHASE AUTHORITY
# ===========================

class CVFPhase(str, Enum):
    A = "A"  # Intent & Scope
    B = "B"  # Planning & Design
    C = "C"  # Implementation
    D = "D"  # Review & Validation
    E = "E"  # Delivery & Handoff


# Phase authority: which phases can approve/override
_PHASE_AUTHORITY = {
    CVFPhase.A: {"can_approve": False, "can_override": False, "max_risk": "R1"},
    CVFPhase.B: {"can_approve": True, "can_override": False, "max_risk": "R2"},
    CVFPhase.C: {"can_approve": True, "can_override": False, "max_risk": "R3"},
    CVFPhase.D: {"can_approve": True, "can_override": True, "max_risk": "R4"},
    CVFPhase.E: {"can_approve": False, "can_override": False, "max_risk": "R1"},
}


# ===========================
# MAPPING TABLES
# ===========================

_DECISION_TO_CVF: Dict[GovernanceDecision, CVFEnforcementAction] = {
    GovernanceDecision.ALLOW: CVFEnforcementAction.ALLOW,
    GovernanceDecision.DENY: CVFEnforcementAction.BLOCK,
    GovernanceDecision.REVIEW: CVFEnforcementAction.NEEDS_APPROVAL,
    GovernanceDecision.ESCALATE: CVFEnforcementAction.ESCALATE,
    GovernanceDecision.SANDBOX: CVFEnforcementAction.LOG_ONLY,
}

_TARGET_TO_CVF: Dict[ActionTarget, CVFEnforcementAction] = {
    ActionTarget.EXECUTE: CVFEnforcementAction.ALLOW,
    ActionTarget.BLOCK: CVFEnforcementAction.BLOCK,
    ActionTarget.REQUIRE_APPROVAL: CVFEnforcementAction.NEEDS_APPROVAL,
    ActionTarget.ESCALATE: CVFEnforcementAction.ESCALATE,
    ActionTarget.SANDBOX: CVFEnforcementAction.LOG_ONLY,
    ActionTarget.LOG_ONLY: CVFEnforcementAction.LOG_ONLY,
}


# ===========================
# CVF ENFORCEMENT RESPONSE
# ===========================

@dataclass
class CVFEnforcementResponse:
    action: CVFEnforcementAction
    reason: str
    risk_level: str
    phase: Optional[str] = None
    override_allowed: bool = False
    timestamp: str = ""

    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.utcnow().isoformat()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "action": self.action.value,
            "reason": self.reason,
            "risk_level": self.risk_level,
            "phase": self.phase,
            "override_allowed": self.override_allowed,
            "timestamp": self.timestamp,
        }


# ===========================
# ADAPTER CLASS
# ===========================

class CVFEnforcementAdapter:
    """
    Adapts governance engine decisions to CVF enforcement format.
    """

    @staticmethod
    def from_decision(decision: str) -> CVFEnforcementAction:
        """Convert governance decision string to CVF enforcement action."""
        try:
            gd = GovernanceDecision(decision.upper())
        except ValueError:
            return CVFEnforcementAction.LOG_ONLY
        return _DECISION_TO_CVF.get(gd, CVFEnforcementAction.LOG_ONLY)

    @staticmethod
    def from_action_target(target: str) -> CVFEnforcementAction:
        """Convert action router target to CVF enforcement action."""
        try:
            at = ActionTarget(target.upper())
        except ValueError:
            return CVFEnforcementAction.LOG_ONLY
        return _TARGET_TO_CVF.get(at, CVFEnforcementAction.LOG_ONLY)

    @staticmethod
    def build_response(
        decision: str,
        risk_level: str,
        reason: str = "",
        phase: Optional[str] = None,
    ) -> CVFEnforcementResponse:
        """
        Build a complete CVF enforcement response.
        """
        action = CVFEnforcementAdapter.from_decision(decision)

        override_allowed = False
        if phase:
            try:
                cvf_phase = CVFPhase(phase.upper())
                authority = _PHASE_AUTHORITY.get(cvf_phase, {})
                override_allowed = authority.get("can_override", False)
            except ValueError:
                pass

        return CVFEnforcementResponse(
            action=action,
            reason=reason or f"Governance decision: {decision}",
            risk_level=risk_level,
            phase=phase,
            override_allowed=override_allowed,
        )

    @staticmethod
    def check_phase_authority(phase: str, risk_level: str) -> bool:
        """
        Check if a CVF phase has authority for the given risk level.
        Returns True if the phase can handle this risk level.
        """
        try:
            cvf_phase = CVFPhase(phase.upper())
        except ValueError:
            return False

        authority = _PHASE_AUTHORITY.get(cvf_phase, {})
        max_risk = authority.get("max_risk", "R0")

        risk_order = ["R0", "R1", "R2", "R3", "R4"]
        try:
            max_idx = risk_order.index(max_risk)
            current_idx = risk_order.index(risk_level.upper())
            return current_idx <= max_idx
        except ValueError:
            return False

    @staticmethod
    def enrich_result(result: Dict[str, Any], phase: Optional[str] = None) -> Dict[str, Any]:
        """
        Add CVF enforcement metadata to a governance result dict.
        """
        decision = result.get("final_decision", result.get("final_status", "UNKNOWN"))
        risk_level = result.get("cvf_risk_level", "R2")

        response = CVFEnforcementAdapter.build_response(
            decision=decision,
            risk_level=risk_level,
            phase=phase,
        )
        result["cvf_enforcement"] = response.to_dict()
        return result
