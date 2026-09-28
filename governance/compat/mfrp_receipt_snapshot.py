#!/usr/bin/env python3
"""Immutable runtime snapshots for admitted MFRP receipts."""
from __future__ import annotations

import os
import re
import tempfile
from pathlib import Path


class ReceiptSnapshotUnsafe(Exception):
    def __init__(self, code: str, detail: str) -> None:
        super().__init__(f"{code}: {detail}")
        self.code = code
        self.detail = detail


def preserve(source: Path, runtime_dir: Path, trusted_commit: str, digest: str) -> Path:
    """Copy exact validated bytes to a stable, collision-checked identity path."""
    if not re.fullmatch(r"[0-9a-f]{40}", trusted_commit) or not re.fullmatch(
        r"[0-9a-f]{64}", digest
    ):
        raise ReceiptSnapshotUnsafe(
            "UNSAFE_RECEIPT_SNAPSHOT_IDENTITY", "invalid commit or receipt digest"
        )
    try:
        receipt_bytes = source.read_bytes()
    except OSError as exc:
        raise ReceiptSnapshotUnsafe("UNSAFE_RECEIPT_SNAPSHOT_READ", str(exc)) from exc
    target = runtime_dir / "receipts" / f"{trusted_commit}-{digest}.json"
    if target.is_file():
        if target.read_bytes() != receipt_bytes:
            raise ReceiptSnapshotUnsafe(
                "UNSAFE_RECEIPT_SNAPSHOT_COLLISION", f"snapshot differs at {target}"
            )
        return target
    target.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_name = tempfile.mkstemp(dir=str(target.parent), prefix=".receipt-", suffix=".tmp")
    try:
        with os.fdopen(fd, "wb") as handle:
            handle.write(receipt_bytes)
        os.replace(tmp_name, target)
    finally:
        if os.path.exists(tmp_name):
            os.unlink(tmp_name)
    return target
