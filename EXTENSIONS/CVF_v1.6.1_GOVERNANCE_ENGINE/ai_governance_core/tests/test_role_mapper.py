"""
test_role_mapper.py

Tests for identity_layer/cvf_role_mapper.py.
"""

import pytest
from identity_layer.cvf_role_mapper import CVFRoleMapper


class TestToCVF:
    """Internal → CVF role mapping."""

    def test_developer_to_operator(self):
        assert CVFRoleMapper.to_cvf("DEVELOPER") == "Operator"

    def test_designer_to_operator(self):
        assert CVFRoleMapper.to_cvf("DESIGNER") == "Operator"

    def test_team_lead_to_lead(self):
        assert CVFRoleMapper.to_cvf("TEAM_LEAD") == "Lead"

    def test_security_officer_to_reviewer(self):
        assert CVFRoleMapper.to_cvf("SECURITY_OFFICER") == "Reviewer"

    def test_unknown_to_observer(self):
        assert CVFRoleMapper.to_cvf("UNKNOWN_ROLE") == "Observer"


class TestFromCVF:
    """CVF → Internal role mapping."""

    def test_operator_returns_list(self):
        roles = CVFRoleMapper.from_cvf("Operator")
        assert "DEVELOPER" in roles
        assert "DESIGNER" in roles

    def test_reviewer_returns_list(self):
        roles = CVFRoleMapper.from_cvf("Reviewer")
        assert "SECURITY_OFFICER" in roles

    def test_observer_empty(self):
        roles = CVFRoleMapper.from_cvf("Observer")
        assert roles == []


class TestHasAuthority:
    """Test authority hierarchy checks."""

    def test_reviewer_has_lead_authority(self):
        assert CVFRoleMapper.has_authority("Reviewer", "Lead") is True

    def test_operator_lacks_lead_authority(self):
        assert CVFRoleMapper.has_authority("Operator", "Lead") is False

    def test_internal_role_mapped(self):
        # TEAM_LEAD → Lead, check against Operator
        assert CVFRoleMapper.has_authority("TEAM_LEAD", "Operator") is True

    def test_observer_lowest(self):
        assert CVFRoleMapper.has_authority("Observer", "Operator") is False


class TestPermissions:
    """Test CVF role permissions."""

    def test_observer_cannot_evaluate(self):
        perms = CVFRoleMapper.get_cvf_permissions("Observer")
        assert perms["can_view"] is True
        assert perms["can_evaluate"] is False

    def test_operator_can_evaluate(self):
        perms = CVFRoleMapper.get_cvf_permissions("Operator")
        assert perms["can_evaluate"] is True
        assert perms["can_approve"] is False

    def test_reviewer_can_override(self):
        perms = CVFRoleMapper.get_cvf_permissions("Reviewer")
        assert perms["can_override"] is True
