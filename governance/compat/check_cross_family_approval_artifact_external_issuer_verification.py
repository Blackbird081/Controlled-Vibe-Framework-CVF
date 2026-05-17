#!/usr/bin/env python3
"""
Validate packet-specific approval artifact external issuer verification and trust enforcement semantics.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_MANIFEST = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_W4_MULTI_RUNTIME_EVIDENCE_MANIFEST_2026-03-07.json"
DEFAULT_PACKET = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_RELEASE_APPROVAL_PACKET_LOCAL_BASELINE_2026-03-07.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _read_json(path: Path) -> dict[str, Any]:
    return json.loads(_read(path))


def _rel(path: Path) -> str:
    return str(path.relative_to(REPO_ROOT)).replace("\\", "/")


def _extract_field(label: str, packet_text: str) -> str:
    match = re.search(rf"^- {re.escape(label)}:\s*(.+)$", packet_text, re.MULTILINE)
    return match.group(1).strip() if match else ""


def _build_expectations(packet_type: str, decision: str) -> dict[str, str]:
    decision_lower = decision.strip().lower()

    if packet_type == "internal audit evidence snapshot":
        return {
            "verification_state": "not-applicable",
            "trust_enforcement": "not-applicable",
            "note": "internal audit posture does not verify external issuer attestation or enforce third-party issuer trust because no runtime family may enter promotion transition inside audit evidence review",
        }
    if packet_type == "enterprise onboarding snapshot":
        return {
            "verification_state": "not-applicable",
            "trust_enforcement": "not-applicable",
            "note": "enterprise onboarding posture does not verify external issuer attestation or enforce third-party issuer trust because no runtime family may enter promotion transition inside onboarding evidence review",
        }

    approved = any(
        phrase in decision_lower
        for phrase in ("release approved", "publication approved", "promotion approved")
    )
    if approved:
        note = "production-candidate review posture treats issuer attestation as verified at the current governing boundary and enforces self-issued-only trust because no third-party issuer is allowed for the active approval artifact"
        if packet_type == "local release approval snapshot":
            note = "local-ready posture treats issuer attestation as verified at the current governing boundary and enforces self-issued-only trust because no third-party issuer is allowed for the active approval artifact"
        return {
            "verification_state": "verified-self-attested-boundary",
            "trust_enforcement": "third-party-denied",
            "note": note,
        }

    note = "production-candidate review posture keeps issuer attestation verification and third-party issuer trust enforcement unbound while no approval-strength decision is present in the packet"
    if packet_type == "local release approval snapshot":
        note = "local-ready posture keeps issuer attestation verification and third-party issuer trust enforcement unbound while no approval-strength decision is present in the packet"
    return {
        "verification_state": "unbound",
        "trust_enforcement": "unbound",
        "note": note,
    }


def build_report(manifest_path: Path, packet_path: Path) -> dict[str, Any]:
    violations: list[dict[str, str]] = []
    if not manifest_path.exists():
        violations.append({"type": "manifest_missing", "path": _rel(manifest_path), "message": "Runtime manifest is missing."})
    if not packet_path.exists():
        violations.append({"type": "packet_missing", "path": _rel(packet_path), "message": "Packet is missing."})
    if violations:
        return {"manifestPath": _rel(manifest_path), "packetPath": _rel(packet_path), "violationCount": len(violations), "violations": violations, "compliant": False}

    manifest = _read_json(manifest_path)
    packet_text = _read(packet_path)
    packet_type = _extract_field("packet type", packet_text)
    decision = _extract_field("decision", packet_text)
    expected = _build_expectations(packet_type, decision)

    verification_state = _extract_field("transition-approval-artifact-external-issuer-verification", packet_text)
    trust_enforcement = _extract_field("transition-approval-artifact-third-party-trust-enforcement", packet_text)
    note = _extract_field("transition approval external issuer verification note", packet_text)

    if verification_state != expected["verification_state"]:
        violations.append({"type": "approval_artifact_external_issuer_verification_mismatch", "path": _rel(packet_path), "message": "Packet approval-artifact external issuer verification state does not match posture policy."})
    if trust_enforcement != expected["trust_enforcement"]:
        violations.append({"type": "approval_artifact_third_party_trust_enforcement_mismatch", "path": _rel(packet_path), "message": "Packet approval-artifact third-party trust enforcement does not match posture policy."})
    if note != expected["note"]:
        violations.append({"type": "approval_artifact_external_issuer_verification_note_mismatch", "path": _rel(packet_path), "message": "Packet approval artifact external issuer verification note does not match posture policy."})

    return {
        "manifestPath": _rel(manifest_path),
        "packetPath": _rel(packet_path),
        "runtimeFamilyCount": len(manifest.get("entries", [])),
        "violationCount": len(violations),
        "violations": violations,
        "compliant": len(violations) == 0,
    }


def _print_report(report: dict[str, Any]) -> None:
    print("=== CVF Cross-Family Approval Artifact External Issuer Verification Gate ===")
    print(f"Manifest: {report['manifestPath']}")
    print(f"Packet: {report['packetPath']}")
    print(f"Runtime families: {report.get('runtimeFamilyCount', 0)}")
    print(f"Violations: {report['violationCount']}")
    if report["violations"]:
        print("\nViolations:")
        for violation in report["violations"]:
            print(f"  - {violation['path']} ({violation['type']}): {violation['message']}")
        print("\nFAIL - Packet approval artifact external issuer verification does not match posture policy.")
    else:
        print("\nCOMPLIANT - Packet approval artifact external issuer verification matches the current posture.")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="CVF cross-family approval artifact external issuer verification gate")
    parser.add_argument("--manifest", default=str(DEFAULT_MANIFEST), help="Manifest JSON path")
    parser.add_argument("--packet", default=str(DEFAULT_PACKET), help="Packet path")
    parser.add_argument("--enforce", action="store_true", help="Return non-zero when violations exist")
    parser.add_argument("--json", action="store_true", help="Print JSON report")
    args = parser.parse_args()

    manifest_path = (REPO_ROOT / args.manifest).resolve() if not Path(args.manifest).is_absolute() else Path(args.manifest)
    packet_path = (REPO_ROOT / args.packet).resolve() if not Path(args.packet).is_absolute() else Path(args.packet)
    report = build_report(manifest_path, packet_path)
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        _print_report(report)

    if args.enforce and not report["compliant"]:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
