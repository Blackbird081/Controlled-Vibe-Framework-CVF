#!/usr/bin/env python3
"""
CVF Closure Packaging Preflight

Runs a small, early gate for recurring closure-packaging defects before the
full pre-closure bundle emits a long finding list. This checker is intentionally
structural: it proves closure packaging discipline, not semantic correctness.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
THIS_SCRIPT = "governance/compat/check_closure_packaging_preflight.py"
STANDARD_PATH = "docs/reference/CVF_WORK_ORDER_CLOSURE_QUALITY_GATE_STANDARD_2026-05-28.md"
AUTH_MARKER = "Core Guard Self-Protection Authorization"

ACTIVE_DOC_PREFIXES = (
    "docs/baselines/",
    "docs/work_orders/",
    "docs/reviews/",
    "docs/roadmaps/",
    "docs/audits/",
)
AUTH_DOC_PREFIXES = (
    "docs/baselines/",
    "docs/roadmaps/",
    "docs/reviews/",
    "docs/work_orders/",
)
ACTIVE_HANDOFF_AUTH_RE = re.compile(r"^AGENT_HANDOFF[^/]*\.md$")
PROTECTED_EXACT = {
    "AGENTS.md",
    "CLAUDE.md",
    "CVF_SESSION_MEMORY.md",
    "docs/CVF_CORE_KNOWLEDGE_BASE.md",
    "docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md",
    "governance/toolkit/02_POLICY/CVF_MASTER_POLICY.md",
    "governance/compat/run_agent_autorun_workflow_gate.py",
    "governance/compat/run_local_governance_hook_chain.py",
}

STALE_CLOSED_PATTERNS = (
    r"\bCOMPLETE_PENDING_GATES\b",
    r"\bREADY_FOR_OPERATOR_REVIEW\b",
    r"\bREADY_FOR_DISPATCH\b",
    r"\bDISPATCH_READY\b",
    r"\bNOT_EXECUTED_YET\b",
    r"\bPRE_CLOSURE_NOT_RUN\b",
    r"\bFAIL_EXPECTED_PENDING_FINALITY\b",
    r"\bdoes\s+not\s+dispatch\b",
    r"\bnot\s+dispatch(?:ed|able)?\b",
    r"\bHOLD\s+until\b",
)
PATH_RE = re.compile(
    r"`((?:docs|governance|EXTENSIONS|CVF_SESSION|scripts|sdk|\.github|\.private_reference)/[^`|)]+)`"
    r"|`((?:AGENTS\.md|CLAUDE\.md|CVF_SESSION_MEMORY\.md|AGENT_HANDOFF[^`|)]+\.md))`"
)
NA_LINE_RE = re.compile(r"(?im)^\s*[-|].{0,40}N/A\s+with\s+reason\b")
INLINE_CODE_RE = re.compile(r"`[^`\n]+`")


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
    """Remove code fences, inline-code spans, and N/A-with-reason lines before
    bare-keyword/status signal matching, so incidental trigger words quoted as
    evidence or describing another tranche do not count as real signal."""
    lines = text.splitlines()
    kept: list[str] = []
    for idx, line in enumerate(lines):
        if _is_in_code_fence(lines, idx):
            continue
        if NA_LINE_RE.match(line):
            continue
        kept.append(INLINE_CODE_RE.sub(" ", line))
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


def _get_changed(base: str | None, head: str | None) -> dict[str, set[str]]:
    changed: dict[str, set[str]] = {}
    if base and head:
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


def _extract_status(text: str) -> str:
    match = re.search(r"(?im)^Status:\s*(.+?)\s*$", text)
    return match.group(1).strip() if match else ""


def _is_closed_equivalent(text: str) -> bool:
    status = _extract_status(text).upper()
    if re.match(r"^CLOSED(?:\b|_)", status):
        return True
    signal_chunk = _strip_non_signal_text("\n".join(text.splitlines()[:80]))
    return "CLOSED_PASS" in signal_chunk.upper()


def _is_active_doc(path: str) -> bool:
    normalized = path.replace("\\", "/")
    return (
        normalized.endswith(".md")
        and "/archive/" not in normalized
        and any(normalized.startswith(prefix) for prefix in ACTIVE_DOC_PREFIXES)
    )


def _is_protected(path: str) -> bool:
    normalized = path.replace("\\", "/")
    if normalized in PROTECTED_EXACT:
        return True
    if normalized.startswith("governance/compat/") and normalized.endswith(".py"):
        return True
    if normalized.startswith("governance/toolkit/05_OPERATION/") and normalized.endswith("_GUARD.md"):
        return True
    if normalized.startswith("CVF_SESSION/") and normalized.endswith(".json"):
        return True
    return False


def _is_auth_doc_path(path: str) -> bool:
    normalized = path.replace("\\", "/")
    if not normalized.endswith(".md") or "/archive/" in normalized:
        return False
    if normalized.startswith(AUTH_DOC_PREFIXES):
        return True
    return bool(ACTIVE_HANDOFF_AUTH_RE.match(normalized))


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


def _extract_backtick_paths(text: str) -> set[str]:
    paths: set[str] = set()
    for match in PATH_RE.finditer(text):
        path = (match.group(1) or match.group(2) or "").replace("\\", "/").rstrip(".,;:")
        if path:
            paths.add(path)
    return paths


def _auth_docs(changed: dict[str, set[str]]) -> list[str]:
    docs: list[str] = []
    for path in sorted(changed):
        if _is_auth_doc_path(path):
            text = _read_rel(path)
            if AUTH_MARKER in text:
                docs.append(path)
    return docs


def _core_auth_complete(text: str, protected_paths: list[str]) -> bool:
    if AUTH_MARKER not in text:
        return False
    required_tokens = (
        "Authorized guard-maintenance scope",
        "Protected paths",
        "Operator authorization",
        "Rollback boundary",
    )
    if not all(token in text for token in required_tokens):
        return False
    return all(path in text for path in protected_paths)


def _validate_stale_closed_language(path: str, text: str) -> list[str]:
    if not _is_closed_equivalent(text):
        return []
    issues: list[str] = []
    signal_text = _strip_non_signal_text(text)
    matches = sorted(
        {
            match.group(0)
            for pattern in STALE_CLOSED_PATTERNS
            for match in re.finditer(pattern, signal_text, re.IGNORECASE)
        }
    )
    if matches:
        issues.append(
            "closed-equivalent artifact retains stale dispatch/hold/pre-closure language: "
            + ", ".join(matches)
        )
    return issues


def _validate_corpus_enumeration(text: str) -> list[str]:
    section = _extract_heading_section(text, "Corpus Completeness And Report Integrity")
    if not section:
        return []
    command_match = re.search(r"(?im)^\s*-\s*Enumeration command:\s*(.+?)\s*$", section)
    if not command_match:
        return []
    command = command_match.group(1).strip().strip("`")
    lowered = command.lower()
    if "git ls-files" in lowered or "git diff --name" in lowered or "git-listed" in lowered:
        return [
            "Corpus Completeness enumeration uses git-derived file listing; use filesystem-backed enumeration such as `rg --files --hidden --no-ignore ...`"
        ]
    if "rg --files" in lowered and ("--hidden" not in lowered or "--no-ignore" not in lowered):
        return [
            "Corpus Completeness enumeration uses `rg --files` without both `--hidden` and `--no-ignore`"
        ]
    return []


def _validate_diff_claim_paths(text: str, changed_files: set[str]) -> list[str]:
    sections = "\n".join(
        section
        for section in (
            _extract_heading_section(text, "Closure Diff Gate"),
            _extract_heading_section(text, "Changed Files"),
            _extract_heading_section(text, "Changed File"),
        )
        if section
    )
    if not sections:
        return []
    claimed_paths = _extract_backtick_paths(sections)
    overclaimed = sorted(
        path
        for path in claimed_paths
        if path not in changed_files and not any(changed.startswith(f"{path.rstrip('/')}/") for changed in changed_files)
    )
    if not overclaimed:
        return []
    return [
        "Closure diff/changed-file section cites path(s) not present in the changed range: "
        + ", ".join(overclaimed)
    ]


def _validate_exhaustive_directory_claims(text: str) -> list[str]:
    """Validate narrow, explicit `directory contains only file...` claims.

    This is intentionally not general prose fact checking. It fires only when
    one line contains the phrase `contains only`, a repo-local backtick-quoted
    directory, and one or more backtick-quoted direct-child filenames.
    """
    issues: list[str] = []
    for line_number, line in enumerate(text.splitlines(), start=1):
        if "contains only" not in line.lower():
            continue
        quoted = re.findall(r"`([^`]+)`", line)
        directory_token = next(
            (
                token.replace("\\", "/")
                for token in quoted
                if token.endswith(("/", "\\"))
            ),
            "",
        )
        claimed_files = {
            Path(token.replace("\\", "/")).name
            for token in quoted
            if "/" not in token.replace("\\", "/") and "." in token
        }
        if not directory_token or not claimed_files:
            continue
        directory = REPO_ROOT / directory_token.rstrip("/")
        if not directory.is_dir():
            issues.append(
                f"line {line_number}: exhaustive directory claim cites missing repo directory `{directory_token}`"
            )
            continue
        actual_files = {child.name for child in directory.iterdir() if child.is_file()}
        if actual_files != claimed_files:
            omitted = sorted(actual_files - claimed_files)
            extra = sorted(claimed_files - actual_files)
            details: list[str] = []
            if omitted:
                preview = ", ".join(omitted[:5])
                suffix = f" (+{len(omitted) - 5} more)" if len(omitted) > 5 else ""
                details.append(f"omits {preview}{suffix}")
            if extra:
                details.append("names absent child files " + ", ".join(extra))
            issues.append(
                f"line {line_number}: unsupported exhaustive directory claim for `{directory_token}`; "
                + "; ".join(details)
            )
    return issues


def _validate_decided_roadmap_residue(path: str, text: str) -> list[str]:
    if not path.replace("\\", "/").startswith("docs/roadmaps/"):
        return []
    status = _extract_status(text).upper()
    decided = sorted(set(re.findall(r"MPI_T(\d+)_DECIDED", status)))
    issues: list[str] = []
    for tranche in decided:
        if re.search(rf"\bMPI-T{tranche}\s+remains\s+parked\b", text, re.IGNORECASE):
            issues.append(
                f"roadmap status marks MPI-T{tranche} decided but body still says MPI-T{tranche} remains parked"
            )
    return issues


def validate_doc(path: str, text: str, changed_files: set[str]) -> list[str]:
    issues: list[str] = []
    if not _is_active_doc(path):
        return issues
    issues.extend(_validate_stale_closed_language(path, text))
    issues.extend(_validate_corpus_enumeration(text))
    issues.extend(_validate_exhaustive_directory_claims(text))
    issues.extend(_validate_decided_roadmap_residue(path, text))
    if _is_closed_equivalent(text):
        issues.extend(_validate_diff_claim_paths(text, changed_files))
    return issues


def _run_check(base: str | None, head: str | None) -> dict[str, Any]:
    changed = _get_changed(base, head)
    changed_files = set(sorted(changed))
    violations: list[dict[str, Any]] = []

    protected = sorted(path for path in changed_files if _is_protected(path))
    auth_docs = _auth_docs(changed)
    if protected and not any(_core_auth_complete(_read_rel(path), protected) for path in auth_docs):
        violations.append(
            {
                "path": "core-guard-closure-preflight",
                "issues": [
                    "protected guard/session files changed without a checker-recognized "
                    f"`{AUTH_MARKER}` artifact listing every protected path: "
                    + ", ".join(protected)
                ],
            }
        )

    for path in sorted(changed_files):
        text = _read_rel(path)
        if not text:
            continue
        issues = validate_doc(path, text, changed_files)
        if issues:
            violations.append({"path": path, "issues": issues})

    return {
        "policy": STANDARD_PATH,
        "script": THIS_SCRIPT,
        "changedFileCount": len(changed_files),
        "protectedFileCount": len(protected),
        "authorizationDocs": auth_docs,
        "violationCount": len(violations),
        "violations": violations,
        "compliant": not violations,
    }


def _print_report(report: dict[str, Any], base: str | None, head: str | None) -> None:
    print("=== CVF Closure Packaging Preflight ===")
    if base or head:
        print(f"Range: {base or '<worktree>'}..{head or '<worktree>'}")
    print(f"Policy: {report['policy']}")
    print(f"Changed files: {report['changedFileCount']}")
    print(f"Protected files changed: {report['protectedFileCount']}")
    print(f"Violations: {report['violationCount']}")
    if report["authorizationDocs"]:
        print("\nAuthorization docs:")
        for path in report["authorizationDocs"]:
            print(f"  - {path}")
    if report["violations"]:
        print("\nViolations:")
        for violation in report["violations"]:
            print(f"  - {violation['path']}")
            for issue in violation["issues"]:
                print(f"    - {issue}")
    if report["compliant"]:
        print("\nCOMPLIANT - closure packaging preflight is clean.")
    else:
        print("\nVIOLATION - repair closure packaging before running/claiming full pre-closure.")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="Run CVF closure packaging preflight")
    parser.add_argument("--base", default=None)
    parser.add_argument("--head", default=None)
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args()

    try:
        report = _run_check(args.base, args.head)
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 2

    if args.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        _print_report(report, args.base, args.head)
    return 1 if args.enforce and not report["compliant"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
