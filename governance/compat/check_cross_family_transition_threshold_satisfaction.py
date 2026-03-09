#!/usr/bin/env python3
"""
Validate packet-specific transition threshold satisfaction against the multi-runtime manifest.
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


def _build_expectations(packet_type: str, decision: str, entries: list[dict[str, Any]]) -> dict[str, str]:
    prerequisite_families = sorted(
        entry["runtimeFamily"]
        for entry in entries
        if entry["maturity"] == "production-candidate" and entry["releaseLine"] in {"active", "stable"}
    )
    decision_lower = decision.strip().lower()

    if packet_type == "internal audit evidence snapshot":
        return {
            "satisfied": "none",
            "pending": "none",
            "note": "internal audit posture does not evaluate threshold satisfaction because no runtime family may enter promotion transition inside audit evidence review",
        }
    if packet_type == "enterprise onboarding snapshot":
        return {
            "satisfied": "none",
            "pending": "none",
            "note": "enterprise onboarding posture does not evaluate threshold satisfaction because no runtime family may enter promotion transition inside onboarding evidence review",
        }

    approved = any(
        phrase in decision_lower
        for phrase in ("release approved", "publication approved", "promotion approved")
    )

    if approved:
        note = "production-candidate review posture has recorded an approval-strength decision, so transition-prerequisite families are treated as threshold-satisfied in this packet"
        if packet_type == "local release approval snapshot":
            note = "local-ready posture has recorded an approval-strength decision, so transition-prerequisite families are treated as threshold-satisfied in this packet"
        return {
            "satisfied": ", ".join(prerequisite_families) if prerequisite_families else "none",
            "pending": "none",
            "note": note,
        }

    note = "production-candidate review posture keeps threshold satisfaction pending until explicit release approval and regenerated evidence are both recorded"
    if packet_type == "local release approval snapshot":
        note = "local-ready posture keeps threshold satisfaction pending until explicit publication or release approval and regenerated evidence are both recorded"
    return {
        "satisfied": "none",
        "pending": ", ".join(prerequisite_families) if prerequisite_families else "none",
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
    entries = manifest.get("entries", [])
    packet_type = _extract_field("packet type", packet_text)
    decision = _extract_field("decision", packet_text)
    expected = _build_expectations(packet_type, decision, entries)

    satisfied = _extract_field("transition-threshold-satisfied families", packet_text)
    pending = _extract_field("transition-threshold-pending families", packet_text)
    note = _extract_field("transition threshold note", packet_text)

    if _split(satisfied) != _split(expected["satisfied"]):
        violations.append({"type": "transition_threshold_satisfied_mismatch", "path": _rel(packet_path), "message": "Packet transition-threshold-satisfied family set does not match posture policy."})
    if _split(pending) != _split(expected["pending"]):
        violations.append({"type": "transition_threshold_pending_mismatch", "path": _rel(packet_path), "message": "Packet transition-threshold-pending family set does not match posture policy."})
    if note != expected["note"]:
        violations.append({"type": "transition_threshold_note_mismatch", "path": _rel(packet_path), "message": "Packet transition threshold note does not match posture policy."})

    return {
        "manifestPath": _rel(manifest_path),
        "packetPath": _rel(packet_path),
        "runtimeFamilyCount": len(entries),
        "violationCount": len(violations),
        "violations": violations,
        "compliant": len(violations) == 0,
    }


def _print_report(report: dict[str, Any]) -> None:
    print("=== CVF Cross-Family Transition Threshold Satisfaction Gate ===")
    print(f"Manifest: {report['manifestPath']}")
    print(f"Packet: {report['packetPath']}")
    print(f"Runtime families: {report.get('runtimeFamilyCount', 0)}")
    print(f"Violations: {report['violationCount']}")
    if report["violations"]:
        print("\nViolations:")
        for violation in report["violations"]:
            print(f"  - {violation['path']} ({violation['type']}): {violation['message']}")
        print("\nFAIL - Packet transition threshold satisfaction does not match manifest-derived posture.")
    else:
        print("\nCOMPLIANT - Packet transition threshold satisfaction matches the multi-runtime manifest.")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="CVF cross-family transition threshold satisfaction gate")
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
