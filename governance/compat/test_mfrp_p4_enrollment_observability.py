#!/usr/bin/env python3
"""Focused tests for deterministic P4 enrollment and journal-v2 projection."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import mfrp_p4_enrollment_observability as subject  # noqa: E402


PHASES = ("DISPATCH", "IMPLEMENTATION", "REVIEW", "CLOSURE")
WORK_ORDER = "docs/work_orders/CVF_AGENT_WORK_ORDER_EXAMPLE.md"


def completion(status: str = "CLOSED_PASS_BOUNDED") -> str:
    return (
        f"Status: {status}\n"
        "docType: completion_review\n"
        f"Source: `{WORK_ORDER}`\n"
    )


def worker(adjudicated: bool = True) -> str:
    text = (
        "Status: COMPLETE_PENDING_REVIEW\n"
        "Self-declared worker-return artifact: yes\n"
        f"Responds to work order: `{WORK_ORDER}`\n"
    )
    if adjudicated:
        text += (
            "## Independent Reviewer Adjudication\n"
            "Reviewer disposition: `REVIEWER_ACCEPTED_BOUNDED`\n"
        )
    return text


class CandidateClassificationTests(unittest.TestCase):
    def test_terminal_completion_is_automatic_candidate(self):
        candidate = subject.classify_candidate(
            "docs/reviews/completion.md", completion(), canonical_phases=PHASES
        )
        self.assertIsNotNone(candidate)
        self.assertEqual(candidate.origin, "COMPLETION_REVIEW")
        self.assertEqual(candidate.phase, "REVIEW")
        self.assertEqual(candidate.source_authority_locator, WORK_ORDER)

    def test_old_no_does_not_veto_completion(self):
        candidate = subject.classify_candidate(
            "docs/reviews/completion.md",
            completion(),
            eligibility="NO",
            canonical_phases=PHASES,
        )
        self.assertEqual(candidate.origin, "COMPLETION_REVIEW")

    def test_worker_readiness_without_adjudication_is_not_trusted(self):
        self.assertIsNone(
            subject.classify_candidate(
                "docs/reviews/return.md",
                worker(adjudicated=False),
                eligibility="AUTO",
                canonical_phases=PHASES,
            )
        )

    def test_adjudicated_worker_return_is_candidate(self):
        candidate = subject.classify_candidate(
            "docs/reviews/return.md", worker(), canonical_phases=PHASES
        )
        self.assertEqual(candidate.origin, "ADJUDICATED_WORKER_RETURN")

    def test_valid_legacy_yes_has_highest_priority(self):
        legacy = subject.classify_candidate(
            "docs/reviews/legacy.md",
            worker(),
            eligibility="YES",
            phase="REVIEW",
            hard_obligation_locator="legacy locator",
            hard_obligation_pattern="legacy pattern",
            source_authority_locator="legacy#source",
            canonical_phases=PHASES,
        )
        automatic = subject.classify_candidate(
            "docs/reviews/completion.md", completion(), canonical_phases=PHASES
        )
        result = subject.select_candidate((automatic, legacy))
        self.assertEqual(result.selected.path, "docs/reviews/legacy.md")
        self.assertEqual(result.candidate_count, 2)

    def test_same_priority_ambiguity_fails_closed(self):
        first = subject.classify_candidate(
            "docs/reviews/a.md", completion(), canonical_phases=PHASES
        )
        second = subject.classify_candidate(
            "docs/reviews/b.md", completion(), canonical_phases=PHASES
        )
        result = subject.select_candidate((first, second))
        self.assertIsNone(result.selected)
        self.assertEqual(result.reason, "SKIPPED_MULTIPLE_CANDIDATES")


class JournalProjectionTests(unittest.TestCase):
    def test_v1_rows_migrate_without_loss(self):
        prior = {
            "schema": "cvf.mfrp.p4c1.pendingJournal.v1",
            "rows": [{"rowId": "OBS-1", "ineligibleClass": None}],
            "receiptReadoutEnvelopeByRow": {"OBS-1": {"limitations": []}},
        }
        result = subject.normalize_journal(prior)
        self.assertEqual(result["schema"], subject.JOURNAL_SCHEMA)
        self.assertEqual(result["rows"], prior["rows"])
        self.assertEqual(result["collectedCount"], 1)

    def test_attempt_recording_is_idempotent(self):
        attempt = subject.make_attempt(
            "a" * 40,
            "b" * 40,
            outcome="SKIPPED_NO_ELIGIBLE_CANDIDATE",
            candidate_count=0,
            eligible=False,
        )
        once = subject.record_attempt({}, attempt)
        twice = subject.record_attempt(once, attempt)
        self.assertEqual(twice["attemptCount"], 1)

    def test_collected_outcome_cannot_be_downgraded(self):
        collected = subject.make_attempt(
            "a" * 40,
            "b" * 40,
            outcome="COLLECTED",
            candidate_count=1,
            eligible=True,
        )
        skipped = dict(collected, outcome="SKIPPED_DUPLICATE_OR_REBOUND")
        result = subject.record_attempt(subject.record_attempt({}, collected), skipped)
        self.assertEqual(result["attempts"][0]["outcome"], "COLLECTED")

    def test_unsafe_cause_survives_safety_marker_retry(self):
        unsafe = subject.make_attempt(
            "a" * 40,
            "b" * 40,
            outcome="UNSAFE_FINGERPRINT_MISMATCH",
            candidate_count=1,
            eligible=True,
            detail="original cause",
        )
        marker_skip = dict(
            unsafe,
            outcome="SKIPPED_SAFETY_MARKER_ALREADY_PRESENT",
            detail="",
        )
        result = subject.record_attempt(subject.record_attempt({}, unsafe), marker_skip)
        self.assertEqual(
            result["attempts"][0]["outcome"], "UNSAFE_FINGERPRINT_MISMATCH"
        )
        self.assertEqual(result["attempts"][0]["detail"], "original cause")

    def test_zero_collection_starvation_is_visible_and_nonblocking(self):
        journal = {}
        for index in range(subject.STARVATION_ATTEMPT_THRESHOLD):
            journal = subject.record_attempt(
                journal,
                subject.make_attempt(
                    f"{index:040x}",
                    "b" * 40,
                    outcome="SKIPPED_NO_ELIGIBLE_CANDIDATE",
                    candidate_count=0,
                    eligible=False,
                    historical=True,
                ),
            )
        self.assertEqual(
            journal["measurementHealth"]["status"], "STARVED_NO_ELIGIBLE"
        )
        self.assertFalse(journal["measurementHealth"]["blocking"])

    def test_opportunity_and_collection_counts_are_separate(self):
        journal = subject.record_attempt(
            {},
            subject.make_attempt(
                "a" * 40,
                "b" * 40,
                outcome="HISTORICAL_ELIGIBLE_NOT_COLLECTED",
                candidate_count=1,
                eligible=True,
                historical=True,
            ),
        )
        self.assertEqual(journal["candidateCount"], 1)
        self.assertEqual(journal["eligibleCount"], 1)
        self.assertEqual(journal["collectedCount"], 0)
        self.assertEqual(
            journal["measurementHealth"]["status"],
            "STARVED_ELIGIBLE_NOT_COLLECTED",
        )


if __name__ == "__main__":
    unittest.main()
