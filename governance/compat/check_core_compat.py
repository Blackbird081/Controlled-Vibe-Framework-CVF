#!/usr/bin/env python3
"""
CVF Core Compatibility Gate

Fast compatibility check to avoid expensive full scans when core contracts are unchanged.

Usage examples:
  python governance/compat/check_core_compat.py
  python governance/compat/check_core_compat.py --base origin/main --head HEAD
  python governance/compat/check_core_compat.py --base <sha> --head <sha> --enforce
"""

from __future__ import annotations

import argparse
import datetime as dt
import fnmatch
import json
import subprocess
import sys
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_MANIFEST = REPO_ROOT / "governance" / "compat" / "core-manifest.json"


def _run_git(args: list[str]) -> tuple[int, str, str]:
    proc = subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return proc.returncode, proc.stdout.strip(), proc.stderr.strip()


def _normalize(path: str) -> str:
    return path.replace("\\", "/").strip()


def _pattern_match(path: str, pattern: str) -> bool:
    path_norm = _normalize(path)
    pat = _normalize(pattern)
    if pat.endswith("/**"):
        prefix = pat[:-3]
        return path_norm == prefix or path_norm.startswith(prefix + "/")
    return fnmatch.fnmatch(path_norm, pat)


def _load_manifest(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _resolve_range(base: str | None, head: str | None) -> tuple[str, str]:
    resolved_head = head or "HEAD"
    if base:
        return base, resolved_head
    return "HEAD~1", resolved_head


def _get_changed_files(base: str, head: str) -> list[str]:
    code, out, err = _run_git(["diff", "--name-only", f"{base}..{head}"])
    if code != 0:
        raise RuntimeError(f"git diff failed for range {base}..{head}: {err or out}")
    files = [_normalize(line) for line in out.splitlines() if line.strip()]
    return sorted(set(files))


def _collect_focused_suggestions(
    changed_files: list[str], focused_map: list[dict[str, str]]
) -> list[str]:
    suggestions: list[str] = []
    for item in focused_map:
        pattern = item.get("pattern", "")
        command = item.get("suggestedCommand", "")
        if not pattern or not command:
            continue
        if any(_pattern_match(path, pattern) for path in changed_files):
            suggestions.append(command)
    return sorted(set(suggestions))


def _classify(changed_files: list[str], manifest: dict[str, Any]) -> dict[str, Any]:
    frozen_patterns = manifest.get("frozenCorePaths", [])
    trigger_patterns = manifest.get("deepScanTriggers", [])
    focused_map = manifest.get("focusedTestMap", [])

    frozen_touched = [
        path for path in changed_files if any(_pattern_match(path, p) for p in frozen_patterns)
    ]
    trigger_touched = [
        path for path in changed_files if any(_pattern_match(path, p) for p in trigger_patterns)
    ]
    suggestions = _collect_focused_suggestions(changed_files, focused_map)

    deep_scan_required = len(trigger_touched) > 0
    focused_only_allowed = not deep_scan_required and len(frozen_touched) == 0

    return {
        "changedFiles": changed_files,
        "frozenCoreTouched": frozen_touched,
        "deepScanTriggerTouched": trigger_touched,
        "deepScanRequired": deep_scan_required,
        "focusedOnlyAllowed": focused_only_allowed,
        "suggestedFocusedCommands": suggestions,
    }


def _print_report(report: dict[str, Any], manifest: dict[str, Any], base: str, head: str) -> None:
    print("=== CVF Core Compatibility Gate ===")
    print(f"Baseline: {manifest.get('baselineDate')} ({manifest.get('baselineSource')})")
    print(f"Range: {base}..{head}")
    print(f"Changed files: {len(report['changedFiles'])}")

    if report["frozenCoreTouched"]:
        print(f"Frozen core touched: {len(report['frozenCoreTouched'])}")
        for path in report["frozenCoreTouched"]:
            print(f"  - {path}")
    else:
        print("Frozen core touched: 0")

    if report["deepScanTriggerTouched"]:
        print(f"Deep scan triggers matched: {len(report['deepScanTriggerTouched'])}")
        for path in report["deepScanTriggerTouched"]:
            print(f"  - {path}")
    else:
        print("Deep scan triggers matched: 0")

    print(f"Decision: {'FULL REGRESSION REQUIRED' if report['deepScanRequired'] else 'FOCUSED TESTS ALLOWED'}")

    if report["suggestedFocusedCommands"]:
        print("Suggested focused commands:")
        for cmd in report["suggestedFocusedCommands"]:
            print(f"  - {cmd}")


def main() -> int:
    parser = argparse.ArgumentParser(description="CVF core compatibility gate")
    parser.add_argument("--manifest", default=str(DEFAULT_MANIFEST), help="Path to core manifest JSON")
    parser.add_argument("--base", default=None, help="Git base ref (default: HEAD~1)")
    parser.add_argument("--head", default=None, help="Git head ref (default: HEAD)")
    parser.add_argument(
        "--enforce",
        action="store_true",
        help="Return non-zero when frozen core is touched or deep scan is required",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Print JSON report to stdout instead of text",
    )
    parser.add_argument(
        "--write-report",
        default=None,
        help="Optional output path for JSON report file",
    )
    args = parser.parse_args()

    manifest_path = Path(args.manifest)
    if not manifest_path.is_absolute():
        manifest_path = (REPO_ROOT / manifest_path).resolve()
    if not manifest_path.exists():
        print(f"Manifest not found: {manifest_path}", file=sys.stderr)
        return 1

    manifest = _load_manifest(manifest_path)
    base, head = _resolve_range(args.base, args.head)

    try:
        changed_files = _get_changed_files(base, head)
    except RuntimeError as exc:
        if args.base:
            fallback_base = "HEAD~1"
            try:
                changed_files = _get_changed_files(fallback_base, head)
                print(
                    f"Warning: primary range failed ({exc}); fallback to {fallback_base}..{head}",
                    file=sys.stderr,
                )
                base = fallback_base
            except RuntimeError as fallback_exc:
                print(str(fallback_exc), file=sys.stderr)
                return 1
        else:
            print(str(exc), file=sys.stderr)
            return 1

    classified = _classify(changed_files, manifest)
    report = {
        "timestamp": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "manifestPath": str(manifest_path.relative_to(REPO_ROOT)).replace("\\", "/"),
        "baselineDate": manifest.get("baselineDate"),
        "baselineSource": manifest.get("baselineSource"),
        "range": {"base": base, "head": head},
        **classified,
    }

    if args.write_report:
        out_path = Path(args.write_report)
        if not out_path.is_absolute():
            out_path = (REPO_ROOT / out_path).resolve()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    if args.json:
        print(json.dumps(report, indent=2))
    else:
        _print_report(report, manifest, base, head)

    if args.enforce:
        policy = manifest.get("policy", {})
        block_frozen = bool(policy.get("blockFrozenCoreEditsOnEnforce", True))
        if report["deepScanRequired"]:
            return 2
        if block_frozen and report["frozenCoreTouched"]:
            return 3

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
