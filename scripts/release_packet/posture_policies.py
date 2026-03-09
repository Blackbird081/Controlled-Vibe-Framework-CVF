"""Packet posture and transition policies for cross-family release coverage."""

from __future__ import annotations

from release_packet.common import has_approval_decision, is_enterprise_onboarding, is_internal_audit, is_local_release


def build_mixed_maturity_posture(packet_type: str) -> str:
    if packet_type == "production-candidate review snapshot":
        return "production-candidate families are in active review scope, while implemented-local and hardening-active families remain explicitly deferred"
    if is_internal_audit(packet_type):
        return "all runtime families are visible for audit, while implemented-local and hardening-active families remain non-promotable within audit posture"
    if is_enterprise_onboarding(packet_type):
        return "all runtime families are visible for onboarding, while implemented-local and hardening-active families remain out of approval scope"
    return "production-candidate families remain reviewable, while implemented-local and hardening-active families remain deferred inside this local-only packet"


def build_promotion_readiness(packet_type: str, entries: list[dict[str, str]]) -> dict[str, str]:
    all_families = sorted(entry["runtimeFamily"] for entry in entries)
    deferred_families = sorted(
        entry["runtimeFamily"]
        for entry in entries
        if entry["releaseLine"] == "local-ready" or entry["maturity"] == "hardening-active"
    )
    promotion_eligible = sorted(
        entry["runtimeFamily"]
        for entry in entries
        if entry["maturity"] == "production-candidate" and entry["releaseLine"] in {"active", "stable"}
    )

    if is_internal_audit(packet_type):
        return {
            "reviewable": "none",
            "auditable": ", ".join(all_families) if all_families else "none",
            "onboarding_visible": "none",
            "strictly_deferred": ", ".join(deferred_families) if deferred_families else "none",
            "note": "audit posture exposes every runtime family for review evidence, but deferred families remain non-promotable and outside approval scope",
            "promotable": "none",
            "exception_required": ", ".join(all_families) if all_families else "none",
            "exception_note": "internal audit posture does not promote any runtime family; auditable families remain evidence-visible only and require a separate approval path outside audit",
        }
    if is_enterprise_onboarding(packet_type):
        return {
            "reviewable": "none",
            "auditable": "none",
            "onboarding_visible": ", ".join(all_families) if all_families else "none",
            "strictly_deferred": ", ".join(deferred_families) if deferred_families else "none",
            "note": "onboarding posture exposes every runtime family for visibility, but deferred families remain outside promotion and release approval scope",
            "promotable": "none",
            "exception_required": ", ".join(all_families) if all_families else "none",
            "exception_note": "enterprise onboarding posture does not promote any runtime family; onboarding-visible families remain informational only and require a separate approval path outside onboarding",
        }
    note = "review posture is limited to promotion-eligible families, while deferred families remain explicitly outside approval scope"
    exception_note = "local-ready posture does not promote any runtime family; reviewable families require a separate publication or release approval decision"
    if packet_type == "production-candidate review snapshot":
        note = "production-candidate review posture is limited to promotion-eligible families, while deferred families remain explicitly outside approval scope"
        exception_note = "production-candidate review posture does not promote any runtime family; reviewable families require an explicit release approval decision"
    return {
        "reviewable": ", ".join(promotion_eligible) if promotion_eligible else "none",
        "auditable": "none",
        "onboarding_visible": "none",
        "strictly_deferred": ", ".join(deferred_families) if deferred_families else "none",
        "note": note,
        "promotable": "none",
        "exception_required": ", ".join(promotion_eligible) if promotion_eligible else "none",
        "exception_note": exception_note,
    }


def build_approval_decision_policy(packet_type: str, entries: list[dict[str, str]]) -> dict[str, str]:
    all_families = sorted(entry["runtimeFamily"] for entry in entries)
    promotion_eligible = sorted(
        entry["runtimeFamily"]
        for entry in entries
        if entry["maturity"] == "production-candidate" and entry["releaseLine"] in {"active", "stable"}
    )
    blocked = sorted(family for family in all_families if family not in promotion_eligible)

    if is_internal_audit(packet_type):
        return {
            "eligible": "none",
            "blocked": ", ".join(all_families) if all_families else "none",
            "note": "internal audit posture never initiates approval; all runtime families remain approval-blocked inside audit evidence review",
        }
    if is_enterprise_onboarding(packet_type):
        return {
            "eligible": "none",
            "blocked": ", ".join(all_families) if all_families else "none",
            "note": "enterprise onboarding posture never initiates approval; all runtime families remain approval-blocked inside onboarding evidence review",
        }
    if packet_type == "production-candidate review snapshot":
        return {
            "eligible": ", ".join(promotion_eligible) if promotion_eligible else "none",
            "blocked": ", ".join(blocked) if blocked else "none",
            "note": "production-candidate review posture only marks approval-eligible families for a separate explicit release approval decision; all other families remain approval-blocked",
        }
    return {
        "eligible": ", ".join(promotion_eligible) if promotion_eligible else "none",
        "blocked": ", ".join(blocked) if blocked else "none",
        "note": "local-ready posture only marks approval-eligible families for a future explicit release approval path; all other families remain approval-blocked",
    }


def build_transition_policy(packet_type: str, entries: list[dict[str, str]]) -> dict[str, str]:
    all_families = sorted(entry["runtimeFamily"] for entry in entries)
    approval_eligible = sorted(
        entry["runtimeFamily"]
        for entry in entries
        if entry["maturity"] == "production-candidate" and entry["releaseLine"] in {"active", "stable"}
    )
    approval_blocked = sorted(family for family in all_families if family not in approval_eligible)

    if is_internal_audit(packet_type):
        return {
            "conditional": "none",
            "blocked": ", ".join(all_families) if all_families else "none",
            "note": "internal audit posture does not transition any runtime family toward promotion; all families remain transition-blocked inside audit evidence review",
        }
    if is_enterprise_onboarding(packet_type):
        return {
            "conditional": "none",
            "blocked": ", ".join(all_families) if all_families else "none",
            "note": "enterprise onboarding posture does not transition any runtime family toward promotion; all families remain transition-blocked inside onboarding evidence review",
        }
    if packet_type == "production-candidate review snapshot":
        return {
            "conditional": ", ".join(approval_eligible) if approval_eligible else "none",
            "blocked": ", ".join(approval_blocked) if approval_blocked else "none",
            "note": "production-candidate review posture can only move approval-eligible families into a future promotion path after an explicit release approval decision and fresh evidence regeneration",
        }
    return {
        "conditional": ", ".join(approval_eligible) if approval_eligible else "none",
        "blocked": ", ".join(approval_blocked) if approval_blocked else "none",
        "note": "local-ready posture can only move approval-eligible families into a future promotion path after an explicit publication/release approval decision and fresh evidence regeneration",
    }


def build_transition_prerequisites(packet_type: str, entries: list[dict[str, str]]) -> dict[str, str]:
    approval_eligible = sorted(
        entry["runtimeFamily"]
        for entry in entries
        if entry["maturity"] == "production-candidate" and entry["releaseLine"] in {"active", "stable"}
    )

    if is_internal_audit(packet_type):
        return {
            "families": "none",
            "threshold": "not-applicable",
            "note": "internal audit posture does not define transition prerequisites because no runtime family may enter promotion transition inside audit evidence review",
        }
    if is_enterprise_onboarding(packet_type):
        return {
            "families": "none",
            "threshold": "not-applicable",
            "note": "enterprise onboarding posture does not define transition prerequisites because no runtime family may enter promotion transition inside onboarding evidence review",
        }
    if packet_type == "production-candidate review snapshot":
        return {
            "families": ", ".join(approval_eligible) if approval_eligible else "none",
            "threshold": "explicit release approval decision + fresh multi-runtime evidence regeneration",
            "note": "production-candidate review posture requires both explicit release approval and regenerated evidence before any transition-conditional family can become promotable",
        }
    return {
        "families": ", ".join(approval_eligible) if approval_eligible else "none",
        "threshold": "explicit publication or release approval decision + fresh multi-runtime evidence regeneration",
        "note": "local-ready posture requires both explicit publication or release approval and regenerated evidence before any transition-conditional family can become promotable",
    }


def build_transition_threshold_status(packet_type: str, entries: list[dict[str, str]], decision: str) -> dict[str, str]:
    prerequisite_families = sorted(
        entry["runtimeFamily"]
        for entry in entries
        if entry["maturity"] == "production-candidate" and entry["releaseLine"] in {"active", "stable"}
    )

    if is_internal_audit(packet_type):
        return {
            "satisfied": "none",
            "pending": "none",
            "note": "internal audit posture does not evaluate threshold satisfaction because no runtime family may enter promotion transition inside audit evidence review",
        }
    if is_enterprise_onboarding(packet_type):
        return {
            "satisfied": "none",
            "pending": "none",
            "note": "enterprise onboarding posture does not evaluate threshold satisfaction because no runtime family may enter promotion transition inside onboarding evidence review",
        }

    if has_approval_decision(decision):
        note = "production-candidate review posture has recorded an approval-strength decision, so transition-prerequisite families are treated as threshold-satisfied in this packet"
        if is_local_release(packet_type):
            note = "local-ready posture has recorded an approval-strength decision, so transition-prerequisite families are treated as threshold-satisfied in this packet"
        return {
            "satisfied": ", ".join(prerequisite_families) if prerequisite_families else "none",
            "pending": "none",
            "note": note,
        }

    note = "production-candidate review posture keeps threshold satisfaction pending until explicit release approval and regenerated evidence are both recorded"
    if is_local_release(packet_type):
        note = "local-ready posture keeps threshold satisfaction pending until explicit publication or release approval and regenerated evidence are both recorded"
    return {
        "satisfied": "none",
        "pending": ", ".join(prerequisite_families) if prerequisite_families else "none",
        "note": note,
    }


def build_transition_fulfillment(
    packet_type: str,
    entries: list[dict[str, str]],
    decision: str,
    runtime_manifest_rel_path: str,
) -> dict[str, str]:
    prerequisite_families = sorted(
        entry["runtimeFamily"]
        for entry in entries
        if entry["maturity"] == "production-candidate" and entry["releaseLine"] in {"active", "stable"}
    )

    if is_internal_audit(packet_type):
        return {
            "families": "none",
            "artifact": "none",
            "note": "internal audit posture does not attach transition fulfillment evidence because no runtime family may enter promotion transition inside audit evidence review",
        }
    if is_enterprise_onboarding(packet_type):
        return {
            "families": "none",
            "artifact": "none",
            "note": "enterprise onboarding posture does not attach transition fulfillment evidence because no runtime family may enter promotion transition inside onboarding evidence review",
        }

    if has_approval_decision(decision):
        note = "production-candidate review posture attaches fulfillment evidence only when an approval-strength decision is present together with the regenerated multi-runtime manifest"
        if is_local_release(packet_type):
            note = "local-ready posture attaches fulfillment evidence only when an approval-strength decision is present together with the regenerated multi-runtime manifest"
        return {
            "families": ", ".join(prerequisite_families) if prerequisite_families else "none",
            "artifact": runtime_manifest_rel_path,
            "note": note,
        }

    note = "production-candidate review posture does not attach transition fulfillment evidence while threshold satisfaction remains pending"
    if is_local_release(packet_type):
        note = "local-ready posture does not attach transition fulfillment evidence while threshold satisfaction remains pending"
    return {
        "families": "none",
        "artifact": "none",
        "note": note,
    }
