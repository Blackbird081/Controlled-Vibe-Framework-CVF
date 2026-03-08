"""Approval artifact posture policies for release packets."""

from __future__ import annotations

from release_packet.common import has_approval_decision, is_enterprise_onboarding, is_internal_audit, is_local_release


def build_transition_approval_artifact_binding(
    packet_type: str,
    entries: list[dict[str, str]],
    decision: str,
    packet_rel_path: str,
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
            "note": "internal audit posture does not bind an approval artifact because no runtime family may enter promotion transition inside audit evidence review",
        }
    if is_enterprise_onboarding(packet_type):
        return {
            "families": "none",
            "artifact": "none",
            "note": "enterprise onboarding posture does not bind an approval artifact because no runtime family may enter promotion transition inside onboarding evidence review",
        }

    if has_approval_decision(decision):
        note = "production-candidate review posture binds the current packet as the approval artifact because its decision section carries the approval-strength decision backing transition fulfillment"
        if is_local_release(packet_type):
            note = "local-ready posture binds the current packet as the approval artifact because its decision section carries the approval-strength decision backing transition fulfillment"
        return {
            "families": ", ".join(prerequisite_families) if prerequisite_families else "none",
            "artifact": packet_rel_path,
            "note": note,
        }

    note = "production-candidate review posture does not bind an approval artifact while no approval-strength decision is present in the packet"
    if is_local_release(packet_type):
        note = "local-ready posture does not bind an approval artifact while no approval-strength decision is present in the packet"
    return {"families": "none", "artifact": "none", "note": note}


def build_transition_approval_artifact_fulfillment(
    packet_type: str,
    entries: list[dict[str, str]],
    decision: str,
) -> dict[str, str]:
    prerequisite_families = sorted(
        entry["runtimeFamily"]
        for entry in entries
        if entry["maturity"] == "production-candidate" and entry["releaseLine"] in {"active", "stable"}
    )

    if is_internal_audit(packet_type):
        return {
            "satisfied": "none",
            "pending": "none",
            "note": "internal audit posture does not evaluate approval-artifact fulfillment because no runtime family may enter promotion transition inside audit evidence review",
        }
    if is_enterprise_onboarding(packet_type):
        return {
            "satisfied": "none",
            "pending": "none",
            "note": "enterprise onboarding posture does not evaluate approval-artifact fulfillment because no runtime family may enter promotion transition inside onboarding evidence review",
        }

    if has_approval_decision(decision):
        note = "production-candidate review posture treats the bound approval artifact as fulfillment-sufficient because the packet carries an approval-strength decision"
        if is_local_release(packet_type):
            note = "local-ready posture treats the bound approval artifact as fulfillment-sufficient because the packet carries an approval-strength decision"
        return {
            "satisfied": ", ".join(prerequisite_families) if prerequisite_families else "none",
            "pending": "none",
            "note": note,
        }

    note = "production-candidate review posture keeps approval-artifact fulfillment pending until a bound artifact carries an approval-strength decision"
    if is_local_release(packet_type):
        note = "local-ready posture keeps approval-artifact fulfillment pending until a bound artifact carries an approval-strength decision"
    return {
        "satisfied": "none",
        "pending": ", ".join(prerequisite_families) if prerequisite_families else "none",
        "note": note,
    }


def build_transition_approval_artifact_strength(packet_type: str, decision: str) -> dict[str, str]:
    if is_internal_audit(packet_type):
        return {
            "required": "not-applicable",
            "observed": "not-applicable",
            "note": "internal audit posture does not evaluate approval-artifact strength because no runtime family may enter promotion transition inside audit evidence review",
        }
    if is_enterprise_onboarding(packet_type):
        return {
            "required": "not-applicable",
            "observed": "not-applicable",
            "note": "enterprise onboarding posture does not evaluate approval-artifact strength because no runtime family may enter promotion transition inside onboarding evidence review",
        }

    if has_approval_decision(decision):
        note = "production-candidate review posture observes approval-strength in the bound approval artifact because the packet carries an approval-strength decision"
        if is_local_release(packet_type):
            note = "local-ready posture observes approval-strength in the bound approval artifact because the packet carries an approval-strength decision"
        return {
            "required": "approval-strength",
            "observed": "approval-strength",
            "note": note,
        }

    note = "production-candidate review posture still requires approval-strength, but currently observes no bound approval artifact with approval-strength decision semantics"
    if is_local_release(packet_type):
        note = "local-ready posture still requires approval-strength, but currently observes no bound approval artifact with approval-strength decision semantics"
    return {"required": "approval-strength", "observed": "none", "note": note}


def build_transition_approval_artifact_authority(packet_type: str, decision: str) -> dict[str, str]:
    if is_internal_audit(packet_type):
        return {
            "issuer": "internal-audit-review-authority",
            "state": "audit-only",
            "note": "internal audit posture uses audit-only authority and cannot issue a promotion-capable approval artifact inside audit evidence review",
        }
    if is_enterprise_onboarding(packet_type):
        return {
            "issuer": "enterprise-onboarding-review-authority",
            "state": "onboarding-only",
            "note": "enterprise onboarding posture uses onboarding-only authority and cannot issue a promotion-capable approval artifact inside onboarding evidence review",
        }

    if has_approval_decision(decision):
        note = "production-candidate review posture escalates to governor-grade approval authority when the packet carries an approval-strength decision"
        issuer = "production-governor-authority"
        if is_local_release(packet_type):
            note = "local-ready posture escalates to governor-grade approval authority when the packet carries an approval-strength decision"
            issuer = "local-governor-authority"
        return {"issuer": issuer, "state": "approval-authorized", "note": note}

    note = "production-candidate review posture remains review-only while no approval-strength decision is present in the packet"
    issuer = "production-review-authority"
    if is_local_release(packet_type):
        note = "local-ready posture remains review-only while no approval-strength decision is present in the packet"
        issuer = "local-review-authority"
    return {"issuer": issuer, "state": "review-only", "note": note}


def build_transition_approval_artifact_validity(packet_type: str, decision: str) -> dict[str, str]:
    if is_internal_audit(packet_type):
        return {
            "validity": "not-applicable",
            "expiry": "not-applicable",
            "invalidation": "not-applicable",
            "note": "internal audit posture does not evaluate approval-artifact validity lifecycle because no runtime family may enter promotion transition inside audit evidence review",
        }
    if is_enterprise_onboarding(packet_type):
        return {
            "validity": "not-applicable",
            "expiry": "not-applicable",
            "invalidation": "not-applicable",
            "note": "enterprise onboarding posture does not evaluate approval-artifact validity lifecycle because no runtime family may enter promotion transition inside onboarding evidence review",
        }

    if has_approval_decision(decision):
        note = "production-candidate review posture treats the bound approval artifact as currently active, unexpired, and not invalidated because the current packet is the authoritative approval-strength artifact at export time"
        if is_local_release(packet_type):
            note = "local-ready posture treats the bound approval artifact as currently active, unexpired, and not invalidated because the current packet is the authoritative approval-strength artifact at export time"
        return {
            "validity": "active",
            "expiry": "unexpired",
            "invalidation": "not-invalidated",
            "note": note,
        }

    note = "production-candidate review posture keeps approval-artifact validity lifecycle unbound while no approval-strength decision is present in the packet"
    if is_local_release(packet_type):
        note = "local-ready posture keeps approval-artifact validity lifecycle unbound while no approval-strength decision is present in the packet"
    return {"validity": "unbound", "expiry": "unbound", "invalidation": "unbound", "note": note}


def build_transition_approval_artifact_invalidation_evidence(packet_type: str, decision: str) -> dict[str, str]:
    if is_internal_audit(packet_type):
        return {
            "revocation": "not-applicable",
            "expiry_evidence": "not-applicable",
            "invalidation_source": "not-applicable",
            "note": "internal audit posture does not bind revocation, expiry, or invalidation-source evidence because no runtime family may enter promotion transition inside audit evidence review",
        }
    if is_enterprise_onboarding(packet_type):
        return {
            "revocation": "not-applicable",
            "expiry_evidence": "not-applicable",
            "invalidation_source": "not-applicable",
            "note": "enterprise onboarding posture does not bind revocation, expiry, or invalidation-source evidence because no runtime family may enter promotion transition inside onboarding evidence review",
        }

    if has_approval_decision(decision):
        note = "production-candidate review posture binds no revocation record, no expiry evidence, and no invalidation source because the current packet is the authoritative active approval artifact at export time"
        if is_local_release(packet_type):
            note = "local-ready posture binds no revocation record, no expiry evidence, and no invalidation source because the current packet is the authoritative active approval artifact at export time"
        return {
            "revocation": "none-bound",
            "expiry_evidence": "none-bound",
            "invalidation_source": "none-bound",
            "note": note,
        }

    note = "production-candidate review posture keeps revocation, expiry, and invalidation-source evidence unbound while no approval-strength decision is present in the packet"
    if is_local_release(packet_type):
        note = "local-ready posture keeps revocation, expiry, and invalidation-source evidence unbound while no approval-strength decision is present in the packet"
    return {"revocation": "unbound", "expiry_evidence": "unbound", "invalidation_source": "unbound", "note": note}


def build_transition_approval_artifact_external_validity_checks(packet_type: str, decision: str) -> dict[str, str]:
    if is_internal_audit(packet_type):
        return {
            "expiry_timestamp": "not-applicable",
            "freshness": "not-applicable",
            "invalidation_authority": "not-applicable",
            "note": "internal audit posture does not evaluate expiry timestamp, freshness, or external invalidation authority because no runtime family may enter promotion transition inside audit evidence review",
        }
    if is_enterprise_onboarding(packet_type):
        return {
            "expiry_timestamp": "not-applicable",
            "freshness": "not-applicable",
            "invalidation_authority": "not-applicable",
            "note": "enterprise onboarding posture does not evaluate expiry timestamp, freshness, or external invalidation authority because no runtime family may enter promotion transition inside onboarding evidence review",
        }

    if has_approval_decision(decision):
        note = "production-candidate review posture treats the current packet as fresh within the export window, without an external expiry timestamp or external invalidation authority because the packet is self-issued at the current approval boundary"
        if is_local_release(packet_type):
            note = "local-ready posture treats the current packet as fresh within the export window, without an external expiry timestamp or external invalidation authority because the packet is self-issued at the current approval boundary"
        return {
            "expiry_timestamp": "current-export-window",
            "freshness": "fresh",
            "invalidation_authority": "self-issued-authority",
            "note": note,
        }

    note = "production-candidate review posture keeps expiry timestamp, freshness, and external invalidation authority unbound while no approval-strength decision is present in the packet"
    if is_local_release(packet_type):
        note = "local-ready posture keeps expiry timestamp, freshness, and external invalidation authority unbound while no approval-strength decision is present in the packet"
    return {"expiry_timestamp": "unbound", "freshness": "unbound", "invalidation_authority": "unbound", "note": note}


def build_transition_approval_artifact_external_authority_trust(packet_type: str, decision: str) -> dict[str, str]:
    if is_internal_audit(packet_type):
        return {
            "trust_state": "not-applicable",
            "issuer_scope": "not-applicable",
            "note": "internal audit posture does not evaluate external authority trust because no runtime family may enter promotion transition inside audit evidence review",
        }
    if is_enterprise_onboarding(packet_type):
        return {
            "trust_state": "not-applicable",
            "issuer_scope": "not-applicable",
            "note": "enterprise onboarding posture does not evaluate external authority trust because no runtime family may enter promotion transition inside onboarding evidence review",
        }

    if has_approval_decision(decision):
        note = "production-candidate review posture treats external authority trust as satisfied because the approval artifact is self-issued by the governing authority at the current approval boundary"
        issuer_scope = "production-self-governed-boundary"
        if is_local_release(packet_type):
            note = "local-ready posture treats external authority trust as satisfied because the approval artifact is self-issued by the governing authority at the current approval boundary"
            issuer_scope = "local-self-governed-boundary"
        return {"trust_state": "trusted-self-issued-authority", "issuer_scope": issuer_scope, "note": note}

    note = "production-candidate review posture keeps external authority trust unbound while no approval-strength decision is present in the packet"
    if is_local_release(packet_type):
        note = "local-ready posture keeps external authority trust unbound while no approval-strength decision is present in the packet"
    return {"trust_state": "unbound", "issuer_scope": "unbound", "note": note}


def build_transition_approval_artifact_external_issuer_policy(packet_type: str, decision: str) -> dict[str, str]:
    if is_internal_audit(packet_type):
        return {
            "attestation": "not-applicable",
            "trust_policy": "not-applicable",
            "note": "internal audit posture does not evaluate external issuer attestation or third-party trust policy because no runtime family may enter promotion transition inside audit evidence review",
        }
    if is_enterprise_onboarding(packet_type):
        return {
            "attestation": "not-applicable",
            "trust_policy": "not-applicable",
            "note": "enterprise onboarding posture does not evaluate external issuer attestation or third-party trust policy because no runtime family may enter promotion transition inside onboarding evidence review",
        }

    if has_approval_decision(decision):
        note = "production-candidate review posture records self-attested governing issuance and keeps third-party issuer trust disabled because the current approval artifact is still self-issued at the approval boundary"
        if is_local_release(packet_type):
            note = "local-ready posture records self-attested governing issuance and keeps third-party issuer trust disabled because the current approval artifact is still self-issued at the approval boundary"
        return {"attestation": "self-attested-governing-issuer", "trust_policy": "self-issued-only", "note": note}

    note = "production-candidate review posture keeps external issuer attestation and third-party trust policy unbound while no approval-strength decision is present in the packet"
    if is_local_release(packet_type):
        note = "local-ready posture keeps external issuer attestation and third-party trust policy unbound while no approval-strength decision is present in the packet"
    return {"attestation": "unbound", "trust_policy": "unbound", "note": note}


def build_transition_approval_artifact_external_issuer_verification(packet_type: str, decision: str) -> dict[str, str]:
    if is_internal_audit(packet_type):
        return {
            "verification_state": "not-applicable",
            "trust_enforcement": "not-applicable",
            "note": "internal audit posture does not verify external issuer attestation or enforce third-party issuer trust because no runtime family may enter promotion transition inside audit evidence review",
        }
    if is_enterprise_onboarding(packet_type):
        return {
            "verification_state": "not-applicable",
            "trust_enforcement": "not-applicable",
            "note": "enterprise onboarding posture does not verify external issuer attestation or enforce third-party issuer trust because no runtime family may enter promotion transition inside onboarding evidence review",
        }

    if has_approval_decision(decision):
        note = "production-candidate review posture treats issuer attestation as verified at the current governing boundary and enforces self-issued-only trust because no third-party issuer is allowed for the active approval artifact"
        if is_local_release(packet_type):
            note = "local-ready posture treats issuer attestation as verified at the current governing boundary and enforces self-issued-only trust because no third-party issuer is allowed for the active approval artifact"
        return {"verification_state": "verified-self-attested-boundary", "trust_enforcement": "third-party-denied", "note": note}

    note = "production-candidate review posture keeps issuer attestation verification and third-party issuer trust enforcement unbound while no approval-strength decision is present in the packet"
    if is_local_release(packet_type):
        note = "local-ready posture keeps issuer attestation verification and third-party issuer trust enforcement unbound while no approval-strength decision is present in the packet"
    return {"verification_state": "unbound", "trust_enforcement": "unbound", "note": note}
