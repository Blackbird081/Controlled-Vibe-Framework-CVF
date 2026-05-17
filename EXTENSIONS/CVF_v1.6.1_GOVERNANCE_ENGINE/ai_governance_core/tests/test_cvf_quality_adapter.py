"""
test_cvf_quality_adapter.py

Tests for CVF Quality Score Adapter.
"""

import pytest
from adapters.cvf_quality_adapter import CVFQualityAdapter, CVFQualityScore


class TestCVFQualityScore:
    """Test the CVFQualityScore dataclass."""

    def test_overall_weighted_average(self):
        score = CVFQualityScore(
            correctness=100, safety=100, alignment=100, quality=100
        )
        assert score.overall == 100.0

    def test_safety_has_double_weight(self):
        # Safety = 0, others = 100 → (100 + 0 + 100 + 100) / 5 = 60
        score = CVFQualityScore(correctness=100, safety=0, alignment=100, quality=100)
        assert score.overall == 60.0

    def test_grade_a(self):
        score = CVFQualityScore(correctness=95, safety=95, alignment=95, quality=95)
        assert score.grade == "A"

    def test_grade_b(self):
        score = CVFQualityScore(correctness=85, safety=85, alignment=85, quality=85)
        assert score.grade == "B"

    def test_grade_f(self):
        score = CVFQualityScore(correctness=30, safety=30, alignment=30, quality=30)
        assert score.grade == "F"

    def test_to_dict(self):
        score = CVFQualityScore(correctness=80, safety=80, alignment=80, quality=80)
        d = score.to_dict()
        assert d["correctness"] == 80
        assert d["safety"] == 80
        assert "overall" in d


class TestFromGovernanceResult:
    """Test conversion from governance result to quality score."""

    def test_basic_conversion(self, sample_governance_result):
        score = CVFQualityAdapter.from_governance_result(sample_governance_result)
        assert 0 <= score.correctness <= 100
        assert 0 <= score.safety <= 100
        assert 0 <= score.alignment <= 100
        assert 0 <= score.quality <= 100

    def test_high_risk_low_safety(self):
        result = {
            "risk_score": 0.9,
            "compliance": {"score": 80},
            "brand": {"drift": {"drift_score": 10}},
            "final_status": "APPROVED",
        }
        score = CVFQualityAdapter.from_governance_result(result)
        assert score.safety == 10.0  # (1 - 0.9) * 100

    def test_rejected_penalty(self):
        result = {
            "risk_score": 0.3,
            "compliance": {"score": 80},
            "brand": {"drift": {"drift_score": 10}},
            "final_status": "REJECTED",
        }
        score = CVFQualityAdapter.from_governance_result(result)
        assert score.quality == 40  # 80 - 40 penalty


class TestEnrichResult:
    """Test enrich_result helper."""

    def test_adds_cvf_quality(self, sample_governance_result):
        result = CVFQualityAdapter.enrich_result(sample_governance_result)
        assert "cvf_quality" in result
        assert "cvf_quality_grade" in result
        assert "overall" in result["cvf_quality"]
