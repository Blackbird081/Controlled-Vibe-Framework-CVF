#!/usr/bin/env python3
"""
CVF Active-Archive File Management Script
=========================================
Separates recent files (<=3 days) from historical files (>3 days)
across managed CVF documentation roots.

Safety upgrade:
- Archive is no longer purely age-based.
- Candidates are screened for reference-impact before moving.
- High-impact or protected-reference files stay active and are reported.

Usage:
    python scripts/cvf_active_archive.py --dry-run
    python scripts/cvf_active_archive.py --execute
    python scripts/cvf_active_archive.py --refresh-baseline
    python scripts/cvf_active_archive.py --restore
    python scripts/cvf_active_archive.py --status
    python scripts/cvf_active_archive.py --impact-scan
    python scripts/cvf_active_archive.py --link-audit
    python scripts/cvf_active_archive.py --repair-broken-archive-links
    python scripts/cvf_active_archive.py --dry-run --full-scan
"""

from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from functools import lru_cache
from pathlib import Path
from typing import Optional


SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent

# Managed roots now cover the whole docs tree + strategy line.
MANAGED_ROOTS = [
    "docs",
    "ECOSYSTEM/strategy",
]

ARCHIVE_FOLDER = "archive"
ARCHIVE_INDEX_FILENAME = "CVF_ARCHIVE_INDEX.md"
LEGACY_ARCHIVE_INDEX_FILENAME = "ARCHIVE_INDEX.md"
AGE_THRESHOLD_DAYS = 3
MANAGED_EXTENSIONS = {".md", ".json"}
ACTIVE_WINDOW_REGISTRY_PATH = PROJECT_ROOT / "governance" / "compat" / "CVF_ACTIVE_WINDOW_REGISTRY.json"
ARCHIVE_BASELINE_FILENAME = "CVF_ACTIVE_ARCHIVE_BASELINE.json"

# Keep existing permanent names.
PERMANENT_FILES = {
    "README.md",
    "CVF_STRATEGIC_SUMMARY.md",
    "CVF_UNIFIED_ROADMAP_2026.md",
    "CVF_WHITEPAPER_COMPLETION_ROADMAP_2026-03-21.md",
    "CVF_SYSTEM_UNIFICATION_REMEDIATION_ROADMAP_2026-03-19.md",
}

# Protect canonical anchors by full relative path.
PERMANENT_PATHS = {
    "docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md",
    "docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md",
    "AGENT_HANDOFF.md",
}

# Dedicated-rotation zones excluded from this guard to avoid policy overlap.
EXCLUDED_PATH_PREFIXES = (
    "docs/logs/",
    "docs/reviews/cvf_phase_governance/logs/",
)

# Reference scan settings for pre-archive risk screening.
REFERENCE_SCAN_TARGETS = [
    "docs",
    "AGENT_HANDOFF.md",
]
PROTECTED_REFERENCE_FILES = {
    "AGENT_HANDOFF.md",
    "docs/INDEX.md",
    "docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md",
    "docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md",
    "docs/reference/CVF_RELEASE_MANIFEST.md",
}
LIVE_REFERENCE_BLOCK_THRESHOLD = 3
MAX_LINK_AUDIT_PRINT_ROWS = 200

MARKDOWN_LINK_PATTERN = re.compile(r"\[[^\]]*]\(([^)]+)\)")
AUTOLINK_PATTERN = re.compile(r"<((?:\./|\.\./|/)[^>\s]+)>")
HTML_TAG_LIKE_TARGETS = {
    "/div",
    "/table",
    "/td",
    "/tr",
    "/tbody",
    "/thead",
    "/th",
    "/p",
    "/span",
    "/ul",
    "/li",
    "/code",
    "/pre",
    "/br",
    "/blockquote",
    "/details",
    "/summary",
}

DATE_PATTERNS = [
    re.compile(r"(\d{4}-\d{2}-\d{2})"),
    re.compile(r"(\d{4}_\d{2}_\d{2})"),
]


@dataclass
class FileInfo:
    path: Path
    rel_path: str
    date: datetime
    size: int


@dataclass
class CandidateRisk:
    info: FileInfo
    blocked: bool
    reason: Optional[str] = None
    live_reference_sources: list[str] = field(default_factory=list)
    protected_reference_sources: list[str] = field(default_factory=list)
    markdown_link_sources: list[str] = field(default_factory=list)


@dataclass
class LinkIssue:
    source: str
    raw_target: str
    resolved_target: str
    suggested_archive_target: Optional[str] = None


@dataclass
class ScanResult:
    active: list[FileInfo] = field(default_factory=list)
    archive_candidates: list[FileInfo] = field(default_factory=list)
    permanent: list[Path] = field(default_factory=list)
    non_dated: list[Path] = field(default_factory=list)
    already_archived: list[Path] = field(default_factory=list)


@dataclass
class PlanMetadata:
    scope_mode: str
    baseline_found: bool
    baseline_path: Optional[str] = None
    baseline_git_head: Optional[str] = None
    changed_rel_paths: set[str] = field(default_factory=set)
    reused_candidate_count: int = 0
    evaluated_candidate_count: int = 0


def to_rel_path(path: Path) -> str:
    return path.relative_to(PROJECT_ROOT).as_posix()


def get_archive_baseline_path() -> Path:
    return PROJECT_ROOT / "governance" / "compat" / ARCHIVE_BASELINE_FILENAME


def is_archive_path(path: Path) -> bool:
    return ARCHIVE_FOLDER in path.parts


def is_excluded_path(rel_path: str) -> bool:
    return any(rel_path.startswith(prefix) for prefix in EXCLUDED_PATH_PREFIXES)


def extract_date_from_filename(filename: str) -> Optional[datetime]:
    for pattern in DATE_PATTERNS:
        match = pattern.search(filename)
        if not match:
            continue
        date_str = match.group(1).replace("_", "-")
        try:
            return datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            continue
    return None


def compute_file_signature(path: Path) -> str:
    stat = path.stat()
    return f"{stat.st_size}:{stat.st_mtime_ns}"


def is_permanent(filepath: Path, rel_path: str) -> bool:
    if filepath.name in PERMANENT_FILES:
        return True
    if rel_path in PERMANENT_PATHS:
        return True
    if rel_path in load_active_window_paths():
        return True
    return False


@lru_cache(maxsize=1)
def load_active_window_paths() -> set[str]:
    if not ACTIVE_WINDOW_REGISTRY_PATH.exists():
        raise RuntimeError(
            "Active window registry is missing. Expected: "
            f"{ACTIVE_WINDOW_REGISTRY_PATH.relative_to(PROJECT_ROOT).as_posix()}"
        )
    registry = json.loads(ACTIVE_WINDOW_REGISTRY_PATH.read_text(encoding="utf-8"))
    return {
        entry["activePath"]
        for entry in registry.get("windows", [])
        if isinstance(entry, dict)
        and entry.get("status") == "ACTIVE"
        and entry.get("protectionMode") == "PERMANENT_ACTIVE_WINDOW"
        and entry.get("activePath")
    }


def load_archive_baseline() -> Optional[dict]:
    baseline_path = get_archive_baseline_path()
    if not baseline_path.exists():
        return None
    try:
        data = json.loads(baseline_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    if not isinstance(data, dict):
        return None
    if not isinstance(data.get("files"), dict):
        return None
    return data


def iter_managed_files(root_path: Path) -> list[Path]:
    files: list[Path] = []
    if not root_path.exists():
        return files

    for item in root_path.rglob("*"):
        if not item.is_file():
            continue
        if item.suffix.lower() not in MANAGED_EXTENSIONS:
            continue
        if is_archive_path(item):
            continue
        rel_path = to_rel_path(item)
        if is_excluded_path(rel_path):
            continue
        files.append(item)
    return files


def collect_archived_files(root_path: Path) -> list[Path]:
    archived: list[Path] = []
    if not root_path.exists():
        return archived
    for item in root_path.rglob("*"):
        if not item.is_file():
            continue
        if ARCHIVE_FOLDER not in item.parts:
            continue
        archived.append(item)
    return archived


def scan_root(root_path: Path, cutoff_date: datetime) -> ScanResult:
    result = ScanResult()

    files = iter_managed_files(root_path)
    for file_path in files:
        rel_path = to_rel_path(file_path)
        if is_permanent(file_path, rel_path):
            result.permanent.append(file_path)
            continue

        date = extract_date_from_filename(file_path.name)
        if date is None:
            result.non_dated.append(file_path)
            continue

        info = FileInfo(path=file_path, rel_path=rel_path, date=date, size=file_path.stat().st_size)
        if date < cutoff_date:
            result.archive_candidates.append(info)
        else:
            result.active.append(info)

    result.already_archived = collect_archived_files(root_path)
    return result


def run_rg_fixed(query: str) -> set[str]:
    cmd = ["rg", "-l", "--fixed-strings", query, *REFERENCE_SCAN_TARGETS]
    proc = subprocess.run(
        cmd,
        cwd=PROJECT_ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="ignore",
        check=False,
    )
    if proc.returncode not in (0, 1):
        return set()
    lines = [line.strip().replace("\\", "/") for line in proc.stdout.splitlines() if line.strip()]
    return set(lines)


def iter_link_scan_sources() -> list[Path]:
    sources: list[Path] = []
    seen: set[str] = set()

    for target in REFERENCE_SCAN_TARGETS:
        target_path = PROJECT_ROOT / target
        if not target_path.exists():
            continue
        if target_path.is_file():
            rel_path = to_rel_path(target_path)
            if rel_path.endswith(".md") and rel_path not in seen and not is_excluded_path(rel_path):
                sources.append(target_path)
                seen.add(rel_path)
            continue

        for item in target_path.rglob("*.md"):
            if not item.is_file() or is_archive_path(item):
                continue
            rel_path = to_rel_path(item)
            if is_excluded_path(rel_path):
                continue
            if rel_path in seen:
                continue
            sources.append(item)
            seen.add(rel_path)

    return sources


@lru_cache(maxsize=1)
def iter_link_scan_source_rel_paths() -> tuple[str, ...]:
    return tuple(to_rel_path(path) for path in iter_link_scan_sources())


def extract_markdown_targets(content: str) -> list[str]:
    targets = [match.group(1).strip() for match in MARKDOWN_LINK_PATTERN.finditer(content)]
    targets.extend(match.group(1).strip() for match in AUTOLINK_PATTERN.finditer(content))
    return targets


@lru_cache(maxsize=4096)
def extract_resolved_markdown_targets_for_source(source_rel_path: str) -> tuple[str, ...]:
    source_path = PROJECT_ROOT / Path(source_rel_path)
    try:
        content = source_path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return tuple()

    resolved_targets: list[str] = []
    for raw_target in extract_markdown_targets(content):
        normalized = normalize_local_link_target(raw_target)
        if normalized is None:
            continue
        resolved = resolve_local_link(source_rel_path, normalized)
        if resolved is None or is_excluded_path(resolved):
            continue
        resolved_targets.append(resolved)
    return tuple(resolved_targets)


def normalize_local_link_target(raw_target: str) -> Optional[str]:
    target = raw_target.strip().strip("<>").strip()
    if not target:
        return None
    if target.startswith("#"):
        return None
    lowered = target.lower()
    if lowered.startswith(("http://", "https://", "mailto:", "tel:", "data:")):
        return None
    if lowered in HTML_TAG_LIKE_TARGETS:
        return None
    # strip heading anchors / query strings for local path resolution
    target = target.split("#", 1)[0].split("?", 1)[0].strip()
    if not target:
        return None
    return target


def resolve_local_link(source_rel_path: str, target: str) -> Optional[str]:
    source_abs = PROJECT_ROOT / Path(source_rel_path)
    if target.startswith("/"):
        candidate_abs = (PROJECT_ROOT / target.lstrip("/")).resolve()
    else:
        candidate_abs = (source_abs.parent / target).resolve()

    try:
        return candidate_abs.relative_to(PROJECT_ROOT).as_posix()
    except ValueError:
        return None


def detect_archive_relocation_target(resolved_target: str) -> Optional[str]:
    parts = Path(resolved_target).parts
    if len(parts) < 2 or ARCHIVE_FOLDER in parts:
        return None
    archive_rel = Path(*parts[:-1]) / ARCHIVE_FOLDER / parts[-1]
    archive_abs = PROJECT_ROOT / archive_rel
    if archive_abs.exists():
        return archive_rel.as_posix()
    return None


def build_markdown_link_index() -> tuple[dict[str, set[str]], list[LinkIssue]]:
    inbound_index: dict[str, set[str]] = {}
    broken_issues: list[LinkIssue] = []
    seen_issues: set[tuple[str, str, str]] = set()

    for source_path in iter_link_scan_sources():
        source_rel = to_rel_path(source_path)
        try:
            content = source_path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue

        for raw_target in extract_markdown_targets(content):
            normalized = normalize_local_link_target(raw_target)
            if normalized is None:
                continue
            resolved = resolve_local_link(source_rel, normalized)
            if resolved is None or is_excluded_path(resolved):
                continue

            inbound_index.setdefault(resolved, set()).add(source_rel)
            if not (PROJECT_ROOT / resolved).exists():
                issue_key = (source_rel, raw_target, resolved)
                if issue_key in seen_issues:
                    continue
                seen_issues.add(issue_key)
                broken_issues.append(
                    LinkIssue(
                        source=source_rel,
                        raw_target=raw_target,
                        resolved_target=resolved,
                        suggested_archive_target=detect_archive_relocation_target(resolved),
                    )
                )

    return inbound_index, broken_issues


def collect_markdown_link_sources_for_candidate(
    candidate: FileInfo,
    moving_rel_paths: set[str],
    source_rel_paths: Optional[tuple[str, ...]] = None,
) -> set[str]:
    filtered: set[str] = set()
    sources = source_rel_paths if source_rel_paths is not None else iter_link_scan_source_rel_paths()

    for source_rel in sources:
        if source_rel == candidate.rel_path:
            continue
        if "/archive/" in source_rel:
            continue
        if is_excluded_path(source_rel):
            continue
        if source_rel in moving_rel_paths:
            continue
        if candidate.rel_path in extract_resolved_markdown_targets_for_source(source_rel):
            filtered.add(source_rel)

    return filtered


def collect_live_reference_sources(candidate: FileInfo, moving_rel_paths: set[str]) -> set[str]:
    # Query by full relative path and filename (for relative links in nearby docs).
    queries = [candidate.rel_path, candidate.path.name]
    hits: set[str] = set()

    for query in queries:
        if len(query) < 6:
            continue
        hits.update(run_rg_fixed(query))

    filtered: set[str] = set()
    for hit in hits:
        if hit == candidate.rel_path:
            continue
        if "/archive/" in hit:
            continue
        if is_excluded_path(hit):
            continue
        # If source file is also being moved in this same run, do not treat as a live blocker.
        if hit in moving_rel_paths:
            continue
        filtered.add(hit)
    return filtered


def collect_markdown_link_sources(
    candidate: FileInfo,
    moving_rel_paths: set[str],
    markdown_link_index: dict[str, set[str]],
) -> set[str]:
    hits = markdown_link_index.get(candidate.rel_path, set())
    filtered: set[str] = set()
    for hit in hits:
        if hit == candidate.rel_path:
            continue
        if "/archive/" in hit:
            continue
        if is_excluded_path(hit):
            continue
        if hit in moving_rel_paths:
            continue
        filtered.add(hit)
    return filtered


def evaluate_candidate_risk(
    candidate: FileInfo,
    moving_rel_paths: set[str],
    markdown_link_index: Optional[dict[str, set[str]]] = None,
) -> CandidateRisk:
    live_sources = collect_live_reference_sources(candidate, moving_rel_paths)
    if markdown_link_index is None:
        markdown_link_sources = collect_markdown_link_sources_for_candidate(candidate, moving_rel_paths)
    else:
        markdown_link_sources = collect_markdown_link_sources(candidate, moving_rel_paths, markdown_link_index)
    protected_sources = sorted(source for source in live_sources if source in PROTECTED_REFERENCE_FILES)

    if protected_sources:
        return CandidateRisk(
            info=candidate,
            blocked=True,
            reason="protected_reference",
            live_reference_sources=sorted(live_sources),
            protected_reference_sources=protected_sources,
            markdown_link_sources=sorted(markdown_link_sources),
        )

    if markdown_link_sources:
        return CandidateRisk(
            info=candidate,
            blocked=True,
            reason=f"markdown_link_dependency({len(markdown_link_sources)})",
            live_reference_sources=sorted(live_sources),
            protected_reference_sources=[],
            markdown_link_sources=sorted(markdown_link_sources),
        )

    if len(live_sources) >= LIVE_REFERENCE_BLOCK_THRESHOLD:
        return CandidateRisk(
            info=candidate,
            blocked=True,
            reason=f"high_reference_count({len(live_sources)})",
            live_reference_sources=sorted(live_sources),
            protected_reference_sources=[],
            markdown_link_sources=sorted(markdown_link_sources),
        )

    return CandidateRisk(
        info=candidate,
        blocked=False,
        reason=None,
        live_reference_sources=sorted(live_sources),
        protected_reference_sources=[],
        markdown_link_sources=sorted(markdown_link_sources),
    )


def run_git_command(args: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", *args],
        cwd=PROJECT_ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="ignore",
        check=False,
    )


def get_git_head() -> Optional[str]:
    proc = run_git_command(["rev-parse", "HEAD"])
    if proc.returncode != 0:
        return None
    value = proc.stdout.strip()
    return value or None


def collect_incremental_changed_paths(base_head: Optional[str]) -> set[str]:
    changed: set[str] = set()
    scoped_paths = ["docs", "ECOSYSTEM/strategy", "AGENT_HANDOFF.md"]

    if base_head:
        diff_proc = run_git_command(["diff", "--name-only", "--relative", base_head, "--", *scoped_paths])
        if diff_proc.returncode in (0, 1):
            changed.update(
                line.strip().replace("\\", "/")
                for line in diff_proc.stdout.splitlines()
                if line.strip()
            )

    for extra_args in (
        ["diff", "--name-only", "--relative", "--", *scoped_paths],
        ["diff", "--name-only", "--relative", "--cached", "--", *scoped_paths],
        ["ls-files", "--others", "--exclude-standard", "--", *scoped_paths],
    ):
        proc = run_git_command(extra_args)
        if proc.returncode not in (0, 1):
            continue
        changed.update(
            line.strip().replace("\\", "/")
            for line in proc.stdout.splitlines()
            if line.strip()
        )

    return changed


def candidate_needs_re_evaluation(
    candidate: FileInfo,
    previous_record: Optional[dict],
    changed_rel_paths: set[str],
) -> bool:
    if previous_record is None:
        return True
    if previous_record.get("bucket") != "archive_candidate":
        return True
    if previous_record.get("signature") != compute_file_signature(candidate.path):
        return True
    if not previous_record.get("blocked", False):
        return True

    blocking_sources = set(previous_record.get("liveReferenceSources", []))
    blocking_sources.update(previous_record.get("markdownLinkSources", []))
    blocking_sources.update(previous_record.get("protectedReferenceSources", []))
    if blocking_sources.intersection(changed_rel_paths):
        return True

    return False


def reuse_candidate_risk(candidate: FileInfo, previous_record: dict) -> CandidateRisk:
    return CandidateRisk(
        info=candidate,
        blocked=bool(previous_record.get("blocked", False)),
        reason=previous_record.get("reason"),
        live_reference_sources=list(previous_record.get("liveReferenceSources", [])),
        protected_reference_sources=list(previous_record.get("protectedReferenceSources", [])),
        markdown_link_sources=list(previous_record.get("markdownLinkSources", [])),
    )


def generate_archive_index(archive_dir: Path) -> Path:
    index_path = archive_dir / ARCHIVE_INDEX_FILENAME
    legacy_index_path = archive_dir / LEGACY_ARCHIVE_INDEX_FILENAME

    lines = [
        "# Archive Index",
        "",
        f"> Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        f"> Total archived files: {sum(1 for f in archive_dir.iterdir() if f.name not in {ARCHIVE_INDEX_FILENAME, LEGACY_ARCHIVE_INDEX_FILENAME} and f.is_file())}",
        "",
        "| File | Original Date | Archived On | Size |",
        "|---|---|---|---|",
    ]

    for item in sorted(archive_dir.iterdir()):
        if item.name in {ARCHIVE_INDEX_FILENAME, LEGACY_ARCHIVE_INDEX_FILENAME} or item.is_dir():
            continue
        file_date = extract_date_from_filename(item.name)
        date_str = file_date.strftime("%Y-%m-%d") if file_date else "unknown"
        size_kb = item.stat().st_size / 1024
        lines.append(f"| `{item.name}` | {date_str} | {datetime.now().strftime('%Y-%m-%d')} | {size_kb:.1f} KB |")

    lines.append("")
    with open(index_path, "w", encoding="utf-8") as file:
        file.write("\n".join(lines))
    if legacy_index_path.exists():
        legacy_index_path.unlink()
    return index_path


def build_full_plan(
    cutoff_date: datetime,
    scans: dict[str, ScanResult],
    all_candidates: list[FileInfo],
) -> tuple[dict[str, CandidateRisk], int]:
    markdown_link_index, _ = build_markdown_link_index()
    moving_rel_paths = {candidate.rel_path for candidate in all_candidates}
    risks: dict[str, CandidateRisk] = {}

    for _ in range(8):
        next_risks: dict[str, CandidateRisk] = {}
        for candidate in all_candidates:
            next_risks[candidate.rel_path] = evaluate_candidate_risk(
                candidate,
                moving_rel_paths,
                markdown_link_index,
            )

        next_moving = {
            rel_path
            for rel_path, risk in next_risks.items()
            if not risk.blocked
        }
        risks = next_risks

        if next_moving == moving_rel_paths:
            break
        moving_rel_paths = next_moving

    return risks, len(all_candidates)


def build_bootstrap_plan(
    scans: dict[str, ScanResult],
    all_candidates: list[FileInfo],
) -> tuple[dict[str, CandidateRisk], PlanMetadata]:
    risks: dict[str, CandidateRisk] = {}
    for candidate in all_candidates:
        risks[candidate.rel_path] = CandidateRisk(
            info=candidate,
            blocked=True,
            reason="baseline_frozen_keep",
            live_reference_sources=[],
            protected_reference_sources=[],
            markdown_link_sources=[],
        )

    metadata = PlanMetadata(
        scope_mode="bootstrap",
        baseline_found=False,
        baseline_path=to_rel_path(get_archive_baseline_path()),
        baseline_git_head=None,
        changed_rel_paths=set(),
        reused_candidate_count=0,
        evaluated_candidate_count=len(all_candidates),
    )
    return risks, metadata


def build_incremental_plan(
    scans: dict[str, ScanResult],
    all_candidates: list[FileInfo],
    baseline: dict,
) -> tuple[dict[str, CandidateRisk], PlanMetadata]:
    changed_rel_paths = collect_incremental_changed_paths(baseline.get("gitHead"))
    previous_files = baseline.get("files", {})

    pending_candidates: list[FileInfo] = []
    reused_risks: dict[str, CandidateRisk] = {}

    for candidate in all_candidates:
        previous_record = previous_files.get(candidate.rel_path)
        if candidate_needs_re_evaluation(candidate, previous_record, changed_rel_paths):
            pending_candidates.append(candidate)
            continue
        reused_risks[candidate.rel_path] = reuse_candidate_risk(candidate, previous_record)

    moving_rel_paths = {candidate.rel_path for candidate in pending_candidates}
    evaluated_risks: dict[str, CandidateRisk] = {}

    for _ in range(8):
        next_evaluated: dict[str, CandidateRisk] = {}
        for candidate in pending_candidates:
            next_evaluated[candidate.rel_path] = evaluate_candidate_risk(
                candidate,
                moving_rel_paths,
                None,
            )

        next_moving = {
            rel_path
            for rel_path, risk in next_evaluated.items()
            if not risk.blocked
        }
        evaluated_risks = next_evaluated

        if next_moving == moving_rel_paths:
            break
        moving_rel_paths = next_moving

    risks = dict(reused_risks)
    risks.update(evaluated_risks)
    metadata = PlanMetadata(
        scope_mode="incremental",
        baseline_found=True,
        baseline_path=to_rel_path(get_archive_baseline_path()),
        baseline_git_head=baseline.get("gitHead"),
        changed_rel_paths=changed_rel_paths,
        reused_candidate_count=len(reused_risks),
        evaluated_candidate_count=len(pending_candidates),
    )
    return risks, metadata


def build_plan(cutoff_date: datetime, full_scan: bool = False) -> tuple[dict[str, ScanResult], dict[str, CandidateRisk], PlanMetadata]:
    scans: dict[str, ScanResult] = {}
    all_candidates: list[FileInfo] = []

    for root in MANAGED_ROOTS:
        root_path = PROJECT_ROOT / root
        scan = scan_root(root_path, cutoff_date)
        scans[root] = scan
        all_candidates.extend(scan.archive_candidates)

    baseline = None if full_scan else load_archive_baseline()
    if baseline is None and full_scan:
        risks, evaluated_count = build_full_plan(cutoff_date, scans, all_candidates)
        metadata = PlanMetadata(
            scope_mode="full",
            baseline_found=False,
            baseline_path=to_rel_path(get_archive_baseline_path()),
            baseline_git_head=None,
            changed_rel_paths=set(),
            reused_candidate_count=0,
            evaluated_candidate_count=evaluated_count,
        )
        return scans, risks, metadata

    if baseline is None:
        risks, metadata = build_bootstrap_plan(scans, all_candidates)
        return scans, risks, metadata

    risks, metadata = build_incremental_plan(scans, all_candidates, baseline)
    return scans, risks, metadata


def serialize_archive_baseline(
    cutoff_date: datetime,
    scans: dict[str, ScanResult],
    risks: dict[str, CandidateRisk],
    scope_mode: str,
) -> dict:
    files: dict[str, dict] = {}

    for scan in scans.values():
        for info in scan.active:
            files[info.rel_path] = {
                "bucket": "active_dated",
                "date": info.date.strftime("%Y-%m-%d"),
                "signature": compute_file_signature(info.path),
            }
        for candidate in scan.archive_candidates:
            risk = risks[candidate.rel_path]
            files[candidate.rel_path] = {
                "bucket": "archive_candidate",
                "date": candidate.date.strftime("%Y-%m-%d"),
                "signature": compute_file_signature(candidate.path),
                "blocked": risk.blocked,
                "reason": risk.reason,
                "liveReferenceSources": risk.live_reference_sources,
                "markdownLinkSources": risk.markdown_link_sources,
                "protectedReferenceSources": risk.protected_reference_sources,
            }

    return {
        "version": 1,
        "generatedAt": datetime.now().isoformat(),
        "gitHead": get_git_head(),
        "cutoffDate": cutoff_date.strftime("%Y-%m-%d"),
        "ageThresholdDays": AGE_THRESHOLD_DAYS,
        "scopeMode": scope_mode,
        "managedRoots": MANAGED_ROOTS,
        "files": files,
    }


def write_archive_baseline(cutoff_date: datetime, full_scan: bool = False) -> Path:
    scans, risks, metadata = build_plan(cutoff_date, full_scan=full_scan)
    baseline_data = serialize_archive_baseline(cutoff_date, scans, risks, metadata.scope_mode)
    baseline_path = get_archive_baseline_path()
    baseline_path.parent.mkdir(parents=True, exist_ok=True)
    baseline_path.write_text(json.dumps(baseline_data, indent=2), encoding="utf-8")
    return baseline_path


def do_archive(cutoff_date: datetime, execute: bool = False, full_scan: bool = False) -> None:
    mode_str = "EXECUTE" if execute else "DRY-RUN"
    scans, risks, metadata = build_plan(cutoff_date, full_scan=full_scan)

    moved_count = 0
    total_active = 0
    total_permanent = 0
    total_non_dated = 0
    total_already_archived = 0
    total_blocked = 0
    total_safe_candidates = 0

    print("\n" + "=" * 60)
    print("CVF Active-Archive Report")
    print(f"Mode: {mode_str}")
    print(f"Scope mode: {metadata.scope_mode.upper()}")
    print(f"Cutoff date: {cutoff_date.strftime('%Y-%m-%d')} (files before this -> candidate)")
    if metadata.baseline_path:
        baseline_state = "found" if metadata.baseline_found else "not found"
        print(f"Baseline: {metadata.baseline_path} ({baseline_state})")
    if metadata.scope_mode == "incremental":
        print(
            "Incremental delta: "
            f"{len(metadata.changed_rel_paths)} changed paths, "
            f"{metadata.reused_candidate_count} reused candidate decisions, "
            f"{metadata.evaluated_candidate_count} re-evaluated candidates"
        )
    print("=" * 60)

    log_dirs: dict[str, dict] = {}

    for root in MANAGED_ROOTS:
        scan = scans[root]
        safe_candidates = []
        blocked_candidates = []
        touched_archive_dirs: set[Path] = set()

        for candidate in scan.archive_candidates:
            risk = risks[candidate.rel_path]
            if risk.blocked:
                blocked_candidates.append(risk)
            else:
                safe_candidates.append(risk)

        total_active += len(scan.active)
        total_permanent += len(scan.permanent)
        total_non_dated += len(scan.non_dated)
        total_already_archived += len(scan.already_archived)
        total_blocked += len(blocked_candidates)
        total_safe_candidates += len(safe_candidates)

        print(f"\nROOT {root}/")
        print(f"  Active (dated <=3d): {len(scan.active)}")
        print(f"  Non-dated (kept):    {len(scan.non_dated)}")
        print(f"  Permanent (exempt):  {len(scan.permanent)}")
        print(f"  Already archived:    {len(scan.already_archived)}")
        print(f"  Blocked by screening:{len(blocked_candidates)}")
        print(f"  To archive now:      {len(safe_candidates)}")

        archive_plan_entries = []
        blocked_entries = []

        for risk in blocked_candidates:
            print(
                f"    [BLOCKED] {risk.info.rel_path} | reason={risk.reason} "
                f"| liveRefs={len(risk.live_reference_sources)} | mdLinks={len(risk.markdown_link_sources)}"
            )
            blocked_entries.append(
                {
                    "file": risk.info.rel_path,
                    "reason": risk.reason,
                    "liveRefs": len(risk.live_reference_sources),
                    "markdownLinks": len(risk.markdown_link_sources),
                    "protectedRefs": risk.protected_reference_sources,
                }
            )

        for risk in safe_candidates:
            info = risk.info
            size_kb = round(info.size / 1024, 1)
            action = "MOVED" if execute else "WOULD MOVE"
            target_dir = info.path.parent / ARCHIVE_FOLDER
            target_path = target_dir / info.path.name

            print(f"    [{action}] {info.rel_path} ({info.date.strftime('%Y-%m-%d')}, {size_kb} KB)")

            archive_plan_entries.append(
                {
                    "file": info.rel_path,
                    "date": info.date.strftime("%Y-%m-%d"),
                    "size_kb": size_kb,
                    "liveRefs": len(risk.live_reference_sources),
                    "markdownLinks": len(risk.markdown_link_sources),
                }
            )

            if execute:
                target_dir.mkdir(exist_ok=True)
                shutil.move(str(info.path), str(target_path))
                moved_count += 1
                touched_archive_dirs.add(target_dir)

        if execute:
            for archive_dir in touched_archive_dirs:
                generate_archive_index(archive_dir)

        log_dirs[root] = {
            "active_count": len(scan.active),
            "non_dated_count": len(scan.non_dated),
            "permanent_count": len(scan.permanent),
            "already_archived_count": len(scan.already_archived),
            "blocked_count": len(blocked_candidates),
            "to_archive_count": len(safe_candidates),
            "files_to_archive": archive_plan_entries,
            "blocked_files": blocked_entries,
        }

    print("\n" + "-" * 60)
    print("TOTALS")
    print(f"  Files moved/to move: {moved_count if execute else total_safe_candidates}")
    print(f"  Blocked candidates:  {total_blocked}")
    print(f"  Active dated files:  {total_active}")
    print(f"  Non-dated kept:      {total_non_dated}")
    print(f"  Permanent files:     {total_permanent}")
    print(f"  Already archived:    {total_already_archived}")
    print("=" * 60 + "\n")

    log_data = {
        "timestamp": datetime.now().isoformat(),
        "cutoff_date": cutoff_date.strftime("%Y-%m-%d"),
        "mode": "execute" if execute else "dry-run",
        "configuration": {
            "managedRoots": MANAGED_ROOTS,
            "ageThresholdDays": AGE_THRESHOLD_DAYS,
            "referenceBlockThreshold": LIVE_REFERENCE_BLOCK_THRESHOLD,
        },
        "directories": log_dirs,
        "totals": {
            "moved": moved_count if execute else 0,
            "wouldMove": total_safe_candidates if not execute else moved_count,
            "blocked": total_blocked,
            "active": total_active,
            "nonDated": total_non_dated,
            "permanent": total_permanent,
            "alreadyArchived": total_already_archived,
        },
    }

    log_path = SCRIPT_DIR / f"cvf_archive_log_{datetime.now().strftime('%Y-%m-%d_%H%M%S')}.json"
    with open(log_path, "w", encoding="utf-8") as file:
        json.dump(log_data, file, indent=2, default=str)
    print(f"Log saved to: {log_path.relative_to(PROJECT_ROOT)}")

    if execute:
        baseline_path = write_archive_baseline(cutoff_date, full_scan=full_scan)
        print(f"Archive baseline updated: {baseline_path.relative_to(PROJECT_ROOT)}")

    if not execute:
        print("\nTo execute, run: python scripts/cvf_active_archive.py --execute\n")


def do_restore() -> None:
    total_restored = 0

    for root in MANAGED_ROOTS:
        root_path = PROJECT_ROOT / root
        if not root_path.exists():
            continue

        for archive_dir in root_path.rglob(ARCHIVE_FOLDER):
            if not archive_dir.is_dir():
                continue
            restored_in_dir = 0

            for item in archive_dir.iterdir():
                if item.name in {ARCHIVE_INDEX_FILENAME, LEGACY_ARCHIVE_INDEX_FILENAME} or item.is_dir():
                    continue
                destination = archive_dir.parent / item.name
                shutil.move(str(item), str(destination))
                restored_in_dir += 1
                total_restored += 1

            for index_name in (ARCHIVE_INDEX_FILENAME, LEGACY_ARCHIVE_INDEX_FILENAME):
                index_file = archive_dir / index_name
                if index_file.exists():
                    index_file.unlink()
            if not any(archive_dir.iterdir()):
                archive_dir.rmdir()

            if restored_in_dir:
                print(f"Restored {restored_in_dir} files from {to_rel_path(archive_dir)}")

    print(f"Restored {total_restored} files total.")


def do_status(cutoff_date: datetime, full_scan: bool = False) -> None:
    scans, risks, metadata = build_plan(cutoff_date, full_scan=full_scan)

    print("\n" + "=" * 60)
    print(f"CVF Active-Archive Status (cutoff: {cutoff_date.strftime('%Y-%m-%d')})")
    print(f"Scope mode: {metadata.scope_mode.upper()}")
    if metadata.scope_mode == "incremental":
        print(
            f"Baseline: {metadata.baseline_path} | changed paths: {len(metadata.changed_rel_paths)} | "
            f"reused: {metadata.reused_candidate_count} | re-evaluated: {metadata.evaluated_candidate_count}"
        )
    print("=" * 60)

    for root in MANAGED_ROOTS:
        scan = scans[root]
        blocked = 0
        safe = 0
        for candidate in scan.archive_candidates:
            risk = risks[candidate.rel_path]
            if risk.blocked:
                blocked += 1
            else:
                safe += 1

        print(f"\nROOT {root}/")
        print(f"  active: {len(scan.active)}")
        print(f"  non_dated: {len(scan.non_dated)}")
        print(f"  permanent: {len(scan.permanent)}")
        print(f"  blocked_by_screening: {blocked}")
        print(f"  would_archive_now: {safe}")
        print(f"  already_archived: {len(scan.already_archived)}")

    print()


def do_impact_scan(cutoff_date: datetime, full_scan: bool = False) -> None:
    scans, risks, metadata = build_plan(cutoff_date, full_scan=full_scan)
    rows: list[CandidateRisk] = []
    for scan in scans.values():
        for candidate in scan.archive_candidates:
            rows.append(risks[candidate.rel_path])

    rows.sort(
        key=lambda row: (
            0 if row.blocked else 1,
            -len(row.live_reference_sources),
            row.info.rel_path,
        )
    )

    print("\n" + "=" * 60)
    print(f"CVF Archive Impact Scan (cutoff: {cutoff_date.strftime('%Y-%m-%d')})")
    print(f"Scope mode: {metadata.scope_mode.upper()}")
    if metadata.scope_mode == "incremental":
        print(
            f"Baseline: {metadata.baseline_path} | changed paths: {len(metadata.changed_rel_paths)} | "
            f"reused: {metadata.reused_candidate_count} | re-evaluated: {metadata.evaluated_candidate_count}"
        )
    print("=" * 60)
    if not rows:
        print("No dated >3-day candidates found.")
        print()
        return

    for row in rows:
        status = "BLOCKED" if row.blocked else "SAFE"
        print(
            f"[{status}] {row.info.rel_path} | date={row.info.date.strftime('%Y-%m-%d')} "
            f"| liveRefs={len(row.live_reference_sources)} | mdLinks={len(row.markdown_link_sources)}"
            + (f" | reason={row.reason}" if row.reason else "")
        )

    print()


def do_link_audit() -> None:
    _, issues = build_markdown_link_index()
    issues.sort(
        key=lambda issue: (
            0 if issue.suggested_archive_target else 1,
            issue.source,
            issue.resolved_target,
        )
    )

    print("\n" + "=" * 60)
    print("CVF Markdown Link Audit (active docs scope)")
    print("=" * 60)

    if not issues:
        print("No broken local markdown links found in active scan scope.")
        print()
        return

    archive_related = sum(1 for issue in issues if issue.suggested_archive_target)
    print(f"Broken local links: {len(issues)}")
    print(f"Potentially moved-to-archive links: {archive_related}")
    print("-" * 60)

    for issue in issues[:MAX_LINK_AUDIT_PRINT_ROWS]:
        if issue.suggested_archive_target:
            print(
                f"[BROKEN-ARCHIVED] {issue.source} -> {issue.resolved_target} "
                f"(raw: {issue.raw_target}) | maybe: {issue.suggested_archive_target}"
            )
        else:
            print(f"[BROKEN] {issue.source} -> {issue.resolved_target} (raw: {issue.raw_target})")

    if len(issues) > MAX_LINK_AUDIT_PRINT_ROWS:
        print(
            f"... truncated: showing {MAX_LINK_AUDIT_PRINT_ROWS}/{len(issues)} issues. "
            "Run and filter output locally for full detail."
        )

    print()


def do_repair_broken_archive_links() -> None:
    _, issues = build_markdown_link_index()
    repair_pairs: dict[str, str] = {}
    for issue in issues:
        if not issue.suggested_archive_target:
            continue
        repair_pairs[issue.suggested_archive_target] = issue.resolved_target

    if not repair_pairs:
        print("No BROKEN-ARCHIVED links detected. Nothing to repair.")
        return

    moved = 0
    touched_archive_dirs: set[Path] = set()
    print(f"Repair candidates: {len(repair_pairs)}")

    for archive_rel, resolved_rel in sorted(repair_pairs.items()):
        src = PROJECT_ROOT / archive_rel
        dst = PROJECT_ROOT / resolved_rel
        if not src.exists():
            continue
        if dst.exists():
            continue
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(src), str(dst))
        touched_archive_dirs.add(src.parent)
        moved += 1
        print(f"[RESTORED] {archive_rel} -> {resolved_rel}")

    for archive_dir in sorted(touched_archive_dirs):
        if not archive_dir.exists():
            continue
        has_payload = any(
            item.is_file() and item.name not in {ARCHIVE_INDEX_FILENAME, LEGACY_ARCHIVE_INDEX_FILENAME}
            for item in archive_dir.iterdir()
        )
        index_file = archive_dir / ARCHIVE_INDEX_FILENAME
        legacy_index_file = archive_dir / LEGACY_ARCHIVE_INDEX_FILENAME
        if has_payload:
            generate_archive_index(archive_dir)
        else:
            if index_file.exists():
                index_file.unlink()
            if legacy_index_file.exists():
                legacy_index_file.unlink()
            if not any(archive_dir.iterdir()):
                archive_dir.rmdir()

    print(f"Restored {moved} files from archive based on BROKEN-ARCHIVED findings.")


def do_refresh_baseline(cutoff_date: datetime, full_scan: bool = False) -> None:
    baseline_path = write_archive_baseline(cutoff_date, full_scan=full_scan)
    print(f"Archive baseline refreshed: {baseline_path.relative_to(PROJECT_ROOT)}")


def main() -> None:
    valid_modes = {
        "--dry-run",
        "--execute",
        "--refresh-baseline",
        "--restore",
        "--status",
        "--impact-scan",
        "--link-audit",
        "--repair-broken-archive-links",
    }
    args = sys.argv[1:]
    if not args or args[0] not in valid_modes:
        print("Usage:")
        print("  python scripts/cvf_active_archive.py --dry-run")
        print("  python scripts/cvf_active_archive.py --execute")
        print("  python scripts/cvf_active_archive.py --refresh-baseline")
        print("  python scripts/cvf_active_archive.py --restore")
        print("  python scripts/cvf_active_archive.py --status")
        print("  python scripts/cvf_active_archive.py --impact-scan")
        print("  python scripts/cvf_active_archive.py --link-audit")
        print("  python scripts/cvf_active_archive.py --repair-broken-archive-links")
        print("  python scripts/cvf_active_archive.py --dry-run --full-scan")
        sys.exit(1)

    mode = args[0]
    extra_flags = set(args[1:])
    allowed_extra_flags = {"--full-scan"}
    invalid_flags = extra_flags - allowed_extra_flags
    if invalid_flags:
        print(f"Unknown flags: {', '.join(sorted(invalid_flags))}")
        sys.exit(1)

    full_scan = "--full-scan" in extra_flags
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    cutoff_date = today - timedelta(days=AGE_THRESHOLD_DAYS)

    if mode == "--status":
        do_status(cutoff_date, full_scan=full_scan)
        return
    if mode == "--restore":
        do_restore()
        return
    if mode == "--impact-scan":
        do_impact_scan(cutoff_date, full_scan=full_scan)
        return
    if mode == "--link-audit":
        do_link_audit()
        return
    if mode == "--repair-broken-archive-links":
        do_repair_broken_archive_links()
        return
    if mode == "--refresh-baseline":
        do_refresh_baseline(cutoff_date, full_scan=full_scan)
        return

    do_archive(cutoff_date, execute=(mode == "--execute"), full_scan=full_scan)


if __name__ == "__main__":
    main()
