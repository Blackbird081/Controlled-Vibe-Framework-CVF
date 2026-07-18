#!/usr/bin/env python3
"""
CVF MinerU Receipt Boundary Checker (MSEA-R28-T4, extended by MSEA-R28-T5)

Validates any committed MinerU metadata receipt JSON document against the
MSEA-R28-T3 accepted checker-candidate design matrix, plus the R28-T5
metadata-only `qualityReportRef`/`sourcePointer` fields. This checker reads
only receipt metadata fields; it never opens a referenced output file, reads
private source document bodies, or executes MinerU.

Applicability is narrow: a changed or worktree JSON file whose top-level
object contains a `receiptVersion` string starting with
`cvf.mineruMetadataReceipt` is treated as a MinerU metadata receipt document
and validated. Any other JSON file is ignored.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
THIS_SCRIPT_PATH = "governance/compat/check_mineru_receipt_boundary.py"
AUTORUN_PATH = "governance/compat/run_agent_autorun_workflow_gate.py"
HOOK_CHAIN_PATH = "governance/compat/run_local_governance_hook_chain.py"
DEFAULT_BASE_CANDIDATES = ("origin/main", "origin/master", "main", "master")

RECEIPT_VERSION_PREFIX = "cvf.mineruMetadataReceipt"

REQUIRED_FIELDS = (
    "receiptId",
    "sourceInputSlot",
    "inputSha256",
    "outputFileNames",
    "outputContentRead",
    "privateOutputDisposition",
    "downstreamRelease",
    "claimBoundary",
    "receiptVersion",
    "qualityReportRef",
    "sourcePointer",
)

ALLOWED_PRIVATE_OUTPUT_CLASSES = (
    "PRIVATE_INPUT_ONLY",
    "PRIVATE_RUNTIME_COPY",
    "PRIVATE_GENERATED_OUTPUT",
)

ALLOWED_PRIVATE_OUTPUT_DISPOSITIONS = (
    "RECEIPT_METADATA_ALLOWED",
)

ALLOWED_DOWNSTREAM_RELEASE_TOKENS = (
    "HELD_PENDING_RECEIPT_CHECKER_AND_MEMORY_ROUTE",
)

ALLOWED_OUTPUT_FILE_NAMES = frozenset(
    {
        "layout.pdf",
        "span.pdf",
        "model.json",
        "middle.json",
        "content_list.json",
        "content_list_v2.json",
    }
)
_SAFE_MARKDOWN_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}\.md$")
_UNSAFE_TEXT_MARKERS = ("raw:", "text:", "ocr:", "content:")

_SHA256_RE = re.compile(r"^sha256:[0-9a-f]{64}$")
_SAFE_SLOT_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$")


def _run_git(args: list[str]) -> tuple[int, str, str]:
    proc = subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        text=True,
        encoding="utf-8",
        errors="replace",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return proc.returncode, (proc.stdout or "").strip(), (proc.stderr or "").strip()


def _ref_exists(ref: str) -> bool:
    code, _, _ = _run_git(["rev-parse", "--verify", "--quiet", f"{ref}^{{commit}}"])
    return code == 0


def _discover_default_base(head: str) -> tuple[str, str]:
    env_base = os.getenv("CVF_COMPAT_BASE")
    if env_base:
        return env_base, "env:CVF_COMPAT_BASE"
    for ref in DEFAULT_BASE_CANDIDATES:
        if not _ref_exists(ref):
            continue
        code, out, _ = _run_git(["merge-base", ref, head])
        if code == 0 and out:
            return out, f"merge-base({ref},{head})"
    return "HEAD~1", "fallback:HEAD~1"


def _resolve_range(base: str | None, head: str | None) -> tuple[str, str, str]:
    resolved_head = head or "HEAD"
    if base:
        return base, resolved_head, "explicit:--base"
    resolved_base, source = _discover_default_base(resolved_head)
    return resolved_base, resolved_head, source


def _parse_name_status_output(output: str) -> dict[str, set[str]]:
    changed: dict[str, set[str]] = {}
    for raw_line in output.splitlines():
        if not raw_line.strip():
            continue
        parts = raw_line.split("\t")
        status = parts[0].strip()
        if status.startswith("R") or status.startswith("C"):
            if len(parts) < 3:
                continue
            path = parts[2]
        else:
            if len(parts) < 2:
                continue
            path = parts[1]
        normalized = path.replace("\\", "/").strip()
        changed.setdefault(normalized, set()).add(status)
    return changed


def _get_changed_name_status(base: str, head: str) -> dict[str, set[str]]:
    code, out, err = _run_git(["diff", "--name-status", f"{base}..{head}"])
    if code != 0:
        raise RuntimeError(f"git diff failed for range {base}..{head}: {err or out}")
    return _parse_name_status_output(out)


def _get_worktree_name_status() -> dict[str, set[str]]:
    changed: dict[str, set[str]] = {}
    for args in (["diff", "--name-status"], ["diff", "--name-status", "--cached"]):
        code, out, _ = _run_git(args)
        if code == 0 and out:
            for path, statuses in _parse_name_status_output(out).items():
                changed.setdefault(path, set()).update(statuses)
    code, out, _ = _run_git(["ls-files", "--others", "--exclude-standard"])
    if code == 0 and out:
        for raw_line in out.splitlines():
            normalized = raw_line.replace("\\", "/").strip()
            if normalized:
                changed.setdefault(normalized, set()).add("A")
    return changed


def _merge_changed_maps(*maps: dict[str, set[str]]) -> dict[str, list[str]]:
    merged: dict[str, set[str]] = {}
    for item in maps:
        for path, statuses in item.items():
            merged.setdefault(path, set()).update(statuses)
    return {path: sorted(statuses) for path, statuses in sorted(merged.items())}


def _read_rel(path: str) -> str:
    full = REPO_ROOT / path
    return full.read_text(encoding="utf-8", errors="replace")


def _add(violations: list[dict[str, str]], path: str, issue_type: str, message: str) -> None:
    violations.append({"path": path, "type": issue_type, "message": message})


def _is_candidate_receipt_path(path: str) -> bool:
    normalized = path.replace("\\", "/")
    return normalized.endswith(".json")


def _load_candidate_receipt(path: str, text: str) -> dict[str, Any] | None:
    try:
        payload = json.loads(text)
    except (ValueError, TypeError):
        return None
    if not isinstance(payload, dict):
        return None
    version = payload.get("receiptVersion")
    if not isinstance(version, str) or not version.startswith(RECEIPT_VERSION_PREFIX):
        return None
    return payload


def _validate_output_file_name(name: object) -> bool:
    if not isinstance(name, str):
        return False
    if "/" in name or "\\" in name or name in {"", ".", ".."}:
        return False
    if name != name.strip() or "\n" in name or "\r" in name:
        return False
    lowered = name.casefold()
    if any(marker in lowered for marker in _UNSAFE_TEXT_MARKERS):
        return False
    return lowered in ALLOWED_OUTPUT_FILE_NAMES or bool(_SAFE_MARKDOWN_RE.fullmatch(name))


def _validate_receipt(path: str, receipt: dict[str, Any]) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []

    missing = [field for field in REQUIRED_FIELDS if field not in receipt]
    if missing:
        _add(
            violations,
            path,
            "MISSING_REQUIRED_RECEIPT_FIELD",
            f"receipt is missing required field(s): {', '.join(sorted(missing))}",
        )
        # Missing-field receipts cannot be safely checked further; return early.
        return violations

    private_output_class = receipt.get("privateOutputClass")
    if private_output_class is not None and private_output_class not in ALLOWED_PRIVATE_OUTPUT_CLASSES:
        _add(
            violations,
            path,
            "INVALID_PRIVATE_OUTPUT_CLASS",
            f"privateOutputClass `{private_output_class}` is outside the T4 private output class matrix",
        )

    private_output_disposition = receipt.get("privateOutputDisposition")
    if private_output_disposition not in ALLOWED_PRIVATE_OUTPUT_DISPOSITIONS:
        _add(
            violations,
            path,
            "INVALID_PRIVATE_OUTPUT_DISPOSITION",
            f"privateOutputDisposition `{private_output_disposition}` is outside the R24-T4 committed metadata disposition",
        )

    output_content_read = receipt.get("outputContentRead")
    if output_content_read is not False:
        _add(
            violations,
            path,
            "OUTPUT_CONTENT_READ_TRUE_WITHOUT_AUTHORITY",
            "outputContentRead must be false for a committed private receipt",
        )

    output_file_names = receipt.get("outputFileNames")
    if not isinstance(output_file_names, list) or not output_file_names:
        _add(
            violations,
            path,
            "OUTPUT_FILE_NAME_NOT_METADATA_ONLY",
            "outputFileNames must be a non-empty list of metadata-only file names",
        )
    else:
        bad_names = [name for name in output_file_names if not _validate_output_file_name(name)]
        if bad_names:
            _add(
                violations,
                path,
                "OUTPUT_FILE_NAME_NOT_METADATA_ONLY",
                f"outputFileNames contains disallowed or content-bearing name(s): {bad_names!r}",
            )

    downstream_release = receipt.get("downstreamRelease")
    if downstream_release not in ALLOWED_DOWNSTREAM_RELEASE_TOKENS:
        _add(
            violations,
            path,
            "DOWNSTREAM_RELEASE_CLAIMS_UNAUTHORIZED_ROUTE",
            f"downstreamRelease `{downstream_release}` does not match an authorized held-route token",
        )

    source_input_slot = receipt.get("sourceInputSlot")
    if not isinstance(source_input_slot, str) or not _SAFE_SLOT_RE.fullmatch(source_input_slot):
        _add(
            violations,
            path,
            "SOURCE_SLOT_EXPOSES_SENSITIVE_DETAIL",
            "sourceInputSlot must be a bounded metadata identifier, not free-form sensitive text",
        )
    else:
        lowered_slot = source_input_slot.casefold()
        if any(marker in lowered_slot for marker in _UNSAFE_TEXT_MARKERS):
            _add(
                violations,
                path,
                "SOURCE_SLOT_EXPOSES_SENSITIVE_DETAIL",
                "sourceInputSlot must not contain raw-content markers",
            )

    input_sha256 = receipt.get("inputSha256")
    if not isinstance(input_sha256, str) or not _SHA256_RE.fullmatch(input_sha256):
        _add(
            violations,
            path,
            "MISSING_REQUIRED_RECEIPT_FIELD",
            "inputSha256 must be sha256:<64 lowercase hex>",
        )

    for field_name in ("qualityReportRef", "sourcePointer"):
        value = receipt.get(field_name)
        if not isinstance(value, str) or not _SAFE_SLOT_RE.fullmatch(value):
            _add(
                violations,
                path,
                "QUALITY_OR_SOURCE_POINTER_MISSING",
                f"{field_name} must be a bounded metadata identifier, not free-form or absent",
            )
        elif any(marker in value.casefold() for marker in _UNSAFE_TEXT_MARKERS):
            _add(
                violations,
                path,
                "QUALITY_OR_SOURCE_POINTER_MISSING",
                f"{field_name} must not contain raw-content markers",
            )

    return violations


def _validate_path(path: str) -> list[dict[str, str]]:
    full = REPO_ROOT / path
    if not full.exists() or not _is_candidate_receipt_path(path):
        return []
    text = _read_rel(path)
    receipt = _load_candidate_receipt(path, text)
    if receipt is None:
        return []
    return _validate_receipt(path, receipt)


def _classify(changed_paths: dict[str, list[str]]) -> dict[str, Any]:
    scoped_paths = sorted(
        path for path in changed_paths if _is_candidate_receipt_path(path)
    )
    violations: list[dict[str, str]] = []
    receipts_checked = 0
    for path in scoped_paths:
        statuses = changed_paths.get(path, [])
        if statuses and all(status.startswith("D") for status in statuses):
            continue
        full = REPO_ROOT / path
        if not full.exists():
            continue
        text = _read_rel(path)
        receipt = _load_candidate_receipt(path, text)
        if receipt is None:
            continue
        receipts_checked += 1
        violations.extend(_validate_receipt(path, receipt))
    return {
        "filesScanned": scoped_paths,
        "fileCount": len(scoped_paths),
        "receiptsChecked": receipts_checked,
        "violationCount": len(violations),
        "violations": violations,
        "compliant": len(violations) == 0,
    }


def _print_report(report: dict[str, Any], base: str, head: str, base_source: str) -> None:
    print("=== CVF MinerU Receipt Boundary Checker ===")
    print(f"Range: {base}..{head}")
    print(f"Base source: {base_source}")
    print(f"JSON files scanned: {report['fileCount']}")
    print(f"Receipts checked: {report['receiptsChecked']}")
    print(f"Violations: {report['violationCount']}")
    if report["violations"]:
        print("\nViolations:")
        for violation in report["violations"]:
            print(f"  - {violation['path']} ({violation['type']}): {violation['message']}")
    if report["compliant"]:
        print("\nCOMPLIANT - no MinerU receipt boundary violations found.")
    else:
        print("\nVIOLATION - repair the MinerU metadata receipt boundary defects above.")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description="Enforce CVF MinerU receipt boundary")
    parser.add_argument("--base", default=None)
    parser.add_argument("--head", default=None)
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args()
    base, head, base_source = _resolve_range(args.base, args.head)
    try:
        range_changes = _get_changed_name_status(base, head)
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 1
    changed_paths = _merge_changed_maps(range_changes, _get_worktree_name_status())
    classified = _classify(changed_paths)
    report = {
        "timestamp": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "range": {"base": base, "head": head, "baseSource": base_source},
        **classified,
    }
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        _print_report(report, base, head, base_source)
    if args.enforce and not classified["compliant"]:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
