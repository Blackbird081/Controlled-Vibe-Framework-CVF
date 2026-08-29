#!/usr/bin/env python3
"""
CVF External Absorption Conditional Reopen Index Enforcement Guard.

Enforces the existing Conditional Reopen Index Rule (the "Future Update Rule"
in the central conditional reopen index) against changed governed absorption
closeout documents. This is EACQ-FV-MV1: it implements no new doctrine, no new
candidate vocabulary, and no new index owner. It adapts the FPC-PRG parked
reopen inventory / KIOD runtime candidate reopen inventory checker pattern
(``check_fpc_parked_reopen_inventory.py`` / ``check_kiod_runtime_candidate_
reopen_inventory.py``) to a changed-doc scan against the existing central
index rather than a fixed-id JSON inventory, because the rule this checker
enforces applies to any future absorption closeout, not one bounded lane set.

Existing rule enforced (verbatim source, condensed):
Every closeout that records one of the candidate categories already
enumerated in the core-standard Conditional Reopen Index Rule (``PACKAGE_
CANDIDATE``, ``RUNTIME_CANDIDATE``, ``CHECKER_CANDIDATE``, ``DEFERRED``,
``DEFER_WITH_REOPEN_CONDITION``, ``DEFERRED_WITH_REOPEN_CONDITION``, or
``VALUE_PARKED``) must do exactly one of:

1. add or update a matching row in the central index in the same changed set;
2. cite a specific existing matching index row and state why it remains
   current; or
3. state the exact ``NO_CONDITIONAL_REOPEN_INDEX_ENTRY_WITH_REASON`` marker
   with a non-empty reason.

Source: ``docs/reference/external_agent_review/
CVF_EXTERNAL_ABSORPTION_CORE_STANDARD.md`` "Conditional Reopen Index Rule",
and ``docs/reference/external_agent_review/
CVF_EXTERNAL_ABSORPTION_CONDITIONAL_REOPEN_INDEX.md`` "Future Update Rule".

This checker does not broaden candidate vocabulary, does not reopen any
lane, does not wire a hook, and does not mutate the standard or the index.
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
THIS_SCRIPT_PATH = "governance/compat/check_external_absorption_conditional_reopen_index.py"

INDEX_PATH = "docs/reference/external_agent_review/CVF_EXTERNAL_ABSORPTION_CONDITIONAL_REOPEN_INDEX.md"
STANDARD_PATH = "docs/reference/external_agent_review/CVF_EXTERNAL_ABSORPTION_CORE_STANDARD.md"
CANDIDATE_INDEX_SECTION = "## Candidate Index"
TERMINAL_CLOSURE_SECTION = "## Terminal Source-Family Closures"

ARCHIVE_MARKER = "/archive/"

# Governed absorption closeout/audit/review path families this guard applies
# to. Narrower than the general external-absorption-core prefixes because
# this guard only fires on documents that actually record a conditional
# candidate disposition, not every governed markdown file in these trees.
GOVERNED_PREFIXES = ("docs/audits/", "docs/reviews/")
EXTERNAL_ABSORPTION_REQUIRED_MARKER = "External absorption core: REQUIRED"
VALUE_CONVERSION_SECTION = "## External Absorption Value Conversion Matrix"

# The existing candidate categories from the core-standard Conditional
# Reopen Index Rule. This checker does not add, remove, or reinterpret any
# of these; it only requires that a changed closeout recording one of them
# also carries one of the three existing semantic outcomes.
CONDITIONAL_CANDIDATE_TOKENS = (
    "PACKAGE_CANDIDATE",
    "RUNTIME_CANDIDATE",
    "CHECKER_CANDIDATE",
    "DEFER_WITH_REOPEN_CONDITION",
    "DEFERRED_WITH_REOPEN_CONDITION",
    "DEFERRED",
    "VALUE_PARKED",
)

NO_ENTRY_MARKER = "NO_CONDITIONAL_REOPEN_INDEX_ENTRY_WITH_REASON"
CLASS_CANDIDATE_TOKENS = {
    "PACKAGE_CANDIDATE",
    "RUNTIME_CANDIDATE",
    "CHECKER_CANDIDATE",
}

# A citation of an existing row must reference the central index path
# together with either a backtick-quoted candidate id or a citation of the
# Terminal Source-Family Closures table, so a bare directory-style mention of
# the index is not accepted as proof (see literal-format gotcha 4: bare path
# substrings are not evidence).
INDEX_CITATION_MARKERS = (
    "central conditional reopen index",
    "conditional reopen index",
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


def _normalize_path(path: str) -> str:
    return path.strip().replace("\\", "/")


def _changed_files(base: str | None, head: str | None) -> list[str]:
    """Discover the applicable changed-set: a committed base..head range when
    both are supplied, plus staged, unstaged, and untracked worktree state.
    Mirrors the discovery convention already used by check_external_
    absorption_core.py and check_kiod_runtime_candidate_reopen_inventory.py.
    """
    paths: set[str] = set()
    if base and head and base != head:
        code, out, _ = _run_git(["diff", "--name-only", f"{base}..{head}"])
        if code == 0 and out:
            paths.update(out.splitlines())
    for args in (["diff", "--name-only"], ["diff", "--name-only", "--cached"]):
        code, out, _ = _run_git(args)
        if code == 0 and out:
            paths.update(out.splitlines())
    code, out, _ = _run_git(["ls-files", "--others", "--exclude-standard"])
    if code == 0 and out:
        paths.update(out.splitlines())
    return sorted({_normalize_path(p) for p in paths if p.strip()})


def _read_rel(path: str) -> str:
    full = REPO_ROOT / path
    if not full.is_file():
        return ""
    return full.read_text(encoding="utf-8", errors="replace")


def _is_archive_path(path: str) -> bool:
    return ARCHIVE_MARKER in _normalize_path(path)


def _is_applicable_path(path: str) -> bool:
    normalized = _normalize_path(path)
    if not normalized.endswith(".md"):
        return False
    if _is_archive_path(normalized):
        return False
    if normalized in (INDEX_PATH, STANDARD_PATH):
        return False
    if normalized == THIS_SCRIPT_PATH:
        return False
    return any(normalized.startswith(prefix) for prefix in GOVERNED_PREFIXES)


def _extract_section(text: str, heading: str) -> str:
    match = re.search(
        rf"^{re.escape(heading)}\s*$([\s\S]*?)(?=^##\s+|\Z)",
        text,
        re.MULTILINE,
    )
    return match.group(1).strip() if match else ""


def _candidate_disposition_text(text: str) -> str:
    """Return only the canonical candidate-disposition owner section.

    Corpus-status vocabularies, checker instructions, and roadmap planning
    prose may quote candidate tokens without recording an absorption
    candidate. The existing value-conversion owner already requires the
    exact section used here, so narrowing to it adds no doctrine.
    """
    if EXTERNAL_ABSORPTION_REQUIRED_MARKER not in text:
        return ""
    return _extract_section(text, VALUE_CONVERSION_SECTION)


def _mentions_conditional_candidate(text: str) -> list[str]:
    """Return the distinct candidate tokens present as real disposition-shaped
    tokens (all-caps, word-bounded), not as backtick-quoted documentation of
    the checker's own vocabulary. A file that only quotes the token list to
    describe this guard (as this checker's own docstring and the standard do)
    is not itself an absorption closeout and is excluded via _is_applicable_
    path, so no separate self-quotation exemption is required here."""
    found: list[str] = []
    for token in CONDITIONAL_CANDIDATE_TOKENS:
        if re.search(rf"(?<![A-Z_]){re.escape(token)}(?![A-Z_])", text):
            found.append(token)
    return found


def _extract_index_candidate_ids(index_text: str) -> set[str]:
    """Parse backtick-quoted Candidate ID cells from the Candidate Index table
    plus the Source family cells from the Terminal Source-Family Closures
    table, so a citation of either a live candidate row or a terminal
    source-family closure row counts as an existing matching row."""
    ids: set[str] = set()
    for section_marker in (CANDIDATE_INDEX_SECTION, TERMINAL_CLOSURE_SECTION):
        start = index_text.find(section_marker)
        if start == -1:
            continue
        section_start = start + len(section_marker)
        next_header = index_text.find("\n## ", section_start)
        section = index_text[section_start:] if next_header == -1 else index_text[section_start:next_header]
        for line in section.splitlines():
            stripped = line.strip()
            if not stripped.startswith("|") or not stripped.endswith("|"):
                continue
            cells = [c.strip() for c in stripped.strip("|").split("|")]
            if not cells or re.fullmatch(r":?-{3,}:?", cells[0]):
                continue
            first_cell = cells[0]
            for match in re.finditer(r"`([^`]+)`", first_cell):
                candidate_id = match.group(1).strip()
                if candidate_id and candidate_id.lower() not in {"candidate id", "source family"}:
                    ids.add(candidate_id)
    return ids


def _extract_index_candidate_rows(index_text: str) -> dict[str, str]:
    """Return Candidate Index rows keyed by exact candidate id."""
    rows: dict[str, str] = {}
    section = _extract_section(index_text, CANDIDATE_INDEX_SECTION)
    for line in section.splitlines():
        stripped = line.strip()
        if not stripped.startswith("|") or not stripped.endswith("|"):
            continue
        cells = [cell.strip() for cell in stripped.strip("|").split("|")]
        if not cells or re.fullmatch(r":?-{3,}:?", cells[0]):
            continue
        match = re.fullmatch(r"`([^`]+)`", cells[0])
        if not match or match.group(1).strip().casefold() == "candidate id":
            continue
        rows[match.group(1).strip()] = re.sub(r"\s+", " ", stripped)
    return rows


def _cites_existing_row(
    text: str,
    index_candidate_ids: set[str],
    index_candidate_rows: dict[str, str],
    candidate_tokens: list[str],
) -> tuple[bool, str]:
    """A citation is accepted only when the document names the central index
    (by path or by the canonical "conditional reopen index" phrase) AND
    quotes a backtick-wrapped id that resolves to a real row in the current
    index, AND states why that row remains current. A bare index path or
    generic "already covered" prose without a resolvable row id is rejected
    per the work order's bare-citation prohibition."""
    if INDEX_PATH not in text and not any(marker in text.casefold() for marker in INDEX_CITATION_MARKERS):
        return False, "no reference to the central conditional reopen index"

    citation_matches = list(re.finditer(r"`([^`]+)`", text))
    declared_classes = CLASS_CANDIDATE_TOKENS & set(candidate_tokens)
    matching = {
        match.group(1).strip()
        for match in citation_matches
        if match.group(1).strip() in index_candidate_ids
        and (
            match.group(1).strip() not in index_candidate_rows
            or not declared_classes
            or any(
                token in index_candidate_rows[match.group(1).strip()]
                for token in declared_classes
            )
        )
    }
    if not matching:
        return False, "no cited candidate id and class resolve to a current central-index row"

    currency_markers = (
        "remains current",
        "still current",
        "row remains",
        "condition unchanged",
        "unchanged reopen condition",
    )
    for match in citation_matches:
        if match.group(1).strip() not in matching:
            continue
        window = text[max(0, match.start() - 160):match.end() + 320].casefold()
        if any(marker in window for marker in currency_markers):
            return True, ""

    return False, "cited row lacks a nearby explicit statement of why it remains current"


def _allowed_no_entry_reason(reason: str) -> bool:
    lowered = reason.casefold()
    fully_adapted = "fully adapted" in lowered
    rejected_without_value = (
        "reject" in lowered
        and "no remaining" in lowered
        and ("value" in lowered or "cvf-native" in lowered)
    )
    owned_by_other_index = "already owned" in lowered and "index" in lowered
    return fully_adapted or rejected_without_value or owned_by_other_index


def _has_no_entry_marker_with_reason(text: str) -> tuple[bool, str]:
    for match in re.finditer(re.escape(NO_ENTRY_MARKER), text):
        window = text[match.end():match.end() + 240]
        # The rule's own allowed reason classes: fully adapted, rejected with
        # no remaining value, or already owned by another governed index.
        stripped = window.lstrip()
        if not stripped:
            continue
        # Require a colon-or-dash separated non-empty reason immediately
        # following the marker on the same or next physical content, not a
        # bare marker with nothing after it.
        reason_candidate = re.split(r"[:\-]\s*", stripped, maxsplit=1)
        if len(reason_candidate) < 2:
            continue
        reason_text = reason_candidate[1].strip()
        first_line = reason_text.splitlines()[0].strip() if reason_text else ""
        if len(first_line) >= 8 and _allowed_no_entry_reason(first_line):
            return True, first_line
    return False, ""


def _added_or_updated_matching_row(
    path: str,
    text: str,
    changed_paths: set[str],
    changed_index_rows: dict[str, str],
    candidate_tokens: list[str],
) -> bool:
    """Require a changed index row to resolve back to this closeout.

    A row matches when the closeout cites its exact id or the changed row
    cites the closeout's exact normalized path. Merely changing any unrelated
    row in the central index cannot satisfy every candidate-bearing closeout.
    """
    if INDEX_PATH not in changed_paths or not changed_index_rows:
        return False
    cited_ids = {match.group(1).strip() for match in re.finditer(r"`([^`]+)`", text)}
    declared_classes = CLASS_CANDIDATE_TOKENS & set(candidate_tokens)
    class_matching_rows = {
        candidate_id: row
        for candidate_id, row in changed_index_rows.items()
        if not declared_classes or any(token in row for token in declared_classes)
    }
    if cited_ids & set(class_matching_rows):
        return True
    normalized_path = _normalize_path(path)
    return any(normalized_path in row for row in class_matching_rows.values())


def check_text(
    path: str,
    text: str,
    *,
    changed_paths: set[str] | None = None,
    index_text_after: str | None = None,
    changed_index_rows: dict[str, str] | None = None,
) -> list[dict[str, str]]:
    """Validate a single changed governed document's conditional-candidate
    disposition against the three existing semantic outcomes.

    changed_paths: the full normalized changed-set for this run, used to
        decide whether the same batch also updated the central index.
    index_text_after: current (post-change) content of the central index,
        used to resolve cited candidate ids to real rows.
    changed_index_rows: exact candidate rows added or modified in the same
        changed set, keyed by candidate id.
    """
    violations: list[dict[str, str]] = []
    if not _is_applicable_path(path):
        return violations

    disposition_text = _candidate_disposition_text(text)
    candidates = _mentions_conditional_candidate(disposition_text)
    if not candidates:
        return violations

    changed_paths = changed_paths or {path}
    index_text_after = index_text_after if index_text_after is not None else _read_rel(INDEX_PATH)
    index_candidate_ids = _extract_index_candidate_ids(index_text_after) if index_text_after else set()
    index_candidate_rows = _extract_index_candidate_rows(index_text_after) if index_text_after else {}

    same_batch_index_update = _added_or_updated_matching_row(
        path,
        text,
        changed_paths,
        changed_index_rows or {},
        candidates,
    )
    cites_existing, cite_reason = _cites_existing_row(
        text,
        index_candidate_ids,
        index_candidate_rows,
        candidates,
    )
    has_no_entry, _ = _has_no_entry_marker_with_reason(disposition_text)

    satisfied_outcomes = sum((same_batch_index_update, cites_existing, has_no_entry))
    if satisfied_outcomes == 1:
        return violations

    if satisfied_outcomes > 1:
        violations.append({
            "path": path,
            "type": "conditional_reopen_index_multiple_outcomes",
            "message": "records more than one conditional reopen disposition outcome; exactly one is required",
        })
        return violations

    detail = cite_reason or "no matching index row in this changed set"
    violations.append({
        "path": path,
        "type": "conditional_reopen_index_candidate_disappeared",
        "message": (
            f"records conditional candidate token(s) {', '.join(sorted(candidates))} but neither "
            f"adds/updates a matching row in `{INDEX_PATH}`, cites a specific existing matching row "
            f"with a currency statement, nor states the exact `{NO_ENTRY_MARKER}` marker with a "
            f"non-empty reason ({detail})"
        ),
    })
    return violations


def _index_text_at_ref(ref: str) -> str:
    code, out, _ = _run_git(["show", f"{ref}:{INDEX_PATH}"])
    if code != 0 or not out:
        return ""
    return out


def run(base: str | None, head: str | None) -> list[dict[str, str]]:
    changed = _changed_files(base, head)
    changed_set = set(changed)

    index_text_after = _read_rel(INDEX_PATH)
    index_text_before = _index_text_at_ref(base or "HEAD")
    rows_before = _extract_index_candidate_rows(index_text_before)
    rows_after = _extract_index_candidate_rows(index_text_after)
    changed_index_rows = {
        candidate_id: row
        for candidate_id, row in rows_after.items()
        if rows_before.get(candidate_id) != row
    }

    violations: list[dict[str, str]] = []
    for path in changed:
        if not _is_applicable_path(path):
            continue
        text = _read_rel(path)
        if not text:
            continue
        violations.extend(
            check_text(
                path,
                text,
                changed_paths=changed_set,
                index_text_after=index_text_after,
                changed_index_rows=changed_index_rows,
            )
        )
    return violations


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", default=None)
    parser.add_argument("--head", default=None)
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args(argv)

    violations = run(args.base, args.head)

    print("=== CVF External Absorption Conditional Reopen Index Enforcement Guard ===")
    print(f"Index: {INDEX_PATH}")
    if args.base or args.head:
        print(f"Range: {args.base or '<auto>'}..{args.head or '<auto>'}")
    print(f"Violations: {len(violations)}")

    if violations:
        print("\nViolations:")
        for violation in violations:
            print(f"  - {violation['path']}: {violation['message']}")
        if args.enforce:
            print("\nVIOLATION - a conditional forward-value candidate disappeared from the reopen index.")
            return 1
        print("\nADVISORY - conditional reopen index candidates have unresolved disposition issues.")
        return 0

    print("\nCOMPLIANT - all changed conditional candidates carry a valid reopen-index disposition.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
