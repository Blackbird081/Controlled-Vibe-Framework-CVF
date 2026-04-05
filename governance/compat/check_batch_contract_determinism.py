#!/usr/bin/env python3
from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
POLICY_PATH = "governance/toolkit/05_OPERATION/CVF_BATCH_CONTRACT_DETERMINISM_GUARD.md"
GOVERNED_ROOTS = (
    "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src",
    "EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src",
)
DIRECT_BATCH_ID_PATTERN = re.compile(r"const\s+batchId\s*=\s*computeDeterministicHash\(", re.M)
NON_BATCH_NEW_PATTERN = re.compile(r"\bnew\s+([A-Z][A-Za-z0-9]*Contract)\(")
NON_BATCH_CREATE_PATTERN = re.compile(r"\bcreate([A-Z][A-Za-z0-9]*Contract)\(")


def _read_text(path: Path) -> str:
    if not path.exists() or path.is_dir():
        return ""
    return path.read_text(encoding="utf-8", errors="replace")


def _rel(path: Path) -> str:
    return path.relative_to(REPO_ROOT).as_posix()


def _discover_governed_files() -> list[Path]:
    files: list[Path] = []
    for rel_root in GOVERNED_ROOTS:
        root = REPO_ROOT / rel_root
        if not root.exists():
            continue
        files.extend(sorted(root.glob("*.batch.contract.ts")))
    return sorted(files)


def _clip_snippet(text: str, start: int, width: int = 220) -> str:
    return text[start:start + width].replace("\n", " ")


def _classify_file(path: Path) -> list[dict[str, str]]:
    text = _read_text(path)
    rel_path = _rel(path)
    violations: list[dict[str, str]] = []

    if "batchIdParts:" in text:
        violations.append(
            {
                "type": "batch_id_parts_forbidden",
                "path": rel_path,
                "message": f"{rel_path} must not use `batchIdParts`; governed batch identity must derive `batchId` from `batchHash` only.",
            }
        )

    for match in DIRECT_BATCH_ID_PATTERN.finditer(text):
        snippet = _clip_snippet(text, match.start())
        if "batchHash" not in snippet:
            violations.append(
                {
                    "type": "direct_batch_id_not_derived_from_batch_hash",
                    "path": rel_path,
                    "message": f"{rel_path} computes `batchId` directly without clearly deriving it from `batchHash`.",
                }
            )

    for pattern in (NON_BATCH_NEW_PATTERN, NON_BATCH_CREATE_PATTERN):
        for match in pattern.finditer(text):
            contract_name = match.group(1)
            if "BatchContract" in contract_name:
                continue
            snippet = _clip_snippet(text, match.start())
            if "now:" in snippet:
                continue
            violations.append(
                {
                    "type": "nested_now_not_propagated",
                    "path": rel_path,
                    "message": f"{rel_path} instantiates `{contract_name}` without threading `now: this.now`.",
                }
            )

    return violations


def _classify() -> dict:
    files = _discover_governed_files()
    violations: list[dict[str, str]] = []

    for path in files:
        violations.extend(_classify_file(path))

    return {
        "timestamp": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "policy": POLICY_PATH,
        "governedFileCount": len(files),
        "governedFiles": [_rel(path) for path in files],
        "violationCount": len(violations),
        "violations": violations,
        "compliant": not violations,
    }


def _print_report(report: dict) -> None:
    print("=== CVF Batch Contract Determinism Gate ===")
    print(f"Governed files: {report['governedFileCount']}")
    print(f"Violations: {report['violationCount']}")

    if report["violations"]:
        print("\n❌ Violations:")
        for violation in report["violations"]:
            print(f"  - [{violation['type']}] {violation['message']}")
    else:
        print("\n✅ COMPLIANT — governed batch contracts preserve deterministic identity and nested clock propagation.")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="Check governed batch determinism")
    parser.add_argument("--enforce", action="store_true")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    report = _classify()
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        _print_report(report)

    if args.enforce and not report["compliant"]:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
