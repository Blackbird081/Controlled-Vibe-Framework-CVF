"""
shared_enums.py

Shared Governance Enums
-----------------------

Single source of truth for governance decision enums
used across enforcement_layer modules.

Author: Governance Engine
"""

from enum import Enum


class GovernanceDecision(str, Enum):
    ALLOW = "ALLOW"
    DENY = "DENY"
    REVIEW = "REVIEW"
    ESCALATE = "ESCALATE"
    SANDBOX = "SANDBOX"


class ActionTarget(str, Enum):
    EXECUTE = "EXECUTE"
    BLOCK = "BLOCK"
    REQUIRE_APPROVAL = "REQUIRE_APPROVAL"
    ESCALATE = "ESCALATE"
    SANDBOX = "SANDBOX"
    LOG_ONLY = "LOG_ONLY"
