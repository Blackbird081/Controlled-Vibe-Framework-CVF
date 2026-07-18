#!/usr/bin/env python3
"""
CVF Corpus Intelligence Classification Gate

Checks structural discipline for corpus-derived intelligence classification
ledgers. This checker validates shape, evidence, disposition, legal/policy
domain fields, and response-boundary classes. It does not validate semantic
correctness.
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

STANDARD_PATH = "docs/reference/CVF_CORPUS_INTELLIGENCE_CLASSIFICATION_STANDARD_2026-06-01.md"
GUARD_PATH = "governance/toolkit/05_OPERATION/CVF_CORPUS_INTELLIGENCE_CLASSIFICATION_GUARD.md"
THIS_SCRIPT_PATH = "governance/compat/check_corpus_intelligence_classification.py"
AUTORUN_PATH = "governance/compat/run_agent_autorun_workflow_gate.py"
HOOK_CHAIN_PATH = "governance/compat/run_local_governance_hook_chain.py"
CONTROL_MATRIX_PATH = "docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md"
MASTER_POLICY_PATH = "governance/toolkit/02_POLICY/CVF_MASTER_POLICY.md"
KB_PATH = "docs/CVF_CORE_KNOWLEDGE_BASE.md"
ARCHIVE_MARKER = "/archive/"

REQUIRED_SECTION = "## Corpus Intelligence Classification"
LEDGER_MARKER = "Corpus Intelligence Classification Ledger"
REQUIRED_LEDGER_COLUMNS = (
    "sourcePath",
    "processingStatus",
    "knowledgeRegion",
    "ownerSurface",
    "disposition",
    "evidencePointer",
)
REQUIRED_BLOCK_FIELDS = (
    "Classification task class:",
    "Source corpus evidence:",
    "Knowledge map evidence:",
    "Classification ledger:",
    "Legal/policy corpus:",
    "Domain fields:",
    "Response Boundary:",
    "Adversarial sampling plan:",
    "Classification verdict:",
)
ANSWER_CLASSES = (
    "DIRECT_CITED_ANSWER",
    "SUMMARY_WITH_SOURCE",
    "PROCEDURAL_GUIDANCE",
    "ESCALATE_OR_ABSTAIN",
)
ALLOWED_PROCESSING_STATUSES = (
    "READ_DEEP",
    "READ_SHALLOW",
    "SKIPPED_WITH_REASON",
    "DEFERRED",
    "BLOCKED_UNREADABLE",
)
ALLOWED_DISPOSITIONS = (
    "ACCEPT",
    "ACCEPT_SUMMARY_ONLY",
    "DEFER",
    "REJECT",
    "BLOCKED_SOURCE_NOT_FOUND",
    "BLOCKED_UNREADABLE",
)
LEGAL_DOMAIN_FIELDS = (
    "jurisdiction",
    "authorityLevel",
    "effectiveDate",
    "sourceAuthority",
    "answerBoundary",
)
APPLICABLE_PREFIXES = (
    "docs/audits/",
    "docs/reviews/",
    "docs/assessments/",
    "docs/logs/",
    "docs/reports/",
    "docs/baselines/",
    "docs/roadmaps/",
    "docs/work_orders/",
    "docs/reference/",
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


def _extract_section(text: str, header: str) -> str:
    marker = f"{header}\n"
    start = text.find(marker)
    if start == -1:
        return ""
    section_start = start + len(marker)
    next_header = text.find("\n## ", section_start)
    return text[section_start:] if next_header == -1 else text[section_start:next_header]


def _field_value(section: str, label: str) -> str:
    match = re.search(rf"^\s*-\s*{re.escape(label)}\s*(.+?)\s*$", section, re.I | re.M)
    return match.group(1).strip() if match else ""


def _is_none_like(value: str) -> bool:
    return value.strip().lower() in {"", "none", "none.", "n/a", "n/a.", "0"}


def _is_applicable_output(path: str, text: str) -> bool:
    normalized = path.replace("\\", "/")
    if not normalized.endswith(".md") or ARCHIVE_MARKER in normalized:
        return False
    if normalized in {STANDARD_PATH, GUARD_PATH}:
        return False
    if not any(normalized.startswith(prefix) for prefix in APPLICABLE_PREFIXES):
        return False
    lowered = text.lower()
    return (
        REQUIRED_SECTION.lower() in lowered
        or LEDGER_MARKER.lower() in lowered
        or "classification verdict:" in lowered
        or "legal/policy corpus:" in lowered
    )


def _parse_markdown_tables(section: str) -> list[list[dict[str, str]]]:
    tables: list[list[dict[str, str]]] = []
    lines = section.splitlines()
    index = 0
    while index < len(lines) - 1:
        line = lines[index].strip()
        separator = lines[index + 1].strip()
        if not (line.startswith("|") and line.endswith("|") and separator.startswith("|") and "---" in separator):
            index += 1
            continue
        headers = [part.strip() for part in line.strip("|").split("|")]
        rows: list[dict[str, str]] = []
        index += 2
        while index < len(lines):
            row_line = lines[index].strip()
            if not (row_line.startswith("|") and row_line.endswith("|")):
                break
            values = [part.strip() for part in row_line.strip("|").split("|")]
            rows.append({headers[pos]: values[pos] if pos < len(values) else "" for pos in range(len(headers))})
            index += 1
        tables.append(rows)
    return tables


def _find_ledger_rows(section: str) -> tuple[list[dict[str, str]], list[str]]:
    for rows in _parse_markdown_tables(section):
        if not rows:
            continue
        columns = set(rows[0].keys())
        if all(column in columns for column in REQUIRED_LEDGER_COLUMNS):
            return rows, sorted(columns)
    return [], []


def _validate_standard(path: str, text: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    for marker in (
        "Status: canonical corpus intelligence classification standard",
        "## Three-Layer Model",
        "## Required Evidence Block",
        "Corpus Intelligence Classification Ledger",
        "DIRECT_CITED_ANSWER",
        "ESCALATE_OR_ABSTAIN",
        THIS_SCRIPT_PATH,
    ):
        if marker not in text:
            _add(violations, path, "standard_marker_missing", f"missing marker `{marker}`")
    return violations


def _validate_binding(path: str, text: str) -> list[dict[str, str]]:
    if has_binding_marker(path, THIS_SCRIPT_PATH, text):
        return []
    return [{"path": path, "type": "binding_missing", "message": f"must cite `{THIS_SCRIPT_PATH}`"}]


def _validate_output(path: str, text: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    if not _is_applicable_output(path, text):
        return violations
    if REQUIRED_SECTION not in text:
        _add(violations, path, "classification_section_missing", f"classification claim must include `{REQUIRED_SECTION}`")
        return violations

    section = _extract_section(text, REQUIRED_SECTION)
    for field in REQUIRED_BLOCK_FIELDS:
        if field not in section:
            _add(violations, path, "classification_field_missing", f"missing field `{field}`")

    response_boundary = _field_value(section, "Response Boundary:")
    for answer_class in ANSWER_CLASSES:
        if answer_class not in response_boundary:
            _add(violations, path, "answer_class_missing", f"response boundary must include `{answer_class}`")

    legal_policy = _field_value(section, "Legal/policy corpus:")
    domain_fields = _field_value(section, "Domain fields:")
    if legal_policy.upper().startswith("YES"):
        for field in LEGAL_DOMAIN_FIELDS:
            if field not in domain_fields:
                _add(violations, path, "legal_policy_domain_field_missing", f"legal/policy corpus requires `{field}`")

    rows, columns = _find_ledger_rows(section)
    if not rows:
        _add(
            violations,
            path,
            "classification_ledger_missing",
            "missing ledger table with required columns: " + ", ".join(REQUIRED_LEDGER_COLUMNS),
        )
        return violations

    for column in REQUIRED_LEDGER_COLUMNS:
        if column not in columns:
            _add(violations, path, "ledger_column_missing", f"missing ledger column `{column}`")

    for idx, row in enumerate(rows, start=1):
        status = row.get("processingStatus", "").strip()
        disposition = row.get("disposition", "").strip()
        evidence = row.get("evidencePointer", "").strip()
        answer_class = row.get("answerClass", "").strip()
        knowledge_region = row.get("knowledgeRegion", "").strip()
        domain = row.get("domainFields", "").strip()

        if status not in ALLOWED_PROCESSING_STATUSES:
            _add(violations, path, "processing_status_invalid", f"ledger row {idx} has invalid processingStatus `{status}`")
        if disposition not in ALLOWED_DISPOSITIONS:
            _add(violations, path, "disposition_invalid", f"ledger row {idx} has invalid disposition `{disposition}`")
        if disposition.startswith("ACCEPT") and _is_none_like(evidence):
            _add(violations, path, "accepted_without_evidence", f"ledger row {idx} accepted disposition requires evidencePointer")
        if status == "READ_SHALLOW" and answer_class == "DIRECT_CITED_ANSWER":
            _add(violations, path, "shallow_direct_answer_overclaim", f"ledger row {idx} uses READ_SHALLOW for direct answer")
        if legal_policy.upper().startswith("YES") or knowledge_region == "LEGAL_POLICY":
            if disposition.startswith("ACCEPT"):
                for field in LEGAL_DOMAIN_FIELDS:
                    if field not in domain and field not in domain_fields:
                        _add(violations, path, "row_legal_policy_domain_field_missing", f"ledger row {idx} requires `{field}`")

    return violations


def _validate_path(path: str) -> list[dict[str, str]]:
    full = REPO_ROOT / path
    if not full.exists() or full.is_dir():
        return []
    text = _read_rel(path)
    violations: list[dict[str, str]] = []
    if path == STANDARD_PATH:
        violations.extend(_validate_standard(path, text))
    if path in {AUTORUN_PATH, HOOK_CHAIN_PATH, CONTROL_MATRIX_PATH, MASTER_POLICY_PATH, KB_PATH}:
        violations.extend(_validate_binding(path, text))
    violations.extend(_validate_output(path, text))
    return violations


def _classify(changed_paths: dict[str, list[str]]) -> dict[str, Any]:
    required_paths = (
        STANDARD_PATH,
        GUARD_PATH,
        AUTORUN_PATH,
        HOOK_CHAIN_PATH,
        CONTROL_MATRIX_PATH,
        MASTER_POLICY_PATH,
        KB_PATH,
    )
    missing_files = [path for path in required_paths if not (REPO_ROOT / path).exists()]
    scoped_paths = set(changed_paths)
    scoped_paths.update(path for path in required_paths if (REPO_ROOT / path).exists())

    violations: list[dict[str, str]] = []
    for path in sorted(scoped_paths):
        statuses = changed_paths.get(path, [])
        if statuses and all(status.startswith("D") for status in statuses):
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
    print("=== CVF Corpus Intelligence Classification Gate ===")
    print(f"Range: {base}..{head} ({range_source})")
    print(f"Standard: {STANDARD_PATH}")
    print(f"Changed paths: {len(report['changedPaths'])}")
    print(f"Checked paths: {len(report['checkedPaths'])}")
    print(f"Missing files: {len(report['missingFiles'])}")
    print(f"Violations: {len(report['violations'])}")
    if report["missingFiles"]:
        print("\nMissing files:")
        for path in report["missingFiles"]:
            print(f"  - {path}")
    if report["violations"]:
        print("\nViolations:")
        for item in report["violations"]:
            print(f"  - {item['path']}: {item['type']} - {item['message']}")
    if report["compliant"]:
        print("\nCOMPLIANT - corpus intelligence classification structure is aligned.")
    else:
        print("\nVIOLATION - corpus intelligence classification structure is incomplete.")


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate corpus intelligence classification structure")
    parser.add_argument("--base", default=None, help="Optional git base ref")
    parser.add_argument("--head", default=None, help="Optional git head ref")
    parser.add_argument("--enforce", action="store_true", help="Return non-zero when violations exist")
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

    report["timestamp"] = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
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
