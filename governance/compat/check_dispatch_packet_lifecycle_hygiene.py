#!/usr/bin/env python3
"""CVF Dispatch Packet Lifecycle Hygiene Checker.

Checks changed dispatch-ready governed artifacts (docs/baselines/*.md and
docs/work_orders/*.md) for three lifecycle hygiene violations:

  LH-01  Stale active-handoff reference: the artifact cites a non-archive
         AGENT_HANDOFF*.md file that differs from the current activeHandoff
         in CVF_SESSION/ACTIVE_SESSION_BOOTSTRAP_READ_MODEL.json.
  LH-02  Closed-lane stale DISPATCH_READY: the artifact carries
         Status: DISPATCH_READY for a lane key that is clearly recorded as
         closed in active session or active-handoff text.
  LH-03  Provider-specific normative role assignment: the artifact's Agent
         Roles table or rolePattern field names a specific AI provider or
         model as the required worker, dispatcher, or reviewer role.

Standard: docs/reference/external_agent_review/CVF_KIOD_R7_DISPATCH_PACKET_LIFECYCLE_HYGIENE_STANDARD.md
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]

STANDARD_PATH = (
    "docs/reference/external_agent_review/"
    "CVF_KIOD_R7_DISPATCH_PACKET_LIFECYCLE_HYGIENE_STANDARD.md"
)

APPLICABLE_DIRS = (
    "docs/baselines/",
    "docs/work_orders/",
)
ARCHIVE_MARKER = "/archive/"

DISPATCH_STATUS_RE = re.compile(r"(?m)^Status:\s*DISPATCH_READY\s*$")

BOOTSTRAP_PATH = "CVF_SESSION/ACTIVE_SESSION_BOOTSTRAP_READ_MODEL.json"
FRONT_DOOR_PATH = "CVF_SESSION_MEMORY.md"
ACTIVE_SESSION_PATH = "CVF_SESSION/ACTIVE_SESSION_STATE.json"

HANDOFF_RE = re.compile(r"AGENT_HANDOFF[A-Za-z0-9_.-]*\.md")

PROVIDER_NAMES = (
    "Claude",
    "GPT-4",
    "GPT-3",
    "GPT4",
    "GPT3",
    "Gemini",
    "Codex",
    "DeepSeek",
    "Qwen",
    "Mistral",
    "LLaMA",
    "Llama",
    "ChatGPT",
    "OpenAI",
    "Anthropic",
)
PROVIDER_RE = re.compile(
    r"\b(" + "|".join(re.escape(p) for p in PROVIDER_NAMES) + r")\b",
    re.IGNORECASE,
)

AGENT_ROLES_SECTION_RE = re.compile(
    r"(?m)^##\s+Agent Roles\s*$(.*?)(?=^##\s+|\Z)",
    re.DOTALL,
)
ROLE_PATTERN_RE = re.compile(
    r"\|\s*rolePattern\s*\|([^|\n]+)\|",
    re.IGNORECASE,
)

CLOSED_STATUS_TOKENS = (
    "CLOSED_PASS_BOUNDED",
    "CLOSED_PASS",
    "CLOSED_PASS_BOUNDED_INCOMPLETE",
)
LANE_KEY_FROM_FIELD_RE = re.compile(r"(?m)^Batch ID:\s*([A-Z0-9_-]+)\s*$")
LANE_KEY_FROM_FILENAME_RE = re.compile(
    r"CVF(?:_AGENT_WORK_ORDER|_GC018)?_([A-Z0-9]+(?:[-_][A-Z0-9]+)*)_\d{4}-\d{2}-\d{2}\.md$",
    re.IGNORECASE,
)
CLOSED_LANE_WINDOW = 200

EVIDENCE_CONTEXT_KEYWORDS = (
    "historical",
    "evidence",
    "prior",
    "closed",
    "source path",
    "archive",
    "receipt",
    "example",
    "sample",
)


def _configure_stdout() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")


def _run_git(args: list[str]) -> str:
    proc = subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        text=True,
        encoding="utf-8",
        errors="replace",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return proc.stdout.strip()


def _get_range_paths(base: str, head: str) -> list[str]:
    out = _run_git(["diff", "--name-only", f"{base}..{head}"])
    return [p.replace("\\", "/") for p in out.splitlines() if p.strip()]


def _get_status_paths() -> list[str]:
    out = _run_git(["status", "--short"])
    paths: list[str] = []
    for line in out.splitlines():
        if not line.strip():
            continue
        raw = line[3:].strip() if len(line) > 2 and line[2] == " " else line[2:].strip()
        if " -> " in raw:
            raw = raw.split(" -> ", 1)[1]
        paths.append(raw.replace("\\", "/"))
    return paths


def _changed_paths(base: str | None, head: str | None) -> list[str]:
    paths: set[str] = set()
    if base and head:
        paths.update(_get_range_paths(base, head))
    paths.update(_get_status_paths())
    return sorted(paths)


def _is_applicable(path: str) -> bool:
    norm = path.replace("\\", "/")
    return (
        norm.endswith(".md")
        and ARCHIVE_MARKER not in norm
        and norm.startswith(APPLICABLE_DIRS)
    )


def _read(path: str) -> str:
    full = REPO_ROOT / path
    if not full.is_file():
        return ""
    return full.read_text(encoding="utf-8", errors="replace")


def _active_handoff() -> str:
    text = _read(BOOTSTRAP_PATH)
    if not text:
        return ""
    try:
        data = json.loads(text)
        return str(data.get("activeHandoff", ""))
    except (json.JSONDecodeError, KeyError):
        return ""


def _closed_lane_text() -> str:
    parts: list[str] = []
    for path in (FRONT_DOOR_PATH, ACTIVE_SESSION_PATH):
        t = _read(path)
        if t:
            parts.append(t)
    handoff_name = _active_handoff()
    if handoff_name:
        t = _read(handoff_name)
        if t:
            parts.append(t)
    return "\n".join(parts)


def _is_dispatch_ready(text: str) -> bool:
    return bool(DISPATCH_STATUS_RE.search(text))


def _extract_lane_key(path: str, text: str) -> str | None:
    m = LANE_KEY_FROM_FIELD_RE.search(text)
    if m:
        return m.group(1).strip()
    fname = Path(path).name
    m2 = LANE_KEY_FROM_FILENAME_RE.search(fname)
    if m2:
        return m2.group(1).strip().replace("_", "-").upper()
    return None


def _is_lane_clearly_closed(lane_key: str, closed_text: str) -> bool:
    if not lane_key:
        return False
    key_upper = lane_key.upper()
    lower_text = closed_text.upper()
    start = 0
    while True:
        idx = lower_text.find(key_upper, start)
        if idx == -1:
            break
        region = closed_text[max(0, idx - CLOSED_LANE_WINDOW): idx + len(lane_key) + CLOSED_LANE_WINDOW]
        for token in CLOSED_STATUS_TOKENS:
            if token in region:
                return True
        start = idx + 1
    return False


def _normative_role_text(text: str) -> str:
    parts: list[str] = []
    m = AGENT_ROLES_SECTION_RE.search(text)
    if m:
        parts.append(m.group(1))
    for m2 in ROLE_PATTERN_RE.finditer(text):
        parts.append(m2.group(1))
    return "\n".join(parts)


def _is_evidence_line(line: str) -> bool:
    lower = line.lower()
    return any(kw in lower for kw in EVIDENCE_CONTEXT_KEYWORDS)


def check_artifact(path: str) -> list[dict[str, Any]]:
    text = _read(path)
    if not text:
        return []
    if not _is_dispatch_ready(text):
        return []

    violations: list[dict[str, Any]] = []

    active = _active_handoff()
    if active:
        handoff_refs = set(HANDOFF_RE.findall(text))
        for ref in handoff_refs:
            if ref == active:
                continue
            has_non_archive_occurrence = False
            for m in re.finditer(re.escape(ref), text):
                start = m.start()
                prefix = text[max(0, start - 80): start]
                if "archive" not in prefix.lower():
                    has_non_archive_occurrence = True
                    break
            if has_non_archive_occurrence:
                violations.append({
                    "path": path,
                    "rule": "LH-01",
                    "message": (
                        f"stale active-handoff reference `{ref}`; "
                        f"current activeHandoff is `{active}`; "
                        "update or archive-qualify this reference"
                    ),
                })

    lane_key = _extract_lane_key(path, text)
    if lane_key:
        closed_text = _closed_lane_text()
        if _is_lane_clearly_closed(lane_key, closed_text):
            violations.append({
                "path": path,
                "rule": "LH-02",
                "message": (
                    f"dispatch-ready artifact for lane `{lane_key}` but "
                    "this lane appears closed in active session/handoff text; "
                    "confirm lane status or archive this packet"
                ),
            })

    normative_text = _normative_role_text(text)
    if normative_text:
        for m in PROVIDER_RE.finditer(normative_text):
            line_start = normative_text.rfind("\n", 0, m.start()) + 1
            line_end = normative_text.find("\n", m.end())
            if line_end == -1:
                line_end = len(normative_text)
            line = normative_text[line_start:line_end]
            if _is_evidence_line(line):
                continue
            violations.append({
                "path": path,
                "rule": "LH-03",
                "message": (
                    f"provider-specific name `{m.group(0)}` in normative role "
                    "assignment surface; use role terms such as `worker`, "
                    "`reviewer`, or `dispatcher` instead"
                ),
            })
            break

    return violations


def _run_check(base: str | None, head: str | None) -> dict[str, Any]:
    paths = _changed_paths(base, head)
    applicable = [p for p in paths if _is_applicable(p)]
    all_violations: list[dict[str, Any]] = []
    for path in applicable:
        all_violations.extend(check_artifact(path))
    return {
        "policy": STANDARD_PATH,
        "checkedFileCount": len(applicable),
        "checkedFiles": applicable,
        "violationCount": len(all_violations),
        "violations": all_violations,
        "compliant": not all_violations,
    }


def _print_report(report: dict[str, Any], base: str | None, head: str | None) -> None:
    print("=== CVF Dispatch Packet Lifecycle Hygiene Checker ===")
    if base or head:
        print(f"Range: {base or '<worktree>'}..{head or '<worktree>'}")
    print(f"Policy: {report['policy']}")
    print(f"Files checked: {report['checkedFileCount']}")
    print(f"Violations: {report['violationCount']}")
    if report["checkedFiles"]:
        print("\nChecked dispatch artifacts:")
        for p in report["checkedFiles"]:
            print(f"  - {p}")
    if report["violations"]:
        print("\nViolations:")
        for v in report["violations"]:
            print(f"  - [{v['rule']}] {v['path']}: {v['message']}")
    if report["compliant"]:
        print("\nCOMPLIANT - dispatch packet lifecycle hygiene gates satisfied.")
    else:
        print(
            "\nVIOLATION - repair stale handoff references, closed-lane residue, "
            "or provider-specific role assignment before dispatch."
        )


def main() -> int:
    _configure_stdout()
    parser = argparse.ArgumentParser(
        description="Check CVF dispatch packet lifecycle hygiene"
    )
    parser.add_argument("--base", default=None)
    parser.add_argument("--head", default=None)
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args()
    report = _run_check(args.base, args.head)
    _print_report(report, args.base, args.head)
    return 1 if args.enforce and not report["compliant"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
