#!/usr/bin/env python3
"""
Validate deferred-family stratification and mixed-maturity posture in a packet.
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


def _expected_mixed_posture(packet_type: str) -> str:
    if packet_type == "production-candidate review snapshot":
        return "production-candidate families are in active review scope, while implemented-local and hardening-active families remain explicitly deferred"
    if packet_type == "internal audit evidence snapshot":
        return "all runtime families are visible for audit, while implemented-local and hardening-active families remain non-promotable within audit posture"
    if packet_type == "enterprise onboarding snapshot":
        return "all runtime families are visible for onboarding, while implemented-local and hardening-active families remain out of approval scope"
    return "production-candidate families remain reviewable, while implemented-local and hardening-active families remain deferred inside this local-only packet"


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
    entries = manifest.get("entries", [])

    packet_type = _extract_field("packet type", packet_text)
    expected_deferred = sorted(
        entry["runtimeFamily"]
        for entry in entries
        if entry["releaseLine"] == "local-ready" or entry["maturity"] == "hardening-active"
    )
    expected_deferred_release = sorted(entry["runtimeFamily"] for entry in entries if entry["releaseLine"] == "local-ready")
    expected_heightened = sorted(entry["runtimeFamily"] for entry in entries if entry["maturity"] == "hardening-active")
    expected_promotion = sorted(
        entry["runtimeFamily"]
        for entry in entries
        if entry["maturity"] == "production-candidate" and entry["releaseLine"] in {"active", "stable"}
    )

    deferred_count = _extract_field("deferred family count", packet_text)
    deferred_release = _extract_field("deferred release-line families", packet_text)
    heightened_review = _extract_field("heightened-review maturity families", packet_text)
    promotion_eligible = _extract_field("promotion-eligible families", packet_text)
    mixed_maturity_posture = _extract_field("mixed maturity posture", packet_text)
    deferred_family_note = _extract_field("deferred family note", packet_text)

    def _split(value: str) -> list[str]:
        return [] if value == "none" else sorted(item.strip() for item in value.split(","))

    if deferred_count != str(len(expected_deferred)):
        violations.append({"type": "deferred_count_mismatch", "path": _rel(packet_path), "message": "Packet deferred family count does not match manifest."})
    if _split(deferred_release) != expected_deferred_release:
        violations.append({"type": "deferred_release_line_mismatch", "path": _rel(packet_path), "message": "Packet deferred release-line families do not match manifest."})
    if _split(heightened_review) != expected_heightened:
        violations.append({"type": "heightened_review_mismatch", "path": _rel(packet_path), "message": "Packet heightened-review maturity families do not match manifest."})
    if _split(promotion_eligible) != expected_promotion:
        violations.append({"type": "promotion_eligible_mismatch", "path": _rel(packet_path), "message": "Packet promotion-eligible families do not match manifest."})
    if _split(deferred_family_note) != expected_deferred:
        violations.append({"type": "deferred_family_note_mismatch", "path": _rel(packet_path), "message": "Packet deferred family note does not match manifest."})
    if mixed_maturity_posture != _expected_mixed_posture(packet_type):
        violations.append({"type": "mixed_maturity_posture_mismatch", "path": _rel(packet_path), "message": "Packet mixed-maturity posture does not match expected posture for this packet type."})

    return {
        "manifestPath": _rel(manifest_path),
        "packetPath": _rel(packet_path),
        "runtimeFamilyCount": len(entries),
        "violationCount": len(violations),
        "violations": violations,
        "compliant": len(violations) == 0,
    }


def _print_report(report: dict[str, Any]) -> None:
    print("=== CVF Cross-Family Deferred Policy Gate ===")
    print(f"Manifest: {report['manifestPath']}")
    print(f"Packet: {report['packetPath']}")
    print(f"Runtime families: {report.get('runtimeFamilyCount', 0)}")
    print(f"Violations: {report['violationCount']}")
    if report["violations"]:
        print("\nViolations:")
        for violation in report["violations"]:
            print(f"  - {violation['path']} ({violation['type']}): {violation['message']}")
        print("\nFAIL - Packet deferred-family policy does not match the manifest-derived stratification.")
    else:
        print("\nCOMPLIANT - Packet deferred-family stratification matches the multi-runtime manifest.")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="CVF cross-family deferred policy gate")
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
