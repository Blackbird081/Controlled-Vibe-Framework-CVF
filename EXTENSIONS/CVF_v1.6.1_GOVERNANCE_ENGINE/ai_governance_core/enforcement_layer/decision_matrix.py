"""
decision_matrix.py

Governance Decision Matrix Engine
----------------------------------

Purpose:
- Evaluate policy rules
- Compute risk score
- Produce governance decision
- Remain deterministic & side-effect free

This module does NOT execute actions.
It only decides.

Author: Governance Engine
"""

from dataclasses import dataclass
from typing import List, Dict, Callable, Optional, Any
from datetime import datetime

from .shared_enums import GovernanceDecision


# =========================
# DATA STRUCTURES
# =========================

@dataclass
class PolicyRule:
    rule_id: str
    description: str
    condition: Callable[[Dict[str, Any]], bool]
    decision: GovernanceDecision
    risk_weight: float = 0.0
    priority: int = 100  # lower number = higher priority


@dataclass
class EvaluationResult:
    final_decision: GovernanceDecision
    risk_score: float
    triggered_rules: List[str]
    evaluated_at: datetime


# =========================
# DECISION MATRIX ENGINE
# =========================

class DecisionMatrix:

    def __init__(self, rules: List[PolicyRule]):
        """
        Rules must be pre-validated.
        """
        # Sort rules by priority
        self.rules = sorted(rules, key=lambda r: r.priority)

    # =========================
    # EVALUATION ENTRY
    # =========================

    def evaluate(self, context: Dict[str, Any]) -> EvaluationResult:

        triggered_rules = []
        risk_score = 0.0
        highest_decision: Optional[GovernanceDecision] = None

        for rule in self.rules:
            if rule.condition(context):
                triggered_rules.append(rule.rule_id)
                risk_score += rule.risk_weight

                highest_decision = self._resolve_decision_priority(
                    highest_decision,
                    rule.decision
                )

        # Default fallback
        if highest_decision is None:
            highest_decision = GovernanceDecision.ALLOW

        # Clamp risk score
        risk_score = min(max(risk_score, 0.0), 1.0)

        return EvaluationResult(
            final_decision=highest_decision,
            risk_score=risk_score,
            triggered_rules=triggered_rules,
            evaluated_at=datetime.utcnow()
        )

    # =========================
    # DECISION PRIORITY LOGIC
    # =========================

    def _resolve_decision_priority(
        self,
        current: Optional[GovernanceDecision],
        new: GovernanceDecision
    ) -> GovernanceDecision:

        if current is None:
            return new

        priority_order = [
            GovernanceDecision.DENY,
            GovernanceDecision.ESCALATE,
            GovernanceDecision.REVIEW,
            GovernanceDecision.SANDBOX,
            GovernanceDecision.ALLOW
        ]

        current_index = priority_order.index(current)
        new_index = priority_order.index(new)

        # Lower index = higher severity
        return current if current_index <= new_index else new