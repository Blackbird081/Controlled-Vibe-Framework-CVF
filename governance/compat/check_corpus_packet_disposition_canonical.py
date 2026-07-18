#!/usr/bin/env python3
"""
CVF Corpus Packet Disposition Canonical Gate (NR-11)

Validates that corpus intelligence readiness packet classification ledger rows
using DEFER or ACCEPT_SUMMARY_ONLY disposition carry a dispositionAlias field
pointing to the canonical cross-packet merge value ACCEPT_DEFERRED, and that
rawDisposition is preserved when a canonical alias is emitted. Does not assess
whether deferred state is semantically correct.

Standard: docs/reference/CVF_CORPUS_INTELLIGENCE_CLASSIFICATION_STANDARD_2026-06-01.md
          (Canonical Disposition Merge Rule, NR-11)
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_BASE_CANDIDATES = ("origin/main", "origin/master", "main", "master")

CLASSIFICATION_STANDARD_PATH = (
    "docs/reference/CVF_CORPUS_INTELLIGENCE_CLASSIFICATION_STANDARD_2026-06-01.md"
)
THIS_SCRIPT_PATH = "governance/compat/check_corpus_packet_disposition_canonical.py"
ARCHIVE_MARKER = "/archive/"
APPLICABLE_PREFIXES = ("docs/audits/", "docs/reviews/")

CLASSIFICATION_SECTION_LOWER = "## corpus intelligence classification"
CLASSIFICATION_TASK_MARKER = "classification task class:"
PACKET_MARKER = "corpus intelligence readiness packet"

# Dispositions that require a canonical alias per NR-11
DEFERRED_DISPOSITIONS = {"DEFER", "ACCEPT_SUMMARY_ONLY"}
CANONICAL_ALIAS = "ACCEPT_DEFERRED"

# Columns required for a table to be a classification ledger
_CL_REQUIRED = {"sourcePath", "disposition"}
_CL_SPECIFIC = {"processingStatus", "knowledgeRegion", "ownerSurface", "evidencePointer"}


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
            norm = raw_line.replace("\\", "/").strip()
            if norm:
                changed.setdefault(norm, set()).add("A")
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
    norm = path.replace("\\", "/")
    if not norm.endswith(".md") or ARCHIVE_MARKER in norm:
        return False
    if not any(norm.startswith(prefix) for prefix in APPLICABLE_PREFIXES):
        return False
    lower = text.lower()
    if "doctype: review" in lower or "doctype:review" in lower:
        return False
    filename = norm.rsplit("/", 1)[-1].upper()
    # Readiness packets may be docType: audit or legacy/bounded baseline docs
    # whose filename carries the readiness-packet contract.
    return (
        "doctype: audit" in lower
        or "doctype:audit" in lower
        or "READINESS_PACKET" in filename
    )


def _parse_markdown_tables(text: str) -> list[list[dict[str, str]]]:
    tables: list[list[dict[str, str]]] = []
    lines = text.splitlines()
    index = 0
    while index < len(lines) - 1:
        line = lines[index].strip()
        sep = lines[index + 1].strip()
        if not (line.startswith("|") and line.endswith("|") and sep.startswith("|") and "---" in sep):
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
            rows.append({
                headers[pos]: values[pos] if pos < len(values) else ""
                for pos in range(len(headers))
            })
            index += 1
        if rows:
            tables.append(rows)
    return tables


def _find_classification_ledger_tables(text: str) -> list[list[dict[str, str]]]:
    """Return tables that look like GC-050 classification ledgers."""
    result = []
    for table in _parse_markdown_tables(text):
        if not table:
            continue
        cols = set(table[0].keys())
        if _CL_REQUIRED.issubset(cols) and _CL_SPECIFIC.intersection(cols):
            result.append(table)
    return result


def _strip_val(val: str) -> str:
    return val.strip().strip("`").strip()


def validate_disposition_canonical(path: str, text: str) -> list[dict[str, str]]:
    """Validate NR-11 disposition canonical discipline in a readiness packet.

    Public interface for tests.
    """
    violations: list[dict[str, str]] = []
    ledger_tables = _find_classification_ledger_tables(text)
    if not ledger_tables:
        return violations

    for table in ledger_tables:
        cols = set(table[0].keys())
        has_alias_col = "dispositionAlias" in cols
        has_raw_col = "rawDisposition" in cols

        for idx, row in enumerate(table, start=1):
            disposition = _strip_val(row.get("disposition", ""))
            alias = _strip_val(row.get("dispositionAlias", "")) if has_alias_col else ""
            raw = _strip_val(row.get("rawDisposition", "")) if has_raw_col else ""
            sp = row.get("sourcePath", "?")

            if disposition in DEFERRED_DISPOSITIONS:
                if not has_alias_col:
                    _add(
                        violations, path, "disposition_alias_column_missing",
                        f"row {idx} (sourcePath={sp!r}) uses disposition={disposition!r} but "
                        "the classification ledger has no dispositionAlias column; "
                        "NR-11 requires dispositionAlias: ACCEPT_DEFERRED for deferred rows",
                    )
                elif alias != CANONICAL_ALIAS:
                    _add(
                        violations, path, "disposition_alias_wrong_value",
                        f"row {idx} (sourcePath={sp!r}) disposition={disposition!r} "
                        f"but dispositionAlias={alias!r}; expected {CANONICAL_ALIAS!r} per NR-11",
                    )
                # When alias is correct, rawDisposition must also be present
                if has_alias_col and alias == CANONICAL_ALIAS:
                    if not has_raw_col:
                        _add(
                            violations, path, "raw_disposition_column_missing",
                            f"row {idx} (sourcePath={sp!r}) has dispositionAlias: {CANONICAL_ALIAS} "
                            "but the ledger has no rawDisposition column; "
                            "NR-11 requires rawDisposition to preserve the original value",
                        )
                    elif not raw or raw.lower() in {"", "n/a", "none", "-"}:
                        _add(
                            violations, path, "raw_disposition_empty",
                            f"row {idx} (sourcePath={sp!r}) has dispositionAlias: {CANONICAL_ALIAS} "
                            "but rawDisposition is empty; must preserve the original disposition value",
                        )

            # Validate correctness when alias is present for non-deferred dispositions too
            elif has_alias_col and alias and alias != CANONICAL_ALIAS:
                _add(
                    violations, path, "disposition_alias_wrong_value",
                    f"row {idx} (sourcePath={sp!r}) disposition={disposition!r} "
                    f"but dispositionAlias={alias!r}; only {CANONICAL_ALIAS!r} is a valid alias per NR-11",
                )

    return violations


def _validate_path(path: str) -> list[dict[str, str]]:
    full = REPO_ROOT / path
    if not full.exists() or full.is_dir():
        return []
    text = _read_rel(path)
    if not _is_applicable(path, text):
        return []
    return validate_disposition_canonical(path, text)


def _classify(changed_paths: dict[str, list[str]]) -> dict[str, Any]:
    violations: list[dict[str, str]] = []
    checked: list[str] = []
    for path, statuses in sorted(changed_paths.items()):
        if all(s.startswith("D") for s in statuses):
            continue
        full = REPO_ROOT / path
        if not full.exists() or full.is_dir():
            continue
        text = _read_rel(path)
        if not _is_applicable(path, text):
            continue
        checked.append(path)
        violations.extend(validate_disposition_canonical(path, text))
    return {
        "checkedPaths": checked,
        "changedPaths": dict(changed_paths),
        "violations": violations,
        "violationCount": len(violations),
        "compliant": not violations,
    }


def _print_report(report: dict[str, Any], base: str, head: str, range_source: str) -> None:
    print("=== CVF Corpus Packet Disposition Canonical Gate (NR-11) ===")
    print(f"Range: {base}..{head} ({range_source})")
    print(f"Standard: {CLASSIFICATION_STANDARD_PATH}")
    print(f"Changed paths evaluated: {len(report['changedPaths'])}")
    print(f"Applicable readiness packets checked: {len(report['checkedPaths'])}")
    print(f"Violations: {report['violationCount']}")
    if report["violations"]:
        print("\nViolations:")
        for item in report["violations"]:
            print(f"  - {item['path']}: {item['type']} - {item['message']}")
    if report["compliant"]:
        print("\nCOMPLIANT - corpus packet disposition canonical discipline satisfied.")
    else:
        print("\nVIOLATION - corpus packet disposition canonical discipline incomplete.")


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate corpus packet disposition canonical (NR-11)")
    parser.add_argument("--base", default=None, help="Optional git base ref")
    parser.add_argument("--head", default=None, help="Optional git head ref")
    parser.add_argument("--enforce", action="store_true", help="Return non-zero when violations exist")
    parser.add_argument("--json", action="store_true", help="Print JSON report")
    args = parser.parse_args()
    try:
        base, head, range_source = _resolve_range(args.base, args.head)
        changed = _merge_changed_maps(
            _get_changed_name_status(base, head),
            _get_worktree_name_status(),
        )
        report = _classify(changed)
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
