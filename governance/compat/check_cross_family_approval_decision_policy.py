#!/usr/bin/env python3
"""
Validate packet-specific approval decision policy against the multi-runtime manifest.
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


def _split(value: str) -> list[str]:
    return [] if value == "none" else sorted(item.strip() for item in value.split(","))


def _build_expectations(packet_type: str, entries: list[dict[str, Any]]) -> dict[str, str]:
    all_families = sorted(entry["runtimeFamily"] for entry in entries)
    promotion_eligible = sorted(
        entry["runtimeFamily"]
        for entry in entries
        if entry["maturity"] == "production-candidate" and entry["releaseLine"] in {"active", "stable"}
    )
    blocked = sorted(family for family in all_families if family not in promotion_eligible)

    if packet_type == "internal audit evidence snapshot":
        return {
            "eligible": "none",
            "blocked": ", ".join(all_families) if all_families else "none",
            "note": "internal audit posture never initiates approval; all runtime families remain approval-blocked inside audit evidence review",
        }
    if packet_type == "enterprise onboarding snapshot":
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
    expected = _build_expectations(packet_type, entries)

    eligible = _extract_field("approval-eligible families", packet_text)
    blocked = _extract_field("approval-blocked families", packet_text)
    note = _extract_field("approval decision note", packet_text)

    if _split(eligible) != _split(expected["eligible"]):
        violations.append({"type": "approval_eligible_mismatch", "path": _rel(packet_path), "message": "Packet approval-eligible family set does not match posture policy."})
    if _split(blocked) != _split(expected["blocked"]):
        violations.append({"type": "approval_blocked_mismatch", "path": _rel(packet_path), "message": "Packet approval-blocked family set does not match posture policy."})
    if note != expected["note"]:
        violations.append({"type": "approval_decision_note_mismatch", "path": _rel(packet_path), "message": "Packet approval decision note does not match posture policy."})

    return {
        "manifestPath": _rel(manifest_path),
        "packetPath": _rel(packet_path),
        "runtimeFamilyCount": len(entries),
        "violationCount": len(violations),
        "violations": violations,
        "compliant": len(violations) == 0,
    }


def _print_report(report: dict[str, Any]) -> None:
    print("=== CVF Cross-Family Approval Decision Policy Gate ===")
    print(f"Manifest: {report['manifestPath']}")
    print(f"Packet: {report['packetPath']}")
    print(f"Runtime families: {report.get('runtimeFamilyCount', 0)}")
    print(f"Violations: {report['violationCount']}")
    if report["violations"]:
        print("\nViolations:")
        for violation in report["violations"]:
            print(f"  - {violation['path']} ({violation['type']}): {violation['message']}")
        print("\nFAIL - Packet approval decision policy does not match manifest-derived posture.")
    else:
        print("\nCOMPLIANT - Packet approval decision policy matches the multi-runtime manifest.")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="CVF cross-family approval decision policy gate")
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
