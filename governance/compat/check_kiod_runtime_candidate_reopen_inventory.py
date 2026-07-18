#!/usr/bin/env python3
"""CVF KIOD Runtime Candidate Reopen Inventory Guard.

Validates the KIOD-specific runtime-candidate reopen inventory
(``CVF_KIOD_RUNTIME_CANDIDATE_REOPEN_CONDITION_INVENTORY_2026-07-02.json``)
against KIOD-R10's recorded D-file06/I-file19 reopen-condition evidence, and
scans changed governed Markdown docs for unsupported re-proposal of either
runtime candidate.

This is a KIOD-specific adaptation of the FPC-PRG parked-reopen inventory
pattern (``governance/compat/check_fpc_parked_reopen_inventory.py``). It does
not change FPC-PRG semantics or the FPC inventory file.
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
INVENTORY_PATH = (
    REPO_ROOT
    / "docs"
    / "reference"
    / "CVF_KIOD_RUNTIME_CANDIDATE_REOPEN_CONDITION_INVENTORY_2026-07-02.json"
)
DECISION_PACKET_PATH = (
    REPO_ROOT
    / "docs"
    / "reviews"
    / "CVF_KIOD_R10_RUNTIME_DEFERRED_CANDIDATE_DECISION_2026-07-01.md"
)

REQUIRED_TOP_FIELDS = (
    "schemaVersion",
    "inventoryId",
    "status",
    "date",
    "docType",
    "sourceAuthority",
    "inventoryBoundary",
    "requiredCandidateIds",
    "candidateInventories",
    "checkerCandidate",
    "publicExportDisposition",
    "claimBoundary",
)
REQUIRED_BOUNDARY_FALSE_FIELDS = (
    "enforcementChangeAuthorized",
    "runtimeWorkAuthorized",
    "providerLiveProofAuthorized",
    "publicSyncAuthorized",
    "downstreamImplementationAuthorized",
    "checkerImplementationAuthorized",
)
REQUIRED_CANDIDATE_FIELDS = (
    "candidateId",
    "gateStatus",
    "conditionText",
    "owningArtifacts",
    "evidenceFields",
    "requiredConditions",
    "forbiddenUntilGatePasses",
    "reproposalRule",
)
REQUIRED_CANDIDATE_IDS = {"D-file06", "I-file19"}

# Changed-doc scan: flag governed docs that name a runtime candidate together
# with an implementation-proposing verb, but do not carry the evidence tokens
# the reopen inventory requires before that candidate may be reopened.
CANDIDATE_ID_MARKERS = ("D-file06", "I-file19")
PROPOSAL_VERB_MARKERS = (
    "implement",
    "build",
    "add live",
    "integrate",
    "wire up",
    "enable",
    "activate",
    "reopen",
    "proceed with",
)
COMMON_REOPEN_EVIDENCE_MARKERS = (
    "fresh operator decision",
    "fresh gc-018",
)
SOURCE_REOPEN_EVIDENCE_MARKERS = (
    "source verification",
    "source-verified",
)
PLANNING_REOPEN_EVIDENCE_MARKERS = (
    "proof plan",
    "non-auto-promotion",
    "truth-score gates",
    "secrets/quota",
)
# Closure-only / parked-boundary language that should never false-positive as
# a re-proposal attempt, even though it names the candidate ids.
PARKED_BOUNDARY_MARKERS = (
    "parked",
    "forbidden",
    "deferred",
    "closed",
    "closure",
    "does not authorize",
    "does not implement",
    "not authorized",
    "remains excluded",
    "excluded runtime candidate",
    "runtime candidate",
)

APPLICABLE_PREFIXES = (
    "docs/baselines/",
    "docs/work_orders/",
    "docs/reviews/",
    "docs/roadmaps/",
)
ARCHIVE_MARKER = "/archive/"
# The inventory and this checker's own source cite the candidate ids and
# proposal-shaped words as *documentation of the guard itself*; exclude them
# from the changed-doc re-proposal scan so the guard does not flag its own
# artifacts.
SELF_EXEMPT_PATHS = {
    "docs/reference/CVF_KIOD_RUNTIME_CANDIDATE_REOPEN_CONDITION_INVENTORY_2026-07-02.json",
}


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


def _changed_files(base: str | None, head: str | None) -> list[str]:
    paths: list[str] = []
    if base and head and base != head:
        code, out, _ = _run_git(["diff", "--name-only", f"{base}..{head}"])
        if code == 0 and out:
            paths.extend(out.splitlines())
    for args in (["diff", "--name-only", "--cached"], ["diff", "--name-only"]):
        code, out, _ = _run_git(args)
        if code == 0 and out:
            paths.extend(out.splitlines())
    code, out, _ = _run_git(["ls-files", "--others", "--exclude-standard"])
    if code == 0 and out:
        paths.extend(out.splitlines())
    return sorted({path.strip().replace("\\", "/") for path in paths if path.strip()})


def _load_json(path: Path, label: str) -> tuple[dict[str, Any] | None, list[str]]:
    if not path.exists():
        return None, [f"missing {label}: {_display_path(path)}"]
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        return None, [f"invalid {label} JSON: {_display_path(path)}: {exc}"]
    if not isinstance(data, dict):
        return None, [f"{label} must be a JSON object"]
    return data, []


def _display_path(path: Path) -> str:
    try:
        return path.relative_to(REPO_ROOT).as_posix()
    except ValueError:
        return path.as_posix()


def _resolve_artifact(path_value: str) -> Path:
    clean = path_value.split("#", 1)[0].strip().strip("`")
    path = Path(clean)
    if path.is_absolute():
        return path
    return REPO_ROOT / clean


def _artifact_exists(path_value: str) -> bool:
    return _resolve_artifact(path_value).exists()


def _normalize_condition(value: Any) -> str:
    """Normalize condition text for equivalence comparison: strip backtick
    code-span markers and collapse whitespace, since the inventory renders
    contract names in plain prose while the decision packet quotes them in
    backticks for Markdown display."""
    text = str(value or "").strip()
    text = text.replace("`", "")
    return re.sub(r"\s+", " ", text)


def _as_nonempty_str_list(value: Any) -> list[str] | None:
    if not isinstance(value, list) or not value:
        return None
    result = [str(item).strip() for item in value]
    if any(not item for item in result):
        return None
    return result


def _parse_decision_packet_conditions(path: Path) -> tuple[dict[str, str], list[str]]:
    """Extract per-candidate conditionText from the KIOD-R10 decision packet's
    Reopen Conditions table so the inventory can be checked for drift against
    the original recorded decision."""
    if not path.exists():
        return {}, [f"missing KIOD-R10 decision packet: {_display_path(path)}"]
    text = path.read_text(encoding="utf-8", errors="replace")
    marker = "## Reopen Conditions"
    start = text.find(marker)
    if start < 0:
        return {}, [f"KIOD-R10 decision packet missing section `{marker}`"]
    section = text[start + len(marker) :]
    next_heading = section.find("\n## ")
    if next_heading >= 0:
        section = section[:next_heading]

    conditions: dict[str, str] = {}
    for line in section.splitlines():
        stripped = line.strip()
        if not stripped.startswith("|") or "---" in stripped:
            continue
        cells = [cell.strip() for cell in stripped.strip("|").split("|")]
        if len(cells) < 2:
            continue
        candidate_cell, condition_cell = cells[0], cells[1]
        if candidate_cell.lower().startswith("candidate"):
            continue
        for candidate_id in REQUIRED_CANDIDATE_IDS:
            if candidate_id in candidate_cell:
                conditions[candidate_id] = condition_cell
    if not conditions:
        return {}, ["KIOD-R10 decision packet Reopen Conditions table has no candidate rows"]
    return conditions, []


def validate_inventory(
    inventory_path: Path = INVENTORY_PATH,
    decision_packet_path: Path = DECISION_PACKET_PATH,
) -> list[str]:
    violations: list[str] = []
    inventory, inventory_violations = _load_json(inventory_path, "KIOD runtime candidate reopen inventory")
    decision_conditions, decision_violations = _parse_decision_packet_conditions(decision_packet_path)
    violations.extend(inventory_violations)
    violations.extend(decision_violations)
    if inventory is None:
        return violations

    for field in REQUIRED_TOP_FIELDS:
        if field not in inventory:
            violations.append(f"inventory missing top-level field `{field}`")

    if inventory.get("status") != "ACTIVE_REFERENCE":
        violations.append("inventory status must be ACTIVE_REFERENCE")

    boundary = inventory.get("inventoryBoundary")
    if not isinstance(boundary, dict):
        violations.append("inventoryBoundary must be an object")
    else:
        for field in REQUIRED_BOUNDARY_FALSE_FIELDS:
            if boundary.get(field) is not False:
                violations.append(f"inventoryBoundary.{field} must be false")

    for path_value in _as_nonempty_str_list(inventory.get("sourceAuthority")) or []:
        if not _artifact_exists(path_value):
            violations.append(f"sourceAuthority artifact does not exist: {path_value}")

    required_candidate_ids = set(_as_nonempty_str_list(inventory.get("requiredCandidateIds")) or [])
    if required_candidate_ids != REQUIRED_CANDIDATE_IDS:
        violations.append(
            "requiredCandidateIds must match KIOD runtime candidate ids; "
            f"observed={sorted(required_candidate_ids)} expected={sorted(REQUIRED_CANDIDATE_IDS)}"
        )

    candidates = inventory.get("candidateInventories")
    if not isinstance(candidates, list) or not candidates:
        violations.append("candidateInventories must be a non-empty list")
        return violations

    inventory_by_candidate: dict[str, dict[str, Any]] = {}
    for idx, candidate in enumerate(candidates):
        if not isinstance(candidate, dict):
            violations.append(f"candidateInventories[{idx}] must be an object")
            continue
        candidate_id = str(candidate.get("candidateId") or "").strip()
        if not candidate_id:
            violations.append(f"candidateInventories[{idx}] missing candidateId")
            continue
        if candidate_id in inventory_by_candidate:
            violations.append(f"{candidate_id}: duplicate candidate inventory")
        inventory_by_candidate[candidate_id] = candidate
        for field in REQUIRED_CANDIDATE_FIELDS:
            if field not in candidate:
                violations.append(f"{candidate_id}: missing required field `{field}`")

    if set(inventory_by_candidate) != REQUIRED_CANDIDATE_IDS:
        violations.append(
            "candidateInventories must contain exactly D-file06 and I-file19; "
            f"observed={sorted(inventory_by_candidate)} expected={sorted(REQUIRED_CANDIDATE_IDS)}"
        )

    for candidate_id, candidate in sorted(inventory_by_candidate.items()):
        if candidate.get("gateStatus") != "PARKED":
            violations.append(f"{candidate_id}: gateStatus must be PARKED")

        expected_condition = decision_conditions.get(candidate_id)
        if expected_condition is None:
            violations.append(f"{candidate_id}: KIOD-R10 decision packet lacks reopen condition")
        elif _normalize_condition(candidate.get("conditionText")) != _normalize_condition(expected_condition):
            violations.append(f"{candidate_id}: conditionText drifted from KIOD-R10 decision packet")

        for field in ("owningArtifacts", "evidenceFields", "requiredConditions", "forbiddenUntilGatePasses"):
            values = _as_nonempty_str_list(candidate.get(field))
            if values is None:
                violations.append(f"{candidate_id}: `{field}` must be a non-empty list of strings")
                continue
            if field == "owningArtifacts":
                for path_value in values:
                    if not _artifact_exists(path_value):
                        violations.append(f"{candidate_id}: owning artifact does not exist: {path_value}")

        reproposal_rule = str(candidate.get("reproposalRule") or "")
        if "source-backed" not in reproposal_rule.lower():
            violations.append(f"{candidate_id}: reproposalRule must require source-backed evidence")

    checker_candidate = inventory.get("checkerCandidate")
    if not isinstance(checker_candidate, dict):
        violations.append("checkerCandidate must be an object")
    elif not str(checker_candidate.get("checkerPath") or "").strip():
        violations.append("checkerCandidate.checkerPath must be non-empty")

    if inventory.get("publicExportDisposition") not in {
        "DEFERRED_PRIVATE_ONLY",
        "EXPORTED",
        "BLOCKED_MISSING_PUBLIC_ARTIFACTS",
    }:
        violations.append("publicExportDisposition must be an allowed disposition token")

    if not str(inventory.get("claimBoundary") or "").strip():
        violations.append("claimBoundary must be non-empty")

    return violations


def _read_rel(path: str) -> str:
    full = REPO_ROOT / path
    if not full.is_file():
        return ""
    return full.read_text(encoding="utf-8", errors="replace")


def _is_applicable_governed_doc(path: str) -> bool:
    normalized = path.replace("\\", "/")
    if ARCHIVE_MARKER in normalized:
        return False
    if normalized in SELF_EXEMPT_PATHS:
        return False
    if not normalized.endswith(".md"):
        return False
    return any(normalized.startswith(prefix) for prefix in APPLICABLE_PREFIXES)


def _has_unsupported_reproposal(text: str) -> list[str]:
    """Return candidate ids that appear near a proposal verb without any
    reopen-evidence token nearby, unless the mention is clearly closure/parked
    boundary language."""
    lowered = text.lower()
    flagged: list[str] = []
    for candidate_id in CANDIDATE_ID_MARKERS:
        if candidate_id not in text:
            continue
        for match in re.finditer(re.escape(candidate_id), text):
            start = max(0, match.start() - 200)
            end = min(len(text), match.end() + 200)
            window = text[start:end]
            window_lower = window.lower()
            has_proposal_verb = any(verb in window_lower for verb in PROPOSAL_VERB_MARKERS)
            if not has_proposal_verb:
                continue
            has_parked_language = any(marker in window_lower for marker in PARKED_BOUNDARY_MARKERS)
            has_evidence_token = _has_source_backed_reopen_evidence(lowered)
            if has_parked_language or has_evidence_token:
                continue
            flagged.append(candidate_id)
            break
    return sorted(set(flagged))


def _has_source_backed_reopen_evidence(lowered_text: str) -> bool:
    """Return true only when the document records the core evidence categories
    needed before a parked KIOD runtime candidate can be re-proposed. A bare
    KIOD-R10 citation or "reopen condition" phrase is not enough."""
    return (
        all(marker in lowered_text for marker in COMMON_REOPEN_EVIDENCE_MARKERS)
        and any(marker in lowered_text for marker in SOURCE_REOPEN_EVIDENCE_MARKERS)
        and any(marker in lowered_text for marker in PLANNING_REOPEN_EVIDENCE_MARKERS)
    )


def check_changed_docs(base: str | None, head: str | None) -> list[str]:
    violations: list[str] = []
    for path in _changed_files(base, head):
        if not _is_applicable_governed_doc(path):
            continue
        text = _read_rel(path)
        if not text:
            continue
        flagged = _has_unsupported_reproposal(text)
        for candidate_id in flagged:
            violations.append(
                f"{path}: proposes {candidate_id} runtime work without recorded reopen evidence "
                "(fresh operator decision, fresh GC-018, source verification, or proof plan); "
                "check docs/reference/CVF_KIOD_RUNTIME_CANDIDATE_REOPEN_CONDITION_INVENTORY_2026-07-02.json "
                "before re-proposing"
            )
    return violations


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate KIOD runtime candidate reopen inventory")
    parser.add_argument("--base", default=None)
    parser.add_argument("--head", default=None)
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args()

    inventory_violations = validate_inventory()
    doc_violations = check_changed_docs(args.base, args.head)
    violations = inventory_violations + doc_violations

    print("=== CVF KIOD Runtime Candidate Reopen Inventory Gate ===")
    print(f"Inventory: {INVENTORY_PATH.relative_to(REPO_ROOT)}")
    if args.base or args.head:
        print(f"Range: {args.base or '<auto>'}..{args.head or '<auto>'}")
    print(f"Inventory violations: {len(inventory_violations)}")
    print(f"Changed-doc re-proposal violations: {len(doc_violations)}")
    print(f"Total violations: {len(violations)}")

    if violations:
        print("\nViolations:")
        for violation in violations:
            print(f"  - {violation}")
        if args.enforce:
            print("\nVIOLATION - KIOD runtime candidate reopen inventory guard failed.")
            return 1
        print("\nADVISORY - KIOD runtime candidate reopen inventory guard has issues.")
        return 0

    print("\nCOMPLIANT - KIOD runtime candidate reopen inventory guard is satisfied.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
