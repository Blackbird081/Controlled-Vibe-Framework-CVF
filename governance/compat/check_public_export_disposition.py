#!/usr/bin/env python3
"""
CVF Public Export Disposition Gate

Requires changed active roadmap closures and final wave completion packets to
state whether the work was exported to public-sync, deferred as private-only, or
blocked because public artifacts are missing.
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
STANDARD_PATH = "docs/reference/CVF_PUBLIC_EXPORT_DISPOSITION_STANDARD_2026-05-30.md"
THIS_SCRIPT_PATH = "governance/compat/check_public_export_disposition.py"
AUTORUN_PATH = "governance/compat/run_agent_autorun_workflow_gate.py"
HOOK_CHAIN_PATH = "governance/compat/run_local_governance_hook_chain.py"
AGENTS_PATH = "AGENTS.md"
DEFAULT_BASE_CANDIDATES = ("origin/main", "origin/master", "main", "master")

REQUIRED_SECTION = "## Public Export Disposition"
ALLOWED_DISPOSITIONS = (
    "EXPORTED",
    "DEFERRED_PRIVATE_ONLY",
    "BLOCKED_MISSING_PUBLIC_ARTIFACTS",
)
ARCHIVE_MARKER = "/archive/"
CLOSED_RE = re.compile(r"\b(CLOSED|CLOSED_PASS|CLOSED_PASS_BOUNDED)\b")
WAVE_COMPLETE_MARKERS = (
    "wave complete",
    "wave is complete",
    "wave fully closed",
    "all closed_pass",
    "all closed_pass_bounded",
    "all three",
)
PUBLIC_CLAIM_MARKERS = (
    "public catalog",
    "public-sync",
    "public sync",
    "public-facing",
    "public readiness",
    "public release readiness",
)


def _run_git(args: list[str]) -> tuple[int, str, str]:
    proc = subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        text=True,
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
    return (REPO_ROOT / path).read_text(encoding="utf-8")


def _read_rel_at(ref: str, path: str) -> str:
    normalized = path.replace("\\", "/")
    code, out, _ = _run_git(["show", f"{ref}:{normalized}"])
    return out if code == 0 else ""


def _add(violations: list[dict[str, str]], path: str, issue_type: str, message: str) -> None:
    violations.append({"path": path, "type": issue_type, "message": message})


def _has_any(text: str, markers: tuple[str, ...]) -> bool:
    lowered = text.lower()
    return any(marker in lowered for marker in markers)


def _is_active_markdown(path: str) -> bool:
    normalized = path.replace("\\", "/")
    return normalized.endswith(".md") and ARCHIVE_MARKER not in normalized


def _is_closure_target(path: str, text: str) -> bool:
    normalized = path.replace("\\", "/")
    if not _is_active_markdown(normalized) or not CLOSED_RE.search(text):
        return False
    lowered = text.lower()
    if normalized.startswith("docs/roadmaps/"):
        return True
    if normalized.startswith("docs/reviews/"):
        name = Path(normalized).name.upper()
        is_final_packet = "COMPLETION" in name or "CLOSURE" in name
        return is_final_packet and any(marker in lowered for marker in WAVE_COMPLETE_MARKERS)
    if normalized.startswith("docs/logs/"):
        return _has_any(text, PUBLIC_CLAIM_MARKERS)
    return False


def _extract_section(text: str, header: str) -> str:
    marker = f"{header}\n"
    start = text.find(marker)
    if start == -1:
        return ""
    section_start = start + len(marker)
    next_header = text.find("\n## ", section_start)
    if next_header == -1:
        return text[section_start:]
    return text[section_start:next_header]


def _validate_standard(path: str, text: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    required = (
        "Status: canonical and machine-enforced public export disposition standard",
        "## Rule",
        "## Required Section",
        "## Enforcement",
        "EXPORTED",
        "DEFERRED_PRIVATE_ONLY",
        "BLOCKED_MISSING_PUBLIC_ARTIFACTS",
        THIS_SCRIPT_PATH,
    )
    for marker in required:
        if marker not in text:
            _add(violations, path, "standard_marker_missing", f"missing marker `{marker}`")
    return violations


def _validate_binding(path: str, text: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    if path == AUTORUN_PATH and not has_binding_marker(path, THIS_SCRIPT_PATH, text):
        _add(violations, path, "autorun_binding_missing", f"autorun gate must run `{THIS_SCRIPT_PATH}`")
    if path == HOOK_CHAIN_PATH and not has_binding_marker(path, THIS_SCRIPT_PATH, text):
        _add(violations, path, "hook_binding_missing", f"local hook chain must run `{THIS_SCRIPT_PATH}`")
    if path == AGENTS_PATH and THIS_SCRIPT_PATH not in text:
        _add(violations, path, "agents_binding_missing", f"AGENTS.md must cite `{THIS_SCRIPT_PATH}`")
    return violations


def _validate_export_disposition(path: str, text: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    if not _is_closure_target(path, text):
        return violations
    if REQUIRED_SECTION not in text:
        _add(
            violations,
            path,
            "public_export_disposition_missing",
            f"closure-equivalent artifact must include `{REQUIRED_SECTION}`",
        )
        return violations
    section = _extract_section(text, REQUIRED_SECTION)
    disposition_values = [value for value in ALLOWED_DISPOSITIONS if value in section]
    if len(disposition_values) != 1:
        _add(
            violations,
            path,
            "public_export_disposition_invalid",
            "section must contain exactly one allowed disposition",
        )
        return violations

    disposition = disposition_values[0]
    if disposition == "EXPORTED":
        for marker in ("Public-sync remote:", "Public-sync commit:", "Public artifact paths:"):
            if marker not in section:
                _add(violations, path, "public_export_evidence_missing", f"EXPORTED requires `{marker}`")
        if "Controlled-Vibe-Framework-CVF-Provenance" in section:
            _add(
                violations,
                path,
                "public_export_remote_wrong",
                "EXPORTED must cite the public repo, not the provenance repo",
            )
    elif disposition == "DEFERRED_PRIVATE_ONLY":
        if "Reason:" not in section:
            _add(violations, path, "public_export_reason_missing", "DEFERRED_PRIVATE_ONLY requires `Reason:`")
        if "public-sync" not in section.lower() and "public sync" not in section.lower():
            _add(
                violations,
                path,
                "public_sync_boundary_missing",
                "DEFERRED_PRIVATE_ONLY must mention the public-sync boundary",
            )
    elif disposition == "BLOCKED_MISSING_PUBLIC_ARTIFACTS":
        if "Blocker:" not in section:
            _add(
                violations,
                path,
                "public_export_blocker_missing",
                "BLOCKED_MISSING_PUBLIC_ARTIFACTS requires `Blocker:`",
            )
        if "Next action:" not in section:
            _add(
                violations,
                path,
                "public_export_next_action_missing",
                "BLOCKED_MISSING_PUBLIC_ARTIFACTS requires `Next action:`",
            )
    return violations


def _validate_path_with_text(path: str, text: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    if path == STANDARD_PATH:
        violations.extend(_validate_standard(path, text))
    if path in {AUTORUN_PATH, HOOK_CHAIN_PATH, AGENTS_PATH}:
        violations.extend(_validate_binding(path, text))
    violations.extend(_validate_export_disposition(path, text))
    return violations


def _validate_path(path: str) -> list[dict[str, str]]:
    full = REPO_ROOT / path
    if not full.exists():
        return []
    text = _read_rel(path)
    return _validate_path_with_text(path, text)


def _classify(changed_paths: dict[str, list[str]]) -> dict[str, Any]:
    paths_to_check = set(changed_paths)
    for path in (STANDARD_PATH, AUTORUN_PATH, HOOK_CHAIN_PATH, AGENTS_PATH):
        if (REPO_ROOT / path).exists():
            paths_to_check.add(path)
    scoped_paths = sorted(
        path
        for path in paths_to_check
        if path in {STANDARD_PATH, AUTORUN_PATH, HOOK_CHAIN_PATH, AGENTS_PATH}
        or (
            _is_active_markdown(path)
            and (
                path.startswith("docs/roadmaps/")
                or path.startswith("docs/reviews/")
                or path.startswith("docs/logs/")
            )
        )
    )
    violations: list[dict[str, str]] = []
    for path in scoped_paths:
        statuses = changed_paths.get(path, [])
        if statuses and all(status.startswith("D") for status in statuses):
            continue
        # Skip rename-only files — content unchanged, no new violations possible.
        if statuses and all(s.startswith("R") for s in statuses):
            continue
        new_violations = _validate_path(path)
        if not new_violations:
            continue
        # Suppress pre-existing violations: only report issues introduced by this change.
        head_text = _read_rel_at("HEAD", path)
        if head_text:
            head_violations = set(
                (v["type"], v["message"])
                for v in _validate_path_with_text(path, head_text)
            )
            new_violations = [
                v for v in new_violations
                if (v["type"], v["message"]) not in head_violations
            ]
        violations.extend(new_violations)
    return {
        "filesChecked": scoped_paths,
        "fileCount": len(scoped_paths),
        "violationCount": len(violations),
        "violations": violations,
        "compliant": len(violations) == 0,
    }


def _print_report(report: dict[str, Any], base: str, head: str, base_source: str) -> None:
    print("=== CVF Public Export Disposition Gate ===")
    print(f"Range: {base}..{head}")
    print(f"Base source: {base_source}")
    print(f"Files checked: {report['fileCount']}")
    print(f"Violations: {report['violationCount']}")
    if report["filesChecked"]:
        print("\nFiles checked:")
        for path in report["filesChecked"]:
            print(f"  - {path}")
    if report["violations"]:
        print("\nViolations:")
        for violation in report["violations"]:
            print(f"  - {violation['path']} ({violation['type']}): {violation['message']}")
    if report["compliant"]:
        print("\nCOMPLIANT - public export disposition gate is satisfied.")
    else:
        print("\nVIOLATION - add or correct public export disposition.")
        print(f"See: {STANDARD_PATH}")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")
    parser = argparse.ArgumentParser(description="Enforce CVF public export disposition")
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
        "standard": STANDARD_PATH,
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
