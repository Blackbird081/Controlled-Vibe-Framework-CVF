"""
project_scorecard.py

Governance Project Scorecard
----------------------------

Purpose:
- Compute governance health score
- Provide quantitative compliance metrics
- Enable telemetry and trend tracking

Author: Governance Engine
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from statistics import mean


# =====================================
# DATA MODELS
# =====================================

@dataclass
class GovernanceExecutionRecord:
    risk_score: float
    final_decision: str
    approval_status: Optional[str]
    governance_state: Optional[str]
    ledger_attached: bool


@dataclass
class ScorecardResult:
    overall_score: float
    risk_index: float
    approval_efficiency: float
    governance_stability: float
    compliance_integrity: float
    execution_count: int


# =====================================
# SCORECARD ENGINE
# =====================================

class ProjectScorecard:

    def evaluate(
        self,
        execution_records: List[GovernanceExecutionRecord]
    ) -> ScorecardResult:

        if not execution_records:
            return ScorecardResult(
                overall_score=0.0,
                risk_index=0.0,
                approval_efficiency=0.0,
                governance_stability=0.0,
                compliance_integrity=0.0,
                execution_count=0
            )

        risk_index = self._compute_risk_index(execution_records)
        approval_efficiency = self._compute_approval_efficiency(execution_records)
        governance_stability = self._compute_governance_stability(execution_records)
        compliance_integrity = self._compute_integrity_score(execution_records)

        overall_score = round(
            (risk_index * 0.30) +
            (approval_efficiency * 0.25) +
            (governance_stability * 0.25) +
            (compliance_integrity * 0.20),
            2
        )

        return ScorecardResult(
            overall_score=overall_score,
            risk_index=risk_index,
            approval_efficiency=approval_efficiency,
            governance_stability=governance_stability,
            compliance_integrity=compliance_integrity,
            execution_count=len(execution_records)
        )

    # =====================================
    # METRIC COMPUTATION
    # =====================================

    def _compute_risk_index(
        self,
        records: List[GovernanceExecutionRecord]
    ) -> float:
        """
        Lower average risk score = higher index.
        Normalize to 0-100.
        """

        avg_risk = mean([r.risk_score for r in records])
        normalized = max(0, 100 - avg_risk)

        return round(normalized, 2)

    def _compute_approval_efficiency(
        self,
        records: List[GovernanceExecutionRecord]
    ) -> float:
        """
        % of approvals successfully completed.
        """

        approved = [
            r for r in records
            if r.approval_status == "APPROVED"
        ]

        efficiency = (len(approved) / len(records)) * 100
        return round(efficiency, 2)

    def _compute_governance_stability(
        self,
        records: List[GovernanceExecutionRecord]
    ) -> float:
        """
        Stability = % of records not escalated or rejected.
        """

        stable = [
            r for r in records
            if r.final_decision in ["AUTO_APPROVE", "APPROVE"]
        ]

        stability = (len(stable) / len(records)) * 100
        return round(stability, 2)

    def _compute_integrity_score(
        self,
        records: List[GovernanceExecutionRecord]
    ) -> float:
        """
        % of executions properly logged to ledger.
        """

        logged = [
            r for r in records
            if r.ledger_attached
        ]

        integrity = (len(logged) / len(records)) * 100
        return round(integrity, 2)