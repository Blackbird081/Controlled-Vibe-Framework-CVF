"""
test_cvf_risk_adapter.py

Tests for CVF Risk Level Adapter.
"""

import pytest
from adapters.cvf_risk_adapter import (
    CVFRiskAdapter,
    CVFRiskLevel,
    InternalRiskLevel,
)


class TestToCSVF:
    """Internal → CVF direction."""

    def test_low_to_r1(self):
        assert CVFRiskAdapter.to_cvf("LOW") == CVFRiskLevel.R1

    def test_medium_to_r2(self):
        assert CVFRiskAdapter.to_cvf("MEDIUM") == CVFRiskLevel.R2

    def test_high_to_r3(self):
        assert CVFRiskAdapter.to_cvf("HIGH") == CVFRiskLevel.R3

    def test_critical_to_r4(self):
        assert CVFRiskAdapter.to_cvf("CRITICAL") == CVFRiskLevel.R4

    def test_case_insensitive(self):
        assert CVFRiskAdapter.to_cvf("low") == CVFRiskLevel.R1

    def test_unknown_returns_default(self):
        assert CVFRiskAdapter.to_cvf("EXTREME") == CVFRiskLevel.R2


class TestFromCVF:
    """CVF → Internal direction."""

    def test_r0_to_low(self):
        assert CVFRiskAdapter.from_cvf("R0") == InternalRiskLevel.LOW

    def test_r1_to_low(self):
        assert CVFRiskAdapter.from_cvf("R1") == InternalRiskLevel.LOW

    def test_r2_to_medium(self):
        assert CVFRiskAdapter.from_cvf("R2") == InternalRiskLevel.MEDIUM

    def test_r3_to_high(self):
        assert CVFRiskAdapter.from_cvf("R3") == InternalRiskLevel.HIGH

    def test_r4_to_critical(self):
        assert CVFRiskAdapter.from_cvf("R4") == InternalRiskLevel.CRITICAL

    def test_unknown_returns_default(self):
        assert CVFRiskAdapter.from_cvf("R9") == InternalRiskLevel.MEDIUM


class TestScoreToCVF:
    """Numeric score → CVF tier."""

    @pytest.mark.parametrize("score,expected", [
        (0.0, CVFRiskLevel.R0),
        (0.1, CVFRiskLevel.R0),
        (0.2, CVFRiskLevel.R1),
        (0.3, CVFRiskLevel.R1),
        (0.4, CVFRiskLevel.R2),
        (0.5, CVFRiskLevel.R2),
        (0.6, CVFRiskLevel.R3),
        (0.7, CVFRiskLevel.R3),
        (0.8, CVFRiskLevel.R4),
        (1.0, CVFRiskLevel.R4),
    ])
    def test_score_mapping(self, score, expected):
        assert CVFRiskAdapter.score_to_cvf(score) == expected


class TestCVFToScore:
    """CVF tier → numeric score."""

    def test_r0_score(self):
        assert CVFRiskAdapter.cvf_to_score("R0") == 0.1

    def test_r4_score(self):
        assert CVFRiskAdapter.cvf_to_score("R4") == 0.9

    def test_unknown_returns_05(self):
        assert CVFRiskAdapter.cvf_to_score("INVALID") == 0.5


class TestEnrichResult:
    """Test enrich_result helper."""

    def test_adds_cvf_fields(self, sample_governance_result):
        result = CVFRiskAdapter.enrich_result(sample_governance_result)
        assert "cvf_risk_level" in result
        assert "cvf_risk_tier" in result
        assert result["cvf_risk_level"] == "R3"  # 0.65 → R3
        assert result["cvf_risk_tier"] == "High"
