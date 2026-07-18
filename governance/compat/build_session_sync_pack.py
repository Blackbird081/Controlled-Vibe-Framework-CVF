#!/usr/bin/env python3
"""
CVF Session-Sync Pack Builder And Authorization Manifest

Read-only diagnostic helper that gives an agent the exact protected-path
authorization manifest it needs before a session-sync commit, and reports
drift between ACTIVE_SESSION_STATE.json and its CVF_SESSION/state sources.

This tool never writes, stages, or commits any file. It imports the canonical
protected-path classifier from the commit steward preflight and the aggregate
drift detector from the active session state generator instead of duplicating
their logic.
"""

from __future__ import annotations

import argparse
import json
import importlib.util
import re
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
STANDARD_PATH = (
    "docs/reference/CVF_AGENT_COMMIT_STEWARD_PROTOCOL_STANDARD_2026-06-15.md"
)
AUTH_MARKER = "Core Guard Self-Protection Authorization"
PROTECTED_PATH_RE = re.compile(
    r"^\s*[-*]\s+`([^`]+)`\s*$",
)


def _load_module(name: str):
    module_path = Path(__file__).resolve().with_name(f"{name}.py")
    spec = importlib.util.spec_from_file_location(name, module_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"unable to load module from {module_path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


_STEWARD = _load_module("run_agent_commit_steward_preflight")
_STATE = _load_module("generate_active_session_state")

build_path_plan = _STEWARD.build_path_plan
validate_aggregate_matches_sources = _STATE.validate_aggregate_matches_sources
entry_filename = _STATE.entry_filename
source_entry = _STATE.source_entry


def _configure_stdout() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")


def _active_handoff_path() -> str | None:
    """Return the repo-relative active handoff path from the state registry."""
    state_path = REPO_ROOT / "CVF_SESSION" / "ACTIVE_SESSION_STATE.json"
    if not state_path.exists():
        return None
    try:
        state = _STATE.load_json(state_path)
    except (OSError, ValueError):
        return None
    handoff = state.get("activeHandoff") if isinstance(state, dict) else None
    return handoff if isinstance(handoff, str) and handoff else None


def authorized_protected_paths(handoff_path: str | None) -> tuple[str, ...]:
    """Parse the `Protected paths` list under the handoff authorization block."""
    if not handoff_path:
        return ()
    full = REPO_ROOT / handoff_path
    if not full.exists() or full.is_dir():
        return ()
    text = full.read_text(encoding="utf-8", errors="replace")
    marker_index = text.find(AUTH_MARKER)
    if marker_index == -1:
        return ()
    after_marker = text[marker_index:]
    paths: list[str] = []
    collecting = False
    for line in after_marker.splitlines():
        if "Protected paths:" in line:
            collecting = True
            continue
        if not collecting:
            continue
        match = PROTECTED_PATH_RE.match(line)
        if match:
            paths.append(match.group(1).replace("\\", "/"))
            continue
        # stop at the first non-empty, non-list line after the list began
        if line.strip() and not line.lstrip().startswith(("-", "*")):
            break
    return tuple(paths)


def _missing_authorizations(
    protected_changed: tuple[str, ...],
    authorized: tuple[str, ...],
) -> tuple[str, ...]:
    authorized_set = set(authorized)
    return tuple(path for path in protected_changed if path not in authorized_set)


def _print_manifest(
    plan,
    authorized: tuple[str, ...],
    handoff_path: str | None,
) -> None:
    print("=== Session-Sync Protected-Path Authorization Manifest ===")
    print(f"Standard: {STANDARD_PATH}")
    print(f"Active handoff: {handoff_path or 'N/A (state registry not resolved)'}")
    print(f"Changed protected session/handoff paths: {len(plan.protected_session_paths)}")
    for path in plan.protected_session_paths:
        print(f"  ! {path}")
    print(f"Already authorized in active handoff: {len(authorized)}")
    for path in authorized:
        print(f"  + {path}")
    print()
    print("Paste this `Protected paths` block into the active handoff "
          "authorization section:")
    print()
    print("Protected paths:")
    print()
    merged = sorted(set(plan.protected_session_paths) | set(authorized))
    if not merged:
        print("- (none -- no protected session/handoff paths changed)")
    for path in merged:
        print(f"- `{path}`")
    print()


def _next_state_order() -> int:
    """Return the next source-entry stateOrder without mutating session files."""
    entries_dir = REPO_ROOT / "CVF_SESSION" / "state" / "entries"
    if not entries_dir.exists():
        return 1
    highest = 0
    for path in sorted(entries_dir.glob("*.json")):
        try:
            entry = _STATE.load_json(path)
        except (OSError, ValueError, json.JSONDecodeError):
            continue
        if not isinstance(entry, dict):
            continue
        order = entry.get("stateOrder")
        if isinstance(order, int) and order > highest:
            highest = order
    return highest + 1


def _print_author_entry(state_key: str) -> None:
    """Print paste-ready session-sync authoring snippets. Read-only."""
    state_order = _next_state_order()
    filename = entry_filename(state_key)
    entry = source_entry(
        state_key,
        "<replace with concise session-state value>",
        state_order,
    )
    handoff_path = _active_handoff_path() or "<active handoff path>"

    print("=== Session-Sync Authoring Helper ===")
    print("Read-only: generated content is printed only; no files are written.")
    print()
    print("=== State Entry Skeleton ===")
    print(f"Path: CVF_SESSION/state/entries/{filename}")
    print(json.dumps(entry, ensure_ascii=True, indent=2))
    print()
    print("=== nextAllowedMove Update Template ===")
    print("Path: CVF_SESSION/state/entries/nextAllowedMove.json")
    print(
        json.dumps(
            source_entry(
                "nextAllowedMove",
                "<replace with next allowed move after this closure>",
                state_order + 1,
            ),
            ensure_ascii=True,
            indent=2,
        )
    )
    print()
    print("=== Session Mode Marker Block ===")
    print("Use one mode marker value consistently across all five occurrences:")
    print("mode marker: <replace_with_current_mode_marker>")
    print()
    print("1. CVF_SESSION_MEMORY.md Current mode marker:")
    print("   Current mode marker: `<replace_with_current_mode_marker>`")
    print("2. CVF_SESSION_MEMORY.md Current mode:")
    print("   Current mode: `<replace_with_current_mode_marker>`")
    print(f"3. {handoff_path} startup acknowledgment:")
    print("   current mode=`<replace_with_current_mode_marker>`")
    print(f"4. {handoff_path} ## Current Mode:")
    print("   `<replace_with_current_mode_marker>`")
    print("5. CVF_SESSION/state/ACTIVE_SESSION_STATE_CORE.json currentMode:")
    print('   "currentMode": "<replace_with_current_mode_marker>"')
    print()


def main() -> int:
    _configure_stdout()
    parser = argparse.ArgumentParser(
        description=(
            "Build the session-sync protected-path authorization manifest and "
            "report active-session-state drift (read-only)."
        )
    )
    parser.add_argument("--base", default="HEAD", help="Base ref for the changed range.")
    parser.add_argument("--head", default="HEAD", help="Head ref for the changed range.")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument(
        "--suggest",
        action="store_true",
        help="Print the manifest block and drift status; always exit 0.",
    )
    mode.add_argument(
        "--enforce",
        action="store_true",
        help="Exit non-zero on drift or missing protected-path authorization.",
    )
    mode.add_argument(
        "--plan-only",
        action="store_true",
        help="Print the manifest block only; skip drift analysis.",
    )
    mode.add_argument(
        "--author-entry",
        action="store_true",
        help=(
            "Print a read-only session-sync state-entry skeleton, "
            "nextAllowedMove template, and mode marker block."
        ),
    )
    parser.add_argument(
        "--state-key",
        help="State key for --author-entry skeleton generation.",
    )
    args = parser.parse_args()

    if args.author_entry:
        if not args.state_key:
            parser.error("--author-entry requires --state-key")
        _print_author_entry(args.state_key)
        return 0

    # Default mode when none is given behaves like --suggest.
    enforce = args.enforce
    plan_only = args.plan_only

    plan = build_path_plan(args.base, args.head)
    handoff_path = _active_handoff_path()
    authorized = authorized_protected_paths(handoff_path)

    _print_manifest(plan, authorized, handoff_path)

    missing = _missing_authorizations(plan.protected_session_paths, authorized)

    if plan_only:
        if missing:
            print(f"NOTE: {len(missing)} protected path(s) not yet authorized "
                  "in the active handoff (plan-only; not enforced):")
            for path in missing:
                print(f"  - {path}")
        print("\nPLAN-ONLY: manifest printed; drift analysis skipped.")
        return 0

    drift = validate_aggregate_matches_sources()
    print("=== Active session state drift ===")
    if drift:
        for issue in drift:
            print(f"  DRIFT: {issue}")
    else:
        print("  No drift: ACTIVE_SESSION_STATE.json matches its sources.")

    if missing:
        print(f"\n=== Missing protected-path authorization ({len(missing)}) ===")
        for path in missing:
            print(f"  MISSING: {path}")

    failures = bool(drift) or bool(missing)

    if enforce:
        if failures:
            print("\nVIOLATION: session-sync pack is not ready for commit.")
            return 1
        print("\nCOMPLIANT: session-sync pack is ready for commit.")
        return 0

    # --suggest (or default): advisory only.
    if failures:
        print("\nADVISORY: session-sync pack has open items "
              "(use --enforce to fail).")
    else:
        print("\nADVISORY: session-sync pack is clean.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
