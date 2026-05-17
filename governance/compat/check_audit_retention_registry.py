#!/usr/bin/env python3
"""
CVF Audit Retention Registry Compatibility Gate

Validates the stricter retention classification for `docs/audits/` so the
generic archive flow can distinguish:
- recent active audits
- historical retain-evidence audits
- historical audits that are safe to archive
"""

from __future__ import annotations

import argparse
import datetime as dt
import importlib.util
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Any
from unittest.mock import patch


REPO_ROOT = Path(__file__).resolve().parents[2]
ARCHIVE_MODULE_PATH = REPO_ROOT / "scripts" / "cvf_active_archive.py"
DEFAULT_BASE_CANDIDATES = ("origin/main", "origin/master", "main", "master")
REQUIRED_CLASS_IDS = {
    "ACTIVE_RECENT_AUDIT",
    "RETAIN_EVIDENCE_AUDIT",
    "SAFE_TO_ARCHIVE_AUDIT",
}
RETENTION_ALWAYS_FULL_PREFIXES = (
    "docs/audits/",
)
RETENTION_ALWAYS_FULL_EXACT = {
    "governance/compat/CVF_AUDIT_RETENTION_REGISTRY.json",
    "governance/compat/CVF_ACTIVE_WINDOW_REGISTRY.json",
    "governance/compat/check_audit_retention_registry.py",
    "scripts/cvf_active_archive.py",
}
RETENTION_REFERENCE_CANDIDATE_PREFIXES = (
    "docs/audits/",
    "docs/reference/",
    "docs/roadmaps/",
    "docs/baselines/",
)
RETENTION_REFERENCE_CANDIDATE_EXACT = {
    "AGENT_HANDOFF.md",
    "docs/INDEX.md",
    "docs/CVF_CORE_KNOWLEDGE_BASE.md",
    "docs/CVF_INCREMENTAL_TEST_LOG.md",
}
RETENTION_TARGET_MARKERS = ("docs/audits/", "docs/audits/archive/")


def _load_archive_module():
    spec = importlib.util.spec_from_file_location("cvf_active_archive", ARCHIVE_MODULE_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load archive module from {ARCHIVE_MODULE_PATH}")
    module = importlib.util.module_from_spec(spec)
    sys.modules.setdefault(spec.name, module)
    spec.loader.exec_module(module)
    return module


ARCHIVE_MODULE = _load_archive_module()


def _rel(path: Path) -> str:
    return path.relative_to(REPO_ROOT).as_posix()


def _registry_path() -> Path:
    return REPO_ROOT / "governance" / "compat" / "CVF_AUDIT_RETENTION_REGISTRY.json"


def _active_window_registry_path() -> Path:
    return REPO_ROOT / "governance" / "compat" / "CVF_ACTIVE_WINDOW_REGISTRY.json"


def _audits_root() -> Path:
    return REPO_ROOT / "docs" / "audits"


def _read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


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
    return proc.returncode, (proc.stdout or "").strip(), (proc.stderr or "").strip()


def _ref_exists(ref: str) -> bool:
    code, _, _ = _run_git(["rev-parse", "--verify", "--quiet", f"{ref}^{{commit}}"])
    return code == 0


def _discover_upstream_ref() -> str | None:
    code, out, _ = _run_git(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"])
    if code == 0 and out:
        return out.strip()
    return None


def _discover_default_base(head: str) -> tuple[str, str]:
    env_base = os.getenv("CVF_COMPAT_BASE")
    if env_base:
        return env_base, "env:CVF_COMPAT_BASE"

    upstream_ref = _discover_upstream_ref()
    if upstream_ref and _ref_exists(upstream_ref):
        code, out, _ = _run_git(["merge-base", upstream_ref, head])
        if code == 0 and out:
            return out, f"merge-base({upstream_ref},{head})"

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
    for changed_map in maps:
        for path, statuses in changed_map.items():
            merged.setdefault(path, set()).update(statuses)
    return {path: sorted(statuses) for path, statuses in sorted(merged.items())}


def _current_file_mentions(path: str, markers: tuple[str, ...]) -> bool:
    candidate = REPO_ROOT / Path(path)
    if not candidate.exists() or candidate.is_dir():
        return False
    try:
        text = candidate.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return False
    return any(marker in text for marker in markers)


def _diff_mentions(path: str, base: str, head: str, markers: tuple[str, ...]) -> bool:
    diff_commands = [
        ["diff", "--unified=0", f"{base}..{head}", "--", path],
        ["diff", "--unified=0", "--", path],
        ["diff", "--cached", "--unified=0", "--", path],
    ]
    for args in diff_commands:
        code, out, _ = _run_git(args)
        if code not in (0, 1):
            continue
        if out and any(marker in out for marker in markers):
            return True
    return False


def _can_use_diff_range(base: str, head: str) -> bool:
    return bool(base and head and base != "N/A" and head != "N/A")


def _retention_affecting_changes_present(
    changed_paths: dict[str, list[str]],
    base: str,
    head: str,
) -> bool:
    for path, statuses in changed_paths.items():
        if all(status.startswith("D") for status in statuses):
            continue
        if path in RETENTION_ALWAYS_FULL_EXACT:
            return True
        if any(path.startswith(prefix) for prefix in RETENTION_ALWAYS_FULL_PREFIXES):
            return True
        if path in RETENTION_REFERENCE_CANDIDATE_EXACT or any(
            path.startswith(prefix) for prefix in RETENTION_REFERENCE_CANDIDATE_PREFIXES
        ):
            if _diff_mentions(path, base, head, RETENTION_TARGET_MARKERS):
                return True
            if not _can_use_diff_range(base, head) and _current_file_mentions(path, RETENTION_TARGET_MARKERS):
                return True
    return False


def _resolve_changed_paths(base: str | None, head: str | None) -> tuple[dict[str, list[str]], str, str, str]:
    if not (REPO_ROOT / ".git").exists():
        return ({_rel(_registry_path()): ["M"]} if _registry_path().exists() else {}), "N/A", "N/A", "non-git-repo"

    resolved_base, resolved_head, base_source = _resolve_range(base, head)
    range_changes = _get_changed_name_status(resolved_base, resolved_head)
    worktree_changes = _get_worktree_name_status()
    return _merge_changed_maps(range_changes, worktree_changes), resolved_base, resolved_head, base_source


def _normalize_registry_paths(raw_paths: list[Any], violations: list[dict[str, str]]) -> list[str]:
    normalized: list[str] = []
    seen: set[str] = set()
    cutoff = dt.datetime.now() - dt.timedelta(days=ARCHIVE_MODULE.AGE_THRESHOLD_DAYS)

    for entry in raw_paths:
        if not isinstance(entry, str) or not entry:
            violations.append(
                {
                    "type": "invalid_registry_entry",
                    "path": _rel(_registry_path()),
                    "message": "retainEvidencePaths entries must be non-empty strings.",
                }
            )
            continue

        candidate = entry.replace("\\", "/")
        if candidate in seen:
            violations.append(
                {
                    "type": "duplicate_retain_evidence_path",
                    "path": _rel(_registry_path()),
                    "message": f"Duplicate retain-evidence audit path `{candidate}`.",
                }
            )
            continue
        seen.add(candidate)
        normalized.append(candidate)

        if not candidate.startswith("docs/audits/"):
            violations.append(
                {
                    "type": "invalid_retain_evidence_scope",
                    "path": _rel(_registry_path()),
                    "message": f"Retain-evidence path `{candidate}` must stay under `docs/audits/`.",
                }
            )
            continue

        candidate_path = REPO_ROOT / Path(candidate)
        if not candidate_path.exists():
            violations.append(
                {
                    "type": "missing_retain_evidence_file",
                    "path": _rel(_registry_path()),
                    "message": f"Retain-evidence path `{candidate}` does not exist.",
                }
            )
            continue

        file_date = ARCHIVE_MODULE.extract_date_from_filename(candidate_path.name)
        if file_date is None:
            violations.append(
                {
                    "type": "retain_evidence_missing_date_suffix",
                    "path": _rel(_registry_path()),
                    "message": f"Retain-evidence path `{candidate}` is missing a dated filename suffix.",
                }
            )
            continue

        if file_date > cutoff:
            violations.append(
                {
                    "type": "retain_evidence_not_historical",
                    "path": _rel(_registry_path()),
                    "message": f"Retain-evidence path `{candidate}` is still within the active date window.",
                }
            )

    return normalized


def _compute_dynamic_blocked_audits() -> tuple[set[str], dict[str, int]]:
    cutoff = dt.datetime.now() - dt.timedelta(days=ARCHIVE_MODULE.AGE_THRESHOLD_DAYS)
    with patch.object(ARCHIVE_MODULE, "PROJECT_ROOT", REPO_ROOT), patch.object(
        ARCHIVE_MODULE, "ACTIVE_WINDOW_REGISTRY_PATH", _active_window_registry_path()
    ), patch.object(ARCHIVE_MODULE, "AUDIT_RETENTION_REGISTRY_PATH", _registry_path()):
        ARCHIVE_MODULE.load_active_window_paths.cache_clear()
        ARCHIVE_MODULE.load_audit_retain_evidence_paths.cache_clear()
        scan = ARCHIVE_MODULE.scan_root(_audits_root(), cutoff)
        candidates = scan.archive_candidates

        with patch.object(ARCHIVE_MODULE, "load_audit_retain_evidence_paths", return_value=set()):
            risks, _ = ARCHIVE_MODULE.build_full_plan(cutoff, {"docs/audits": scan}, candidates)

        blocked = {
            rel_path
            for rel_path, risk in risks.items()
            if risk.blocked
        }
        counts = {
            "activeRecentCount": len(scan.active),
            "retainEvidenceCandidateCount": len(blocked),
            "safeToArchiveCount": sum(1 for rel_path in risks if rel_path not in blocked),
        }

        ARCHIVE_MODULE.load_active_window_paths.cache_clear()
        ARCHIVE_MODULE.load_audit_retain_evidence_paths.cache_clear()
        return blocked, counts


def build_report(
    *,
    base: str | None = None,
    head: str | None = None,
    changed_paths: dict[str, list[str]] | None = None,
) -> dict[str, Any]:
    timestamp = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    violations: list[dict[str, str]] = []
    registry_path = _registry_path()
    resolved_base = "N/A"
    resolved_head = "N/A"
    base_source = "not-requested"

    if not registry_path.exists():
        return {
            "timestamp": timestamp,
            "registryPath": _rel(registry_path),
            "violationCount": 1,
            "violations": [
                {
                    "type": "registry_missing",
                    "path": _rel(registry_path),
                    "message": "Audit retention registry is missing.",
                }
            ],
            "compliant": False,
        }

    if changed_paths is None:
        changed_paths, resolved_base, resolved_head, base_source = _resolve_changed_paths(base, head)

    registry = _read_json(registry_path)
    classes = registry.get("classes", [])
    if not isinstance(classes, list):
        violations.append(
            {
                "type": "invalid_classes_shape",
                "path": _rel(registry_path),
                "message": "Registry `classes` must be an array.",
            }
        )
        classes = []

    class_ids = {entry.get("id") for entry in classes if isinstance(entry, dict) and entry.get("id")}
    missing_class_ids = sorted(REQUIRED_CLASS_IDS - class_ids)
    for class_id in missing_class_ids:
        violations.append(
            {
                "type": "missing_required_class",
                "path": _rel(registry_path),
                "message": f"Audit retention registry is missing required class `{class_id}`.",
            }
        )

    retain_paths = registry.get("retainEvidencePaths", [])
    if not isinstance(retain_paths, list):
        violations.append(
            {
                "type": "invalid_retain_evidence_shape",
                "path": _rel(registry_path),
                "message": "Registry `retainEvidencePaths` must be an array.",
            }
        )
        retain_paths = []

    normalized_retain_paths = _normalize_registry_paths(retain_paths, violations)

    summary = registry.get("summary", {})
    if isinstance(summary, dict):
        summary_count = summary.get("retainEvidenceCount")
        if summary_count is not None and summary_count != len(normalized_retain_paths):
            violations.append(
                {
                    "type": "retain_evidence_count_mismatch",
                    "path": _rel(registry_path),
                    "message": (
                        "Registry summary retainEvidenceCount does not match the number of "
                        f"retainEvidencePaths ({summary_count} != {len(normalized_retain_paths)})."
                    ),
                }
            )

    retention_affecting = _retention_affecting_changes_present(changed_paths, resolved_base, resolved_head)
    dynamic_scan_mode = "full" if retention_affecting else "skipped_no_retention_affecting_changes"
    dynamic_counts: dict[str, int] | dict[str, str]
    missing_registry_paths: list[str] = []
    if retention_affecting:
        dynamic_blocked, dynamic_counts = _compute_dynamic_blocked_audits()
        missing_registry_paths = sorted(dynamic_blocked - set(normalized_retain_paths))
        for path in missing_registry_paths:
            violations.append(
                {
                    "type": "missing_dynamic_retain_evidence_entry",
                    "path": _rel(registry_path),
                    "message": (
                        f"Historical audit `{path}` is dynamically blocked from archive by live references "
                        "but is not registered as retain-evidence."
                    ),
                }
            )
    else:
        dynamic_counts = {"status": "skipped"}

    return {
        "timestamp": timestamp,
        "registryPath": _rel(registry_path),
        "range": f"{resolved_base}..{resolved_head}",
        "baseSource": base_source,
        "changedFileCount": len(changed_paths),
        "retentionAffectingChanges": retention_affecting,
        "dynamicScanMode": dynamic_scan_mode,
        "requiredClassIds": sorted(REQUIRED_CLASS_IDS),
        "registeredRetainEvidenceCount": len(normalized_retain_paths),
        "dynamicCounts": dynamic_counts,
        "missingDynamicRetainEvidencePaths": missing_registry_paths,
        "violationCount": len(violations),
        "violations": violations,
        "compliant": not violations,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate the CVF audit retention registry.")
    parser.add_argument("--base", default=None, help="Git base ref for change-scope detection.")
    parser.add_argument("--head", default=None, help="Git head ref for change-scope detection.")
    parser.add_argument("--enforce", action="store_true", help="Return non-zero exit code on violations.")
    args = parser.parse_args()

    report = build_report(base=args.base, head=args.head)
    print(json.dumps(report, indent=2))
    if args.enforce and not report["compliant"]:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
