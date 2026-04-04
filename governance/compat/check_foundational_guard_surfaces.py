#!/usr/bin/env python3
"""
CVF Foundational Guard Surfaces Compatibility Gate

Automates the guard surfaces that were previously enforced mostly by manual
review or by policy references alone:
  - ADR guard
  - Architecture check guard
  - Extension versioning guard
  - Structural change audit guard
  - Test depth classification guard
  - Workspace isolation guard

Usage:
  python governance/compat/check_foundational_guard_surfaces.py
  python governance/compat/check_foundational_guard_surfaces.py --base <BASE> --head <HEAD>
  python governance/compat/check_foundational_guard_surfaces.py --enforce
  python governance/compat/check_foundational_guard_surfaces.py --json
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
DEFAULT_BASE_CANDIDATES = ("origin/main", "origin/master", "main", "master")

ADR_PATH = "docs/CVF_ARCHITECTURE_DECISIONS.md"
KB_PATH = "docs/CVF_CORE_KNOWLEDGE_BASE.md"
STRUCTURAL_ROADMAP_PATH = "docs/roadmaps/CVF_RESTRUCTURING_ROADMAP_2026-03-21.md"

ADR_COMMIT_TRIGGER = re.compile(
    r"^(feat\(core-value\)|feat\(governance\)|feat\(domain\)|feat\(skills\)|refactor\(arch\)|docs\(policy\)|chore\(remove\))",
    re.I,
)
STRUCTURAL_COMMIT_TRIGGER = re.compile(
    r"(refactor\(arch\)|chore\(remove\)|restructure|structural|merge package|merge extension|ownership transfer)",
    re.I,
)
ARCHITECTURE_PROPOSAL_COMMIT_TRIGGER = re.compile(
    r"(feat\(governance\)|feat\(domain\)|refactor\(arch\)|docs\(policy\)|new extension|new module|new layer)",
    re.I,
)

ALLOWED_STREAM_PREFIXES = {"ECO", "CLI", "SDK", "INT"}
LEGACY_VERSIONED_PATTERN = re.compile(r"^CVF_v\d+\.\d+(?:\.\d+)?_[A-Z0-9_]+$")
STREAM_VERSIONED_PATTERN = re.compile(r"^CVF_([A-Z]{2,4})_v\d+\.\d+(?:\.\d+)?_[A-Z0-9_]+$")

KNOWN_EXTENSION_ROOTS = {
    "CVF_AGENT_DEFINITION",
    "CVF_AGENT_LEDGER",
    "CVF_CONTROL_PLANE_FOUNDATION",
    "CVF_ECO_v1.0_INTENT_VALIDATION",
    "CVF_ECO_v1.1_NL_POLICY",
    "CVF_ECO_v1.2_LLM_RISK_ENGINE",
    "CVF_ECO_v1.3_DOMAIN_GUARDS",
    "CVF_ECO_v1.4_RAG_PIPELINE",
    "CVF_ECO_v2.0_AGENT_GUARD_SDK",
    "CVF_ECO_v2.1_GOVERNANCE_CANVAS",
    "CVF_ECO_v2.2_GOVERNANCE_CLI",
    "CVF_ECO_v2.3_AGENT_IDENTITY",
    "CVF_ECO_v2.4_GRAPH_GOVERNANCE",
    "CVF_ECO_v2.5_MCP_SERVER",
    "CVF_ECO_v3.0_TASK_MARKETPLACE",
    "CVF_ECO_v3.1_REPUTATION",
    "CVF_EXECUTION_PLANE_FOUNDATION",
    "CVF_GOVERNANCE_EXPANSION_FOUNDATION",
    "CVF_GUARD_CONTRACT",
    "CVF_LEARNING_PLANE_FOUNDATION",
    "CVF_MODEL_GATEWAY",
    "CVF_PLANE_FACADES",
    "CVF_POLICY_ENGINE",
    "CVF_STARTER_TEMPLATE_REFERENCE",
    "CVF_TOOLKIT_REFERENCE",
    "CVF_TRUST_SANDBOX",
    "CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL",
    "CVF_v1.2_CAPABILITY_EXTENSION",
    "CVF_v1.2.1_EXTERNAL_INTEGRATION",
    "CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE",
    "CVF_v1.3_IMPLEMENTATION_TOOLKIT",
    "CVF_v1.3.1_OPERATOR_EDITION",
    "CVF_v1.4_USAGE_LAYER",
    "CVF_v1.5_UX_PLATFORM",
    "CVF_v1.5.1_END_USER_ORIENTATION",
    "CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS",
    "CVF_v1.6_AGENT_PLATFORM",
    "CVF_v1.6.1_GOVERNANCE_ENGINE",
    "CVF_v1.7_CONTROLLED_INTELLIGENCE",
    "CVF_v1.7.1_SAFETY_RUNTIME",
    "CVF_v1.7.2_SAFETY_DASHBOARD",
    "CVF_v1.7.3_RUNTIME_ADAPTER_HUB",
    "CVF_v1.8_SAFETY_HARDENING",
    "CVF_v1.8.1_ADAPTIVE_OBSERVABILITY_RUNTIME",
    "CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY",
    "CVF_v2.0_NONCODER_SAFETY_RUNTIME",
    "CVF_v3.0_CORE_GIT_FOR_AI",
    "examples",
}

ALLOWED_TOP_LEVEL_ROOTS = {
    ".agents",
    ".claude",
    ".private_reference",
    ".git",
    ".githooks",
    ".github",
    ".vscode",
    "CVF_SKILL_LIBRARY",
    "docs",
    "ECOSYSTEM",
    "EXTENSIONS",
    "governance",
    "node_modules",
    "public",
    "REVIEW",
    "scripts",
    "tools",
    "ui_governance_engine",
    "v1.0",
    "v1.1",
    ".dt.log",
    ".git_commit_error.log",
    ".git_commit_msg.txt",
    ".gitignore",
    ".markdownlintrc",
    "AGENT_HANDOFF.md",
    "AGENT_PLATFORM_PROGRESS_2026-02-06.md",
    "ARCHITECTURE.md",
    "CHANGELOG.md",
    "CLAUDE.md",
    "CVF_ECOSYSTEM_ARCHITECTURE.md",
    "CVF_LITE.md",
    "LICENSE",
    "netlify.toml",
    "package-lock.json",
    "package.json",
    "README.md",
    "START_HERE.md",
}

ROOT_APP_DIR_MARKERS = {"app", "src", "pages", "components", "stores", "store"}
ROOT_APP_FILE_PATTERNS = (
    re.compile(r"^next\.config\.(js|mjs|cjs|ts)$", re.I),
    re.compile(r"^vite\.config\.(js|mjs|cjs|ts)$", re.I),
    re.compile(r"^angular\.json$", re.I),
    re.compile(r"^vercel\.json$", re.I),
    re.compile(r"^tailwind\.config\.(js|cjs|mjs|ts)$", re.I),
    re.compile(r"^\.env(\..+)?$", re.I),
)
TEST_REPORT_FILE_PREFIXES = ("docs/baselines/", "docs/assessments/", "docs/reviews/")


def _run_git(args: list[str]) -> tuple[int, str, str]:
    proc = subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return proc.returncode, proc.stdout.strip(), proc.stderr.strip()


def _read_text(path: str) -> str:
    abs_path = REPO_ROOT / path
    if not abs_path.exists() or abs_path.is_dir():
        return ""
    return abs_path.read_text(encoding="utf-8", errors="replace")


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


def _get_commits_in_range(base: str, head: str) -> list[dict[str, str]]:
    code, out, err = _run_git(["log", "--oneline", "--format=%H|%s", f"{base}..{head}"])
    if code != 0:
        raise RuntimeError(f"git log failed for range {base}..{head}: {err or out}")
    commits: list[dict[str, str]] = []
    for line in out.splitlines():
        if "|" not in line:
            continue
        sha, message = line.split("|", 1)
        commits.append({"sha": sha.strip(), "message": message.strip()})
    return commits


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
    for changed_map in maps:
        for path, statuses in changed_map.items():
            merged.setdefault(path, set()).update(statuses)
    return {path: sorted(statuses) for path, statuses in sorted(merged.items())}


def _is_deleted_only(statuses: list[str]) -> bool:
    return all(status.startswith("D") for status in statuses)


def _extension_root(path: str) -> str | None:
    parts = path.split("/")
    if len(parts) < 2 or parts[0] != "EXTENSIONS":
        return None
    return parts[1]


def _active_paths(changed_paths: dict[str, list[str]]) -> dict[str, list[str]]:
    return {
        path: statuses
        for path, statuses in changed_paths.items()
        if not _is_deleted_only(statuses)
    }


def _check_adr_guard(
    commits: list[dict[str, str]],
    changed_paths: dict[str, list[str]],
    added_extension_roots: list[str],
) -> dict[str, Any]:
    trigger_commits = [commit["message"] for commit in commits if ADR_COMMIT_TRIGGER.search(commit["message"])]
    trigger_paths = sorted(
        path for path in changed_paths
        if path.startswith("governance/toolkit/02_POLICY/")
        or path.endswith("_GUARD.md")
        or path == "docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md"
    )
    if added_extension_roots:
        trigger_paths.extend(f"EXTENSIONS/{root}" for root in added_extension_roots)

    triggered = bool(trigger_commits or trigger_paths)
    issues: list[str] = []
    if triggered and ADR_PATH not in changed_paths:
        issues.append("triggered architecture or policy change without updating docs/CVF_ARCHITECTURE_DECISIONS.md")
    if triggered:
        adr_text = _read_text(ADR_PATH)
        if "## ADR-" not in adr_text:
            issues.append("docs/CVF_ARCHITECTURE_DECISIONS.md does not expose canonical ADR headings")

    return {
        "triggered": triggered,
        "triggerCommits": trigger_commits,
        "triggerPaths": sorted(set(trigger_paths)),
        "issues": issues,
    }


def _check_architecture_check_guard(
    commits: list[dict[str, str]],
    changed_paths: dict[str, list[str]],
    added_extension_roots: list[str],
) -> dict[str, Any]:
    trigger_commits = [commit["message"] for commit in commits if ARCHITECTURE_PROPOSAL_COMMIT_TRIGGER.search(commit["message"])]
    trigger_paths = sorted(
        path for path in changed_paths
        if path.startswith("governance/toolkit/02_POLICY/")
        or path.endswith("_GUARD.md")
    )
    if added_extension_roots:
        trigger_paths.extend(f"EXTENSIONS/{root}" for root in added_extension_roots)

    triggered = bool(trigger_commits or trigger_paths)
    issues: list[str] = []
    if triggered and KB_PATH not in changed_paths:
        issues.append("triggered architecture proposal surface without updating docs/CVF_CORE_KNOWLEDGE_BASE.md")
    if added_extension_roots:
        kb_text = _read_text(KB_PATH)
        missing_roots = [root for root in added_extension_roots if root not in kb_text]
        if missing_roots:
            issues.append(
                "knowledge base does not mention new extension roots: " + ", ".join(sorted(missing_roots))
            )

    return {
        "triggered": triggered,
        "triggerCommits": trigger_commits,
        "triggerPaths": sorted(set(trigger_paths)),
        "issues": issues,
    }


def _check_extension_versioning_guard(added_extension_roots: list[str]) -> dict[str, Any]:
    issues: list[str] = []
    invalid_roots: list[str] = []

    for root in added_extension_roots:
        if LEGACY_VERSIONED_PATTERN.match(root):
            continue
        match = STREAM_VERSIONED_PATTERN.match(root)
        if match:
            if match.group(1) not in ALLOWED_STREAM_PREFIXES:
                invalid_roots.append(root)
            continue
        invalid_roots.append(root)

    if invalid_roots:
        issues.append(
            "new extension roots do not satisfy the registered naming convention: "
            + ", ".join(sorted(invalid_roots))
        )

    return {
        "triggered": bool(added_extension_roots),
        "newExtensionRoots": added_extension_roots,
        "issues": issues,
    }


def _check_structural_change_audit_guard(
    commits: list[dict[str, str]],
    changed_paths: dict[str, list[str]],
) -> dict[str, Any]:
    trigger_commits = [commit["message"] for commit in commits if STRUCTURAL_COMMIT_TRIGGER.search(commit["message"])]
    rename_paths = [
        path for path, statuses in changed_paths.items()
        if any(status.startswith("R") for status in statuses)
    ]
    structural_path_triggers = [
        path for path, statuses in changed_paths.items()
        if path.startswith("EXTENSIONS/")
        and any(status.startswith(prefix) for prefix in ("A", "D", "R") for status in statuses)
    ]
    triggered = bool(trigger_commits or rename_paths or structural_path_triggers)
    issues: list[str] = []
    if triggered:
        supporting_docs = [
            path for path in changed_paths
            if re.search(r"^docs/(reviews|baselines|roadmaps)/.*(GC019|RESTRUCTURING).*\.md$", path, re.I)
        ]
        if not supporting_docs:
            issues.append("structural change trigger detected without a GC-019 review, delta, or restructuring artifact")

    return {
        "triggered": triggered,
        "triggerCommits": trigger_commits,
        "triggerPaths": sorted(set(rename_paths + structural_path_triggers)),
        "issues": issues,
    }


def _check_test_depth_classification_guard(changed_paths: dict[str, list[str]]) -> dict[str, Any]:
    candidate_docs: list[str] = []
    issues: list[str] = []
    for path in changed_paths:
        if not path.endswith(".md"):
            continue
        if not any(path.startswith(prefix) for prefix in TEST_REPORT_FILE_PREFIXES):
            continue
        if "/archive/" in path:
            continue
        text = _read_text(path)
        if re.search(r"(?im)^tests?\s*:|\b\d+/\d+\s+PASS\b", text):
            candidate_docs.append(path)
            missing = [
                marker for marker in ("T1", "T2", "T3", "T4", "Meaningful")
                if marker not in text
            ]
            if missing:
                issues.append(f"{path} reports test counts without tier markers: {', '.join(missing)}")

    return {
        "triggered": bool(candidate_docs),
        "reportDocs": candidate_docs,
        "issues": issues,
    }


def _check_workspace_isolation_guard(changed_paths: dict[str, list[str]]) -> dict[str, Any]:
    suspicious: list[str] = []
    for path, statuses in changed_paths.items():
        if not any(status.startswith("A") for status in statuses):
            continue
        parts = path.split("/")
        top = parts[0]
        basename = parts[-1]

        if path.startswith("docs/CVF_BOOTSTRAP_LOG_"):
            suspicious.append(path)
            continue

        if top in ROOT_APP_DIR_MARKERS:
            suspicious.append(path)
            continue

        if len(parts) == 1 and any(pattern.match(basename) for pattern in ROOT_APP_FILE_PATTERNS):
            suspicious.append(path)
            continue

        if top not in ALLOWED_TOP_LEVEL_ROOTS and not top.startswith("."):
            suspicious.append(path)

    issues = []
    if suspicious:
        issues.append(
            "suspicious downstream-app or non-isolated workspace additions detected at repo root: "
            + ", ".join(sorted(set(suspicious)))
        )

    return {
        "triggered": bool(suspicious),
        "suspiciousPaths": sorted(set(suspicious)),
        "issues": issues,
    }


def _classify(
    commits: list[dict[str, str]],
    changed_paths: dict[str, list[str]],
) -> dict[str, Any]:
    active_changed = _active_paths(changed_paths)
    added_extension_roots = sorted(
        {
            root
            for path, statuses in active_changed.items()
            for root in [_extension_root(path)]
            if root is not None
            and root not in KNOWN_EXTENSION_ROOTS
            and any(status.startswith(("A", "R")) for status in statuses)
        }
    )

    guard_reports = {
        "adrGuard": _check_adr_guard(commits, active_changed, added_extension_roots),
        "architectureCheckGuard": _check_architecture_check_guard(commits, active_changed, added_extension_roots),
        "extensionVersioningGuard": _check_extension_versioning_guard(added_extension_roots),
        "structuralChangeAuditGuard": _check_structural_change_audit_guard(commits, changed_paths),
        "testDepthClassificationGuard": _check_test_depth_classification_guard(active_changed),
        "workspaceIsolationGuard": _check_workspace_isolation_guard(active_changed),
    }

    violations = [
        {"guard": guard_name, "issues": report["issues"]}
        for guard_name, report in guard_reports.items()
        if report["issues"]
    ]

    return {
        "totalCommits": len(commits),
        "changedFileCount": len(changed_paths),
        "newExtensionRoots": added_extension_roots,
        "guardReports": guard_reports,
        "violationCount": len(violations),
        "violations": violations,
        "compliant": len(violations) == 0,
    }


def _print_report(report: dict[str, Any], base: str, head: str, base_source: str) -> None:
    print("=== CVF Foundational Guard Surfaces Gate ===")
    print(f"Range: {base}..{head}")
    print(f"Base source: {base_source}")
    print(f"Total commits: {report['totalCommits']}")
    print(f"Changed files: {report['changedFileCount']}")
    print(f"Violation count: {report['violationCount']}")

    if report["newExtensionRoots"]:
        print("\nNew extension roots:")
        for root in report["newExtensionRoots"]:
            print(f"  - {root}")

    print("\nGuard status:")
    for guard_name, guard_report in report["guardReports"].items():
        status = "TRIGGERED" if guard_report.get("triggered") else "SKIP"
        issue_count = len(guard_report.get("issues", []))
        suffix = "PASS" if issue_count == 0 else f"FAIL({issue_count})"
        print(f"  - {guard_name}: {status} / {suffix}")

    if report["violations"]:
        print("\nViolations:")
        for violation in report["violations"]:
            print(f"  - {violation['guard']}")
            for issue in violation["issues"]:
                print(f"    - {issue}")

    if report["compliant"]:
        print("\n✅ COMPLIANT — Foundational guard surfaces are automated and satisfied for the current range.")
    else:
        print("\n❌ VIOLATION — One or more foundational guards are missing required automated artifacts.")
        print("   Action required:")
        print("   1. Add the required ADR, KB, structural-review, or report-quality artifact.")
        print("   2. Fix extension naming or workspace-isolation violations.")
        print("   3. Re-run this gate until all triggered foundational guards pass.")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="CVF foundational guard surfaces compatibility gate")
    parser.add_argument("--base", default=None, help="Git base ref")
    parser.add_argument("--head", default=None, help="Git head ref")
    parser.add_argument("--enforce", action="store_true", help="Return non-zero (exit 2) when violations are found")
    parser.add_argument("--json", action="store_true", help="Print JSON report to stdout instead of text")
    args = parser.parse_args()

    base, head, base_source = _resolve_range(args.base, args.head)

    try:
        commits = _get_commits_in_range(base, head)
        changed_range = _get_changed_name_status(base, head)
    except RuntimeError as exc:
        if args.base:
            fallback_base = "HEAD~1"
            try:
                commits = _get_commits_in_range(fallback_base, head)
                changed_range = _get_changed_name_status(fallback_base, head)
                print(
                    f"Warning: primary range failed ({exc}); fallback to {fallback_base}..{head}",
                    file=sys.stderr,
                )
                base = fallback_base
                base_source = "fallback-after-error:HEAD~1"
            except RuntimeError as fallback_exc:
                print(str(fallback_exc), file=sys.stderr)
                return 1
        else:
            print(str(exc), file=sys.stderr)
            return 1

    worktree_changed = _get_worktree_name_status()
    merged = _merge_changed_maps(changed_range, worktree_changed)
    report = {
        "timestamp": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "range": {"base": base, "head": head, "baseSource": base_source},
        "policy": "governance/toolkit/05_OPERATION/*_GUARD.md foundational automation",
        **_classify(commits, merged),
    }

    if args.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        _print_report(report, base, head, base_source)

    if args.enforce and not report["compliant"]:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
