"""Manifest assembly and markdown rendering for runtime evidence export."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from runtime_evidence_manifest.common import RELEASE_MANIFEST, RELEASE_PACKET, read_json, rel
from runtime_evidence_manifest.fixtures import REQUEST_ID, RUNTIME_FAMILY_CONFIG, RUNTIME_FAMILY_ORDER, SCHEMA_VERSION, TRACE_BATCH


def load_release_manifest_rows() -> dict[str, dict[str, str]]:
    rows: dict[str, dict[str, str]] = {}
    for line in RELEASE_MANIFEST.read_text(encoding="utf-8").splitlines():
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


def build_entry(
    runtime_family: str,
    artifact_path: Path,
    log_path: Path,
    release_rows: dict[str, dict[str, str]],
) -> dict[str, Any]:
    artifact = read_json(artifact_path)
    version_token = RUNTIME_FAMILY_CONFIG[runtime_family]["versionToken"]
    release_row = release_rows[version_token]
    return {
        "runtimeFamily": runtime_family,
        "versionToken": version_token,
        "moduleName": release_row["moduleName"],
        "releaseLine": release_row["releaseLine"],
        "maturity": release_row["maturity"],
        "evidenceAnchor": release_row["evidenceAnchor"],
        "artifactPath": rel(artifact_path),
        "logPath": rel(log_path),
        "adapter": artifact.get("adapter", "UNKNOWN"),
        "receiptCount": artifact.get("receiptCount", len(artifact.get("receipts", []))),
        "schemaVersion": artifact.get("schemaVersion", "UNKNOWN"),
    }


def build_manifest(
    family_paths: dict[str, dict[str, Path]],
    manifest_log_path: Path,
) -> dict[str, Any]:
    release_rows = load_release_manifest_rows()
    entries = [
        build_entry(runtime_family, family_paths[runtime_family]["artifact"], family_paths[runtime_family]["log"], release_rows)
        for runtime_family in RUNTIME_FAMILY_ORDER
    ]
    return {
        "schemaVersion": SCHEMA_VERSION,
        "manifestType": "CVF_MULTI_RUNTIME_REMEDIATION_EVIDENCE",
        "requestId": REQUEST_ID,
        "traceBatch": TRACE_BATCH,
        "releaseManifestPath": rel(RELEASE_MANIFEST),
        "linkedPacketPath": rel(RELEASE_PACKET),
        "manifestLogPath": rel(manifest_log_path),
        "runtimeFamilyCount": len(entries),
        "totalReceiptCount": sum(entry["receiptCount"] for entry in entries),
        "releaseLinesCovered": sorted({entry["releaseLine"] for entry in entries}),
        "maturityBandsCovered": sorted({entry["maturity"] for entry in entries}),
        "entries": entries,
    }


def build_manifest_log(manifest: dict[str, Any], manifest_json_path: Path) -> str:
    lines = [
        "# CVF W4 Multi-Runtime Evidence Log - 2026-03-07",
        "",
        "## Header",
        "",
        f"- source manifest: `{rel(manifest_json_path)}`",
        f"- schemaVersion: `{manifest['schemaVersion']}`",
        f"- manifestType: `{manifest['manifestType']}`",
        f"- requestId: `{manifest['requestId']}`",
        f"- traceBatch: `{manifest['traceBatch']}`",
        f"- runtimeFamilyCount: `{manifest['runtimeFamilyCount']}`",
        f"- totalReceiptCount: `{manifest['totalReceiptCount']}`",
        f"- releaseManifestPath: `{manifest['releaseManifestPath']}`",
        f"- linkedPacketPath: `{manifest['linkedPacketPath']}`",
        f"- manifestLogPath: `{manifest['manifestLogPath']}`",
        "",
        "## Runtime Families",
        "",
        "| Runtime Family | Version | Release Line | Maturity | Adapter | Receipt Count | Artifact | Log |",
        "|---|---|---|---|---|---|---|---|",
    ]

    for entry in manifest["entries"]:
        lines.append(
            f"| `{entry['runtimeFamily']}` | `{entry['versionToken']}` | `{entry['releaseLine']}` | `{entry['maturity']}` | `{entry['adapter']}` | `{entry['receiptCount']}` | `{entry['artifactPath']}` | `{entry['logPath']}` |"
        )

    lines.extend(
        [
            "",
            "## Release Metadata",
            "",
            f"- releaseLinesCovered: `{', '.join(manifest['releaseLinesCovered'])}`",
            f"- maturityBandsCovered: `{', '.join(manifest['maturityBandsCovered'])}`",
            "",
            "## Notes",
            "",
            "- This manifest links the current release-evidence baseline across more than one runtime family.",
            "- The `CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL` artifact proves integrity verification, pipeline execution, and phase-audit evidence can join the same release-grade manifest chain.",
            "- The `CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE` artifact proves skill filtering, phase gating, and successor-migration evidence can join the same release-grade manifest chain.",
            "- The `CVF_v1.6.1_GOVERNANCE_ENGINE` artifact proves policy evaluation, enforcement routing, and approval-state evidence can join the same release-grade manifest chain.",
            "- The `CVF_v1.6_AGENT_PLATFORM` artifact proves governance snapshot and enforcement-route evidence can join the release-grade manifest chain.",
            "- The `CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY` artifact remains the primary orchestration-line remediation baseline.",
            "- The `CVF_v1.8_SAFETY_HARDENING` artifact proves rollback/recovery evidence can join the same release-facing manifest chain.",
            "- The `CVF_v1.7.3_RUNTIME_ADAPTER_HUB` artifact proves the adapter-hub line can emit compatible remediation evidence without format translation.",
            "- The `CVF_v1.7.1_SAFETY_RUNTIME` artifact proves checkpoint/session/audit evidence can be exported into the same release-grade manifest without lossy translation.",
            "",
        ]
    )
    return "\n".join(lines)
