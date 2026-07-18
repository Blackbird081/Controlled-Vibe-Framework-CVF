#!/usr/bin/env python3
"""
CVF PLCS Companion Routing Block Gate.

Enforces the PLCS-T3 approved companion-routing block for future FPC-T2
C01-C04 ADD_INTERLOCK_ENTRY registry-edit work orders.
"""

from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
STANDARD_PATH = "docs/reference/CVF_PLCS_T3_COMPANION_ROUTING_CHECKER_TEMPLATE_DECISION_2026-06-16.md"
ROUTING_MATRIX_ANCHOR = (
    "docs/reference/CVF_PLCS_T1_ABSORPTION_TO_WORKFLOW_CHAIN_ROUTING_MATRIX_2026-06-16.md"
    "#section-c-fpc-t2-candidate-routing-summary"
)
DEFAULT_BASE_CANDIDATES = ("origin/main", "origin/master", "main", "master")
WORK_ORDER_PREFIX = "docs/work_orders/"
BLOCK_HEADING = "## PLCS Companion Routing Block"

REQUIRED_FIELDS = (
    "plcs_routing_row",
    "plcs_routing_disposition",
    "cclv_disposition",
    "parallel_lane_risk",
    "plcs_cross_reference",
    "registry_edit_boundary",
    "c05_boundary",
)

CANDIDATE_DEFAULTS: dict[str, dict[str, str]] = {
    "C01": {
        "cclv_disposition": "CENTRAL_FACTS_REQUIRED",
        "parallel_lane_risk": "medium",
    },
    "C02": {
        "cclv_disposition": "CENTRAL_FACTS_REQUIRED",
        "parallel_lane_risk": "high",
    },
    "C03": {
        "cclv_disposition": "LOCAL_VIEW_REQUIRED",
        "parallel_lane_risk": "medium",
    },
    "C04": {
        "cclv_disposition": "CENTRAL_FACTS_REQUIRED",
        "parallel_lane_risk": "high",
    },
}


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
    return proc.returncode, proc.stdout.strip(), proc.stderr.strip()


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


def _normalize(path: str) -> str:
    return path.replace("\\", "/").strip()


def _parse_name_status(output: str) -> dict[str, set[str]]:
    changed: dict[str, set[str]] = {}
    for raw_line in output.splitlines():
        parts = raw_line.split("\t")
        if len(parts) < 2:
            continue
        status = parts[0].strip()
        path = parts[2] if status.startswith(("R", "C")) and len(parts) > 2 else parts[1]
        normalized = _normalize(path)
        if normalized:
            changed.setdefault(normalized, set()).add(status)
    return changed


def get_changed_paths(base: str, head: str) -> dict[str, list[str]]:
    merged: dict[str, set[str]] = {}
    if base != head:
        code, out, err = _run_git(["diff", "--name-status", f"{base}..{head}"])
        if code != 0:
            raise RuntimeError(f"git diff failed for range {base}..{head}: {err or out}")
        for path, statuses in _parse_name_status(out).items():
            merged.setdefault(path, set()).update(statuses)

    for args in (["diff", "--name-status"], ["diff", "--name-status", "--cached"]):
        code, out, _ = _run_git(args)
        if code == 0 and out:
            for path, statuses in _parse_name_status(out).items():
                merged.setdefault(path, set()).update(statuses)

    code, out, _ = _run_git(["ls-files", "--others", "--exclude-standard"])
    if code == 0 and out:
        for raw_line in out.splitlines():
            path = _normalize(raw_line)
            if path:
                merged.setdefault(path, set()).add("A")

    return {path: sorted(statuses) for path, statuses in sorted(merged.items())}


def _read_rel(path: str) -> str:
    return (REPO_ROOT / path).read_text(encoding="utf-8", errors="replace")


def _is_deleted(statuses: list[str]) -> bool:
    return bool(statuses) and all(status.startswith("D") for status in statuses)


def _candidate_tokens(text: str) -> list[str]:
    found: list[str] = []
    for match in re.finditer(r"\b(?:FPC[- ]?T2[- ]?)?(C0[1-4])\b", text, re.IGNORECASE):
        candidate = match.group(1).upper()
        if candidate not in found:
            found.append(candidate)
    return found


def is_in_scope_work_order(path: str, text: str) -> bool:
    if not path.startswith(WORK_ORDER_PREFIX) or not path.endswith(".md"):
        return False
    upper = text.upper()
    if "ADD_INTERLOCK_ENTRY" not in upper:
        return False
    if not re.search(r"\bFPC[- ]?T2\b", text, re.IGNORECASE):
        return False
    if not re.search(r"\bregistry[- ]edit\b|\bregistry[- ]entry\b", text, re.IGNORECASE):
        return False
    return bool(_candidate_tokens(text))


def _extract_block(text: str) -> str:
    pattern = re.compile(
        rf"^{re.escape(BLOCK_HEADING)}\s*$([\s\S]*?)(?=^##\s+|\Z)",
        re.MULTILINE,
    )
    match = pattern.search(text)
    return match.group(1).strip() if match else ""


def _normalize_field_name(value: str) -> str:
    return re.sub(r"[^a-z0-9_]+", "", value.strip().lower().replace("-", "_").replace(" ", "_"))


def parse_block_fields(block: str) -> dict[str, str]:
    fields: dict[str, str] = {}
    for raw_line in block.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if line.startswith("|") and line.endswith("|"):
            cells = [cell.strip().strip("`") for cell in line.strip("|").split("|")]
            if len(cells) >= 2:
                name = _normalize_field_name(cells[0])
                if name in REQUIRED_FIELDS and not set(cells[1]) <= {"-", ":"}:
                    fields[name] = cells[1].strip()
            continue
        match = re.match(r"^[-*]?\s*`?([A-Za-z0-9_ -]+)`?\s*:\s*(.+?)\s*$", line)
        if not match:
            continue
        name = _normalize_field_name(match.group(1))
        if name in REQUIRED_FIELDS:
            fields[name] = match.group(2).strip()
    return fields


def validate_text(path: str, text: str) -> list[str]:
    violations: list[str] = []
    if not is_in_scope_work_order(path, text):
        return violations

    candidates = _candidate_tokens(text)
    block = _extract_block(text)
    if not block:
        return [
            f"{path}: in-scope FPC-T2 C01-C04 ADD_INTERLOCK_ENTRY work order "
            f"must include `{BLOCK_HEADING}`"
        ]

    fields = parse_block_fields(block)
    for field in REQUIRED_FIELDS:
        if not fields.get(field):
            violations.append(f"{path}: PLCS companion block missing `{field}`")

    if violations:
        return violations

    routing_row = fields["plcs_routing_row"].upper()
    if not any(candidate in routing_row for candidate in candidates):
        violations.append(
            f"{path}: `plcs_routing_row` must name the in-scope candidate "
            f"({', '.join(candidates)})"
        )

    if "ADD_INTERLOCK_ENTRY" not in fields["plcs_routing_disposition"].upper():
        violations.append(
            f"{path}: `plcs_routing_disposition` must preserve ADD_INTERLOCK_ENTRY"
        )

    cclv_value = fields["cclv_disposition"].upper()
    risk_value = fields["parallel_lane_risk"].lower()
    for candidate in candidates:
        expected_cclv = CANDIDATE_DEFAULTS[candidate]["cclv_disposition"]
        expected_risk = CANDIDATE_DEFAULTS[candidate]["parallel_lane_risk"]
        if expected_cclv not in cclv_value:
            violations.append(
                f"{path}: `cclv_disposition` for {candidate} must include {expected_cclv}"
            )
        if not risk_value.startswith(expected_risk):
            violations.append(
                f"{path}: `parallel_lane_risk` for {candidate} must start with {expected_risk}"
            )

    if ROUTING_MATRIX_ANCHOR not in fields["plcs_cross_reference"]:
        violations.append(
            f"{path}: `plcs_cross_reference` must cite `{ROUTING_MATRIX_ANCHOR}`"
        )

    registry_boundary = fields["registry_edit_boundary"].lower()
    if not any(marker in registry_boundary for marker in ("boundary", "routing", "evidence")):
        violations.append(
            f"{path}: `registry_edit_boundary` must state the routing/evidence boundary"
        )

    if "DEFERRED_PENDING_FPC_T3_C01" not in fields["c05_boundary"]:
        violations.append(
            f"{path}: `c05_boundary` must preserve `DEFERRED_PENDING_FPC_T3_C01`"
        )

    return violations


def check_paths(changed: dict[str, list[str]]) -> tuple[int, int, list[str]]:
    checked = 0
    applicable = 0
    violations: list[str] = []
    for path, statuses in changed.items():
        if not path.startswith(WORK_ORDER_PREFIX) or not path.endswith(".md"):
            continue
        if _is_deleted(statuses):
            continue
        checked += 1
        full_path = REPO_ROOT / path
        if not full_path.is_file():
            continue
        text = _read_rel(path)
        if is_in_scope_work_order(path, text):
            applicable += 1
        violations.extend(validate_text(path, text))
    return checked, applicable, violations


def main() -> int:
    parser = argparse.ArgumentParser(description="Check PLCS companion routing blocks")
    parser.add_argument("--base", default=None, help="Base commit/ref for range-aware checks")
    parser.add_argument("--head", default="HEAD", help="Head commit/ref for range-aware checks")
    parser.add_argument("--enforce", action="store_true", help="Return non-zero on violations")
    args = parser.parse_args()

    base, head, source = _resolve_range(args.base, args.head)
    print("=== CVF PLCS Companion Routing Block Gate ===")
    print(f"Range: {base}..{head}")
    print(f"Base source: {source}")
    print(f"Standard: {STANDARD_PATH}")

    try:
        changed = get_changed_paths(base, head)
    except RuntimeError as exc:
        print(f"VIOLATION - {exc}")
        return 2 if args.enforce else 0

    checked, applicable, violations = check_paths(changed)
    print(f"Changed paths observed: {len(changed)}")
    print(f"Changed work orders checked: {checked}")
    print(f"Applicable FPC-T2 C01-C04 work orders: {applicable}")
    print(f"Violations: {len(violations)}")

    for violation in violations:
        print(f"  - {violation}")

    if violations:
        print("\nVIOLATION - PLCS companion routing block requirements are not satisfied.")
        return 2 if args.enforce else 0

    print("\nCOMPLIANT - PLCS companion routing block requirements are satisfied.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
