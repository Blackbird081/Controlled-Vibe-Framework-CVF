"""
base_policy.py

Core Policy Abstraction Layer
-----------------------------

Purpose:
- Define standardized policy interface
- Enforce deterministic evaluation
- Support explainability
- Enable composable governance rules

This module must NOT perform:
- I/O
- Logging
- External calls
- Side-effects

It only evaluates.

Author: Governance Engine
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum
from typing import Dict, Any, Optional
from datetime import datetime


# =========================
# ENUMS
# =========================

class PolicyDecision(str, Enum):
    ALLOW = "ALLOW"
    DENY = "DENY"
    REVIEW = "REVIEW"
    ESCALATE = "ESCALATE"
    SANDBOX = "SANDBOX"
    NOT_APPLICABLE = "NOT_APPLICABLE"


class PolicySeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


# =========================
# POLICY RESULT
# =========================

@dataclass
class PolicyResult:
    policy_id: str
    decision: PolicyDecision
    severity: PolicySeverity
    risk_weight: float
    reason: Optional[str]
    evaluated_at: datetime


# =========================
# BASE POLICY CLASS
# =========================

class BasePolicy(ABC):
    """
    All policies must inherit from this class.
    """

    def __init__(
        self,
        policy_id: str,
        description: str,
        version: str = "1.0"
    ):
        self.policy_id = policy_id
        self.description = description
        self.version = version

    # =========================
    # PUBLIC ENTRY
    # =========================

    def evaluate(self, context: Dict[str, Any]) -> PolicyResult:
        """
        Deterministic evaluation wrapper.
        """

        decision, severity, risk_weight, reason = self._evaluate(context)

        return PolicyResult(
            policy_id=self.policy_id,
            decision=decision,
            severity=severity,
            risk_weight=self._clamp_risk(risk_weight),
            reason=reason,
            evaluated_at=datetime.utcnow()
        )

    # =========================
    # ABSTRACT METHOD
    # =========================

    @abstractmethod
    def _evaluate(
        self,
        context: Dict[str, Any]
    ) -> (PolicyDecision, PolicySeverity, float, Optional[str]):
        """
        Must return:
            decision
            severity
            risk_weight (0.0 - 1.0)
            reason
        """
        pass

    # =========================
    # INTERNAL HELPERS
    # =========================

    def _clamp_risk(self, value: float) -> float:
        if value < 0.0:
            return 0.0
        if value > 1.0:
            return 1.0
        return value

    def metadata(self) -> Dict[str, Any]:
        return {
            "policy_id": self.policy_id,
            "description": self.description,
            "version": self.version
        }


# =========================
# DEFAULT POLICY ENGINE
# =========================

class BasePolicyEngine(BasePolicy):
    """
    Default/pass-through policy engine.

    Returns ALLOW for all contexts. Serves as the baseline
    when no domain-specific policies are configured.
    Used by CoreOrchestrator as the default policy_engine.
    """

    def __init__(self):
        super().__init__(
            policy_id="DEFAULT",
            description="Default pass-through policy",
            version="1.0"
        )

    def _evaluate(self, context: Dict[str, Any]):
        return (
            PolicyDecision.ALLOW,
            PolicySeverity.LOW,
            0.0,
            "No policy violations detected"
        )