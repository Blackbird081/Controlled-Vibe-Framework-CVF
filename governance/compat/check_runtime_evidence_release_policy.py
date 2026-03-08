#!/usr/bin/env python3
"""
Validate release-policy semantics across the runtime evidence manifest and linked packet.
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

ALLOWED_LOCAL_READY_LINES = {"local-ready", "active", "stable"}
DISALLOWED_LOCAL_READY_LINES = {"draft", "legacy-reference"}
ALLOWED_PRODUCTION_REVIEW_LINES = {"local-ready", "active", "stable"}
DISALLOWED_PRODUCTION_REVIEW_LINES = {"draft", "legacy-reference"}
ALLOWED_INTERNAL_AUDIT_LINES = {"local-ready", "active", "stable"}
DISALLOWED_INTERNAL_AUDIT_LINES = {"draft", "legacy-reference"}
ALLOWED_ENTERPRISE_ONBOARDING_LINES = {"local-ready", "active", "stable"}
DISALLOWED_ENTERPRISE_ONBOARDING_LINES = {"draft", "legacy-reference"}


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _read_json(path: Path) -> dict[str, Any]:
    return json.loads(_read(path))


def _rel(path: Path) -> str:
    return str(path.relative_to(REPO_ROOT)).replace("\\", "/")


def _extract_packet_field(label: str, packet_text: str) -> str:
    match = re.search(rf"- {re.escape(label)}:\s*(.+)", packet_text)
    return match.group(1).strip() if match else ""


def build_report(manifest_path: Path, packet_path: Path) -> dict[str, Any]:
    violations: list[dict[str, str]] = []
    if not manifest_path.exists():
        violations.append(
            {
                "type": "manifest_missing",
                "path": _rel(manifest_path),
                "message": "Runtime evidence manifest is missing.",
            }
        )
    if not packet_path.exists():
        violations.append(
            {
                "type": "packet_missing",
                "path": _rel(packet_path),
                "message": "Release packet is missing.",
            }
        )
    if violations:
        return {
            "manifestPath": _rel(manifest_path),
            "packetPath": _rel(packet_path),
            "violationCount": len(violations),
            "violations": violations,
            "compliant": False,
        }

    manifest = _read_json(manifest_path)
    packet_text = _read(packet_path)

    target_release_line = _extract_packet_field("target release line", packet_text)
    packet_type = _extract_packet_field("packet type", packet_text)
    local_only_constraints = _extract_packet_field("local-only constraints", packet_text)
    decision = _extract_packet_field("decision", packet_text)
    known_open_risks = _extract_packet_field("known open risks", packet_text)
    runtime_manifest_ref = _extract_packet_field("runtime evidence manifest", packet_text)

    entries = manifest.get("entries", [])
    release_lines = {entry.get("releaseLine", "") for entry in entries}
    maturity_bands = {entry.get("maturity", "") for entry in entries}

    if target_release_line == "local-ready":
        if packet_type != "local release approval snapshot":
            violations.append(
                {
                    "type": "packet_type_mismatch",
                    "path": _rel(packet_path),
                    "message": "A local-ready packet must use `local release approval snapshot` packet type.",
                }
            )

        if not local_only_constraints or "local-ready" not in local_only_constraints:
            violations.append(
                {
                    "type": "local_constraints_missing",
                    "path": _rel(packet_path),
                    "message": "A local-ready packet must explicitly record local-only constraints.",
                }
            )

        if decision != "conditional local GO":
            violations.append(
                {
                    "type": "decision_mismatch",
                    "path": _rel(packet_path),
                    "message": "A local-ready packet must remain at `conditional local GO`.",
                }
            )

        if not known_open_risks:
            violations.append(
                {
                    "type": "known_risks_missing",
                    "path": _rel(packet_path),
                    "message": "A local-ready packet must carry known open risks.",
                }
            )

        disallowed = sorted(line for line in release_lines if line in DISALLOWED_LOCAL_READY_LINES)
        if disallowed:
            violations.append(
                {
                    "type": "disallowed_release_line",
                    "path": _rel(manifest_path),
                    "message": f"Local-ready packet cannot aggregate runtime families on disallowed release lines: {', '.join(disallowed)}.",
                }
            )

        unexpected = sorted(line for line in release_lines if line and line not in ALLOWED_LOCAL_READY_LINES)
        if unexpected:
            violations.append(
                {
                    "type": "unexpected_release_line",
                    "path": _rel(manifest_path),
                    "message": f"Runtime evidence manifest contains unsupported release lines for local-ready posture: {', '.join(unexpected)}.",
                }
            )

    if packet_type == "production-candidate review snapshot":
        if target_release_line not in {"active", "stable"}:
            violations.append(
                {
                    "type": "target_release_line_unexpected",
                    "path": _rel(packet_path),
                    "message": "A production-candidate review packet must anchor to an active or stable release line.",
                }
            )
        if not local_only_constraints or ("review" not in local_only_constraints and "not yet approved" not in local_only_constraints):
            violations.append(
                {
                    "type": "review_constraints_missing",
                    "path": _rel(packet_path),
                    "message": "A production-candidate review packet must explicitly record review-only or not-yet-approved constraints.",
                }
            )

        if decision != "review pending":
            violations.append(
                {
                    "type": "decision_mismatch",
                    "path": _rel(packet_path),
                    "message": "A production-candidate review packet must remain at `review pending`.",
                }
            )

        if not known_open_risks:
            violations.append(
                {
                    "type": "known_risks_missing",
                    "path": _rel(packet_path),
                    "message": "A production-candidate review packet must carry known open risks.",
                }
            )

        disallowed = sorted(line for line in release_lines if line in DISALLOWED_PRODUCTION_REVIEW_LINES)
        if disallowed:
            violations.append(
                {
                    "type": "disallowed_release_line",
                    "path": _rel(manifest_path),
                    "message": f"Production-candidate review packet cannot aggregate runtime families on disallowed release lines: {', '.join(disallowed)}.",
                }
            )

        unexpected = sorted(line for line in release_lines if line and line not in ALLOWED_PRODUCTION_REVIEW_LINES)
        if unexpected:
            violations.append(
                {
                    "type": "unexpected_release_line",
                    "path": _rel(manifest_path),
                    "message": f"Runtime evidence manifest contains unsupported release lines for production-candidate review posture: {', '.join(unexpected)}.",
                }
            )

        if "production-candidate" not in maturity_bands:
            violations.append(
                {
                    "type": "production_candidate_missing",
                    "path": _rel(manifest_path),
                    "message": "A production-candidate review packet must aggregate at least one production-candidate runtime family.",
                }
            )

    if packet_type == "internal audit evidence snapshot":
        if target_release_line not in {"active", "stable"}:
            violations.append(
                {
                    "type": "target_release_line_unexpected",
                    "path": _rel(packet_path),
                    "message": "An internal audit packet must anchor to an active or stable release line.",
                }
            )

        if not local_only_constraints or ("audit-only" not in local_only_constraints and "not a release approval artifact" not in local_only_constraints):
            violations.append(
                {
                    "type": "audit_constraints_missing",
                    "path": _rel(packet_path),
                    "message": "An internal audit packet must explicitly record audit-only / non-approval constraints.",
                }
            )

        if decision != "audit ready":
            violations.append(
                {
                    "type": "decision_mismatch",
                    "path": _rel(packet_path),
                    "message": "An internal audit packet must remain at `audit ready`.",
                }
            )

        if not known_open_risks:
            violations.append(
                {
                    "type": "known_risks_missing",
                    "path": _rel(packet_path),
                    "message": "An internal audit packet must carry known open risks.",
                }
            )

        disallowed = sorted(line for line in release_lines if line in DISALLOWED_INTERNAL_AUDIT_LINES)
        if disallowed:
            violations.append(
                {
                    "type": "disallowed_release_line",
                    "path": _rel(manifest_path),
                    "message": f"Internal audit packet cannot aggregate runtime families on disallowed release lines: {', '.join(disallowed)}.",
                }
            )

        unexpected = sorted(line for line in release_lines if line and line not in ALLOWED_INTERNAL_AUDIT_LINES)
        if unexpected:
            violations.append(
                {
                    "type": "unexpected_release_line",
                    "path": _rel(manifest_path),
                    "message": f"Runtime evidence manifest contains unsupported release lines for internal audit posture: {', '.join(unexpected)}.",
                }
            )

        if "production-candidate" not in maturity_bands:
            violations.append(
                {
                    "type": "production_candidate_missing",
                    "path": _rel(manifest_path),
                    "message": "An internal audit packet must aggregate at least one production-candidate runtime family.",
                }
            )

    if packet_type == "enterprise onboarding snapshot":
        if target_release_line not in {"active", "stable"}:
            violations.append(
                {
                    "type": "target_release_line_unexpected",
                    "path": _rel(packet_path),
                    "message": "An enterprise onboarding packet must anchor to an active or stable release line.",
                }
            )

        if not local_only_constraints or ("onboarding-only" not in local_only_constraints and "not an approval artifact" not in local_only_constraints):
            violations.append(
                {
                    "type": "onboarding_constraints_missing",
                    "path": _rel(packet_path),
                    "message": "An enterprise onboarding packet must explicitly record onboarding-only / non-approval constraints.",
                }
            )

        if decision != "onboarding ready":
            violations.append(
                {
                    "type": "decision_mismatch",
                    "path": _rel(packet_path),
                    "message": "An enterprise onboarding packet must remain at `onboarding ready`.",
                }
            )

        if not known_open_risks:
            violations.append(
                {
                    "type": "known_risks_missing",
                    "path": _rel(packet_path),
                    "message": "An enterprise onboarding packet must carry known open risks.",
                }
            )

        disallowed = sorted(line for line in release_lines if line in DISALLOWED_ENTERPRISE_ONBOARDING_LINES)
        if disallowed:
            violations.append(
                {
                    "type": "disallowed_release_line",
                    "path": _rel(manifest_path),
                    "message": f"Enterprise onboarding packet cannot aggregate runtime families on disallowed release lines: {', '.join(disallowed)}.",
                }
            )

        unexpected = sorted(line for line in release_lines if line and line not in ALLOWED_ENTERPRISE_ONBOARDING_LINES)
        if unexpected:
            violations.append(
                {
                    "type": "unexpected_release_line",
                    "path": _rel(manifest_path),
                    "message": f"Runtime evidence manifest contains unsupported release lines for enterprise onboarding posture: {', '.join(unexpected)}.",
                }
            )

        if "production-candidate" not in maturity_bands:
            violations.append(
                {
                    "type": "production_candidate_missing",
                    "path": _rel(manifest_path),
                    "message": "An enterprise onboarding packet must aggregate at least one production-candidate runtime family.",
                }
            )

    if "production-candidate" in maturity_bands and "implemented-local" not in maturity_bands:
        violations.append(
            {
                "type": "maturity_mix_unexpected",
                "path": _rel(manifest_path),
                "message": "Current hardening manifest is expected to include at least one implemented-local family alongside any production-candidate family.",
            }
        )

    if runtime_manifest_ref != _rel(manifest_path):
        violations.append(
            {
                "type": "packet_runtime_manifest_reference_mismatch",
                "path": _rel(packet_path),
                "message": "Release packet runtime evidence manifest field does not point to the canonical manifest.",
            }
        )

    return {
        "manifestPath": _rel(manifest_path),
        "packetPath": _rel(packet_path),
        "targetReleaseLine": target_release_line,
        "runtimeFamilyCount": len(entries),
        "releaseLinesCovered": sorted(release_lines),
        "maturityBandsCovered": sorted(maturity_bands),
        "violationCount": len(violations),
        "violations": violations,
        "compliant": len(violations) == 0,
    }


def _print_report(report: dict[str, Any]) -> None:
    print("=== CVF Runtime Evidence Release Policy Gate ===")
    print(f"Manifest: {report['manifestPath']}")
    print(f"Packet: {report['packetPath']}")
    print(f"Target release line: {report.get('targetReleaseLine', 'UNKNOWN')}")
    print(f"Runtime families: {report.get('runtimeFamilyCount', 0)}")
    print(f"Violations: {report['violationCount']}")
    if report["violations"]:
        print("\nViolations:")
        for violation in report["violations"]:
            print(f"  - {violation['path']} ({violation['type']}): {violation['message']}")
        print("\nFAIL — Runtime evidence release policy is inconsistent.")
    else:
        print("\nCOMPLIANT — Runtime evidence release policy matches the packet posture and manifest metadata.")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="CVF runtime evidence release-policy gate")
    parser.add_argument("--manifest", default=str(DEFAULT_MANIFEST), help="Manifest JSON path")
    parser.add_argument("--packet", default=str(DEFAULT_PACKET), help="Release packet path")
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
