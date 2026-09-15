#!/usr/bin/env python3
"""Pure P4-C1 enrollment selection and journal-v2 projection helpers."""

from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass
from typing import Any, Iterable


JOURNAL_SCHEMA = "cvf.mfrp.p4c1.pendingJournal.v2"
STARVATION_ATTEMPT_THRESHOLD = 5

_WORKER_RETURN = re.compile(
    r"(?mi)^Self-declared worker-return artifact:\s*yes\s*$"
)
_COMPLETION_REVIEW = re.compile(r"(?mi)^docType:\s*completion_review\s*$")
_STATUS = re.compile(r"(?mi)^Status:\s*`?([^`\r\n]+?)`?\s*$")
_ADJUDICATION = re.compile(
    r"(?ms)^## Independent Reviewer Adjudication\s*$.*?"
    r"^Reviewer disposition:\s*`?([^`\r\n]+?)`?\.?\s*$"
)
_WORK_ORDER_PATH = re.compile(
    r"docs/work_orders/[A-Za-z0-9_./-]+\.md"
)
_TERMINAL_STATUS_MARKERS = (
    "ACCEPT", "BLOCK", "CLOSED", "FAIL", "PARK", "PASS", "REJECT", "RETURN",
)
_NON_TERMINAL_STATUS_MARKERS = (
    "COMPLETE_PENDING_REVIEW", "DISPATCH_READY", "DRAFT", "HOLD", "IN_PROGRESS",
    "PENDING", "READY_FOR_REVIEW",
)


@dataclass(frozen=True)
class EnrollmentCandidate:
    path: str
    trusted_outcome: str
    phase: str
    hard_obligation_locator: str
    hard_obligation_pattern: str
    source_authority_locator: str
    origin: str
    priority: int


@dataclass(frozen=True)
class SelectionResult:
    selected: EnrollmentCandidate | None
    candidate_count: int
    reason: str
    review_paths: tuple[str, ...]

    @property
    def eligible(self) -> bool:
        return self.selected is not None


def _terminal_completion_status(text: str) -> str | None:
    if not _COMPLETION_REVIEW.search(text):
        return None
    match = _STATUS.search(text)
    if not match:
        return None
    status = match.group(1).strip().upper()
    if any(marker in status for marker in _NON_TERMINAL_STATUS_MARKERS):
        return None
    if not any(marker in status for marker in _TERMINAL_STATUS_MARKERS):
        return None
    return match.group(1).strip()


def _adjudicated_outcome(text: str) -> str | None:
    match = _ADJUDICATION.search(text)
    return match.group(1).strip() if match else None


def trusted_outcome(text: str) -> str | None:
    """Return reviewer adjudication or a terminal completion-review status."""
    return _adjudicated_outcome(text) or _terminal_completion_status(text)


def _source_locator(path: str, text: str, declared: str | None) -> str:
    if declared and not declared.lower().startswith("n/a with reason"):
        return declared
    sources = tuple(dict.fromkeys(_WORK_ORDER_PATH.findall(text)))
    if sources:
        return ";".join(sources)
    return f"{path}#Source Verification Block"


def classify_candidate(
    path: str,
    text: str,
    *,
    eligibility: str | None = None,
    phase: str | None = None,
    hard_obligation_locator: str | None = None,
    hard_obligation_pattern: str | None = None,
    source_authority_locator: str | None = None,
    canonical_phases: Iterable[str] = (),
) -> EnrollmentCandidate | None:
    """Classify one immutable review blob without granting worker self-trust."""
    adjudicated = _adjudicated_outcome(text)
    completion = _terminal_completion_status(text)
    outcome = adjudicated or completion
    if not outcome:
        return None

    explicit_yes = (eligibility or "").strip().upper() == "YES"
    metadata_complete = (
        phase in set(canonical_phases)
        and bool(hard_obligation_locator)
        and bool(hard_obligation_pattern)
        and bool(source_authority_locator)
        and not any(
            (value or "").lower().startswith("n/a with reason")
            for value in (
                hard_obligation_locator,
                hard_obligation_pattern,
                source_authority_locator,
            )
        )
    )
    if explicit_yes and metadata_complete:
        origin, priority = "LEGACY_EXPLICIT_YES", 0
    elif completion:
        origin, priority = "COMPLETION_REVIEW", 1
    elif adjudicated and _WORKER_RETURN.search(text):
        origin, priority = "ADJUDICATED_WORKER_RETURN", 2
    else:
        return None

    locator = hard_obligation_locator or f"{path}#trusted-outcome"
    pattern = hard_obligation_pattern or (
        f"Reviewer disposition: {outcome}"
        if adjudicated
        else f"Status: {outcome}"
    )
    return EnrollmentCandidate(
        path=path,
        trusted_outcome=outcome,
        phase=phase if phase in set(canonical_phases) else "REVIEW",
        hard_obligation_locator=locator,
        hard_obligation_pattern=pattern,
        source_authority_locator=_source_locator(
            path, text, source_authority_locator
        ),
        origin=origin,
        priority=priority,
    )


def select_candidate(
    candidates: Iterable[EnrollmentCandidate], review_paths: Iterable[str] = ()
) -> SelectionResult:
    ordered = tuple(sorted(candidates, key=lambda item: (item.priority, item.path)))
    paths = tuple(sorted(review_paths))
    if not ordered:
        return SelectionResult(None, 0, "SKIPPED_NO_ELIGIBLE_CANDIDATE", paths)
    best_priority = ordered[0].priority
    best = tuple(item for item in ordered if item.priority == best_priority)
    if len(best) != 1:
        return SelectionResult(None, len(ordered), "SKIPPED_MULTIPLE_CANDIDATES", paths)
    return SelectionResult(best[0], len(ordered), "SELECTED", paths)


def normalize_journal(prior: dict[str, Any] | None) -> dict[str, Any]:
    prior = prior if isinstance(prior, dict) else {}
    journal = {
        "schema": JOURNAL_SCHEMA,
        "attempts": list(prior.get("attempts", [])),
        "rows": list(prior.get("rows", [])),
        "receiptReadoutEnvelopeByRow": dict(
            prior.get("receiptReadoutEnvelopeByRow", {})
        ),
        "collectorCommandEvidence": dict(
            prior.get("collectorCommandEvidence", {})
        ),
    }
    return recompute_counters(journal)


def attempt_id(disclosure_commit: str) -> str:
    digest = hashlib.sha256(disclosure_commit.encode("ascii", errors="replace")).hexdigest()
    return f"ATTEMPT-{digest[:16]}"


def make_attempt(
    disclosure_commit: str,
    trusted_commit: str,
    *,
    outcome: str,
    candidate_count: int,
    eligible: bool,
    review_paths: Iterable[str] = (),
    selected_path: str | None = None,
    detail: str = "",
    historical: bool = False,
) -> dict[str, Any]:
    return {
        "attemptId": attempt_id(disclosure_commit),
        "disclosureCommit": disclosure_commit,
        "trustedCommit": trusted_commit,
        "outcome": outcome,
        "candidateCount": candidate_count,
        "eligible": eligible,
        "reviewPaths": list(sorted(review_paths)),
        "selectedPath": selected_path,
        "detail": detail,
        "historicalDiagnostic": historical,
    }


def record_attempt(journal: dict[str, Any], attempt: dict[str, Any]) -> dict[str, Any]:
    normalized = normalize_journal(journal)
    attempts = list(normalized["attempts"])
    disclosure = str(attempt.get("disclosureCommit", ""))
    existing_index = next(
        (
            index
            for index, existing in enumerate(attempts)
            if existing.get("disclosureCommit") == disclosure
        ),
        None,
    )
    def outcome_rank(value: Any) -> int:
        outcome = str(value or "")
        if outcome == "COLLECTED":
            return 3
        if outcome.startswith("UNSAFE_"):
            return 2
        if outcome == "HISTORICAL_ELIGIBLE_NOT_COLLECTED":
            return 1
        return 0

    if existing_index is None:
        attempts.append(dict(attempt))
    elif outcome_rank(attempt.get("outcome")) >= outcome_rank(
        attempts[existing_index].get("outcome")
    ):
        attempts[existing_index] = dict(attempt)
    normalized["attempts"] = attempts
    return recompute_counters(normalized)


def recompute_counters(journal: dict[str, Any]) -> dict[str, Any]:
    attempts = list(journal.get("attempts", []))
    rows = list(journal.get("rows", []))
    collected = sum(1 for row in rows if not row.get("ineligibleClass"))
    journal["attemptCount"] = len(attempts)
    journal["candidateCount"] = sum(
        max(0, int(item.get("candidateCount", 0))) for item in attempts
    )
    journal["eligibleCount"] = sum(bool(item.get("eligible")) for item in attempts)
    journal["collectedCount"] = collected
    journal["populationCount"] = len(rows)
    if collected:
        health = "COLLECTING"
    elif journal["eligibleCount"]:
        health = "STARVED_ELIGIBLE_NOT_COLLECTED"
    elif journal["attemptCount"] >= STARVATION_ATTEMPT_THRESHOLD:
        health = "STARVED_NO_ELIGIBLE"
    else:
        health = "WARMUP"
    journal["measurementHealth"] = {
        "status": health,
        "starvationAttemptThreshold": STARVATION_ATTEMPT_THRESHOLD,
        "blocking": False,
    }
    return journal


__all__ = [name for name in globals() if not name.startswith("__")]
