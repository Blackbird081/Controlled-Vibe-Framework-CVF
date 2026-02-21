"""
cvf_risk_adapter.py

CVF Risk Level Adapter
-----------------------

Maps between:
- CVF canonical risk levels: R0 (Minimal), R1 (Low), R2 (Moderate), R3 (High), R4 (Critical)
- Governance Engine internal: LOW, MEDIUM, HIGH, CRITICAL

Also converts numeric risk_score (0.0–1.0) to CVF risk tiers.

Author: Governance Engine — CVF v1.6.1
"""

from enum import Enum
from typing import Dict, Optional


# ===========================
# CVF CANONICAL RISK LEVELS
# ===========================

class CVFRiskLevel(str, Enum):
    R0 = "R0"  # Minimal — no governance gate needed
    R1 = "R1"  # Low — log only
    R2 = "R2"  # Moderate — review recommended
    R3 = "R3"  # High — approval required
    R4 = "R4"  # Critical — block + escalate


class InternalRiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


# ===========================
# MAPPING TABLES
# ===========================

_INTERNAL_TO_CVF: Dict[InternalRiskLevel, CVFRiskLevel] = {
    InternalRiskLevel.LOW: CVFRiskLevel.R1,
    InternalRiskLevel.MEDIUM: CVFRiskLevel.R2,
    InternalRiskLevel.HIGH: CVFRiskLevel.R3,
    InternalRiskLevel.CRITICAL: CVFRiskLevel.R4,
}

_CVF_TO_INTERNAL: Dict[CVFRiskLevel, InternalRiskLevel] = {
    CVFRiskLevel.R0: InternalRiskLevel.LOW,
    CVFRiskLevel.R1: InternalRiskLevel.LOW,
    CVFRiskLevel.R2: InternalRiskLevel.MEDIUM,
    CVFRiskLevel.R3: InternalRiskLevel.HIGH,
    CVFRiskLevel.R4: InternalRiskLevel.CRITICAL,
}


# ===========================
# ADAPTER CLASS
# ===========================

class CVFRiskAdapter:
    """
    Bidirectional adapter between CVF risk tiers and
    governance engine internal risk levels.
    """

    # --- Direction: Internal → CVF ---

    @staticmethod
    def to_cvf(internal_level: str) -> CVFRiskLevel:
        """Convert internal risk level string to CVF risk tier."""
        try:
            level = InternalRiskLevel(internal_level.upper())
        except ValueError:
            return CVFRiskLevel.R2  # safe default
        return _INTERNAL_TO_CVF.get(level, CVFRiskLevel.R2)

    @staticmethod
    def score_to_cvf(risk_score: float) -> CVFRiskLevel:
        """
        Convert numeric risk_score (0.0–1.0) to CVF risk tier.

        Thresholds:
          0.0–0.2  → R0 (Minimal)
          0.2–0.4  → R1 (Low)
          0.4–0.6  → R2 (Moderate)
          0.6–0.8  → R3 (High)
          0.8–1.0  → R4 (Critical)
        """
        if risk_score < 0.2:
            return CVFRiskLevel.R0
        elif risk_score < 0.4:
            return CVFRiskLevel.R1
        elif risk_score < 0.6:
            return CVFRiskLevel.R2
        elif risk_score < 0.8:
            return CVFRiskLevel.R3
        else:
            return CVFRiskLevel.R4

    # --- Direction: CVF → Internal ---

    @staticmethod
    def from_cvf(cvf_level: str) -> InternalRiskLevel:
        """Convert CVF risk tier string to internal risk level."""
        try:
            level = CVFRiskLevel(cvf_level.upper())
        except ValueError:
            return InternalRiskLevel.MEDIUM  # safe default
        return _CVF_TO_INTERNAL.get(level, InternalRiskLevel.MEDIUM)

    @staticmethod
    def cvf_to_score(cvf_level: str) -> float:
        """
        Convert CVF risk tier to a representative numeric score.
        """
        scores = {
            CVFRiskLevel.R0: 0.1,
            CVFRiskLevel.R1: 0.3,
            CVFRiskLevel.R2: 0.5,
            CVFRiskLevel.R3: 0.7,
            CVFRiskLevel.R4: 0.9,
        }
        try:
            level = CVFRiskLevel(cvf_level.upper())
        except ValueError:
            return 0.5
        return scores.get(level, 0.5)

    # --- Enrichment helper ---

    @staticmethod
    def enrich_result(result: dict) -> dict:
        """
        Add CVF risk metadata to a governance result dict.

        Expects result to contain 'risk_score' (float).
        Adds 'cvf_risk_level' and 'cvf_risk_tier'.
        """
        risk_score = result.get("risk_score", 0.0)
        cvf_level = CVFRiskAdapter.score_to_cvf(risk_score)

        result["cvf_risk_level"] = cvf_level.value
        result["cvf_risk_tier"] = {
            CVFRiskLevel.R0: "Minimal",
            CVFRiskLevel.R1: "Low",
            CVFRiskLevel.R2: "Moderate",
            CVFRiskLevel.R3: "High",
            CVFRiskLevel.R4: "Critical",
        }.get(cvf_level, "Unknown")

        return result
