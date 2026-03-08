"""Baseline artifact emitters for runtime evidence families."""

from __future__ import annotations

from pathlib import Path

from export_cvf_remediation_receipt_log import build_log
from runtime_evidence_manifest.common import require_existing, write_json, write_text
from runtime_evidence_manifest.fixtures import RUNTIME_FAMILY_CONFIG, SCHEMA_VERSION


def emit_family_baseline(runtime_family: str, artifact_path: Path, log_path: Path) -> None:
    config = RUNTIME_FAMILY_CONFIG[runtime_family]
    receipts = config["receipts"]
    if receipts is None:
        require_existing(artifact_path)
        require_existing(log_path)
        return

    artifact = {
        "schemaVersion": SCHEMA_VERSION,
        "adapter": config["adapter"],
        "receiptCount": len(receipts),
        "receipts": receipts,
    }
    write_json(artifact_path, artifact)
    write_text(log_path, build_log(artifact_path))
