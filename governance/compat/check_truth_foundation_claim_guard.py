#!/usr/bin/env python3
"""
CVF Truth Foundation Claim Guard (TKG-T4)

Rejects three bounded truth-foundation overclaim classes in changed governed
Markdown:

- integrity artifacts overclaimed as semantic truth;
- LLM or reviewer prose overclaimed as sole verification for hard claims;
- external inputs overclaimed as CVF authority without a CVF owner surface.

This checker is static and local only. It does not judge truth, call providers,
write files, or implement runtime governance behavior.
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
    "docs/roadmaps/",
)

ARCHIVE_MARKER = "/archive/"
DISCUSSION_HEADING_RE = re.compile(r"^## Guard Behavior Discussion\s*$", re.MULTILINE)
NEXT_HEADING_RE = re.compile(r"^##\s+", re.MULTILINE)
DISCUSSION_ONLY_MARKER = "Discussion-only disposition: META_DISCUSSION_ONLY"

GUARDRAIL_CONTEXT_MARKERS: tuple[str, ...] = (
    "claim class",
    "candidate",
    "checker",
    "guard",
    "guardrail",
    "overclaim",
    "invalid",
    "valid",
    "detect",
    "reject",
    "flag",
    "forbidden",
    "must not",
    "does not",
    "no ",
    "without becoming",
    "example",
    "test",
    "fixture",
    "fail",
    "pass",
    "advisory",
)


@dataclass(frozen=True)
class ClaimRule:
    claim_class: str
    pattern_name: str
    regex: re.Pattern[str]
    remediation: str


CLAIM_RULES: tuple[ClaimRule, ...] = (
    ClaimRule(
        claim_class="integrity_as_truth_overclaim",
        pattern_name="integrity artifact is claimed as semantic truth proof",
        regex=re.compile(
            r"\b(?:hash|sha256|checksum|signature|receipt|commit(?:\s+id)?|approval)\b"
            r".{0,80}\b(?:prove|proves|proved|proof|verifies|verified|guarantees?)\b"
            r".{0,80}\b(?:truth|true|correct|complete|accurate|semantic(?:ally)?)\b|"
            r"\b(?:truth|true|correct|complete|accurate|semantic(?:ally)?)\b"
            r".{0,80}\b(?:is|are|was|were)\b.{0,50}\b(?:proven|verified|guaranteed)\b"
            r".{0,80}\b(?:hash|sha256|checksum|signature|receipt|commit(?:\s+id)?|approval)\b",
            re.IGNORECASE,
        ),
        remediation=(
            "state the integrity boundary only, then cite source, command, test, "
            "receipt, or accountable authorization evidence for the semantic claim"
        ),
    ),
    ClaimRule(
        claim_class="llm_self_verification_overclaim",
        pattern_name="LLM or reviewer prose is claimed as sole verifier for hard claims",
        regex=re.compile(
            r"\b(?:llm|model|ai|reviewer|reviewer\s+prose|model\s+agreement)\b"
            r".{0,90}\b(?:sole|alone|only|independent)\b.{0,70}"
            r"\b(?:verifier|verification|verified|proves?|proof|certifies?)\b"
            r".{0,90}\b(?:hard\s+claim|obligation|numeric|security|production|"
            r"readiness|runtime|legal|contractual)\b|"
            r"\b(?:hard\s+claim|obligation|numeric|security|production|readiness|"
            r"runtime|legal|contractual)\b.{0,90}"
            r"\b(?:verified|proven|certified)\b.{0,90}"
            r"\b(?:solely|only|alone)\b.{0,70}\b(?:llm|model|ai|reviewer|reviewer\s+prose)\b",
            re.IGNORECASE,
        ),
        remediation=(
            "add non-self-referential evidence such as source read, deterministic "
            "check, command output, schema validation, test, receipt, live proof "
            "when authorized, or accountable authorization"
        ),
    ),
    ClaimRule(
        claim_class="external_input_authority_overclaim",
        pattern_name="external input is claimed as CVF source authority",
        regex=re.compile(
            r"\b(?:external\s+repo(?:sitory)?|upstream\s+repo(?:sitory)?|copied\s+folder|"
            r"external\s+folder|patch\s+folder|provider[- ]local\s+memory|"
            r"provider[- ]specific\s+memory|external\s+agent\s+(?:critique|recommendation|folder))\b"
            r".{0,100}\b(?:is|becomes|serves\s+as|acts\s+as|provides?)\b"
            r".{0,80}\b(?:CVF\s+)?(?:source\s+authority|canonical\s+authority|"
            r"authority|source\s+of\s+truth)\b|"
            r"\b(?:CVF\s+)?(?:source\s+authority|canonical\s+authority|source\s+of\s+truth)\b"
            r".{0,80}\b(?:comes\s+from|is\s+provided\s+by|is\s+owned\s+by)\b"
            r".{0,100}\b(?:external\s+repo(?:sitory)?|upstream\s+repo(?:sitory)?|"
            r"copied\s+folder|external\s+folder|patch\s+folder|provider[- ]local\s+memory|"
            r"provider[- ]specific\s+memory|external\s+agent\s+(?:critique|recommendation|folder))\b",
            re.IGNORECASE,
        ),
        remediation=(
            "route the external input through a CVF-owned roadmap, reference "
            "contract, source verification row, or explicit advisory boundary"
        ),
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
        path = path.replace("\\", "/")
        changed.setdefault(path, set()).add(status)
    return changed


def _get_changed_name_status(base: str, head: str) -> dict[str, set[str]]:
    code, out, err = _run_git(["diff", "--name-status", f"{base}..{head}"])
    if code != 0:
        raise RuntimeError(f"git diff failed for {base}..{head}: {err}")
    return _parse_name_status_output(out)


def _get_worktree_name_status() -> dict[str, set[str]]:
    code, out, err = _run_git(["status", "--short"])
    if code != 0:
        raise RuntimeError(f"git status failed: {err}")
    changed: dict[str, set[str]] = {}
    for raw_line in out.splitlines():
        if not raw_line.strip():
            continue
        status = raw_line[:2].strip() or raw_line[:2]
        path = raw_line[3:].strip()
        if " -> " in path:
            path = path.split(" -> ", 1)[1]
        path = path.replace("\\", "/")
        changed.setdefault(path, set()).add(status)
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


def _strip_discussion_only_sections(text: str) -> str:
    output: list[str] = []
    pos = 0
    for match in DISCUSSION_HEADING_RE.finditer(text):
        output.append(text[pos:match.start()])
        next_match = NEXT_HEADING_RE.search(text, match.end())
        end = next_match.start() if next_match else len(text)
        section = text[match.start():end]
        if DISCUSSION_ONLY_MARKER not in section:
            output.append(section)
        pos = end
    output.append(text[pos:])
    return "".join(output)


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
        "remediation": rule.remediation,
        "message": (
            f"{path}:{lineno}: matched truth-foundation claim pattern "
            f"`{rule.pattern_name}`; remediation: {rule.remediation}"
        ),
    }


def diagnose_truth_foundation_claims(path: str, text: str) -> list[dict[str, str]]:
    scan_text = _strip_discussion_only_sections(text)
    violations: list[dict[str, str]] = []
    for rule in CLAIM_RULES:
        for match in rule.regex.finditer(scan_text):
            if _is_guardrail_context(_line_window(scan_text, match.start())):
                continue
            violations.append(_make_violation(path, scan_text, rule, match))
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
        violations.extend(diagnose_truth_foundation_claims(path, _read_rel(path)))

    return {
        "checkedPaths": scoped_paths,
        "changedPaths": changed_paths,
        "violations": violations,
        "violationCount": len(violations),
        "compliant": not violations,
    }


def _print_report(report: dict[str, Any], base: str, head: str, range_source: str) -> None:
    print("=== CVF Truth Foundation Claim Guard ===")
    print(f"Range: {base}..{head} ({range_source})")
    print(f"Changed paths: {len(report['changedPaths'])}")
    print(f"Checked governed Markdown paths: {len(report['checkedPaths'])}")
    print(f"Violations: {len(report['violations'])}")
    if report["violations"]:
        print("\nViolations:")
        for item in report["violations"]:
            print(f"  - {item['message']}")
    if report["compliant"]:
        print("\nCOMPLIANT - truth-foundation claim boundaries are aligned.")
    else:
        print("\nVIOLATION - truth-foundation overclaims need bounded evidence wording.")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate truth-foundation claim boundary language"
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
