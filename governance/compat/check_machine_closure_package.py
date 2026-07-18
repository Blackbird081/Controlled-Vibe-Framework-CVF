#!/usr/bin/env python3
"""
CVF Machine Closure Package Checker

Validates that newly changed closed-equivalent governed artifacts expose the
Machine Closure Package required by the closure-quality standard. This checker
proves closure discipline only; it does not prove semantic correctness.

Standard: docs/reference/CVF_WORK_ORDER_CLOSURE_QUALITY_GATE_STANDARD_2026-05-28.md
"""

from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_BASE_CANDIDATES = ("origin/main", "origin/master", "main", "master")
STANDARD_PATH = "docs/reference/CVF_WORK_ORDER_CLOSURE_QUALITY_GATE_STANDARD_2026-05-28.md"
THIS_SCRIPT_PATH = "governance/compat/check_machine_closure_package.py"

ACTIVE_PREFIXES = (
    "docs/baselines/",
    "docs/work_orders/",
    "docs/reviews/",
    "docs/roadmaps/",
    "docs/audits/",
)
ARCHIVE_MARKER = "/archive/"

REQUIRED_CLOSURE_ITEMS = (
    "Work order status",
    "Completion or reviewer artifact",
    "Roadmap state",
    "Registry JSON",
    "Registry Markdown",
    "External evidence digest",
    "System loop interlock",
    "Session continuity",
)
REQUIRED_COLUMNS = (
    "Closure item",
    "Required artifact/path",
    "Machine-readable evidence",
    "Final status",
)
ALLOWED_FINAL_STATUS_RE = re.compile(
    r"^(PASS|BLOCKED|N/A\s+with\s+reason)\b",
    re.IGNORECASE,
)
PLACEHOLDER_STATUS_RE = re.compile(
    r"\b(DISPATCH_READY|READY_WITH_CONDITIONS|NOT_EXECUTED_YET|PRE_CLOSURE_NOT_RUN|FAIL_EXPECTED_PENDING_FINALITY)\b",
    re.IGNORECASE,
)
CORPUS_SIGNAL_RE = re.compile(
    r"\b(GC-051|corpus|classification|readiness|search/filter|search layer|scan registry|PolicyLocal|Policy_Local|LPCI|CI[0-9])\b",
    re.IGNORECASE,
)
EXTERNAL_PATH_RE = re.compile(
    r"(?i)(?:[A-Z]:\\|[A-Z]:/|\\\\|/Users/|/home/|/mnt/)"
)
INVALID_DEFECT_CLASS_RE = re.compile(r"\bEVIDENCE_GAP\b")
ROADMAP_REF_RE = re.compile(r"`?(docs/roadmaps/[^`\s|)]+\.md)`?")
ROADMAP_ABSENCE_RE = re.compile(
    r"\b(no\s+dedicated|no\s+active|no\s+roadmap|standalone\s+work\s+order)\b",
    re.IGNORECASE,
)
RECEIPT_ACCEPTANCE_RE = re.compile(
    r"\b(receipt|query receipts?|acceptance quer(?:y|ies)|selectedCandidateIds|freshnessDisclosureApplied)\b",
    re.IGNORECASE,
)
EXTERNAL_EVIDENCE_SIGNAL_RE = re.compile(
    r"\b(CVF-Workspace|not git-tracked|external artifacts?|external evidence|external path)\b",
    re.IGNORECASE,
)
SHA256_RE = re.compile(r"\b(?:sha256:)?[0-9a-f]{64}\b", re.IGNORECASE)
NA_LINE_RE = re.compile(r"(?im)^\s*[-|].{0,40}N/A\s+with\s+reason\b")
CITED_PATH_RE = re.compile(r"`[^`\n]+`")


def _is_in_code_fence(lines: list[str], target_idx: int) -> bool:
    """Return True if the line at target_idx is inside a markdown code fence."""
    fence_count = 0
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("```") or stripped.startswith("~~~"):
            fence_count += 1
        if i == target_idx:
            break
    return (fence_count % 2) == 1


def _strip_non_signal_text(text: str) -> str:
    """Remove code fences, cited-path spans, and N/A-with-reason lines before
    bare-keyword signal matching, so incidental trigger words in those
    contexts do not count as real applicability signal."""
    lines = text.splitlines()
    kept: list[str] = []
    for idx, line in enumerate(lines):
        if _is_in_code_fence(lines, idx):
            continue
        if NA_LINE_RE.match(line):
            continue
        kept.append(CITED_PATH_RE.sub(" ", line))
    return "\n".join(kept)


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


def _parse_name_status(output: str) -> dict[str, set[str]]:
    changed: dict[str, set[str]] = {}
    for raw in output.splitlines():
        parts = raw.split("\t")
        if len(parts) < 2:
            continue
        status = parts[0].strip()
        path = parts[2] if status.startswith(("R", "C")) and len(parts) > 2 else parts[1]
        normalized = path.replace("\\", "/").strip()
        if normalized:
            changed.setdefault(normalized, set()).add(status)
    return changed


def _merge_status(target: dict[str, set[str]], source: dict[str, set[str]]) -> None:
    for path, statuses in source.items():
        target.setdefault(path, set()).update(statuses)


def _get_changed(base: str, head: str) -> dict[str, set[str]]:
    changed: dict[str, set[str]] = {}
    code, out, err = _run_git(["diff", "--name-status", f"{base}..{head}"])
    if code != 0:
        raise RuntimeError(f"git diff failed for range {base}..{head}: {err or out}")
    _merge_status(changed, _parse_name_status(out))

    for args in (["diff", "--name-status"], ["diff", "--name-status", "--cached"]):
        code, out, _ = _run_git(args)
        if code == 0 and out:
            _merge_status(changed, _parse_name_status(out))

    code, out, _ = _run_git(["ls-files", "--others", "--exclude-standard"])
    if code == 0 and out:
        for raw in out.splitlines():
            path = raw.replace("\\", "/").strip()
            if path:
                changed.setdefault(path, set()).add("A")
    return changed


def _read_rel(path: str) -> str:
    full = REPO_ROOT / path
    if not full.exists() or full.is_dir():
        return ""
    return full.read_text(encoding="utf-8", errors="replace")


def _is_active_governed_doc(path: str) -> bool:
    normalized = path.replace("\\", "/")
    return (
        normalized.endswith(".md")
        and ARCHIVE_MARKER not in normalized
        and any(normalized.startswith(prefix) for prefix in ACTIVE_PREFIXES)
    )


def _extract_status(text: str) -> str:
    match = re.search(r"(?im)^Status:\s*(.+?)\s*$", text)
    return match.group(1).strip() if match else ""


def _is_closed_equivalent(path: str, text: str) -> bool:
    status = _extract_status(text).upper()
    if re.match(r"^CLOSED(?:\b|_)", status):
        return True
    first_chunk = "\n".join(text.splitlines()[:80]).upper()
    filename = path.rsplit("/", 1)[-1].upper()
    return "CLOSED_PASS" in first_chunk or "CLOSED_PASS" in filename


def _extract_heading_section(text: str, heading_fragment: str) -> str:
    lines = text.splitlines()
    start: int | None = None
    needle = heading_fragment.lower()
    for idx, line in enumerate(lines):
        stripped = line.strip().lower()
        if stripped.startswith("#") and needle in stripped:
            start = idx + 1
            break
    if start is None:
        return ""
    end = len(lines)
    for idx in range(start, len(lines)):
        if lines[idx].startswith("#"):
            end = idx
            break
    return "\n".join(lines[start:end])


def _parse_markdown_tables(text: str) -> list[list[dict[str, str]]]:
    tables: list[list[dict[str, str]]] = []
    lines = text.splitlines()
    index = 0
    while index < len(lines) - 1:
        header = lines[index].strip()
        separator = lines[index + 1].strip()
        if not (header.startswith("|") and header.endswith("|") and separator.startswith("|") and "---" in separator):
            index += 1
            continue
        columns = [part.strip() for part in header.strip("|").split("|")]
        rows: list[dict[str, str]] = []
        index += 2
        while index < len(lines):
            row_line = lines[index].strip()
            if not (row_line.startswith("|") and row_line.endswith("|")):
                break
            values = [part.strip() for part in row_line.strip("|").split("|")]
            rows.append({
                columns[pos]: values[pos] if pos < len(values) else ""
                for pos in range(len(columns))
            })
            index += 1
        if rows:
            tables.append(rows)
    return tables


def _find_machine_closure_table(section: str) -> list[dict[str, str]] | None:
    for table in _parse_markdown_tables(section):
        columns = set(table[0].keys()) if table else set()
        if set(REQUIRED_COLUMNS).issubset(columns):
            return table
    return None


def _clean(value: str) -> str:
    return value.strip().strip("`").strip()


def _row_by_item(table: list[dict[str, str]]) -> dict[str, dict[str, str]]:
    rows: dict[str, dict[str, str]] = {}
    for row in table:
        item = _clean(row.get("Closure item", ""))
        if item:
            rows[item.lower()] = row
    return rows


def _is_na_with_reason(value: str) -> bool:
    return bool(re.match(r"^N/A\s+with\s+reason\b", _clean(value), re.IGNORECASE))


def _is_pass(value: str) -> bool:
    return _clean(value).upper().startswith("PASS")


def _has_heading(text: str, heading_fragment: str) -> bool:
    return bool(_extract_heading_section(text, heading_fragment))


def _source_verification_has_external_path(text: str) -> bool:
    section = _extract_heading_section(text, "Source Verification")
    return bool(section and EXTERNAL_PATH_RE.search(section))


def validate_machine_closure_package(path: str, text: str) -> list[str]:
    """Return validation issues for one changed markdown artifact."""
    issues: list[str] = []
    if not _is_active_governed_doc(path) or not _is_closed_equivalent(path, text):
        return issues

    if _source_verification_has_external_path(text):
        issues.append(
            "Source Verification contains external/local filesystem path; use a repo-local External Evidence Digest instead"
        )

    if INVALID_DEFECT_CLASS_RE.search(text):
        issues.append("invalid Finding-To-Governance defect class `EVIDENCE_GAP`; use a checker-accepted defect class")

    section = _extract_heading_section(text, "Machine Closure Package")
    if not section:
        issues.append("closed-equivalent artifact is missing `Machine Closure Package` section")
        return issues

    table = _find_machine_closure_table(section)
    if table is None:
        issues.append(
            "Machine Closure Package is missing a table with columns: "
            + ", ".join(REQUIRED_COLUMNS)
        )
        return issues

    rows = _row_by_item(table)
    for item in REQUIRED_CLOSURE_ITEMS:
        row = rows.get(item.lower())
        if row is None:
            issues.append(f"Machine Closure Package missing row `{item}`")
            continue
        final_status = _clean(row.get("Final status", ""))
        if not ALLOWED_FINAL_STATUS_RE.match(final_status):
            issues.append(
                f"Machine Closure Package row `{item}` has invalid Final status `{final_status}`; "
                "use PASS, BLOCKED, or N/A with reason"
            )
        if PLACEHOLDER_STATUS_RE.search(final_status):
            issues.append(f"Machine Closure Package row `{item}` retains stale placeholder status `{final_status}`")

    if CORPUS_SIGNAL_RE.search(_strip_non_signal_text(text)):
        for item in ("Registry JSON", "Registry Markdown"):
            row = rows.get(item.lower())
            if row is None:
                continue
            final_status = _clean(row.get("Final status", ""))
            if _is_na_with_reason(final_status):
                issues.append(
                    f"corpus/search/classification closure cannot mark `{item}` as N/A; "
                    "update GC-051 registry surfaces or set BLOCKED with reason"
                )
            if not (_is_pass(final_status) or final_status.upper().startswith("BLOCKED")):
                issues.append(
                    f"corpus/search/classification closure row `{item}` must be PASS or BLOCKED with reason"
                )

    roadmap_refs = sorted(set(ROADMAP_REF_RE.findall(text)))
    roadmap_row = rows.get("roadmap state")
    if roadmap_refs and roadmap_row is not None:
        roadmap_final_status = _clean(roadmap_row.get("Final status", ""))
        roadmap_row_text = " ".join(roadmap_row.values())
        if _is_na_with_reason(roadmap_final_status) or ROADMAP_ABSENCE_RE.search(roadmap_row_text):
            issues.append(
                "Machine Closure Package row `Roadmap state` cannot claim N/A/no roadmap "
                f"when the artifact cites roadmap path(s): {', '.join(roadmap_refs)}"
            )

    if RECEIPT_ACCEPTANCE_RE.search(text) and not _has_heading(text, "Acceptance Receipt Assertion Matrix"):
        issues.append(
            "receipt/query acceptance closure must include an `Acceptance Receipt Assertion Matrix` "
            "that records required value, observed value, and status"
        )

    external_row = rows.get("external evidence digest")
    if external_row is not None and _is_pass(external_row.get("Final status", "")):
        external_text = " ".join(external_row.values())
        external_manifest = _extract_heading_section(text, "External Artifact Hash Manifest")
        if EXTERNAL_EVIDENCE_SIGNAL_RE.search(external_text + "\n" + external_manifest):
            if not SHA256_RE.search(external_text + "\n" + external_manifest):
                issues.append(
                    "Machine Closure Package row `External evidence digest` is PASS for external evidence "
                    "but lacks a sha256 hash in the row or External Artifact Hash Manifest"
                )

    return issues


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate CVF Machine Closure Package discipline")
    parser.add_argument("--base", default=None)
    parser.add_argument("--head", default=None)
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args()

    base, head, source = _resolve_range(args.base, args.head)
    try:
        changed = _get_changed(base, head)
    except RuntimeError as exc:
        print(f"ERROR: {exc}")
        return 2

    checked: list[str] = []
    violations: dict[str, list[str]] = {}
    for path, statuses in sorted(changed.items()):
        if "D" in statuses or not _is_active_governed_doc(path):
            continue
        text = _read_rel(path)
        if not text:
            continue
        if not _is_closed_equivalent(path, text):
            continue
        checked.append(path)
        issues = validate_machine_closure_package(path, text)
        if issues:
            violations[path] = issues

    print("=== CVF Machine Closure Package Gate ===")
    print(f"Range: {base}..{head}")
    print(f"Base source: {source}")
    print(f"Standard: {STANDARD_PATH}")
    print(f"Files checked: {len(checked)}")
    print(f"Violations: {sum(len(v) for v in violations.values())}")

    if checked:
        print("\nChecked files:")
        for path in checked:
            print(f"  - {path}")
    else:
        print("\nNo changed closed-equivalent governed artifacts required Machine Closure Package validation.")

    if violations:
        print("\nViolations:")
        for path, items in violations.items():
            print(f"  - {path}")
            for item in items:
                print(f"    - {item}")
        if args.enforce:
            print("\nVIOLATION - machine closure package evidence is incomplete.")
            return 1
        print("\nADVISORY - machine closure package evidence has issues.")
        return 0

    print("\nCOMPLIANT - machine closure package evidence is aligned.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
