#!/usr/bin/env python3
"""Fail-closed SCEC chain-state and declared-evidence-shape checker."""
from __future__ import annotations
import argparse
import hashlib
import json
import re
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path, PurePosixPath
from typing import Any
REPO_ROOT = Path(__file__).resolve().parents[2]
THIS_CHECKER_PATH = "governance/compat/check_semantic_convergence_control.py"
STANDARD_PATH = (
    "docs/reference/semantic_convergence_control/"
    "CVF_SEMANTIC_CONVERGENCE_AND_ESCALATION_CONTROL_STANDARD.md"
)
SCEC_SCHEMA_VERSION = "cvf.semanticConvergenceControl.v1"
ALLOWED_CHAIN_MODES = ("INITIAL", "SUCCESSOR")
ALLOWED_CLAIM_CLASSES = (
    "CONCURRENCY_EXACTLY_ONCE", "CRASH_RECOVERY", "ORDERING",
    "SCHEMA_COMPATIBILITY", "DOCUMENTATION_ONLY", "OTHER",
)
CLAIM_TO_PROOF_MINIMUM = {
    "CONCURRENCY_EXACTLY_ONCE": "EXECUTABLE_ADVERSARIAL_CONCURRENCY_TEST",
    "CRASH_RECOVERY": "EXECUTABLE_STATE_TRANSITION_CRASH_TEST",
    "ORDERING": "EXECUTABLE_SEQUENCE_ASSERTION",
    "SCHEMA_COMPATIBILITY": "EXECUTABLE_BUILDER_VALIDATOR_CONTRACT_TEST",
    "DOCUMENTATION_ONLY": "PROPOSAL_ONLY_NO_RUNTIME_READINESS",
}
DOCUMENTATION_ONLY_PROOF = "PROPOSAL_ONLY_NO_RUNTIME_READINESS"
ALLOWED_DISPOSITIONS = (
    "CONTINUE_BOUNDED", "ROOT_CONTRACT_REQUIRED",
    "STOP_REASSESS_ARCHITECTURE", "READY_WITH_EXECUTABLE_PROOF",
)
ESCALATED_DISPOSITIONS = ("ROOT_CONTRACT_REQUIRED", "STOP_REASSESS_ARCHITECTURE")
ESCALATION_SATISFYING_DISPOSITIONS = ESCALATED_DISPOSITIONS + ("READY_WITH_EXECUTABLE_PROOF",)
ALLOWED_SUCCESSOR_SCOPES = (
    "INITIAL_BOUNDED", "INTEGRATED_ROOT_CONTRACT", "NO_SUCCESSOR",
    "EXECUTABLE_IMPLEMENTATION",
)
NON_NARROW_SUCCESSOR_SCOPES = (
    "INTEGRATED_ROOT_CONTRACT", "NO_SUCCESSOR", "EXECUTABLE_IMPLEMENTATION",
)
REQUIRED_TOP_FIELDS = (
    "schemaVersion", "problemKey", "chainMode", "chainOrdinal", "predecessor",
    "blockerDelta", "counters", "claims", "requiredDisposition", "successorScope",
)
REQUIRED_BLOCKER_DELTA_FIELDS = (
    "prior", "resolved", "retained", "new", "reopened", "current",
)
REQUIRED_COUNTER_FIELDS = (
    "partialReadyClosures", "reviewerScopeExpansions", "sameClaimCorrections",
    "nonDecreasingBlockerTransitions",
)
REQUIRED_CLAIM_FIELDS = ("claimId", "claimClass", "proofClass", "evidenceRef")
# Resolution-evidence binding (invariant 13 of the standard).
ALLOWED_RESOLUTION_EVIDENCE_CLASSES = ("ACCEPTED_REVIEW", "EXECUTABLE_PROOF")
REQUIRED_RESOLUTION_EVIDENCE_FIELDS = (
    "evidenceClass", "evidencePath", "sha256", "locator",
)
# Escalation trigger thresholds (invariants 5 and 6 of the standard).
ROOT_CONTRACT_PARTIAL_READY_THRESHOLD = 2
ROOT_CONTRACT_SCOPE_EXPANSION_THRESHOLD = 1
ROOT_CONTRACT_SAME_CLAIM_CORRECTION_THRESHOLD = 2
STOP_REASSESS_NON_DECREASING_THRESHOLD = 2
UNRESOLVED_PREDECESSOR_SENTINEL = "SCEC_PREDECESSOR_HASH_UNRESOLVED"
OPEN_FENCE_LINE_RE = re.compile(r"^ {0,3}(`{3,})([^`]*)$")
CLOSE_FENCE_LINE_RE = re.compile(r"^ {0,3}(`{3,})[ \t]*$")
SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
WINDOWS_DRIVE_RE = re.compile(r"^[A-Za-z]:")
@dataclass(frozen=True)
class BlockViolation:
    """One structural or semantic violation of an active SCEC block."""
    code: str
    message: str
@dataclass(frozen=True)
class ValidationResult:
    """Outcome of validating a single parsed candidate JSON object."""
    is_active: bool
    violations: tuple[BlockViolation, ...] = field(default_factory=tuple)
    @property
    def is_valid(self) -> bool:
        return self.is_active and not self.violations
def is_active_block(candidate: Any) -> bool:
    """True only for a real dict with the exact SCEC schema field; a quoted/
    example marker or non-dict JSON scalar must never activate (invariant 11).
    """
    return isinstance(candidate, dict) and candidate.get("schemaVersion") == SCEC_SCHEMA_VERSION
def _is_str_list(value: Any) -> bool:
    return isinstance(value, list) and all(isinstance(item, str) for item in value)
def _is_safe_repo_relative_path(value: str) -> bool:
    """Reject absolute, drive-qualified, backslash, and traversal paths."""
    if not value or "\\" in value or value.startswith("/") or WINDOWS_DRIVE_RE.match(value):
        return False
    parts = PurePosixPath(value).parts
    return bool(parts) and all(part not in ("", ".", "..") for part in parts)
def _validate_top_shape(block: dict) -> list[BlockViolation]:
    violations: list[BlockViolation] = []
    for field_name in REQUIRED_TOP_FIELDS:
        if field_name not in block:
            violations.append(BlockViolation('MISSING_FIELD', f'missing required field `{field_name}`'))
    if violations:
        # Structural prerequisites absent; deeper checks would raise.
        return violations
    if not isinstance(block["problemKey"], str) or not block["problemKey"].strip():
        violations.append(BlockViolation("INVALID_PROBLEM_KEY", "`problemKey` must be a non-empty string"))
    if block["chainMode"] not in ALLOWED_CHAIN_MODES:
        violations.append(BlockViolation('INVALID_CHAIN_MODE',
            f"`chainMode` must be one of {ALLOWED_CHAIN_MODES}, got {block['chainMode']!r}"))
    ordinal = block["chainOrdinal"]
    if not isinstance(ordinal, int) or isinstance(ordinal, bool) or ordinal < 0:
        violations.append(BlockViolation('INVALID_ORDINAL', '`chainOrdinal` must be a non-negative integer'))
    predecessor = block["predecessor"]
    if block.get("chainMode") == "INITIAL":
        if predecessor is not None:
            violations.append(BlockViolation('INITIAL_HAS_PREDECESSOR', '`INITIAL` chainMode requires `predecessor: null`'))
        if isinstance(ordinal, int) and not isinstance(ordinal, bool) and ordinal != 0:
            violations.append(BlockViolation('INITIAL_NONZERO_ORDINAL', '`INITIAL` chainMode requires `chainOrdinal: 0`'))
    elif block.get("chainMode") == "SUCCESSOR":
        if not isinstance(predecessor, dict):
            violations.append(BlockViolation('SUCCESSOR_MISSING_PREDECESSOR',
                '`SUCCESSOR` chainMode requires a `predecessor` object with `path` and `sha256`'))
        else:
            path = predecessor.get("path")
            sha = predecessor.get("sha256")
            if not isinstance(path, str) or not path.strip():
                violations.append(BlockViolation('PREDECESSOR_MISSING_PATH', '`predecessor.path` must be a non-empty string'))
            elif not _is_safe_repo_relative_path(path):
                violations.append(BlockViolation('PREDECESSOR_PATH_OUTSIDE_REPOSITORY',
                    '`predecessor.path` must be a normalized repository-relative path without traversal'))
            if path == UNRESOLVED_PREDECESSOR_SENTINEL or sha == UNRESOLVED_PREDECESSOR_SENTINEL:
                violations.append(
                    BlockViolation(
                        "PREDECESSOR_UNRESOLVED_SENTINEL",
                        f"predecessor fact is the explicit unresolved sentinel `{UNRESOLVED_PREDECESSOR_SENTINEL}`; "
                        "this must fail pre-dispatch, never be treated as valid evidence",
                    )
                )
            elif not isinstance(sha, str) or not SHA256_RE.match(sha):
                violations.append(BlockViolation('PREDECESSOR_INVALID_HASH_SHAPE',
                    '`predecessor.sha256` must be a 64-character lowercase hex SHA-256 string'))
    blocker_delta = block["blockerDelta"]
    if not isinstance(blocker_delta, dict):
        violations.append(BlockViolation("INVALID_BLOCKER_DELTA", "`blockerDelta` must be an object"))
    else:
        for field_name in REQUIRED_BLOCKER_DELTA_FIELDS:
            if field_name not in blocker_delta:
                violations.append(BlockViolation('MISSING_BLOCKER_DELTA_FIELD',
                    f'`blockerDelta` missing required field `{field_name}`'))
            elif not _is_str_list(blocker_delta[field_name]):
                violations.append(BlockViolation('INVALID_BLOCKER_DELTA_FIELD_TYPE',
                    f'`blockerDelta.{field_name}` must be an array of strings'))
            elif len(blocker_delta[field_name]) != len(set(blocker_delta[field_name])):
                violations.append(BlockViolation('DUPLICATE_BLOCKER_ID',
                    f'`blockerDelta.{field_name}` must not contain duplicate blocker IDs'))
    counters = block["counters"]
    if not isinstance(counters, dict):
        violations.append(BlockViolation("INVALID_COUNTERS", "`counters` must be an object"))
    else:
        for field_name in REQUIRED_COUNTER_FIELDS:
            value = counters.get(field_name)
            if field_name not in counters:
                violations.append(BlockViolation('MISSING_COUNTER_FIELD', f'`counters` missing required field `{field_name}`'))
            elif not isinstance(value, int) or isinstance(value, bool) or value < 0:
                violations.append(BlockViolation('INVALID_COUNTER_VALUE',
                    f'`counters.{field_name}` must be a non-negative integer'))
    claims = block["claims"]
    if not isinstance(claims, list):
        violations.append(BlockViolation("INVALID_CLAIMS", "`claims` must be an array"))
    else:
        for index, claim in enumerate(claims):
            if not isinstance(claim, dict):
                violations.append(BlockViolation('INVALID_CLAIM_SHAPE', f'claims[{index}] must be an object'))
                continue
            for field_name in REQUIRED_CLAIM_FIELDS:
                value = claim.get(field_name)
                if field_name not in claim or not isinstance(value, str) or not value.strip():
                    violations.append(BlockViolation('MISSING_CLAIM_FIELD',
                        f'claims[{index}] missing non-empty string field `{field_name}`'))
    if block["requiredDisposition"] not in ALLOWED_DISPOSITIONS:
        violations.append(BlockViolation('INVALID_DISPOSITION',
            f"`requiredDisposition` must be one of {ALLOWED_DISPOSITIONS}, got {block['requiredDisposition']!r}"))
    if block["successorScope"] not in ALLOWED_SUCCESSOR_SCOPES:
        violations.append(BlockViolation('INVALID_SUCCESSOR_SCOPE',
            f"`successorScope` must be one of {ALLOWED_SUCCESSOR_SCOPES}, got {block['successorScope']!r}"))
    return violations
def _validate_set_reconciliation(block: dict) -> list[BlockViolation]:
    """Invariants 3 and 4: set algebra, disjointness, no silent disappearance."""
    violations: list[BlockViolation] = []
    delta = block.get("blockerDelta")
    if not isinstance(delta, dict):
        return violations
    try:
        prior = set(delta["prior"])
        resolved = set(delta["resolved"])
        retained = set(delta["retained"])
        new = set(delta["new"])
        reopened = set(delta["reopened"])
        current = set(delta["current"])
    except (KeyError, TypeError):
        return violations
    if prior != resolved | retained:
        violations.append(BlockViolation('SET_RECONCILIATION_PRIOR', '`prior` must equal exactly `resolved` union `retained`'))
    if current != retained | new | reopened:
        violations.append(BlockViolation('SET_RECONCILIATION_CURRENT',
            '`current` must equal exactly `retained` union `new` union `reopened`'))
    if resolved & retained:
        violations.append(BlockViolation('BLOCKER_SET_NOT_DISJOINT',
            f'`resolved` and `retained` must be disjoint; overlap: {sorted(resolved & retained)}'))
    if retained & new:
        violations.append(BlockViolation('BLOCKER_SET_NOT_DISJOINT',
            f'`retained` and `new` must be disjoint; overlap: {sorted(retained & new)}'))
    if retained & reopened:
        violations.append(BlockViolation('BLOCKER_SET_NOT_DISJOINT',
            f'`retained` and `reopened` must be disjoint; overlap: {sorted(retained & reopened)}'))
    if new & reopened:
        violations.append(BlockViolation('BLOCKER_SET_NOT_DISJOINT',
            f'`new` and `reopened` must be disjoint; overlap: {sorted(new & reopened)}'))
    silently_disappeared = prior - resolved - retained
    if silently_disappeared:
        violations.append(BlockViolation('SILENT_BLOCKER_DISAPPEARANCE',
            f'blocker(s) present in `prior` but absent from both `resolved` and `retained`: {sorted(silently_disappeared)}'))
    return violations
def _validate_escalation_triggers(block: dict) -> list[BlockViolation]:
    """Invariants 5, 6, and 7."""
    violations: list[BlockViolation] = []
    counters = block.get("counters")
    disposition = block.get("requiredDisposition")
    successor_scope = block.get("successorScope")
    if not isinstance(counters, dict):
        return violations
    partial_ready = counters.get("partialReadyClosures", 0)
    scope_expansions = counters.get("reviewerScopeExpansions", 0)
    same_claim = counters.get("sameClaimCorrections", 0)
    non_decreasing = counters.get("nonDecreasingBlockerTransitions", 0)
    root_contract_required = (
        isinstance(partial_ready, int) and partial_ready >= ROOT_CONTRACT_PARTIAL_READY_THRESHOLD
    ) or (
        isinstance(scope_expansions, int) and scope_expansions >= ROOT_CONTRACT_SCOPE_EXPANSION_THRESHOLD
    ) or (
        isinstance(same_claim, int) and same_claim >= ROOT_CONTRACT_SAME_CLAIM_CORRECTION_THRESHOLD
    )
    stop_reassess_required = (
        isinstance(non_decreasing, int) and non_decreasing >= STOP_REASSESS_NON_DECREASING_THRESHOLD
    )
    if stop_reassess_required and disposition != "STOP_REASSESS_ARCHITECTURE":
        violations.append(
            BlockViolation(
                "MISSING_STOP_REASSESS_ESCALATION",
                "two or more consecutive non-decreasing blocker transitions require "
                "`requiredDisposition: STOP_REASSESS_ARCHITECTURE`",
            )
        )
    elif root_contract_required and disposition not in ESCALATION_SATISFYING_DISPOSITIONS:
        violations.append(
            BlockViolation(
                "MISSING_ROOT_CONTRACT_ESCALATION",
                "two partial-ready closures, one reviewer scope expansion, or a repeated "
                "same-claim correction requires `requiredDisposition` to be "
                f"one of {ESCALATION_SATISFYING_DISPOSITIONS}",
            )
        )
    escalated = disposition in ESCALATED_DISPOSITIONS or root_contract_required or stop_reassess_required
    if escalated and successor_scope == "INITIAL_BOUNDED":
        violations.append(
            BlockViolation(
                "NARROW_SUCCESSOR_AFTER_ESCALATION",
                "once escalation is required, `successorScope` must not be `INITIAL_BOUNDED`; "
                f"use one of {NON_NARROW_SUCCESSOR_SCOPES}",
            )
        )
    return violations
def _validate_runtime_readiness(block: dict) -> list[BlockViolation]:
    """Invariant 8: no runtime readiness from documentation-only proof."""
    violations: list[BlockViolation] = []
    if block.get("requiredDisposition") != "READY_WITH_EXECUTABLE_PROOF":
        return violations
    claims = block.get("claims")
    if not isinstance(claims, list):
        return violations
    for index, claim in enumerate(claims):
        if not isinstance(claim, dict):
            continue
        if claim.get("proofClass") == DOCUMENTATION_ONLY_PROOF:
            violations.append(
                BlockViolation(
                    "RUNTIME_READINESS_FROM_DOC_ONLY_PROOF",
                    f"claims[{index}] uses `{DOCUMENTATION_ONLY_PROOF}` proof but "
                    "`requiredDisposition` is `READY_WITH_EXECUTABLE_PROOF`",
                )
            )
    return violations
def _validate_claim_to_proof_mapping(block: dict) -> list[BlockViolation]:
    """Invariant 9."""
    violations: list[BlockViolation] = []
    claims = block.get("claims")
    if not isinstance(claims, list):
        return violations
    for index, claim in enumerate(claims):
        if not isinstance(claim, dict):
            continue
        claim_class = claim.get("claimClass")
        proof_class = claim.get("proofClass")
        if claim_class not in ALLOWED_CLAIM_CLASSES:
            violations.append(BlockViolation('INVALID_CLAIM_CLASS',
                f'claims[{index}].claimClass must be one of {ALLOWED_CLAIM_CLASSES}, got {claim_class!r}'))
            continue
        if claim_class == "OTHER":
            if proof_class != "NAMED_OBSERVABLE_PROOF":
                violations.append(BlockViolation('CLAIM_TO_PROOF_MAPPING_VIOLATION',
                    f'claims[{index}] with claimClass `OTHER` requires proofClass `NAMED_OBSERVABLE_PROOF`, got {proof_class!r}'))
            continue
        minimum = CLAIM_TO_PROOF_MINIMUM[claim_class]
        if proof_class != minimum:
            violations.append(BlockViolation('CLAIM_TO_PROOF_MAPPING_VIOLATION',
                f'claims[{index}] with claimClass `{claim_class}` requires proofClass `{minimum}`, got {proof_class!r}'))
    return violations
def _validate_ready_scope_pairing(block: dict) -> list[BlockViolation]:
    """Prevent vacuous or mismatched executable-readiness declarations."""
    violations: list[BlockViolation] = []
    disposition = block.get("requiredDisposition")
    scope = block.get("successorScope")
    claims = block.get("claims")
    if disposition == "READY_WITH_EXECUTABLE_PROOF":
        if scope != "EXECUTABLE_IMPLEMENTATION":
            violations.append(BlockViolation('READY_SCOPE_MISMATCH',
                '`READY_WITH_EXECUTABLE_PROOF` requires `successorScope: EXECUTABLE_IMPLEMENTATION`'))
        if not isinstance(claims, list) or not claims:
            violations.append(BlockViolation('READY_WITHOUT_CLAIMS',
                '`READY_WITH_EXECUTABLE_PROOF` requires at least one claim with executable proof'))
    elif scope == "EXECUTABLE_IMPLEMENTATION":
        violations.append(BlockViolation('EXECUTABLE_SCOPE_WITHOUT_READY_DISPOSITION',
            '`successorScope: EXECUTABLE_IMPLEMENTATION` requires `READY_WITH_EXECUTABLE_PROOF`'))
    return violations
def _claim_ids(block: dict) -> set[str]:
    claims = block.get("claims")
    if not isinstance(claims, list):
        return set()
    return {
        claim["claimId"]
        for claim in claims
        if isinstance(claim, dict)
        and isinstance(claim.get("claimId"), str)
        and claim.get("claimId")
    }
def _claim_proof_class(block: dict, claim_id: str) -> str | None:
    claims = block.get("claims")
    if not isinstance(claims, list):
        return None
    for claim in claims:
        if isinstance(claim, dict) and claim.get("claimId") == claim_id:
            return claim.get("proofClass")
    return None
def _decode_strict_utf8(content: bytes) -> str | None:
    try:
        return content.decode("utf-8")
    except UnicodeDecodeError:
        return None
def _validate_resolution_evidence(
    block: dict,
    evidence_bytes_resolver: Any = None,
    evidence_snapshot_cache: dict[str, bytes | None] | None = None,
) -> list[BlockViolation]:
    """Invariant 13: bind every resolved blocker to one immutable evidence record."""
    violations: list[BlockViolation] = []
    delta = block.get("blockerDelta")
    if not isinstance(delta, dict):
        return violations
    resolved = delta.get("resolved")
    if not _is_str_list(resolved):
        return violations
    resolved_set = set(resolved)
    evidence = block.get("resolutionEvidence")
    if evidence is None:
        evidence = {}
    if not isinstance(evidence, dict):
        violations.append(
            BlockViolation(
                "RESOLUTION_EVIDENCE_INVALID_TYPE",
                "`resolutionEvidence` must be an object keyed by blocker ID",
            )
        )
        return violations
    for blocker_id in sorted(resolved_set - set(evidence)):
        violations.append(
            BlockViolation(
                "RESOLUTION_EVIDENCE_MISSING_BINDING",
                f"resolved blocker `{blocker_id}` has no resolution-evidence binding",
            )
        )
    for blocker_id in sorted(set(evidence) - resolved_set):
        violations.append(
            BlockViolation(
                "RESOLUTION_EVIDENCE_EXTRA_BINDING",
                f"resolution-evidence key `{blocker_id}` is not present in `blockerDelta.resolved`",
            )
        )
    claim_ids = _claim_ids(block)
    for blocker_id in sorted(resolved_set & set(evidence)):
        binding = evidence[blocker_id]
        if not isinstance(binding, dict):
            violations.append(
                BlockViolation(
                    "RESOLUTION_EVIDENCE_INVALID_BINDING_SHAPE",
                    f"resolution-evidence binding for `{blocker_id}` must be an object",
                )
            )
            continue
        missing_fields = [f for f in REQUIRED_RESOLUTION_EVIDENCE_FIELDS if f not in binding]
        for field_name in missing_fields:
            violations.append(
                BlockViolation(
                    "RESOLUTION_EVIDENCE_MISSING_BINDING_FIELD",
                    f"resolution-evidence binding for `{blocker_id}` missing field `{field_name}`",
                )
            )
        evidence_class = binding.get("evidenceClass")
        if evidence_class not in ALLOWED_RESOLUTION_EVIDENCE_CLASSES:
            violations.append(
                BlockViolation(
                    "RESOLUTION_EVIDENCE_INVALID_EVIDENCE_CLASS",
                    f"resolution-evidence binding for `{blocker_id}` has invalid "
                    f"`evidenceClass` {evidence_class!r}; expected one of "
                    f"{ALLOWED_RESOLUTION_EVIDENCE_CLASSES}",
                )
            )
            continue
        path = binding.get("evidencePath")
        if not isinstance(path, str) or not path.strip():
            violations.append(
                BlockViolation(
                    "RESOLUTION_EVIDENCE_EMPTY_PATH",
                    f"resolution-evidence binding for `{blocker_id}` must carry a non-empty `evidencePath`",
                )
            )
        elif not _is_safe_repo_relative_path(path):
            violations.append(
                BlockViolation(
                    "RESOLUTION_EVIDENCE_PATH_UNSAFE",
                    f"resolution-evidence path `{path}` for `{blocker_id}` must be a "
                    "normalized repository-relative path without traversal",
                )
            )
        sha = binding.get("sha256")
        if not isinstance(sha, str) or not SHA256_RE.match(sha):
            violations.append(
                BlockViolation(
                    "RESOLUTION_EVIDENCE_INVALID_HASH_SHAPE",
                    f"resolution-evidence binding for `{blocker_id}` must carry a "
                    "64-character lowercase hex `sha256`",
                )
            )
        locator = binding.get("locator")
        if not isinstance(locator, str) or not locator.strip():
            violations.append(
                BlockViolation(
                    "RESOLUTION_EVIDENCE_EMPTY_LOCATOR",
                    f"resolution-evidence binding for `{blocker_id}` must carry a non-empty `locator`",
                )
            )
        elif locator != locator.strip():
            violations.append(
                BlockViolation(
                    "RESOLUTION_EVIDENCE_LOCATOR_NON_CANONICAL",
                    f"resolution-evidence locator `{locator!r}` for `{blocker_id}` must equal "
                    "its own trimmed form (no leading or trailing whitespace)",
                )
            )
        claim_id = binding.get("claimId")
        if claim_id is not None:
            if not isinstance(claim_id, str) or not claim_id.strip() or claim_id not in claim_ids:
                violations.append(
                    BlockViolation(
                        "RESOLUTION_EVIDENCE_INVALID_CLAIM_LINK",
                        f"resolution-evidence binding for `{blocker_id}` links `claimId` "
                        f"{claim_id!r} which does not name a claim in this block",
                    )
                )
        if evidence_class == "EXECUTABLE_PROOF":
            if not (isinstance(claim_id, str) and claim_id.strip() and claim_id in claim_ids):
                if claim_id is None:
                    violations.append(
                        BlockViolation(
                            "RESOLUTION_EVIDENCE_EXECUTABLE_MISSING_CLAIM_LINK",
                            f"EXECUTABLE_PROOF resolution for `{blocker_id}` must link a "
                            "`claimId` to a claim in this block",
                        )
                    )
            elif _claim_proof_class(block, claim_id) == DOCUMENTATION_ONLY_PROOF:
                violations.append(
                    BlockViolation(
                        "RESOLUTION_EVIDENCE_NON_EXECUTABLE_CLAIM_LINK",
                        f"EXECUTABLE_PROOF resolution for `{blocker_id}` links claim "
                        f"`{claim_id}` whose proofClass is `{DOCUMENTATION_ONLY_PROOF}`",
                    )
                )
        if (
            evidence_bytes_resolver is not None
            and isinstance(path, str)
            and _is_safe_repo_relative_path(path)
            and isinstance(sha, str)
            and SHA256_RE.match(sha)
        ):
            if evidence_snapshot_cache is not None and path in evidence_snapshot_cache:
                content = evidence_snapshot_cache[path]
            else:
                content = evidence_bytes_resolver(path)
                if evidence_snapshot_cache is not None:
                    evidence_snapshot_cache[path] = content
            if content is None:
                violations.append(
                    BlockViolation(
                        "RESOLUTION_EVIDENCE_PATH_UNREADABLE",
                        f"resolution-evidence path `{path}` for `{blocker_id}` could not be read",
                    )
                )
            else:
                computed_hash = hashlib.sha256(content).hexdigest()
                if computed_hash != sha:
                    violations.append(
                        BlockViolation(
                            "RESOLUTION_EVIDENCE_HASH_MISMATCH",
                            f"declared sha256 `{sha}` for `{blocker_id}` does not match "
                            f"recomputed hash `{computed_hash}`",
                        )
                    )
                else:
                    decoded = _decode_strict_utf8(content)
                    if decoded is None:
                        violations.append(
                            BlockViolation(
                                "RESOLUTION_EVIDENCE_CONTENT_DECODE_FAILED",
                                f"resolution-evidence path `{path}` for `{blocker_id}` is not "
                                "valid strict UTF-8; locator content cannot be resolved",
                            )
                        )
                    elif isinstance(locator, str) and locator == locator.strip() and locator:
                        count = decoded.count(locator)
                        if count == 0:
                            violations.append(
                                BlockViolation(
                                    "RESOLUTION_EVIDENCE_LOCATOR_NOT_FOUND",
                                    f"resolution-evidence locator `{locator!r}` for `{blocker_id}` "
                                    "does not occur in the hash-bound evidence content",
                                )
                            )
                        elif count > 1:
                            violations.append(
                                BlockViolation(
                                    "RESOLUTION_EVIDENCE_LOCATOR_AMBIGUOUS",
                                    f"resolution-evidence locator `{locator!r}` for `{blocker_id}` "
                                    f"occurs {count} times; it must occur exactly once",
                                )
                            )
    return violations
def _validate_predecessor_state(block: dict, predecessor_block: dict) -> list[BlockViolation]:
    """Validate state continuity against the actual predecessor SCEC block."""
    violations: list[BlockViolation] = []
    if predecessor_block.get("problemKey") != block.get("problemKey"):
        violations.append(BlockViolation('PREDECESSOR_PROBLEM_KEY_MISMATCH',
            "successor `problemKey` must equal the predecessor block's `problemKey`"))
    predecessor_ordinal = predecessor_block.get("chainOrdinal")
    ordinal = block.get("chainOrdinal")
    if not isinstance(predecessor_ordinal, int) or isinstance(predecessor_ordinal, bool):
        violations.append(BlockViolation('PREDECESSOR_INVALID_ORDINAL',
            'predecessor block must carry a valid integer `chainOrdinal`'))
    elif ordinal != predecessor_ordinal + 1:
        violations.append(BlockViolation('PREDECESSOR_ORDINAL_DISCONTINUITY',
            f'successor ordinal must equal predecessor ordinal + 1 ({predecessor_ordinal + 1})'))
    predecessor_delta = predecessor_block.get("blockerDelta")
    current_delta = block.get("blockerDelta")
    if isinstance(predecessor_delta, dict) and isinstance(current_delta, dict):
        predecessor_current = predecessor_delta.get("current")
        successor_prior = current_delta.get("prior")
        if _is_str_list(predecessor_current) and _is_str_list(successor_prior):
            if set(predecessor_current) != set(successor_prior):
                violations.append(BlockViolation('PREDECESSOR_BLOCKER_STATE_MISMATCH',
                    'successor `blockerDelta.prior` must equal predecessor `blockerDelta.current`'))
    predecessor_counters = predecessor_block.get("counters")
    counters = block.get("counters")
    if isinstance(predecessor_counters, dict) and isinstance(counters, dict):
        for field_name in (
            "partialReadyClosures",
            "reviewerScopeExpansions",
            "sameClaimCorrections",
        ):
            previous = predecessor_counters.get(field_name)
            current = counters.get(field_name)
            if isinstance(previous, int) and isinstance(current, int) and current < previous:
                violations.append(BlockViolation('PREDECESSOR_COUNTER_RESET',
                    f'`counters.{field_name}` must not decrease from predecessor value {previous}'))
        previous_streak = predecessor_counters.get("nonDecreasingBlockerTransitions")
        current_streak = counters.get("nonDecreasingBlockerTransitions")
        if (
            isinstance(previous_streak, int)
            and isinstance(current_streak, int)
            and isinstance(current_delta, dict)
            and _is_str_list(current_delta.get("prior"))
            and _is_str_list(current_delta.get("current"))
        ):
            transition_is_non_decreasing = len(set(current_delta["current"])) >= len(
                set(current_delta["prior"])
            )
            expected_streak = previous_streak + 1 if transition_is_non_decreasing else 0
            if current_streak != expected_streak:
                violations.append(
                    BlockViolation(
                        "NON_DECREASING_STREAK_MISMATCH",
                        "`counters.nonDecreasingBlockerTransitions` must equal the consecutive "
                        f"streak implied by predecessor/current blocker counts ({expected_streak})",
                    )
                )
    predecessor_disposition = predecessor_block.get("requiredDisposition")
    if predecessor_disposition == "STOP_REASSESS_ARCHITECTURE":
        violations.append(BlockViolation('SUCCESSOR_AFTER_STOP_REASSESS',
            'a `STOP_REASSESS_ARCHITECTURE` predecessor cannot have a successor in the same problem chain'))
    elif predecessor_disposition == "ROOT_CONTRACT_REQUIRED":
        if block.get("requiredDisposition") not in ESCALATION_SATISFYING_DISPOSITIONS:
            violations.append(BlockViolation('PREDECESSOR_ESCALATION_DROPPED',
                "successor must preserve or resolve the predecessor's root-contract escalation"))
        if block.get("successorScope") == "INITIAL_BOUNDED":
            violations.append(BlockViolation('PREDECESSOR_NARROW_SCOPE_REOPENED',
                'successor must not reopen a narrow scope after predecessor root-contract escalation'))
    return violations
def validate_block(
    block: dict,
    *,
    predecessor_hash_resolver: Any = None,
    predecessor_block_resolver: Any = None,
    evidence_bytes_resolver: Any = None,
    _evidence_snapshot_cache: dict[str, bytes | None] | None = None,
) -> ValidationResult:
    """Validate one already-parsed candidate SCEC block.
    `predecessor_hash_resolver`, if given, is a callable
    `(path: str) -> str | None` returning the recomputed SHA-256 hex digest of
    the predecessor artifact at `path`, or `None` if the path cannot be read.
    When omitted, predecessor hash cross-verification (invariant 2) is
    skipped, which is appropriate for pure-shape unit tests that supply their
    own already-consistent fixtures; the git-integration layer below always
    supplies a real resolver.
    `evidence_bytes_resolver`, if given, is a callable
    `(path: str) -> bytes | None` returning the raw evidence file bytes, or
    `None` if the path cannot be read. The same byte snapshot drives both the
    SHA-256 comparison and strict-UTF-8 locator resolution (invariant 13).
    When omitted, evidence content and locator cross-verification is skipped
    while shape validation still runs.
    """
    if not is_active_block(block):
        return ValidationResult(is_active=False)
    if evidence_bytes_resolver is not None and _evidence_snapshot_cache is None:
        _evidence_snapshot_cache = {}
    violations: list[BlockViolation] = []
    violations.extend(_validate_top_shape(block))
    # If top-shape is broken, downstream checks that assume shape would raise
    # or produce noise; report top-shape violations and stop there, which is
    # itself fail-closed (invariant 12).
    if violations:
        return ValidationResult(is_active=True, violations=tuple(violations))
    violations.extend(_validate_set_reconciliation(block))
    violations.extend(_validate_escalation_triggers(block))
    violations.extend(_validate_runtime_readiness(block))
    violations.extend(_validate_claim_to_proof_mapping(block))
    violations.extend(_validate_ready_scope_pairing(block))
    violations.extend(_validate_resolution_evidence(
        block, evidence_bytes_resolver, _evidence_snapshot_cache,
    ))
    if block.get("chainMode") == "SUCCESSOR" and predecessor_hash_resolver is not None:
        predecessor = block.get("predecessor")
        if isinstance(predecessor, dict):
            path = predecessor.get("path")
            declared_hash = predecessor.get("sha256")
            if isinstance(path, str) and isinstance(declared_hash, str) and SHA256_RE.match(declared_hash):
                resolved_hash = predecessor_hash_resolver(path)
                if resolved_hash is None:
                    violations.append(BlockViolation('PREDECESSOR_PATH_UNREADABLE',
                        f'predecessor path `{path}` could not be read to verify its SHA-256 hash'))
                elif resolved_hash != declared_hash:
                    violations.append(
                        BlockViolation(
                            "PREDECESSOR_HASH_MISMATCH",
                            f"declared predecessor sha256 `{declared_hash}` does not match "
                            f"recomputed hash `{resolved_hash}` of `{path}`",
                        )
                    )
            if predecessor_block_resolver is not None and isinstance(path, str):
                predecessor_blocks = predecessor_block_resolver(path)
                if predecessor_blocks is None:
                    violations.append(BlockViolation('PREDECESSOR_BLOCK_UNREADABLE',
                        f'predecessor path `{path}` could not be read for SCEC state continuity'))
                elif len(predecessor_blocks) != 1:
                    violations.append(BlockViolation('PREDECESSOR_BLOCK_COUNT_INVALID',
                        f'predecessor path `{path}` must contain exactly one active SCEC block; found {len(predecessor_blocks)}'))
                else:
                    # Revalidate immutable resolution evidence when consuming a
                    # predecessor. Otherwise a later evidence-target change
                    # could inherit trust silently through the chain.
                    predecessor_result = validate_block(
                        predecessor_blocks[0],
                        evidence_bytes_resolver=evidence_bytes_resolver,
                        _evidence_snapshot_cache=_evidence_snapshot_cache,
                    )
                    if predecessor_result.violations:
                        violations.append(
                            BlockViolation(
                                "PREDECESSOR_BLOCK_INVALID",
                                "predecessor active SCEC block is structurally invalid: "
                                + ", ".join(v.code for v in predecessor_result.violations),
                            )
                        )
                    else:
                        violations.extend(_validate_predecessor_state(block, predecessor_blocks[0]))
    return ValidationResult(is_active=True, violations=tuple(violations))
def _iter_fenced_blocks(text: str) -> list[tuple[str, str]]:
    """Yield `(language_tag, body)` per fenced block via an explicit
    open/close state machine, so a closing fence is never re-paired as a
    later block's opener (ADIF-0055 mixed-fence hardening).
    """
    blocks: list[tuple[str, str]] = []
    in_fence = False
    language = ""
    opening_width = 0
    body_lines: list[str] = []
    for line in text.splitlines():
        normalized_line = line.rstrip("\r")
        if not in_fence:
            opening_match = OPEN_FENCE_LINE_RE.match(normalized_line)
            if opening_match:
                in_fence = True
                opening_width = len(opening_match.group(1))
                info = opening_match.group(2).strip()
                language = info.split(maxsplit=1)[0].lower() if info else ""
                body_lines = []
            continue
        closing_match = CLOSE_FENCE_LINE_RE.match(normalized_line)
        if closing_match and len(closing_match.group(1)) >= opening_width:
            blocks.append((language, "\n".join(body_lines)))
            in_fence = False
            language = ""
            opening_width = 0
            body_lines = []
            continue
        body_lines.append(line)
    return blocks
def find_active_blocks(text: str) -> list[dict]:
    """Extract every fenced-code-block JSON object that is a real active SCEC
    block (invariant 11: quoted/example markers outside real JSON are never
    treated as active).
    """
    active: list[dict] = []
    for language, body in _iter_fenced_blocks(text):
        if language not in ("", "json"):
            continue
        try:
            candidate = json.loads(body)
        except (json.JSONDecodeError, ValueError):
            continue
        if is_active_block(candidate):
            active.append(candidate)
    return active
def sha256_of_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()
def _configure_stdout() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
def _normalize(path: str) -> str:
    return path.replace("\\", "/").strip()
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
def _changed_md_paths(base: str, head: str) -> tuple[str, ...]:
    paths: set[str] = set()
    if base and head:
        code, out, _ = _run_git(["diff", "--name-only", f"{base}..{head}"])
        if code == 0 and out:
            paths.update(_normalize(p) for p in out.splitlines() if p.strip())
    code, out, _ = _run_git(["diff", "--name-only"])
    if code == 0 and out:
        paths.update(_normalize(p) for p in out.splitlines() if p.strip())
    code, out, _ = _run_git(["diff", "--name-only", "--cached"])
    if code == 0 and out:
        paths.update(_normalize(p) for p in out.splitlines() if p.strip())
    code, out, _ = _run_git(["ls-files", "--others", "--exclude-standard"])
    if code == 0 and out:
        paths.update(_normalize(p) for p in out.splitlines() if p.strip())
    return tuple(sorted(p for p in paths if p.endswith(".md")))
def _working_tree_md_paths() -> tuple[str, ...]:
    paths: set[str] = set()
    for args in (
        ["diff", "--name-only"],
        ["diff", "--name-only", "--cached"],
        ["ls-files", "--others", "--exclude-standard"],
    ):
        code, out, _ = _run_git(args)
        if code == 0 and out:
            paths.update(_normalize(p) for p in out.splitlines() if p.strip())
    return tuple(sorted(p for p in paths if p.endswith(".md")))
def _read(path: str) -> str:
    full = REPO_ROOT / path
    if not full.exists() or full.is_dir():
        return ""
    return full.read_text(encoding="utf-8", errors="replace")
def _is_governed_work_order_or_return(path: str) -> bool:
    normalized = _normalize(path)
    if normalized == THIS_CHECKER_PATH:
        return False
    if "/archive/" in normalized:
        return False
    return (
        normalized.startswith("docs/work_orders/")
        or normalized.startswith("docs/baselines/")
        or normalized.startswith("docs/reviews/")
    ) and normalized.endswith(".md")
def _requires_scec_block(path: str) -> bool:
    """Forward adoption applies to work orders and worker returns."""
    normalized = _normalize(path)
    if normalized.startswith("docs/work_orders/") and normalized.endswith(".md"):
        return True
    return (
        normalized.startswith("docs/reviews/")
        and "_WORKER_RETURN_" in PurePosixPath(normalized).name
        and normalized.endswith(".md")
    )
def _activation_commit() -> str | None:
    code, out, _ = _run_git(["log", "--format=%H", "--diff-filter=A", "--", STANDARD_PATH])
    if code != 0 or not out:
        return None
    return out.splitlines()[0].strip() or None
def _range_change_is_at_or_after_activation(path: str, base: str, head: str) -> bool:
    activation = _activation_commit()
    if activation is None or not base or not head:
        return False
    code, out, _ = _run_git(["log", "-1", "--format=%H", f"{base}..{head}", "--", path])
    if code != 0 or not out:
        return False
    changed_commit = out.splitlines()[0].strip()
    code, _, _ = _run_git(["merge-base", "--is-ancestor", activation, changed_commit])
    return code == 0
def _repo_evidence_bytes_resolver(path: str) -> bytes | None:
    if not _is_safe_repo_relative_path(path):
        return None
    full = (REPO_ROOT / PurePosixPath(path)).resolve()
    try:
        full.relative_to(REPO_ROOT.resolve())
    except ValueError:
        return None
    if not full.is_file():
        return None
    try:
        return full.read_bytes()
    except OSError:
        return None
def _repo_predecessor_hash_resolver(path: str) -> str | None:
    content = _repo_evidence_bytes_resolver(path)
    if content is None:
        return None
    return hashlib.sha256(content).hexdigest()
def _repo_predecessor_block_resolver(path: str) -> tuple[dict, ...] | None:
    if not _is_safe_repo_relative_path(path):
        return None
    full = (REPO_ROOT / PurePosixPath(path)).resolve()
    try:
        full.relative_to(REPO_ROOT.resolve())
    except ValueError:
        return None
    if not full.is_file():
        return None
    try:
        text = full.read_text(encoding="utf-8", errors="strict")
    except (OSError, UnicodeError):
        return None
    return tuple(find_active_blocks(text))
@dataclass(frozen=True)
class FileDiagnostic:
    path: str
    block_count: int
    violations: tuple[tuple[int, BlockViolation], ...]
    @property
    def is_clean(self) -> bool:
        return not self.violations
def diagnose_file(path: str, text: str, *, require_block: bool = False) -> FileDiagnostic:
    blocks = find_active_blocks(text)
    violations: list[tuple[int, BlockViolation]] = []
    if require_block and not blocks:
        violations.append(
            (
                -1,
                BlockViolation(
                    "MISSING_REQUIRED_SCEC_BLOCK",
                    "new or changed governed work orders and worker returns must carry one active SCEC block",
                ),
            )
        )
    elif require_block and len(blocks) != 1:
        violations.append(
            (
                -1,
                BlockViolation(
                    "ACTIVE_SCEC_BLOCK_COUNT_INVALID",
                    f"new or changed governed work orders and worker returns must carry exactly one active SCEC block; found {len(blocks)}",
                ),
            )
        )
    for index, block in enumerate(blocks):
        result = validate_block(
            block,
            predecessor_hash_resolver=_repo_predecessor_hash_resolver,
            predecessor_block_resolver=_repo_predecessor_block_resolver,
            evidence_bytes_resolver=_repo_evidence_bytes_resolver,
        )
        for violation in result.violations:
            violations.append((index, violation))
    return FileDiagnostic(path=path, block_count=len(blocks), violations=tuple(violations))
def run(base: str, head: str) -> list[FileDiagnostic]:
    results: list[FileDiagnostic] = []
    working_paths = set(_working_tree_md_paths())
    for path in _changed_md_paths(base, head):
        if not _is_governed_work_order_or_return(path):
            continue
        text = _read(path)
        if not text:
            continue
        require_block = _requires_scec_block(path) and (
            path in working_paths or _range_change_is_at_or_after_activation(path, base, head)
        )
        diagnostic = diagnose_file(path, text, require_block=require_block)
        if diagnostic.block_count or diagnostic.violations:
            results.append(diagnostic)
    return results
def main(argv: list[str] | None = None) -> int:
    _configure_stdout()
    parser = argparse.ArgumentParser(
        description="CVF Semantic Convergence And Escalation Control fail-closed checker."
    )
    parser.add_argument("--base", default="HEAD")
    parser.add_argument("--head", default="HEAD")
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args(argv)
    print("=== CVF Semantic Convergence And Escalation Control Gate ===")
    print(f"Standard: {STANDARD_PATH}")
    diagnostics = run(args.base, args.head)
    files_with_blocks = len(diagnostics)
    total_blocks = sum(d.block_count for d in diagnostics)
    violating = [d for d in diagnostics if not d.is_clean]
    print(f"Changed governed artifacts with active SCEC blocks: {files_with_blocks}")
    print(f"Active SCEC blocks checked: {total_blocks}")
    if not violating:
        print(
            "PASS: every changed governed artifact's active SCEC block satisfies the "
            "declared-evidence-shape contract."
        )
        return 0
    print(f"Violations: {sum(len(d.violations) for d in violating)}")
    for diagnostic in violating:
        for block_index, violation in diagnostic.violations:
            print(f"  - {diagnostic.path} [block {block_index}] {violation.code}: {violation.message}")
    print(
        "\nVIOLATION - repair the SCEC block per "
        f"{STANDARD_PATH} before this artifact can progress."
    )
    return 1 if args.enforce else 0
if __name__ == "__main__":
    raise SystemExit(main())
