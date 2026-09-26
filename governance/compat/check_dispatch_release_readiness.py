#!/usr/bin/env python3
"""Fail closed until a work-order dispatch is committed and continuity-bound."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path, PurePosixPath
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
BOOTSTRAP_PATH = "CVF_SESSION/ACTIVE_SESSION_BOOTSTRAP_READ_MODEL.json"
ACTIVE_STATE_PATH = "CVF_SESSION/ACTIVE_SESSION_STATE.json"
FRONT_DOOR_PATH = "CVF_SESSION_MEMORY.md"
STANDARD_PATH = "docs/reference/CVF_DISPATCH_RELEASE_READINESS_MACHINE_STANDARD_2026-09-25.md"
WORK_ORDER_PREFIX = "docs/work_orders/"
HASH_RE = re.compile(r"^[0-9a-f]{64}$")
BATCH_RE = re.compile(r"(?m)^Batch ID:\s*([^\s]+)\s*$")
MARKER_RE = re.compile(
    r"<!-- CVF-GC020-MATERIAL-SHA:START -->(.*?)"
    r"<!-- CVF-GC020-MATERIAL-SHA:END -->",
    re.DOTALL,
)
SHA_TOKEN_RE = re.compile(r"\b[0-9a-f]{7,40}\b")


def _configure_stdout() -> None:
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(errors="replace")


def _git(args: list[str]) -> tuple[int, str, str]:
    proc = subprocess.run(
        ["git", *args], cwd=REPO_ROOT, text=True, encoding="utf-8",
        errors="replace", stdout=subprocess.PIPE, stderr=subprocess.PIPE,
    )
    return proc.returncode, proc.stdout.strip(), proc.stderr.strip()


def _safe_repo_path(raw: str, *, prefix: str | None = None) -> str | None:
    value = raw.replace("\\", "/").strip()
    path = PurePosixPath(value)
    if not value or path.is_absolute() or ":" in value:
        return None
    if any(part in ("", ".", "..") for part in path.parts):
        return None
    normalized = path.as_posix()
    if prefix and not normalized.startswith(prefix):
        return None
    return normalized


def _read(path: str) -> str:
    full = REPO_ROOT / path
    if not full.is_file() or full.is_symlink():
        return ""
    return full.read_text(encoding="utf-8", errors="replace")


def _load_bootstrap() -> dict[str, Any] | None:
    try:
        value = json.loads(_read(BOOTSTRAP_PATH))
    except json.JSONDecodeError:
        return None
    return value if isinstance(value, dict) else None


def _sha256(path: str) -> str:
    return hashlib.sha256((REPO_ROOT / path).read_bytes()).hexdigest()


def _tracked_and_clean(path: str) -> tuple[bool, str]:
    code, _, _ = _git(["ls-files", "--error-unmatch", "--", path])
    if code != 0:
        return False, "path is not tracked in Git"
    code, out, err = _git(["status", "--short", "--", path])
    if code != 0:
        return False, f"git status failed: {err or 'unknown error'}"
    if out:
        return False, f"path has uncommitted state: {out.splitlines()[0]}"
    return True, ""


def _last_commit(path: str) -> str:
    code, out, _ = _git(["log", "-1", "--format=%H", "--", path])
    return out if code == 0 and re.fullmatch(r"[0-9a-f]{40}", out) else ""


def _is_ancestor(ancestor: str, descendant: str) -> bool:
    code, _, _ = _git(["merge-base", "--is-ancestor", ancestor, descendant])
    return code == 0


def _head_sha(head: str) -> str:
    code, out, _ = _git(["rev-parse", "--verify", f"{head}^{{commit}}"])
    return out if code == 0 and re.fullmatch(r"[0-9a-f]{40}", out) else ""


def _add(violations: list[dict[str, str]], rule: str, message: str) -> None:
    violations.append({"rule": rule, "message": message})


def evaluate(active_work_order: str, head: str = "HEAD") -> dict[str, Any]:
    violations: list[dict[str, str]] = []
    work_order = _safe_repo_path(active_work_order, prefix=WORK_ORDER_PREFIX)
    if work_order is None or not work_order.endswith(".md"):
        _add(violations, "DR-01", "--active-work-order must be a safe docs/work_orders/*.md path")
        return _report(active_work_order, "", "", violations)

    bootstrap = _load_bootstrap()
    if bootstrap is None:
        _add(violations, "DR-01", f"{BOOTSTRAP_PATH} is missing or invalid JSON")
        return _report(work_order, "", "", violations)

    authority = bootstrap.get("currentAuthority")
    if not isinstance(authority, dict):
        _add(violations, "DR-01", "bootstrap currentAuthority is missing or invalid")
        return _report(work_order, "", "", violations)

    authority_work_order = str(authority.get("workOrderPath", ""))
    if authority_work_order != work_order:
        _add(
            violations, "DR-01",
            f"active work order `{work_order}` does not match currentAuthority.workOrderPath `{authority_work_order}`",
        )

    baseline = _safe_repo_path(str(authority.get("baselinePath", ""))) or ""
    packet_paths = (baseline, work_order)
    hash_fields = (
        (baseline, str(authority.get("baselineSha256", "")), "baselineSha256"),
        (work_order, str(authority.get("workOrderSha256", "")), "workOrderSha256"),
    )
    for path in packet_paths:
        if not path or not (REPO_ROOT / path).is_file():
            _add(violations, "DR-02", f"authority packet path is missing: `{path or '<empty>'}`")
            continue
        clean, reason = _tracked_and_clean(path)
        if not clean:
            _add(violations, "DR-02", f"`{path}` is not committed and clean: {reason}")
    for path, expected, field in hash_fields:
        if not path or not (REPO_ROOT / path).is_file():
            continue
        if not HASH_RE.fullmatch(expected):
            _add(violations, "DR-02", f"currentAuthority.{field} is not a lowercase SHA-256")
        elif _sha256(path) != expected:
            _add(violations, "DR-02", f"currentAuthority.{field} does not match `{path}` raw bytes")

    baseline_commit = _last_commit(baseline) if baseline else ""
    work_order_commit = _last_commit(work_order)
    material_commit = work_order_commit
    if not baseline_commit or not work_order_commit:
        _add(violations, "DR-03", "both packet artifacts must have a reachable Git commit")
    elif baseline_commit != work_order_commit:
        _add(violations, "DR-03", "baseline and work order must share one material dispatch commit")

    resolved_head = _head_sha(head)
    if not resolved_head:
        _add(violations, "DR-03", f"head ref `{head}` is not a commit")
    elif material_commit and not _is_ancestor(material_commit, resolved_head):
        _add(violations, "DR-03", "material dispatch commit is not an ancestor of the requested head")

    active_handoff = _safe_repo_path(str(bootstrap.get("activeHandoff", ""))) or ""
    continuity_paths = (active_handoff, BOOTSTRAP_PATH, ACTIVE_STATE_PATH, FRONT_DOOR_PATH)
    for path in continuity_paths:
        if not path:
            _add(violations, "DR-04", "active handoff path is missing from bootstrap")
            continue
        clean, reason = _tracked_and_clean(path)
        if not clean:
            _add(violations, "DR-04", f"continuity path `{path}` is not committed and clean: {reason}")

    continuity_commits = {_last_commit(path) for path in continuity_paths if path}
    continuity_commits.discard("")
    if len(continuity_commits) != 1:
        _add(violations, "DR-04", "handoff/front-door/generated continuity surfaces must share one committed sync")
    else:
        continuity_commit = next(iter(continuity_commits))
        if continuity_commit == material_commit:
            _add(violations, "DR-04", "continuity sync must be a commit after the material dispatch commit")
        elif material_commit and not _is_ancestor(material_commit, continuity_commit):
            _add(violations, "DR-04", "continuity sync does not descend from the material dispatch commit")
        if resolved_head and not _is_ancestor(continuity_commit, resolved_head):
            _add(violations, "DR-04", "continuity sync is not an ancestor of the requested head")

    work_order_text = _read(work_order)
    batch_match = BATCH_RE.search(work_order_text)
    batch_id = batch_match.group(1) if batch_match else ""
    handoff_text = _read(active_handoff) if active_handoff else ""
    marker_match = MARKER_RE.search(handoff_text)
    marker_text = marker_match.group(1) if marker_match else ""
    marker_shas = SHA_TOKEN_RE.findall(marker_text)
    if not marker_match:
        _add(violations, "DR-05", "active handoff lacks the GC-020 material-SHA marker block")
    elif not material_commit or not any(material_commit.startswith(token) for token in marker_shas):
        _add(violations, "DR-05", "active handoff material-SHA marker does not bind the packet commit")
    if not batch_id:
        _add(violations, "DR-05", "active work order lacks an exact Batch ID")
    elif batch_id not in marker_text:
        _add(violations, "DR-05", f"material-SHA marker does not name batch `{batch_id}`")

    next_move = str(bootstrap.get("nextAllowedMove", ""))
    if "NEXT_ACTION_CLASS=" not in next_move or "EXECUTE" not in next_move.upper():
        _add(violations, "DR-06", "nextAllowedMove does not authorize an EXECUTE action class")
    if work_order not in next_move:
        _add(violations, "DR-06", "nextAllowedMove does not name the active work-order path")
    normalized_batch = re.sub(r"[^A-Z0-9]+", "_", batch_id.upper()).strip("_")
    normalized_next_move = re.sub(r"[^A-Z0-9]+", "_", next_move.upper()).strip("_")
    if batch_id and normalized_batch not in normalized_next_move:
        _add(violations, "DR-06", f"nextAllowedMove does not name batch `{batch_id}`")

    return _report(work_order, material_commit, batch_id, violations)


def _report(
    work_order: str, material_commit: str, batch_id: str,
    violations: list[dict[str, str]],
) -> dict[str, Any]:
    return {
        "policy": STANDARD_PATH,
        "activeWorkOrder": work_order,
        "batchId": batch_id,
        "materialCommit": material_commit,
        "violationCount": len(violations),
        "violations": violations,
        "compliant": not violations,
    }


def main() -> int:
    _configure_stdout()
    parser = argparse.ArgumentParser(description="Check final work-order dispatch release readiness")
    parser.add_argument("--active-work-order", required=True)
    parser.add_argument("--head", default="HEAD")
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args()
    report = evaluate(args.active_work_order, args.head)
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        print("=== CVF Dispatch Release Readiness Gate ===")
        print(f"Policy: {report['policy']}")
        print(f"Active work order: {report['activeWorkOrder']}")
        print(f"Batch ID: {report['batchId'] or '<missing>'}")
        print(f"Material commit: {report['materialCommit'] or '<missing>'}")
        print(f"Violations: {report['violationCount']}")
        for item in report["violations"]:
            print(f"  - [{item['rule']}] {item['message']}")
        print(
            "\nCOMPLIANT - packet and continuity commits are dispatch-ready."
            if report["compliant"] else
            "\nVIOLATION - do not release this packet to a worker."
        )
    return 1 if args.enforce and not report["compliant"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
