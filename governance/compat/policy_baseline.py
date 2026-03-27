#!/usr/bin/env python3
from __future__ import annotations

import json
import subprocess
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]


def _run_git(args: list[str]) -> tuple[int, str, str]:
    proc = subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return proc.returncode, proc.stdout.strip(), proc.stderr.strip()


def _repo_rel(path: Path) -> str | None:
    try:
        return path.resolve().relative_to(REPO_ROOT).as_posix()
    except ValueError:
        return None


def _ref_exists(ref: str) -> bool:
    code, _, _ = _run_git(["rev-parse", "--verify", "--quiet", f"{ref}^{{commit}}"])
    return code == 0


def _path_dirty_against_head(rel_path: str) -> bool:
    for args in (
        ["diff", "--quiet", "--", rel_path],
        ["diff", "--cached", "--quiet", "--", rel_path],
    ):
        code, _, _ = _run_git(args)
        if code == 1:
            return True
    return False


def _head_touched_path(rel_path: str) -> bool:
    if not _ref_exists("HEAD"):
        return False
    code, out, _ = _run_git(["diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD", "--", rel_path])
    if code != 0:
        return False
    return rel_path in {line.strip() for line in out.splitlines() if line.strip()}


def _read_json_at_ref(rel_path: str, ref: str) -> dict[str, Any] | None:
    if not _ref_exists(ref):
        return None
    code, out, _ = _run_git(["show", f"{ref}:{rel_path}"])
    if code != 0 or not out:
        return None
    try:
        return json.loads(out)
    except json.JSONDecodeError:
        return None


def load_json_policy_baseline(path: Path) -> tuple[dict[str, Any] | None, str | None]:
    rel_path = _repo_rel(path)
    if not rel_path:
        return None, None

    if _path_dirty_against_head(rel_path):
        return _read_json_at_ref(rel_path, "HEAD"), "HEAD"

    if _head_touched_path(rel_path):
        return _read_json_at_ref(rel_path, "HEAD~1"), "HEAD~1"

    return None, None
