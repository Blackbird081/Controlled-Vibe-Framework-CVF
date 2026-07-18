#!/usr/bin/env python3
"""
CVF ADIF defect registry disclosure guard.

A changed GC-018 baseline or work order must disclose that the dispatching
agent queried the ADIF defect registry (``run_adif_defect_resolver.py``) for
its own task class / role / lifecycle phase and listed every returned
defectId in an ``## ADIF Defect Registry Disclosure`` section. This closes
the gap where the registry exists but no agent is forced to read it: a
provider that never queries the resolver, or queries it and silently drops
the result, fails this gate before dispatch.

This guard does not claim the dispatching agent understood or applied any
listed defect's remediation; it only verifies the disclosure is present and
matches what the resolver actually returns for the declared query.
"""

from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "governance" / "compat"))

import run_adif_defect_resolver as resolver  # noqa: E402

DEFAULT_BASE_CANDIDATES = ("origin/main", "origin/master", "main", "master")
GOVERNED_PREFIXES = (
    "docs/baselines/",
    "docs/work_orders/",
)
DISPATCH_PATH_MARKERS = ("GC018_", "WORK_ORDER_")

REQUIRED_SECTION = "## ADIF Defect Registry Disclosure"
NEXT_SECTION_PATTERN = re.compile(r"^##\s+.+$", re.MULTILINE)
SECTION_HEADING_PATTERN = re.compile(
    r"^##\s+ADIF Defect Registry Disclosure\s*$", re.MULTILINE
)

QUERY_LINE_PATTERN = re.compile(
    r"Resolver query:\s*taskClass=`([^`]*)`,\s*role=`([^`]*)`,\s*lifecyclePhase=`([^`]*)`",
)
RETURNED_NONE_MARKER = "Returned defects: NONE_RETURNED"
DEFECT_ID_PATTERN = re.compile(r"\bADIF-\d{4}\b")


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


def _discover_default_base(head: str) -> str:
    env_base = os.getenv("CVF_COMPAT_BASE")
    if env_base:
        return env_base
    for ref in DEFAULT_BASE_CANDIDATES:
        if not _ref_exists(ref):
            continue
        code, out, _ = _run_git(["merge-base", ref, head])
        if code == 0 and out:
            return out
    return "HEAD~1"


def _is_governed_markdown_path(path: str) -> bool:
    normalized = path.replace("\\", "/").strip()
    return (
        normalized.endswith(".md")
        and normalized.startswith(GOVERNED_PREFIXES)
        and "/archive/" not in normalized
    )


def _add_changed_path(changed: list[str], path: str) -> None:
    normalized = path.replace("\\", "/").strip()
    if _is_governed_markdown_path(normalized) and normalized not in changed:
        changed.append(normalized)


def _get_changed_paths(base: str, head: str) -> list[str]:
    changed: list[str] = []

    if base != head:
        code, out, _ = _run_git(["diff", "--name-status", f"{base}..{head}"])
        if code == 0:
            for line in out.splitlines():
                parts = line.split("\t")
                if len(parts) < 2:
                    continue
                status = parts[0].strip()
                path = parts[2] if status.startswith(("R", "C")) and len(parts) > 2 else parts[1]
                _add_changed_path(changed, path)

    for args in (["diff", "--name-status"], ["diff", "--name-status", "--cached"]):
        code, out, _ = _run_git(args)
        if code != 0 or not out:
            continue
        for line in out.splitlines():
            parts = line.split("\t")
            if len(parts) < 2:
                continue
            status = parts[0].strip()
            path = parts[2] if status.startswith(("R", "C")) and len(parts) > 2 else parts[1]
            _add_changed_path(changed, path)

    code, out, _ = _run_git(["ls-files", "--others", "--exclude-standard"])
    if code == 0 and out:
        for line in out.splitlines():
            _add_changed_path(changed, line)

    return changed


def _read_file(path: str) -> str:
    full = REPO_ROOT / path
    if not full.is_file():
        return ""
    return full.read_text(encoding="utf-8", errors="replace")


def _is_applicable(path: str) -> bool:
    upper_path = path.replace("\\", "/").upper()
    return any(marker in upper_path for marker in DISPATCH_PATH_MARKERS)


def _extract_required_section(text: str) -> str:
    match = SECTION_HEADING_PATTERN.search(text)
    if not match:
        return ""
    rest = text[match.end():]
    next_match = NEXT_SECTION_PATTERN.search(rest)
    return rest[: next_match.start()] if next_match else rest


def _expected_defect_ids(task_class: str, role: str, lifecycle_phase: str) -> set[str]:
    entries = resolver.load_entries()
    packet = resolver.resolve_defect_packet(
        task_class=task_class,
        role=role,
        lifecycle_phase=lifecycle_phase,
        entries=entries,
    )
    return {item.defect_id for item in packet.items}


def check_file(path: str, text: str) -> list[str]:
    violations: list[str] = []
    if REQUIRED_SECTION not in text:
        violations.append(
            f"missing required `{REQUIRED_SECTION}` section before dispatch"
        )
        return violations

    section = _extract_required_section(text)
    query_match = QUERY_LINE_PATTERN.search(section)
    if not query_match:
        violations.append(
            "missing `Resolver query: taskClass=`...`, role=`...`, "
            "lifecyclePhase=`...`` line in the ADIF Defect Registry "
            "Disclosure section"
        )
        return violations

    task_class, role, lifecycle_phase = (g.strip() for g in query_match.groups())
    expected_ids = _expected_defect_ids(task_class, role, lifecycle_phase)
    listed_ids = set(DEFECT_ID_PATTERN.findall(section))

    if not expected_ids:
        if RETURNED_NONE_MARKER not in section and not listed_ids:
            violations.append(
                "resolver query returned zero entries; disclosure section "
                f"must state `{RETURNED_NONE_MARKER}`"
            )
        return violations

    missing = expected_ids - listed_ids
    if missing:
        violations.append(
            "disclosure section omits defectId(s) the resolver actually "
            f"returned for this query: {', '.join(sorted(missing))}"
        )
    return violations


def run(base: str, head: str) -> tuple[list[str], list[str]]:
    changed = [p for p in _get_changed_paths(base, head) if _is_applicable(p)]
    violations: list[str] = []
    for path in sorted(changed):
        text = _read_file(path)
        if not text:
            continue
        for message in check_file(path, text):
            violations.append(f"{path}: {message}")
    return changed, violations


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Check ADIF defect registry disclosure in GC-018/work-order dispatch artifacts."
    )
    parser.add_argument("--base", default=None)
    parser.add_argument("--head", default="HEAD")
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args()

    head = args.head
    base = args.base or _discover_default_base(head)

    print("=== CVF ADIF Defect Registry Disclosure Gate ===")
    print(f"Range: {base}..{head}")

    changed, violations = run(base, head)
    print(f"Checked dispatch artifacts: {len(changed)}")
    for path in changed:
        print(f"  - {path}")

    if violations:
        print("\nViolations:")
        for message in violations:
            print(f"  - {message}")
        print(
            "\nVIOLATION - query the ADIF defect registry and disclose the "
            "result before dispatch."
        )
        return 1 if args.enforce else 0

    print("\nCOMPLIANT - ADIF defect registry disclosure is present and accurate.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
