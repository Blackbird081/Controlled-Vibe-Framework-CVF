#!/usr/bin/env python3
"""
Validate that a release packet explicitly reflects the linked multi-runtime evidence manifest.
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

    expected_runtime_family_count = str(manifest.get("runtimeFamilyCount", len(entries)))
    expected_release_lines = ", ".join(f"{line}={len([e for e in entries if e['releaseLine'] == line])}" for line in sorted({e["releaseLine"] for e in entries}))
    expected_maturity_bands = ", ".join(f"{band}={len([e for e in entries if e['maturity'] == band])}" for band in sorted({e["maturity"] for e in entries}))

    packet_runtime_family_count = _extract_field("runtime family count", packet_text)
    packet_release_lines = _extract_field("release lines covered", packet_text)
    packet_maturity_bands = _extract_field("maturity bands covered", packet_text)
    mixed_policy_note = _extract_field("mixed-family policy note", packet_text)
    deferred_family_note = _extract_field("deferred family note", packet_text)

    if packet_runtime_family_count != expected_runtime_family_count:
        violations.append({"type": "runtime_family_count_mismatch", "path": _rel(packet_path), "message": "Packet runtime family count does not match manifest."})
    if packet_release_lines != expected_release_lines:
        violations.append({"type": "release_lines_mismatch", "path": _rel(packet_path), "message": "Packet release-line coverage summary does not match manifest."})
    if packet_maturity_bands != expected_maturity_bands:
        violations.append({"type": "maturity_bands_mismatch", "path": _rel(packet_path), "message": "Packet maturity-band coverage summary does not match manifest."})
    if "does not imply blanket promotion" not in mixed_policy_note:
        violations.append({"type": "mixed_policy_note_missing", "path": _rel(packet_path), "message": "Packet must explicitly state that mixed-family coverage does not imply blanket promotion."})

    expected_deferred = sorted(
        entry["runtimeFamily"]
        for entry in entries
        if entry["releaseLine"] == "local-ready" or entry["maturity"] == "hardening-active"
    )
    packet_deferred = [] if deferred_family_note == "none" else [item.strip() for item in deferred_family_note.split(",")]
    if sorted(packet_deferred) != expected_deferred:
        violations.append({"type": "deferred_family_note_mismatch", "path": _rel(packet_path), "message": "Packet deferred-family note does not match manifest-local deferred families."})

    for entry in entries:
        runtime_line = _extract_field(f"release line {entry['releaseLine']}", packet_text)
        if entry["runtimeFamily"] not in runtime_line:
            violations.append(
                {
                    "type": "release_line_family_missing",
                    "path": _rel(packet_path),
                    "message": f"Packet release-line coverage is missing runtime family {entry['runtimeFamily']}.",
                }
            )
        maturity_line = _extract_field(f"maturity band {entry['maturity']}", packet_text)
        if entry["runtimeFamily"] not in maturity_line:
            violations.append(
                {
                    "type": "maturity_band_family_missing",
                    "path": _rel(packet_path),
                    "message": f"Packet maturity-band coverage is missing runtime family {entry['runtimeFamily']}.",
                }
            )

    return {
        "manifestPath": _rel(manifest_path),
        "packetPath": _rel(packet_path),
        "runtimeFamilyCount": len(entries),
        "violationCount": len(violations),
        "violations": violations,
        "compliant": len(violations) == 0,
    }


def _print_report(report: dict[str, Any]) -> None:
    print("=== CVF Cross-Family Packet Coverage Gate ===")
    print(f"Manifest: {report['manifestPath']}")
    print(f"Packet: {report['packetPath']}")
    print(f"Runtime families: {report.get('runtimeFamilyCount', 0)}")
    print(f"Violations: {report['violationCount']}")
    if report["violations"]:
        print("\nViolations:")
        for violation in report["violations"]:
            print(f"  - {violation['path']} ({violation['type']}): {violation['message']}")
        print("\nFAIL - Packet does not fully reflect cross-family manifest coverage.")
    else:
        print("\nCOMPLIANT - Packet coverage summary matches the multi-runtime manifest.")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="CVF cross-family packet coverage gate")
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
