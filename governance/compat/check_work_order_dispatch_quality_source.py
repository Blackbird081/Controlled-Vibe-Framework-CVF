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
    r"`((?:docs|governance|EXTENSIONS|CVF_SESSION|scripts|sdk|\.github|\.private_reference)/[^`|\r\n]+)`"
    r"|((?:docs|governance|EXTENSIONS|CVF_SESSION|scripts|sdk|\.github|\.private_reference)/[^`\s|]+)"
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
            depth = 0
            balanced = True
            for char in path:
                if char == "(":
                    depth += 1
                elif char == ")":
                    depth -= 1
                    if depth < 0:
                        balanced = False
                        break
            if not balanced or depth != 0:
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


# --- DARA-T2 Architecture Readiness Admission (cvf.dara.architectureBindingMatrix.v1) ---
# Constants and schema-level helpers extracted to check_work_order_dispatch_quality_architecture_schema.py
# at DARA-T2-R1. All names re-exported here for backward compatibility with callers.

from check_work_order_dispatch_quality_architecture_schema import (
    ARCHITECTURE_AUTHORITY_REJECT_PATH_RE, ARCHITECTURE_BINDING_MATRIX_HEADING,
    ARCHITECTURE_ECHO_DISPOSITION_VALUES, ARCHITECTURE_ECHO_FIELDS,
    ARCHITECTURE_IMPLEMENTATION_DISPOSITIONS, ARCHITECTURE_MACHINE_PASS,
    ARCHITECTURE_MATRIX_DERIVED_COLUMNS, ARCHITECTURE_MATRIX_DIGEST_PREIMAGE_COLUMNS,
    ARCHITECTURE_MATRIX_ROW_COLUMNS, ARCHITECTURE_MATRIX_SCALAR_FIELDS,
    ARCHITECTURE_MATRIX_SCHEMA, ARCHITECTURE_NONE_CONTRACT_ONLY_PREFIX,
    ARCHITECTURE_NONE_WITH_REASON_PREFIX, ARCHITECTURE_PLACEHOLDER_RE,
    ARCHITECTURE_READINESS_ALLOWED_DECLARATIONS, ARCHITECTURE_READINESS_BLOCKED_UNCLASSIFIED,
    ARCHITECTURE_READINESS_LOW_RISK_PREFIX, ARCHITECTURE_READINESS_MARKER,
    ARCHITECTURE_READINESS_NOT_APPLICABLE_TOKENS, ARCHITECTURE_READINESS_REQUIRED,
    ARCHITECTURE_RISK_CLASSES, ARCHITECTURE_SEMANTIC_ACCEPTANCE_VALUES,
    _architecture_matrix_canonical_digest, _architecture_matrix_rows,
    _architecture_readiness_declaration, _extract_scalar_field,
    _is_contract_only_none, _is_none_with_reason,
)


def _validate_architecture_matrix_row_identity(
    row: dict[str, str],
    writable_manifest: set[str] | None = None,
) -> list[str]:
    """Resolve path/symbol pairs named by one matrix row against the
    committed workspace, reusing the exact source-verification primitives
    (`_exists_rel`, `_source_has_verified_symbol`) already owned by this
    module. Returns issue strings; an empty list means this row's identity
    resolves (machine coverage only, never a semantic-correctness claim)."""
    issues: list[str] = []
    criterion_id = row.get("criterionId", "").strip()
    label = criterion_id or "<missing criterionId>"

    # These path fields are legitimately empty when their paired symbol
    # field carries a NONE_WITH_REASON exemption (validated separately
    # below); the generic required-field loop must not double-flag them.
    optional_path_fields_with_none_pair = {
        "registrationPath": "registrationSymbol",
        "runtimeConsumerPath": "runtimeConsumerSymbol",
    }

    for field_name in ARCHITECTURE_MATRIX_ROW_COLUMNS:
        value = row.get(field_name, "").strip()
        if field_name in ARCHITECTURE_MATRIX_DERIVED_COLUMNS:
            continue
        paired_symbol_field = optional_path_fields_with_none_pair.get(field_name)
        if not value:
            if paired_symbol_field and _is_none_with_reason(row.get(paired_symbol_field, "").strip()):
                continue
            issues.append(f"architecture matrix row `{label}` is missing required field `{field_name}`")
            continue
        if ARCHITECTURE_PLACEHOLDER_RE.search(value) and not _is_none_with_reason(value):
            issues.append(
                f"architecture matrix row `{label}` field `{field_name}` uses placeholder/worker-selection language: `{value}`"
            )

    if not criterion_id:
        issues.append("architecture matrix row is missing `criterionId`")

    risk_class = row.get("riskClass", "").strip()
    if risk_class and risk_class not in ARCHITECTURE_RISK_CLASSES:
        issues.append(f"architecture matrix row `{label}` has invalid `riskClass`: `{risk_class}`")

    disposition = row.get("implementationDisposition", "").strip()
    if disposition and disposition not in ARCHITECTURE_IMPLEMENTATION_DISPOSITIONS:
        issues.append(
            f"architecture matrix row `{label}` has invalid `implementationDisposition`: `{disposition}`"
        )

    # Path/symbol existence pairs. Each pair either both resolve, or the
    # symbol cell legitimately carries a NONE_WITH_REASON exemption.
    resolvable_pairs = (
        ("canonicalOwnerPath", "canonicalOwnerLocator"),
        ("implementationPath", "implementationSymbol"),
        ("producerPath", "producerSymbol"),
        ("exportPath", "exportSymbol"),
        ("compositionRootPath", "compositionRootSymbol"),
    )
    for path_field, symbol_field in resolvable_pairs:
        path_value = row.get(path_field, "").strip().strip("`")
        symbol_value = row.get(symbol_field, "").strip().strip("`")
        if not path_value or not symbol_value:
            continue
        if _is_none_with_reason(symbol_value):
            continue
        if disposition == "CREATE_NEW" and path_field in ("implementationPath",):
            # A newly created path need not exist yet; its parent must.
            parent = Path(path_value).parent.as_posix()
            if parent and parent != "." and not _exists_rel(parent):
                issues.append(
                    f"architecture matrix row `{label}` field `{path_field}` names a new path whose parent does not exist: `{path_value}`"
                )
            continue
        if not _exists_rel(path_value):
            issues.append(
                f"architecture matrix row `{label}` field `{path_field}` cites a nonexistent path: `{path_value}`"
            )
            continue
        source_text = _read_rel(path_value)
        if _is_code_source(path_value) and not _source_has_verified_symbol(source_text, symbol_value):
            issues.append(
                f"architecture matrix row `{label}` field `{symbol_field}` cites `{symbol_value}` "
                f"but `{path_value}` does not contain that symbol"
            )

    # registrationPath/Symbol: real pair or NONE_WITH_REASON.
    registration_path = row.get("registrationPath", "").strip().strip("`")
    registration_symbol = row.get("registrationSymbol", "").strip().strip("`")
    if registration_symbol and not _is_none_with_reason(registration_symbol):
        if not registration_path or not _exists_rel(registration_path):
            issues.append(
                f"architecture matrix row `{label}` field `registrationPath` cites a nonexistent path: `{registration_path}`"
            )
        else:
            source_text = _read_rel(registration_path)
            if _is_code_source(registration_path) and not _source_has_verified_symbol(source_text, registration_symbol):
                issues.append(
                    f"architecture matrix row `{label}` field `registrationSymbol` cites `{registration_symbol}` "
                    f"but `{registration_path}` does not contain that symbol"
                )
    elif registration_symbol and _is_none_with_reason(registration_symbol) and _is_contract_only_none(registration_symbol):
        issues.append(
            f"architecture matrix row `{label}` field `registrationSymbol` uses a contract-only exemption reserved for `runtimeConsumerSymbol`"
        )

    # runtimeConsumerPath/Symbol: real non-test pair or NONE_WITH_REASON:CONTRACT_ONLY_.
    consumer_path = row.get("runtimeConsumerPath", "").strip().strip("`")
    consumer_symbol = row.get("runtimeConsumerSymbol", "").strip().strip("`")
    if consumer_symbol and _is_none_with_reason(consumer_symbol):
        if not _is_contract_only_none(consumer_symbol):
            issues.append(
                f"architecture matrix row `{label}` field `runtimeConsumerSymbol` exemption must start with `{ARCHITECTURE_NONE_CONTRACT_ONLY_PREFIX}`"
            )
    elif consumer_symbol:
        if not consumer_path or not _exists_rel(consumer_path):
            issues.append(
                f"architecture matrix row `{label}` field `runtimeConsumerPath` cites a nonexistent path: `{consumer_path}`"
            )
        else:
            normalized_consumer = consumer_path.replace("\\", "/")
            if re.search(r"\.test\.|_test\.|/tests?/", normalized_consumer, re.IGNORECASE):
                issues.append(
                    f"architecture matrix row `{label}` field `runtimeConsumerPath` cites a test file, "
                    "not a non-test runtime consumer: use an explicit `NONE_WITH_REASON:CONTRACT_ONLY_` "
                    "exemption instead if there is truly no non-test consumer"
                )
            else:
                source_text = _read_rel(consumer_path)
                if _is_code_source(consumer_path) and not _source_has_verified_symbol(source_text, consumer_symbol):
                    issues.append(
                        f"architecture matrix row `{label}` field `runtimeConsumerSymbol` cites `{consumer_symbol}` "
                        f"but `{consumer_path}` does not contain that symbol"
                    )

    # Test path fields: existing file, or parent exists for planned creation.
    for test_field in ("positiveTestPath", "negativeTestPath", "bypassTestPath", "compositionTestPath"):
        test_value = row.get(test_field, "").strip().strip("`")
        if not test_value or _is_none_with_reason(test_value):
            continue
        if _exists_rel(test_value):
            continue
        parent = Path(test_value).parent.as_posix()
        # A root-level new path (parent == ".") always has an existing
        # parent (the repository root itself).
        if parent == "." or _exists_rel(parent):
            continue
        issues.append(
            f"architecture matrix row `{label}` field `{test_field}` names a path whose parent directory does not exist: `{test_value}`"
        )

    # machineDisposition must never be worker-authored as the PASS token in
    # the matrix itself before the gate has run; a worker may only leave it
    # for the gate to fill, not hand-write PASS_IDENTITY_AND_COVERAGE.
    machine_disposition = row.get("machineDisposition", "").strip()
    if machine_disposition == ARCHITECTURE_MACHINE_PASS:
        issues.append(
            f"architecture matrix row `{label}` field `machineDisposition` is worker-authored as "
            f"`{ARCHITECTURE_MACHINE_PASS}`; only the gate may write this value"
        )

    semantic_acceptance = row.get("semanticAcceptance", "").strip()
    if semantic_acceptance and semantic_acceptance not in ARCHITECTURE_SEMANTIC_ACCEPTANCE_VALUES:
        issues.append(
            f"architecture matrix row `{label}` field `semanticAcceptance` has invalid value: `{semantic_acceptance}`"
        )

    # R3-02 fix 3: normalize private/archive authority rejection helper.
    def _is_private_authority(p: str) -> bool:
        """Return True if the path matches the private/archive/legacy rejection pattern."""
        return bool(ARCHITECTURE_AUTHORITY_REJECT_PATH_RE.search(p))

    # canonicalOwnerPath and canonicalAuthorityPath must not be private/archive.
    for _auth_field in ("canonicalOwnerPath", "canonicalAuthorityPath"):
        _auth_value = row.get(_auth_field, "").strip().strip("`")
        if _auth_value and not _is_none_with_reason(_auth_value) and _is_private_authority(_auth_value):
            issues.append(
                f"architecture matrix row `{label}` `{_auth_field}` path is rejected "
                f"(private/archive/legacy): `{_auth_value}`"
            )

    trust_source = row.get("trustSource", "").strip()
    if trust_source and not _is_none_with_reason(trust_source):
        _ts = trust_source.split(":", 1)
        _tsp = _ts[0].strip() if len(_ts) == 2 else ""
        if len(_ts) != 2 or not _tsp or not _ts[1].strip():
            issues.append(f"architecture matrix row `{label}` `trustSource` must be `<path>:<locator>`: `{trust_source}`")
        elif ARCHITECTURE_AUTHORITY_REJECT_PATH_RE.search(_tsp):
            issues.append(f"architecture matrix row `{label}` `trustSource` path is rejected (archive/traversal/absolute): `{_tsp}`")
        elif not _exists_rel(_tsp):
            issues.append(f"architecture matrix row `{label}` `trustSource` path does not exist: `{_tsp}`")
        else:
            # R3-02 fix 1: resolve trust locator against cited authority bytes.
            _ts_locator = _ts[1].strip()
            _ts_bytes = _read_rel(_tsp)
            if _ts_locator not in _ts_bytes:
                issues.append(
                    f"architecture matrix row `{label}` `trustSource` locator `{_ts_locator}` "
                    f"is not found in the cited authority bytes of `{_tsp}` "
                    "(`BLOCKED_LOCATOR_NOT_IN_AUTHORITY`)"
                )
    _cp = row.get("contextCarrierPath", "").strip().strip("`")
    _cf = row.get("contextField", "").strip()
    if _cp and _cf and not _is_none_with_reason(_cp):
        if not _exists_rel(_cp):
            issues.append(f"architecture matrix row `{label}` `contextCarrierPath` does not exist: `{_cp}`")
        elif _cf not in _read_rel(_cp):
            issues.append(f"architecture matrix row `{label}` `contextField` `{_cf}` not found in `{_cp}`")
    _ep = row.get("evidenceOutputPath", "").strip().strip("`")
    if _ep and not _is_none_with_reason(_ep):
        if not any(_ep.replace("\\", "/").startswith(d) for d in ("docs/reviews/", "docs/assessments/", "docs/baselines/", "docs/work_orders/", "docs/audits/")):
            issues.append(f"architecture matrix row `{label}` `evidenceOutputPath` must be under an authorized directory: `{_ep}`")
        elif not re.search(r"\d{4}-\d{2}-\d{2}", _ep):
            issues.append(f"architecture matrix row `{label}` `evidenceOutputPath` must contain a YYYY-MM-DD date: `{_ep}`")
        elif not _exists_rel(str(Path(_ep).parent)):
            issues.append(f"architecture matrix row `{label}` `evidenceOutputPath` parent directory does not exist: `{_ep}`")
    # R3-02 fix 2: rollback paths must be repo-relative AND in the writable manifest.
    for _rp in ([] if _is_none_with_reason(row.get("rollbackPaths", "")) else [p.strip() for p in row.get("rollbackPaths", "").split(";") if p.strip()]):
        if re.search(r"\.\.", _rp) or re.match(r"^(?:[A-Za-z]:\\|/|\\\\)", _rp):
            issues.append(f"architecture matrix row `{label}` `rollbackPaths` entry is absolute or traversal: `{_rp}`")
        elif writable_manifest is not None:
            _rp_norm = _rp.replace("\\", "/").strip("/")
            _manifest_norm = {p.replace("\\", "/").strip("/") for p in writable_manifest}
            if _rp_norm not in _manifest_norm:
                issues.append(
                    f"architecture matrix row `{label}` `rollbackPaths` entry `{_rp}` "
                    "is outside the exact writable manifest "
                    "(`BLOCKED_ROLLBACK_OUTSIDE_WRITABLE_MANIFEST`)"
                )
    return issues


def _extract_writable_manifest_paths(text: str) -> set[str]:
    """Delegate to architecture_schema; re-exported here for source_validation.* callers."""
    from check_work_order_dispatch_quality_architecture_schema import (
        _extract_writable_manifest_paths as _f,
    )
    return _f(text)


def _validate_immutable_review_identity_fields(
    review_path: str | None,
    review_commit: str | None,
    review_sha: str | None,
    digest: str | None,
    criterion_ids: list[str] | None = None,
    context_label: str = "",
) -> list[str]:
    """Delegate to architecture_schema; re-exported here for source_validation.* callers."""
    from check_work_order_dispatch_quality_architecture_schema import (
        _validate_immutable_review_identity_fields as _f,
    )
    return _f(review_path, review_commit, review_sha, digest, _exists_rel,
              criterion_ids, context_label)
