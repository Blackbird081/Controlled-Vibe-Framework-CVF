#!/usr/bin/env python3
"""
CVF INDEX Classification Gate

Validates forward-only INDEX discipline for CVF classification artifacts.
Enforces the accepted standard:
docs/reference/CVF_INDEX_CLASSIFICATION_STANDARD_2026-06-21.md

check_index_classification.py

Scope (INDEX-T1 tranche):
- Detects artifacts that claim INDEX-governed classification via an
  "INDEX type:" field declaration.
- Verifies required metadata fields are present in those artifacts.
- Rejects retroactive-rewrite claims.
- Rejects provider/private memory files cited as CVF source authority
  without required allow markers.
- Rejects forbidden expansion claims in INDEX-governed artifacts.
- Validates that the INDEX standard file contains required markers.
- Verifies that autorun-gate and hook-chain wiring surfaces cite this script.

Not in scope (explicitly deferred per INDEX-T1 work order):
- Semantic truth judgment of classification content.
- Legacy corpus rescan or MPI-T2/T3/T4 implementation.
- Runtime Memory mutation, provider/live proof, public-sync, CLI/MCP
  adapter behavior, vector DB, graph persistence, or universal control.
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

try:
    from guard_binding_catalog import has_binding_marker
except ModuleNotFoundError:
    from governance.compat.guard_binding_catalog import has_binding_marker


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_BASE_CANDIDATES = ("origin/main", "origin/master", "main", "master")

STANDARD_PATH = "docs/reference/CVF_INDEX_CLASSIFICATION_STANDARD_2026-06-21.md"
THIS_SCRIPT_PATH = "governance/compat/check_index_classification.py"
AUTORUN_PATH = "governance/compat/run_agent_autorun_workflow_gate.py"
HOOK_CHAIN_PATH = "governance/compat/run_local_governance_hook_chain.py"
ARCHIVE_MARKER = "/archive/"

REQUIRED_STANDARD_MARKERS: tuple[str, ...] = (
    "Status: ACTIVE_FORWARD_ONLY",
    "## Required Metadata Per INDEX Artifact",
    "Forward-Only Application Rules",
    "IDX-1",
    "IDX-2",
    "IDX-3",
    "IDX-4",
    "IDX-5",
    "IDX-6",
)

REQUIRED_METADATA_FIELDS: tuple[str, ...] = (
    "INDEX type:",
    "Source authority:",
    "Status:",
    "Date:",
    "Human-reviewable:",
    "Claim boundary:",
    "Public Export Disposition:",
)

VALID_INDEX_TYPES: tuple[str, ...] = (
    "IDX-1",
    "IDX-2",
    "IDX-3",
    "IDX-4",
    "IDX-5",
    "IDX-6",
)

INDEX_TYPE_DECLARATION_RE = re.compile(r"^INDEX type:\s*\S", re.MULTILINE)

INDEX_TYPE_VALUE_RE = re.compile(r"^INDEX type:\s*(\S+)", re.MULTILINE)

RETROACTIVE_REWRITE_RE = re.compile(
    r"\b(?:retroactively\s+(?:reclassif\w+|rewrite\w*|relabel\w*)|retroactive\s+rewrite\w*)\b",
    re.IGNORECASE,
)

PROVIDER_PRIVATE_FILES: tuple[str, ...] = (
    "CLAUDE.md",
    "MEMORY.md",
    ".codex/memories",
)

PROVIDER_PRIVATE_ALLOW_MARKERS: tuple[str, ...] = (
    "NOT_CVF_SOURCE",
    "NOT_SOURCE_AUTHORITY",
    "IDX-7",
    "provider-specific",
    "not CVF source",
    "not source of truth",
    "provider-private",
)

FORBIDDEN_EXPANSION_RE = re.compile(
    r"\b(?:enforces?\s+runtime|runtime\s+enforcement|enforces?\s+policy\s+decision|"
    r"vector\s+db\s+enforcement|graph\s+persistence\s+enforcement|"
    r"cli/mcp\s+adapter\s+enforcement|direct\s+(?:ide|shell|git)\s+interception\s+enforcement|"
    r"enforces?\s+all\s+requests)\b",
    re.IGNORECASE,
)

APPLICABLE_PREFIXES: tuple[str, ...] = (
    "docs/audits/",
    "docs/reviews/",
    "docs/assessments/",
    "docs/logs/",
    "docs/reports/",
    "docs/baselines/",
    "docs/roadmaps/",
    "docs/work_orders/",
    "docs/reference/",
    "governance/compat/",
)

EXCLUDED_FROM_APPLICABLE: tuple[str, ...] = (
    STANDARD_PATH,
    THIS_SCRIPT_PATH,
)


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


def _parse_name_status_output(output: str) -> dict[str, set[str]]:
    changed: dict[str, set[str]] = {}
    for raw_line in output.splitlines():
        if not raw_line.strip():
            continue
        parts = raw_line.split("\t")
        status = parts[0].strip()
        if status.startswith(("R", "C")):
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
    return (REPO_ROOT / path).read_text(encoding="utf-8", errors="replace")


def _add(violations: list[dict[str, str]], path: str, issue_type: str, message: str) -> None:
    violations.append({"path": path, "type": issue_type, "message": message})


def _is_applicable(path: str, text: str) -> bool:
    """Return True if this file claims INDEX-governed classification."""
    normalized = path.replace("\\", "/")
    if not normalized.endswith(".md"):
        return False
    if ARCHIVE_MARKER in normalized:
        return False
    if normalized in EXCLUDED_FROM_APPLICABLE:
        return False
    if not any(normalized.startswith(prefix) for prefix in APPLICABLE_PREFIXES):
        return False
    return bool(INDEX_TYPE_DECLARATION_RE.search(text))


def _validate_standard(path: str, text: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    for marker in REQUIRED_STANDARD_MARKERS:
        if marker not in text:
            _add(violations, path, "standard_marker_missing", f"missing required marker: `{marker}`")
    return violations


def _validate_binding(path: str, text: str) -> list[dict[str, str]]:
    if has_binding_marker(path, THIS_SCRIPT_PATH, text):
        return []
    return [{"path": path, "type": "binding_missing", "message": f"must cite `{THIS_SCRIPT_PATH}`"}]


def _validate_index_artifact(path: str, text: str) -> list[dict[str, str]]:
    """Validate an applicable INDEX artifact (has INDEX type: declaration)."""
    violations: list[dict[str, str]] = []

    for field in REQUIRED_METADATA_FIELDS:
        if field not in text:
            _add(violations, path, "missing_required_metadata_field",
                 f"INDEX artifact must include field `{field}`")

    idx_match = INDEX_TYPE_VALUE_RE.search(text)
    if idx_match:
        idx_value = idx_match.group(1).strip()
        if idx_value not in VALID_INDEX_TYPES:
            _add(violations, path, "invalid_index_type",
                 f"INDEX type value `{idx_value}` is not a valid IDX-1 through IDX-6 type; "
                 f"IDX-7 is not governed by CVF")

    if RETROACTIVE_REWRITE_RE.search(text):
        _add(violations, path, "retroactive_rewrite_claim",
             "INDEX artifact contains a retroactive-rewrite claim; "
             "the standard is forward-only and must not retroactively alter historical CVF artifacts")

    _check_provider_private_authority(path, text, violations)

    if FORBIDDEN_EXPANSION_RE.search(text):
        _add(violations, path, "forbidden_expansion_claim",
             "INDEX artifact contains a forbidden expansion claim (runtime enforcement, "
             "vector DB enforcement, graph persistence enforcement, or similar); "
             "INDEX artifacts are cross-references only and must not assert runtime authority")

    return violations


def _check_provider_private_authority(
    path: str,
    text: str,
    violations: list[dict[str, str]],
) -> None:
    """Check that provider-private files are not cited as CVF source authority."""
    lines = text.splitlines()
    for ppfile in PROVIDER_PRIVATE_FILES:
        for lineno, line in enumerate(lines, start=1):
            if ppfile not in line:
                continue
            has_marker = any(marker.lower() in line.lower()
                             for marker in PROVIDER_PRIVATE_ALLOW_MARKERS)
            if not has_marker:
                _add(violations, path, "provider_private_authority_misuse",
                     f"provider-private file `{ppfile}` referenced on line {lineno} "
                     f"without a required allow marker ({', '.join(PROVIDER_PRIVATE_ALLOW_MARKERS)}); "
                     f"provider-private files must not be cited as CVF source authority")
                break


def _validate_path(path: str) -> list[dict[str, str]]:
    full = REPO_ROOT / path
    if not full.exists() or full.is_dir():
        return []
    text = _read_rel(path)
    violations: list[dict[str, str]] = []

    if path == STANDARD_PATH:
        violations.extend(_validate_standard(path, text))

    if path in {AUTORUN_PATH, HOOK_CHAIN_PATH}:
        violations.extend(_validate_binding(path, text))

    if _is_applicable(path, text):
        violations.extend(_validate_index_artifact(path, text))

    return violations


def _classify(changed_paths: dict[str, list[str]]) -> dict[str, Any]:
    required_paths = (STANDARD_PATH, AUTORUN_PATH, HOOK_CHAIN_PATH)
    missing_files = [p for p in required_paths if not (REPO_ROOT / p).exists()]
    scoped_paths: set[str] = set(changed_paths)
    scoped_paths.update(p for p in required_paths if (REPO_ROOT / p).exists())

    violations: list[dict[str, str]] = []
    for path in sorted(scoped_paths):
        statuses = changed_paths.get(path, [])
        if statuses and all(s.startswith("D") for s in statuses):
            continue
        violations.extend(_validate_path(path))

    return {
        "checkedPaths": sorted(scoped_paths),
        "changedPaths": changed_paths,
        "missingFiles": missing_files,
        "violations": violations,
        "violationCount": len(missing_files) + len(violations),
        "compliant": not missing_files and not violations,
    }


def _print_report(report: dict[str, Any], base: str, head: str, range_source: str) -> None:
    print("=== CVF INDEX Classification Gate ===")
    print(f"Range: {base}..{head} ({range_source})")
    print(f"Standard: {STANDARD_PATH}")
    print(f"Changed paths: {len(report['changedPaths'])}")
    print(f"Checked paths: {len(report['checkedPaths'])}")
    print(f"Missing files: {len(report['missingFiles'])}")
    print(f"Violations: {len(report['violations'])}")
    if report["missingFiles"]:
        print("\nMissing files:")
        for p in report["missingFiles"]:
            print(f"  - {p}")
    if report["violations"]:
        print("\nViolations:")
        for item in report["violations"]:
            print(f"  - {item['path']}: {item['type']} - {item['message']}")
    if report["compliant"]:
        print("\nCOMPLIANT - INDEX classification structure is aligned.")
    else:
        print("\nVIOLATION - INDEX classification structure has defects.")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate forward-only INDEX classification discipline"
    )
    parser.add_argument("--base", default=None, help="Optional git base ref")
    parser.add_argument("--head", default=None, help="Optional git head ref")
    parser.add_argument("--enforce", action="store_true",
                        help="Return non-zero when violations exist")
    parser.add_argument("--json", action="store_true", help="Print JSON report")
    args = parser.parse_args()

    try:
        base, head, range_source = _resolve_range(args.base, args.head)
        changed_paths = _merge_changed_maps(
            _get_changed_name_status(base, head),
            _get_worktree_name_status(),
        )
        report = _classify(changed_paths)
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    report["timestamp"] = (
        dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    )
    report["range"] = {"base": base, "head": head, "source": range_source}
    if args.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        _print_report(report, base, head, range_source)
    if args.enforce and not report["compliant"]:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
