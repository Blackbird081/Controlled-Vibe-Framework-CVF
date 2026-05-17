#!/usr/bin/env python3
"""
Validate the CVF multi-runtime remediation evidence manifest against canonical artifacts.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_MANIFEST = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_W4_MULTI_RUNTIME_EVIDENCE_MANIFEST_2026-03-07.json"
DEFAULT_MANIFEST_LOG = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_W4_MULTI_RUNTIME_EVIDENCE_LOG_2026-03-07.md"
DEFAULT_PACKET = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_RELEASE_APPROVAL_PACKET_LOCAL_BASELINE_2026-03-07.md"
RELEASE_MANIFEST = REPO_ROOT / "docs" / "reference" / "CVF_RELEASE_MANIFEST.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _read_json(path: Path) -> dict[str, Any]:
    return json.loads(_read(path))


def _rel(path: Path) -> str:
    return str(path.relative_to(REPO_ROOT)).replace("\\", "/")


def _load_release_rows() -> dict[str, dict[str, str]]:
    rows: dict[str, dict[str, str]] = {}
    for line in _read(RELEASE_MANIFEST).splitlines():
        if not line.startswith("| v"):
            continue
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if len(cells) < 6:
            continue
        version, module_name, release_line, maturity, evidence_anchor = cells[:5]
        rows[version] = {
            "moduleName": module_name,
            "releaseLine": release_line,
            "maturity": maturity,
            "evidenceAnchor": evidence_anchor,
        }
    return rows


def build_report(manifest_path: Path, packet_path: Path, allow_secondary_packet: bool = False) -> dict[str, Any]:
    violations: list[dict[str, str]] = []
    if not manifest_path.exists():
        violations.append(
            {
                "type": "manifest_missing",
                "path": _rel(manifest_path),
                "message": "Runtime evidence manifest is missing.",
            }
        )
        return {
            "manifestPath": _rel(manifest_path),
            "packetPath": _rel(packet_path),
            "violationCount": len(violations),
            "violations": violations,
            "compliant": False,
        }

    manifest = _read_json(manifest_path)
    manifest_log_rel = manifest.get("manifestLogPath", "")
    manifest_log_path = (REPO_ROOT / manifest_log_rel).resolve() if manifest_log_rel else None
    if not manifest_log_path:
        violations.append(
            {
                "type": "manifest_log_anchor_missing",
                "path": _rel(manifest_path),
                "message": "Manifest does not declare manifestLogPath.",
            }
        )
    elif not manifest_log_path.exists():
        violations.append(
            {
                "type": "manifest_log_missing",
                "path": _rel(manifest_log_path),
                "message": "Runtime evidence markdown log is missing.",
            }
        )
    if not packet_path.exists():
        violations.append(
            {
                "type": "packet_missing",
                "path": _rel(packet_path),
                "message": "Linked release packet is missing.",
            }
        )

    entries = manifest.get("entries", [])
    if manifest.get("runtimeFamilyCount") != len(entries):
        violations.append(
            {
                "type": "runtime_family_count_mismatch",
                "path": _rel(manifest_path),
                "message": "runtimeFamilyCount does not match the number of manifest entries.",
            }
        )

    release_rows = _load_release_rows()
    receipt_total = 0
    for entry in entries:
        version_token = entry.get("versionToken", "")
        runtime_family = entry.get("runtimeFamily", "")
        artifact_path = REPO_ROOT / entry.get("artifactPath", "")
        log_path = REPO_ROOT / entry.get("logPath", "")
        release_row = release_rows.get(version_token)

        if not release_row:
            violations.append(
                {
                    "type": "unknown_version_token",
                    "path": _rel(manifest_path),
                    "message": f"Manifest entry `{runtime_family}` references unknown version token `{version_token}`.",
                }
            )
            continue

        if not artifact_path.exists():
            violations.append(
                {
                    "type": "artifact_missing",
                    "path": entry.get("artifactPath", ""),
                    "message": f"Artifact for `{runtime_family}` is missing.",
                }
            )
            continue

        if not log_path.exists():
            violations.append(
                {
                    "type": "log_missing",
                    "path": entry.get("logPath", ""),
                    "message": f"Markdown log for `{runtime_family}` is missing.",
                }
            )

        artifact = _read_json(artifact_path)
        actual_count = artifact.get("receiptCount", len(artifact.get("receipts", [])))
        receipt_total += actual_count

        if entry.get("receiptCount") != actual_count:
            violations.append(
                {
                    "type": "receipt_count_mismatch",
                    "path": entry.get("artifactPath", ""),
                    "message": f"Manifest receiptCount for `{runtime_family}` does not match the artifact payload.",
                }
            )

        for key in ["moduleName", "releaseLine", "maturity", "evidenceAnchor"]:
            if entry.get(key) != release_row[key]:
                violations.append(
                    {
                        "type": "release_metadata_mismatch",
                        "path": _rel(manifest_path),
                        "message": f"Manifest entry `{runtime_family}` has `{key}` drift against CVF_RELEASE_MANIFEST.md.",
                    }
                )

    if manifest.get("totalReceiptCount") != receipt_total:
        violations.append(
            {
                "type": "total_receipt_count_mismatch",
                "path": _rel(manifest_path),
                "message": "totalReceiptCount does not equal the sum of entry receipt counts.",
            }
        )

    if manifest.get("releaseManifestPath") != _rel(RELEASE_MANIFEST):
        violations.append(
            {
                "type": "release_manifest_anchor_mismatch",
                "path": _rel(manifest_path),
                "message": "releaseManifestPath does not point to the canonical release manifest.",
            }
        )

    linked_packet_path = manifest.get("linkedPacketPath")
    if linked_packet_path != _rel(packet_path) and not allow_secondary_packet:
        violations.append(
            {
                "type": "linked_packet_mismatch",
                "path": _rel(manifest_path),
                "message": "linkedPacketPath does not point to the expected packet.",
            }
        )

    if packet_path.exists():
        packet_text = _read(packet_path)
        if _rel(manifest_path) not in packet_text:
            violations.append(
                {
                    "type": "packet_manifest_reference_missing",
                    "path": _rel(packet_path),
                    "message": "Release packet does not reference the runtime evidence manifest.",
                }
            )
        if allow_secondary_packet and linked_packet_path and linked_packet_path == _rel(packet_path):
            violations.append(
                {
                    "type": "secondary_packet_same_as_primary",
                    "path": _rel(packet_path),
                    "message": "Secondary-packet mode expects a packet distinct from the manifest's linked primary packet.",
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
    print("=== CVF Runtime Evidence Manifest Gate ===")
    print(f"Manifest: {report['manifestPath']}")
    print(f"Packet: {report['packetPath']}")
    print(f"Runtime families: {report.get('runtimeFamilyCount', 0)}")
    print(f"Violations: {report['violationCount']}")
    if report["violations"]:
        print("\nViolations:")
        for violation in report["violations"]:
            print(f"  - {violation['path']} ({violation['type']}): {violation['message']}")
        print("\nFAIL — Runtime evidence manifest is incomplete or inconsistent.")
    else:
        print("\nCOMPLIANT — Runtime evidence manifest, release metadata, and packet linkage are aligned.")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="CVF runtime evidence manifest consistency gate")
    parser.add_argument("--manifest", default=str(DEFAULT_MANIFEST), help="Manifest JSON path")
    parser.add_argument("--packet", default=str(DEFAULT_PACKET), help="Release packet path")
    parser.add_argument("--allow-secondary-packet", action="store_true", help="Allow validating an additional packet that references the canonical manifest without being the manifest's primary linked packet")
    parser.add_argument("--enforce", action="store_true", help="Return non-zero when violations exist")
    parser.add_argument("--json", action="store_true", help="Print JSON report")
    args = parser.parse_args()

    manifest_path = (REPO_ROOT / args.manifest).resolve() if not Path(args.manifest).is_absolute() else Path(args.manifest)
    packet_path = (REPO_ROOT / args.packet).resolve() if not Path(args.packet).is_absolute() else Path(args.packet)
    report = build_report(manifest_path, packet_path, allow_secondary_packet=args.allow_secondary_packet)

    if args.json:
        print(json.dumps(report, indent=2))
    else:
        _print_report(report)

    if args.enforce and not report["compliant"]:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
