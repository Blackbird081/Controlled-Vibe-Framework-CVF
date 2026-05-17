"""
cvf_quality_adapter.py

CVF Quality Score Adapter
--------------------------

Maps governance engine evaluation results to CVF's
4-dimension quality scoring model:

1. Correctness  — Does the output meet functional requirements?
2. Safety       — Are safety/compliance constraints satisfied?
3. Alignment    — Is the output aligned with user intent?
4. Quality      — Overall craftsmanship / code quality score

Each dimension: 0–100. Overall: weighted average.

Author: Governance Engine — CVF v1.6.1
"""

from dataclasses import dataclass
from typing import Dict, Any, Optional


# ===========================
# CVF QUALITY SCORE
# ===========================

@dataclass
class CVFQualityScore:
    correctness: float  # 0–100
    safety: float       # 0–100
    alignment: float    # 0–100
    quality: float      # 0–100

    @property
    def overall(self) -> float:
        """Weighted average: safety gets 2x weight."""
        weights = {
            "correctness": 1.0,
            "safety": 2.0,
            "alignment": 1.0,
            "quality": 1.0,
        }
        total_weight = sum(weights.values())
        weighted_sum = (
            self.correctness * weights["correctness"]
            + self.safety * weights["safety"]
            + self.alignment * weights["alignment"]
            + self.quality * weights["quality"]
        )
        return round(weighted_sum / total_weight, 2)

    def to_dict(self) -> Dict[str, float]:
        return {
            "correctness": self.correctness,
            "safety": self.safety,
            "alignment": self.alignment,
            "quality": self.quality,
            "overall": self.overall,
        }

    @property
    def grade(self) -> str:
        """Letter grade based on overall score."""
        score = self.overall
        if score >= 90:
            return "A"
        elif score >= 80:
            return "B"
        elif score >= 70:
            return "C"
        elif score >= 60:
            return "D"
        else:
            return "F"


# ===========================
# ADAPTER
# ===========================

class CVFQualityAdapter:
    """
    Converts governance engine results into CVF quality scores.

    Input: governance result dict with keys like:
      - compliance.score (0–100)
      - brand.drift.drift_score (0–100, lower=better)
      - risk_score (0.0–1.0)
      - final_status (APPROVED/REJECTED/FROZEN)
    """

    @staticmethod
    def from_governance_result(result: Dict[str, Any]) -> CVFQualityScore:
        """
        Derive CVF quality dimensions from a governance evaluation result.
        """
        compliance = result.get("compliance", {})
        brand = result.get("brand", {})
        risk_score = result.get("risk_score", 0.0)
        final_status = result.get("final_status", "UNKNOWN")

        # --- Correctness ---
        # Based on compliance score (0–100 direct)
        correctness = compliance.get("score", 70)

        # --- Safety ---
        # Inverse of risk_score: high risk → low safety
        safety = max(0, round((1.0 - risk_score) * 100, 2))

        # --- Alignment ---
        # Brand drift: low drift = high alignment
        drift_score = brand.get("drift", {}).get("drift_score", 0)
        alignment = max(0, 100 - drift_score)

        # --- Quality ---
        # Composite: penalize rejection/freeze, reward approval
        status_penalty = {
            "APPROVED": 0,
            "REJECTED": 40,
            "FROZEN": 30,
            "UNKNOWN": 20,
        }
        penalty = status_penalty.get(final_status, 20)
        quality = max(0, min(100, correctness - penalty))

        return CVFQualityScore(
            correctness=correctness,
            safety=safety,
            alignment=alignment,
            quality=quality,
        )

    @staticmethod
    def enrich_result(result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Add CVF quality scoring to a governance result dict.
        """
        score = CVFQualityAdapter.from_governance_result(result)
        result["cvf_quality"] = score.to_dict()
        result["cvf_quality_grade"] = score.grade
        return result
