#!/usr/bin/env python3
"""
CVF Core Guard Self-Protection Gate

Blocks agent edits to core guard/control files unless the same change set
contains an explicit guard-maintenance authorization artifact.
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
POLICY = "governance/toolkit/05_OPERATION/CVF_CORE_GUARD_SELF_PROTECTION_GUARD.md"
THIS_SCRIPT = "governance/compat/check_core_guard_self_protection.py"

AUTH_MARKER = "Core Guard Self-Protection Authorization"
LARGE_SCOPE_MARKER = "Large-Scope Change Authorization"
SCOPE_FIREWALL_MARKER = "Scope Firewall Authorization"
EXPECTED_ARTIFACT_MARKER = "Expected Artifact Existence"
COMMIT_PROMPT_MARKER = "Commit Prompt Readiness"

DEFAULT_LARGE_SCOPE_LIMIT = 40
DEFAULT_RENAME_DELETE_LIMIT = 10

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

AUTH_DOC_PREFIXES = (
    "docs/baselines/",
    "docs/roadmaps/",
    "docs/reviews/",
    "docs/work_orders/",
)
ACTIVE_HANDOFF_AUTH_RE = re.compile(r"^AGENT_HANDOFF[^/]*\.md$")


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
        path = parts[2] if (status.startswith("R") or status.startswith("C")) and len(parts) > 2 else parts[1]
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


def _get_scope_firewall_paths(base: str | None, head: str | None) -> set[str]:
    paths: set[str] = set()
    if base and head:
        code, out, _ = _run_git(["diff", "--name-only", f"{base}..{head}"])
        if code == 0 and out:
            paths.update(raw.replace("\\", "/").strip() for raw in out.splitlines() if raw.strip())
    code, out, _ = _run_git(["diff", "--name-only", "--cached"])
    if code != 0 or not out:
        return paths
    paths.update(raw.replace("\\", "/").strip() for raw in out.splitlines() if raw.strip())
    return paths


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


def _read(path: str) -> str:
    full = REPO_ROOT / path
    if not full.exists() or full.is_dir():
        return ""
    return full.read_text(encoding="utf-8", errors="replace")


def _is_standard_auth_doc_path(path: str) -> bool:
    normalized = path.replace("\\", "/")
    return (
        normalized.endswith(".md")
        and "/archive/" not in normalized
        and normalized.startswith(AUTH_DOC_PREFIXES)
    )


def _is_active_handoff_auth_doc_path(path: str) -> bool:
    normalized = path.replace("\\", "/")
    return (
        normalized.endswith(".md")
        and "/archive/" not in normalized
        and bool(ACTIVE_HANDOFF_AUTH_RE.match(normalized))
    )


def _authorization_docs(changed: dict[str, set[str]]) -> list[str]:
    docs: list[str] = []
    for path in sorted(changed):
        text = ""
        if _is_standard_auth_doc_path(path):
            text = _read(path)
            if (
                AUTH_MARKER in text
                or LARGE_SCOPE_MARKER in text
                or SCOPE_FIREWALL_MARKER in text
                or EXPECTED_ARTIFACT_MARKER in text
                or COMMIT_PROMPT_MARKER in text
            ):
                docs.append(path)
        elif _is_active_handoff_auth_doc_path(path):
            text = _read(path)
            if AUTH_MARKER in text:
                docs.append(path)
    return docs


def _changed_docs(changed: dict[str, set[str]]) -> list[str]:
    return [
        path
        for path in sorted(changed)
        if _is_standard_auth_doc_path(path)
    ]


def _extract_heading_section(text: str, marker: str) -> str:
    lines = text.splitlines()
    start: int | None = None
    marker_lower = marker.lower()
    for idx, line in enumerate(lines):
        stripped = line.strip().lower()
        if stripped.startswith("#") and marker_lower in stripped:
            start = idx + 1
            break
    if start is None:
        raw_idx = text.lower().find(marker_lower)
        if raw_idx == -1:
            return ""
        return text[raw_idx:]

    end = len(lines)
    for idx in range(start, len(lines)):
        if lines[idx].startswith("#"):
            end = idx
            break
    return "\n".join(lines[start:end])


def _extract_backtick_paths(text: str) -> list[str]:
    paths: list[str] = []
    for match in re.findall(r"`([^`]+)`", text):
        candidate = match.strip().replace("\\", "/")
        if not candidate or " " in candidate:
            continue
        if (
            "/" in candidate
            or candidate.endswith((".md", ".py", ".ts", ".tsx", ".json"))
            or candidate in {
            "AGENTS.md",
            "CLAUDE.md",
            "CVF_SESSION_MEMORY.md",
            }
        ):
            paths.append(candidate)
    return paths


def _split_scope_paths(text: str) -> tuple[list[str], list[str]]:
    section = _extract_heading_section(text, SCOPE_FIREWALL_MARKER)
    if not section:
        return [], []

    lower = section.lower()
    allowed_idx = lower.find("allowed paths")
    forbidden_idx = lower.find("forbidden paths")
    operator_idx = lower.find("operator authorization")

    allowed_block = ""
    forbidden_block = ""
    if allowed_idx != -1:
        allowed_end = forbidden_idx if forbidden_idx != -1 else len(section)
        allowed_block = section[allowed_idx:allowed_end]
    if forbidden_idx != -1:
        forbidden_end = operator_idx if operator_idx != -1 else len(section)
        forbidden_block = section[forbidden_idx:forbidden_end]

    return _extract_backtick_paths(allowed_block), _extract_backtick_paths(forbidden_block)


def _path_matches(path: str, patterns: list[str]) -> bool:
    normalized = path.replace("\\", "/")
    for pattern in patterns:
        candidate = pattern.replace("\\", "/")
        if candidate.endswith("/") and normalized.startswith(candidate):
            return True
        if "*" in candidate and Path(normalized).match(candidate):
            return True
        if normalized == candidate:
            return True
    return False


def _has_core_auth(path: str, protected_paths: list[str]) -> bool:
    text = _read(path)
    if AUTH_MARKER not in text:
        return False
    for protected in protected_paths:
        if protected not in text:
            return False
    required_tokens = (
        "Authorized guard-maintenance scope",
        "Protected paths",
        "Operator authorization",
        "Rollback boundary",
    )
    return all(token in text for token in required_tokens)


def _has_large_scope_auth(path: str) -> bool:
    text = _read(path)
    if LARGE_SCOPE_MARKER not in text:
        return False
    required_tokens = (
        "Changed-file ceiling",
        "Rename/delete ceiling",
        "Operator authorization",
        "Rollback boundary",
    )
    return all(token in text for token in required_tokens)


def _scope_firewall_docs(auth_docs: list[str]) -> list[str]:
    return [path for path in auth_docs if SCOPE_FIREWALL_MARKER in _read(path)]


def _scope_firewall_complete(path: str) -> bool:
    text = _read(path)
    if SCOPE_FIREWALL_MARKER not in text:
        return False
    required_tokens = (
        "Allowed paths",
        "Forbidden paths",
        "Operator authorization",
        "Rollback boundary",
    )
    allowed, _ = _split_scope_paths(text)
    return bool(allowed) and all(token in text for token in required_tokens)


def _commit_prompt_present(text: str) -> bool:
    patterns = (
        r"\bcommit\s*\?",
        r"commit\s+kh[oô]ng",
        r"c[oó]\s+commit",
        r"shall\s+i\s+commit",
        r"do\s+you\s+want\s+me\s+to\s+commit",
        r"ready\s+to\s+commit",
        r"h[oỏ]i\s+commit",
    )
    lowered = text.lower()
    return any(re.search(pattern, lowered) for pattern in patterns)


def _commit_prompt_readiness_complete(path: str) -> bool:
    text = _read(path)
    if COMMIT_PROMPT_MARKER not in text:
        return False
    section = _extract_heading_section(text, COMMIT_PROMPT_MARKER)
    required_tokens = (
        "Diff scope: PASS",
        "Tests: PASS",
        "Gates: PASS",
        "Untracked unrelated: NONE",
        "Forbidden touched paths: NONE",
    )
    return all(token in section for token in required_tokens)


def _expected_artifact_violations(doc_path: str) -> list[str]:
    text = _read(doc_path)
    if EXPECTED_ARTIFACT_MARKER not in text:
        return []
    section = _extract_heading_section(text, EXPECTED_ARTIFACT_MARKER)
    expected_paths = _extract_backtick_paths(section)
    missing: list[str] = []
    for path in expected_paths:
        full = REPO_ROOT / path
        if not full.exists():
            missing.append(path)
    return missing


def _run_check(
    base: str | None,
    head: str | None,
    large_scope_limit: int,
    rename_delete_limit: int,
) -> dict[str, Any]:
    changed = _get_changed(base, head)
    changed_files = sorted(changed)
    scope_firewall_paths = _get_scope_firewall_paths(base, head)
    scope_firewall_files = [path for path in changed_files if path in scope_firewall_paths]
    protected = [path for path in changed_files if _is_protected(path)]
    auth_docs = _authorization_docs(changed)
    scope_docs = _scope_firewall_docs(auth_docs)

    violations: list[dict[str, Any]] = []

    blocked_statuses = {"D"}
    rename_or_delete = [
        path
        for path, statuses in changed.items()
        if any(status.startswith("R") or status in blocked_statuses for status in statuses)
    ]

    protected_renames_or_deletes = [
        path
        for path in protected
        if any(status.startswith("R") or status in blocked_statuses for status in changed.get(path, set()))
    ]
    if protected_renames_or_deletes:
        violations.append(
            {
                "path": "core-guard-protected-delete-rename",
                "issues": [
                    "Protected guard/control files may not be deleted or renamed by agents: "
                    + ", ".join(protected_renames_or_deletes)
                ],
            }
        )

    if protected and not any(_has_core_auth(path, protected) for path in auth_docs):
        violations.append(
            {
                "path": "core-guard-self-protection",
                "issues": [
                    "Protected guard/control files changed without a complete "
                    f"`{AUTH_MARKER}` block listing every protected path: "
                    + ", ".join(protected)
                ],
            }
        )

    large_scope = len(changed_files) > large_scope_limit or len(rename_or_delete) > rename_delete_limit
    if large_scope and not any(_has_large_scope_auth(path) for path in auth_docs):
        violations.append(
            {
                "path": "large-scope-runaway-stop",
                "issues": [
                    "Changed file volume exceeds safe agent limit without "
                    f"`{LARGE_SCOPE_MARKER}`: files={len(changed_files)} "
                    f"(limit={large_scope_limit}), renames/deletes={len(rename_or_delete)} "
                    f"(limit={rename_delete_limit})"
                ],
            }
        )

    if scope_docs:
        incomplete_scope_docs = [path for path in scope_docs if not _scope_firewall_complete(path)]
        if incomplete_scope_docs:
            violations.append(
                {
                    "path": "scope-firewall-authorization",
                    "issues": [
                        "Scope firewall artifact is incomplete. Required: "
                        "`Allowed paths`, `Forbidden paths`, `Operator authorization`, "
                        "`Rollback boundary`: "
                        + ", ".join(incomplete_scope_docs)
                    ],
                }
            )
        else:
            allowed: list[str] = []
            forbidden: list[str] = []
            for doc_path in scope_docs:
                doc_allowed, doc_forbidden = _split_scope_paths(_read(doc_path))
                allowed.extend(doc_allowed)
                forbidden.extend(doc_forbidden)

            forbidden_touched = [path for path in scope_firewall_files if _path_matches(path, forbidden)]
            not_allowed = [path for path in scope_firewall_files if not _path_matches(path, allowed)]

            # Fix (A): also check untracked files against forbidden paths.
            # Untracked files are in changed_files but not in scope_firewall_files
            # (which only covers the committed diff range). A worker who creates
            # forbidden-path files without staging them evades the scope firewall.
            untracked_forbidden = [
                path for path, statuses in changed.items()
                if statuses == {"A"} and path not in scope_firewall_files
                and _path_matches(path, forbidden)
            ]

            if forbidden_touched or not_allowed or untracked_forbidden:
                issues: list[str] = []
                if forbidden_touched:
                    issues.append("Forbidden paths touched: " + ", ".join(forbidden_touched))
                if not_allowed:
                    issues.append("Staged/range paths outside declared Allowed paths: " + ", ".join(not_allowed))
                if untracked_forbidden:
                    issues.append(
                        "Forbidden paths present as untracked files (worker scope violation): "
                        + ", ".join(untracked_forbidden)
                    )
                violations.append({"path": "pre-commit-scope-firewall", "issues": issues})

    artifact_issues: list[str] = []
    for doc_path in _changed_docs(changed):
        missing = _expected_artifact_violations(doc_path)
        if missing:
            artifact_issues.append(f"{doc_path} missing expected artifacts: " + ", ".join(missing))
    if artifact_issues:
        violations.append({"path": "expected-artifact-existence", "issues": artifact_issues})

    prompt_issues: list[str] = []
    for doc_path in _changed_docs(changed):
        text = _read(doc_path)
        if _commit_prompt_present(text) and not _commit_prompt_readiness_complete(doc_path):
            prompt_issues.append(
                f"{doc_path} contains commit-prompt language without complete `{COMMIT_PROMPT_MARKER}`."
            )
    if prompt_issues:
        violations.append({"path": "commit-prompt-readiness", "issues": prompt_issues})

    return {
        "policy": POLICY,
        "script": THIS_SCRIPT,
        "changedFileCount": len(changed_files),
        "indexedChangedFileCount": len(scope_firewall_files),
        "renameDeleteCount": len(rename_or_delete),
        "protectedFileCount": len(protected),
        "changedFiles": changed_files,
        "indexedChangedFiles": scope_firewall_files,
        "protectedFiles": protected,
        "authorizationDocs": auth_docs,
        "scopeFirewallDocs": scope_docs,
        "violationCount": len(violations),
        "violations": violations,
        "compliant": not violations,
    }


def _print_report(report: dict[str, Any], base: str | None, head: str | None) -> None:
    print("=== CVF Core Guard Self-Protection Gate ===")
    if base or head:
        print(f"Range: {base or '<worktree>'}..{head or '<worktree>'}")
    print(f"Policy: {report['policy']}")
    print(f"Changed files: {report['changedFileCount']}")
    print(f"Indexed changed files: {report['indexedChangedFileCount']}")
    print(f"Renames/deletes: {report['renameDeleteCount']}")
    print(f"Protected files changed: {report['protectedFileCount']}")
    print(f"Violations: {report['violationCount']}")

    if report["protectedFiles"]:
        print("\nProtected files:")
        for path in report["protectedFiles"]:
            print(f"  - {path}")
    if report["authorizationDocs"]:
        print("\nAuthorization docs:")
        for path in report["authorizationDocs"]:
            print(f"  - {path}")
    if report["scopeFirewallDocs"]:
        print("\nScope firewall docs:")
        for path in report["scopeFirewallDocs"]:
            print(f"  - {path}")
    if report["violations"]:
        print("\nViolations:")
        for violation in report["violations"]:
            print(f"  - {violation['path']}")
            for issue in violation["issues"]:
                print(f"    - {issue}")

    if report["compliant"]:
        print("\nCOMPLIANT - core guard self-protection requirements are satisfied.")
    else:
        print("\nVIOLATION - stop the agent and split or authorize the guard/core change.")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="Enforce CVF core guard self-protection")
    parser.add_argument("--base", default=None)
    parser.add_argument("--head", default=None)
    parser.add_argument("--large-scope-limit", type=int, default=DEFAULT_LARGE_SCOPE_LIMIT)
    parser.add_argument("--rename-delete-limit", type=int, default=DEFAULT_RENAME_DELETE_LIMIT)
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args()

    try:
        report = _run_check(args.base, args.head, args.large_scope_limit, args.rename_delete_limit)
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
