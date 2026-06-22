#!/usr/bin/env python3
"""
CVF Memory Access Claim Gate

Rejects forward-only Memory Plane overclaims in changed governed Markdown.

Scope (MPI-T5):
- Scans changed Markdown under docs/baselines, docs/work_orders, docs/reviews,
  and docs/reference.
- Flags five Memory Plane overclaim classes when the changed file does not
  carry the required Source Verification citation, or when the claim is
  forbidden by current false-invariant source.
- Mirrors sibling checker CLI behavior: --base, --head, --enforce, --json.

Not in scope:
- Runtime truth judgment beyond citation presence and the locked false
  invariants.
- Route, MCP, CLI, provider, network, durable, or file mutation behavior.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_BASE_CANDIDATES = ("origin/main", "origin/master", "main", "master")

APPLICABLE_PREFIXES: tuple[str, ...] = (
    "docs/baselines/",
    "docs/work_orders/",
    "docs/reviews/",
    "docs/reference/",
)

ARCHIVE_MARKER = "/archive/"
SOURCE_VERIFICATION_HEADING_RE = re.compile(r"^## Source Verification Block\s*$", re.MULTILINE)
NEXT_HEADING_RE = re.compile(r"^##\s+", re.MULTILINE)
BACKTICK_PATH_RE = re.compile(r"`([^`]+)`")

GUARDRAIL_CONTEXT_MARKERS: tuple[str, ...] = (
    "flag claim",
    "flags claim",
    "flagged claim",
    "overclaim",
    "checker",
    "claim language",
    "candidate checker target",
    "implementation requirement",
    "must not",
    "do not",
    "does not authorize",
    "not authorize",
    "forbidden",
    "without proof",
    "unless",
    "rejects claim",
    "reject claim",
    "fail condition",
)


@dataclass(frozen=True)
class ClaimRule:
    claim_class: str
    pattern_name: str
    regex: re.Pattern[str]
    required_citation: str
    citation_family: str | None
    always_forbidden: bool = False


CLAIM_RULES: tuple[ClaimRule, ...] = (
    ClaimRule(
        claim_class="external_agent_live_read_access",
        pattern_name="external agents can read CVF memory through live runtime/MCP/CLI route",
        regex=re.compile(
            r"\b(?:external\s+agents?|agent)\b.{0,90}\b(?:can|may|now|will|is able to|are able to)\b"
            r".{0,70}\b(?:read|access|query)\b.{0,70}\b(?:cvf\s+)?(?:memory|memory plane)\b"
            r".{0,90}\b(?:live|runtime|mcp|cli|route)\b",
            re.IGNORECASE,
        ),
        required_citation="route file, MCP tool file, or CLI adapter file in Source Verification Block",
        citation_family="route_mcp_cli",
    ),
    ClaimRule(
        claim_class="scan_registry_auto_wired_route",
        pattern_name="scan-registry projection is auto-wired or route-wired",
        regex=re.compile(
            r"\bscan[-\s]registry\s+projection\b.{0,120}\b(?:auto[-\s]wired|automatically\s+loaded|"
            r"wired\s+into\s+(?:the\s+)?route|route[-\s]wired)\b",
            re.IGNORECASE,
        ),
        required_citation="route file in Source Verification Block",
        citation_family="route",
    ),
    ClaimRule(
        claim_class="kgr_graph_vector_durable_live_memory_access",
        pattern_name="KGR/graph/vector DB/durable store is production or live memory access",
        regex=re.compile(
            r"\b(?:kgr|graph\s+memory|vector\s+db|durable\s+store)\b.{0,120}\b(?:production|live)\b"
            r".{0,80}\bmemory\s+access\b|\b(?:production|live)\b.{0,80}\bmemory\s+access\b"
            r".{0,120}\b(?:kgr|graph\s+memory|vector\s+db|durable\s+store)\b",
            re.IGNORECASE,
        ),
        required_citation="durable-store, vector-store, graph, or KGR source file in Source Verification Block",
        citation_family="durable_vector",
    ),
    ClaimRule(
        claim_class="raw_memory_or_reinjection_permitted",
        pattern_name="raw memory/raw content exposure or reinjection is permitted",
        regex=re.compile(
            r"\brawMemoryReleased\s*[:=]\s*true\b|\bcanReinject\s*[:=]\s*true\b|"
            r"\braw\s+memory\s+release\s+(?:is\s+)?allowed\b|"
            r"\breinjection\s+(?:is\s+)?allowed\b|"
            r"\braw\s+(?:content|memory)\s+exposure\s+(?:is\s+)?(?:allowed|permitted)\b",
            re.IGNORECASE,
        ),
        required_citation="source-verified false invariant; current sources lock raw release and reinjection false",
        citation_family=None,
        always_forbidden=True,
    ),
    ClaimRule(
        claim_class="index_replaces_canonical_authority",
        pattern_name="INDEX artifact replaces or supersedes canonical source authority",
        regex=re.compile(
            r"\bindex\s+artifact\b.{0,90}\b(?:replaces|supersedes|is\s+(?:the\s+)?)\b"
            r".{0,90}\bcanonical\s+source\s+authority\b",
            re.IGNORECASE,
        ),
        required_citation="INDEX standard routing; INDEX cannot replace canonical source authority",
        citation_family=None,
        always_forbidden=True,
    ),
)


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


def _ref_exists(ref: str) -> bool:
    code, _, _ = _run_git(["rev-parse", "--verify", "--quiet", f"{ref}^{{commit}}"])
    return code == 0


def _discover_default_base(head: str) -> tuple[str, str]:
    env_base = os.getenv("CVF_COMPAT_BASE")
    if env_base:
        return env_base, "env:CVF_COMPAT_BASE"
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
        if status.startswith(("R", "C")):
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
    for item in maps:
        for path, statuses in item.items():
            merged.setdefault(path, set()).update(statuses)
    return {path: sorted(statuses) for path, statuses in sorted(merged.items())}


def _read_rel(path: str) -> str:
    return (REPO_ROOT / path).read_text(encoding="utf-8", errors="replace")


def _is_applicable(path: str) -> bool:
    normalized = path.replace("\\", "/")
    if not normalized.endswith(".md"):
        return False
    if ARCHIVE_MARKER in normalized:
        return False
    return any(normalized.startswith(prefix) for prefix in APPLICABLE_PREFIXES)


def _source_verification_block(text: str) -> str:
    match = SOURCE_VERIFICATION_HEADING_RE.search(text)
    if not match:
        return ""
    next_match = NEXT_HEADING_RE.search(text, match.end())
    end = next_match.start() if next_match else len(text)
    return text[match.end():end]


def _citation_paths(source_verification_block: str) -> tuple[str, ...]:
    paths: list[str] = []
    for value in BACKTICK_PATH_RE.findall(source_verification_block):
        normalized = value.replace("\\", "/").strip()
        if "/" in normalized or normalized.endswith((".py", ".ts", ".md", ".json", ".tsx")):
            paths.append(normalized)
    return tuple(paths)


def _has_citation(citation_paths: tuple[str, ...], family: str | None) -> bool:
    if family is None:
        return False
    lowered = [p.lower() for p in citation_paths]
    if family == "route_mcp_cli":
        return any(
            "route.ts" in path
            or "/route" in path
            or "/api/" in path
            or "mcp" in path
            or "cli" in path
            or "adapter" in path
            for path in lowered
        )
    if family == "route":
        return any("route.ts" in path or "/route" in path or "/api/" in path for path in lowered)
    if family == "durable_vector":
        return any(
            "durable" in path
            or "vector" in path
            or "graph" in path
            or "kgr" in path
            or "store" in path
            or "database" in path
            for path in lowered
        )
    return False


def _line_number_for_offset(text: str, offset: int) -> int:
    return text.count("\n", 0, offset) + 1


def _line_window(text: str, offset: int) -> str:
    current_start = text.rfind("\n", 0, offset)
    if current_start == -1:
        current_start = 0
    else:
        current_start += 1
    previous_start = text.rfind("\n", 0, max(0, current_start - 1))
    start = 0 if previous_start == -1 else previous_start + 1
    current_end = text.find("\n", offset)
    if current_end == -1:
        current_end = len(text)
    next_end = text.find("\n", current_end + 1)
    end = len(text) if next_end == -1 else next_end
    return text[start:end]


def _is_guardrail_context(line: str) -> bool:
    lowered = line.lower()
    return any(marker in lowered for marker in GUARDRAIL_CONTEXT_MARKERS)


def _make_violation(
    path: str,
    text: str,
    rule: ClaimRule,
    match: re.Match[str],
) -> dict[str, str]:
    lineno = _line_number_for_offset(text, match.start())
    return {
        "path": path,
        "line": str(lineno),
        "type": rule.claim_class,
        "matchedClaimPattern": rule.pattern_name,
        "missingRequiredCitation": rule.required_citation,
        "message": (
            f"{path}:{lineno}: matched claim pattern `{rule.pattern_name}`; "
            f"missing required citation: {rule.required_citation}"
        ),
    }


def diagnose_memory_access_claims(path: str, text: str) -> list[dict[str, str]]:
    block = _source_verification_block(text)
    citations = _citation_paths(block)
    violations: list[dict[str, str]] = []
    for rule in CLAIM_RULES:
        citation_ok = _has_citation(citations, rule.citation_family)
        for match in rule.regex.finditer(text):
            if _is_guardrail_context(_line_window(text, match.start())):
                continue
            if citation_ok and not rule.always_forbidden:
                continue
            violations.append(_make_violation(path, text, rule, match))
    return violations


def _classify(changed_paths: dict[str, list[str]]) -> dict[str, Any]:
    scoped_paths = [
        path
        for path, statuses in sorted(changed_paths.items())
        if _is_applicable(path) and not all(status.startswith("D") for status in statuses)
    ]
    violations: list[dict[str, str]] = []
    for path in scoped_paths:
        full = REPO_ROOT / path
        if not full.exists() or full.is_dir():
            continue
        violations.extend(diagnose_memory_access_claims(path, _read_rel(path)))

    return {
        "checkedPaths": scoped_paths,
        "changedPaths": changed_paths,
        "violations": violations,
        "violationCount": len(violations),
        "compliant": not violations,
    }


def _print_report(report: dict[str, Any], base: str, head: str, range_source: str) -> None:
    print("=== CVF Memory Access Claim Gate ===")
    print(f"Range: {base}..{head} ({range_source})")
    print(f"Changed paths: {len(report['changedPaths'])}")
    print(f"Checked governed Markdown paths: {len(report['checkedPaths'])}")
    print(f"Violations: {len(report['violations'])}")
    if report["violations"]:
        print("\nViolations:")
        for item in report["violations"]:
            print(f"  - {item['message']}")
    if report["compliant"]:
        print("\nCOMPLIANT - Memory access claim boundaries are aligned.")
    else:
        print("\nVIOLATION - Memory access claim overclaims require source verification.")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate Memory Plane access-claim source fidelity"
    )
    parser.add_argument("--base", default=None, help="Optional git base ref")
    parser.add_argument("--head", default=None, help="Optional git head ref")
    parser.add_argument("--enforce", action="store_true",
                        help="Return non-zero when violations exist")
    parser.add_argument("--json", action="store_true", help="Print JSON report")
    args = parser.parse_args()

    try:
        base, head, range_source = _resolve_range(args.base, args.head)
        changed_paths = _merge_changed_maps(
            _get_changed_name_status(base, head),
            _get_worktree_name_status(),
        )
        report = _classify(changed_paths)
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    report["timestamp"] = (
        dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    )
    report["range"] = {"base": base, "head": head, "source": range_source}
    if args.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        _print_report(report, base, head, range_source)
    if args.enforce and not report["compliant"]:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
