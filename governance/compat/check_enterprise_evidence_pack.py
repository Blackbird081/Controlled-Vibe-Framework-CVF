#!/usr/bin/env python3
"""
CVF Enterprise Evidence Pack Consistency Gate

Validates that the canonical Phase 6 evidence pack artifacts exist and that
an optional packet file contains the minimum required sections/fields.

Usage:
  python governance/compat/check_enterprise_evidence_pack.py
  python governance/compat/check_enterprise_evidence_pack.py --packet docs/reviews/cvf_phase_governance/CVF_RELEASE_APPROVAL_PACKET_LOCAL_BASELINE_2026-03-07.md
  python governance/compat/check_enterprise_evidence_pack.py --enforce
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
PACK_PATH = REPO_ROOT / "docs" / "reference" / "CVF_ENTERPRISE_EVIDENCE_PACK.md"
MAP_PATH = REPO_ROOT / "docs" / "reference" / "CVF_CONTROL_TO_ARTIFACT_MAPPING.md"
TEMPLATE_PATH = REPO_ROOT / "docs" / "reference" / "CVF_RELEASE_APPROVAL_PACKET_TEMPLATE.md"
MANIFEST_PATH = REPO_ROOT / "docs" / "reference" / "CVF_RELEASE_MANIFEST.md"
TRACE_PATH = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "archive" / "CVF_UPGRADE_TRACE_2026-03-07.md"
TEST_LOG_PATH = REPO_ROOT / "docs" / "CVF_INCREMENTAL_TEST_LOG.md"
ADR_PATH = REPO_ROOT / "docs" / "CVF_ARCHITECTURE_DECISIONS.md"
RUNTIME_MANIFEST_PATH = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_W4_MULTI_RUNTIME_EVIDENCE_MANIFEST_2026-03-07.json"
RUNTIME_LOG_PATH = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_W4_MULTI_RUNTIME_EVIDENCE_LOG_2026-03-07.md"

REQUIRED_CANONICAL = [
    PACK_PATH,
    MAP_PATH,
    TEMPLATE_PATH,
    MANIFEST_PATH,
    TRACE_PATH,
    TEST_LOG_PATH,
    ADR_PATH,
    RUNTIME_MANIFEST_PATH,
    RUNTIME_LOG_PATH,
]

# These four artifacts are private provenance evidence, not public pack owners.
# Applicability is explicit and never inferred from filesystem absence.
PRIVATE_EVIDENCE_CANONICAL = frozenset({
    TRACE_PATH, TEST_LOG_PATH, RUNTIME_MANIFEST_PATH, RUNTIME_LOG_PATH,
})

REQUIRED_TEMPLATE_MARKERS = [
    "## Packet Header",
    "## 1. Release Scope",
    "## 2. Baseline and Decision References",
    "## 3. Governance Controls",
    "## 4. Verification Evidence",
    "## 5. Release State",
    "## 6. Traceability",
    "## 7. Exceptions / Overrides / Incidents",
    "## 8. Approval",
]

REQUIRED_PACKET_FIELDS = [
    "- packet type:",
    "- date:",
    "- owner:",
    "- requestId:",
    "- traceBatch:",
    "- traceHash:",
    "- target release line:",
    "- target module / version:",
    "- baseline reference:",
    "- runtime evidence manifest:",
    "- decision:",
]


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _normalize(path: Path) -> str:
    return str(path.relative_to(REPO_ROOT)).replace("\\", "/")


def _check_required_files(required_paths: list[Path] | None = None) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    for path in REQUIRED_CANONICAL if required_paths is None else required_paths:
        if not path.exists():
            violations.append(
                {
                    "type": "required_file_missing",
                    "path": _normalize(path),
                    "message": "Required enterprise evidence artifact is missing.",
                }
            )
    return violations


def _check_template() -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    if not TEMPLATE_PATH.exists():
        return violations
    content = _read(TEMPLATE_PATH)
    for marker in REQUIRED_TEMPLATE_MARKERS:
        if marker not in content:
            violations.append(
                {
                    "type": "template_marker_missing",
                    "path": _normalize(TEMPLATE_PATH),
                    "message": f"Missing required template marker `{marker}`.",
                }
            )
    return violations


def _check_packet(packet_path: Path) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    if not packet_path.exists():
        violations.append(
            {
                "type": "packet_missing",
                "path": str(packet_path).replace("\\", "/"),
                "message": "Requested packet file does not exist.",
            }
        )
        return violations

    content = _read(packet_path)
    for field in REQUIRED_PACKET_FIELDS:
        if field not in content:
            violations.append(
                {
                    "type": "packet_field_missing",
                    "path": _normalize(packet_path),
                    "message": f"Missing required packet field `{field}`.",
                }
            )
    return violations


def build_report(packet: str | None, profile: str = "private") -> dict[str, Any]:
    if profile not in ("private", "public"):
        raise ValueError("Unsupported enterprise evidence profile")
    # Select a fresh list per invocation; a public call cannot narrow a later private call.
    required_paths = [
        path for path in REQUIRED_CANONICAL
        if profile == "private" or path not in PRIVATE_EVIDENCE_CANONICAL
    ]
    violations: list[dict[str, str]] = []
    if profile == "public":
        try:
            from guard_binding_catalog import require_public_projection
        except ModuleNotFoundError:
            from governance.compat.guard_binding_catalog import require_public_projection
        try:
            require_public_projection(REPO_ROOT)
        except ValueError as exc:
            violations.append({"type": "public_profile_mismatch", "path": "AGENTS.md", "message": str(exc)})
        if packet is not None:
            violations.append({
                "type": "public_packet_unsupported", "path": "--packet",
                "message": "Public profile checks normative pack artifacts only; private approval packets are unsupported.",
            })
    violations.extend(_check_required_files(required_paths))
    violations.extend(_check_template())

    packet_rel = None
    if packet and profile == "private":
        packet_path = (REPO_ROOT / packet).resolve() if not Path(packet).is_absolute() else Path(packet)
        packet_rel = _normalize(packet_path) if packet_path.exists() and packet_path.is_relative_to(REPO_ROOT) else str(packet_path)
        violations.extend(_check_packet(packet_path))

    report = {
        "canonicalFilesChecked": [_normalize(path) for path in required_paths],
        "packetChecked": packet_rel,
        "violationCount": len(violations),
        "violations": violations,
        "compliant": len(violations) == 0,
    }
    if profile == "public":
        report.update({
            "profile": "public",
            "privateEvidencePresenceNotApplicable": sorted(_normalize(path) for path in PRIVATE_EVIDENCE_CANONICAL),
            "claimBoundary": "PUBLIC_NORMATIVE_PACK_CONSISTENCY_ONLY_NOT_PACKET_OR_RELEASE_READINESS",
        })
    return report


def _print_report(report: dict[str, Any]) -> None:
    print("=== CVF Enterprise Evidence Pack Gate ===")
    print(f"Canonical files checked: {len(report['canonicalFilesChecked'])}")
    print(f"Packet checked: {report['packetChecked'] or 'none'}")
    print(f"Violations: {report['violationCount']}")

    if report["violations"]:
        print("\nViolations:")
        for violation in report["violations"]:
            print(f"  - {violation['path']} ({violation['type']}): {violation['message']}")
        print("\n❌ VIOLATION — Enterprise evidence pack is incomplete or inconsistent.")
    else:
        if report.get("profile") == "public":
            print("\nCOMPLIANT - Public normative pack checks passed; private packet/release readiness is not assessed.")
        else:
            print("\n✅ COMPLIANT — Enterprise evidence pack artifacts are present and aligned.")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="CVF enterprise evidence pack consistency gate")
    parser.add_argument("--profile", choices=("private", "public"), default="private")
    parser.add_argument("--packet", default=None, help="Optional packet file to validate against the template")
    parser.add_argument("--enforce", action="store_true", help="Return non-zero when violations exist")
    parser.add_argument("--json", action="store_true", help="Print JSON report")
    args = parser.parse_args()

    report = build_report(args.packet, args.profile)
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        _print_report(report)

    if args.profile == "public" and any(
        violation["type"] in ("public_profile_mismatch", "public_packet_unsupported")
        for violation in report["violations"]
    ):
        return 2
    if args.enforce and not report["compliant"]:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

# Text Encoding Exception: existing CLI report symbols are retained; profile controls use ASCII.
