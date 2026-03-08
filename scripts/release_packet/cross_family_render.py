"""Render cross-family runtime coverage section for release packets."""

from __future__ import annotations

from release_packet.approval_artifact_policies import (
    build_transition_approval_artifact_authority,
    build_transition_approval_artifact_binding,
    build_transition_approval_artifact_external_authority_trust,
    build_transition_approval_artifact_external_issuer_policy,
    build_transition_approval_artifact_external_issuer_verification,
    build_transition_approval_artifact_external_validity_checks,
    build_transition_approval_artifact_fulfillment,
    build_transition_approval_artifact_invalidation_evidence,
    build_transition_approval_artifact_strength,
    build_transition_approval_artifact_validity,
)
from release_packet.posture_policies import (
    build_approval_decision_policy,
    build_mixed_maturity_posture,
    build_promotion_readiness,
    build_transition_fulfillment,
    build_transition_policy,
    build_transition_prerequisites,
    build_transition_threshold_status,
)
from release_packet.revocation_policies import (
    build_transition_approval_artifact_external_proof_attestation,
    build_transition_approval_artifact_external_proof_binding,
    build_transition_approval_artifact_external_proof_verification,
    build_transition_approval_artifact_external_revocation_attestation,
    build_transition_approval_artifact_external_revocation_issuer_attestation,
    build_transition_approval_artifact_external_revocation_issuer_proof_authority_attestation,
    build_transition_approval_artifact_external_revocation_issuer_proof_authority_provenance_verification,
    build_transition_approval_artifact_external_revocation_issuer_proof_authority_provenance_attestation_provenance,
    build_transition_approval_artifact_external_revocation_issuer_proof_authority_provenance_attestation_provenance_freshness_proof,
    build_transition_approval_artifact_external_revocation_issuer_proof_authority_provenance_attestation_provenance_freshness,
    build_transition_approval_artifact_external_revocation_issuer_proof_authority_provenance_attestation_provenance_freshness_proof_verification,
    build_transition_approval_artifact_external_revocation_issuer_proof_authority_provenance_attestation_provenance_verification,
    build_transition_approval_artifact_external_revocation_issuer_proof_authority_attestation_verification,
    build_transition_approval_artifact_external_revocation_issuer_proof_authority_provenance_attestation_freshness,
    build_transition_approval_artifact_external_revocation_issuer_proof_authority_provenance_attestation_verification,
    build_transition_approval_artifact_external_revocation_issuer_proof_authority_provenance,
    build_transition_approval_artifact_external_revocation_issuer_proof_authority_validation,
    build_transition_approval_artifact_external_revocation_issuer_proof_external_validity,
    build_transition_approval_artifact_external_revocation_issuer_proof_validity,
    build_transition_approval_artifact_external_revocation_issuer_proof_attestation,
    build_transition_approval_artifact_external_revocation_issuer_verification,
    build_transition_approval_artifact_external_revocation_issuer_authority,
    build_transition_approval_artifact_external_revocation_validation,
)


def _build_empty_cross_family_lines() -> list[str]:
    return [
        "## 5A. Cross-Family Runtime Coverage",
        "",
        "- runtime family count: 0",
        "- release lines covered: none",
        "- maturity bands covered: none",
        "- deferred family count: 0",
        "- deferred release-line families: none",
        "- heightened-review maturity families: none",
        "- promotion-eligible families: none",
        "- mixed-family policy note: no multi-runtime manifest is currently linked",
        "- mixed maturity posture: no multi-runtime manifest is currently linked",
        "- deferred family note: none",
        "- reviewable families: none",
        "- auditable families: none",
        "- onboarding-visible families: none",
        "- strictly deferred families: none",
        "- promotion readiness note: no multi-runtime manifest is currently linked",
        "- approval-eligible families: none",
        "- approval-blocked families: none",
        "- approval decision note: no multi-runtime manifest is currently linked",
        "- transition-conditional families: none",
        "- transition-blocked families: none",
        "- transition decision note: no multi-runtime manifest is currently linked",
        "- transition-prerequisite families: none",
        "- transition-prerequisite threshold: not-applicable",
        "- transition prerequisite note: no multi-runtime manifest is currently linked",
        "- transition-threshold-satisfied families: none",
        "- transition-threshold-pending families: none",
        "- transition threshold note: no multi-runtime manifest is currently linked",
        "- transition-fulfillment families: none",
        "- transition-fulfillment artifact: none",
        "- transition fulfillment note: no multi-runtime manifest is currently linked",
        "- transition-approval-bound families: none",
        "- transition-approval-artifact: none",
        "- transition approval binding note: no multi-runtime manifest is currently linked",
        "- transition-approval-artifact-required-strength: not-applicable",
        "- transition-approval-artifact-observed-strength: not-applicable",
        "- transition approval strength note: no multi-runtime manifest is currently linked",
        "- transition-approval-artifact-issuer: not-applicable",
        "- transition-approval-artifact-authority-state: not-applicable",
        "- transition approval authority note: no multi-runtime manifest is currently linked",
        "- transition-approval-artifact-validity-state: not-applicable",
        "- transition-approval-artifact-expiry-state: not-applicable",
        "- transition-approval-artifact-invalidation-state: not-applicable",
        "- transition approval validity note: no multi-runtime manifest is currently linked",
        "- transition-approval-artifact-revocation-evidence: not-applicable",
        "- transition-approval-artifact-expiry-evidence: not-applicable",
        "- transition-approval-artifact-invalidation-source: not-applicable",
        "- transition approval invalidation evidence note: no multi-runtime manifest is currently linked",
        "- transition-approval-artifact-expiry-timestamp: not-applicable",
        "- transition-approval-artifact-freshness-state: not-applicable",
        "- transition-approval-artifact-external-invalidation-authority: not-applicable",
        "- transition approval external validity note: no multi-runtime manifest is currently linked",
        "- transition-approval-artifact-external-authority-trust-state: not-applicable",
        "- transition-approval-artifact-external-authority-issuer-scope: not-applicable",
        "- transition approval external authority trust note: no multi-runtime manifest is currently linked",
        "- transition-approval-artifact-external-issuer-attestation: not-applicable",
        "- transition-approval-artifact-third-party-trust-policy: not-applicable",
        "- transition approval external issuer policy note: no multi-runtime manifest is currently linked",
        "- transition-approval-artifact-external-issuer-verification: not-applicable",
        "- transition-approval-artifact-third-party-trust-enforcement: not-applicable",
        "- transition approval external issuer verification note: no multi-runtime manifest is currently linked",
        "- transition-approval-artifact-external-issuer-proof-binding: not-applicable",
        "- transition-approval-artifact-external-revocation-authority-verification: not-applicable",
        "- transition approval external proof binding note: no multi-runtime manifest is currently linked",
        "- transition-approval-artifact-external-proof-verification: not-applicable",
        "- transition-approval-artifact-external-proof-issuer-scope: not-applicable",
        "- transition approval external proof verification note: no multi-runtime manifest is currently linked",
        "- transition-approval-artifact-external-proof-attestation-evidence: not-applicable",
        "- transition-approval-artifact-third-party-proof-trust-enforcement: not-applicable",
        "- transition approval external proof attestation note: no multi-runtime manifest is currently linked",
        "- transition-approval-artifact-external-revocation-validation: not-applicable",
        "- transition-approval-artifact-third-party-revocation-trust-enforcement: not-applicable",
        "- transition approval external revocation validation note: no multi-runtime manifest is currently linked",
        "- transition-approval-artifact-external-revocation-proof-evidence: not-applicable",
        "- transition-approval-artifact-third-party-revocation-attestation-enforcement: not-applicable",
        "- transition approval external revocation attestation note: no multi-runtime manifest is currently linked",
        "- transition-approval-artifact-external-revocation-issuer-authority: not-applicable",
        "- transition-approval-artifact-external-revocation-attestation-verification: not-applicable",
        "- transition approval external revocation issuer authority note: no multi-runtime manifest is currently linked",
        "- transition-approval-artifact-external-revocation-issuer-attestation-proof: not-applicable",
        "- transition-approval-artifact-third-party-revocation-issuer-trust-policy: not-applicable",
        "- transition approval external revocation issuer attestation note: no multi-runtime manifest is currently linked",
        "- transition-approval-artifact-external-revocation-issuer-proof-verification: not-applicable",
        "- transition-approval-artifact-third-party-revocation-issuer-trust-enforcement: not-applicable",
        "- transition approval external revocation issuer verification note: no multi-runtime manifest is currently linked",
        "- transition-approval-artifact-external-revocation-issuer-proof-attestation-evidence: not-applicable",
        "- transition-approval-artifact-third-party-revocation-issuer-trust-validation: not-applicable",
        "- transition approval external revocation issuer proof attestation note: no multi-runtime manifest is currently linked",
        "- transition-approval-artifact-external-revocation-issuer-proof-freshness: not-applicable",
        "- transition-approval-artifact-third-party-revocation-issuer-attestation-enforcement: not-applicable",
        "- transition approval external revocation issuer proof validity note: no multi-runtime manifest is currently linked",
        "- transition-approval-artifact-external-revocation-issuer-proof-expiry-timestamp: not-applicable",
        "- transition-approval-artifact-external-revocation-issuer-proof-invalidation-source: not-applicable",
        "- transition approval external revocation issuer proof external validity note: no multi-runtime manifest is currently linked",
        "- transition-approval-artifact-external-revocation-issuer-proof-timestamp-verification: not-applicable",
        "- transition-approval-artifact-external-revocation-issuer-proof-invalidation-authority-validation: not-applicable",
        "- transition approval external revocation issuer proof authority validation note: no multi-runtime manifest is currently linked",
        "- transition-approval-artifact-external-revocation-issuer-proof-authority-provenance: not-applicable",
        "- transition-approval-artifact-external-revocation-issuer-proof-invalidation-authority-provenance: not-applicable",
        "- transition approval external revocation issuer proof authority provenance note: no multi-runtime manifest is currently linked",
        "- transition-approval-artifact-external-revocation-issuer-proof-authority-attestation: not-applicable",
        "- transition-approval-artifact-external-revocation-issuer-proof-invalidation-authority-attestation: not-applicable",
        "- transition approval external revocation issuer proof authority attestation note: no multi-runtime manifest is currently linked",
        "- transition-approval-artifact-external-revocation-issuer-proof-authority-attestation-verification: not-applicable",
        "- transition-approval-artifact-external-revocation-issuer-proof-invalidation-authority-attestation-verification: not-applicable",
        "- transition approval external revocation issuer proof authority attestation verification note: no multi-runtime manifest is currently linked",
        "- transition-approval-artifact-external-revocation-issuer-proof-authority-provenance-verification: not-applicable",
        "- transition-approval-artifact-external-revocation-issuer-proof-invalidation-authority-provenance-verification: not-applicable",
        "- transition approval external revocation issuer proof authority provenance verification note: no multi-runtime manifest is currently linked",
        "- transition-approval-artifact-external-revocation-issuer-proof-authority-provenance-attestation-verification: not-applicable",
        "- transition-approval-artifact-external-revocation-issuer-proof-invalidation-authority-provenance-attestation-verification: not-applicable",
        "- transition approval external revocation issuer proof authority provenance attestation verification note: no multi-runtime manifest is currently linked",
        "- transition-approval-artifact-external-revocation-issuer-proof-authority-provenance-attestation-freshness: not-applicable",
        "- transition-approval-artifact-external-revocation-issuer-proof-invalidation-authority-provenance-attestation-freshness: not-applicable",
        "- transition approval external revocation issuer proof authority provenance attestation freshness note: no multi-runtime manifest is currently linked",
        "- transition-approval-artifact-external-revocation-issuer-proof-authority-provenance-attestation-provenance: not-applicable",
        "- transition-approval-artifact-external-revocation-issuer-proof-invalidation-authority-provenance-attestation-provenance: not-applicable",
        "- transition approval external revocation issuer proof authority provenance attestation provenance note: no multi-runtime manifest is currently linked",
        "- transition-approval-artifact-external-revocation-issuer-proof-authority-provenance-attestation-provenance-verification: not-applicable",
        "- transition-approval-artifact-external-revocation-issuer-proof-invalidation-authority-provenance-attestation-provenance-verification: not-applicable",
        "- transition approval external revocation issuer proof authority provenance attestation provenance verification note: no multi-runtime manifest is currently linked",
        "- transition-approval-artifact-external-revocation-issuer-proof-authority-provenance-attestation-provenance-freshness: not-applicable",
        "- transition-approval-artifact-external-revocation-issuer-proof-invalidation-authority-provenance-attestation-provenance-freshness: not-applicable",
        "- transition approval external revocation issuer proof authority provenance attestation provenance freshness note: no multi-runtime manifest is currently linked",
        "- transition-approval-artifact-external-revocation-issuer-proof-authority-provenance-attestation-provenance-freshness-proof: not-applicable",
        "- transition-approval-artifact-external-revocation-issuer-proof-invalidation-authority-provenance-attestation-provenance-freshness-proof: not-applicable",
        "- transition approval external revocation issuer proof authority provenance attestation provenance freshness proof note: no multi-runtime manifest is currently linked",
        "- transition-approval-artifact-external-revocation-issuer-proof-authority-provenance-attestation-provenance-freshness-proof-verification: not-applicable",
        "- transition-approval-artifact-external-revocation-issuer-proof-invalidation-authority-provenance-attestation-provenance-freshness-proof-verification: not-applicable",
        "- transition approval external revocation issuer proof authority provenance attestation provenance freshness proof verification note: no multi-runtime manifest is currently linked",
        "",
    ]


def build_cross_family_lines(
    runtime_manifest: dict | None,
    packet_type: str,
    decision: str,
    packet_rel_path: str,
    runtime_manifest_rel_path: str,
) -> list[str]:
    if not runtime_manifest:
        return _build_empty_cross_family_lines()

    entries = runtime_manifest.get("entries", [])
    release_line_map: dict[str, list[str]] = {}
    maturity_map: dict[str, list[str]] = {}
    for entry in entries:
        release_line_map.setdefault(entry["releaseLine"], []).append(entry["runtimeFamily"])
        maturity_map.setdefault(entry["maturity"], []).append(entry["runtimeFamily"])

    release_line_parts = [f"{line}={len(families)}" for line, families in sorted(release_line_map.items())]
    maturity_parts = [f"{band}={len(families)}" for band, families in sorted(maturity_map.items())]
    deferred_families = sorted(
        entry["runtimeFamily"]
        for entry in entries
        if entry["releaseLine"] == "local-ready" or entry["maturity"] == "hardening-active"
    )
    deferred_release_line_families = sorted(entry["runtimeFamily"] for entry in entries if entry["releaseLine"] == "local-ready")
    heightened_review_families = sorted(entry["runtimeFamily"] for entry in entries if entry["maturity"] == "hardening-active")
    promotion_eligible_families = sorted(
        entry["runtimeFamily"]
        for entry in entries
        if entry["maturity"] == "production-candidate" and entry["releaseLine"] in {"active", "stable"}
    )

    promotion_readiness = build_promotion_readiness(packet_type, entries)
    approval_policy = build_approval_decision_policy(packet_type, entries)
    transition_policy = build_transition_policy(packet_type, entries)
    transition_prerequisites = build_transition_prerequisites(packet_type, entries)
    transition_threshold_status = build_transition_threshold_status(packet_type, entries, decision)
    transition_fulfillment = build_transition_fulfillment(packet_type, entries, decision, runtime_manifest_rel_path)
    transition_approval_binding = build_transition_approval_artifact_binding(packet_type, entries, decision, packet_rel_path)
    transition_approval_fulfillment = build_transition_approval_artifact_fulfillment(packet_type, entries, decision)
    transition_approval_strength = build_transition_approval_artifact_strength(packet_type, decision)
    transition_approval_authority = build_transition_approval_artifact_authority(packet_type, decision)
    transition_approval_validity = build_transition_approval_artifact_validity(packet_type, decision)
    transition_approval_invalidation_evidence = build_transition_approval_artifact_invalidation_evidence(packet_type, decision)
    transition_approval_external_validity = build_transition_approval_artifact_external_validity_checks(packet_type, decision)
    transition_approval_external_authority_trust = build_transition_approval_artifact_external_authority_trust(packet_type, decision)
    transition_approval_external_issuer_policy = build_transition_approval_artifact_external_issuer_policy(packet_type, decision)
    transition_approval_external_issuer_verification = build_transition_approval_artifact_external_issuer_verification(packet_type, decision)
    transition_approval_external_proof_binding = build_transition_approval_artifact_external_proof_binding(packet_type, decision)
    transition_approval_external_proof_verification = build_transition_approval_artifact_external_proof_verification(packet_type, decision)
    transition_approval_external_proof_attestation = build_transition_approval_artifact_external_proof_attestation(packet_type, decision)
    transition_approval_external_revocation_validation = build_transition_approval_artifact_external_revocation_validation(packet_type, decision)
    transition_approval_external_revocation_attestation = build_transition_approval_artifact_external_revocation_attestation(packet_type, decision)
    transition_approval_external_revocation_issuer_authority = build_transition_approval_artifact_external_revocation_issuer_authority(packet_type, decision)
    transition_approval_external_revocation_issuer_attestation = build_transition_approval_artifact_external_revocation_issuer_attestation(packet_type, decision)
    transition_approval_external_revocation_issuer_verification = build_transition_approval_artifact_external_revocation_issuer_verification(packet_type, decision)
    transition_approval_external_revocation_issuer_proof_attestation = build_transition_approval_artifact_external_revocation_issuer_proof_attestation(packet_type, decision)
    transition_approval_external_revocation_issuer_proof_validity = build_transition_approval_artifact_external_revocation_issuer_proof_validity(packet_type, decision)
    transition_approval_external_revocation_issuer_proof_external_validity = build_transition_approval_artifact_external_revocation_issuer_proof_external_validity(packet_type, decision)
    transition_approval_external_revocation_issuer_proof_authority_validation = build_transition_approval_artifact_external_revocation_issuer_proof_authority_validation(packet_type, decision)
    transition_approval_external_revocation_issuer_proof_authority_provenance = build_transition_approval_artifact_external_revocation_issuer_proof_authority_provenance(packet_type, decision)
    transition_approval_external_revocation_issuer_proof_authority_attestation = build_transition_approval_artifact_external_revocation_issuer_proof_authority_attestation(packet_type, decision)
    transition_approval_external_revocation_issuer_proof_authority_attestation_verification = build_transition_approval_artifact_external_revocation_issuer_proof_authority_attestation_verification(packet_type, decision)
    transition_approval_external_revocation_issuer_proof_authority_provenance_verification = build_transition_approval_artifact_external_revocation_issuer_proof_authority_provenance_verification(packet_type, decision)
    transition_approval_external_revocation_issuer_proof_authority_provenance_attestation_verification = build_transition_approval_artifact_external_revocation_issuer_proof_authority_provenance_attestation_verification(packet_type, decision)
    transition_approval_external_revocation_issuer_proof_authority_provenance_attestation_freshness = build_transition_approval_artifact_external_revocation_issuer_proof_authority_provenance_attestation_freshness(packet_type, decision)
    transition_approval_external_revocation_issuer_proof_authority_provenance_attestation_provenance = build_transition_approval_artifact_external_revocation_issuer_proof_authority_provenance_attestation_provenance(packet_type, decision)
    transition_approval_external_revocation_issuer_proof_authority_provenance_attestation_provenance_verification = build_transition_approval_artifact_external_revocation_issuer_proof_authority_provenance_attestation_provenance_verification(packet_type, decision)
    transition_approval_external_revocation_issuer_proof_authority_provenance_attestation_provenance_freshness = build_transition_approval_artifact_external_revocation_issuer_proof_authority_provenance_attestation_provenance_freshness(packet_type, decision)
    transition_approval_external_revocation_issuer_proof_authority_provenance_attestation_provenance_freshness_proof = build_transition_approval_artifact_external_revocation_issuer_proof_authority_provenance_attestation_provenance_freshness_proof(packet_type, decision)
    transition_approval_external_revocation_issuer_proof_authority_provenance_attestation_provenance_freshness_proof_verification = build_transition_approval_artifact_external_revocation_issuer_proof_authority_provenance_attestation_provenance_freshness_proof_verification(packet_type, decision)

    lines = [
        "## 5A. Cross-Family Runtime Coverage",
        "",
        f"- runtime family count: {runtime_manifest.get('runtimeFamilyCount', len(entries))}",
        f"- release lines covered: {', '.join(release_line_parts) if release_line_parts else 'none'}",
        f"- maturity bands covered: {', '.join(maturity_parts) if maturity_parts else 'none'}",
        f"- deferred family count: {len(deferred_families)}",
        f"- deferred release-line families: {', '.join(deferred_release_line_families) if deferred_release_line_families else 'none'}",
        f"- heightened-review maturity families: {', '.join(heightened_review_families) if heightened_review_families else 'none'}",
        f"- promotion-eligible families: {', '.join(promotion_eligible_families) if promotion_eligible_families else 'none'}",
    ]
    for release_line, families in sorted(release_line_map.items()):
        lines.append(f"- release line {release_line}: {', '.join(sorted(families))}")
    for maturity, families in sorted(maturity_map.items()):
        lines.append(f"- maturity band {maturity}: {', '.join(sorted(families))}")

    mixed_policy_note = f"this packet evaluates the aggregated evidence set only for `{packet_type}` posture and does not imply blanket promotion of every covered runtime family"
    mixed_maturity_posture = build_mixed_maturity_posture(packet_type)

    lines.extend(
        [
            f"- mixed-family policy note: {mixed_policy_note}",
            f"- mixed maturity posture: {mixed_maturity_posture}",
            f"- deferred family note: {', '.join(deferred_families) if deferred_families else 'none'}",
            f"- reviewable families: {promotion_readiness['reviewable']}",
            f"- auditable families: {promotion_readiness['auditable']}",
            f"- onboarding-visible families: {promotion_readiness['onboarding_visible']}",
            f"- strictly deferred families: {promotion_readiness['strictly_deferred']}",
            f"- promotion readiness note: {promotion_readiness['note']}",
            f"- promotable families: {promotion_readiness['promotable']}",
            f"- exception-required families: {promotion_readiness['exception_required']}",
            f"- promotion exception note: {promotion_readiness['exception_note']}",
            f"- approval-eligible families: {approval_policy['eligible']}",
            f"- approval-blocked families: {approval_policy['blocked']}",
            f"- approval decision note: {approval_policy['note']}",
            f"- transition-conditional families: {transition_policy['conditional']}",
            f"- transition-blocked families: {transition_policy['blocked']}",
            f"- transition decision note: {transition_policy['note']}",
            f"- transition-prerequisite families: {transition_prerequisites['families']}",
            f"- transition-prerequisite threshold: {transition_prerequisites['threshold']}",
            f"- transition prerequisite note: {transition_prerequisites['note']}",
            f"- transition-threshold-satisfied families: {transition_threshold_status['satisfied']}",
            f"- transition-threshold-pending families: {transition_threshold_status['pending']}",
            f"- transition threshold note: {transition_threshold_status['note']}",
            f"- transition-fulfillment families: {transition_fulfillment['families']}",
            f"- transition-fulfillment artifact: {transition_fulfillment['artifact']}",
            f"- transition fulfillment note: {transition_fulfillment['note']}",
            f"- transition-approval-bound families: {transition_approval_binding['families']}",
            f"- transition-approval-artifact: {transition_approval_binding['artifact']}",
            f"- transition approval binding note: {transition_approval_binding['note']}",
            f"- transition-approval-artifact-satisfied families: {transition_approval_fulfillment['satisfied']}",
            f"- transition-approval-artifact-pending families: {transition_approval_fulfillment['pending']}",
            f"- transition approval fulfillment note: {transition_approval_fulfillment['note']}",
            f"- transition-approval-artifact-required-strength: {transition_approval_strength['required']}",
            f"- transition-approval-artifact-observed-strength: {transition_approval_strength['observed']}",
            f"- transition approval strength note: {transition_approval_strength['note']}",
            f"- transition-approval-artifact-issuer: {transition_approval_authority['issuer']}",
            f"- transition-approval-artifact-authority-state: {transition_approval_authority['state']}",
            f"- transition approval authority note: {transition_approval_authority['note']}",
            f"- transition-approval-artifact-validity-state: {transition_approval_validity['validity']}",
            f"- transition-approval-artifact-expiry-state: {transition_approval_validity['expiry']}",
            f"- transition-approval-artifact-invalidation-state: {transition_approval_validity['invalidation']}",
            f"- transition approval validity note: {transition_approval_validity['note']}",
            f"- transition-approval-artifact-revocation-evidence: {transition_approval_invalidation_evidence['revocation']}",
            f"- transition-approval-artifact-expiry-evidence: {transition_approval_invalidation_evidence['expiry_evidence']}",
            f"- transition-approval-artifact-invalidation-source: {transition_approval_invalidation_evidence['invalidation_source']}",
            f"- transition approval invalidation evidence note: {transition_approval_invalidation_evidence['note']}",
            f"- transition-approval-artifact-expiry-timestamp: {transition_approval_external_validity['expiry_timestamp']}",
            f"- transition-approval-artifact-freshness-state: {transition_approval_external_validity['freshness']}",
            f"- transition-approval-artifact-external-invalidation-authority: {transition_approval_external_validity['invalidation_authority']}",
            f"- transition approval external validity note: {transition_approval_external_validity['note']}",
            f"- transition-approval-artifact-external-authority-trust-state: {transition_approval_external_authority_trust['trust_state']}",
            f"- transition-approval-artifact-external-authority-issuer-scope: {transition_approval_external_authority_trust['issuer_scope']}",
            f"- transition approval external authority trust note: {transition_approval_external_authority_trust['note']}",
            f"- transition-approval-artifact-external-issuer-attestation: {transition_approval_external_issuer_policy['attestation']}",
            f"- transition-approval-artifact-third-party-trust-policy: {transition_approval_external_issuer_policy['trust_policy']}",
            f"- transition approval external issuer policy note: {transition_approval_external_issuer_policy['note']}",
            f"- transition-approval-artifact-external-issuer-verification: {transition_approval_external_issuer_verification['verification_state']}",
            f"- transition-approval-artifact-third-party-trust-enforcement: {transition_approval_external_issuer_verification['trust_enforcement']}",
            f"- transition approval external issuer verification note: {transition_approval_external_issuer_verification['note']}",
            f"- transition-approval-artifact-external-issuer-proof-binding: {transition_approval_external_proof_binding['proof_binding']}",
            f"- transition-approval-artifact-external-revocation-authority-verification: {transition_approval_external_proof_binding['revocation_authority_verification']}",
            f"- transition approval external proof binding note: {transition_approval_external_proof_binding['note']}",
            f"- transition-approval-artifact-external-proof-verification: {transition_approval_external_proof_verification['proof_verification']}",
            f"- transition-approval-artifact-external-proof-issuer-scope: {transition_approval_external_proof_verification['proof_issuer_scope']}",
            f"- transition approval external proof verification note: {transition_approval_external_proof_verification['note']}",
            f"- transition-approval-artifact-external-proof-attestation-evidence: {transition_approval_external_proof_attestation['attestation_evidence']}",
            f"- transition-approval-artifact-third-party-proof-trust-enforcement: {transition_approval_external_proof_attestation['third_party_proof_trust_enforcement']}",
            f"- transition approval external proof attestation note: {transition_approval_external_proof_attestation['note']}",
            f"- transition-approval-artifact-external-revocation-validation: {transition_approval_external_revocation_validation['revocation_validation']}",
            f"- transition-approval-artifact-third-party-revocation-trust-enforcement: {transition_approval_external_revocation_validation['third_party_revocation_trust_enforcement']}",
            f"- transition approval external revocation validation note: {transition_approval_external_revocation_validation['note']}",
            f"- transition-approval-artifact-external-revocation-proof-evidence: {transition_approval_external_revocation_attestation['revocation_proof_evidence']}",
            f"- transition-approval-artifact-third-party-revocation-attestation-enforcement: {transition_approval_external_revocation_attestation['third_party_revocation_attestation_enforcement']}",
            f"- transition approval external revocation attestation note: {transition_approval_external_revocation_attestation['note']}",
            f"- transition-approval-artifact-external-revocation-issuer-authority: {transition_approval_external_revocation_issuer_authority['issuer_authority']}",
            f"- transition-approval-artifact-external-revocation-attestation-verification: {transition_approval_external_revocation_issuer_authority['attestation_verification']}",
            f"- transition approval external revocation issuer authority note: {transition_approval_external_revocation_issuer_authority['note']}",
            f"- transition-approval-artifact-external-revocation-issuer-attestation-proof: {transition_approval_external_revocation_issuer_attestation['issuer_attestation_proof']}",
            f"- transition-approval-artifact-third-party-revocation-issuer-trust-policy: {transition_approval_external_revocation_issuer_attestation['third_party_revocation_issuer_trust_policy']}",
            f"- transition approval external revocation issuer attestation note: {transition_approval_external_revocation_issuer_attestation['note']}",
            f"- transition-approval-artifact-external-revocation-issuer-proof-verification: {transition_approval_external_revocation_issuer_verification['issuer_proof_verification']}",
            f"- transition-approval-artifact-third-party-revocation-issuer-trust-enforcement: {transition_approval_external_revocation_issuer_verification['third_party_revocation_issuer_trust_enforcement']}",
            f"- transition approval external revocation issuer verification note: {transition_approval_external_revocation_issuer_verification['note']}",
            f"- transition-approval-artifact-external-revocation-issuer-proof-attestation-evidence: {transition_approval_external_revocation_issuer_proof_attestation['issuer_proof_attestation_evidence']}",
            f"- transition-approval-artifact-third-party-revocation-issuer-trust-validation: {transition_approval_external_revocation_issuer_proof_attestation['third_party_revocation_issuer_trust_validation']}",
            f"- transition approval external revocation issuer proof attestation note: {transition_approval_external_revocation_issuer_proof_attestation['note']}",
            f"- transition-approval-artifact-external-revocation-issuer-proof-freshness: {transition_approval_external_revocation_issuer_proof_validity['issuer_proof_freshness']}",
            f"- transition-approval-artifact-third-party-revocation-issuer-attestation-enforcement: {transition_approval_external_revocation_issuer_proof_validity['third_party_revocation_issuer_attestation_enforcement']}",
            f"- transition approval external revocation issuer proof validity note: {transition_approval_external_revocation_issuer_proof_validity['note']}",
            f"- transition-approval-artifact-external-revocation-issuer-proof-expiry-timestamp: {transition_approval_external_revocation_issuer_proof_external_validity['issuer_proof_expiry_timestamp']}",
            f"- transition-approval-artifact-external-revocation-issuer-proof-invalidation-source: {transition_approval_external_revocation_issuer_proof_external_validity['issuer_proof_invalidation_source']}",
            f"- transition approval external revocation issuer proof external validity note: {transition_approval_external_revocation_issuer_proof_external_validity['note']}",
            f"- transition-approval-artifact-external-revocation-issuer-proof-timestamp-verification: {transition_approval_external_revocation_issuer_proof_authority_validation['issuer_proof_timestamp_verification']}",
            f"- transition-approval-artifact-external-revocation-issuer-proof-invalidation-authority-validation: {transition_approval_external_revocation_issuer_proof_authority_validation['issuer_proof_invalidation_authority_validation']}",
            f"- transition approval external revocation issuer proof authority validation note: {transition_approval_external_revocation_issuer_proof_authority_validation['note']}",
            f"- transition-approval-artifact-external-revocation-issuer-proof-authority-provenance: {transition_approval_external_revocation_issuer_proof_authority_provenance['issuer_proof_authority_provenance']}",
            f"- transition-approval-artifact-external-revocation-issuer-proof-invalidation-authority-provenance: {transition_approval_external_revocation_issuer_proof_authority_provenance['issuer_proof_invalidation_authority_provenance']}",
            f"- transition approval external revocation issuer proof authority provenance note: {transition_approval_external_revocation_issuer_proof_authority_provenance['note']}",
            f"- transition-approval-artifact-external-revocation-issuer-proof-authority-attestation: {transition_approval_external_revocation_issuer_proof_authority_attestation['issuer_proof_authority_attestation']}",
            f"- transition-approval-artifact-external-revocation-issuer-proof-invalidation-authority-attestation: {transition_approval_external_revocation_issuer_proof_authority_attestation['issuer_proof_invalidation_authority_attestation']}",
            f"- transition approval external revocation issuer proof authority attestation note: {transition_approval_external_revocation_issuer_proof_authority_attestation['note']}",
            f"- transition-approval-artifact-external-revocation-issuer-proof-authority-attestation-verification: {transition_approval_external_revocation_issuer_proof_authority_attestation_verification['issuer_proof_authority_attestation_verification']}",
            f"- transition-approval-artifact-external-revocation-issuer-proof-invalidation-authority-attestation-verification: {transition_approval_external_revocation_issuer_proof_authority_attestation_verification['issuer_proof_invalidation_authority_attestation_verification']}",
            f"- transition approval external revocation issuer proof authority attestation verification note: {transition_approval_external_revocation_issuer_proof_authority_attestation_verification['note']}",
            f"- transition-approval-artifact-external-revocation-issuer-proof-authority-provenance-verification: {transition_approval_external_revocation_issuer_proof_authority_provenance_verification['issuer_proof_authority_provenance_verification']}",
            f"- transition-approval-artifact-external-revocation-issuer-proof-invalidation-authority-provenance-verification: {transition_approval_external_revocation_issuer_proof_authority_provenance_verification['issuer_proof_invalidation_authority_provenance_verification']}",
            f"- transition approval external revocation issuer proof authority provenance verification note: {transition_approval_external_revocation_issuer_proof_authority_provenance_verification['note']}",
            f"- transition-approval-artifact-external-revocation-issuer-proof-authority-provenance-attestation-verification: {transition_approval_external_revocation_issuer_proof_authority_provenance_attestation_verification['issuer_proof_authority_provenance_attestation_verification']}",
            f"- transition-approval-artifact-external-revocation-issuer-proof-invalidation-authority-provenance-attestation-verification: {transition_approval_external_revocation_issuer_proof_authority_provenance_attestation_verification['issuer_proof_invalidation_authority_provenance_attestation_verification']}",
            f"- transition approval external revocation issuer proof authority provenance attestation verification note: {transition_approval_external_revocation_issuer_proof_authority_provenance_attestation_verification['note']}",
            f"- transition-approval-artifact-external-revocation-issuer-proof-authority-provenance-attestation-freshness: {transition_approval_external_revocation_issuer_proof_authority_provenance_attestation_freshness['issuer_proof_authority_provenance_attestation_freshness']}",
            f"- transition-approval-artifact-external-revocation-issuer-proof-invalidation-authority-provenance-attestation-freshness: {transition_approval_external_revocation_issuer_proof_authority_provenance_attestation_freshness['issuer_proof_invalidation_authority_provenance_attestation_freshness']}",
            f"- transition approval external revocation issuer proof authority provenance attestation freshness note: {transition_approval_external_revocation_issuer_proof_authority_provenance_attestation_freshness['note']}",
            f"- transition-approval-artifact-external-revocation-issuer-proof-authority-provenance-attestation-provenance: {transition_approval_external_revocation_issuer_proof_authority_provenance_attestation_provenance['issuer_proof_authority_provenance_attestation_provenance']}",
            f"- transition-approval-artifact-external-revocation-issuer-proof-invalidation-authority-provenance-attestation-provenance: {transition_approval_external_revocation_issuer_proof_authority_provenance_attestation_provenance['issuer_proof_invalidation_authority_provenance_attestation_provenance']}",
            f"- transition approval external revocation issuer proof authority provenance attestation provenance note: {transition_approval_external_revocation_issuer_proof_authority_provenance_attestation_provenance['note']}",
            f"- transition-approval-artifact-external-revocation-issuer-proof-authority-provenance-attestation-provenance-verification: {transition_approval_external_revocation_issuer_proof_authority_provenance_attestation_provenance_verification['issuer_proof_authority_provenance_attestation_provenance_verification']}",
            f"- transition-approval-artifact-external-revocation-issuer-proof-invalidation-authority-provenance-attestation-provenance-verification: {transition_approval_external_revocation_issuer_proof_authority_provenance_attestation_provenance_verification['issuer_proof_invalidation_authority_provenance_attestation_provenance_verification']}",
            f"- transition approval external revocation issuer proof authority provenance attestation provenance verification note: {transition_approval_external_revocation_issuer_proof_authority_provenance_attestation_provenance_verification['note']}",
            f"- transition-approval-artifact-external-revocation-issuer-proof-authority-provenance-attestation-provenance-freshness: {transition_approval_external_revocation_issuer_proof_authority_provenance_attestation_provenance_freshness['issuer_proof_authority_provenance_attestation_provenance_freshness']}",
            f"- transition-approval-artifact-external-revocation-issuer-proof-invalidation-authority-provenance-attestation-provenance-freshness: {transition_approval_external_revocation_issuer_proof_authority_provenance_attestation_provenance_freshness['issuer_proof_invalidation_authority_provenance_attestation_provenance_freshness']}",
            f"- transition approval external revocation issuer proof authority provenance attestation provenance freshness note: {transition_approval_external_revocation_issuer_proof_authority_provenance_attestation_provenance_freshness['note']}",
            f"- transition-approval-artifact-external-revocation-issuer-proof-authority-provenance-attestation-provenance-freshness-proof: {transition_approval_external_revocation_issuer_proof_authority_provenance_attestation_provenance_freshness_proof['issuer_proof_authority_provenance_attestation_provenance_freshness_proof']}",
            f"- transition-approval-artifact-external-revocation-issuer-proof-invalidation-authority-provenance-attestation-provenance-freshness-proof: {transition_approval_external_revocation_issuer_proof_authority_provenance_attestation_provenance_freshness_proof['issuer_proof_invalidation_authority_provenance_attestation_provenance_freshness_proof']}",
            f"- transition approval external revocation issuer proof authority provenance attestation provenance freshness proof note: {transition_approval_external_revocation_issuer_proof_authority_provenance_attestation_provenance_freshness_proof['note']}",
            f"- transition-approval-artifact-external-revocation-issuer-proof-authority-provenance-attestation-provenance-freshness-proof-verification: {transition_approval_external_revocation_issuer_proof_authority_provenance_attestation_provenance_freshness_proof_verification['issuer_proof_authority_provenance_attestation_provenance_freshness_proof_verification']}",
            f"- transition-approval-artifact-external-revocation-issuer-proof-invalidation-authority-provenance-attestation-provenance-freshness-proof-verification: {transition_approval_external_revocation_issuer_proof_authority_provenance_attestation_provenance_freshness_proof_verification['issuer_proof_invalidation_authority_provenance_attestation_provenance_freshness_proof_verification']}",
            f"- transition approval external revocation issuer proof authority provenance attestation provenance freshness proof verification note: {transition_approval_external_revocation_issuer_proof_authority_provenance_attestation_provenance_freshness_proof_verification['note']}",
            "",
        ]
    )
    return lines
