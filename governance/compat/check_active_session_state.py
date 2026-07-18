#!/usr/bin/env python3
"""
CVF Active Session State Compatibility Gate

Ensures the session-memory front door stays usable by agents and future
cvf-cli/cvf-mcp-server entrypoints:
- root front door exists
- machine-readable active session state exists and points to existing files
- exactly one root handoff declares Status: ACTIVE
- AGENTS.md and CLAUDE.md route agents through the front door
- local governance hook chain runs this gate
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any

try:
    from governance.compat.generate_active_session_state import (
        CVF_ACTIVE_SESSION_BOOTSTRAP_READ_MODEL_MAX_BYTES,
        validate_aggregate_matches_sources,
        validate_bootstrap_read_model_matches_sources,
    )
except ModuleNotFoundError:  # direct script execution from governance/compat
    from generate_active_session_state import (  # type: ignore[no-redef]
        CVF_ACTIVE_SESSION_BOOTSTRAP_READ_MODEL_MAX_BYTES,
        validate_aggregate_matches_sources,
        validate_bootstrap_read_model_matches_sources,
    )

try:
    from guard_binding_catalog import effective_binding_text
except ModuleNotFoundError:
    from governance.compat.guard_binding_catalog import effective_binding_text


REPO_ROOT = Path(__file__).resolve().parents[2]

FRONT_DOOR_PATH = "CVF_SESSION_MEMORY.md"
STATE_PATH = "CVF_SESSION/ACTIVE_SESSION_STATE.json"
BOOTSTRAP_PATH_STR = "CVF_SESSION/ACTIVE_SESSION_BOOTSTRAP_READ_MODEL.json"
REVIEW_QUEUE_PATH = "CVF_SESSION/ACTIVE_REVIEW_QUEUE.json"
PAIN_POINT_DIRECTION_PATH = "docs/reviews/archive/CVF_REVIEW_CVF_PAIN_POINT_CLOSURE_DIRECTION_CODEX_2026-05-20.md"
READ_FIRST_PATH = "CVF_SESSION/READ_FIRST.md"
STARTUP_GUARDS_PATH = "CVF_SESSION/REQUIRED_STARTUP_GUARDS.md"
AGENTS_PATH = "AGENTS.md"
CLAUDE_PATH = "CLAUDE.md"
HOOK_CHAIN_PATH = "governance/compat/run_local_governance_hook_chain.py"
THIS_SCRIPT_PATH = "governance/compat/check_active_session_state.py"

REQUIRED_STATIC_FILES = (
    FRONT_DOOR_PATH,
    STATE_PATH,
    BOOTSTRAP_PATH_STR,
    REVIEW_QUEUE_PATH,
    PAIN_POINT_DIRECTION_PATH,
    READ_FIRST_PATH,
    STARTUP_GUARDS_PATH,
    AGENTS_PATH,
    CLAUDE_PATH,
    HOOK_CHAIN_PATH,
)

FRONT_DOOR_MARKERS = (
    "ACTIVE SESSION FRONT DOOR",
    STATE_PATH,
    REVIEW_QUEUE_PATH,
    PAIN_POINT_DIRECTION_PATH,
)

AGENT_ROUTER_MARKERS = (
    FRONT_DOOR_PATH,
    STATE_PATH,
)

LHW_KEY_PATTERN = re.compile(r"^lhw(?P<wave>\d+)", re.IGNORECASE)
LHW_FILENAME_PATTERN = re.compile(r"LHW(?P<wave>\d+)", re.IGNORECASE)
HANDOFF_FILENAME_PATTERN = re.compile(
    r"AGENT_HANDOFF(?:_V\d+_\d{4}-\d{2}-\d{2})?\.md"
)
NEXT_ALLOWED_MOVE_TOKEN_PATTERN = re.compile(
    r"\b("
    r"DIR-T\d+[A-Za-z0-9-]*|"
    r"MEMCON-T\d+[A-Za-z0-9-]*|"
    r"LPCI2-[A-Za-z0-9-]*|"
    r"DT-CVF-T\d+[A-Za-z0-9-]*|"
    r"PL-S\d+[A-Za-z0-9-]*|"
    r"Policy_Local|"
    r"EC(?:-\d+)?|"
    r"DEP\d+[A-Za-z0-9-]*"
    r")\b"
)


def _extract_markdown_section(text: str, heading: str) -> str:
    lines = text.splitlines()
    section: list[str] = []
    capture = False
    for line in lines:
        if line.strip() == heading:
            capture = True
            section.append(line)
            continue
        if capture and line.startswith("## "):
            break
        if capture:
            section.append(line)
    return "\n".join(section)


def _next_allowed_move_signature(text: str) -> str | None:
    if not text:
        return None
    match = re.search(r"(?is)next allowed move:\s*(.+)", text)
    candidate = match.group(1) if match else text
    token_match = NEXT_ALLOWED_MOVE_TOKEN_PATTERN.search(candidate)
    if not token_match:
        return None
    return token_match.group(1).lower()


def _check_next_allowed_move_alignment(
    state: dict[str, Any] | None,
    front_door_text: str,
    active_handoff: str | None,
) -> list[str]:
    if not state:
        return []
    state_next_allowed = state.get("nextAllowedMove")
    if not isinstance(state_next_allowed, str):
        return []

    state_signature = _next_allowed_move_signature(state_next_allowed)
    if not state_signature:
        return []

    violations: list[str] = []
    front_section = _extract_markdown_section(front_door_text, "## Next Allowed Move")
    front_signature = _next_allowed_move_signature(front_section)
    if not front_signature:
        violations.append(
            f"{FRONT_DOOR_PATH} Next Allowed Move is missing a parser-visible primary next-move token"
        )
    elif front_signature != state_signature:
        violations.append(
            f"{FRONT_DOOR_PATH} Next Allowed Move primary token `{front_signature}` "
            f"does not match state nextAllowedMove primary token `{state_signature}`"
        )

    if active_handoff:
        handoff_section = _extract_markdown_section(_read_text(active_handoff), "## Next Allowed Move")
        handoff_signature = _next_allowed_move_signature(handoff_section)
        if not handoff_signature:
            violations.append(
                f"active handoff Next Allowed Move is missing a parser-visible primary next-move token"
            )
        elif handoff_signature != state_signature:
            violations.append(
                f"active handoff Next Allowed Move primary token `{handoff_signature}` "
                f"does not match state nextAllowedMove primary token `{state_signature}`"
            )

    return violations


def _latest_closed_lhw_wave(state: dict[str, Any] | None) -> int | None:
    waves: list[int] = []
    if state:
        for key, value in state.items():
            match = LHW_KEY_PATTERN.match(key)
            if not match or not isinstance(value, str):
                continue
            if "CLOSED_PASS_BOUNDED" in value:
                waves.append(int(match.group("wave")))
    baseline_root = REPO_ROOT / "docs" / "baselines"
    if baseline_root.exists():
        for path in baseline_root.glob("CVF_GC018_LHW*.md"):
            match = LHW_FILENAME_PATTERN.search(path.name)
            if not match:
                continue
            text = path.read_text(encoding="utf-8", errors="replace")
            if re.search(r"(?im)^Status:\s*CLOSED_PASS_BOUNDED\b", text):
                waves.append(int(match.group("wave")))
    return max(waves) if waves else None


def _read_text(path: str) -> str:
    abs_path = REPO_ROOT / path
    if not abs_path.exists() or abs_path.is_dir():
        return ""
    return abs_path.read_text(encoding="utf-8")


def _load_state() -> tuple[dict[str, Any] | None, str | None]:
    state_path = REPO_ROOT / STATE_PATH
    if not state_path.exists():
        return None, "state file is missing"
    try:
        return json.loads(state_path.read_text(encoding="utf-8")), None
    except json.JSONDecodeError as exc:
        return None, f"invalid JSON: {exc}"


def _load_review_queue() -> tuple[dict[str, Any] | None, str | None]:
    queue_path = REPO_ROOT / REVIEW_QUEUE_PATH
    if not queue_path.exists():
        return None, "review queue file is missing"
    try:
        return json.loads(queue_path.read_text(encoding="utf-8")), None
    except json.JSONDecodeError as exc:
        return None, f"invalid JSON: {exc}"


def _git_rev_parse(rev: str) -> str | None:
    """Return a git revision SHA (full 40-char), or None if git is unavailable."""
    try:
        result = subprocess.run(
            ["git", "rev-parse", rev],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=True,
        )
        return result.stdout.strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        return None


def _git_head_sha() -> str | None:
    return _git_rev_parse("HEAD")


def _git_parent_sha() -> str | None:
    return _git_rev_parse("HEAD^")


def _git_ignored(rel_path: str) -> bool:
    try:
        result = subprocess.run(
            ["git", "check-ignore", "-q", rel_path],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
        )
        return result.returncode == 0
    except FileNotFoundError:
        return False


def _head_changed_path(rel_path: str) -> bool:
    try:
        result = subprocess.run(
            ["git", "diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD"],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=True,
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False
    changed = {line.strip().replace("\\", "/") for line in result.stdout.splitlines() if line.strip()}
    return rel_path.replace("\\", "/") in changed


def _head_changed_paths() -> set[str]:
    try:
        result = subprocess.run(
            ["git", "diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD"],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=True,
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        return set()
    return {line.strip().replace("\\", "/") for line in result.stdout.splitlines() if line.strip()}


def _is_session_sync_path(path: str) -> bool:
    normalized = path.replace("\\", "/")
    return (
        normalized == "CVF_SESSION_MEMORY.md"
        or normalized == "CVF_SESSION/ACTIVE_SESSION_BOOTSTRAP_READ_MODEL.json"
        or normalized == "CVF_SESSION/ACTIVE_SESSION_STATE.json"
        or normalized == "CVF_SESSION/ACTIVE_REVIEW_QUEUE.json"
        or normalized.startswith("CVF_SESSION/state/")
        or normalized.startswith("AGENT_HANDOFF")
        or normalized.startswith("CVF_SESSION/handoffs/")
    )


def _root_handoff_paths() -> list[Path]:
    return sorted(REPO_ROOT.glob("AGENT_HANDOFF*.md"))


def _normalized_rel(path: str) -> str:
    return path.replace("\\", "/").strip("/")


def _is_under_path(path: str, parent: str) -> bool:
    normalized = _normalized_rel(path)
    normalized_parent = _normalized_rel(parent)
    return normalized == normalized_parent or normalized.startswith(f"{normalized_parent}/")


def _is_handoff_path(path: str) -> bool:
    return Path(path).name.startswith("AGENT_HANDOFF") and Path(path).suffix == ".md"


def _handoff_status(path: Path) -> str | None:
    text = path.read_text(encoding="utf-8", errors="replace")
    for line in text.splitlines()[:40]:
        stripped = line.strip()
        if stripped.startswith("Status:"):
            return stripped
    return None


def _active_handoffs() -> list[str]:
    active: list[str] = []
    for path in _root_handoff_paths():
        status = _handoff_status(path)
        if status and status.startswith("Status: ACTIVE"):
            active.append(path.name)
    return active


def _stale_root_handoff_references(text: str, active_handoff: str) -> list[str]:
    stale: list[str] = []
    for match in HANDOFF_FILENAME_PATTERN.finditer(text):
        handoff_name = match.group(0)
        if handoff_name == active_handoff:
            continue
        prefix = text[max(0, match.start() - 96):match.start()].replace("\\", "/")
        if "CVF_SESSION/handoffs/archive/" in prefix:
            continue
        stale.append(handoff_name)
    return stale


def _as_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return [item for item in value if isinstance(item, str)]


def _classify() -> dict[str, Any]:
    missing_files = [path for path in REQUIRED_STATIC_FILES if not (REPO_ROOT / path).exists()]

    state, state_error = _load_state()
    review_queue, review_queue_error = _load_review_queue()
    state_violations: list[str] = []
    review_queue_violations: list[str] = []
    continuity_violations: list[str] = []
    active_handoff = None
    active_review_queue = None
    pain_point_direction = None
    current_mode = None
    freeze_posture = None
    required_first_reads: list[str] = []
    required_startup_guards: list[str] = []
    archive_path = None
    ready_review_items: list[str] = []

    bootstrap_violations: list[str] = []
    bootstrap_path = REPO_ROOT / BOOTSTRAP_PATH_STR
    if bootstrap_path.exists():
        bootstrap_size = bootstrap_path.stat().st_size
        if bootstrap_size > CVF_ACTIVE_SESSION_BOOTSTRAP_READ_MODEL_MAX_BYTES:
            bootstrap_violations.append(
                f"{BOOTSTRAP_PATH_STR} size {bootstrap_size} bytes exceeds "
                f"CVF_ACTIVE_SESSION_BOOTSTRAP_READ_MODEL_MAX_BYTES "
                f"{CVF_ACTIVE_SESSION_BOOTSTRAP_READ_MODEL_MAX_BYTES}; "
                "regenerate with a smaller field set or increase the ceiling"
            )
        bootstrap_violations.extend(
            validate_bootstrap_read_model_matches_sources()
        )

    if state_error:
        state_violations.append(state_error)
    elif state is not None:
        state_violations.extend(validate_aggregate_matches_sources())
        if state.get("activeSessionFrontDoor") != FRONT_DOOR_PATH:
            state_violations.append("activeSessionFrontDoor must point to CVF_SESSION_MEMORY.md")
        if state.get("activeStateRegistry") != STATE_PATH:
            state_violations.append("activeStateRegistry must point to CVF_SESSION/ACTIVE_SESSION_STATE.json")
        active_review_queue = state.get("activeReviewQueue")
        if active_review_queue != REVIEW_QUEUE_PATH:
            state_violations.append(f"activeReviewQueue must point to {REVIEW_QUEUE_PATH}")
        pain_point_direction = state.get("painPointClosureDirection")
        if pain_point_direction != PAIN_POINT_DIRECTION_PATH:
            state_violations.append(f"painPointClosureDirection must point to {PAIN_POINT_DIRECTION_PATH}")
        elif not (REPO_ROOT / pain_point_direction).exists():
            state_violations.append(f"painPointClosureDirection path does not exist: {pain_point_direction}")
        active_handoff = state.get("activeHandoff")
        if not isinstance(active_handoff, str) or not active_handoff:
            state_violations.append("activeHandoff must be a non-empty string")
        elif not (REPO_ROOT / active_handoff).exists():
            state_violations.append(f"activeHandoff does not exist: {active_handoff}")
        current_mode = state.get("currentMode")
        if not isinstance(current_mode, str) or not current_mode:
            state_violations.append("currentMode must be a non-empty string")
        freeze_posture = state.get("freezePosture")
        if not isinstance(freeze_posture, str) or not freeze_posture:
            state_violations.append("freezePosture must be a non-empty string")

        required_first_reads = _as_list(state.get("requiredFirstReads"))
        if not required_first_reads:
            state_violations.append("requiredFirstReads must be a non-empty list")
        for path in required_first_reads:
            if not (REPO_ROOT / path).exists() and not _git_ignored(path):
                state_violations.append(f"requiredFirstReads path does not exist: {path}")

        required_startup_guards = _as_list(state.get("requiredStartupGuards"))
        if not required_startup_guards:
            state_violations.append("requiredStartupGuards must be a non-empty list")
        for path in required_startup_guards:
            if not (REPO_ROOT / path).exists():
                state_violations.append(f"requiredStartupGuards path does not exist: {path}")

        archive_path = state.get("historicalHandoffArchive")
        if isinstance(archive_path, str) and archive_path:
            if not (REPO_ROOT / archive_path).is_dir():
                state_violations.append(f"historicalHandoffArchive does not exist: {archive_path}")
        else:
            state_violations.append("historicalHandoffArchive must be a non-empty string")

        for field in ("supersededHandoffs", "relatedHandoffs"):
            for path in _as_list(state.get(field)):
                if not (REPO_ROOT / path).exists():
                    state_violations.append(f"{field} path does not exist: {path}")
                    continue
                if (
                    archive_path
                    and _is_handoff_path(path)
                    and path != active_handoff
                    and not _is_under_path(path, archive_path)
                ):
                    state_violations.append(
                        f"{field} handoff path must live under historicalHandoffArchive: {path}"
                    )

        blocked = _as_list(state.get("blockedWorkClasses"))
        if not blocked:
            state_violations.append("blockedWorkClasses must be a non-empty list")

    if review_queue_error:
        review_queue_violations.append(review_queue_error)
    elif review_queue is not None:
        if review_queue.get("status") != "ACTIVE_REVIEW_QUEUE":
            review_queue_violations.append("review queue status must be ACTIVE_REVIEW_QUEUE")
        items = review_queue.get("items")
        if not isinstance(items, list):
            review_queue_violations.append("review queue items must be a list")
            items = []
        seen_ids: set[str] = set()
        for index, item in enumerate(items):
            if not isinstance(item, dict):
                review_queue_violations.append(f"review queue item {index} must be an object")
                continue
            item_id = item.get("id")
            if not isinstance(item_id, str) or not item_id:
                review_queue_violations.append(f"review queue item {index} missing id")
            elif item_id in seen_ids:
                review_queue_violations.append(f"review queue item id is duplicated: {item_id}")
            else:
                seen_ids.add(item_id)

            path = item.get("path")
            if not isinstance(path, str) or not path:
                review_queue_violations.append(f"review queue item {item_id or index} missing path")
            elif not (REPO_ROOT / path).exists():
                review_queue_violations.append(f"review queue item path does not exist: {path}")

            status = item.get("status")
            if not isinstance(status, str) or not status:
                review_queue_violations.append(f"review queue item {item_id or index} missing status")
                continue

            if status == "READY_FOR_REBUTTAL":
                expected = item.get("expectedResponsePath")
                if not isinstance(expected, str) or not expected:
                    review_queue_violations.append(
                        f"READY_FOR_REBUTTAL item {item_id or index} must define expectedResponsePath"
                    )
                elif (REPO_ROOT / expected).exists():
                    review_queue_violations.append(
                        f"READY_FOR_REBUTTAL item already has response path; update status: {item_id or index}"
                    )
                ready_review_items.append(item_id or path or str(index))
            elif status.startswith("REBUTTAL_FILED"):
                response = item.get("responsePath")
                if not isinstance(response, str) or not response:
                    review_queue_violations.append(
                        f"REBUTTAL_FILED item {item_id or index} must define responsePath"
                    )
                elif not (REPO_ROOT / response).exists():
                    review_queue_violations.append(f"responsePath does not exist for {item_id or index}: {response}")

    marker_violations: dict[str, list[str]] = {}
    front_door_text = _read_text(FRONT_DOOR_PATH)
    missing_front_door_markers = [
        marker for marker in FRONT_DOOR_MARKERS
        if marker not in front_door_text
    ]
    if active_handoff and active_handoff not in front_door_text:
        missing_front_door_markers.append(active_handoff)
    if active_review_queue and active_review_queue not in front_door_text:
        missing_front_door_markers.append(active_review_queue)
    if pain_point_direction and pain_point_direction not in front_door_text:
        missing_front_door_markers.append(pain_point_direction)
    if current_mode and current_mode not in front_door_text:
        missing_front_door_markers.append(current_mode)
    if freeze_posture and freeze_posture not in front_door_text:
        missing_front_door_markers.append(freeze_posture)
    if missing_front_door_markers:
        marker_violations[FRONT_DOOR_PATH] = missing_front_door_markers

    for path in (READ_FIRST_PATH, STARTUP_GUARDS_PATH, AGENTS_PATH, CLAUDE_PATH):
        text = _read_text(path)
        missing_markers = [
            marker for marker in AGENT_ROUTER_MARKERS
            if marker not in text
        ]
        if missing_markers:
            marker_violations[path] = missing_markers

    if active_handoff:
        for path in (FRONT_DOOR_PATH, AGENTS_PATH, READ_FIRST_PATH, STARTUP_GUARDS_PATH, CLAUDE_PATH):
            stale_handoffs = _stale_root_handoff_references(_read_text(path), active_handoff)
            if stale_handoffs:
                marker_violations.setdefault(path, []).extend(
                    f"stale root handoff reference `{handoff}`; use active handoff `{active_handoff}` or archive-qualified path"
                    for handoff in sorted(set(stale_handoffs))
                )

    hook_text = effective_binding_text(HOOK_CHAIN_PATH, _read_text(HOOK_CHAIN_PATH))
    if THIS_SCRIPT_PATH not in hook_text:
        marker_violations[HOOK_CHAIN_PATH] = [THIS_SCRIPT_PATH]

    active_handoffs = _active_handoffs()
    handoff_violations: list[str] = []
    if len(active_handoffs) != 1:
        handoff_violations.append(
            f"expected exactly one root AGENT_HANDOFF*.md with Status: ACTIVE, found {len(active_handoffs)}"
        )
    if active_handoff and active_handoffs and active_handoffs != [active_handoff]:
        handoff_violations.append(
            f"active handoff registry mismatch: registry={active_handoff}, detected={active_handoffs}"
        )
    for path in _root_handoff_paths():
        rel = path.relative_to(REPO_ROOT).as_posix()
        if rel == active_handoff:
            continue
        status = _handoff_status(path) or "(no status found)"
        handoff_violations.append(
            f"non-active root handoff must be archived or removed: {rel} ({status})"
        )

    # GC-020 In-Place Update Rule: active handoff must contain the current HEAD SHA.
    # For a dedicated handoff-sync commit, the handoff cannot name its own future
    # content-addressed SHA. In that one case, accept the first parent SHA when the
    # current commit itself changed the active handoff.
    head_sha = _git_head_sha()
    parent_sha = _git_parent_sha()
    head_sha_in_handoff: bool | None = None  # None = check skipped (git unavailable)
    parent_sha_in_handoff = False
    active_handoff_changed_in_head = False
    handoff_sync_commit_only = False
    if head_sha and active_handoff:
        handoff_path = REPO_ROOT / active_handoff
        if handoff_path.exists():
            handoff_text = handoff_path.read_text(encoding="utf-8", errors="replace")
            # Accept either the full SHA or the first 8 characters (short SHA).
            head_sha_in_handoff = (
                head_sha in handoff_text or head_sha[:8] in handoff_text
            )
            active_handoff_changed_in_head = _head_changed_path(active_handoff)
            head_changed_paths = _head_changed_paths()
            handoff_sync_commit_only = bool(head_changed_paths) and all(
                _is_session_sync_path(path) for path in head_changed_paths
            )
            if parent_sha:
                parent_sha_in_handoff = parent_sha in handoff_text or parent_sha[:8] in handoff_text
            if (
                not head_sha_in_handoff
                and not (active_handoff_changed_in_head and parent_sha_in_handoff and handoff_sync_commit_only)
            ):
                handoff_violations.append(
                    f"active handoff does not contain current HEAD SHA {head_sha[:8]} "
                    f"({head_sha}) or, for a handoff-sync commit, parent SHA "
                    f"{parent_sha[:8] if parent_sha else 'unknown'} in a dedicated session-sync-only commit — update the handoff HEAD block after every commit "
                    "(GC-020 In-Place Update Rule)"
                )

    latest_lhw_wave = _latest_closed_lhw_wave(state)
    if latest_lhw_wave is not None:
        latest_marker = f"LHW{latest_lhw_wave}"
        next_allowed = state.get("nextAllowedMove") if state else None
        if not isinstance(next_allowed, str) or latest_marker not in next_allowed:
            continuity_violations.append(
                f"nextAllowedMove must reference latest closed LHW wave {latest_marker}; "
                "stale lower-wave continuity text is not valid closure evidence"
            )
        next_allowed_section = _extract_markdown_section(front_door_text, "## Next Allowed Move")
        if latest_marker not in next_allowed_section:
            continuity_violations.append(
                f"{FRONT_DOOR_PATH} Next Allowed Move must reference latest closed LHW wave {latest_marker}"
            )
        if active_handoff:
            handoff_text_for_lhw = _read_text(active_handoff)
            if latest_marker not in handoff_text_for_lhw:
                continuity_violations.append(
                    f"active handoff must reference latest closed LHW wave {latest_marker}"
                )

    continuity_violations.extend(
        _check_next_allowed_move_alignment(state, front_door_text, active_handoff)
    )

    compliant = (
        not missing_files
        and not state_violations
        and not bootstrap_violations
        and not review_queue_violations
        and not continuity_violations
        and not marker_violations
        and not handoff_violations
    )

    return {
        "frontDoor": FRONT_DOOR_PATH,
        "statePath": STATE_PATH,
        "activeHandoff": active_handoff,
        "activeReviewQueue": active_review_queue,
        "painPointClosureDirection": pain_point_direction,
        "readyReviewItems": ready_review_items,
        "readyReviewItemCount": len(ready_review_items),
        "detectedActiveHandoffs": active_handoffs,
        "requiredFirstReadCount": len(required_first_reads),
        "requiredStartupGuardCount": len(required_startup_guards),
        "missingFiles": missing_files,
        "missingFileCount": len(missing_files),
        "stateViolations": state_violations,
        "stateViolationCount": len(state_violations),
        "reviewQueueViolations": review_queue_violations,
        "reviewQueueViolationCount": len(review_queue_violations),
        "latestClosedLhwWave": latest_lhw_wave,
        "continuityViolations": continuity_violations,
        "continuityViolationCount": len(continuity_violations),
        "markerViolations": marker_violations,
        "markerViolationCount": len(marker_violations),
        "handoffViolations": handoff_violations,
        "handoffViolationCount": len(handoff_violations),
        "headSha": head_sha,
        "parentSha": parent_sha,
        "headShaInHandoff": head_sha_in_handoff,
        "parentShaInHandoff": parent_sha_in_handoff,
        "activeHandoffChangedInHead": active_handoff_changed_in_head,
        "handoffSyncCommitOnly": handoff_sync_commit_only,
        "bootstrapViolations": bootstrap_violations,
        "bootstrapViolationCount": len(bootstrap_violations),
        "compliant": compliant,
    }


def _print_report(report: dict[str, Any]) -> None:
    print("=== CVF Active Session State Compatibility Gate ===")
    print(f"Front door: {report['frontDoor']}")
    print(f"State registry: {report['statePath']}")
    print(f"Active handoff: {report['activeHandoff']}")
    print(f"Active review queue: {report['activeReviewQueue']}")
    print(f"Pain-point closure direction: {report['painPointClosureDirection']}")
    print(f"Ready review items: {report['readyReviewItemCount']}")
    print(f"Detected active handoffs: {', '.join(report['detectedActiveHandoffs']) or 'none'}")
    print(f"Required first reads: {report['requiredFirstReadCount']}")
    print(f"Required startup guards: {report['requiredStartupGuardCount']}")
    print(f"Missing files: {report['missingFileCount']}")
    print(f"State violations: {report['stateViolationCount']}")
    print(f"Review queue violations: {report['reviewQueueViolationCount']}")
    print(f"Continuity violations: {report['continuityViolationCount']}")
    print(f"Marker violations: {report['markerViolationCount']}")
    print(f"Handoff violations: {report['handoffViolationCount']}")
    latest_lhw_wave = report.get("latestClosedLhwWave")
    if latest_lhw_wave is not None:
        print(f"Latest closed LHW wave in state: LHW{latest_lhw_wave}")
    head_sha = report.get("headSha")
    head_in_handoff = report.get("headShaInHandoff")
    if head_sha:
        parent_sha = report.get("parentSha")
        parent_in_handoff = report.get("parentShaInHandoff")
        handoff_changed = report.get("activeHandoffChangedInHead")
        sync_only = report.get("handoffSyncCommitOnly")
        sync_status = (
            "present"
            if head_in_handoff
            else (
                "parent-present-for-sync-commit"
                if handoff_changed and parent_in_handoff and sync_only
                else "parent-present-but-not-dedicated-sync-commit"
                if handoff_changed and parent_in_handoff
                else ("MISSING" if head_in_handoff is False else "skipped")
            )
        )
        print(f"HEAD SHA in handoff: {head_sha[:8]} — {sync_status}")
        if parent_sha and handoff_changed and parent_in_handoff and sync_only and not head_in_handoff:
            print(f"Parent SHA in handoff: {parent_sha[:8]} — present (handoff sync commit)")

    if report["missingFiles"]:
        print("\nMissing files:")
        for path in report["missingFiles"]:
            print(f"  - {path}")

    if report.get("bootstrapViolations"):
        print("\nBootstrap read model violations:")
        for issue in report["bootstrapViolations"]:
            print(f"  - {issue}")

    if report["stateViolations"]:
        print("\nState violations:")
        for issue in report["stateViolations"]:
            print(f"  - {issue}")

    if report["reviewQueueViolations"]:
        print("\nReview queue violations:")
        for issue in report["reviewQueueViolations"]:
            print(f"  - {issue}")

    if report["continuityViolations"]:
        print("\nContinuity violations:")
        for issue in report["continuityViolations"]:
            print(f"  - {issue}")

    if report["markerViolations"]:
        print("\nMarker violations:")
        for path, markers in report["markerViolations"].items():
            print(f"  - {path}")
            for marker in markers:
                print(f"    missing: {marker}")

    if report["handoffViolations"]:
        print("\nHandoff violations:")
        for issue in report["handoffViolations"]:
            print(f"  - {issue}")

    if report["compliant"]:
        print("\nCOMPLIANT - active session front door, registry, handoff pointer, and startup routing are aligned.")
        return

    print("\nVIOLATION - active session state is incomplete or misaligned.")
    print("Action required:")
    print(f"  1. Update {STATE_PATH} first.")
    print(f"  2. Keep {FRONT_DOOR_PATH}, {REVIEW_QUEUE_PATH}, {AGENTS_PATH}, and {CLAUDE_PATH} routed through the registry.")
    print("  3. Ensure exactly one root AGENT_HANDOFF*.md declares Status: ACTIVE.")
    print(f"  4. Ensure {HOOK_CHAIN_PATH} runs {THIS_SCRIPT_PATH}.")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="CVF active session state compatibility gate")
    parser.add_argument("--enforce", action="store_true", help="Return exit 2 when active session state is misaligned")
    parser.add_argument("--json", action="store_true", help="Print JSON report")
    parser.add_argument("--write-report", default=None, help="Optional output path for JSON report file")
    args = parser.parse_args()

    report = {
        "timestamp": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        **_classify(),
    }

    if args.write_report:
        out_path = Path(args.write_report)
        if not out_path.is_absolute():
            out_path = (REPO_ROOT / out_path).resolve()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    if args.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        _print_report(report)

    if args.enforce and not report["compliant"]:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
