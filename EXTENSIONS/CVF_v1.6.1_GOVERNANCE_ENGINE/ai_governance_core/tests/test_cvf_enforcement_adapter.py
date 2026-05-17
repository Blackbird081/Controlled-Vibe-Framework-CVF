"""
test_cvf_enforcement_adapter.py

Tests for CVF Enforcement Adapter.
"""

import pytest
from adapters.cvf_enforcement_adapter import (
    CVFEnforcementAdapter,
    CVFEnforcementAction,
    CVFPhase,
)


class TestFromDecision:
    """Test decision → CVF enforcement mapping."""

    def test_allow(self):
        assert CVFEnforcementAdapter.from_decision("ALLOW") == CVFEnforcementAction.ALLOW

    def test_deny(self):
        assert CVFEnforcementAdapter.from_decision("DENY") == CVFEnforcementAction.BLOCK

    def test_review(self):
        assert CVFEnforcementAdapter.from_decision("REVIEW") == CVFEnforcementAction.NEEDS_APPROVAL

    def test_escalate(self):
        assert CVFEnforcementAdapter.from_decision("ESCALATE") == CVFEnforcementAction.ESCALATE

    def test_sandbox(self):
        assert CVFEnforcementAdapter.from_decision("SANDBOX") == CVFEnforcementAction.LOG_ONLY

    def test_unknown(self):
        assert CVFEnforcementAdapter.from_decision("UNKNOWN") == CVFEnforcementAction.LOG_ONLY

    def test_case_insensitive(self):
        assert CVFEnforcementAdapter.from_decision("allow") == CVFEnforcementAction.ALLOW


class TestFromActionTarget:
    """Test action target → CVF enforcement mapping."""

    def test_execute(self):
        assert CVFEnforcementAdapter.from_action_target("EXECUTE") == CVFEnforcementAction.ALLOW

    def test_block(self):
        assert CVFEnforcementAdapter.from_action_target("BLOCK") == CVFEnforcementAction.BLOCK

    def test_require_approval(self):
        assert CVFEnforcementAdapter.from_action_target("REQUIRE_APPROVAL") == CVFEnforcementAction.NEEDS_APPROVAL


class TestBuildResponse:
    """Test response building."""

    def test_basic_response(self):
        resp = CVFEnforcementAdapter.build_response(
            decision="ALLOW", risk_level="R1"
        )
        assert resp.action == CVFEnforcementAction.ALLOW
        assert resp.risk_level == "R1"
        assert resp.timestamp

    def test_phase_d_override_allowed(self):
        resp = CVFEnforcementAdapter.build_response(
            decision="DENY", risk_level="R4", phase="D"
        )
        assert resp.override_allowed is True  # Phase D has override authority

    def test_phase_a_no_override(self):
        resp = CVFEnforcementAdapter.build_response(
            decision="DENY", risk_level="R1", phase="A"
        )
        assert resp.override_allowed is False

    def test_to_dict(self):
        resp = CVFEnforcementAdapter.build_response(
            decision="REVIEW", risk_level="R2", phase="C"
        )
        d = resp.to_dict()
        assert d["action"] == "NEEDS_APPROVAL"
        assert d["risk_level"] == "R2"


class TestPhaseAuthority:
    """Test CVF phase authority checks."""

    def test_phase_a_r1_ok(self):
        assert CVFEnforcementAdapter.check_phase_authority("A", "R1") is True

    def test_phase_a_r2_blocked(self):
        assert CVFEnforcementAdapter.check_phase_authority("A", "R2") is False

    def test_phase_d_r4_ok(self):
        assert CVFEnforcementAdapter.check_phase_authority("D", "R4") is True

    def test_phase_c_r3_ok(self):
        assert CVFEnforcementAdapter.check_phase_authority("C", "R3") is True

    def test_phase_c_r4_blocked(self):
        assert CVFEnforcementAdapter.check_phase_authority("C", "R4") is False

    def test_invalid_phase(self):
        assert CVFEnforcementAdapter.check_phase_authority("Z", "R1") is False


class TestEnrichResult:
    """Test enrich_result helper."""

    def test_adds_cvf_enforcement(self, sample_governance_result):
        result = CVFEnforcementAdapter.enrich_result(
            sample_governance_result, phase="C"
        )
        assert "cvf_enforcement" in result
        assert result["cvf_enforcement"]["phase"] == "C"
