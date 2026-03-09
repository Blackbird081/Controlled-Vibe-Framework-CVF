#!/usr/bin/env python3
"""
Export and validate a canonical enterprise-onboarding packet posture for the runtime evidence chain.
"""

from __future__ import annotations

import subprocess
import sys
import os
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
RELEASE_GATE = REPO_ROOT / "scripts" / "run_cvf_runtime_evidence_release_gate.py"
EXPORT_PACKET = REPO_ROOT / "scripts" / "export_cvf_release_packet.py"
PACK_GATE = REPO_ROOT / "governance" / "compat" / "check_enterprise_evidence_pack.py"
MANIFEST_GATE = REPO_ROOT / "governance" / "compat" / "check_runtime_evidence_manifest.py"
POLICY_GATE = REPO_ROOT / "governance" / "compat" / "check_runtime_evidence_release_policy.py"
COVERAGE_GATE = REPO_ROOT / "governance" / "compat" / "check_cross_family_packet_coverage.py"
DEFERRED_GATE = REPO_ROOT / "governance" / "compat" / "check_cross_family_deferred_policy.py"
PROMOTION_GATE = REPO_ROOT / "governance" / "compat" / "check_cross_family_promotion_readiness.py"
PROMOTION_POLICY_GATE = REPO_ROOT / "governance" / "compat" / "check_cross_family_promotion_policy.py"
APPROVAL_DECISION_GATE = REPO_ROOT / "governance" / "compat" / "check_cross_family_approval_decision_policy.py"
TRANSITION_GATE = REPO_ROOT / "governance" / "compat" / "check_cross_family_transition_policy.py"
TRANSITION_PREREQUISITES_GATE = REPO_ROOT / "governance" / "compat" / "check_cross_family_transition_prerequisites.py"
TRANSITION_THRESHOLD_GATE = REPO_ROOT / "governance" / "compat" / "check_cross_family_transition_threshold_satisfaction.py"
TRANSITION_FULFILLMENT_GATE = REPO_ROOT / "governance" / "compat" / "check_cross_family_transition_fulfillment.py"
APPROVAL_ARTIFACT_BINDING_GATE = REPO_ROOT / "governance" / "compat" / "check_cross_family_approval_artifact_binding.py"
APPROVAL_ARTIFACT_FULFILLMENT_GATE = REPO_ROOT / "governance" / "compat" / "check_cross_family_approval_artifact_fulfillment.py"
APPROVAL_ARTIFACT_STRENGTH_GATE = REPO_ROOT / "governance" / "compat" / "check_cross_family_approval_artifact_strength.py"
APPROVAL_ARTIFACT_AUTHORITY_GATE = REPO_ROOT / "governance" / "compat" / "check_cross_family_approval_artifact_authority.py"
APPROVAL_ARTIFACT_VALIDITY_GATE = REPO_ROOT / "governance" / "compat" / "check_cross_family_approval_artifact_validity.py"
APPROVAL_ARTIFACT_INVALIDATION_EVIDENCE_GATE = REPO_ROOT / "governance" / "compat" / "check_cross_family_approval_artifact_invalidation_evidence.py"
APPROVAL_ARTIFACT_EXTERNAL_VALIDITY_GATE = REPO_ROOT / "governance" / "compat" / "check_cross_family_approval_artifact_external_validity.py"
APPROVAL_ARTIFACT_EXTERNAL_AUTHORITY_TRUST_GATE = REPO_ROOT / "governance" / "compat" / "check_cross_family_approval_artifact_external_authority_trust.py"
APPROVAL_ARTIFACT_EXTERNAL_ISSUER_POLICY_GATE = REPO_ROOT / "governance" / "compat" / "check_cross_family_approval_artifact_external_issuer_policy.py"
APPROVAL_ARTIFACT_EXTERNAL_ISSUER_VERIFICATION_GATE = REPO_ROOT / "governance" / "compat" / "check_cross_family_approval_artifact_external_issuer_verification.py"
APPROVAL_ARTIFACT_EXTERNAL_PROOF_BINDING_GATE = REPO_ROOT / "governance" / "compat" / "check_cross_family_approval_artifact_external_proof_binding.py"
APPROVAL_ARTIFACT_EXTERNAL_PROOF_VERIFICATION_GATE = REPO_ROOT / "governance" / "compat" / "check_cross_family_approval_artifact_external_proof_verification.py"
APPROVAL_ARTIFACT_EXTERNAL_PROOF_ATTESTATION_GATE = REPO_ROOT / "governance" / "compat" / "check_cross_family_approval_artifact_external_proof_attestation.py"
APPROVAL_ARTIFACT_EXTERNAL_REVOCATION_VALIDATION_GATE = REPO_ROOT / "governance" / "compat" / "check_cross_family_approval_artifact_external_revocation_validation.py"
APPROVAL_ARTIFACT_EXTERNAL_REVOCATION_ATTESTATION_GATE = REPO_ROOT / "governance" / "compat" / "check_cross_family_approval_artifact_external_revocation_attestation.py"
APPROVAL_ARTIFACT_EXTERNAL_REVOCATION_ISSUER_AUTHORITY_GATE = REPO_ROOT / "governance" / "compat" / "check_cross_family_approval_artifact_external_revocation_issuer_authority.py"
APPROVAL_ARTIFACT_EXTERNAL_REVOCATION_ISSUER_ATTESTATION_GATE = REPO_ROOT / "governance" / "compat" / "check_cross_family_approval_artifact_external_revocation_issuer_attestation.py"
APPROVAL_ARTIFACT_EXTERNAL_REVOCATION_ISSUER_VERIFICATION_GATE = REPO_ROOT / "governance" / "compat" / "check_cross_family_approval_artifact_external_revocation_issuer_verification.py"
APPROVAL_ARTIFACT_EXTERNAL_REVOCATION_ISSUER_PROOF_ATTESTATION_GATE = REPO_ROOT / "governance" / "compat" / "check_cross_family_approval_artifact_external_revocation_issuer_proof_attestation.py"
APPROVAL_ARTIFACT_EXTERNAL_REVOCATION_ISSUER_PROOF_VALIDITY_GATE = REPO_ROOT / "governance" / "compat" / "check_cross_family_approval_artifact_external_revocation_issuer_proof_validity.py"
APPROVAL_ARTIFACT_EXTERNAL_REVOCATION_ISSUER_PROOF_EXTERNAL_VALIDITY_GATE = REPO_ROOT / "governance" / "compat" / "check_cross_family_approval_artifact_external_revocation_issuer_proof_external_validity.py"
APPROVAL_ARTIFACT_EXTERNAL_REVOCATION_ISSUER_PROOF_AUTHORITY_VALIDATION_GATE = REPO_ROOT / "governance" / "compat" / "check_cross_family_approval_artifact_external_revocation_issuer_proof_authority_validation.py"
APPROVAL_ARTIFACT_EXTERNAL_REVOCATION_ISSUER_PROOF_AUTHORITY_PROVENANCE_GATE = REPO_ROOT / "governance" / "compat" / "check_cross_family_approval_artifact_external_revocation_issuer_proof_authority_provenance.py"
APPROVAL_ARTIFACT_EXTERNAL_REVOCATION_ISSUER_PROOF_AUTHORITY_ATTESTATION_GATE = REPO_ROOT / "governance" / "compat" / "check_cross_family_approval_artifact_external_revocation_issuer_proof_authority_attestation.py"
PACKET_PATH = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_ENTERPRISE_ONBOARDING_PACKET_2026-03-07.md"


def _run(command: list[str]) -> None:
    process = subprocess.run(
        command,
        cwd=REPO_ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    sys.stdout.write(process.stdout)
    if process.returncode != 0:
        raise SystemExit(process.returncode)


def main() -> int:
    if os.environ.get("CVF_SKIP_RUNTIME_EVIDENCE_RELEASE_GATE") != "1":
        _run([sys.executable, str(RELEASE_GATE)])
    _run(
        [
            sys.executable,
            str(EXPORT_PACKET),
            "--output",
            str(PACKET_PATH),
            "--owner",
            "CVF enterprise onboarding evidence wave",
            "--packet-type",
            "enterprise onboarding snapshot",
            "--version-token",
            "v1.7.1",
            "--target-module",
            "Multi-runtime enterprise onboarding evidence review",
            "--local-only-constraints",
            "onboarding-only packet; not an approval artifact; publication decision deferred",
            "--known-open-risks",
            "implemented-local families remain outside onboarding baseline; enterprise review still required before any publication decision",
            "--decision",
            "onboarding ready",
        ]
    )
    _run([sys.executable, str(PACK_GATE), "--packet", str(PACKET_PATH), "--enforce"])
    _run([sys.executable, str(MANIFEST_GATE), "--packet", str(PACKET_PATH), "--allow-secondary-packet", "--enforce"])
    _run([sys.executable, str(POLICY_GATE), "--packet", str(PACKET_PATH), "--enforce"])
    _run([sys.executable, str(COVERAGE_GATE), "--packet", str(PACKET_PATH), "--enforce"])
    _run([sys.executable, str(DEFERRED_GATE), "--packet", str(PACKET_PATH), "--enforce"])
    _run([sys.executable, str(PROMOTION_GATE), "--packet", str(PACKET_PATH), "--enforce"])
    _run([sys.executable, str(PROMOTION_POLICY_GATE), "--packet", str(PACKET_PATH), "--enforce"])
    _run([sys.executable, str(APPROVAL_DECISION_GATE), "--packet", str(PACKET_PATH), "--enforce"])
    _run([sys.executable, str(TRANSITION_GATE), "--packet", str(PACKET_PATH), "--enforce"])
    _run([sys.executable, str(TRANSITION_PREREQUISITES_GATE), "--packet", str(PACKET_PATH), "--enforce"])
    _run([sys.executable, str(TRANSITION_THRESHOLD_GATE), "--packet", str(PACKET_PATH), "--enforce"])
    _run([sys.executable, str(TRANSITION_FULFILLMENT_GATE), "--packet", str(PACKET_PATH), "--enforce"])
    _run([sys.executable, str(APPROVAL_ARTIFACT_BINDING_GATE), "--packet", str(PACKET_PATH), "--enforce"])
    _run([sys.executable, str(APPROVAL_ARTIFACT_FULFILLMENT_GATE), "--packet", str(PACKET_PATH), "--enforce"])
    _run([sys.executable, str(APPROVAL_ARTIFACT_STRENGTH_GATE), "--packet", str(PACKET_PATH), "--enforce"])
    _run([sys.executable, str(APPROVAL_ARTIFACT_AUTHORITY_GATE), "--packet", str(PACKET_PATH), "--enforce"])
    _run([sys.executable, str(APPROVAL_ARTIFACT_VALIDITY_GATE), "--packet", str(PACKET_PATH), "--enforce"])
    _run([sys.executable, str(APPROVAL_ARTIFACT_INVALIDATION_EVIDENCE_GATE), "--packet", str(PACKET_PATH), "--enforce"])
    _run([sys.executable, str(APPROVAL_ARTIFACT_EXTERNAL_VALIDITY_GATE), "--packet", str(PACKET_PATH), "--enforce"])
    _run([sys.executable, str(APPROVAL_ARTIFACT_EXTERNAL_AUTHORITY_TRUST_GATE), "--packet", str(PACKET_PATH), "--enforce"])
    _run([sys.executable, str(APPROVAL_ARTIFACT_EXTERNAL_ISSUER_POLICY_GATE), "--packet", str(PACKET_PATH), "--enforce"])
    _run([sys.executable, str(APPROVAL_ARTIFACT_EXTERNAL_ISSUER_VERIFICATION_GATE), "--packet", str(PACKET_PATH), "--enforce"])
    _run([sys.executable, str(APPROVAL_ARTIFACT_EXTERNAL_PROOF_BINDING_GATE), "--packet", str(PACKET_PATH), "--enforce"])
    _run([sys.executable, str(APPROVAL_ARTIFACT_EXTERNAL_PROOF_VERIFICATION_GATE), "--packet", str(PACKET_PATH), "--enforce"])
    _run([sys.executable, str(APPROVAL_ARTIFACT_EXTERNAL_PROOF_ATTESTATION_GATE), "--packet", str(PACKET_PATH), "--enforce"])
    _run([sys.executable, str(APPROVAL_ARTIFACT_EXTERNAL_REVOCATION_VALIDATION_GATE), "--packet", str(PACKET_PATH), "--enforce"])
    _run([sys.executable, str(APPROVAL_ARTIFACT_EXTERNAL_REVOCATION_ATTESTATION_GATE), "--packet", str(PACKET_PATH), "--enforce"])
    _run([sys.executable, str(APPROVAL_ARTIFACT_EXTERNAL_REVOCATION_ISSUER_AUTHORITY_GATE), "--packet", str(PACKET_PATH), "--enforce"])
    _run([sys.executable, str(APPROVAL_ARTIFACT_EXTERNAL_REVOCATION_ISSUER_ATTESTATION_GATE), "--packet", str(PACKET_PATH), "--enforce"])
    _run([sys.executable, str(APPROVAL_ARTIFACT_EXTERNAL_REVOCATION_ISSUER_VERIFICATION_GATE), "--packet", str(PACKET_PATH), "--enforce"])
    _run([sys.executable, str(APPROVAL_ARTIFACT_EXTERNAL_REVOCATION_ISSUER_PROOF_ATTESTATION_GATE), "--packet", str(PACKET_PATH), "--enforce"])
    _run([sys.executable, str(APPROVAL_ARTIFACT_EXTERNAL_REVOCATION_ISSUER_PROOF_VALIDITY_GATE), "--packet", str(PACKET_PATH), "--enforce"])
    _run([sys.executable, str(APPROVAL_ARTIFACT_EXTERNAL_REVOCATION_ISSUER_PROOF_EXTERNAL_VALIDITY_GATE), "--packet", str(PACKET_PATH), "--enforce"])
    _run([sys.executable, str(APPROVAL_ARTIFACT_EXTERNAL_REVOCATION_ISSUER_PROOF_AUTHORITY_VALIDATION_GATE), "--packet", str(PACKET_PATH), "--enforce"])
    _run([sys.executable, str(APPROVAL_ARTIFACT_EXTERNAL_REVOCATION_ISSUER_PROOF_AUTHORITY_PROVENANCE_GATE), "--packet", str(PACKET_PATH), "--enforce"])
    _run([sys.executable, str(APPROVAL_ARTIFACT_EXTERNAL_REVOCATION_ISSUER_PROOF_AUTHORITY_ATTESTATION_GATE), "--packet", str(PACKET_PATH), "--enforce"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
