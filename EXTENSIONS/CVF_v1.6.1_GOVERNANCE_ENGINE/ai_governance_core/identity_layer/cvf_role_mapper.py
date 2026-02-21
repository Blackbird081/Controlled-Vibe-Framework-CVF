"""
cvf_role_mapper.py

CVF Role Mapping
-----------------

Maps between:
- Governance Engine roles: DEVELOPER, DESIGNER, TEAM_LEAD,
  SECURITY_OFFICER, AI_GOVERNANCE_ADMIN, EXECUTIVE_APPROVER
- CVF roles: Operator, Lead, Reviewer, Observer

Provides bidirectional lookup and permission inheritance.

Author: Governance Engine — CVF v1.6.1
"""

from typing import Dict, List, Optional


# ===========================
# MAPPING TABLES
# ===========================

# Internal role → CVF role
_INTERNAL_TO_CVF: Dict[str, str] = {
    "DEVELOPER": "Operator",
    "DESIGNER": "Operator",
    "TEAM_LEAD": "Lead",
    "SECURITY_OFFICER": "Reviewer",
    "AI_GOVERNANCE_ADMIN": "Lead",
    "EXECUTIVE_APPROVER": "Reviewer",
}

# CVF role → Internal roles (many-to-one inverse)
_CVF_TO_INTERNAL: Dict[str, List[str]] = {
    "Operator": ["DEVELOPER", "DESIGNER"],
    "Lead": ["TEAM_LEAD", "AI_GOVERNANCE_ADMIN"],
    "Reviewer": ["SECURITY_OFFICER", "EXECUTIVE_APPROVER"],
    "Observer": [],  # read-only, no internal equivalent
}

# CVF role hierarchy (higher index = more authority)
_CVF_HIERARCHY = ["Observer", "Operator", "Lead", "Reviewer"]


# ===========================
# MAPPER CLASS
# ===========================

class CVFRoleMapper:
    """
    Maps governance engine roles to CVF roles and vice versa.
    """

    @staticmethod
    def to_cvf(internal_role: str) -> str:
        """Convert internal role to CVF role."""
        return _INTERNAL_TO_CVF.get(internal_role.upper(), "Observer")

    @staticmethod
    def from_cvf(cvf_role: str) -> List[str]:
        """Get list of internal roles matching a CVF role."""
        return _CVF_TO_INTERNAL.get(cvf_role, [])

    @staticmethod
    def has_authority(role: str, required_cvf_role: str) -> bool:
        """
        Check if a role (internal or CVF) has at least the
        authority of the required CVF role.
        """
        # Convert to CVF if internal
        if role.upper() == role:
            cvf_role = CVFRoleMapper.to_cvf(role)
        else:
            cvf_role = role

        try:
            role_level = _CVF_HIERARCHY.index(cvf_role)
            required_level = _CVF_HIERARCHY.index(required_cvf_role)
            return role_level >= required_level
        except ValueError:
            return False

    @staticmethod
    def get_cvf_permissions(cvf_role: str) -> Dict[str, bool]:
        """
        Return CVF-standard permissions for a role.
        """
        permissions = {
            "Observer": {
                "can_view": True,
                "can_evaluate": False,
                "can_approve": False,
                "can_override": False,
            },
            "Operator": {
                "can_view": True,
                "can_evaluate": True,
                "can_approve": False,
                "can_override": False,
            },
            "Lead": {
                "can_view": True,
                "can_evaluate": True,
                "can_approve": True,
                "can_override": False,
            },
            "Reviewer": {
                "can_view": True,
                "can_evaluate": True,
                "can_approve": True,
                "can_override": True,
            },
        }
        return permissions.get(cvf_role, permissions["Observer"])
