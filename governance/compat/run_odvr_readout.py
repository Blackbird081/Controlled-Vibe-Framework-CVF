#!/usr/bin/env python3
"""CVF ODVR-T1 deterministic local read-only readout composer.

Implements the narrowed ODVR-T1 composition target ratified by
docs/reference/operator_decision_value_readout/CVF_ODVR_T0_SOURCE_OVERLAP_AND_READOUT_CONTRACT.md
and its sibling JSON Schema (CVF_ODVR_T0_READOUT_SCHEMA.json). This module is a
pure, side-effect-free projection: every function accepts already-loaded state
as arguments (no implicit file reads inside the pure composer), and the only
I/O this file performs is the explicit read-only loader used by the CLI. It
never writes a file, calls a provider, mutates generated state, or exposes a
Web/UI/MCP surface. It duplicates none of the MAO-T7, MLW-NRD1, or Web
Workspace narrower summaries; it links to them only through source anchors.

Selection rule (binding, per the T0 contract's reviewer-corrected Freshness
Rules and New Doc-Only Fields table): the "latest material decision" is the
generated active-session state entry with the highest numeric `stateOrder`
whose `value` is an object carrying both a string `materialCommit` and at
least one string field matching a governed artifact path
(`docs/{roadmaps,baselines,work_orders,reviews}/*.md`). Filesystem
modification time, directory listing order, and handoff prose are never
selection authority. Entries carrying only a `dispatchCommit` (no
`materialCommit`) are not eligible. When multiple governed-artifact-path
fields exist on one eligible entry, the artifact used for `claimBoundary`/
`terminalValueVerdict`/`reopenCondition` extraction is chosen by fixed
precedence (see `ARTIFACT_FIELD_PRECEDENCE`) because a completion review is
the most terminal evidence for a decision, falling back to roadmap, baseline,
then work order when no completion review field is present.
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
ENTRIES_DIR = REPO_ROOT / "CVF_SESSION" / "state" / "entries"
STATE_PATH = REPO_ROOT / "CVF_SESSION" / "ACTIVE_SESSION_STATE.json"
GENERATOR_SCRIPT = REPO_ROOT / "governance" / "compat" / "generate_active_session_state.py"

CONTRACT_VERSION = "cvf.odvrT0.readoutContract.doc.v1"

GOVERNED_ARTIFACT_PATH_RE = re.compile(
    r"^docs/(roadmaps|baselines|work_orders|reviews)/[^/]+\.md$"
)

# Fixed precedence for which governed-artifact-path field on an eligible
# entry is treated as *the* artifactPath for claimBoundary/status/reopen
# extraction, when an entry carries more than one such field. A completion
# review is the most terminal evidence of a decision; work order is the
# least terminal (it only authorizes execution, not a decision outcome).
ARTIFACT_FIELD_PRECEDENCE: tuple[str, ...] = (
    "completionReview",
    "completionReviewPath",
    "roadmap",
    "roadmapPath",
    "baseline",
    "baselinePath",
    "gc018",
    "gc018Baseline",
    "workOrder",
    "workOrderPath",
)

CURRENT = "CURRENT"
STALE = "STALE"
CONTRADICTED = "CONTRADICTED"
MISSING_SOURCE = "MISSING_SOURCE"

CLAIM_BOUNDARY = (
    "ODVR-T1 local read-only composer. Deterministic projection over "
    "canonical generated active-session state and governed artifact "
    "Status/Claim Boundary text only. No mutation, provider call, UI/Web "
    "route, autonomous selection, agent dispatch, public-sync, T2 value "
    "proof, or production-readiness claim."
)


class OdvrReadoutError(Exception):
    """Raised for invocation/input failures (not for MISSING_SOURCE/CONTRADICTED results, which are valid outputs)."""


@dataclass(frozen=True)
class EligibleEntry:
    state_order: int
    state_key: str
    value: dict[str, Any]
    artifact_fields: tuple[tuple[str, str], ...]  # (fieldName, path) pairs, insertion order


@dataclass(frozen=True)
class ArtifactReadResult:
    path: str
    exists: bool
    status: str | None
    claim_boundary: str | None
    reopen_condition: str | None


@dataclass(frozen=True)
class CommitResolution:
    commit: str
    resolvable: bool


@dataclass(frozen=True)
class ComposerInputs:
    """Everything the pure composer needs, already loaded by the caller."""

    bootstrap_state: dict[str, Any]
    entries: tuple[EligibleEntry, ...]
    read_artifact: "Any"  # Callable[[str], ArtifactReadResult]
    resolve_commit: "Any"  # Callable[[str], CommitResolution]
    generator_drift_clean: bool
    session_anchor_path: str = "CVF_SESSION/ACTIVE_SESSION_STATE.json"


def _is_governed_artifact_path(value: Any) -> bool:
    return isinstance(value, str) and bool(GOVERNED_ARTIFACT_PATH_RE.match(value))


def find_eligible_entries(raw_entries: list[dict[str, Any]]) -> list[EligibleEntry]:
    """Filter raw loaded entry JSON objects to composer-eligible entries.

    Eligibility (binding rule): `value` is an object with a non-empty string
    `materialCommit` and at least one string field matching a governed
    artifact path. This is the ONLY eligibility test; no other heuristic
    (status token, date field, dispatch-only markers) makes an entry eligible.
    """
    eligible: list[EligibleEntry] = []
    for entry in raw_entries:
        if not isinstance(entry, dict):
            continue
        state_order = entry.get("stateOrder")
        state_key = entry.get("stateKey")
        value = entry.get("value")
        if not isinstance(state_order, int):
            continue
        if not isinstance(state_key, str) or not state_key:
            continue
        if not isinstance(value, dict):
            continue
        material_commit = value.get("materialCommit")
        if not isinstance(material_commit, str) or not material_commit:
            continue
        artifact_fields = tuple(
            (key, val) for key, val in value.items() if _is_governed_artifact_path(val)
        )
        if not artifact_fields:
            continue
        eligible.append(
            EligibleEntry(
                state_order=state_order,
                state_key=state_key,
                value=value,
                artifact_fields=artifact_fields,
            )
        )
    return eligible


def _select_artifact_field(entry: EligibleEntry) -> tuple[str, str] | None:
    """Pick the (fieldName, path) pair to treat as the entry's artifactPath.

    Follows ARTIFACT_FIELD_PRECEDENCE; if none of the precedence names are
    present, accepts a sole artifact field. Multiple unknown artifact roles
    return None so the caller fails closed instead of using JSON insertion
    order as authority.
    """
    field_map = dict(entry.artifact_fields)
    for name in ARTIFACT_FIELD_PRECEDENCE:
        if name in field_map:
            return name, field_map[name]
    if len(entry.artifact_fields) == 1:
        return entry.artifact_fields[0]
    return None


_VALUE_VERDICT_TOKEN_RE = re.compile(
    r"\b([A-Z][A-Z0-9]*(?:_[A-Z0-9]+){1,8})\b"
)
_KNOWN_NON_VERDICT_TOKENS = {
    "N_A",
}


def _extract_status_line(text: str) -> str | None:
    match = re.search(r"^Status:\s*`?([^`\r\n]+)`?\s*$", text, re.MULTILINE)
    if not match:
        return None
    return match.group(1).strip()


def _extract_claim_boundary_section(text: str) -> str | None:
    marker = "## Claim Boundary"
    start = text.find(marker)
    if start == -1:
        return None
    section_start = start + len(marker)
    next_heading = text.find("\n## ", section_start)
    body = text[section_start:next_heading] if next_heading != -1 else text[section_start:]
    return body.strip()


def _extract_reopen_condition(text: str) -> str | None:
    match = re.search(
        r"(?:Concrete reopen condition|[Rr]eopen condition)\s*:?\s*(.+?)(?:\n\n|\Z)",
        text,
        re.DOTALL,
    )
    if not match:
        return None
    condition = " ".join(match.group(1).split())
    return condition or None


def default_read_artifact(repo_relative_path: str) -> ArtifactReadResult:
    """Read-only artifact reader used by the CLI. Reads exactly one file."""
    full_path = REPO_ROOT / repo_relative_path
    if not full_path.exists() or not full_path.is_file():
        return ArtifactReadResult(
            path=repo_relative_path, exists=False, status=None, claim_boundary=None, reopen_condition=None
        )
    text = full_path.read_text(encoding="utf-8", errors="replace")
    return ArtifactReadResult(
        path=repo_relative_path,
        exists=True,
        status=_extract_status_line(text),
        claim_boundary=_extract_claim_boundary_section(text),
        reopen_condition=_extract_reopen_condition(text),
    )


def default_resolve_commit(commit: str) -> CommitResolution:
    """Read-only commit resolver used by the CLI. Runs one local git query."""
    proc = subprocess.run(
        ["git", "cat-file", "-t", commit],
        cwd=REPO_ROOT,
        text=True,
        capture_output=True,
    )
    return CommitResolution(commit=commit, resolvable=(proc.returncode == 0 and proc.stdout.strip() == "commit"))


def build_odvr_readout(inputs: ComposerInputs) -> dict[str, Any]:
    """Pure deterministic composer. No file I/O happens in this function;
    all reads are performed by the injected `read_artifact`/`resolve_commit`
    callables, and all other data arrives already loaded in `inputs`.
    """
    source_anchors: list[str] = [inputs.session_anchor_path]

    current_mode = inputs.bootstrap_state.get("currentMode")
    active_handoff = inputs.bootstrap_state.get("activeHandoff")
    canonical_next_move = inputs.bootstrap_state.get("nextAllowedMove")

    if not isinstance(current_mode, str) or not current_mode:
        return _missing_source_result(source_anchors, inputs.session_anchor_path)
    if not isinstance(active_handoff, str) or not active_handoff:
        return _missing_source_result(source_anchors, inputs.session_anchor_path)
    if not isinstance(canonical_next_move, str) or not canonical_next_move:
        return _missing_source_result(source_anchors, inputs.session_anchor_path)

    if not inputs.entries:
        return _missing_source_result(source_anchors, "CVF_SESSION/state/entries/*.json (no eligible entry)")

    max_order = max(entry.state_order for entry in inputs.entries)
    top_candidates = [entry for entry in inputs.entries if entry.state_order == max_order]

    selected_pairs = [_select_artifact_field(candidate) for candidate in top_candidates]
    if any(pair is None for pair in selected_pairs):
        return _missing_source_result(
            source_anchors,
            "eligible entry has multiple governed artifact paths without a ratified role",
        )

    signatures = {
        (
            pair[1],
            candidate.value.get("status"),
            candidate.value.get("materialCommit"),
        )
        for candidate, pair in zip(top_candidates, selected_pairs)
        if pair is not None
    }
    if len(signatures) > 1:
        return _contradicted_result(
            source_anchors,
            current_mode,
            active_handoff,
            canonical_next_move,
            top_candidates,
        )

    selected = sorted(top_candidates, key=lambda candidate: candidate.state_key)[0]
    selected_pair = _select_artifact_field(selected)
    if selected_pair is None:
        return _missing_source_result(source_anchors, "unratified governed artifact role")
    field_name, artifact_path = selected_pair
    source_anchors.append(artifact_path)

    commit_resolution = inputs.resolve_commit(selected.value["materialCommit"])
    if not commit_resolution.resolvable:
        return _missing_source_result(
            source_anchors,
            f"unresolved materialCommit `{selected.value['materialCommit']}` for entry `{selected.state_key}`",
        )

    artifact = inputs.read_artifact(artifact_path)
    if not artifact.exists:
        return _missing_source_result(source_anchors, artifact_path)

    entry_status = selected.value.get("status")
    artifact_status = artifact.status
    status_mismatch = (
        isinstance(entry_status, str)
        and isinstance(artifact_status, str)
        and entry_status != artifact_status
    )

    aggregate_freshness = CURRENT
    stale_anchors: list[str] = []
    if not inputs.generator_drift_clean:
        aggregate_freshness = STALE
        stale_anchors.append(inputs.session_anchor_path)
    if status_mismatch:
        aggregate_freshness = STALE
        stale_anchors.append(artifact_path)

    entry_claim_boundary = selected.value.get("claimBoundary")
    claim_boundary = entry_claim_boundary if isinstance(entry_claim_boundary, str) and entry_claim_boundary else artifact.claim_boundary
    if not claim_boundary:
        return _missing_source_result(source_anchors, f"{artifact_path} (## Claim Boundary section)")

    terminal_value_verdict = _classify_value_verdict(entry_status if isinstance(entry_status, str) else artifact_status)

    entry_next_move = selected.value.get("nextAllowedMove")
    parked_or_blocked = _extract_parked_or_blocked(
        [canonical_next_move, entry_next_move if isinstance(entry_next_move, str) else None]
    )

    reopen_condition = artifact.reopen_condition

    result: dict[str, Any] = {
        "contractVersion": CONTRACT_VERSION,
        "currentMode": current_mode,
        "activeHandoff": active_handoff,
        "latestMaterialDecision": {
            "artifactPath": artifact_path,
            "status": entry_status if isinstance(entry_status, str) else (artifact_status or "UNKNOWN"),
            "materialCommit": selected.value["materialCommit"],
            "stateOrder": selected.state_order,
        },
        "terminalValueVerdict": terminal_value_verdict,
        "claimBoundary": claim_boundary,
        "canonicalNextAllowedMove": canonical_next_move,
        "sourceAnchors": _dedupe(source_anchors),
        "aggregateFreshness": aggregate_freshness,
    }
    if parked_or_blocked:
        result["parkedOrBlockedConditions"] = parked_or_blocked
    if reopen_condition:
        result["reopenCondition"] = reopen_condition
    if aggregate_freshness == STALE and stale_anchors:
        result["staleSourceAnchors"] = _dedupe(stale_anchors)
    return result


def _missing_source_result(
    source_anchors: list[str],
    missing_anchor: str,
) -> dict[str, Any]:
    return {
        "contractVersion": CONTRACT_VERSION,
        "currentMode": "UNKNOWN",
        "activeHandoff": "UNKNOWN",
        "latestMaterialDecision": {
            "artifactPath": missing_anchor,
            "status": "UNKNOWN",
            "materialCommit": "0" * 8,
            "stateOrder": 0,
        },
        "terminalValueVerdict": None,
        "claimBoundary": "UNKNOWN",
        "canonicalNextAllowedMove": "UNKNOWN",
        "sourceAnchors": _dedupe(source_anchors + [missing_anchor]),
        "aggregateFreshness": MISSING_SOURCE,
        "missingSourceAnchor": missing_anchor,
    }


def _contradicted_result(
    source_anchors: list[str],
    current_mode: str,
    active_handoff: str,
    canonical_next_move: str,
    candidates: list[EligibleEntry],
) -> dict[str, Any]:
    anchors = []
    for candidate in candidates:
        selected_pair = _select_artifact_field(candidate)
        artifact_path = selected_pair[1] if selected_pair is not None else "UNKNOWN"
        source_anchors.append(artifact_path)
        anchors.append(
            {
                "sourcePath": artifact_path,
                "value": {
                    "status": candidate.value.get("status", "UNKNOWN"),
                    "materialCommit": candidate.value.get("materialCommit"),
                    "stateOrder": candidate.state_order,
                },
            }
        )
    first_path = anchors[0]["sourcePath"]
    return {
        "contractVersion": CONTRACT_VERSION,
        "currentMode": current_mode,
        "activeHandoff": active_handoff,
        "latestMaterialDecision": {
            "artifactPath": first_path,
            "status": anchors[0]["value"]["status"],
            "materialCommit": anchors[0]["value"]["materialCommit"],
            "stateOrder": candidates[0].state_order,
        },
        "terminalValueVerdict": None,
        "claimBoundary": (
            "Two or more equal-stateOrder eligible entries disagree; see contradictions for both anchors."
        ),
        "canonicalNextAllowedMove": canonical_next_move,
        "sourceAnchors": _dedupe(source_anchors),
        "aggregateFreshness": CONTRADICTED,
        "contradictions": [
            {
                "field": "latestMaterialDecision",
                "anchors": anchors,
            }
        ],
    }


def _classify_value_verdict(status: str | None) -> str | None:
    if not isinstance(status, str):
        return None
    if status in _KNOWN_NON_VERDICT_TOKENS:
        return None
    if not _VALUE_VERDICT_TOKEN_RE.fullmatch(status):
        return None
    if "VALUE" in status.split("_") or status == "BLOCKED_LIVE_PROVIDER":
        return status
    return None


def _extract_parked_or_blocked(texts: list[str | None]) -> list[str]:
    pattern = re.compile(
        r"\b(parked|held|not authorized|no Local Workspace Runtime|no Local Runtime|"
        r"no provider|no public-sync|no readiness)\b",
        re.IGNORECASE,
    )
    found: list[str] = []
    seen: set[str] = set()
    for text in texts:
        if not text:
            continue
        for sentence in re.split(r"(?<=\.)\s+", text):
            sentence = sentence.strip()
            if not sentence or not pattern.search(sentence):
                continue
            key = sentence.lower()
            if key in seen:
                continue
            seen.add(key)
            found.append(sentence)
    return found[:6]


def _dedupe(items: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for item in items:
        if item in seen:
            continue
        seen.add(item)
        result.append(item)
    return result


def load_bootstrap_state(bootstrap_path: Path) -> dict[str, Any]:
    if not bootstrap_path.exists():
        return {}
    return json.loads(bootstrap_path.read_text(encoding="utf-8"))


def load_raw_entries(entries_dir: Path) -> list[dict[str, Any]]:
    if not entries_dir.exists():
        return []
    entries: list[dict[str, Any]] = []
    for path in sorted(entries_dir.glob("*.json")):
        entries.append(json.loads(path.read_text(encoding="utf-8")))
    return entries


def check_generator_drift() -> bool:
    """Return True when the generated state has zero drift. Read-only: runs
    the existing generator's --check mode, which itself performs no writes.
    """
    proc = subprocess.run(
        [sys.executable, str(GENERATOR_SCRIPT), "--check"],
        cwd=REPO_ROOT,
        text=True,
        capture_output=True,
    )
    return proc.returncode == 0


def compose_from_repository() -> dict[str, Any]:
    """CLI-facing entry point: loads canonical repository-local inputs
    read-only, then delegates to the pure composer. Performs no writes.
    """
    bootstrap_path = REPO_ROOT / "CVF_SESSION" / "ACTIVE_SESSION_BOOTSTRAP_READ_MODEL.json"
    bootstrap_state = load_bootstrap_state(bootstrap_path)
    raw_entries = load_raw_entries(ENTRIES_DIR)
    eligible_entries = find_eligible_entries(raw_entries)
    drift_clean = check_generator_drift()

    inputs = ComposerInputs(
        bootstrap_state=bootstrap_state,
        entries=tuple(eligible_entries),
        read_artifact=default_read_artifact,
        resolve_commit=default_resolve_commit,
        generator_drift_clean=drift_clean,
    )
    return build_odvr_readout(inputs)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="CVF ODVR-T1 deterministic local read-only readout composer (no writes, no provider calls)."
    )
    parser.add_argument("--json", action="store_true", help="Print the readout as JSON to stdout (default).")
    args = parser.parse_args()
    del args  # only --json is supported and it is the default behavior

    try:
        readout = compose_from_repository()
    except OdvrReadoutError as exc:
        print(json.dumps({"error": str(exc)}), file=sys.stderr)
        return 2

    print(json.dumps(readout, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
