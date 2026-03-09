"""Shared helpers for release packet posture policies."""

from __future__ import annotations


APPROVAL_DECISION_PHRASES = (
    "release approved",
    "publication approved",
    "promotion approved",
)


def is_internal_audit(packet_type: str) -> bool:
    return packet_type == "internal audit evidence snapshot"


def is_enterprise_onboarding(packet_type: str) -> bool:
    return packet_type == "enterprise onboarding snapshot"


def is_local_release(packet_type: str) -> bool:
    return packet_type == "local release approval snapshot"


def has_approval_decision(decision: str) -> bool:
    decision_lower = decision.strip().lower()
    return any(phrase in decision_lower for phrase in APPROVAL_DECISION_PHRASES)
