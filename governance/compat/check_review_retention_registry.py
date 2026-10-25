#!/usr/bin/env python3
"""
CVF Review Retention Registry Compatibility Gate

Validates the stricter retention classification for `docs/reviews/` so the
generic archive flow can distinguish:
- recent active decision/review artifacts
- historical review artifacts that must remain active evidence
- historical review artifacts that are safe to archive
"""

from __future__ import annotations

import argparse
import datetime as dt
import importlib.util
import json
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Any
from unittest.mock import patch


REPO_ROOT = Path(__file__).resolve().parents[2]
ARCHIVE_MODULE_PATH = REPO_ROOT / "scripts" / "cvf_active_archive.py"
ARCHIVE_MODULE = None
DEFAULT_BASE_CANDIDATES = ("origin/main", "origin/master", "main", "master")
REQUIRED_CLASS_IDS = {
    "ACTIVE_DECISION_REVIEW",
    "RETAIN_EVIDENCE_REVIEW",
    "SAFE_TO_ARCHIVE_REVIEW",
}
RETENTION_ALWAYS_FULL_PREFIXES = (
    "docs/reviews/",
)
RETENTION_ALWAYS_FULL_EXACT = {
    "governance/compat/CVF_REVIEW_RETENTION_REGISTRY.json",
    "governance/compat/CVF_ACTIVE_WINDOW_REGISTRY.json",
    "governance/compat/check_review_retention_registry.py",
    "scripts/cvf_active_archive.py",
}
RETENTION_REFERENCE_CANDIDATE_PREFIXES = (
    "docs/reviews/",
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
RETENTION_TARGET_MARKERS = ("docs/reviews/", "docs/reviews/archive/")
RETENTION_DATE_PATTERNS = (
    re.compile(r"(\d{4}-\d{2}-\d{2})"),
    re.compile(r"(\d{4}_\d{2}_\d{2})"),
)
PUBLIC_REQUIRED_FILES = (
    "governance/compat/CVF_ACTIVE_WINDOW_REGISTRY.json",
    "governance/toolkit/05_OPERATION/CVF_ACTIVE_ARCHIVE_GUARD.md",
    "governance/toolkit/05_OPERATION/CVF_ACTIVE_WINDOW_REGISTRY_GUARD.md",
    "docs/reference/CVF_REVIEW_RETENTION_CLASSIFICATION.md",
    "docs/reference/CVF_ACTIVE_WINDOW_CLASSIFICATION.md",
)
PUBLIC_REQUIRED_MARKERS = {
    "governance/toolkit/05_OPERATION/CVF_ACTIVE_ARCHIVE_GUARD.md": (
        "docs/reviews/",
        "CVF_REVIEW_RETENTION_REGISTRY.json",
    ),
    "governance/toolkit/05_OPERATION/CVF_ACTIVE_WINDOW_REGISTRY_GUARD.md": (
        "canonical active trace/log window",
        "CVF_ACTIVE_WINDOW_REGISTRY.json",
        "CVF_ACTIVE_WINDOW_CLASSIFICATION.md",
    ),
    "docs/reference/CVF_REVIEW_RETENTION_CLASSIFICATION.md": (
        "CVF_REVIEW_RETENTION_REGISTRY.json",
        "ACTIVE_DECISION_REVIEW",
        "RETAIN_EVIDENCE_REVIEW",
        "SAFE_TO_ARCHIVE_REVIEW",
        "registry-pinned `retain-evidence` reviews are blocked even if they are old",
    ),
    "docs/reference/CVF_ACTIVE_WINDOW_CLASSIFICATION.md": (
        "CVF_ACTIVE_WINDOW_REGISTRY.json",
        "GLOBAL_APPEND_ONLY_LOG_WINDOW",
        "Registration Rule",
    ),
}


def _load_archive_module():
    spec = importlib.util.spec_from_file_location("cvf_active_archive", ARCHIVE_MODULE_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load archive module from {ARCHIVE_MODULE_PATH}")
    module = importlib.util.module_from_spec(spec)
    sys.modules.setdefault(spec.name, module)
    spec.loader.exec_module(module)
    return module


def _archive_module():
    """Load the private archive executor only for the private evidence scan."""
    global ARCHIVE_MODULE
    if ARCHIVE_MODULE is None:
        ARCHIVE_MODULE = _load_archive_module()
    return ARCHIVE_MODULE


def _require_public_projection() -> str | None:
    try:
        from guard_binding_catalog import require_public_projection
    except ModuleNotFoundError:
        from governance.compat.guard_binding_catalog import require_public_projection
    try:
        require_public_projection(REPO_ROOT)
    except ValueError as exc:
        return str(exc)
    return None


def _validate_public_sources() -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    mismatch = _require_public_projection()
    if mismatch:
        violations.append({
            "type": "public_carrier_mismatch",
            "path": "AGENTS.md",
            "message": mismatch,
        })

    for rel_path in PUBLIC_REQUIRED_FILES:
        path = REPO_ROOT / rel_path
        if not path.is_file():
            violations.append({
                "type": "missing_public_required_file",
                "path": rel_path,
                "message": f"Required public archive contract file is missing: `{rel_path}`.",
            })
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        for marker in PUBLIC_REQUIRED_MARKERS.get(rel_path, ()):
            if marker not in text:
                violations.append({
                    "type": "missing_public_contract_marker",
                    "path": rel_path,
                    "message": f"`{rel_path}` is missing required public marker `{marker}`.",
                })
    return violations


def _registry_date_from_filename(filename: str) -> dt.datetime | None:
    for pattern in RETENTION_DATE_PATTERNS:
        match = pattern.search(filename)
        if not match:
            continue
        try:
            return dt.datetime.strptime(match.group(1).replace("_", "-"), "%Y-%m-%d")
        except ValueError:
            continue
    return None


def _rel(path: Path) -> str:
    return path.relative_to(REPO_ROOT).as_posix()


def _registry_path() -> Path:
    return REPO_ROOT / "governance" / "compat" / "CVF_REVIEW_RETENTION_REGISTRY.json"


def _active_window_registry_path() -> Path:
    return REPO_ROOT / "governance" / "compat" / "CVF_ACTIVE_WINDOW_REGISTRY.json"


def _reviews_root() -> Path:
    return REPO_ROOT / "docs" / "reviews"


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


def _normalize_registry_paths(
    raw_paths: list[Any],
    violations: list[dict[str, str]],
    *,
    public_profile: bool = False,
) -> list[str]:
    normalized: list[str] = []
    seen: set[str] = set()
    archive_module = None if public_profile else _archive_module()
    cutoff = None if public_profile else dt.datetime.now() - dt.timedelta(days=archive_module.AGE_THRESHOLD_DAYS)

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
                    "message": f"Duplicate retain-evidence review path `{candidate}`.",
                }
            )
            continue
        seen.add(candidate)
        normalized.append(candidate)

        if (
            not candidate.startswith("docs/reviews/")
            or (public_profile and (candidate.startswith("/") or any(part in {"", ".", ".."} for part in candidate.split("/"))))
        ):
            violations.append(
                {
                    "type": "invalid_retain_evidence_scope",
                    "path": _rel(_registry_path()),
                    "message": f"Retain-evidence path `{candidate}` must stay under `docs/reviews/`.",
                }
            )
            continue

        candidate_path = REPO_ROOT / Path(candidate)
        if not public_profile and not candidate_path.exists():
            violations.append(
                {
                    "type": "missing_retain_evidence_file",
                    "path": _rel(_registry_path()),
                    "message": f"Retain-evidence path `{candidate}` does not exist.",
                }
            )
            continue

        file_date = (
            _registry_date_from_filename(candidate_path.name)
            if public_profile
            else archive_module.extract_date_from_filename(candidate_path.name)
        )
        if file_date is None:
            violations.append(
                {
                    "type": "retain_evidence_missing_date_suffix",
                    "path": _rel(_registry_path()),
                    "message": f"Retain-evidence path `{candidate}` is missing a dated filename suffix.",
                }
            )
            continue

        if public_profile and file_date.date() > dt.date.today():
            violations.append(
                {
                    "type": "retain_evidence_future_date",
                    "path": _rel(_registry_path()),
                    "message": f"Retain-evidence path `{candidate}` has a future date token.",
                }
            )
        elif cutoff is not None and file_date > cutoff:
            violations.append(
                {
                    "type": "retain_evidence_not_historical",
                    "path": _rel(_registry_path()),
                    "message": f"Retain-evidence path `{candidate}` is still within the active date window.",
                }
            )

    return normalized


def _compute_dynamic_blocked_reviews() -> tuple[set[str], dict[str, int]]:
    archive_module = _archive_module()
    cutoff = dt.datetime.now() - dt.timedelta(days=archive_module.AGE_THRESHOLD_DAYS)
    with patch.object(archive_module, "PROJECT_ROOT", REPO_ROOT), patch.object(
        archive_module, "ACTIVE_WINDOW_REGISTRY_PATH", _active_window_registry_path()
    ), patch.object(archive_module, "REVIEW_RETENTION_REGISTRY_PATH", _registry_path()):
        archive_module.load_active_window_paths.cache_clear()
        archive_module.load_review_retain_evidence_paths.cache_clear()
        scan = archive_module.scan_root(_reviews_root(), cutoff)
        candidates = scan.archive_candidates

        with patch.object(archive_module, "load_review_retain_evidence_paths", return_value=set()):
            risks, _ = archive_module.build_full_plan(cutoff, {"docs/reviews": scan}, candidates)

        blocked = {rel_path for rel_path, risk in risks.items() if risk.blocked}
        counts = {
            "activeRecentCount": len(scan.active),
            "retainEvidenceCandidateCount": len(blocked),
            "safeToArchiveCount": sum(1 for rel_path in risks if rel_path not in blocked),
        }

        archive_module.load_active_window_paths.cache_clear()
        archive_module.load_review_retain_evidence_paths.cache_clear()
        return blocked, counts


def build_report(
    *,
    base: str | None = None,
    head: str | None = None,
    changed_paths: dict[str, list[str]] | None = None,
    scan_mode: str = "auto",
    profile: str = "private",
) -> dict[str, Any]:
    if profile not in {"private", "public"}:
        raise ValueError(f"Unsupported retention profile: {profile}")
    if profile == "public" and scan_mode != "auto":
        raise ValueError("Public retention profile does not accept a private evidence scan mode")
    timestamp = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    violations: list[dict[str, str]] = []
    if profile == "public":
        violations.extend(_validate_public_sources())
    registry_path = _registry_path()
    resolved_base = "N/A"
    resolved_head = "N/A"
    base_source = "not-requested"

    if not registry_path.is_file():
        missing_type = "missing_public_required_file" if profile == "public" else "registry_missing"
        violations.append({
            "type": missing_type,
            "path": _rel(registry_path),
            "message": "Review retention registry is missing.",
        })
        return {
            "timestamp": timestamp,
            "registryPath": _rel(registry_path),
            "profile": profile,
            "dynamicScanMode": "not_applicable_public_profile" if profile == "public" else "not-run",
            "violationCount": len(violations),
            "violations": violations,
            "compliant": False,
        }

    if profile == "public":
        changed_paths = {}
        base_source = "not_applicable_public_profile"
    elif changed_paths is None:
        changed_paths, resolved_base, resolved_head, base_source = _resolve_changed_paths(base, head)

    try:
        registry = _read_json(registry_path)
    except (OSError, json.JSONDecodeError) as exc:
        if profile == "private":
            raise
        violations.append({
            "type": "invalid_registry_json",
            "path": _rel(registry_path),
            "message": f"Public review retention registry is unreadable JSON: {exc}.",
        })
        registry = {}
    if profile == "public" and not isinstance(registry, dict):
        violations.append({
            "type": "invalid_registry_shape",
            "path": _rel(registry_path),
            "message": "Public review retention registry must be an object.",
        })
        registry = {}
    if profile == "public" and (
        not isinstance(registry.get("version"), int)
        or isinstance(registry.get("version"), bool)
        or registry.get("version") != 1
    ):
        violations.append({
            "type": "invalid_registry_version",
            "path": _rel(registry_path),
            "message": "Public review retention registry must declare version 1.",
        })
    if profile == "public":
        reviewed = registry.get("lastReviewed")
        try:
            reviewed_date = (
                dt.date.fromisoformat(reviewed)
                if isinstance(reviewed, str) and re.fullmatch(r"\d{4}-\d{2}-\d{2}", reviewed)
                else None
            )
        except ValueError:
            reviewed_date = None
        if reviewed_date is None:
            violations.append({
                "type": "invalid_last_reviewed_date",
                "path": _rel(registry_path),
                "message": "Public review retention registry must declare a valid ISO lastReviewed date.",
            })
        elif reviewed_date > dt.date.today():
            violations.append({
                "type": "future_last_reviewed_date",
                "path": _rel(registry_path),
                "message": "Public review retention registry lastReviewed date cannot be in the future.",
            })
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

    class_ids: set[str] = set()
    for entry in classes:
        if (
            not isinstance(entry, dict)
            or not isinstance(entry.get("id"), str)
            or not entry.get("id")
            or not isinstance(entry.get("description"), str)
            or not entry.get("description")
        ):
            if profile == "public":
                violations.append({
                    "type": "invalid_class_entry",
                    "path": _rel(registry_path),
                    "message": "Each public retention class must declare a non-empty id and description.",
                })
            continue
        class_id = entry["id"]
        if class_id in class_ids and profile == "public":
            violations.append({
                "type": "duplicate_class_id",
                "path": _rel(registry_path),
                "message": f"Duplicate public retention class id `{class_id}`.",
            })
        class_ids.add(class_id)
    missing_class_ids = sorted(REQUIRED_CLASS_IDS - class_ids)
    for class_id in missing_class_ids:
        violations.append(
            {
                "type": "missing_required_class",
                "path": _rel(registry_path),
                "message": f"Review retention registry is missing required class `{class_id}`.",
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

    normalized_retain_paths = _normalize_registry_paths(
        retain_paths,
        violations,
        public_profile=profile == "public",
    )

    summary = registry.get("summary", {})
    if isinstance(summary, dict):
        summary_count = summary.get("retainEvidenceCount")
        if profile == "public":
            for field in ("activeRecentCount", "retainEvidenceCount", "safeToArchiveCount", "archivedCount"):
                value = summary.get(field)
                if value is None:
                    continue
                if not isinstance(value, int) or isinstance(value, bool) or value < 0:
                    violations.append({
                        "type": "invalid_summary_count",
                        "path": _rel(registry_path),
                        "message": f"Public registry summary `{field}` must be a non-negative integer.",
                    })
            derived_at = summary.get("derivedAt")
            try:
                derived_date = (
                    dt.date.fromisoformat(derived_at)
                    if isinstance(derived_at, str) and re.fullmatch(r"\d{4}-\d{2}-\d{2}", derived_at)
                    else None
                )
            except ValueError:
                derived_date = None
            if derived_at is not None and derived_date is None:
                violations.append({
                    "type": "invalid_summary_date",
                    "path": _rel(registry_path),
                    "message": "Public review registry summary derivedAt must be a valid ISO date when present.",
                })
            method = summary.get("derivationMethod")
            if method is not None and (not isinstance(method, str) or not method.strip()):
                violations.append({
                    "type": "invalid_summary_method",
                    "path": _rel(registry_path),
                    "message": "Public review registry summary derivationMethod must be non-empty text when present.",
                })
            if summary_count is None:
                violations.append({
                    "type": "missing_retain_evidence_count",
                    "path": _rel(registry_path),
                    "message": "Public review registry summary must declare retainEvidenceCount.",
                })
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
    elif profile == "public":
        violations.append({
            "type": "invalid_summary_shape",
            "path": _rel(registry_path),
            "message": "Public review retention registry summary must be an object.",
        })

    if scan_mode not in {"auto", "fast", "full"}:
        raise ValueError(f"Unsupported scan_mode: {scan_mode}")

    if profile == "public":
        detected_retention_affecting = None
        retention_affecting = None
        dynamic_scan_mode = "not_applicable_public_profile"
        dynamic_counts: dict[str, int] | dict[str, str] = {"status": "not_applicable_private_evidence"}
    else:
        detected_retention_affecting = _retention_affecting_changes_present(
            changed_paths,
            resolved_base,
            resolved_head,
        )
        retention_affecting = scan_mode == "full" or (
            scan_mode == "auto" and detected_retention_affecting
        )
        if scan_mode == "fast":
            dynamic_scan_mode = "skipped_fast_hook_mode"
        elif retention_affecting:
            dynamic_scan_mode = "full" if scan_mode == "auto" else "full_forced"
        else:
            dynamic_scan_mode = "skipped_no_retention_affecting_changes"
        dynamic_counts = {}
    missing_registry_paths: list[str] = []
    if profile == "private" and retention_affecting:
        dynamic_blocked, dynamic_counts = _compute_dynamic_blocked_reviews()
        missing_registry_paths = sorted(dynamic_blocked - set(normalized_retain_paths))
        for path in missing_registry_paths:
            violations.append(
                {
                    "type": "missing_dynamic_retain_evidence_entry",
                    "path": _rel(registry_path),
                    "message": (
                        f"Historical review `{path}` is dynamically blocked from archive by live references "
                        "but is not registered as retain-evidence."
                    ),
                }
            )
    elif profile == "private":
        dynamic_counts = {"status": "skipped"}

    report = {
        "timestamp": timestamp,
        "registryPath": _rel(registry_path),
        "range": f"{resolved_base}..{resolved_head}",
        "baseSource": base_source,
        "changedFileCount": len(changed_paths),
        "scanMode": scan_mode,
        "retentionAffectingChanges": retention_affecting,
        "detectedRetentionAffectingChanges": detected_retention_affecting,
        "dynamicScanMode": dynamic_scan_mode,
        "requiredClassIds": sorted(REQUIRED_CLASS_IDS),
        "registeredRetainEvidenceCount": len(normalized_retain_paths),
        "dynamicCounts": dynamic_counts,
        "missingDynamicRetainEvidencePaths": missing_registry_paths,
        "violationCount": len(violations),
        "violations": violations,
        "compliant": not violations,
    }
    report["profile"] = profile
    if profile == "public":
        report.update({
            "publicArchiveExecutor": "not_applicable_private_effect_executor",
            "privateEvidenceScan": "not_applicable_public_profile",
            "claimBoundary": "PUBLIC_RETENTION_REGISTRY_CONTRACT_ONLY_NOT_PRIVATE_ARCHIVE_READINESS",
        })
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate the CVF review retention registry.")
    parser.add_argument("--base", default=None, help="Git base ref for change-scope detection.")
    parser.add_argument("--head", default=None, help="Git head ref for change-scope detection.")
    parser.add_argument("--profile", choices=("private", "public"), default="private")
    parser.add_argument(
        "--scan-mode",
        choices=("auto", "fast", "full"),
        default="auto",
        help=(
            "Dynamic retention scan mode. Use fast for hook chains; use full for "
            "explicit registry re-derivation or archive/recovery audits."
        ),
    )
    parser.add_argument("--enforce", action="store_true", help="Return non-zero exit code on violations.")
    args = parser.parse_args()

    report = build_report(base=args.base, head=args.head, scan_mode=args.scan_mode, profile=args.profile)
    print(json.dumps(report, indent=2))
    if args.enforce and not report["compliant"]:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
