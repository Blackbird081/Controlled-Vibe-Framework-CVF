#!/usr/bin/env python3
"""
CVF Agent Packet Authority And Encoding Gate

Blocks recurring no-commit worker packet defects early:
- reviewer packets that cite missing authority artifacts;
- newly added agent-authored non-ASCII text without a local exception note.
- pending worker returns that report required gates without executed PASS evidence;
- pending worker returns that skip Required First Reads; and
- changed Source Verification tables that place values/types in symbol cells or
  misclassify new doc-only fields.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
THIS_SCRIPT = "governance/compat/check_agent_packet_authority_and_encoding.py"
STANDARD_PATH = "docs/reference/CVF_TEXT_ENCODING_AND_SYMBOL_DISCIPLINE_STANDARD_2026-06-07.md"
CLOSURE_STANDARD_PATH = "docs/reference/CVF_WORK_ORDER_CLOSURE_QUALITY_GATE_STANDARD_2026-05-28.md"

AUTHORITY_REFERENCE_RE = re.compile(
    r"(docs/(?:baselines|roadmaps|work_orders|reviews)/[A-Za-z0-9_./ -]+?\.md)"
)
ACTIVE_REVIEW_PREFIXES = ("docs/reviews/",)
ENCODING_EXTENSIONS = {".md", ".py", ".ts", ".tsx", ".js", ".jsx", ".json"}
ENCODING_PATH_PREFIXES = (
    "docs/",
    "governance/",
    "EXTENSIONS/",
    "CVF_SESSION/",
    "scripts/",
)
ENCODING_EXACT_PATHS = {
    "AGENTS.md",
    "CLAUDE.md",
    "CVF_SESSION_MEMORY.md",
    "DESIGN.md",
}
RAW_PREIMAGE_ARCHIVE_ENCODING_EXCEPTIONS = {
    # ACRC-T2B preserves these historical instruction carriers byte-for-byte.
    # Their content predates the ASCII-default rule and cannot be normalized
    # without invalidating the pinned preimage hashes.
    "docs/reference/archive/AGENTS_FULL_PRE_T2B_2026-08-11.md",
    "docs/reference/archive/CLAUDE_FULL_PRE_T2B_2026-08-11.md",
    "docs/reference/archive/CVF_DOWNSTREAM_AGENTS_TEMPLATE_FULL_PRE_T2B_2026-08-11.md",
}
EXCEPTION_MARKERS = (
    "Text Encoding Exception",
    "Unicode exception",
    "Non-ASCII exception",
)
PROVIDER_SPECIFIC_AUTHORITY_FILES = (
    "CLAUDE.md",
    "MEMORY.md",
    ".codex/memories",
    ".claude",
)
PROVIDER_SPECIFIC_AUTHORITY_CONTEXTS = (
    "Source Authority",
    "Source Verification",
    "source evidence",
    "Primary source evidence",
    "Source File Manifest",
    "Terminal status",
    "Evidence / repair",
    "Machine-readable evidence",
)
PROVIDER_SPECIFIC_AUTHORITY_ALLOW_MARKERS = (
    "NOT_CVF_SOURCE",
    "NOT_SOURCE_AUTHORITY",
    "provider-specific",
    "not CVF source",
    "not source of truth",
)
PROVIDER_LOCAL_INTERACTION_TOKENS = (
    "AskUserQuestion",
)
WORKER_RETURN_RE = re.compile(r"(?:^|/)CVF_.+_WORKER_RETURN_\d{4}-\d{2}-\d{2}\.md$")
DISPATCH_WORK_ORDER_RE = re.compile(r"(?im)^dispatchWorkOrder:\s*`([^`]+)`\s*$")
PASS_EVIDENCE_RE = re.compile(
    r"(?:COMPLIANT[^\n]*worker-return fast gate passed|worker-return fast gate[^\n]*\bPASS(?:ED)?\b)",
    re.IGNORECASE,
)
SOURCE_VERIFICATION_HEADINGS = ("Source Verification Block", "Source Verification Table")
READ_ACTIONS = {"READ", "FULL_READ", "PARTIAL_READ", "SOURCE_VERIFIED"}


@dataclass(frozen=True)
class AddedLine:
    line_number: int
    text: str


@dataclass(frozen=True)
class ChangeLayer:
    name: str
    statuses: frozenset[str]
    rename_source: str | None = None


@dataclass(frozen=True)
class ChangeRecord:
    statuses: set[str]
    rename_source: str | None = None
    malformed: bool = False
    layers: tuple[ChangeLayer, ...] = ()


DECODE_FAILURE_MARKER = "\ufffd"
NAME_STATUS_RE = re.compile(r"^(?:[ACDMRTUXB]|[RC]\d{1,3})$")


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
    return proc.returncode, proc.stdout, proc.stderr


def _parse_name_status_z(output: str) -> dict[str, ChangeRecord]:
    """Parse `git diff --name-status -z [-M]` output losslessly.

    NUL-delimited fields survive spaces and non-ASCII path names without
    quoting ambiguity. Rename/copy records carry three fields
    (status, source, destination); every other status carries two.
    """
    if not output:
        return {}
    if not output.endswith("\0"):
        raise ValueError("malformed name-status stream: missing trailing NUL")

    changed: dict[str, ChangeRecord] = {}
    fields = output.split("\0")
    index = 0
    terminal = len(fields) - 1
    while index < terminal:
        raw_status = fields[index]
        if not raw_status:
            raise ValueError(f"malformed name-status stream: empty status at field {index}")
        status = raw_status
        score_invalid = (
            status.startswith(("R", "C"))
            and status[1:].isdigit()
            and int(status[1:]) > 100
        )
        if not NAME_STATUS_RE.fullmatch(status) or score_invalid:
            raise ValueError(f"malformed name-status stream: invalid status {status!r}")
        index += 1
        if status.startswith(("R", "C")):
            if index + 1 >= terminal:
                raise ValueError(
                    f"malformed name-status stream: truncated {status} record at field {index - 1}"
                )
            source = fields[index].replace("\\", "/")
            dest = fields[index + 1].replace("\\", "/")
            index += 2
            if not source or not dest:
                raise ValueError(
                    f"malformed name-status stream: empty path in {status} record"
                )
            existing = changed.get(dest)
            merged_statuses = ({status} | existing.statuses) if existing else {status}
            changed[dest] = ChangeRecord(statuses=merged_statuses, rename_source=source)
        else:
            if index >= terminal:
                raise ValueError(
                    f"malformed name-status stream: truncated {status} record at field {index - 1}"
                )
            dest = fields[index].replace("\\", "/")
            index += 1
            if not dest:
                raise ValueError(
                    f"malformed name-status stream: empty path in {status} record"
                )
            existing = changed.get(dest)
            if existing:
                changed[dest] = ChangeRecord(
                    statuses=existing.statuses | {status},
                    rename_source=existing.rename_source,
                    malformed=existing.malformed,
                )
            else:
                changed[dest] = ChangeRecord(statuses={status})
    return changed


def _merge_records(
    target: dict[str, ChangeRecord], source: dict[str, ChangeRecord], layer_name: str
) -> None:
    for path, record in source.items():
        layer = ChangeLayer(layer_name, frozenset(record.statuses), record.rename_source)
        existing = target.get(path)
        if existing is None:
            target[path] = ChangeRecord(
                statuses=record.statuses,
                rename_source=record.rename_source,
                malformed=record.malformed,
                layers=(layer,),
            )
            continue
        target[path] = ChangeRecord(
            statuses=existing.statuses | record.statuses,
            rename_source=existing.rename_source or record.rename_source,
            malformed=existing.malformed or record.malformed,
            layers=existing.layers + (layer,),
        )


def _get_changed(base: str | None, head: str | None) -> dict[str, ChangeRecord]:
    changed: dict[str, ChangeRecord] = {}
    if base and head:
        code, out, err = _run_git(["diff", "--name-status", "-z", "-M", f"{base}..{head}"])
        if code != 0:
            raise RuntimeError(f"git diff failed for range {base}..{head}: {err or out}")
        _merge_records(changed, _parse_name_status_z(out), "range")

    for layer_name, args in (
        ("worktree", ["diff", "--name-status", "-z", "-M"]),
        ("index", ["diff", "--name-status", "-z", "-M", "--cached"]),
    ):
        code, out, err = _run_git(args)
        if code != 0:
            raise RuntimeError(f"git {' '.join(args)} failed: {err or out}")
        if out:
            _merge_records(changed, _parse_name_status_z(out), layer_name)

    code, out, err = _run_git(["ls-files", "--others", "--exclude-standard", "-z"])
    if code != 0:
        raise RuntimeError(f"git ls-files failed: {err or out}")
    if out:
        if not out.endswith("\0"):
            raise ValueError("malformed untracked-path stream: missing trailing NUL")
        for raw in out.split("\0")[:-1]:
            path = raw.replace("\\", "/")
            if path:
                _merge_records(
                    changed,
                    {path: ChangeRecord(statuses={"A"})},
                    "untracked",
                )
    return changed


def _read_rel(path: str) -> str:
    full = REPO_ROOT / path
    if not full.exists() or full.is_dir():
        return ""
    return full.read_text(encoding="utf-8", errors="replace")


def _has_decode_failure(path: str) -> bool:
    """True only for a genuine strict-UTF-8 decode failure on disk content.

    Detecting this from the presence of the U+FFFD replacement character in
    already-lossy-decoded text would false-positive on any file that
    legitimately contains that literal glyph (for example, this checker's
    own source defining it as a string constant). Re-reading the raw bytes
    with strict decoding isolates a real decode failure from that case.
    """
    full = REPO_ROOT / path
    if not full.exists() or full.is_dir():
        return False
    try:
        raw = full.read_bytes()
    except OSError:
        return False
    try:
        raw.decode("utf-8", errors="strict")
    except UnicodeDecodeError:
        return True
    return False


def _extract_heading_section(text: str, heading_fragment: str) -> str:
    lines = text.splitlines()
    start: int | None = None
    start_level: int | None = None
    needle = heading_fragment.lower()
    for index, line in enumerate(lines):
        stripped = line.strip().lower()
        if stripped.startswith("#") and needle in stripped:
            start = index + 1
            heading_match = re.match(r"^(#{1,6})\s", line.strip())
            start_level = len(heading_match.group(1)) if heading_match else 6
            break
    if start is None:
        return ""
    end = len(lines)
    for index in range(start, len(lines)):
        heading_match = re.match(r"^(#{1,6})\s", lines[index].strip())
        if heading_match and len(heading_match.group(1)) <= (start_level or 6):
            end = index
            break
    return "\n".join(lines[start:end])


def _parse_markdown_tables(section: str) -> list[list[dict[str, str]]]:
    lines = section.splitlines()
    tables: list[list[dict[str, str]]] = []
    index = 0
    while index + 1 < len(lines):
        header_line = lines[index].strip()
        separator_line = lines[index + 1].strip()
        if not (header_line.startswith("|") and separator_line.startswith("|")):
            index += 1
            continue
        headers = [cell.strip() for cell in header_line.strip("|").split("|")]
        separators = [cell.strip() for cell in separator_line.strip("|").split("|")]
        if len(headers) != len(separators) or not all(
            re.fullmatch(r":?-{3,}:?", cell) for cell in separators
        ):
            index += 1
            continue
        rows: list[dict[str, str]] = []
        index += 2
        while index < len(lines) and lines[index].strip().startswith("|"):
            cells = [cell.strip() for cell in lines[index].strip().strip("|").split("|")]
            if len(cells) == len(headers):
                rows.append(dict(zip(headers, cells)))
            index += 1
        tables.append(rows)
    return tables


def _table_rows(text: str, heading: str) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for table in _parse_markdown_tables(_extract_heading_section(text, heading)):
        rows.extend(table)
    return rows


def _cell_path(cell: str) -> str:
    match = re.search(r"`([^`]+)`", cell)
    return (match.group(1) if match else cell).replace("\\", "/").strip()


def find_source_verification_fidelity_violations(path: str, text: str) -> list[str]:
    normalized = path.replace("\\", "/")
    if not normalized.endswith(".md") or "/archive/" in normalized:
        return []
    issues: list[str] = []
    for heading in SOURCE_VERIFICATION_HEADINGS:
        for row_number, row in enumerate(_table_rows(text, heading), start=1):
            symbol_cell = row.get("Verified path or symbol", "").strip()
            if symbol_cell:
                tokens = re.findall(r"`([^`]+)`", symbol_cell) or [symbol_cell]
                invalid = [
                    token
                    for token in tokens
                    if re.search(r"\s*=\s*|:\s*(?:false|true|string|number|boolean|null|\d+|['\"])", token, re.IGNORECASE)
                ]
                if invalid:
                    issues.append(
                        f"Source Verification row {row_number} `Verified path or symbol` contains "
                        "a value assignment or type annotation; keep only the field/path/symbol: "
                        + ", ".join(invalid)
                    )
            row_text = " ".join(row.values())
            if re.search(r"\b(?:DOC_ONLY_NEW|doc[- ]only)\b", row_text, re.IGNORECASE):
                fact_type = row.get("Source fact type", "").strip().strip("`").upper()
                if fact_type != "DOC_ONLY_NEW":
                    issues.append(
                        f"Source Verification row {row_number} describes a new doc-only field but "
                        f"Source fact type is `{fact_type or '<missing>'}` instead of `DOC_ONLY_NEW`"
                    )
    return issues


def find_pending_worker_evidence_violations(path: str, text: str) -> list[str]:
    normalized = path.replace("\\", "/")
    if not WORKER_RETURN_RE.search(normalized):
        return []
    status_match = re.search(r"(?im)^Status:\s*(.+?)\s*$", text)
    if not status_match or "COMPLETE_PENDING_REVIEW" not in status_match.group(1).upper():
        return []
    work_order_match = DISPATCH_WORK_ORDER_RE.search(text)
    if not work_order_match:
        return ["pending worker return lacks dispatchWorkOrder path"]
    work_order_path = work_order_match.group(1).replace("\\", "/")
    work_order_text = _read_rel(work_order_path)
    if not work_order_text:
        return [f"pending worker return dispatchWorkOrder cannot be read: `{work_order_path}`"]

    issues: list[str] = []
    required_checks = _extract_heading_section(work_order_text, "Required Checks")
    gate_evidence = _extract_heading_section(text, "Gate Evidence")
    if "run_worker_return_fast_gate.py" in required_checks:
        if "run_worker_return_fast_gate.py" not in gate_evidence or not PASS_EVIDENCE_RE.search(gate_evidence):
            issues.append(
                "pending worker return lacks executed PASS evidence for required "
                "`run_worker_return_fast_gate.py`; future/expected language is not gate evidence"
            )

    required_paths = {
        _cell_path(row.get("Source", ""))
        for row in _table_rows(work_order_text, "Required First Reads")
        if _cell_path(row.get("Source", "")).startswith(("docs/", "governance/", "EXTENSIONS/", "CVF_SESSION/"))
    }
    inventory_actions = {
        _cell_path(row.get("File", "")): row.get("Action", "").strip().upper()
        for row in _table_rows(text, "Source Inventory")
    }
    for required_path in sorted(required_paths):
        action = inventory_actions.get(required_path)
        if action is None:
            issues.append(f"Required First Read is absent from Source Inventory: `{required_path}`")
        elif action not in READ_ACTIONS:
            issues.append(
                f"Required First Read `{required_path}` uses non-read action `{action}`; "
                "pointer/citation evidence is not a source read"
            )
    return issues


def _is_review_packet(path: str) -> bool:
    normalized = path.replace("\\", "/")
    return normalized.endswith(".md") and any(
        normalized.startswith(prefix) for prefix in ACTIVE_REVIEW_PREFIXES
    )


def _is_encoding_scoped(path: str) -> bool:
    normalized = path.replace("\\", "/")
    if normalized in RAW_PREIMAGE_ARCHIVE_ENCODING_EXCEPTIONS:
        return False
    if normalized in ENCODING_EXACT_PATHS:
        return True
    if Path(normalized).suffix not in ENCODING_EXTENSIONS:
        return False
    return any(normalized.startswith(prefix) for prefix in ENCODING_PATH_PREFIXES)


def _path_exists(path: str) -> bool:
    return (REPO_ROOT / path).exists()


def find_authority_reference_violations(path: str, text: str) -> list[str]:
    if not _is_review_packet(path):
        return []
    missing: list[str] = []
    for match in AUTHORITY_REFERENCE_RE.finditer(text):
        referenced = match.group(1).replace("\\", "/").rstrip(".,;:)")
        if referenced and not _path_exists(referenced):
            missing.append(referenced)
    if not missing:
        return []
    return [
        "review packet cites missing authority artifact(s): "
        + ", ".join(sorted(set(missing)))
    ]


def find_provider_specific_authority_violations(path: str, text: str) -> list[str]:
    normalized = path.replace("\\", "/")
    if not normalized.endswith(".md"):
        return []
    issues: list[str] = []
    active_context = False
    for line_number, raw in enumerate(text.splitlines(), start=1):
        stripped = raw.strip()
        if stripped.startswith("#"):
            active_context = any(
                marker.lower() in stripped.lower()
                for marker in PROVIDER_SPECIFIC_AUTHORITY_CONTEXTS
            )
            continue
        line_lower = raw.lower()
        provider_interaction = next(
            (
                token
                for token in PROVIDER_LOCAL_INTERACTION_TOKENS
                if token.lower() in line_lower
            ),
            None,
        )
        if (
            provider_interaction
            and "|" in raw
            and re.search(r"\|\s*ACCEPT\s*\|", raw, re.IGNORECASE)
            and not any(
                marker.lower() in line_lower
                for marker in PROVIDER_SPECIFIC_AUTHORITY_ALLOW_MARKERS
            )
        ):
            issues.append(
                f"line {line_number}: provider-local interaction `{provider_interaction}` "
                "cannot be ACCEPT authority; cite a CVF-governed record or mark NOT_CVF_SOURCE"
            )
        has_provider_file = False
        for provider_file in PROVIDER_SPECIFIC_AUTHORITY_FILES:
            pattern = re.escape(provider_file.lower())
            if provider_file in {"CLAUDE.md", "MEMORY.md"}:
                pattern = rf"(?<![A-Za-z0-9_./-]){pattern}(?![A-Za-z0-9_./-])"
            if re.search(pattern, line_lower):
                has_provider_file = True
                break
        if not has_provider_file:
            continue
        if any(marker.lower() in line_lower for marker in PROVIDER_SPECIFIC_AUTHORITY_ALLOW_MARKERS):
            continue
        line_context = active_context or any(
            marker.lower() in line_lower
            for marker in PROVIDER_SPECIFIC_AUTHORITY_CONTEXTS
        )
        if line_context or "|" in raw:
            issues.append(
                f"line {line_number}: provider-specific agent memory/guidance "
                "file is cited as authority; use CVF-governed source or mark NOT_CVF_SOURCE"
            )
    return issues


def _has_encoding_exception(text: str) -> bool:
    return any(marker in text for marker in EXCEPTION_MARKERS)


def find_non_ascii_line_violations(
    path: str,
    added_lines: list[AddedLine],
    *,
    has_exception: bool,
) -> list[str]:
    if not _is_encoding_scoped(path) or has_exception:
        return []
    issues: list[str] = []
    for line in added_lines:
        if any(ord(char) > 127 for char in line.text):
            issues.append(
                f"line {line.line_number}: newly added non-ASCII text without "
                "Text Encoding Exception"
            )
    return issues


def _all_file_lines(path: str) -> list[AddedLine]:
    text = _read_rel(path)
    return [AddedLine(index, line) for index, line in enumerate(text.splitlines(), start=1)]


def _diff_is_binary(diff_text: str) -> bool:
    return bool(re.search(r"(?m)^Binary files .+ differ$", diff_text))


def _parse_added_lines_from_diff(diff_text: str) -> list[AddedLine]:
    added: list[AddedLine] = []
    next_line: int | None = None
    for raw in diff_text.splitlines():
        if raw.startswith("@@"):
            match = re.search(r"\+(\d+)(?:,(\d+))?", raw)
            next_line = int(match.group(1)) if match else None
            continue
        if next_line is None:
            continue
        if raw.startswith("+++") or raw.startswith("---"):
            continue
        if raw.startswith("+"):
            added.append(AddedLine(next_line, raw[1:]))
            next_line += 1
        elif raw.startswith("-"):
            continue
        else:
            next_line += 1
    return added


def _added_lines_from_git_diff(args: list[str], context: str) -> ProvenanceResult:
    """Return added-line provenance and fail closed when Git cannot provide it."""
    code, out, err = _run_git(args)
    if code != 0:
        detail = (err or out).strip() or "no diagnostic from Git"
        return ProvenanceResult(
            added_lines=[], diagnostic=f"Git diff failed for {context}: {detail}"
        )
    if not out:
        return ProvenanceResult(added_lines=[])
    if _diff_is_binary(out):
        return ProvenanceResult(added_lines=[], is_binary=True)
    return ProvenanceResult(added_lines=_parse_added_lines_from_diff(out))


@dataclass(frozen=True)
class ProvenanceResult:
    added_lines: list[AddedLine]
    is_binary: bool = False
    diagnostic: str | None = None


def _blob_readable(spec: str) -> bool:
    code, _, _ = _run_git(["cat-file", "-e", spec])
    return code == 0


def _rename_aware_added_lines(
    path: str, record: ChangeRecord, base: str | None, head: str | None
) -> ProvenanceResult:
    """Resolve added lines for a renamed/copied destination using paired provenance.

    Diffing is done blob-to-blob (`<rev>:<source>` against `<rev>:<dest>`)
    rather than through a destination-only or pathspec-restricted tree diff.
    A pathspec limited to the destination alone cannot be paired with its
    source at all, and even a pathspec naming both paths can make Git
    recompute a lower similarity than the original whole-tree rename
    detection and silently fall back to reporting every destination line as
    newly added; comparing the two known blobs directly sidesteps both
    failure modes and always reports only the true content delta.
    """
    layers = record.layers or (
        ChangeLayer(
            "range" if base and head else "index",
            frozenset(record.statuses),
            record.rename_source,
        ),
    )
    lines: list[AddedLine] = []
    diagnostics: list[str] = []
    saw_binary = False
    for layer in layers:
        rename_status = next(
            (status for status in layer.statuses if status.startswith(("R", "C"))), None
        )
        if not rename_status:
            continue
        source = layer.rename_source
        if not source:
            diagnostics.append("rename record missing source path")
            continue
        if layer.name == "range":
            if not (base and head):
                diagnostics.append("range rename missing base/head provenance")
                continue
            source_spec, dest_spec = f"{base}:{source}", f"{head}:{path}"
        elif layer.name == "index":
            source_spec, dest_spec = f"{head or 'HEAD'}:{source}", f":{path}"
        else:
            # Git normally represents a filesystem-only move as delete plus
            # untracked add. If it reports a worktree rename, retain both
            # paths in the diff so rename detection has the paired source.
            result = _added_lines_from_git_diff(
                ["diff", "--unified=0", "--no-ext-diff", "-M", "--", source, path],
                f"worktree rename `{source}` -> `{path}`",
            )
            lines.extend(result.added_lines)
            saw_binary = saw_binary or result.is_binary
            if result.diagnostic:
                diagnostics.append(result.diagnostic)
            continue
        if not _blob_readable(source_spec):
            diagnostics.append(
                f"rename source blob unreadable for provenance: `{source}`"
            )
            continue
        if not _blob_readable(dest_spec):
            diagnostics.append(
                f"rename destination blob unreadable for provenance: `{path}`"
            )
            continue
        result = _added_lines_from_git_diff(
            ["diff", "--unified=0", "--no-ext-diff", source_spec, dest_spec],
            f"rename `{source}` -> `{path}`",
        )
        lines.extend(result.added_lines)
        saw_binary = saw_binary or result.is_binary
        if result.diagnostic:
            diagnostics.append(result.diagnostic)
    unique = list(dict.fromkeys((line.line_number, line.text) for line in lines))
    return ProvenanceResult(
        added_lines=[AddedLine(number, text) for number, text in unique],
        is_binary=saw_binary and not lines,
        diagnostic="; ".join(diagnostics) or None,
    )


def _added_lines(
    path: str, record: ChangeRecord, base: str | None, head: str | None
) -> ProvenanceResult:
    statuses = record.statuses
    if statuses == {"D"}:
        return ProvenanceResult(added_lines=[])

    if record.malformed:
        return ProvenanceResult(
            added_lines=[], diagnostic=f"malformed name-status record for `{path}`"
        )

    layers = record.layers or (
        ChangeLayer(
            "range" if base and head else "untracked",
            frozenset(statuses),
            record.rename_source,
        ),
    )
    rename_result = _rename_aware_added_lines(path, record, base, head)
    lines = list(rename_result.added_lines)
    diagnostics = [rename_result.diagnostic] if rename_result.diagnostic else []
    saw_binary = rename_result.is_binary

    for layer in layers:
        ordinary = {
            status
            for status in layer.statuses
            if not status.startswith(("R", "C", "D"))
        }
        if not ordinary:
            continue
        if layer.name == "untracked":
            lines.extend(_all_file_lines(path))
            continue
        if layer.name == "range":
            args = [
                "diff",
                "--unified=0",
                "--no-ext-diff",
                f"{base}..{head}",
                "--",
                path,
            ]
        elif layer.name == "index":
            args = ["diff", "--cached", "--unified=0", "--no-ext-diff", "--", path]
        else:
            args = ["diff", "--unified=0", "--no-ext-diff", "--", path]
        result = _added_lines_from_git_diff(args, f"{layer.name} path `{path}`")
        lines.extend(result.added_lines)
        saw_binary = saw_binary or result.is_binary
        if result.diagnostic:
            diagnostics.append(result.diagnostic)

    unique = list(dict.fromkeys((line.line_number, line.text) for line in lines))
    return ProvenanceResult(
        added_lines=[AddedLine(number, text) for number, text in unique],
        is_binary=saw_binary and not lines,
        diagnostic="; ".join(diagnostics) or None,
    )


def _decode_failure_diagnostic(path: str, text: str) -> str | None:
    if DECODE_FAILURE_MARKER in text:
        return f"decode failure reading `{path}`: replacement character present in read text"
    return None


def _run_check(base: str | None, head: str | None) -> dict[str, Any]:
    try:
        changed = _get_changed(base, head)
    except ValueError as exc:
        return {
            "policy": STANDARD_PATH,
            "additionalPolicies": [CLOSURE_STANDARD_PATH],
            "script": THIS_SCRIPT,
            "changedFileCount": 0,
            "violationCount": 1,
            "violations": [
                {"path": "<git-name-status>", "issues": [str(exc)]}
            ],
            "compliant": False,
        }
    violations: list[dict[str, Any]] = []

    for path, record in sorted(changed.items()):
        path_issues: list[str] = []
        if record.malformed:
            path_issues.append(f"malformed name-status record for `{path}`")
            violations.append({"path": path, "issues": path_issues})
            continue

        provenance = _added_lines(path, record, base, head)
        if provenance.is_binary:
            # explicit binary classification: never a text encoding violation
            if path_issues:
                violations.append({"path": path, "issues": path_issues})
            continue
        if provenance.diagnostic:
            path_issues.append(provenance.diagnostic)

        text = _read_rel(path)
        if text:
            decode_issue = (
                _decode_failure_diagnostic(path, text)
                if _is_encoding_scoped(path) and _has_decode_failure(path)
                else None
            )
            if decode_issue:
                path_issues.append(decode_issue)
            path_issues.extend(find_authority_reference_violations(path, text))
            path_issues.extend(find_provider_specific_authority_violations(path, text))
            path_issues.extend(find_source_verification_fidelity_violations(path, text))
            path_issues.extend(find_pending_worker_evidence_violations(path, text))
            path_issues.extend(
                find_non_ascii_line_violations(
                    path,
                    provenance.added_lines,
                    has_exception=_has_encoding_exception(text),
                )
            )
        if path_issues:
            violations.append({"path": path, "issues": path_issues})

    return {
        "policy": STANDARD_PATH,
        "additionalPolicies": [CLOSURE_STANDARD_PATH],
        "script": THIS_SCRIPT,
        "changedFileCount": len(changed),
        "violationCount": len(violations),
        "violations": violations,
        "compliant": not violations,
    }


def _print_report(report: dict[str, Any], base: str | None, head: str | None) -> None:
    print("=== CVF Agent Packet Authority And Encoding Gate ===")
    if base or head:
        print(f"Range: {base or '<worktree>'}..{head or '<worktree>'}")
    print(f"Policy: {report['policy']}")
    print(f"Changed files: {report['changedFileCount']}")
    print(f"Violations: {report['violationCount']}")
    if report["violations"]:
        print("\nViolations:")
        for violation in report["violations"]:
            print(f"  - {violation['path']}")
            for issue in violation["issues"]:
                print(f"    - {issue}")
    if report["compliant"]:
        print("\nCOMPLIANT - packet authority, encoding, source fidelity, and pending-return evidence pass.")
    else:
        print("\nVIOLATION - repair packet authority, encoding, source fidelity, or pending-return evidence.")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="Run CVF agent packet authority and encoding gate")
    parser.add_argument("--base", default=None)
    parser.add_argument("--head", default=None)
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args()

    try:
        report = _run_check(args.base, args.head)
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 2

    if args.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        _print_report(report, args.base, args.head)
    return 1 if args.enforce and not report["compliant"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
