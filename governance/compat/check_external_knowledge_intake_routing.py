#!/usr/bin/env python3
"""
CVF external knowledge intake routing guard.

Changed governed external-intake artifacts must identify the chain-map route
before they absorb, promote, reject, dispatch, or close external knowledge.
This guard is range-aware and forward-only: it checks changed governed
Markdown files, staged files, and untracked files, but does not reopen
historical artifacts outside the changed set.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
from pathlib import Path

from check_upstream_freshness_receipt import applies_to_dispatch, validate_dispatch


REPO_ROOT = Path(__file__).resolve().parents[2]
FRESHNESS_ACTIVATION_BASE = "7dc3dc51238b4f5092d0482624750f1b555380fc"
STANDARD_PATH = (
    "docs/reference/external_agent_review/"
    "CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md"
)

REQUIRED_SECTION = "## External Knowledge Intake Routing"
EXPLICIT_REQUIRED_MARKER = "External knowledge intake routing: REQUIRED"
REQUIRED_FIELDS = (
    "Chain map",
    "Input type",
    "Chain map route",
    "Matching local-view guard",
    "Owner surface",
    "Disposition",
    "Claim boundary",
)
ALLOWED_INPUT_TYPES = {
    "legacy source family",
    "external repo or copied folder",
    "external-agent packet request",
    "external-agent returned output",
    "public/simple cvf vocabulary",
    "corpus scan or extraction intake",
    "runtime/provider/mcp/readiness claim",
    "operator-provided external comparison, critique, or recommendation",
    "external knowledge intake routing guard implementation",
}

DEFAULT_BASE_CANDIDATES = ("origin/main", "origin/master", "main", "master")
GOVERNED_PREFIXES = (
    "docs/reviews/",
    "docs/audits/",
    "docs/work_orders/",
    "docs/baselines/",
    "docs/roadmaps/",
    "docs/reference/external_agent_review/",
)
INTAKE_PATH_MARKERS = (
    "EXTERNAL_KNOWLEDGE",
    "EXTERNAL_AGENT",
    "EXTERNAL_RETURN",
    "EXTERNAL_FINDING",
    "LEGACY_ABSORPTION",
    "LEGACY_RESCAN",
    "CORPUS_SCAN",
    "CORPUS_EXTRACTION",
)
INTAKE_TEXT_MARKERS = (
    "external knowledge intake",
    "external-agent",
    "external agent",
    "external returned output",
    "external finding",
    "legacy absorption",
    "legacy rescan",
    "corpus scan",
    "corpus extraction",
)
SECTION_HEADING_PATTERN = re.compile(
    r"^##\s+External Knowledge Intake Routing\s*$", re.MULTILINE
)
NEXT_SECTION_PATTERN = re.compile(r"^##\s+.+$", re.MULTILINE)


METHOD_PATH = "docs/reference/external_agent_review/CVF_CROSS_WORKSPACE_DOMAIN_FUNNEL_ABSORPTION_METHOD.md"
BINDING_HEADING = "External/Local Coordination Binding"
STATE_BINDING = "CVF_SESSION/state/entries/externalLocalAbsorptionCoordination.json"
ACTIVE_PROGRAM_PATH = "CVF_SESSION/state/entries/activeExternalAbsorptionProgram.json"
NEXT_MOVE_PATH = "CVF_SESSION/state/entries/nextAllowedMove.json"
CORE_PATH = "CVF_SESSION/state/ACTIVE_SESSION_STATE_CORE.json"
CONTINUITY_PATHS = {
    STATE_BINDING, ACTIVE_PROGRAM_PATH, CORE_PATH, NEXT_MOVE_PATH,
    "CVF_SESSION/state/entries/domainPilotSelectedReviewDecision20260912.json",
    "CVF_SESSION/ACTIVE_SESSION_BOOTSTRAP_READ_MODEL.json", "CVF_SESSION_MEMORY.md",
}
EXPECTED_CONTRACT = {
    "contractId": "cvf.external-local-absorption-coordination@1",
    "invariants": {
        "externalRole": "ADVISORY_RESEARCH_AND_PATTERN_MAPPING",
        "externalContext": "PUBLIC_GITHUB_AND_REFRESHED_EXTERNAL_AGENT_READ",
        "localRole": "SOURCE_RUNTIME_VALUE_AND_PRIVATE_CVF_VERIFICATION",
        "finalDecisionOwner": "LOCAL",
        "localCoverageBasis": "SOURCE_DERIVED_NOT_EXTERNAL_SHORTLIST",
        "externalEvidenceAuthority": "INPUT_NOT_PRIVATE_CVF_PROOF",
    },
}
MAX_PARENT_DEPTH = 8
ACTIVE_PROGRAM_SCHEMA = "cvf.externalAbsorptionProgramContinuity.v1"
ACTIVE_PROGRAM_STATUS = "LOCAL_RUNTIME_VALUE_RECOVERY"
TERMINAL_PROGRAM_STATUSES = {"TERMINAL_ACCOUNTED", "SCOPE_EXIT_AUTHORIZED"}
SOURCE_STATUSES = {
    "INCOMPLETE",
    "TERMINAL_ACCEPTED",
    "TERMINAL_NO_NEW_VALUE",
    "TERMINAL_DEFERRED_WITH_TRIGGER",
    "TERMINAL_REJECTED",
    "BLOCKED_WITH_REASON",
}
TERMINAL_SOURCE_STATUSES = SOURCE_STATUSES - {"INCOMPLETE"}
PROGRAM_FIELDS = {
    "schemaVersion",
    "programId",
    "status",
    "sourceIds",
    "sourceStates",
    "nextSourceId",
    "nextActionClass",
    "expansionAllowed",
    "exitDisposition",
    "exitEvidence",
    "operatorScopeDecision",
    "chainBoundary",
}


def _is_continuity_path(path: str) -> bool:
    return path in CONTINUITY_PATHS or bool(re.fullmatch(r"AGENT_HANDOFF_V[0-9]+_[0-9-]+\.md", path))


def _coordination_applies(path: str, text: str) -> bool:
    if path == METHOD_PATH or not _is_governed_markdown_path(path):
        return False
    if BINDING_HEADING in text:
        return True
    fields = _field_rows(_extract_required_section(text))
    kind = _clean_value(fields.get("input type", "")).casefold()
    return _is_applicable(path, text) and (
        "absorp" in text.casefold() or "external-agent" in text.casefold()
        or kind in {"external repo or copied folder", "external-agent packet request",
                    "external-agent returned output", "operator-provided external comparison, critique, or recommendation",
                    "external knowledge intake routing guard implementation"}
    )


def _unique_json(pairs: list[tuple[str, object]]) -> dict:
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"duplicate JSON key: {key}")
        result[key] = value
    return result


def _json_section(text: str, heading: str) -> dict:
    matches = list(re.finditer(r"^## " + re.escape(heading) + r"\s*$", text, re.MULTILINE))
    if len(matches) != 1:
        raise ValueError(f"requires exactly one {heading} section")
    start = matches[0].end()
    end = NEXT_SECTION_PATTERN.search(text, start)
    section = text[start:end.start() if end else len(text)]
    blocks = re.findall(r"^```json\s*\n(.*?)^```\s*$", section, re.MULTILINE | re.DOTALL)
    if len(blocks) != 1:
        raise ValueError(f"requires exactly one JSON block in {heading}")
    value = json.loads(blocks[0], object_pairs_hook=_unique_json)
    if not isinstance(value, dict):
        raise ValueError(f"{heading} must be an object")
    return value


def _safe_governed_evidence_path(path: object) -> bool:
    if not isinstance(path, str) or not path:
        return False
    return (
        "\\" not in path
        and ":" not in path
        and ".." not in path.split("/")
        and _is_governed_markdown_path(path)
        and (REPO_ROOT / path).is_file()
    )


def _check_active_program(read, *, continuity: bool, mode: str, paths: list[str]) -> list[str]:
    """Validate structured batch continuity and its projection into next move."""
    required = (
        ACTIVE_PROGRAM_PATH in paths
        or (continuity and "multi_repo_absorption" in mode.casefold())
        or (continuity and (REPO_ROOT / ACTIVE_PROGRAM_PATH).is_file())
    )
    if not required:
        return []
    try:
        entry = json.loads(read(ACTIVE_PROGRAM_PATH), object_pairs_hook=_unique_json)
        if entry.get("stateKey") != "activeExternalAbsorptionProgram":
            raise ValueError("invalid active-program stateKey")
        program = entry.get("value")
        if not isinstance(program, dict) or set(program) != PROGRAM_FIELDS:
            raise ValueError("active program has missing or unknown fields")
        if program["schemaVersion"] != ACTIVE_PROGRAM_SCHEMA:
            raise ValueError("unsupported active-program schemaVersion")
        if not isinstance(program["programId"], str) or not program["programId"]:
            raise ValueError("programId must be non-empty")
        sources = program["sourceIds"]
        states = program["sourceStates"]
        if (
            not isinstance(sources, list)
            or not sources
            or any(not isinstance(item, str) or not item for item in sources)
            or len(set(sources)) != len(sources)
        ):
            raise ValueError("sourceIds must be a non-empty unique string list")
        if not isinstance(states, dict) or set(states) != set(sources):
            raise ValueError("sourceStates must exactly cover sourceIds")
        if any(status not in SOURCE_STATUSES for status in states.values()):
            raise ValueError("sourceStates contains an unsupported status")

        all_terminal = all(status in TERMINAL_SOURCE_STATUSES for status in states.values())
        decision = program["operatorScopeDecision"]
        evidence = program["exitEvidence"]
        if not isinstance(evidence, list) or any(not _safe_governed_evidence_path(item) for item in evidence):
            raise ValueError("exitEvidence must contain safe existing governed Markdown paths")
        if decision is not None and not _safe_governed_evidence_path(decision):
            raise ValueError("operatorScopeDecision must be null or a safe existing governed Markdown path")
        if program["chainBoundary"] != "INDEPENDENT_PER_SOURCE_LANES_ONLY":
            raise ValueError("active program must preserve the stopped-chain boundary")

        if program["status"] == ACTIVE_PROGRAM_STATUS:
            if all_terminal:
                raise ValueError("fully terminal source accounting must close or explicitly exit the program")
            if program["expansionAllowed"] is not False:
                raise ValueError("active incomplete program must set expansionAllowed=false")
            if program["exitDisposition"] != "RETAIN_ACTIVE_PROGRAM":
                raise ValueError("active incomplete program must retain its program boundary")
            if program["nextActionClass"] != "CONTINUE_ACTIVE_PROGRAM":
                raise ValueError("active incomplete program must continue the active program")
            if program["nextSourceId"] not in sources:
                raise ValueError("nextSourceId must belong to the active program")
            if states[program["nextSourceId"]] != "INCOMPLETE":
                raise ValueError("nextSourceId must identify an incomplete source")
            if decision is not None:
                raise ValueError("active retained program cannot carry an operator scope-exit decision")
        elif program["status"] == "TERMINAL_ACCOUNTED":
            if not all_terminal or not evidence:
                raise ValueError("terminal exit requires terminal source accounting and exitEvidence")
            if program["exitDisposition"] != "TERMINAL_ACCOUNTING_ACCEPTED":
                raise ValueError("terminal program requires TERMINAL_ACCOUNTING_ACCEPTED")
        elif program["status"] == "SCOPE_EXIT_AUTHORIZED":
            if decision is None:
                raise ValueError("scope exit requires a governed operatorScopeDecision")
            if program["exitDisposition"] != "OPERATOR_SCOPE_DECISION":
                raise ValueError("scope exit requires OPERATOR_SCOPE_DECISION")
        else:
            raise ValueError("unsupported active-program status")

        if program["status"] in TERMINAL_PROGRAM_STATUSES:
            return []
        next_entry = json.loads(read(NEXT_MOVE_PATH), object_pairs_hook=_unique_json)
        next_value = next_entry.get("value") if next_entry.get("stateKey") == "nextAllowedMove" else None
        required_markers = (
            f"PROGRAM_ID={program['programId']}",
            f"NEXT_SOURCE_ID={program['nextSourceId']}",
            "NEXT_ACTION_CLASS=CONTINUE_ACTIVE_PROGRAM",
            "EXPANSION_ALLOWED=false",
        )
        if not isinstance(next_value, str) or any(marker not in next_value for marker in required_markers):
            raise ValueError("nextAllowedMove does not project the active program and next-source markers")
        return []
    except (OSError, UnicodeError, ValueError, KeyError, TypeError, AttributeError) as exc:
        return [f"{ACTIVE_PROGRAM_PATH}: {exc}"]


def check_coordination(paths: list[str]) -> list[str]:
    """Bind changed declarations and explicit parents to the method; no history scan."""
    errors: list[str] = []
    cache: dict[str, str] = {}

    def read(path: str) -> str:
        if path not in cache:
            full = (REPO_ROOT / path).resolve()
            if not full.is_relative_to(REPO_ROOT.resolve()):
                raise ValueError("path escapes repository")
            cache[path] = full.read_text(encoding="utf-8")
        return cache[path]

    candidates = []
    for path in paths:
        if _is_governed_markdown_path(path) and (REPO_ROOT / path).is_file():
            try:
                if _coordination_applies(path, read(path)):
                    candidates.append(path)
            except (OSError, UnicodeError, ValueError) as exc:
                errors.append(f"{path}: {exc}")
    continuity = any(_is_continuity_path(path) for path in paths)
    state_required = STATE_BINDING in paths
    mode = ""
    if continuity:
        try:
            core = json.loads(read(CORE_PATH), object_pairs_hook=_unique_json)
            mode = str(core.get("currentMode", ""))
            # The compact current mode is only a trigger, never contract authority.
            state_required |= "absorp" in mode.casefold()
            state_required |= (REPO_ROOT / STATE_BINDING).is_file()
        except (OSError, UnicodeError, ValueError) as exc:
            errors.append(f"{CORE_PATH}: {exc}")
    errors.extend(_check_active_program(read, continuity=continuity, mode=mode, paths=paths))
    if not candidates and not state_required and METHOD_PATH not in paths:
        return errors
    try:
        contract = _json_section(read(METHOD_PATH), "Machine Coordination Contract")
        if contract != EXPECTED_CONTRACT:
            raise ValueError("canonical coordination contract differs from supported invariant schema")
        digest = hashlib.sha256(json.dumps(contract, sort_keys=True, separators=(",", ":")).encode("utf-8")).hexdigest()
    except (OSError, UnicodeError, ValueError) as exc:
        return errors + [f"{METHOD_PATH}: {exc}"]
    validated: set[str] = set()

    def validate(binding: dict, trail: tuple[str, ...]) -> None:
        if not isinstance(binding, dict) or set(binding) != {*contract, "contractSha256", "parentArtifact"}:
            raise ValueError("coordination binding has missing or unknown fields")
        if any(binding[key] != value for key, value in contract.items()):
            raise ValueError("coordination invariants contradict canonical method")
        if binding["contractSha256"] != digest:
            raise ValueError("stale or incorrect coordination contractSha256")
        parent = binding["parentArtifact"]
        if parent is None:
            return
        if not isinstance(parent, str) or "\\" in parent or ":" in parent or ".." in parent.split("/") or not _is_governed_markdown_path(parent):
            raise ValueError("parentArtifact must be a safe governed repository-relative Markdown path")
        if parent in trail:
            raise ValueError("coordination parent cycle")
        if len(trail) >= MAX_PARENT_DEPTH:
            raise ValueError("coordination parent depth exceeds bounded limit")
        if parent not in validated:
            validate(_json_section(read(parent), BINDING_HEADING), (*trail, parent))
            validated.add(parent)

    for path in candidates:
        try:
            validate(_json_section(read(path), BINDING_HEADING), (path,))
        except (OSError, UnicodeError, ValueError) as exc:
            errors.append(f"{path}: {exc}")
    if state_required:
        try:
            entry = json.loads(read(STATE_BINDING), object_pairs_hook=_unique_json)
            if entry.get("stateKey") != "externalLocalAbsorptionCoordination":
                raise ValueError("invalid coordination stateKey")
            binding = entry.get("value")
            validate(binding, (STATE_BINDING,))
            if binding["parentArtifact"] is None:
                raise ValueError("continuity binding must name its active governed artifact")
        except (OSError, UnicodeError, ValueError, AttributeError) as exc:
            errors.append(f"{STATE_BINDING}: {exc}")
    return errors


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


def _discover_default_base(head: str) -> str:
    env_base = os.getenv("CVF_COMPAT_BASE")
    if env_base:
        return env_base
    for ref in DEFAULT_BASE_CANDIDATES:
        if not _ref_exists(ref):
            continue
        code, out, _ = _run_git(["merge-base", ref, head])
        if code == 0 and out:
            return out
    return "HEAD~1"


def _is_governed_markdown_path(path: str) -> bool:
    normalized = path.replace("\\", "/").strip()
    return (
        normalized.endswith(".md")
        and normalized.startswith(GOVERNED_PREFIXES)
        and "/archive/" not in normalized
    )


def _add_changed_path(changed: list[str], path: str) -> None:
    normalized = path.replace("\\", "/").strip()
    if (_is_governed_markdown_path(normalized) or _is_continuity_path(normalized)) and normalized not in changed:
        changed.append(normalized)


def _get_changed_paths(base: str, head: str) -> list[str]:
    changed: list[str] = []

    if base != head:
        code, out, _ = _run_git(["diff", "--name-status", f"{base}..{head}"])
        if code == 0:
            for line in out.splitlines():
                parts = line.split("\t")
                if len(parts) < 2:
                    continue
                status = parts[0].strip()
                path = parts[2] if status.startswith(("R", "C")) and len(parts) > 2 else parts[1]
                _add_changed_path(changed, path)

    for args in (["diff", "--name-status"], ["diff", "--name-status", "--cached"]):
        code, out, _ = _run_git(args)
        if code != 0 or not out:
            continue
        for line in out.splitlines():
            parts = line.split("\t")
            if len(parts) < 2:
                continue
            status = parts[0].strip()
            path = parts[2] if status.startswith(("R", "C")) and len(parts) > 2 else parts[1]
            _add_changed_path(changed, path)

    code, out, _ = _run_git(["ls-files", "--others", "--exclude-standard"])
    if code == 0 and out:
        for line in out.splitlines():
            _add_changed_path(changed, line)

    return changed


def _read_file(path: str) -> str:
    full = REPO_ROOT / path
    if not full.is_file():
        return ""
    return full.read_text(encoding="utf-8", errors="replace")


def _is_applicable(path: str, text: str) -> bool:
    normalized_path = path.replace("\\", "/")
    upper_path = normalized_path.upper()
    if not _is_governed_markdown_path(normalized_path):
        return False
    if EXPLICIT_REQUIRED_MARKER in text:
        return True
    if any(marker in upper_path for marker in INTAKE_PATH_MARKERS):
        return True
    lowered = text.casefold()
    return any(marker in lowered for marker in INTAKE_TEXT_MARKERS)


def _extract_required_section(text: str) -> str:
    match = SECTION_HEADING_PATTERN.search(text)
    if not match:
        return ""
    start = match.end()
    next_match = NEXT_SECTION_PATTERN.search(text, start)
    end = next_match.start() if next_match else len(text)
    return text[start:end]


def _normalize_cell(cell: str) -> str:
    cell = cell.strip().strip("`").strip()
    return re.sub(r"\s+", " ", cell).casefold()


def _table_rows(section: str) -> list[list[str]]:
    rows: list[list[str]] = []
    for line in section.splitlines():
        stripped = line.strip()
        if not stripped.startswith("|") or not stripped.endswith("|"):
            continue
        cells = [cell.strip() for cell in stripped.strip("|").split("|")]
        rows.append(cells)
    return rows


def _is_separator_row(row: list[str]) -> bool:
    return all(re.fullmatch(r":?-{3,}:?", cell.strip()) for cell in row)


def _field_rows(section: str) -> dict[str, str]:
    field_values: dict[str, str] = {}
    for row in _table_rows(section):
        if len(row) < 2 or _is_separator_row(row):
            continue
        field = _normalize_cell(row[0])
        if field in {"field", "required field"}:
            continue
        value = row[1].strip()
        field_values[field] = value
    return field_values


def _clean_value(value: str) -> str:
    value = value.strip().strip("`").strip()
    return re.sub(r"\s+", " ", value)


def _has_local_view_guard(value: str) -> bool:
    normalized = value.replace("\\", "/").casefold()
    return "governance/compat/" in normalized or "n/a with reason" in normalized


def check_text(path: str, text: str) -> list[str]:
    if not _is_applicable(path, text):
        return []

    violations: list[str] = []
    if STANDARD_PATH not in text:
        violations.append(f"{path}: missing chain map citation `{STANDARD_PATH}`")

    section = _extract_required_section(text)
    if not section:
        violations.append(f"{path}: missing `{REQUIRED_SECTION}`")
        return violations

    fields = _field_rows(section)
    missing = [
        field for field in REQUIRED_FIELDS if _normalize_cell(field) not in fields
    ]
    if missing:
        violations.append(
            f"{path}: `{REQUIRED_SECTION}` missing rows: {', '.join(missing)}"
        )

    for field in REQUIRED_FIELDS:
        normalized = _normalize_cell(field)
        value = fields.get(normalized, "")
        if not value or _clean_value(value).casefold() in {"n/a", "none", "tbd"}:
            violations.append(
                f"{path}: `{REQUIRED_SECTION}` row `{field}` must be non-empty"
            )

    input_type = _clean_value(fields.get(_normalize_cell("Input type"), "")).casefold()
    if input_type and input_type not in ALLOWED_INPUT_TYPES:
        violations.append(
            f"{path}: `Input type` must be one of the canonical chain-map input types"
        )

    guard_value = fields.get(_normalize_cell("Matching local-view guard"), "")
    if guard_value and not _has_local_view_guard(guard_value):
        violations.append(
            f"{path}: `Matching local-view guard` must cite `governance/compat/` "
            "or say `N/A with reason`"
        )

    return violations


def check_paths(paths: list[str]) -> list[str]:
    violations: list[str] = []
    for path in paths:
        text = _read_file(path)
        if not text:
            continue
        violations.extend(check_text(path, text))
        if applies_to_dispatch(path, text):
            code, old, _ = _run_git(["show", f"{FRESHNESS_ACTIVATION_BASE}:{path}"])
            head_code, _, _ = _run_git(["cat-file", "-e", f"HEAD:{path}"])
            violations.extend(f"{path}: {error}" for error in validate_dispatch(
                text, historical_text=old if code == 0 else None,
                newly_dispatched=head_code != 0))
    violations.extend(check_coordination(paths))
    return violations


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Check external knowledge intake artifacts for routing evidence"
    )
    parser.add_argument("--base", default=None)
    parser.add_argument("--head", default="HEAD")
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args()

    base = args.base or _discover_default_base(args.head)
    paths = _get_changed_paths(base, args.head)
    violations = check_paths(paths)

    if violations:
        print("FAIL: external knowledge intake routing guard")
        print(f"Standard: {STANDARD_PATH}")
        for violation in violations:
            print(f"- {violation}")
        return 1 if args.enforce else 0

    print("PASS: external knowledge intake routing guard")
    if paths:
        print(f"Checked {len(paths)} changed governed artifact(s).")
    else:
        print("No changed external knowledge intake files required checking.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
