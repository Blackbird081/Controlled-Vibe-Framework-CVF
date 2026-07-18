#!/usr/bin/env python3
"""
Source-verification and token-collision helpers for the work-order dispatch gate.

Extracted by GFS-PY T3 from check_work_order_dispatch_quality.py. The functions
here preserve the original validator messages and parsing behavior.
"""

from __future__ import annotations

import re
import subprocess
from pathlib import Path

from check_work_order_dispatch_quality_tables import (
    _extract_section,
    _normalize_table_key,
    _parse_any_markdown_tables,
    _parse_markdown_tables,
)


REPO_ROOT = Path(__file__).resolve().parents[2]

REQUIRED_SOURCE_COLUMNS = (
    "Claimed item",
    "Source file",
    "Verified line/section",
    "Verified path or symbol",
    "Owning interface/function/schema",
    "Disposition",
)
ALLOWED_SOURCE_VERIFICATION_DISPOSITIONS = {
    "ACCEPT",
    "REJECT",
    "BLOCKED_SOURCE_NOT_FOUND",
}
DEFERRED_SOURCE_VERIFICATION_RE = re.compile(
    r"\b("
    r"ACCEPT_PENDING_WORKER|PENDING_WORKER|UNVERIFIED|TBD|TODO|"
    r"confirm later|confirm field name|verify during implementation|"
    r"worker to verify|to be confirmed|inferred|stale-memory|placeholder|assume"
    r")\b",
    re.IGNORECASE,
)
NEGATIVE_SEARCH_COLLISION_MARKER = "Negative Search And Collision Discipline"
NEGATIVE_SEARCH_CLAIM_RE = re.compile(
    r"\bNOT\s+FOUND\b|\bBLOCKED_SOURCE_NOT_FOUND\b",
    re.IGNORECASE,
)
NEGATIVE_SEARCH_TOKEN_STOPWORDS = {
    "ACCEPT",
    "BLOCKED_SOURCE_NOT_FOUND",
    "CLOSED_PASS",
    "CLOSED_PASS_BOUNDED",
    "DISPATCHED",
    "DISPATCH_READY",
    "DOCS",
    "DOCUMENTATION",
    "EXTENSIONS",
    "EXTERNAL",
    "FOUND",
    "GOVERNANCE",
    "HOLD",
    "JSON",
    "NOT",
    "READY",
    "REJECT",
    "SOURCE",
    "SOURCES",
    "TEST",
    "TESTS",
}
VERIFIED_LINE_RE = re.compile(r"\bline\s+(\d+)\b", re.IGNORECASE)
PATH_RE = re.compile(
    r"`((?:docs|governance|EXTENSIONS|CVF_SESSION|scripts|sdk|\.github|\.private_reference)/[^`|)]+)`"
    r"|((?:docs|governance|EXTENSIONS|CVF_SESSION|scripts|sdk|\.github|\.private_reference)/[^`\s|)]+)"
)
ROOT_GOVERNANCE_PATH_RE = re.compile(
    r"`((?:AGENTS\.md|CLAUDE\.md|README\.md|\.gitignore|CVF_SESSION_MEMORY\.md|AGENT_HANDOFF[^`|)]+\.md))`"
    r"|(?<![A-Za-z0-9_./])((?:AGENTS\.md|CLAUDE\.md|README\.md|\.gitignore|CVF_SESSION_MEMORY\.md|AGENT_HANDOFF[A-Za-z0-9_.-]*\.md))(?![A-Za-z0-9_./])"
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


def _extract_paths(text: str) -> list[str]:
    paths = []
    for path_pattern in (PATH_RE, ROOT_GOVERNANCE_PATH_RE):
        for match in path_pattern.finditer(text):
            path = (match.group(1) or match.group(2)).replace("\\", "/").rstrip(".,;:")
            if "*" in path or "<" in path or ">" in path:
                continue
            paths.append(path)
    return paths


def _read_rel(path: str) -> str:
    full = REPO_ROOT / path
    if not full.exists() or full.is_dir():
        return ""
    return full.read_text(encoding="utf-8")


def _exists_rel(path: str) -> bool:
    normalized = path.strip().strip("`").replace("\\", "/").rstrip(".,;:")
    return bool(normalized) and (REPO_ROOT / normalized).exists()


def _source_table_has_required_columns(text: str) -> bool:
    tables = _parse_markdown_tables(text)
    if not tables:
        return False
    return all(column in tables[0] for column in REQUIRED_SOURCE_COLUMNS)


def _validate_source_verification_table_shape(text: str) -> list[str]:
    sections = [
        section
        for heading in ("Source Verification Block", "Source Verification Table")
        if (section := _extract_section(text, heading))
    ]
    issues: list[str] = []
    source_like_headers = {
        "claimeditem",
        "sourcefile",
        "verifiedlinesection",
        "verifiedpathorsymbol",
        "owninginterfacefunctionschema",
        "disposition",
        "symbolpath",
        "symbol",
        "path",
        "file",
        "verifiedline",
        "verifiedsection",
        "owner",
        "schema",
    }
    required_display = " | ".join(REQUIRED_SOURCE_COLUMNS)
    for section in sections:
        for table in _parse_any_markdown_tables(section):
            headers = set(table[0].keys()) if table else set()
            normalized_headers = {_normalize_table_key(header) for header in headers}
            if all(column in headers for column in REQUIRED_SOURCE_COLUMNS):
                continue
            if source_like_headers.intersection(normalized_headers):
                issues.append(
                    "Source Verification table uses noncanonical columns; "
                    f"required columns are: {required_display}"
                )
    return sorted(set(issues))


def _extract_declared_string_values(source_text: str, symbol: str) -> set[str]:
    symbol_name = re.sub(r"[^A-Za-z0-9_].*$", "", symbol.strip().strip("`"))
    if not symbol_name:
        return set()
    type_match = re.search(
        rf"(?:export\s+)?type\s+{re.escape(symbol_name)}\s*=\s*([\s\S]*?);",
        source_text,
    )
    if not type_match:
        return set()
    return set(re.findall(r"['\"]([^'\"]+)['\"]", type_match.group(1)))


def _row_literal_tokens(row: dict[str, str]) -> set[str]:
    joined = " | ".join(row.values())
    tokens = set(re.findall(r"`([^`]+)`", joined))
    tokens.update(re.findall(r"['\"]([^'\"]+)['\"]", joined))
    return {token for token in tokens if re.match(r"^[A-Za-z0-9_.:-]+$", token)}


def _symbol_field_name(symbol: str) -> str:
    cleaned = symbol.strip().strip("`")
    if _verified_symbol_contains_assignment(cleaned):
        return ""
    parts = re.findall(r"[A-Za-z_][A-Za-z0-9_]*", cleaned)
    return parts[-1] if parts else ""


def _verified_symbol_contains_assignment(symbol: str) -> bool:
    cleaned = symbol.strip().strip("`")
    return re.search(
        r"\b[A-Za-z_][A-Za-z0-9_.]*\s*(?:=|:)\s*\S+",
        cleaned,
        re.IGNORECASE,
    ) is not None


def _claims_false_invariant(*cells: str) -> bool:
    joined = " ".join(cells)
    return re.search(r"[A-Za-z0-9_.]+\s*(?:=|:)\s*false\b", joined) is not None


def _source_has_literal_false(source_text: str, field_name: str) -> bool:
    if not field_name:
        return False
    return re.search(rf"\b{re.escape(field_name)}\s*:\s*false\b", source_text) is not None or re.search(
        rf"\b{re.escape(field_name)}\s*=\s*false\b",
        source_text,
    ) is not None


def _is_code_source(path: str) -> bool:
    return Path(path).suffix.lower() in {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py"}


def _symbol_identifier_parts(symbol: str) -> list[str]:
    cleaned = symbol.strip().strip("`")
    if not cleaned or _verified_symbol_contains_assignment(cleaned):
        return []
    if re.search(r"[^A-Za-z0-9_.]", cleaned):
        return []
    return [part for part in cleaned.split(".") if re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", part)]


def _extract_ts_decl_block(source_text: str, owner: str) -> str | None:
    match = re.search(
        rf"(?m)^\s*(?:export\s+)?(?:interface|class|type)\s+{re.escape(owner)}\b[^\n]*",
        source_text,
    )
    if not match:
        return None
    start = match.start()
    brace_start = source_text.find("{", match.end())
    if brace_start == -1:
        next_decl = re.search(
            r"(?m)^\s*(?:export\s+)?(?:interface|class|type|function|const)\s+",
            source_text[match.end():],
        )
        end = match.end() + next_decl.start() if next_decl else len(source_text)
        return source_text[start:end]
    depth = 0
    for index in range(brace_start, len(source_text)):
        char = source_text[index]
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return source_text[start:index + 1]
    return source_text[start:]


def _source_has_verified_symbol(source_text: str, symbol: str) -> bool:
    parts = _symbol_identifier_parts(symbol)
    if not parts:
        return True
    if len(parts) >= 2:
        owner, leaf = parts[-2], parts[-1]
        owner_block = _extract_ts_decl_block(source_text, owner)
        if owner_block is not None:
            return re.search(rf"\b{re.escape(leaf)}\b", owner_block) is not None
        return False
    return re.search(rf"\b{re.escape(parts[0])}\b", source_text) is not None


def _extract_verified_line_number(value: str) -> int | None:
    match = VERIFIED_LINE_RE.search(value)
    if not match:
        return None
    try:
        return int(match.group(1))
    except ValueError:
        return None


def _symbol_definition_line(source_path: str, source_text: str, symbol: str) -> int | None:
    parts = _symbol_identifier_parts(symbol)
    if not parts:
        return None
    name = parts[-1]
    suffix = Path(source_path).suffix.lower()
    if suffix == ".py":
        pattern = re.compile(
            rf"^\s*(?:async\s+def|def|class)\s+{re.escape(name)}\b",
            re.MULTILINE,
        )
    elif suffix in {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"}:
        pattern = re.compile(
            rf"^\s*(?:export\s+)?(?:default\s+)?(?:(?:async\s+)?function|class|interface|type|const|let|var)\s+{re.escape(name)}\b",
            re.MULTILINE,
        )
    else:
        return None
    match = pattern.search(source_text)
    if not match:
        return None
    return source_text.count("\n", 0, match.start()) + 1


def _validate_verified_line_anchor(source_path: str, source_text: str, row: dict[str, str]) -> str | None:
    cited_line = _extract_verified_line_number(row.get("Verified line/section", ""))
    if cited_line is None:
        return None
    symbol = row.get("Verified path or symbol", "").strip().strip("`")
    definition_line = _symbol_definition_line(source_path, source_text, symbol)
    if definition_line is None or cited_line == definition_line:
        return None
    return (
        "Source Verification ACCEPT row cites "
        f"`{symbol}` at line {cited_line}, but `{source_path}` defines it at line {definition_line}; "
        "cite the symbol definition line, not a continuation or interior signature line"
    )


def _validate_false_invariant_against_source(
    source_path: str,
    source_text: str,
    row: dict[str, str],
) -> str | None:
    claimed = row.get("Claimed item", "")
    verified_symbol = row.get("Verified path or symbol", "")
    owner = row.get("Owning interface/function/schema", "")
    if not _claims_false_invariant(claimed, verified_symbol, owner):
        return None
    field_name = _symbol_field_name(verified_symbol or claimed)
    if _source_has_literal_false(source_text, field_name):
        return None
    return (
        "Source Verification ACCEPT row claims a false invariant for "
        f"`{field_name or verified_symbol.strip().strip('`')}` but `{source_path}` "
        "does not declare or assign that field as literal false"
    )


def _source_rows_for_symbol(rows: list[dict[str, str]]) -> list[tuple[str, str, str, str]]:
    refs: list[tuple[str, str, str, str]] = []
    for row in rows:
        if "ACCEPT" not in row.get("Disposition", "").upper():
            continue
        source_paths = _extract_paths(row.get("Source file", ""))
        if not source_paths:
            continue
        symbol = row.get("Verified path or symbol", "")
        if _verified_symbol_contains_assignment(symbol):
            continue
        owner = row.get("Owning interface/function/schema", "")
        field_name = _symbol_field_name(symbol or row.get("Claimed item", ""))
        if not field_name:
            continue
        for source_path in source_paths:
            refs.append((field_name, symbol, owner, source_path))
    return refs


def _non_table_blocks(text: str) -> list[str]:
    blocks: list[str] = []
    current: list[str] = []
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("|") and stripped.endswith("|"):
            if current:
                blocks.append(" ".join(current))
                current = []
            continue
        if re.match(r"^(?:[-*]\s+|\d+\.\s+)", stripped) and current:
            blocks.append(" ".join(current))
            current = []
        if not stripped:
            if current:
                blocks.append(" ".join(current))
                current = []
            continue
        current.append(stripped)
    if current:
        blocks.append(" ".join(current))
    return blocks


def _validate_false_invariant_prose(text: str, rows: list[dict[str, str]]) -> list[str]:
    issues: list[str] = []
    blocks = _non_table_blocks(text)
    for field_name, symbol, owner, source_path in _source_rows_for_symbol(rows):
        source_text = _read_rel(source_path)
        if not source_text or _source_has_literal_false(source_text, field_name):
            continue
        owner_tokens = {token for token in (owner.strip("`"),) if token}
        symbol_parts = symbol.replace("`", "").split(".")
        if len(symbol_parts) > 1:
            owner_tokens.add(".".join(symbol_parts[:-1]))
            owner_tokens.update(part for part in symbol_parts[:-1] if part)
        owner_tokens.update(token for token in owner.replace("`", "").split(".") if token)
        for block in blocks:
            if not re.search(rf"`?{re.escape(field_name)}`?\s*(?:=|:)\s*false\b", block):
                continue
            if not any(token and token in block for token in owner_tokens):
                continue
            if re.search(
                r"connector-normalized|normalizes|normalise|advisory\s+packet\s+requires|connector\s+requires",
                block,
                re.IGNORECASE,
            ):
                continue
            issues.append(
                "Prose claims a false invariant for "
                f"`{field_name}` from `{owner.strip('`') or symbol.strip('`')}` but `{source_path}` "
                "does not declare or assign that field as literal false"
            )
            break
    return issues


def _validate_known_false_invariant_claims(text: str) -> list[str]:
    issues: list[str] = []
    for block in _non_table_blocks(text):
        if not re.search(r"\bMemoryGatewayDecision\b", block):
            continue
        if not re.search(r"\bcanReinject`?\s*(?:=|:)\s*false\b", block):
            continue
        if re.search(
            r"connector-normalized|not\s+source[- ](?:proof|verified)|not\s+source-claimed|boolean\s+field",
            block,
            re.IGNORECASE,
        ):
            continue
        issues.append(
            "Prose claims `MemoryGatewayDecision.canReinject=false`; the known source contract "
            "declares `canReinject` as a boolean unless a cited source proves a literal false assignment"
        )
        break
    return issues


def _row_has_blocking_disposition(row: dict[str, str]) -> bool:
    disposition = row.get("Disposition", "").upper()
    return "BLOCKED_SOURCE_NOT_FOUND" in disposition or disposition == "BLOCKED"


def _validate_ready_source_blockers(text: str) -> list[str]:
    rows = _parse_markdown_tables(text)
    blocked = [row for row in rows if _row_has_blocking_disposition(row)]
    if not blocked:
        return []
    return [
        "dispatch/ready work order contains blocking Source Verification disposition; "
        "use HOLD/DRAFT until source facts are resolved"
    ]


def _validate_source_verification_disposition_discipline(text: str) -> list[str]:
    issues: list[str] = []
    for row in _parse_markdown_tables(text):
        raw_disposition = row.get("Disposition", "").strip().strip("`")
        disposition = raw_disposition.upper()
        if disposition and disposition not in ALLOWED_SOURCE_VERIFICATION_DISPOSITIONS:
            issues.append(
                "Source Verification disposition must be one of ACCEPT, REJECT, "
                f"or BLOCKED_SOURCE_NOT_FOUND; found `{raw_disposition}`"
            )
        joined = " ".join(row.values())
        if DEFERRED_SOURCE_VERIFICATION_RE.search(joined):
            issues.append(
                "Source Verification row defers source facts to worker/future verification; "
                "resolve before dispatch or set BLOCKED_SOURCE_NOT_FOUND"
            )
    return sorted(set(issues))


def _negative_search_evidence_section(text: str) -> str:
    for heading_fragment in (
        NEGATIVE_SEARCH_COLLISION_MARKER,
        "Negative Search Evidence",
        "Negative Search",
    ):
        section = _extract_section(text, heading_fragment)
        if section:
            return section
    return ""


def _extract_negative_search_tokens(text: str) -> set[str]:
    tokens: set[str] = set()
    for match in NEGATIVE_SEARCH_CLAIM_RE.finditer(text):
        window = text[max(0, match.start() - 220) : min(len(text), match.end() + 220)]
        tokens.update(re.findall(r"`([A-Za-z_][A-Za-z0-9_.:-]{2,})`", window))
        tokens.update(re.findall(r"\b[A-Za-z_][A-Za-z0-9_]*[A-Z][A-Za-z0-9_]*\b", window))
        tokens.update(re.findall(r"\b[A-Z][A-Z0-9_]{3,}\b", window))
    cleaned: set[str] = set()
    for token in tokens:
        stripped = token.strip().strip("`")
        if stripped.upper() in NEGATIVE_SEARCH_TOKEN_STOPWORDS:
            continue
        if "/" in stripped or "\\" in stripped:
            continue
        if re.match(r"^[0-9a-f]{6,40}$", stripped, re.IGNORECASE):
            continue
        cleaned.add(stripped)
    return cleaned


def _token_occurs_elsewhere(token: str, current_path: str) -> bool:
    code, out, _ = _run_git(["grep", "-Il", "--", token])
    if code == 0 and out:
        return any(line.strip().replace("\\", "/") != current_path for line in out.splitlines())
    if code in {1, 0}:
        return False

    skip_dirs = {".git", ".hg", ".svn", "node_modules", ".next", "__pycache__", ".venv", "venv"}
    for path in REPO_ROOT.rglob("*"):
        if not path.is_file():
            continue
        rel = path.relative_to(REPO_ROOT).as_posix()
        if rel == current_path:
            continue
        if any(part in skip_dirs for part in path.parts):
            continue
        try:
            if token in path.read_text(encoding="utf-8", errors="ignore"):
                return True
        except OSError:
            continue
    return False


def _collision_disposition_records_token(section: str, token: str) -> bool:
    for line in section.splitlines():
        if token not in line:
            continue
        if not re.search(
            r"collision|same-token|non-authoritative|different meaning|occurrence",
            line,
            re.IGNORECASE,
        ):
            continue
        if re.search(r"\b(?:none|no|zero|0)\b", line, re.IGNORECASE):
            return False
        return True
    return False


def _validate_negative_search_collision_discipline(
    path: str,
    text: str,
    artifact_label: str,
) -> list[str]:
    if not NEGATIVE_SEARCH_CLAIM_RE.search(text):
        return []

    issues: list[str] = []
    section = _negative_search_evidence_section(text)
    if not section:
        return [
            f"{artifact_label} contains `NOT FOUND` or `BLOCKED_SOURCE_NOT_FOUND` "
            f"but lacks `## {NEGATIVE_SEARCH_COLLISION_MARKER}` evidence"
        ]

    required_patterns = {
        "exact search roots": r"search roots?|roots?",
        "exact search command or query": r"search command|structured query|query",
        "coverage across source/tests/docs/JSON/external evidence": r"coverage|source|tests|docs|json|external",
        "same-token collision result": r"collision|same-token|non-authoritative|different meaning|occurrence",
        "absent-versus-collision disposition": r"disposition|absent|not binding|binding",
    }
    for label, pattern in required_patterns.items():
        if not re.search(pattern, section, re.IGNORECASE):
            issues.append(
                f"{artifact_label} negative-search evidence is missing {label}"
            )

    for token in sorted(_extract_negative_search_tokens(text)):
        if not _token_occurs_elsewhere(token, path):
            continue
        if _collision_disposition_records_token(section, token):
            continue
        issues.append(
            f"{artifact_label} claims `{token}` as not found while the same token "
            "appears elsewhere in the repo; record the collision/non-authoritative "
            "occurrence instead of a bare `NOT FOUND` claim"
        )
    return sorted(set(issues))


def _validate_accepted_source_rows(path: str, text: str) -> list[str]:
    issues: list[str] = []
    rows = _parse_markdown_tables(text)
    for row in rows:
        disposition = row.get("Disposition", "").upper()
        if "ACCEPT" not in disposition:
            continue
        verified_symbol = row.get("Verified path or symbol", "")
        if _verified_symbol_contains_assignment(verified_symbol):
            issues.append(
                "Source Verification `Verified path or symbol` must contain only a field/path/symbol, "
                "not a value assignment or type annotation"
            )
            continue
        source_cell = row.get("Source file", "")
        source_paths = _extract_paths(source_cell)
        if not source_paths:
            joined = " ".join(row.values()).lower()
            if "doc-only" in joined or "(new)" in joined:
                issues.append(
                    "New doc-only fields must be listed in a separate New Doc-Only Fields table, "
                    "not as Source Verification ACCEPT rows"
                )
                continue
            if "canonical" not in source_cell.lower() and "n/a" not in source_cell.lower():
                issues.append("Source Verification ACCEPT row lacks a concrete source file or canonical-contract marker")
            continue
        for source_path in source_paths:
            if not _exists_rel(source_path):
                issues.append(f"Source Verification ACCEPT cites missing source file `{source_path}`")
                continue
            claimed = row.get("Claimed item", "")
            source_text = _read_rel(source_path)
            if _is_code_source(source_path) and not _source_has_verified_symbol(source_text, verified_symbol):
                issues.append(
                    "Source Verification ACCEPT row cites symbol "
                    f"`{verified_symbol.strip().strip('`')}` but `{source_path}` does not contain that symbol "
                    "under the verified owner/path"
                )
            line_issue = _validate_verified_line_anchor(source_path, source_text, row)
            if line_issue:
                issues.append(line_issue)
            false_issue = _validate_false_invariant_against_source(source_path, source_text, row)
            if false_issue:
                issues.append(false_issue)
            joined = " ".join(row.values()).lower()
            if (
                source_path.startswith("docs/roadmaps/")
                and ("doc-only field" in joined or "advisorytype" in joined or "boundarymarker" in joined)
            ):
                issues.append(
                    "Source Verification ACCEPT for connector doc-only field cites a roadmap; "
                    "cite the connector spec after it exists or move the field to New Doc-Only Fields"
                )
            if re.search(r"\b(?:pending|planned|future)\b", row.get("Verified line/section", ""), re.IGNORECASE):
                issues.append(
                    "Source Verification ACCEPT uses pending/planned/future line or section language; "
                    "use BLOCKED_SOURCE_NOT_FOUND until the source exists"
                )
            if "values" not in f"{claimed} {verified_symbol}".lower():
                continue
            declared_values = _extract_declared_string_values(source_text, verified_symbol)
            if not declared_values:
                continue
            row_tokens = _row_literal_tokens(row)
            missing_values = sorted(value for value in declared_values if value not in row_tokens)
            if missing_values:
                issues.append(
                    "Source Verification ACCEPT row claims values for "
                    f"`{verified_symbol.strip().strip('`')}` but omits source value(s): {', '.join(missing_values)}"
                )
    issues.extend(_validate_false_invariant_prose(text, rows))
    issues.extend(_validate_known_false_invariant_claims(text))
    return issues
