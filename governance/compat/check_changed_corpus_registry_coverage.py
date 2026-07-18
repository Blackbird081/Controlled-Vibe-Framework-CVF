#!/usr/bin/env python3
"""
CVF changed corpus registry coverage gate.

Fast-path guard for worker-return and reviewer-return latency: newly added
governed source/test files under EXTENSIONS/ must already be covered by the
GC-051 corpus scan registry before the reviewer reaches full pre-commit.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
REGISTRY_PATH = REPO_ROOT / "docs" / "corpus-intelligence" / "CVF_CORPUS_SCAN_REGISTRY.json"
GOVERNED_PREFIXES = ("EXTENSIONS/",)
GOVERNED_SUFFIXES = (".py", ".ts", ".tsx", ".js", ".jsx")
IGNORED_SEGMENTS = ("/node_modules/", "/dist/", "/build/", "/coverage/")


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
        path = parts[2] if status.startswith(("R", "C")) and len(parts) > 2 else parts[1]
        normalized = path.replace("\\", "/").strip()
        if normalized:
            changed.setdefault(normalized, set()).add(status)
    return changed


def _merge_changed(target: dict[str, set[str]], source: dict[str, set[str]]) -> None:
    for path, statuses in source.items():
        target.setdefault(path, set()).update(statuses)


def get_changed_paths(base: str | None, head: str | None) -> dict[str, set[str]]:
    changed: dict[str, set[str]] = {}
    if base and head and base != head:
        code, out, err = _run_git(["diff", "--name-status", f"{base}..{head}"])
        if code != 0:
            raise RuntimeError(err or out or f"git diff failed for {base}..{head}")
        _merge_changed(changed, _parse_name_status(out))

    for args in (["diff", "--name-status"], ["diff", "--name-status", "--cached"]):
        code, out, _ = _run_git(args)
        if code == 0 and out:
            _merge_changed(changed, _parse_name_status(out))

    code, out, _ = _run_git(["ls-files", "--others", "--exclude-standard"])
    if code == 0 and out:
        for raw in out.splitlines():
            path = raw.replace("\\", "/").strip()
            if path:
                changed.setdefault(path, set()).add("A")
    return changed


def is_new_governed_source_path(path: str, statuses: set[str]) -> bool:
    normalized = path.replace("\\", "/")
    if not any(status.startswith("A") for status in statuses):
        return False
    if not normalized.startswith(GOVERNED_PREFIXES):
        return False
    if not normalized.endswith(GOVERNED_SUFFIXES):
        return False
    return not any(segment in normalized for segment in IGNORED_SEGMENTS)


def registry_covers_path(registry: dict[str, Any], path: str) -> bool:
    normalized = path.replace("\\", "/").rstrip("/")
    for entry in registry.get("corpora", []):
        for raw_scope in entry.get("scopePaths", []):
            scope = str(raw_scope).replace("\\", "/").rstrip("/")
            if not scope:
                continue
            if normalized == scope or normalized.startswith(scope + "/"):
                return True
    return False


def load_registry(path: Path = REGISTRY_PATH) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def find_coverage_violations(
    changed: dict[str, set[str]],
    registry: dict[str, Any],
) -> list[str]:
    violations: list[str] = []
    for path, statuses in sorted(changed.items()):
        if not is_new_governed_source_path(path, statuses):
            continue
        if not registry_covers_path(registry, path):
            violations.append(
                f"{path}: added governed source/test file is not covered by "
                "docs/corpus-intelligence/CVF_CORPUS_SCAN_REGISTRY.json scopePaths"
            )
    return violations


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Check newly added governed source/test files have GC-051 registry coverage"
    )
    parser.add_argument("--base", default=None)
    parser.add_argument("--head", default="HEAD")
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args()

    print("=== CVF Changed Corpus Registry Coverage Gate ===")
    print(f"Registry: {REGISTRY_PATH.relative_to(REPO_ROOT)}")
    if args.base:
        print(f"Range: {args.base}..{args.head}")

    try:
        changed = get_changed_paths(args.base, args.head)
        registry = load_registry()
    except Exception as exc:  # noqa: BLE001 - CLI guard should print safe failure
        print(f"FAIL: {exc}")
        return 2 if args.enforce else 0

    new_paths = [
        path
        for path, statuses in sorted(changed.items())
        if is_new_governed_source_path(path, statuses)
    ]
    violations = find_coverage_violations(changed, registry)

    print(f"Changed paths observed: {len(changed)}")
    print(f"New governed source/test paths checked: {len(new_paths)}")
    print(f"Violations: {len(violations)}")
    if violations:
        print("\nViolations:")
        for violation in violations:
            print(f"  - {violation}")
        print("\nAction: add or update GC-051 registry source entries and regenerate the aggregate.")
        return 1 if args.enforce else 0

    print("\nCOMPLIANT - changed governed source/test registry coverage is aligned.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
